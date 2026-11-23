using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Payments.Refunds;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public sealed record RefundAuthorizeRequestBody(long? Version = null);

public static class AdminRefundEndpoints
{
    public static IEndpointRouteBuilder MapAdminRefundEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/refund-cases")
            .WithTags("AdminRefunds")
            .RequireAuthorization();

        group.MapGet("/", async (
            int? page,
            int? pageSize,
            string? status,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ListAdminRefundCasesQuery(page ?? 1, pageSize ?? 10, status),
                cancellationToken);
            return Results.Ok(result);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetAdminRefundCaseQuery(id), cancellationToken);
            httpContext.Response.Headers.ETag = $"W/\"{result.Version}\"";
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/authorize", async (
            Guid id,
            RefundAuthorizeRequestBody? body,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var expectedVersion = TryParseIfMatch(httpContext) ?? body?.Version;
            var result = await mediator.Send(
                new AuthorizeAdminRefundCaseCommand(
                    id,
                    IdempotencyHeader.Read(httpContext),
                    expectedVersion),
                cancellationToken);
            httpContext.Response.Headers.ETag = $"W/\"{result.Version}\"";
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/retry", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new RetryAdminRefundCaseCommand(id, IdempotencyHeader.Read(httpContext)),
                cancellationToken);
            return Results.Accepted($"/api/v1/admin/refund-cases/{id}", result);
        });

        return app;
    }

    private static long? TryParseIfMatch(HttpContext httpContext)
    {
        var raw = httpContext.Request.Headers.IfMatch.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var cleaned = raw.Trim();
        if (cleaned.StartsWith("W/", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned[2..];
        }

        cleaned = cleaned.Trim('"');
        return long.TryParse(cleaned, out var version) ? version : null;
    }
}
