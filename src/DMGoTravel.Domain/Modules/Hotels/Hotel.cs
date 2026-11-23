using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Hotels;

public class Hotel : Entity<long>
{
    public string Name { get; private set; } = string.Empty;
    public string NormalizedKey { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    private readonly List<HotelService> _services = [];
    public IReadOnlyCollection<HotelService> Services => _services.AsReadOnly();

    private readonly List<RoomType> _roomTypes = [];
    public IReadOnlyCollection<RoomType> RoomTypes => _roomTypes.AsReadOnly();

    private Hotel() { }

    public static Hotel Create(string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("El nombre del hotel es obligatorio.");

        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("La descripción del hotel es obligatoria.");

        return new Hotel
        {
            Name = name.Trim(),
            NormalizedKey = name.Trim().ToUpperInvariant(),
            Description = description.Trim(),
            IsActive = false,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void AddService(string text)
    {
        _services.Add(new HotelService(_services.Count + 1, text));
    }

    public void AddRoomType(RoomType roomType)
    {
        _roomTypes.Add(roomType);
    }

    public void Activate()
    {
        if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Description))
            throw new DomainException("El hotel debe tener nombre y descripción para activarse.");

        if (_services.Count == 0)
            throw new DomainException("El hotel debe tener al menos un servicio registrado para activarse.");

        if (_roomTypes.Count == 0 || !_roomTypes.Any(r => r.IsActive))
            throw new DomainException("El hotel debe tener al menos un tipo de habitación activo para activarse.");

        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
