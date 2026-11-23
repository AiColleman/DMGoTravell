using DMGoTravel.Domain.Modules.Reservations;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IReservationRepository
{
    Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default);
    Task<Reservation?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<Reservation?> GetByPublicIdForAccountAsync(Guid publicId, long accountId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Reservation> Items, int Total)> ListByAccountAsync(
        long accountId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<bool> ReservationNumberExistsAsync(string reservationNumber, CancellationToken cancellationToken = default);
}
