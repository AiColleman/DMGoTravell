using System.Security.Cryptography;
using System.Text;
using DMGoTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Integrations;

/// <summary>
/// Verifica firmas criptográficas de webhooks Culqi (HMAC-SHA256 hex) y Resend/Svix (v1,base64).
/// </summary>
public sealed class HmacWebhookSignatureVerifier : IWebhookSignatureVerifier
{
    private readonly ExternalProviderOptions _options;

    public HmacWebhookSignatureVerifier(IOptions<ExternalProviderOptions> options)
    {
        _options = options.Value;
    }

    public bool VerifyCulqiSignature(string rawBody, string? signatureHeader)
    {
        if (string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(_options.CulqiWebhookSecret))
        {
            return false;
        }

        var provided = signatureHeader.Trim();
        if (provided.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            provided = provided["sha256=".Length..];
        }

        var expectedHex = ComputeHexHmac(_options.CulqiWebhookSecret, rawBody);
        return FixedTimeEqualsUtf8(provided.ToLowerInvariant(), expectedHex.ToLowerInvariant());
    }

    public bool VerifyResendSignature(string rawBody, string? svixId, string? svixTimestamp, string? svixSignature)
    {
        if (string.IsNullOrWhiteSpace(svixId) ||
            string.IsNullOrWhiteSpace(svixTimestamp) ||
            string.IsNullOrWhiteSpace(svixSignature) ||
            string.IsNullOrWhiteSpace(_options.ResendWebhookSecret))
        {
            return false;
        }

        var signedPayload = $"{svixId.Trim()}.{svixTimestamp.Trim()}.{rawBody}";
        var keyBytes = ResolveSvixSecretBytes(_options.ResendWebhookSecret);
        using var hmac = new HMACSHA256(keyBytes);
        var expectedBase64 = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload)));

        // Svix permite múltiples firmas separadas por espacio: "v1,<base64> v1,<base64>"
        foreach (var token in svixSignature.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var commaIndex = token.IndexOf(',');
            if (commaIndex <= 0 || commaIndex >= token.Length - 1)
            {
                continue;
            }

            var version = token[..commaIndex];
            var candidate = token[(commaIndex + 1)..];
            if (string.Equals(version, "v1", StringComparison.Ordinal) &&
                FixedTimeEqualsUtf8(candidate, expectedBase64))
            {
                return true;
            }
        }

        return false;
    }

    public static string ComputeHexHmac(string secret, string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string ComputeSvixSignature(string secret, string svixId, string svixTimestamp, string payload)
    {
        var signedPayload = $"{svixId.Trim()}.{svixTimestamp.Trim()}.{payload}";
        using var hmac = new HMACSHA256(ResolveSvixSecretBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        return $"v1,{Convert.ToBase64String(hash)}";
    }

    private static byte[] ResolveSvixSecretBytes(string secret)
    {
        var trimmed = secret.Trim();
        if (trimmed.StartsWith("whsec_", StringComparison.Ordinal))
        {
            var body = trimmed["whsec_".Length..];
            try
            {
                return Convert.FromBase64String(body);
            }
            catch (FormatException)
            {
                // En modo desarrollo/local se permiten secretos legibles no-base64.
            }
        }

        return Encoding.UTF8.GetBytes(trimmed);
    }

    private static bool FixedTimeEqualsUtf8(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return leftBytes.Length == rightBytes.Length &&
               CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
