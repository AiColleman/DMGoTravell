using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.AdminReservations.Dtos;
using DMGoTravel.Application.Features.Reservations;
using MediatR;

namespace DMGoTravel.Application.Features.AdminReservations.GetAdminReservation;

public sealed record GetAdminReservationQuery(Guid Id) : IRequest<AdminReservationDto>;

public sealed class GetAdminReservationQueryHandler
    : IRequestHandler<GetAdminReservationQuery, AdminReservationDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAdminReservationRepository _reservations;
    private readonly ReservationDtoFactory _reservationDtoFactory;

    public GetAdminReservationQueryHandler(
        IAdminAccessGuard adminAccess,
        IAdminReservationRepository reservations,
        ReservationDtoFactory reservationDtoFactory)
    {
        _adminAccess = adminAccess;
        _reservations = reservations;
        _reservationDtoFactory = reservationDtoFactory;
    }

    public async Task<AdminReservationDto> Handle(
        GetAdminReservationQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var view = await _reservations.GetDetailByPublicIdAsync(request.Id, cancellationToken);
        if (view is null)
        {
            throw new NotFoundAppException("La reserva no existe.");
        }

        var reservationDto = await _reservationDtoFactory.CreateAsync(view.Reservation, cancellationToken);
        return AdminReservationMapper.ToDto(view, reservationDto.Departure);
    }
}
