using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<User?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailVerificationHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task<User?> GetByPasswordResetHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailChangeHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
}
