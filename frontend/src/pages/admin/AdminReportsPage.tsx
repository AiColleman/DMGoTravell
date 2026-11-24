import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Hotel,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatLimaDateTime, formatPen } from '../../lib/format';
import type { ReportDetailDto, ReportRowDto } from '../../types/api';

const DEMO_REPORT: ReportDetailDto = {
  id: '00000000-0000-4000-8000-000000000901',
  referenceAt: '2026-11-24T08:30:00Z',
  status: 'completed',
  createdAt: '2026-11-24T08:30:00Z',
  expiresAt: '2026-11-25T08:30:00Z',
  rowsCount: 3,
  pdfStatus: 'ready',
  summary: {
    from: '2026-11-01',
    to: '2026-11-24',
    totalReservations: 148,
    pendingCount: 18,
    confirmedCount: 84,
    completedCount: 32,
    cancelledCount: 14,
    totalTravelers: 392,
    contractedTouristTotal: '74850.00',
    contractedLodgingTotal: '28640.00',
    contractedTotal: '103490.00',
    contractedCurrency: 'PEN',
    byOffer: [
      {
        offerId: 'o1',
        offerName: 'Paquete Ayacucho Místico 3D/2N',
        offerType: 'package',
        reservations: 42,
        travelers: 110,
        touristSubtotal: '38900.00',
        currency: 'PEN',
      },
      {
        offerId: 'o2',
        offerName: 'Aguas Turquesas de Millpu Full Day',
        offerType: 'tour',
        reservations: 58,
        travelers: 164,
        touristSubtotal: '19516.00',
        currency: 'PEN',
      },
      {
        offerId: 'o3',
        offerName: 'Paquete Cusco Imperial & Machu Picchu 4D/3N',
        offerType: 'package',
        reservations: 48,
        travelers: 118,
        touristSubtotal: '16434.00',
        currency: 'PEN',
      },
    ],
    byHotel: [
      {
        hotelId: 'h1',
        hotelName: 'Hotel Boutique Santa Rosa de Huamanga',
        reservations: 34,
        lodgingSubtotal: '16320.00',
        currency: 'PEN',
      },
      {
        hotelId: 'h2',
        hotelName: 'Andean Sanctuary Lodge Urubamba',
        reservations: 19,
        lodgingSubtotal: '12320.00',
        currency: 'PEN',
      },
    ],
    financialMovements: [
      {
        currency: 'PEN',
        confirmedPayments: '91220.00',
        executedRefunds: '3410.00',
        netDifference: '87810.00',
        paymentCount: 112,
        refundCount: 4,
      },
    ],
  },
};

const DEMO_ROWS: ReportRowDto[] = [
  {
    reservationId: 'r1',
    reservationNumber: 'RES-2026-004821',
    status: 'confirmed',
    offerName: 'Paquete Ayacucho Místico 3D/2N',
    hotelName: 'Hotel Boutique Santa Rosa de Huamanga',
    travelers: 2,
    touristSubtotal: '1180.00',
    lodgingSubtotal: '480.00',
    total: '1660.00',
    currency: 'PEN',
    createdAt: '2026-11-24T07:15:00Z',
  },
  {
    reservationId: 'r2',
    reservationNumber: 'RES-2026-004818',
    status: 'completed',
    offerName: 'Aguas Turquesas de Millpu Full Day',
    hotelName: null,
    travelers: 4,
    touristSubtotal: '476.00',
    lodgingSubtotal: '0.00',
    total: '476.00',
    currency: 'PEN',
    createdAt: '2026-11-23T14:20:00Z',
  },
  {
    reservationId: 'r3',
    reservationNumber: 'RES-2026-004810',
    status: 'pending',
    offerName: 'Santuario Inca de Vilcashuamán',
    hotelName: null,
    travelers: 2,
    touristSubtotal: '270.00',
    lodgingSubtotal: '0.00',
    total: '270.00',
    currency: 'PEN',
    createdAt: '2026-11-23T11:05:00Z',
  },
];

