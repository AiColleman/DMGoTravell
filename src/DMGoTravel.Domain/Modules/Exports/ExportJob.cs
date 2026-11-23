using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Exports;

/// <summary>
/// Artefacto técnico temporal de exportación. No es historial canónico ni una
/// entidad de negocio: conserva una copia ya materializada y su metadata.
/// </summary>
public class ExportJob : Entity<long>
{
    public const string KindAudit = "audit";
    public const string KindClients = "clients";
    public const string StatusCompleted = "completed";

    public string Kind { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public Guid RequestedByPublicId { get; private set; }
    public DateTime ReferenceAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string CsvContent { get; private set; } = string.Empty;

    /// <summary>
    /// Copia estructurada privada usada para regenerar la variante de entrega de
    /// clientes con la privacidad vigente. No se expone por la API.
    /// </summary>
    public string? SnapshotContent { get; private set; }

    public int RowCount { get; private set; }
    public string ContentHash { get; private set; } = string.Empty;
    public string FiltersJson { get; private set; } = string.Empty;

    private ExportJob()
    {
    }

    public static ExportJob CreateAudit(
        Guid requestedByPublicId,
        DateTime referenceAtUtc,
        DateTime expiresAtUtc,
        string fileName,
        string csvContent,
        int rowCount,
        string contentHash,
        string filtersJson) =>
        Create(
            KindAudit,
            requestedByPublicId,
            referenceAtUtc,
            expiresAtUtc,
            fileName,
            csvContent,
            snapshotContent: null,
            rowCount,
            contentHash,
            filtersJson);

    public static ExportJob CreateClients(
        Guid requestedByPublicId,
        DateTime referenceAtUtc,
        DateTime expiresAtUtc,
        string fileName,
        string csvContent,
        string snapshotContent,
        int rowCount,
        string contentHash,
        string filtersJson)
    {
        if (string.IsNullOrWhiteSpace(snapshotContent))
        {
            throw new ArgumentException(
                "La exportación de clientes requiere una copia estructurada.",
                nameof(snapshotContent));
        }

        return Create(
            KindClients,
            requestedByPublicId,
            referenceAtUtc,
            expiresAtUtc,
            fileName,
            csvContent,
            snapshotContent,
            rowCount,
            contentHash,
            filtersJson);
    }

    public bool IsExpired(DateTime nowUtc) => ExpiresAtUtc <= nowUtc;

    private static ExportJob Create(
        string kind,
        Guid requestedByPublicId,
        DateTime referenceAtUtc,
        DateTime expiresAtUtc,
        string fileName,
        string csvContent,
        string? snapshotContent,
        int rowCount,
        string contentHash,
        string filtersJson)
    {
        if (requestedByPublicId == Guid.Empty)
        {
            throw new ArgumentException("El solicitante es obligatorio.", nameof(requestedByPublicId));
        }

        if (expiresAtUtc <= referenceAtUtc)
        {
            throw new ArgumentException(
                "La expiración debe ser posterior al punto de referencia.",
                nameof(expiresAtUtc));
        }

        if (string.IsNullOrWhiteSpace(fileName) ||
            string.IsNullOrWhiteSpace(csvContent) ||
            string.IsNullOrWhiteSpace(contentHash) ||
            string.IsNullOrWhiteSpace(filtersJson))
        {
            throw new ArgumentException("La exportación requiere archivo, huella y filtros.");
        }

        return new ExportJob
        {
            Kind = kind,
            Status = StatusCompleted,
            RequestedByPublicId = requestedByPublicId,
            ReferenceAtUtc = referenceAtUtc,
            ExpiresAtUtc = expiresAtUtc,
            FileName = fileName,
            CsvContent = csvContent,
            SnapshotContent = snapshotContent,
            RowCount = rowCount,
            ContentHash = contentHash,
            FiltersJson = filtersJson,
            CreatedAtUtc = referenceAtUtc
        };
    }
}
