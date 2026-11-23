using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Hotels;

public class RoomType : Entity<long>
{
    public long HotelId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedKey { get; private set; } = string.Empty;
    public int Capacity { get; private set; }
    public Money BaseRate { get; private set; } = Money.Zero();
    public bool IsActive { get; private set; } = true;
    public DateTime? DeletedAtUtc { get; private set; }

    private RoomType() { }

    public RoomType(long hotelId, string name, int capacity, Money baseRate)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("El nombre del tipo de habitación es obligatorio.");

        if (capacity <= 0)
            throw new DomainException("La capacidad de la habitación debe ser mayor a cero.");

        if (baseRate.Amount <= 0)
            throw new DomainException("La tarifa base debe ser mayor a cero.");

        HotelId = hotelId;
        Name = name.Trim();
        NormalizedKey = name.Trim().ToUpperInvariant();
        Capacity = capacity;
        BaseRate = baseRate.Copy();
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
