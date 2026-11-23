using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Infrastructure.Payments;

/// <summary>
/// Adaptador de desarrollo para la primera vertical slice. No representa a Culqi,
/// no realiza cobros y debe sustituirse por el adaptador oficial antes de producción.
/// </summary>
public sealed class SimulatedPaymentGateway : IPaymentGateway
{
    public Task<PaymentGatewayResult> ProcessAsync(
        PaymentGatewayRequest request,
        CancellationToken cancellationToken = default)
    {
        var reference = $"sim_{Guid.NewGuid():N}";
        return Task.FromResult(new PaymentGatewayResult(
            Approved: true,
            Unknown: false,
            Provider: "simulated",
            ProviderReference: reference,
            Status: "approved"));
    }
}
