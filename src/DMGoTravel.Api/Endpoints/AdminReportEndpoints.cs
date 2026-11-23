using System.Globalization;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Reports;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AdminReportEndpoints
{
    public static IEndpointRouteBuilder MapAdminReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/reports")
            .WithTags("AdminReports")
            .RequireAuthorization();

        group.MapPost("/", async (
            ReportCreateRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var filters = request.Filters ?? new ReportFiltersBody(null, null, null, null, null);
            var from = ParseRequiredDate(filters.From, "from");
            var to = ParseRequiredDate(filters.To, "to");
            if (from > to)
            {
                throw new InvalidRangeAppException("El rango de fechas del reporte está invertido.");
            }

            var result = await mediator.Send(
                new CreateAdminReportCommand(
                    from,
                    to,
                    filters.OfferId,
                    filters.HotelId,
                    string.IsNullOrWhiteSpace(filters.Status) ? null : filters.Status.Trim(),
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Json(result, statusCode: StatusCodes.Status202Accepted);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetAdminReportQuery(id), cancellationToken);
            httpContext.Response.Headers.CacheControl = "private, no-store";
            return Results.Ok(result);
        });

        group.MapGet("/{id:guid}/rows", async (
            Guid id,
            string? page,
            string? pageSize,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new GetAdminReportRowsQuery(id, Pagination.ParsePage(page), ParsePageSize(pageSize)),
                cancellationToken);
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/pdf", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new RequestAdminReportPdfCommand(id, IdempotencyHeader.Read(httpContext)),
                cancellationToken);
            return Results.Json(result, statusCode: StatusCodes.Status202Accepted);
        });

        group.MapGet("/{id:guid}/pdf", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new DownloadAdminReportPdfQuery(id), cancellationToken);
            httpContext.Response.Headers.CacheControl = "private, no-store";
            httpContext.Response.Headers["X-Content-Type-Options"] = "nosniff";
            httpContext.Response.Headers["X-Report-Reference-At"] =
                result.ReferenceAtUtc.ToString("O", CultureInfo.InvariantCulture);

            return Results.File(result.Content, "application/pdf", result.FileName);
        });

        return app;
    }

    private static DateOnly ParseRequiredDate(string? raw, string field)
    {
        if (!string.IsNullOrWhiteSpace(raw) &&
            DateOnly.TryParseExact(raw.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return parsed;
        }

        throw new InvalidRangeAppException($"La fecha '{field}' es obligatoria y debe tener formato YYYY-MM-DD.");
    }

    private static int ParsePageSize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return 10;
        if (int.TryParse(raw.Trim(), out var parsed) && parsed >= 1 && parsed <= 100) return parsed;
        throw new InvalidFilterAppException("El tamaño de página debe estar entre 1 y 100.");
    }

    public sealed record ReportFiltersBody(string? From, string? To, Guid? OfferId, Guid? HotelId, string? Status);
    public sealed record ReportCreateRequestBody(ReportFiltersBody? Filters);
}
