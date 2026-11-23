using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Payments.Refunds;
using DMGoTravel.Domain.Modules.Notifications;
using DMGoTravel.Domain.Modules.Payments;
using MediatR;

namespace DMGoTravel.Application.Features.Webhooks;

public sealed record ProcessResendWebhookCommand(
    string RawBody,
    string? SvixId,
    string? SvixTimestamp,
    string? SvixSignature,
    string? EventId,
    string? EventType,
    string? EmailId,
    string? Detail) : IRequest<WebhookAckDto>;

public sealed class ProcessResendWebhookCommandHandler : IRequestHandler<ProcessResendWebhookCommand, WebhookAckDto>
{
    private readonly IWebhookSignatureVerifier _signatureVerifier;
    private readonly IWebhookEventRepository _webhookEvents;
    private readonly INotificationRepository _notifications;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ProcessResendWebhookCommandHandler(
        IWebhookSignatureVerifier signatureVerifier,
        IWebhookEventRepository webhookEvents,
        INotificationRepository notifications,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _signatureVerifier = signatureVerifier;
        _webhookEvents = webhookEvents;
        _notifications = notifications;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<WebhookAckDto> Handle(ProcessResendWebhookCommand request, CancellationToken cancellationToken)
    {
        if (!_signatureVerifier.VerifyResendSignature(
                request.RawBody,
                request.SvixId,
                request.SvixTimestamp,
                request.SvixSignature))
        {
            throw new UnauthorizedAppException("Firma Svix de webhook Resend inválida o ausente.");
        }

        var eventKey = !string.IsNullOrWhiteSpace(request.EventId)
            ? request.EventId.Trim()
            : request.SvixId?.Trim();

        if (string.IsNullOrWhiteSpace(eventKey) || string.IsNullOrWhiteSpace(request.EventType))
        {
            throw new ValidationAppException([
                new FieldError("id", "El evento Resend requiere identificador de evento y 'type'.")
            ]);
        }

        var eventType = request.EventType.Trim().ToLowerInvariant();
        if (await _webhookEvents.ExistsAsync("resend", eventKey, cancellationToken))
        {
            return new WebhookAckDto(Received: true, Duplicate: true);
        }

        var now = _clock.UtcNow;
        await _webhookEvents.AddAsync(ProcessedWebhookEvent.Create("resend", eventKey, eventType, now), cancellationToken);

        var entityType = "webhook_resend";
        var entityId = eventKey;
        var emailId = request.EmailId?.Trim();

        if (!string.IsNullOrWhiteSpace(emailId))
        {
            var delivery = await _notifications.GetDeliveryByProviderMessageIdAsync(emailId, cancellationToken);
            if (delivery is not null)
            {
                entityType = "notification_delivery";
                entityId = delivery.PublicId.ToString();

                if (eventType == "email.delivered")
                {
                    delivery.MarkDelivered(now);
                }
                else if (eventType is "email.bounced" or "email.complained")
                {
                    var detail = string.IsNullOrWhiteSpace(request.Detail)
                        ? "El proveedor reportó rebote o queja en la entrega."
                        : request.Detail.Trim();
                    delivery.MarkBounced(detail, now);
                    await _notifications.AddIncidentAsync(
                        NotificationIncident.Open(
                            delivery.Id,
                            delivery.PublicId,
                            NotificationIncident.TypeBounced,
                            delivery.RecipientMasked,
                            detail,
                            now),
                        cancellationToken);
                }
                else if (eventType == "email.delivery_delayed")
                {
                    var detail = string.IsNullOrWhiteSpace(request.Detail)
                        ? "Entrega retrasada reportada por Resend."
                        : request.Detail.Trim();
                    await _notifications.AddIncidentAsync(
                        NotificationIncident.Open(
                            delivery.Id,
                            delivery.PublicId,
                            NotificationIncident.TypeDeliveryDelayed,
                            delivery.RecipientMasked,
                            detail,
                            now),
                        cancellationToken);
                }
            }
        }

        _audit.Record(new AuditEntry(
            AuditActions.WebhookResendProcessed,
            AuditActions.WebhookResendProcessed,
            AuditActions.ActorSystem,
            null,
            entityType,
            entityId,
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                providerReference = emailId
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new WebhookAckDto(Received: true, Duplicate: false);
    }
}
