namespace DMGoTravel.Application.Common.Interfaces;

public sealed record GoogleOAuthStartResult(string AuthorizationUrl, string State);

public sealed record GoogleUserInfo(
    string Subject,
    string Email,
    bool EmailVerified,
    string FullName,
    string? PictureUrl);

public sealed record GoogleOAuthExchangeResult(
    GoogleUserInfo User,
    string? ReturnUrl);

/// <summary>
/// Puerto de integración con Google OAuth 2.0 / OpenID Connect (Authorization Code + PKCE).
/// </summary>
public interface IGoogleOAuthService
{
    bool IsConfigured { get; }
    string FrontendBaseUrl { get; }
    GoogleOAuthStartResult CreateAuthorizationStart(string? returnUrl);
    Task<GoogleOAuthExchangeResult> ExchangeCodeAsync(
        string code,
        string state,
        CancellationToken cancellationToken = default);
}
