using System.Net;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Integrations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica 001/RF-86 y 002/RF-18/RF-19: un rechazo definitivo dentro de la
/// tolerancia cancela y libera de inmediato; antes de los 15 minutos solo
/// rechaza el intento y conserva la reserva pendiente.
/// </summary>
[Collection("Integration")]
public sealed class ReservationPaymentRejectionTests : ApiTestBase
{
    public ReservationPaymentRejectionTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Rechazo en tolerancia: cancela, libera una vez y audita origen paymentreject")]
    public async Task Rejection_WithinTolerance_ShouldCancelReleaseOnceAndAudit()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var reservationNumber = json.GetProperty("reservationNumber").GetString()!;

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 2);

        var paymentDeadline = DateTime.UtcNow.AddMinutes(-2);
        var validationDeadline = DateTime.UtcNow.AddMinutes(3);
        await SetDeadlinesAsync(reservationId, paymentDeadline, validationDeadline);

        var providerRef = $"culqi_chg_{Guid.NewGuid():N}";
        await SeedPaymentAttemptAsync(reservationId, providerRef, paymentDeadline.AddMinutes(-5));
        var eventId = $"evt_reject_{Guid.NewGuid():N}";

        var response = await SendCulqiWebhookAsync("payment.failed", providerRef, eventId, "tarjeta_rechazada");
        response.GetProperty("duplicate").GetBoolean().Should().BeFalse();

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            reservation.Status.Should().Be(ReservationStatus.Cancelled);
            reservation.CancellationOrigin.Should().Be(CancellationOrigin.PaymentReject);
            reservation.CancelledAtUtc.Should().NotBeNull();

            var attempt = await db.PaymentAttempts.AsNoTracking()
                .SingleAsync(p => p.ProviderRequestRef == providerRef, Ct);
            attempt.Status.Should().Be(PaymentStatus.Rejected);

            var audits = await db.AuditLogs.AsNoTracking()
                .Where(a => a.EntityId == reservationId.ToString() &&
                            a.Action == AuditActions.ReservationAutoCancelled)
                .ToListAsync(Ct);
            audits.Should().ContainSingle();
            audits[0].ActorType.Should().Be(AuditActions.ActorSystem);
            audits[0].ChangesJson.Should()
                .Contain("paymentreject")
                .And.Contain("validation_deadline")
                .And.Contain("releasedSeats")
                .And.Contain(reservationNumber);
        }

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

        // Repetir el mismo evento no vuelve a liberar ni duplica auditoría.
        var duplicate = await SendCulqiWebhookAsync("payment.failed", providerRef, eventId, "tarjeta_rechazada");
        duplicate.GetProperty("duplicate").GetBoolean().Should().BeTrue();
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var auditCount = await db.AuditLogs.AsNoTracking()
                .CountAsync(a => a.EntityId == reservationId.ToString() &&
                                 a.Action == AuditActions.ReservationAutoCancelled, Ct);
            auditCount.Should().Be(1);
        }
    }

    [Fact(DisplayName = "Rechazo antes de los 15 min: mantiene pending y permite reintentar")]
    public async Task Rejection_BeforePaymentDeadline_ShouldKeepReservationPending()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservationId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        var providerRef = $"culqi_chg_{Guid.NewGuid():N}";
        await SeedPaymentAttemptAsync(reservationId, providerRef, DateTime.UtcNow.AddMinutes(-1));

        var response = await SendCulqiWebhookAsync("payment.failed", providerRef, $"evt_reject_{Guid.NewGuid():N}", "fondos_insuficientes");
        response.ValueKind.Should().Be(JsonValueKind.Object);

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            reservation.Status.Should().Be(ReservationStatus.Pending);
            reservation.CancellationOrigin.Should().BeNull();

            var attempt = await db.PaymentAttempts.AsNoTracking()
                .SingleAsync(p => p.ProviderRequestRef == providerRef, Ct);
            attempt.Status.Should().Be(PaymentStatus.Rejected);

            var cancellations = await db.AuditLogs.AsNoTracking()
                .CountAsync(a => a.EntityId == reservationId.ToString() &&
                                 a.Action == AuditActions.ReservationAutoCancelled, Ct);
            cancellations.Should().Be(0);
        }

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 1);

        // La ventana sigue abierta: un nuevo intento es aceptado y confirma.
        var retry = await StartPaymentAsync(user.AccessToken, reservationId, "card");
        retry.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 1);
    }

    private async Task<JsonElement> SendCulqiWebhookAsync(
        string eventType,
        string reference,
        string eventId,
        string? rejectionReason)
    {
        var payload = JsonSerializer.Serialize(new
        {
            id = eventId,
            type = eventType,
            data = new
            {
                reference,
                currency = "PEN",
                reason = rejectionReason
            }
        });

        var secret = Factory.Services
            .GetRequiredService<IOptions<ExternalProviderOptions>>()
            .Value.CulqiWebhookSecret;
        var signature = HmacWebhookSignatureVerifier.ComputeHexHmac(secret, payload);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/culqi")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("X-Provider-Signature", signature);

        var response = await Client.SendAsync(request, Ct);
        var body = await response.Content.ReadAsStringAsync(Ct);
        if (response.StatusCode != HttpStatusCode.OK)
        {
            throw new InvalidOperationException(
                $"Webhook Culqi falló con {(int)response.StatusCode}: {body}");
        }

        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private async Task SetDeadlinesAsync(
        Guid reservationId,
        DateTime paymentDeadlineUtc,
        DateTime validationDeadlineUtc)
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

    private async Task SeedPaymentAttemptAsync(
        Guid reservationId,
        string providerRef,
        DateTime createdAtUtc)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var reservation = await db.Reservations.AsNoTracking()
            .SingleAsync(r => r.PublicId == reservationId, Ct);

        var attempt = new PaymentAttempt(reservation.Id, reservation.AccountId, PaymentMethod.Card, reservation.Total);
        attempt.MarkSent(providerRef);
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
}
