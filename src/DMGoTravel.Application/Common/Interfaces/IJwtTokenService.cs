using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record AccessTokenResult(string Token, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    AccessTokenResult CreateAccessToken(User user, Guid familyId);
}
