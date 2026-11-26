import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Calendar,
  Compass,
  Hotel,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { catalogApi, hotelsApi, mobilityApi } from '../api/services';
import { todayLimaIso } from '../lib/format';
import {
  asCatalogSummary,
  DMGO_AGENCY_CONTACT,
  EDITORIAL_DESTINATIONS,
  mergeWithOfficialDmGoHotels,
  PERU_ASSETS,
  SHOWCASE_HOTELS,
  SHOWCASE_MOBILITY,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../lib/peruCatalog';
import type { CatalogOfferDto, HotelPublicItemDto, MobilityPublicItemDto } from '../types/api';
import {
  ExperienceCard,
  HotelEditorialCard,
  PeruPhoto,
  SectionEyebrow,
} from '../components/ui/EditorialPrimitives';

const HERO_SCENES = [
  {
    id: 'cusco',
    title: 'Machu Picchu & Valle Sagrado',
    region: 'Cusco · 2,430 m s. n. m.',
    image: PERU_ASSETS.peruHero,
  },
  {
    id: 'ayacucho',
    title: 'Huamanga Virreinal & Rutas Wari',
    region: 'Ayacucho · 2,761 m s. n. m.',
    image: PERU_ASSETS.ayacucho,
  },
  {
    id: 'arequipa',
    title: 'Andenerías del Valle del Colca',
    region: 'Arequipa · 3,635 m s. n. m.',
    image: PERU_ASSETS.colca,
  },
  {
    id: 'lima',
    title: 'Barranco & Costa Gastronómica',
    region: 'Lima · Océano Pacífico',
    image: PERU_ASSETS.lima,
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [sceneIdx, setSceneIdx] = useState(0);
  const [searchSection, setSearchSection] = useState<'tours' | 'paquetes'>('tours');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const [featuredTours, setFeaturedTours] = useState<CatalogOfferDto[]>(() =>
    SHOWCASE_TOURS.slice(0, 3).map(asCatalogSummary)
  );
  const [featuredPackages, setFeaturedPackages] = useState<CatalogOfferDto[]>(() =>
    SHOWCASE_PACKAGES.slice(0, 3).map(asCatalogSummary)
  );
  const [hotels, setHotels] = useState<HotelPublicItemDto[]>(SHOWCASE_HOTELS);
  const [mobility, setMobility] = useState<MobilityPublicItemDto[]>(SHOWCASE_MOBILITY);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [toursRes, pkgsRes, hotelsRes, mobRes] = await Promise.all([
          catalogApi.list('tours', { page: 1, pageSize: 3 }),
          catalogApi.list('packages', { page: 1, pageSize: 3 }),
          hotelsApi.listPublic(),
          mobilityApi.listPublic(),
        ]);
        if (!active) return;
        if (toursRes.items.length > 0) setFeaturedTours(toursRes.items.slice(0, 3));
        if (pkgsRes.items.length > 0) setFeaturedPackages(pkgsRes.items.slice(0, 3));
        setHotels(mergeWithOfficialDmGoHotels(hotelsRes.items));
        if (mobRes.items.length > 0) setMobility(mobRes.items.slice(0, 3));
      } catch {
        // Mantiene el catálogo editorial curado si la API local está apagada
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const currentScene = HERO_SCENES[sceneIdx]!;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (destination) qs.set('destination', destination);
    if (startDate) qs.set('startDate', startDate);
    if (maxDuration) qs.set('durationMax', maxDuration);
    if (priceMax) qs.set('priceMax', priceMax);
    const query = qs.toString();
    navigate(query ? `/${searchSection}?${query}` : `/${searchSection}`);
  };

  return (
    <div>
      {/* ================= HERO EDITORIAL ASIMÉTRICO ================= */}
      <section className="relative overflow-hidden border-b border-[#E5DDD0] editorial-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Columna Editorial */}
          <div className="lg:col-span-6 space-y-6">
            <SectionEyebrow>Perú, desde una mirada editorial</SectionEyebrow>

            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[64px] leading-[1.02] font-medium text-[#12232E]">
              El viaje empieza por un lugar que{' '}
              <em className="italic font-normal text-[#B84A27]">te conmueve.</em>
            </h1>

            <p className="text-sm sm:text-base text-[#5C6B73] leading-relaxed max-w-xl">
              Recorridos de autor por Cusco, Ayacucho, Arequipa y Lima. Combina tu experiencia
              turística y casonas boutique aliadas en una sola reserva con disponibilidad e importe
              oficial garantizados en Soles.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/tours"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-sm font-semibold shadow-sm transition-colors"
              >
                Tours Turísticos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/paquetes"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-white text-sm font-semibold shadow-sm transition-colors"
              >
                Paquetes Turísticos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/hoteles"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#D2C6B4] bg-[#FFFCF8] hover:border-[#12232E] text-[#12232E] text-sm font-semibold transition-colors"
              >
                Ver casonas y hoteles
              </Link>
            </div>

            {/* Indicadores de Confianza Arquitectónica */}
            <div className="pt-6 border-t border-[#E5DDD0] grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold text-[#12232E]">
                  100% PEN
                </span>
                <p className="text-[11px] text-[#5C6B73] mt-0.5">
                  Snapshot inmutable calculado en servidor
                </p>
              </div>
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold text-[#B84A27]">
                  15 min
                </span>
                <p className="text-[11px] text-[#5C6B73] mt-0.5">
                  Bloqueo transaccional de cupos e inventario
                </p>
              </div>
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1B5E4A]">
                  Culqi + Yape
                </span>
                <p className="text-[11px] text-[#5C6B73] mt-0.5">
                  Confirmación verificada y recibo Resend
                </p>
              </div>
            </div>
          </div>

          {/* Columna Fotográfica Interactiva */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5DDD0] shadow-2xl h-[420px] sm:h-[520px] bg-[#12232E]">
              <PeruPhoto
                src={currentScene.image}
                alt={currentScene.title}
                category="tour"
                seedIndex={sceneIdx}
                hintText={`${currentScene.id} ${currentScene.title}`}
                loading="eager"
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/80 via-[#0B1720]/15 to-transparent" />

              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#12232E]/80 backdrop-blur-md border border-white/15 text-[10px] font-semibold uppercase tracking-widest text-[#FAF7F2] inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C89B54]" />
                Selección Curada 2026
              </div>

              <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="text-[#FAF7F2]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#C89B54] font-semibold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    {currentScene.region}
                  </span>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-medium mt-1">
                    {currentScene.title}
                  </h2>
                </div>

                {/* Selector de Escenas Peruanas */}
                <div className="flex items-center gap-1.5 bg-[#0B1720]/70 backdrop-blur-md p-1.5 rounded-full border border-white/15 self-start sm:self-auto">
                  {HERO_SCENES.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSceneIdx(idx)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${sceneIdx === idx
                          ? 'bg-[#B84A27] text-white'
                          : 'text-[#FAF7F2]/75 hover:text-white'
                        }`}
                    >
                      {sc.id.charAt(0).toUpperCase() + sc.id.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BUSCADOR SINCRONIZADO CON LOS 4 FILTROS OFICIALES ================= */}
      <section aria-label="Buscador de rutas turísticas" className="bg-[#FFFCF8] border-b border-[#E5DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
          >
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73] mb-1.5">
                Sección
              </label>
              <select
                aria-label="Sección turística"
                value={searchSection}
                onChange={(e) => setSearchSection(e.target.value as 'tours' | 'paquetes')}
                className="w-full px-3.5 py-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              >
                <option value="tours">Tours Turísticos</option>
                <option value="paquetes">Paquetes Turísticos</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73] mb-1.5">
                1. Destino en Perú
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#B84A27] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  aria-label="Destino"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
                >
                  <option value="">Todos los destinos (Cusco, Ayacucho...)</option>
                  <option value="Cusco">Cusco &amp; Valle Sagrado</option>
                  <option value="Ayacucho">Ayacucho &amp; Huamanga</option>
                  <option value="Arequipa">Arequipa &amp; Colca</option>
                  <option value="Lima">Lima Gastronómica</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73] mb-1.5">
                2. Salida desde
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#B84A27] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  aria-label="Fecha desde"
                  min={todayLimaIso()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73] mb-1.5">
                3. Duración máx.
              </label>
              <select
                aria-label="Duración máxima"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              >
                <option value="">Cualquier duración</option>
                <option value="1">Full Day (1 día)</option>
                <option value="2">Hasta 2 días</option>
                <option value="4">Hasta 4 días</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73] mb-1.5">
                4. PEN máx.
              </label>
              <input
                type="number"
                min={50}
                step={50}
                placeholder="S/ 800"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-[#12232E] hover:bg-[#B84A27] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Buscar rutas
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ================= BENTO EDITORIAL DE REGIONES PERUANAS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SectionEyebrow>Geografía con identidad</SectionEyebrow>
            <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
              Cuatro maneras de encontrarte con el Perú
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/tours"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#B84A27] hover:underline"
            >
              Tours Turísticos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/paquetes"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#12232E] hover:underline"
            >
              Paquetes Turísticos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[470px]">
          {EDITORIAL_DESTINATIONS.map((dest, index) => (
            <Link
              key={dest.name}
              to={`/tours?destination=${encodeURIComponent(dest.name)}`}
              className={`group relative rounded-2xl overflow-hidden bg-[#12232E] min-h-[220px] ${index === 0
                  ? 'md:col-span-2 md:row-span-2'
                  : index === 3
                    ? 'md:col-span-2'
                    : ''
                }`}
            >
              <PeruPhoto
                src={dest.image}
                alt={dest.name}
                category="tour"
                seedIndex={index}
                hintText={dest.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/85 via-[#0B1720]/20 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-[#FAF7F2]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#C89B54]">
                    0{index + 1} · {dest.region}
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-medium mt-0.5">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-[#FAF7F2]/80 mt-1">{dest.tagline}</p>
                </div>
                <span className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#B84A27] transition-colors shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= SECCIÓN INDEPENDIENTE 1: TOURS TURÍSTICOS ================= */}
      <section className="bg-[#F3EDE2]/65 border-t border-[#E5DDD0] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <SectionEyebrow>Sección Independiente · Salidas Diarias</SectionEyebrow>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
                Tours Turísticos
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
                Recorridos guiados de día completo y rutas temáticas verificadas con cupos reales y
                tarifas oficiales en Soles Peruanos (PEN).
              </p>
            </div>

            <Link
              to="/tours"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#12232E] text-white hover:bg-[#B84A27] text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              Ver todos los Tours Turísticos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.map((offer, idx) => (
              <ExperienceCard key={offer.id} offer={offer} seedIndex={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECCIÓN INDEPENDIENTE 2: PAQUETES TURÍSTICOS ================= */}
      <section className="bg-[#FAF7F2] border-y border-[#E5DDD0] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <SectionEyebrow>Sección Independiente · Circuitos Multidía</SectionEyebrow>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
                Paquetes Turísticos
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
                Programas integrales de varios días diseñados con pausa, listos para combinar con
                casonas boutique aliadas en la misma reserva transaccional.
              </p>
            </div>

            <Link
              to="/paquetes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B84A27] text-white hover:bg-[#943618] text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              Ver todos los Paquetes Turísticos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPackages.map((offer, idx) => (
              <ExperienceCard key={offer.id} offer={offer} seedIndex={idx + 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= UNA SOLA INTENCIÓN DE VIAJE (FLUJO ARQUITECTÓNICO) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 space-y-10">
        <div className="max-w-2xl space-y-2">
          <SectionEyebrow>Reserva Compuesta sin fricción</SectionEyebrow>
          <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
            Del destino a la confirmación, en una sola transacción
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-[#E5DDD0] divide-y md:divide-y-0 md:divide-x divide-[#E5DDD0]">
          {[
            {
              num: '01',
              icon: Compass,
              title: 'Elige salida y viajeros',
              desc: 'Selecciona fecha programada en horario de Lima y verifica aforo disponible en tiempo real.',
            },
            {
              num: '02',
              icon: Hotel,
              title: 'Suma hotel aliado opcional',
              desc: 'Vincula una habitación compatible validada por períodos de 24 horas en la misma orden.',
            },
            {
              num: '03',
              icon: Layers,
              title: 'Snapshot oficial y pago Culqi',
              desc: 'El servidor congela los precios en Soles (PEN) por 15 minutos mientras pagas con tarjeta o Yape.',
            },
          ].map(({ num, icon: Icon, title, desc }) => (
            <article key={num} className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 relative">
              <span className="font-editorial text-4xl text-[#D2C6B4] absolute right-4 top-6">
                {num}
              </span>
              <div className="w-11 h-11 rounded-xl bg-[#F7EAE4] text-[#B84A27] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#12232E]">{title}</h3>
              <p className="text-xs sm:text-sm text-[#5C6B73] leading-relaxed mt-2">{desc}</p>
            </article>
          ))}
        </div>

        <div className="hairline-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-[#1B5E4A] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#12232E]">
                Integridad financiera respaldada por el servidor (RN-03 &amp; RN-14)
              </h3>
              <p className="text-xs text-[#5C6B73] mt-0.5">
                Ningún precio se impone desde el navegador y ninguna reserva pasa a estado Confirmada
                sin validación criptográfica de pago exitoso.
              </p>
            </div>
          </div>
          <Link
            to="/politicas?section=terms"
            className="text-xs font-bold text-[#B84A27] hover:underline shrink-0"
          >
            Leer reglas de reserva →
          </Link>
        </div>
      </section>

      {/* ================= CASONAS & HOTELES ALIADOS (SPEC 007 · RF-2, RF-7, RF-12) ================= */}
      {hotels.length > 0 && (
        <section className="bg-[#FAF7F2] pb-16 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <SectionEyebrow>
                  Alojamiento Oficial en Ayacucho · {DMGO_AGENCY_CONTACT.socialHandle}
                </SectionEyebrow>
                <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#12232E]">
                  Hoteles Aliados de DM GO TRAVEL en Huamanga
                </h2>
                <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
                  Todos nuestros hoteles públicamente visibles ordenados de A a Z sin paginación
                  (Spec 007 · RF-2 &amp; RF-7), listos para consolidar con tus salidas turísticas en
                  Soles Peruanos (PEN).
                </p>
              </div>
              <Link
                to="/hoteles"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E4A] hover:underline shrink-0"
              >
                Abrir catálogo hotelero completo ({hotels.length})
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel, idx) => (
                <HotelEditorialCard key={hotel.id} hotel={hotel} seedIndex={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= MOVILIDAD INFORMATIVA (SPEC 013) ================= */}
      <section className="bg-[#12232E] text-[#FAF7F2] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <SectionEyebrow light>Seguridad en Ruta · Spec 013</SectionEyebrow>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#FAF7F2]">
                Flota turística propia y certificada
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF7F2]/75 max-w-2xl">
                Unidades dedicadas exclusivamente a la operación de nuestros tours y paquetes
                (información técnica de referencia; no constituye alquiler vehicular independiente).
              </p>
            </div>
            <Link
              to="/movilidad"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C89B54] hover:text-white"
            >
              Conocer especificaciones de flota
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mobility.map((unit, idx) => (
              <article
                key={unit.id}
                className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex flex-col"
              >
                <div className="h-48 relative overflow-hidden">
                  <PeruPhoto
                    src={unit.image?.url}
                    alt={unit.name}
                    category="mobility"
                    seedIndex={idx}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#12232E]/90 text-[#C89B54] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <Bus className="w-3 h-3" />
                    Uso Operativo en Tours
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-editorial text-xl font-medium text-white">{unit.name}</h3>
                  <p className="text-xs text-[#FAF7F2]/70 leading-relaxed mt-2 flex-1">
                    {unit.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#C89B54]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      Capacidad: {unit.capacity} pasajeros
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/55">
                      Sin tarifa de renta
                    </span>
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
