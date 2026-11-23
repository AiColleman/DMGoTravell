namespace DMGoTravel.Application.Common.Interfaces;

public sealed record RefundGatewayRequest(
    Guid RefundCaseId,
    string ProviderTransactionId,
    decimal Amount,
    string Currency,
    string Reason);

public sealed record RefundGatewayResult(
    bool Executed,
    bool Unknown,
    string Provider,
    string? ProviderRefundId,
    string Status,
    string? Error = null);

public interface IRefundGateway
{
    Task<RefundGatewayResult> ExecuteRefundAsync(
        RefundGatewayRequest request,
        CancellationToken cancellationToken = default);
}

public interface IWebhookSignatureVerifier
{
    bool VerifyCulqiSignature(string rawBody, string? signatureHeader);
    bool VerifyResendSignature(string rawBody, string? svixId, string? svixTimestamp, string? svixSignature);
}
