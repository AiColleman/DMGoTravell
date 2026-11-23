using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Exports.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Exports.GetExport;

/// <summary>
/// Consulta el estado técnico de una exportación de auditoría o clientes. El
/// identificador público no es una credencial: se exige autorización vigente y
/// pertenencia al solicitante.
/// </summary>
public sealed record GetExportQuery(Guid Id) : IRequest<ExportJobDto>;

public sealed class GetExportQueryValidator : AbstractValidator<GetExportQuery>
{
    public GetExportQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetExportQueryHandler : IRequestHandler<GetExportQuery, ExportJobDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IExportRepository _exports;
    private readonly IDateTimeProvider _clock;

    public GetExportQueryHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IExportRepository exports,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _exports = exports;
        _clock = clock;
    }

    public async Task<ExportJobDto> Handle(
        GetExportQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var job = await _exports.GetAsync(
            request.Id,
            _currentUser.UserId.Value,
            cancellationToken);

        if (job is null)
        {
            throw new NotFoundAppException("La exportación no existe o no es accesible.");
        }

        var expired = job.ExpiresAtUtc <= _clock.UtcNow;
        var status = expired ? "expired" : job.Status;
        var downloadPath = !expired && job.Status == "completed"
            ? $"/api/v1/admin/exports/{job.Id:D}/download"
            : null;

        return new ExportJobDto(
            job.Id,
            job.Kind,
            status,
            job.CreatedAtUtc,
            job.ExpiresAtUtc,
            downloadPath);
    }
}
