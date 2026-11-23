using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class OfferRepository : IOfferRepository
{
    private readonly ApplicationDbContext _db;

    public OfferRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Offer>> ListActiveAsync(OfferType type, CancellationToken cancellationToken = default) =>
        await _db.Offers
            .AsNoTracking()
            .Include(offer => offer.Images)
            .Include(offer => offer.Itinerary)
            .Include(offer => offer.Departures)
            .Where(offer => offer.IsActive && offer.DeletedAtUtc == null && offer.Type == type)
            .ToListAsync(cancellationToken);

    public Task<Offer?> GetActiveByPublicIdAsync(Guid publicId, OfferType type, CancellationToken cancellationToken = default) =>
        _db.Offers
            .AsNoTracking()
            .Include(offer => offer.Images)
            .Include(offer => offer.Itinerary)
            .Include(offer => offer.Departures)
            .SingleOrDefaultAsync(
                offer => offer.PublicId == publicId &&
                         offer.IsActive &&
                         offer.DeletedAtUtc == null &&
                         offer.Type == type,
                cancellationToken);

    public Task<Offer?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _db.Offers
            .Include(offer => offer.Images)
            .Include(offer => offer.Itinerary)
            .Include(offer => offer.Departures)
            .SingleOrDefaultAsync(offer => offer.Id == id, cancellationToken);

    public Task<TourDeparture?> GetDepartureByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.TourDepartures
            .SingleOrDefaultAsync(departure => departure.PublicId == publicId && departure.DeletedAtUtc == null, cancellationToken);

    public Task<TourDeparture?> GetDepartureByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _db.TourDepartures
            .SingleOrDefaultAsync(departure => departure.Id == id, cancellationToken);
}
