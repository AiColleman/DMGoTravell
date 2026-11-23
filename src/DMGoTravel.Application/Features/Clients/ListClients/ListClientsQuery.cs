using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Clients.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Clients.ListClients;

/// <summary>
/// Consulta administrativa de clientes. Los textos llegan recortados y vacíos
/// convertidos en <c>null</c>; las fechas son días comerciales de America/Lima.
/// </summary>
public sealed record ListClientsQuery(
    int Page = 1,
    int PageSize = 25,
    string? Name = null,
    string? Email = null,
    Guid? Id = null,
    UserStatus? Status = null,
    DateOnly? RegisteredFrom = null,
    DateOnly? RegisteredTo = null) : IRequest<ClientPageDto>;

public sealed class ListClientsQueryValidator : AbstractValidator<ListClientsQuery>
{
    public ListClientsQueryValidator()
    {
        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1).WithMessage("El número de página debe ser mayor o igual a 1.");

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100.");
    }
}

public sealed class ListClientsQueryHandler : IRequestHandler<ListClientsQuery, ClientPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAdminClientRepository _clients;
    private readonly IDateTimeProvider _clock;

    public ListClientsQueryHandler(
        IAdminAccessGuard adminAccess,
        IAdminClientRepository clients,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _clients = clients;
        _clock = clock;
    }

    public async Task<ClientPageDto> Handle(
        ListClientsQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        if (request.RegisteredFrom is not null &&
            request.RegisteredTo is not null &&
            request.RegisteredFrom > request.RegisteredTo)
        {
            throw new InvalidRangeAppException();
        }

        var filter = new ClientQueryFilter(
            request.Page,
            request.PageSize,
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

        var (items, total) = await _clients.ListAsync(filter, cancellationToken);

        return new ClientPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(ClientProjection.ToDto).ToList());
    }
}
