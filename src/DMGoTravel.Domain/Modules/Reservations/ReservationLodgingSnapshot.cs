using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Reservations;

public class ReservationLodgingSnapshot : Entity<long>
{
    public long ReservationId { get; private set; }
    public long ProposalId { get; private set; }
    public string HotelName { get; private set; } = string.Empty;
    public string RoomTypeName { get; private set; } = string.Empty;
    public int Capacity { get; private set; }
    public DateOnly CheckInDate { get; private set; }
    public DateOnly CheckOutDate { get; private set; }
    public int Nights { get; private set; }
    public Money NightlyRate { get; private set; } = Money.Zero();
    public Money Subtotal { get; private set; } = Money.Zero();

    private ReservationLodgingSnapshot() { }

    public ReservationLodgingSnapshot(
        long proposalId,
        string hotelName,
        string roomTypeName,
        int capacity,
        DateOnly checkInDate,
        DateOnly checkOutDate,
        Money nightlyRate)
    {
        var nights = checkOutDate.DayNumber - checkInDate.DayNumber;
        if (nights <= 0)
            throw new DomainException("La estancia de alojamiento debe tener al menos una noche.");

        ProposalId = proposalId;
        HotelName = hotelName;
        RoomTypeName = roomTypeName;
        Capacity = capacity;
        CheckInDate = checkInDate;
        CheckOutDate = checkOutDate;
        Nights = nights;
        NightlyRate = nightlyRate.Copy();
        Subtotal = nightlyRate * nights;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
