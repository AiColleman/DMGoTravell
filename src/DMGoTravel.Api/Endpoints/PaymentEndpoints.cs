using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Payments.GetPayment;
using DMGoTravel.Application.Features.Payments.StartPayment;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var reservations = app.MapGroup("/api/v1/reservations")
            .WithTags("Payments")
            .RequireAuthorization();

        reservations.MapPost("/{id:guid}/payments", async (
            Guid id,
            StartPaymentRequest request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new StartPaymentCommand(
                    id,
                    request.Method,
                    IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Created($"/api/v1/payments/{result.Payment.Id}", result);
        });

        var payments = app.MapGroup("/api/v1/payments")
            .WithTags("Payments")
            .RequireAuthorization();

        payments.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetPaymentQuery(id), cancellationToken);
            return Results.Ok(result);
        });

        return app;
    }
}
