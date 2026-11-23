using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class AdminReservationRepository : IAdminReservationRepository
{
    private readonly ApplicationDbContext _db;

    public AdminReservationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<AdminReservationRecordView> Items, int Total)> ListAsync(
        AdminReservationQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Reservations
            .AsNoTracking()
            .Include(r => r.OfferSnapshot)
            .Include(r => r.LodgingSnapshot)
            .AsQueryable();

        if (filter.Status.HasValue)
        {
            query = query.Where(r => r.Status == filter.Status.Value);
        }

        if (filter.ReservationId.HasValue)
        {
            query = query.Where(r => r.PublicId == filter.ReservationId.Value);
        }

        if (filter.TourId.HasValue)
        {
            query = query.Where(r =>
                _db.Offers.Any(o => o.Id == r.OfferId && o.PublicId == filter.TourId.Value));
        }

        if (filter.HotelId.HasValue)
        {
            query = query.Where(r =>
                r.LodgingSnapshot != null &&
                _db.LodgingProposals.Any(p =>
                    p.Id == r.LodgingSnapshot.ProposalId &&
                    _db.Hotels.Any(h => h.Id == p.HotelId && h.PublicId == filter.HotelId.Value)));
        }

        if (!string.IsNullOrWhiteSpace(filter.ClientEmail))
        {
            var term = filter.ClientEmail.Trim().ToUpperInvariant();
            query = query.Where(r =>
                _db.Users.Any(u =>
                    u.Id == r.AccountId &&
                    u.DeletedAtUtc == null &&
                    u.Status != UserStatus.Closed &&
                    u.NormalizedEmail.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);

        var reservations = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .ThenByDescending(r => r.Id)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var accountIds = reservations.Select(r => r.AccountId).Distinct().ToList();
        var clients = await LoadClientsAsync(accountIds, cancellationToken);

        var items = reservations
            .Select(r => new AdminReservationRecordView(r, clients[r.AccountId]))
            .ToList();

        return (items, total);
    }

    public async Task<AdminReservationRecordView?> GetDetailByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default)
    {
        var reservation = await _db.Reservations
            .AsNoTracking()
            .Include(r => r.OfferSnapshot)
            .Include(r => r.LodgingSnapshot)
            .SingleOrDefaultAsync(r => r.PublicId == publicId, cancellationToken);

        if (reservation is null)
        {
            return null;
        }

        var clients = await LoadClientsAsync([reservation.AccountId], cancellationToken);
        return new AdminReservationRecordView(reservation, clients[reservation.AccountId]);
    }

    public Task<Reservation?> GetTrackedByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default) =>
        _db.Reservations
            .Include(r => r.OfferSnapshot)
            .Include(r => r.LodgingSnapshot)
            .Include(r => r.Holds)
            .SingleOrDefaultAsync(r => r.PublicId == publicId, cancellationToken);

    private async Task<Dictionary<long, AdminReservationClientView>> LoadClientsAsync(
        IReadOnlyCollection<long> accountIds,
        CancellationToken cancellationToken)
    {
        if (accountIds.Count == 0)
        {
            return [];
        }

        var counts = await _db.Reservations
            .AsNoTracking()
            .Where(r => accountIds.Contains(r.AccountId))
            .GroupBy(r => r.AccountId)
            .Select(g => new { AccountId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AccountId, x => x.Count, cancellationToken);

        var users = await _db.Users
            .AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => accountIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var map = new Dictionary<long, AdminReservationClientView>(users.Count);
        foreach (var user in users)
        {
            var isDeleted = user.DeletedAtUtc is not null || user.Status == UserStatus.Closed;
            map[user.Id] = new AdminReservationClientView(
                user.PublicId,
                user.Profile?.FullName ?? user.Email,
                user.Email,
                isDeleted,
                counts.GetValueOrDefault(user.Id, 0),
                user.CreatedAtUtc);
        }

        return map;
    }
}
