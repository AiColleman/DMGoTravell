using System.Globalization;
using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Hotels;

namespace DMGoTravel.Application.Features.Hotels.Dtos;

public sealed record RoomTypeDto(
    Guid Id,
    string Name,
    int Capacity,
    string BasePrice,
    string Currency,
    IReadOnlyList<ImageAssetDto> Images);

public sealed record HotelPublicItemDto(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> Services,
    IReadOnlyList<ImageAssetDto> Images,
    bool HasAvailability,
    string? LowestBasePrice = null);

public sealed record HotelPublicListDto(
    IReadOnlyList<HotelPublicItemDto> Items);

public sealed record HotelPublicDetailDto(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> Services,
    IReadOnlyList<ImageAssetDto> Images,
    bool HasAvailability,
    IReadOnlyList<RoomTypeDto> RoomTypes);

public sealed record LodgingProposalDto(
    Guid Id,
    Guid HotelId,
    Guid DepartureId,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<RoomTypeDto> RoomTypes);

public sealed record LodgingProposalListDto(
    IReadOnlyList<LodgingProposalDto> Items);

public sealed record HotelAdminItemDto(
    Guid Id,
    string Name,
    string Status,
    long Version,
    DateTime UpdatedAt);

public sealed record HotelAdminPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<HotelAdminItemDto> Items);

public sealed record InventoryRowDto(
    DateOnly Date,
    int Quantity,
    long Version);

public static class HotelMapper
{
    public static HotelAdminItemDto ToAdminDto(Hotel hotel) => new(
        hotel.PublicId,
        hotel.Name,
        hotel.IsActive ? "active" : "inactive",
        hotel.RowVersion,
        DateTime.SpecifyKind(hotel.UpdatedAtUtc ?? hotel.CreatedAtUtc, DateTimeKind.Utc));

    public static RoomTypeDto ToRoomTypeDto(RoomType roomType, IReadOnlyList<MediaAsset> images) => new(
        roomType.PublicId,
        roomType.Name,
        roomType.Capacity,
        roomType.BaseRate.Amount.ToString("0.00", CultureInfo.InvariantCulture),
        Money.DefaultCurrency,
        images.Select(ToImageDto).ToList());

    public static HotelPublicItemDto ToPublicItemDto(
        Hotel hotel,
        IReadOnlyList<MediaAsset> images,
        bool hasAvailability)
    {
        var activeRates = hotel.RoomTypes
            .Where(r => r.IsActive && r.DeletedAtUtc is null)
            .Select(r => r.BaseRate.Amount)
            .ToList();

        return new HotelPublicItemDto(
            hotel.PublicId,
            hotel.Name,
            hotel.Description,
            hotel.Services.OrderBy(s => s.Position).Select(s => s.Text).ToList(),
            images.Select(ToImageDto).ToList(),
            hasAvailability,
            activeRates.Count > 0 ? activeRates.Min().ToString("0.00", CultureInfo.InvariantCulture) : null);
    }

    public static HotelPublicDetailDto ToPublicDetailDto(
        Hotel hotel,
        IReadOnlyList<MediaAsset> hotelImages,
        IReadOnlyDictionary<long, List<MediaAsset>> roomImages,
        bool hasAvailability) => new(
        hotel.PublicId,
        hotel.Name,
        hotel.Description,
        hotel.Services.OrderBy(s => s.Position).Select(s => s.Text).ToList(),
        hotelImages.Select(ToImageDto).ToList(),
        hasAvailability,
        hotel.RoomTypes
            .Where(r => r.IsActive && r.DeletedAtUtc is null)
            .OrderBy(r => r.Name)
            .Select(r => ToRoomTypeDto(r, roomImages.TryGetValue(r.Id, out var list) ? list : []))
            .ToList());

    public static LodgingProposalDto ToProposalDto(
        LodgingProposal proposal,
        Hotel hotel,
        Guid departurePublicId,
        IReadOnlyDictionary<long, List<MediaAsset>> roomImages) => new(
        proposal.PublicId,
        hotel.PublicId,
        departurePublicId,
        proposal.CheckInDate.ToDateTime(new TimeOnly(15, 0), DateTimeKind.Utc),
        proposal.CheckOutDate.ToDateTime(new TimeOnly(12, 0), DateTimeKind.Utc),
        hotel.RoomTypes
            .Where(r => r.IsActive && r.DeletedAtUtc is null)
            .OrderBy(r => r.Name)
            .Select(r => ToRoomTypeDto(r, roomImages.TryGetValue(r.Id, out var list) ? list : []))
            .ToList());

    private static ImageAssetDto ToImageDto(MediaAsset image) => new(
        image.PublicId,
        image.Url,
        image.Role == "main",
        image.RowVersion);
}
