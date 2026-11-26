import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hotel,
  Info,
  ListFilter,
  Lock,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { catalogApi, hotelsApi, reservationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  calculateNights24h,
  formatLimaDate,
  formatLimaTime,
  formatLimaWeekdayDate,
  formatPen,
  parseDecimal,
  pickSmartDeparture,
  todayLimaIso,
  toLimaDateIso,
} from '../lib/format';
import {
  extractHotelEditorialMeta,
  inferDestination,
  mergeWithOfficialDmGoHotels,
  resolveMediaUrl,
  SHOWCASE_HOTELS,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../lib/peruCatalog';
import type {
  CatalogApiType,
  CatalogOfferDetailDto,
  DepartureDto,
  HotelPublicItemDto,
  LodgingProposalDto,
  ReservationDto,
} from '../types/api';
import { PeruPhoto, SectionEyebrow } from '../components/ui/EditorialPrimitives';

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SHORT_MONTH_NAMES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const WEEKDAY_HEADERS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function formatMonthKeyLabel(monthKey: string, short = false): string {
  const [yStr, mStr] = monthKey.split('-');
  const mIdx = Number(mStr) - 1;
  const names = short ? SHORT_MONTH_NAMES_ES : MONTH_NAMES_ES;
  if (!yStr || Number.isNaN(mIdx) || mIdx < 0 || mIdx > 11) return monthKey;
  return `${names[mIdx]} ${yStr}`;
}

function shiftYearMonth(monthKey: string, deltaMonths: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const d = new Date(Date.UTC(Number(yStr), Number(mStr) - 1 + deltaMonths, 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function buildCalendarCells(monthKey: string): Array<{ dateIso: string; day: number } | null> {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return [];

  const firstDayUtc = new Date(Date.UTC(year, monthIdx, 1));
  // Lunes = 0 ... Domingo = 6
  const startWeekdayMon0 = (firstDayUtc.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();

  const cells: Array<{ dateIso: string; day: number } | null> = [];
  for (let i = 0; i < startWeekdayMon0; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateIso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dateIso, day: d });
  }
  return cells;
}

export const ExperienceDetailBookingPage: React.FC<{ forcedType?: CatalogApiType }> = ({
  forcedType,
}) => {
  const { type, id } = useParams<{ type?: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lodgingSectionRef = useRef<HTMLElement | null>(null);

  // Recuerda la preferencia de hotel y habitación del viajero al cambiar de fecha de salida
  const preferredHotelIdRef = useRef<string>('');
  const preferredRoomNameRef = useRef<string>('');

  const {
    isAuthenticated,
    user,
    apiOnline,
    isDemoSession,
    upsertDemoReservation,
  } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const apiType: CatalogApiType =
    forcedType ?? (type === 'packages' || type === 'paquetes' ? 'packages' : 'tours');
  const sectionBasePath = apiType === 'packages' ? '/paquetes' : '/tours';
  const sectionTitle = apiType === 'packages' ? 'Paquetes Turísticos' : 'Tours Turísticos';

  const initialRequestedDate = searchParams.get('startDate');
  const initialRequestedDepId = searchParams.get('departureId');

  const [offer, setOffer] = useState<CatalogOfferDetailDto | null>(null);
  const [hotelsMap, setHotelsMap] = useState<Record<string, HotelPublicItemDto>>({});
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [selectedDepartureId, setSelectedDepartureId] = useState('');
  const [dateViewMode, setDateViewMode] = useState<'list' | 'calendar'>('list');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-12');
  const [desiredDateInput, setDesiredDateInput] = useState<string>(initialRequestedDate ?? '');
  const [smartSelectionHint, setSmartSelectionHint] = useState<string | null>(null);

  const [travelers, setTravelers] = useState(2);
  const [proposals, setProposals] = useState<LodgingProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [includeLodging, setIncludeLodging] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lodgingUnavailableMsg, setLodgingUnavailableMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) return;

    const applyLoadedOffer = (loaded: CatalogOfferDetailDto) => {
      setOffer(loaded);
      setActivePhotoIdx(0);
      setMonthFilter('all');

      const smart = pickSmartDeparture(loaded.departures, {
        requestedDepartureId: initialRequestedDepId,
        requestedDateIso: initialRequestedDate,
        travelers: 2,
      });

      if (smart.departure) {
        setSelectedDepartureId(smart.departure.id);
        const depDateIso = toLimaDateIso(smart.departure.startDate);
        if (depDateIso) {
          setCalendarMonth(depDateIso.slice(0, 7));
          setDesiredDateInput(depDateIso);
        }
        if (smart.matchKind === 'nearest-after' && initialRequestedDate) {
          setSmartSelectionHint(
            `Para tu búsqueda (${formatLimaDate(initialRequestedDate)}), seleccionamos la salida con cupos más cercana: ${formatLimaWeekdayDate(smart.departure.startDate)}.`
          );
        } else {
          setSmartSelectionHint(null);
        }
      } else {
        setSelectedDepartureId('');
      }
    };

    (async () => {
      setLoading(true);
      try {
        const [detailRes, publicHotelsRes] = await Promise.all([
          catalogApi.getDetail(apiType, id),
          hotelsApi.listPublic().catch(() => ({ items: SHOWCASE_HOTELS })),
        ]);
        if (!active) return;

        const mergedHotels = mergeWithOfficialDmGoHotels(publicHotelsRes.items);
        const map: Record<string, HotelPublicItemDto> = {};
        for (const h of mergedHotels) map[h.id] = h;
        setHotelsMap(map);
        applyLoadedOffer(detailRes);
      } catch {
        if (!active) return;
        const pool = [...SHOWCASE_TOURS, ...SHOWCASE_PACKAGES];
        const found = pool.find((o) => o.id === id) ?? pool[0]!;
        const map: Record<string, HotelPublicItemDto> = {};
        for (const h of SHOWCASE_HOTELS) map[h.id] = h;
        setHotelsMap(map);
        applyLoadedOffer(found);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [apiType, id, initialRequestedDate, initialRequestedDepId]);

  useEffect(() => {
    let active = true;
    if (!selectedDepartureId) {
      setProposals([]);
      return;
    }

    const selectPreservingPreference = (nextProposals: LodgingProposalDto[]) => {
      setProposals(nextProposals);
      if (nextProposals.length === 0) {
        setIncludeLodging(false);
        return;
      }

      const matchedProposal =
        (preferredHotelIdRef.current
          ? nextProposals.find((p) => p.hotelId === preferredHotelIdRef.current)
          : undefined) ?? nextProposals[0]!;

      setSelectedProposalId(matchedProposal.id);
      preferredHotelIdRef.current = matchedProposal.hotelId;

      const matchedRoom =
        (preferredRoomNameRef.current
          ? matchedProposal.roomTypes.find(
              (r) => r.name.toLowerCase() === preferredRoomNameRef.current.toLowerCase()
            )
          : undefined) ??
        matchedProposal.roomTypes.find((r) => r.capacity >= travelers) ??
        matchedProposal.roomTypes[0];

      if (matchedRoom) {
        setSelectedRoomTypeId(matchedRoom.id);
        preferredRoomNameRef.current = matchedRoom.name;
      }
    };

    (async () => {
      setLoadingProposals(true);
      try {
        const res = await hotelsApi.listByDeparture(selectedDepartureId);
        if (!active) return;
        selectPreservingPreference(res.items);
      } catch {
        if (!active) return;
        const dest = offer
          ? offer.destinationHint || inferDestination(`${offer.name} ${offer.description}`)
          : 'Ayacucho';
        const matchingHotels = SHOWCASE_HOTELS_DETAIL.filter(
          (h) =>
            h.hasAvailability &&
            (h.destinationHint || 'Ayacucho').toLowerCase() === dest.toLowerCase()
        );

        const dep = offer?.departures.find((d) => d.id === selectedDepartureId);
        const startIso = dep?.startDate ?? '2026-12-18T15:00:00Z';
        const nightsCount = Math.max(
          1,
          (offer?.durationDays ?? 2) > 1 ? (offer?.durationDays ?? 2) - 1 : 1
        );
        const endDateObj = new Date(new Date(startIso).getTime() + nightsCount * 86400000);

        const demoProposals: LodgingProposalDto[] = matchingHotels.map((h) => ({
          id: `prop-${selectedDepartureId.slice(-4)}-${h.id}`,
          hotelId: h.id,
          departureId: selectedDepartureId,
          startDate: startIso,
          endDate: endDateObj.toISOString(),
          roomTypes: h.roomTypes,
        }));

        selectPreservingPreference(demoProposals);
      } finally {
        if (active) setLoadingProposals(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartureId, offer]);

  // Salidas futuras ordenadas cronológicamente (Spec 001 · RF-4)
  const sortedDepartures = useMemo(() => {
    if (!offer) return [];
    const { sortedFuture } = pickSmartDeparture(offer.departures, { travelers });
    return sortedFuture.length > 0 ? sortedFuture : [...offer.departures];
  }, [offer, travelers]);

  // Meses únicos con salidas para filtrado rápido y navegación de calendario
  const departureMonths = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const dep of sortedDepartures) {
      const mKey = toLimaDateIso(dep.startDate).slice(0, 7);
      if (mKey && !seen.has(mKey)) {
        seen.add(mKey);
        list.push(mKey);
      }
    }
    return list;
  }, [sortedDepartures]);

  // Mapa por día calendario YYYY-MM-DD (America/Lima) -> salidas programadas ese día
  const departuresByLimaDate = useMemo(() => {
    const map = new Map<string, DepartureDto[]>();
    for (const dep of sortedDepartures) {
      const dateKey = toLimaDateIso(dep.startDate);
      if (!dateKey) continue;
      const existing = map.get(dateKey);
      if (existing) existing.push(dep);
      else map.set(dateKey, [dep]);
    }
    return map;
  }, [sortedDepartures]);

  // Identifica si existen tarifas diferenciadas por fecha para destacar «Mejor tarifa»
  const priceStats = useMemo(() => {
    const bookablePrices = sortedDepartures
      .filter((d) => (d.available ?? 1) > 0)
      .map((d) => parseDecimal(d.price))
      .filter((p) => p > 0);
    if (bookablePrices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...bookablePrices),
      max: Math.max(...bookablePrices),
    };
  }, [sortedDepartures]);

  const filteredListDepartures = useMemo(() => {
    if (monthFilter === 'all') return sortedDepartures;
    return sortedDepartures.filter((d) => toLimaDateIso(d.startDate).startsWith(monthFilter));
  }, [sortedDepartures, monthFilter]);

  const selectedDeparture = useMemo(
    () => sortedDepartures.find((d) => d.id === selectedDepartureId) ?? null,
    [sortedDepartures, selectedDepartureId]
  );

  const selectedProposal = useMemo(
    () => proposals.find((p) => p.id === selectedProposalId) ?? proposals[0] ?? null,
    [proposals, selectedProposalId]
  );

  const selectedRoomType = useMemo(
    () =>
      selectedProposal?.roomTypes.find((r) => r.id === selectedRoomTypeId) ??
      selectedProposal?.roomTypes[0] ??
      null,
    [selectedProposal, selectedRoomTypeId]
  );

  useEffect(() => {
    if (!selectedProposal) return;
    const existsInProposal = selectedProposal.roomTypes.some((r) => r.id === selectedRoomTypeId);
    if (existsInProposal) return;
    const initial =
      selectedProposal.roomTypes.find((r) => r.capacity >= travelers) ??
      selectedProposal.roomTypes[0];
    if (initial) {
      setSelectedRoomTypeId(initial.id);
    }
  }, [travelers, selectedProposal, selectedRoomTypeId]);

  /**
   * Selección inteligente de una salida concreta:
   * - Rechaza salidas agotadas (available === 0).
   * - Si la nueva salida tiene menos cupos libres que `travelers`, ajusta automáticamente `travelers`
   *   al máximo disponible e informa amigablemente al cliente (evitando fallo RF-6).
   */
  const handleSelectDeparture = (dep: DepartureDto, customHint?: string | null) => {
    if (dep.available !== null && dep.available !== undefined && dep.available <= 0) {
      return;
    }

    setSelectedDepartureId(dep.id);
    const depDateIso = toLimaDateIso(dep.startDate);
    if (depDateIso) {
      setDesiredDateInput(depDateIso);
      setCalendarMonth(depDateIso.slice(0, 7));
    }

    if (dep.available !== null && dep.available !== undefined && travelers > dep.available) {
      setTravelers(dep.available);
      setSmartSelectionHint(
        `Ajustamos la reserva a ${dep.available} ${dep.available === 1 ? 'viajero' : 'viajeros'} según los cupos libres de esta salida.`
      );
    } else {
      setSmartSelectionHint(customHint ?? null);
    }
  };

  /**
   * Cuando el cliente escribe o elige cualquier fecha en el selector o calendario:
   * - Si existe salida disponible ese mismo día, la selecciona directamente.
   * - Si ese día está agotado o no tiene salida programada, ubica automáticamente la salida disponible más próxima.
   */
  const handleDesiredDatePick = (targetDateIso: string) => {
    setDesiredDateInput(targetDateIso);
    if (!targetDateIso || !offer) return;

    const sameDayList = departuresByLimaDate.get(targetDateIso) ?? [];
    const sameDayBookable =
      sameDayList.find((d) => (d.available ?? 1) >= travelers) ??
      sameDayList.find((d) => (d.available ?? 1) > 0);

    if (sameDayBookable) {
      handleSelectDeparture(sameDayBookable, null);
      return;
    }

    const wasSoldOutThatDay = sameDayList.length > 0 && sameDayList.every((d) => d.available === 0);
    const smart = pickSmartDeparture(sortedDepartures, {
      requestedDateIso: targetDateIso,
      travelers,
    });

    if (smart.departure && (smart.departure.available ?? 1) > 0) {
      const formattedChosen = formatLimaDate(targetDateIso);
      const formattedNext = formatLimaWeekdayDate(smart.departure.startDate);
      const hint = wasSoldOutThatDay
        ? `La salida del ${formattedChosen} está agotada; te sugerimos la fecha disponible más próxima: ${formattedNext}.`
        : `No hay salida exacta el ${formattedChosen}; seleccionamos la fecha disponible más próxima: ${formattedNext}.`;
      handleSelectDeparture(smart.departure, hint);
    }
  };

  const bookableCount = useMemo(
    () => sortedDepartures.filter((d) => (d.available ?? 1) > 0).length,
    [sortedDepartures]
  );

  const maxSpots = Math.max(1, selectedDeparture?.available ?? 16);
  const pricePerPerson = parseDecimal(selectedDeparture?.price ?? offer?.price);
  const touristSubtotal = pricePerPerson * travelers;
  const nights =
    includeLodging && selectedProposal
      ? calculateNights24h(selectedProposal.startDate, selectedProposal.endDate)
      : 0;
  const nightlyRate =
    includeLodging && selectedRoomType ? parseDecimal(selectedRoomType.basePrice) : 0;
  const lodgingSubtotal = nights * nightlyRate;
  const estimatedTotal = touristSubtotal + lodgingSubtotal;

  const selectedHotelInfo = selectedProposal ? hotelsMap[selectedProposal.hotelId] : undefined;
  const selectedHotelMeta = selectedHotelInfo
    ? extractHotelEditorialMeta(selectedHotelInfo)
    : null;

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const todayIso = useMemo(() => todayLimaIso(), []);
  const selectedLimaDate = selectedDeparture ? toLimaDateIso(selectedDeparture.startDate) : '';

  const scrollToLodgingSelector = () => {
    setIncludeLodging(true);
    lodgingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateReservation = async () => {
    if (!selectedDeparture || !offer) return;
    if (selectedDeparture.available !== null && selectedDeparture.available !== undefined && selectedDeparture.available <= 0) {
      notifyError(new Error('La fecha seleccionada no cuenta con cupos disponibles.'), 'Salida agotada');
      return;
    }

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(`${sectionBasePath}/${offer.id}`);
      navigate(`/acceso?mode=login&returnTo=${returnTo}`);
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const demoId = `demo-res-${Date.now().toString().slice(-5)}`;
      const newDemoRes: ReservationDto = {
        id: demoId,
        reservationNumber: `DMG-2026-${Date.now().toString().slice(-6)}`,
        offerNameHint: offer.name,
        status: 'pending',
        travelers,
        total: estimatedTotal.toFixed(2),
        currency: 'PEN',
        paymentDeadlineAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        validationDeadlineAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        version: 1,
        departure: selectedDeparture,
        lodging:
          includeLodging && selectedProposal && selectedRoomType
            ? {
                hotelName: selectedHotelInfo?.name ?? 'Hotel Aliado DM GO TRAVEL',
                roomTypeName: selectedRoomType.name,
                capacity: selectedRoomType.capacity,
                checkInDate: toLimaDateIso(selectedProposal.startDate),
                checkOutDate: toLimaDateIso(selectedProposal.endDate),
                nights,
                nightlyRate: selectedRoomType.basePrice,
                subtotal: lodgingSubtotal.toFixed(2),
                currency: 'PEN',
              }
            : null,
      };
      upsertDemoReservation(newDemoRes);
      notifySuccess(
        `Reserva ${newDemoRes.reservationNumber} registrada`,
        'Disponibilidad reservada por 15 minutos. Continúa al pago seguro.'
      );
      navigate(`/checkout/${demoId}`);
      return;
    }

    if (user && !user.emailVerified) {
      notifyError(
        new Error('Verifica tu correo electrónico antes de generar una reserva.'),
        'Correo pendiente de verificación'
      );
      navigate('/acceso?mode=verify');
      return;
    }

    setSubmitting(true);
    setLodgingUnavailableMsg(null);
    try {
      const created = await reservationsApi.create({
        departureId: selectedDeparture.id,
        travelers,
        lodging:
          includeLodging && selectedProposal && selectedRoomType
            ? {
                proposalId: selectedProposal.id,
                roomTypeId: selectedRoomType.id,
              }
            : null,
      });
      notifySuccess(
        `Reserva ${created.reservationNumber} creada`,
        'Tus cupos quedaron reservados por 15 minutos para completar el pago.'
      );
      navigate(`/checkout/${created.id}`);
    } catch (err) {
      if (includeLodging) {
        setLodgingUnavailableMsg(
          proposals.length > 1
            ? 'La habitación elegida ya no tiene cupo en todas las noches de esta salida. Puedes seleccionar otro hotel aliado disponible o continuar solo con la experiencia turística.'
            : 'El alojamiento seleccionado ya no cuenta con disponibilidad. Si lo deseas, puedes continuar únicamente con la experiencia turística.'
        );
      }
      notifyError(err, 'No se pudo crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-6">
        <div className="h-10 w-2/3 rounded-xl bg-[#F3EDE2] animate-pulse" />
        <div className="h-[420px] rounded-2xl bg-[#F3EDE2] animate-pulse" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="max-w-xl mx-auto my-20 text-center space-y-4">
        <h1 className="font-editorial text-3xl text-[#12232E]">Oferta turística no disponible</h1>
        <Link
          to={sectionBasePath}
          className="inline-block px-5 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
        >
          Volver a {sectionTitle}
        </Link>
      </div>
    );
  }

  const destination =
    offer.destinationHint || inferDestination(`${offer.name} ${offer.description}`);
  const gallery =
    offer.images.length > 0
      ? offer.images
      : [{ id: 'fallback', url: '', isPrimary: true, version: 1 }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-28 lg:pb-14 space-y-8">
      {/* Encabezado Editorial */}
      <div className="space-y-3">
        <Link
          to={sectionBasePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B73] hover:text-[#B84A27] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a {sectionTitle}
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <SectionEyebrow>
            {offer.type === 'package' ? 'Paquete Turístico Oficial' : 'Tour Turístico Oficial'}
          </SectionEyebrow>
          <span className="text-xs text-[#D2C6B4]">·</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5C6B73]">
            <MapPin className="w-3.5 h-3.5 text-[#B84A27]" />
            {destination}, Perú
          </span>
          <span className="text-xs text-[#D2C6B4]">·</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5C6B73]">
            <Clock className="w-3.5 h-3.5 text-[#1B5E4A]" />
            {offer.durationDays === 1 ? '1 día (Full Day)' : `${offer.durationDays} días`}
          </span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E] leading-tight max-w-4xl">
          {offer.name}
        </h1>
      </div>

      {/* Galería Editorial Interactiva */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[300px] sm:h-[420px] rounded-3xl overflow-hidden border border-[#E5DDD0]">
          <div className={gallery.length > 1 ? 'lg:col-span-8 h-full' : 'lg:col-span-12 h-full'}>
            <PeruPhoto
              src={gallery[activePhotoIdx]?.url}
              alt={offer.name}
              category={offer.type === 'package' ? 'package' : 'tour'}
              seedIndex={activePhotoIdx}
              className="w-full h-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-3 h-full">
              {gallery.slice(1, 3).map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActivePhotoIdx(i + 1)}
                  className="w-full h-full overflow-hidden relative group cursor-pointer"
                >
                  <PeruPhoto
                    src={img.url}
                    alt={`${offer.name} vista ${i + 2}`}
                    category={offer.type === 'package' ? 'package' : 'tour'}
                    seedIndex={i + 1}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo en 2 Columnas: Izquierda Editorial + Derecha Tarifario Fijo y Centrado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
        {/* ================= COLUMNA IZQUIERDA EDITORIAL ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-7">
          <section className="hairline-card rounded-2xl p-6 sm:p-7 space-y-3.5">
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
              Sobre la experiencia
            </h2>
            <p className="text-sm text-[#5C6B73] leading-relaxed">{offer.description}</p>
          </section>

          {/* Línea de Tiempo de Itinerario */}
          <section className="hairline-card rounded-2xl p-6 sm:p-7 space-y-5">
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
              Itinerario día por día
            </h2>
            <div className="space-y-4">
              {offer.itinerary.map((item) => (
                <div
                  key={item.day}
                  className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 pb-4 last:pb-0 border-b last:border-b-0 border-[#E5DDD0]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F7EAE4] border border-[#B84A27]/25 text-[#B84A27] flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Día</span>
                    <strong className="font-editorial text-lg leading-none">{item.day}</strong>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#12232E]">{item.title}</h3>
                    <p className="text-xs text-[#5C6B73] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Selector Limpio y Amigable de Alojamiento Aliado */}
          <section
            ref={lodgingSectionRef}
            className="hairline-card rounded-2xl p-6 sm:p-7 space-y-5 scroll-mt-24"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1B5E4A]">
                  <Hotel className="w-3.5 h-3.5" />
                  Estadía Opcional en un Solo Pago
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E] mt-1">
                  ¿Deseas sumar una casona u hotel aliado a esta salida?
                </h2>
              </div>

              {proposals.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#F3EDE2] text-[11px] font-semibold text-[#12232E]">
                  {proposals.length} hoteles disponibles
                </span>
              )}
            </div>

            {loadingProposals ? (
              <div className="h-24 rounded-xl bg-[#F3EDE2] animate-pulse" />
            ) : proposals.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-xs text-[#5C6B73]">
                Esta salida opera únicamente en modalidad de recorrido turístico. Puedes reservar
                tus cupos directamente en el panel derecho.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeLodging(false);
                      setLodgingUnavailableMsg(null);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      !includeLodging
                        ? 'border-[#12232E] bg-[#12232E] text-white shadow-xs'
                        : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E] hover:border-[#12232E]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold">Solo experiencia turística</p>
                      {!includeLodging && <Check className="w-4 h-4 text-[#C89B54]" />}
                    </div>
                    <p
                      className={`text-[11px] mt-1 ${
                        !includeLodging ? 'text-white/75' : 'text-[#5C6B73]'
                      }`}
                    >
                      Reservar únicamente los cupos del recorrido.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeLodging(true)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      includeLodging
                        ? 'border-[#1B5E4A] bg-[#E7F3EE] text-[#12232E] ring-1 ring-[#1B5E4A] shadow-xs'
                        : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E] hover:border-[#1B5E4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1B5E4A]">
                        Consolidar Tour + Casona Aliada
                      </p>
                      {includeLodging && <Check className="w-4 h-4 text-[#1B5E4A]" />}
                    </div>
                    <p className="text-[11px] text-[#5C6B73] mt-1">
                      Suma tu habitación validada en una misma orden.
                    </p>
                  </button>
                </div>

                {includeLodging && (
                  <div className="space-y-5">
                    {lodgingUnavailableMsg && (
                      <div className="p-4 rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] space-y-2.5 text-xs text-[#7A4E0D]">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Habitación sin disponibilidad para todas las noches
                        </p>
                        <p>{lodgingUnavailableMsg}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIncludeLodging(false);
                            setLodgingUnavailableMsg(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
                        >
                          Continuar sin alojamiento
                        </button>
                      </div>
                    )}

                    {/* Paso A: Selector Compacto Visual de los Hoteles Aliados */}
                    <div className="space-y-2.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6B73]">
                        Paso 1 · Elige tu hotel aliado en {destination} ({proposals.length} opciones)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {proposals.map((prop, pIdx) => {
                          const hInfo = hotelsMap[prop.hotelId];
                          const hMeta = hInfo ? extractHotelEditorialMeta(hInfo) : null;
                          const isActive = selectedProposal?.id === prop.id;
                          const minRoomPrice = prop.roomTypes.reduce((acc, r) => {
                            const val = parseDecimal(r.basePrice);
                            return acc === 0 || val < acc ? val : acc;
                          }, 0);
                          const thumbUrl = resolveMediaUrl(
                            hInfo?.images?.[0]?.url,
                            'hotel',
                            pIdx,
                            hInfo?.name ?? ''
                          );

                          return (
                            <button
                              key={prop.id}
                              type="button"
                              onClick={() => {
                                setSelectedProposalId(prop.id);
                                preferredHotelIdRef.current = prop.hotelId;
                                setLodgingUnavailableMsg(null);
                                const matchedRoom =
                                  (preferredRoomNameRef.current
                                    ? prop.roomTypes.find(
                                        (r) =>
                                          r.name.toLowerCase() ===
                                          preferredRoomNameRef.current.toLowerCase()
                                      )
                                    : undefined) ??
                                  prop.roomTypes.find((r) => r.capacity >= travelers) ??
                                  prop.roomTypes[0];
                                if (matchedRoom) {
                                  setSelectedRoomTypeId(matchedRoom.id);
                                  preferredRoomNameRef.current = matchedRoom.name;
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                isActive
                                  ? 'border-[#1B5E4A] bg-[#E7F3EE]/65 ring-1 ring-[#1B5E4A] shadow-xs'
                                  : 'border-[#E5DDD0] bg-[#FFFCF8] hover:border-[#1B5E4A]/50 hover:bg-[#FAF7F2]'
                              }`}
                            >
                              <img
                                src={thumbUrl}
                                alt={hInfo?.name ?? 'Hotel aliado'}
                                loading="lazy"
                                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E5DDD0]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#12232E] truncate">
                                  {hInfo?.name ?? 'Hotel Aliado'}
                                </p>
                                <p className="text-[10px] text-[#5C6B73] truncate mt-0.5">
                                  {hMeta?.proximity ?? 'Centro Histórico'}
                                </p>
                                {minRoomPrice > 0 && (
                                  <p className="text-[11px] font-semibold text-[#1B5E4A] tabular-nums mt-0.5">
                                    Desde {formatPen(minRoomPrice)} / noche
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paso B: Tarjeta Limpia del Hotel Seleccionado y sus Habitaciones */}
                    {selectedProposal && (
                      <div className="rounded-2xl border border-[#1B5E4A]/40 bg-[#FAF7F2] p-5 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-[#E5DDD0]">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-editorial text-2xl font-medium text-[#12232E]">
                                {selectedHotelInfo?.name ?? 'Hotel Aliado DM GO TRAVEL'}
                              </h3>
                              {selectedHotelMeta && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#E7F3EE] text-[#15523F] text-[10px] font-bold">
                                  {selectedHotelMeta.categoryBadge}
                                </span>
                              )}
                            </div>

                            {selectedHotelMeta && (
                              <p className="text-xs text-[#5C6B73]">
                                {selectedHotelMeta.location} · Check-in {selectedHotelMeta.checkIn}{' '}
                                / Check-out {selectedHotelMeta.checkOut}
                              </p>
                            )}

                            <p className="text-xs font-medium text-[#12232E] tabular-nums">
                              Estancia sincronizada con tu salida:{' '}
                              {formatLimaDate(selectedProposal.startDate)} →{' '}
                              {formatLimaDate(selectedProposal.endDate)} ({nights}{' '}
                              {nights === 1 ? 'noche · 24 h' : 'noches · períodos de 24 h'})
                            </p>
                          </div>

                          {selectedHotelInfo && (
                            <Link
                              to={`/hoteles/${selectedHotelInfo.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2C6B4] bg-[#FFFCF8] hover:border-[#12232E] text-[11px] font-semibold text-[#12232E] transition-colors shrink-0"
                            >
                              Ver hotel
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#B84A27]" />
                            </Link>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6B73]">
                            Paso 2 · Selecciona tu tipo de habitación
                          </label>

                          <div className="grid grid-cols-1 gap-2.5">
                            {selectedProposal.roomTypes.map((rt, rIdx) => {
                              const isSelected = rt.id === selectedRoomType?.id;
                              const isPartialGroup = rt.capacity < travelers;
                              const sub = parseDecimal(rt.basePrice) * nights;
                              const hasPhoto = rt.images && rt.images.length > 0;
                              const roomThumb = hasPhoto
                                ? resolveMediaUrl(rt.images[0]?.url, 'room', rIdx, rt.name)
                                : null;

                              return (
                                <label
                                  key={rt.id}
                                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#1B5E4A] bg-white ring-1 ring-[#1B5E4A]/30 shadow-xs'
                                      : 'border-[#E5DDD0] bg-white/75 hover:bg-white hover:border-[#1B5E4A]/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="radio"
                                      name={`room-${selectedProposal.id}`}
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedRoomTypeId(rt.id);
                                        preferredRoomNameRef.current = rt.name;
                                        setLodgingUnavailableMsg(null);
                                      }}
                                      className="accent-[#1B5E4A] shrink-0"
                                    />

                                    {roomThumb && (
                                      <img
                                        src={roomThumb}
                                        alt={rt.name}
                                        loading="lazy"
                                        className="hidden sm:block w-14 h-11 rounded-lg object-cover border border-[#E5DDD0] shrink-0"
                                      />
                                    )}

                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-bold text-[#12232E]">
                                          {rt.name}
                                        </p>
                                        {isPartialGroup && (
                                          <span className="px-2 py-0.5 rounded-full bg-[#FBF4E4] border border-[#E8D2A0] text-[10px] font-semibold text-[#855814]">
                                            Aloja hasta {rt.capacity} de {travelers} viajeros
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-[#5C6B73] mt-0.5">
                                        Hasta {rt.capacity}{' '}
                                        {rt.capacity === 1 ? 'huésped' : 'huéspedes'} ·{' '}
                                        {formatPen(rt.basePrice)} / noche (tarifa fija por habitación)
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right whitespace-nowrap shrink-0 pl-2">
                                    <strong className="font-editorial text-lg sm:text-xl font-semibold text-[#12232E] tabular-nums">
                                      + {formatPen(sub)}
                                    </strong>
                                    {nights > 1 && (
                                      <span className="block text-[10px] text-[#5C6B73]">
                                        por {nights} noches
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/80 border border-[#E5DDD0] flex items-start gap-2 text-[11px] text-[#5C6B73]">
                          <Info className="w-3.5 h-3.5 text-[#1B5E4A] shrink-0 mt-0.5" />
                          <span>
                            Horario fijo en períodos de 24 horas (hora de Perú);{' '}
                            <strong className="text-[#12232E]">
                              no existe tolerancia adicional después del horario de salida asignado
                            </strong>{' '}
                            ni devolución parcial por retiro anticipado.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Condiciones */}
          <section className="hairline-card rounded-2xl p-6 sm:p-7 space-y-3">
            <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
              Qué incluye y condiciones del servicio
            </h2>
            <ul className="space-y-2.5 text-xs text-[#5C6B73]">
              {offer.conditions.map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1B5E4A] shrink-0 mt-0.5" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ================= COLUMNA DERECHA: TARIFARIO FIJO, CENTRADO Y CON SELECCIÓN INTELIGENTE DE FECHA ================= */}
        <aside
          aria-label="Tarifario y resumen de reserva"
          className="lg:col-span-5 xl:col-span-4 lg:self-stretch"
        >
          <div className="lg:sticky lg:top-20 lg:min-h-[calc(100vh-5.5rem)] lg:flex lg:items-center lg:py-2">
            <div className="w-full hairline-card rounded-3xl border-[#D8CCBA] shadow-xl bg-[#FFFCF8] flex flex-col lg:max-h-[calc(100vh-6.25rem)] overflow-hidden">
              {/* 1. Cabecera Centrada del Tarifario Oficial */}
              <div className="px-5 pt-4 pb-3.5 border-b border-[#E5DDD0] text-center bg-gradient-to-b from-[#FAF7F2] to-[#FFFCF8] shrink-0">
                <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B84A27]">
                  <Sparkles className="w-3 h-3" />
                  Tarifa Oficial por Viajero
                </span>
                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <strong className="font-editorial text-4xl font-semibold text-[#12232E] tabular-nums leading-none">
                    {formatPen(pricePerPerson)}
                  </strong>
                  <span className="text-xs font-semibold text-[#5C6B73]">PEN</span>
                </div>
                {selectedDeparture ? (
                  <p className="text-[11px] font-medium text-[#1B5E4A] mt-1">
                    Salida elegida: {formatLimaWeekdayDate(selectedDeparture.startDate)} ·{' '}
                    {formatLimaTime(selectedDeparture.startDate)}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#5C6B73] mt-1">
                    Precio por persona · Confirmación inmediata en Soles
                  </p>
                )}
              </div>

              {/* 2. Cuerpo Interactivo: Selector Inteligente de Fecha + Viajeros + Hotel */}
              <div className="px-5 py-3.5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
                {/* Selector Inteligente de Fecha de Salida */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#12232E]">
                      1. Elige fecha de salida ({bookableCount} disp.)
                    </label>

                    {sortedDepartures.length > 0 && (
                      <div
                        role="group"
                        aria-label="Modo de selección de fecha"
                        className="inline-flex items-center p-0.5 rounded-lg bg-[#F3EDE2] border border-[#E5DDD0]"
                      >
                        <button
                          type="button"
                          onClick={() => setDateViewMode('list')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                            dateViewMode === 'list'
                              ? 'bg-[#FFFCF8] text-[#12232E] shadow-xs'
                              : 'text-[#5C6B73] hover:text-[#12232E]'
                          }`}
                        >
                          <ListFilter className="w-3 h-3" />
                          Fechas
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateViewMode('calendar')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                            dateViewMode === 'calendar'
                              ? 'bg-[#FFFCF8] text-[#12232E] shadow-xs'
                              : 'text-[#5C6B73] hover:text-[#12232E]'
                          }`}
                        >
                          <CalendarDays className="w-3 h-3" />
                          Calendario
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Buscador directo por fecha deseada (ubica coincidencia exacta o la más cercana con cupos) */}
                  {sortedDepartures.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2]">
                      <Calendar className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
                      <span className="text-[11px] text-[#5C6B73] whitespace-nowrap">
                        Tu fecha ideal:
                      </span>
                      <input
                        type="date"
                        aria-label="Elegir fecha deseada"
                        min={todayIso}
                        value={desiredDateInput}
                        onChange={(e) => handleDesiredDatePick(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#12232E] focus:outline-none cursor-pointer"
                      />
                    </div>
                  )}

                  {smartSelectionHint && (
                    <div className="px-3 py-2 rounded-xl bg-[#E7F3EE]/80 border border-[#B6DEC9] text-[11px] text-[#15523F] flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1B5E4A]" />
                      <span>{smartSelectionHint}</span>
                    </div>
                  )}

                  {sortedDepartures.length === 0 ? (
                    <p className="p-3 rounded-xl bg-[#FBF4E4] text-xs text-[#855814] text-center">
                      Sin salidas futuras programadas en este momento.
                    </p>
                  ) : dateViewMode === 'calendar' ? (
                    /* ================= MODO CALENDARIO INTERACTIVO ================= */
                    <div className="p-3 rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          aria-label="Mes anterior"
                          onClick={() => setCalendarMonth((m) => shiftYearMonth(m, -1))}
                          className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <strong className="text-xs font-bold text-[#12232E]">
                          {formatMonthKeyLabel(calendarMonth)}
                        </strong>
                        <button
                          type="button"
                          aria-label="Mes siguiente"
                          onClick={() => setCalendarMonth((m) => shiftYearMonth(m, 1))}
                          className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {departureMonths.length > 1 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {departureMonths.map((mKey) => (
                            <button
                              key={mKey}
                              type="button"
                              onClick={() => setCalendarMonth(mKey)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer ${
                                calendarMonth === mKey
                                  ? 'bg-[#12232E] text-white'
                                  : 'bg-[#FFFCF8] border border-[#E5DDD0] text-[#5C6B73]'
                              }`}
                            >
                              {formatMonthKeyLabel(mKey, true)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {WEEKDAY_HEADERS_ES.map((wd) => (
                          <span
                            key={wd}
                            className="text-[10px] font-bold uppercase text-[#5C6B73] py-0.5"
                          >
                            {wd}
                          </span>
                        ))}

                        {calendarCells.map((cell, idx) => {
                          if (!cell) {
                            return <span key={`empty-${idx}`} className="h-8" />;
                          }
                          const dayDeps = departuresByLimaDate.get(cell.dateIso) ?? [];
                          const bookableDep =
                            dayDeps.find((d) => (d.available ?? 1) >= travelers) ??
                            dayDeps.find((d) => (d.available ?? 1) > 0);
                          const isSoldOutDay = dayDeps.length > 0 && !bookableDep;
                          const isSelectedDay = cell.dateIso === selectedLimaDate;
                          const isPastDay = cell.dateIso < todayIso;

                          return (
                            <button
                              key={cell.dateIso}
                              type="button"
                              disabled={isPastDay || isSoldOutDay}
                              title={
                                bookableDep
                                  ? `Salida disponible: ${formatPen(bookableDep.price)} (${bookableDep.available ?? 'cupos'} libres)`
                                  : isSoldOutDay
                                    ? 'Salida agotada'
                                    : 'Elegir fecha cercana disponible'
                              }
                              onClick={() => handleDesiredDatePick(cell.dateIso)}
                              className={`h-8 rounded-lg text-xs font-semibold relative flex flex-col items-center justify-center transition-all ${
                                isSelectedDay
                                  ? 'bg-[#B84A27] text-white font-bold shadow-xs cursor-pointer'
                                  : bookableDep
                                    ? 'bg-[#E7F3EE] text-[#15523F] border border-[#B6DEC9] hover:border-[#1B5E4A] font-bold cursor-pointer'
                                    : isSoldOutDay
                                      ? 'bg-[#F3EDE2] text-[#9BA5AB] line-through cursor-not-allowed'
                                      : isPastDay
                                        ? 'text-[#C8C0B4] cursor-not-allowed'
                                        : 'text-[#12232E] hover:bg-[#FFFCF8] cursor-pointer'
                              }`}
                            >
                              <span>{cell.day}</span>
                              {bookableDep && !isSelectedDay && (
                                <span className="w-1 h-1 rounded-full bg-[#1B5E4A] -mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#5C6B73] pt-1 border-t border-[#E5DDD0]">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#1B5E4A]" /> Con salida
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#B84A27]" /> Elegida
                        </span>
                        <span className="line-through text-[#9BA5AB]">Agotada</span>
                      </div>
                    </div>
                  ) : (
                    /* ================= MODO LISTA INTELIGENTE POR MES ================= */
                    <div className="space-y-2">
                      {departureMonths.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                          <button
                            type="button"
                            onClick={() => setMonthFilter('all')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                              monthFilter === 'all'
                                ? 'bg-[#12232E] text-white'
                                : 'bg-[#FAF7F2] border border-[#E5DDD0] text-[#5C6B73] hover:text-[#12232E]'
                            }`}
                          >
                            Todas ({sortedDepartures.length})
                          </button>
                          {departureMonths.map((mKey) => (
                            <button
                              key={mKey}
                              type="button"
                              onClick={() => setMonthFilter(mKey)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                                monthFilter === mKey
                                  ? 'bg-[#12232E] text-white'
                                  : 'bg-[#FAF7F2] border border-[#E5DDD0] text-[#5C6B73] hover:text-[#12232E]'
                              }`}
                            >
                              {formatMonthKeyLabel(mKey, true)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="space-y-1.5 max-h-[195px] overflow-y-auto pr-0.5">
                        {filteredListDepartures.map((dep) => {
                          const active = dep.id === selectedDepartureId;
                          const avail = dep.available;
                          const isSoldOut = avail !== null && avail !== undefined && avail <= 0;
                          const isLowStock =
                            avail !== null && avail !== undefined && avail > 0 && avail <= 4;
                          const depPriceNum = parseDecimal(dep.price);
                          const isBestPrice =
                            !isSoldOut &&
                            priceStats.max > priceStats.min &&
                            depPriceNum === priceStats.min;

                          return (
                            <button
                              key={dep.id}
                              type="button"
                              disabled={isSoldOut}
                              onClick={() => handleSelectDeparture(dep)}
                              className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all ${
                                isSoldOut
                                  ? 'border-[#E5DDD0] bg-[#F3EDE2]/60 opacity-60 cursor-not-allowed'
                                  : active
                                    ? 'border-[#B84A27] bg-[#F7EAE4]/75 ring-1 ring-[#B84A27] cursor-pointer'
                                    : 'border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#B84A27]/50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#12232E]">
                                <span className="inline-flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      active
                                        ? 'border-[#B84A27] bg-[#B84A27] text-white'
                                        : 'border-[#C8BBAE] bg-white'
                                    }`}
                                  >
                                    {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                  <span className="truncate">
                                    {formatLimaWeekdayDate(dep.startDate)} ·{' '}
                                    {formatLimaTime(dep.startDate)}
                                  </span>
                                </span>

                                <span className="tabular-nums whitespace-nowrap">
                                  {formatPen(dep.price)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[10px] text-[#5C6B73] mt-1 pl-5">
                                <span className="inline-flex items-center gap-1.5">
                                  <span>Retorno: {formatLimaDate(dep.endDate)}</span>
                                  {isBestPrice && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#E7F3EE] text-[#15523F] font-bold">
                                      Mejor tarifa
                                    </span>
                                  )}
                                </span>

                                {isSoldOut ? (
                                  <span className="font-bold text-[#8E2B17]">Agotado</span>
                                ) : isLowStock ? (
                                  <span className="font-bold text-[#B84A27]">
                                    ¡Últimos {avail} cupos!
                                  </span>
                                ) : avail !== null && avail !== undefined ? (
                                  <span className="font-semibold text-[#1B5E4A]">
                                    {avail} cupos libres
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cantidad de Viajeros */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#12232E]">
                      2. Cantidad de viajeros
                    </label>
                    <span className="text-[10px] text-[#5C6B73]">Máx. {maxSpots} cupos</span>
                  </div>

                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2]">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#12232E]">
                      <Users className="w-4 h-4 text-[#B84A27]" />
                      {travelers} {travelers === 1 ? 'viajero' : 'viajeros'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                        aria-label="Reducir viajeros"
                        className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold">
                        {travelers}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTravelers((t) => Math.min(maxSpots, t + 1))}
                        aria-label="Aumentar viajeros"
                        className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acceso rápido al estado del alojamiento desde el propio cotizador */}
                {proposals.length > 0 && (
                  <div className="px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1B5E4A]">
                        <BedDouble className="w-3.5 h-3.5" />
                        Alojamiento aliado
                      </span>
                      <p className="text-[11px] font-semibold text-[#12232E] truncate mt-0.5">
                        {includeLodging && selectedRoomType
                          ? `${selectedHotelInfo?.name ?? 'Hotel'} · ${selectedRoomType.name}`
                          : 'Opcional · Sin hotel seleccionado'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        includeLodging ? setIncludeLodging(false) : scrollToLodgingSelector()
                      }
                      className="text-[11px] font-bold text-[#B84A27] hover:underline whitespace-nowrap cursor-pointer shrink-0"
                    >
                      {includeLodging ? 'Quitar' : '+ Sumar hotel'}
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Pie Fijo del Tarifario: Desglose + Total + Botón Reservar SIEMPRE VISIBLE */}
              <div className="px-5 py-4 bg-[#FAF7F2] border-t border-[#E5DDD0] space-y-3 shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#5C6B73]">
                    <span>
                      Experiencia ({travelers} × {formatPen(pricePerPerson)})
                    </span>
                    <strong className="text-[#12232E] tabular-nums whitespace-nowrap">
                      {formatPen(touristSubtotal)}
                    </strong>
                  </div>

                  {includeLodging && selectedRoomType && (
                    <div className="space-y-1 pt-1 border-t border-[#E5DDD0]/70">
                      <div className="flex items-center justify-between text-[#5C6B73]">
                        <span>
                          Alojamiento ({nights}n × {formatPen(nightlyRate)})
                        </span>
                        <strong className="text-[#1B5E4A] tabular-nums whitespace-nowrap">
                          {formatPen(lodgingSubtotal)}
                        </strong>
                      </div>
                      <p className="text-[10px] text-[#5C6B73]">
                        Viajeros totales del grupo:{' '}
                        <strong className="text-[#12232E]">{travelers}</strong> · Capacidad de
                        habitación elegida:{' '}
                        <strong className="text-[#1B5E4A]">
                          {selectedRoomType.capacity}{' '}
                          {selectedRoomType.capacity === 1 ? 'huésped' : 'huéspedes'}
                        </strong>
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E5DDD0] flex items-baseline justify-between">
                    <span className="font-bold text-[#12232E]">Total Estimado (PEN)</span>
                    <strong className="font-editorial text-2xl sm:text-3xl font-semibold text-[#12232E] tabular-nums whitespace-nowrap">
                      {formatPen(estimatedTotal)}
                    </strong>
                  </div>
                </div>

                {isAuthenticated && user && !user.emailVerified && !isDemoSession && (
                  <div className="p-2.5 rounded-xl bg-[#FBF4E4] border border-[#E8D2A0] text-[11px] text-[#855814] flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Verifica tu correo antes de reservar.{' '}
                      <Link to="/acceso?mode=verify" className="underline font-bold">
                        Verificar ahora
                      </Link>
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedDeparture || bookableCount === 0 || submitting}
                  onClick={() => void handleCreateReservation()}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {submitting ? 'Reservando tus cupos...' : 'Reservar y pasar al checkout'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-center text-[#5C6B73] flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#1B5E4A] shrink-0" />
                  <span>
                    Cupos y tarifa garantizados por <strong>15 minutos</strong> al iniciar tu pago
                  </span>
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Barra Inferior Fija para Móviles y Pantallas Pequeñas (< lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FFFCF8]/95 backdrop-blur-md border-t border-[#D8CCBA] px-4 py-3 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73]">
              Total ({travelers} {travelers === 1 ? 'viajero' : 'viajeros'}
              {includeLodging ? ' + hotel' : ''})
            </span>
            <strong className="font-editorial text-2xl font-semibold text-[#12232E] tabular-nums">
              {formatPen(estimatedTotal)}
            </strong>
          </div>

          <button
            type="button"
            disabled={!selectedDeparture || bookableCount === 0 || submitting}
            onClick={() => void handleCreateReservation()}
            className="py-3 px-5 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? 'Reservando...' : 'Reservar ahora'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
