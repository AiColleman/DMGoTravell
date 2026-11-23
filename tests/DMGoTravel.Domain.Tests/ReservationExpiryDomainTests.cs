using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Reservations;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class ReservationExpiryDomainTests
{
    private static Reservation CreatePending(DateTime createdAtUtc)
    {
        var snapshot = new ReservationOfferSnapshot(
            "tour",
            "Tour Paracas",
            createdAtUtc.AddDays(5),
            createdAtUtc.AddDays(5).AddHours(8),
            2,
            Money.Create(120m));

        return Reservation.Create(
            "R-00001234",
            accountId: 10,
            departureId: 20,
            offerId: 30,
            snapshot,
            lodgingSnapshot: null,
            new[] { ReservationHold.CreateForTour(20, 2) },
            createdAtUtc);
    }

    [Fact(DisplayName = "Vencimiento: 15 min sin pago y 20 min con pago en curso")]
    public void IsExpiredAt_ShouldRespect15And20MinuteDeadlines()
    {
        var created = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var reservation = CreatePending(created);

        reservation.IsExpiredAt(created.AddMinutes(14).AddSeconds(59), hasTimelyPaymentInProgress: false).Should().BeFalse();
        reservation.IsExpiredAt(created.AddMinutes(15), hasTimelyPaymentInProgress: false).Should().BeTrue();

        reservation.IsExpiredAt(created.AddMinutes(15), hasTimelyPaymentInProgress: true).Should().BeFalse();
        reservation.IsExpiredAt(created.AddMinutes(19).AddSeconds(59), hasTimelyPaymentInProgress: true).Should().BeFalse();
        reservation.IsExpiredAt(created.AddMinutes(20), hasTimelyPaymentInProgress: true).Should().BeTrue();
    }

    [Fact(DisplayName = "Vencimiento: no permite confirmar pago al alcanzar el límite de 20 minutos")]
    public void ConfirmPayment_AtOrAfterValidationDeadline_ShouldThrow()
    {
        var created = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var reservation = CreatePending(created);

        var act = () => reservation.ConfirmPayment(created.AddMinutes(20));
        act.Should().Throw<DomainException>();
        reservation.Status.Should().Be(ReservationStatus.Pending);
    }

    [Fact(DisplayName = "Vencimiento: cancelación por vencimiento es idempotente y no altera confirmadas")]
    public void TryCancelByExpiry_ShouldBeIdempotentAndIgnoreConfirmed()
    {
        var created = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var pending = CreatePending(created);

        pending.TryCancelByExpiry(created.AddMinutes(15)).Should().BeTrue();
        pending.Status.Should().Be(ReservationStatus.Cancelled);
        pending.CancellationOrigin.Should().Be(CancellationOrigin.Expiry);
        pending.Holds.Should().OnlyContain(h => !h.IsHeld && h.State == "released");
        var firstReleasedAt = pending.Holds.Single().ReleasedAtUtc;

        pending.TryCancelByExpiry(created.AddMinutes(16)).Should().BeFalse();
        pending.Holds.Single().ReleasedAtUtc.Should().Be(firstReleasedAt);

        var confirmed = CreatePending(created);
        confirmed.ConfirmPayment(created.AddMinutes(5));
        confirmed.TryCancelByExpiry(created.AddMinutes(25)).Should().BeFalse();
        confirmed.Status.Should().Be(ReservationStatus.Confirmed);
    }
}
