using System.Globalization;
using System.Text;
using DMGoTravel.Application.Features.Reports.Dtos;

namespace DMGoTravel.Application.Features.Reports;

/// <summary>
/// Generador PDF 1.4 autónomo y determinista para Spec 011 (sin dependencias
/// comerciales externas). Produce un documento PDF válido con encabezado,
/// referencia temporal, resumen operativo/financiero y todas las filas de
/// reserva capturadas sin datos personales de clientes (011/RF-26, DEC-192).
/// </summary>
public static class ReportPdfBuilder
{
    public static byte[] Build(
        Guid reportId,
        DateTime referenceAtUtc,
        ReportSummaryDto summary,
        IReadOnlyList<ReportRowDto> rows)
    {
        var lines = BuildLines(reportId, referenceAtUtc, summary, rows);
        const int linesPerPage = 46;
        var pages = new List<List<string>>();

        for (var i = 0; i < lines.Count; i += linesPerPage)
        {
            pages.Add(lines.Skip(i).Take(linesPerPage).ToList());
        }

        if (pages.Count == 0)
        {
            pages.Add(["DMGoTravel - Reporte Administrativo (sin filas)"]);
        }

        return AssemblePdf(pages);
    }

    private static List<string> BuildLines(
        Guid reportId,
        DateTime referenceAtUtc,
        ReportSummaryDto summary,
        IReadOnlyList<ReportRowDto> rows)
    {
        var lines = new List<string>
        {
            "DMGOTRAVEL - REPORTE ADMINISTRATIVO OFICIAL (SPEC 011)",
            $"Reporte ID: {reportId}",
            $"Referencia temporal (UTC): {referenceAtUtc:yyyy-MM-ddTHH:mm:ssZ} (Periodo Peru: {summary.From:yyyy-MM-dd} a {summary.To:yyyy-MM-dd})",
            "Nota: Cifras congeladas al instante de referencia. Sin datos personales de clientes.",
            "--------------------------------------------------------------------------------",
            "1. RESUMEN OPERATIVO Y CONTRATADO (PEN - Valores historicos registrados)",
            $"   Total reservas: {summary.TotalReservations} | Viajeros turisticos: {summary.TotalTravelers}",
            $"   Estados: pending={summary.PendingCount}, confirmed={summary.ConfirmedCount}, completed={summary.CompletedCount}, cancelled={summary.CancelledCount}",
            $"   Turistico: {summary.ContractedTouristTotal} {summary.ContractedCurrency} | Alojamiento: {summary.ContractedLodgingTotal} {summary.ContractedCurrency} | Total contratado: {summary.ContractedTotal} {summary.ContractedCurrency}",
            "--------------------------------------------------------------------------------",
            "2. MOVIMIENTOS FINANCIEROS CONFIRMADOS EN EL PERIODO"
        };

        if (summary.FinancialMovements.Count == 0)
        {
            lines.Add("   Sin cobros confirmados ni devoluciones ejecutadas en el periodo.");
        }
        else
        {
            foreach (var mov in summary.FinancialMovements)
            {
                lines.Add($"   [{mov.Currency}] Cobros ({mov.PaymentCount}): {mov.ConfirmedPayments} | Devoluciones ({mov.RefundCount}): {mov.ExecutedRefunds} | Diferencia neta: {mov.NetDifference}");
            }
        }

        lines.Add("--------------------------------------------------------------------------------");
        lines.Add("3. DESGLOSE POR OFERTA TURISTICA");
        if (summary.ByOffer.Count == 0)
        {
            lines.Add("   Sin reservas en el periodo.");
        }
        else
        {
            foreach (var o in summary.ByOffer)
            {
                lines.Add($"   - {o.OfferName} ({o.OfferType}): {o.Reservations} res., {o.Travelers} viaj., {o.TouristSubtotal} {o.Currency}");
            }
        }

        if (summary.ByHotel.Count > 0)
        {
            lines.Add("--------------------------------------------------------------------------------");
            lines.Add("4. DESGLOSE DE ALOJAMIENTO CONTRATADO (SUBCONJUNTO)");
            foreach (var h in summary.ByHotel)
            {
                lines.Add($"   - {h.HotelName}: {h.Reservations} res., {h.LodgingSubtotal} {h.Currency}");
            }
        }

        lines.Add("--------------------------------------------------------------------------------");
        lines.Add($"5. DETALLE DE RESERVAS DEL PERIODO ({rows.Count} registros - sin datos personales)");
        lines.Add("   Numero       | Estado    | Fecha UTC           | Viaj | Turist  | Alojam  | Total");

        foreach (var row in rows)
        {
            var line = string.Format(
                CultureInfo.InvariantCulture,
                "   {0,-12} | {1,-9} | {2:yyyy-MM-dd HH:mm:ss} | {3,4} | {4,7} | {5,7} | {6,7} {7}",
                row.ReservationNumber,
                row.Status,
                row.CreatedAt,
                row.Travelers,
                row.TouristSubtotal,
                row.LodgingSubtotal,
                row.Total,
                row.Currency);
            lines.Add(line);
        }

        return lines;
    }

