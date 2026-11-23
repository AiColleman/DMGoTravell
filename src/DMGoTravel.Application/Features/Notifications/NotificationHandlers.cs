using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Notifications;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Notifications;

public sealed record ListNotificationIncidentsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Status = null) : IRequest<NotificationIncidentPageDto>;

public sealed class ListNotificationIncidentsQueryValidator : AbstractValidator<ListNotificationIncidentsQuery>
{
    public ListNotificationIncidentsQueryValidator()
    {
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
        RuleFor(q => q.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) ||
                       s.Trim().ToLowerInvariant() is NotificationIncident.StatusOpen or NotificationIncident.StatusResolved)
            .WithMessage("El estado de incidente no es válido.");
    }
}

public sealed class ListNotificationIncidentsQueryHandler
    : IRequestHandler<ListNotificationIncidentsQuery, NotificationIncidentPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly INotificationRepository _notifications;

    public ListNotificationIncidentsQueryHandler(
        IAdminAccessGuard adminAccess,
        INotificationRepository notifications)
    {
        _adminAccess = adminAccess;
        _notifications = notifications;
    }

    public async Task<NotificationIncidentPageDto> Handle(
        ListNotificationIncidentsQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var page = await _notifications.ListIncidentsAsync(
            request.Page,
            request.PageSize,
            request.Status?.Trim().ToLowerInvariant(),
            cancellationToken);

        return new NotificationIncidentPageDto(
            page.Page,
            page.PageSize,
            page.Total,
            (long)page.Page * page.PageSize < page.Total,
            page.Items.Select(NotificationMapper.ToDto).ToList());
    }
}

public sealed record GetNotificationIncidentQuery(Guid Id) : IRequest<NotificationIncidentDto>;

public sealed class GetNotificationIncidentQueryHandler
    : IRequestHandler<GetNotificationIncidentQuery, NotificationIncidentDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly INotificationRepository _notifications;

    public GetNotificationIncidentQueryHandler(
        IAdminAccessGuard adminAccess,
        INotificationRepository notifications)
    {
        _adminAccess = adminAccess;
        _notifications = notifications;
    }

    public async Task<NotificationIncidentDto> Handle(
        GetNotificationIncidentQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var incident = await _notifications.GetIncidentByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El incidente de notificación no existe.");
        return NotificationMapper.ToDto(incident);
    }
}

public sealed record ResendNotificationDeliveryCommand(
    Guid DeliveryId,
    string? Reason,
    string IdempotencyKey,
    long? Version = null) : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.notifications.resend";
    public string GetRequestFingerprint() =>
        $"{DeliveryId:N}|{(Reason ?? string.Empty).Trim()}|{Version?.ToString() ?? "-"}";
}

public sealed class ResendNotificationDeliveryCommandValidator : AbstractValidator<ResendNotificationDeliveryCommand>
{
    public ResendNotificationDeliveryCommandValidator()
    {
        RuleFor(c => c.DeliveryId).NotEmpty();
        RuleFor(c => c.Reason).MaximumLength(2000).When(c => c.Reason is not null);
        RuleFor(c => c.Version).GreaterThanOrEqualTo(1).When(c => c.Version.HasValue);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class ResendNotificationDeliveryCommandHandler
    : IRequestHandler<ResendNotificationDeliveryCommand, OperationAcceptedDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly INotificationRepository _notifications;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ResendNotificationDeliveryCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        INotificationRepository notifications,
        IEmailSender emailSender,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _notifications = notifications;
        _emailSender = emailSender;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationAcceptedDto> Handle(
        ResendNotificationDeliveryCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var original = await _notifications.GetDeliveryByPublicIdAsync(request.DeliveryId, cancellationToken)
            ?? throw new NotFoundAppException("La entrega de notificación no existe.");

        if (request.Version.HasValue && request.Version.Value != original.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var now = _clock.UtcNow;
        var resent = NotificationDelivery.Create(
            original.Template,
            original.RecipientEmail,
            original.Subject,
            original.BodySummary,
            now,
            original.CorrelationId);

        var sendResult = await _emailSender.SendAsync(
            new EmailSendRequest(
                resent.RecipientEmail,
                resent.Subject,
                resent.BodySummary,
                resent.Template,
                request.IdempotencyKey),
            cancellationToken);

        if (sendResult.Sent && !string.IsNullOrWhiteSpace(sendResult.ProviderMessageId))
        {
            resent.MarkSent(sendResult.Provider, sendResult.ProviderMessageId, _clock.UtcNow);
            var openIncidents = await _notifications.GetOpenIncidentsByDeliveryIdAsync(original.Id, cancellationToken);
            foreach (var incident in openIncidents)
            {
                incident.Resolve(admin.Id, now);
            }
        }
        else
        {
            resent.MarkFailed(sendResult.Error ?? "Error al reenviar correo.", _clock.UtcNow, now.AddMinutes(5));
        }

        await _notifications.AddDeliveryAsync(resent, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminNotificationResend,
            AuditActions.AdminNotificationResend,
            AuditActions.ActorHuman,
            admin.Id,
            "notification_delivery",
            resent.PublicId.ToString(),
            sendResult.Sent ? AuditActions.Success : AuditActions.Failure,
            JsonSerializer.Serialize(new
            {
                provider = sendResult.Provider,
                providerReference = sendResult.ProviderMessageId
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationAcceptedDto(
            resent.PublicId,
            "accepted",
            DateTime.SpecifyKind(now, DateTimeKind.Utc),
            DateTime.SpecifyKind(now.AddHours(24), DateTimeKind.Utc));
    }
}

public sealed record DispatchPendingNotificationsCommand(int BatchSize = 25) : IRequest<int>;

public sealed class DispatchPendingNotificationsCommandHandler
    : IRequestHandler<DispatchPendingNotificationsCommand, int>
{
    private const int MaxRetries = 3;

    private readonly INotificationRepository _notifications;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;

    public DispatchPendingNotificationsCommandHandler(
        INotificationRepository notifications,
        IEmailSender emailSender,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork)
    {
        _notifications = notifications;
        _emailSender = emailSender;
        _clock = clock;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(DispatchPendingNotificationsCommand request, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var due = await _notifications.ListDuePendingDeliveriesAsync(now, request.BatchSize, cancellationToken);
        if (due.Count == 0)
        {
            return 0;
        }

        var processed = 0;
        foreach (var delivery in due)
        {
            var result = await _emailSender.SendAsync(
                new EmailSendRequest(
                    delivery.RecipientEmail,
                    delivery.Subject,
                    delivery.BodySummary,
                    delivery.Template,
                    delivery.PublicId.ToString("N")),
                cancellationToken);

            if (result.Sent && !string.IsNullOrWhiteSpace(result.ProviderMessageId))
            {
                delivery.MarkSent(result.Provider, result.ProviderMessageId, _clock.UtcNow);
            }
            else
            {
                var nextRetry = delivery.RetryCount + 1 >= MaxRetries
                    ? (DateTime?)null
                    : _clock.UtcNow.AddMinutes(Math.Pow(2, delivery.RetryCount + 1));

                var detail = result.Error ?? "Error al entregar notificación por correo.";
                delivery.MarkFailed(detail, _clock.UtcNow, nextRetry);

                if (!nextRetry.HasValue)
                {
                    await _notifications.AddIncidentAsync(
                        NotificationIncident.Open(
                            delivery.Id,
                            delivery.PublicId,
                            NotificationIncident.TypeDeliveryFailed,
                            delivery.RecipientMasked,
                            detail,
                            _clock.UtcNow),
                        cancellationToken);
                }
            }

            processed++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return processed;
    }
}
