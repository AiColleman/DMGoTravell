using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Hotels.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Hotels;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Hotels.Admin;

public sealed record ListAdminHotelsQuery(int Page = 1, int PageSize = 10) : IRequest<HotelAdminPageDto>;

public sealed class ListAdminHotelsQueryValidator : AbstractValidator<ListAdminHotelsQuery>
{
    public ListAdminHotelsQueryValidator()
    {
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class ListAdminHotelsQueryHandler : IRequestHandler<ListAdminHotelsQuery, HotelAdminPageDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IHotelRepository _hotels;

    public ListAdminHotelsQueryHandler(IAdminAccessGuard adminAccess, IHotelRepository hotels)
    {
        _adminAccess = adminAccess;
        _hotels = hotels;
    }

    public async Task<HotelAdminPageDto> Handle(ListAdminHotelsQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var (items, total) = await _hotels.ListAdminAsync(request.Page, request.PageSize, cancellationToken);
        return new HotelAdminPageDto(
            request.Page,
            request.PageSize,
            total,
            (long)request.Page * request.PageSize < total,
            items.Select(HotelMapper.ToAdminDto).ToList());
    }
}

public sealed record CreateAdminHotelCommand(
    string Name,
    string Description,
    IReadOnlyList<string> Services,
    string IdempotencyKey) : IRequest<HotelAdminItemDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.hotels.create";
    public string GetRequestFingerprint() => $"{Name.Trim()}|{Description.Trim()}|{string.Join(',', Services)}";
}

public sealed class CreateAdminHotelCommandValidator : AbstractValidator<CreateAdminHotelCommand>
{
    public CreateAdminHotelCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).NotEmpty();
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminHotelCommandHandler : IRequestHandler<CreateAdminHotelCommand, HotelAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateAdminHotelCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<HotelAdminItemDto> Handle(CreateAdminHotelCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = Hotel.Create(request.Name, request.Description);
        foreach (var service in request.Services)
        {
            if (!string.IsNullOrWhiteSpace(service))
            {
                hotel.AddService(service);
            }
        }

        await _hotels.AddHotelAsync(hotel, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsCreate,
            AuditActions.AdminHotelsCreate,
            AuditActions.ActorHuman,
            admin.Id,
            "hotel",
            hotel.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { hotelStatus = "inactive" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return HotelMapper.ToAdminDto(hotel);
    }
}

public sealed record UpdateAdminHotelCommand(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> Services,
    long? ExpectedVersion = null) : IRequest<HotelAdminItemDto>;

public sealed class UpdateAdminHotelCommandValidator : AbstractValidator<UpdateAdminHotelCommand>
{
    public UpdateAdminHotelCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).NotEmpty();
    }
}