    private static byte[] AssemblePdf(IReadOnlyList<List<string>> pages)
    {
        // Objetos PDF:
        // 1: Catalog, 2: Pages, 3: Font (Courier para alineacion tabular limpia)
        // Luego por cada pagina i: (4 + 2*i) = Page, (5 + 2*i) = Content stream
        var objects = new List<string>();
        var pageObjectIds = new List<int>();

        for (var i = 0; i < pages.Count; i++)
        {
            pageObjectIds.Add(4 + (i * 2));
        }

        objects.Add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        var kids = string.Join(" ", pageObjectIds.Select(id => $"{id} 0 R"));
        objects.Add($"2 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {pages.Count} >>\nendobj\n");
        objects.Add("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n");

        for (var i = 0; i < pages.Count; i++)
        {
            var pageId = 4 + (i * 2);
            var contentId = pageId + 1;

            var streamBuilder = new StringBuilder();
            streamBuilder.Append("BT\n/F1 8.5 Tf\n36 760 Td\n14 TL\n");
            for (var lineIdx = 0; lineIdx < pages[i].Count; lineIdx++)
            {
                var safe = EscapePdfAscii(pages[i][lineIdx]);
                if (lineIdx == 0)
                {
                    streamBuilder.Append($"({safe}) Tj\n");
                }
                else
                {
                    streamBuilder.Append($"T* ({safe}) Tj\n");
                }
            }
            streamBuilder.Append("ET\n");
            var streamContent = streamBuilder.ToString();
            var streamLength = Encoding.ASCII.GetByteCount(streamContent);

            objects.Add($"{pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {contentId} 0 R >>\nendobj\n");
            objects.Add($"{contentId} 0 obj\n<< /Length {streamLength} >>\nstream\n{streamContent}endstream\nendobj\n");
        }

        using var ms = new MemoryStream();
        void WriteAscii(string text)
        {
            var bytes = Encoding.ASCII.GetBytes(text);
            ms.Write(bytes, 0, bytes.Length);
        }

        WriteAscii("%PDF-1.4\n");
        var offsets = new List<long> { 0 };

        foreach (var obj in objects)
        {
            offsets.Add(ms.Position);
            WriteAscii(obj);
        }

        var xrefPosition = ms.Position;
        WriteAscii($"xref\n0 {offsets.Count}\n");
        WriteAscii("0000000000 65535 f \n");
        for (var i = 1; i < offsets.Count; i++)
        {
            WriteAscii($"{offsets[i]:D10} 00000 n \n");
        }

        WriteAscii($"trailer\n<< /Size {offsets.Count} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF\n");
        return ms.ToArray();
    }

    private static string EscapePdfAscii(string input)
    {
        var sb = new StringBuilder(input.Length);
        foreach (var ch in input)
        {
            var normalized = ch switch
            {
                'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
                'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N',
                _ => ch <= 126 && ch >= 32 ? ch : '?'
            };

            if (normalized is '(' or ')' or '\\')
            {
                sb.Append('\\');
            }

            sb.Append(normalized);
        }

        return sb.ToString();
    }
}
