import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Hotel,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { catalogApi, hotelsApi, reservationsApi } from '../api/services';
import { SmartImage } from '../components/ui/SmartImage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  calculateNights24h,
  formatLimaDate,
  formatLimaDateTime,
  formatPen,
  parseDecimal,
} from '../lib/format';
import { SHOWCASE_HOTELS, SHOWCASE_PACKAGES, SHOWCASE_TOURS } from '../lib/mediaCatalog';
import type {
  CatalogApiType,
  CatalogOfferDetailDto,
  HotelPublicItemDto,
  LodgingProposalDto,
} from '../types/api';

export const OfferDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const apiType: CatalogApiType = type === 'packages' ? 'packages' : 'tours';

  const [offer, setOffer] = useState<CatalogOfferDetailDto | null>(null);
  const [hotelsMap, setHotelsMap] = useState<Record<string, HotelPublicItemDto>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Configuración de Reserva Compuesta (Spec 001 & 007)
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
  const [travelers, setTravelers] = useState<number>(2);
  const [proposals, setProposals] = useState<LodgingProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(false);
  const [includeLodging, setIncludeLodging] = useState<boolean>(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

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

        const map: Record<string, HotelPublicItemDto> = {};
        for (const h of publicHotelsRes.items) {
          map[h.id] = h;
        }
        setHotelsMap(map);
        setOffer(detailRes);
        if (detailRes.departures.length > 0) {
          setSelectedDepartureId(detailRes.departures[0].id);
        }
      } catch {
        if (!active) return;
        const fallbackPool = [...SHOWCASE_TOURS, ...SHOWCASE_PACKAGES];
        const found = fallbackPool.find((o) => o.id === id) ?? fallbackPool[0];
        const map: Record<string, HotelPublicItemDto> = {};
        for (const h of SHOWCASE_HOTELS) map[h.id] = h;
        setHotelsMap(map);
        setOffer(found);
        if (found.departures.length > 0) {
          setSelectedDepartureId(found.departures[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [apiType, id]);

  // Cargar propuestas de alojamiento vinculadas a la salida concreta (GET /api/v1/departures/{id}/lodging)
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
        if (res.items.length > 0 && res.items[0].roomTypes.length > 0) {
          setSelectedProposalId(res.items[0].id);
          setSelectedRoomTypeId(res.items[0].roomTypes[0].id);
        } else {
          setIncludeLodging(false);
          setSelectedProposalId('');
          setSelectedRoomTypeId('');
        }
      } catch {
        if (!active) return;
        // Si estamos en vista demostrativa offline, mostrar propuesta de muestra
        if (apiOnline === false) {
          const demoProposal: LodgingProposalDto = {
            id: '00000000-0000-4000-8000-000000000501',
            hotelId: SHOWCASE_HOTELS[0].id,
            departureId: selectedDepartureId,
            startDate: '2026-12-18T15:00:00Z',
            endDate: '2026-12-20T15:00:00Z',
            roomTypes: [
              {
                id: '00000000-0000-4000-8000-000000000601',
                name: 'Suite Matrimonial / Doble Superior',
                capacity: 2,
                basePrice: '240.00',
                currency: 'PEN',
                images: SHOWCASE_HOTELS[0].images,
              },
              {
                id: '00000000-0000-4000-8000-000000000602',
                name: 'Habitación Triple Familiar Colonial',
                capacity: 3,
                basePrice: '310.00',
                currency: 'PEN',
                images: SHOWCASE_HOTELS[0].images,
              },
            ],
          };
          setProposals([demoProposal]);
          setSelectedProposalId(demoProposal.id);
          setSelectedRoomTypeId(demoProposal.roomTypes[0].id);
        } else {
          setProposals([]);
          setIncludeLodging(false);
        }
      } finally {
        if (active) setLoadingProposals(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedDepartureId, apiOnline]);

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

  const maxAvailableSpots = selectedDeparture?.available ?? 20;

  // Estimación informativa en pantalla (el backend recalcula el importe oficial en RN-03)
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
    if (!selectedDeparture) return;

    if (apiOnline === false) {
      navigate(
        `/checkout/demo-res-4821?offer=${encodeURIComponent(offer?.name ?? '')}&travelers=${travelers}&total=${estimatedTotal.toFixed(2)}`
      );
      return;
    }

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(`/catalogo/${apiType}/${id}`);
      navigate(`/acceso?mode=login&returnTo=${returnTo}`);
      return;
    }

    if (user && !user.emailVerified) {
      notifyError(
        new Error(
          'Debes verificar tu correo electrónico antes de crear una reserva (Spec 005). Te redirigimos a la verificación.'
        ),
        'Correo pendiente de verificación'
      );
      navigate('/acceso?mode=verify');
      return;
    }

    setSubmitting(true);
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
        'Tus cupos quedaron bloqueados por 15 minutos en estado Pendiente.'
      );
      navigate(`/checkout/${created.id}`);
    } catch (err) {
      notifyError(err, 'No se pudo crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-6">
        <div className="h-10 w-2/3 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="max-w-xl mx-auto my-20 text-center space-y-4">
        <h2 className="font-headline font-bold text-2xl text-slate-900">Oferta no disponible</h2>
        <Link
          to="/catalogo"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
        >
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const gallery = offer.images.length > 0 ? offer.images : [{ id: '0', url: '', isPrimary: true, version: 1 }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-400">
          <Link to="/" className="hover:text-[#0B3B5B]">
            Inicio
          </Link>{' '}
          /{' '}
          <Link to={`/catalogo?tab=${apiType}`} className="hover:text-[#0B3B5B]">
            {apiType === 'packages' ? 'Paquetes Turísticos' : 'Tours'}
          </Link>{' '}
          / <span className="text-slate-700">{offer.name}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase text-white ${
              offer.type === 'package' ? 'bg-[#146C53]' : 'bg-[#0B3B5B]'
            }`}
          >
            {offer.type === 'package' ? 'PAQUETE TURÍSTICO' : 'TOUR OFICIAL'}
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
            Duración: {offer.durationDays === 1 ? '1 Día (24h)' : `${offer.durationDays} Días`}
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-[#146C53] text-[11px] font-semibold">
            Moneda Oficial: PEN (S/)
          </span>
        </div>

        <h1 className="font-headline font-extrabold text-2xl sm:text-4xl text-[#0B3B5B] leading-tight">
          {offer.name}
        </h1>
      </div>

      {/* Bento Galería Multimedia (Spec 012) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[340px] sm:h-[420px] rounded-2xl overflow-hidden">
        <div className={gallery.length > 1 ? 'lg:col-span-7 h-full' : 'lg:col-span-12 h-full'}>
          <SmartImage
            src={gallery[0]?.url}
            alt={offer.name}
            category={offer.type === 'package' ? 'package' : 'tour'}
            seedIndex={0}
            className="w-full h-full object-cover"
          />
        </div>
        {gallery.length > 1 && (
          <div className="hidden lg:grid lg:col-span-5 grid-cols-2 gap-3 h-full">
            {gallery.slice(1, 5).map((img, i) => (
              <SmartImage
                key={img.id}
                src={img.url}
                alt={`${offer.name} vista ${i + 2}`}
                category={offer.type === 'package' ? 'package' : 'tour'}
                seedIndex={i + 1}
                className="w-full h-full object-cover rounded-xl"
              />
            ))}
          </div>
        )}
      </div>

      {/* Cuerpo en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda (8 cols): Descripción, Itinerario, Alojamiento Opcional y Condiciones */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <h2 className="font-headline font-bold text-xl text-slate-900">
              Descripción de la Experiencia
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{offer.description}</p>
          </section>

          {/* Itinerario Estructurado por Día (OfferItineraryDay) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <h2 className="font-headline font-bold text-xl text-slate-900">
              Itinerario Oficial Día por Día
            </h2>
            <div className="space-y-4">
              {offer.itinerary.map((item) => (
                <div
                  key={item.day}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#0B3B5B] text-white font-headline font-extrabold text-xs flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase opacity-75">Día</span>
                    <span className="text-sm tabular-nums">{item.day}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline font-bold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Módulo de Alojamiento Opcional Vinculado a la Salida (Spec 007 & 001) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#146C53]">
                  <Hotel className="w-3.5 h-3.5" />
                  Reserva Compuesta Opcional (RN-09 a RN-13)
                </span>
                <h2 className="font-headline font-bold text-xl text-slate-900 mt-1">
                  Propuestas de Alojamiento para la Salida Seleccionada
                </h2>
              </div>
            </div>

            {loadingProposals ? (
              <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ) : proposals.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Esta salida se opera únicamente en modalidad turística (sin propuestas hoteleras
                asociadas actualmente). Puedes continuar con tu reserva turística directamente.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIncludeLodging(false)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      !includeLodging
                        ? 'border-[#0B3B5B] bg-[#0B3B5B]/5 ring-1 ring-[#0B3B5B]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-headline font-bold text-sm text-slate-900">
                      Solo experiencia turística
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sin agregar hotel aliado a esta reserva.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeLodging(true)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      includeLodging
                        ? 'border-[#146C53] bg-emerald-50/50 ring-1 ring-[#146C53]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-headline font-bold text-sm text-[#146C53]">
                      Consolidar Tour + Hotel Aliado
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      1 habitación validada en todas las noches en la misma transacción.
                    </p>
                  </button>
                </div>

                {includeLodging && (
                  <div className="space-y-4 pt-2">
                    {proposals.map((prop) => {
                      const hotelInfo = hotelsMap[prop.hotelId];
                      const propNights = calculateNights24h(prop.startDate, prop.endDate);
                      const isPropSelected = prop.id === selectedProposalId;

                      return (
                        <div
                          key={prop.id}
                          className={`rounded-2xl border p-5 space-y-4 ${
                            isPropSelected
                              ? 'border-[#0B3B5B] bg-slate-50/70'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-headline font-bold text-base text-slate-900">
                                {hotelInfo?.name ?? 'Hotel Aliado Verificado'}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                Check-in: {formatLimaDate(prop.startDate)} → Check-out:{' '}
                                {formatLimaDate(prop.endDate)} ({propNights}{' '}
                                {propNights === 1 ? 'período de 24h' : 'períodos de 24h'})
                              </p>
                            </div>
                            {!isPropSelected && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProposalId(prop.id);
                                  if (prop.roomTypes[0]) setSelectedRoomTypeId(prop.roomTypes[0].id);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                              >
                                Seleccionar este hotel
                              </button>
                            )}
                          </div>

                          {isPropSelected && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Selecciona Tipo de Habitación (1 habitación por reserva · Tarifa ×
                                períodos):
                              </p>
                              {prop.roomTypes.map((rt) => {
                                const isRoomSelected = rt.id === selectedRoomTypeId;
                                const roomSubtotal = parseDecimal(rt.basePrice) * propNights;
                                return (
                                  <label
                                    key={rt.id}
                                    className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                      isRoomSelected
                                        ? 'border-[#146C53] bg-white shadow-xs'
                                        : 'border-slate-200 bg-white/60 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name={`room-${prop.id}`}
                                        checked={isRoomSelected}
                                        onChange={() => setSelectedRoomTypeId(rt.id)}
                                        className="accent-[#146C53]"
                                      />
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">
                                          {rt.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                          Capacidad alojable: hasta {rt.capacity} personas ·{' '}
                                          {formatPen(rt.basePrice)} / noche
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-headline font-extrabold text-sm text-[#0B3B5B] tabular-nums">
                                      + {formatPen(roomSubtotal)}
                                    </span>
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

          {/* Condiciones Comerciales */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3">
            <h2 className="font-headline font-bold text-lg text-slate-900">
              Condiciones Comerciales y Reglas de Reserva
            </h2>
            <ul className="space-y-2 text-xs text-slate-600">
              {offer.conditions.map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#146C53] shrink-0 mt-0.5" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Columna Derecha (4 cols): Widget Sticky de Cotización y Creación de Reserva */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Tarifa efectiva de salida
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-headline font-extrabold text-3xl text-[#0B3B5B] tabular-nums">
                {formatPen(pricePerPerson)}
              </span>
              <span className="text-xs text-slate-500">/ persona</span>
            </div>
          </div>

          {/* Selector de Salida Programada */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              1. Salida Programada (America/Lima)
            </label>
            {offer.departures.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                No existen salidas futuras activas para esta oferta en este momento.
              </div>
            ) : (
              <div className="space-y-2">
                {offer.departures.map((dep) => {
                  const selected = dep.id === selectedDepartureId;
                  return (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => setSelectedDepartureId(dep.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[#0B3B5B] bg-[#0B3B5B]/5 ring-1 ring-[#0B3B5B]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D95D39]" />
                          {formatLimaDateTime(dep.startDate)}
                        </span>
                        <span className="tabular-nums text-[#0B3B5B]">{formatPen(dep.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                        <span>Fin: {formatLimaDateTime(dep.endDate)}</span>
                        {dep.available !== null && dep.available !== undefined && (
                          <span className="font-semibold text-[#146C53]">
                            {dep.available} de {dep.capacity} cupos libres
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cantidad de Viajeros */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              2. Cantidad de Viajeros
            </label>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Users className="w-4 h-4 text-[#0B3B5B]" />
                Viajeros en el grupo
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  aria-label="Disminuir viajeros"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-headline font-extrabold text-sm w-6 text-center tabular-nums">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.min(Math.max(1, maxAvailableSpots), t + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  aria-label="Aumentar viajeros"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Resumen de Importes (RN-03 / RF-19) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 tabular-nums">
              <span>
                Subtotal Turístico ({travelers} × {formatPen(pricePerPerson)})
              </span>
              <span className="font-semibold text-slate-900">{formatPen(touristSubtotal)}</span>
            </div>

            {includeLodging && selectedRoomType && (
              <div className="flex items-center justify-between text-slate-600 tabular-nums">
                <span>
                  Alojamiento ({nights}n × {formatPen(nightlyRate)})
                </span>
                <span className="font-semibold text-slate-900">{formatPen(lodgingSubtotal)}</span>
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
              <span className="font-headline font-bold text-sm text-slate-900">
                Total Oficial (PEN)
              </span>
              <span className="font-headline font-extrabold text-2xl text-[#0B3B5B] tabular-nums">
                {formatPen(estimatedTotal)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#146C53] shrink-0" />
              El importe definitivo es validado y congelado exclusivamente por el servidor.
            </p>
          </div>

          {isAuthenticated && user && !user.emailVerified && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>
                Tu cuenta requiere <strong>verificación de correo</strong> para reservar.{' '}
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
            className="w-full py-3.5 px-5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] disabled:opacity-50 text-white font-headline font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? 'Bloqueando disponibilidad...' : 'Crear Reserva y Continuar al Pago'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#146C53] shrink-0 mt-0.5" />
            <span>
              Tu reserva nacerá en estado <strong>Pendiente</strong> por <strong>15 minutos</strong>{' '}
              con protección idempotente antes de procesar el cobro en Culqi.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
