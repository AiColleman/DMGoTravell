using DMGoTravel.Application.Features.Audit.RecoverPendingAudit;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Infrastructure.Services;

/// <summary>
/// Worker periódico que recupera evidencia de auditoría pendiente tras efectos externos (010/RF-40-RF-41).
/// </summary>
public sealed class PendingAuditRecoveryWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PendingAuditRecoveryWorker> _logger;

    public PendingAuditRecoveryWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<PendingAuditRecoveryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                var result = await mediator.Send(new RecoverPendingAuditCommand(), stoppingToken);

                if (result.Recovered > 0 || result.Alerted > 0)
                {
                    _logger.LogInformation(
                        "Recuperación de auditoría pendiente: inspeccionados={Inspected}, recuperados={Recovered}, fallidos={Failed}, alertados={Alerted}.",
                        result.Inspected,
                        result.Recovered,
                        result.Failed,
                        result.Alerted);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado durante el ciclo de recuperación de auditoría pendiente.");
            }
        }
    }
}
