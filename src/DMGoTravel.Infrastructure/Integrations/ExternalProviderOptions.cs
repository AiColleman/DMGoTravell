namespace DMGoTravel.Infrastructure.Integrations;

public sealed class ExternalProviderOptions
{
    public string CulqiWebhookSecret { get; set; } = "whsec_dev_culqi_local_secret";
    public string ResendWebhookSecret { get; set; } = "whsec_dev_resend_local_secret";
    public string ResendFromEmail { get; set; } = "notificaciones@dmgotravel.com";
    public string LocalMediaRootPath { get; set; } = Path.Combine(AppContext.BaseDirectory, "App_Data", "media");
}
