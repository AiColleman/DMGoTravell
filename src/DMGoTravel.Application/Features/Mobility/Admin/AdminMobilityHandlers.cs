using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Mobility.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Mobility;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Mobility.Admin;

public sealed record ListAdminMobilityQuery(int Page = 1, int PageSize = 10) : IRequest<MobilityAdminPageDto>;

public sealed class ListAdminMobilityQueryValidator : AbstractValidator<ListAdminMobilityQuery>
{
    public ListAdminMobilityQueryValidator()
    {
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class ListAdminMobilityQueryHandler
    : IRequestHandler<ListAdminMobilityQuery, MobilityAdminPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IMobilityRepository _mobility;

    public ListAdminMobilityQueryHandler(IAdminAccessGuard adminAccess, IMobilityRepository mobility)
    {
        _adminAccess = adminAccess;
        _mobility = mobility;
    }

    public async Task<MobilityAdminPageDto> Handle(
        ListAdminMobilityQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var (items, total) = await _mobility.ListAdminAsync(request.Page, request.PageSize, cancellationToken);
        return new MobilityAdminPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(MobilityMapper.ToAdminDto).ToList());
    }
}

public sealed record GetAdminMobilityQuery(Guid Id) : IRequest<MobilityAdminItemDto>;

public sealed class GetAdminMobilityQueryHandler
    : IRequestHandler<GetAdminMobilityQuery, MobilityAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IMobilityRepository _mobility;

    public GetAdminMobilityQueryHandler(IAdminAccessGuard adminAccess, IMobilityRepository mobility)
    {
        _adminAccess = adminAccess;
        _mobility = mobility;
    }

    public async Task<MobilityAdminItemDto> Handle(
        GetAdminMobilityQuery request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var item = await _mobility.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El registro de movilidad no existe.");

        return MobilityMapper.ToAdminDto(item);
    }
}

public sealed record CreateAdminMobilityCommand(
    string Name,
    string Description,
    string Type,
    int Capacity,
    string IdempotencyKey) : IRequest<MobilityAdminItemDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.mobility.create";
    public string GetRequestFingerprint() => $"{Name.Trim()}|{Type.Trim()}|{Capacity}|{Description.Trim()}";
}

public sealed class CreateAdminMobilityCommandValidator : AbstractValidator<CreateAdminMobilityCommand>
{
    public CreateAdminMobilityCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Description).NotEmpty();
        RuleFor(c => c.Type).NotEmpty().MaximumLength(50);
        RuleFor(c => c.Capacity).GreaterThan(0);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminMobilityCommandHandler
    : IRequestHandler<CreateAdminMobilityCommand, MobilityAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IMobilityRepository _mobility;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateAdminMobilityCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IMobilityRepository mobility,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _mobility = mobility;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<MobilityAdminItemDto> Handle(
        CreateAdminMobilityCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var item = MobilityItem.Create(
            request.Name,
            request.Description,
            request.Type,
            request.Capacity,
            _clock.UtcNow);

        await _mobility.AddAsync(item, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminMobilityCreate,
            AuditActions.AdminMobilityCreate,
            AuditActions.ActorHuman,
            admin.Id,
            "mobility",
            item.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                mobilityStatus = "inactive",
                capacity = item.Capacity
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MobilityMapper.ToAdminDto(item);
    }
}

public sealed record UpdateAdminMobilityCommand(
    Guid Id,
    string Name,
    string Description,
    string Type,
    int Capacity,
    long? ExpectedVersion = null) : IRequest<MobilityAdminItemDto>;

public sealed class UpdateAdminMobilityCommandValidator : AbstractValidator<UpdateAdminMobilityCommand>
{
    public UpdateAdminMobilityCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Name).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Description).NotEmpty();
        RuleFor(c => c.Type).NotEmpty().MaximumLength(50);
        RuleFor(c => c.Capacity).GreaterThan(0);
    }
}

public sealed class UpdateAdminMobilityCommandHandler
    : IRequestHandler<UpdateAdminMobilityCommand, MobilityAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IMobilityRepository _mobility;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminMobilityCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IMobilityRepository mobility,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _mobility = mobility;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<MobilityAdminItemDto> Handle(
        UpdateAdminMobilityCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var item = await _mobility.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El registro de movilidad no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != item.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var normalizedKey = request.Name.Trim().ToUpperInvariant();
        if (item.IsActive &&
            await _mobility.ExistsActiveWithNormalizedKeyAsync(normalizedKey, item.Id, cancellationToken))
        {
            throw new ConflictAppException(
                "duplicate_active_mobility",
                "Ya existe otro registro de movilidad activo con ese mismo nombre.");
        }

        item.Update(request.Name, request.Description, request.Type, request.Capacity, _clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminMobilityUpdate,
            AuditActions.AdminMobilityUpdate,
            AuditActions.ActorHuman,
            admin.Id,
            "mobility",
            item.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                mobilityStatus = item.IsActive ? "active" : "inactive",
                capacity = item.Capacity
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MobilityMapper.ToAdminDto(item);
    }
}

public sealed record ActivateAdminMobilityCommand(Guid Id, long? ExpectedVersion = null) : IRequest<MobilityAdminItemDto>;

public sealed class ActivateAdminMobilityCommandHandler
    : IRequestHandler<ActivateAdminMobilityCommand, MobilityAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IMobilityRepository _mobility;
    private readonly IMediaRepository _media;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ActivateAdminMobilityCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IMobilityRepository mobility,
        IMediaRepository media,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _mobility = mobility;
        _media = media;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<MobilityAdminItemDto> Handle(
        ActivateAdminMobilityCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var item = await _mobility.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El registro de movilidad no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != item.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (await _mobility.ExistsActiveWithNormalizedKeyAsync(item.NormalizedKey, item.Id, cancellationToken))
        {
            throw new ConflictAppException(
                "duplicate_active_mobility",
                "Ya existe otro registro de movilidad activo con ese mismo nombre.");
        }

        try
        {
            item.Activate(_clock.UtcNow);
        }
        catch (DomainException ex)
        {
            throw new ConflictAppException("incomplete_mobility", ex.Message);
        }

        await _media.MarkPublishedForMobilityAsync(item.Id, _clock.UtcNow, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminMobilityActivate,
            AuditActions.AdminMobilityActivate,
            AuditActions.ActorHuman,
            admin.Id,
            "mobility",
            item.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { mobilityStatus = "active" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MobilityMapper.ToAdminDto(item);
    }
}

public sealed record DeactivateAdminMobilityCommand(Guid Id, long? ExpectedVersion = null) : IRequest<MobilityAdminItemDto>;

public sealed class DeactivateAdminMobilityCommandHandler
    : IRequestHandler<DeactivateAdminMobilityCommand, MobilityAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IMobilityRepository _mobility;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public DeactivateAdminMobilityCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IMobilityRepository mobility,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _mobility = mobility;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<MobilityAdminItemDto> Handle(
        DeactivateAdminMobilityCommand request,
        CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var item = await _mobility.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El registro de movilidad no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != item.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        item.Deactivate(_clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminMobilityDeactivate,
            AuditActions.AdminMobilityDeactivate,
            AuditActions.ActorHuman,
            admin.Id,
            "mobility",
            item.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { mobilityStatus = "inactive" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MobilityMapper.ToAdminDto(item);
    }
}
