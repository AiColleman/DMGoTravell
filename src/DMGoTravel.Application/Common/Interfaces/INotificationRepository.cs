using DMGoTravel.Application.Common.Models;
using DMGoTravel.Domain.Modules.Notifications;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record EmailSendRequest(
    string ToEmail,
    string Subject,
    string BodyText,
    string Template,
    string? IdempotencyKey = null,
    string? ActionUrl = null,
    string? ActionLabel = null,
    string? HighlightCode = null);

public sealed record EmailSendResult(
    bool Sent,
    string Provider,
    string? ProviderMessageId,
    string? Error = null);

public interface IEmailSender
{
    string FrontendBaseUrl => "http://localhost:5174";
    Task<EmailSendResult> SendAsync(EmailSendRequest request, CancellationToken cancellationToken = default);
}

public interface INotificationRepository
{
    Task AddDeliveryAsync(NotificationDelivery delivery, CancellationToken cancellationToken = default);
    Task AddIncidentAsync(NotificationIncident incident, CancellationToken cancellationToken = default);
    Task<NotificationDelivery?> GetDeliveryByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<NotificationDelivery?> GetDeliveryByProviderMessageIdAsync(string providerMessageId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationDelivery>> ListDuePendingDeliveriesAsync(DateTime nowUtc, int batchSize, CancellationToken cancellationToken = default);
    Task<NotificationIncident?> GetIncidentByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationIncident>> GetOpenIncidentsByDeliveryIdAsync(long deliveryId, CancellationToken cancellationToken = default);
    Task<PagedResult<NotificationIncident>> ListIncidentsAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
}
