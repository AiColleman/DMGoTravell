namespace DMGoTravel.Application.Common.Interfaces;

public sealed record PaymentGatewayRequest(
    Guid ReservationPublicId,
    decimal Amount,
    string Currency,
    string Method);

public sealed record PaymentGatewayResult(
    bool Approved,
    bool Unknown,
    string Provider,
    string ProviderReference,
    string Status);

public interface IPaymentGateway
{
    Task<PaymentGatewayResult> ProcessAsync(PaymentGatewayRequest request, CancellationToken cancellationToken = default);
}
