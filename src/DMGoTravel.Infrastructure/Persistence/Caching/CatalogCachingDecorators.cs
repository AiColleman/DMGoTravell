using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Mobility;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Persistence.Caching;

public sealed class CatalogCacheOptions
{
    public bool Enabled { get; set; } = true;
    public int TtlSeconds { get; set; } = 30;
}

public static class CatalogCacheKeys
{
    public static string ActiveOffers(OfferType type) => $"catalog:active:{type.ToString().ToLowerInvariant()}";
    public const string ActiveMobility = "mobility:active:ordered";
}

public sealed class MemoryCacheInvalidator : ICacheInvalidator
{
    private readonly IMemoryCache _cache;

    public MemoryCacheInvalidator(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void InvalidateCatalog()
    {
        _cache.Remove(CatalogCacheKeys.ActiveOffers(OfferType.Tour));
        _cache.Remove(CatalogCacheKeys.ActiveOffers(OfferType.Package));
    }

    public void InvalidateMobility()
    {
        _cache.Remove(CatalogCacheKeys.ActiveMobility);
    }
}

/// <summary>
/// Patrón Decorator sobre IOfferRepository (AC01 / patrones-de-diseño.md).
/// Cachea únicamente el listado público descriptivo con TTL corto e invalidación explícita;
/// jamás cachea disponibilidad de salidas, reservas activas ni operaciones de escritura.
/// </summary>
public sealed class CachedOfferRepository : IOfferRepository
{
    private readonly IOfferRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly ICacheInvalidator _invalidator;
    private readonly CatalogCacheOptions _options;

    public CachedOfferRepository(
        IOfferRepository inner,
        IMemoryCache cache,
        ICacheInvalidator invalidator,
        IOptions<CatalogCacheOptions> options)
    {
        _inner = inner;
        _cache = cache;
        _invalidator = invalidator;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<Offer>> ListActiveAsync(OfferType type, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || _options.TtlSeconds <= 0)
        {
            return await _inner.ListActiveAsync(type, cancellationToken);
        }

        var key = CatalogCacheKeys.ActiveOffers(type);
        if (_cache.TryGetValue<IReadOnlyList<Offer>>(key, out var cached) && cached is not null)
        {
            return cached;
        }

        var fresh = await _inner.ListActiveAsync(type, cancellationToken);
        _cache.Set(key, fresh, TimeSpan.FromSeconds(_options.TtlSeconds));
        return fresh;
    }

    // Consultas críticas de detalle/disponibilidad/salidas van siempre directo a PostgreSQL (AC01).
    public Task<Offer?> GetActiveByPublicIdAsync(Guid publicId, OfferType type, CancellationToken cancellationToken = default) =>
        _inner.GetActiveByPublicIdAsync(publicId, type, cancellationToken);

    public Task<Offer?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _inner.GetByIdAsync(id, cancellationToken);

    public Task<TourDeparture?> GetDepartureByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _inner.GetDepartureByPublicIdAsync(publicId, cancellationToken);

    public Task<TourDeparture?> GetDepartureByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _inner.GetDepartureByIdAsync(id, cancellationToken);

    public Task<(IReadOnlyList<Offer> Items, int Total)> ListAdminAsync(
        OfferType type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        _inner.ListAdminAsync(type, page, pageSize, cancellationToken);

    public Task<Offer?> GetByPublicIdAsync(Guid publicId, OfferType type, CancellationToken cancellationToken = default) =>
        _inner.GetByPublicIdAsync(publicId, type, cancellationToken);

    public async Task AddAsync(Offer offer, CancellationToken cancellationToken = default)
    {
        await _inner.AddAsync(offer, cancellationToken);
        _invalidator.InvalidateCatalog();
    }

    public async Task AddDepartureAsync(TourDeparture departure, CancellationToken cancellationToken = default)
    {
        await _inner.AddDepartureAsync(departure, cancellationToken);
        _invalidator.InvalidateCatalog();
    }

    public Task<bool> HasActiveReservationsAsync(long offerId, CancellationToken cancellationToken = default) =>
        _inner.HasActiveReservationsAsync(offerId, cancellationToken);

    public Task<bool> HasActiveReservationsForDepartureAsync(long departureId, CancellationToken cancellationToken = default) =>
        _inner.HasActiveReservationsForDepartureAsync(departureId, cancellationToken);
}

/// <summary>
/// Patrón Decorator sobre IMobilityRepository para lectura pública informativa (Spec 013 / AC01).
/// </summary>
public sealed class CachedMobilityRepository : IMobilityRepository
{
    private readonly IMobilityRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly ICacheInvalidator _invalidator;
    private readonly CatalogCacheOptions _options;

    public CachedMobilityRepository(
        IMobilityRepository inner,
        IMemoryCache cache,
        ICacheInvalidator invalidator,
        IOptions<CatalogCacheOptions> options)
    {
        _inner = inner;
        _cache = cache;
        _invalidator = invalidator;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<MobilityItem>> ListActiveOrderedAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || _options.TtlSeconds <= 0)
        {
            return await _inner.ListActiveOrderedAsync(cancellationToken);
        }

        if (_cache.TryGetValue<IReadOnlyList<MobilityItem>>(CatalogCacheKeys.ActiveMobility, out var cached) && cached is not null)
        {
            return cached;
        }

        var fresh = await _inner.ListActiveOrderedAsync(cancellationToken);
        _cache.Set(CatalogCacheKeys.ActiveMobility, fresh, TimeSpan.FromSeconds(_options.TtlSeconds));
        return fresh;
    }

    public Task<(IReadOnlyList<MobilityItem> Items, int Total)> ListAdminAsync(int page, int pageSize, CancellationToken cancellationToken = default) =>
        _inner.ListAdminAsync(page, pageSize, cancellationToken);

    public Task<MobilityItem?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _inner.GetByPublicIdAsync(publicId, cancellationToken);

    public Task<bool> ExistsActiveWithNormalizedKeyAsync(string normalizedKey, long? excludeId = null, CancellationToken cancellationToken = default) =>
        _inner.ExistsActiveWithNormalizedKeyAsync(normalizedKey, excludeId, cancellationToken);

    public async Task AddAsync(MobilityItem item, CancellationToken cancellationToken = default)
    {
        await _inner.AddAsync(item, cancellationToken);
        _invalidator.InvalidateMobility();
    }
}
