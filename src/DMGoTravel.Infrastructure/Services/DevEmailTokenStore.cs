using System.Collections.Concurrent;
using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Infrastructure.Services;

public sealed class DevEmailTokenStore : IDevEmailTokenStore
{
    private readonly ConcurrentDictionary<string, string> _tokens =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly ConcurrentDictionary<string, string> _passwordResetTokens =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly ConcurrentDictionary<string, string> _emailChangeTokens =
        new(StringComparer.OrdinalIgnoreCase);

    public void Set(string email, string token) => _tokens[email] = token;

    public bool TryGet(string email, out string? token) => _tokens.TryGetValue(email, out token);

    public void SetPasswordReset(string email, string token) => _passwordResetTokens[email] = token;

    public bool TryGetPasswordReset(string email, out string? token) =>
        _passwordResetTokens.TryGetValue(email, out token);

    public void SetEmailChange(string newEmail, string token) => _emailChangeTokens[newEmail] = token;

    public bool TryGetEmailChange(string newEmail, out string? token) =>
        _emailChangeTokens.TryGetValue(newEmail, out token);
}
