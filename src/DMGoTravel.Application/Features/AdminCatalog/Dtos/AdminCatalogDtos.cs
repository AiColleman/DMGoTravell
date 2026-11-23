using DMGoTravel.Application.Features.Catalog;
using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Features.AdminCatalog.Dtos;

public sealed record CatalogAdminItemDto(
    Guid Id,
    string Type,
    string Name,
    string Status,
    long Version,
    DateTime UpdatedAt);

public sealed record CatalogAdminPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<CatalogAdminItemDto> Items);

public static class AdminCatalogMapper
{
    public static CatalogAdminItemDto ToAdminDto(Offer offer) => new(
        offer.PublicId,
        CatalogMapper.ToApiType(offer.Type),
        offer.Name,
        offer.IsActive ? "active" : "inactive",
        offer.RowVersion,
        DateTime.SpecifyKind(offer.UpdatedAtUtc ?? offer.CreatedAtUtc, DateTimeKind.Utc));
}
