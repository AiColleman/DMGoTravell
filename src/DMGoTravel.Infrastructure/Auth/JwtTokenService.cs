using System.Security.Claims;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace DMGoTravel.Infrastructure.Auth;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtKeyProvider _keys;
    private readonly IDateTimeProvider _clock;

    public JwtTokenService(JwtKeyProvider keys, IDateTimeProvider clock)
    {
        _keys = keys;
        _clock = clock;
    }

    public AccessTokenResult CreateAccessToken(User user, Guid familyId)
    {
        var now = _clock.UtcNow;
        var expiresAtUtc = now.AddMinutes(Math.Max(1, _keys.Options.AccessTokenMinutes));

        var claims = new[]
        {
            new Claim("sub", user.PublicId.ToString()),
            new Claim("jti", Guid.NewGuid().ToString()),
            new Claim("sid", familyId.ToString()),
            new Claim("role", user.Role),
            new Claim("email", user.Email),
            new Claim("email_verified", user.IsEmailVerified ? "true" : "false"),
            new Claim("ver", user.SecurityVersion.ToString())
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _keys.Options.Issuer,
            Audience = _keys.Options.Audience,
            Expires = expiresAtUtc,
            NotBefore = now,
            IssuedAt = now,
            SigningCredentials = _keys.CreateSigningCredentials()
        };

        var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return new AccessTokenResult(token, expiresAtUtc);
    }
}
