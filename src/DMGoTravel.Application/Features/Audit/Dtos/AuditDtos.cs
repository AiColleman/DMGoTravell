namespace DMGoTravel.Application.Features.Audit.Dtos;

/// <summary>
/// Entrada autorizada de auditoría. El identificador es el UUID público del
/// registro; nunca se expone la clave técnica interna.
/// </summary>
public sealed record AuditEntryDto(
    Guid Id,
    DateTime OccurredAt,
    string Actor,
    string Entity,
    string EntityId,
    string Action,
    string Result,
    string? CorrelationId,
    string? Summary);

public sealed record AuditPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<AuditEntryDto> Items);