public sealed class UpdateAdminHotelCommandHandler : IRequestHandler<UpdateAdminHotelCommand, HotelAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminHotelCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<HotelAdminItemDto> Handle(UpdateAdminHotelCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = await _hotels.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != hotel.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var normalizedKey = request.Name.Trim().ToUpperInvariant();
        if (hotel.IsActive &&
            await _hotels.ExistsActiveWithNormalizedKeyAsync(normalizedKey, hotel.Id, cancellationToken))
        {
            throw new ConflictAppException("duplicate_active_hotel", "Ya existe otro hotel activo con ese nombre.");
        }

        hotel.Update(request.Name, request.Description, request.Services, _clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsUpdate,
            AuditActions.AdminHotelsUpdate,
            AuditActions.ActorHuman,
            admin.Id,
            "hotel",
            hotel.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { hotelStatus = hotel.IsActive ? "active" : "inactive" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return HotelMapper.ToAdminDto(hotel);
    }
}

public sealed record ActivateAdminHotelCommand(Guid Id, long? ExpectedVersion = null) : IRequest<HotelAdminItemDto>;

public sealed class ActivateAdminHotelCommandHandler : IRequestHandler<ActivateAdminHotelCommand, HotelAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ActivateAdminHotelCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<HotelAdminItemDto> Handle(ActivateAdminHotelCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = await _hotels.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != hotel.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        if (await _hotels.ExistsActiveWithNormalizedKeyAsync(hotel.NormalizedKey, hotel.Id, cancellationToken))
        {
            throw new ConflictAppException("duplicate_active_hotel", "Ya existe otro hotel activo con ese nombre.");
        }

        var hasImage = await _hotels.HasHotelImageAsync(hotel.Id, cancellationToken);
        try
        {
            hotel.Activate(hasImage, _clock.UtcNow);
        }
        catch (DomainException ex)
        {
            throw new ConflictAppException("incomplete_hotel", ex.Message);
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsActivate,
            AuditActions.AdminHotelsActivate,
            AuditActions.ActorHuman,
            admin.Id,
            "hotel",
            hotel.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { hotelStatus = "active" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return HotelMapper.ToAdminDto(hotel);
    }
}

public sealed record DeactivateAdminHotelCommand(Guid Id, long? ExpectedVersion = null) : IRequest<HotelAdminItemDto>;

public sealed class DeactivateAdminHotelCommandHandler : IRequestHandler<DeactivateAdminHotelCommand, HotelAdminItemDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public DeactivateAdminHotelCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<HotelAdminItemDto> Handle(DeactivateAdminHotelCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = await _hotels.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != hotel.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        hotel.Deactivate(_clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsDeactivate,
            AuditActions.AdminHotelsDeactivate,
            AuditActions.ActorHuman,
            admin.Id,
            "hotel",
            hotel.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { hotelStatus = "inactive" })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return HotelMapper.ToAdminDto(hotel);
    }
}

public sealed record CreateAdminRoomTypeCommand(
    Guid HotelId,
    string Name,
    int Capacity,
    decimal BasePrice,
    string IdempotencyKey) : IRequest<RoomTypeDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.hotels.createRoomType";
    public string GetRequestFingerprint() =>
        $"{HotelId:N}|{Name.Trim().ToUpperInvariant()}|{Capacity}|{BasePrice.ToString("0.00", CultureInfo.InvariantCulture)}";
}

