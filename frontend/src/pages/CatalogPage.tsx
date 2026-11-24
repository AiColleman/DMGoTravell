import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Hotel,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { catalogApi, hotelsApi } from '../api/services';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SmartImage } from '../components/ui/SmartImage';
import { formatPen } from '../lib/format';
import {
  asCatalogSummary,
  SHOWCASE_HOTELS,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../lib/mediaCatalog';
import type {
  CatalogApiType,
  CatalogOfferDto,
  HotelPublicDetailDto,
  HotelPublicItemDto,
} from '../types/api';

type CatalogTab = 'tours' | 'packages' | 'hotels';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: CatalogTab =
    rawTab === 'packages' || rawTab === 'hotels' ? rawTab : 'tours';

  // Los 4 filtros oficiales confirmados de Spec 006 (DEC-094 a DEC-107)
  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') ?? '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') ?? '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') ?? '');
  const [durationUnit, setDurationUnit] = useState<'days' | 'hours'>('days');
  const [durationMin, setDurationMin] = useState(searchParams.get('durationMin') ?? '');
  const [durationMax, setDurationMax] = useState(searchParams.get('durationMax') ?? '');
  const [page, setPage] = useState<number>(() => {
    const p = Number(searchParams.get('page') ?? '1');
    return Number.isFinite(p) && p >= 1 ? p : 1;
  });

  const [rangeError, setRangeError] = useState<string | null>(null);
  const [offers, setOffers] = useState<CatalogOfferDto[]>([]);
  const [totalOffers, setTotalOffers] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hotels, setHotels] = useState<HotelPublicItemDto[]>([]);
  const [selectedHotelDetail, setSelectedHotelDetail] = useState<HotelPublicDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const pageSize = 6;

  const toEffectiveDays = (raw: string, isMax: boolean): number | undefined => {
    if (!raw.trim()) return undefined;
    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0) return undefined;
    if (durationUnit === 'days') return Math.round(val);
    // DEC-103: 1 día = 24 horas en el filtro de duración
    return isMax ? Math.max(1, Math.ceil(val / 24)) : Math.max(1, Math.floor(val / 24));
  };

  const loadCatalogData = async (targetTab: CatalogTab, targetPage: number) => {
    setRangeError(null);

    // Validación explícita de rangos invertidos (DEC-105: «El rango no es válido»)
    if (startDate && endDate && startDate > endDate) {
      setRangeError('El rango no es válido: la fecha final no puede ser anterior a la inicial.');
      return;
    }
    if (priceMin && priceMax && Number(priceMin) > Number(priceMax)) {
      setRangeError('El rango no es válido: el precio mínimo supera al precio máximo.');
      return;
    }
    if (durationMin && durationMax && Number(durationMin) > Number(durationMax)) {
      setRangeError('El rango no es válido: la duración mínima supera a la máxima.');
      return;
    }

    setLoading(true);
    try {
      if (targetTab === 'hotels') {
        const res = await hotelsApi.listPublic();
        setHotels(res.items.length > 0 ? res.items : SHOWCASE_HOTELS);
      } else {
        const apiType: CatalogApiType = targetTab;
        const res = await catalogApi.list(apiType, {
          page: targetPage,
          pageSize,
          destination: destination.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          durationMin: toEffectiveDays(durationMin, false),
          durationMax: toEffectiveDays(durationMax, true),
        });
        setOffers(res.items);
        setTotalOffers(res.total);
        setHasNext(res.hasNext);
      }
    } catch {
      if (targetTab === 'hotels') {
        setHotels(SHOWCASE_HOTELS);
      } else {
        const source = targetTab === 'packages' ? SHOWCASE_PACKAGES : SHOWCASE_TOURS;
        const filtered = source.map(asCatalogSummary).filter((item) => {
          if (destination.trim()) {
            const q = destination.trim().toLowerCase();
            const match =
              item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
            if (!match) return false;
          }
          if (priceMin && Number(item.price) < Number(priceMin)) return false;
          if (priceMax && Number(item.price) > Number(priceMax)) return false;
          const minD = toEffectiveDays(durationMin, false);
          const maxD = toEffectiveDays(durationMax, true);
          if (minD && item.durationDays < minD) return false;
          if (maxD && item.durationDays > maxD) return false;
          return true;
        });
        setOffers(filtered);
        setTotalOffers(filtered.length);
        setHasNext(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalogData(activeTab, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const switchTab = (nextTab: CatalogTab) => {
    setPage(1);
    setSearchParams({ tab: nextTab });
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadCatalogData(activeTab, 1);
  };

  const handleClearFilters = () => {
    setDestination('');
    setStartDate('');
    setEndDate('');
    setPriceMin('');
    setPriceMax('');
    setDurationMin('');
    setDurationMax('');
    setRangeError(null);
    setPage(1);
    setSearchParams({ tab: activeTab });
    setTimeout(() => void loadCatalogData(activeTab, 1), 0);
  };

  const handleInspectHotel = async (hotel: HotelPublicItemDto) => {
    try {
      const detail = await hotelsApi.getPublicDetail(hotel.id);
      setSelectedHotelDetail(detail);
    } catch {
      setSelectedHotelDetail({
        ...hotel,
        roomTypes: [
          {
            id: `${hotel.id}-suite`,
            name: 'Suite Matrimonial / Doble Superior',
            capacity: 2,
            basePrice: hotel.lowestBasePrice ?? '220.00',
            currency: 'PEN',
            images: hotel.images,
          },
          {
            id: `${hotel.id}-triple`,
            name: 'Habitación Triple Familiar Colonial',
            capacity: 3,
            basePrice: String(Number(hotel.lowestBasePrice ?? 220) + 75),
            currency: 'PEN',
            images: hotel.images,
          },
        ],
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Cabecera y Conmutador */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-[#0B3B5B]">
              Inicio
            </Link>{' '}
            / <span className="text-slate-700">Catálogo Oficial</span>
          </p>
          <h1 className="font-headline font-extrabold text-2xl sm:text-4xl text-[#0B3B5B] mt-2">
            Catálogo Oficial de Experiencias y Hospedaje
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Explora ofertas activas con precios oficiales en Soles (PEN) y disponibilidad verificada.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/75 border border-slate-200 self-start">
          {[
            { id: 'tours', label: 'Tours' },
            { id: 'packages', label: 'Paquetes Turísticos' },
            { id: 'hotels', label: 'Hoteles Aliados' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id as CatalogTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0B3B5B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'hotels' ? (
        /* ================= VISTA DE HOTELES ALIADOS (SPEC 007 — Sin filtros por acuerdo DEC-101/DEC-118) ================= */
        <div className="space-y-6">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-slate-700 flex items-center justify-between gap-4">
            <span>
              <strong>Regla de Alojamiento (Spec 007):</strong> Los hoteles activos permanecen
              visibles incluso cuando no tienen cupo libre (mostrando{' '}
              <span className="font-semibold text-amber-800">«Sin disponibilidad»</span>). El
              hospedaje se reserva de forma opcional al elegir una salida turística.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {hotels.map((hotel, idx) => {
              const mainImg = hotel.images.find((i) => i.isPrimary)?.url ?? hotel.images[0]?.url;
              return (
                <article
                  key={hotel.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52">
                      <SmartImage
                        src={mainImg}
                        alt={hotel.name}
                        category="hotel"
                        seedIndex={idx}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        {hotel.hasAvailability ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#146C53] border border-emerald-200 text-[11px] font-bold">
                            Con disponibilidad
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                            Sin disponibilidad
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <h2 className="font-headline font-bold text-lg text-slate-900">
                        {hotel.name}
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed">{hotel.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {hotel.services.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#146C53]" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Tarifa base por noche
                      </span>
                      <span className="font-headline font-extrabold text-xl text-[#0B3B5B] tabular-nums">
                        {hotel.lowestBasePrice ? formatPen(hotel.lowestBasePrice) : 'Consultar'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleInspectHotel(hotel)}
                      className="px-4 py-2 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Ver Tipos de Habitación
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= VISTA DE TOURS Y PAQUETES CON LOS 4 FILTROS OFICIALES ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar de los 4 filtros exactos de Spec 006 */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="inline-flex items-center gap-2 font-headline font-bold text-sm text-[#0B3B5B]">
                <Filter className="w-4 h-4 text-[#D95D39]" />
                Filtros Oficiales
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#D95D39] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              {/* Filtro 1: Destino */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  1. Destino o palabra clave
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej. Millpu, Wari, Cusco..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Busca coincidencias en nombre o descripción.</p>
              </div>

              {/* Filtro 2: Rango de fechas de salida */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  2. Rango de fechas de salida
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Fecha inicial"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0B3B5B]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="Fecha final"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
              </div>

              {/* Filtro 3: Precio PEN */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  3. Precio por viajero (PEN S/)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Mín S/"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Máx S/"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
              </div>

              {/* Filtro 4: Duración y unidad */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  4. Duración (1 día = 24h)
                </label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as 'days' | 'hours')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none"
                >
                  <option value="days">Unidad: Días</option>
                  <option value="hours">Unidad: Horas</option>
                </select>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    placeholder="Mín"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Máx"
                    value={durationMax}
                    onChange={(e) => setDurationMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
              </div>

              {rangeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{rangeError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0B3B5B] hover:bg-[#091E32] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Aplicar filtros combinados
              </button>
            </form>
          </aside>

          {/* Columna de Resultados */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5">
              <p className="text-xs text-slate-600 tabular-nums">
                Resultados encontrados:{' '}
                <strong className="text-slate-900">{totalOffers}</strong> ofertas activas en{' '}
                <strong className="text-[#0B3B5B]">
                  {activeTab === 'packages' ? 'Paquetes Turísticos' : 'Tours'}
                </strong>
              </p>
              {(destination || startDate || endDate || priceMin || priceMax || durationMin || durationMax) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-[#D95D39] hover:underline cursor-pointer"
                >
                  Restablecer filtros activos ×
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-80 rounded-2xl bg-slate-200/70 animate-pulse border border-slate-200"
                  />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <p className="font-headline font-bold text-lg text-slate-900">
                  No encontramos ofertas que coincidan con todos los criterios seleccionados
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Prueba ampliando el rango de fechas, presupuesto o limpiando los filtros para
                  explorar todo el catálogo activo.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#D95D39] text-white text-xs font-bold cursor-pointer"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {offers.map((offer, idx) => {
                    const img =
                      offer.images.find((i) => i.isPrimary)?.url ?? offer.images[0]?.url;
                    return (
                      <article
                        key={offer.id}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="relative h-52 overflow-hidden">
                            <SmartImage
                              src={img}
                              alt={offer.name}
                              category={offer.type === 'package' ? 'package' : 'tour'}
                              seedIndex={idx}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase text-white ${
                                  offer.type === 'package' ? 'bg-[#146C53]' : 'bg-[#0B3B5B]'
                                }`}
                              >
                                {offer.type === 'package' ? 'PAQUETE' : 'TOUR'}
                              </span>
                              {offer.badgeHint && (
                                <span className="px-2.5 py-1 rounded-lg bg-[#D95D39] text-white text-[10px] font-extrabold">
                                  {offer.badgeHint}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1 font-semibold text-[#0B3B5B]">
                                <Clock className="w-3.5 h-3.5" />
                                {offer.durationDays === 1
                                  ? '1 Día (24h)'
                                  : `${offer.durationDays} Días`}
                              </span>
                              <span>·</span>
                              <span className="text-[#146C53] font-medium">
                                Alojamiento opcional combinable
                              </span>
                            </div>
                            <h2 className="font-headline font-bold text-lg text-slate-900 leading-snug">
                              {offer.name}
                            </h2>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {offer.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            {offer.originalPriceHint && (
                              <span className="block text-[11px] line-through text-slate-400 tabular-nums">
                                {formatPen(offer.originalPriceHint)}
                              </span>
                            )}
                            <span className="font-headline font-extrabold text-xl text-[#0B3B5B] tabular-nums">
                              {formatPen(offer.price)}
                            </span>
                            <span className="text-[11px] text-slate-500"> / viajero</span>
                          </div>

                          <Link
                            to={`/catalogo/${activeTab}/${offer.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold transition-colors"
                          >
                            Ver salidas
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={totalOffers}
                  hasNext={hasNext}
                  onPageChange={(nextPage) => setPage(nextPage)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Hotel y Tipos de Habitación */}
      {selectedHotelDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-[#146C53]">
                  <Hotel className="w-3.5 h-3.5" />
                  Detalle de Hotel Aliado
                </span>
                <h3 className="font-headline font-extrabold text-xl text-[#0B3B5B] mt-1">
                  {selectedHotelDetail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHotelDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedHotelDetail.description}
              </p>

              <div className="space-y-3">
                <h4 className="font-headline font-bold text-sm text-slate-900">
                  Tipos de Habitación Activos (Tarifa única por período de 24h)
                </h4>
                {selectedHotelDetail.roomTypes.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay tipos de habitación registrados actualmente.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedHotelDetail.roomTypes.map((rt) => (
                      <div
                        key={rt.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-900">{rt.name}</p>
                          <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5" />
                            Capacidad máxima: {rt.capacity} huéspedes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-extrabold text-lg text-[#0B3B5B] tabular-nums">
                            {formatPen(rt.basePrice)}
                          </p>
                          <p className="text-[11px] text-slate-500">por noche (24h)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-4">
                <span>
                  Para reservar este hotel, selecciona primero el Tour o Paquete de tu interés y
                  elige la propuesta hotelera asociada a tu salida.
                </span>
                <Link
                  to="/catalogo?tab=packages"
                  onClick={() => setSelectedHotelDetail(null)}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-[#146C53] text-white font-bold"
                >
                  Elegir Paquete
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
