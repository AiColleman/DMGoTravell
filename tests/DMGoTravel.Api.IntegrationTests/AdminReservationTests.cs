using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Spec 009 (Consulta y operación administrativa de reservas) contra
/// PostgreSQL real: permisos admin, filtros, cancelación administrativa de
/// confirmadas con liberación única y auditoría, bloqueo sobre pending y
/// finalización post-servicio.
/// </summary>
[Collection("Integration")]
public sealed class AdminReservationTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminReservationTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Admin reservas: exige autenticación y rol administrador")]
    public async Task List_ShouldRequireAdminRole()
    {
        var anonymous = await Client.GetAsync("/api/v1/admin/reservations", Ct);
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = await RegisterVerifiedUserAsync();
        var forbidden = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/admin/reservations", client.AccessToken);
        forbidden.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var adminToken = await CreateAdminTokenAsync();
        var ok = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/admin/reservations", adminToken);
        ok.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(DisplayName = "Admin reservas: cancela confirmada antes del inicio, libera cupos una vez y rechaza pending")]
    public async Task AdminCancel_ShouldCancelConfirmedReleaseSeatsAndRejectPending()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (offerId, departureId) = await GetTourAsync();
        var seatsInitial = await GetAvailableSeatsAsync(departureId);

        // 1) Reserva pending: admin NO puede cancelarla (009/RF-9)
        var pendingResp = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        pendingResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var pendingJson = await ReadJsonAsync(pendingResp);
        var pendingId = pendingJson.GetProperty("id").GetGuid();
        var pendingVersion = pendingJson.GetProperty("version").GetInt64();

        var cancelPending = await AdminCancelAsync(adminToken, pendingId, "No permitido", pendingVersion);
        cancelPending.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(cancelPending)).GetProperty("code").GetString().Should().Be("transition_not_allowed");

        // 2) Reserva confirmed: admin la consulta, filtra y cancela antes del inicio
        var resResp = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        resResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var resId = (await ReadJsonAsync(resResp)).GetProperty("id").GetGuid();

        var pay = await StartPaymentAsync(user.AccessToken, resId, "card");
        pay.StatusCode.Should().Be(HttpStatusCode.Created);

        var list = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/reservations?status=confirmed&tourId={offerId}&clientEmail={Uri.EscapeDataString(user.Email)}",
            adminToken);
        list.StatusCode.Should().Be(HttpStatusCode.OK);
        var listJson = await ReadJsonAsync(list);
        listJson.GetProperty("total").GetInt32().Should().Be(1);
        listJson.GetProperty("items")[0].GetProperty("id").GetGuid().Should().Be(resId);

        var detail = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reservations/{resId}", adminToken);
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        detail.Headers.ETag.Should().NotBeNull();
        var confirmedVersion = (await ReadJsonAsync(detail)).GetProperty("version").GetInt64();

        var seatsBeforeAdminCancel = await GetAvailableSeatsAsync(departureId);
        var key = Guid.NewGuid().ToString("N");
        var cancelConfirmed = await AdminCancelAsync(
            adminToken,
            resId,
            "Cancelación operativa autorizada",
            confirmedVersion,
            idempotencyKey: key);
        cancelConfirmed.StatusCode.Should().Be(HttpStatusCode.OK);
        var cancelledJson = await ReadJsonAsync(cancelConfirmed);
        cancelledJson.GetProperty("status").GetString().Should().Be("cancelled");
        cancelledJson.GetProperty("cancellationReason").GetString().Should().Be("Cancelación operativa autorizada");

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBeforeAdminCancel + 2);

        // Replay idempotente no libera nuevamente ni duplica auditoría (009/RF-13)
        var replay = await AdminCancelAsync(
            adminToken,
            resId,
            "Cancelación operativa autorizada",
            confirmedVersion,
            idempotencyKey: key);
        replay.StatusCode.Should().Be(HttpStatusCode.OK);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBeforeAdminCancel + 2);

        var audit = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=reservation&entity={resId}&action={AuditActions.AdminReservationCancel}",
            adminToken);
        audit.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditJson = await ReadJsonAsync(audit);
        auditJson.GetProperty("total").GetInt32().Should().Be(1);
        auditJson.GetProperty("items")[0].GetProperty("summary").GetString().Should()
            .Contain("Cancelación administrativa de reserva")
            .And.Contain("devolución total requerida")
            .And.Contain("cupos liberados 2");

        // Limpiamos la reserva pending para dejar cupos consistentes
        await CancelReservationAsync(user.AccessToken, pendingId, pendingVersion);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsInitial);
    }

    [Fact(DisplayName = "Admin reservas: completa confirmada solo después de finalizar el servicio")]
    public async Task AdminComplete_ShouldRejectBeforeEndAndSucceedAfterEnd()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var resId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        var pay = await StartPaymentAsync(user.AccessToken, resId, "yape");
        pay.StatusCode.Should().Be(HttpStatusCode.Created);

        var detail = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reservations/{resId}", adminToken);
        var version = (await ReadJsonAsync(detail)).GetProperty("version").GetInt64();

        // Antes del fin del servicio: debe rechazarse (009/RF-7)
        var tooEarly = await AdminCompleteAsync(adminToken, resId, version);
        tooEarly.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(tooEarly)).GetProperty("code").GetString().Should().Be("transition_not_allowed");

        // Simulamos que el servicio ya finalizó en el snapshot histórico
        await MoveSnapshotToPastAsync(resId);

        var completed = await AdminCompleteAsync(adminToken, resId, version);
        completed.StatusCode.Should().Be(HttpStatusCode.OK);
        var completedJson = await ReadJsonAsync(completed);
        completedJson.GetProperty("status").GetString().Should().Be("completed");
        var completedVersion = completedJson.GetProperty("version").GetInt64();

        // Estado terminal: no se puede cancelar después de completar (009/RF-10)
        var cancelCompleted = await AdminCancelAsync(adminToken, resId, "Tarde", completedVersion);
        cancelCompleted.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(cancelCompleted)).GetProperty("code").GetString().Should().Be("transition_not_allowed");

        var audit = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=reservation&entity={resId}&action={AuditActions.AdminReservationComplete}",
            adminToken);
        audit.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditJson = await ReadJsonAsync(audit);
        auditJson.GetProperty("total").GetInt32().Should().Be(1);
        auditJson.GetProperty("items")[0].GetProperty("summary").GetString().Should()
            .Contain("Finalización administrativa de reserva")
            .And.Contain("estado completed");
    }

    private async Task<HttpResponseMessage> AdminCancelAsync(
        string adminToken,
        Guid reservationId,
        string reason,
        long version,
        string? idempotencyKey = null)
    {
        var req = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/reservations/{reservationId}/cancel", adminToken);
        req.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        req.Content = JsonContent.Create(new { reason, version }, options: JsonOptions);
        return await Client.SendAsync(req, Ct);
    }

    private async Task<HttpResponseMessage> AdminCompleteAsync(
        string adminToken,
        Guid reservationId,
        long version,
        string? idempotencyKey = null)
    {
        var req = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/reservations/{reservationId}/complete", adminToken);
        req.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        req.Content = JsonContent.Create(new { version }, options: JsonOptions);
        return await Client.SendAsync(req, Ct);
    }

    private async Task MoveSnapshotToPastAsync(Guid reservationId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var start = DateTime.UtcNow.AddHours(-10);
        var end = DateTime.UtcNow.AddHours(-2);

        await db.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE reservation_offer_snapshot s
            SET "DepartureStartsAtUtc" = {start},
                "DepartureEndsAtUtc" = {end}
            FROM reservation r
            WHERE s."ReservationId" = r."Id"
              AND r."PublicId" = {reservationId}
            """, Ct);
    }

    private async Task<int> GetAvailableSeatsAsync(Guid departureId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.TourDepartures.AsNoTracking()
            .Where(d => d.PublicId == departureId)
            .Select(d => d.AvailableCapacity)
            .SingleAsync(Ct);
    }

    private async Task<string> CreateAdminTokenAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador reservas"));
            await db.SaveChangesAsync(Ct);
        }

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await ReadJsonAsync(login)).GetProperty("accessToken").GetString()!;
    }
}
