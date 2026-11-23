using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Refresh;

public sealed record RefreshCommand(string RawRefreshToken) : IRequest<AuthResult>;

public sealed class RefreshCommandHandler : IRequestHandler<RefreshCommand, AuthResult>
{
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public RefreshCommandHandler(
        IRefreshTokenRepository refreshTokens,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _refreshTokens = refreshTokens;
        _jwt = jwt;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<AuthResult> Handle(RefreshCommand request, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var token = await _refreshTokens.GetByTokenHashAsync(
            TokenGenerator.Hash(request.RawRefreshToken),
            cancellationToken);

        if (token is null)
        {
            throw new UnauthorizedAppException();
        }

        if (token.ConsumedAtUtc is not null)
        {
            _audit.Record(new AuditEntry(
                AuditActions.Refresh,
                AuditActions.Refresh,
                AuditActions.ActorHuman,
                token.User.Id,
                "user_account",
                token.User.PublicId.ToString(),
                AuditActions.Failure,
                JsonSerializer.Serialize(new { familyId = token.FamilyId, reuseDetected = true })));

            await _refreshTokens.RevokeFamilyAsync(token.FamilyId, now, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAppException("La sesión fue revocada; vuelva a iniciar sesión.");
        }

        if (!token.IsUsable(now) || token.User.Status != UserStatus.Active)
        {
            throw new UnauthorizedAppException();
        }

        if (token.User.SecurityVersion != token.SecurityVersion)
        {
            throw new UnauthorizedAppException("La sesión fue revocada; vuelva a iniciar sesión.");
        }

        var newRawRefresh = TokenGenerator.CreateOpaqueToken();
        var newHash = TokenGenerator.Hash(newRawRefresh);
        token.Consume(newHash, now);

        var replacement = RefreshToken.Create(
            token.User,
            token.FamilyId,
            newHash,
            now,
            token.FamilyExpiresAtUtc);

        await _refreshTokens.AddAsync(replacement, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.Refresh,
            AuditActions.Refresh,
            AuditActions.ActorHuman,
            token.User.Id,
            "user_account",
            token.User.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { familyId = token.FamilyId, rotated = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var access = _jwt.CreateAccessToken(token.User, token.FamilyId);
        var session = new AuthSessionDto(
            access.Token,
            "Bearer",
            Math.Max(1, (int)Math.Ceiling((access.ExpiresAtUtc - now).TotalSeconds)),
            AuthMapper.ToSummary(token.User));

        return new AuthResult(
            session,
            newRawRefresh,
            token.FamilyExpiresAtUtc,
            TokenGenerator.CreateOpaqueToken(24));
    }
}
