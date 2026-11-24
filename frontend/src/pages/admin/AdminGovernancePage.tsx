import React, { useEffect, useState } from 'react';
import {
  Download,
  FileDown,
  Lock,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatLimaDateTime } from '../../lib/format';
import type { AuditEntryDto, ClientSummaryDto, ExportJobDto } from '../../types/api';

const DEMO_CLIENTS: ClientSummaryDto[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    fullName: 'Valeria Mendoza Quispe',
    email: 'valeria.mendoza@correo.pe',
    phone: '+51987654321',
    emailVerified: true,
    status: 'active',
    reservationCount: 4,
    registeredAt: '2026-10-05T14:20:00Z',
  },
  {
    id: 'c19de402-91ab-4810-9c22-8f71a2001b99',
    status: 'deleted',
    reservationCount: 2,
  },
];

const DEMO_AUDIT: AuditEntryDto[] = [
  {
    id: 'aud-01',
    occurredAt: '2026-11-24T08:15:00Z',
    actor: 'system',
    entity: 'reservation',
    entityId: 'RES-2026-004790',
    action: 'reservation.auto_cancelled',
    result: 'success',
    correlationId: 'corr-7f92a1e4',
    summary: '{"fromStatus":"pending","toStatus":"cancelled","origin":"expiry"}',
  },
  {
    id: 'aud-02',
    occurredAt: '2026-11-24T07:50:12Z',
    actor: 'human',
    entity: 'payment',
    entityId: 'pay-99812',
    action: 'payment.start',
    result: 'success',
    correlationId: 'corr-3b810c22',
    summary: '{"method":"yape","amount":"1660.00","currency":"PEN","reservationStatus":"confirmed"}',
  },
];

