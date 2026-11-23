using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Payments;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Payments.Refunds;

public sealed record ListAdminRefundCasesQuery(
    int Page = 1,
    int PageSize = 10,
    string? Status = null) : IRequest<RefundCasePageDto>;

public sealed class ListAdminRefundCasesQueryValidator : AbstractValidator<ListAdminRefundCasesQuery>
{
    public ListAdminRefundCasesQueryValidator()
    {
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
        RuleFor(q => q.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) ||
                       s.Trim().ToLowerInvariant() is RefundCase.StatusOpen or RefundCase.StatusAuthorized or RefundCase.StatusExecuted or RefundCase.StatusFailed or RefundCase.StatusUnknown)
            .WithMessage("El filtro de estado de devolución no es válido.");
    }
}

public sealed class ListAdminRefundCasesQueryHandler : IRequestHandler<ListAdminRefundCasesQuery, RefundCasePageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IRefundRepository _refunds;

    public ListAdminRefundCasesQueryHandler(IAdminAccessGuard adminAccess, IRefundRepository refunds)
    {
        _adminAccess = adminAccess;
        _refunds = refunds;
    }

    public async Task<RefundCasePageDto> Handle(ListAdminRefundCasesQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var page = await _refunds.ListAsync(request.Page, request.PageSize, request.Status?.Trim().ToLowerInvariant(), cancellationToken);
        return new RefundCasePageDto(
            page.Page,
            page.PageSize,
            page.Total,
            (long)page.Page * page.PageSize < page.Total,
            page.Items.Select(RefundCaseMapper.ToDto).ToList());
    }
}

public sealed record GetAdminRefundCaseQuery(Guid Id) : IRequest<RefundCaseDto>;

public sealed class GetAdminRefundCaseQueryHandler : IRequestHandler<GetAdminRefundCaseQuery, RefundCaseDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IRefundRepository _refunds;

    public GetAdminRefundCaseQueryHandler(IAdminAccessGuard adminAccess, IRefundRepository refunds)
    {
        _adminAccess = adminAccess;
        _refunds = refunds;
    }

    public async Task<RefundCaseDto> Handle(GetAdminRefundCaseQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var detail = await _refunds.GetDetailByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");
        return RefundCaseMapper.ToDto(detail);
    }
}

public sealed record AuthorizeAdminRefundCaseCommand(
    Guid Id,
    string IdempotencyKey,
    long? Version = null) : IRequest<RefundCaseDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.refundCases.authorize";
    public string GetRequestFingerprint() => $"{Id:N}|{Version?.ToString() ?? "-"}";
}

