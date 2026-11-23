namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Filtros de la consulta administrativa de auditoría. Los textos llegan ya
/// normalizados; <see cref="Actor"/> contiene un identificador público o un
/// tipo de actor permitido. Las fechas se expresan como instantes UTC.
/// </summary>
public sealed record AuditQueryFilter(
    int Page,
    int PageSize,
    DateTime? FromUtc,
    DateTime? ToUtcExclusive,
    string? Actor,
    string? Entity,
    string? CorrelationId,
    string? Action,
    string? Type,
    string? Result);

/// <summary>
/// Proyección de lectura autorizada. No contiene secretos ni el identificador
/// técnico interno del actor; el actor humano se expone por su identificador público.
/// </summary>
public sealed record AuditRecordView(
    long Sequence,
    Guid PublicId,
    string ActorType,
    Guid? ActorPublicId,
    string EntityType,
    string EntityId,
    string Action,
    DateTime OccurredAtUtc,
    string? CorrelationId,
    string Result,
    string? ChangesJson,
    DateTime RecordedAtUtc);

public interface IAuditRepository
{
    Task<(IReadOnlyList<AuditRecordView> Items, int Total)> ListAsync(
        AuditQueryFilter filter,
        CancellationToken cancellationToken = default);

    Task<AuditRecordView?> GetByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Materializa todos los registros que cumplen el filtro, sin paginación, para
    /// una copia de exportación. El orden es el mismo que usa la consulta paginada.
    /// </summary>
    Task<IReadOnlyList<AuditRecordView>> CaptureAsync(
        AuditQueryFilter filter,
        CancellationToken cancellationToken = default);
}
