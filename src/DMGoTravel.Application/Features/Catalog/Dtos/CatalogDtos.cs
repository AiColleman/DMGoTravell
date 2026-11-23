namespace DMGoTravel.Application.Features.Catalog.Dtos;

public sealed record ImageAssetDto(
    Guid Id,
    string Url,
    bool IsPrimary,
    long Version);

public sealed record CatalogOfferDto(
    Guid Id,
    string Type,
    string Name,
    string Description,
    string Price,
    string Currency,
    int DurationDays,
    IReadOnlyList<ImageAssetDto> Images,
    IReadOnlyList<string> Conditions);

public sealed record ItineraryItemDto(int Day, string Title, string Description);

public sealed record DepartureDto(
    Guid Id,
    DateTime StartDate,
    DateTime EndDate,
    string Price,
    string Currency,
    int? Capacity,
    int? Available);

public sealed record CatalogOfferDetailDto(
    Guid Id,
    string Type,
    string Name,
    string Description,
    string Price,
    string Currency,
    int DurationDays,
    IReadOnlyList<ImageAssetDto> Images,
    IReadOnlyList<string> Conditions,
    IReadOnlyList<ItineraryItemDto> Itinerary,
    IReadOnlyList<DepartureDto> Departures);

public sealed record CatalogListDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<CatalogOfferDto> Items);
