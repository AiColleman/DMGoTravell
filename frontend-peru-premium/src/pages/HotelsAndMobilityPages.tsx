import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Coffee,
  HeartHandshake,
  Hotel,
  ImageIcon,
  Info,
  Leaf,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { hotelsApi, mobilityApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatPen, parseDecimal } from '../lib/format';
import {
  DMGO_AGENCY_CONTACT,
  extractHotelEditorialMeta,
  mergeWithOfficialDmGoHotels,
  PERU_ASSETS,
  resolveMediaUrl,
  SHOWCASE_HOTELS,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_MOBILITY,
  sortHotelsAlphabetically,
} from '../lib/peruCatalog';
import type {
  HotelPublicDetailDto,
  HotelPublicItemDto,
  MobilityPublicItemDto,
} from '../types/api';
import {
  HotelEditorialCard,
  PeruPhoto,
  SectionEyebrow,
} from '../components/ui/EditorialPrimitives';

export const HotelsCatalogPage: React.FC = () => {
  const [hotels, setHotels] = useState<HotelPublicItemDto[]>(() =>
    sortHotelsAlphabetically(SHOWCASE_HOTELS)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await hotelsApi.listPublic();
        if (!active) return;
        setHotels(mergeWithOfficialDmGoHotels(res.items));
      } catch {
        // Conserva el catálogo real completo de 9 hoteles de DM GO TRAVEL cuando la API está apagada
        if (active) setHotels(sortHotelsAlphabetically(SHOWCASE_HOTELS));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const orderedHotels = useMemo(() => sortHotelsAlphabetically(hotels), [hotels]);

  const lowestCatalogPrice = useMemo(() => {
    const prices = orderedHotels
      .map((h) => (h.lowestBasePrice ? parseDecimal(h.lowestBasePrice) : 0))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 80;
  }, [orderedHotels]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      {/* Cabecera Oficial del Catálogo de Hoteles en Ayacucho — DM GO TRAVEL */}
      <div className="pb-8 border-b border-[#E5DDD0] flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3.5 max-w-3xl">
          <SectionEyebrow>
            Catálogo Oficial de Alojamiento · Ayacucho · Spec 007
          </SectionEyebrow>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#12232E] leading-[1.08]">
            Catálogo de Hoteles en Ayacucho — DM GO TRAVEL
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] leading-relaxed">
            <strong>{DMGO_AGENCY_CONTACT.tagline}.</strong> Propiedades aliadas verificadas en torno
            a la Plaza Mayor de Huamanga (casonas coloniales, hoteles boutique eco-amigables y
            apart-hoteles modernos) para consolidar junto a tu tour o paquete en una sola operación
            transaccional en Soles Peruanos (<code>PEN</code>).
          </p>
        </div>

        {/* Ficha de Contacto Oficial DM GO TRAVEL */}
        <div className="hairline-card rounded-2xl p-4 sm:p-5 space-y-2.5 lg:min-w-[300px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1B5E4A]">
              Atención Oficial Ayacucho
            </span>
            <a
              href={DMGO_AGENCY_CONTACT.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#B84A27] hover:underline"
            >
              {DMGO_AGENCY_CONTACT.socialHandle}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <a
              href={DMGO_AGENCY_CONTACT.whatsappPrimaryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7F3EE] text-[#15523F] text-xs font-bold hover:bg-[#1B5E4A] hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {DMGO_AGENCY_CONTACT.phones[0]}
            </a>
            <a
              href={DMGO_AGENCY_CONTACT.whatsappSecondaryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EDE2] text-[#12232E] text-xs font-bold hover:bg-[#12232E] hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#B84A27]" />
              {DMGO_AGENCY_CONTACT.phones[1]}
            </a>
          </div>
          <p className="text-[11px] text-[#5C6B73]">
            Orden alfabético oficial A–Z · Desde{' '}
            <strong className="text-[#12232E]">{formatPen(lowestCatalogPrice)}</strong> / 24h
          </p>
        </div>
      </div>

      {/* Cinta informativa sobre reglas Spec 007 e imágenes referenciales reemplazables */}
      <div className="rounded-2xl border border-[#E5DDD0] bg-[#FFFCF8] px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-[#5C6B73]">
        <div className="flex items-start sm:items-center gap-3">
          <Sparkles className="w-4 h-4 text-[#B84A27] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Mostrando <strong className="text-[#12232E]">{orderedHotels.length}</strong> propiedades
            activas en orden alfabético sin paginación ni filtros (<strong>Spec 007 · RF-2, RF-7 &amp; DEC-115</strong>).
            Las fotografías actuales son vistas editoriales referenciales listas para actualizarse por
            las originales desde la consola administrativa.
          </span>
        </div>
        <Link
          to="/tours?destination=Ayacucho"
          className="inline-flex items-center gap-1.5 font-bold text-[#B84A27] hover:underline shrink-0"
        >
          Elegir salida en Ayacucho
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-[#F3EDE2] animate-pulse" />
          ))}
        </div>
      ) : orderedHotels.length === 0 ? (
        <div className="hairline-card rounded-2xl p-12 text-center space-y-4">
          <p className="font-editorial text-2xl text-[#12232E]">
            No hay hoteles públicamente visibles en este momento
          </p>
          <p className="text-xs text-[#5C6B73] max-w-md mx-auto">
            Puedes explorar nuestras salidas activas de tours y paquetes turísticos por Ayacucho,
            Cusco, Arequipa y Lima.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/tours"
              className="px-5 py-2.5 rounded-xl bg-[#B84A27] text-white text-xs font-bold"
            >
              Ir a Tours Turísticos
            </Link>
            <Link
              to="/paquetes"
              className="px-5 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
            >
              Ir a Paquetes Turísticos
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orderedHotels.map((hotel, idx) => (
            <HotelEditorialCard key={hotel.id} hotel={hotel} seedIndex={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apiOnline } = useAuth();
  const [hotel, setHotel] = useState<HotelPublicDetailDto | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    let active = true;
    if (!id) {
      setNotAvailable(true);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setNotAvailable(false);
      setActiveImageIdx(0);
      try {
        const detail = await hotelsApi.getPublicDetail(id);
        if (active) {
          const officialFallback = SHOWCASE_HOTELS_DETAIL.find(
            (h) =>
              h.id.toLowerCase() === detail.id.toLowerCase() ||
              h.name.trim().toLowerCase() === detail.name.trim().toLowerCase()
          );
          if (officialFallback && detail.images.length < 3) {
            setHotel({
              ...officialFallback,
              ...detail,
              images: [
                ...detail.images,
                ...officialFallback.images.filter(
                  (img) => !detail.images.some((cur) => cur.id === img.id)
                ),
              ],
            });
          } else {
            setHotel(detail);
          }
        }
      } catch (err) {
        if (!active) return;
        const found = SHOWCASE_HOTELS_DETAIL.find((h) => h.id === id) ?? null;
        const status = (err as { status?: number } | null)?.status;
        // Si no es uno de los 9 hoteles oficiales sembrables ni existe en API -> «Hotel no disponible» (Spec 007 RF-11)
        if (!found || (apiOnline === true && status === 404 && !id.startsWith('00000000-0000-4000-8007-'))) {
          setHotel(null);
          setNotAvailable(true);
        } else {
          setHotel(found);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, apiOnline]);

  const sortedRooms = useMemo(() => {
    if (!hotel) return [];
    return [...hotel.roomTypes].sort((a, b) => {
      const diff = parseDecimal(a.basePrice) - parseDecimal(b.basePrice);
      if (diff !== 0) return diff;
      if (a.capacity !== b.capacity) return a.capacity - b.capacity;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [hotel]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-6">
        <div className="h-10 w-1/2 rounded-xl bg-[#F3EDE2] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#F3EDE2] animate-pulse" />
      </div>
    );
  }

  // Spec 007 RF-11: SI el hotel solicitado no existe, está inactivo o fue eliminado lógicamente -> «Hotel no disponible»
  if (notAvailable || !hotel) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#FBECE9] text-[#8E2B17] flex items-center justify-center mx-auto">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="font-editorial text-4xl text-[#12232E]">Hotel no disponible</h1>
        <p className="text-xs sm:text-sm text-[#5C6B73] max-w-md mx-auto leading-relaxed">
          La propiedad solicitada no existe, se encuentra desactivada temporalmente o no está
          habilitada para consulta pública conforme a la especificación del sistema (Spec 007 · RF-11).
        </p>
        <Link
          to="/hoteles"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#12232E] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo de hoteles
        </Link>
      </div>
    );
  }

  const meta = extractHotelEditorialMeta(hotel);
  const gallery =
    hotel.images.length > 0
      ? hotel.images
      : [{ id: 'fallback-main', url: '', isPrimary: true, version: 1 }];
  const lowestPrice =
    hotel.lowestBasePrice ?? (sortedRooms[0] ? sortedRooms[0].basePrice : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Migas y Encabezado Oficial */}
      <div className="space-y-3">
        <Link
          to="/hoteles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B73] hover:text-[#B84A27]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Catálogo de Hoteles en Ayacucho
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {hotel.hasAvailability ? (
            <span className="px-3 py-1 rounded-full bg-[#E7F3EE] text-[#15523F] text-[10px] font-bold uppercase tracking-wider">
              Disponible para salidas compatibles
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-[#FBECE9] text-[#8E2B17] text-[10px] font-bold uppercase tracking-wider">
              Sin disponibilidad
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F3EDE2] text-[#12232E] text-[10px] font-bold uppercase tracking-wider">
            {meta.stars ? <Star className="w-3 h-3 text-[#C89B54] fill-[#C89B54]" /> : null}
            {meta.categoryBadge}
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-[#5C6B73]">
            <MapPin className="w-3.5 h-3.5 text-[#B84A27]" />
            {meta.location}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <h1 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
            {hotel.name}
          </h1>

          {lowestPrice && (
            <div className="lg:text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B73]">
                Tarifa base desde
              </span>
              <strong className="font-editorial text-3xl text-[#12232E] tabular-nums">
                {formatPen(lowestPrice)}
              </strong>
              <span className="text-xs text-[#5C6B73] ml-1">/ 24h</span>
            </div>
          )}
        </div>
      </div>

      {/* Galería Principal + Miniaturas (Spec 007 RF-6 & RF-45) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[320px] sm:h-[430px] rounded-2xl overflow-hidden border border-[#E5DDD0]">
          <div className={gallery.length > 1 ? 'lg:col-span-8 h-full relative' : 'lg:col-span-12 h-full relative'}>
            <PeruPhoto
              src={gallery[activeImageIdx]?.url}
              alt={hotel.name}
              category="hotel"
              seedIndex={activeImageIdx}
              hintText={`${meta.destination} ${hotel.name}`}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#12232E]/80 backdrop-blur-xs text-[10px] font-semibold text-[#FAF7F2] inline-flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3 text-[#C89B54]" />
              Vista {activeImageIdx + 1} de {gallery.length} · Fotografía referencial reemplazable
            </span>
          </div>

          {gallery.length > 1 && (
            <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-3 h-full">
              {gallery.slice(1, 3).map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIdx(i + 1)}
                  className="w-full h-full overflow-hidden relative group cursor-pointer"
                >
                  <PeruPhoto
                    src={img.url}
                    alt={`${hotel.name} galería ${i + 2}`}
                    category={i === 0 ? 'room' : 'hotel'}
                    seedIndex={i + 1}
                    hintText={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {gallery.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={`h-14 w-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImageIdx === idx
                    ? 'border-[#B84A27] shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <PeruPhoto
                  src={img.url}
                  alt={`${hotel.name} miniatura ${idx + 1}`}
                  category="hotel"
                  seedIndex={idx}
                  hintText={hotel.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cuerpo en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Ficha Técnica Operativa de DM GO TRAVEL */}
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
                Información operativa y servicios del hotel
              </h2>
              <span className="text-[11px] font-semibold text-[#1B5E4A]">
                {meta.proximity}
              </span>
            </div>

            <p className="text-sm text-[#5C6B73] leading-relaxed">{meta.summaryText}</p>

            {/* Bloques de Ubicación y Horarios Oficiales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B84A27]" />
                  Ubicación en Ayacucho
                </span>
                <p className="text-xs font-semibold text-[#12232E] leading-snug">{meta.location}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#1B5E4A]" />
                  Horario Oficial
                </span>
                <p className="text-xs font-semibold text-[#12232E]">
                  Check-in: {meta.checkIn}
                </p>
                <p className="text-[11px] text-[#5C6B73]">
                  Check-out: {meta.checkOut}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73] inline-flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-[#B84A27]" />
                  Régimen Matutino
                </span>
                <p className="text-xs font-semibold text-[#12232E] leading-snug">
                  {meta.breakfastPartner
                    ? `Atendido en ${meta.breakfastPartner}`
                    : 'Servido en instalaciones propias'}
                </p>
                <p className="text-[11px] text-[#5C6B73]">7:00 am – 9:00 am</p>
              </div>
            </div>

            {/* Lista Libre de Servicios (Spec 007 RF-58) */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
                Servicios incluidos ({hotel.services.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {hotel.services.map((srv) => (
                  <span
                    key={srv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EDE2] text-xs font-medium text-[#12232E]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E4A] shrink-0" />
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Habitaciones y Tarifas Oficiales (Spec 007 RF-6, RF-10, RF-22, RF-32, RF-55, RF-56) */}
          <section className="hairline-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#E5DDD0]">
              <div>
                <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
                  Habitaciones y Tarifas Oficiales ({sortedRooms.length})
                </h2>
                <p className="text-xs text-[#5C6B73] mt-1">
                  Tarifa única por tipo de habitación y período completo de 24 horas en Soles
                  Peruanos (<code>PEN</code>), sin multiplicar por número de ocupantes (Spec 007 · RF-32).
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#5C6B73]">
                Disponibilidad validada por salida (RF-10)
              </span>
            </div>

            <div className="divide-y divide-[#E5DDD0]">
              {sortedRooms.map((rt, idx) => {
                // Spec 007 RF-55 & RF-56: si un tipo de habitación NO tiene fotos, mostrarlo SIN imagen ni placeholder
                const hasRoomPhotos = rt.images && rt.images.length > 0;
                const primaryRoomPhoto = hasRoomPhotos
                  ? resolveMediaUrl(
                      rt.images.find((i) => i.isPrimary)?.url ?? rt.images[0]?.url,
                      'room',
                      idx,
                      rt.name
                    )
                  : null;

                return (
                  <div
                    key={rt.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {hasRoomPhotos && primaryRoomPhoto && (
                        <img
                          src={primaryRoomPhoto}
                          alt={`${hotel.name} — ${rt.name}`}
                          loading="lazy"
                          className="w-24 h-16 rounded-xl object-cover border border-[#E5DDD0] shrink-0 bg-[#F3EDE2]"
                        />
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-[#12232E]">{rt.name}</h3>
                        <p className="text-xs text-[#5C6B73] mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#B84A27]" />
                            Capacidad máx.: <strong>{rt.capacity}</strong>{' '}
                            {rt.capacity === 1 ? 'huésped' : 'huéspedes'}
                          </span>
                          <span>·</span>
                          <span>1 habitación por reserva</span>
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:block items-baseline justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5DDD0]/60">
                      <span className="block text-[10px] uppercase tracking-wider text-[#5C6B73]">
                        Tarifa oficial ({rt.currency})
                      </span>
                      <strong className="font-editorial text-2xl text-[#12232E] tabular-nums">
                        {formatPen(rt.basePrice)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex items-start gap-2.5 text-[11px] text-[#5C6B73]">
              <Info className="w-4 h-4 text-[#1B5E4A] shrink-0 mt-0.5" />
              <span>
                Conforme a <strong>Spec 007 (RF-10 &amp; RF-37)</strong>, el inventario exacto por
                noche se comprueba automáticamente en todas las fechas del período al vincular este
                hotel con una salida turística de Ayacucho.
              </span>
            </div>
          </section>
        </div>

        {/* Panel Lateral Sticky: Reserva Compuesta Spec 001/007 + Contacto Directo DM GO TRAVEL */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="hairline-card rounded-2xl p-6 space-y-5">
            <div className="w-11 h-11 rounded-xl bg-[#E7F3EE] text-[#1B5E4A] flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>

            <div className="space-y-2">
              <h3 className="font-editorial text-2xl font-medium text-[#12232E]">
                ¿Cómo reservar en {hotel.name}?
              </h3>
              <p className="text-xs text-[#5C6B73] leading-relaxed">
                En <strong>DM GO TRAVEL</strong> el alojamiento se contrata de forma integrada junto
                con una salida turística compatible (<strong>Reserva Compuesta · Spec 001 &amp; 007 RF-53</strong>).
                Elige primero tu tour o paquete en Ayacucho y selecciona esta propiedad y tu tipo de
                habitación en un solo pago verificado.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                to={`/tours?destination=${encodeURIComponent(meta.destination === 'Perú' ? 'Ayacucho' : meta.destination)}`}
                className="w-full py-3 px-5 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Elegir Tour en {meta.destination} + Hotel
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/paquetes?destination=${encodeURIComponent(meta.destination === 'Perú' ? 'Ayacucho' : meta.destination)}`}
                className="w-full py-3 px-5 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Ver Paquetes en {meta.destination}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Tarjeta Oficial de Contacto DM GO TRAVEL */}
          <div className="hairline-card rounded-2xl p-5 space-y-3 bg-[#FAF7F2]">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B84A27] block">
              Asesoría al Viajero · {DMGO_AGENCY_CONTACT.socialHandle}
            </span>
            <p className="text-xs text-[#5C6B73] leading-relaxed">
              ¿Viajas en familia o delegación a Huamanga? Consulta salidas programadas y
              compatibilidad de habitaciones con nuestro equipo en Ayacucho:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={DMGO_AGENCY_CONTACT.whatsappPrimaryUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-[#E5DDD0] bg-[#FFFCF8] hover:border-[#1B5E4A] text-center text-xs font-bold text-[#12232E] transition-colors"
              >
                {DMGO_AGENCY_CONTACT.phones[0]}
              </a>
              <a
                href={DMGO_AGENCY_CONTACT.whatsappSecondaryUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-[#E5DDD0] bg-[#FFFCF8] hover:border-[#B84A27] text-center text-xs font-bold text-[#12232E] transition-colors"
              >
                {DMGO_AGENCY_CONTACT.phones[1]}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const MobilityFleetPage: React.FC = () => {
  const [units, setUnits] = useState<MobilityPublicItemDto[]>(SHOWCASE_MOBILITY);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await mobilityApi.listPublic();
        if (active && res.items.length > 0) setUnits(res.items);
      } catch {
        // Conserva flota editorial de respaldo
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="pb-8 border-b border-[#E5DDD0] space-y-3">
        <SectionEyebrow>Movilidad Turística Informativa · Spec 013</SectionEyebrow>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#12232E]">
          Flota certificada para rutas altoandinas y costeras
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B73] max-w-3xl leading-relaxed">
          Conoce el equipamiento técnico y la capacidad de las unidades con las que operamos
          nuestros circuitos. Conforme a la especificación oficial del sistema, este módulo es
          estrictamente informativo y no comercializa alquiler de vehículos por separado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {units.map((u, idx) => (
          <article key={u.id} className="hairline-card rounded-2xl overflow-hidden flex flex-col">
            <div className="h-56 relative bg-[#F3EDE2]">
              <PeruPhoto
                src={u.image?.url}
                alt={u.name}
                category="mobility"
                seedIndex={idx}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#12232E]/90 text-[#C89B54] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Bus className="w-3 h-3" />
                {u.vehicleTypeHint || 'Unidad Turística'}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="font-editorial text-2xl font-medium text-[#12232E]">{u.name}</h2>
              <p className="text-xs text-[#5C6B73] leading-relaxed mt-2 flex-1">{u.description}</p>
              <div className="mt-5 pt-4 border-t border-[#E5DDD0] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#12232E] inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B84A27]" />
                  Hasta {u.capacity} viajeros
                </span>
                <span className="px-2.5 py-1 rounded bg-[#F3EDE2] text-[10px] font-bold uppercase text-[#5C6B73]">
                  Incluido según tour
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-14">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-6 space-y-5">
        <SectionEyebrow>Nuestra Identidad · DM GO TRAVEL ({DMGO_AGENCY_CONTACT.socialHandle})</SectionEyebrow>
        <h1 className="font-editorial text-4xl sm:text-6xl font-medium text-[#12232E] leading-[1.06]">
          Viajar es conectar con la memoria viva de Ayacucho y el Perú.
        </h1>
        <p className="text-sm text-[#5C6B73] leading-relaxed">
          <strong>Viajes Perú Premium</strong> evoluciona la experiencia digital de{' '}
          <strong>DM GO TRAVEL</strong>: combinamos nuestra red real de 9 hoteles aliados en
          Huamanga y una dirección de arte inspirada en la piedra de Huamanga y la terracota Wari con
          la solidez transaccional de un Monolito Modular en ASP.NET Core 10 y PostgreSQL.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#B84A27] text-white text-xs font-bold"
          >
            Tours Turísticos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/hoteles"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
          >
            Ver 9 Hoteles en Ayacucho
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="lg:col-span-6">
        <PeruPhoto
          src={PERU_ASSETS.ayacucho}
          alt="Arquitectura tradicional peruana"
          category="tour"
          hintText="Ayacucho Huamanga"
          className="w-full h-[420px] object-cover rounded-3xl border border-[#E5DDD0] shadow-xl"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        {
          icon: HeartHandshake,
          title: 'Hospitalidad transparente',
          copy: 'Claridad absoluta en itinerarios, horarios de check-in/check-out, cupos e importes expresados exclusivamente en Soles Peruanos (PEN).',
        },
        {
          icon: ShieldCheck,
          title: 'Rigor transaccional',
          copy: 'Control de concurrencia ETag, claves de idempotencia, snapshots inmutables y confirmación sujeta a pago verificado.',
        },
        {
          icon: Leaf,
          title: 'Red local en Huamanga',
          copy: 'Alianza directa con 9 establecimientos verificados alrededor de la Plaza Mayor de Ayacucho y atención vía 913 249 767 / 969 167 443.',
        },
      ].map(({ icon: Icon, title, copy }) => (
        <article key={title} className="hairline-card rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7EAE4] text-[#B84A27] flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="font-editorial text-2xl font-medium text-[#12232E]">{title}</h2>
          <p className="text-xs text-[#5C6B73] leading-relaxed">{copy}</p>
        </article>
      ))}
    </div>
  </div>
);

export const PoliciesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') === 'privacy' ? 'privacy' : 'terms';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="space-y-3 pb-6 border-b border-[#E5DDD0]">
        <SectionEyebrow>Marco Operativo y Legal</SectionEyebrow>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#12232E]">
          {section === 'privacy'
            ? 'Privacidad, Seguridad y Baja Lógica'
            : 'Términos de Reserva, Pago y Cancelación'}
        </h1>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSearchParams({ section: 'terms' })}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              section === 'terms'
                ? 'bg-[#12232E] text-white'
                : 'bg-[#F3EDE2] text-[#5C6B73]'
            }`}
          >
            Condiciones Comerciales
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ section: 'privacy' })}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              section === 'privacy'
                ? 'bg-[#12232E] text-white'
                : 'bg-[#F3EDE2] text-[#5C6B73]'
            }`}
          >
            Privacidad &amp; Datos
          </button>
        </div>
      </div>

      {section === 'terms' ? (
        <div className="hairline-card rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[#5C6B73] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#12232E]">
              1. Cálculo oficial y bloqueo temporal (15 / 20 minutos)
            </h2>
            <p>
              Toda reserva nace en estado <strong>Pendiente</strong> bloqueando cupos turísticos e
              inventario hotelero durante 15 minutos exactos para iniciar el pago, con una ventana
              máxima de 20 minutos si el cobro entra en verificación con el proveedor. El backend
              calcula y congela el total oficial en Soles Peruanos (<code>PEN</code>).
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#12232E]">
              2. Confirmación exclusiva por pago validado (RN-14)
            </h2>
            <p>
              La transición de <code>pending</code> a <code>confirmed</code> ocurre únicamente tras
              validar un cobro exitoso en Culqi (tarjeta o Yape). Ningún operador puede confirmar
              manualmente una reserva sin pago acreditado.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#12232E]">
              3. Cancelaciones y devoluciones
            </h2>
            <p>
              El viajero puede cancelar sin cargo cualquier reserva en estado <code>pending</code>,
              liberando inmediatamente los cupos bloqueados. Las reservas ya confirmadas se
              gestionan mediante administración bajo trazabilidad de auditoría y casos formales de
              reembolso (<code>RefundCase</code>).
            </p>
          </section>
        </div>
      ) : (
        <div className="hairline-card rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[#5C6B73] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#12232E]">
              1. Protección de credenciales y medios de pago (RN-18)
            </h2>
            <p>
              DMGOTRAVEL no almacena números completos de tarjeta, códigos CVV ni claves bancarias.
              El flujo de cobro opera mediante tokenización e identificadores externos auditables.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#12232E]">
              2. Baja lógica de cuenta y resguardo histórico (RN-30)
            </h2>
            <p>
              El titular puede solicitar la baja lógica de su cuenta desde su perfil siempre que no
              mantenga reservas activas o reembolsos en trámite. Al ejecutarse la baja se revocan
              las sesiones y se protege la PII en consultas administrativas, conservando los
              registros contables y de auditoría exigidos por ley.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
