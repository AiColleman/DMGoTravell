using System.Globalization;
using DMGoTravel.Application.Common.Exceptions;

namespace DMGoTravel.Api.Contracts;

/// <summary>
/// Interpreta los parámetros de la consulta administrativa de auditoría sin
/// inventar formatos: fechas ISO <c>YYYY-MM-DD</c> y filtros exactos ya
/// recortados. Los valores vacíos se consideran filtros no aplicados.
/// </summary>
public static class AuditQueryParameters
{
    public const int DefaultPageSize = 25;
    public const int MaxPageSize = 100;

    private static readonly string[] ActorTypes =
    [
        "human",
        "system",
        "unidentified"
    ];

    public static int ParsePageSize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return DefaultPageSize;
        }

        if (!int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pageSize) ||
            pageSize < 1 ||
            pageSize > MaxPageSize)
        {
            throw new InvalidFilterAppException(
                $"El tamaño de página debe estar entre 1 y {MaxPageSize}.");
        }

        return pageSize;
    }

    public static DateOnly? ParseDate(string? raw, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (!DateOnly.TryParseExact(
                raw.Trim(),
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var date))
        {
            throw new InvalidRangeAppException(
                $"El parámetro '{parameterName}' debe usar el formato YYYY-MM-DD.");
        }

        return date;
    }

    public static string? NormalizeText(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();

    public static string? NormalizeActor(string? raw)
    {
        var actor = NormalizeText(raw);
        if (actor is null)
        {
            return null;
        }

        if (Guid.TryParse(actor, out _) ||
            ActorTypes.Contains(actor, StringComparer.Ordinal))
        {
            return actor;
        }

        throw new InvalidFilterAppException(
            "El filtro 'actor' debe ser un identificador público o un tipo de actor admitido.");
    }

    public static string? NormalizeResult(string? raw)
    {
        var result = NormalizeText(raw);
        if (result is null)
        {
            return null;
        }

        if (result is not ("success" or "failure"))
        {
            throw new InvalidFilterAppException(
                "El filtro 'result' debe ser 'success' o 'failure'.");
        }

        return result;
    }
}
