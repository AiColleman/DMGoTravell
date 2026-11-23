using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record StoredMediaObject(string ObjectKey, byte[] Content, string ContentType);

public interface IMediaStorage
{
    Task SaveAsync(string objectKey, byte[] content, string contentType, CancellationToken cancellationToken = default);
    Task<StoredMediaObject?> ReadAsync(string objectKey, CancellationToken cancellationToken = default);
    Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default);
}

public interface IMediaRepository
{
    Task AddAsync(MediaAsset asset, CancellationToken cancellationToken = default);
    void Remove(MediaAsset asset);
    Task<MediaAsset?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaAsset>> ListForOfferAsync(long offerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaAsset>> ListForHotelAsync(long hotelId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaAsset>> ListForRoomTypeAsync(long hotelId, long roomTypeId, CancellationToken cancellationToken = default);
    Task<MediaAsset?> GetForMobilityAsync(long mobilityItemId, CancellationToken cancellationToken = default);
    Task<bool> IsAssetPubliclyReadableAsync(MediaAsset asset, CancellationToken cancellationToken = default);
    Task MarkPublishedForOfferAsync(long offerId, DateTime nowUtc, CancellationToken cancellationToken = default);
    Task MarkPublishedForHotelAsync(long hotelId, DateTime nowUtc, CancellationToken cancellationToken = default);
    Task MarkPublishedForMobilityAsync(long mobilityItemId, DateTime nowUtc, CancellationToken cancellationToken = default);
}
