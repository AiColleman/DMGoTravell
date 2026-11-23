using DMGoTravel.Application.Features.Catalog.Dtos;
using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Features.Catalog;

internal static class CatalogMapper
{
    public static string ToApiType(OfferType type) => type switch
    {
        OfferType.Tour => "tour",
        OfferType.Package => "package",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
    };

    public static OfferType ParseApiType(string type) => type.Trim().ToLowerInvariant() switch
    {
        "tours" => OfferType.Tour,
        "packages" => OfferType.Package,
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Solo se admiten tours o packages.")
    };

    public static int ToDurationDays(Offer offer) => offer.DurationUnit switch
    {
        DurationUnit.Days => Math.Max(1, offer.DurationValue),
        DurationUnit.Hours => Math.Max(1, (int)Math.Ceiling(offer.DurationValue / 24m)),
        _ => 1
    };

    public static IReadOnlyList<string> ToConditions(Offer offer) =>
        offer.Conditions
            .Split(['\r', '\n', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToArray();

    public static CatalogOfferDto ToSummary(Offer offer) => new(
        offer.PublicId,
        ToApiType(offer.Type),
        offer.Name,
        offer.Description,
        (offer.PriceDiscounted ?? offer.PriceNormal).ToString(),
        MoneyCurrency,
        ToDurationDays(offer),
        offer.Images
            .OrderByDescending(image => image.Role == "main")
            .ThenBy(image => image.Position)
            .Select(ToImage)
            .ToArray(),
        ToConditions(offer));

    public static CatalogOfferDetailDto ToDetail(Offer offer, DateTime nowUtc) => new(
        offer.PublicId,
        ToApiType(offer.Type),
        offer.Name,
        offer.Description,
        (offer.PriceDiscounted ?? offer.PriceNormal).ToString(),
        MoneyCurrency,
        ToDurationDays(offer),
        offer.Images
            .OrderByDescending(image => image.Role == "main")
            .ThenBy(image => image.Position)
            .Select(ToImage)
            .ToArray(),
        ToConditions(offer),
        offer.Itinerary
            .OrderBy(day => day.DayNumber)
            .Select(day => new ItineraryItemDto(day.DayNumber, day.Title, day.Activities))
            .ToArray(),
        offer.Departures
            .Where(departure => departure.IsActive && departure.StartsAtUtc > nowUtc)
            .OrderBy(departure => departure.StartsAtUtc)
            .Select(departure => ToDeparture(departure, offer, includeCapacity: true))
            .ToArray());

    public static DepartureDto ToDeparture(TourDeparture departure, Offer offer, bool includeCapacity) => new(
        departure.PublicId,
        departure.StartsAtUtc,
        departure.EndsAtUtc,
        departure.GetEffectivePrice(offer.PriceNormal).ToString(),
        MoneyCurrency,
        includeCapacity ? departure.CapacityTotal : null,
        includeCapacity ? departure.AvailableCapacity : null);

    private static ImageAssetDto ToImage(MediaAsset image) => new(
        image.PublicId,
        image.Url,
        image.Role == "main",
        image.RowVersion);

    private const string MoneyCurrency = "PEN";
}
