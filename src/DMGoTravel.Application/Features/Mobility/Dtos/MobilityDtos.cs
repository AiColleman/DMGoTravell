using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Domain.Modules.Mobility;

namespace DMGoTravel.Application.Features.Mobility.Dtos;

public sealed record MobilityPublicItemDto(
    Guid Id,
    string Name,
    string Description,
    int Capacity,
    ImageAssetDto? Image);

public sealed record MobilityPublicListDto(
    IReadOnlyList<MobilityPublicItemDto> Items);

public sealed record MobilityAdminItemDto(
    Guid Id,
    string Name,
    string Description,
    string Type,
    int Capacity,
    string Status,
    ImageAssetDto? Image,
    long Version,
    DateTime UpdatedAt);

public sealed record MobilityAdminPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<MobilityAdminItemDto> Items);

public static class MobilityMapper
{
    public static MobilityPublicItemDto ToPublicDto(MobilityItem item) => new(
        item.PublicId,
        item.Name,
        item.Description,
        item.Capacity,
        ToImageDto(item));

    public static MobilityAdminItemDto ToAdminDto(MobilityItem item) => new(
        item.PublicId,
        item.Name,
        item.Description,
        item.Type,
        item.Capacity,
        item.IsActive ? "active" : "inactive",
        ToImageDto(item),
        item.RowVersion,
        DateTime.SpecifyKind(item.UpdatedAtUtc ?? item.CreatedAtUtc, DateTimeKind.Utc));

    private static ImageAssetDto? ToImageDto(MobilityItem item) =>
        item.ImagePublicId.HasValue && !string.IsNullOrWhiteSpace(item.ImageUrl)
            ? new ImageAssetDto(item.ImagePublicId.Value, item.ImageUrl, IsPrimary: true, item.ImageVersion)
            : null;
}
