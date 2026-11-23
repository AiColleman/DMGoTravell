using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Clients.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Clients.GetClient;

public sealed record GetClientQuery(Guid Id) : IRequest<ClientSummaryDto>;

public sealed class GetClientQueryValidator : AbstractValidator<GetClientQuery>
{
    public GetClientQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetClientQueryHandler : IRequestHandler<GetClientQuery, ClientSummaryDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAdminClientRepository _clients;

    public GetClientQueryHandler(
        IAdminAccessGuard adminAccess,
        IAdminClientRepository clients)
    {
        _adminAccess = adminAccess;
        _clients = clients;
    }

    public async Task<ClientSummaryDto> Handle(
        GetClientQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var record = await _clients.GetByPublicIdAsync(request.Id, cancellationToken);
        if (record is null)
        {
            throw new NotFoundAppException("El cliente no existe.");
        }

        return ClientProjection.ToDto(record);
    }
}
