using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Mobility;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class MobilityRepository : IMobilityRepository
{
    private readonly ApplicationDbContext _db;

    public MobilityRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MobilityItem>> ListActiveOrderedAsync(
        CancellationToken cancellationToken = default) =>
        await _db.MobilityItems
            .AsNoTracking()
            .Where(item => item.IsActive)
            .OrderBy(item => item.Name)
            .ThenBy(item => item.Id)
            .ToListAsync(cancellationToken);

    public async Task<(IReadOnlyList<MobilityItem> Items, int Total)> ListAdminAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _db.MobilityItems.AsNoTracking();
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(item => item.Name)
            .ThenByDescending(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<MobilityItem?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.MobilityItems.SingleOrDefaultAsync(item => item.PublicId == publicId, cancellationToken);

    public Task<bool> ExistsActiveWithNormalizedKeyAsync(
        string normalizedKey,
        long? excludeId = null,
        CancellationToken cancellationToken = default) =>
        _db.MobilityItems
            .AsNoTracking()
            .AnyAsync(
                item => item.IsActive &&
                        item.NormalizedKey == normalizedKey &&
                        (!excludeId.HasValue || item.Id != excludeId.Value),
                cancellationToken);

    public Task AddAsync(MobilityItem item, CancellationToken cancellationToken = default) =>
        _db.MobilityItems.AddAsync(item, cancellationToken).AsTask();
}
