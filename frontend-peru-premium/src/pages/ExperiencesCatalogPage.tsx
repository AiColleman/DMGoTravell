import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Compass, Layers, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { catalogApi } from '../api/services';
import { parseDecimal, toLimaDateIso } from '../lib/format';
import {
  asCatalogSummary,
  inferDestination,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../lib/peruCatalog';
import type { CatalogApiType, CatalogOfferDto } from '../types/api';
import {
  ExperienceCard,
  PaginationControls,
  SectionEyebrow,
} from '../components/ui/EditorialPrimitives';

const SECTION_META: Record<
  CatalogApiType,
  {
    eyebrow: string;
    title: string;
    description: string;
    badgeLabel: string;
    counterNoun: string;
    emptyTitle: string;
    peerLabel: string;
    peerHref: string;
    accentBg: string;
  }
> = {
  tours: {
    eyebrow: 'Experiencias de un Día & Rutas de Autor',
    title: 'Tours Turísticos',
    description:
      'Recorridos guiados y salidas verificadas por Cusco, Ayacucho, Arequipa y Lima con tarifas transparentes en Soles Peruanos (PEN).',
    badgeLabel: 'Salidas Diarias & Full Days',
    counterNoun: 'tours turísticos',
    emptyTitle: 'No encontramos tours turísticos con esos criterios',
    peerLabel: 'Ir a Paquetes Turísticos',
    peerHref: '/paquetes',
    accentBg: 'bg-[#12232E] text-[#FAF7F2]',
  },
  packages: {
    eyebrow: 'Programas Multidía & Estadía Opcional',
    title: 'Paquetes Turísticos',
    description:
      'Circuitos integrales diseñados por los Andes y la costa peruana, listos para sumar casonas y hoteles aliados en una misma reserva.',
    badgeLabel: 'Circuitos Integrales Multidía',
    counterNoun: 'paquetes turísticos',
    emptyTitle: 'No encontramos paquetes turísticos con esos criterios',
    peerLabel: 'Ir a Tours Turísticos',
    peerHref: '/tours',
    accentBg: 'bg-[#B84A27] text-white',
  },
};

const DecentralizedCatalogView: React.FC<{ catalogType: CatalogApiType }> = ({ catalogType }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const meta = SECTION_META[catalogType];

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') ?? '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') ?? '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') ?? '');
  const [durationMin, setDurationMin] = useState(searchParams.get('durationMin') ?? '');
  const [durationMax, setDurationMax] = useState(searchParams.get('durationMax') ?? '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') ?? 1) || 1);

  const [items, setItems] = useState<CatalogOfferDto[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [filterValidationError, setFilterValidationError] = useState<string | null>(null);

  const loadCatalog = async (
    targetPage: number,
    overrides?: {
      destination?: string;
      startDate?: string;
      endDate?: string;
      priceMin?: string;
      priceMax?: string;
      durationMin?: string;
      durationMax?: string;
    }
  ) => {
    const destVal = overrides?.destination !== undefined ? overrides.destination : destination;
    const startVal = overrides?.startDate !== undefined ? overrides.startDate : startDate;
    const endVal = overrides?.endDate !== undefined ? overrides.endDate : endDate;
    const minPriceVal = overrides?.priceMin !== undefined ? overrides.priceMin : priceMin;
    const maxPriceVal = overrides?.priceMax !== undefined ? overrides.priceMax : priceMax;
    const minDurVal = overrides?.durationMin !== undefined ? overrides.durationMin : durationMin;
    const maxDurVal = overrides?.durationMax !== undefined ? overrides.durationMax : durationMax;

    setLoading(true);
    try {
      const response = await catalogApi.list(catalogType, {
        page: targetPage,
        pageSize: 9,
        destination: destVal.trim() || undefined,
        startDate: startVal || undefined,
        endDate: endVal || undefined,
        priceMin: minPriceVal ? Number(minPriceVal) : undefined,
        priceMax: maxPriceVal ? Number(maxPriceVal) : undefined,
        durationMin: minDurVal ? Number(minDurVal) : undefined,
        durationMax: maxDurVal ? Number(maxDurVal) : undefined,
      });
      setItems(response.items);
      setTotal(response.total);
      setHasNext(response.hasNext);
    } catch {
      const detailsPool = catalogType === 'packages' ? SHOWCASE_PACKAGES : SHOWCASE_TOURS;
      const filtered = detailsPool
        .filter((detail) => {
          const destText = `${detail.destinationHint ?? ''} ${detail.name} ${detail.description}`.toLowerCase();
          if (destVal && !destText.includes(destVal.toLowerCase())) return false;
          const p = parseDecimal(detail.price);
          if (minPriceVal && p < Number(minPriceVal)) return false;
          if (maxPriceVal && p > Number(maxPriceVal)) return false;
          if (minDurVal && detail.durationDays < Number(minDurVal)) return false;
          if (maxDurVal && detail.durationDays > Number(maxDurVal)) return false;
          if (startVal || endVal) {
            const hasMatchingDeparture = detail.departures.some((dep) => {
              const depDate = toLimaDateIso(dep.startDate);
              if (!depDate) return false;
              if (startVal && depDate < startVal) return false;
              if (endVal && depDate > endVal) return false;
              return (dep.available ?? 1) > 0;
            });
            if (!hasMatchingDeparture) return false;
          }
          return true;
        })
        .map(asCatalogSummary);
      setItems(filtered);
      setTotal(filtered.length);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogType, page]);

  const syncUrlAndApply = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setFilterValidationError('El rango de fechas de salida está invertido (Spec 006).');
      return;
    }
    if (priceMin && priceMax && Number(priceMin) > Number(priceMax)) {
      setFilterValidationError('El precio mínimo no puede superar al precio máximo (Spec 006).');
      return;
    }
    if (durationMin && durationMax && Number(durationMin) > Number(durationMax)) {
      setFilterValidationError('La duración mínima no puede superar a la duración máxima (Spec 006).');
      return;
    }
    setFilterValidationError(null);
    const next = new URLSearchParams();
    if (destination.trim()) next.set('destination', destination.trim());
    if (startDate) next.set('startDate', startDate);
    if (endDate) next.set('endDate', endDate);
    if (priceMin) next.set('priceMin', priceMin);
    if (priceMax) next.set('priceMax', priceMax);
    if (durationMin) next.set('durationMin', durationMin);
    if (durationMax) next.set('durationMax', durationMax);
    setSearchParams(next);
    setPage(1);
    void loadCatalog(1);
  };

  const resetFilters = () => {
    setFilterValidationError(null);
    setDestination('');
    setStartDate('');
    setEndDate('');
    setPriceMin('');
    setPriceMax('');
    setDurationMin('');
    setDurationMax('');
    setPage(1);
    setSearchParams({});
    void loadCatalog(1, {
      destination: '',
      startDate: '',
      endDate: '',
      priceMin: '',
      priceMax: '',
      durationMin: '',
      durationMax: '',
    });
  };

  const displayedItems = useMemo(() => {
    const copy = [...items];
    if (sortBy === 'price-asc') {
      copy.sort((a, b) => parseDecimal(a.price) - parseDecimal(b.price));
    } else if (sortBy === 'price-desc') {
      copy.sort((a, b) => parseDecimal(b.price) - parseDecimal(a.price));
    }
    return copy;
  }, [items, sortBy]);

  const BadgeIcon = catalogType === 'packages' ? Layers : Compass;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      {/* Cabecera Editorial Independiente */}
      <div className="pb-8 border-b border-[#E5DDD0] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <SectionEyebrow>{meta.eyebrow}</SectionEyebrow>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#12232E]">
            {meta.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl leading-relaxed">
            {meta.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs ${meta.accentBg}`}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            {meta.badgeLabel}
          </span>

          <Link
            to={meta.peerHref}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FFFCF8] hover:border-[#B84A27] text-xs font-semibold text-[#12232E] transition-colors"
          >
            {meta.peerLabel}
            <ArrowUpRight className="w-3.5 h-3.5 text-[#B84A27]" />
          </Link>
        </div>
      </div>

      {/* Chips rápidos de región */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#5C6B73] mr-1">Regiones:</span>
        {['', 'Cusco', 'Ayacucho', 'Arequipa', 'Lima'].map((reg) => {
          const active = destination.toLowerCase() === reg.toLowerCase();
          return (
            <button
              key={reg || 'all'}
              type="button"
              onClick={() => {
                setDestination(reg);
                setPage(1);
                const next = new URLSearchParams(searchParams);
                if (reg) next.set('destination', reg);
                else next.delete('destination');
                setSearchParams(next);
                void loadCatalog(1, { destination: reg });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#12232E] border-[#12232E] text-white'
                  : 'bg-[#FFFCF8] border-[#E5DDD0] text-[#5C6B73] hover:border-[#B84A27] hover:text-[#12232E]'
              }`}
            >
              {reg || 'Todo el Perú'}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setFiltersOpenMobile((v) => !v)}
          className="lg:hidden ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E5DDD0] bg-[#FFFCF8] text-xs font-semibold text-[#12232E]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B84A27]" />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Panel Lateral con los 4 Filtros Oficiales del Backend */}
        <aside
          className={`${
            filtersOpenMobile ? 'block' : 'hidden lg:block'
          } lg:col-span-3 hairline-card rounded-2xl p-6 lg:sticky lg:top-24`}
        >
          <form onSubmit={syncUrlAndApply} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD0]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#12232E] inline-flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B84A27]" />
                4 Filtros Oficiales
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#12232E] mb-1.5">
                1. Destino o palabra clave
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Cusco, Millpu, Colca..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#12232E]">
                2. Rango de fechas de salida
              </label>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="date"
                  aria-label="Fecha inicial"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="date"
                  aria-label="Fecha final"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#12232E]">
                3. Rango de tarifa (PEN S/)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Mín S/"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Máx S/"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#12232E]">
                4. Duración (días)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Mín días"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Máx días"
                  value={durationMax}
                  onChange={(e) => setDurationMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Aplicar filtros
            </button>

            {filterValidationError && (
              <p className="p-3 rounded-xl bg-[#FBECE9] border border-[#EABCB3] text-[11px] font-semibold text-[#8E2B17]">
                {filterValidationError}
              </p>
            )}
          </form>
        </aside>

        {/* Grilla de Resultados */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C6B73]">
            <span>
              Mostrando <strong className="text-[#12232E]">{displayedItems.length}</strong> de{' '}
              <strong className="text-[#12232E]">{total}</strong> {meta.counterNoun}
            </span>

            <label className="inline-flex items-center gap-2">
              <span>Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                }
                className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FFFCF8] text-xs font-semibold text-[#12232E]"
              >
                <option value="featured">Curaduría editorial</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-[#F3EDE2] border border-[#E5DDD0] animate-pulse"
                />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="hairline-card rounded-2xl p-12 text-center space-y-4">
              <p className="font-editorial text-2xl text-[#12232E]">{meta.emptyTitle}</p>
              <p className="text-xs text-[#5C6B73] max-w-md mx-auto">
                Amplía el rango de fechas o presupuesto para explorar todas las salidas activas en
                Cusco, Ayacucho, Arequipa y Lima.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedItems.map((offer, idx) => (
                  <ExperienceCard
                    key={offer.id}
                    offer={{
                      ...offer,
                      destinationHint:
                        offer.destinationHint ||
                        inferDestination(`${offer.name} ${offer.description}`),
                    }}
                    seedIndex={idx}
                    preferredStartDate={startDate || undefined}
                  />
                ))}
              </div>

              <PaginationControls
                page={page}
                pageSize={9}
                total={total}
                hasNext={hasNext}
                onPageChange={(next) => setPage(next)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const ToursCatalogPage: React.FC = () => (
  <DecentralizedCatalogView key="tours" catalogType="tours" />
);

export const PackagesCatalogPage: React.FC = () => (
  <DecentralizedCatalogView key="packages" catalogType="packages" />
);

export const LegacyExperiencesRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetBase = searchParams.get('tab') === 'packages' ? '/paquetes' : '/tours';
  const forwardParams = new URLSearchParams(searchParams);
  forwardParams.delete('tab');
  const query = forwardParams.toString();
  return <Navigate to={query ? `${targetBase}?${query}` : targetBase} replace />;
};
