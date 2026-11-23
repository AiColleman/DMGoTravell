using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Payments;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _db;

    public PaymentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(PaymentAttempt payment, CancellationToken cancellationToken = default) =>
        _db.PaymentAttempts.AddAsync(payment, cancellationToken).AsTask();

    public Task AddExternalAsync(ExternalPayment payment, CancellationToken cancellationToken = default) =>
        _db.ExternalPayments.AddAsync(payment, cancellationToken).AsTask();

    public Task<PaymentAttempt?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.PaymentAttempts.SingleOrDefaultAsync(p => p.PublicId == publicId, cancellationToken);

    public Task<PaymentAttempt?> GetByProviderRequestRefAsync(string providerRequestRef, CancellationToken cancellationToken = default) =>
        _db.PaymentAttempts
            .OrderByDescending(p => p.CreatedAtUtc)
            .FirstOrDefaultAsync(p => p.ProviderRequestRef == providerRequestRef, cancellationToken);

    public Task<ExternalPayment?> GetApprovedExternalPaymentByReservationIdAsync(
        long reservationId,
        CancellationToken cancellationToken = default) =>
        _db.ExternalPayments
            .Where(e => e.ReservationId == reservationId && e.Status == "approved")
            .OrderByDescending(e => e.OccurredAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<ExternalPayment?> GetExternalByProviderTransactionIdAsync(
        string providerTransactionId,
        CancellationToken cancellationToken = default) =>
        _db.ExternalPayments
            .FirstOrDefaultAsync(e => e.ProviderTransactionId == providerTransactionId, cancellationToken);

    public Task<PaymentAttempt?> GetByPublicIdForAccountAsync(
        Guid publicId,
        long accountId,
        CancellationToken cancellationToken = default) =>
        (from payment in _db.PaymentAttempts
         join reservation in _db.Reservations on payment.ReservationId equals reservation.Id
         where payment.PublicId == publicId && reservation.AccountId == accountId
         select payment)
        .SingleOrDefaultAsync(cancellationToken);

    public Task<PaymentAttempt?> GetActiveByReservationIdAsync(
        long reservationId,
        CancellationToken cancellationToken = default) =>
        _db.PaymentAttempts
            .Where(payment =>
                payment.ReservationId == reservationId &&
                (payment.Status == PaymentStatus.Created ||
                 payment.Status == PaymentStatus.Sent ||
                 payment.Status == PaymentStatus.Unknown))
            .OrderByDescending(payment => payment.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<PaymentAttempt>> GetUnresolvedForClosureAsync(
        long accountId,
        CancellationToken cancellationToken = default) =>
        await _db.PaymentAttempts
            .AsNoTracking()
            .Where(payment =>
                payment.AccountId == accountId &&
                (payment.Status == PaymentStatus.Created ||
                 payment.Status == PaymentStatus.Sent ||
                 payment.Status == PaymentStatus.Unknown))
            .OrderByDescending(payment => payment.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<bool> HasTimelyPaymentInProgressAsync(
        long reservationId,
        DateTime paymentDeadlineAtUtc,
        CancellationToken cancellationToken = default) =>
        _db.PaymentAttempts
            .AsNoTracking()
            .AnyAsync(
                payment =>
                    payment.ReservationId == reservationId &&
                    payment.CreatedAtUtc < paymentDeadlineAtUtc &&
                    (payment.Status == PaymentStatus.Created ||
                     payment.Status == PaymentStatus.Sent ||
                     payment.Status == PaymentStatus.Unknown),
                cancellationToken);
}
