using DMGoTravel.Application.Features.Notifications;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Infrastructure.Services;

/// <summary>
/// Worker en segundo plano que despacha correos pendientes del outbox de notificaciones (Spec 004).
/// </summary>
public sealed class NotificationDispatchWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationDispatchWorker> _logger;

    public NotificationDispatchWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationDispatchWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, stoppingToken);
                using var scope = _scopeFactory.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                var dispatched = await mediator.Send(new DispatchPendingNotificationsCommand(), stoppingToken);
                if (dispatched > 0)
                {
                    _logger.LogInformation("Worker de notificaciones despachó {Count} correos pendientes.", dispatched);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al despachar notificaciones pendientes.");
            }
        }
    }
}
