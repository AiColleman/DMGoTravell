using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;

namespace DMGoTravel.Infrastructure.Persistence;

/// <summary>
/// Anexa registros de auditoría al contexto actual. No persiste por sí mismo: la
/// operación y su auditoría se confirman con el mismo <c>SaveChanges</c>.
/// </summary>
public sealed class AuditWriter : IAuditWriter
{
    private const string Origin = "api";

    private readonly ApplicationDbContext _dbContext;
    private readonly ICorrelationContext _correlation;
    private readonly IDateTimeProvider _clock;

    public AuditWriter(
        ApplicationDbContext dbContext,
        ICorrelationContext correlation,
        IDateTimeProvider clock)
    {
        _dbContext = dbContext;
        _correlation = correlation;
        _clock = clock;
    }

    public void Record(AuditEntry entry)
    {
        _dbContext.AuditLogs.Add(AuditLog.Create(
            Origin,
            entry.OperationId,
            entry.ActorType,
            entry.ActorId,
            entry.Action,
            entry.EntityType,
            entry.EntityId,
            entry.OccurredAtUtc ?? _clock.UtcNow,
            entry.CorrelationIdOverride ?? _correlation.CorrelationId,
            entry.Result,
            entry.ChangesJson));
    }
}
