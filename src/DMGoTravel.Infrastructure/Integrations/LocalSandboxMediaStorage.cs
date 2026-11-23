using DMGoTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Integrations;

/// <summary>
/// Almacenamiento local en disco para desarrollo y pruebas de integración (Spec 012).
/// Implementa el puerto IMediaStorage, intercambiable por un adaptador S3 para Cloudflare R2.
/// </summary>
public sealed class LocalSandboxMediaStorage : IMediaStorage
{
    private readonly string _rootPath;

    public LocalSandboxMediaStorage(IOptions<ExternalProviderOptions> options)
    {
        _rootPath = string.IsNullOrWhiteSpace(options.Value.LocalMediaRootPath)
            ? Path.Combine(AppContext.BaseDirectory, "App_Data", "media")
            : options.Value.LocalMediaRootPath;
        Directory.CreateDirectory(_rootPath);
    }

    public async Task SaveAsync(
        string objectKey,
        byte[] content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(objectKey);
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllBytesAsync(fullPath, content, cancellationToken);
    }

    public async Task<StoredMediaObject?> ReadAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(objectKey);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return new StoredMediaObject(objectKey, bytes, InferContentType(fullPath));
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(objectKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string ResolveSafePath(string objectKey)
    {
        var normalized = objectKey.Replace('\\', '/').TrimStart('/');
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Contains("..", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Clave de objeto multimedia inválida.");
        }

        var rootFull = Path.GetFullPath(_rootPath);
        var combined = Path.GetFullPath(Path.Combine(rootFull, normalized.Replace('/', Path.DirectorySeparatorChar)));
        if (!combined.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Acceso fuera del directorio de almacenamiento multimedia.");
        }

        return combined;
    }

    private static string InferContentType(string path) =>
        Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
}
