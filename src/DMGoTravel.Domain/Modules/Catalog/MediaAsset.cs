using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Catalog;

public class MediaAsset : Entity<long>
{
    public string ObjectKey { get; private set; } = string.Empty;
    public string Url { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public string Role { get; private set; } = "gallery"; // "main" | "gallery"
    public int Position { get; private set; }
    public long? OfferId { get; private set; }
    public long? HotelId { get; private set; }
    public long? RoomTypeId { get; private set; }

    private MediaAsset() { }

    public static MediaAsset CreateForOffer(string objectKey, string url, string contentType, long sizeBytes, string role, int position, long offerId)
    {
        if (sizeBytes > 5_000_000)
            throw new DomainException("El archivo excede el tamaño máximo permitido de 5 MB.");

        return new MediaAsset
        {
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType,
            FileSizeBytes = sizeBytes,
            Role = role,
            Position = position,
            OfferId = offerId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public static MediaAsset CreateForHotel(string objectKey, string url, string contentType, long sizeBytes, string role, int position, long hotelId)
    {
        if (sizeBytes > 5_000_000)
            throw new DomainException("El archivo excede el tamaño máximo permitido de 5 MB.");

        return new MediaAsset
        {
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType,
            FileSizeBytes = sizeBytes,
            Role = role,
            Position = position,
            HotelId = hotelId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
