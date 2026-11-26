import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { authApi, profileApi, reservationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canCustomerCancel, formatLimaDateTime, formatPen } from '../lib/format';
import type { ClosureBlockerDto, ProfileDto, ReservationDto } from '../types/api';
import {
  CountdownPill,
  PaginationControls,
  SectionEyebrow,
  StatusPill,
} from '../components/ui/EditorialPrimitives';

export const TravelerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    apiOnline,
    isDemoSession,
    demoReservations,
    upsertDemoReservation,
    updateLocalUser,
    clearSessionLocally,
  } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Spec 001 RF-99 & RF-100: validar parámetro de página sin sustituir automáticamente páginas inválidas
  const rawPageParam = searchParams.get('page');
  const isInvalidPageParam =
    rawPageParam !== null &&
    (!/^\d+$/.test(rawPageParam.trim()) || Number.parseInt(rawPageParam.trim(), 10) < 1);
  const parsedInitialPage =
    !isInvalidPageParam && rawPageParam ? Number.parseInt(rawPageParam.trim(), 10) : 1;

  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(parsedInitialPage);
  const [totalReservations, setTotalReservations] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingRes, setLoadingRes] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [profileVersion, setProfileVersion] = useState<number | undefined>(1);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [emailRequested, setEmailRequested] = useState(false);

  const [confirmClosure, setConfirmClosure] = useState(false);
  const [blockers, setBlockers] = useState<ClosureBlockerDto[]>([]);

  const loadReservations = async (targetPage: number) => {
    if (isInvalidPageParam) {
      setReservations([]);
      setLoadingRes(false);
      return;
    }
    setLoadingRes(true);
    try {
      if (apiOnline === false || isDemoSession) {
        const sliceStart = (targetPage - 1) * 10;
        const pageItems = demoReservations.slice(sliceStart, sliceStart + 10);
        setReservations(pageItems);
        setTotalReservations(demoReservations.length);
        setHasNext(sliceStart + 10 < demoReservations.length);
      } else {
        const res = await reservationsApi.listMine(targetPage, 10);
        setReservations(res.items);
        setTotalReservations(res.total);
        setHasNext(res.hasNext);
      }
    } catch {
      const sliceStart = (targetPage - 1) * 10;
      setReservations(demoReservations.slice(sliceStart, sliceStart + 10));
      setTotalReservations(demoReservations.length);
      setHasNext(sliceStart + 10 < demoReservations.length);
    } finally {
      setLoadingRes(false);
    }
  };

  const loadProfile = async () => {
    if (apiOnline === false || isDemoSession) {
      const demoProf: ProfileDto = {
        id: user?.id ?? 'demo-client-01',
        email: user?.email ?? 'valeria.quispe@viajero.pe',
        fullName: user?.fullName ?? 'Valeria Quispe Mendoza',
        phone: '+51 987 654 321',
        emailVerified: true,
      };
      setProfile(demoProf);
      setProfileVersion(1);
      setFullName(demoProf.fullName);
      setPhone(demoProf.phone ?? '');
      return;
    }

    try {
      const res = await profileApi.getProfile();
      setProfile(res.data);
      setProfileVersion(res.etagVersion);
      setFullName(res.data.fullName);
      setPhone(res.data.phone ?? '');
    } catch {
      // fallback silencioso
    }
  };

  useEffect(() => {
    void loadReservations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, demoReservations, apiOnline, isDemoSession]);

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession]);

  const handleCancelReservation = async (res: ReservationDto) => {
    if (!canCustomerCancel(res.status)) return;

    if (res.id.startsWith('demo-') || apiOnline === false || isDemoSession) {
      upsertDemoReservation({ ...res, status: 'cancelled', version: res.version + 1 });
      notifySuccess(`Reserva ${res.reservationNumber} cancelada`);
      return;
    }

    setCancellingId(res.id);
    try {
      await reservationsApi.cancel(res.id, res.version);
      notifySuccess(`Reserva ${res.reservationNumber} cancelada`, 'Cupos liberados.');
      await loadReservations(page);
    } catch (err) {
      notifyError(err, 'No se pudo cancelar la reserva');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      updateLocalUser({ fullName: fullName.trim() });
      setProfileVersion((v) => (v ?? 1) + 1);
      notifySuccess('Perfil actualizado en tu sesión');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await profileApi.updateProfile(
        { fullName: fullName.trim(), phone: phone.trim() || null },
        profileVersion
      );
      setProfile(res.data);
      setProfileVersion(res.etagVersion);
      updateLocalUser({ fullName: res.data.fullName });
      notifySuccess('Perfil actualizado', `ETag v${res.etagVersion ?? 1}`);
    } catch (err) {
      notifyError(err, 'Error al guardar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      setEmailRequested(true);
      notifySuccess('Solicitud simulada', 'Ingresa cualquier código para probar confirmación.');
      return;
    }
    try {
      await profileApi.requestEmailChange(newEmail.trim(), currentPassword || undefined);
      setEmailRequested(true);
      notifySuccess('Enlace enviado al nuevo correo');
      await loadProfile();
    } catch (err) {
      notifyError(err, 'No se pudo solicitar el cambio de correo');
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      updateLocalUser({ email: newEmail.trim() || user?.email });
      setEmailRequested(false);
      notifySuccess('Correo actualizado en vista previa');
      return;
    }
    try {
      await profileApi.confirmEmailChange(emailToken.trim());
      notifySuccess('Correo confirmado', 'Inicia sesión con tu nuevo correo.');
      clearSessionLocally();
      navigate('/acceso?mode=login');
    } catch (err) {
      notifyError(err, 'Token inválido');
    }
  };

  const handleClosure = async () => {
    setBlockers([]);
    if (apiOnline === false || isDemoSession) {
      const activeRes = reservations.filter(
        (r) => r.status === 'pending' || r.status === 'confirmed'
      );
      if (activeRes.length > 0) {
        setBlockers(
          activeRes.map((r) => ({
            type: 'Reservation',
            reference: r.reservationNumber,
            status: r.status,
          }))
        );
        notifyError(
          new Error('Mantienes reservas activas que impiden cerrar la cuenta (RN-30).'),
          'Baja bloqueada'
        );
        return;
      }
      clearSessionLocally();
      notifySuccess('Baja lógica aplicada en vista previa');
      navigate('/');
      return;
    }

    try {
      await profileApi.requestClosure(confirmClosure);
      notifySuccess('Baja lógica ejecutada (RN-30)');
      clearSessionLocally();
      navigate('/');
    } catch (err) {
      if (err instanceof ProblemDetailsError && err.problem.blockers?.length) {
        setBlockers(err.problem.blockers);
      }
      notifyError(err, 'No se pudo ejecutar la baja de cuenta');
    }
  };

  const filteredReservations = statusFilter
    ? reservations.filter((r) => r.status.toLowerCase() === statusFilter)
    : reservations;

  const kpis = [
    { label: 'Reservas registradas', value: reservations.length },
    {
      label: 'Confirmadas',
      value: reservations.filter((r) => r.status.toLowerCase() === 'confirmed').length,
    },
    {
      label: 'Pendientes de pago',
      value: reservations.filter((r) => r.status.toLowerCase() === 'pending').length,
    },
    {
      label: 'Completadas',
      value: reservations.filter((r) => r.status.toLowerCase() === 'completed').length,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Cabecera Editorial del Viajero */}
      <div className="pb-8 border-b border-[#E5DDD0] flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <SectionEyebrow>Espacio Personal del Viajero · Specs 001 &amp; 008</SectionEyebrow>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#12232E]">
            Hola, {user?.fullName?.split(' ')[0] ?? 'Viajero'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73]">
            Consulta el estado de tus experiencias y administra tus datos protegidos con{' '}
            <span className="font-mono">ETag / If-Match</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold transition-colors"
          >
            Tours Turísticos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/paquetes"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold transition-colors"
          >
            Paquetes Turísticos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="hairline-card rounded-2xl p-5">
            <span className="text-[11px] font-semibold text-[#5C6B73]">{k.label}</span>
            <strong className="block font-editorial text-4xl font-medium text-[#12232E] mt-2 tabular-nums">
              {k.value}
            </strong>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mis Reservas */}
        <section className="lg:col-span-8 space-y-5">
          <div className="hairline-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5DDD0]">
              <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
                Mis Reservas
              </h2>
              <select
                aria-label="Filtrar por estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes de pago</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            {isInvalidPageParam ? (
              <div className="py-12 text-center space-y-3 rounded-2xl bg-[#FBECE9]/60 border border-[#EABCB3] p-6">
                <p className="font-editorial text-2xl text-[#8E2B17]">
                  Número de página no válido
                </p>
                <p className="text-xs text-[#5C6B73]">
                  El parámetro de página solicitado no es válido; no se sustituye automáticamente por otra página (Spec 001 · RF-99, RF-100).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', '1');
                    setSearchParams(next);
                    setPage(1);
                  }}
                  className="inline-block px-4 py-2 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
                >
                  Ir explícitamente a la página 1
                </button>
              </div>
            ) : loadingRes ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-[#F3EDE2] animate-pulse" />
                ))}
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="font-editorial text-2xl text-[#12232E]">
                  {page > 1 && !statusFilter
                    ? 'No hay reservas en esta página'
                    : statusFilter
                      ? 'No tienes reservas en este estado'
                      : 'Aún no tienes reservas registradas'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/tours"
                    className="inline-block px-4 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
                  >
                    Ver Tours Turísticos
                  </Link>
                  <Link
                    to="/paquetes"
                    className="inline-block px-4 py-2.5 rounded-xl bg-[#B84A27] text-white text-xs font-bold"
                  >
                    Ver Paquetes Turísticos
                  </Link>
                </div>
                {page > 1 && (
                  <PaginationControls
                    page={page}
                    pageSize={10}
                    total={totalReservations}
                    hasNext={hasNext}
                    onPageChange={(nextPage) => {
                      const next = new URLSearchParams(searchParams);
                      next.set('page', String(nextPage));
                      setSearchParams(next);
                      setPage(nextPage);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map((res) => {
                  const isPending = canCustomerCancel(res.status);
                  const isConfirmed = res.status.toLowerCase() === 'confirmed';

                  return (
                    <article
                      key={res.id}
                      className="rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-[#12232E]">
                            #{res.reservationNumber}
                          </span>
                          <StatusPill status={res.status} size="sm" />
                          <span className="font-mono text-[10px] text-[#5C6B73]">
                            ETag v{res.version}
                          </span>
                        </div>

                        {isPending && <CountdownPill deadlineIso={res.paymentDeadlineAt} />}
                      </div>

                      {res.offerNameHint && (
                        <h3 className="font-editorial text-xl font-medium text-[#12232E]">
                          {res.offerNameHint}
                        </h3>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Salida programada
                          </span>
                          <span className="font-semibold text-[#12232E] inline-flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-[#B84A27]" />
                            {res.departure
                              ? formatLimaDateTime(res.departure.startDate)
                              : 'Registrada en snapshot'}
                          </span>
                          <span className="block text-[#5C6B73] mt-0.5">
                            {res.travelers} {res.travelers === 1 ? 'viajero' : 'viajeros'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Alojamiento opcional
                          </span>
                          {res.lodging ? (
                            <span className="font-semibold text-[#1B5E4A] inline-flex items-center gap-1.5 mt-0.5">
                              <Hotel className="w-3.5 h-3.5 shrink-0" />
                              {res.lodging.hotelName} ({res.lodging.nights}n)
                            </span>
                          ) : (
                            <span className="text-[#5C6B73] mt-0.5 block">
                              Solo experiencia turística
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E5DDD0] flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#5C6B73] block">
                            Importe Oficial
                          </span>
                          <strong className="font-editorial text-2xl font-semibold text-[#12232E] tabular-nums">
                            {formatPen(res.total)}
                          </strong>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <>
                              <Link
                                to={`/checkout/${res.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pagar ahora
                              </Link>
                              <button
                                type="button"
                                disabled={cancellingId === res.id}
                                onClick={() => void handleCancelReservation(res)}
                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#EABCB3] bg-white text-[#8E2B17] text-xs font-bold cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            </>
                          )}
                          {isConfirmed && (
                            <Link
                              to={`/checkout/${res.id}`}
                              className="px-4 py-2 rounded-xl bg-[#12232E] text-white text-xs font-bold"
                            >
                              Ver comprobante
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

                <PaginationControls
                  page={page}
                  pageSize={10}
                  total={totalReservations}
                  hasNext={hasNext}
                  onPageChange={(nextPage) => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', String(nextPage));
                    setSearchParams(next);
                    setPage(nextPage);
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Perfil, Cambio de Correo y Baja Lógica */}
        <aside
          id="perfil"
          className={`lg:col-span-4 space-y-6 ${
            searchParams.get('section') === 'perfil' ? 'ring-2 ring-[#C89B54] rounded-2xl' : ''
          }`}
        >
          <div className="hairline-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#B84A27]" />
                Datos Personales
              </h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F3EDE2] text-[#5C6B73]">
                ETag v{profileVersion ?? 1}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
                  Correo verificado
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-xs">
                  <span className="truncate">{profile?.email ?? user?.email}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#1B5E4A] shrink-0" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Guardando...' : 'Guardar con If-Match'}
              </button>
            </form>
          </div>

          <div className="hairline-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#B84A27]" />
              Cambio Seguro de Correo
            </h3>

            <form onSubmit={handleEmailChangeRequest} className="space-y-2.5">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nuevo correo electrónico"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl border border-[#D2C6B4] text-xs font-bold text-[#12232E] hover:border-[#B84A27] cursor-pointer"
              >
                Solicitar enlace de cambio
              </button>
            </form>

            {(emailRequested || profile?.pendingEmailChange) && (
              <form onSubmit={handleConfirmEmailChange} className="pt-3 border-t border-[#E5DDD0] space-y-2">
                <input
                  type="text"
                  required
                  value={emailToken}
                  onChange={(e) => setEmailToken(e.target.value)}
                  placeholder="Token de confirmación"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#1B5E4A] text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar nuevo correo
                </button>
              </form>
            )}
          </div>

          <div className="hairline-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-[#B84A27]">G</span>
              Identidad Google OAuth 2.0 / OIDC (ADR-009)
            </h3>
            <p className="text-[11px] text-[#5C6B73] leading-relaxed">
              Vincula tu identidad de Google sin duplicar cuentas por correo electrónico (HU-05).
            </p>
            <a
              href={authApi.getGoogleStartUrl('/cuenta?section=perfil')}
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#D2C6B4] bg-[#FAF7F2] hover:border-[#12232E] text-xs font-bold text-[#12232E] flex items-center justify-center gap-2 transition-colors"
            >
              Vincular con Google OAuth 2.0
            </a>
          </div>

          <div className="rounded-2xl border border-[#EABCB3] bg-[#FFFCF8] p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E2B17] inline-flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Baja Lógica de Cuenta (RN-30)
            </h3>
            <p className="text-[11px] text-[#5C6B73] leading-relaxed">
              Revoca sesiones activas y protege tus datos personales conservando la trazabilidad
              histórica exigida por normativa.
            </p>

            {blockers.length > 0 && (
              <div className="p-3 rounded-xl bg-[#FBECE9] border border-[#EABCB3] text-[11px] text-[#8E2B17] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Bloqueos activos detectados:
                </p>
                <ul className="list-disc pl-4">
                  {blockers.map((b, idx) => (
                    <li key={idx}>
                      {b.type}: <strong>{b.reference}</strong> ({b.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="flex items-start gap-2 text-[11px] text-[#12232E] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmClosure}
                onChange={(e) => setConfirmClosure(e.target.checked)}
                className="mt-0.5 accent-[#B84A27]"
              />
              <span>Confirmo que deseo solicitar la baja lógica de mi cuenta.</span>
            </label>

            <button
              type="button"
              disabled={!confirmClosure}
              onClick={() => void handleClosure()}
              className="w-full py-2.5 rounded-xl border border-[#EABCB3] text-[#8E2B17] hover:bg-[#FBECE9] disabled:opacity-40 text-xs font-bold cursor-pointer"
            >
              Solicitar baja lógica
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
