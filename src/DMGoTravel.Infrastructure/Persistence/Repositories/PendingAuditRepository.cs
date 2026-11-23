using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class PendingAuditRepository : IPendingAuditRepository
{
    private readonly ApplicationDbContext _db;

    public PendingAuditRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(PendingAuditEntry entry, CancellationToken cancellationToken = default) =>
        _db.PendingAuditEntries.AddAsync(entry, cancellationToken).AsTask();

    public async Task<IReadOnlyList<PendingAuditEntry>> GetDuePendingAsync(
        DateTime nowUtc,
        int batchSize = 50,
        CancellationToken cancellationToken = default) =>
        await _db.PendingAuditEntries
            .Where(p => p.Status == PendingAuditEntry.StatusPending && p.NextRetryAtUtc <= nowUtc)
            .OrderBy(p => p.NextRetryAtUtc)
            .ThenBy(p => p.Id)
            .Take(batchSize)
            .ToListAsync(cancellationToken);
}
