using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Reservations;

public class ReservationHold : Entity<long>
{
    public long ReservationId { get; private set; }
    public string ResourceType { get; private set; } = string.Empty; // "departure" | "room_night"
    public long ResourceId { get; private set; }
    public DateOnly? PeriodDate { get; private set; }
    public int Quantity { get; private set; }
    public string State { get; private set; } = "held"; // "held" | "released"
    public DateTime? ReleasedAtUtc { get; private set; }

    private ReservationHold() { }

    public static ReservationHold CreateForTour(long departureId, int travelers) => new()
    {
        ResourceType = "departure",
        ResourceId = departureId,
        PeriodDate = null,
        Quantity = travelers,
        State = "held",
        CreatedAtUtc = DateTime.UtcNow
    };

    public static ReservationHold CreateForHotel(long roomTypeId, DateOnly nightDate, int rooms = 1) => new()
    {
        ResourceType = "room_night",
        ResourceId = roomTypeId,
        PeriodDate = nightDate,
        Quantity = rooms,
        State = "held",
        CreatedAtUtc = DateTime.UtcNow
    };

    public bool IsHeld => string.Equals(State, "held", StringComparison.Ordinal);

    public void Release(DateTime? releasedAtUtc = null)
    {
        if (!IsHeld)
        {
            return;
        }

        State = "released";
        ReleasedAtUtc = releasedAtUtc ?? DateTime.UtcNow;
    }
}
