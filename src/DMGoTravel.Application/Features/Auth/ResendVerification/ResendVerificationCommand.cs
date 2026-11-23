using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.ResendVerification;

public sealed record ResendVerificationCommand(string IdempotencyKey)
    : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "auth.resend_verification";

    public string GetRequestFingerprint() => "resend-verification";
}

public sealed class ResendVerificationCommandValidator : AbstractValidator<ResendVerificationCommand>
{
    public ResendVerificationCommandValidator()
    {
        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

/// <summary>
/// Reemite la verificación del correo vigente del titular (005-C). Solo la última
/// solicitud admitida conserva un enlace utilizable; pedir otro no verifica la cuenta.
/// </summary>
public sealed class ResendVerificationCommandHandler
    : IRequestHandler<ResendVerificationCommand, OperationAcceptedDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDevEmailTokenStore _devEmailTokens;
    private readonly IAuditWriter _audit;

    public ResendVerificationCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IDevEmailTokenStore devEmailTokens,
        IAuditWriter audit)
    {
        _currentUser = currentUser;
        _users = users;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _devEmailTokens = devEmailTokens;
        _audit = audit;
    }

    public async Task<OperationAcceptedDto> Handle(
        ResendVerificationCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null || user.Status != UserStatus.Active)
        {
            throw new UnauthorizedAppException();
        }

        if (user.IsEmailVerified)
        {
            throw new ConflictAppException(
                "already_verified",
                "La cuenta ya está verificada; no se emite otro enlace.");
        }

        var now = _clock.UtcNow;
        var expiresAt = now.AddHours(AuthTokenPolicy.EmailVerificationHours);
        var verificationToken = TokenGenerator.CreateOpaqueToken();

        user.SetEmailVerificationToken(TokenGenerator.Hash(verificationToken), expiresAt);

        _audit.Record(new AuditEntry(
            AuditActions.ResendVerification,
            AuditActions.ResendVerification,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { expiresAt, supersededPrevious = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _devEmailTokens.Set(user.Email, verificationToken);

        return new OperationAcceptedDto(Guid.NewGuid(), "accepted", now, expiresAt);
    }
}
