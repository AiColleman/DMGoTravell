using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _db;

    public RefreshTokenRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default) =>
        _db.RefreshTokens.AddAsync(token, cancellationToken).AsTask();

    public Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        _db.RefreshTokens
            .Include(token => token.User)
            .ThenInclude(user => user.Profile)
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

    public async Task RevokeFamilyAsync(Guid familyId, DateTime revokedAtUtc, CancellationToken cancellationToken = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(token => token.FamilyId == familyId && token.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.Revoke(revokedAtUtc);
        }
    }

    public async Task RevokeAllForUserAsync(long userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.Revoke(revokedAtUtc);
        }
    }

    public Task<bool> IsFamilyActiveAsync(
        Guid familyId,
        long userId,
        DateTime nowUtc,
        CancellationToken cancellationToken = default) =>
        _db.RefreshTokens.AnyAsync(
            token => token.FamilyId == familyId &&
                     token.UserId == userId &&
                     token.RevokedAtUtc == null &&
                     token.ExpiresAtUtc > nowUtc,
            cancellationToken);
}
