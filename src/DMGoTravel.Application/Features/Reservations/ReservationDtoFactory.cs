using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Catalog;
using DMGoTravel.Application.Features.Reservations.Dtos;
using DMGoTravel.Domain.Modules.Reservations;

namespace DMGoTravel.Application.Features.Reservations;

public sealed class ReservationDtoFactory
{
    private readonly IOfferRepository _offers;

    public ReservationDtoFactory(IOfferRepository offers)
    {
        _offers = offers;
    }

    public async Task<ReservationDto> CreateAsync(Reservation reservation, CancellationToken cancellationToken)
    {
        var departure = await _offers.GetDepartureByIdAsync(reservation.DepartureId, cancellationToken);
        var offer = departure is null
            ? null
            : await _offers.GetByIdAsync(departure.OfferId, cancellationToken);

        var departureDto = departure is not null && offer is not null
            ? CatalogMapper.ToDeparture(departure, offer, includeCapacity: true)
            : null;

        return ReservationMapper.ToDto(reservation, departureDto);
    }
}
