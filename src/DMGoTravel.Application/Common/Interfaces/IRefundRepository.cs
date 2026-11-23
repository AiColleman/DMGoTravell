using DMGoTravel.Application.Common.Models;
using DMGoTravel.Domain.Modules.Payments;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record RefundCaseSummaryRecord(
    RefundCase Refund,
    Guid ReservationPublicId,
    Guid PaymentAttemptPublicId,
    string ExternalProviderTransactionId);

public interface IRefundRepository
{
    Task AddAsync(RefundCase refundCase, CancellationToken cancellationToken = default);
    Task<RefundCase?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<RefundCase?> GetByExternalPaymentIdAsync(long externalPaymentId, CancellationToken cancellationToken = default);
    Task<RefundCase?> GetByProviderRefundIdAsync(string providerRefundId, CancellationToken cancellationToken = default);
    Task<RefundCaseSummaryRecord?> GetDetailByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<PagedResult<RefundCaseSummaryRecord>> ListAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
}

public interface IWebhookEventRepository
{
    Task<bool> ExistsAsync(string provider, string externalEventId, CancellationToken cancellationToken = default);
    Task AddAsync(ProcessedWebhookEvent processedEvent, CancellationToken cancellationToken = default);
}
