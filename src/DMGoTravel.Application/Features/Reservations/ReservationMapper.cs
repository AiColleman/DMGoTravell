using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Application.Features.Reservations.Dtos;
using DMGoTravel.Domain.Modules.Reservations;

namespace DMGoTravel.Application.Features.Reservations;

internal static class ReservationMapper
{
    public static ReservationDto ToDto(Reservation reservation, DepartureDto? departure = null)
    {
        var snapshot = reservation.OfferSnapshot;
        object? lodging = reservation.LodgingSnapshot is null
            ? null
            : new
            {
                hotelName = reservation.LodgingSnapshot.HotelName,
                roomTypeName = reservation.LodgingSnapshot.RoomTypeName,
                capacity = reservation.LodgingSnapshot.Capacity,
                checkInDate = reservation.LodgingSnapshot.CheckInDate,
                checkOutDate = reservation.LodgingSnapshot.CheckOutDate,
                nights = reservation.LodgingSnapshot.Nights,
                nightlyRate = reservation.LodgingSnapshot.NightlyRate.ToString(),
                subtotal = reservation.LodgingSnapshot.Subtotal.ToString(),
                currency = "PEN"
            };

        return new ReservationDto(
            reservation.PublicId,
            reservation.ReservationNumber,
            reservation.Status.ToString().ToLowerInvariant(),
            departure,
            lodging,
            snapshot?.Travelers ?? 0,
            reservation.Total.ToString(),
            "PEN",
            reservation.PaymentDeadlineAtUtc,
            reservation.ValidationDeadlineAtUtc,
            reservation.RowVersion);
    }
}
