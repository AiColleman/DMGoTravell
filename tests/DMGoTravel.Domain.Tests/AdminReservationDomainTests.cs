using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Reservations;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class AdminReservationDomainTests
{
    private static Reservation CreateReservation(DateTime createdAtUtc, DateTime startsAtUtc, DateTime endsAtUtc)
    {
        var snapshot = new ReservationOfferSnapshot(
            "tour",
            "Tour Valle Sagrado",
            startsAtUtc,
            endsAtUtc,
            2,
            Money.Create(150m));

        return Reservation.Create(
            "R-00009001",
            accountId: 1,
            departureId: 2,
            offerId: 3,
            snapshot,
            lodgingSnapshot: null,
            new[] { ReservationHold.CreateForTour(2, 2) },
            createdAtUtc);
    }

    [Fact(DisplayName = "Admin reservas: prohíbe cancelar o completar reservas pending")]
    public void AdminTransitions_OnPendingReservation_ShouldThrow()
    {
        var now = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var pending = CreateReservation(now, now.AddDays(2), now.AddDays(2).AddHours(8));

        var cancelAct = () => pending.CancelByAdmin("Motivo válido", now.AddMinutes(5));
        cancelAct.Should().Throw<DomainException>();

        var completeAct = () => pending.CompleteByAdmin(now.AddDays(3));
        completeAct.Should().Throw<DomainException>();
    }

    [Fact(DisplayName = "Admin reservas: cancela confirmada antes del inicio con motivo y rechaza tras inicio")]
    public void CancelByAdmin_ShouldRequireConfirmedReasonAndBeforeStart()
    {
        var created = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var start = created.AddDays(2);
        var end = start.AddHours(8);

        var confirmed = CreateReservation(created, start, end);
        confirmed.ConfirmPayment(created.AddMinutes(5));

        var noReason = () => confirmed.CancelByAdmin("   ", created.AddHours(1));
        noReason.Should().Throw<DomainException>();

        var afterStart = () => confirmed.CancelByAdmin("Motivo", start);
        afterStart.Should().Throw<DomainException>();

        confirmed.CancelByAdmin("Reprogramación operativa", start.AddHours(-2));
        confirmed.Status.Should().Be(ReservationStatus.Cancelled);
        confirmed.CancellationOrigin.Should().Be(CancellationOrigin.Admin);
        confirmed.CancellationReason.Should().Be("Reprogramación operativa");
        confirmed.Holds.Should().OnlyContain(h => !h.IsHeld);
    }

    [Fact(DisplayName = "Admin reservas: completa confirmada tras fin del servicio y es terminal")]
    public void CompleteByAdmin_ShouldRequireEndedServiceAndBeTerminal()
    {
        var created = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        var start = created.AddDays(2);
        var end = start.AddHours(8);

        var confirmed = CreateReservation(created, start, end);
        confirmed.ConfirmPayment(created.AddMinutes(5));

        var tooEarly = () => confirmed.CompleteByAdmin(end.AddMinutes(-1));
        tooEarly.Should().Throw<DomainException>();

        confirmed.CompleteByAdmin(end);
        confirmed.Status.Should().Be(ReservationStatus.Completed);
        confirmed.CompletedAtUtc.Should().Be(end);

        var cancelAfterComplete = () => confirmed.CancelByAdmin("Tarde", end.AddHours(1));
        cancelAfterComplete.Should().Throw<DomainException>();
    }
}
