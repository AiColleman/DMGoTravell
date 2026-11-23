using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Audit;

/// <summary>
/// Evidencia de auditoría pendiente de incorporación tras un efecto externo real
/// (010/RF-38-RF-41). Permite reintentar sin perder la fecha original del hecho y
/// marcar alerta administrativa si el fallo persiste.
/// </summary>
public class PendingAuditEntry : Entity<long>
{
    public const string StatusPending = "pending";
    public const string StatusRecovered = "recovered";
    public const string StatusAlerted = "alerted";

    public string Origin { get; private set; } = "api";
    public string OperationId { get; private set; } = string.Empty;
    public string ActorType { get; private set; } = string.Empty;
    public long? ActorId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public DateTime OccurredAtUtc { get; private set; }
    public string? CorrelationId { get; private set; }
    public string Result { get; private set; } = "success";
    public string? ChangesJson { get; private set; }

    public string Status { get; private set; } = StatusPending;
    public int RetryCount { get; private set; }
    public int MaxRetries { get; private set; } = 5;
    public DateTime NextRetryAtUtc { get; private set; }
    public DateTime? RecoveredAtUtc { get; private set; }
    public string? LastError { get; private set; }

    private PendingAuditEntry() { }

    public static PendingAuditEntry Create(
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
        string? changesJson,
        string initialError,
        DateTime nowUtc,
        int maxRetries = 5)
    {
        return new PendingAuditEntry
        {
            Origin = origin,
            OperationId = operationId,
            ActorType = actorType,
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OccurredAtUtc = occurredAtUtc,
            CorrelationId = correlationId,
            Result = result,
            ChangesJson = changesJson,
            Status = StatusPending,
            RetryCount = 0,
            MaxRetries = Math.Max(1, maxRetries),
            NextRetryAtUtc = nowUtc,
            LastError = TruncateError(initialError),
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };
    }

    public void MarkRecovered(DateTime recoveredAtUtc)
    {
        Status = StatusRecovered;
        RecoveredAtUtc = recoveredAtUtc;
        LastError = null;
        UpdatedAtUtc = recoveredAtUtc;
        RowVersion++;
    }

    public bool RecordFailure(string error, DateTime nowUtc)
    {
        RetryCount++;
        LastError = TruncateError(error);
        UpdatedAtUtc = nowUtc;
        RowVersion++;

        if (RetryCount >= MaxRetries)
        {
            Status = StatusAlerted;
            return true; // Requiere alerta administrativa persistente (010/RF-41)
        }

        var backoffSeconds = Math.Min(300, 10 * (1 << Math.Min(RetryCount, 5)));
        NextRetryAtUtc = nowUtc.AddSeconds(backoffSeconds);
        return false;
    }

    private static string TruncateError(string error)
    {
        if (string.IsNullOrWhiteSpace(error)) return "Error desconocido al persistir auditoría.";
        var trimmed = error.Trim();
        return trimmed.Length <= 500 ? trimmed : trimmed[..500];
    }
}
