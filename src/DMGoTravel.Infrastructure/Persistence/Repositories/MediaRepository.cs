using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class MediaRepository : IMediaRepository
{
    private readonly ApplicationDbContext _db;

    public MediaRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(MediaAsset asset, CancellationToken cancellationToken = default) =>
        _db.MediaAssets.AddAsync(asset, cancellationToken).AsTask();

    public void Remove(MediaAsset asset) =>
        _db.MediaAssets.Remove(asset);

    public Task<MediaAsset?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.MediaAssets.SingleOrDefaultAsync(m => m.PublicId == publicId, cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> ListForOfferAsync(long offerId, CancellationToken cancellationToken = default) =>
        await _db.MediaAssets
            .Where(m => m.OfferId == offerId)
            .OrderBy(m => m.Position)
            .ThenBy(m => m.Id)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> ListForHotelAsync(long hotelId, CancellationToken cancellationToken = default) =>
        await _db.MediaAssets
            .Where(m => m.HotelId == hotelId && m.RoomTypeId == null)
            .OrderBy(m => m.Position)
            .ThenBy(m => m.Id)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> ListForRoomTypeAsync(long hotelId, long roomTypeId, CancellationToken cancellationToken = default) =>
        await _db.MediaAssets
            .Where(m => m.HotelId == hotelId && m.RoomTypeId == roomTypeId)
            .OrderBy(m => m.Position)
            .ThenBy(m => m.Id)
            .ToListAsync(cancellationToken);

    public Task<MediaAsset?> GetForMobilityAsync(long mobilityItemId, CancellationToken cancellationToken = default) =>
        _db.MediaAssets
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync(m => m.MobilityItemId == mobilityItemId, cancellationToken);

    public async Task<bool> IsAssetPubliclyReadableAsync(MediaAsset asset, CancellationToken cancellationToken = default)
    {
        if (asset.IsPublished)
        {
            return true;
        }

        if (asset.OfferId.HasValue)
        {
            return await _db.Offers.AsNoTracking()
                .AnyAsync(o => o.Id == asset.OfferId.Value && o.IsActive && o.DeletedAtUtc == null, cancellationToken);
        }

        if (asset.HotelId.HasValue)
        {
            return await _db.Hotels.AsNoTracking()
                .AnyAsync(h => h.Id == asset.HotelId.Value && h.IsActive && h.DeletedAtUtc == null, cancellationToken);
        }

        if (asset.MobilityItemId.HasValue)
        {
            return await _db.MobilityItems.AsNoTracking()
                .AnyAsync(m => m.Id == asset.MobilityItemId.Value && m.IsActive, cancellationToken);
        }

        return false;
    }

    public async Task MarkPublishedForOfferAsync(long offerId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        var assets = await _db.MediaAssets.Where(m => m.OfferId == offerId && !m.IsPublished).ToListAsync(cancellationToken);
        foreach (var asset in assets)
        {
            asset.MarkPublished(nowUtc);
        }
    }

    public async Task MarkPublishedForHotelAsync(long hotelId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        var assets = await _db.MediaAssets.Where(m => m.HotelId == hotelId && !m.IsPublished).ToListAsync(cancellationToken);
        foreach (var asset in assets)
        {
            asset.MarkPublished(nowUtc);
        }
    }

    public async Task MarkPublishedForMobilityAsync(long mobilityItemId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        var assets = await _db.MediaAssets.Where(m => m.MobilityItemId == mobilityItemId && !m.IsPublished).ToListAsync(cancellationToken);
        foreach (var asset in assets)
        {
            asset.MarkPublished(nowUtc);
        }
    }
}
