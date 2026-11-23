using DMGoTravel.Application.Features.Auth.Dtos;

namespace DMGoTravel.Api.Auth;

internal static class AuthCookies
{
    public const string RefreshCookie = "dmgo_refresh";
    public const string CsrfCookie = "dmgo_csrf";
    public const string CsrfHeader = "X-CSRF-Token";

    public static void Write(HttpContext context, AuthResult result, bool secure)
    {
        var refreshOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = result.RefreshExpiresAtUtc
        };

        var csrfOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = secure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = result.RefreshExpiresAtUtc
        };

        context.Response.Cookies.Append(RefreshCookie, result.RefreshToken, refreshOptions);
        context.Response.Cookies.Append(CsrfCookie, result.CsrfToken, csrfOptions);
    }

    public static void Clear(HttpContext context)
    {
        context.Response.Cookies.Delete(RefreshCookie, new CookieOptions
        {
            Path = "/",
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Strict
        });

        context.Response.Cookies.Delete(CsrfCookie, new CookieOptions
        {
            Path = "/",
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Strict
        });
    }

    public static bool HasValidCsrf(HttpContext context)
    {
        var header = context.Request.Headers[CsrfHeader].ToString();
        var cookie = context.Request.Cookies[CsrfCookie];
        return !string.IsNullOrWhiteSpace(header) &&
               !string.IsNullOrWhiteSpace(cookie) &&
               string.Equals(header, cookie, StringComparison.Ordinal);
    }
}
