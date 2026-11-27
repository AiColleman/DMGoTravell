import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  CreditCard,
  Hotel,
  Layers,
  Mail,
  MailCheck,
  PlusCircle,
  Save,
  ShieldAlert,
  TicketCheck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { ProblemDetailsError } from '../api/httpClient';
import { authApi, profileApi, reservationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  canCustomerCancel,
  formatLimaDate,
  formatLimaDateTime,
  formatPen,
} from '../lib/format';
import type { ClosureBlockerDto, ProfileDto, ReservationDto } from '../types/api';
import {
  CountdownPill,
  PaginationControls,
  SectionEyebrow,
  StatusPill,
} from '../components/ui/EditorialPrimitives';

type TravelerSection = 'reservas' | 'nueva-reserva' | 'perfil';

function resolveSection(raw: string | null): TravelerSection {
  if (raw === 'nueva-reserva') return 'nueva-reserva';
  if (raw === 'perfil') return 'perfil';
  return 'reservas';
}

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

  const activeSection = resolveSection(searchParams.get('section'));

  const setActiveSection = (section: TravelerSection) => {
    const next = new URLSearchParams(searchParams);
    if (section === 'reservas') {
      next.delete('section');
    } else {
      next.set('section', section);
    }
    setSearchParams(next);
  };

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

  const [showClosurePanel, setShowClosurePanel] = useState(false);
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
        const enriched = await Promise.all(
          res.items.map(async (item) => {
            if (item.departure) return item;
            try {
              const full = await reservationsApi.getById(item.id);
              return {
                ...item,
                departure: full.departure ?? item.departure,
                offerNameHint: full.offerNameHint ?? item.offerNameHint,
              };
            } catch {
              return item;
            }
          })
        );
        setReservations(enriched);
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
      notifySuccess(`Reserva ${res.reservationNumber} cancelada`, 'Tus cupos fueron liberados.');
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
      notifySuccess('Datos de contacto actualizados');
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
      notifySuccess('Datos actualizados', 'Tu información de viajero se guardó correctamente.');
    } catch (err) {
      notifyError(err, 'Error al guardar tus datos');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      setEmailRequested(true);
      notifySuccess('Enlace simulado enviado', 'Ingresa cualquier código para probar confirmación.');
      return;
    }
    try {
      await profileApi.requestEmailChange(newEmail.trim(), currentPassword || undefined);
      setEmailRequested(true);
      notifySuccess('Enlace enviado a tu nuevo correo');
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
      notifyError(err, 'Código inválido o vencido');
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
            type: 'Reserva activa',
            reference: r.reservationNumber,
            status: r.status,
          }))
        );
        notifyError(
          new Error('Tienes reservas pendientes o confirmadas en curso.'),
          'No es posible cerrar la cuenta aún'
        );
        return;
      }
      clearSessionLocally();
      notifySuccess('Cuenta cerrada correctamente');
      navigate('/');
      return;
    }

    try {
      await profileApi.requestClosure(confirmClosure);
      notifySuccess('Tu cuenta ha sido cerrada correctamente');
      clearSessionLocally();
      navigate('/');
    } catch (err) {
      if (err instanceof ProblemDetailsError && err.problem.blockers?.length) {
        setBlockers(err.problem.blockers);
      }
      notifyError(err, 'No se pudo cerrar la cuenta');
    }
  };

  const pendingCount = reservations.filter((r) => r.status.toLowerCase() === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status.toLowerCase() === 'confirmed').length;
  const completedCount = reservations.filter((r) => r.status.toLowerCase() === 'completed').length;

  const filteredReservations = statusFilter
    ? reservations.filter((r) => r.status.toLowerCase() === statusFilter)
    : reservations;

  const travelerEmail = profile?.email ?? user?.email ?? '';
  const firstName = (profile?.fullName ?? user?.fullName ?? 'Viajero').trim().split(' ')[0];

  const kpis = [
    {
      id: '',
      label: 'Total de reservas',
      value: totalReservations || reservations.length,
      hint: 'Historial completo',
      accent: 'text-[#12232E]',
    },
    {
      id: 'confirmed',
      label: 'Confirmadas',
      value: confirmedCount,
      hint: 'Listas para viajar',
      accent: 'text-[#1B5E4A]',
    },
    {
      id: 'pending',
      label: 'Pendientes de pago',
      value: pendingCount,
      hint: pendingCount > 0 ? 'Requieren pago' : 'Al día',
      accent: pendingCount > 0 ? 'text-[#B84A27]' : 'text-[#12232E]',
    },
    {
      id: 'completed',
      label: 'Finalizadas',
      value: completedCount,
      hint: 'Viajes concluidos',
      accent: 'text-[#12232E]',
    },
  ];

  const filterChips = [
    { value: '', label: 'Todas' },
    { value: 'pending', label: 'Pendientes de pago' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'completed', label: 'Finalizadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Cabecera limpia y profesional del Panel de Usuario */}
      <div className="rounded-3xl bg-[#FFFCF8] border border-[#E5DDD0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <SectionEyebrow>Panel del Viajero</SectionEyebrow>
            <h1 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
              Hola, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6B73] max-w-xl">
              Gestiona tus reservas activas, descarga tus comprobantes o inicia una nueva reserva en
              pocos pasos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold shadow-xs transition-colors"
            >
              Reservar Tour
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/paquetes"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold transition-colors"
            >
              Reservar Paquete
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Navegación por secciones del Panel de Usuario */}
        <div
          role="tablist"
          aria-label="Secciones del panel de usuario"
          className="pt-5 border-t border-[#E5DDD0] flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'reservas'}
            onClick={() => setActiveSection('reservas')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'reservas'
                ? 'bg-[#12232E] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#5C6B73] hover:text-[#12232E] border border-[#E5DDD0]'
            }`}
          >
            <TicketCheck className="w-4 h-4 text-[#C89B54]" />
            Mis Reservas
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                activeSection === 'reservas'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#E5DDD0]/70 text-[#12232E]'
              }`}
            >
              {totalReservations || reservations.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'nueva-reserva'}
            onClick={() => setActiveSection('nueva-reserva')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'nueva-reserva'
                ? 'bg-[#12232E] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#5C6B73] hover:text-[#12232E] border border-[#E5DDD0]'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#B84A27]" />
            Nueva Reserva
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'perfil'}
            onClick={() => setActiveSection('perfil')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'perfil'
                ? 'bg-[#12232E] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#5C6B73] hover:text-[#12232E] border border-[#E5DDD0]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#1B5E4A]" />
            Datos de Contacto
          </button>
        </div>
      </div>

      {/* ================= SECCIÓN 1: MIS RESERVAS ================= */}
      {activeSection === 'reservas' && (
        <div className="space-y-6">
          {/* Indicadores interactivos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => {
              const isSelected = statusFilter === k.id;
              return (
                <button
                  key={k.label}
                  type="button"
                  onClick={() => setStatusFilter(k.id)}
                  className={`text-left hairline-card rounded-2xl p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-[#B84A27] bg-[#FFFCF8]'
                      : 'hover:border-[#C89B54]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-[#5C6B73] block">{k.label}</span>
                  <strong
                    className={`block font-editorial text-4xl font-medium mt-1.5 tabular-nums ${k.accent}`}
                  >
                    {k.value}
                  </strong>
                  <span className="text-[11px] text-[#5C6B73] mt-1 block">{k.hint}</span>
                </button>
              );
            })}
          </div>

          {pendingCount > 0 && (
            <div className="rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-[#6B4A14]">
                <Clock className="w-4 h-4 text-[#B84A27] shrink-0" />
                <span>
                  Tienes <strong>{pendingCount}</strong>{' '}
                  {pendingCount === 1 ? 'reserva pendiente de pago' : 'reservas pendientes de pago'}.
                  Complétala antes de que venza el tiempo de retención de cupos.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className="px-3.5 py-1.5 rounded-xl bg-[#B84A27] text-white text-xs font-bold cursor-pointer"
              >
                Ver pendientes
              </button>
            </div>
          )}

          {/* Listado principal limpio de Mis Reservas */}
          <section className="hairline-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DDD0]">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
                  Mis Reservas
                </h2>
                <p className="text-xs text-[#5C6B73] mt-0.5">
                  Consulta tus fechas de salida, hoteles incluidos y comprobantes de pago.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5DDD0]">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.value || 'all'}
                      type="button"
                      onClick={() => setStatusFilter(chip.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        statusFilter === chip.value
                          ? 'bg-[#12232E] text-white'
                          : 'text-[#5C6B73] hover:text-[#12232E]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Filtrar por estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="md:sr-only px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendientes de pago</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Finalizadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>

            {isInvalidPageParam ? (
              <div className="py-12 text-center space-y-3 rounded-2xl bg-[#FBECE9]/60 border border-[#EABCB3] p-6">
                <p className="font-editorial text-2xl text-[#8E2B17]">
                  Número de página no válido
                </p>
                <p className="text-xs text-[#5C6B73]">
                   La página solicitada no existe. Vuelve a la primera página para revisar tus reservas.
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
                  Ir a la página 1
                </button>
              </div>
            ) : loadingRes ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 rounded-2xl bg-[#F3EDE2] animate-pulse" />
                ))}
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="py-14 text-center space-y-4 rounded-2xl bg-[#FAF7F2] border border-dashed border-[#D8CCBA] px-6">
                <p className="font-editorial text-2xl text-[#12232E]">
                  {page > 1 && !statusFilter
                    ? 'No hay reservas en esta página'
                    : statusFilter
                      ? 'No tienes reservas en este estado'
                      : 'Aún no tienes reservas registradas'}
                </p>
                <p className="text-xs text-[#5C6B73] max-w-md mx-auto">
                  Explora nuestros tours diarios, paquetes multi-día y hoteles aliados en Ayacucho,
                  Cusco y Arequipa para programar tu próximo viaje.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <Link
                    to="/tours"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B84A27] text-white text-xs font-bold"
                  >
                    Explorar Tours Turísticos
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/paquetes"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
                  >
                    Explorar Paquetes
                    <ArrowRight className="w-3.5 h-3.5" />
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
                  const statusLower = res.status.toLowerCase();
                  const isPending = canCustomerCancel(res.status);
                  const isConfirmed = statusLower === 'confirmed';
                  const isCompleted = statusLower === 'completed';

                  return (
                    <article
                      key={res.id}
                      className="rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#D2C6B4] transition-colors p-5 sm:p-6 space-y-5"
                    >
                      {/* Encabezado limpio sin etiquetas técnicas */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] text-[#12232E]">
                              #{res.reservationNumber}
                            </span>
                            <StatusPill status={res.status} size="sm" />
                          </div>
                          <h3 className="font-editorial text-xl sm:text-2xl font-medium text-[#12232E] pt-1">
                            {res.offerNameHint || 'Experiencia turística DM GO TRAVEL'}
                          </h3>
                        </div>

                        {isPending && <CountdownPill deadlineIso={res.paymentDeadlineAt} />}
                      </div>

                      {/* Detalles claros en 3 bloques */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                        <div className="rounded-xl bg-[#FFFCF8] border border-[#E5DDD0]/80 p-3.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Fecha y hora de salida
                          </span>
                          <span className="font-semibold text-[#12232E] inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
                            {res.departure
                              ? formatLimaDateTime(res.departure.startDate)
                              : 'Horario confirmado en tu resumen'}
                          </span>
                          <span className="text-[#5C6B73] inline-flex items-center gap-1.5 pt-0.5">
                            <Users className="w-3.5 h-3.5 text-[#5C6B73]" />
                            {res.travelers} {res.travelers === 1 ? 'viajero' : 'viajeros'}
                          </span>
                        </div>

                        <div className="rounded-xl bg-[#FFFCF8] border border-[#E5DDD0]/80 p-3.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Alojamiento aliado
                          </span>
                          {res.lodging ? (
                            <>
                              <span className="font-semibold text-[#1B5E4A] inline-flex items-center gap-1.5">
                                <Hotel className="w-3.5 h-3.5 shrink-0" />
                                {res.lodging.hotelName}
                              </span>
                              <span className="block text-[#5C6B73]">
                                {res.lodging.roomTypeName} · {res.lodging.nights}{' '}
                                {res.lodging.nights === 1 ? 'noche' : 'noches'} (
                                {formatLimaDate(res.lodging.checkInDate)} →{' '}
                                {formatLimaDate(res.lodging.checkOutDate)})
                              </span>
                            </>
                          ) : (
                            <span className="text-[#5C6B73] block pt-0.5">
                              Solo experiencia turística (sin hotel adicional)
                            </span>
                          )}
                        </div>

                        <div className="rounded-xl bg-[#FFFCF8] border border-[#E5DDD0]/80 p-3.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Notificación por correo
                          </span>
                          <span className="font-semibold text-[#12232E] inline-flex items-center gap-1.5">
                            <MailCheck className="w-3.5 h-3.5 text-[#1B5E4A] shrink-0" />
                            {isConfirmed
                              ? 'Confirmación enviada'
                              : isCompleted
                                ? 'Cierre de viaje enviado'
                                : isPending
                                  ? 'Aviso de reserva enviado'
                                  : 'Estado actualizado'}
                          </span>
                          {travelerEmail && (
                            <span className="block text-[#5C6B73] truncate" title={travelerEmail}>
                              {travelerEmail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pie de tarjeta con importe oficial y acciones claras */}
                      <div className="pt-4 border-t border-[#E5DDD0] flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] block">
                            Importe total (PEN)
                          </span>
                          <strong className="font-editorial text-2xl sm:text-3xl font-semibold text-[#12232E] tabular-nums">
                            {formatPen(res.total)}
                          </strong>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {isPending && (
                            <>
                              <Link
                                to={`/checkout/${res.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold shadow-xs transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pagar ahora
                              </Link>
                              <button
                                type="button"
                                disabled={cancellingId === res.id}
                                onClick={() => void handleCancelReservation(res)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EABCB3] bg-white hover:bg-[#FBECE9] text-[#8E2B17] text-xs font-bold cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {cancellingId === res.id ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            </>
                          )}
                          {(isConfirmed || isCompleted) && (
                            <Link
                              to={`/checkout/${res.id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold transition-colors"
                            >
                              Ver comprobante
                              <ArrowRight className="w-3.5 h-3.5" />
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
          </section>
        </div>
      )}

      {/* ================= SECCIÓN 2: NUEVA RESERVA RÁPIDA ================= */}
      {activeSection === 'nueva-reserva' && (
        <section className="space-y-6">
          <div className="hairline-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <SectionEyebrow>Planifica en pocos pasos</SectionEyebrow>
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
                ¿Qué deseas reservar hoy?
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6B73]">
                Selecciona el tipo de experiencia, elige una salida con cupos disponibles y añade
                opcionalmente un hotel aliado en una sola orden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link
                to="/tours"
                className="group rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#B84A27] hover:bg-[#FFFCF8] p-6 space-y-4 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#F7EAE4] text-[#B84A27] flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl font-medium text-[#12232E] group-hover:text-[#B84A27] transition-colors">
                    Tours Turísticos
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed">
                    Salidas guiadas de 1 día con calendario interactivo de disponibilidad y cupos en
                    tiempo real.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B84A27]">
                  Ver fechas y reservar
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                to="/paquetes"
                className="group rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#12232E] hover:bg-[#FFFCF8] p-6 space-y-4 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#E8EEF2] text-[#12232E] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl font-medium text-[#12232E]">
                    Paquetes Multi-Día
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed">
                    Circuitos completos de varios días por Ayacucho, Cusco y Arequipa listos para
                    combinar con estadía.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#12232E]">
                  Explorar paquetes
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                to="/hoteles"
                className="group rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#1B5E4A] hover:bg-[#FFFCF8] p-6 space-y-4 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#E7F3EE] text-[#1B5E4A] flex items-center justify-center">
                  <Hotel className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl font-medium text-[#12232E] group-hover:text-[#1B5E4A] transition-colors">
                    Hoteles Aliados
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed">
                    Consulta las habitaciones, ubicaciones y tarifas por noche de nuestros 9 hoteles
                    aliados en Ayacucho.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E4A]">
                  Consultar hoteles
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <strong className="text-[#12232E] block">1. Elige fecha y viajeros</strong>
                <span className="text-[#5C6B73]">
                  Selecciona la salida programada con cupos disponibles para tu grupo.
                </span>
              </div>
              <div>
                <strong className="text-[#12232E] block">2. Suma hotel aliado (opcional)</strong>
                <span className="text-[#5C6B73]">
                  Agrega habitación verificada o mantén únicamente la experiencia turística.
                </span>
              </div>
              <div>
                <strong className="text-[#12232E] block">3. Confirma con Tarjeta o Yape</strong>
                <span className="text-[#5C6B73]">
                  Tus cupos se reservan por 15 minutos mientras completas el pago en Soles (PEN).
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= SECCIÓN 3: DATOS DE CONTACTO Y CUENTA ================= */}
      {activeSection === 'perfil' && (
        <section id="perfil" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Datos principales del viajero */}
          <div className="lg:col-span-7 hairline-card rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1 pb-4 border-b border-[#E5DDD0]">
              <h2 className="font-editorial text-2xl font-medium text-[#12232E] inline-flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#B84A27]" />
                Datos del Viajero Titular
              </h2>
              <p className="text-xs text-[#5C6B73]">
                Usamos estos datos para enviarte tus comprobantes y coordinar el recojo en tus
                experiencias reservadas.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1.5">
                  Correo electrónico verificado
                </label>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-xs font-medium text-[#12232E]">
                  <span className="truncate">{travelerEmail}</span>
                  <span className="inline-flex items-center gap-1 text-[#1B5E4A] font-semibold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Verificado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6B73] mb-1.5">
                    Teléfono / WhatsApp de contacto
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 999 999 999"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Acceso con Google + Cambio de correo + Opciones avanzadas discretas */}
          <div className="lg:col-span-5 space-y-5">
            <div className="hairline-card rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#B84A27]">G</span>
                Inicio Rápido con Google
              </h3>
              <p className="text-xs text-[#5C6B73] leading-relaxed">
                Vincula tu cuenta de Google para ingresar con un solo clic usando tu mismo correo.
              </p>
              <a
                href={authApi.getGoogleStartUrl('/cuenta?section=perfil')}
                className="w-full py-2.5 px-4 rounded-xl border border-[#D2C6B4] bg-[#FAF7F2] hover:border-[#12232E] text-xs font-bold text-[#12232E] flex items-center justify-center gap-2 transition-colors"
              >
                Vincular con Google
              </a>
            </div>

            <div className="hairline-card rounded-3xl p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#12232E] inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#B84A27]" />
                  Actualizar Correo Electrónico
                </h3>
                <p className="text-xs text-[#5C6B73]">
                  Enviaremos un enlace de confirmación a tu nueva dirección antes de aplicar el
                  cambio.
                </p>
              </div>

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
                  placeholder="Contraseña actual (si aplica)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl border border-[#D2C6B4] text-xs font-bold text-[#12232E] hover:border-[#B84A27] cursor-pointer transition-colors"
                >
                  Enviar enlace de confirmación
                </button>
              </form>

              {(emailRequested || profile?.pendingEmailChange) && (
                <form
                  onSubmit={handleConfirmEmailChange}
                  className="pt-3 border-t border-[#E5DDD0] space-y-2"
                >
                  <input
                    type="text"
                    required
                    value={emailToken}
                    onChange={(e) => setEmailToken(e.target.value)}
                    placeholder="Código recibido en tu nuevo correo"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1B5E4A] text-white text-xs font-bold cursor-pointer"
                  >
                    Confirmar nuevo correo
                  </button>
                </form>
              )}
            </div>

            {/* Opciones avanzadas de privacidad colapsadas para no recargar la vista */}
            <div className="rounded-2xl border border-[#E5DDD0] bg-[#FFFCF8] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowClosurePanel((prev) => !prev)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-[#5C6B73] hover:text-[#12232E] cursor-pointer"
              >
                <span>Privacidad y cierre de cuenta</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showClosurePanel ? 'rotate-180' : ''}`}
                />
              </button>

              {showClosurePanel && (
                <div className="px-5 pb-5 pt-2 border-t border-[#E5DDD0] space-y-3">
                  <p className="text-[11px] text-[#5C6B73] leading-relaxed">
                    Puedes cerrar tu cuenta y anonimizar tus datos personales cuando no tengas
                    reservas pendientes de pago ni viajes confirmados por realizar.
                  </p>

                  {blockers.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FBECE9] border border-[#EABCB3] text-[11px] text-[#8E2B17] space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Reservas activas en curso:
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
                    <span>Confirmo que deseo cerrar mi cuenta de viajero.</span>
                  </label>

                  <button
                    type="button"
                    disabled={!confirmClosure}
                    onClick={() => void handleClosure()}
                    className="w-full py-2.5 rounded-xl border border-[#EABCB3] text-[#8E2B17] hover:bg-[#FBECE9] disabled:opacity-40 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Cerrar mi cuenta
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
