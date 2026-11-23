using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Audit.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Audit.GetAudit;

public sealed record GetAuditQuery(Guid Id) : IRequest<AuditEntryDto>;

public sealed class GetAuditQueryValidator : AbstractValidator<GetAuditQuery>
{
    public GetAuditQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetAuditQueryHandler : IRequestHandler<GetAuditQuery, AuditEntryDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IAuditRepository _audit;

    public GetAuditQueryHandler(IAdminAccessGuard adminAccess, IAuditRepository audit)
    {
        _adminAccess = adminAccess;
        _audit = audit;
    }

    public async Task<AuditEntryDto> Handle(
        GetAuditQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var record = await _audit.GetByPublicIdAsync(request.Id, cancellationToken);
        if (record is null)
        {
            throw new NotFoundAppException("La entrada de auditoría no existe.");
        }

        return AuditProjection.ToDto(record);
    }
}
