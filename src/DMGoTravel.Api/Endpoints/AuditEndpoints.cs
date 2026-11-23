using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Audit.GetAudit;
using DMGoTravel.Application.Features.Audit.ListAudit;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/audit")
            .WithTags("AdminAudit")
            .RequireAuthorization();

        group.MapGet("/", async (
            string? page,
            string? pageSize,
            string? from,
            string? to,
            string? actor,
            string? entity,
            string? correlationId,
            string? action,
            string? type,
            string? result,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new ListAuditQuery(
                Pagination.ParsePage(page),
                AuditQueryParameters.ParsePageSize(pageSize),
                AuditQueryParameters.ParseDate(from, "from"),
                AuditQueryParameters.ParseDate(to, "to"),
                AuditQueryParameters.NormalizeActor(actor),
                AuditQueryParameters.NormalizeText(entity),
                AuditQueryParameters.NormalizeText(correlationId),
                AuditQueryParameters.NormalizeText(action),
                AuditQueryParameters.NormalizeText(type),
                AuditQueryParameters.NormalizeResult(result));

            var response = await mediator.Send(query, cancellationToken);
            return Results.Ok(response);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new GetAuditQuery(id), cancellationToken);
            return Results.Ok(response);
        });

        return app;
    }
}
