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

    public void Update(
        DateTime startsAtUtc,
        DateTime endsAtUtc,
        int capacityTotal,
        Money priceNormal,
        bool hasActiveReservations,
        DateTime nowUtc)
    {
        if (endsAtUtc <= startsAtUtc)
            throw new DomainException("La fecha de finalización debe ser posterior a la de inicio.");

        if (capacityTotal <= 0)
            throw new DomainException("La capacidad total debe ser mayor a cero.");

        if (capacityTotal < CapacityCommitted)
            throw new DomainException($"La capacidad no puede ser menor que los cupos comprometidos ({CapacityCommitted}).");

        if (priceNormal.Amount <= 0)
            throw new DomainException("El precio normal debe ser mayor a cero.");

        if (PriceDiscounted is not null && PriceDiscounted.Amount >= priceNormal.Amount)
            throw new DomainException("El precio normal debe ser mayor que el descuento vigente.");

        if (hasActiveReservations && (StartsAtUtc != startsAtUtc || EndsAtUtc != endsAtUtc))
            throw new DomainException("No se puede modificar la fecha u hora de una salida con reservas activas.");

        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        CapacityTotal = capacityTotal;
        PriceNormal = priceNormal.Copy();
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void UpdatePricing(Money priceNormal, Money? priceDiscounted, DateTime nowUtc)
    {
        if (priceNormal.Amount <= 0)
            throw new DomainException("El precio normal debe ser mayor a cero.");

        if (priceDiscounted is not null && (priceDiscounted.Amount <= 0 || priceDiscounted.Amount >= priceNormal.Amount))
            throw new DomainException("El precio con descuento debe ser mayor a cero y menor que el precio normal.");

        PriceNormal = priceNormal.Copy();
        PriceDiscounted = priceDiscounted?.Copy();
        UpdatedAtUtc = nowUtc;
        RowVersion++;
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
