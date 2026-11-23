using System.Text;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Audit;

namespace DMGoTravel.Application.Features.Exports;

/// <summary>
/// Serializa la copia de auditoría con cabeceras estables, RFC 4180 y una
/// neutralización explícita de prefijos de fórmula. La fuente nunca se modifica.
/// </summary>
public static class AuditCsvWriter
{
    public const string Header =
        "id,actorType,actor,action,entity,entityId,occurredAt,recordedAt,correlationId,result,summary";

    public static string Write(IReadOnlyList<AuditRecordView> rows)
    {
        var builder = new StringBuilder();
        builder.Append(Header).Append("\r\n");

        foreach (var row in rows)
        {
            var dto = AuditProjection.ToDto(row);

            CsvFieldFormatter.AppendRow(
                builder,
                dto.Id.ToString("D"),
                row.ActorType,
                dto.Actor,
                dto.Action,
                dto.Entity,
                dto.EntityId,
                CsvFieldFormatter.FormatUtc(dto.OccurredAt),
                CsvFieldFormatter.FormatUtc(row.RecordedAtUtc),
                dto.CorrelationId,
                dto.Result,
                dto.Summary);
        }

        return builder.ToString();
    }
}
