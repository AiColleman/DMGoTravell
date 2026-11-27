using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.AdminReservations.Dtos;
using DMGoTravel.Application.Features.Notifications;
using DMGoTravel.Application.Features.Reservations;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.AdminReservations.CompleteAdminReservation;

public sealed record CompleteAdminReservationCommand(
    Guid Id,
    string IdempotencyKey,
    long? Version = null) : IRequest<AdminReservationDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.reservations.complete";

    public string GetRequestFingerprint() =>
        $"{Id:N}|{Version?.ToString() ?? "-"}";
}

public sealed class CompleteAdminReservationCommandValidator : AbstractValidator<CompleteAdminReservationCommand>
{
    public CompleteAdminReservationCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("El identificador de la reserva es obligatorio.");

        RuleFor(command => command.Version)
            .GreaterThanOrEqualTo(1).When(command => command.Version.HasValue)
            .WithMessage("La versión debe ser mayor o igual a 1.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CompleteAdminReservationCommandHandler
    : IRequestHandler<CompleteAdminReservationCommand, AdminReservationDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IAdminReservationRepository _adminReservations;
    private readonly ReservationDtoFactory _reservationDtoFactory;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;
    private readonly IReservationEmailNotifier _reservationEmails;

    public CompleteAdminReservationCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IAdminReservationRepository adminReservations,
        ReservationDtoFactory reservationDtoFactory,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit,
        IReservationEmailNotifier reservationEmails)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _adminReservations = adminReservations;
        _reservationDtoFactory = reservationDtoFactory;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
        _reservationEmails = reservationEmails;
    }

    public async Task<AdminReservationDto> Handle(
        CompleteAdminReservationCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var reservation = await _adminReservations.GetTrackedByPublicIdAsync(request.Id, cancellationToken);
        if (reservation is null)
        {
            throw new NotFoundAppException("La reserva no existe.");
        }

        if (request.Version.HasValue && request.Version.Value != reservation.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (reservation.Status != ReservationStatus.Confirmed)
        {
            throw new ConflictAppException(
                "transition_not_allowed",
                "Solo se puede completar una reserva en estado confirmada.");
        }

        var now = _clock.UtcNow;
        if (reservation.OfferSnapshot is not null && now < reservation.OfferSnapshot.DepartureEndsAtUtc)
        {
            throw new ConflictAppException(
                "transition_not_allowed",
                "Solo se puede completar una reserva una vez finalizado el servicio.");
        }

        reservation.CompleteByAdmin(now);

        _audit.Record(new AuditEntry(
            AuditActions.AdminReservationComplete,
            AuditActions.AdminReservationComplete,
            AuditActions.ActorHuman,
            admin.Id,
            "reservation",
            reservation.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                reservationNumber = reservation.ReservationNumber,
                previousStatus = ReservationStatus.Confirmed.ToString().ToLowerInvariant(),
                status = reservation.Status.ToString().ToLowerInvariant()
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _adminReservations.GetDetailByPublicIdAsync(reservation.PublicId, cancellationToken)
            ?? throw new NotFoundAppException("La reserva no existe.");

        if (!detail.Client.IsDeleted && !string.IsNullOrWhiteSpace(detail.Client.Email))
        {
            await _reservationEmails.NotifyReservationCompletedAsync(
                detail.Reservation,
                detail.Client.Email,
                detail.Client.FullName,
                cancellationToken);
        }

        var reservationDto = await _reservationDtoFactory.CreateAsync(detail.Reservation, cancellationToken);
        return AdminReservationMapper.ToDto(detail, reservationDto.Departure);
    }
}
