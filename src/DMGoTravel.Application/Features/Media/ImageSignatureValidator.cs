using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Domain.Modules.Catalog;

namespace DMGoTravel.Application.Features.Media;

/// <summary>
/// Valida tamaño (<= 5 MB), MIME declarado y magic bytes reales para JPG, PNG y WebP (Spec 012).
/// </summary>
public static class ImageSignatureValidator
{
    public static (string NormalizedContentType, string Extension) ValidateOrThrow(byte[] content, string? declaredContentType)
    {
        if (content is null || content.Length == 0)
        {
            throw new ValidationAppException([
                new FieldError("file", "El archivo de imagen es obligatorio y no puede estar vacío.")
            ]);
        }

        if (content.Length > MediaAsset.MaxImageSizeBytes)
        {
            throw new PayloadTooLargeAppException();
        }

        var detected = DetectContentType(content);
        if (detected is null)
        {
            throw new UnsupportedMediaTypeAppException();
        }

        if (!string.IsNullOrWhiteSpace(declaredContentType))
        {
            var normalizedDeclared = NormalizeMime(declaredContentType);
            if (!MediaAsset.IsAllowedContentType(normalizedDeclared) ||
                !string.Equals(normalizedDeclared, detected.Value.ContentType, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnsupportedMediaTypeAppException(
                    "El tipo de contenido no coincide con el formato real del archivo (JPG, PNG o WebP).");
            }
        }

        return detected.Value;
    }

    private static string NormalizeMime(string mime)
    {
        var trimmed = mime.Trim().ToLowerInvariant();
        return trimmed == "image/jpg" ? "image/jpeg" : trimmed;
    }

    private static (string ContentType, string Extension)? DetectContentType(byte[] bytes)
    {
        // JPEG: FF D8 FF
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
        {
            return ("image/jpeg", ".jpg");
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.Length >= 8 &&
            bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
            bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A)
        {
            return ("image/png", ".png");
        }

        // WebP: RIFF....WEBP
        if (bytes.Length >= 12 &&
            bytes[0] == (byte)'R' && bytes[1] == (byte)'I' && bytes[2] == (byte)'F' && bytes[3] == (byte)'F' &&
            bytes[8] == (byte)'W' && bytes[9] == (byte)'E' && bytes[10] == (byte)'B' && bytes[11] == (byte)'P')
        {
            return ("image/webp", ".webp");
        }

        return null;
    }
}
