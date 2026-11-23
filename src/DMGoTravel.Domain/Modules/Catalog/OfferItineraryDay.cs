using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Catalog;

public class OfferItineraryDay : Entity<long>
{
    public long OfferId { get; private set; }
    public int DayNumber { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Activities { get; private set; } = string.Empty;

    private OfferItineraryDay() { }

    public OfferItineraryDay(int dayNumber, string title, string activities)
    {
        if (dayNumber <= 0)
            throw new DomainException("El número de día debe ser mayor a 0.");

        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("El título del itinerario es obligatorio.");

        if (string.IsNullOrWhiteSpace(activities))
            throw new DomainException("La descripción de actividades es obligatoria.");

        DayNumber = dayNumber;
        Title = title.Trim();
        Activities = activities.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}
