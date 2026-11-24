import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Hotel,
  Mail,
  Save,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { ProblemDetailsError } from '../api/httpClient';
import { profileApi, reservationsApi } from '../api/services';
import { CountdownBadge } from '../components/ui/CountdownBadge';
import { PaginationBar } from '../components/ui/PaginationBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatLimaDateTime, formatPen } from '../lib/format';
import type { ClosureBlockerDto, ProfileDto, ReservationDto } from '../types/api';

const DEMO_RESERVATIONS: ReservationDto[] = [
  {
    id: 'demo-res-4821',
    reservationNumber: 'RES-2026-004821',
    status: 'pending',
    travelers: 2,
    total: '1660.00',
    currency: 'PEN',
    paymentDeadlineAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    validationDeadlineAt: new Date(Date.now() + 17 * 60 * 1000).toISOString(),
    version: 1,
    departure: {
      id: 'dep-1',
      startDate: '2026-12-18T12:00:00Z',
      endDate: '2026-12-20T23:00:00Z',
      price: '590.00',
      currency: 'PEN',
    },
    lodging: {
      hotelName: 'Hotel Boutique Santa Rosa de Huamanga',
      roomTypeName: 'Suite Matrimonial / Doble Superior',
      capacity: 2,
      checkInDate: '2026-12-18',
      checkOutDate: '2026-12-20',
      nights: 2,
      nightlyRate: '240.00',
      subtotal: '480.00',
      currency: 'PEN',
    },
  },
  {
    id: 'demo-res-4510',
    reservationNumber: 'RES-2026-004510',
    status: 'confirmed',
    travelers: 3,
    total: '405.00',
    currency: 'PEN',
    paymentDeadlineAt: '2026-11-20T15:00:00Z',
    validationDeadlineAt: '2026-11-20T15:05:00Z',
    version: 2,
    departure: {
      id: 'dep-2',
      startDate: '2026-12-28T11:00:00Z',
      endDate: '2026-12-28T23:00:00Z',
      price: '135.00',
      currency: 'PEN',
    },
    lodging: null,
  },
];

