using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Exports.CreateAuditExport;

namespace DMGoTravel.Api.Contracts;

/// <summary>
/// Cuerpo opcional de la solicitud de exportación. El contrato permite un objeto
/// de filtros; sus claves se restringen a las de la consulta de auditoría.
/// </summary>
public sealed record ExportAuditRequest(Dictionary<string, JsonElement>? Filters);

public static class ExportAuditRequestMapper
{
    private static readonly HashSet<string> AllowedFilters =
    [
        "from",
        "to",
        "actor",
        "entity",
        "correlationId",
        "action",
        "type",
        "result"
    ];

    public static CreateAuditExportCommand ToCommand(
        ExportAuditRequest? request,
        string idempotencyKey)
    {
        var filters = request?.Filters ?? new Dictionary<string, JsonElement>();

        foreach (var key in filters.Keys)
        {
            if (!AllowedFilters.Contains(key))
            {
                throw new InvalidFilterAppException(
                    $"El filtro '{key}' no está admitido para la exportación de auditoría.");
            }
        }

        string? Raw(string name)
        {
            if (!filters.TryGetValue(name, out var value) || value.ValueKind == JsonValueKind.Null)
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

        return new CreateAuditExportCommand(
            AuditQueryParameters.ParseDate(Raw("from"), "from"),
            AuditQueryParameters.ParseDate(Raw("to"), "to"),
            AuditQueryParameters.NormalizeActor(Raw("actor")),
            AuditQueryParameters.NormalizeText(Raw("entity")),
            AuditQueryParameters.NormalizeText(Raw("correlationId")),
            AuditQueryParameters.NormalizeText(Raw("action")),
            AuditQueryParameters.NormalizeText(Raw("type")),
            AuditQueryParameters.NormalizeResult(Raw("result")),
            idempotencyKey);
    }
}
