using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthResult>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("El correo es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo no es válido.");

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage("La contraseña es obligatoria.");
    }
}

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResult>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public LoginCommandHandler(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<AuthResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.GetByNormalizedEmailAsync(
            request.Email.Trim().ToUpperInvariant(),
            cancellationToken);

        if (user is null ||
            user.Status != UserStatus.Active ||
            !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            _audit.Record(new AuditEntry(
                AuditActions.Login,
                AuditActions.Login,
                user is null ? AuditActions.ActorUnidentified : AuditActions.ActorHuman,
                user?.Id,
                "user_account",
                user?.PublicId.ToString() ?? "unknown",
                AuditActions.Failure,
                JsonSerializer.Serialize(new { reason = "invalid_credentials" })));

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new InvalidCredentialsAppException();
        }

        var now = _clock.UtcNow;
        var familyId = Guid.NewGuid();
        var familyExpiresAtUtc = now.AddDays(14);
        var refreshToken = TokenGenerator.CreateOpaqueToken();
        var refresh = RefreshToken.Create(
            user,
            familyId,
            TokenGenerator.Hash(refreshToken),
            now,
            familyExpiresAtUtc);

        await _refreshTokens.AddAsync(refresh, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.Login,
            AuditActions.Login,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { familyId, sessionStarted = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var access = _jwt.CreateAccessToken(user, familyId);
        var session = new AuthSessionDto(
            access.Token,
            "Bearer",
            Math.Max(1, (int)Math.Ceiling((access.ExpiresAtUtc - now).TotalSeconds)),
            AuthMapper.ToSummary(user));

        return new AuthResult(
            session,
            refreshToken,
            familyExpiresAtUtc,
            TokenGenerator.CreateOpaqueToken(24));
    }
}
