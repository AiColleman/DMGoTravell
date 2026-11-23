using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Reports;

/// <summary>
/// Resultado congelado de una consulta de indicadores operativos/financieros (Spec 011).
/// Conserva la referencia temporal, filtros, indicadores, filas sin datos personales
/// y el artefacto PDF completo cuando se solicita.
/// </summary>
public class ReportSnapshot : Entity<long>
{
    public const string StatusCompleted = "completed";
    public const string PdfNotRequested = "not_requested";
    public const string PdfReady = "ready";

    public Guid RequestedByPublicId { get; private set; }
    public DateTime ReferenceAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public string Status { get; private set; } = StatusCompleted;
    public string PdfStatus { get; private set; } = PdfNotRequested;
    public int RowsCount { get; private set; }
    public string FiltersJson { get; private set; } = "{}";
    public string SummaryJson { get; private set; } = "{}";
    public string RowsJson { get; private set; } = "[]";
    public byte[]? PdfBytes { get; private set; }
    public string? PdfFileName { get; private set; }
    public DateTime? PdfGeneratedAtUtc { get; private set; }

    private ReportSnapshot() { }

    public static ReportSnapshot Create(
        Guid requestedByPublicId,
        DateTime referenceAtUtc,
        DateTime expiresAtUtc,
        int rowsCount,
        string filtersJson,
        string summaryJson,
        string rowsJson)
    {
        if (requestedByPublicId == Guid.Empty)
            throw new DomainException("El solicitante del reporte es obligatorio.");

        if (expiresAtUtc <= referenceAtUtc)
            throw new DomainException("La expiración del reporte debe ser posterior a la referencia.");

        return new ReportSnapshot
        {
            RequestedByPublicId = requestedByPublicId,
            ReferenceAtUtc = referenceAtUtc,
            ExpiresAtUtc = expiresAtUtc,
            Status = StatusCompleted,
            PdfStatus = PdfNotRequested,
            RowsCount = Math.Max(0, rowsCount),
            FiltersJson = filtersJson,
            SummaryJson = summaryJson,
            RowsJson = rowsJson,
            CreatedAtUtc = referenceAtUtc,
            UpdatedAtUtc = referenceAtUtc
        };
    }

    public bool IsExpired(DateTime nowUtc) => ExpiresAtUtc <= nowUtc;

    public void AttachPdf(byte[] pdfBytes, string fileName, DateTime generatedAtUtc)
    {
        if (pdfBytes is null || pdfBytes.Length == 0)
            throw new DomainException("El contenido PDF no puede estar vacío.");

        if (string.IsNullOrWhiteSpace(fileName))
            throw new DomainException("El nombre del archivo PDF es obligatorio.");

        PdfBytes = pdfBytes;
        PdfFileName = fileName.Trim();
        PdfStatus = PdfReady;
        PdfGeneratedAtUtc = generatedAtUtc;
        UpdatedAtUtc = generatedAtUtc;
        RowVersion++;
    }
}
