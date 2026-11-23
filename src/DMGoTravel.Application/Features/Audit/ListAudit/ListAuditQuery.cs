using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Audit.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Audit.ListAudit;

/// <summary>
/// Consulta administrativa de auditoría. Los filtros textuales llegan ya
/// recortados y vacíos convertidos en <c>null</c>; las fechas son días
/// comerciales de America/Lima que el handler convierte a intervalos UTC.
/// </summary>
public sealed record ListAuditQuery(
    int Page = 1,
    int PageSize = 25,
    DateOnly? From = null,
    DateOnly? To = null,
    string? Actor = null,
    string? Entity = null,
    string? CorrelationId = null,
    string? Action = null,
    string? Type = null,
    string? Result = null) : IRequest<AuditPageDto>;

public sealed class ListAuditQueryValidator : AbstractValidator<ListAuditQuery>
{
    public ListAuditQueryValidator()
    {
        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1).WithMessage("El número de página debe ser mayor o igual a 1.");

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100.");
    }
}

public sealed class ListAuditQueryHandler : IRequestHandler<ListAuditQuery, AuditPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAuditRepository _audit;
    private readonly IDateTimeProvider _clock;

    public ListAuditQueryHandler(
        IAdminAccessGuard adminAccess,
        IAuditRepository audit,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _audit = audit;
        _clock = clock;
    }

    public async Task<AuditPageDto> Handle(
        ListAuditQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (request.From is not null && request.To is not null && request.From > request.To)
        {
            throw new InvalidRangeAppException();
        }

        var filter = new AuditQueryFilter(
            request.Page,
            request.PageSize,
            request.From is null ? null : _clock.ToUtcStartOfDay(request.From.Value),
            request.To is null ? null : _clock.ToUtcStartOfNextDay(request.To.Value),
            request.Actor,
            request.Entity,
            request.CorrelationId,
            request.Action,
            request.Type,
            request.Result);

        var (items, total) = await _audit.ListAsync(filter, cancellationToken);

        return new AuditPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(AuditProjection.ToDto).ToList());
    }
}
