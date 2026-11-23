using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Payments.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Payments.GetPayment;

public sealed record GetPaymentQuery(Guid Id) : IRequest<PaymentAttemptDto>;

public sealed class GetPaymentQueryValidator : AbstractValidator<GetPaymentQuery>
{
    public GetPaymentQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetPaymentQueryHandler : IRequestHandler<GetPaymentQuery, PaymentAttemptDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IPaymentRepository _payments;
    private readonly IReservationRepository _reservations;

    public GetPaymentQueryHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IPaymentRepository payments,
        IReservationRepository reservations)
    {
        _currentUser = currentUser;
        _users = users;
        _payments = payments;
        _reservations = reservations;
    }

    public async Task<PaymentAttemptDto> Handle(GetPaymentQuery request, CancellationToken cancellationToken)
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

        var payment = await _payments.GetByPublicIdForAccountAsync(request.Id, user.Id, cancellationToken);
        if (payment is null)
        {
            throw new NotFoundAppException("El pago no existe o no es accesible.");
        }

        var reservation = await _reservations.GetByIdAsync(payment.ReservationId, cancellationToken);
        if (reservation is null)
        {
            throw new NotFoundAppException("El pago no existe o no es accesible.");
        }

        return PaymentMapper.ToDto(payment, reservation.PublicId);
    }
}
