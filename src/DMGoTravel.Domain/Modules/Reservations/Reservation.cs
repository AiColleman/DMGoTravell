using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Reservations;

public class Reservation : Entity<long>
{
    public string ReservationNumber { get; private set; } = string.Empty;
    public long AccountId { get; private set; }
    public long DepartureId { get; private set; }
    public long OfferId { get; private set; }
    public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;

    public DateTime PaymentDeadlineAtUtc { get; private set; }
    public DateTime ValidationDeadlineAtUtc { get; private set; }

    public DateTime? ConfirmedAtUtc { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }
    public DateTime? CancelledAtUtc { get; private set; }

    public CancellationOrigin? CancellationOrigin { get; private set; }
    public string? CancellationReason { get; private set; }

    public Money TouristSubtotal { get; private set; } = Money.Zero();
    public Money LodgingSubtotal { get; private set; } = Money.Zero();
    public Money Total { get; private set; } = Money.Zero();

    public ReservationOfferSnapshot? OfferSnapshot { get; private set; }
    public ReservationLodgingSnapshot? LodgingSnapshot { get; private set; }

    private readonly List<ReservationHold> _holds = [];
    public IReadOnlyCollection<ReservationHold> Holds => _holds.AsReadOnly();

    private Reservation() { }

    public static Reservation Create(
        string reservationNumber,
        long accountId,
        long departureId,
        long offerId,
        ReservationOfferSnapshot offerSnapshot,
        ReservationLodgingSnapshot? lodgingSnapshot,
        IEnumerable<ReservationHold> holds,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(reservationNumber))
            throw new DomainException("El número legible de reserva es obligatorio.");

        var touristSubtotal = offerSnapshot.Subtotal;
        var lodgingSubtotal = lodgingSnapshot?.Subtotal ?? Money.Zero();
        var total = touristSubtotal + lodgingSubtotal;

        var reservation = new Reservation
        {
            ReservationNumber = reservationNumber.Trim().ToUpperInvariant(),
            AccountId = accountId,
            DepartureId = departureId,
            OfferId = offerId,
            Status = ReservationStatus.Pending,
            CreatedAtUtc = nowUtc,
            PaymentDeadlineAtUtc = nowUtc.AddMinutes(15),
            ValidationDeadlineAtUtc = nowUtc.AddMinutes(20),
            OfferSnapshot = offerSnapshot,
            LodgingSnapshot = lodgingSnapshot,
            TouristSubtotal = touristSubtotal.Copy(),
            LodgingSubtotal = lodgingSubtotal.Copy(),
            Total = total.Copy()
        };

        reservation._holds.AddRange(holds);
        return reservation;
    }

    public void ConfirmPayment(DateTime confirmedAtUtc)
    {
        if (Status != ReservationStatus.Pending)
        {
            throw new DomainException($"No se puede confirmar una reserva en estado '{Status}'.");
        }

        if (confirmedAtUtc >= ValidationDeadlineAtUtc)
        {
            throw new DomainException("La ventana de validación de pago venció; la reserva no puede confirmarse.");
        }

        Status = ReservationStatus.Confirmed;
        ConfirmedAtUtc = confirmedAtUtc;
        RowVersion++;
    }

    public bool IsExpiredAt(DateTime nowUtc, bool hasTimelyPaymentInProgress)
    {
        if (Status != ReservationStatus.Pending)
        {
            return false;
        }

        return hasTimelyPaymentInProgress
            ? nowUtc >= ValidationDeadlineAtUtc
            : nowUtc >= PaymentDeadlineAtUtc;
    }

    public static string GetApplicableDeadlineType(bool hasTimelyPaymentInProgress) =>
        hasTimelyPaymentInProgress ? "validation_deadline" : "payment_deadline";

    public void CancelByClient(DateTime nowUtc)
    {
        if (Status == ReservationStatus.Cancelled)
        {
            return;
        }

        if (Status != ReservationStatus.Pending)
        {
            throw new DomainException("El cliente solo puede cancelar reservas en estado pendiente.");
        }

        Cancel(Reservations.CancellationOrigin.Client, "Cancelado voluntariamente por el cliente antes del pago.", nowUtc);
    }

    public void CancelByExpiry(DateTime nowUtc)
    {
        TryCancelByExpiry(nowUtc);
    }

    public bool TryCancelByExpiry(DateTime nowUtc)
    {
        if (Status != ReservationStatus.Pending)
        {
            return false;
        }

        Cancel(Reservations.CancellationOrigin.Expiry, "Cancelación automática por vencimiento del plazo de pago.", nowUtc);
        return true;
    }

    public void CancelByAdmin(string reason, DateTime nowUtc)
    {
        if (Status != ReservationStatus.Confirmed && Status != ReservationStatus.Pending)
        {
            throw new DomainException($"No se puede cancelar administrativamente una reserva en estado '{Status}'.");
        }

        Cancel(Reservations.CancellationOrigin.Admin, reason, nowUtc);
    }

    private void Cancel(CancellationOrigin origin, string reason, DateTime nowUtc)
    {
        Status = ReservationStatus.Cancelled;
        CancelledAtUtc = nowUtc;
        CancellationOrigin = origin;
        CancellationReason = reason;

        foreach (var hold in _holds)
        {
            hold.Release(nowUtc);
        }

        RowVersion++;
    }
}
