using System.Globalization;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Clients;

namespace DMGoTravel.Application.Features.Exports;

/// <summary>
/// Fila autorizada de la copia de clientes. Los valores personales se conservan
/// para poder aplicar la máscara de privacidad vigente en la descarga.
/// </summary>
public sealed record ClientExportRow(
    Guid Id,
    string? FullName,
    string? Email,
    string? Phone,
    DateTime? RegisteredAtUtc,
    bool? EmailVerified,
    string Status,
    int ReservationCount);

public sealed record ClientExportSnapshot(int Version, List<ClientExportRow>? Rows);

/// <summary>
/// Serializa la copia de clientes con cabeceras estables y RFC 4180. La primera
/// renderización aplica RF-44; la descarga vuelve a renderizar desde la copia
/// estructurada para ocultar una baja posterior sin añadir ni eliminar filas.
/// </summary>
public static class ClientCsvWriter
{
    public const string Header =
        "id,fullName,email,phone,registeredAt,emailVerified,status,reservationCount";

    public const int SnapshotVersion = 1;

    private static readonly JsonSerializerOptions SnapshotJson =
        new(JsonSerializerDefaults.Web);

    public static string Write(
        IReadOnlyList<ClientExportRow> rows,
        IReadOnlySet<Guid>? currentlyDeleted = null)
    {
        var builder = new StringBuilder();
        builder.Append(Header).Append("\r\n");

        foreach (var row in rows)
        {
            var masked = currentlyDeleted is not null && currentlyDeleted.Contains(row.Id);

            CsvFieldFormatter.AppendRow(
                builder,
                row.Id.ToString("D"),
                masked ? null : row.FullName,
                masked ? null : row.Email,
                masked ? null : row.Phone,
                masked || row.RegisteredAtUtc is null
                    ? null
                    : CsvFieldFormatter.FormatUtc(row.RegisteredAtUtc.Value),
                masked || row.EmailVerified is null
                    ? null
                    : row.EmailVerified.Value ? "true" : "false",
                masked ? "closed" : row.Status,
                row.ReservationCount.ToString(CultureInfo.InvariantCulture));
        }

        return builder.ToString();
    }

    public static ClientExportRow FromRecord(ClientRecord record)
    {
        var dto = ClientProjection.ToDto(record);

        return new ClientExportRow(
            dto.Id,
            dto.FullName,
            dto.Email,
            dto.Phone,
            dto.RegisteredAt,
            dto.EmailVerified,
            dto.Status,
            dto.ReservationCount);
    }

    public static string SerializeSnapshot(IReadOnlyList<ClientExportRow> rows) =>
        JsonSerializer.Serialize(
            new ClientExportSnapshot(SnapshotVersion, rows.ToList()),
            SnapshotJson);

    public static IReadOnlyList<ClientExportRow> ReadSnapshot(string snapshotContent)
    {
        if (string.IsNullOrWhiteSpace(snapshotContent))
        {
            throw new InvalidOperationException("La copia de clientes está vacía.");
        }

        var snapshot = JsonSerializer.Deserialize<ClientExportSnapshot>(
            snapshotContent,
            SnapshotJson);

        if (snapshot is null ||
            snapshot.Version != SnapshotVersion ||
            snapshot.Rows is null)
        {
            throw new InvalidOperationException("La copia de clientes no es válida.");
        }

        foreach (var row in snapshot.Rows)
        {
            if (row.Id == Guid.Empty ||
                string.IsNullOrWhiteSpace(row.Status) ||
                row.ReservationCount < 0)
            {
                throw new InvalidOperationException("La copia de clientes no es válida.");
            }
        }

        return snapshot.Rows;
    }
}
