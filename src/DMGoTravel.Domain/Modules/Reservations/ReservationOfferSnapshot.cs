using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Reservations;

public class ReservationOfferSnapshot : Entity<long>
{
    public long ReservationId { get; private set; }
    public string OfferType { get; private set; } = string.Empty;
    public string OfferName { get; private set; } = string.Empty;
    public DateTime DepartureStartsAtUtc { get; private set; }
    public DateTime DepartureEndsAtUtc { get; private set; }
    public int Travelers { get; private set; }
    public Money PricePerPerson { get; private set; } = Money.Zero();
    public Money Subtotal { get; private set; } = Money.Zero();

    private ReservationOfferSnapshot() { }

    public ReservationOfferSnapshot(
        string offerType,
        string offerName,
        DateTime startsAtUtc,
        DateTime endsAtUtc,
        int travelers,
        Money pricePerPerson)
    {
        if (travelers <= 0)
            throw new DomainException("La cantidad de viajeros debe ser mayor a cero.");

        OfferType = offerType;
        OfferName = offerName;
        DepartureStartsAtUtc = startsAtUtc;
        DepartureEndsAtUtc = endsAtUtc;
        Travelers = travelers;
        PricePerPerson = pricePerPerson.Copy();
        Subtotal = pricePerPerson * travelers;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