export const AdminGovernancePage: React.FC = () => {
  const { apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Clientes (Spec 010)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [clientsPage, setClientsPage] = useState(1);
  const [clients, setClients] = useState<ClientSummaryDto[]>([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientsHasNext, setClientsHasNext] = useState(false);

  // Auditoría Inmutable (Spec 010)
  const [auditActor, setAuditActor] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditEntries, setAuditEntries] = useState<AuditEntryDto[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditHasNext, setAuditHasNext] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditEntryDto | null>(null);

  // Trabajos de Exportación CSV
  const [exportJobs, setExportJobs] = useState<ExportJobDto[]>([]);

  const loadClients = async (targetPage = clientsPage) => {
    if (apiOnline === false) {
      setClients(DEMO_CLIENTS);
      setClientsTotal(DEMO_CLIENTS.length);
      setClientsHasNext(false);
      return;
    }
    try {
      const res = await adminApi.listClients({
        page: targetPage,
        pageSize: 10,
        name: clientName.trim() || undefined,
        email: clientEmail.trim() || undefined,
        status: clientStatus || undefined,
      });
      setClients(res.items);
      setClientsTotal(res.total);
      setClientsHasNext(res.hasNext);
    } catch (err) {
      notifyError(err, 'No se pudo consultar el directorio de clientes');
    }
  };

  const loadAudit = async (targetPage = auditPage) => {
    if (apiOnline === false) {
      setAuditEntries(DEMO_AUDIT);
      setAuditTotal(DEMO_AUDIT.length);
      setAuditHasNext(false);
      setSelectedAudit(DEMO_AUDIT[0]);
      return;
    }
    try {
      const res = await adminApi.listAudit({
        page: targetPage,
        pageSize: 10,
        actor: auditActor || undefined,
        entity: auditEntity.trim() || undefined,
        action: auditAction.trim() || undefined,
      });
      setAuditEntries(res.items);
      setAuditTotal(res.total);
      setAuditHasNext(res.hasNext);
      if (res.items[0] && !selectedAudit) setSelectedAudit(res.items[0]);
    } catch (err) {
      notifyError(err, 'No se pudo consultar el registro de auditoría');
    }
  };

  useEffect(() => {
    void loadClients(clientsPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientsPage]);

  useEffect(() => {
    void loadAudit(auditPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditPage]);

  const handleExportCsv = async (kind: 'clients' | 'audit') => {
    if (apiOnline === false) {
      notifySuccess(
        'Modo demostrativo',
        'Con la API conectada se materializa el snapshot CSV UTF-8 y se habilita su descarga.'
      );
      return;
    }

    try {
      const accepted =
        kind === 'clients'
          ? await adminApi.createClientsExport({
              name: clientName.trim() || undefined,
              email: clientEmail.trim() || undefined,
              status: clientStatus || undefined,
            })
          : await adminApi.createAuditExport({
              actor: auditActor || undefined,
              entity: auditEntity.trim() || undefined,
              action: auditAction.trim() || undefined,
            });

      const job = await adminApi.getExportStatus(accepted.id);
      setExportJobs((prev) => [job, ...prev]);

      if (job.status === 'ready') {
        const { blob, fileName } = await adminApi.downloadExportCsv(job.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        notifySuccess('Exportación CSV descargada', `Archivo ${fileName} descargado con éxito.`);
      } else {
        notifySuccess('Captura CSV admitida', `Estado actual: ${job.status}`);
      }
    } catch (err) {
      notifyError(err, 'No se pudo generar la exportación CSV');
    }
  };

  return (
    <div className="space-y-7">
      {/* Trabajos recientes de exportación CSV */}
      {exportJobs.length > 0 && (
        <section className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-3 shadow-xs">
          <h3 className="font-headline font-bold text-sm text-[#146C53] inline-flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Capturas de Exportación CSV Generadas en esta Sesión
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 uppercase">{job.kind}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{job.id.slice(0, 12)}...</p>
                </div>
                <StatusBadge status={job.status} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECCIÓN 1: DIRECTORIO DE CLIENTES SOLO LECTURA ================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0B3B5B]">
              <Users className="w-3.5 h-3.5" />
              Consulta Estrictamente de Solo Lectura (Spec 010)
            </span>
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mt-1">
              Directorio de Clientes y Protección en Bajas Lógicas
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void handleExportCsv('clients')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Clientes CSV
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setClientsPage(1);
            void loadClients(1);
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <input
            type="text"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Correo..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <select
            value={clientStatus}
            onChange={(e) => setClientStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="deleted">Cerrada (Baja lógica)</option>
          </select>
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Consultar
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">UUID Público</th>
                <th className="py-3 pr-4">Nombre y Correo</th>
                <th className="py-3 pr-4">Teléfono</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3">Reservas Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => {
                const isClosed = c.status === 'deleted' || c.status === 'closed';
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-slate-600">
                      {c.id.slice(0, 13)}...
                    </td>
                    <td className="py-3.5 pr-4">
                      {isClosed ? (
                        <span className="italic text-slate-400">
                          [Datos personales ocultos por baja lógica · DEC-162]
                        </span>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900">{c.fullName}</p>
                          <p className="text-[11px] text-slate-500">{c.email}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 tabular-nums text-slate-600">
                      {isClosed ? '—' : c.phone || '—'}
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 font-bold text-[#0B3B5B] tabular-nums">
                      {c.reservationCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={clientsPage}
          pageSize={10}
          total={clientsTotal}
          hasNext={clientsHasNext}
          onPageChange={setClientsPage}
        />
      </section>

      {/* ================= SECCIÓN 2: EXPLORADOR DE AUDITORÍA INMUTABLE ================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#146C53]">
              <Lock className="w-3.5 h-3.5" />
              Conservación Indefinida · Sin UPDATE ni DELETE (RN-29)
            </span>
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mt-1">
              Registro Inmutable de Auditoría de Operaciones Críticas
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void handleExportCsv('audit')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Auditoría CSV
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAuditPage(1);
            void loadAudit(1);
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <select
            value={auditActor}
            onChange={(e) => setAuditActor(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="">Todos los actores</option>
            <option value="human">Humano (human)</option>
            <option value="system">Sistema / Hangfire (system)</option>
          </select>
          <input
            type="text"
            value={auditEntity}
            onChange={(e) => setAuditEntity(e.target.value)}
            placeholder="Entidad (reservation, payment, offer...)"
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <input
            type="text"
            value={auditAction}
            onChange={(e) => setAuditAction(e.target.value)}
            placeholder="Acción (ej. reservation.auto_cancelled)"
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
          />
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
          >
            Filtrar Asientos
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-3">Fecha Hecho</th>
                  <th className="py-3 pr-3">Actor</th>
                  <th className="py-3 pr-3">Acción</th>
                  <th className="py-3 pr-3">Entidad</th>
                  <th className="py-3">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedAudit(entry)}
                    className={`cursor-pointer transition-colors ${
                      selectedAudit?.id === entry.id ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 pr-3 tabular-nums text-slate-600">
                      {formatLimaDateTime(entry.occurredAt)}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">{entry.actor}</td>
                    <td className="py-3 pr-3 font-mono font-bold text-[#0B3B5B]">
                      {entry.action}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {entry.entity} · <span className="font-mono">{entry.entityId.slice(0, 10)}</span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={entry.result} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PaginationBar
              page={auditPage}
              pageSize={10}
              total={auditTotal}
              hasNext={auditHasNext}
              onPageChange={setAuditPage}
            />
          </div>

          {/* Inspector lateral de registro sanitizado */}
          <div className="lg:col-span-4 bg-[#091E32] text-slate-200 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-headline font-bold text-white">
                Evidencia Sanitizada del Asiento
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            {selectedAudit ? (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-400">
                  CorrelationId:{' '}
                  <code className="text-sky-300">{selectedAudit.correlationId ?? 'n/a'}</code>
                </p>
                <pre className="p-3 rounded-xl bg-black/35 border border-white/10 text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                  {selectedAudit.summary || '{ "info": "Sin detalle adicional" }'}
                </pre>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Lista blanca activa: prohibido persistir contraseñas, JWT, refresh tokens, enlaces
                  de verificación o PAN/CVV.
                </p>
              </div>
            ) : (
              <p className="text-slate-400">Selecciona una fila para inspeccionar sus cambios.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
