using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Notifications;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public sealed record NotificationResendRequestBody(string? Reason = null, long? Version = null);

public static class AdminNotificationEndpoints
{
    public static IEndpointRouteBuilder MapAdminNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var incidents = app.MapGroup("/api/v1/admin/notification-incidents")
            .WithTags("AdminNotifications")
            .RequireAuthorization();

        incidents.MapGet("/", async (
            int? page,
            int? pageSize,
            string? status,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ListNotificationIncidentsQuery(page ?? 1, pageSize ?? 10, status),
                cancellationToken);
            return Results.Ok(result);
        });

        incidents.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetNotificationIncidentQuery(id), cancellationToken);
            return Results.Ok(result);
        });

        var deliveries = app.MapGroup("/api/v1/admin/notification-deliveries")
            .WithTags("AdminNotifications")
            .RequireAuthorization();

        deliveries.MapPost("/{id:guid}/resend", async (
            Guid id,
            NotificationResendRequestBody? body,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ResendNotificationDeliveryCommand(
                    id,
                    body?.Reason,
                    IdempotencyHeader.Read(httpContext),
                    body?.Version),
                cancellationToken);
            return Results.Accepted($"/api/v1/admin/notification-deliveries/{result.Id}", result);
        });

        return app;
    }
}
