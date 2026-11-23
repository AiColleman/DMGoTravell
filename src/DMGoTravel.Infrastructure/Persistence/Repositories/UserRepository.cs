using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _db;

    public UserRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task<User?> GetByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(user => user.Profile)
            .SingleOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<User?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(user => user.Profile)
            .SingleOrDefaultAsync(user => user.PublicId == publicId, cancellationToken);

    public Task<User?> GetByEmailVerificationHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(user => user.Profile)
            .SingleOrDefaultAsync(user => user.EmailVerificationTokenHash == tokenHash, cancellationToken);

    public Task<User?> GetByPasswordResetHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(user => user.Profile)
            .SingleOrDefaultAsync(user => user.PasswordResetTokenHash == tokenHash, cancellationToken);

    public Task<User?> GetByEmailChangeHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(user => user.Profile)
            .SingleOrDefaultAsync(user => user.EmailChangeTokenHash == tokenHash, cancellationToken);

    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
        _db.Users.AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        _db.Users.AddAsync(user, cancellationToken).AsTask();
}
