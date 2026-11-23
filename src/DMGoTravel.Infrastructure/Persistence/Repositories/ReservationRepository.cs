using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class ReservationRepository : IReservationRepository
{
    private readonly ApplicationDbContext _db;

    public ReservationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default) =>
        _db.Reservations.AddAsync(reservation, cancellationToken).AsTask();

    public Task<Reservation?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _db.Reservations
            .Include(reservation => reservation.OfferSnapshot)
            .Include(reservation => reservation.LodgingSnapshot)
            .Include(reservation => reservation.Holds)
            .SingleOrDefaultAsync(reservation => reservation.Id == id, cancellationToken);

    public Task<Reservation?> GetByPublicIdForAccountAsync(Guid publicId, long accountId, CancellationToken cancellationToken = default) =>
        _db.Reservations
            .Include(reservation => reservation.OfferSnapshot)
            .Include(reservation => reservation.LodgingSnapshot)
            .Include(reservation => reservation.Holds)
            .SingleOrDefaultAsync(
                reservation => reservation.PublicId == publicId && reservation.AccountId == accountId,
                cancellationToken);

    public async Task<(IReadOnlyList<Reservation> Items, int Total)> ListByAccountAsync(
        long accountId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Reservations
            .AsNoTracking()
            .Include(reservation => reservation.OfferSnapshot)
            .Where(reservation => reservation.AccountId == accountId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(reservation => reservation.CreatedAtUtc)
            .ThenByDescending(reservation => reservation.ReservationNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<bool> ReservationNumberExistsAsync(string reservationNumber, CancellationToken cancellationToken = default) =>
        _db.Reservations.AnyAsync(
            reservation => reservation.ReservationNumber == reservationNumber,
            cancellationToken);
}
