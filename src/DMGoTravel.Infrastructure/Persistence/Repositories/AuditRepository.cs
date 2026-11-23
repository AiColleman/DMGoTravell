using DMGoTravel.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class AuditRepository : IAuditRepository
{
    private readonly ApplicationDbContext _db;

    public AuditRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<AuditRecordView> Items, int Total)> ListAsync(
        AuditQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(filter);
        var total = await query.CountAsync(cancellationToken);

        // El orden se aplica sobre la entidad antes de proyectar: ordenar la
        // proyección con navegación no siempre es traducible por EF Core.
        var items = await Project(
                query
                    .OrderByDescending(record => record.OccurredAtUtc)
                    .ThenByDescending(record => record.Id))
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<AuditRecordView?> GetByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default) =>
        Project(_db.AuditLogs.AsNoTracking().Where(record => record.PublicId == publicId))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<AuditRecordView>> CaptureAsync(
        AuditQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        return await Project(
                ApplyFilters(filter)
                    .OrderByDescending(record => record.OccurredAtUtc)
                    .ThenByDescending(record => record.Id))
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Domain.Modules.Audit.AuditLog> ApplyFilters(AuditQueryFilter filter)
    {
        var query = _db.AuditLogs.AsNoTracking();

        if (filter.FromUtc is not null)
        {
            query = query.Where(record => record.OccurredAtUtc >= filter.FromUtc.Value);
        }

        if (filter.ToUtcExclusive is not null)
        {
            query = query.Where(record => record.OccurredAtUtc < filter.ToUtcExclusive.Value);
        }

        if (filter.Actor is not null)
        {
            if (Guid.TryParse(filter.Actor, out var actorPublicId))
            {
                query = query.Where(record =>
                    _db.Users.Any(user => user.Id == record.ActorId && user.PublicId == actorPublicId));
            }
            else
            {
                query = query.Where(record => record.ActorType == filter.Actor);
            }
        }

        if (filter.Entity is not null)
        {
            query = query.Where(record => record.EntityId == filter.Entity);
        }

        if (filter.CorrelationId is not null)
        {
            query = query.Where(record => record.CorrelationId == filter.CorrelationId);
        }

        if (filter.Action is not null)
        {
            query = query.Where(record => record.Action == filter.Action);
        }

        if (filter.Type is not null)
        {
            query = query.Where(record => record.EntityType == filter.Type);
        }

        if (filter.Result is not null)
        {
            query = query.Where(record => record.Result == filter.Result);
        }

        return query;
    }

    private IQueryable<AuditRecordView> Project(IQueryable<Domain.Modules.Audit.AuditLog> query) =>
        from record in query
        join actor in _db.Users.AsNoTracking()
            on record.ActorId equals (long?)actor.Id into actors
        from actor in actors.DefaultIfEmpty()
        select new AuditRecordView(
            record.Id,
            record.PublicId,
            record.ActorType,
            actor == null ? null : actor.PublicId,
            record.EntityType,
            record.EntityId,
            record.Action,
            record.OccurredAtUtc,
            record.CorrelationId,
            record.Result,
            record.ChangesJson,
            record.RecordedAtUtc);
}
