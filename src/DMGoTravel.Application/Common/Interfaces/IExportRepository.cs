namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Datos ya autorizados y normalizados para materializar una exportación de
/// auditoría. La copia se crea dentro de la transacción de la solicitud.
/// </summary>
public sealed record AuditExportRequest(
    Guid RequestedByPublicId,
    DateTime ReferenceAtUtc,
    DateTime ExpiresAtUtc,
    AuditQueryFilter Filter,
    string FiltersJson);

/// <summary>
/// Datos ya autorizados y normalizados para materializar una exportación de
/// clientes. Los filtros no incluyen paginación: se exporta el conjunto completo.
/// </summary>
public sealed record ClientExportRequest(
    Guid RequestedByPublicId,
    DateTime ReferenceAtUtc,
    DateTime ExpiresAtUtc,
    ClientQueryFilter Filter,
    string FiltersJson);

public sealed record ExportJobView(
    Guid Id,
    string Kind,
    string Status,
    DateTime CreatedAtUtc,
    DateTime ReferenceAtUtc,
    DateTime ExpiresAtUtc,
    int RowCount);

public sealed record ExportDownloadView(
    Guid Id,
    string Kind,
    string FileName,
    string Status,
    string Content,
    string? SnapshotContent,
    DateTime ReferenceAtUtc,
    DateTime ExpiresAtUtc,
    int RowCount);

/// <summary>
/// Puerto de persistencia de artefactos temporales de exportación. Las consultas
/// incluyen al solicitante para que un identificador de job no sea una credencial.
/// </summary>
public interface IExportRepository
{
    Task<ExportJobView> CreateAuditAsync(
        AuditExportRequest request,
        CancellationToken cancellationToken = default);

    Task<ExportJobView> CreateClientsAsync(
        ClientExportRequest request,
        CancellationToken cancellationToken = default);

    Task<ExportJobView?> GetAsync(
        Guid publicId,
        Guid requestedByPublicId,
        CancellationToken cancellationToken = default);

    Task<ExportDownloadView?> GetDownloadAsync(
        Guid publicId,
        Guid requestedByPublicId,
        CancellationToken cancellationToken = default);
}
