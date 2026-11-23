using System.Security.Cryptography;
using System.Text;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Exports;
using DMGoTravel.Domain.Modules.Exports;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

/// <summary>
/// Materializa copias completas de auditoría y clientes y conserva el artefacto
/// temporal. La consulta de origen se ejecuta una sola vez dentro de la
/// transacción de la solicitud; no se pagina ni se trunca el conjunto exportado.
/// </summary>
public sealed class ExportRepository : IExportRepository
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditRepository _audit;
    private readonly IAdminClientRepository _clients;

    public ExportRepository(
        ApplicationDbContext db,
        IAuditRepository audit,
        IAdminClientRepository clients)
    {
        _db = db;
        _audit = audit;
        _clients = clients;
    }

    public async Task<ExportJobView> CreateAuditAsync(
        AuditExportRequest request,
        CancellationToken cancellationToken = default)
    {
        var rows = await _audit.CaptureAsync(request.Filter, cancellationToken);
        var csv = AuditCsvWriter.Write(rows);
        var fileName = $"auditoria-{request.ReferenceAtUtc:yyyyMMddTHHmmssZ}.csv";

        var job = ExportJob.CreateAudit(
            request.RequestedByPublicId,
            request.ReferenceAtUtc,
            request.ExpiresAtUtc,
            fileName,
            csv,
            rows.Count,
            Hash(csv),
            request.FiltersJson);

        _db.ExportJobs.Add(job);
        await _db.SaveChangesAsync(cancellationToken);

        return ToView(job);
    }

    public async Task<ExportJobView> CreateClientsAsync(
        ClientExportRequest request,
        CancellationToken cancellationToken = default)
    {
        var records = await _clients.CaptureAsync(request.Filter, cancellationToken);
        var rows = records.Select(ClientCsvWriter.FromRecord).ToList();
        var csv = ClientCsvWriter.Write(rows);
        var snapshot = ClientCsvWriter.SerializeSnapshot(rows);
        var fileName = $"clientes-{request.ReferenceAtUtc:yyyyMMddTHHmmssZ}.csv";

        var job = ExportJob.CreateClients(
            request.RequestedByPublicId,
            request.ReferenceAtUtc,
            request.ExpiresAtUtc,
            fileName,
            csv,
            snapshot,
            rows.Count,
            Hash(csv),
            request.FiltersJson);

        _db.ExportJobs.Add(job);
        await _db.SaveChangesAsync(cancellationToken);

        return ToView(job);
    }

    public Task<ExportJobView?> GetAsync(
        Guid publicId,
        Guid requestedByPublicId,
        CancellationToken cancellationToken = default) =>
        _db.ExportJobs
            .AsNoTracking()
            .Where(job => job.PublicId == publicId &&
                          job.RequestedByPublicId == requestedByPublicId)
            .Select(job => new ExportJobView(
                job.PublicId,
                job.Kind,
                job.Status,
                job.CreatedAtUtc,
                job.ReferenceAtUtc,
                job.ExpiresAtUtc,
                job.RowCount))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<ExportDownloadView?> GetDownloadAsync(
        Guid publicId,
        Guid requestedByPublicId,
        CancellationToken cancellationToken = default) =>
        _db.ExportJobs
            .AsNoTracking()
            .Where(job => job.PublicId == publicId &&
                          job.RequestedByPublicId == requestedByPublicId)
            .Select(job => new ExportDownloadView(
                job.PublicId,
                job.Kind,
                job.FileName,
                job.Status,
                job.CsvContent,
                job.SnapshotContent,
                job.ReferenceAtUtc,
                job.ExpiresAtUtc,
                job.RowCount))
            .SingleOrDefaultAsync(cancellationToken);

    private static string Hash(string content) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content)))
            .ToLowerInvariant();

    private static ExportJobView ToView(ExportJob job) =>
        new(
            job.PublicId,
            job.Kind,
            job.Status,
            job.CreatedAtUtc,
            job.ReferenceAtUtc,
            job.ExpiresAtUtc,
            job.RowCount);
}