export const AdminReportsPage: React.FC = () => {
  const { apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 8)}01`;

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [offerIdFilter, setOfferIdFilter] = useState('');
  const [hotelIdFilter, setHotelIdFilter] = useState('');

  const [report, setReport] = useState<ReportDetailDto | null>(null);
  const [rows, setRows] = useState<ReportRowDto[]>([]);
  const [rowsPage, setRowsPage] = useState(1);
  const [rowsTotal, setRowsTotal] = useState(0);
  const [rowsHasNext, setRowsHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const generateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fromDate > toDate) {
      notifyError(new Error('El rango de fechas del reporte está invertido.'));
      return;
    }

    if (apiOnline === false) {
      setReport(DEMO_REPORT);
      setRows(DEMO_ROWS);
      setRowsTotal(DEMO_ROWS.length);
      setRowsHasNext(false);
      return;
    }

    setLoading(true);
    try {
      const accepted = await adminApi.createReport({
        from: fromDate,
        to: toDate,
        status: statusFilter || undefined,
        offerId: offerIdFilter.trim() || undefined,
        hotelId: hotelIdFilter.trim() || undefined,
      });

      const [detail, rowPage] = await Promise.all([
        adminApi.getReport(accepted.id),
        adminApi.getReportRows(accepted.id, 1, 10),
      ]);

      setReport(detail);
      setRows(rowPage.items);
      setRowsPage(1);
      setRowsTotal(rowPage.total);
      setRowsHasNext(rowPage.hasNext);
      notifySuccess(
        'Snapshot de reporte capturado',
        `Referencia congelada con ${detail.rowsCount} filas sin datos personales de contacto.`
      );
    } catch (err) {
      notifyError(err, 'No se pudo generar el reporte administrativo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowsPageChange = async (nextPage: number) => {
    if (!report || apiOnline === false) return;
    try {
      const rowPage = await adminApi.getReportRows(report.id, nextPage, 10);
      setRows(rowPage.items);
      setRowsPage(nextPage);
      setRowsTotal(rowPage.total);
      setRowsHasNext(rowPage.hasNext);
    } catch (err) {
      notifyError(err, 'Error al paginar filas del reporte');
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    if (apiOnline === false) {
      notifySuccess(
        'Modo demostrativo',
        'Con DMGoTravel.Api activa se genera y descarga el archivo PDF binario oficial.'
      );
      return;
    }

    setDownloadingPdf(true);
    try {
      await adminApi.requestReportPdf(report.id);
      const { blob, fileName } = await adminApi.downloadReportPdf(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const refreshed = await adminApi.getReport(report.id);
      setReport(refreshed);
      notifySuccess('PDF Oficial descargado', `Archivo ${fileName} generado desde el snapshot.`);
    } catch (err) {
      notifyError(err, 'No se pudo descargar el PDF del reporte');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const summary = report?.summary;

  return (
    <div className="space-y-7">
      {/* Barra de Captura Durable de Reporte (Spec 011) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D95D39]">
              <BarChart3 className="w-3.5 h-3.5" />
              Indicadores Oficiales y Exportación PDF (Spec 011)
            </span>
            <h2 className="font-headline font-extrabold text-2xl text-[#0B3B5B] mt-1">
              Captura Coherente Operativa y Financiera
            </h2>
            {report && (
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                Snapshot <code className="font-mono">{report.id.slice(0, 8)}</code> · Referencia:{' '}
                <strong>{formatLimaDateTime(report.referenceAt)}</strong> · Expira:{' '}
                {formatLimaDateTime(report.expiresAt)} · Filas capturadas:{' '}
                <strong>{report.rowsCount}</strong>
              </p>
            )}
          </div>

          {report && (
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf
                ? 'Generando PDF...'
                : `Descargar Reporte PDF Completo (${report.pdfStatus})`}
            </button>
          )}
        </div>

        <form
          onSubmit={generateReport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Desde (YYYY-MM-DD)
            </label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Hasta (YYYY-MM-DD)
            </label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Estado reserva
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              UUID Oferta (opcional)
            </label>
            <input
              type="text"
              value={offerIdFilter}
              onChange={(e) => setOfferIdFilter(e.target.value)}
              placeholder="Todos los tours/paquetes"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              UUID Hotel (opcional)
            </label>
            <input
              type="text"
              value={hotelIdFilter}
              onChange={(e) => setHotelIdFilter(e.target.value)}
              placeholder="Todos los hoteles"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Capturar Snapshot
            </button>
          </div>
        </form>
      </section>

      {summary && (
        <>
          {/* BLOQUE 1: Indicadores Operativos de Reservas Creadas */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reservas en Período
              </span>
              <p className="font-headline font-extrabold text-3xl text-[#0B3B5B] tabular-nums">
                {summary.totalReservations}
              </p>
              <div className="flex flex-wrap gap-1 text-[10px] font-semibold tabular-nums">
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                  {summary.pendingCount} pend.
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#146C53]">
                  {summary.confirmedCount} conf.
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#0B3B5B]">
                  {summary.completedCount} comp.
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {summary.cancelledCount} canc.
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#D95D39]" />
                Viajeros Registrados
              </span>
              <p className="font-headline font-extrabold text-3xl text-slate-900 tabular-nums">
                {summary.totalTravelers}
              </p>
              <p className="text-[11px] text-slate-500">Suma de viajeros en snapshots</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Subtotal Turístico
              </span>
              <p className="font-headline font-extrabold text-2xl text-slate-900 tabular-nums">
                {formatPen(summary.contractedTouristTotal)}
              </p>
              <p className="text-[11px] text-slate-500">Snapshots turísticos ({summary.contractedCurrency})</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Subtotal Alojamiento
              </span>
              <p className="font-headline font-extrabold text-2xl text-slate-900 tabular-nums">
                {formatPen(summary.contractedLodgingTotal)}
              </p>
              <p className="text-[11px] text-slate-500">Snapshots hoteleros ({summary.contractedCurrency})</p>
            </div>

            <div className="bg-[#0B3B5B] text-white rounded-2xl p-5 space-y-2 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                Total Contratado
              </span>
              <p className="font-headline font-extrabold text-2xl text-white tabular-nums">
                {formatPen(summary.contractedTotal)}
              </p>
              <p className="text-[11px] text-sky-200">Importe histórico consolidado</p>
            </div>
          </section>

          {/* BLOQUE 2: Movimientos Financieros Reales Confirmados (Spec 011 / RF-18) */}
          <section className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#146C53]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Bloque Financiero Independiente (RF-18 / RF-22)
                </span>
                <h3 className="font-headline font-bold text-lg text-slate-900">
                  Cobros Reales Confirmados vs. Devoluciones Ejecutadas en el Período
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Calculado por fecha efectiva de cobro/ejecución en Culqi
              </span>
            </div>

            {summary.financialMovements.length === 0 ? (
              <p className="text-xs text-slate-500">
                Sin movimientos financieros liquidados en el rango consultado.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.financialMovements.map((mov) => (
                  <React.Fragment key={mov.currency}>
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <p className="text-[11px] font-bold uppercase text-[#146C53]">
                        Cobros Confirmados ({mov.currency})
                      </p>
                      <p className="font-headline font-extrabold text-2xl text-[#146C53] tabular-nums mt-1">
                        {formatPen(mov.confirmedPayments)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                        {mov.paymentCount} transacciones aprobadas
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                      <p className="text-[11px] font-bold uppercase text-rose-700">
                        Devoluciones Ejecutadas ({mov.currency})
                      </p>
                      <p className="font-headline font-extrabold text-2xl text-rose-700 tabular-nums mt-1">
                        - {formatPen(mov.executedRefunds)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                        {mov.refundCount} casos ejecutados
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 text-white">
                      <p className="text-[11px] font-bold uppercase text-emerald-300">
                        Diferencia Neta Efectiva ({mov.currency})
                      </p>
                      <p className="font-headline font-extrabold text-2xl text-white tabular-nums mt-1">
                        {formatPen(mov.netDifference)}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">Flujo neto verificado</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          {/* Desglose por Oferta y por Hotel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-headline font-bold text-base text-slate-900 inline-flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#0B3B5B]" />
                Desglose por Oferta Turística
              </h3>
              <div className="space-y-3">
                {summary.byOffer.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin reservas en el período.</p>
                ) : (
                  summary.byOffer.map((o) => (
                    <div
                      key={o.offerId}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{o.offerName}</p>
                        <p className="text-slate-500 tabular-nums mt-0.5">
                          Tipo: <span className="uppercase font-semibold">{o.offerType}</span> ·{' '}
                          {o.reservations} reservas · {o.travelers} viajeros
                        </p>
                      </div>
                      <span className="font-headline font-extrabold text-sm text-[#0B3B5B] tabular-nums shrink-0">
                        {formatPen(o.touristSubtotal)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-headline font-bold text-base text-slate-900 inline-flex items-center gap-2">
                <Hotel className="w-4 h-4 text-[#146C53]" />
                Desglose por Hotel Aliado
              </h3>
              <div className="space-y-3">
                {summary.byHotel.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Sin alojamiento contratado en el período.
                  </p>
                ) : (
                  summary.byHotel.map((h) => (
                    <div
                      key={h.hotelId}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{h.hotelName}</p>
                        <p className="text-slate-500 tabular-nums mt-0.5">
                          {h.reservations} reservas compuestas con hospedaje
                        </p>
                      </div>
                      <span className="font-headline font-extrabold text-sm text-[#146C53] tabular-nums shrink-0">
                        {formatPen(h.lodgingSubtotal)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Tabla de Filas Capturadas sin PII (DEC-204) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-headline font-bold text-base text-slate-900 inline-flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0B3B5B]" />
                Filas del Reporte Capturado
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#146C53]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Privacidad DEC-204: omite correos y teléfonos personales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-4">Nº Reserva</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Oferta</th>
                    <th className="py-3 pr-4">Hotel Opcional</th>
                    <th className="py-3 pr-4">Viajeros</th>
                    <th className="py-3 pr-4">Total PEN</th>
                    <th className="py-3">Creación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.reservationId} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-4 font-bold text-[#0B3B5B] tabular-nums">
                        {r.reservationNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-800">{r.offerName}</td>
                      <td className="py-3 pr-4 text-slate-600">{r.hotelName ?? '—'}</td>
                      <td className="py-3 pr-4 tabular-nums">{r.travelers}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900 tabular-nums">
                        {formatPen(r.total)}
                      </td>
                      <td className="py-3 text-slate-500 tabular-nums">
                        {formatLimaDateTime(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={rowsPage}
              pageSize={10}
              total={rowsTotal}
              hasNext={rowsHasNext}
              onPageChange={(p) => void handleRowsPageChange(p)}
            />
          </section>
        </>
      )}
    </div>
  );
};
