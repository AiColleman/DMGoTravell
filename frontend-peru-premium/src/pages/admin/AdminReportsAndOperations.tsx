import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  MailCheck,
  MailWarning,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Wallet,
  X,
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
// DATOS DE VISTA PREVIA COMPARTIDOS ENTRE RESERVAS, DEVOLUCIONES Y CORREOS
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

const INITIAL_DEMO_RESERVATIONS: AdminReservationDto[] = [
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

const INITIAL_DEMO_REFUNDS: RefundCaseDto[] = [
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

const INITIAL_DEMO_INCIDENTS: NotificationIncidentDto[] = [
  {
    id: 'inc-01',
    type: 'delivery_failed',
    status: 'open',
    createdAt: '2026-11-24T10:15:00Z',
    deliveryId: 'dlv-8821',
    recipientMasked: 'd***@correo.pe',
    detail: 'Demora temporal del servidor de correo; listo para reenvío manual.',
  },
];

// Estado compartido en memoria de sesión demo para que una cancelación en /admin/reservas
// refleje de inmediato su caso de devolución en /admin/devoluciones.
let sharedDemoReservations: AdminReservationDto[] = [...INITIAL_DEMO_RESERVATIONS];
let sharedDemoRefunds: RefundCaseDto[] = [...INITIAL_DEMO_REFUNDS];
let sharedDemoIncidents: NotificationIncidentDto[] = [...INITIAL_DEMO_INCIDENTS];

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

// ============================================================================
// SECCIÓN 1: REPORTES FINANCIEROS Y PDF OFICIAL (/admin/reportes)
// ============================================================================

export const AdminReportsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

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
      notifyError(
        err,
        'La consulta anterior expiró; genera una nueva consulta para ver las páginas.'
      );
    }
  };

  const handleGenerateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!from || !to || from > to) {
      notifyError(
        new Error('La fecha inicial no puede ser posterior a la fecha final.'),
        'Período de consulta inválido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const selectedOfferName = offerOptions.find((o) => o.id === offerId)?.name;
      const selectedHotelName = hotelOptions.find((h) => h.id === hotelId)?.name;

      const filteredRows = DEMO_REPORT_ROWS.filter((r) => {
        if (
          selectedOfferName &&
          !r.offerName.toLowerCase().includes(selectedOfferName.slice(0, 14).toLowerCase())
        ) {
          return false;
        }
        if (
          selectedHotelName &&
          (r.hotelName ?? '').toLowerCase() !== selectedHotelName.toLowerCase()
        ) {
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
        'Reporte actualizado',
        `Datos tomados a las ${formatLimaDateTime(nowIso)} (Hora de Perú)`
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
        'Reporte generado con éxito',
        `Fecha de corte: ${formatLimaDateTime(detail.referenceAt)} (Hora de Perú)`
      );
    } catch (err) {
      notifyError(err, 'No se pudo generar el reporte');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestPdf = async () => {
    if (apiOnline === false || isDemoSession || report.id.startsWith('rep-')) {
      setReport((prev) => ({ ...prev, pdfStatus: 'ready' }));
      notifySuccess(
        'Documento PDF listo para descargar',
        'Generado con la misma información mostrada en pantalla.'
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
        notifySuccess('Documento PDF listo para descargar');
      } else {
        notifySuccess('Preparando PDF oficial...', `Estado: ${updated.pdfStatus}`);
      }
    } catch (err) {
      notifyError(err, 'No se pudo preparar el PDF del reporte');
    } finally {
      setRequestingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (apiOnline === false || isDemoSession || report.id.startsWith('rep-')) {
      setReport((prev) => ({ ...prev, pdfStatus: 'ready' }));
      const lines = [
        'REPORTE EJECUTIVO — DM GO TRAVEL',
        `Período consultado: ${report.summary.from} al ${report.summary.to}`,
        `Fecha y hora de corte: ${report.referenceAt} (Hora de Perú)`,
        `Total contratado: S/ ${report.summary.contractedTotal} PEN (Experiencias S/ ${report.summary.contractedTouristTotal} + Hoteles S/ ${report.summary.contractedLodgingTotal})`,
        'Documento administrativo sin datos personales de clientes.',
        ...rows.map(
          (r) =>
            `${r.reservationNumber} | ${r.createdAt} | ${r.status} | Tour S/ ${r.touristSubtotal} | Hotel S/ ${r.lodgingSubtotal} | Total S/ ${r.total} ${r.currency}`
        ),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-dmgotravel-${report.summary.from}-${report.summary.to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('PDF Oficial descargado');
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
      notifyError(err, 'El PDF aún no está disponible o la consulta expiró');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const s = report.summary;

  return (
    <div className="space-y-7">
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5DDD0]">
        <div className="space-y-1.5">
          <SectionEyebrow>Resumen Ejecutivo y Financiero</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Reportes Financieros y PDF Oficial
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Consulta las ventas contratadas por experiencia y hotel aliado, revisa los cobros
            confirmados en Soles y descarga el informe oficial en PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill status={report.pdfStatus} size="md" />

          {report.pdfStatus !== 'ready' && (
            <button
              type="button"
              disabled={requestingPdf}
              onClick={() => void handleRequestPdf()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D2C6B4] bg-white hover:border-[#12232E] text-[#12232E] text-xs font-bold transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-[#B84A27]" />
              {requestingPdf ? 'Preparando PDF...' : 'Preparar PDF de esta consulta'}
            </button>
          )}

          <button
            type="button"
            disabled={downloadingPdf}
            onClick={() => void handleDownloadPdf()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#B84A27] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C89B54]" />
            {downloadingPdf ? 'Descargando...' : 'Descargar PDF Oficial'}
          </button>
        </div>
      </div>

      {/* Buscador de Período y Filtros */}
      <form
        onSubmit={handleGenerateSnapshot}
        className="hairline-card rounded-2xl p-5 bg-white space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#12232E] inline-flex items-center gap-1.5">
            <CalendarRange className="w-4 h-4 text-[#B84A27]" />
            Selecciona el rango de fechas a consultar
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5C6B73]">
            <Clock className="w-3.5 h-3.5 text-[#1B5E4A]" />
            Último corte: <strong className="text-[#12232E]">{formatLimaDateTime(report.referenceAt)}</strong> (Hora de Perú)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Fecha inicial
            </label>
            <input
              type="date"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Fecha final
            </label>
            <input
              type="date"
              required
              min={from || undefined}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Tour o paquete (opcional)
            </label>
            <select
              aria-label="Filtrar reporte por oferta turística"
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
            >
              <option value="">Todas las experiencias</option>
              {offerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Hotel aliado (opcional)
            </label>
            <select
              aria-label="Filtrar reporte por hotel contratado"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
            >
              <option value="">Todos los hoteles aliados</option>
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
              className="w-full py-2.5 px-4 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              {busy ? 'Consultando...' : 'Generar reporte'}
            </button>
          </div>
        </div>
      </form>

      {/* Indicadores Principales del Período */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#12232E]">
            Resumen de reservas creadas en el período
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            Incluye el valor total reservado; las pendientes y canceladas aún no son cobros efectivos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hairline-card rounded-2xl p-5 bg-white">
            <span className="text-xs font-medium text-[#5C6B73]">
              Total contratado ({s.contractedCurrency || 'PEN'})
            </span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1.5 tabular-nums">
              {formatPen(s.contractedTotal)}
            </strong>
            <p className="text-[11px] text-[#1B5E4A] font-medium mt-1.5">
              Tours: {formatPen(s.contractedTouristTotal)} · Hoteles: {formatPen(s.contractedLodgingTotal)}
            </p>
          </div>

          <div className="hairline-card rounded-2xl p-5 bg-white">
            <span className="text-xs font-medium text-[#5C6B73]">Reservas registradas</span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1.5 tabular-nums">
              {s.totalReservations}
            </strong>
            <p className="text-[11px] text-[#5C6B73] mt-1.5">
              Órdenes creadas entre {formatLimaDate(s.from)} y {formatLimaDate(s.to)}
            </p>
          </div>

          <div className="hairline-card rounded-2xl p-5 bg-white">
            <span className="text-xs font-medium text-[#5C6B73]">Estado de las reservas</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2.5 text-xs tabular-nums">
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

          <div className="hairline-card rounded-2xl p-5 bg-white">
            <span className="text-xs font-medium text-[#5C6B73]">Viajeros en experiencias</span>
            <strong className="block font-editorial text-3xl text-[#12232E] mt-1.5 tabular-nums">
              {s.totalTravelers}
            </strong>
            <p className="text-[11px] text-[#5C6B73] mt-1.5">
              Total de pasajeros en tours y paquetes
            </p>
          </div>
        </div>
      </section>

      {/* Movimientos de Caja Confirmados */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#1B5E4A]" />
            Movimientos financieros confirmados
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            Cobros efectivamente recibidos menos devoluciones ejecutadas en el período
          </span>
        </div>

        {s.financialMovements.length === 0 ? (
          <div className="hairline-card rounded-2xl p-5 bg-white text-xs text-[#5C6B73]">
            No se registran cobros confirmados ni devoluciones ejecutadas en este rango de fechas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {s.financialMovements.map((mov) => {
              const isNegative = parseDecimal(mov.netDifference) < 0;
              return (
                <div
                  key={mov.currency}
                  className={`rounded-2xl p-5 border ${
                    isNegative
                      ? 'bg-[#FBECE9]/50 border-[#EABCB3]'
                      : 'bg-[#E7F3EE]/60 border-[#B6DEC9]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#12232E]">
                      Diferencia de movimientos ({mov.currency})
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#12232E] border border-[#D2C6B4]">
                      Soles ({mov.currency})
                    </span>
                  </div>
                  <strong
                    className={`block font-editorial text-3xl mt-1.5 tabular-nums ${
                      isNegative ? 'text-[#8E2B17]' : 'text-[#15523F]'
                    }`}
                  >
                    {formatCurrencyAmount(mov.netDifference, mov.currency)}
                  </strong>
                  <div className="flex flex-wrap gap-4 text-xs text-[#12232E] mt-2 tabular-nums">
                    <span>
                      Cobros recibidos ({mov.paymentCount}):{' '}
                      <strong>{formatCurrencyAmount(mov.confirmedPayments, mov.currency)}</strong>
                    </span>
                    <span>
                      Devoluciones pagadas ({mov.refundCount}):{' '}
                      <strong>{formatCurrencyAmount(mov.executedRefunds, mov.currency)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Desglose por Experiencia y por Hotel Aliado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hairline-card rounded-2xl p-6 bg-white space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Ventas por Tour y Paquete
            </h2>
            <p className="text-xs text-[#5C6B73]">
              Importe correspondiente a las experiencias turísticas reservadas.
            </p>
          </div>
          {s.byOffer.length === 0 ? (
            <p className="text-xs text-[#5C6B73]">Sin reservas para los filtros elegidos.</p>
          ) : (
            <div className="space-y-2.5">
              {s.byOffer.map((o) => (
                <div
                  key={o.offerId}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#12232E]">{o.offerName}</p>
                    <p className="text-[11px] text-[#5C6B73] mt-0.5">
                      {o.offerType === 'package' ? 'Paquete' : 'Tour'} · {o.reservations} reservas ·{' '}
                      {o.travelers} viajeros
                    </p>
                  </div>
                  <strong className="font-bold text-[#12232E] tabular-nums">
                    {formatCurrencyAmount(o.touristSubtotal, o.currency)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hairline-card rounded-2xl p-6 bg-white space-y-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#12232E]">
              Alojamiento por Hotel Aliado
            </h2>
            <p className="text-xs text-[#5C6B73]">
              Reservas del período que incluyeron estadía en nuestros hoteles de Ayacucho.
            </p>
          </div>
          {s.byHotel.length === 0 ? (
            <p className="text-xs text-[#5C6B73]">
              Ninguna reserva del período incluyó alojamiento aliado.
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {s.byHotel.map((h) => (
                <div
                  key={h.hotelId}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#12232E]">{h.hotelName}</p>
                    <p className="text-[11px] text-[#5C6B73] mt-0.5">
                      {h.reservations}{' '}
                      {h.reservations === 1 ? 'reserva con estadía' : 'reservas con estadía'}
                    </p>
                  </div>
                  <strong className="font-bold text-[#1B5E4A] tabular-nums">
                    {formatCurrencyAmount(h.lodgingSubtotal, h.currency)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Reservas Incluidas en el Reporte */}
      <div className="hairline-card rounded-2xl bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#12232E]">
              Detalle de reservas del reporte ({rowsTotal})
            </h2>
            <p className="text-[11px] text-[#5C6B73]">
              Vista protegida sin datos personales de viajeros; el PDF incluye todas las filas del período.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#5C6B73] border-b border-[#E5DDD0]">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Fecha de creación</th>
                <th className="px-5 py-3">Experiencia</th>
                <th className="px-5 py-3">Hotel aliado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Tour</th>
                <th className="px-5 py-3 text-right">Hotel</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[#5C6B73]">
                    No se encontraron reservas en este período con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.reservationId} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#12232E]">
                      {r.reservationNumber}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[#5C6B73]">
                      {formatLimaDateTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#12232E]">{r.offerName}</td>
                    <td className="px-5 py-3.5 text-[#5C6B73]">{r.hotelName || 'Sin hotel'}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={r.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {formatCurrencyAmount(r.touristSubtotal, r.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-[#1B5E4A]">
                      {formatCurrencyAmount(r.lodgingSubtotal, r.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums text-[#12232E]">
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
// SECCIÓN 2: GESTIÓN DE RESERVAS (/admin/reservas)
// ============================================================================

export const AdminOperationsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [clientEmailFilter, setClientEmailFilter] = useState('');
  const [reservationIdFilter, setReservationIdFilter] = useState('');
  const [hotelIdFilter, setHotelIdFilter] = useState('');
  const [resPage, setResPage] = useState(1);
  const [resTotal, setResTotal] = useState(sharedDemoReservations.length);
  const [resHasNext, setResHasNext] = useState(false);

  const [reservations, setReservations] = useState<AdminReservationDto[]>(sharedDemoReservations);
  const [openRefundsCount, setOpenRefundsCount] = useState(
    sharedDemoRefunds.filter((r) => r.status.toLowerCase() === 'open').length
  );
  const [selectedDetail, setSelectedDetail] = useState<AdminReservationDto | null>(null);

  const [cancelTarget, setCancelTarget] = useState<AdminReservationDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [completeTarget, setCompleteTarget] = useState<AdminReservationDto | null>(null);
  const [completeConfirmedCheck, setCompleteConfirmedCheck] = useState(false);
  const [transitionBusy, setTransitionBusy] = useState(false);

  const loadReservations = async (targetPage = resPage) => {
    if (apiOnline === false || isDemoSession) {
      setReservations([...sharedDemoReservations]);
      setOpenRefundsCount(
        sharedDemoRefunds.filter((r) => r.status.toLowerCase() === 'open').length
      );
      return;
    }
    try {
      const [resPageDto, refPageDto] = await Promise.all([
        adminApi.listReservations({
          page: targetPage,
          pageSize: 10,
          status: statusFilter || undefined,
          clientEmail: clientEmailFilter.trim() || undefined,
          reservationId: reservationIdFilter.trim() || undefined,
          hotelId: hotelIdFilter || undefined,
        }),
        adminApi.listRefundCases(1, 20).catch(() => ({ items: [] as RefundCaseDto[] })),
      ]);
      setReservations(resPageDto.items);
      setResPage(resPageDto.page);
      setResTotal(resPageDto.total);
      setResHasNext(resPageDto.hasNext);
      setOpenRefundsCount(
        refPageDto.items.filter((r) => r.status.toLowerCase() === 'open').length
      );
    } catch (err) {
      notifyError(err, 'No se pudo cargar el listado de reservas');
    }
  };

  useEffect(() => {
    void loadReservations(resPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resPage, statusFilter, apiOnline, isDemoSession]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setResPage(1);
    void loadReservations(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setClientEmailFilter('');
    setReservationIdFilter('');
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
      notifyError(err, 'No se pudo cargar el detalle de la reserva');
    }
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTarget || !canAdminComplete(completeTarget.status) || !completeConfirmedCheck) {
      return;
    }

    if (apiOnline === false || isDemoSession || completeTarget.id.startsWith('adm-')) {
      sharedDemoReservations = sharedDemoReservations.map((r) =>
        r.id === completeTarget.id ? { ...r, status: 'completed', version: r.version + 1 } : r
      );
      setReservations([...sharedDemoReservations]);
      notifySuccess(
        `Reserva ${completeTarget.reservationNumber} marcada como Completada`,
        'El viaje y los servicios contratados quedaron registrados como finalizados.'
      );
      setCompleteTarget(null);
      setCompleteConfirmedCheck(false);
      return;
    }

    setTransitionBusy(true);
    try {
      await adminApi.completeReservation(completeTarget.id, completeTarget.version);
      notifySuccess('Reserva marcada como Completada');
      setCompleteTarget(null);
      setCompleteConfirmedCheck(false);
      await loadReservations(resPage);
    } catch (err) {
      notifyError(
        err,
        'No se pudo completar la reserva; verifica que la fecha del servicio ya haya concluido.'
      );
    } finally {
      setTransitionBusy(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !canAdminCancel(cancelTarget.status)) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      notifyError(
        new Error('Ingresa el motivo de la cancelación para notificar al viajero.'),
        'Motivo requerido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession || cancelTarget.id.startsWith('adm-')) {
      sharedDemoReservations = sharedDemoReservations.map((r) =>
        r.id === cancelTarget.id ? { ...r, status: 'cancelled', version: r.version + 1 } : r
      );
      const newRefund: RefundCaseDto = {
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
      };
      sharedDemoRefunds = [newRefund, ...sharedDemoRefunds];
      setReservations([...sharedDemoReservations]);
      setOpenRefundsCount(
        sharedDemoRefunds.filter((r) => r.status.toLowerCase() === 'open').length
      );
      notifySuccess(
        `Reserva ${cancelTarget.reservationNumber} cancelada`,
        'Se liberaron los cupos y se abrió su solicitud en la sección Devoluciones.'
      );
      setCancelTarget(null);
      setCancelReason('');
      return;
    }

    setTransitionBusy(true);
    try {
      await adminApi.cancelReservation(cancelTarget.id, trimmedReason, cancelTarget.version);
      notifySuccess(
        'Reserva cancelada correctamente',
        'Los cupos fueron liberados y se generó el caso de devolución total.'
      );
      setCancelTarget(null);
      setCancelReason('');
      await loadReservations(resPage);
    } catch (err) {
      notifyError(err, 'Solo se pueden cancelar reservas confirmadas antes del inicio del viaje');
    } finally {
      setTransitionBusy(false);
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

  const statusTabs = [
    { key: '', label: 'Todas' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'pending', label: 'En espera de pago' },
    { key: 'completed', label: 'Completadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Atención y Control Operativo</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Gestión de Reservas
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Consulta el detalle de cada viajero, marca los viajes finalizados como completados o
            cancela reservas confirmadas antes de la fecha de salida.
          </p>
        </div>

        {openRefundsCount > 0 && (
          <Link
            to="/admin/devoluciones"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FBF4E4] border border-[#E8D2A0] hover:border-[#B84A27] text-xs font-bold text-[#7A4E0D] transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#B84A27]" />
            {openRefundsCount}{' '}
            {openRefundsCount === 1
              ? 'devolución pendiente de autorizar'
              : 'devoluciones pendientes de autorizar'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Pestañas rápidas por estado + Buscador limpio */}
      <div className="hairline-card rounded-2xl p-5 bg-white space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setResPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#12232E] text-white'
                  : 'bg-[#FAF7F2] text-[#5C6B73] hover:text-[#12232E] border border-[#E5DDD0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleApplyFilters}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-2 border-t border-[#E5DDD0]/70"
        >
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Correo del viajero
            </label>
            <input
              type="text"
              value={clientEmailFilter}
              onChange={(e) => setClientEmailFilter(e.target.value)}
              placeholder="Ej. valeria.quispe@viajero.pe"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Código de reserva
            </label>
            <input
              type="text"
              value={reservationIdFilter}
              onChange={(e) => setReservationIdFilter(e.target.value)}
              placeholder="Ej. DMG-2026-004510"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Hotel aliado
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
              className="flex-1 py-2 px-3 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              aria-label="Limpiar filtros de reservas"
              title="Limpiar filtros"
              className="px-3 py-2 rounded-xl border border-[#D2C6B4] bg-[#FAF7F2] text-xs font-semibold text-[#5C6B73] hover:text-[#12232E] cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Confirmación de viaje completado */}
      {completeTarget && (
        <form
          onSubmit={handleConfirmComplete}
          className="rounded-2xl border border-[#B6DEC9] bg-[#E7F3EE]/80 p-5 space-y-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#15523F]">
                Finalizar reserva {completeTarget.reservationNumber}
              </h3>
              <p className="text-xs text-[#12232E] mt-0.5">
                Utiliza esta opción una vez que el tour y la estadía en el hotel aliado hayan
                concluido satisfactoriamente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompleteTarget(null);
                setCompleteConfirmedCheck(false);
              }}
              className="p-1 rounded-lg text-[#5C6B73] hover:text-[#12232E] cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-[#12232E] cursor-pointer">
            <input
              type="checkbox"
              checked={completeConfirmedCheck}
              onChange={(e) => setCompleteConfirmedCheck(e.target.checked)}
              className="accent-[#15523F] w-4 h-4"
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
              className="px-4 py-2 rounded-xl bg-[#15523F] hover:bg-[#0F3F30] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
            >
              {transitionBusy ? 'Guardando...' : 'Marcar Completada'}
            </button>
          </div>
        </form>
      )}

      {/* Cancelación administrativa con motivo obligatorio */}
      {cancelTarget && (
        <form
          onSubmit={handleConfirmCancel}
          className="rounded-2xl border border-[#EABCB3] bg-[#FBECE9]/80 p-5 space-y-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#8E2B17] inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Cancelar reserva confirmada {cancelTarget.reservationNumber}
              </h3>
              <p className="text-xs text-[#12232E] mt-0.5">
                Se liberarán los cupos del viaje y del hotel aliado, y se abrirá automáticamente la
                devolución total por <strong>{formatPen(cancelTarget.total)}</strong> sin penalidad.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason('');
              }}
              className="p-1 rounded-lg text-[#5C6B73] hover:text-[#12232E] cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8E2B17] mb-1">
              Motivo de la cancelación (se enviará al cliente)
            </label>
            <textarea
              rows={2}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Describe el motivo operativo o la solicitud del cliente..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EABCB3] bg-white text-xs"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={transitionBusy}
              className="px-4 py-2 rounded-xl bg-[#8E2B17] hover:bg-[#712111] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
            >
              {transitionBusy ? 'Cancelando...' : 'Confirmar Cancelación y Abrir Devolución'}
            </button>
          </div>
        </form>
      )}

      {/* Ficha de Detalle de Reserva */}
      {selectedDetail && (
        <div className="hairline-card rounded-2xl p-6 bg-white space-y-4 border-l-4 border-l-[#B84A27]">
          <div className="flex items-center justify-between border-b border-[#E5DDD0] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-[#12232E]">
                Reserva #{selectedDetail.reservationNumber}
              </span>
              <StatusPill status={selectedDetail.status} size="sm" />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs font-bold text-[#B84A27] hover:underline cursor-pointer"
            >
              Cerrar ficha
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#5C6B73] block">
                Viajero titular
              </span>
              <strong className="text-sm text-[#12232E] block">
                {selectedDetail.client.fullName ?? 'Cuenta cerrada por el usuario'}
              </strong>
              <span className="block text-[#5C6B73]">{selectedDetail.client.email ?? '—'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#5C6B73] block">
                Experiencia y fecha de viaje
              </span>
              <strong className="text-[#12232E] block">
                {selectedDetail.offerNameHint ?? 'Experiencia turística'}
              </strong>
              <span className="block text-[#5C6B73]">
                {selectedDetail.travelers}{' '}
                {selectedDetail.travelers === 1 ? 'viajero' : 'viajeros'} ·{' '}
                {selectedDetail.departure
                  ? `${formatLimaDateTime(selectedDetail.departure.startDate)} → ${formatLimaDate(selectedDetail.departure.endDate)}`
                  : 'Horario programado'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#5C6B73] block">
                Alojamiento e importe total
              </span>
              <strong className="text-sm text-[#12232E] block">
                {formatPen(selectedDetail.total)} PEN
              </strong>
              <span className="block text-[#1B5E4A] font-medium">
                {selectedDetail.lodging
                  ? `${selectedDetail.lodging.hotelName} · ${selectedDetail.lodging.roomTypeName} (${selectedDetail.lodging.nights} noche${selectedDetail.lodging.nights === 1 ? '' : 's'})`
                  : 'Solo experiencia turística (sin hotel)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabla Principal de Reservas */}
      <div className="hairline-card rounded-2xl bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#12232E]">
            Listado de reservas ({visibleReservations.length})
          </h2>
          <span className="text-[11px] text-[#5C6B73]">
            Las reservas en espera de pago se confirman automáticamente cuando Culqi procesa el cobro
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#5C6B73] border-b border-[#E5DDD0]">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Viajero</th>
                <th className="px-5 py-3">Experiencia y Hotel</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#5C6B73]">
                    No se encontraron reservas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                visibleReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-[#12232E]">
                      {res.reservationNumber}
                    </td>
                    <td className="px-5 py-4">
                      <strong className="text-[#12232E] block">
                        {res.client.fullName || 'Datos protegidos por baja'}
                      </strong>
                      <span className="text-[11px] text-[#5C6B73]">
                        {res.client.email || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-medium text-[#12232E] truncate">
                        {res.offerNameHint || 'Experiencia turística'}
                      </p>
                      <p className="text-[11px] text-[#1B5E4A] truncate">
                        {res.lodging ? res.lodging.hotelName : 'Sin alojamiento aliado'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={res.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums text-[#12232E]">
                      {formatPen(res.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleInspectDetail(res)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2C6B4] bg-white hover:border-[#12232E] text-[#12232E] font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver ficha
                        </button>

                        {res.status.toLowerCase() === 'pending' && (
                          <span className="text-[11px] text-[#855814] bg-[#FBF4E4] px-2.5 py-1 rounded-lg border border-[#E8D2A0] font-medium">
                            En espera de pago del cliente
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E7F3EE] hover:bg-[#D4EAE0] text-[#15523F] font-bold cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FBECE9] hover:bg-[#F5DAD4] text-[#8E2B17] font-bold cursor-pointer"
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
    </div>
  );
};

// ============================================================================
// SECCIÓN 3: DEVOLUCIONES Y REEMBOLSOS (/admin/devoluciones)
// ============================================================================

export const AdminRefundsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [refunds, setRefunds] = useState<RefundCaseDto[]>(sharedDemoRefunds);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadRefunds = async () => {
    if (apiOnline === false || isDemoSession) {
      setRefunds([...sharedDemoRefunds]);
      return;
    }
    try {
      const res = await adminApi.listRefundCases(1, 30);
      setRefunds(res.items);
    } catch (err) {
      notifyError(err, 'No se pudieron consultar las devoluciones');
    }
  };

  useEffect(() => {
    void loadRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession]);

  const handleAuthorizeRefund = async (rf: RefundCaseDto) => {
    if (apiOnline === false || isDemoSession || rf.id.startsWith('ref-')) {
      sharedDemoRefunds = sharedDemoRefunds.map((item) =>
        item.id === rf.id ? { ...item, status: 'authorized', version: item.version + 1 } : item
      );
      setRefunds([...sharedDemoRefunds]);
      notifySuccess(
        'Devolución autorizada',
        'La orden fue enviada a la pasarela; quedará ejecutada cuando el proveedor confirme el abono.'
      );
      return;
    }
    try {
      await adminApi.authorizeRefund(rf.id, rf.version);
      notifySuccess('Solicitud de devolución autorizada');
      await loadRefunds();
    } catch (err) {
      notifyError(err, 'No se pudo autorizar la devolución');
    }
  };

  const handleRetryRefund = async (rf: RefundCaseDto) => {
    if (apiOnline === false || isDemoSession || rf.id.startsWith('ref-')) {
      sharedDemoRefunds = sharedDemoRefunds.map((item) =>
        item.id === rf.id ? { ...item, status: 'executed', version: item.version + 1 } : item
      );
      setRefunds([...sharedDemoRefunds]);
      notifySuccess('Reembolso procesado y confirmado');
      return;
    }
    try {
      await adminApi.retryRefund(rf.id);
      notifySuccess('Reintento de reembolso enviado a la pasarela');
      await loadRefunds();
    } catch (err) {
      notifyError(err, 'No se pudo reintentar el reembolso');
    }
  };

  const openCount = refunds.filter((r) => r.status.toLowerCase() === 'open').length;
  const authorizedCount = refunds.filter((r) => r.status.toLowerCase() === 'authorized').length;
  const executedCount = refunds.filter((r) => r.status.toLowerCase() === 'executed').length;

  const visibleRefunds = refunds.filter((r) =>
    filterStatus === 'all' ? true : r.status.toLowerCase() === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Atención Financiera al Viajero</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Devoluciones y Reembolsos
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Revisa y autoriza las devoluciones generadas por cancelaciones previas al viaje. Una
            solicitud autorizada pasa a ejecutada cuando Culqi confirma el abono al cliente.
          </p>
        </div>

        <Link
          to="/admin/reservas"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2C6B4] bg-white hover:border-[#12232E] text-xs font-semibold text-[#12232E]"
        >
          Ver reservas
          <ArrowRight className="w-3.5 h-3.5 text-[#B84A27]" />
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="hairline-card rounded-2xl p-5 bg-white">
          <span className="text-xs font-medium text-[#5C6B73]">Por autorizar</span>
          <strong className="block font-editorial text-3xl text-[#855814] mt-1 tabular-nums">
            {openCount}
          </strong>
          <span className="text-[11px] text-[#5C6B73]">Atender dentro de 1 día hábil</span>
        </div>
        <div className="hairline-card rounded-2xl p-5 bg-white">
          <span className="text-xs font-medium text-[#5C6B73]">Autorizadas (en proceso)</span>
          <strong className="block font-editorial text-3xl text-[#1D4663] mt-1 tabular-nums">
            {authorizedCount}
          </strong>
          <span className="text-[11px] text-[#5C6B73]">Pendientes de confirmación bancaria</span>
        </div>
        <div className="hairline-card rounded-2xl p-5 bg-white">
          <span className="text-xs font-medium text-[#5C6B73]">Abonadas al cliente</span>
          <strong className="block font-editorial text-3xl text-[#15523F] mt-1 tabular-nums">
            {executedCount}
          </strong>
          <span className="text-[11px] text-[#5C6B73]">Reembolsos completados</span>
        </div>
      </div>

      {/* Filtro rápido */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { key: 'all', label: 'Todas las solicitudes' },
          { key: 'open', label: 'Por autorizar' },
          { key: 'authorized', label: 'Autorizadas' },
          { key: 'executed', label: 'Ejecutadas' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#12232E] text-white'
                : 'bg-white text-[#5C6B73] border border-[#E5DDD0] hover:text-[#12232E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listado limpio de casos de devolución */}
      <div className="hairline-card rounded-2xl bg-white divide-y divide-[#E5DDD0]">
        {visibleRefunds.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5C6B73]">
            No hay solicitudes de devolución en este estado.
          </div>
        ) : (
          visibleRefunds.map((rf) => {
            const st = rf.status.toLowerCase();
            const canAuthorize = st === 'open';
            const canRetry = st === 'authorized' || st === 'failed' || st === 'unknown';
            const reasonText =
              typeof rf.evidence?.reason === 'string'
                ? rf.evidence.reason
                : 'Cancelación elegible antes del inicio del servicio';

            return (
              <div
                key={rf.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <strong className="text-sm font-bold text-[#12232E]">
                      {formatPen(rf.amount)} {rf.currency}
                    </strong>
                    <StatusPill status={rf.status} size="sm" />
                    <span className="text-xs text-[#5C6B73]">· Caso {rf.id}</span>
                  </div>
                  <p className="text-xs text-[#12232E]">{reasonText}</p>
                  <p className="text-[11px] text-[#5C6B73]">
                    Pago asociado: {rf.paymentId} · Registrado el {formatLimaDateTime(rf.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canAuthorize && (
                    <button
                      type="button"
                      onClick={() => void handleAuthorizeRefund(rf)}
                      className="px-4 py-2 rounded-xl bg-[#12232E] hover:bg-[#B84A27] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Autorizar
                    </button>
                  )}
                  {canRetry && (
                    <button
                      type="button"
                      onClick={() => void handleRetryRefund(rf)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2C6B4] bg-[#FAF7F2] hover:border-[#12232E] text-xs font-bold text-[#12232E] cursor-pointer"
                      aria-label="Reintentar reembolso"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Confirmar / Reintentar envío
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 4: CORREOS Y AVISOS A CLIENTES (/admin/notificaciones)
// ============================================================================

export const AdminNotificationsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [incidents, setIncidents] = useState<NotificationIncidentDto[]>(sharedDemoIncidents);
  const [resendTarget, setResendTarget] = useState<NotificationIncidentDto | null>(null);
  const [resendReason, setResendReason] = useState('');

  const loadIncidents = async () => {
    if (apiOnline === false || isDemoSession) {
      setIncidents([...sharedDemoIncidents]);
      return;
    }
    try {
      const res = await adminApi.listNotificationIncidents(1, 25);
      setIncidents(res.items);
    } catch (err) {
      notifyError(err, 'No se pudo consultar la bandeja de notificaciones');
    }
  };

  useEffect(() => {
    void loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession]);

  const handleConfirmResendIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendTarget) return;
    const reasonText =
      resendReason.trim() || 'Reenvío manual desde el panel de administración';

    if (apiOnline === false || isDemoSession || resendTarget.id.startsWith('inc-')) {
      sharedDemoIncidents = sharedDemoIncidents.map((item) =>
        item.id === resendTarget.id ? { ...item, status: 'resolved' } : item
      );
      setIncidents([...sharedDemoIncidents]);
      notifySuccess('Correo reenviado correctamente al cliente');
      setResendTarget(null);
      setResendReason('');
      return;
    }
    try {
      await adminApi.resendNotificationDelivery(resendTarget.deliveryId, reasonText, 1);
      notifySuccess('Solicitud de reenvío puesta en cola');
      setResendTarget(null);
      setResendReason('');
      await loadIncidents();
    } catch (err) {
      notifyError(err, 'No se pudo reenviar la notificación');
    }
  };

  const pendingIncidents = incidents.filter((i) => i.status.toLowerCase() === 'open').length;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Comunicaciones con el Viajero</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Correos y Avisos Transaccionales
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Supervisa los correos de confirmación, comprobantes o avisos que presentaron alguna
            demora de entrega y vuelve a enviarlos con un clic.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DDD0] text-xs font-semibold text-[#12232E]">
          {pendingIncidents === 0 ? (
            <>
              <Sparkles className="w-4 h-4 text-[#1B5E4A]" />
              Todos los envíos al día
            </>
          ) : (
            <>
              <MailWarning className="w-4 h-4 text-[#B84A27]" />
              {pendingIncidents} {pendingIncidents === 1 ? 'envío pendiente' : 'envíos pendientes'}
            </>
          )}
        </div>
      </div>

      {resendTarget && (
        <form
          onSubmit={handleConfirmResendIncident}
          className="rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] p-5 space-y-3 text-xs"
        >
          <p className="font-bold text-[#7A4E0D] text-sm">
            Reenviar correo a {resendTarget.recipientMasked}
          </p>
          <input
            type="text"
            value={resendReason}
            onChange={(e) => setResendReason(e.target.value)}
            placeholder="Nota interna opcional (ej. Cliente solicitó copia de su confirmación)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8D2A0] bg-white text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white font-bold cursor-pointer"
            >
              Confirmar reenvío
            </button>
            <button
              type="button"
              onClick={() => setResendTarget(null)}
              className="px-4 py-2 rounded-xl border border-[#D2C6B4] bg-white text-[#5C6B73] font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="hairline-card rounded-2xl bg-white divide-y divide-[#E5DDD0]">
        {incidents.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <MailCheck className="w-8 h-8 text-[#1B5E4A] mx-auto" />
            <p className="text-sm font-bold text-[#12232E]">Sin incidencias de correo</p>
            <p className="text-xs text-[#5C6B73]">
              Todas las notificaciones recientes fueron entregadas sin inconvenientes.
            </p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <MailWarning className="w-4 h-4 text-[#B84A27]" />
                  <strong className="text-sm text-[#12232E]">{inc.recipientMasked}</strong>
                  <StatusPill status={inc.status} size="sm" />
                </div>
                <p className="text-xs text-[#5C6B73]">{inc.detail}</p>
                <p className="text-[11px] text-[#5C6B73]">
                  Registrado el {formatLimaDateTime(inc.createdAt)} · Entrega #{inc.deliveryId}
                </p>
              </div>

              {inc.status.toLowerCase() === 'open' && (
                <button
                  type="button"
                  onClick={() => {
                    setResendTarget(inc);
                    setResendReason('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reenviar correo
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
