using DMGoTravel.Domain.Modules.Notifications;

namespace DMGoTravel.Application.Features.Notifications;

public sealed record NotificationIncidentDto(
    Guid Id,
    string Type,
    string Status,
    DateTime CreatedAt,
    Guid DeliveryId,
    string RecipientMasked,
    string Detail);

public sealed record NotificationIncidentPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasMore,
    IReadOnlyList<NotificationIncidentDto> Items);

public static class NotificationMapper
{
    public static NotificationIncidentDto ToDto(NotificationIncident incident) =>
        new(
            incident.PublicId,
            incident.Type,
            incident.Status,
            DateTime.SpecifyKind(incident.CreatedAtUtc, DateTimeKind.Utc),
            incident.DeliveryPublicId,
            incident.RecipientMasked,
            incident.Detail);
}
