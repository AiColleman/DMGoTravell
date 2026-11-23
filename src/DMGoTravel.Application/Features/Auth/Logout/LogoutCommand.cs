using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Logout;

public sealed record LogoutCommand(string? RawRefreshToken) : IRequest;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public LogoutCommandHandler(
        IRefreshTokenRepository refreshTokens,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _refreshTokens = refreshTokens;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RawRefreshToken))
        {
            return;
        }

        var token = await _refreshTokens.GetByTokenHashAsync(
            TokenGenerator.Hash(request.RawRefreshToken),
            cancellationToken);

        if (token is null)
        {
            return;
        }

        await _refreshTokens.RevokeFamilyAsync(token.FamilyId, _clock.UtcNow, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.Logout,
            AuditActions.Logout,
            AuditActions.ActorHuman,
            token.User.Id,
            "user_account",
            token.User.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { familyId = token.FamilyId, loggedOut = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
