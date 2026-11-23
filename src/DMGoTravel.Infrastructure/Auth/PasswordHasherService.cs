using DMGoTravel.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace DMGoTravel.Infrastructure.Auth;

public sealed class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<object> _hasher = new();
    private readonly object _user = new();

    public string Hash(string password) => _hasher.HashPassword(_user, password);

    public bool Verify(string password, string passwordHash) =>
        _hasher.VerifyHashedPassword(_user, passwordHash, password) != PasswordVerificationResult.Failed;
}
