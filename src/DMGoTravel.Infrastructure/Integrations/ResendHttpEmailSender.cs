using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Integrations;

/// <summary>
/// Adaptador HTTP oficial de Resend (https://api.resend.com/emails).
/// Cuando Resend:ApiKey está configurada envía correos reales con diseño HTML editorial;
/// cuando está vacía (ej. pruebas automatizadas en CI o entorno local sin clave) opera
/// en modo simulado seguro sin llamadas de red externas.
/// </summary>
public sealed class ResendHttpEmailSender : IEmailSender
{
    private readonly ExternalProviderOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ResendHttpEmailSender> _logger;

    public ResendHttpEmailSender(
        IOptions<ExternalProviderOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<ResendHttpEmailSender> logger)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string FrontendBaseUrl =>
        string.IsNullOrWhiteSpace(_options.FrontendBaseUrl)
            ? "http://localhost:5174"
            : _options.FrontendBaseUrl.TrimEnd('/');

    public async Task<EmailSendResult> SendAsync(
        EmailSendRequest request,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _options.ResendApiKey?.Trim();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            var simId = $"sim_email_{Guid.NewGuid():N}";
            _logger.LogInformation(
                "Resend:ApiKey no configurada; correo '{Template}' para {Recipient} registrado en modo simulado ({SimId}).",
                request.Template,
                MaskEmail(request.ToEmail),
                simId);

            return new EmailSendResult(
                Sent: true,
                Provider: "resend",
                ProviderMessageId: simId);
        }

        try
        {
            var client = _httpClientFactory.CreateClient("Resend");
            using var httpReq = new HttpRequestMessage(HttpMethod.Post, _options.ResendApiEndpoint);
            httpReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                httpReq.Headers.TryAddWithoutValidation("Idempotency-Key", request.IdempotencyKey.Trim());
            }

            var fromHeader = string.IsNullOrWhiteSpace(_options.ResendFromEmail)
                ? "DM GO TRAVEL <onboarding@resend.dev>"
                : _options.ResendFromEmail.Trim();

            var htmlBody = BuildEditorialHtml(request);

            httpReq.Content = JsonContent.Create(new
            {
                from = fromHeader,
                to = new[] { request.ToEmail.Trim() },
                subject = request.Subject,
                html = htmlBody,
                text = request.BodyText
            });

            using var response = await client.SendAsync(httpReq, cancellationToken);
            var rawBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Resend devolvió HTTP {StatusCode} al enviar '{Template}' a {Recipient}: {Response}",
                    (int)response.StatusCode,
                    request.Template,
                    MaskEmail(request.ToEmail),
                    rawBody);

                return new EmailSendResult(
                    Sent: false,
                    Provider: "resend",
                    ProviderMessageId: null,
                    Error: $"Resend HTTP {(int)response.StatusCode}: {Truncate(rawBody, 240)}");
            }

            string? messageId = null;
            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                using var doc = JsonDocument.Parse(rawBody);
                if (doc.RootElement.TryGetProperty("id", out var idProp))
                {
                    messageId = idProp.GetString();
                }
            }

            messageId ??= $"re_{Guid.NewGuid():N}";
            _logger.LogInformation(
                "Correo '{Template}' enviado vía Resend a {Recipient} (ID: {MessageId}).",
                request.Template,
                MaskEmail(request.ToEmail),
                messageId);

            return new EmailSendResult(
                Sent: true,
                Provider: "resend",
                ProviderMessageId: messageId);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Excepción de red al enviar correo '{Template}' vía Resend a {Recipient}.",
                request.Template,
                MaskEmail(request.ToEmail));

            return new EmailSendResult(
                Sent: false,
                Provider: "resend",
                ProviderMessageId: null,
                Error: Truncate(ex.Message, 240));
        }
    }

    private static string BuildEditorialHtml(EmailSendRequest req)
    {
        var safeSubject = WebUtility.HtmlEncode(req.Subject);
        var paragraphs = (req.BodyText ?? string.Empty)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line => $"<p style=\"margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;\">{WebUtility.HtmlEncode(line.Trim())}</p>");

        var bodyHtml = string.Join("", paragraphs);

        var buttonHtml = !string.IsNullOrWhiteSpace(req.ActionUrl) && !string.IsNullOrWhiteSpace(req.ActionLabel)
            ? $"""
               <div style="margin:24px 0;">
                 <a href="{WebUtility.HtmlEncode(req.ActionUrl)}"
                    style="display:inline-block;background:#B84A27;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">
                   {WebUtility.HtmlEncode(req.ActionLabel)}
                 </a>
               </div>
               """
            : string.Empty;

        var codeHtml = !string.IsNullOrWhiteSpace(req.HighlightCode)
            ? $"""
               <div style="margin:20px 0;padding:14px 16px;background:#FAF7F2;border:1px solid #E5DDD0;border-radius:10px;">
                 <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5C6B73;margin-bottom:6px;font-weight:700;">
                   Código de verificación / seguridad
                 </div>
                 <code style="font-family:Consolas,Monaco,monospace;font-size:14px;color:#12232E;word-break:break-all;font-weight:700;">
                   {WebUtility.HtmlEncode(req.HighlightCode)}
                 </code>
               </div>
               """
            : string.Empty;

        return $"""
                <!DOCTYPE html>
                <html lang="es">
                <body style="margin:0;padding:24px;background:#F7F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E5DDD0;border-radius:16px;overflow:hidden;">
                    <div style="background:#12232E;padding:20px 28px;color:#FAF7F2;">
                      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C89B54;font-weight:700;">
                        DM GO TRAVEL · Viajes Perú Premium
                      </div>
                      <h1 style="margin:6px 0 0;font-size:20px;font-weight:600;color:#FFFFFF;">
                        {safeSubject}
                      </h1>
                    </div>
                    <div style="padding:28px;">
                      {bodyHtml}
                      {buttonHtml}
                      {codeHtml}
                      <hr style="border:none;border-top:1px solid #E5DDD0;margin:24px 0 16px;" />
                      <p style="margin:0;font-size:12px;color:#5C6B73;line-height:1.5;">
                        DM GO TRAVEL · Ayacucho, Perú · Atención WhatsApp: 913 249 767 / 969 167 443
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """;
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "***";
        var at = email.IndexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email[at..] : string.Empty);
        return $"{email[0]}***{email[at..]}";
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}
