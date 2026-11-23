using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Hotels;

public class RoomInventoryNight
{
    public long RoomTypeId { get; private set; }
    public DateOnly StayDate { get; private set; }
    public int QuantityTotal { get; private set; }
    public int QuantityCommitted { get; private set; }
    public long RowVersion { get; private set; } = 1;

    public int AvailableQuantity => QuantityTotal - QuantityCommitted;

    private RoomInventoryNight() { }

    public RoomInventoryNight(long roomTypeId, DateOnly stayDate, int quantityTotal)
    {
        if (quantityTotal < 0)
            throw new DomainException("La cantidad total de habitaciones no puede ser negativa.");

        RoomTypeId = roomTypeId;
        StayDate = stayDate;
        QuantityTotal = quantityTotal;
        QuantityCommitted = 0;
    }

    public void HoldRoom(int quantity = 1)
    {
        if (AvailableQuantity < quantity)
            throw new DomainException($"No hay disponibilidad de habitaciones para la noche del {StayDate:yyyy-MM-dd}.");

        QuantityCommitted += quantity;
        RowVersion++;
    }

    public void ReleaseRoom(int quantity = 1)
    {
        QuantityCommitted = Math.Max(0, QuantityCommitted - quantity);
        RowVersion++;
    }
}
