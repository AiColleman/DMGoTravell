using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.ResetPassword;

public sealed record ResetPasswordCommand(string Token, string NewPassword)
    : IRequest<OperationResultDto>;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(command => command.Token)
            .NotEmpty().WithMessage("La prueba es obligatoria.");

        RuleFor(command => command.NewPassword)
            .NotEmpty().WithMessage("La contraseña es obligatoria.")
            .MinimumLength(12).WithMessage("La contraseña debe tener al menos 12 caracteres.")
            .MaximumLength(128).WithMessage("La contraseña no puede exceder 128 caracteres.");
    }
}

/// <summary>
/// Consume un enlace de restablecimiento de un solo uso: cambia la contraseña, invalida
/// el enlace y revoca todas las sesiones del usuario (DEC-144/DEC-147).
/// </summary>
public sealed class ResetPasswordCommandHandler
    : IRequestHandler<ResetPasswordCommand, OperationResultDto>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ResetPasswordCommandHandler(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IPasswordHasher passwordHasher,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationResultDto> Handle(
        ResetPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var user = await _users.GetByPasswordResetHashAsync(
            TokenGenerator.Hash(request.Token),
            cancellationToken);

        if (user is null ||
            user.Status != UserStatus.Active ||
            user.PasswordResetExpiresAtUtc is null ||
            user.PasswordResetExpiresAtUtc <= now)
        {
            throw new AppException(
                400,
                "invalid_token",
                "La prueba no es válida, venció o ya se usó.");
        }

        var newPasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.ChangePassword(newPasswordHash);
        await _refreshTokens.RevokeAllForUserAsync(user.Id, now, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.ResetPassword,
            AuditActions.ResetPassword,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                passwordChanged = true,
                sessionsRevoked = true,
                securityVersion = user.SecurityVersion
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationResultDto(user.PublicId, "completed", user.RowVersion);
    }
}
