namespace DMGoTravel.Infrastructure.Auth;

/// <summary>
/// Configuración de credenciales y endpoints oficiales de Google OAuth 2.0 / OIDC.
/// Las credenciales reales (ClientId y ClientSecret) deben definirse fuera de Git
/// en appsettings.Local.json, dotnet user-secrets o variables de entorno.
/// </summary>
public sealed class GoogleOAuthOptions
{
    public const string SectionName = "GoogleOAuth";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = "http://localhost:5174/acceso";
    public string FrontendBaseUrl { get; set; } = "http://localhost:5174";
    public string AuthorizationEndpoint { get; set; } = "https://accounts.google.com/o/oauth2/v2/auth";
    public string TokenEndpoint { get; set; } = "https://oauth2.googleapis.com/token";
    public string UserInfoEndpoint { get; set; } = "https://openidconnect.googleapis.com/v1/userinfo";
}
