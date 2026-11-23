using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Catalog;

public class TourDeparture : Entity<long>
{
    public long OfferId { get; private set; }
    public DateTime StartsAtUtc { get; private set; }
    public DateTime EndsAtUtc { get; private set; }
    public int CapacityTotal { get; private set; }
    public int CapacityCommitted { get; private set; }
    public Money? PriceNormal { get; private set; }
    public Money? PriceDiscounted { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime? DeletedAtUtc { get; private set; }

    public int AvailableCapacity => CapacityTotal - CapacityCommitted;

    private TourDeparture() { }

    public TourDeparture(long offerId, DateTime startsAtUtc, DateTime endsAtUtc, int capacityTotal, Money priceNormal, Money? priceDiscounted = null)
    {
        if (startsAtUtc <= DateTime.UtcNow)
            throw new DomainException("La salida debe programarse para una fecha y hora futura.");

        if (endsAtUtc <= startsAtUtc)
            throw new DomainException("La fecha de finalización debe ser posterior a la de inicio.");

        if (capacityTotal <= 0)
            throw new DomainException("La capacidad total debe ser mayor a cero.");

        OfferId = offerId;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        CapacityTotal = capacityTotal;
        CapacityCommitted = 0;
        PriceNormal = priceNormal.Copy();
        PriceDiscounted = priceDiscounted?.Copy();
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Money GetEffectivePrice(Money offerDefaultPrice)
    {
        if (PriceDiscounted is not null) return PriceDiscounted;
        if (PriceNormal is not null) return PriceNormal;
        return offerDefaultPrice;
    }

    public void HoldSeats(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("La cantidad de cupos a retener debe ser mayor a cero.");

        if (AvailableCapacity < quantity)
            throw new DomainException($"No hay suficientes cupos disponibles. Solicitados: {quantity}, Disponibles: {AvailableCapacity}.");

        CapacityCommitted += quantity;
        RowVersion++;
    }

    public void ReleaseSeats(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("La cantidad de cupos a liberar debe ser mayor a cero.");

        CapacityCommitted = Math.Max(0, CapacityCommitted - quantity);
        RowVersion++;
    }
}
