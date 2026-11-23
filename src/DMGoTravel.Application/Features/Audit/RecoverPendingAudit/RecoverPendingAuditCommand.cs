using DMGoTravel.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Application.Features.Audit.RecoverPendingAudit;

public sealed record RecoverPendingAuditCommand(int BatchSize = 50) : IRequest<PendingAuditRecoveryResult>;

public sealed record PendingAuditRecoveryResult(int Inspected, int Recovered, int Failed, int Alerted);

/// <summary>
/// Reintenta incorporar registros de auditoría que quedaron pendientes tras un
/// efecto externo real (010/RF-40) y emite alerta administrativa si persiste el
/// fallo tras agotar reintentos (010/RF-41), sin crear recursión.
/// </summary>
public sealed class RecoverPendingAuditCommandHandler
    : IRequestHandler<RecoverPendingAuditCommand, PendingAuditRecoveryResult>
{
    private readonly IPendingAuditRepository _pending;
    private readonly IAuditWriter _audit;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RecoverPendingAuditCommandHandler> _logger;

    public RecoverPendingAuditCommandHandler(
        IPendingAuditRepository pending,
        IAuditWriter audit,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        ILogger<RecoverPendingAuditCommandHandler> logger)
    {
        _pending = pending;
        _audit = audit;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PendingAuditRecoveryResult> Handle(
        RecoverPendingAuditCommand request,
        CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var entries = await _pending.GetDuePendingAsync(now, Math.Clamp(request.BatchSize, 1, 200), cancellationToken);

        var recovered = 0;
        var failed = 0;
        var alerted = 0;

        foreach (var entry in entries)
        {
            try
            {
                _audit.Record(new AuditEntry(
                    entry.OperationId,
                    entry.Action,
                    entry.ActorType,
                    entry.ActorId,
                    entry.EntityType,
                    entry.EntityId,
                    entry.Result,
                    entry.ChangesJson,
                    entry.OccurredAtUtc,
                    entry.CorrelationId));

                entry.MarkRecovered(now);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                recovered++;
            }
            catch (Exception ex)
            {
                failed++;
                var shouldAlert = entry.RecordFailure(ex.Message, now);

                if (shouldAlert)
                {
                    alerted++;
                    _logger.LogCritical(
                        ex,
                        "ALERTA ADMINISTRATIVA (010/RF-41): fallo persistente al recuperar auditoría pendiente {PendingAuditId} para {Action} {EntityType}/{EntityId} tras {Retries} intentos.",
                        entry.PublicId,
                        entry.Action,
                        entry.EntityType,
                        entry.EntityId,
                        entry.RetryCount);
                }
                else
                {
                    _logger.LogWarning(
                        ex,
                        "Reintento {Retry}/{MaxRetries} fallido al recuperar auditoría pendiente {PendingAuditId}.",
                        entry.RetryCount,
                        entry.MaxRetries,
                        entry.PublicId);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        return new PendingAuditRecoveryResult(entries.Count, recovered, failed, alerted);
    }
}
