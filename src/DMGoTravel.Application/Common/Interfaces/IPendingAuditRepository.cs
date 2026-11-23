using DMGoTravel.Domain.Modules.Audit;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IPendingAuditRepository
{
    Task AddAsync(PendingAuditEntry entry, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PendingAuditEntry>> GetDuePendingAsync(DateTime nowUtc, int batchSize = 50, CancellationToken cancellationToken = default);
}
