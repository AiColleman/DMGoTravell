using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Notifications;
using DMGoTravel.Application.Features.Reservations.Dtos;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Reservations.CancelReservation;

public sealed record CancelReservationCommand(
    Guid Id,
    string IdempotencyKey,
    long? Version = null) : IRequest<ReservationDto>, IIdempotentCommand
{
    public string IdempotencyScope => "reservations.cancel";

    public string GetRequestFingerprint() =>
        $"{Id:N}|{Version?.ToString() ?? "-"}";
}

public sealed class CancelReservationCommandValidator : AbstractValidator<CancelReservationCommand>
{
    public CancelReservationCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
        RuleFor(command => command.Version)
            .GreaterThanOrEqualTo(1).When(command => command.Version.HasValue)
            .WithMessage("La versión debe ser mayor o igual a 1.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, ReservationDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IReservationRepository _reservations;
    private readonly IPaymentRepository _payments;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly ReservationDtoFactory _dtoFactory;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;
    private readonly IReservationEmailNotifier _reservationEmails;

    public CancelReservationCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IReservationRepository reservations,
        IPaymentRepository payments,
        IOfferRepository offers,
        IHotelRepository hotels,
        ReservationDtoFactory dtoFactory,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit,
        IReservationEmailNotifier reservationEmails)
    {
        _currentUser = currentUser;
        _users = users;
        _reservations = reservations;
        _payments = payments;
        _offers = offers;
        _hotels = hotels;
        _dtoFactory = dtoFactory;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
        _reservationEmails = reservationEmails;
    }

    public async Task<ReservationDto> Handle(CancelReservationCommand request, CancellationToken cancellationToken)
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

        if (request.Version.HasValue && request.Version.Value != reservation.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (reservation.Status == ReservationStatus.Cancelled)
        {
            return await _dtoFactory.CreateAsync(reservation, cancellationToken);
        }

        if (reservation.Status != ReservationStatus.Pending)
        {
            throw new ConflictAppException(
                "transition_not_allowed",
                "Solo se puede cancelar una reserva pendiente.");
        }

        var activePayment = await _payments.GetActiveByReservationIdAsync(reservation.Id, cancellationToken);
        if (activePayment is not null &&
            activePayment.Status is PaymentStatus.Created or PaymentStatus.Sent or PaymentStatus.Unknown)
        {
            throw new ConflictAppException(
                "payment_in_progress",
                "No se puede cancelar la reserva mientras el pago está en verificación.");
        }

        var releasedSeats = 0;
        var departure = await _offers.GetDepartureByIdAsync(reservation.DepartureId, cancellationToken);
        if (departure is not null)
        {
            var travelers = reservation.OfferSnapshot?.Travelers ?? 0;
            if (travelers > 0)
            {
                departure.ReleaseSeats(travelers);
                releasedSeats = travelers;
            }
        }

        foreach (var hold in reservation.Holds.Where(h =>
                     h.IsHeld && string.Equals(h.ResourceType, "room_night", StringComparison.Ordinal) && h.PeriodDate.HasValue))
        {
            var night = await _hotels.GetInventoryNightAsync(hold.ResourceId, hold.PeriodDate!.Value, cancellationToken);
            night?.ReleaseRoom(hold.Quantity);
        }

        reservation.CancelByClient(_clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.ReservationCancel,
            AuditActions.ReservationCancel,
            AuditActions.ActorHuman,
            user.Id,
            "reservation",
            reservation.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                reservationNumber = reservation.ReservationNumber,
                previousStatus = ReservationStatus.Pending.ToString().ToLowerInvariant(),
                status = reservation.Status.ToString().ToLowerInvariant(),
                cancellationOrigin = CancellationOrigin.Client.ToString().ToLowerInvariant(),
                releasedSeats
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _reservationEmails.NotifyReservationCancelledByClientAsync(
            reservation,
            user.Email,
            user.Profile?.FullName,
            cancellationToken);

        return await _dtoFactory.CreateAsync(reservation, cancellationToken);
    }
}
