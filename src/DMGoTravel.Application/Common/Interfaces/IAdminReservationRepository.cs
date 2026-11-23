using DMGoTravel.Domain.Modules.Reservations;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record AdminReservationQueryFilter(
    int Page,
    int PageSize,
    ReservationStatus? Status,
    Guid? TourId,
    Guid? HotelId,
    Guid? ReservationId,
    string? ClientEmail);

public sealed record AdminReservationClientView(
    Guid PublicId,
    string FullName,
    string Email,
    bool IsDeleted,
    int ReservationCount,
    DateTime RegisteredAtUtc);

public sealed record AdminReservationRecordView(
    Reservation Reservation,
    AdminReservationClientView Client);

public interface IAdminReservationRepository
{
    Task<(IReadOnlyList<AdminReservationRecordView> Items, int Total)> ListAsync(
        AdminReservationQueryFilter filter,
        CancellationToken cancellationToken = default);

    Task<AdminReservationRecordView?> GetDetailByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default);

    Task<Reservation?> GetTrackedByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default);
}
