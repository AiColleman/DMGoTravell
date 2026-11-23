using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.AdminReservations.Dtos;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.AdminReservations.ListAdminReservations;

public sealed record ListAdminReservationsQuery(
    int Page = 1,
    int PageSize = 10,
    ReservationStatus? Status = null,
    Guid? TourId = null,
    Guid? HotelId = null,
    Guid? ReservationId = null,
    string? ClientEmail = null) : IRequest<AdminReservationPageDto>;

public sealed class ListAdminReservationsQueryValidator : AbstractValidator<ListAdminReservationsQuery>
{
    public ListAdminReservationsQueryValidator()
    {
        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1).WithMessage("El número de página debe ser mayor o igual a 1.");

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100.");
    }
}

public sealed class ListAdminReservationsQueryHandler
    : IRequestHandler<ListAdminReservationsQuery, AdminReservationPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAdminReservationRepository _reservations;

    public ListAdminReservationsQueryHandler(
        IAdminAccessGuard adminAccess,
        IAdminReservationRepository reservations)
    {
        _adminAccess = adminAccess;
        _reservations = reservations;
    }

    public async Task<AdminReservationPageDto> Handle(
        ListAdminReservationsQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var filter = new AdminReservationQueryFilter(
            request.Page,
            request.PageSize,
            request.Status,
            request.TourId,
            request.HotelId,
            request.ReservationId,
            request.ClientEmail);

        var (items, total) = await _reservations.ListAsync(filter, cancellationToken);

        return new AdminReservationPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(item => AdminReservationMapper.ToDto(item)).ToList());
    }
}
