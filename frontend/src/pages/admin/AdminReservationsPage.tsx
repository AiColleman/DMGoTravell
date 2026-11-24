import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MailWarning,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatLimaDateTime, formatPen } from '../../lib/format';
import type {
  AdminReservationDto,
  NotificationIncidentDto,
  RefundCaseDto,
} from '../../types/api';

const DEMO_ADMIN_RESERVATIONS: AdminReservationDto[] = [
  {
    id: 'adm-r1',
    reservationNumber: 'RES-2026-004819',
    status: 'confirmed',
    travelers: 2,
    total: '1660.00',
    currency: 'PEN',
    paymentDeadlineAt: '2026-11-22T15:00:00Z',
    validationDeadlineAt: '2026-11-22T15:05:00Z',
    version: 2,
    client: {
      id: 'c1',
      fullName: 'Carlos Alberto Quispe',
      email: 'carlos.quispe@empresa.pe',
      status: 'active',
      reservationCount: 7,
      registeredAt: '2026-09-10T10:00:00Z',
    },
    departure: {
      id: 'd1',
      startDate: '2026-11-22T12:00:00Z',
      endDate: '2026-11-23T22:00:00Z',
      price: '590.00',
      currency: 'PEN',
    },
  },
  {
    id: 'adm-r2',
    reservationNumber: 'RES-2026-004830',
    status: 'pending',
    travelers: 2,
    total: '270.00',
    currency: 'PEN',
    paymentDeadlineAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    validationDeadlineAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    version: 1,
    client: {
      id: 'c2',
      fullName: 'Valeria Mendoza Quispe',
      email: 'valeria.mendoza@correo.pe',
      status: 'active',
      reservationCount: 4,
      registeredAt: '2026-10-05T10:00:00Z',
    },
  },
];

const DEMO_REFUNDS: RefundCaseDto[] = [
  {
    id: 'rfd-104',
    reservationId: 'adm-r9',
    paymentId: 'pay-99',
    amount: '380.00',
    currency: 'PEN',
    status: 'open',
    createdAt: '2026-11-24T06:00:00Z',
    updatedAt: '2026-11-24T06:00:00Z',
    evidence: { reason: 'late_payment_after_20m_cut' },
    version: 1,
  },
  {
    id: 'rfd-102',
    reservationId: 'adm-r8',
    paymentId: 'pay-88',
    amount: '690.00',
    currency: 'PEN',
    status: 'unknown',
    createdAt: '2026-11-23T18:00:00Z',
    updatedAt: '2026-11-23T18:10:00Z',
    evidence: { reason: 'admin_cancel' },
    version: 2,
  },
];

const DEMO_INCIDENTS: NotificationIncidentDto[] = [
  {
    id: 'inc-019',
    type: 'bounce',
    status: 'open',
    createdAt: '2026-11-24T07:40:00Z',
    deliveryId: 'deliv-019',
    recipientMasked: 'cl***@dominio.pe',
    detail: 'Rebote temporal SMTP reportado por webhook Svix / Resend.',
  },
];

