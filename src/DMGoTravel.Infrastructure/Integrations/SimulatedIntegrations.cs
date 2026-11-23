using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Infrastructure.Integrations;

/// <summary>
/// Adaptador sandbox de devoluciones. Listo para sustituirse por el cliente HTTP oficial de Culqi Refunds.
/// </summary>
public sealed class SimulatedRefundGateway : IRefundGateway
{
    public Task<RefundGatewayResult> ExecuteRefundAsync(
        RefundGatewayRequest request,
        CancellationToken cancellationToken = default)
    {
        var refundId = $"sim_ref_{Guid.NewGuid():N}";
        return Task.FromResult(new RefundGatewayResult(
            Executed: true,
            Unknown: false,
            Provider: "culqi",
            ProviderRefundId: refundId,
            Status: "executed"));
    }
}

/// <summary>
/// Adaptador sandbox de envío de correos. Listo para sustituirse por el cliente HTTP oficial de Resend.
/// </summary>
public sealed class SimulatedEmailSender : IEmailSender
{
    public Task<EmailSendResult> SendAsync(
        EmailSendRequest request,
        CancellationToken cancellationToken = default)
    {
        var messageId = $"sim_email_{Guid.NewGuid():N}";
        return Task.FromResult(new EmailSendResult(
            Sent: true,
            Provider: "resend",
            ProviderMessageId: messageId));
    }
}
