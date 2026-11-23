using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Exports;
using DMGoTravel.Domain.Modules.Exports;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Exports.DownloadExport;

public sealed record ExportDownloadDto(
    Guid Id,
    string FileName,
    string Content,
    DateTime ReferenceAtUtc,
    DateTime ExpiresAtUtc,
    int RowCount);

public sealed record DownloadExportQuery(Guid Id) : IRequest<ExportDownloadDto>;

public sealed class DownloadExportQueryValidator : AbstractValidator<DownloadExportQuery>
{
    public DownloadExportQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

/// <summary>
/// Entrega una variante completa desde la copia capturada. Para clientes relee
/// la baja lógica actual y vuelve a renderizar el CSV con RF-44, sin añadir
/// clientes ni refrescar las cantidades ordinarias de la referencia.
/// </summary>
public sealed class DownloadExportQueryHandler
    : IRequestHandler<DownloadExportQuery, ExportDownloadDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IExportRepository _exports;
    private readonly IAdminClientRepository _clients;
    private readonly IDateTimeProvider _clock;

    public DownloadExportQueryHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IExportRepository exports,
        IAdminClientRepository clients,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _exports = exports;
        _clients = clients;
        _clock = clock;
    }

    public async Task<ExportDownloadDto> Handle(
        DownloadExportQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var job = await _exports.GetDownloadAsync(
            request.Id,
            _currentUser.UserId.Value,
            cancellationToken);

        if (job is null)
        {
            throw new NotFoundAppException("La exportación no existe o no es accesible.");
        }

        if (job.ExpiresAtUtc <= _clock.UtcNow)
        {
            throw new ExportExpiredAppException();
        }

        if (job.Status != ExportJob.StatusCompleted || job.Content.Length == 0)
        {
            throw new ConflictAppException(
                "export_not_ready",
                "La exportación aún no está generada; consulte el estado antes de descargar.");
        }

        var content = job.Kind == ExportJob.KindClients
            ? await RenderClientsAsync(job, cancellationToken)
            : job.Content;

        return new ExportDownloadDto(
            job.Id,
            job.FileName,
            content,
            job.ReferenceAtUtc,
            job.ExpiresAtUtc,
            job.RowCount);
    }

    private async Task<string> RenderClientsAsync(
        ExportDownloadView job,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ClientExportRow> rows;
        try
        {
            rows = ClientCsvWriter.ReadSnapshot(job.SnapshotContent ?? string.Empty);
        }
        catch (Exception exception)
            when (exception is JsonException or InvalidOperationException)
        {
            throw new ConflictAppException(
                "export_not_ready",
                "La exportación no está disponible; solicite una nueva.");
        }

        var ids = rows.Select(row => row.Id).Distinct().ToArray();
        var states = await _clients.GetCurrentDeletionStatesAsync(ids, cancellationToken);

        // Un cliente ausente en la relectura actual no puede verificarse como
        // visible; se enmascara igual que una baja lógica confirmada.
        var deleted = ids
            .Where(id => !states.TryGetValue(id, out var isDeleted) || isDeleted)
            .ToHashSet();

        return ClientCsvWriter.Write(rows, deleted);
    }
}
