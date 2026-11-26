using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Google;

public sealed record GoogleCallbackResult(AuthResult Auth, string? ReturnUrl);

public sealed record GoogleCallbackCommand(string Code, string State) : IRequest<GoogleCallbackResult>;

public sealed class GoogleCallbackCommandHandler
    : IRequestHandler<GoogleCallbackCommand, GoogleCallbackResult>
{
    private readonly IGoogleOAuthService _googleOAuth;
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public GoogleCallbackCommandHandler(
        IGoogleOAuthService googleOAuth,
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _googleOAuth = googleOAuth;
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<GoogleCallbackResult> Handle(
        GoogleCallbackCommand request,
        CancellationToken cancellationToken)
    {
        var exchange = await _googleOAuth.ExchangeCodeAsync(
            request.Code,
            request.State,
            cancellationToken);

        var googleUser = exchange.User;
        var normalizedEmail = googleUser.Email.Trim().ToUpperInvariant();
        var user = await _users.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);
        var isNewUser = false;

        if (user is not null)
        {
            if (user.Status != UserStatus.Active)
            {
                _audit.Record(new AuditEntry(
                    AuditActions.GoogleCallback,
                    AuditActions.GoogleCallback,
                    AuditActions.ActorHuman,
                    user.Id,
                    "user_account",
                    user.PublicId.ToString(),
                    AuditActions.Failure,
                    JsonSerializer.Serialize(new { provider = "google", reason = "account_closed" })));

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                throw new ConflictAppException(
                    "account_closed",
                    "Esta cuenta fue cerrada y no puede reactivarse mediante Google.");
            }

            if (!user.IsEmailVerified)
            {
                user.VerifyEmail();
            }
        }
        else
        {
            isNewUser = true;
            // Contraseña aleatoria criptográfica (no se expone) para cuentas creadas vía Google OIDC.
            var randomSecret = TokenGenerator.CreateOpaqueToken(32);
            user = User.CreateClient(
                googleUser.Email,
                _passwordHasher.Hash(randomSecret),
                googleUser.FullName,
                null);
            user.VerifyEmail();

            await _users.AddAsync(user, cancellationToken);
            // Persistimos primero para obtener el Id interno del usuario antes de crear el RefreshToken.
            await _unitOfWork.SaveChangesAsync(cancellationToken);
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
            AuditActions.GoogleCallback,
            AuditActions.GoogleCallback,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                provider = "google",
                isNewUser,
                familyId,
                sessionStarted = true
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var access = _jwt.CreateAccessToken(user, familyId);
        var session = new AuthSessionDto(
            access.Token,
            "Bearer",
            Math.Max(1, (int)Math.Ceiling((access.ExpiresAtUtc - now).TotalSeconds)),
            AuthMapper.ToSummary(user));

        var auth = new AuthResult(
            session,
            refreshToken,
            familyExpiresAtUtc,
            TokenGenerator.CreateOpaqueToken(24));

        return new GoogleCallbackResult(auth, exchange.ReturnUrl);
    }
}
