using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace DMGoTravel.Infrastructure.Auth;

/// <summary>
/// Carga la clave RSA de firma. En Development genera una clave local fuera del repositorio;
/// en otros entornos exige una clave configurada explícitamente.
/// </summary>
public sealed class JwtKeyProvider : IDisposable
{
    private readonly RSA _rsa;

    public JwtOptions Options { get; }

    public JwtKeyProvider(IConfiguration configuration, IHostEnvironment environment)
    {
        Options = configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

        var pem = Options.PrivateKeyPem;
        if (string.IsNullOrWhiteSpace(pem) && !string.IsNullOrWhiteSpace(Options.PrivateKeyPath))
        {
            pem = File.ReadAllText(Options.PrivateKeyPath);
        }

        if (string.IsNullOrWhiteSpace(pem))
        {
            if (!environment.IsDevelopment())
            {
                throw new InvalidOperationException(
                    "Jwt:PrivateKeyPem o Jwt:PrivateKeyPath es obligatorio fuera de Development.");
            }

            var keyDirectory = Path.Combine(environment.ContentRootPath, "App_Data");
            Directory.CreateDirectory(keyDirectory);
            var keyPath = Path.Combine(keyDirectory, "dev-jwt-key.pem");

            if (!File.Exists(keyPath))
            {
                using var generator = RSA.Create(2048);
                File.WriteAllText(keyPath, generator.ExportPkcs8PrivateKeyPem());
            }

            pem = File.ReadAllText(keyPath);
        }

        _rsa = RSA.Create();
        _rsa.ImportFromPem(pem);
    }

    public SigningCredentials CreateSigningCredentials() =>
        new(new RsaSecurityKey(_rsa), SecurityAlgorithms.RsaSha256);

    public TokenValidationParameters CreateValidationParameters() => new()
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new RsaSecurityKey(_rsa),
        ValidateIssuer = true,
        ValidIssuer = Options.Issuer,
        ValidateAudience = true,
        ValidAudience = Options.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(5),
        NameClaimType = "sub",
        RoleClaimType = "role"
    };

    public void Dispose() => _rsa.Dispose();
}
