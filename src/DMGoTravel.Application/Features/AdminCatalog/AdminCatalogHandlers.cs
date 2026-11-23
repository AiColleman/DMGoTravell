using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.AdminCatalog.Dtos;
using DMGoTravel.Application.Features.Catalog;
using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.AdminCatalog;

public sealed record ItineraryDayInput(int Day, string Title, string Description);

public sealed record ListAdminCatalogQuery(string Type, int Page = 1, int PageSize = 10) : IRequest<CatalogAdminPageDto>;

public sealed class ListAdminCatalogQueryValidator : AbstractValidator<ListAdminCatalogQuery>
{
    public ListAdminCatalogQueryValidator()
    {
        RuleFor(q => q.Type).Must(t => t.Trim().ToLowerInvariant() is "tours" or "packages")
            .WithMessage("El tipo de catálogo debe ser tours o packages.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class ListAdminCatalogQueryHandler : IRequestHandler<ListAdminCatalogQuery, CatalogAdminPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IOfferRepository _offers;

    public ListAdminCatalogQueryHandler(IAdminAccessGuard adminAccess, IOfferRepository offers)
    {
        _adminAccess = adminAccess;
        _offers = offers;
    }

    public async Task<CatalogAdminPageDto> Handle(ListAdminCatalogQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var offerType = CatalogMapper.ParseApiType(request.Type);
        var (items, total) = await _offers.ListAdminAsync(offerType, request.Page, request.PageSize, cancellationToken);

        return new CatalogAdminPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(AdminCatalogMapper.ToAdminDto).ToList());
    }
}

public sealed record CreateAdminOfferCommand(
    string Type,
    string Name,
    string Description,
    decimal Price,
    int DurationDays,
    IReadOnlyList<string> Conditions,
    IReadOnlyList<ItineraryDayInput> Itinerary,
    string IdempotencyKey) : IRequest<CatalogAdminItemDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.catalog.create";
    public string GetRequestFingerprint() =>
        $"{Type.Trim().ToLowerInvariant()}|{Name.Trim()}|{Price.ToString("0.00", CultureInfo.InvariantCulture)}|{DurationDays}";
}

public sealed class CreateAdminOfferCommandValidator : AbstractValidator<CreateAdminOfferCommand>
{
    public CreateAdminOfferCommandValidator()
    {
        RuleFor(c => c.Type).Must(t => t.Trim().ToLowerInvariant() is "tours" or "packages")
            .WithMessage("El tipo de catálogo debe ser tours o packages.");
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).NotEmpty();
        RuleFor(c => c.Price).GreaterThan(0);
        RuleFor(c => c.DurationDays).GreaterThan(0);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminOfferCommandHandler : IRequestHandler<CreateAdminOfferCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateAdminOfferCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(CreateAdminOfferCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var conditionsText = string.Join('\n', request.Conditions.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()));
        var offer = Offer.Create(
            offerType,
            request.Name,
            request.Description,
            request.DurationDays,
            DurationUnit.Days,
            Money.Create(request.Price),
            conditionsText);

        foreach (var day in request.Itinerary.OrderBy(d => d.Day))
        {
            offer.AddItineraryDay(new OfferItineraryDay(day.Day, day.Title, day.Description));
        }

        await _offers.AddAsync(offer, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogCreate,
            AuditActions.AdminCatalogCreate,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                offerStatus = "inactive",
                amount = offer.PriceNormal.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = offer.PriceNormal.Currency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record UpdateAdminOfferCommand(
    string Type,
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int DurationDays,
    IReadOnlyList<string> Conditions,
    IReadOnlyList<ItineraryDayInput>? Itinerary,
    long? ExpectedVersion = null) : IRequest<CatalogAdminItemDto>;

public sealed class UpdateAdminOfferCommandValidator : AbstractValidator<UpdateAdminOfferCommand>
{
    public UpdateAdminOfferCommandValidator()
    {
        RuleFor(c => c.Type).Must(t => t.Trim().ToLowerInvariant() is "tours" or "packages");
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).NotEmpty();
        RuleFor(c => c.Price).GreaterThan(0);
        RuleFor(c => c.DurationDays).GreaterThan(0);
    }
}

public sealed class UpdateAdminOfferCommandHandler : IRequestHandler<UpdateAdminOfferCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminOfferCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(UpdateAdminOfferCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.Id, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != offer.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var now = _clock.UtcNow;
        var conditionsText = string.Join('\n', request.Conditions.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()));
        offer.Update(
            request.Name,
            request.Description,
            request.DurationDays,
            DurationUnit.Days,
            Money.Create(request.Price),
            conditionsText,
            now);

