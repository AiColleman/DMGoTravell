using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Catalog;

public class Offer : Entity<long>
{
    public OfferType Type { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedKey { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int DurationValue { get; private set; }
    public DurationUnit DurationUnit { get; private set; }
    public Money PriceNormal { get; private set; } = Money.Zero();
    public Money? PriceDiscounted { get; private set; }
    public string Conditions { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    private readonly List<OfferItineraryDay> _itinerary = [];
    public IReadOnlyCollection<OfferItineraryDay> Itinerary => _itinerary.AsReadOnly();

    private readonly List<TourDeparture> _departures = [];
    public IReadOnlyCollection<TourDeparture> Departures => _departures.AsReadOnly();

    private readonly List<MediaAsset> _images = [];
    public IReadOnlyCollection<MediaAsset> Images => _images.AsReadOnly();

    private Offer() { }

    public static Offer Create(
        OfferType type,
        string name,
        string description,
        int durationValue,
        DurationUnit durationUnit,
        Money priceNormal,
        string conditions,
        Money? priceDiscounted = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("El nombre de la oferta es obligatorio.");

        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("La descripción de la oferta es obligatoria.");

        if (durationValue <= 0)
            throw new DomainException("La duración debe ser mayor a cero.");

        if (priceNormal.Amount <= 0)
            throw new DomainException("El precio normal debe ser mayor a cero.");

        if (priceDiscounted is not null && priceDiscounted.Amount >= priceNormal.Amount)
            throw new DomainException("El precio con descuento debe ser menor que el precio normal.");

        return new Offer
        {
            Type = type,
            Name = name.Trim(),
            NormalizedKey = name.Trim().ToUpperInvariant(),
            Description = description.Trim(),
            DurationValue = durationValue,
            DurationUnit = durationUnit,
            PriceNormal = priceNormal.Copy(),
            PriceDiscounted = priceDiscounted?.Copy(),
            Conditions = conditions.Trim(),
            IsActive = false, // Nace inactiva hasta completar todos sus datos (DEC-053)
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Activate()
    {
        if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Description) ||
            string.IsNullOrWhiteSpace(Conditions) || PriceNormal.Amount <= 0)
        {
            throw new DomainException("No se puede activar una oferta con datos incompletos.");
        }

        if (_itinerary.Count == 0)
        {
            throw new DomainException("La oferta debe tener al menos un día de itinerario para ser activada.");
        }

        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AddItineraryDay(OfferItineraryDay day)
    {
        _itinerary.Add(day);
    }

    public void AddDeparture(TourDeparture departure)
    {
        _departures.Add(departure);
    }

    public void AddImage(MediaAsset image)
    {
        _images.Add(image);
    }
}
