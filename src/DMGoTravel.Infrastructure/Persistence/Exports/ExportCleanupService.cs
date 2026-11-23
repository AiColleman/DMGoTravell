using DMGoTravel.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Infrastructure.Persistence.Exports;

/// <summary>
/// Elimina artefactos temporales de exportación expirados. No toca la auditoría
/// canónica ni las entidades de negocio.
/// </summary>
public sealed class ExportCleanupService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExportCleanupService> _logger;

    public ExportCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<ExportCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        do
        {
            await CleanupAsync(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            var now = clock.UtcNow;

            var deleted = await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM export_job WHERE \"ExpiresAtUtc\" <= {now}",
                cancellationToken);

            if (deleted > 0)
            {
                _logger.LogInformation(
                    "Se eliminaron {Count} exportaciones temporales expiradas.",
                    deleted);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "No se pudieron limpiar las exportaciones temporales expiradas.");
        }
    }
}
