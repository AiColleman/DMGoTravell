using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Reservations.ExpireReservations;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Spec 003 (Vencimiento y liberación automática) contra PostgreSQL real:
/// cancelación a 15 min sin pago, tolerancia hasta 20 min con pago en curso,
/// liberación única de cupos, idempotencia y acción exacta <c>reservation.auto_cancelled</c>.
/// </summary>
[Collection("Integration")]
public sealed class ReservationExpiryTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public ReservationExpiryTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Vencimiento: cancela a 15 min sin pago, libera cupos una vez y audita reservation.auto_cancelled")]
    public async Task Expiry_WithoutPayment_ShouldCancelReleaseOnceAndAuditSystemAction()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var reservationNumber = json.GetProperty("reservationNumber").GetString()!;

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 2);

        // Simulamos que venció el plazo de 15 minutos
        await SetDeadlinesAsync(reservationId, DateTime.UtcNow.AddMinutes(-2), DateTime.UtcNow.AddMinutes(3));

        var firstRun = await RunExpiryProcessorAsync();
        firstRun.Cancelled.Should().BeGreaterThanOrEqualTo(1);

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

        var getReservation = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/reservations/{reservationId}",
            user.AccessToken);
        getReservation.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(getReservation)).GetProperty("status").GetString().Should().Be("cancelled");

        // Re-ejecución es idempotente: no libera de nuevo ni duplica auditoría (003/RF-7, RF-9)
        var secondRun = await RunExpiryProcessorAsync();
        secondRun.Cancelled.Should().Be(0);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

        var auditResponse = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=reservation&entity={reservationId}&action={AuditActions.ReservationAutoCancelled}",
            adminToken);
        auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditJson = await ReadJsonAsync(auditResponse);
        auditJson.GetProperty("total").GetInt32().Should().Be(1);
        var item = auditJson.GetProperty("items")[0];
        item.GetProperty("actor").GetString().Should().Be("system");
        item.GetProperty("action").GetString().Should().Be("reservation.auto_cancelled");
        item.GetProperty("result").GetString().Should().Be("success");
        item.GetProperty("summary").GetString().Should()
            .Contain("Cancelación automática por vencimiento")
            .And.Contain(reservationNumber)
            .And.Contain("cupos liberados 2")
            .And.Contain("límite de pago vencido");
    }

    [Fact(DisplayName = "Vencimiento: respeta tolerancia hasta 20 min con pago en curso y cancela al vencer")]
    public async Task Expiry_WithTimelyPaymentInProgress_ShouldWaitUntil20Minutes()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservationId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        var paymentDeadline = DateTime.UtcNow.AddMinutes(-2);
        var validationDeadline = DateTime.UtcNow.AddMinutes(3);
        await SetDeadlinesAsync(reservationId, paymentDeadline, validationDeadline);

        // Insertamos intento de pago iniciado a tiempo (antes de paymentDeadline) aún en verificación
        await SeedInProgressPaymentAsync(reservationId, paymentDeadline.AddMinutes(-5));

        // Entre 15 y 20 min: debe omitirse (003/RF-3)
        var withinTolerance = await RunExpiryProcessorAsync();
        withinTolerance.Cancelled.Should().Be(0);
        withinTolerance.Skipped.Should().BeGreaterThanOrEqualTo(1);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 1);

        // Al vencer el límite de 20 min: debe cancelarse y liberar cupo (003/RF-4)
        await SetDeadlinesAsync(reservationId, DateTime.UtcNow.AddMinutes(-6), DateTime.UtcNow.AddMinutes(-1));
        var afterTolerance = await RunExpiryProcessorAsync();
        afterTolerance.Cancelled.Should().BeGreaterThanOrEqualTo(1);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

        var auditResponse = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=reservation&entity={reservationId}&action={AuditActions.ReservationAutoCancelled}",
            adminToken);
        auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditJson = await ReadJsonAsync(auditResponse);
        auditJson.GetProperty("total").GetInt32().Should().Be(1);
        auditJson.GetProperty("items")[0].GetProperty("summary").GetString().Should()
            .Contain("límite de validación vencido");
    }

    [Fact(DisplayName = "Vencimiento: corte a commit completo en 60 s o menos con el worker real")]
    public async Task Expiry_Worker_ShouldCommitWithin60Seconds()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservationId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        // El corte ya ocurrió: el worker hospedado debe recogerlo en su siguiente ciclo.
        var cutoff = DateTime.UtcNow.AddSeconds(-2);
        await SetDeadlinesAsync(reservationId, cutoff, DateTime.UtcNow.AddMinutes(5));

        Reservation? current = null;
        var timeoutAt = cutoff.AddSeconds(60);
        while (DateTime.UtcNow < timeoutAt)
        {
            using (var scope = Factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                current = await db.Reservations.AsNoTracking()
                    .SingleAsync(r => r.PublicId == reservationId, Ct);
            }

            if (current.Status == ReservationStatus.Cancelled)
            {
                break;
            }

            await Task.Delay(500, Ct);
        }

        current.Should().NotBeNull();
        current!.Status.Should().Be(ReservationStatus.Cancelled);
        current.CancellationOrigin.Should().Be(CancellationOrigin.Expiry);
        (DateTime.UtcNow - cutoff).Should().BeLessThanOrEqualTo(TimeSpan.FromSeconds(60));
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);
    }

    private async Task<ExpiryBatchResult> RunExpiryProcessorAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        return await mediator.Send(new ProcessExpiredReservationsCommand(), Ct);
    }

    private async Task SetDeadlinesAsync(Guid reservationId, DateTime paymentDeadlineUtc, DateTime validationDeadlineUtc)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE reservation
            SET "PaymentDeadlineAtUtc" = {paymentDeadlineUtc},
                "ValidationDeadlineAtUtc" = {validationDeadlineUtc}
            WHERE "PublicId" = {reservationId}
            """, Ct);
    }

    private async Task SeedInProgressPaymentAsync(Guid reservationId, DateTime createdAtUtc)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var reservation = await db.Reservations.AsNoTracking()
            .SingleAsync(r => r.PublicId == reservationId, Ct);

        var attempt = new PaymentAttempt(reservation.Id, reservation.AccountId, PaymentMethod.Card, reservation.Total);
        attempt.MarkSent($"sim_pending_{Guid.NewGuid():N}");
        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(Ct);

        await db.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE payment_attempt
            SET "CreatedAtUtc" = {createdAtUtc}
            WHERE "Id" = {attempt.Id}
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
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador vencimiento"));
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
