namespace DMGoTravel.Infrastructure.Integrations;

public sealed class ExternalProviderOptions
{
    public string CulqiWebhookSecret { get; set; } = "whsec_dev_culqi_local_secret";
    public string ResendApiKey { get; set; } = string.Empty;
    public string ResendApiEndpoint { get; set; } = "https://api.resend.com/emails";
    public string ResendWebhookSecret { get; set; } = "whsec_dev_resend_local_secret";
    public string ResendFromEmail { get; set; } = "DM GO TRAVEL <onboarding@resend.dev>";
    public string FrontendBaseUrl { get; set; } = "http://localhost:5174";
    public string LocalMediaRootPath { get; set; } = Path.Combine(AppContext.BaseDirectory, "App_Data", "media");
}
