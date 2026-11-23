using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.RequestClosure;

public sealed record RequestAccountClosureCommand(
    bool Confirm,
    string IdempotencyKey) : IRequest<OperationResultDto>, IIdempotentCommand
{
    public string IdempotencyScope => "profile.requestClosure";

    public string GetRequestFingerprint() => Confirm ? "confirm:true" : "confirm:false";
}

public sealed class RequestAccountClosureCommandValidator : AbstractValidator<RequestAccountClosureCommand>
{
    public RequestAccountClosureCommandValidator()
    {
        RuleFor(command => command.Confirm)
            .Equal(true).WithMessage("Debe confirmar expresamente la baja lógica de la cuenta.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class RequestAccountClosureCommandHandler
    : IRequestHandler<RequestAccountClosureCommand, OperationResultDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IReservationRepository _reservations;
    private readonly IPaymentRepository _payments;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public RequestAccountClosureCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IReservationRepository reservations,
        IPaymentRepository payments,
        IRefreshTokenRepository refreshTokens,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _currentUser = currentUser;
        _users = users;
        _reservations = reservations;
        _payments = payments;
        _refreshTokens = refreshTokens;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationResultDto> Handle(
        RequestAccountClosureCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null ||
            user.Status != UserStatus.Active ||
            (_currentUser.SecurityVersion.HasValue && _currentUser.SecurityVersion.Value != user.SecurityVersion))
        {
            throw new UnauthorizedAppException();
        }

        if (string.Equals(user.Role, UserRole.Admin, StringComparison.Ordinal))
        {
            throw new ForbiddenAppException(
                "admin_closure_not_allowed",
                "Una cuenta administrativa no puede eliminarse mediante este flujo.");
        }

        var blockingReservations = await _reservations.GetBlockingForClosureAsync(user.Id, cancellationToken);
        var unresolvedPayments = await _payments.GetUnresolvedForClosureAsync(user.Id, cancellationToken);

        var blockers = new List<ClosureBlocker>(blockingReservations.Count + unresolvedPayments.Count);

        foreach (var reservation in blockingReservations)
        {
            blockers.Add(new ClosureBlocker(
                "reservation",
                reservation.ReservationNumber,
                reservation.Status.ToString().ToLowerInvariant()));
        }

        foreach (var payment in unresolvedPayments)
        {
            blockers.Add(new ClosureBlocker(
                "payment",
                payment.PublicId.ToString(),
                payment.Status.ToString().ToLowerInvariant()));
        }

        if (blockers.Count > 0)
        {
            throw new AccountClosureBlockedAppException(blockers);
        }

        var now = _clock.UtcNow;
        user.SoftDelete(now);
        await _refreshTokens.RevokeAllForUserAsync(user.Id, now, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.ProfileRequestClosure,
            AuditActions.ProfileRequestClosure,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                accountClosed = true,
                sessionsRevoked = true
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationResultDto(user.PublicId, "closed", user.RowVersion);
    }
}
