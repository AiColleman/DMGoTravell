using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Auth;

/// <summary>
/// Implementación real de Google OAuth 2.0 / OpenID Connect usando Authorization Code + PKCE (S256).
/// </summary>
public sealed class GoogleOAuthService : IGoogleOAuthService
{
    private const string CachePrefix = "dmgo:google_oauth_state:";
    private static readonly TimeSpan StateTtl = TimeSpan.FromMinutes(10);

    private readonly GoogleOAuthOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;

    private sealed record PendingOAuthState(string CodeVerifier, string? ReturnUrl);

    public GoogleOAuthService(
        IOptions<GoogleOAuthOptions> options,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _cache = cache;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.ClientId) &&
        !string.IsNullOrWhiteSpace(_options.ClientSecret);

    public string FrontendBaseUrl =>
        string.IsNullOrWhiteSpace(_options.FrontendBaseUrl)
            ? "http://localhost:5174"
            : _options.FrontendBaseUrl.TrimEnd('/');

    public GoogleOAuthStartResult CreateAuthorizationStart(string? returnUrl)
    {
        EnsureConfigured();

        var state = CreateBase64UrlToken(32);
        var codeVerifier = CreateBase64UrlToken(32);
        var codeChallenge = ComputeS256Challenge(codeVerifier);
        var safeReturnUrl = SanitizeReturnUrl(returnUrl);

        _cache.Set(
            CachePrefix + state,
            new PendingOAuthState(codeVerifier, safeReturnUrl),
            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = StateTtl });

        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _options.ClientId.Trim(),
            ["redirect_uri"] = _options.RedirectUri.Trim(),
            ["response_type"] = "code",
            ["scope"] = "openid email profile",
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256",
            ["access_type"] = "online",
            ["prompt"] = "select_account"
        };

        var authorizationUrl = QueryHelpers.AddQueryString(_options.AuthorizationEndpoint, query);
        return new GoogleOAuthStartResult(authorizationUrl, state);
    }

    public async Task<GoogleOAuthExchangeResult> ExchangeCodeAsync(
        string code,
        string state,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        {
            throw new UnauthorizedAppException("Faltan los parámetros 'code' o 'state' de Google OAuth.");
        }

        var cacheKey = CachePrefix + state.Trim();
        if (!_cache.TryGetValue<PendingOAuthState>(cacheKey, out var pending) || pending is null)
        {
            throw new UnauthorizedAppException(
                "La sesión temporal de Google OAuth expiró o ya fue utilizada. Vuelve a intentarlo.");
        }

        // Consumo de un solo uso para prevenir replay y CSRF.
        _cache.Remove(cacheKey);

        var http = _httpClientFactory.CreateClient("GoogleOAuth");

        using var tokenContent = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code.Trim(),
            ["client_id"] = _options.ClientId.Trim(),
            ["client_secret"] = _options.ClientSecret.Trim(),
            ["redirect_uri"] = _options.RedirectUri.Trim(),
            ["grant_type"] = "authorization_code",
            ["code_verifier"] = pending.CodeVerifier
        });

        using var tokenResponse = await http.PostAsync(_options.TokenEndpoint, tokenContent, cancellationToken);
        var tokenPayload = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);

        if (!tokenResponse.IsSuccessStatusCode)
        {
            throw new UnauthorizedAppException(
                "Google rechazó el código de autorización. Verifica las credenciales y la URI de redirección configurada.");
        }

        string? accessToken;
        using (var tokenDoc = JsonDocument.Parse(tokenPayload))
        {
            accessToken = tokenDoc.RootElement.TryGetProperty("access_token", out var atProp)
                ? atProp.GetString()
                : null;
        }

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAppException("Google no devolvió un token de acceso válido.");
        }

        using var userInfoReq = new HttpRequestMessage(HttpMethod.Get, _options.UserInfoEndpoint);
        userInfoReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var userInfoResp = await http.SendAsync(userInfoReq, cancellationToken);
        var userInfoPayload = await userInfoResp.Content.ReadAsStringAsync(cancellationToken);

        if (!userInfoResp.IsSuccessStatusCode)
        {
            throw new UnauthorizedAppException("No se pudo obtener el perfil verificado desde Google.");
        }

        using var userDoc = JsonDocument.Parse(userInfoPayload);
        var root = userDoc.RootElement;

        var sub = root.TryGetProperty("sub", out var subProp) ? subProp.GetString() : null;
        var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
        var emailVerified = root.TryGetProperty("email_verified", out var verProp) &&
                            verProp.ValueKind == JsonValueKind.True;
        var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
        var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

        if (string.IsNullOrWhiteSpace(sub) || string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAppException("Google no proporcionó una identidad de correo válida.");
        }

        if (!emailVerified)
        {
            throw new ConflictAppException(
                "google_email_unverified",
                "Tu cuenta de Google debe tener el correo electrónico verificado para ingresar.");
        }

        var displayName = string.IsNullOrWhiteSpace(name)
            ? email.Split('@')[0]
            : name.Trim();

        return new GoogleOAuthExchangeResult(
            new GoogleUserInfo(sub, email.Trim().ToLowerInvariant(), emailVerified, displayName, picture),
            pending.ReturnUrl);
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new AppException(
                503,
                "google_oauth_not_configured",
                "La autenticación real con Google OAuth 2.0 requiere configurar GoogleOAuth:ClientId y GoogleOAuth:ClientSecret en appsettings.Local.json o variables de entorno.");
        }
    }

    private static string CreateBase64UrlToken(int byteLength)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private static string ComputeS256Challenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
        return WebEncoders.Base64UrlEncode(hash);
    }

    private static string? SanitizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return null;
        }

        var trimmed = returnUrl.Trim();
        if (!trimmed.StartsWith('/') || trimmed.StartsWith("//", StringComparison.Ordinal))
        {
            return null;
        }

        return trimmed;
    }
}
