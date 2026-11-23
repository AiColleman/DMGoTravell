using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IOfferRepository
{
    Task<IReadOnlyList<Offer>> ListActiveAsync(OfferType type, CancellationToken cancellationToken = default);
    Task<Offer?> GetActiveByPublicIdAsync(Guid publicId, OfferType type, CancellationToken cancellationToken = default);
    Task<Offer?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<TourDeparture?> GetDepartureByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<TourDeparture?> GetDepartureByIdAsync(long id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Offer> Items, int Total)> ListAdminAsync(
        OfferType type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Offer?> GetByPublicIdAsync(
        Guid publicId,
        OfferType type,
        CancellationToken cancellationToken = default);

    Task AddAsync(Offer offer, CancellationToken cancellationToken = default);
    Task AddDepartureAsync(TourDeparture departure, CancellationToken cancellationToken = default);
    Task<bool> HasActiveReservationsAsync(long offerId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveReservationsForDepartureAsync(long departureId, CancellationToken cancellationToken = default);
}