export const AdminReservationsPage: React.FC = () => {
  const { apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Filtros de /api/v1/admin/reservations
  const [status, setStatus] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [reservationIdFilter, setReservationIdFilter] = useState('');
  const [page, setPage] = useState(1);

  const [reservations, setReservations] = useState<AdminReservationDto[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [refunds, setRefunds] = useState<RefundCaseDto[]>([]);
  const [incidents, setIncidents] = useState<NotificationIncidentDto[]>([]);
  const [cancelReasonModal, setCancelReasonModal] = useState<AdminReservationDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadAll = async (targetPage = page) => {
    if (apiOnline === false) {
      setReservations(DEMO_ADMIN_RESERVATIONS);
      setTotalReservations(DEMO_ADMIN_RESERVATIONS.length);
      setHasNext(false);
      setRefunds(DEMO_REFUNDS);
      setIncidents(DEMO_INCIDENTS);
      return;
    }

    try {
      const [resPage, refundPage, incidentPage] = await Promise.all([
        adminApi.listReservations({
          page: targetPage,
          pageSize: 10,
          status: status || undefined,
          clientEmail: clientEmail.trim() || undefined,
          reservationId: reservationIdFilter.trim() || undefined,
        }),
        adminApi.listRefundCases(1, 10),
        adminApi.listNotificationIncidents(1, 10),
      ]);

      setReservations(resPage.items);
      setTotalReservations(resPage.total);
      setHasNext(resPage.hasNext);
      setRefunds(refundPage.items);
      setIncidents(incidentPage.items);
    } catch (err) {
      notifyError(err, 'Error al consultar operaciones administrativas');
    }
  };

  useEffect(() => {
    void loadAll(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleComplete = async (res: AdminReservationDto) => {
    if (apiOnline === false) {
      setReservations((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, status: 'completed', version: r.version + 1 } : r))
      );
      notifySuccess('Reserva completada', `${res.reservationNumber} marcada como Completada.`);
      return;
    }

    try {
      await adminApi.completeReservation(res.id, res.version);
      notifySuccess('Servicio finalizado', `Reserva ${res.reservationNumber} pasó a Completada.`);
      await loadAll(page);
    } catch (err) {
      notifyError(err, 'No se pudo completar la reserva');
    }
  };

  const handleConfirmAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReasonModal) return;

    if (apiOnline === false) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelReasonModal.id
            ? { ...r, status: 'cancelled', cancellationReason: cancelReason }
            : r
        )
      );
      setCancelReasonModal(null);
      setCancelReason('');
      notifySuccess('Reserva cancelada por administración', 'Se registró obligación de devolución.');
      return;
    }

    try {
      await adminApi.cancelReservation(
        cancelReasonModal.id,
        cancelReason.trim(),
        cancelReasonModal.version
      );
      notifySuccess(
        'Cancelación administrativa aplicada',
        'Se liberó inventario y se registró en auditoría.'
      );
      setCancelReasonModal(null);
      setCancelReason('');
      await loadAll(page);
    } catch (err) {
      notifyError(err, 'No se pudo cancelar administrativamente la reserva');
    }
  };

  const handleAuthorizeRefund = async (refund: RefundCaseDto) => {
    if (apiOnline === false) {
      setRefunds((prev) =>
        prev.map((r) => (r.id === refund.id ? { ...r, status: 'executed' } : r))
      );
      notifySuccess('Devolución autorizada', 'Caso procesado con Culqi.');
      return;
    }

    try {
      await adminApi.authorizeRefund(refund.id, refund.version);
      notifySuccess('Devolución autorizada', 'Se envió la instrucción oficial de reembolso.');
      await loadAll(page);
    } catch (err) {
      notifyError(err, 'No se pudo autorizar la devolución');
    }
  };

  const handleRetryRefund = async (refund: RefundCaseDto) => {
    if (apiOnline === false) {
      notifySuccess('Reintento encolado', 'Se programó verificación del reembolso.');
      return;
    }
    try {
      await adminApi.retryRefund(refund.id);
      notifySuccess('Reintento solicitado', 'Caso de devolución en verificación.');
      await loadAll(page);
    } catch (err) {
      notifyError(err, 'No se pudo reintentar la devolución');
    }
  };

  const handleResendIncident = async (inc: NotificationIncidentDto) => {
    if (apiOnline === false) {
      notifySuccess('Reenvío manual admitido', `Nueva generación creada para ${inc.recipientMasked}.`);
      return;
    }
    try {
      await adminApi.resendNotificationDelivery(
        inc.deliveryId,
        'Reenvío manual desde consola de incidentes'
      );
      notifySuccess('Reenvío manual encolado', 'Se generó entrega manual auditada.');
      await loadAll(page);
    } catch (err) {
      notifyError(err, 'No se pudo reenviar la notificación');
    }
  };

  return (
    <div className="space-y-7">
      {/* Cinta de Regla Fundamental RN-14 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-headline font-bold">
            Regla Inquebrantable de Integridad Financiera (RN-14 · Spec 009)
          </p>
          <p className="mt-0.5 text-amber-900">
            La transición <code className="font-mono font-bold">pending → confirmed</code> ocurre
            únicamente tras validar un pago exitoso en Culqi. Ningún administrador puede confirmar
            manualmente una reserva sin pago verificado.
          </p>
        </div>
      </div>

      {/* Tabla Maestra de Reservas */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-xl text-[#0B3B5B]">
              Operación Administrativa de Reservas
            </h2>
            <p className="text-xs text-slate-500">
              Filtra por estado, correo de cliente o UUID de reserva y aplica transiciones válidas.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void loadAll(1);
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
          >
            <option value="">Todos los estados comerciales</option>
            <option value="pending">Pendiente (pending)</option>
            <option value="confirmed">Confirmada (confirmed)</option>
            <option value="completed">Completada (completed)</option>
            <option value="cancelled">Cancelada (cancelled)</option>
          </select>

          <input
            type="text"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Filtrar por correo del cliente..."
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
          />

          <input
            type="text"
            value={reservationIdFilter}
            onChange={(e) => setReservationIdFilter(e.target.value)}
            placeholder="UUID exacto de reserva..."
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
          />

          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Filtrar Reservas
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Nº Reserva</th>
                <th className="py-3 pr-4">Cliente</th>
                <th className="py-3 pr-4">Viajeros</th>
                <th className="py-3 pr-4">Importe PEN</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Versión</th>
                <th className="py-3 text-right">Transiciones Válidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r) => {
                const st = r.status.toLowerCase();
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4 font-bold text-[#0B3B5B] tabular-nums">
                      {r.reservationNumber}
                    </td>
                    <td className="py-3.5 pr-4">
                      {r.client.status === 'deleted' ? (
                        <span className="italic text-slate-400">
                          [Cuenta con baja lógica · {r.client.reservationCount} reservas]
                        </span>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-900">{r.client.fullName}</p>
                          <p className="text-[11px] text-slate-500">{r.client.email}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 tabular-nums">{r.travelers}</td>
                    <td className="py-3.5 pr-4 font-bold text-slate-900 tabular-nums">
                      {formatPen(r.total)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-slate-400">
                      ETag v{r.version}
                    </td>
                    <td className="py-3.5 text-right">
                      {st === 'confirmed' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleComplete(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#146C53] text-white font-bold text-[11px] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelReasonModal(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-[11px] cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </div>
                      ) : st === 'pending' ? (
                        <span className="text-[11px] text-slate-400">
                          Aguardando pago Culqi / Expiry Hangfire
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Estado terminal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          pageSize={10}
          total={totalReservations}
          hasNext={hasNext}
          onPageChange={setPage}
        />
      </section>

      {/* Paneles Inferiores: Devoluciones Culqi (Spec 002) e Incidentes Resend (Spec 004) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900">
              Casos de Devolución Manual Culqi
            </h3>
            <p className="text-xs text-slate-500">
              Cobros tardíos tras corte de 20 min, duplicados o cancelaciones administrativas.
            </p>
          </div>

          {refunds.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No existen casos de devolución abiertos.</p>
          ) : (
            <div className="space-y-3">
              {refunds.map((rf) => (
                <div
                  key={rf.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0B3B5B]">
                        #{rf.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={rf.status} size="sm" />
                    </div>
                    <p className="font-headline font-extrabold text-base text-slate-900 tabular-nums">
                      {formatPen(rf.amount)} {rf.currency}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Creado: {formatLimaDateTime(rf.createdAt)} · ETag v{rf.version}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rf.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => void handleAuthorizeRefund(rf)}
                        className="px-3.5 py-2 rounded-xl bg-[#D95D39] text-white font-bold text-xs cursor-pointer"
                      >
                        Autorizar Devolución
                      </button>
                    )}
                    {(rf.status === 'unknown' || rf.status === 'authorized') && (
                      <button
                        type="button"
                        onClick={() => void handleRetryRefund(rf)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reintentar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-headline font-bold text-lg text-slate-900 inline-flex items-center gap-2">
              <MailWarning className="w-4 h-4 text-[#D95D39]" />
              Incidentes de Notificación Resend
            </h3>
            <p className="text-xs text-slate-500">
              Supervisión de rebotes o fallos de entrega y reemisión manual auditada.
            </p>
          </div>

          {incidents.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              0 incidentes abiertos en envíos transaccionales.
            </p>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{inc.recipientMasked}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <p className="text-slate-600">{inc.detail}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatLimaDateTime(inc.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleResendIncident(inc)}
                    className="px-3.5 py-2 rounded-xl bg-[#0B3B5B] text-white font-bold text-xs cursor-pointer"
                  >
                    Reenviar Entrega
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Motivo Obligatorio para Cancelación Administrativa */}
      {cancelReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmAdminCancel}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <h3 className="font-headline font-bold text-lg text-slate-900">
              Cancelar Reserva #{cancelReasonModal.reservationNumber}
            </h3>
            <p className="text-xs text-slate-600">
              Ingresa el motivo operativo obligatorio. Esta acción liberará los recursos y abrirá el
              caso de devolución correspondiente.
            </p>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej. Cierre climático de carretera reportado por autoridad regional..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B3B5B]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelReasonModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Cancelación
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
