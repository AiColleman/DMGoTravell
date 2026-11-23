using System.Globalization;
using DMGoTravel.Application.Common.Exceptions;

namespace DMGoTravel.Api.Contracts;

/// <summary>
/// Interpreta el parámetro de paginación como entero positivo y traduce
/// valores ausentes, no enteros o menores a 1 al código de contrato invalid_page.
/// </summary>
public static class Pagination
{
    public static int ParsePage(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return 1;
        }

        if (!int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var page) || page < 1)
        {
            throw new InvalidPageAppException();
        }

        return page;
    }
}
