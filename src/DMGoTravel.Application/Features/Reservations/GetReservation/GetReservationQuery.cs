using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Reservations.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Reservations.GetReservation;

public sealed record GetReservationQuery(Guid Id) : IRequest<ReservationDto>;

public sealed class GetReservationQueryValidator : AbstractValidator<GetReservationQuery>
{
    public GetReservationQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetReservationQueryHandler : IRequestHandler<GetReservationQuery, ReservationDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IReservationRepository _reservations;
    private readonly ReservationDtoFactory _dtoFactory;

    public GetReservationQueryHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IReservationRepository reservations,
        ReservationDtoFactory dtoFactory)
    {
        _currentUser = currentUser;
        _users = users;
        _reservations = reservations;
        _dtoFactory = dtoFactory;
    }

    public async Task<ReservationDto> Handle(GetReservationQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAppException();
        }

        var reservation = await _reservations.GetByPublicIdForAccountAsync(request.Id, user.Id, cancellationToken);
        if (reservation is null)
        {
            throw new NotFoundAppException("La reserva no existe o no es accesible.");
        }

        return await _dtoFactory.CreateAsync(reservation, cancellationToken);
    }
}
