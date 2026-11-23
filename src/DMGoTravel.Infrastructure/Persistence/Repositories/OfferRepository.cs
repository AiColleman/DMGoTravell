using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Reservations;
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

    public async Task<(IReadOnlyList<Offer> Items, int Total)> ListAdminAsync(
        OfferType type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Offers
            .AsNoTracking()
            .Where(offer => offer.Type == type && offer.DeletedAtUtc == null);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(offer => offer.Name)
            .ThenByDescending(offer => offer.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<Offer?> GetByPublicIdAsync(
        Guid publicId,
        OfferType type,
        CancellationToken cancellationToken = default) =>
        _db.Offers
            .Include(offer => offer.Images)
            .Include(offer => offer.Itinerary)
            .Include(offer => offer.Departures)
            .SingleOrDefaultAsync(
                offer => offer.PublicId == publicId &&
                         offer.Type == type &&
                         offer.DeletedAtUtc == null,
                cancellationToken);

    public Task AddAsync(Offer offer, CancellationToken cancellationToken = default) =>
        _db.Offers.AddAsync(offer, cancellationToken).AsTask();

    public Task AddDepartureAsync(TourDeparture departure, CancellationToken cancellationToken = default) =>
        _db.TourDepartures.AddAsync(departure, cancellationToken).AsTask();

    public Task<bool> HasActiveReservationsAsync(long offerId, CancellationToken cancellationToken = default) =>
        _db.Reservations
            .AsNoTracking()
            .AnyAsync(
                r => r.OfferId == offerId &&
                     (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed),
                cancellationToken);

    public Task<bool> HasActiveReservationsForDepartureAsync(long departureId, CancellationToken cancellationToken = default) =>
        _db.Reservations
            .AsNoTracking()
            .AnyAsync(
                r => r.DepartureId == departureId &&
                     (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed),
                cancellationToken);
}
