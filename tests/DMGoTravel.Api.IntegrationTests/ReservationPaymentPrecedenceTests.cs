using System.Net;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
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
/// Verifica 001/RF-75/RF-94-RF-96 y 002/RF-26: la primera operación registrada
/// gana. Un pago en verificación bloquea la cancelación voluntaria y una
/// cancelación aceptada bloquea el inicio de pago posterior; un cobro tardío
/// conserva la reserva cancelada y abre devolución.
/// </summary>
[Collection("Integration")]
public sealed class ReservationPaymentPrecedenceTests : ApiTestBase
{
    public ReservationPaymentPrecedenceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Precedencia: pago en verificación impide la cancelación voluntaria")]
    public async Task Cancel_WhilePaymentInProgress_ShouldBeRejected()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var version = json.GetProperty("version").GetInt64();

        var providerRef = $"culqi_chg_{Guid.NewGuid():N}";
        await SeedPaymentAttemptAsync(reservationId, providerRef);

        var cancel = await CancelReservationAsync(user.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(cancel)).GetProperty("code").GetString().Should().Be("payment_in_progress");

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            reservation.Status.Should().Be(ReservationStatus.Pending);
            reservation.CancellationOrigin.Should().BeNull();
        }

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 1);

        // El intento sigue siendo válido y puede confirmarse con su webhook.
        var webhook = await SendCulqiSucceededAsync(providerRef, $"evt_ok_{Guid.NewGuid():N}");
        webhook.GetProperty("received").GetBoolean().Should().BeTrue();

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            reservation.Status.Should().Be(ReservationStatus.Confirmed);
        }
    }

    [Fact(DisplayName = "Precedencia: cancelación aceptada impide iniciar un pago posterior")]
    public async Task Cancel_First_ShouldBlockLaterPaymentStart()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var version = json.GetProperty("version").GetInt64();

        var cancel = await CancelReservationAsync(user.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(cancel)).GetProperty("status").GetString().Should().Be("cancelled");

        var payment = await StartPaymentAsync(user.AccessToken, reservationId, "card");
        payment.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(payment)).GetProperty("code").GetString().Should().Be("payment_not_payable");

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            var attempts = await db.PaymentAttempts.AsNoTracking()
                .CountAsync(p => p.ReservationId == reservation.Id, Ct);
            attempts.Should().Be(0);
        }
    }

    [Fact(DisplayName = "Precedencia: cobro tardío tras cancelación conserva cancelled y abre devolución")]
    public async Task LateCharge_AfterCancellation_ShouldKeepCancelledAndOpenRefund()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var version = json.GetProperty("version").GetInt64();

        var cancel = await CancelReservationAsync(user.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);

        // Simula un cobro iniciado antes de la cancelación pero validado después.
        var providerRef = $"culqi_chg_{Guid.NewGuid():N}";
        await SeedPaymentAttemptAsync(reservationId, providerRef);

        var webhook = await SendCulqiSucceededAsync(providerRef, $"evt_late_{Guid.NewGuid():N}");
        webhook.GetProperty("received").GetBoolean().Should().BeTrue();

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);
            reservation.Status.Should().Be(ReservationStatus.Cancelled);
            reservation.CancellationOrigin.Should().Be(CancellationOrigin.Client);

            var refund = await db.RefundCases.AsNoTracking()
                .SingleAsync(r => r.ReservationId == reservation.Id, Ct);
            refund.Status.Should().Be(RefundCase.StatusOpen);

            var external = await db.ExternalPayments.AsNoTracking()
                .SingleAsync(e => e.ProviderTransactionId == providerRef, Ct);
            external.Status.Should().Be("approved");
        }
    }

    [Fact(DisplayName = "Precedencia concurrente: cancelación e inicio de pago dejan un solo ganador")]
    public async Task Concurrent_CancelAndPayment_ShouldHaveSingleWinner()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var seatsBefore = await GetAvailableSeatsAsync(departureId);

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        var json = await ReadJsonAsync(created);
        var reservationId = json.GetProperty("id").GetGuid();
        var version = json.GetProperty("version").GetInt64();

        var cancelTask = CancelReservationAsync(user.AccessToken, reservationId, version);
        var paymentTask = StartPaymentAsync(user.AccessToken, reservationId, "card");
        await Task.WhenAll(cancelTask, paymentTask);

        var cancel = await cancelTask;
        var payment = await paymentTask;
        var successes = (cancel.IsSuccessStatusCode ? 1 : 0) + (payment.IsSuccessStatusCode ? 1 : 0);
        successes.Should().Be(1, "la primera operación registrada debe ganar (001/RF-94)");

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var reservation = await db.Reservations.AsNoTracking()
                .SingleAsync(r => r.PublicId == reservationId, Ct);

            if (cancel.IsSuccessStatusCode)
            {
                payment.StatusCode.Should().Be(HttpStatusCode.Conflict);
                reservation.Status.Should().Be(ReservationStatus.Cancelled);
                (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore);

                var approved = await db.PaymentAttempts.AsNoTracking()
                    .CountAsync(p => p.ReservationId == reservation.Id &&
                                     p.Status == PaymentStatus.Approved, Ct);
                approved.Should().Be(0);
            }
            else
            {
                cancel.StatusCode.Should().Be(HttpStatusCode.Conflict);
                reservation.Status.Should().Be(ReservationStatus.Confirmed);
                (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBefore - 1);

                var approved = await db.PaymentAttempts.AsNoTracking()
                    .CountAsync(p => p.ReservationId == reservation.Id &&
                                     p.Status == PaymentStatus.Approved, Ct);
                approved.Should().Be(1);
            }
        }
    }

    private async Task SeedPaymentAttemptAsync(Guid reservationId, string providerRef)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var reservation = await db.Reservations.AsNoTracking()
            .SingleAsync(r => r.PublicId == reservationId, Ct);

        var attempt = new PaymentAttempt(reservation.Id, reservation.AccountId, PaymentMethod.Card, reservation.Total);
        attempt.MarkSent(providerRef);
        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(Ct);
    }

    private async Task<JsonElement> SendCulqiSucceededAsync(string reference, string eventId)
    {
        var payload = JsonSerializer.Serialize(new
        {
            id = eventId,
            type = "payment.succeeded",
            data = new
            {
                reference,
                currency = "PEN"
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
