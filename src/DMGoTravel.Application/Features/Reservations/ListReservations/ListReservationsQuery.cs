using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Reservations.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Reservations.ListReservations;

public sealed record ListReservationsQuery(int Page = 1, int PageSize = 10) : IRequest<ReservationPageDto>;

public sealed class ListReservationsQueryValidator : AbstractValidator<ListReservationsQuery>
{
    public ListReservationsQueryValidator()
    {
        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1).WithMessage("El número de página debe ser mayor o igual a 1.");

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100.");
    }
}

public sealed class ListReservationsQueryHandler : IRequestHandler<ListReservationsQuery, ReservationPageDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IReservationRepository _reservations;
    private readonly ReservationDtoFactory _dtoFactory;

    public ListReservationsQueryHandler(
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

    public async Task<ReservationPageDto> Handle(ListReservationsQuery request, CancellationToken cancellationToken)
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

        var (items, total) = await _reservations.ListByAccountAsync(
            user.Id,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = new List<ReservationDto>(items.Count);
        foreach (var reservation in items)
        {
            dtos.Add(await _dtoFactory.CreateAsync(reservation, cancellationToken));
        }

        return new ReservationPageDto(
            request.Page,
            request.PageSize,
            total,
            request.Page * request.PageSize < total,
            dtos);
    }
}
