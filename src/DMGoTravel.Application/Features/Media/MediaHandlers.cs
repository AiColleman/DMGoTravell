using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Catalog;
using DMGoTravel.Domain.Modules.Catalog;
using MediatR;

namespace DMGoTravel.Application.Features.Media;

public sealed record ImageAssetDto(Guid Id, string Url, bool IsPrimary, long Version);

public sealed record MediaBinaryDto(byte[] Content, string ContentType);

public sealed record UploadOfferImageCommand(
    string Type,
    Guid OfferId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record ReplaceOfferImageCommand(
    string Type,
    Guid OfferId,
    Guid ImageId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record DeleteOfferImageCommand(
    string Type,
    Guid OfferId,
    Guid ImageId) : IRequest;

public sealed record UploadHotelImageCommand(
    Guid HotelId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record ReplaceHotelImageCommand(
    Guid HotelId,
    Guid ImageId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record DeleteHotelImageCommand(
    Guid HotelId,
    Guid ImageId) : IRequest;

public sealed record UploadRoomTypeImageCommand(
    Guid HotelId,
    Guid RoomTypeId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record ReplaceRoomTypeImageCommand(
    Guid HotelId,
    Guid RoomTypeId,
    Guid ImageId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record DeleteRoomTypeImageCommand(
    Guid HotelId,
    Guid RoomTypeId,
    Guid ImageId) : IRequest;

public sealed record ReplaceMobilityImageCommand(
    Guid MobilityId,
    byte[] Content,
    string? ContentType,
    bool? IsPrimary) : IRequest<ImageAssetDto>;

public sealed record GetPublishedMediaQuery(Guid AssetId) : IRequest<MediaBinaryDto>;

public sealed record GetAdminMediaPreviewQuery(Guid AssetId) : IRequest<MediaBinaryDto>;

public sealed class MediaCommandHandlers :
    IRequestHandler<UploadOfferImageCommand, ImageAssetDto>,
    IRequestHandler<ReplaceOfferImageCommand, ImageAssetDto>,
    IRequestHandler<DeleteOfferImageCommand>,
    IRequestHandler<UploadHotelImageCommand, ImageAssetDto>,
    IRequestHandler<ReplaceHotelImageCommand, ImageAssetDto>,
    IRequestHandler<DeleteHotelImageCommand>,
    IRequestHandler<UploadRoomTypeImageCommand, ImageAssetDto>,
    IRequestHandler<ReplaceRoomTypeImageCommand, ImageAssetDto>,
    IRequestHandler<DeleteRoomTypeImageCommand>,
    IRequestHandler<ReplaceMobilityImageCommand, ImageAssetDto>,
    IRequestHandler<GetPublishedMediaQuery, MediaBinaryDto>,
    IRequestHandler<GetAdminMediaPreviewQuery, MediaBinaryDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IMobilityRepository _mobility;
    private readonly IMediaRepository _media;
    private readonly IMediaStorage _storage;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public MediaCommandHandlers(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IHotelRepository hotels,
        IMobilityRepository mobility,
        IMediaRepository media,
        IMediaStorage storage,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _hotels = hotels;
        _mobility = mobility;
        _media = media;
        _storage = storage;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<ImageAssetDto> Handle(UploadOfferImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var existing = await _media.ListForOfferAsync(offer.Id, cancellationToken);
        var isPrimary = request.IsPrimary ?? (existing.Count == 0);
        var now = _clock.UtcNow;

        if (isPrimary)
        {
            DemoteExistingPrimary(existing, now);
        }

        var objectKey = $"offers/{offer.PublicId:N}/{Guid.NewGuid():N}{ext}";
        var asset = MediaAsset.CreateForOffer(
            objectKey,
            string.Empty,
            mime,
            request.Content.Length,
            isPrimary ? "main" : "gallery",
            existing.Count + 1,
            offer.Id,
            offer.IsActive);
        asset.AssignUrl(BuildPublicUrl(asset.PublicId));

        await _storage.SaveAsync(objectKey, request.Content, mime, cancellationToken);
        await _media.AddAsync(asset, cancellationToken);
        RecordAudit(AuditActions.AdminMediaUpload, adminId, asset.PublicId, "offer");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(asset);
    }

    public async Task<ImageAssetDto> Handle(ReplaceOfferImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var existing = await _media.ListForOfferAsync(offer.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para esta oferta.");

        var now = _clock.UtcNow;
        var oldObjectKey = asset.ObjectKey;
        var newObjectKey = $"offers/{offer.PublicId:N}/{Guid.NewGuid():N}{ext}";

        if (request.IsPrimary == true)
        {
            DemoteExistingPrimary(existing.Where(a => a.Id != asset.Id), now);
        }

        await _storage.SaveAsync(newObjectKey, request.Content, mime, cancellationToken);
        asset.ReplaceContent(newObjectKey, BuildPublicUrl(asset.PublicId), mime, request.Content.Length, request.IsPrimary, now);
        if (offer.IsActive)
        {
            asset.MarkPublished(now);
        }

        RecordAudit(AuditActions.AdminMediaReplace, adminId, asset.PublicId, "offer");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);

        return ToDto(asset);
    }

    public async Task Handle(DeleteOfferImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var offerType = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetByPublicIdAsync(request.OfferId, offerType, cancellationToken)
            ?? throw new NotFoundAppException("La oferta no existe.");

        var existing = await _media.ListForOfferAsync(offer.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para esta oferta.");

        if (offer.IsActive && existing.Count <= 1)
        {
            throw new ConflictAppException(
                "last_image_protected",
                "No se puede eliminar la última imagen de una oferta activa.");
        }

        var oldObjectKey = asset.ObjectKey;
        _media.Remove(asset);
        if (asset.IsPrimary)
        {
            var replacementPrimary = existing.FirstOrDefault(a => a.Id != asset.Id);
            replacementPrimary?.SetRole("main", _clock.UtcNow);
        }

        RecordAudit(AuditActions.AdminMediaDelete, adminId, asset.PublicId, "offer");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);
    }

    public async Task<ImageAssetDto> Handle(UploadHotelImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var existing = await _media.ListForHotelAsync(hotel.Id, cancellationToken);
        var isPrimary = request.IsPrimary ?? (existing.Count == 0);
        var now = _clock.UtcNow;

        if (isPrimary)
        {
            DemoteExistingPrimary(existing, now);
        }

        var objectKey = $"hotels/{hotel.PublicId:N}/{Guid.NewGuid():N}{ext}";
        var asset = MediaAsset.CreateForHotel(
            objectKey,
            string.Empty,
            mime,
            request.Content.Length,
            isPrimary ? "main" : "gallery",
            existing.Count + 1,
            hotel.Id,
            hotel.IsActive);
        asset.AssignUrl(BuildPublicUrl(asset.PublicId));

        await _storage.SaveAsync(objectKey, request.Content, mime, cancellationToken);
        await _media.AddAsync(asset, cancellationToken);
        RecordAudit(AuditActions.AdminMediaUpload, adminId, asset.PublicId, "hotel");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(asset);
    }

    public async Task<ImageAssetDto> Handle(ReplaceHotelImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var existing = await _media.ListForHotelAsync(hotel.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para este hotel.");

        var now = _clock.UtcNow;
        var oldObjectKey = asset.ObjectKey;
        var newObjectKey = $"hotels/{hotel.PublicId:N}/{Guid.NewGuid():N}{ext}";

        if (request.IsPrimary == true)
        {
            DemoteExistingPrimary(existing.Where(a => a.Id != asset.Id), now);
        }

        await _storage.SaveAsync(newObjectKey, request.Content, mime, cancellationToken);
        asset.ReplaceContent(newObjectKey, BuildPublicUrl(asset.PublicId), mime, request.Content.Length, request.IsPrimary, now);
        if (hotel.IsActive)
        {
            asset.MarkPublished(now);
        }

        RecordAudit(AuditActions.AdminMediaReplace, adminId, asset.PublicId, "hotel");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);

        return ToDto(asset);
    }

    public async Task Handle(DeleteHotelImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");

        var existing = await _media.ListForHotelAsync(hotel.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para este hotel.");

        if (hotel.IsActive && existing.Count <= 1)
        {
            throw new ConflictAppException(
                "last_image_protected",
                "No se puede eliminar la última imagen de un hotel activo.");
        }

        var oldObjectKey = asset.ObjectKey;
        _media.Remove(asset);
        if (asset.IsPrimary)
        {
            var replacementPrimary = existing.FirstOrDefault(a => a.Id != asset.Id);
            replacementPrimary?.SetRole("main", _clock.UtcNow);
        }

        RecordAudit(AuditActions.AdminMediaDelete, adminId, asset.PublicId, "hotel");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);
    }

    public async Task<ImageAssetDto> Handle(UploadRoomTypeImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");
        var roomType = hotel.RoomTypes.SingleOrDefault(r => r.PublicId == request.RoomTypeId)
            ?? throw new NotFoundAppException("El tipo de habitación no existe en este hotel.");

        var existing = await _media.ListForRoomTypeAsync(hotel.Id, roomType.Id, cancellationToken);
        var isPrimary = request.IsPrimary ?? (existing.Count == 0);
        var now = _clock.UtcNow;

        if (isPrimary)
        {
            DemoteExistingPrimary(existing, now);
        }

        var objectKey = $"hotels/{hotel.PublicId:N}/room-types/{roomType.PublicId:N}/{Guid.NewGuid():N}{ext}";
        var asset = MediaAsset.CreateForRoomType(
            objectKey,
            string.Empty,
            mime,
            request.Content.Length,
            isPrimary ? "main" : "gallery",
            existing.Count + 1,
            hotel.Id,
            roomType.Id,
            hotel.IsActive);
        asset.AssignUrl(BuildPublicUrl(asset.PublicId));

        await _storage.SaveAsync(objectKey, request.Content, mime, cancellationToken);
        await _media.AddAsync(asset, cancellationToken);
        RecordAudit(AuditActions.AdminMediaUpload, adminId, asset.PublicId, "room_type");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(asset);
    }

    public async Task<ImageAssetDto> Handle(ReplaceRoomTypeImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");
        var roomType = hotel.RoomTypes.SingleOrDefault(r => r.PublicId == request.RoomTypeId)
            ?? throw new NotFoundAppException("El tipo de habitación no existe en este hotel.");

        var existing = await _media.ListForRoomTypeAsync(hotel.Id, roomType.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para este tipo de habitación.");

        var now = _clock.UtcNow;
        var oldObjectKey = asset.ObjectKey;
        var newObjectKey = $"hotels/{hotel.PublicId:N}/room-types/{roomType.PublicId:N}/{Guid.NewGuid():N}{ext}";

        if (request.IsPrimary == true)
        {
            DemoteExistingPrimary(existing.Where(a => a.Id != asset.Id), now);
        }

        await _storage.SaveAsync(newObjectKey, request.Content, mime, cancellationToken);
        asset.ReplaceContent(newObjectKey, BuildPublicUrl(asset.PublicId), mime, request.Content.Length, request.IsPrimary, now);
        if (hotel.IsActive)
        {
            asset.MarkPublished(now);
        }

        RecordAudit(AuditActions.AdminMediaReplace, adminId, asset.PublicId, "room_type");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);

        return ToDto(asset);
    }

    public async Task Handle(DeleteRoomTypeImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var hotel = await _hotels.GetByPublicIdAsync(request.HotelId, cancellationToken)
            ?? throw new NotFoundAppException("El hotel no existe.");
        var roomType = hotel.RoomTypes.SingleOrDefault(r => r.PublicId == request.RoomTypeId)
            ?? throw new NotFoundAppException("El tipo de habitación no existe en este hotel.");

        var existing = await _media.ListForRoomTypeAsync(hotel.Id, roomType.Id, cancellationToken);
        var asset = existing.SingleOrDefault(a => a.PublicId == request.ImageId)
            ?? throw new NotFoundAppException("La imagen no existe para este tipo de habitación.");

        var oldObjectKey = asset.ObjectKey;
        _media.Remove(asset);
        RecordAudit(AuditActions.AdminMediaDelete, adminId, asset.PublicId, "room_type");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);
    }

    public async Task<ImageAssetDto> Handle(ReplaceMobilityImageCommand request, CancellationToken cancellationToken)
    {
        var adminId = await RequireAdminIdAsync(cancellationToken);
        var (mime, ext) = ImageSignatureValidator.ValidateOrThrow(request.Content, request.ContentType);

        var item = await _mobility.GetByPublicIdAsync(request.MobilityId, cancellationToken)
            ?? throw new NotFoundAppException("El registro de movilidad no existe.");

        var now = _clock.UtcNow;
        var existingAsset = await _media.GetForMobilityAsync(item.Id, cancellationToken);
        var newObjectKey = $"mobility/{item.PublicId:N}/{Guid.NewGuid():N}{ext}";

        await _storage.SaveAsync(newObjectKey, request.Content, mime, cancellationToken);

        string? oldObjectKey = null;
        MediaAsset asset;
        if (existingAsset is null)
        {
            asset = MediaAsset.CreateForMobility(newObjectKey, string.Empty, mime, request.Content.Length, item.Id, item.IsActive);
            asset.AssignUrl(BuildPublicUrl(asset.PublicId));
            await _media.AddAsync(asset, cancellationToken);
        }
        else
        {
            oldObjectKey = existingAsset.ObjectKey;
            asset = existingAsset;
            asset.ReplaceContent(newObjectKey, BuildPublicUrl(asset.PublicId), mime, request.Content.Length, true, now);
            if (item.IsActive)
            {
                asset.MarkPublished(now);
            }
        }

        item.SetImage(asset.Url, mime, request.Content.Length, now, asset.PublicId);
        RecordAudit(AuditActions.AdminMediaReplace, adminId, asset.PublicId, "mobility");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(oldObjectKey))
        {
            await SafeDeleteOldObjectAsync(oldObjectKey, cancellationToken);
        }

        return new ImageAssetDto(asset.PublicId, asset.Url, true, item.ImageVersion);
    }

    public async Task<MediaBinaryDto> Handle(GetPublishedMediaQuery request, CancellationToken cancellationToken)
    {
        var asset = await _media.GetByPublicIdAsync(request.AssetId, cancellationToken)
            ?? throw new NotFoundAppException("El recurso multimedia no existe o no está publicado.");

        var readable = await _media.IsAssetPubliclyReadableAsync(asset, cancellationToken);
        if (!readable)
        {
            throw new NotFoundAppException("El recurso multimedia no existe o no está publicado.");
        }

        var stored = await _storage.ReadAsync(asset.ObjectKey, cancellationToken)
            ?? throw new NotFoundAppException("El contenido multimedia no se encuentra disponible.");

        return new MediaBinaryDto(stored.Content, asset.ContentType);
    }

    public async Task<MediaBinaryDto> Handle(GetAdminMediaPreviewQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var asset = await _media.GetByPublicIdAsync(request.AssetId, cancellationToken)
            ?? throw new NotFoundAppException("El recurso multimedia no existe.");

        var stored = await _storage.ReadAsync(asset.ObjectKey, cancellationToken)
            ?? throw new NotFoundAppException("El contenido multimedia no se encuentra disponible.");

        return new MediaBinaryDto(stored.Content, asset.ContentType);
    }

    private async Task<long> RequireAdminIdAsync(CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var admin = await _users.GetByPublicIdAsync(_currentUser.UserId!.Value, cancellationToken)
            ?? throw new ForbiddenAppException();
        return admin.Id;
    }

    private static void DemoteExistingPrimary(IEnumerable<MediaAsset> assets, DateTime nowUtc)
    {
        foreach (var existing in assets.Where(a => a.IsPrimary))
        {
            existing.SetRole("gallery", nowUtc);
        }
    }

    private void RecordAudit(string action, long adminId, Guid assetPublicId, string target)
    {
        _audit.Record(new AuditEntry(
            action,
            action,
            AuditActions.ActorHuman,
            adminId,
            "media_asset",
            assetPublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { target })));
    }

    private async Task SafeDeleteOldObjectAsync(string objectKey, CancellationToken cancellationToken)
    {
        try
        {
            await _storage.DeleteAsync(objectKey, cancellationToken);
        }
        catch
        {
            // La limpieza best-effort de un objeto anterior no debe revertir una transacción ya confirmada.
        }
    }

    private static string BuildPublicUrl(Guid assetPublicId) => $"/api/v1/media/{assetPublicId}";

    private static ImageAssetDto ToDto(MediaAsset asset) =>
        new(asset.PublicId, asset.Url, asset.IsPrimary, asset.RowVersion);
}
