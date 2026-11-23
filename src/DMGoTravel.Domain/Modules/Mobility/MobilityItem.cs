using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Mobility;

/// <summary>
/// Categoría informativa de vehículo/movilidad publicada en la landing (Spec 013).
/// No gestiona contratación, precios ni flota individual (DEC-046).
/// </summary>
public class MobilityItem : Entity<long>
{
    public const long MaxImageSizeBytes = 5_000_000;

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public string Name { get; private set; } = string.Empty;
    public string NormalizedKey { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public int Capacity { get; private set; }
    public bool IsActive { get; private set; }

    public Guid? ImagePublicId { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? ImageContentType { get; private set; }
    public long? ImageSizeBytes { get; private set; }
    public long ImageVersion { get; private set; }

    private MobilityItem() { }

    public static MobilityItem Create(
        string name,
        string description,
        string type,
        int capacity,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("El nombre o tipo de movilidad es obligatorio.");

        if (capacity <= 0)
            throw new DomainException("La capacidad de pasajeros debe ser un entero mayor que cero.");

        var trimmedName = name.Trim();
        return new MobilityItem
        {
            Name = trimmedName,
            NormalizedKey = trimmedName.ToUpperInvariant(),
            Description = (description ?? string.Empty).Trim(),
            Type = string.IsNullOrWhiteSpace(type) ? "vehicle" : type.Trim().ToLowerInvariant(),
            Capacity = capacity,
            IsActive = false, // Nace desactivado (013/RF-7)
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };
    }

    public void Update(
        string name,
        string description,
        string type,
        int capacity,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("El nombre o tipo de movilidad es obligatorio.");

        if (capacity <= 0)
            throw new DomainException("La capacidad de pasajeros debe ser un entero mayor que cero.");

        var trimmedName = name.Trim();
        Name = trimmedName;
        NormalizedKey = trimmedName.ToUpperInvariant();
        Description = (description ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(type))
        {
            Type = type.Trim().ToLowerInvariant();
        }

        Capacity = capacity;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void SetImage(string url, string contentType, long sizeBytes, DateTime nowUtc, Guid? imagePublicId = null)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new DomainException("La URL de la imagen es obligatoria.");

        if (string.IsNullOrWhiteSpace(contentType) || !AllowedImageContentTypes.Contains(contentType.Trim()))
            throw new DomainException("La imagen debe ser JPG, PNG o WebP.");

        if (sizeBytes <= 0 || sizeBytes > MaxImageSizeBytes)
            throw new DomainException("La imagen no puede exceder 5 MB.");

        ImagePublicId = imagePublicId ?? ImagePublicId ?? Guid.NewGuid();
        ImageUrl = url.Trim();
        ImageContentType = contentType.Trim().ToLowerInvariant();
        ImageSizeBytes = sizeBytes;
        ImageVersion++;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void Activate(DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(Name))
            throw new DomainException("No se puede activar movilidad sin nombre o tipo.");

        if (Capacity <= 0)
            throw new DomainException("No se puede activar movilidad sin capacidad válida.");

        if (string.IsNullOrWhiteSpace(Description))
            throw new DomainException("No se puede activar movilidad sin características principales.");

        if (!HasValidImage())
            throw new DomainException("No se puede activar movilidad sin una imagen principal válida (JPG, PNG o WebP <= 5 MB).");

        IsActive = true;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void Deactivate(DateTime nowUtc)
    {
        IsActive = false;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public bool HasValidImage() =>
        !string.IsNullOrWhiteSpace(ImageUrl) &&
        !string.IsNullOrWhiteSpace(ImageContentType) &&
        AllowedImageContentTypes.Contains(ImageContentType) &&
        ImageSizeBytes is > 0 and <= MaxImageSizeBytes;
}