public sealed class CreateAdminRoomTypeCommandValidator : AbstractValidator<CreateAdminRoomTypeCommand>
{
    public CreateAdminRoomTypeCommandValidator()
    {
        RuleFor(c => c.HotelId).NotEmpty();
        RuleFor(c => c.Name).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Capacity).GreaterThan(0);
        RuleFor(c => c.BasePrice).GreaterThan(0);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminRoomTypeCommandHandler : IRequestHandler<CreateAdminRoomTypeCommand, RoomTypeDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateAdminRoomTypeCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<RoomTypeDto> Handle(CreateAdminRoomTypeCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var normalizedKey = request.Name.Trim().ToUpperInvariant();
        if (hotel.RoomTypes.Any(r => r.DeletedAtUtc is null && r.NormalizedKey == normalizedKey))
        {
            throw new ConflictAppException("duplicate_room_type", "Ya existe un tipo de habitación con ese nombre en el hotel.");
        }

        var roomType = new RoomType(hotel.Id, request.Name, request.Capacity, Money.Create(request.BasePrice));
        await _hotels.AddRoomTypeAsync(roomType, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsCreateRoomType,
            AuditActions.AdminHotelsCreateRoomType,
            AuditActions.ActorHuman,
            admin.Id,
            "room_type",
            roomType.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                capacity = roomType.Capacity,
                amount = roomType.BaseRate.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = Money.DefaultCurrency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return HotelMapper.ToRoomTypeDto(roomType, []);
    }
}

public sealed record UpdateAdminRoomTypeCommand(
    Guid HotelId,
    Guid RoomTypeId,
    string Name,
    int Capacity,
    decimal BasePrice,
    long? ExpectedVersion = null) : IRequest<RoomTypeDto>;

public sealed class UpdateAdminRoomTypeCommandHandler : IRequestHandler<UpdateAdminRoomTypeCommand, RoomTypeDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateAdminRoomTypeCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<RoomTypeDto> Handle(UpdateAdminRoomTypeCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var roomType = hotel.RoomTypes.SingleOrDefault(r => r.PublicId == request.RoomTypeId && r.DeletedAtUtc is null)
            ?? throw new NotFoundAppException("El tipo de habitación no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != roomType.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var normalizedKey = request.Name.Trim().ToUpperInvariant();
        if (hotel.RoomTypes.Any(r => r.Id != roomType.Id && r.DeletedAtUtc is null && r.NormalizedKey == normalizedKey))
        {
            throw new ConflictAppException("duplicate_room_type", "Ya existe otro tipo de habitación con ese nombre en el hotel.");
        }

        roomType.Update(request.Name, request.Capacity, Money.Create(request.BasePrice), _clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsUpdateRoomType,
            AuditActions.AdminHotelsUpdateRoomType,
            AuditActions.ActorHuman,
            admin.Id,
            "room_type",
            roomType.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                capacity = roomType.Capacity,
                amount = roomType.BaseRate.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = Money.DefaultCurrency
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var images = await _hotels.GetImagesForRoomTypesAsync([roomType.Id], cancellationToken);
        return HotelMapper.ToRoomTypeDto(roomType, images);
    }
}

public sealed record UpdateRoomInventoryCommand(
    Guid RoomTypeId,
    DateOnly Date,
    int Quantity,
    long? ExpectedVersion = null) : IRequest<InventoryRowDto>;

public sealed class UpdateRoomInventoryCommandValidator : AbstractValidator<UpdateRoomInventoryCommand>
{
    public UpdateRoomInventoryCommandValidator()
    {
        RuleFor(c => c.RoomTypeId).NotEmpty();
        RuleFor(c => c.Quantity).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateRoomInventoryCommandHandler : IRequestHandler<UpdateRoomInventoryCommand, InventoryRowDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IHotelRepository _hotels;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateRoomInventoryCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IHotelRepository hotels,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _hotels = hotels;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<InventoryRowDto> Handle(UpdateRoomInventoryCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var roomType = await _hotels.GetRoomTypeByPublicIdAsync(request.RoomTypeId, cancellationToken)
            ?? throw new NotFoundAppException("El tipo de habitación no existe.");

        var night = await _hotels.GetInventoryNightAsync(roomType.Id, request.Date, cancellationToken);
        if (night is null)
        {
            night = new RoomInventoryNight(roomType.Id, request.Date, request.Quantity);
            await _hotels.AddInventoryNightAsync(night, cancellationToken);
        }
        else
        {
            if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != night.RowVersion)
            {
                throw new ConcurrencyConflictAppException();
            }

            try
            {
                night.UpdateQuantityTotal(request.Quantity);
            }
            catch (DomainException ex)
            {
                throw new ConflictAppException("inventory_below_committed", ex.Message);
            }
        }

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsUpdateInventory,
            AuditActions.AdminHotelsUpdateInventory,
            AuditActions.ActorHuman,
            admin.Id,
            "room_type",
            roomType.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { quantity = night.QuantityTotal })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new InventoryRowDto(night.StayDate, night.QuantityTotal, night.RowVersion);
    }
}

public sealed record CreateLodgingProposalCommand(
    Guid DepartureId,
    Guid HotelId,
    DateTime StartDate,
    DateTime EndDate,
    string IdempotencyKey) : IRequest<LodgingProposalDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.hotels.createLodgingProposal";
    public string GetRequestFingerprint() =>
        $"{DepartureId:N}|{HotelId:N}|{StartDate.ToUniversalTime():yyyy-MM-dd}|{EndDate.ToUniversalTime():yyyy-MM-dd}";
}

