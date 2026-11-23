using System.Globalization;
using System.Text;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Exports.DownloadExport;
using DMGoTravel.Application.Features.Exports.GetExport;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AdminExportEndpoints
{
    public static IEndpointRouteBuilder MapAdminExportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/exports")
            .WithTags("AdminExports")
            .RequireAuthorization();

        group.MapPost("/clients", async (
            ExportClientsRequest? request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = ExportClientsRequestMapper.ToCommand(
                request,
                IdempotencyHeader.Read(httpContext));
            var result = await mediator.Send(command, cancellationToken);

            return Results.Json(result, statusCode: StatusCodes.Status202Accepted);
        });

        group.MapPost("/audit", async (
            ExportAuditRequest? request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = ExportAuditRequestMapper.ToCommand(
                request,
                IdempotencyHeader.Read(httpContext));
            var result = await mediator.Send(command, cancellationToken);

            return Results.Json(result, statusCode: StatusCodes.Status202Accepted);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetExportQuery(id), cancellationToken);
            httpContext.Response.Headers.CacheControl = "private, no-store";
            return Results.Ok(result);
        });

        group.MapGet("/{id:guid}/download", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new DownloadExportQuery(id),
                cancellationToken);

            httpContext.Response.Headers.CacheControl = "private, no-store";
            httpContext.Response.Headers["X-Content-Type-Options"] = "nosniff";
            httpContext.Response.Headers["X-Export-Reference-At"] =
                result.ReferenceAtUtc.ToString("O", CultureInfo.InvariantCulture);

            return Results.File(
                Encoding.UTF8.GetBytes(result.Content),
                "text/csv; charset=utf-8",
                result.FileName);
        });

        return app;
    }
}
