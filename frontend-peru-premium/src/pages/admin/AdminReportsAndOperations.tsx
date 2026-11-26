import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Info,
  Lock,
  MailWarning,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  canAdminCancel,
  canAdminComplete,
  formatLimaDate,
  formatLimaDateTime,
  formatPen,
  parseDecimal,
} from '../../lib/format';
import {
  mergeWithOfficialDmGoAdminHotels,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../../lib/peruCatalog';
import type {
  AdminReservationDto,
  CatalogAdminItemDto,
  HotelAdminItemDto,
  NotificationIncidentDto,
  RefundCaseDto,
  ReportDetailDto,
  ReportRowDto,
} from '../../types/api';
import {
  PaginationControls,
  SectionEyebrow,
  StatusPill,
} from '../../components/ui/EditorialPrimitives';

// ============================================================================
// MÓDULO 1: REPORTES SNAPSHOT & PDF OFICIAL (SPEC 011 — RF-1..RF-38)
// ============================================================================

const DEMO_REPORT: ReportDetailDto = {
  id: 'rep-2026-nov',
  referenceAt: '2026-11-25T17:00:00Z',
  status: 'completed',
  createdAt: '2026-11-25T17:00:02Z',
  expiresAt: '2026-11-26T17:00:02Z',
  rowsCount: 4,
  pdfStatus: 'ready',
  summary: {
    from: '2026-11-01',
    to: '2026-12-31',
    totalReservations: 18,
    pendingCount: 3,
    confirmedCount: 11,
    completedCount: 3,
    cancelledCount: 1,
    totalTravelers: 41,
    contractedTouristTotal: '24850.00',
    contractedLodgingTotal: '5640.00',
    contractedTotal: '30490.00',
    contractedCurrency: 'PEN',
    byOffer: [
      {
        offerId: '00000000-0000-4000-8000-000000000105',
        offerName: 'Cusco Imperial & Machu Picchu 4D/3N',
        offerType: 'package',
        reservations: 8,
        travelers: 18,
        touristSubtotal: '16280.00',
        currency: 'PEN',
      },
      {
        offerId: '00000000-0000-4000-8000-000000000106',
        offerName: 'Ayacucho Esencial: Huamanga & Millpu 3D/2N',
        offerType: 'package',
        reservations: 6,
        travelers: 14,
        touristSubtotal: '6490.00',
        currency: 'PEN',
      },
      {
        offerId: '00000000-0000-4000-8000-000000000103',
        offerName: 'Valle del Colca & Cóndor Andino 2D/1N',
        offerType: 'tour',
        reservations: 4,
        travelers: 9,
        touristSubtotal: '2080.00',
        currency: 'PEN',
      },
    ],
    byHotel: [
      {
        hotelId: '00000000-0000-4000-8007-000000000109',
        hotelName: 'Hospedaje Santa Lucía',
        reservations: 1,
        lodgingSubtotal: '220.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000108',
        hotelName: 'Hotel Casa Rústica',
        reservations: 1,
        lodgingSubtotal: '300.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000104',
        hotelName: 'Hotel Condeduque',
        reservations: 2,
        lodgingSubtotal: '640.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000106',
        hotelName: 'Hotel Continental',
        reservations: 2,
        lodgingSubtotal: '440.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000107',
        hotelName: 'Hotel El Libertador',
        reservations: 1,
        lodgingSubtotal: '240.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000101',
        hotelName: 'Hotel Internazionale (Hotel - Restaurant)',
        reservations: 4,
        lodgingSubtotal: '1560.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000103',
        hotelName: 'Hotel Rivera',
        reservations: 2,
        lodgingSubtotal: '720.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000105',
        hotelName: 'Hotel Samary (Hotel & Apartment)',
        reservations: 2,
        lodgingSubtotal: '440.00',
        currency: 'PEN',
      },
      {
        hotelId: '00000000-0000-4000-8007-000000000102',
        hotelName: 'Hotel Sumaq Plaza',
        reservations: 3,
        lodgingSubtotal: '1080.00',
        currency: 'PEN',
      },
    ],
    financialMovements: [
      {
        currency: 'PEN',
        confirmedPayments: '28940.00',
        executedRefunds: '840.00',
        netDifference: '28100.00',
        paymentCount: 14,
        refundCount: 1,
      },
    ],
  },
};

const DEMO_REPORT_ROWS: ReportRowDto[] = [
  {
    reservationId: 'r1',
    reservationNumber: 'DMG-2026-004510',
    status: 'confirmed',
    offerName: 'Ayacucho Esencial: Huamanga & Millpu 3D/2N',
    hotelName: 'Hotel Internazionale (Hotel - Restaurant)',
    travelers: 2,
    touristSubtotal: '1180.00',
    lodgingSubtotal: '260.00',
    total: '1440.00',
    currency: 'PEN',
    createdAt: '2026-11-20T14:20:00Z',
  },
  {
    reservationId: 'r2',
    reservationNumber: 'DMG-2026-004821',
    status: 'pending',
    offerName: 'Ayacucho Esencial: Huamanga & Millpu 3D/2N',
    hotelName: 'Hotel Sumaq Plaza',
    travelers: 2,
    touristSubtotal: '1180.00',
    lodgingSubtotal: '240.00',
    total: '1420.00',
    currency: 'PEN',
    createdAt: '2026-11-24T16:10:00Z',
  },
  {
    reservationId: 'r3',
    reservationNumber: 'DMG-2026-004839',
    status: 'confirmed',
    offerName: 'Ayacucho Esencial: Huamanga & Millpu 3D/2N',
    hotelName: 'Hotel Condeduque',
    travelers: 2,
    touristSubtotal: '1180.00',
    lodgingSubtotal: '320.00',
    total: '1500.00',
    currency: 'PEN',
    createdAt: '2026-11-24T18:05:00Z',
  },
  {
    reservationId: 'r4',
    reservationNumber: 'DMG-2026-004844',
    status: 'completed',
    offerName: 'Ayacucho Esencial: Huamanga & Millpu 3D/2N',
    hotelName: 'Hotel Samary (Hotel & Apartment)',
    travelers: 2,
    touristSubtotal: '1180.00',
    lodgingSubtotal: '200.00',
    total: '1380.00',
    currency: 'PEN',
    createdAt: '2026-11-24T19:15:00Z',
  },
];

const DEFAULT_OFFER_OPTIONS: Array<{ id: string; name: string; type: string }> = [
  ...SHOWCASE_TOURS.map((o) => ({ id: o.id, name: o.name, type: 'tour' })),
  ...SHOWCASE_PACKAGES.map((o) => ({ id: o.id, name: o.name, type: 'package' })),
];

const DEFAULT_HOTEL_OPTIONS: HotelAdminItemDto[] = SHOWCASE_HOTELS_DETAIL.map((h) => ({
  id: h.id,
  name: h.name,
  status: 'active',
  version: 1,
  updatedAt: '2026-11-25T00:00:00Z',
}));

function formatCurrencyAmount(amount: string | number | null | undefined, currency = 'PEN'): string {
  if (currency.toUpperCase() === 'PEN') return formatPen(amount);
  const num = parseDecimal(amount);
  return `${currency.toUpperCase()} ${num.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const AdminReportsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Spec 011 RF-5 & RF-6: solo período inclusivo Perú + oferta turística principal opcional + hotel contratado opcional
  // (Spec 011 prohíbe explícitamente un filtro de estado que altere el desglose por los 4 estados)
  const [from, setFrom] = useState('2026-11-01');
  const [to, setTo] = useState('2026-12-31');
  const [offerId, setOfferId] = useState('');
  const [hotelId, setHotelId] = useState('');

  const [offerOptions, setOfferOptions] = useState(DEFAULT_OFFER_OPTIONS);
  const [hotelOptions, setHotelOptions] = useState<HotelAdminItemDto[]>(DEFAULT_HOTEL_OPTIONS);

  const [report, setReport] = useState<ReportDetailDto>(DEMO_REPORT);
  const [rows, setRows] = useState<ReportRowDto[]>(DEMO_REPORT_ROWS);
  const [rowsPage, setRowsPage] = useState(1);
  const [rowsTotal, setRowsTotal] = useState(DEMO_REPORT_ROWS.length);
  const [rowsHasNext, setRowsHasNext] = useState(false);

  const [busy, setBusy] = useState(false);
  const [requestingPdf, setRequestingPdf] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (apiOnline === false || isDemoSession) return;
    let active = true;
    (async () => {
      try {
        const [toursRes, pkgsRes, hotelsRes] = await Promise.all([
          adminApi.listCatalog('tours', 1, 50),
          adminApi.listCatalog('packages', 1, 50),
          adminApi.listHotels(1, 50),
        ]);
        if (!active) return;
        const mergedOffers: CatalogAdminItemDto[] = [...toursRes.items, ...pkgsRes.items];
        if (mergedOffers.length > 0) {
          setOfferOptions(
            mergedOffers.map((o) => ({ id: o.id, name: o.name, type: o.type }))
          );
        }
        setHotelOptions(mergeWithOfficialDmGoAdminHotels(hotelsRes.items));
      } catch {
        // Conserva catálogo base
      }
    })();
    return () => {
      active = false;
    };
  }, [apiOnline, isDemoSession]);

  const pollReportUntilReady = async (reportId: string): Promise<ReportDetailDto> => {
    let detail = await adminApi.getReport(reportId);
    for (
      let attempt = 0;
      attempt < 6 &&
      detail.status.toLowerCase() !== 'completed' &&
      detail.status.toLowerCase() !== 'ready';
      attempt++
    ) {
      await new Promise((r) => setTimeout(r, 350));
      detail = await adminApi.getReport(reportId);
    }
    return detail;
  };

  const loadSnapshotRowsPage = async (targetReportId: string, targetPage: number) => {
    if (apiOnline === false || isDemoSession || targetReportId.startsWith('rep-')) {
      setRowsPage(targetPage);
      return;
    }
    try {
      const pageRes = await adminApi.getReportRows(targetReportId, targetPage, 10);
      setRows(pageRes.items);
      setRowsPage(pageRes.page);
      setRowsTotal(pageRes.total);
      setRowsHasNext(pageRes.hasNext);
    } catch (err) {
      // Spec 011 RF-31: si expiró (410) o falló, no sustituir silenciosamente por otro cálculo
      notifyError(
        err,
        'No se pudo recuperar la página de la consulta original; genera una nueva consulta explícita'
      );
    }
  };

  const handleGenerateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spec 011 RF-8: validación estricta de período invertido o fechas vacías
    if (!from || !to || from > to) {
      notifyError(
        new Error(
          'El período seleccionado es inválido: la fecha inicial no puede ser posterior a la fecha final (Spec 011 · RF-8).'
        ),
        'Período de reporte inválido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const selectedOfferName = offerOptions.find((o) => o.id === offerId)?.name;
      const selectedHotelName = hotelOptions.find((h) => h.id === hotelId)?.name;

      const filteredRows = DEMO_REPORT_ROWS.filter((r) => {
        if (selectedOfferName && !r.offerName.toLowerCase().includes(selectedOfferName.slice(0, 14).toLowerCase())) {
          return false;
        }
        if (selectedHotelName && (r.hotelName ?? '').toLowerCase() !== selectedHotelName.toLowerCase()) {
          return false;
        }
        return true;
      });

      const filteredByOffer = offerId
        ? DEMO_REPORT.summary.byOffer.filter((o) => o.offerId === offerId)
        : DEMO_REPORT.summary.byOffer;
      const filteredByHotel = hotelId
        ? DEMO_REPORT.summary.byHotel.filter((h) => h.hotelId === hotelId)
        : DEMO_REPORT.summary.byHotel;

      setReport({
        ...DEMO_REPORT,
        id: `rep-${Date.now()}`,
        referenceAt: nowIso,
        createdAt: nowIso,
        expiresAt: expiresIso,
        status: 'completed',
        pdfStatus: 'not_requested',
        rowsCount: filteredRows.length,
        summary: {
          ...DEMO_REPORT.summary,
          from,
          to,
          byOffer: filteredByOffer,
          byHotel: filteredByHotel,
        },
      });
      setRows(filteredRows);
      setRowsPage(1);
      setRowsTotal(filteredRows.length);
      setRowsHasNext(false);
      notifySuccess(
        'Consulta oficial capturada (202 Accepted → completed)',
        `Referencia fija: ${formatLimaDateTime(nowIso)} (America/Lima UTC-5)`
      );
      return;
    }

    setBusy(true);
    try {
      const accepted = await adminApi.createReport({
        from,
        to,
        offerId: offerId || undefined,
        hotelId: hotelId || undefined,
      });
      const detail = await pollReportUntilReady(accepted.id);
      const rowsRes = await adminApi.getReportRows(accepted.id, 1, 10);
      setReport(detail);
      setRows(rowsRes.items);
      setRowsPage(rowsRes.page);
      setRowsTotal(rowsRes.total);
      setRowsHasNext(rowsRes.hasNext);
      notifySuccess(
        'Consulta oficial capturada (Spec 011)',
        `Referencia fija: ${formatLimaDateTime(detail.referenceAt)} (America/Lima UTC-5)`
      );
    } catch (err) {
      notifyError(err, 'No se pudo generar la captura del reporte oficial');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestPdf = async () => {
    if (apiOnline === false || isDemoSession || report.id.startsWith('rep-')) {
      setReport((prev) => ({ ...prev, pdfStatus: 'ready' }));
      notifySuccess(
        'PDF oficial preparado sobre la consulta fija (202 Accepted → ready)',
        'Conserva el instante de referencia original sin recalcular datos.'
      );
      return;
    }

    setRequestingPdf(true);
    try {
      await adminApi.requestReportPdf(report.id);
      let updated = await adminApi.getReport(report.id);
      for (let i = 0; i < 6 && updated.pdfStatus !== 'ready'; i++) {
        await new Promise((r) => setTimeout(r, 350));
        updated = await adminApi.getReport(report.id);
      }
      setReport(updated);
      if (updated.pdfStatus === 'ready') {
        notifySuccess('PDF oficial listo para descarga autorizada');
      } else {
        notifySuccess('Solicitud de PDF admitida (202 Accepted)', `Estado actual: ${updated.pdfStatus}`);
      }
    } catch (err) {
      notifyError(err, 'No se pudo preparar el PDF de la consulta');
    } finally {
      setRequestingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (apiOnline === false || isDemoSession || report.id.startsWith('rep-')) {
      setReport((prev) => ({ ...prev, pdfStatus: 'ready' }));
      // Spec 011 RF-26, RF-28, RF-29: resumen, desglose, referencia fija y reservas sin PII de clientes
      const lines = [
        'REPORTE OFICIAL DM GO TRAVEL (SPEC 011)',
        `Período Perú (inclusivo): ${report.summary.from} a ${report.summary.to}`,
        `Referencia oficial fija: ${report.referenceAt} (America/Lima UTC-5)`,
        `Total contratado histórico: S/ ${report.summary.contractedTotal} PEN (Turístico S/ ${report.summary.contractedTouristTotal} + Alojamiento S/ ${report.summary.contractedLodgingTotal})`,
        'Nota RF-28: Sin nombres, correos, teléfonos ni identificadores de clientes.',
        ...rows.map(
          (r) =>
            `${r.reservationNumber} | ${r.createdAt} | ${r.status} | Turístico S/ ${r.touristSubtotal} | Hotel S/ ${r.lodgingSubtotal} | Total S/ ${r.total} ${r.currency}`
        ),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dmgo-report-${report.summary.from}-${report.summary.to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('PDF Oficial descargado (sin datos personales · RF-28)');
      return;
    }

    setDownloadingPdf(true);
    try {
      if (report.pdfStatus !== 'ready') {
        await adminApi.requestReportPdf(report.id);
        let updated = await adminApi.getReport(report.id);
        for (let i = 0; i < 6 && updated.pdfStatus !== 'ready'; i++) {
          await new Promise((r) => setTimeout(r, 350));
          updated = await adminApi.getReport(report.id);
        }
        setReport(updated);
      }
      const { blob, fileName } = await adminApi.downloadReportPdf(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('PDF Oficial descargado');
    } catch (err) {
      // Spec 011 RF-31 & RF-34: informar fallo o expiración sin presentar documento parcial ni recalcular silenciosamente
      notifyError(
        err,
        'El PDF no está listo o la referencia expiró (genera una nueva consulta explícita)'
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const s = report.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E5DDD0]">
        <div className="space-y-1">
          <SectionEyebrow>Inteligencia Operativa &amp; Financiera · Spec 011</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Reportes Snapshot &amp; PDF Oficial
          </h1>
          <p className="text-xs text-[#5C6B73] max-w-2xl">
            Cifras calculadas en servidor sobre datos persistidos: contratos históricos por
            componente separados de cobros confirmados y devoluciones ejecutadas por moneda, sin
            datos personales de clientes (<span className="font-mono">RF-2, RF-16, RF-28</span>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill status={report.pdfStatus} size="md" />

          {report.pdfStatus !== 'ready' && (
            <button
              type="button"
              disabled={requestingPdf}
              onClick={() => void handleRequestPdf()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D2C6B4] bg-[#FFFCF8] hover:border-[#12232E] text-[#12232E] text-xs font-bold transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-[#B84A27]" />
              {requestingPdf ? 'Solicitando PDF (202)...' : 'Preparar PDF de esta consulta'}
            </button>
          )}

          <button
            type="button"
            disabled={downloadingPdf}
            onClick={() => void handleDownloadPdf()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#B84A27] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C89B54]" />
            {downloadingPdf ? 'Descargando...' : 'Descargar PDF Oficial'}
          </button>
        </div>
      </div>

      {/* Barra de Referencia Temporal Fija (Spec 011 RF-9, RF-29, RF-30) */}
      <div className="rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-[#12232E]">
          <Clock className="w-4 h-4 text-[#B84A27]" />
          <span>
            Instante de referencia oficial:{' '}
            <strong className="font-mono">
              {formatLimaDateTime(report.referenceAt)} (Hora Perú · America/Lima UTC-5)
            </strong>
          </span>
          <StatusPill status={report.status} size="sm" />
        </div>
        <span className="text-[11px] text-[#5C6B73]">
          Vigencia técnica snapshot: {formatLimaDateTime(report.expiresAt)} · Actualizar exige nueva
          consulta explícita (RF-30)
        </span>
      </div>

      {/* Captura de Snapshot: solo Período Perú + Oferta opcional + Hotel opcional (Spec 011 RF-5, RF-6) */}
      <form
        onSubmit={handleGenerateSnapshot}
        className="hairline-card rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
      >
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Desde (Perú inclusivo)
          </label>
          <input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Hasta (Perú inclusivo)
          </label>
          <input
            type="date"
            required
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Oferta turística principal (opcional · RF-6)
          </label>
          <select
            aria-label="Filtrar reporte por oferta turística"
            value={offerId}
            onChange={(e) => setOfferId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          >
            <option value="">Todas las experiencias (Tours y Paquetes)</option>
            {offerOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Hotel contratado (opcional · RF-6)
          </label>
          <select
            aria-label="Filtrar reporte por hotel contratado"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          >
            <option value="">Todos los hoteles aliados (incluye sin hotel)</option>
            {hotelOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {busy ? 'Capturando...' : 'Capturar ReportSnapshot'}
          </button>
        </div>
      </form>

      {/* Bloque 1: Operativo y Contratado Histórico (Spec 011 RF-10..RF-17) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
            1. Bloque Operativo e Importes Históricos Contratados (Creadas en el período)
          </h2>
          <span className="text-[11px] text-[#5C6B73] inline-flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#B84A27]" />
            Valores históricos registrados; <code>pending</code> y <code>cancelled</code> no representan cobros reales (RF-16)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hairline-card rounded-2xl p-5">
            <span className="text-[11px] text-[#5C6B73]">
              Total Histórico Contratado ({s.contractedCurrency || 'PEN'})
            </span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1 tabular-nums">
              {formatPen(s.contractedTotal)}
            </strong>
            <small className="block text-[10px] text-[#1B5E4A] mt-1">
              Componente turístico {formatPen(s.contractedTouristTotal)} + Alojamiento{' '}
              {formatPen(s.contractedLodgingTotal)} (RF-15)
            </small>
          </div>

          <div className="hairline-card rounded-2xl p-5">
            <span className="text-[11px] text-[#5C6B73]">
              Reservas Creadas en el Período (IDs únicos)
            </span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1 tabular-nums">
              {s.totalReservations}
            </strong>
            <small className="block text-[10px] text-[#5C6B73] mt-1">
              Suma exacta de los 4 estados a referencia (RF-10, RF-11)
            </small>
          </div>

          <div className="hairline-card rounded-2xl p-5">
            <span className="text-[11px] text-[#5C6B73]">Desglose por Estado a Referencia</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] tabular-nums">
              <span className="text-[#855814]">
                Pendientes: <strong>{s.pendingCount}</strong>
              </span>
              <span className="text-[#15523F]">
                Confirmadas: <strong>{s.confirmedCount}</strong>
              </span>
              <span className="text-[#1D4663]">
                Completadas: <strong>{s.completedCount}</strong>
              </span>
              <span className="text-[#8E2B17]">
                Canceladas: <strong>{s.cancelledCount}</strong>
              </span>
            </div>
          </div>

          <div className="hairline-card rounded-2xl p-5">
            <span className="text-[11px] text-[#5C6B73]">Viajeros Turísticos Reservados</span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1 tabular-nums">
              {s.totalTravelers}
            </strong>
            <small className="block text-[10px] text-[#5C6B73] mt-1">
              Suma turística única; no infiere ocupación ni huéspedes efectivos de hotel (RF-12, RF-17)
            </small>
          </div>
        </div>
      </section>

      {/* Bloque 2: Movimientos Financieros Reales por Moneda (Spec 011 RF-18..RF-25, RF-38) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
            2. Bloque de Movimientos Financieros Confirmados (Por fecha propia de operación/ejecución)
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            Cada moneda separada sin conversión · No equivale a ganancia, utilidad ni saldo bancario (RF-21, RF-38)
          </span>
        </div>

        {s.financialMovements.length === 0 ? (
          <div className="hairline-card rounded-2xl p-5 text-xs text-[#5C6B73]">
            Sin cobros confirmados ni devoluciones ejecutadas en el período seleccionado (0.00 PEN · RF-35).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {s.financialMovements.map((mov) => {
              const isNegative = parseDecimal(mov.netDifference) < 0;
              return (
                <div
                  key={mov.currency}
                  className={`hairline-card rounded-2xl p-5 border ${
                    isNegative
                      ? 'bg-[#FBECE9]/40 border-[#EABCB3]'
                      : 'bg-[#E7F3EE]/50 border-[#B6DEC9]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#12232E]">
                      Diferencia de movimientos ({mov.currency})
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/80 text-[#12232E] border border-[#D2C6B4]">
                      Moneda {mov.currency}
                    </span>
                  </div>
                  <strong
                    className={`block font-editorial text-3xl mt-1 tabular-nums ${
                      isNegative ? 'text-[#8E2B17]' : 'text-[#15523F]'
                    }`}
                  >
                    {formatCurrencyAmount(mov.netDifference, mov.currency)}
                  </strong>
                  <p className="text-[11px] text-[#12232E] mt-1.5 tabular-nums">
                    Cobros reales confirmados ({mov.paymentCount}):{' '}
                    <strong>{formatCurrencyAmount(mov.confirmedPayments, mov.currency)}</strong> −
                    Devoluciones ejecutadas ({mov.refundCount}):{' '}
                    <strong>{formatCurrencyAmount(mov.executedRefunds, mov.currency)}</strong>
                  </p>
                  <small className="block text-[10px] text-[#5C6B73] mt-1">
                    Excluye intentos rechazados/desconocidos y devoluciones pendientes de ejecución (RF-19, RF-24).
                  </small>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Desglose por Oferta y Subconjunto de Alojamiento (Spec 011 RF-13, RF-14, RF-27) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hairline-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Desglose por Oferta Principal (RF-13)
            </h2>
            <p className="text-[11px] text-[#5C6B73]">
              Importe histórico del componente turístico sin duplicar por noches ni eventos.
            </p>
          </div>
          {s.byOffer.length === 0 ? (
            <p className="text-xs text-[#5C6B73]">Sin reservas operativas para este criterio.</p>
          ) : (
            <div className="space-y-3">
              {s.byOffer.map((o) => (
                <div
                  key={o.offerId}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#12232E]">{o.offerName}</p>
                    <p className="text-[11px] text-[#5C6B73]">
                      {o.offerType === 'package' ? 'Paquete' : 'Tour'} · {o.reservations} reservas ·{' '}
                      {o.travelers} viajeros turísticos
                    </p>
                  </div>
                  <strong className="font-mono font-bold text-[#12232E] tabular-nums">
                    {formatCurrencyAmount(o.touristSubtotal, o.currency)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hairline-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Desglose por Hotel Aliado (Subconjunto · RF-14)
            </h2>
            <p className="text-[11px] text-[#5C6B73]">
              Subconjunto de reservas operativas con alojamiento contratado (no se suma de nuevo al
              total · RF-27).
            </p>
          </div>
          {s.byHotel.length === 0 ? (
            <p className="text-xs text-[#5C6B73]">
              Ninguna reserva del período incluyó alojamiento aliado.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {s.byHotel.map((h) => (
                <div
                  key={h.hotelId}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#12232E]">{h.hotelName}</p>
                    <p className="text-[11px] text-[#5C6B73]">
                      {h.reservations} {h.reservations === 1 ? 'reserva con hotel' : 'reservas con hotel'}
                    </p>
                  </div>
                  <strong className="font-mono font-bold text-[#1B5E4A] tabular-nums">
                    {formatCurrencyAmount(h.lodgingSubtotal, h.currency)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filas del Snapshot sin PII (Spec 011 RF-26, RF-28) */}
      <div className="hairline-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
            Filas Congeladas en el Snapshot ({rowsTotal}) — Sin Datos Personales (RF-28)
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            El PDF exporta todas las filas capturadas, sin limitarse a la página visual (T011-14)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#5C6B73]">
              <tr>
                <th className="px-5 py-3">N.° Reserva</th>
                <th className="px-5 py-3">Creación (Lima)</th>
                <th className="px-5 py-3">Oferta Principal</th>
                <th className="px-5 py-3">Hotel Contratado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Turístico</th>
                <th className="px-5 py-3 text-right">Alojamiento</th>
                <th className="px-5 py-3 text-right">Total PEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[#5C6B73]">
                    No existen reservas creadas en el período con los filtros indicados (RF-35).
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.reservationId}>
                    <td className="px-5 py-3.5 font-mono font-bold text-[#12232E]">
                      {r.reservationNumber}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[#5C6B73]">
                      {formatLimaDateTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">{r.offerName}</td>
                    <td className="px-5 py-3.5 text-[#5C6B73]">{r.hotelName || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={r.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                      {formatCurrencyAmount(r.touristSubtotal, r.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[#1B5E4A]">
                      {formatCurrencyAmount(r.lodgingSubtotal, r.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                      {formatCurrencyAmount(r.total, r.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-4">
          <PaginationControls
            page={rowsPage}
            pageSize={10}
            total={rowsTotal}
            hasNext={rowsHasNext}
            onPageChange={(next) => void loadSnapshotRowsPage(report.id, next)}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO 2: ADMINISTRACIÓN DE RESERVAS (SPEC 009), DEVOLUCIONES (SPEC 002)
//           E INCIDENTES DE NOTIFICACIÓN RESEND (SPEC 004)
// ============================================================================

const DEMO_ADMIN_RESERVATIONS: AdminReservationDto[] = [
  {
    id: 'adm-r1',
    reservationNumber: 'DMG-2026-004510',
    offerNameHint: 'Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D/2N',
    status: 'confirmed',
    travelers: 2,
    total: '1440.00',
    currency: 'PEN',
    paymentDeadlineAt: '2026-11-20T15:00:00Z',
    validationDeadlineAt: '2026-11-20T15:05:00Z',
    version: 2,
    departure: {
      id: '00000000-0000-4000-8000-000000000208',
      startDate: '2026-12-26T12:00:00Z',
      endDate: '2026-12-28T22:00:00Z',
      price: '590.00',
      currency: 'PEN',
      capacity: 16,
      available: 10,
    },
    lodging: {
      hotelName: 'Hotel Internazionale (Hotel - Restaurant)',
      roomTypeName: 'Hab. Matrimonial Queen',
      capacity: 2,
      checkInDate: '2026-12-26',
      checkOutDate: '2026-12-28',
      nights: 2,
      nightlyRate: '130.00',
      subtotal: '260.00',
      currency: 'PEN',
    },
    client: {
      id: 'c1',
      fullName: 'Valeria Quispe Mendoza',
      email: 'valeria.quispe@viajero.pe',
      status: 'active',
      reservationCount: 2,
    },
  },
  {
    id: 'adm-r2',
    reservationNumber: 'DMG-2026-004821',
    offerNameHint: 'Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D/2N',
    status: 'pending',
    travelers: 2,
    total: '1420.00',
    currency: 'PEN',
    paymentDeadlineAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    validationDeadlineAt: new Date(Date.now() + 17 * 60 * 1000).toISOString(),
    version: 1,
    departure: {
      id: '00000000-0000-4000-8000-000000000208',
      startDate: '2026-12-18T12:00:00Z',
      endDate: '2026-12-20T23:00:00Z',
      price: '590.00',
      currency: 'PEN',
      capacity: 16,
      available: 9,
    },
    lodging: {
      hotelName: 'Hotel Sumaq Plaza',
      roomTypeName: 'Hab. Matrimonial',
      capacity: 2,
      checkInDate: '2026-12-18',
      checkOutDate: '2026-12-20',
      nights: 2,
      nightlyRate: '120.00',
      subtotal: '240.00',
      currency: 'PEN',
    },
    client: {
      id: 'c2',
      fullName: 'Diego Torres Huamán',
      email: 'diego.torres@correo.pe',
      status: 'active',
      reservationCount: 1,
    },
  },
];

const DEMO_REFUNDS: RefundCaseDto[] = [
  {
    id: 'ref-01',
    reservationId: 'adm-r9',
    paymentId: 'pay-901',
    amount: '840.00',
    currency: 'PEN',
    status: 'open',
    createdAt: '2026-11-23T15:30:00Z',
    updatedAt: '2026-11-23T15:30:00Z',
    evidence: { providerReference: 'culqi_chg_demo901', reason: 'Cancelación antes del inicio' },
    version: 1,
  },
];

const DEMO_INCIDENTS: NotificationIncidentDto[] = [
  {
    id: 'inc-01',
    type: 'delivery_failed',
    status: 'open',
    createdAt: '2026-11-24T10:15:00Z',
    deliveryId: 'dlv-8821',
    recipientMasked: 'd***@correo.pe',
    detail: 'Timeout temporal SMTP proveedor externo; elegible para reenvío controlado.',
  },
];

export const AdminOperationsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Filtros oficiales de Spec 009 RF-2
  const [statusFilter, setStatusFilter] = useState('');
  const [clientEmailFilter, setClientEmailFilter] = useState('');
  const [reservationIdFilter, setReservationIdFilter] = useState('');
  const [tourIdFilter, setTourIdFilter] = useState('');
  const [hotelIdFilter, setHotelIdFilter] = useState('');
  const [resPage, setResPage] = useState(1);
  const [resTotal, setResTotal] = useState(DEMO_ADMIN_RESERVATIONS.length);
  const [resHasNext, setResHasNext] = useState(false);

  const [reservations, setReservations] = useState<AdminReservationDto[]>(DEMO_ADMIN_RESERVATIONS);
  const [selectedDetail, setSelectedDetail] = useState<AdminReservationDto | null>(null);

  // Estados de transición controlada (Spec 009 RF-14, RF-27, RF-37)
  const [cancelTarget, setCancelTarget] = useState<AdminReservationDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [completeTarget, setCompleteTarget] = useState<AdminReservationDto | null>(null);
  const [completeConfirmedCheck, setCompleteConfirmedCheck] = useState(false);
  const [transitionBusy, setTransitionBusy] = useState(false);

  // Devoluciones (Spec 002) e Incidentes Resend (Spec 004)
  const [refunds, setRefunds] = useState<RefundCaseDto[]>(DEMO_REFUNDS);
  const [incidents, setIncidents] = useState<NotificationIncidentDto[]>(DEMO_INCIDENTS);
  const [resendTarget, setResendTarget] = useState<NotificationIncidentDto | null>(null);
  const [resendReason, setResendReason] = useState('');

  const loadAll = async (targetPage = resPage) => {
    if (apiOnline === false || isDemoSession) return;
    try {
      const [resPageDto, refPageDto, incPageDto] = await Promise.all([
        adminApi.listReservations({
          page: targetPage,
          pageSize: 10,
          status: statusFilter || undefined,
          clientEmail: clientEmailFilter.trim() || undefined,
          reservationId: reservationIdFilter.trim() || undefined,
          tourId: tourIdFilter || undefined,
          hotelId: hotelIdFilter || undefined,
        }),
        adminApi.listRefundCases(1, 10),
        adminApi.listNotificationIncidents(1, 10),
      ]);
      setReservations(resPageDto.items);
      setResPage(resPageDto.page);
      setResTotal(resPageDto.total);
      setResHasNext(resPageDto.hasNext);
      setRefunds(refPageDto.items);
      setIncidents(incPageDto.items);
    } catch (err) {
      notifyError(err, 'No se pudo consultar la consola operativa');
    }
  };

  useEffect(() => {
    void loadAll(resPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resPage, statusFilter, apiOnline, isDemoSession]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setResPage(1);
    void loadAll(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setClientEmailFilter('');
    setReservationIdFilter('');
    setTourIdFilter('');
    setHotelIdFilter('');
    setResPage(1);
    if (apiOnline !== false && !isDemoSession) {
      void adminApi
        .listReservations({ page: 1, pageSize: 10 })
        .then((dto) => {
          setReservations(dto.items);
          setResPage(dto.page);
          setResTotal(dto.total);
          setResHasNext(dto.hasNext);
        })
        .catch(() => {});
    }
  };

  const handleInspectDetail = async (res: AdminReservationDto) => {
    if (apiOnline === false || isDemoSession || res.id.startsWith('adm-')) {
      setSelectedDetail(res);
      return;
    }
    try {
      const detail = await adminApi.getReservation(res.id);
      setSelectedDetail(detail);
    } catch (err) {
      notifyError(err, 'No se pudo cargar el detalle administrativo de la reserva');
    }
  };

  // Spec 009 RF-7, RF-26, RF-27: confirmar expresamente que todos los servicios finalizaron
  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTarget || !canAdminComplete(completeTarget.status) || !completeConfirmedCheck) {
      return;
    }

    if (apiOnline === false || isDemoSession || completeTarget.id.startsWith('adm-')) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === completeTarget.id ? { ...r, status: 'completed', version: r.version + 1 } : r
        )
      );
      notifySuccess(
        `Reserva ${completeTarget.reservationNumber} marcada como Completada`,
        'Confirmación expresa registrada en auditoría sin generar devolución (RF-21, RF-27).'
      );
      setCompleteTarget(null);
      setCompleteConfirmedCheck(false);
      return;
    }

    setTransitionBusy(true);
    try {
      await adminApi.completeReservation(completeTarget.id, completeTarget.version);
      notifySuccess('Reserva marcada como Completada (RF-7, RF-27)');
      setCompleteTarget(null);
      setCompleteConfirmedCheck(false);
      await loadAll(resPage);
    } catch (err) {
      notifyError(
        err,
        'No se pudo completar la reserva (verifica que todos los servicios contratados hayan finalizado · RF-26)'
      );
    } finally {
      setTransitionBusy(false);
    }
  };

  // Spec 009 RF-8, RF-14, RF-15, RF-37: cancelar confirmed antes del inicio con motivo obligatorio no vacío
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !canAdminCancel(cancelTarget.status)) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      notifyError(
        new Error('El motivo de cancelación administrativa es obligatorio y no puede quedar en blanco (Spec 009 · RF-14, RF-37).'),
        'Motivo obligatorio requerido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession || cancelTarget.id.startsWith('adm-')) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id ? { ...r, status: 'cancelled', version: r.version + 1 } : r
        )
      );
      setRefunds((prev) => [
        {
          id: `ref-${Date.now().toString().slice(-4)}`,
          reservationId: cancelTarget.id,
          paymentId: `pay-${cancelTarget.reservationNumber}`,
          amount: cancelTarget.total,
          currency: cancelTarget.currency,
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          evidence: { reason: trimmedReason },
          version: 1,
        },
        ...prev,
      ]);
      notifySuccess(
        `Reserva ${cancelTarget.reservationNumber} cancelada con motivo auditado`,
        'Recursos liberados y caso de devolución total abierto en estado open (Spec 009 · RF-15, RF-28, RF-29).'
      );
      setCancelTarget(null);
      setCancelReason('');
      return;
    }

    setTransitionBusy(true);
    try {
      await adminApi.cancelReservation(cancelTarget.id, trimmedReason, cancelTarget.version);
      notifySuccess(
        'Reserva cancelada con auditoría y apertura de devolución total (RF-14, RF-15)'
      );
      setCancelTarget(null);
      setCancelReason('');
      await loadAll(resPage);
    } catch (err) {
      notifyError(
        err,
        'No se pudo cancelar la reserva (solo permitido antes del inicio del servicio · RF-11, RF-20)'
      );
    } finally {
      setTransitionBusy(false);
    }
  };

  // Spec 002: open -> authorized (no equivale a abono recibido); retry sobre authorized / failed / unknown
  const handleAuthorizeRefund = async (rf: RefundCaseDto) => {
    if (apiOnline === false || isDemoSession || rf.id.startsWith('ref-')) {
      setRefunds((prev) =>
        prev.map((item) =>
          item.id === rf.id ? { ...item, status: 'authorized', version: item.version + 1 } : item
        )
      );
      notifySuccess(
        'Devolución autorizada (status: authorized)',
        'Autorización registrada; no se presenta como abono ejecutado hasta confirmación del proveedor (Spec 002).'
      );
      return;
    }
    try {
      await adminApi.authorizeRefund(rf.id, rf.version);
      notifySuccess('Caso de devolución autorizado (status: authorized)');
      await loadAll(resPage);
    } catch (err) {
      notifyError(err, 'Error al autorizar el caso de devolución');
    }
  };

  const handleRetryRefund = async (rf: RefundCaseDto) => {
    if (apiOnline === false || isDemoSession || rf.id.startsWith('ref-')) {
      setRefunds((prev) =>
        prev.map((item) =>
          item.id === rf.id ? { ...item, status: 'executed', version: item.version + 1 } : item
        )
      );
      notifySuccess('Ejecución de devolución reintentada y confirmada en vista previa');
      return;
    }
    try {
      await adminApi.retryRefund(rf.id);
      notifySuccess('Reintento de devolución admitido (202 Accepted)');
      await loadAll(resPage);
    } catch (err) {
      notifyError(err, 'No se pudo encolar el reintento de devolución');
    }
  };

  const handleConfirmResendIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendTarget) return;
    const reasonText = resendReason.trim() || 'Reenvío manual administrativo por incidencia de entrega';

    if (apiOnline === false || isDemoSession || resendTarget.id.startsWith('inc-')) {
      setIncidents((prev) =>
        prev.map((item) => (item.id === resendTarget.id ? { ...item, status: 'resolved' } : item))
      );
      notifySuccess('Reenvío manual despachado vía Resend (202 Accepted)');
      setResendTarget(null);
      setResendReason('');
      return;
    }
    try {
      await adminApi.resendNotificationDelivery(resendTarget.deliveryId, reasonText, 1);
      notifySuccess('Reenvío manual admitido en cola (202 Accepted)');
      setResendTarget(null);
      setResendReason('');
      await loadAll(resPage);
    } catch (err) {
      notifyError(err, 'Error al solicitar el reenvío de la notificación');
    }
  };

  const visibleReservations =
    apiOnline === false || isDemoSession
      ? reservations.filter((r) => {
          if (statusFilter && r.status.toLowerCase() !== statusFilter) return false;
          if (
            clientEmailFilter.trim() &&
            !(r.client.email ?? '').toLowerCase().includes(clientEmailFilter.trim().toLowerCase())
          ) {
            return false;
          }
          if (
            reservationIdFilter.trim() &&
            !r.id.toLowerCase().includes(reservationIdFilter.trim().toLowerCase()) &&
            !r.reservationNumber
              .toLowerCase()
              .includes(reservationIdFilter.trim().toLowerCase())
          ) {
            return false;
          }
          if (hotelIdFilter) {
            const matchedHotel = DEFAULT_HOTEL_OPTIONS.find((h) => h.id === hotelIdFilter);
            if (
              matchedHotel &&
              (r.lodging?.hotelName ?? '').toLowerCase() !== matchedHotel.name.toLowerCase()
            ) {
              return false;
            }
          }
          return true;
        })
      : reservations;

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#E5DDD0] flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow>Operaciones Críticas · Specs 009, 002 &amp; 004</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E] mt-1">
            Reservas, Devoluciones &amp; Entregas Resend
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FBF4E4] border border-[#E8D2A0] text-xs font-semibold text-[#7A4E0D]">
          <Lock className="w-3.5 h-3.5" />
          Spec 009 · RF-9 &amp; RN-14: Reservas <code>pending</code> intocables manualmente
        </div>
      </div>

      {/* Filtros Oficiales Spec 009 RF-2 */}
      <form
        onSubmit={handleApplyFilters}
        className="hairline-card rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
      >
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Estado (RF-2)
          </label>
          <select
            aria-label="Filtrar reservas por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Correo del cliente (RF-35)
          </label>
          <input
            type="text"
            value={clientEmailFilter}
            onChange={(e) => setClientEmailFilter(e.target.value)}
            placeholder="Coincidencia parcial correo..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            ID Reserva
          </label>
          <input
            type="text"
            value={reservationIdFilter}
            onChange={(e) => setReservationIdFilter(e.target.value)}
            placeholder="UUID de reserva"
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
            Hotel contratado
          </label>
          <select
            value={hotelIdFilter}
            onChange={(e) => setHotelIdFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          >
            <option value="">Todos los hoteles</option>
            {DEFAULT_HOTEL_OPTIONS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2 px-3 rounded-xl bg-[#12232E] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Filtrar
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            aria-label="Limpiar filtros de reservas"
            className="p-2 rounded-xl border border-[#D2C6B4] bg-[#FFFCF8] text-[#12232E] cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Diálogo inline de Confirmación Expresa para Completar (Spec 009 RF-7, RF-26, RF-27) */}
      {completeTarget && (
        <form
          onSubmit={handleConfirmComplete}
          className="rounded-2xl border border-[#B6DEC9] bg-[#E7F3EE]/70 p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#15523F]">
                Confirmación Expresa de Finalización · Reserva {completeTarget.reservationNumber} (Spec 009 · RF-27)
              </h3>
              <p className="text-xs text-[#12232E] mt-0.5">
                Solo procede cuando han concluido los períodos contratados de todos los componentes
                (actividad turística y alojamiento aliado, si aplica · RF-26). No genera devolución (RF-21).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompleteTarget(null);
                setCompleteConfirmedCheck(false);
              }}
              className="text-xs font-bold text-[#5C6B73] cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#12232E] cursor-pointer">
            <input
              type="checkbox"
              checked={completeConfirmedCheck}
              onChange={(e) => setCompleteConfirmedCheck(e.target.checked)}
              className="accent-[#15523F]"
            />
            <span>
              Confirmo expresamente que todos los servicios contratados de esta reserva han
              finalizado.
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!completeConfirmedCheck || transitionBusy}
              className="px-4 py-2 rounded-xl bg-[#15523F] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
            >
              {transitionBusy ? 'Aplicando...' : `Marcar Completada (If-Match v${completeTarget.version})`}
            </button>
          </div>
        </form>
      )}

      {/* Diálogo inline de Cancelación Administrativa con Motivo Obligatorio (Spec 009 RF-8, RF-14, RF-15, RF-37) */}
      {cancelTarget && (
        <form
          onSubmit={handleConfirmCancel}
          className="rounded-2xl border border-[#EABCB3] bg-[#FBECE9]/70 p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#8E2B17] inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Cancelar Reserva Confirmada {cancelTarget.reservationNumber} antes del inicio (Spec 009 · RF-8, RF-14)
              </h3>
              <p className="text-xs text-[#12232E] mt-0.5">
                Liberará cupos turísticos e inventario hotelero comprometidos y abrirá un caso de
                devolución total ({formatPen(cancelTarget.total)}) sin penalidad para revisión e
                inicio en máximo 1 día hábil (RF-15, RF-16).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason('');
              }}
              className="text-xs font-bold text-[#5C6B73] cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8E2B17] mb-1">
              Motivo obligatorio de cancelación (auditado y notificado al cliente · RF-14, RF-18, RF-37)
            </label>
            <textarea
              rows={2}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Describe el motivo operativo o solicitud verificada antes del inicio del servicio..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#EABCB3] bg-white text-xs"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={transitionBusy}
              className="px-4 py-2 rounded-xl bg-[#8E2B17] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
            >
              {transitionBusy
                ? 'Cancelando...'
                : `Confirmar Cancelación y Abrir Devolución (If-Match v${cancelTarget.version})`}
            </button>
          </div>
        </form>
      )}

      {/* Detalle Administrativo Solo Lectura (Spec 009 RF-4, RF-6, RF-23) */}
      {selectedDetail && (
        <div className="hairline-card rounded-2xl p-5 space-y-3 bg-[#FAF7F2]">
          <div className="flex items-center justify-between border-b border-[#E5DDD0] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#12232E]">
                Detalle Oficial #{selectedDetail.reservationNumber}
              </span>
              <StatusPill status={selectedDetail.status} size="sm" />
              <span className="font-mono text-[10px] text-[#5C6B73]">
                ETag v{selectedDetail.version}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs font-bold text-[#B84A27] cursor-pointer"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5C6B73] block">
                Cliente Titular
              </span>
              <strong className="text-[#12232E]">
                {selectedDetail.client.fullName ?? 'Anonimizado por baja lógica (RN-30)'}
              </strong>
              <span className="block text-[#5C6B73]">{selectedDetail.client.email ?? '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5C6B73] block">
                Servicio Turístico Histórico
              </span>
              <strong className="text-[#12232E]">
                {selectedDetail.offerNameHint ?? 'Registrado en snapshot'}
              </strong>
              <span className="block text-[#5C6B73]">
                {selectedDetail.travelers} viajeros ·{' '}
                {selectedDetail.departure
                  ? `${formatLimaDateTime(selectedDetail.departure.startDate)} → ${formatLimaDate(selectedDetail.departure.endDate)}`
                  : 'Fechas históricas'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5C6B73] block">
                Alojamiento &amp; Total Histórico (Sin PAN/CVV · RF-6)
              </span>
              <strong className="text-[#12232E]">{formatPen(selectedDetail.total)} PEN</strong>
              <span className="block text-[#1B5E4A]">
                {selectedDetail.lodging
                  ? `${selectedDetail.lodging.hotelName} · ${selectedDetail.lodging.roomTypeName} (${selectedDetail.lodging.nights}n)`
                  : 'Solo actividad turística'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Reservas */}
      <div className="hairline-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
            Gestión Operativa de Reservas ({visibleReservations.length})
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            Orden descendente por creación · Sin edición de importes ni fechas históricas (RF-1, RF-23)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#5C6B73]">
              <tr>
                <th className="px-5 py-3">Reserva</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Importe PEN</th>
                <th className="px-5 py-3 text-right">Operaciones Permitidas (Spec 009)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#5C6B73]">
                    Página vacía sin coincidencias para los filtros seleccionados (RF-3).
                  </td>
                </tr>
              ) : (
                visibleReservations.map((res) => (
                  <tr key={res.id}>
                    <td className="px-5 py-4 font-mono font-bold text-[#12232E]">
                      {res.reservationNumber}
                      <span className="block text-[10px] font-normal text-[#5C6B73]">
                        ETag v{res.version}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <strong className="text-[#12232E]">
                        {res.client.fullName || 'Datos ocultos por baja lógica'}
                      </strong>
                      <span className="block text-[11px] text-[#5C6B73]">
                        {res.client.email || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={res.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 font-mono font-bold tabular-nums">
                      {formatPen(res.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleInspectDetail(res)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2C6B4] bg-[#FFFCF8] text-[#12232E] font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalle
                        </button>

                        {res.status.toLowerCase() === 'pending' && (
                          <span className="text-[10px] text-[#855814] bg-[#FBF4E4] px-2.5 py-1 rounded-lg border border-[#E8D2A0]">
                            Exclusivo 001/002/003 (RF-9)
                          </span>
                        )}

                        {canAdminComplete(res.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompleteTarget(res);
                              setCompleteConfirmedCheck(false);
                              setCancelTarget(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E7F3EE] text-[#15523F] font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completar
                          </button>
                        )}

                        {canAdminCancel(res.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTarget(res);
                              setCancelReason('');
                              setCompleteTarget(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FBECE9] text-[#8E2B17] font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar con motivo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-4">
          <PaginationControls
            page={resPage}
            pageSize={10}
            total={resTotal}
            hasNext={resHasNext}
            onPageChange={setResPage}
          />
        </div>
      </div>

      {/* Reembolsos (Spec 002) e Incidentes Resend (Spec 004) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hairline-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Casos de Devolución (RefundCase · Spec 002)
            </h2>
            <p className="text-[11px] text-[#5C6B73]">
              Revisión e inicio administrativo en máximo 1 día hábil. Autorizar no equivale a abono
              ejecutado hasta confirmación del proveedor.
            </p>
          </div>

          {refunds.map((rf) => {
            const st = rf.status.toLowerCase();
            const canAuthorize = st === 'open';
            const canRetry = st === 'authorized' || st === 'failed' || st === 'unknown';
            return (
              <div
                key={rf.id}
                className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#12232E]">
                      {rf.id} · {formatPen(rf.amount)}
                    </span>
                    <StatusPill status={rf.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#5C6B73]">
                    Pago {rf.paymentId} · ETag v{rf.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canAuthorize && (
                    <button
                      type="button"
                      onClick={() => void handleAuthorizeRefund(rf)}
                      className="px-3 py-1.5 rounded-lg bg-[#12232E] text-white font-bold cursor-pointer"
                    >
                      Autorizar
                    </button>
                  )}
                  {canRetry && (
                    <button
                      type="button"
                      onClick={() => void handleRetryRefund(rf)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2C6B4] bg-white text-[#12232E] font-semibold cursor-pointer"
                      aria-label="Reintentar reembolso"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reintentar (202)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hairline-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Incidentes de Correo (Resend · Spec 004)
            </h2>
            <p className="text-[11px] text-[#5C6B73]">
              Destinatario enmascarado y reenvío manual auditado (<code>202 Accepted</code>) sin
              exponer secretos.
            </p>
          </div>

          {resendTarget && (
            <form
              onSubmit={handleConfirmResendIncident}
              className="p-3.5 rounded-xl bg-[#FBF4E4] border border-[#E8D2A0] space-y-2 text-xs"
            >
              <p className="font-bold text-[#7A4E0D]">
                Reenvío manual para entrega {resendTarget.deliveryId} ({resendTarget.recipientMasked})
              </p>
              <input
                type="text"
                value={resendReason}
                onChange={(e) => setResendReason(e.target.value)}
                placeholder="Motivo del reenvío manual (opcional, máx. 2000 caracteres)"
                className="w-full px-3 py-2 rounded-lg border border-[#E8D2A0] bg-white text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#B84A27] text-white font-bold cursor-pointer"
                >
                  Confirmar reenvío (202)
                </button>
                <button
                  type="button"
                  onClick={() => setResendTarget(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#D2C6B4] bg-white text-[#5C6B73] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-[#12232E] inline-flex items-center gap-1.5">
                  <MailWarning className="w-3.5 h-3.5 text-[#B84A27]" />
                  {inc.recipientMasked} · <span className="font-mono text-[10px]">{inc.type}</span>{' '}
                  · <StatusPill status={inc.status} size="sm" />
                </p>
                <p className="text-[11px] text-[#5C6B73]">{inc.detail}</p>
              </div>
              {inc.status.toLowerCase() === 'open' && (
                <button
                  type="button"
                  onClick={() => {
                    setResendTarget(inc);
                    setResendReason('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B84A27] text-white font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reenviar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