        if (request.Itinerary is { Count: > 0 })
        {
            if (await _offers.HasActiveReservationsAsync(offer.Id, cancellationToken))
            {
                throw new ConflictAppException(
                    "itinerary_protected",
                    "No se puede modificar el itinerario mientras existan reservas activas.");
            }

            offer.ReplaceItinerary(
                request.Itinerary.OrderBy(d => d.Day).Select(d => new OfferItineraryDay(d.Day, d.Title, d.Description)),
                now);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogUpdate,
            AuditActions.AdminCatalogUpdate,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                offerStatus = offer.IsActive ? "active" : "inactive",
                amount = offer.PriceNormal.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = offer.PriceNormal.Currency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record ActivateAdminOfferCommand(string Type, Guid Id, long? ExpectedVersion = null) : IRequest<CatalogAdminItemDto>;

public sealed class ActivateAdminOfferCommandHandler : IRequestHandler<ActivateAdminOfferCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ActivateAdminOfferCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(ActivateAdminOfferCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.Id, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != offer.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        try
        {
            offer.Activate(_clock.UtcNow);
        }
        catch (DomainException ex)
        {
            throw new ConflictAppException("incomplete_offer", ex.Message);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogActivate,
            AuditActions.AdminCatalogActivate,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                offerStatus = "active"
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record DeactivateAdminOfferCommand(string Type, Guid Id, long? ExpectedVersion = null) : IRequest<CatalogAdminItemDto>;

public sealed class DeactivateAdminOfferCommandHandler : IRequestHandler<DeactivateAdminOfferCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public DeactivateAdminOfferCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(DeactivateAdminOfferCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.Id, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != offer.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        offer.Deactivate(_clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogDeactivate,
            AuditActions.AdminCatalogDeactivate,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                offerStatus = "inactive"
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record UpdateAdminOfferPricingCommand(
    string Type,
    Guid Id,
    decimal NormalPrice,
    decimal? DiscountedPrice,
    long? ExpectedVersion = null) : IRequest<CatalogAdminItemDto>;

public sealed class UpdateAdminOfferPricingCommandHandler : IRequestHandler<UpdateAdminOfferPricingCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminOfferPricingCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(UpdateAdminOfferPricingCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.Id, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != offer.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        offer.UpdatePricing(
            Money.Create(request.NormalPrice),
            request.DiscountedPrice.HasValue ? Money.Create(request.DiscountedPrice.Value) : null,
            _clock.UtcNow);

        var effective = offer.PriceDiscounted ?? offer.PriceNormal;

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogUpdatePricing,
            AuditActions.AdminCatalogUpdatePricing,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                amount = effective.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = effective.Currency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record UpdateAdminOfferItineraryCommand(
    string Type,
    Guid Id,
    IReadOnlyList<ItineraryDayInput> Items,
    long? ExpectedVersion = null) : IRequest<CatalogAdminItemDto>;

public sealed class UpdateAdminOfferItineraryCommandHandler : IRequestHandler<UpdateAdminOfferItineraryCommand, CatalogAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminOfferItineraryCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<CatalogAdminItemDto> Handle(UpdateAdminOfferItineraryCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.Id, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != offer.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (await _offers.HasActiveReservationsAsync(offer.Id, cancellationToken))
        {
            throw new ConflictAppException(
                "itinerary_protected",
                "No se puede modificar el itinerario mientras existan reservas activas.");
        }

        var days = request.Items
            .OrderBy(d => d.Day)
            .Select(d => new OfferItineraryDay(d.Day, d.Title, d.Description))
            .ToList();

        offer.ReplaceItinerary(days, _clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogUpdateItinerary,
            AuditActions.AdminCatalogUpdateItinerary,
            AuditActions.ActorHuman,
            admin.Id,
            "offer",
            offer.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                offerType = CatalogMapper.ToApiType(offer.Type),
                itineraryDays = days.Count
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminCatalogMapper.ToAdminDto(offer);
    }
}

public sealed record CreateAdminDepartureCommand(
    string Type,
    Guid OfferId,
    DateTime StartDate,
    DateTime EndDate,
    decimal Price,
    int Capacity,
    string IdempotencyKey) : IRequest<DepartureDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.catalog.createDeparture";
    public string GetRequestFingerprint() =>
        $"{OfferId:N}|{StartDate.ToUniversalTime():O}|{EndDate.ToUniversalTime():O}|{Price.ToString("0.00", CultureInfo.InvariantCulture)}|{Capacity}";
}

public sealed class CreateAdminDepartureCommandValidator : AbstractValidator<CreateAdminDepartureCommand>
{
    public CreateAdminDepartureCommandValidator()
    {
        RuleFor(c => c.Type).Must(t => t.Trim().ToLowerInvariant() is "tours" or "packages");
        RuleFor(c => c.OfferId).NotEmpty();
        RuleFor(c => c.Price).GreaterThan(0);
        RuleFor(c => c.Capacity).GreaterThan(0);
        RuleFor(c => c.EndDate).GreaterThan(c => c.StartDate);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminDepartureCommandHandler : IRequestHandler<CreateAdminDepartureCommand, DepartureDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateAdminDepartureCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<DepartureDto> Handle(CreateAdminDepartureCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var departure = new TourDeparture(
            offer.Id,
            DateTime.SpecifyKind(request.StartDate.ToUniversalTime(), DateTimeKind.Utc),
            DateTime.SpecifyKind(request.EndDate.ToUniversalTime(), DateTimeKind.Utc),
            request.Capacity,
            Money.Create(request.Price));

        await _offers.AddDepartureAsync(departure, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogCreateDeparture,
            AuditActions.AdminCatalogCreateDeparture,
            AuditActions.ActorHuman,
            admin.Id,
            "departure",
            departure.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                departureId = departure.PublicId,
                capacity = departure.CapacityTotal,
                amount = request.Price.ToString("0.00", CultureInfo.InvariantCulture),
                currency = Money.DefaultCurrency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CatalogMapper.ToDeparture(departure, offer, includeCapacity: true);
    }
}

public sealed record UpdateAdminDepartureCommand(
    string Type,
    Guid OfferId,
    Guid DepartureId,
    DateTime StartDate,
    DateTime EndDate,
    decimal Price,
    int Capacity,
    long? ExpectedVersion = null) : IRequest<DepartureDto>;

public sealed class UpdateAdminDepartureCommandHandler : IRequestHandler<UpdateAdminDepartureCommand, DepartureDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminDepartureCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<DepartureDto> Handle(UpdateAdminDepartureCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var departure = offer.Departures.SingleOrDefault(d => d.PublicId == request.DepartureId && d.DeletedAtUtc == null)
            ?? throw new NotFoundAppException("La salida no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != departure.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var hasActiveReservations = await _offers.HasActiveReservationsForDepartureAsync(departure.Id, cancellationToken);
        try
        {
            departure.Update(
                DateTime.SpecifyKind(request.StartDate.ToUniversalTime(), DateTimeKind.Utc),
                DateTime.SpecifyKind(request.EndDate.ToUniversalTime(), DateTimeKind.Utc),
                request.Capacity,
                Money.Create(request.Price),
                hasActiveReservations,
                _clock.UtcNow);
        }
        catch (DomainException ex)
        {
            throw new ConflictAppException("departure_protected", ex.Message);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogUpdateDeparture,
            AuditActions.AdminCatalogUpdateDeparture,
            AuditActions.ActorHuman,
            admin.Id,
            "departure",
            departure.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                departureId = departure.PublicId,
                capacity = departure.CapacityTotal,
                amount = request.Price.ToString("0.00", CultureInfo.InvariantCulture),
                currency = Money.DefaultCurrency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CatalogMapper.ToDeparture(departure, offer, includeCapacity: true);
    }
}

public sealed record UpdateAdminDeparturePricingCommand(
    string Type,
    Guid OfferId,
    Guid DepartureId,
    decimal NormalPrice,
    decimal? DiscountedPrice,
    long? ExpectedVersion = null) : IRequest<DepartureDto>;

public sealed class UpdateAdminDeparturePricingCommandHandler
    : IRequestHandler<UpdateAdminDeparturePricingCommand, DepartureDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminDeparturePricingCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<DepartureDto> Handle(UpdateAdminDeparturePricingCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var departure = offer.Departures.SingleOrDefault(d => d.PublicId == request.DepartureId && d.DeletedAtUtc == null)
            ?? throw new NotFoundAppException("La salida no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != departure.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        departure.UpdatePricing(
            Money.Create(request.NormalPrice),
            request.DiscountedPrice.HasValue ? Money.Create(request.DiscountedPrice.Value) : null,
            _clock.UtcNow);

        var effective = departure.GetEffectivePrice(offer.PriceNormal);

        _audit.Record(new AuditEntry(
            AuditActions.AdminCatalogUpdateDeparturePricing,
            AuditActions.AdminCatalogUpdateDeparturePricing,
            AuditActions.ActorHuman,
            admin.Id,
            "departure",
            departure.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                departureId = departure.PublicId,
                amount = effective.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = effective.Currency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CatalogMapper.ToDeparture(departure, offer, includeCapacity: true);
    }
}
