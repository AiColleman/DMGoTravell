using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Catalog;

public class MediaAsset : Entity<long>
{
    public const long MaxImageSizeBytes = 5_000_000;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public string ObjectKey { get; private set; } = string.Empty;
    public string Url { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public string Role { get; private set; } = "gallery"; // "main" | "gallery"
    public int Position { get; private set; }
    public bool IsPublished { get; private set; }
    public long? OfferId { get; private set; }
    public long? HotelId { get; private set; }
    public long? RoomTypeId { get; private set; }
    public long? MobilityItemId { get; private set; }

    private MediaAsset() { }

    public static MediaAsset CreateForOffer(
        string objectKey,
        string url,
        string contentType,
        long sizeBytes,
        string role,
        int position,
        long offerId,
        bool isPublished = false)
    {
        Validate(contentType, sizeBytes);

        return new MediaAsset
        {
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType.Trim().ToLowerInvariant(),
            FileSizeBytes = sizeBytes,
            Role = NormalizeRole(role),
            Position = position,
            IsPublished = isPublished,
            OfferId = offerId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public static MediaAsset CreateForHotel(
        string objectKey,
        string url,
        string contentType,
        long sizeBytes,
        string role,
        int position,
        long hotelId,
        bool isPublished = false,
        Guid? publicId = null)
    {
        Validate(contentType, sizeBytes);

        return new MediaAsset
        {
            PublicId = publicId ?? Guid.NewGuid(),
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType.Trim().ToLowerInvariant(),
            FileSizeBytes = sizeBytes,
            Role = NormalizeRole(role),
            Position = position,
            IsPublished = isPublished,
            HotelId = hotelId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public static MediaAsset CreateForRoomType(
        string objectKey,
        string url,
        string contentType,
        long sizeBytes,
        string role,
        int position,
        long hotelId,
        long roomTypeId,
        bool isPublished = false,
        Guid? publicId = null)
    {
        Validate(contentType, sizeBytes);

        return new MediaAsset
        {
            PublicId = publicId ?? Guid.NewGuid(),
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType.Trim().ToLowerInvariant(),
            FileSizeBytes = sizeBytes,
            Role = NormalizeRole(role),
            Position = position,
            IsPublished = isPublished,
            HotelId = hotelId,
            RoomTypeId = roomTypeId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public static MediaAsset CreateForMobility(
        string objectKey,
        string url,
        string contentType,
        long sizeBytes,
        long mobilityItemId,
        bool isPublished = false)
    {
        Validate(contentType, sizeBytes);

        return new MediaAsset
        {
            ObjectKey = objectKey,
            Url = url,
            ContentType = contentType.Trim().ToLowerInvariant(),
            FileSizeBytes = sizeBytes,
            Role = "main",
            Position = 1,
            IsPublished = isPublished,
            MobilityItemId = mobilityItemId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void AssignUrl(string url)
    {
        Url = url;
    }

    public void ReplaceContent(
        string objectKey,
        string url,
        string contentType,
        long sizeBytes,
        bool? isPrimary,
        DateTime nowUtc)
    {
        Validate(contentType, sizeBytes);

        ObjectKey = objectKey;
        Url = url;
        ContentType = contentType.Trim().ToLowerInvariant();
        FileSizeBytes = sizeBytes;
        if (isPrimary.HasValue)
        {
            Role = isPrimary.Value ? "main" : "gallery";
        }

        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void SetRole(string role, DateTime nowUtc)
    {
        Role = NormalizeRole(role);
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkPublished(DateTime nowUtc)
    {
        if (IsPublished)
        {
            return;
        }

        IsPublished = true;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public bool IsPrimary => string.Equals(Role, "main", StringComparison.OrdinalIgnoreCase);

    public static bool IsAllowedContentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType) && AllowedContentTypes.Contains(contentType.Trim());

    private static void Validate(string contentType, long sizeBytes)
    {
        if (!IsAllowedContentType(contentType))
            throw new DomainException("Formato de imagen no admitido. Solo se permiten JPG, PNG y WebP.");

        if (sizeBytes <= 0 || sizeBytes > MaxImageSizeBytes)
            throw new DomainException("El archivo excede el tamaño máximo permitido de 5 MB.");
    }

    private static string NormalizeRole(string role) =>
        string.Equals(role, "main", StringComparison.OrdinalIgnoreCase) ? "main" : "gallery";
}
