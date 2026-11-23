using DMGoTravel.Application.Features.Payments.Dtos;
using DMGoTravel.Domain.Modules.Payments;

namespace DMGoTravel.Application.Features.Payments;

internal static class PaymentMapper
{
    public static PaymentAttemptDto ToDto(PaymentAttempt payment, Guid reservationPublicId) => new(
        payment.PublicId,
        reservationPublicId,
        payment.Method,
        payment.Status.ToString().ToLowerInvariant(),
        payment.Amount.ToString(),
        "PEN",
        payment.CreatedAtUtc,
        payment.UpdatedAtUtc ?? payment.CreatedAtUtc,
        payment.RowVersion);
}
