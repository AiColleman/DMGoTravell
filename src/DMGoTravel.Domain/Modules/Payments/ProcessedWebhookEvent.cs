using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Payments;

/// <summary>
/// Registro de deduplicación de eventos webhook por proveedor y evento externo (Spec 002 / Spec 004).
/// Garantiza procesamiento exactamente-una-vez aunque el proveedor reintente la entrega.
/// </summary>
public class ProcessedWebhookEvent : Entity<long>
{
    public string Provider { get; private set; } = string.Empty;
    public string ExternalEventId { get; private set; } = string.Empty;
    public string EventType { get; private set; } = string.Empty;
    public DateTime ProcessedAtUtc { get; private set; }

    private ProcessedWebhookEvent() { }

    public static ProcessedWebhookEvent Create(
        string provider,
        string externalEventId,
        string eventType,
        DateTime processedAtUtc)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new DomainException("El proveedor del webhook es obligatorio.");

        if (string.IsNullOrWhiteSpace(externalEventId))
            throw new DomainException("El identificador externo del evento es obligatorio.");

        return new ProcessedWebhookEvent
        {
            Provider = provider.Trim().ToLowerInvariant(),
            ExternalEventId = externalEventId.Trim(),
            EventType = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim().ToLowerInvariant(),
            ProcessedAtUtc = processedAtUtc,
            CreatedAtUtc = processedAtUtc
        };
    }
}
