using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Models;
using DMGoTravel.Domain.Modules.Payments;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class RefundRepository : IRefundRepository
{
    private readonly ApplicationDbContext _db;

    public RefundRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(RefundCase refundCase, CancellationToken cancellationToken = default) =>
        _db.RefundCases.AddAsync(refundCase, cancellationToken).AsTask();

    public Task<RefundCase?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.RefundCases.SingleOrDefaultAsync(r => r.PublicId == publicId, cancellationToken);

    public Task<RefundCase?> GetByExternalPaymentIdAsync(long externalPaymentId, CancellationToken cancellationToken = default) =>
        _db.RefundCases.SingleOrDefaultAsync(r => r.ExternalPaymentId == externalPaymentId, cancellationToken);

    public Task<RefundCase?> GetByProviderRefundIdAsync(string providerRefundId, CancellationToken cancellationToken = default) =>
        _db.RefundCases.FirstOrDefaultAsync(r => r.ProviderRefundId == providerRefundId, cancellationToken);

    public async Task<RefundCaseSummaryRecord?> GetDetailByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default)
    {
        var query =
            from rf in _db.RefundCases.AsNoTracking()
            join res in _db.Reservations.AsNoTracking() on rf.ReservationId equals res.Id
            join attempt in _db.PaymentAttempts.AsNoTracking() on rf.PaymentAttemptId equals attempt.Id
            join ext in _db.ExternalPayments.AsNoTracking() on rf.ExternalPaymentId equals ext.Id
            where rf.PublicId == publicId
            select new RefundCaseSummaryRecord(rf, res.PublicId, attempt.PublicId, ext.ProviderTransactionId);

        return await query.SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<RefundCaseSummaryRecord>> ListAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query =
            from rf in _db.RefundCases.AsNoTracking()
            join res in _db.Reservations.AsNoTracking() on rf.ReservationId equals res.Id
            join attempt in _db.PaymentAttempts.AsNoTracking() on rf.PaymentAttemptId equals attempt.Id
            join ext in _db.ExternalPayments.AsNoTracking() on rf.ExternalPaymentId equals ext.Id
            select new { rf, resPublicId = res.PublicId, attemptPublicId = attempt.PublicId, extTx = ext.ProviderTransactionId };

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.rf.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(x => x.rf.CreatedAtUtc)
            .ThenByDescending(x => x.rf.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new RefundCaseSummaryRecord(x.rf, x.resPublicId, x.attemptPublicId, x.extTx))
            .ToListAsync(cancellationToken);

        return new PagedResult<RefundCaseSummaryRecord>(rows, page, pageSize, total);
    }
}

public sealed class WebhookEventRepository : IWebhookEventRepository
{
    private readonly ApplicationDbContext _db;

    public WebhookEventRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task<bool> ExistsAsync(string provider, string externalEventId, CancellationToken cancellationToken = default) =>
        _db.ProcessedWebhookEvents
            .AsNoTracking()
            .AnyAsync(e => e.Provider == provider && e.ExternalEventId == externalEventId, cancellationToken);

    public Task AddAsync(ProcessedWebhookEvent processedEvent, CancellationToken cancellationToken = default) =>
        _db.ProcessedWebhookEvents.AddAsync(processedEvent, cancellationToken).AsTask();
}