export const ClientPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, apiOnline, updateLocalUser, clearSessionLocally } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Historial de Reservas (Spec 001)
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Perfil, Cambio de Correo y Baja Lógica (Spec 008)
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [profileVersion, setProfileVersion] = useState<number | undefined>(undefined);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailChangeToken, setEmailChangeToken] = useState('');
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  const [confirmClosure, setConfirmClosure] = useState(false);
  const [closureBlockers, setClosureBlockers] = useState<ClosureBlockerDto[]>([]);

  const loadReservations = async (targetPage: number) => {
    setLoadingReservations(true);
    try {
      const res = await reservationsApi.listMine(targetPage, 10);
      setReservations(res.items);
      setTotalReservations(res.total);
      setHasNext(res.hasNext);
    } catch {
      if (apiOnline === false) {
        setReservations(DEMO_RESERVATIONS);
        setTotalReservations(DEMO_RESERVATIONS.length);
        setHasNext(false);
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await profileApi.getProfile();
      setProfile(res.data);
      setProfileVersion(res.etagVersion);
      setFullName(res.data.fullName);
      setPhone(res.data.phone ?? '');
    } catch {
      if (apiOnline === false) {
        const fallbackProfile: ProfileDto = {
          id: 'demo-user',
          email: 'valeria.mendoza@correo.pe',
          fullName: 'Valeria Mendoza Quispe',
          phone: '+51987654321',
          emailVerified: true,
        };
        setProfile(fallbackProfile);
        setProfileVersion(1);
        setFullName(fallbackProfile.fullName);
        setPhone(fallbackProfile.phone ?? '');
      }
    }
  };

  useEffect(() => {
    void loadReservations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelReservation = async (res: ReservationDto) => {
    if (res.id.startsWith('demo-')) {
      setReservations((prev) =>
        prev.map((item) => (item.id === res.id ? { ...item, status: 'cancelled' } : item))
      );
      notifySuccess('Reserva cancelada', 'Cupos liberados correctamente.');
      return;
    }

    setCancellingId(res.id);
    try {
      await reservationsApi.cancel(res.id, res.version);
      notifySuccess(
        `Reserva ${res.reservationNumber} cancelada`,
        'Se liberaron tus cupos turísticos y alojamiento bloqueado.'
      );
      await loadReservations(page);
    } catch (err) {
      notifyError(err, 'No se pudo cancelar la reserva');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await profileApi.updateProfile(
        {
          fullName: fullName.trim(),
          phone: phone.trim() ? phone.trim() : null,
        },
        profileVersion
      );
      setProfile(res.data);
      setProfileVersion(res.etagVersion);
      updateLocalUser({ fullName: res.data.fullName });
      notifySuccess('Perfil actualizado', `Datos guardados (ETag v${res.etagVersion ?? 1}).`);
    } catch (err) {
      notifyError(err, 'No se pudo actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileApi.requestEmailChange(newEmail.trim(), currentPassword || undefined);
      setEmailChangeRequested(true);
      notifySuccess(
        'Solicitud de cambio de correo registrada',
        'Confirma el token enviado al nuevo correo para hacer efectivo el cambio.'
      );
      await loadProfile();
    } catch (err) {
      notifyError(err, 'No se pudo iniciar el cambio de correo');
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileApi.confirmEmailChange(emailChangeToken.trim());
      notifySuccess(
        'Correo actualizado exitosamente',
        'Por seguridad se renovó la versión de seguridad de tu cuenta. Inicia sesión con tu nuevo correo.'
      );
      clearSessionLocally();
      navigate('/acceso?mode=login');
    } catch (err) {
      notifyError(err, 'Token de confirmación inválido');
    }
  };

  const handleDevFetchEmailToken = async () => {
    const target = newEmail.trim() || profile?.pendingEmailChange?.newEmail;
    if (!target) return;
    try {
      const { token } = await profileApi.devGetEmailChangeToken(target);
      setEmailChangeToken(token);
      notifySuccess('Token Dev obtenido', 'Haz clic en Confirmar Nuevo Correo.');
    } catch (err) {
      notifyError(err, 'No hay token local para ese destino');
    }
  };

  const handleAccountClosure = async () => {
    setClosureBlockers([]);
    try {
      await profileApi.requestClosure(confirmClosure);
      notifySuccess(
        'Baja lógica ejecutada',
        'Tu cuenta fue cerrada conservando las referencias históricas legales y financieras.'
      );
      clearSessionLocally();
      navigate('/');
    } catch (err) {
      if (err instanceof ProblemDetailsError && err.problem.blockers?.length) {
        setClosureBlockers(err.problem.blockers);
      }
      notifyError(err, 'No se puede cerrar la cuenta en este momento');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-[#0B3B5B]">
            Portal del Viajero · Mis Reservas y Perfil
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consulta únicamente tus propias reservas (RN-25) y administra tus datos autorizados con
            control de concurrencia ETag.
          </p>
        </div>

        <Link
          to="/catalogo?tab=tours"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold shadow-xs transition-colors"
        >
          Explorar Nuevas Salidas
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= COLUMNA IZQUIERDA (8 COLS): MIS RESERVAS ================= */}
        <section className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-headline font-bold text-lg text-slate-900">
                Historial de Mis Reservas
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                Total registradas: <strong>{totalReservations}</strong>
              </span>
            </div>

            {loadingReservations ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="font-headline font-bold text-base text-slate-900">
                  Aún no tienes reservas asociadas a tu cuenta
                </p>
                <p className="text-xs text-slate-500">
                  Explora nuestro catálogo de tours y paquetes para crear tu primera experiencia.
                </p>
                <Link
                  to="/catalogo"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
                >
                  Ir al Catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((res) => {
                  const isPending = res.status.toLowerCase() === 'pending';
                  const isConfirmed = res.status.toLowerCase() === 'confirmed';

                  return (
                    <article
                      key={res.id}
                      className="rounded-2xl border border-slate-200 p-5 hover:border-[#0B3B5B]/30 transition-all space-y-4 bg-[#F8FAFC]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-headline font-extrabold text-base text-[#0B3B5B] tabular-nums">
                            #{res.reservationNumber}
                          </span>
                          <StatusBadge status={res.status} size="sm" />
                          <span className="text-[11px] font-mono text-slate-400">
                            ETag v{res.version}
                          </span>
                        </div>

                        {isPending && <CountdownBadge deadlineIso={res.paymentDeadlineAt} />}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Salida Turística
                          </p>
                          <p className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#D95D39]" />
                            {res.departure
                              ? formatLimaDateTime(res.departure.startDate)
                              : 'Salida histórica registrada'}
                          </p>
                          <p className="text-slate-600 tabular-nums">
                            Viajeros: <strong>{res.travelers}</strong>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Alojamiento Opcional
                          </p>
                          {res.lodging ? (
                            <p className="font-semibold text-[#146C53] inline-flex items-center gap-1.5">
                              <Hotel className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {res.lodging.hotelName} · {res.lodging.roomTypeName} (
                                {res.lodging.nights}n)
                              </span>
                            </p>
                          ) : (
                            <p className="text-slate-500">Solo servicio turístico</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Importe Oficial ({res.currency})
                          </span>
                          <span className="font-headline font-extrabold text-xl text-[#0B3B5B] tabular-nums">
                            {formatPen(res.total)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <>
                              <Link
                                to={`/checkout/${res.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold shadow-xs transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pagar con Culqi / Yape
                              </Link>
                              <button
                                type="button"
                                disabled={cancellingId === res.id}
                                onClick={() => void handleCancelReservation(res)}
                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {cancellingId === res.id ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <Link
                              to={`/checkout/${res.id}`}
                              className="px-4 py-2 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
                            >
                              Ver Resumen Confirmado
                            </Link>
                          )}
                        </div>
                      </div>

                      {isConfirmed && (
                        <p className="text-[11px] text-slate-500">
                          Nota (RN-19 / RN-24): Una reserva ya confirmada no se cancela desde el
                          portal del cliente; cualquier gestión previa al viaje se tramita por
                          administración según política de devolución.
                        </p>
                      )}
                    </article>
                  );
                })}

                <PaginationBar
                  page={page}
                  pageSize={10}
                  total={totalReservations}
                  hasNext={hasNext}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </section>

        {/* ================= COLUMNA DERECHA (4 COLS): MI PERFIL Y SEGURIDAD (SPEC 008) ================= */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Datos Básicos Autorizados */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-base text-slate-900 inline-flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0B3B5B]" />
                Datos Personales
              </h3>
              {profileVersion !== undefined && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  ETag v{profileVersion}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Correo vigente
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="truncate">{profile?.email ?? user?.email}</span>
                  {(profile?.emailVerified ?? user?.emailVerified) ? (
                    <span className="inline-flex items-center gap-1 text-[#146C53] font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verificado
                    </span>
                  ) : (
                    <Link
                      to="/acceso?mode=verify"
                      className="text-amber-700 font-bold underline shrink-0"
                    >
                      Verificar
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0B3B5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Guardando...' : 'Guardar Cambios (If-Match)'}
              </button>
            </form>
          </div>

          {/* Cambio Seguro de Correo Electrónico */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-headline font-bold text-base text-slate-900 inline-flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D95D39]" />
              Cambio Seguro de Correo
            </h3>

            {profile?.pendingEmailChange && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                Solicitud pendiente hacia <strong>{profile.pendingEmailChange.newEmail}</strong>.
              </div>
            )}

            <form onSubmit={handleRequestEmailChange} className="space-y-3">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nuevo correo electrónico"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual para autorizar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
              >
                Solicitar enlace al nuevo correo
              </button>
            </form>

            {(emailChangeRequested || profile?.pendingEmailChange) && (
              <form onSubmit={handleConfirmEmailChange} className="pt-2 border-t border-slate-100 space-y-2.5">
                <input
                  type="text"
                  required
                  value={emailChangeToken}
                  onChange={(e) => setEmailChangeToken(e.target.value)}
                  placeholder="Token de confirmación de nuevo correo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#146C53] text-white text-xs font-bold cursor-pointer"
                  >
                    Confirmar Nuevo Correo
                  </button>
                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={() => void handleDevFetchEmailToken()}
                      className="px-3 py-2 rounded-xl bg-sky-100 text-[#0B3B5B] text-[11px] font-bold cursor-pointer"
                    >
                      Token Dev
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Solicitud de Baja Lógica de Cuenta (HU-13 / RN-30) */}
          <div className="bg-white rounded-2xl border border-rose-200 p-6 space-y-3.5 shadow-xs">
            <h3 className="font-headline font-bold text-sm text-rose-800 inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Privacidad y Baja Lógica de Cuenta
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Aplica borrado lógico (RN-30): desactiva el acceso e invalida todas las sesiones,
              conservando las reservas, pagos y auditoría histórica exigidos por ley.
            </p>

            {closureBlockers.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-[11px] text-rose-900">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Operaciones activas que impiden el cierre inmediato:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {closureBlockers.map((b, i) => (
                    <li key={i}>
                      {b.type}: <strong>{b.reference}</strong> ({b.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmClosure}
                onChange={(e) => setConfirmClosure(e.target.checked)}
                className="mt-0.5 accent-rose-600"
              />
              <span>Confirmo expresamente que deseo solicitar la baja lógica de mi cuenta.</span>
            </label>

            <button
              type="button"
              disabled={!confirmClosure}
              onClick={() => void handleAccountClosure()}
              className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer"
            >
              Solicitar Baja de Cuenta
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
