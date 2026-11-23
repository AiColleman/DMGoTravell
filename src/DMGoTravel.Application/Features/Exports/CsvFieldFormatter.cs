using System.Globalization;
using System.Text;

namespace DMGoTravel.Application.Features.Exports;

/// <summary>
/// Reglas comunes de serialización CSV: RFC 4180, cultura invariante y
/// neutralización de prefijos que una hoja de cálculo podría interpretar como
/// fórmula. La fuente nunca se modifica; solo cambia su representación.
/// </summary>
internal static class CsvFieldFormatter
{
    public static string FormatUtc(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc)
            .ToString("O", CultureInfo.InvariantCulture);

    public static void AppendRow(StringBuilder builder, params string?[] fields)
    {
        for (var index = 0; index < fields.Length; index++)
        {
            if (index > 0)
            {
                builder.Append(',');
            }

            AppendField(builder, fields[index]);
        }

        builder.Append("\r\n");
    }

    private static void AppendField(StringBuilder builder, string? value)
    {
        var safe = Neutralize(value ?? string.Empty);
        var requiresQuotes = safe.IndexOfAny([',', '"', '\r', '\n']) >= 0;

        if (!requiresQuotes)
        {
            builder.Append(safe);
            return;
        }

        builder.Append('"')
            .Append(safe.Replace("\"", "\"\"", StringComparison.Ordinal))
            .Append('"');
    }

    private static string Neutralize(string value)
    {
        if (value.Length == 0)
        {
            return value;
        }

        // El apóstrofo es un marcador de texto inerte para la matriz soportada;
        // no se garantiza para cualquier hoja de cálculo o transformación futura.
        // Se revisa el primer carácter no blanco para no dejar pasar " =..." o
        // "\t@..." como fórmulas tras espacios iniciales.
        var start = value.AsSpan().TrimStart();
        if (start.Length > 0 && start[0] is '=' or '+' or '-' or '@')
        {
            return "'" + value;
        }

        return value[0] is '\t' or '\r' or '\n'
            ? "'" + value
            : value;
    }
}
