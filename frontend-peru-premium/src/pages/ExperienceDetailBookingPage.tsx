import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Hotel,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { catalogApi, hotelsApi, reservationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  calculateNights24h,
  formatLimaDate,
  formatLimaDateTime,
  formatPen,
  parseDecimal,
} from '../lib/format';
import {
  extractHotelEditorialMeta,
  inferDestination,
  mergeWithOfficialDmGoHotels,
  SHOWCASE_HOTELS,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../lib/peruCatalog';
import type {
  CatalogApiType,
  CatalogOfferDetailDto,
  HotelPublicItemDto,
  LodgingProposalDto,
  ReservationDto,
} from '../types/api';
import { PeruPhoto, SectionEyebrow } from '../components/ui/EditorialPrimitives';

export const ExperienceDetailBookingPage: React.FC<{ forcedType?: CatalogApiType }> = ({
  forcedType,
}) => {
  const { type, id } = useParams<{ type?: string; id: string }>();
  const navigate = useNavigate();
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

  const [offer, setOffer] = useState<CatalogOfferDetailDto | null>(null);
  const [hotelsMap, setHotelsMap] = useState<Record<string, HotelPublicItemDto>>({});
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [selectedDepartureId, setSelectedDepartureId] = useState('');
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
        setOffer(detailRes);
        setActivePhotoIdx(0);
        if (detailRes.departures.length > 0) {
          setSelectedDepartureId(detailRes.departures[0]!.id);
        }
      } catch {
        if (!active) return;
        const pool = [...SHOWCASE_TOURS, ...SHOWCASE_PACKAGES];
        const found = pool.find((o) => o.id === id) ?? pool[0]!;
        const map: Record<string, HotelPublicItemDto> = {};
        for (const h of SHOWCASE_HOTELS) map[h.id] = h;
        setHotelsMap(map);
        setOffer(found);
        setActivePhotoIdx(0);
        if (found.departures.length > 0) {
          setSelectedDepartureId(found.departures[0]!.id);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [apiType, id]);

  useEffect(() => {
    let active = true;
    if (!selectedDepartureId) {
      setProposals([]);
      return;
    }

    (async () => {
      setLoadingProposals(true);
      try {
        const res = await hotelsApi.listByDeparture(selectedDepartureId);
        if (!active) return;
        setProposals(res.items);
        if (res.items.length > 0 && res.items[0]!.roomTypes.length > 0) {
          setSelectedProposalId(res.items[0]!.id);
          setSelectedRoomTypeId(res.items[0]!.roomTypes[0]!.id);
        } else {
          setIncludeLodging(false);
        }
      } catch {
        if (!active) return;
        // Propuestas de alojamiento reales de DM GO TRAVEL sincronizadas en vista previa local
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
          id: `prop-${h.id}`,
          hotelId: h.id,
          departureId: selectedDepartureId,
          startDate: startIso,
          endDate: endDateObj.toISOString(),
          roomTypes: h.roomTypes,
        }));

        setProposals(demoProposals);
        if (demoProposals[0]) {
          setSelectedProposalId(demoProposals[0].id);
          const compatibleRoom =
            demoProposals[0].roomTypes.find((r) => r.capacity >= travelers) ??
            demoProposals[0].roomTypes[0];
          if (compatibleRoom) setSelectedRoomTypeId(compatibleRoom.id);
        } else {
          setIncludeLodging(false);
        }
      } finally {
        if (active) setLoadingProposals(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedDepartureId, offer]);

  const selectedDeparture = useMemo(
    () => offer?.departures.find((d) => d.id === selectedDepartureId) ?? null,
    [offer, selectedDepartureId]
  );

  const selectedProposal = useMemo(
    () => proposals.find((p) => p.id === selectedProposalId) ?? null,
    [proposals, selectedProposalId]
  );

  const selectedRoomType = useMemo(
    () => selectedProposal?.roomTypes.find((r) => r.id === selectedRoomTypeId) ?? null,
    [selectedProposal, selectedRoomTypeId]
  );

  // Spec 001 (RF-70, DEC-021): se permite elegir cualquier habitación activa de la propuesta,
  // incluso con capacidad menor al total de viajeros (para alojar solo a parte del grupo sin sobreocupación).
  useEffect(() => {
    if (!selectedProposal) return;
    if (selectedRoomType) return;
    const initial =
      selectedProposal.roomTypes.find((r) => r.capacity >= travelers) ??
      selectedProposal.roomTypes[0];
    if (initial) {
      setSelectedRoomTypeId(initial.id);
    }
  }, [travelers, selectedProposal, selectedRoomType]);

  const maxSpots = selectedDeparture?.available ?? 16;
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

  const handleCreateReservation = async () => {
    if (!selectedDeparture || !offer) return;

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(`${sectionBasePath}/${offer.id}`);
      navigate(`/acceso?mode=login&returnTo=${returnTo}`);
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const demoId = `demo-res-${Date.now().toString().slice(-5)}`;
      const hotelInfo = selectedProposal ? hotelsMap[selectedProposal.hotelId] : undefined;
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
                hotelName: hotelInfo?.name ?? 'Casona Aliada DMGOTRAVEL',
                roomTypeName: selectedRoomType.name,
                capacity: selectedRoomType.capacity,
                checkInDate: selectedProposal.startDate.slice(0, 10),
                checkOutDate: selectedProposal.endDate.slice(0, 10),
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
        'Disponibilidad bloqueada por 15 minutos. Continúa al pago.'
      );
      navigate(`/checkout/${demoId}`);
      return;
    }

    if (user && !user.emailVerified) {
      notifyError(
        new Error('Verifica tu correo electrónico antes de generar una reserva (Spec 005).'),
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
        'Cupos bloqueados por 15 minutos en estado Pendiente.'
      );
      navigate(`/checkout/${created.id}`);
    } catch (err) {
      if (includeLodging) {
        // Spec 001 RF-47, RF-48, RF-49: informar indisponibilidad y ofrecer otra propuesta o continuar sin hotel por decisión explícita del cliente
        setLodgingUnavailableMsg(
          proposals.length > 1
            ? 'La habitación o propuesta seleccionada ya no cuenta con disponibilidad para todas las noches (RF-47). Elige otra propuesta disponible o continúa únicamente con la experiencia turística.'
            : 'El alojamiento seleccionado resultó indisponible (RF-47). Puedes continuar con el tour o paquete sin alojamiento si así lo deseas (RF-49).'
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

  const destination = offer.destinationHint || inferDestination(`${offer.name} ${offer.description}`);
  const gallery =
    offer.images.length > 0
      ? offer.images
      : [{ id: 'fallback', url: '', isPrimary: true, version: 1 }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Encabezado Editorial */}
      <div className="space-y-3">
        <Link
          to={sectionBasePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B73] hover:text-[#B84A27]"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[340px] sm:h-[450px] rounded-3xl overflow-hidden border border-[#E5DDD0]">
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

      {/* Cuerpo en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Columna Editorial Izquierda */}
        <div className="lg:col-span-8 space-y-8">
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
              Sobre el recorrido
            </h2>
            <p className="text-sm text-[#5C6B73] leading-relaxed">{offer.description}</p>
          </section>

          {/* Línea de Tiempo de Itinerario */}
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E]">
              Itinerario día por día
            </h2>
            <div className="space-y-5">
              {offer.itinerary.map((item) => (
                <div
                  key={item.day}
                  className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 pb-5 last:pb-0 border-b last:border-b-0 border-[#E5DDD0]"
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

          {/* Estudio de Alojamiento Opcional Integrado (Spec 001 & 007) */}
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1B5E4A]">
                <Hotel className="w-3.5 h-3.5" />
                Reserva Compuesta Opcional · Spec 007
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#12232E] mt-1">
                ¿Deseas sumar una casona u hotel aliado a esta salida?
              </h2>
            </div>

            {loadingProposals ? (
              <div className="h-24 rounded-xl bg-[#F3EDE2] animate-pulse" />
            ) : proposals.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-xs text-[#5C6B73]">
                Esta fecha opera únicamente en modalidad turística (sin propuestas hoteleras
                vinculadas). Puedes continuar directamente con tu experiencia.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIncludeLodging(false)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      !includeLodging
                        ? 'border-[#12232E] bg-[#12232E] text-white'
                        : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E] hover:border-[#B84A27]'
                    }`}
                  >
                    <p className="text-xs font-bold">Solo experiencia turística</p>
                    <p
                      className={`text-[11px] mt-1 ${
                        !includeLodging ? 'text-white/75' : 'text-[#5C6B73]'
                      }`}
                    >
                      Reservar únicamente cupos del recorrido.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeLodging(true)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      includeLodging
                        ? 'border-[#1B5E4A] bg-[#E7F3EE] text-[#12232E] ring-1 ring-[#1B5E4A]'
                        : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E] hover:border-[#1B5E4A]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1B5E4A]">
                      Consolidar Tour + Casona Aliada
                    </p>
                    <p className="text-[11px] text-[#5C6B73] mt-1">
                      1 habitación validada en todas las noches en un solo pago.
                    </p>
                  </button>
                </div>

                {includeLodging && (
                  <div className="space-y-4">
                    {lodgingUnavailableMsg && (
                      <div className="p-4 rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] space-y-2.5 text-xs text-[#7A4E0D]">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Indisponibilidad de alojamiento detectada (Spec 001 · RF-47..RF-49)
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
                          Continuar con el tour/paquete sin alojamiento (elección expresa · RF-49)
                        </button>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-[11px] text-[#5C6B73]">
                      <strong>Condiciones de estancia (Spec 001 · RF-43, RF-45, RF-46):</strong>{' '}
                      período fijo en múltiplos de 24 h según hora de Perú;{' '}
                      <strong className="text-[#12232E]">
                        no existe tolerancia adicional después del horario de salida asignado
                      </strong>{' '}
                      ni devolución parcial por retiro anticipado.
                    </div>

                    {proposals.map((prop) => {
                      const hotelInfo = hotelsMap[prop.hotelId];
                      const hotelMeta = hotelInfo ? extractHotelEditorialMeta(hotelInfo) : null;
                      const propNights = calculateNights24h(prop.startDate, prop.endDate);
                      const isPropSelected = prop.id === selectedProposalId;

                      return (
                        <div
                          key={prop.id}
                          className={`rounded-2xl border p-5 space-y-4 ${
                            isPropSelected
                              ? 'border-[#1B5E4A] bg-[#FAF7F2]'
                              : 'border-[#E5DDD0] bg-[#FFFCF8]'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-editorial text-xl font-medium text-[#12232E]">
                                  {hotelInfo?.name ?? 'Hotel Aliado DM GO TRAVEL'}
                                </h3>
                                {hotelMeta && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#F3EDE2] text-[10px] font-bold text-[#12232E]">
                                    {hotelMeta.categoryBadge}
                                  </span>
                                )}
                              </div>
                              {hotelMeta && (
                                <p className="text-[11px] text-[#5C6B73] mt-0.5">
                                  {hotelMeta.location} · Check-in {hotelMeta.checkIn} / Check-out{' '}
                                  {hotelMeta.checkOut}
                                </p>
                              )}
                              <p className="text-xs text-[#5C6B73] mt-1 tabular-nums">
                                Estancia asignada: {formatLimaDate(prop.startDate)} →{' '}
                                {formatLimaDate(prop.endDate)} · {propNights}{' '}
                                {propNights === 1 ? 'noche (24h)' : 'noches (períodos 24h)'}
                              </p>
                            </div>
                            {!isPropSelected && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProposalId(prop.id);
                                  setLodgingUnavailableMsg(null);
                                  const preferred =
                                    prop.roomTypes.find((r) => r.capacity >= travelers) ??
                                    prop.roomTypes[0];
                                  if (preferred) {
                                    setSelectedRoomTypeId(preferred.id);
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-lg border border-[#D2C6B4] hover:border-[#1B5E4A] text-xs font-semibold text-[#12232E] cursor-pointer"
                              >
                                Elegir hotel
                              </button>
                            )}
                          </div>

                          {isPropSelected && (
                            <div className="space-y-2">
                              {prop.roomTypes.map((rt) => {
                                const isSelected = rt.id === selectedRoomTypeId;
                                const isPartialGroup = rt.capacity < travelers;
                                const sub = parseDecimal(rt.basePrice) * propNights;
                                return (
                                  <label
                                    key={rt.id}
                                    className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'border-[#1B5E4A] bg-white shadow-sm'
                                        : 'border-[#E5DDD0] bg-white/60 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name={`room-${prop.id}`}
                                        checked={isSelected}
                                        onChange={() => {
                                          setSelectedRoomTypeId(rt.id);
                                          setLodgingUnavailableMsg(null);
                                        }}
                                        className="accent-[#1B5E4A]"
                                      />
                                      <div>
                                        <p className="text-xs font-bold text-[#12232E]">
                                          {rt.name}
                                        </p>
                                        <p className="text-[11px] text-[#5C6B73]">
                                          Capacidad máx.: {rt.capacity}{' '}
                                          {rt.capacity === 1 ? 'huésped' : 'huéspedes'} ·{' '}
                                          {formatPen(rt.basePrice)} / 24h (tarifa fija · RF-42)
                                          {isPartialGroup
                                            ? ` · Alojamiento parcial para hasta ${rt.capacity} de ${travelers} viajeros (RF-70)`
                                            : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <strong className="font-editorial text-lg text-[#12232E] tabular-nums">
                                      + {formatPen(sub)}
                                    </strong>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Condiciones */}
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
              Condiciones y garantías del operador
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

        {/* Columna Derecha Sticky: Cotizador y Bloqueo de Reserva */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 hairline-card rounded-2xl p-6 space-y-5">
          <div className="pb-4 border-b border-[#E5DDD0]">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C6B73]">
              Tarifa oficial por viajero
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="font-editorial text-4xl font-semibold text-[#12232E] tabular-nums">
                {formatPen(pricePerPerson)}
              </strong>
              <span className="text-xs text-[#5C6B73]">PEN</span>
            </div>
          </div>

          {/* Salidas */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E]">
              1. Elige fecha de salida (America/Lima)
            </label>
            {offer.departures.length === 0 ? (
              <p className="p-3 rounded-xl bg-[#FBF4E4] text-xs text-[#855814]">
                Sin salidas futuras activas en este momento.
              </p>
            ) : (
              <div className="space-y-2">
                {offer.departures.map((dep) => {
                  const active = dep.id === selectedDepartureId;
                  return (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => setSelectedDepartureId(dep.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#B84A27] bg-[#F7EAE4]/60 ring-1 ring-[#B84A27]'
                          : 'border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#B84A27]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#12232E]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#B84A27]" />
                          {formatLimaDateTime(dep.startDate)}
                        </span>
                        <span className="tabular-nums">{formatPen(dep.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#5C6B73] mt-1">
                        <span>Fin: {formatLimaDate(dep.endDate)}</span>
                        {dep.available !== null && dep.available !== undefined && (
                          <span className="font-semibold text-[#1B5E4A]">
                            {dep.available} cupos libres
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Viajeros */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E]">
              2. Viajeros en tu reserva
            </label>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2]">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#12232E]">
                <Users className="w-4 h-4 text-[#B84A27]" />
                {travelers} {travelers === 1 ? 'viajero' : 'viajeros'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  aria-label="Reducir viajeros"
                  className="w-8 h-8 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-mono text-xs font-bold">{travelers}</span>
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.min(Math.max(1, maxSpots), t + 1))}
                  aria-label="Aumentar viajeros"
                  className="w-8 h-8 rounded-lg bg-[#FFFCF8] border border-[#E5DDD0] flex items-center justify-center hover:border-[#B84A27] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Desglose Oficial */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[#5C6B73]">
              <span>
                Experiencia ({travelers} × {formatPen(pricePerPerson)})
              </span>
              <strong className="text-[#12232E] tabular-nums">{formatPen(touristSubtotal)}</strong>
            </div>

            {includeLodging && selectedRoomType && (
              <div className="space-y-1.5 pt-1 border-t border-[#E5DDD0]/70">
                <div className="flex items-center justify-between text-[#5C6B73]">
                  <span>
                    Alojamiento ({nights}n × {formatPen(nightlyRate)})
                  </span>
                  <strong className="text-[#1B5E4A] tabular-nums">
                    {formatPen(lodgingSubtotal)}
                  </strong>
                </div>
                <p className="text-[10px] text-[#5C6B73]">
                  Viajeros totales del grupo: <strong className="text-[#12232E]">{travelers}</strong> ·
                  Capacidad de habitación elegida:{' '}
                  <strong className="text-[#1B5E4A]">
                    {selectedRoomType.capacity}{' '}
                    {selectedRoomType.capacity === 1 ? 'huésped' : 'huéspedes'}
                  </strong>{' '}
                  (RF-71, RF-72)
                </p>
              </div>
            )}

            <div className="pt-2.5 border-t border-[#E5DDD0] flex items-baseline justify-between">
              <span className="font-bold text-[#12232E]">Total Estimado (PEN)</span>
              <strong className="font-editorial text-2xl font-semibold text-[#12232E] tabular-nums">
                {formatPen(estimatedTotal)}
              </strong>
            </div>

            <p className="text-[10px] text-[#5C6B73] flex items-center gap-1.5 pt-1">
              <Lock className="w-3 h-3 text-[#1B5E4A] shrink-0" />
              Importe oficial recalculado y congelado por el backend (RN-03).
            </p>
          </div>

          {isAuthenticated && user && !user.emailVerified && !isDemoSession && (
            <div className="p-3 rounded-xl bg-[#FBF4E4] border border-[#E8D2A0] text-xs text-[#855814] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Debes verificar tu correo antes de reservar.{' '}
                <Link to="/acceso?mode=verify" className="underline font-bold">
                  Verificar ahora
                </Link>
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={offer.departures.length === 0 || submitting}
            onClick={() => void handleCreateReservation()}
            className="w-full py-3.5 px-5 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold shadow-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? 'Bloqueando disponibilidad...' : 'Reservar y pasar al checkout'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-[#5C6B73] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B5E4A] shrink-0 mt-0.5" />
            <span>
              Nace en estado <strong>Pendiente</strong> por 15 minutos con clave de idempotencia.
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
};
