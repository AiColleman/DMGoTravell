namespace DMGoTravel.Application.Features.Exports.Dtos;

/// <summary>
/// Confirmación de que la captura ya fue materializada. El identificador no es
/// una credencial: estado y descarga vuelven a autorizar al solicitante.
/// </summary>
public sealed record ExportAcceptedDto(
    Guid Id,
    string Status,
    DateTime ReferenceAt,
    DateTime ExpiresAt);

public sealed record ExportJobDto(
    Guid Id,
    string Kind,
    string Status,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    string? DownloadPath);
