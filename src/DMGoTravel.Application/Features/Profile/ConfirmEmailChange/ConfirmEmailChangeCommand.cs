using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.ConfirmEmailChange;

public sealed record ConfirmEmailChangeCommand(string Token) : IRequest<OperationResultDto>;

public sealed class ConfirmEmailChangeCommandValidator : AbstractValidator<ConfirmEmailChangeCommand>
{
    public ConfirmEmailChangeCommandValidator()
    {
        RuleFor(command => command.Token)
            .NotEmpty().WithMessage("El token de confirmación es obligatorio.");
    }
}

public sealed class ConfirmEmailChangeCommandHandler
    : IRequestHandler<ConfirmEmailChangeCommand, OperationResultDto>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ConfirmEmailChangeCommandHandler(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationResultDto> Handle(
        ConfirmEmailChangeCommand request,
        CancellationToken cancellationToken)
    {
        var tokenHash = TokenGenerator.Hash(request.Token.Trim());
        var user = await _users.GetByEmailChangeHashAsync(tokenHash, cancellationToken);
        var now = _clock.UtcNow;

        if (user is null ||
            user.Status != UserStatus.Active ||
            string.IsNullOrWhiteSpace(user.PendingNormalizedEmail) ||
            user.EmailChangeExpiresAtUtc is null ||
            user.EmailChangeExpiresAtUtc.Value <= now)
        {
            throw new AppException(
                400,
                "invalid_token",
                "El enlace de confirmación de cambio de correo no es válido o venció.");
        }

        if (await _users.EmailExistsAsync(user.PendingNormalizedEmail, cancellationToken))
        {
            throw new ConflictAppException(
                "email_already_registered",
                "El correo nuevo ya está ocupado por otra cuenta.");
        }

        user.ConfirmEmailChange(now);
        await _refreshTokens.RevokeAllForUserAsync(user.Id, now, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.ProfileConfirmEmailChange,
            AuditActions.ProfileConfirmEmailChange,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                emailChanged = true,
                emailVerified = true,
                sessionsRevoked = true
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationResultDto(user.PublicId, "completed", user.RowVersion);
    }
}