public sealed class CreateLodgingProposalCommandValidator : AbstractValidator<CreateLodgingProposalCommand>
{
    public CreateLodgingProposalCommandValidator()
    {
        RuleFor(c => c.DepartureId).NotEmpty();
        RuleFor(c => c.HotelId).NotEmpty();
        RuleFor(c => c.EndDate).GreaterThan(c => c.StartDate);
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateLodgingProposalCommandHandler : IRequestHandler<CreateLodgingProposalCommand, LodgingProposalDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateLodgingProposalCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<LodgingProposalDto> Handle(CreateLodgingProposalCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var departure = await _offers.GetDepartureByPublicIdAsync(request.DepartureId, cancellationToken)
            ?? throw new NotFoundAppException("La salida no existe.");

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var checkIn = DateOnly.FromDateTime(request.StartDate.ToUniversalTime());
        var checkOut = DateOnly.FromDateTime(request.EndDate.ToUniversalTime());
        var todayPeru = _clock.TodayInPeru;

        if (checkIn < todayPeru || checkOut <= checkIn)
        {
            throw new ValidationAppException([new FieldError("startDate", "Las fechas de la propuesta deben ser futuras y abarcar al menos una noche.", "invalid_range")]);
        }

        var proposal = new LodgingProposal(departure.Id, hotel.Id, checkIn, checkOut);
        await _hotels.AddProposalAsync(proposal, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsCreateProposal,
            AuditActions.AdminHotelsCreateProposal,
            AuditActions.ActorHuman,
            admin.Id,
            "lodging_proposal",
            proposal.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                departureId = departure.PublicId,
                nights = proposal.Nights
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roomTypeIds = hotel.RoomTypes.Where(r => r.IsActive && r.DeletedAtUtc is null).Select(r => r.Id).ToList();
        var roomImagesList = await _hotels.GetImagesForRoomTypesAsync(roomTypeIds, cancellationToken);
        var roomImages = roomImagesList
            .Where(i => i.RoomTypeId.HasValue)
            .GroupBy(i => i.RoomTypeId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        return HotelMapper.ToProposalDto(proposal, hotel, departure.PublicId, roomImages);
    }
}

public sealed record UpdateLodgingProposalCommand(
    Guid Id,
    Guid DepartureId,
    Guid HotelId,
    DateTime StartDate,
    DateTime EndDate,
    long? ExpectedVersion = null) : IRequest<LodgingProposalDto>;

public sealed class UpdateLodgingProposalCommandHandler : IRequestHandler<UpdateLodgingProposalCommand, LodgingProposalDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateLodgingProposalCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<LodgingProposalDto> Handle(UpdateLodgingProposalCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();

        var proposal = await _hotels.GetProposalByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("La propuesta de alojamiento no existe.");

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != proposal.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var departure = await _offers.GetDepartureByPublicIdAsync(request.DepartureId, cancellationToken)
            ?? throw new NotFoundAppException("La salida no existe.");

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var checkIn = DateOnly.FromDateTime(request.StartDate.ToUniversalTime());
        var checkOut = DateOnly.FromDateTime(request.EndDate.ToUniversalTime());
        proposal.Update(departure.Id, hotel.Id, checkIn, checkOut, _clock.UtcNow);

        _audit.Record(new AuditEntry(
            AuditActions.AdminHotelsUpdateProposal,
            AuditActions.AdminHotelsUpdateProposal,
            AuditActions.ActorHuman,
            admin.Id,
            "lodging_proposal",
            proposal.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                departureId = departure.PublicId,
                nights = proposal.Nights
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roomTypeIds = hotel.RoomTypes.Where(r => r.IsActive && r.DeletedAtUtc is null).Select(r => r.Id).ToList();
        var roomImagesList = await _hotels.GetImagesForRoomTypesAsync(roomTypeIds, cancellationToken);
        var roomImages = roomImagesList
            .Where(i => i.RoomTypeId.HasValue)
            .GroupBy(i => i.RoomTypeId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        return HotelMapper.ToProposalDto(proposal, hotel, departure.PublicId, roomImages);
    }
}
