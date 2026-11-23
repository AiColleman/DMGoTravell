using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Common.Security;

/// <summary>
/// Comprueba que el solicitante siga siendo administrador vigente antes de leer
/// datos administrativos. No se apoya solo en la firma del access token: relee
/// rol, estado, versión de seguridad y familia de sesión actuales.
/// </summary>
public interface IAdminAccessGuard
{
    Task EnsureAdminAsync(CancellationToken cancellationToken = default);
}

public sealed class AdminAccessGuard : IAdminAccessGuard
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IDateTimeProvider _clock;

    public AdminAccessGuard(
        ICurrentUser currentUser,
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IDateTimeProvider clock)
    {
        _currentUser = currentUser;
        _users = users;
        _refreshTokens = refreshTokens;
        _clock = clock;
    }

    public async Task EnsureAdminAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null ||
            user.DeletedAtUtc is not null ||
            user.Status != UserStatus.Active ||
            user.Role != UserRole.Admin)
        {
            throw new ForbiddenAppException();
        }

        if (_currentUser.SecurityVersion is null ||
            _currentUser.SecurityVersion.Value != user.SecurityVersion)
        {
            throw new ForbiddenAppException(
                "forbidden",
                "La autorización de la sesión ya no es vigente.");
        }

        if (_currentUser.SessionId is null ||
            !await _refreshTokens.IsFamilyActiveAsync(
                _currentUser.SessionId.Value,
                user.Id,
                _clock.UtcNow,
                cancellationToken))
        {
            throw new ForbiddenAppException(
                "forbidden",
                "La sesión ya no está vigente.");
        }
    }
}
