using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Mobility.Admin;
using DMGoTravel.Application.Features.Mobility.ListPublicMobility;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class MobilityEndpoints
{
    public static IEndpointRouteBuilder MapMobilityEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/mobility", async (IMediator mediator, CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new ListPublicMobilityQuery(), cancellationToken);
            return Results.Ok(response);
        })
        .WithTags("Mobility")
        .AllowAnonymous();

        var admin = app.MapGroup("/api/v1/admin/mobility")
            .WithTags("AdminMobility")
            .RequireAuthorization();

        admin.MapGet("/", async (
            string? page,
            string? pageSize,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new ListAdminMobilityQuery(Pagination.ParsePage(page), ParsePageSize(pageSize)),
                cancellationToken);
            return Results.Ok(response);
        });

        admin.MapPost("/", async (
            MobilityRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateAdminMobilityCommand(
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    request.Type ?? string.Empty,
                    request.Capacity,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Created($"/api/v1/admin/mobility/{response.Id}", response);
        });

        admin.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new GetAdminMobilityQuery(id), cancellationToken);
            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        admin.MapPut("/{id:guid}", async (
            Guid id,
            MobilityRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminMobilityCommand(
                    id,
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    request.Type ?? string.Empty,
                    request.Capacity,
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        admin.MapPost("/{id:guid}/activate", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new ActivateAdminMobilityCommand(id, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        admin.MapPost("/{id:guid}/deactivate", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new DeactivateAdminMobilityCommand(id, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        return app;
    }

    private static int ParsePageSize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return 10;
        if (int.TryParse(raw.Trim(), out var parsed) && parsed >= 1 && parsed <= 100) return parsed;
        throw new InvalidFilterAppException("El tamaño de página debe estar entre 1 y 100.");
    }

    private static long? ParseIfMatchVersion(HttpContext httpContext)
    {
        if (!httpContext.Request.Headers.TryGetValue("If-Match", out var rawValues)) return null;
        var raw = rawValues.ToString().Trim();
        if (string.IsNullOrEmpty(raw)) return null;

        var normalized = raw.Trim('"');
        if (normalized.StartsWith("W/", StringComparison.OrdinalIgnoreCase)) normalized = normalized[2..].Trim('"');
        if (normalized.StartsWith('v') || normalized.StartsWith('V')) normalized = normalized[1..];
        if (long.TryParse(normalized, out var version) && version >= 1) return version;

        throw new ValidationAppException([new FieldError("If-Match", "La cabecera If-Match no tiene un formato de versión válido.", "invalid_etag")]);
    }

    public sealed record MobilityRequestBody(string? Name, string? Description, string? Type, int Capacity);
}
