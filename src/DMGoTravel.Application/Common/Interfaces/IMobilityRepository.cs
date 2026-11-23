using DMGoTravel.Domain.Modules.Mobility;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IMobilityRepository
{
    Task<IReadOnlyList<MobilityItem>> ListActiveOrderedAsync(CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<MobilityItem> Items, int Total)> ListAdminAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<MobilityItem?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);

    Task<bool> ExistsActiveWithNormalizedKeyAsync(
        string normalizedKey,
        long? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(MobilityItem item, CancellationToken cancellationToken = default);
}
