using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Hotels;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class HotelRepository : IHotelRepository
{
    private readonly ApplicationDbContext _db;

    public HotelRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Hotel>> ListActiveOrderedAsync(CancellationToken cancellationToken = default) =>
        await _db.Hotels
            .AsNoTracking()
            .Include(h => h.Services)
            .Include(h => h.RoomTypes)
            .Where(h => h.IsActive && h.DeletedAtUtc == null)
            .OrderBy(h => h.Name)
            .ThenBy(h => h.Id)
            .ToListAsync(cancellationToken);

    public Task<Hotel?> GetActiveByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.Hotels
            .AsNoTracking()
            .Include(h => h.Services)
            .Include(h => h.RoomTypes)
            .SingleOrDefaultAsync(
                h => h.PublicId == publicId && h.IsActive && h.DeletedAtUtc == null,
                cancellationToken);

    public async Task<(IReadOnlyList<Hotel> Items, int Total)> ListAdminAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Hotels
            .AsNoTracking()
            .Where(h => h.DeletedAtUtc == null);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(h => h.Name)
            .ThenByDescending(h => h.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<Hotel?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.Hotels
            .Include(h => h.Services)
            .Include(h => h.RoomTypes)
            .SingleOrDefaultAsync(h => h.PublicId == publicId && h.DeletedAtUtc == null, cancellationToken);

    public Task<Hotel?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _db.Hotels
            .Include(h => h.Services)
            .Include(h => h.RoomTypes)
            .SingleOrDefaultAsync(h => h.Id == id && h.DeletedAtUtc == null, cancellationToken);

    public Task<bool> ExistsActiveWithNormalizedKeyAsync(
        string normalizedKey,
        long? excludeId = null,
        CancellationToken cancellationToken = default) =>
        _db.Hotels
            .AsNoTracking()
            .AnyAsync(
                h => h.IsActive &&
                     h.DeletedAtUtc == null &&
                     h.NormalizedKey == normalizedKey &&
                     (!excludeId.HasValue || h.Id != excludeId.Value),
                cancellationToken);

    public Task AddHotelAsync(Hotel hotel, CancellationToken cancellationToken = default) =>
        _db.Hotels.AddAsync(hotel, cancellationToken).AsTask();

    public Task<RoomType?> GetRoomTypeByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.RoomTypes.SingleOrDefaultAsync(r => r.PublicId == publicId && r.DeletedAtUtc == null, cancellationToken);

    public Task AddRoomTypeAsync(RoomType roomType, CancellationToken cancellationToken = default) =>
        _db.RoomTypes.AddAsync(roomType, cancellationToken).AsTask();

    public Task<RoomInventoryNight?> GetInventoryNightAsync(
        long roomTypeId,
        DateOnly stayDate,
        CancellationToken cancellationToken = default) =>
        _db.RoomInventoryNights.SingleOrDefaultAsync(
            n => n.RoomTypeId == roomTypeId && n.StayDate == stayDate,
            cancellationToken);

    public async Task<IReadOnlyList<RoomInventoryNight>> GetInventoryNightsAsync(
        long roomTypeId,
        DateOnly checkInDate,
        DateOnly checkOutDate,
        CancellationToken cancellationToken = default) =>
        await _db.RoomInventoryNights
            .Where(n => n.RoomTypeId == roomTypeId && n.StayDate >= checkInDate && n.StayDate < checkOutDate)
            .OrderBy(n => n.StayDate)
            .ToListAsync(cancellationToken);

    public Task AddInventoryNightAsync(RoomInventoryNight night, CancellationToken cancellationToken = default) =>
        _db.RoomInventoryNights.AddAsync(night, cancellationToken).AsTask();

    public async Task<HashSet<long>> GetHotelsWithFutureAvailabilityAsync(
        IReadOnlyCollection<long> hotelIds,
        DateOnly fromDate,
        CancellationToken cancellationToken = default)
    {
        if (hotelIds.Count == 0)
        {
            return [];
        }

        var availableHotelIds = await (
            from rt in _db.RoomTypes.AsNoTracking()
            join inv in _db.RoomInventoryNights.AsNoTracking() on rt.Id equals inv.RoomTypeId
            where hotelIds.Contains(rt.HotelId) &&
                  rt.IsActive &&
                  rt.DeletedAtUtc == null &&
                  inv.StayDate >= fromDate &&
                  inv.QuantityTotal > inv.QuantityCommitted
            select rt.HotelId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return availableHotelIds.ToHashSet();
    }

    public async Task<IReadOnlyList<MediaAsset>> GetImagesForHotelsAsync(
        IReadOnlyCollection<long> hotelIds,
        CancellationToken cancellationToken = default)
    {
        if (hotelIds.Count == 0) return [];

        return await _db.MediaAssets
            .AsNoTracking()
            .Where(m => m.HotelId.HasValue && m.RoomTypeId == null && hotelIds.Contains(m.HotelId.Value))
            .OrderByDescending(m => m.Role == "main")
            .ThenBy(m => m.Position)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MediaAsset>> GetImagesForRoomTypesAsync(
        IReadOnlyCollection<long> roomTypeIds,
        CancellationToken cancellationToken = default)
    {
        if (roomTypeIds.Count == 0) return [];

        return await _db.MediaAssets
            .AsNoTracking()
            .Where(m => m.RoomTypeId.HasValue && roomTypeIds.Contains(m.RoomTypeId.Value))
            .OrderByDescending(m => m.Role == "main")
            .ThenBy(m => m.Position)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasHotelImageAsync(long hotelId, CancellationToken cancellationToken = default) =>
        _db.MediaAssets
            .AsNoTracking()
            .AnyAsync(m => m.HotelId == hotelId && m.RoomTypeId == null, cancellationToken);

    public async Task<IReadOnlyList<LodgingProposal>> ListActiveProposalsByDepartureIdAsync(
        long departureId,
        CancellationToken cancellationToken = default) =>
        await _db.LodgingProposals
            .AsNoTracking()
            .Where(p => p.DepartureId == departureId && p.IsActive)
            .OrderBy(p => p.CheckInDate)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);

    public Task<LodgingProposal?> GetProposalByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.LodgingProposals.SingleOrDefaultAsync(p => p.PublicId == publicId, cancellationToken);

    public Task AddProposalAsync(LodgingProposal proposal, CancellationToken cancellationToken = default) =>
        _db.LodgingProposals.AddAsync(proposal, cancellationToken).AsTask();
}
