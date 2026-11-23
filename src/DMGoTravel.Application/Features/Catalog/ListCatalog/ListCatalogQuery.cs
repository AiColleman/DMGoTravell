using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Catalog.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Catalog.ListCatalog;

public sealed record ListCatalogQuery(
    string Type,
    int Page = 1,
    int PageSize = 10,
    decimal? PriceMin = null,
    decimal? PriceMax = null,
    int? DurationMin = null,
    int? DurationMax = null,
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    string? Destination = null) : IRequest<CatalogListDto>;

public sealed class ListCatalogQueryValidator : AbstractValidator<ListCatalogQuery>
{
    public ListCatalogQueryValidator()
    {
        RuleFor(query => query.Type)
            .Must(type => type is "tours" or "packages")
            .WithMessage("El tipo debe ser tours o packages.");

        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1).WithMessage("El número de página debe ser mayor o igual a 1.");

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100.");

        RuleFor(query => query.PriceMin)
            .GreaterThanOrEqualTo(0).When(query => query.PriceMin.HasValue)
            .WithMessage("El precio mínimo no puede ser negativo.");

        RuleFor(query => query.PriceMax)
            .GreaterThanOrEqualTo(0).When(query => query.PriceMax.HasValue)
            .WithMessage("El precio máximo no puede ser negativo.");

        RuleFor(query => query)
            .Must(query => !query.PriceMin.HasValue || !query.PriceMax.HasValue || query.PriceMin <= query.PriceMax)
            .WithMessage("El rango de precio está invertido.")
            .WithName("priceRange");

        RuleFor(query => query.DurationMin)
            .GreaterThanOrEqualTo(1).When(query => query.DurationMin.HasValue)
            .WithMessage("La duración mínima debe ser al menos 1 día.");

        RuleFor(query => query.DurationMax)
            .GreaterThanOrEqualTo(1).When(query => query.DurationMax.HasValue)
            .WithMessage("La duración máxima debe ser al menos 1 día.");

        RuleFor(query => query)
            .Must(query => !query.DurationMin.HasValue || !query.DurationMax.HasValue || query.DurationMin <= query.DurationMax)
            .WithMessage("El rango de duración está invertido.")
            .WithName("durationRange");

        RuleFor(query => query)
            .Must(query => !query.StartDate.HasValue || !query.EndDate.HasValue || query.StartDate <= query.EndDate)
            .WithMessage("El rango de fechas está invertido.")
            .WithName("dateRange");
    }
}

public sealed class ListCatalogQueryHandler : IRequestHandler<ListCatalogQuery, CatalogListDto>
{
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;

    public ListCatalogQueryHandler(IOfferRepository offers, IDateTimeProvider clock)
    {
        _offers = offers;
        _clock = clock;
    }

    public async Task<CatalogListDto> Handle(ListCatalogQuery request, CancellationToken cancellationToken)
    {
        var type = CatalogMapper.ParseApiType(request.Type);
        var offers = await _offers.ListActiveAsync(type, cancellationToken);
        var now = _clock.UtcNow;

        IEnumerable<Domain.Modules.Catalog.Offer> filtered = offers;

        if (request.PriceMin.HasValue)
        {
            filtered = filtered.Where(offer => (offer.PriceDiscounted ?? offer.PriceNormal).Amount >= request.PriceMin.Value);
        }

        if (request.PriceMax.HasValue)
        {
            filtered = filtered.Where(offer => (offer.PriceDiscounted ?? offer.PriceNormal).Amount <= request.PriceMax.Value);
        }

        if (request.DurationMin.HasValue)
        {
            filtered = filtered.Where(offer => CatalogMapper.ToDurationDays(offer) >= request.DurationMin.Value);
        }

        if (request.DurationMax.HasValue)
        {
            filtered = filtered.Where(offer => CatalogMapper.ToDurationDays(offer) <= request.DurationMax.Value);
        }

        if (request.StartDate.HasValue)
        {
            filtered = filtered.Where(offer => offer.Departures.Any(departure =>
                departure.IsActive &&
                departure.AvailableCapacity > 0 &&
                departure.StartsAtUtc > now &&
                DateOnly.FromDateTime(departure.StartsAtUtc) >= request.StartDate.Value));
        }

        if (request.EndDate.HasValue)
        {
            filtered = filtered.Where(offer => offer.Departures.Any(departure =>
                departure.IsActive &&
                departure.AvailableCapacity > 0 &&
                departure.StartsAtUtc > now &&
                DateOnly.FromDateTime(departure.StartsAtUtc) <= request.EndDate.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.Destination))
        {
            var destination = request.Destination.Trim();
            filtered = filtered.Where(offer =>
                offer.Name.Contains(destination, StringComparison.OrdinalIgnoreCase) ||
                offer.Description.Contains(destination, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = filtered
            .OrderBy(offer => offer.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var total = ordered.Length;
        var items = ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(CatalogMapper.ToSummary)
            .ToArray();

        return new CatalogListDto(
            request.Page,
            request.PageSize,
            total,
            request.Page * request.PageSize < total,
            items);
    }
}
