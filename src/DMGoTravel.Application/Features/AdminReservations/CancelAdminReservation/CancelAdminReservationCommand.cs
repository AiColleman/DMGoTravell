using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.AdminReservations.Dtos;
using DMGoTravel.Application.Features.Notifications;
using DMGoTravel.Application.Features.Reservations;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.AdminReservations.CancelAdminReservation;

public sealed record CancelAdminReservationCommand(
    Guid Id,
    string Reason,
    string IdempotencyKey,
    long? Version = null) : IRequest<AdminReservationDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.reservations.cancel";

    public string GetRequestFingerprint() =>
        $"{Id:N}|{Reason.Trim()}|{Version?.ToString() ?? "-"}";
}

public sealed class CancelAdminReservationCommandValidator : AbstractValidator<CancelAdminReservationCommand>
{
    public CancelAdminReservationCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("El identificador de la reserva es obligatorio.");

        RuleFor(command => command.Reason)
            .NotEmpty().WithMessage("El motivo de cancelación administrativa es obligatorio.")
            .MaximumLength(500).WithMessage("El motivo no puede exceder 500 caracteres.");

        RuleFor(command => command.Version)
            .GreaterThanOrEqualTo(1).When(command => command.Version.HasValue)
            .WithMessage("La versión debe ser mayor o igual a 1.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CancelAdminReservationCommandHandler
    : IRequestHandler<CancelAdminReservationCommand, AdminReservationDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IAdminReservationRepository _adminReservations;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IPaymentRepository _payments;
    private readonly IRefundRepository _refunds;
    private readonly ReservationDtoFactory _reservationDtoFactory;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;
    private readonly IReservationEmailNotifier _reservationEmails;

    public CancelAdminReservationCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IAdminReservationRepository adminReservations,
        IOfferRepository offers,
        IHotelRepository hotels,
        IPaymentRepository payments,
        IRefundRepository refunds,
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
        _offers = offers;
        _hotels = hotels;
        _payments = payments;
        _refunds = refunds;
        _reservationDtoFactory = reservationDtoFactory;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
        _reservationEmails = reservationEmails;
    }

    public async Task<AdminReservationDto> Handle(
        CancelAdminReservationCommand request,
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
                "El administrador solo puede cancelar reservas en estado confirmada.");
        }

        var now = _clock.UtcNow;
        if (reservation.OfferSnapshot is not null && now >= reservation.OfferSnapshot.DepartureStartsAtUtc)
        {
            throw new ConflictAppException(
                "transition_not_allowed",
                "No se puede cancelar administrativamente una reserva cuyo servicio ya inició.");
        }

        var releasedSeats = reservation.Holds
            .Where(hold => hold.IsHeld && string.Equals(hold.ResourceType, "departure", StringComparison.Ordinal))
            .Sum(hold => hold.Quantity);

        if (releasedSeats > 0)
        {
            var departure = await _offers.GetDepartureByIdAsync(reservation.DepartureId, cancellationToken);
            departure?.ReleaseSeats(releasedSeats);
        }

        foreach (var hold in reservation.Holds.Where(h =>
                     h.IsHeld && string.Equals(h.ResourceType, "room_night", StringComparison.Ordinal) && h.PeriodDate.HasValue))
        {
            var night = await _hotels.GetInventoryNightAsync(hold.ResourceId, hold.PeriodDate!.Value, cancellationToken);
            night?.ReleaseRoom(hold.Quantity);
        }

        reservation.CancelByAdmin(request.Reason, now);

        Guid? openedRefundCaseId = null;
        var approvedExternal = await _payments.GetApprovedExternalPaymentByReservationIdAsync(reservation.Id, cancellationToken);
        if (approvedExternal is not null)
        {
            var existingRefund = await _refunds.GetByExternalPaymentIdAsync(approvedExternal.Id, cancellationToken);
            if (existingRefund is null)
            {
                var refundCase = RefundCase.Open(
                    reservation.Id,
                    approvedExternal.AttemptId,
                    approvedExternal.Id,
                    approvedExternal.Amount,
                    request.Reason,
                    approvedExternal.Provider,
                    now);
                await _refunds.AddAsync(refundCase, cancellationToken);
                openedRefundCaseId = refundCase.PublicId;
            }
            else
            {
                openedRefundCaseId = existingRefund.PublicId;
            }
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminReservationCancel,
            AuditActions.AdminReservationCancel,
            AuditActions.ActorHuman,
            admin.Id,
            "reservation",
            reservation.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                reservationNumber = reservation.ReservationNumber,
                previousStatus = ReservationStatus.Confirmed.ToString().ToLowerInvariant(),
                status = reservation.Status.ToString().ToLowerInvariant(),
                cancellationOrigin = CancellationOrigin.Admin.ToString().ToLowerInvariant(),
                releasedSeats,
                refundRequired = true,
                refundCaseId = openedRefundCaseId
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _adminReservations.GetDetailByPublicIdAsync(reservation.PublicId, cancellationToken)
            ?? throw new NotFoundAppException("La reserva no existe.");

        if (!detail.Client.IsDeleted && !string.IsNullOrWhiteSpace(detail.Client.Email))
        {
            await _reservationEmails.NotifyReservationCancelledByAdminAsync(
                detail.Reservation,
                detail.Client.Email,
                detail.Client.FullName,
                request.Reason,
                openedRefundCaseId.HasValue,
                cancellationToken);
        }

        var reservationDto = await _reservationDtoFactory.CreateAsync(detail.Reservation, cancellationToken);
        return AdminReservationMapper.ToDto(detail, reservationDto.Departure);
    }
}
