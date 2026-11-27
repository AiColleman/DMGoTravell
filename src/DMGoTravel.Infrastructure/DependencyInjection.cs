using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Infrastructure.Auth;
using DMGoTravel.Infrastructure.Integrations;
using DMGoTravel.Infrastructure.Payments;
using DMGoTravel.Infrastructure.Persistence;
using DMGoTravel.Infrastructure.Persistence.Caching;
using DMGoTravel.Infrastructure.Persistence.Exports;
using DMGoTravel.Infrastructure.Persistence.Idempotency;
using DMGoTravel.Infrastructure.Persistence.Repositories;
using DMGoTravel.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.AddSingleton<ICacheInvalidator, MemoryCacheInvalidator>();
        services.Configure<CatalogCacheOptions>(options =>
        {
            options.Enabled = configuration.GetValue("Caching:EnablePublicCatalogCache", true);
            options.TtlSeconds = configuration.GetValue("Caching:PublicCatalogTtlSeconds", 30);
        });

        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<JwtKeyProvider>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();
        services.AddSingleton<IPaymentGateway, SimulatedPaymentGateway>();
        services.AddSingleton<IRefundGateway, SimulatedRefundGateway>();
        services.AddHttpClient("Resend", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddSingleton<IEmailSender, ResendHttpEmailSender>();
        services.AddSingleton<IWebhookSignatureVerifier, HmacWebhookSignatureVerifier>();
        services.AddSingleton<IMediaStorage, LocalSandboxMediaStorage>();
        services.AddSingleton<IDevEmailTokenStore, DevEmailTokenStore>();

        services.Configure<GoogleOAuthOptions>(configuration.GetSection(GoogleOAuthOptions.SectionName));
        services.AddHttpClient("GoogleOAuth", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddSingleton<IGoogleOAuthService, GoogleOAuthService>();

        services.Configure<ExternalProviderOptions>(options =>
        {
            var culqiSecret = configuration["Culqi:WebhookSecret"];
            if (!string.IsNullOrWhiteSpace(culqiSecret))
            {
                options.CulqiWebhookSecret = culqiSecret;
            }

            var resendSecret = configuration["Resend:WebhookSecret"];
            if (!string.IsNullOrWhiteSpace(resendSecret))
            {
                options.ResendWebhookSecret = resendSecret;
            }

            var resendApiKey = configuration["Resend:ApiKey"];
            if (!string.IsNullOrWhiteSpace(resendApiKey))
            {
                options.ResendApiKey = resendApiKey;
            }

            var resendEndpoint = configuration["Resend:ApiEndpoint"];
            if (!string.IsNullOrWhiteSpace(resendEndpoint))
            {
                options.ResendApiEndpoint = resendEndpoint;
            }

            var fromEmail = configuration["Resend:FromEmail"];
            if (!string.IsNullOrWhiteSpace(fromEmail))
            {
                options.ResendFromEmail = fromEmail;
            }

            var frontendBase = configuration["Resend:FrontendBaseUrl"] ?? configuration["GoogleOAuth:FrontendBaseUrl"];
            if (!string.IsNullOrWhiteSpace(frontendBase))
            {
                options.FrontendBaseUrl = frontendBase;
            }

            var mediaRoot = configuration["R2:LocalStoragePath"];
            if (!string.IsNullOrWhiteSpace(mediaRoot))
            {
                options.LocalMediaRootPath = mediaRoot;
            }
        });

        services.Configure<IdempotencyOptions>(options =>
        {
            options.RetentionHours = configuration.GetValue(
                "OperationalParameters:IdempotencyKeyRetentionHours",
                options.RetentionHours);
        });

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection es obligatorio para iniciar la API.");
        }

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
            }));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAdminClientRepository, AdminClientRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<OfferRepository>();
        services.AddScoped<IOfferRepository>(sp => new CachedOfferRepository(
            sp.GetRequiredService<OfferRepository>(),
            sp.GetRequiredService<IMemoryCache>(),
            sp.GetRequiredService<ICacheInvalidator>(),
            sp.GetRequiredService<IOptions<CatalogCacheOptions>>()));
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IAdminReservationRepository, AdminReservationRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IIdempotencyStore, IdempotencyStore>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IPendingAuditRepository, PendingAuditRepository>();
        services.AddScoped<IExportRepository, ExportRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<MobilityRepository>();
        services.AddScoped<IMobilityRepository>(sp => new CachedMobilityRepository(
            sp.GetRequiredService<MobilityRepository>(),
            sp.GetRequiredService<IMemoryCache>(),
            sp.GetRequiredService<ICacheInvalidator>(),
            sp.GetRequiredService<IOptions<CatalogCacheOptions>>()));
        services.AddScoped<IHotelRepository, HotelRepository>();
        services.AddScoped<IRefundRepository, RefundRepository>();
        services.AddScoped<IWebhookEventRepository, WebhookEventRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IMediaRepository, MediaRepository>();
        services.AddHostedService<IdempotencyCleanupService>();
        services.AddHostedService<ExportCleanupService>();
        services.AddHostedService<ReservationExpiryWorker>();
        services.AddHostedService<PendingAuditRecoveryWorker>();
        services.AddHostedService<NotificationDispatchWorker>();

        return services;
    }
}
