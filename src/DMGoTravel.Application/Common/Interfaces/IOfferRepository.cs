using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IOfferRepository
{
    Task<IReadOnlyList<Offer>> ListActiveAsync(OfferType type, CancellationToken cancellationToken = default);
    Task<Offer?> GetActiveByPublicIdAsync(Guid publicId, OfferType type, CancellationToken cancellationToken = default);
    Task<Offer?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<TourDeparture?> GetDepartureByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<TourDeparture?> GetDepartureByIdAsync(long id, CancellationToken cancellationToken = default);
}
