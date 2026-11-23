using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Audit;

/// <summary>
/// Registro inmutable de auditoría para trazabilidad de operaciones críticas.
/// Conforme a MD-01, RN-28 y RN-29: append-only, sin borrado en cascada, sin datos sensibles.
/// </summary>
public class AuditLog : Entity<long>
{
    public string Origin { get; private set; } = string.Empty;
    public string OperationId { get; private set; } = string.Empty;
    public string ActorType { get; private set; } = string.Empty; // "human" | "system" | "unidentified"
    public long? ActorId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public DateTime OccurredAtUtc { get; private set; }
    public DateTime RecordedAtUtc { get; private set; }
    public string? CorrelationId { get; private set; }
    public string Result { get; private set; } = "success"; // "success" | "failure"
    public string? ChangesJson { get; private set; }

    private AuditLog() { }

    public static AuditLog Create(
        string origin,
        string operationId,
        string actorType,
        long? actorId,
        string action,
        string entityType,
        string entityId,
        DateTime occurredAtUtc,
        string? correlationId,
        string result,
        string? changesJson = null)
    {
        return new AuditLog
        {
            Origin = origin,
            OperationId = operationId,
            ActorType = actorType,
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OccurredAtUtc = occurredAtUtc,
            RecordedAtUtc = DateTime.UtcNow,
            CorrelationId = correlationId,
            Result = result,
            ChangesJson = changesJson,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
