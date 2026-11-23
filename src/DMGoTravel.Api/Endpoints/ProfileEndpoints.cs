using System.Text.Json;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Profile.ConfirmEmailChange;
using DMGoTravel.Application.Features.Profile.GetProfile;
using DMGoTravel.Application.Features.Profile.RequestClosure;
using DMGoTravel.Application.Features.Profile.RequestEmailChange;
using DMGoTravel.Application.Features.Profile.UpdateProfile;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/profile")
            .WithTags("Profile");

        group.MapGet("/", async (
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetProfileQuery(), cancellationToken);
            httpContext.Response.Headers.ETag = $"\"v{result.Version}\"";
            return Results.Ok(result.Profile);
        })
        .RequireAuthorization();

        group.MapPut("/", async (
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (hasFullName, fullName, hasPhone, phone) = await ParseProfileUpdateAsync(httpContext, cancellationToken);
            var expectedVersion = ParseIfMatchVersion(httpContext);

            var result = await mediator.Send(
                new UpdateProfileCommand(hasFullName, fullName, hasPhone, phone, expectedVersion),
                cancellationToken);

            httpContext.Response.Headers.ETag = $"\"v{result.Version}\"";
            return Results.Ok(result.Profile);
        })
        .RequireAuthorization();

        group.MapPost("/email-change", async (
            EmailChangeRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new RequestEmailChangeCommand(
                    request.NewEmail ?? string.Empty,
                    request.CurrentPassword,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Accepted(value: result);
        })
        .RequireAuthorization();

        group.MapPost("/email-change/confirm", async (
            EmailChangeConfirmRequestBody request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ConfirmEmailChangeCommand(request.Token ?? string.Empty),
                cancellationToken);

            return Results.Ok(result);
        })
        .AllowAnonymous();

        group.MapPost("/closure", async (
            ClosureRequestBody request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new RequestAccountClosureCommand(
                    request.Confirm,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Ok(result);
        })
        .RequireAuthorization();

        return app;
    }

    private static async Task<(bool HasFullName, string? FullName, bool HasPhone, string? Phone)> ParseProfileUpdateAsync(
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        JsonDocument document;
        try
        {
            document = await JsonDocument.ParseAsync(httpContext.Request.Body, cancellationToken: cancellationToken);
        }
        catch (JsonException)
        {
            throw new ValidationAppException([new FieldError("body", "El cuerpo JSON no es válido.", "invalid_json")]);
        }

        using (document)
        {
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new ValidationAppException([new FieldError("body", "Se esperaba un objeto JSON.", "invalid_schema")]);
            }

            bool hasFullName = false;
            string? fullName = null;
            bool hasPhone = false;
            string? phone = null;
            var errors = new List<FieldError>();

            foreach (var property in document.RootElement.EnumerateObject())
            {
                switch (property.Name)
                {
                    case "fullName":
                        hasFullName = true;
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            fullName = property.Value.GetString();
                        }
                        else
                        {
                            errors.Add(new FieldError("fullName", "El nombre completo debe ser texto.", "invalid_type"));
                        }
                        break;

                    case "phone":
                        hasPhone = true;
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            phone = property.Value.GetString();
                        }
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                        {
                            phone = null;
                        }
                        else
                        {
                            errors.Add(new FieldError("phone", "El teléfono debe ser texto o nulo.", "invalid_type"));
                        }
                        break;

                    default:
                        errors.Add(new FieldError(property.Name, "Campo no autorizado en la actualización de perfil.", "unexpected_field"));
                        break;
                }
            }

            if (errors.Count > 0)
            {
                throw new ValidationAppException(errors);
            }

            return (hasFullName, fullName, hasPhone, phone);
        }
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

    public sealed record EmailChangeRequestBody(string? NewEmail, string? CurrentPassword);
    public sealed record EmailChangeConfirmRequestBody(string? Token);
    public sealed record ClosureRequestBody(bool Confirm);
}
