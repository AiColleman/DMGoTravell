using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Exports.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Exports.CreateAuditExport;

/// <summary>
/// Solicita una copia completa de auditoría. Los filtros llegan normalizados y
/// son los mismos de la consulta administrativa; la paginación no participa.
/// </summary>
public sealed record CreateAuditExportCommand(
    DateOnly? From,
    DateOnly? To,
    string? Actor,
    string? Entity,
    string? CorrelationId,
    string? Action,
    string? Type,
    string? Result,
    string IdempotencyKey) : IRequest<ExportAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.exports.audit";

    public string GetRequestFingerprint() =>
        string.Join(
            '|',
            From?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "-",
            To?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "-",
            Actor ?? "-",
            Entity ?? "-",
            CorrelationId ?? "-",
            Action ?? "-",
            Type ?? "-",
            Result ?? "-");
}

public sealed class CreateAuditExportCommandValidator : AbstractValidator<CreateAuditExportCommand>
{
    public CreateAuditExportCommandValidator()
    {
        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAuditExportCommandHandler
    : IRequestHandler<CreateAuditExportCommand, ExportAcceptedDto>
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IExportRepository _exports;
    private readonly IDateTimeProvider _clock;

    public CreateAuditExportCommandHandler(
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
        CreateAuditExportCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (request.From is not null && request.To is not null && request.From > request.To)
        {
            throw new InvalidRangeAppException();
        }

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var referenceAtUtc = _clock.UtcNow;
        var filter = new AuditQueryFilter(
            1,
            1,
            request.From is null ? null : _clock.ToUtcStartOfDay(request.From.Value),
            request.To is null ? null : _clock.ToUtcStartOfNextDay(request.To.Value),
            request.Actor,
            request.Entity,
            request.CorrelationId,
            request.Action,
            request.Type,
            request.Result);

        var filtersJson = JsonSerializer.Serialize(
            new
            {
                from = request.From?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                to = request.To?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                actor = request.Actor,
                entity = request.Entity,
                correlationId = request.CorrelationId,
                action = request.Action,
                type = request.Type,
                result = request.Result
            },
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        var job = await _exports.CreateAuditAsync(
            new AuditExportRequest(
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
