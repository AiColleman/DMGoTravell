using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Reservations.CancelReservation;
using DMGoTravel.Application.Features.Reservations.CreateReservation;
using DMGoTravel.Application.Features.Reservations.GetReservation;
using DMGoTravel.Application.Features.Reservations.ListReservations;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class ReservationEndpoints
{
    public static IEndpointRouteBuilder MapReservationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/reservations")
            .WithTags("Reservations")
            .RequireAuthorization();

        group.MapPost("/", async (
            CreateReservationRequest request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new CreateReservationCommand(
                    request.DepartureId,
                    request.Travelers,
                    IdempotencyHeader.Read(httpContext),
                    request.Lodging?.ProposalId,
                    request.Lodging?.RoomTypeId),
                cancellationToken);

            return Results.Created($"/api/v1/reservations/{result.Id}", result);
        });

        group.MapGet("/", async (
            string? page,
            int? pageSize,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ListReservationsQuery(Pagination.ParsePage(page), pageSize ?? 10),
                cancellationToken);

            return Results.Ok(result);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetReservationQuery(id), cancellationToken);
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            CancelReservationRequest request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new CancelReservationCommand(
                    id,
                    IdempotencyHeader.Read(httpContext),
                    request.Version),
                cancellationToken);

            return Results.Ok(result);
        });

        return app;
    }
}
