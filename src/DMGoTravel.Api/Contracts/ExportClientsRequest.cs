using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Exports.CreateClientsExport;

namespace DMGoTravel.Api.Contracts;

/// <summary>
/// Cuerpo opcional de la solicitud de exportación de clientes. El contrato
/// permite un objeto de filtros; sus claves se restringen a las de la consulta.
/// </summary>
public sealed record ExportClientsRequest(Dictionary<string, JsonElement>? Filters);

public static class ExportClientsRequestMapper
{
    private static readonly HashSet<string> AllowedFilters =
    [
        "name",
        "email",
        "id",
        "status",
        "registeredFrom",
        "registeredTo"
    ];

    public static CreateClientsExportCommand ToCommand(
        ExportClientsRequest? request,
        string idempotencyKey)
    {
        var filters = request?.Filters ?? new Dictionary<string, JsonElement>();

        foreach (var key in filters.Keys)
        {
            if (!AllowedFilters.Contains(key))
            {
                throw new InvalidFilterAppException(
                    $"El filtro '{key}' no está admitido para la exportación de clientes.");
            }
        }

        string? Raw(string name)
        {
            if (!filters.TryGetValue(name, out var value) ||
                value.ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            if (value.ValueKind != JsonValueKind.String)
            {
                throw new InvalidFilterAppException(
                    $"El filtro '{name}' debe ser una cadena.");
            }

            return value.GetString();
        }

        return new CreateClientsExportCommand(
            ClientQueryParameters.NormalizeText(Raw("name")),
            ClientQueryParameters.NormalizeText(Raw("email")),
            ClientQueryParameters.ParseId(Raw("id")),
            ClientQueryParameters.ParseStatus(Raw("status")),
            ClientQueryParameters.ParseDate(Raw("registeredFrom"), "registeredFrom"),
            ClientQueryParameters.ParseDate(Raw("registeredTo"), "registeredTo"),
            idempotencyKey);
    }
}
