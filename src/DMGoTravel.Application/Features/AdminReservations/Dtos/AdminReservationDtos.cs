using System.Globalization;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Application.Features.Reservations;

namespace DMGoTravel.Application.Features.AdminReservations.Dtos;

public sealed record AdminReservationClientDto(
    Guid Id,
    string? FullName,
    string? Email,
    string Status,
    int ReservationCount,
    DateTime? RegisteredAt);

public sealed record AdminReservationDto(
    Guid Id,
    string ReservationNumber,
    string Status,
    DepartureDto? Departure,
    object? Lodging,
    int Travelers,
    string Total,
    string Currency,
    DateTime PaymentDeadlineAt,
    DateTime ValidationDeadlineAt,
    long Version,
    AdminReservationClientDto Client,
    string? CancellationReason = null);

public sealed record AdminReservationPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<AdminReservationDto> Items);

public static class AdminReservationMapper
{
    public static AdminReservationDto ToDto(
        AdminReservationRecordView view,
        DepartureDto? departure = null)
    {
        var r = view.Reservation;
        var client = view.Client.IsDeleted
            ? new AdminReservationClientDto(
                view.Client.PublicId,
                FullName: null,
                Email: null,
                Status: "deleted",
                ReservationCount: view.Client.ReservationCount,
                RegisteredAt: null)
            : new AdminReservationClientDto(
                view.Client.PublicId,
                view.Client.FullName,
                view.Client.Email,
                Status: "active",
                ReservationCount: view.Client.ReservationCount,
                RegisteredAt: DateTime.SpecifyKind(view.Client.RegisteredAtUtc, DateTimeKind.Utc));

        return new AdminReservationDto(
            r.PublicId,
            r.ReservationNumber,
            r.Status.ToString().ToLowerInvariant(),
            departure,
            Lodging: null,
            r.OfferSnapshot?.Travelers ?? 0,
            r.Total.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            r.Total.Currency,
            DateTime.SpecifyKind(r.PaymentDeadlineAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(r.ValidationDeadlineAtUtc, DateTimeKind.Utc),
            r.RowVersion,
            client,
            r.CancellationReason);
    }
}
