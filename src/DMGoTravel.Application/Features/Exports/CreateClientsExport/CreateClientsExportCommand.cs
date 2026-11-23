using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Exports.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Exports.CreateClientsExport;

/// <summary>
/// Solicita una copia completa de clientes. Los filtros llegan normalizados y
/// son los mismos de la consulta administrativa; la paginación no participa.
/// </summary>
public sealed record CreateClientsExportCommand(
    string? Name,
    string? Email,
    Guid? Id,
    UserStatus? Status,
    DateOnly? RegisteredFrom,
    DateOnly? RegisteredTo,
    string IdempotencyKey) : IRequest<ExportAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.exports.clients";

    public string GetRequestFingerprint() =>
        string.Join(
            '|',
            Name ?? "-",
            Email ?? "-",
            Id?.ToString("D") ?? "-",
            Status?.ToString() ?? "-",
            RegisteredFrom?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "-",
            RegisteredTo?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "-");
}

public sealed class CreateClientsExportCommandValidator
    : AbstractValidator<CreateClientsExportCommand>
{
    public CreateClientsExportCommandValidator()
    {
        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateClientsExportCommandHandler
    : IRequestHandler<CreateClientsExportCommand, ExportAcceptedDto>
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IExportRepository _exports;
    private readonly IDateTimeProvider _clock;

    public CreateClientsExportCommandHandler(
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

    public async Task<ExportAcceptedDto> Handle(
        CreateClientsExportCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (request.RegisteredFrom is not null &&
            request.RegisteredTo is not null &&
            request.RegisteredFrom > request.RegisteredTo)
        {
            throw new InvalidRangeAppException();
        }

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var referenceAtUtc = _clock.UtcNow;
        var filter = new ClientQueryFilter(
            1,
            1,
            request.Name,
            request.Email,
            request.Id,
            request.Status,
            request.RegisteredFrom is null
                ? null
                : _clock.ToUtcStartOfDay(request.RegisteredFrom.Value),
            request.RegisteredTo is null
                ? null
                : _clock.ToUtcStartOfNextDay(request.RegisteredTo.Value));

        var filtersJson = JsonSerializer.Serialize(
            new
            {
                name = request.Name,
                email = request.Email,
                id = request.Id,
                status = request.Status?.ToString().ToLowerInvariant(),
                registeredFrom = request.RegisteredFrom?.ToString(
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture),
                registeredTo = request.RegisteredTo?.ToString(
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture)
            },
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        var job = await _exports.CreateClientsAsync(
            new ClientExportRequest(
                _currentUser.UserId.Value,
                referenceAtUtc,
                referenceAtUtc.Add(Retention),
                filter,
                filtersJson),
            cancellationToken);

        return new ExportAcceptedDto(
            job.Id,
            "accepted",
            job.ReferenceAtUtc,
            job.ExpiresAtUtc);
    }
}
