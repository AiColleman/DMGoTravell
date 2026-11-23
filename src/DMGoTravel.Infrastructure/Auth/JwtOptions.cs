namespace DMGoTravel.Infrastructure.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "DMGoTravel.Api";
    public string Audience { get; set; } = "DMGoTravel.Client";
    public int AccessTokenMinutes { get; set; } = 5;
    public string? PrivateKeyPem { get; set; }
    public string? PrivateKeyPath { get; set; }
}
