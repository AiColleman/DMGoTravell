using System.Globalization;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Hotels.Admin;
using DMGoTravel.Application.Features.Hotels.Public;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class HotelEndpoints
{
    public static IEndpointRouteBuilder MapHotelEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/hotels", async (IMediator mediator, CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new ListPublicHotelsQuery(), cancellationToken);
            return Results.Ok(response);
        })
        .WithTags("Hotels")
        .AllowAnonymous();

        app.MapGet("/api/v1/hotels/{id:guid}", async (Guid id, IMediator mediator, CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new GetPublicHotelQuery(id), cancellationToken);
            return Results.Ok(response);
        })
        .WithTags("Hotels")
        .AllowAnonymous();

        app.MapGet("/api/v1/departures/{departureId:guid}/lodging", async (
            Guid departureId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new ListLodgingByDepartureQuery(departureId), cancellationToken);
            return Results.Ok(response);
        })
        .WithTags("Hotels")
        .AllowAnonymous();

        var admin = app.MapGroup("/api/v1/admin/hotels")
            .WithTags("AdminHotels")
            .RequireAuthorization();

        admin.MapGet("/", async (string? page, string? pageSize, IMediator mediator, CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new ListAdminHotelsQuery(Pagination.ParsePage(page), ParsePageSize(pageSize)),
                cancellationToken);
            return Results.Ok(response);
        });

        admin.MapPost("/", async (
            HotelRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateAdminHotelCommand(
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    request.Services ?? [],
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Created($"/api/v1/admin/hotels/{response.Id}", response);
        });

        admin.MapPut("/{id:guid}", async (
            Guid id,
            HotelRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminHotelCommand(
                    id,
                    request.Name ?? string.Empty,
                    request.Description ?? string.Empty,
                    request.Services ?? [],
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
                new ActivateAdminHotelCommand(id, ParseIfMatchVersion(httpContext)),
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
                new DeactivateAdminHotelCommand(id, ParseIfMatchVersion(httpContext)),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        admin.MapPost("/{id:guid}/room-types", async (
            Guid id,
            RoomTypeRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateAdminRoomTypeCommand(
                    id,
                    request.Name ?? string.Empty,
                    request.Capacity,
                    ParseMoney(request.BasePrice, "basePrice"),
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Created($"/api/v1/admin/hotels/{id}/room-types/{response.Id}", response);
        });

        admin.MapPut("/{id:guid}/room-types/{roomTypeId:guid}", async (
            Guid id,
            Guid roomTypeId,
            RoomTypeRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateAdminRoomTypeCommand(
                    id,
                    roomTypeId,
                    request.Name ?? string.Empty,
                    request.Capacity,
                    ParseMoney(request.BasePrice, "basePrice"),
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            return Results.Ok(response);
        });

        app.MapPut("/api/v1/admin/room-types/{id:guid}/inventory", async (
            Guid id,
            InventoryRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateRoomInventoryCommand(
                    id,
                    ParseDate(request.Date, "date"),
                    request.Quantity,
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            return Results.Ok(response);
        })
        .WithTags("AdminHotels")
        .RequireAuthorization();

        app.MapPost("/api/v1/admin/lodging-proposals", async (
            LodgingProposalRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new CreateLodgingProposalCommand(
                    request.DepartureId,
                    request.HotelId,
                    request.StartDate,
                    request.EndDate,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Created($"/api/v1/admin/lodging-proposals/{response.Id}", response);
        })
        .WithTags("AdminHotels")
        .RequireAuthorization();

        app.MapPut("/api/v1/admin/lodging-proposals/{id:guid}", async (
            Guid id,
            LodgingProposalRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(
                new UpdateLodgingProposalCommand(
                    id,
                    request.DepartureId,
                    request.HotelId,
                    request.StartDate,
                    request.EndDate,
                    ParseIfMatchVersion(httpContext)),
                cancellationToken);

            return Results.Ok(response);
        })
        .WithTags("AdminHotels")
        .RequireAuthorization();

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

    private static DateOnly ParseDate(string? raw, string field)
    {
        if (!string.IsNullOrWhiteSpace(raw) &&
            DateOnly.TryParseExact(raw.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return date;
        }

        throw new ValidationAppException([new FieldError(field, "La fecha debe tener formato YYYY-MM-DD.", "invalid_date")]);
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

    public sealed record HotelRequestBody(string? Name, string? Description, IReadOnlyList<string>? Services);
    public sealed record RoomTypeRequestBody(string? Name, int Capacity, string? BasePrice);
    public sealed record InventoryRequestBody(string? Date, int Quantity);
    public sealed record LodgingProposalRequestBody(Guid DepartureId, Guid HotelId, DateTime StartDate, DateTime EndDate);
}
