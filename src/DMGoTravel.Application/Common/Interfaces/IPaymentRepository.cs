using DMGoTravel.Domain.Modules.Payments;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IPaymentRepository
{
    Task AddAsync(PaymentAttempt payment, CancellationToken cancellationToken = default);
    Task AddExternalAsync(ExternalPayment payment, CancellationToken cancellationToken = default);
    Task<PaymentAttempt?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<PaymentAttempt?> GetByProviderRequestRefAsync(string providerRequestRef, CancellationToken cancellationToken = default);
    Task<ExternalPayment?> GetApprovedExternalPaymentByReservationIdAsync(long reservationId, CancellationToken cancellationToken = default);
    Task<ExternalPayment?> GetExternalByProviderTransactionIdAsync(string providerTransactionId, CancellationToken cancellationToken = default);
    Task<PaymentAttempt?> GetByPublicIdForAccountAsync(Guid publicId, long accountId, CancellationToken cancellationToken = default);
    Task<PaymentAttempt?> GetActiveByReservationIdAsync(long reservationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentAttempt>> GetUnresolvedForClosureAsync(long accountId, CancellationToken cancellationToken = default);
    Task<bool> HasTimelyPaymentInProgressAsync(
        long reservationId,
        DateTime paymentDeadlineAtUtc,
        CancellationToken cancellationToken = default);
}
