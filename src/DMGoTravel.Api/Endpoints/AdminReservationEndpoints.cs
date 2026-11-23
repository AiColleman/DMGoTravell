using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.AdminReservations.CancelAdminReservation;
using DMGoTravel.Application.Features.AdminReservations.CompleteAdminReservation;
using DMGoTravel.Application.Features.AdminReservations.GetAdminReservation;
using DMGoTravel.Application.Features.AdminReservations.ListAdminReservations;
using DMGoTravel.Domain.Modules.Reservations;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AdminReservationEndpoints
{
    public static IEndpointRouteBuilder MapAdminReservationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/reservations")
            .WithTags("AdminReservations")
            .RequireAuthorization();

        group.MapGet("/", async (
            string? page,
            string? pageSize,
            string? status,
            string? tourId,
            string? hotelId,
            string? reservationId,
            string? clientEmail,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new ListAdminReservationsQuery(
                Pagination.ParsePage(page),
                ParsePageSize(pageSize),
                ParseStatus(status),
                ParseOptionalGuid(tourId, "tourId"),
                ParseOptionalGuid(hotelId, "hotelId"),
                ParseOptionalGuid(reservationId, "reservationId"),
                string.IsNullOrWhiteSpace(clientEmail) ? null : clientEmail.Trim());

            var response = await mediator.Send(query, cancellationToken);
            return Results.Ok(response);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var response = await mediator.Send(new GetAdminReservationQuery(id), cancellationToken);
            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            AdminReservationCancelRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var version = request.Version ?? ParseIfMatchVersion(httpContext);
            var response = await mediator.Send(
                new CancelAdminReservationCommand(
                    id,
                    request.Reason ?? string.Empty,
                    IdempotencyHeader.Read(httpContext),
                    version),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        group.MapPost("/{id:guid}/complete", async (
            Guid id,
            AdminReservationCompleteRequestBody? request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var version = request?.Version ?? ParseIfMatchVersion(httpContext);
            var response = await mediator.Send(
                new CompleteAdminReservationCommand(
                    id,
                    IdempotencyHeader.Read(httpContext),
                    version),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{response.Version}\"";
            return Results.Ok(response);
        });

        return app;
    }

    private static int ParsePageSize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return 10;
        }

        if (int.TryParse(raw.Trim(), out var parsed) && parsed >= 1 && parsed <= 100)
        {
            return parsed;
        }

        throw new InvalidFilterAppException("El tamaño de página debe estar entre 1 y 100.");
    }

    private static ReservationStatus? ParseStatus(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim().ToLowerInvariant() switch
        {
            "pending" => ReservationStatus.Pending,
            "confirmed" => ReservationStatus.Confirmed,
            "completed" => ReservationStatus.Completed,
            "cancelled" => ReservationStatus.Cancelled,
            _ => throw new InvalidFilterAppException("El estado de reserva no es válido.")
        };
    }

    private static Guid? ParseOptionalGuid(string? raw, string name)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (Guid.TryParse(raw.Trim(), out var parsed))
        {
            return parsed;
        }

        throw new InvalidFilterAppException($"El parámetro '{name}' debe ser un UUID válido.");
    }

    private static long? ParseIfMatchVersion(HttpContext httpContext)
    {
        if (!httpContext.Request.Headers.TryGetValue("If-Match", out var rawValues))
        {
            return null;
        }

        var raw = rawValues.ToString().Trim();
        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        var normalized = raw.Trim('"');
        if (normalized.StartsWith("W/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[2..].Trim('"');
        }

        if (normalized.StartsWith('v') || normalized.StartsWith('V'))
        {
            normalized = normalized[1..];
        }

        if (long.TryParse(normalized, out var version) && version >= 1)
        {
            return version;
        }

        throw new ValidationAppException([new FieldError("If-Match", "La cabecera If-Match no tiene un formato de versión válido.", "invalid_etag")]);
    }

    public sealed record AdminReservationCancelRequestBody(string? Reason, long? Version);
    public sealed record AdminReservationCompleteRequestBody(long? Version);
}
