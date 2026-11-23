using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Notifications;

/// <summary>
/// Incidente operativo de notificación visible para el administrador con destinatario enmascarado (Spec 004).
/// </summary>
public class NotificationIncident : Entity<long>
{
    public const string StatusOpen = "open";
    public const string StatusResolved = "resolved";

    public const string TypeBounced = "bounced";
    public const string TypeDeliveryFailed = "delivery_failed";
    public const string TypeDeliveryDelayed = "delivery_delayed";

    public long DeliveryId { get; private set; }
    public Guid DeliveryPublicId { get; private set; }
    public string Type { get; private set; } = TypeDeliveryFailed;
    public string Status { get; private set; } = StatusOpen;
    public string RecipientMasked { get; private set; } = string.Empty;
    public string Detail { get; private set; } = string.Empty;
    public DateTime? ResolvedAtUtc { get; private set; }
    public long? ResolvedByAdminId { get; private set; }

    private NotificationIncident() { }

    public static NotificationIncident Open(
        long deliveryId,
        Guid deliveryPublicId,
        string type,
        string recipientMasked,
        string detail,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new DomainException("El tipo de incidente es obligatorio.");

        return new NotificationIncident
        {
            DeliveryId = deliveryId,
            DeliveryPublicId = deliveryPublicId,
            Type = type.Trim().ToLowerInvariant(),
            Status = StatusOpen,
            RecipientMasked = string.IsNullOrWhiteSpace(recipientMasked) ? "***" : recipientMasked.Trim(),
            Detail = string.IsNullOrWhiteSpace(detail) ? "Incidencia de entrega de correo." : detail.Trim(),
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };
    }

    public void Resolve(long adminId, DateTime nowUtc)
    {
        if (Status == StatusResolved)
        {
            return;
        }

        Status = StatusResolved;
        ResolvedByAdminId = adminId;
        ResolvedAtUtc = nowUtc;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }
}
