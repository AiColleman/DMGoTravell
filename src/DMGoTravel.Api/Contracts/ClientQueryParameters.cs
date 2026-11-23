using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Api.Contracts;

/// <summary>
/// Interpreta los parámetros de la consulta administrativa de clientes.
/// Los textos se recortan; un valor vacío no aplica filtro. Los estados,
/// identificadores y fechas no admiten interpretaciones aproximadas.
/// </summary>
public static class ClientQueryParameters
{
    private static readonly IReadOnlyDictionary<string, UserStatus> Statuses =
        new Dictionary<string, UserStatus>(StringComparer.Ordinal)
        {
            ["active"] = UserStatus.Active,
            ["suspended"] = UserStatus.Suspended,
            ["closed"] = UserStatus.Closed
        };

    public static int ParsePageSize(string? raw) =>
        AuditQueryParameters.ParsePageSize(raw);

    public static Guid? ParseId(string? raw)
    {
        var value = NormalizeText(raw);
        if (value is null)
        {
            return null;
        }

        if (!Guid.TryParse(value, out var id))
        {
            throw new InvalidFilterAppException(
                "El filtro 'id' debe ser un identificador UUID válido.");
        }

        return id;
    }

    public static UserStatus? ParseStatus(string? raw)
    {
        var value = NormalizeText(raw);
        if (value is null)
        {
            return null;
        }

        if (!Statuses.TryGetValue(value, out var status))
        {
            throw new InvalidFilterAppException(
                "El filtro 'status' debe ser 'active', 'suspended' o 'closed'.");
        }

        return status;
    }

    public static DateOnly? ParseDate(string? raw, string parameterName) =>
        AuditQueryParameters.ParseDate(raw, parameterName);

    public static string? NormalizeText(string? raw) =>
        AuditQueryParameters.NormalizeText(raw);
}
