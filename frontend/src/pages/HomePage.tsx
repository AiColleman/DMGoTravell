import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Hotel,
  Info,
  Lock,
  MailCheck,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { catalogApi, hotelsApi, mobilityApi } from '../api/services';
import { SmartImage } from '../components/ui/SmartImage';
import { formatPen } from '../lib/format';
import {
  asCatalogSummary,
  SHOWCASE_HOTELS,
  SHOWCASE_MOBILITY,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
  STITCH_MEDIA,
} from '../lib/mediaCatalog';
import type {
  CatalogApiType,
  CatalogOfferDto,
  HotelPublicItemDto,
  MobilityPublicItemDto,
} from '../types/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Estado del buscador del Hero conectado a /catalogo
  const [searchType, setSearchType] = useState<CatalogApiType>('tours');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationMax, setDurationMax] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Datos cargados desde el backend real (/api/v1/catalog, /hotels, /mobility)
  const [offers, setOffers] = useState<CatalogOfferDto[]>([]);
  const [hotels, setHotels] = useState<HotelPublicItemDto[]>([]);
  const [mobility, setMobility] = useState<MobilityPublicItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'tour' | 'package'>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [toursRes, packagesRes, hotelsRes, mobilityRes] = await Promise.all([
          catalogApi.list('tours', { page: 1, pageSize: 6 }),
          catalogApi.list('packages', { page: 1, pageSize: 6 }),
          hotelsApi.listPublic(),
          mobilityApi.listPublic(),
        ]);

        if (!active) return;

        const combinedOffers = [...toursRes.items, ...packagesRes.items];
        setOffers(
          combinedOffers.length > 0
            ? combinedOffers
            : [...SHOWCASE_TOURS, ...SHOWCASE_PACKAGES].map(asCatalogSummary)
        );
        setHotels(hotelsRes.items.length > 0 ? hotelsRes.items : SHOWCASE_HOTELS);
        setMobility(mobilityRes.items.length > 0 ? mobilityRes.items : SHOWCASE_MOBILITY);
      } catch {
        if (!active) return;
        setOffers([...SHOWCASE_TOURS, ...SHOWCASE_PACKAGES].map(asCatalogSummary));
        setHotels(SHOWCASE_HOTELS);
        setMobility(SHOWCASE_MOBILITY);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({ tab: searchType });
    if (destination.trim()) qs.set('destination', destination.trim());
    if (startDate) qs.set('startDate', startDate);
    if (durationMax) qs.set('durationMax', durationMax);
    if (priceMax) qs.set('priceMax', priceMax);
    navigate(`/catalogo?${qs.toString()}`);
  };

  const visibleOffers = offers.filter((offer) =>
    activeFilterChip === 'all' ? true : offer.type === activeFilterChip
  );

  return (
    <div className="flex flex-col w-full">
      {/* ================= 1. HERO CINEMATOGRÁFICO ================= */}
      <section className="relative w-full overflow-hidden bg-[#00253D] text-white">
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={STITCH_MEDIA.millpu}
            alt="Aguas Turquesas de Millpu en Ayacucho, Perú"
            category="tour"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#091E32]/95 via-[#0B3B5B]/80 to-[#091E32]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091E32] via-transparent to-[#091E32]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              Operadora Oficial Ayacucho &amp; Cusco · Reservas Transaccionales
            </div>

            <h1 className="font-headline font-extrabold text-3xl sm:text-5xl lg:text-[54px] tracking-tight leading-[1.1] text-white">
              Experiencias auténticas en los Andes con disponibilidad real garantizada
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              Explora salidas verificadas sin sobreventa y consolida tu viaje en una sola reserva
              compuesta (<strong className="text-white">Tour + Hotel Boutique Aliado</strong>) con
              precios oficiales congelados en Soles (<span className="tabular-nums font-bold">PEN</span>).
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                Bloqueo por 15 min anti-sobreventa
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Pagos seguros Culqi (Tarjeta y Yape)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-emerald-400" />
                Flota turística propia certificada
              </span>
            </div>
          </div>

          {/* Buscador Empresarial Conectado a los Filtros del Catálogo */}
          <div className="mt-10 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-900 border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('tours')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    searchType === 'tours'
                      ? 'bg-[#0B3B5B] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tours y Full Days
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('packages')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    searchType === 'packages'
                      ? 'bg-[#0B3B5B] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paquetes Multidía
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Búsqueda sincronizada con <code className="font-mono">/api/v1/catalog/{searchType}</code>
              </span>
            </div>

            <form
              onSubmit={handleHeroSearch}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3"
            >
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Destino o experiencia
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-[#0B3B5B] shrink-0" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej. Millpu, Vilcashuamán, Cusco..."
                    className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-3 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Salida desde
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-[#0B3B5B] shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Duración máx.
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-[#0B3B5B] shrink-0" />
                  <select
                    value={durationMax}
                    onChange={(e) => setDurationMax(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1 Día (Full Day)</option>
                    <option value="2">Hasta 2 Días</option>
                    <option value="3">Hasta 3 Días</option>
                    <option value="5">Hasta 5 Días</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Precio máx. (PEN)
                </label>
                <input
                  type="number"
                  min={0}
                  step="10"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Ej. S/ 800"
                  className="w-full mt-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums"
                />
              </div>

              <div className="lg:col-span-1 flex items-stretch">
                <button
                  type="submit"
                  className="w-full min-h-[52px] rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white font-bold flex items-center justify-center gap-2 px-4 shadow-md transition-colors cursor-pointer"
                  aria-label="Explorar ofertas"
                >
                  <Search className="w-5 h-5" />
                  <span className="lg:hidden text-xs uppercase tracking-wider">Explorar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ================= 2. PILARES DE GARANTÍA OPERATIVA ================= */}
      <section className="w-full bg-slate-100/80 py-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: 'Control Anti-Sobreventa',
              desc: 'Bloqueo atómico de cupos turísticos y noches hoteleras por 15 minutos en estado Pendiente.',
            },
            {
              icon: Lock,
              title: 'Importe Oficial en Backend',
              desc: 'Cálculo exacto en Soles (PEN) con snapshot histórico inmutable ante cambios futuros.',
            },
            {
              icon: CreditCard,
              title: 'Pasarela Culqi & Yape',
              desc: 'Procesamiento idempotente sin almacenar datos sensibles de tarjeta (PAN/CVV).',
            },
            {
              icon: MailCheck,
              title: 'Confirmación Resend',
              desc: 'Envío automático de comprobante y confirmación tras validación oficial del cobro.',
            },
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0B3B5B]/10 text-[#0B3B5B] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-slate-900">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= 3. VITRINA DE TOURS Y PAQUETES ================= */}
      <section className="w-full py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#D95D39] bg-[#FFF3EE] px-3 py-1 rounded-full">
                Catálogo Turístico Activo
              </span>
              <h2 className="font-headline font-extrabold text-2xl sm:text-4xl text-[#0B3B5B] mt-3">
                Tours y Paquetes con Salidas Programadas
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                Selecciona una experiencia individual o combínala con propuestas de alojamiento
                asociadas a tu fecha de salida.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'tour', label: 'Tours' },
                { key: 'package', label: 'Paquetes' },
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActiveFilterChip(chip.key as 'all' | 'tour' | 'package')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    activeFilterChip === chip.key
                      ? 'bg-[#0B3B5B] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <Link
                to="/catalogo?tab=tours"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-[#D95D39] hover:underline"
              >
                Ver catálogo completo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-2xl bg-slate-200/70 animate-pulse border border-slate-200"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleOffers.slice(0, 6).map((offer, idx) => {
                const apiType: CatalogApiType = offer.type === 'package' ? 'packages' : 'tours';
                const primaryImage =
                  offer.images.find((i) => i.isPrimary)?.url ?? offer.images[0]?.url;

                return (
                  <article
                    key={offer.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <SmartImage
                        src={primaryImage}
                        alt={offer.name}
                        category={offer.type === 'package' ? 'package' : 'tour'}
                        seedIndex={idx}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white ${
                            offer.type === 'package' ? 'bg-[#146C53]' : 'bg-[#0B3B5B]'
                          }`}
                        >
                          {offer.type === 'package' ? 'PAQUETE' : 'TOUR'}
                        </span>
                        {offer.badgeHint && (
                          <span className="px-2.5 py-1 rounded-lg bg-[#D95D39] text-white text-[10px] font-extrabold uppercase tracking-wider">
                            {offer.badgeHint}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-[#091E32]/80 backdrop-blur-md text-white text-xs flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          {offer.durationDays === 1
                            ? '1 Día (Full Day)'
                            : `${offer.durationDays} Días`}
                        </span>
                        <span className="text-[11px] text-emerald-300 font-semibold">
                          {offer.nextDepartureHint ?? 'Salidas activas'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-2.5">
                        <h3 className="font-headline font-bold text-lg text-slate-900 group-hover:text-[#0B3B5B] leading-snug">
                          {offer.name}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {offer.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
                        <div>
                          {offer.originalPriceHint ? (
                            <span className="block text-[11px] line-through text-slate-400 tabular-nums">
                              {formatPen(offer.originalPriceHint)}
                            </span>
                          ) : (
                            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                              Desde
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="font-headline font-extrabold text-2xl text-[#0B3B5B] tabular-nums">
                              {formatPen(offer.price)}
                            </span>
                            <span className="text-[11px] text-slate-500">/ viajero</span>
                          </div>
                        </div>

                        <Link
                          to={`/catalogo/${apiType}/${offer.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          Ver y Reservar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= 4. HOTELES ALIADOS (SPEC 007) ================= */}
      <section className="w-full py-16 lg:py-20 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#146C53] bg-emerald-50 px-3 py-1 rounded-full">
                <Hotel className="w-3.5 h-3.5" />
                Alojamiento Opcional Integrado
              </span>
              <h2 className="font-headline font-extrabold text-2xl sm:text-4xl text-[#0B3B5B] mt-3">
                Hoteles Boutique Aliados por Período de 24h
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Agrega una habitación de cualquiera de nuestros hoteles activos al elegir tu salida
                turística. Tarifa única por tipo de habitación y bloqueo simultáneo sin reservas
                parciales.
              </p>
            </div>
            <Link
              to="/catalogo?tab=hotels"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3B5B] hover:text-[#D95D39]"
            >
              Explorar todos los hoteles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-5">
            {hotels.slice(0, 3).map((hotel, idx) => {
              const imgUrl = hotel.images.find((i) => i.isPrimary)?.url ?? hotel.images[0]?.url;
              return (
                <div
                  key={hotel.id}
                  className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-slate-200/90 hover:border-[#0B3B5B]/30 transition-all flex flex-col lg:flex-row items-center gap-6"
                >
                  <div className="w-full lg:w-72 h-48 rounded-xl overflow-hidden shrink-0">
                    <SmartImage
                      src={imgUrl}
                      alt={hotel.name}
                      category="hotel"
                      seedIndex={idx}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      {hotel.hasAvailability ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#146C53] border border-emerald-200 text-[11px] font-bold">
                          Disponible para propuestas de salida
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                          Sin disponibilidad
                        </span>
                      )}
                    </div>

                    <h3 className="font-headline font-bold text-xl text-slate-900">{hotel.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{hotel.description}</p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {hotel.services.map((srv) => (
                        <span
                          key={srv}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#146C53]" />
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="w-full lg:w-52 lg:border-l border-slate-200 lg:pl-6 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                    <div className="lg:text-right">
                      <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        Tarifa base desde
                      </span>
                      <p className="font-headline font-extrabold text-2xl text-[#0B3B5B] tabular-nums">
                        {hotel.lowestBasePrice ? formatPen(hotel.lowestBasePrice) : 'Consultar'}
                      </p>
                      <span className="text-[11px] text-slate-500">por período de 24h</span>
                    </div>
                    <Link
                      to={`/catalogo?tab=hotels&hotel=${hotel.id}`}
                      className="px-4 py-2.5 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold transition-colors"
                    >
                      Ver Habitaciones
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 5. FLOTA Y MOVILIDAD INFORMATIVA (SPEC 013) ================= */}
      <section id="flota-movilidad" className="w-full py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mb-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#0B3B5B] bg-sky-100 px-3.5 py-1 rounded-full">
              <Bus className="w-3.5 h-3.5" />
              Flota Propia Homologada (Sección Informativa · Spec 013)
            </span>
            <h2 className="font-headline font-extrabold text-2xl sm:text-4xl text-[#0B3B5B] mt-3">
              Unidades Turísticas Equipadas para Rutas de Altitud
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Conoce las categorías de transporte utilizadas en nuestras salidas operativas. Esta
              vitrina es informativa para transparencia de confort y seguridad; nuestras unidades no
              se alquilan por separado.
            </p>
          </div>

          {/* Tarjetas estrictamente informativas: SIN precios, SIN disponibilidad, SIN botón de reserva */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {mobility.map((unit, idx) => (
              <article
                key={unit.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <SmartImage
                    src={unit.image?.url}
                    alt={unit.name}
                    category="mobility"
                    seedIndex={idx}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#091E32]/85 backdrop-blur-md text-white text-xs font-bold tabular-nums inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-300" />
                    Capacidad: {unit.capacity} pasajeros
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    {unit.vehicleTypeHint && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {unit.vehicleTypeHint}
                      </span>
                    )}
                    <h3 className="font-headline font-bold text-lg text-slate-900">{unit.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{unit.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B3B5B]">
                      <Info className="w-3.5 h-3.5" />
                      Ficha técnica informativa de flota
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">MTC / SOAT Vigente</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
