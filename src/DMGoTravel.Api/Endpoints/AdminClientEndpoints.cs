using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Clients.GetClient;
using DMGoTravel.Application.Features.Clients.ListClients;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AdminClientEndpoints
{
    public static IEndpointRouteBuilder MapAdminClientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/clients")
            .WithTags("AdminClients")
            .RequireAuthorization();

        group.MapGet("/", async (
            string? page,
            string? pageSize,
            string? name,
            string? email,
            string? id,
            string? status,
            string? registeredFrom,
            string? registeredTo,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new ListClientsQuery(
                Pagination.ParsePage(page),
                ClientQueryParameters.ParsePageSize(pageSize),
                ClientQueryParameters.NormalizeText(name),
                ClientQueryParameters.NormalizeText(email),
                ClientQueryParameters.ParseId(id),
                ClientQueryParameters.ParseStatus(status),
                ClientQueryParameters.ParseDate(registeredFrom, "registeredFrom"),
                ClientQueryParameters.ParseDate(registeredTo, "registeredTo"));

            var response = await mediator.Send(query, cancellationToken);
            return Results.Ok(response);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new GetClientQuery(id), cancellationToken);
            return Results.Ok(response);
        });

        return app;
    }
}
