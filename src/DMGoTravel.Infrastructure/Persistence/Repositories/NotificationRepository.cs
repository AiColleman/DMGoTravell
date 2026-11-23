using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Models;
using DMGoTravel.Domain.Modules.Notifications;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _db;

    public NotificationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddDeliveryAsync(NotificationDelivery delivery, CancellationToken cancellationToken = default) =>
        _db.NotificationDeliveries.AddAsync(delivery, cancellationToken).AsTask();

    public Task AddIncidentAsync(NotificationIncident incident, CancellationToken cancellationToken = default) =>
        _db.NotificationIncidents.AddAsync(incident, cancellationToken).AsTask();

    public Task<NotificationDelivery?> GetDeliveryByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.NotificationDeliveries.SingleOrDefaultAsync(d => d.PublicId == publicId, cancellationToken);

    public Task<NotificationDelivery?> GetDeliveryByProviderMessageIdAsync(string providerMessageId, CancellationToken cancellationToken = default) =>
        _db.NotificationDeliveries.FirstOrDefaultAsync(d => d.ProviderMessageId == providerMessageId, cancellationToken);

    public async Task<IReadOnlyList<NotificationDelivery>> ListDuePendingDeliveriesAsync(
        DateTime nowUtc,
        int batchSize,
        CancellationToken cancellationToken = default) =>
        await _db.NotificationDeliveries
            .Where(d => d.Status == NotificationDelivery.StatusPending &&
                        (d.NextRetryAtUtc == null || d.NextRetryAtUtc <= nowUtc))
            .OrderBy(d => d.CreatedAtUtc)
            .Take(batchSize)
            .ToListAsync(cancellationToken);

    public Task<NotificationIncident?> GetIncidentByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.NotificationIncidents.SingleOrDefaultAsync(i => i.PublicId == publicId, cancellationToken);

    public async Task<IReadOnlyList<NotificationIncident>> GetOpenIncidentsByDeliveryIdAsync(
        long deliveryId,
        CancellationToken cancellationToken = default) =>
        await _db.NotificationIncidents
            .Where(i => i.DeliveryId == deliveryId && i.Status == NotificationIncident.StatusOpen)
            .ToListAsync(cancellationToken);

    public async Task<PagedResult<NotificationIncident>> ListIncidentsAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = _db.NotificationIncidents.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .ThenByDescending(i => i.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationIncident>(items, page, pageSize, total);
    }
}
