using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task RevokeFamilyAsync(Guid familyId, DateTime revokedAtUtc, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(long userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default);
    Task<bool> IsFamilyActiveAsync(Guid familyId, long userId, DateTime nowUtc, CancellationToken cancellationToken = default);
}