public sealed class AuthorizeAdminRefundCaseCommandValidator : AbstractValidator<AuthorizeAdminRefundCaseCommand>
{
    public AuthorizeAdminRefundCaseCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Version).GreaterThanOrEqualTo(1).When(c => c.Version.HasValue);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class AuthorizeAdminRefundCaseCommandHandler
    : IRequestHandler<AuthorizeAdminRefundCaseCommand, RefundCaseDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IRefundRepository _refunds;
    private readonly IRefundGateway _gateway;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public AuthorizeAdminRefundCaseCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IRefundRepository refunds,
        IRefundGateway gateway,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _refunds = refunds;
        _gateway = gateway;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<RefundCaseDto> Handle(AuthorizeAdminRefundCaseCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var detail = await _refunds.GetDetailByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");

        var refund = await _refunds.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");

        if (request.Version.HasValue && request.Version.Value != refund.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (refund.Status != RefundCase.StatusOpen)
        {
            throw new ConflictAppException(
                "transition_not_allowed",
                $"No se puede autorizar una devolución en estado '{refund.Status}'.");
        }

        var now = _clock.UtcNow;
        refund.Authorize(admin.Id, now);

        var gatewayResult = await _gateway.ExecuteRefundAsync(
            new RefundGatewayRequest(
                refund.PublicId,
                detail.ExternalProviderTransactionId,
                refund.Amount.Amount,
                refund.Amount.Currency,
                refund.Reason),
            cancellationToken);

        var evidenceJson = JsonSerializer.Serialize(new
        {
            provider = gatewayResult.Provider,
            providerRefundId = gatewayResult.ProviderRefundId,
            status = gatewayResult.Status
        });

        if (gatewayResult.Executed && !string.IsNullOrWhiteSpace(gatewayResult.ProviderRefundId))
        {
            refund.MarkExecuted(gatewayResult.ProviderRefundId, _clock.UtcNow, evidenceJson);
        }
        else if (gatewayResult.Unknown)
        {
            refund.MarkUnknown(gatewayResult.Error ?? "Estado incierto en pasarela.", _clock.UtcNow, evidenceJson);
        }
        else
        {
            refund.MarkFailed(gatewayResult.Error ?? "La devolución fue rechazada por la pasarela.", _clock.UtcNow, evidenceJson);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminRefundAuthorize,
            AuditActions.AdminRefundAuthorize,
            AuditActions.ActorHuman,
            admin.Id,
            "refund_case",
            refund.PublicId.ToString(),
            refund.Status == RefundCase.StatusFailed ? AuditActions.Failure : AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                amount = refund.Amount.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = refund.Amount.Currency,
                provider = gatewayResult.Provider,
                providerReference = gatewayResult.ProviderRefundId
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _refunds.GetDetailByPublicIdAsync(refund.PublicId, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");
        return RefundCaseMapper.ToDto(updated);
    }
}

public sealed record RetryAdminRefundCaseCommand(
    Guid Id,
    string IdempotencyKey) : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.refundCases.retry";
    public string GetRequestFingerprint() => Id.ToString("N");
}

public sealed class RetryAdminRefundCaseCommandValidator : AbstractValidator<RetryAdminRefundCaseCommand>
{
    public RetryAdminRefundCaseCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class RetryAdminRefundCaseCommandHandler
    : IRequestHandler<RetryAdminRefundCaseCommand, OperationAcceptedDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IRefundRepository _refunds;
    private readonly IRefundGateway _gateway;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public RetryAdminRefundCaseCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IRefundRepository refunds,
        IRefundGateway gateway,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _refunds = refunds;
        _gateway = gateway;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationAcceptedDto> Handle(RetryAdminRefundCaseCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var detail = await _refunds.GetDetailByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");

        var refund = await _refunds.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El caso de devolución no existe.");

        var now = _clock.UtcNow;
        try
        {
            refund.PrepareRetry(now);
        }
        catch (DomainException ex)
        {
            throw new ConflictAppException("transition_not_allowed", ex.Message);
        }

        var gatewayResult = await _gateway.ExecuteRefundAsync(
            new RefundGatewayRequest(
                refund.PublicId,
                detail.ExternalProviderTransactionId,
                refund.Amount.Amount,
                refund.Amount.Currency,
                refund.Reason),
            cancellationToken);

        var evidenceJson = JsonSerializer.Serialize(new
        {
            provider = gatewayResult.Provider,
            providerRefundId = gatewayResult.ProviderRefundId,
            status = gatewayResult.Status
        });

        if (gatewayResult.Executed && !string.IsNullOrWhiteSpace(gatewayResult.ProviderRefundId))
        {
            refund.MarkExecuted(gatewayResult.ProviderRefundId, _clock.UtcNow, evidenceJson);
        }
        else if (gatewayResult.Unknown)
        {
            refund.MarkUnknown(gatewayResult.Error ?? "Estado incierto en pasarela.", _clock.UtcNow, evidenceJson);
        }
        else
        {
            refund.MarkFailed(gatewayResult.Error ?? "Reintento de devolución fallido.", _clock.UtcNow, evidenceJson);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminRefundRetry,
            AuditActions.AdminRefundRetry,
            AuditActions.ActorHuman,
            admin.Id,
            "refund_case",
            refund.PublicId.ToString(),
            refund.Status == RefundCase.StatusFailed ? AuditActions.Failure : AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                amount = refund.Amount.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = refund.Amount.Currency,
                provider = gatewayResult.Provider,
                providerReference = gatewayResult.ProviderRefundId
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationAcceptedDto(
            refund.PublicId,
            "accepted",
            DateTime.SpecifyKind(now, DateTimeKind.Utc),
            DateTime.SpecifyKind(now.AddHours(24), DateTimeKind.Utc));
    }
}
