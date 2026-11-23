using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Infrastructure.Auth;
using DMGoTravel.Infrastructure.Payments;
using DMGoTravel.Infrastructure.Persistence;
using DMGoTravel.Infrastructure.Persistence.Exports;
using DMGoTravel.Infrastructure.Persistence.Idempotency;
using DMGoTravel.Infrastructure.Persistence.Repositories;
using DMGoTravel.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<JwtKeyProvider>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();
        services.AddSingleton<IPaymentGateway, SimulatedPaymentGateway>();
        services.AddSingleton<IDevEmailTokenStore, DevEmailTokenStore>();

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
        services.AddScoped<IOfferRepository, OfferRepository>();
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IIdempotencyStore, IdempotencyStore>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IExportRepository, ExportRepository>();
        services.AddHostedService<IdempotencyCleanupService>();
        services.AddHostedService<ExportCleanupService>();
        services.AddHostedService<ReservationExpiryWorker>();

        return services;
    }
}
