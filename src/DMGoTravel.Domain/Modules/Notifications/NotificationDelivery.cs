using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Notifications;

/// <summary>
/// Entrega de correo saliente gestionada por outbox y reconciliada vía webhooks de Resend (Spec 004).
/// No almacena contraseñas ni tokens en texto claro en sus resúmenes o incidentes.
/// </summary>
public class NotificationDelivery : Entity<long>
{
    public const string StatusPending = "pending";
    public const string StatusSent = "sent";
    public const string StatusDelivered = "delivered";
    public const string StatusBounced = "bounced";
    public const string StatusFailed = "failed";

    public string Template { get; private set; } = string.Empty;
    public string RecipientEmail { get; private set; } = string.Empty;
    public string RecipientMasked { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string BodySummary { get; private set; } = string.Empty;
    public string Status { get; private set; } = StatusPending;
    public string Provider { get; private set; } = "resend";
    public string? ProviderMessageId { get; private set; }
    public int RetryCount { get; private set; }
    public DateTime? NextRetryAtUtc { get; private set; }
    public string? LastError { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime? SentAtUtc { get; private set; }
    public DateTime? DeliveredAtUtc { get; private set; }

    private NotificationDelivery() { }

    public static NotificationDelivery Create(
        string template,
        string recipientEmail,
        string subject,
        string bodySummary,
        DateTime nowUtc,
        string? correlationId = null)
    {
        if (string.IsNullOrWhiteSpace(template))
            throw new DomainException("La plantilla de notificación es obligatoria.");

        if (string.IsNullOrWhiteSpace(recipientEmail) || !recipientEmail.Contains('@'))
            throw new DomainException("El correo destinatario no es válido.");

        var normalizedEmail = recipientEmail.Trim().ToLowerInvariant();
        return new NotificationDelivery
        {
            Template = template.Trim().ToLowerInvariant(),
            RecipientEmail = normalizedEmail,
            RecipientMasked = MaskEmail(normalizedEmail),
            Subject = string.IsNullOrWhiteSpace(subject) ? template.Trim() : subject.Trim(),
            BodySummary = (bodySummary ?? string.Empty).Trim(),
            Status = StatusPending,
            Provider = "resend",
            RetryCount = 0,
            NextRetryAtUtc = nowUtc,
            CorrelationId = correlationId,
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };
    }

    public void MarkSent(string provider, string providerMessageId, DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(providerMessageId))
            throw new DomainException("El identificador de mensaje del proveedor es obligatorio.");

        Provider = string.IsNullOrWhiteSpace(provider) ? "resend" : provider.Trim().ToLowerInvariant();
        ProviderMessageId = providerMessageId.Trim();
        Status = StatusSent;
        SentAtUtc = nowUtc;
        NextRetryAtUtc = null;
        LastError = null;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkDelivered(DateTime nowUtc)
    {
        Status = StatusDelivered;
        DeliveredAtUtc = nowUtc;
        NextRetryAtUtc = null;
        LastError = null;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkBounced(string detail, DateTime nowUtc)
    {
        Status = StatusBounced;
        LastError = string.IsNullOrWhiteSpace(detail) ? "Correo rebotado por el servidor destinatario." : detail.Trim();
        NextRetryAtUtc = null;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkFailed(string detail, DateTime nowUtc, DateTime? nextRetryAtUtc = null)
    {
        RetryCount++;
        LastError = string.IsNullOrWhiteSpace(detail) ? "Fallo temporal al enviar correo." : detail.Trim();
        NextRetryAtUtc = nextRetryAtUtc;
        Status = nextRetryAtUtc.HasValue ? StatusPending : StatusFailed;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "***";
        }

        var parts = email.Trim().Split('@');
        if (parts.Length != 2)
        {
            return "***";
        }

        var local = parts[0];
        var domain = parts[1];
        var visible = local.Length <= 2 ? local[..1] : local[..2];
        return $"{visible}***@{domain}";
    }
}
