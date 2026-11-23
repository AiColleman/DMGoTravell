using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Hotels;

public class LodgingProposal : Entity<long>
{
    public long DepartureId { get; private set; }
    public long HotelId { get; private set; }
    public DateOnly CheckInDate { get; private set; }
    public DateOnly CheckOutDate { get; private set; }
    public bool IsActive { get; private set; } = true;

    public int Nights => CheckOutDate.DayNumber - CheckInDate.DayNumber;

    private LodgingProposal() { }

    public LodgingProposal(long departureId, long hotelId, DateOnly checkInDate, DateOnly checkOutDate)
    {
        if (checkOutDate <= checkInDate)
            throw new DomainException("La fecha de check-out debe ser posterior a la de check-in.");

        DepartureId = departureId;
        HotelId = hotelId;
        CheckInDate = checkInDate;
        CheckOutDate = checkOutDate;
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
