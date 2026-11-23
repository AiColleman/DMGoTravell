using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Application.Features.Reservations.Dtos;
using DMGoTravel.Domain.Modules.Reservations;

namespace DMGoTravel.Application.Features.Reservations;

internal static class ReservationMapper
{
    public static ReservationDto ToDto(Reservation reservation, DepartureDto? departure = null)
    {
        var snapshot = reservation.OfferSnapshot;
        return new ReservationDto(
            reservation.PublicId,
            reservation.ReservationNumber,
            reservation.Status.ToString().ToLowerInvariant(),
            departure,
            null,
            snapshot?.Travelers ?? 0,
            reservation.Total.ToString(),
            "PEN",
            reservation.PaymentDeadlineAtUtc,
            reservation.ValidationDeadlineAtUtc,
            reservation.RowVersion);
    }
}
