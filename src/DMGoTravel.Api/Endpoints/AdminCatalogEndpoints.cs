using System.Globalization;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.AdminCatalog;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AdminCatalogEndpoints
{
    public static IEndpointRouteBuilder MapAdminCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/catalog/{type}")
            .WithTags("AdminCatalog")
            .RequireAuthorization();

        group.MapGet("/", async (
            string type,
            string? page,
            string? pageSize,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new ListAdminCatalogQuery(type, Pagination.ParsePage(page), ParsePageSize(pageSize)),
                cancellationToken);
            return Results.Ok(response);
        });

        group.MapPost("/", async (
            string type,
            CatalogOfferRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateAdminOfferCommand(
                    type,
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    ParseMoney(request.Price, "price"),
                    request.DurationDays,
                    request.Conditions ?? [],
                    (request.Itinerary ?? []).Select(i => new ItineraryDayInput(i.Day, i.Title ?? string.Empty, i.Description ?? string.Empty)).ToList(),
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Created($"/api/v1/admin/catalog/{type}/{response.Id}", response);
        });

        group.MapPut("/{id:guid}", async (
            string type,
            Guid id,
            CatalogOfferRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminOfferCommand(
                    type,
                    id,
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    ParseMoney(request.Price, "price"),
                    request.DurationDays,
                    request.Conditions ?? [],
                    request.Itinerary?.Select(i => new ItineraryDayInput(i.Day, i.Title ?? string.Empty, i.Description ?? string.Empty)).ToList(),
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPost("/{id:guid}/activate", async (
            string type,
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new ActivateAdminOfferCommand(type, id, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPost("/{id:guid}/deactivate", async (
            string type,
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new DeactivateAdminOfferCommand(type, id, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPut("/{id:guid}/pricing", async (
            string type,
            Guid id,
            PricingRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminOfferPricingCommand(
                    type,
                    id,
                    ParseMoney(request.NormalPrice, "normalPrice"),
                    ParseOptionalMoney(request.DiscountedPrice, "discountedPrice"),
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPut("/{id:guid}/itinerary", async (
            string type,
            Guid id,
            ItineraryRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var items = (request.Items ?? [])
                .Select(i => new ItineraryDayInput(i.Day, i.Title ?? string.Empty, i.Description ?? string.Empty))
                .ToList();

            var response = await mediator.Send(
                new UpdateAdminOfferItineraryCommand(type, id, items, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPost("/{id:guid}/departures", async (
            string type,
            Guid id,
            DepartureRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateAdminDepartureCommand(
                    type,
                    id,
                    request.StartDate,
                    request.EndDate,
                    ParseMoney(request.Price, "price"),
                    request.Capacity,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Created($"/api/v1/admin/catalog/{type}/{id}/departures/{response.Id}", response);
        });

        group.MapPut("/{id:guid}/departures/{departureId:guid}", async (
            string type,
            Guid id,
            Guid departureId,
            DepartureRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminDepartureCommand(
                    type,
                    id,
                    departureId,
                    request.StartDate,
                    request.EndDate,
                    ParseMoney(request.Price, "price"),
                    request.Capacity,
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            return Results.Ok(response);
        });

        group.MapPut("/{id:guid}/departures/{departureId:guid}/pricing", async (
            string type,
            Guid id,
            Guid departureId,
            PricingRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminDeparturePricingCommand(
                    type,
                    id,
                    departureId,
                    ParseMoney(request.NormalPrice, "normalPrice"),
                    ParseOptionalMoney(request.DiscountedPrice, "discountedPrice"),
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

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

    private static decimal ParseMoney(string? raw, string field)
    {
        if (!string.IsNullOrWhiteSpace(raw) &&
            decimal.TryParse(raw.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        {
            return value;
        }

        throw new ValidationAppException([new FieldError(field, "El monto debe ser un número decimal válido.", "invalid_amount")]);
    }

    private static decimal? ParseOptionalMoney(string? raw, string field) =>
        string.IsNullOrWhiteSpace(raw) ? null : ParseMoney(raw, field);

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

    public sealed record ItineraryItemBody(int Day, string? Title, string? Description);
    public sealed record CatalogOfferRequestBody(
        string? Name,
        string? Description,
        string? Price,
        int DurationDays,
        IReadOnlyList<string>? Conditions,
        IReadOnlyList<ItineraryItemBody>? Itinerary);
    public sealed record PricingRequestBody(string? NormalPrice, string? DiscountedPrice);
    public sealed record ItineraryRequestBody(IReadOnlyList<ItineraryItemBody>? Items);
    public sealed record DepartureRequestBody(DateTime StartDate, DateTime EndDate, string? Price, int Capacity);
}
