using DMGoTravel.Application.Features.Reservations.ExpireReservations;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Infrastructure.Services;

/// <summary>
/// Trabajo en segundo plano para vencimiento automático de reservas pendientes
/// (Spec 003 / HU-20). Ejecuta ciclos periódicos dentro del objetivo operativo de 60 s.
/// </summary>
public sealed class ReservationExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationExpiryWorker> _logger;
    private readonly TimeSpan _interval;

    public ReservationExpiryWorker(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<ReservationExpiryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var seconds = configuration.GetValue("OperationalParameters:ReservationExpiryIntervalSeconds", 30);
        _interval = TimeSpan.FromSeconds(Math.Clamp(seconds, 5, 60));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunCycleAsync(stoppingToken);
        }
    }

    private async Task RunCycleAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var result = await mediator.Send(new ProcessExpiredReservationsCommand(), cancellationToken);

            if (result.Cancelled > 0 || result.Failed > 0)
            {
                _logger.LogInformation(
                    "Ciclo de vencimiento completado: inspeccionadas={Inspected}, canceladas={Cancelled}, omitidas={Skipped}, fallidas={Failed}.",
                    result.Inspected,
                    result.Cancelled,
                    result.Skipped,
                    result.Failed);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado durante el ciclo de vencimiento automático de reservas.");
        }
    }
}
