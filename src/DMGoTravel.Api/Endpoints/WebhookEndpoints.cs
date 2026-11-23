using System.Globalization;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Features.Webhooks;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class WebhookEndpoints
{
    public static IEndpointRouteBuilder MapWebhookEndpoints(this IEndpointRouteBuilder app)
    {
        var webhooks = app.MapGroup("/api/v1/webhooks")
            .WithTags("Webhooks")
            .AllowAnonymous();

        webhooks.MapPost("/culqi", async (
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var rawBody = await ReadRawBodyAsync(httpContext.Request, cancellationToken);
            var signature = httpContext.Request.Headers["X-Provider-Signature"].FirstOrDefault();

            string? eventId = null;
            string? eventType = null;
            string? reference = null;
            decimal? amount = null;
            string? currency = null;

            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                try
                {
                    using var doc = JsonDocument.Parse(rawBody);
                    var root = doc.RootElement;
                    eventId = TryGetString(root, "id");
                    eventType = TryGetString(root, "type");
                    if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
                    {
                        reference = TryGetString(data, "reference") ?? TryGetString(data, "id");
                        currency = TryGetString(data, "currency");
                        amount = TryGetDecimal(data, "amount");
                    }
                }
                catch (JsonException)
                {
                    // La firma y validación de esquema se evalúan en el handler.
                }
            }

            var result = await mediator.Send(
                new ProcessCulqiWebhookCommand(
                    rawBody,
                    signature,
                    eventId,
                    eventType,
                    reference,
                    amount,
                    currency),
                cancellationToken);

            return Results.Ok(result);
        });

        webhooks.MapPost("/resend", async (
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var rawBody = await ReadRawBodyAsync(httpContext.Request, cancellationToken);
            var svixId = httpContext.Request.Headers["Svix-Id"].FirstOrDefault();
            var svixTimestamp = httpContext.Request.Headers["Svix-Timestamp"].FirstOrDefault();
            var svixSignature = httpContext.Request.Headers["Svix-Signature"].FirstOrDefault();

            string? eventId = null;
            string? eventType = null;
            string? emailId = null;
            string? detail = null;

            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                try
                {
                    using var doc = JsonDocument.Parse(rawBody);
                    var root = doc.RootElement;
                    eventId = TryGetString(root, "id");
                    eventType = TryGetString(root, "type");
                    if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
                    {
                        emailId = TryGetString(data, "email_id") ?? TryGetString(data, "id");
                        detail = TryGetString(data, "reason");
                        if (string.IsNullOrWhiteSpace(detail) &&
                            data.TryGetProperty("bounce", out var bounce) &&
                            bounce.ValueKind == JsonValueKind.Object)
                        {
                            detail = TryGetString(bounce, "message") ?? TryGetString(bounce, "type");
                        }
                    }
                }
                catch (JsonException)
                {
                    // La firma y validación de esquema se evalúan en el handler.
                }
            }

            var result = await mediator.Send(
                new ProcessResendWebhookCommand(
                    rawBody,
                    svixId,
                    svixTimestamp,
                    svixSignature,
                    eventId,
                    eventType,
                    emailId,
                    detail),
                cancellationToken);

            return Results.Ok(result);
        });

        return app;
    }

    private static async Task<string> ReadRawBodyAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        return await reader.ReadToEndAsync(cancellationToken);
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    private static decimal? TryGetDecimal(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var numeric))
        {
            return numeric;
        }

        if (value.ValueKind == JsonValueKind.String &&
            decimal.TryParse(value.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }

        return null;
    }
}
