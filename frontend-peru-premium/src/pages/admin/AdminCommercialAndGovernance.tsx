import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Bus,
  CalendarPlus,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Hotel,
  ImagePlus,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { adminApi, hotelsApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatLimaDateTime, formatPen } from '../../lib/format';
import {
  extractHotelEditorialMeta,
  mergeWithOfficialDmGoAdminHotels,
  resolveMediaUrl,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_MOBILITY,
  SHOWCASE_PACKAGES,
  SHOWCASE_TOURS,
} from '../../lib/peruCatalog';
import type {
  AuditEntryDto,
  CatalogAdminItemDto,
  CatalogApiType,
  ClientSummaryDto,
  HotelAdminItemDto,
  HotelPublicDetailDto,
  MobilityAdminItemDto,
} from '../../types/api';
import {
  PaginationControls,
  SectionEyebrow,
  StatusPill,
} from '../../components/ui/EditorialPrimitives';

// ============================================================================
// DATOS BASE DE VISTA PREVIA
// ============================================================================

const INITIAL_DEMO_TOURS_ADMIN: CatalogAdminItemDto[] = SHOWCASE_TOURS.map((t, i) => ({
  id: t.id,
  type: 'tour',
  name: t.name,
  status: 'active',
  version: i + 1,
  updatedAt: '2026-11-24T12:00:00Z',
}));

const INITIAL_DEMO_PACKAGES_ADMIN: CatalogAdminItemDto[] = SHOWCASE_PACKAGES.map((p, i) => ({
  id: p.id,
  type: 'package',
  name: p.name,
  status: 'active',
  version: i + 1,
  updatedAt: '2026-11-24T12:00:00Z',
}));

const DEMO_HOTELS_ADMIN: HotelAdminItemDto[] = SHOWCASE_HOTELS_DETAIL.map((h) => ({
  id: h.id,
  name: h.name,
  status: 'active',
  version: 1,
  updatedAt: '2026-11-25T00:00:00Z',
}));

const DEMO_MOBILITY_ADMIN: MobilityAdminItemDto[] = SHOWCASE_MOBILITY.map((m, idx) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  type: m.vehicleTypeHint ?? 'Unidad Turística',
  capacity: m.capacity,
  status: 'active',
  version: idx + 1,
  updatedAt: '2026-11-20T10:00:00Z',
}));

const DEMO_CLIENTS: ClientSummaryDto[] = [
  {
    id: 'cl-01',
    fullName: 'Valeria Quispe Mendoza',
    email: 'valeria.quispe@viajero.pe',
    phone: '+51 987 654 321',
    emailVerified: true,
    status: 'active',
    reservationCount: 3,
    registeredAt: '2026-10-14T15:00:00Z',
  },
  {
    id: 'cl-02',
    fullName: null,
    email: null,
    phone: null,
    emailVerified: null,
    status: 'closed',
    reservationCount: 1,
    registeredAt: null,
  },
];

const DEMO_AUDIT: AuditEntryDto[] = [
  {
    id: 'aud-101',
    occurredAt: '2026-11-24T16:40:00Z',
    actor: 'operaciones@dmgotravel.pe',
    entity: 'ReportSnapshot',
    entityId: 'rep-2026-nov',
    action: 'REPORT_CREATED',
    result: 'SUCCESS',
    correlationId: 'corr-98a4f21c',
    summary: 'Generación de reporte ejecutivo y financiero en Soles (PEN).',
  },
  {
    id: 'aud-102',
    occurredAt: '2026-11-24T15:12:00Z',
    actor: 'system',
    entity: 'Reservation',
    entityId: 'DMG-2026-004499',
    action: 'reservation.auto_cancelled',
    result: 'SUCCESS',
    correlationId: 'corr-77b1e09a',
    summary: 'Liberación automática de cupos por vencimiento del tiempo de pago.',
  },
];

// ============================================================================
// SECCIÓN 5: TOURS Y PAQUETES TURÍSTICOS (/admin/ofertas)
// ============================================================================

export const AdminOffersPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [catalogType, setCatalogType] = useState<CatalogApiType>('tours');
  const [activeFormTab, setActiveFormTab] = useState<'new-offer' | 'new-departure'>('new-offer');
  const [offers, setOffers] = useState<CatalogAdminItemDto[]>(INITIAL_DEMO_TOURS_ADMIN);

  const [offerName, setOfferName] = useState('');
  const [offerPrice, setOfferPrice] = useState('240.00');
  const [offerDays, setOfferDays] = useState(1);
  const [offerDesc, setOfferDesc] = useState('');

  const [depOfferId, setDepOfferId] = useState(INITIAL_DEMO_TOURS_ADMIN[0]?.id ?? '');
  const [depStartIso, setDepStartIso] = useState('2026-12-20T08:00');
  const [depEndIso, setDepEndIso] = useState('2026-12-21T18:00');
  const [depPrice, setDepPrice] = useState('240.00');
  const [depCapacity, setDepCapacity] = useState(16);

  const loadOffers = async () => {
    if (apiOnline === false || isDemoSession) {
      const demoPool =
        catalogType === 'packages' ? INITIAL_DEMO_PACKAGES_ADMIN : INITIAL_DEMO_TOURS_ADMIN;
      setOffers(demoPool);
      if (demoPool[0]) setDepOfferId(demoPool[0].id);
      return;
    }
    try {
      const res = await adminApi.listCatalog(catalogType, 1, 30);
      setOffers(res.items);
      if (res.items[0] && !res.items.some((o) => o.id === depOfferId)) {
        setDepOfferId(res.items[0].id);
      }
    } catch {
      // Conserva listado actual
    }
  };

  useEffect(() => {
    void loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogType, apiOnline, isDemoSession]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      const createdId = `cat-${Date.now()}`;
      setOffers((prev) => [
        {
          id: createdId,
          type: catalogType === 'packages' ? 'package' : 'tour',
          name: offerName,
          status: 'inactive',
          version: 1,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setDepOfferId(createdId);
      setOfferName('');
      setOfferDesc('');
      notifySuccess(
        'Experiencia guardada en borrador',
        'Programa una fecha de salida y sube su fotografía en Galería para publicarla.'
      );
      return;
    }

    try {
      const itineraryItems = Array.from({ length: Math.max(1, offerDays) }, (_, idx) => ({
        day: idx + 1,
        title: `Día ${idx + 1}`,
        description: offerDesc.trim() || 'Actividad guiada programada.',
      }));
      const created = await adminApi.createOffer(catalogType, {
        name: offerName.trim(),
        description: offerDesc.trim() || 'Experiencia turística oficial en Perú.',
        price: offerPrice,
        durationDays: offerDays,
        conditions: ['Cupos confirmados inmediatamente tras el pago.'],
        itinerary: itineraryItems,
      });
      setOfferName('');
      setOfferDesc('');
      setDepOfferId(created.id);
      notifySuccess(
        'Experiencia creada en borrador',
        'Agrega su fecha de salida y fotografía para activarla en la web.'
      );
      await loadOffers();
    } catch (err) {
      notifyError(err, 'No se pudo registrar la experiencia');
    }
  };

  const handleCreateDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    const startUtc = new Date(depStartIso).toISOString();
    const endUtc = new Date(depEndIso).toISOString();
    if (endUtc <= startUtc) {
      notifyError(
        new Error('La fecha y hora de retorno debe ser posterior a la de partida.'),
        'Horario inválido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      notifySuccess('Nueva fecha de salida programada correctamente');
      return;
    }

    try {
      const created = await adminApi.createDeparture(catalogType, depOfferId.trim(), {
        startDate: startUtc,
        endDate: endUtc,
        price: depPrice.trim(),
        capacity: depCapacity,
      });
      notifySuccess('Fecha de salida programada', `Código: ${created.id.slice(0, 8)}`);
    } catch (err) {
      notifyError(err, 'No se pudo programar la fecha de salida');
    }
  };

  const handleToggleOffer = async (item: CatalogAdminItemDto) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    if (apiOnline === false || isDemoSession) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === item.id ? { ...o, status: nextStatus, version: o.version + 1 } : o
        )
      );
      notifySuccess(
        nextStatus === 'active'
          ? `"${item.name}" publicado en el catálogo`
          : `"${item.name}" ocultado temporalmente`
      );
      return;
    }
    try {
      if (item.status === 'active') {
        await adminApi.deactivateOffer(catalogType, item.id, item.version);
      } else {
        await adminApi.activateOffer(catalogType, item.id, item.version);
      }
      await loadOffers();
    } catch (err) {
      notifyError(
        err,
        'Para activar una experiencia, asegúrate de haberle cargado al menos una foto y una salida.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Catálogo Turístico Oficial</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Tours y Paquetes Turísticos
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Administra tus experiencias en Ayacucho y el Perú, publica o pausa ofertas y programa
            nuevas fechas de salida con cupos disponibles.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-white p-1 border border-[#E5DDD0]">
          <button
            type="button"
            onClick={() => setCatalogType('tours')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              catalogType === 'tours'
                ? 'bg-[#12232E] text-white'
                : 'text-[#5C6B73] hover:text-[#12232E]'
            }`}
          >
            Tours Turísticos
          </button>
          <button
            type="button"
            onClick={() => setCatalogType('packages')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              catalogType === 'packages'
                ? 'bg-[#12232E] text-white'
                : 'text-[#5C6B73] hover:text-[#12232E]'
            }`}
          >
            Paquetes Turísticos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Listado de experiencias */}
        <div className="lg:col-span-7 hairline-card rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#12232E]">
              {catalogType === 'packages' ? 'Paquetes registrados' : 'Tours registrados'} (
              {offers.length})
            </h2>
            <Link
              to="/admin/galeria"
              className="text-xs font-semibold text-[#B84A27] hover:underline"
            >
              Subir fotos →
            </Link>
          </div>

          <div className="divide-y divide-[#E5DDD0]">
            {offers.map((o) => (
              <div
                key={o.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#FAF7F2]/60 transition-colors text-xs"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="font-bold text-[#12232E] text-sm truncate">{o.name}</p>
                  <p className="text-[11px] text-[#5C6B73]">
                    {o.type === 'package' ? 'Paquete multidía' : 'Tour guiado'} · Actualizado{' '}
                    {formatLimaDateTime(o.updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={o.status} size="sm" />
                  <Link
                    to={`/${catalogType === 'packages' ? 'paquetes' : 'tours'}/${o.id}`}
                    className="p-2 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-[#5C6B73] hover:text-[#12232E]"
                    title="Ver página pública"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleToggleOffer(o)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D2C6B4] bg-white hover:border-[#12232E] text-xs font-bold text-[#12232E] cursor-pointer"
                  >
                    {o.status === 'active' ? 'Pausar' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral con pestañas: Nueva Experiencia | Programar Salida */}
        <div className="lg:col-span-5 hairline-card rounded-2xl bg-white overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[#E5DDD0] bg-[#FAF7F2]">
            <button
              type="button"
              onClick={() => setActiveFormTab('new-offer')}
              className={`py-3.5 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeFormTab === 'new-offer'
                  ? 'border-[#B84A27] text-[#B84A27] bg-white'
                  : 'border-transparent text-[#5C6B73] hover:text-[#12232E]'
              }`}
            >
              <Compass className="w-4 h-4" />
              Nueva experiencia
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('new-departure')}
              className={`py-3.5 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeFormTab === 'new-departure'
                  ? 'border-[#B84A27] text-[#B84A27] bg-white'
                  : 'border-transparent text-[#5C6B73] hover:text-[#12232E]'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              Programar salida
            </button>
          </div>

          {activeFormTab === 'new-offer' ? (
            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              <p className="text-xs text-[#5C6B73]">
                Toda experiencia nueva se guarda inicialmente en <strong>borrador</strong> para que
                puedas revisar sus salidas y fotografías antes de publicarla.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Nombre de la experiencia
                </label>
                <input
                  type="text"
                  required
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="Ej. Ruta de Iglesias Coloniales y Mirador Acuchimay"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Precio base por persona (S/)
                  </label>
                  <input
                    type="text"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="240.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={offerDays}
                    onChange={(e) => setOfferDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Resumen del recorrido
                </label>
                <textarea
                  rows={3}
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  placeholder="Describe los atractivos principales, horarios e inclusiones..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Guardar en borrador
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateDeparture} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Experiencia turística
                </label>
                <select
                  value={depOfferId}
                  onChange={(e) => setDepOfferId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Fecha y hora de partida
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={depStartIso}
                    onChange={(e) => setDepStartIso(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Fecha y hora de retorno
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={depEndIso}
                    onChange={(e) => setDepEndIso(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Tarifa de esta salida (S/)
                  </label>
                  <input
                    type="text"
                    required
                    value={depPrice}
                    onChange={(e) => setDepPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                    Cupos totales
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={depCapacity}
                    onChange={(e) => setDepCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold cursor-pointer"
              >
                Agregar fecha de salida
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 6: HOTELES ALIADOS Y HABITACIONES (/admin/hoteles)
// ============================================================================

type HotelWorkspaceTab = 'rooms' | 'inventory' | 'proposals' | 'new-hotel';

export const AdminHotelsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [hotels, setHotels] = useState<HotelAdminItemDto[]>(DEMO_HOTELS_ADMIN);
  const [selectedAdminHotelId, setSelectedAdminHotelId] = useState<string>(
    SHOWCASE_HOTELS_DETAIL[0]?.id ?? ''
  );
  const [selectedHotelDetail, setSelectedHotelDetail] = useState<HotelPublicDetailDto | null>(
    SHOWCASE_HOTELS_DETAIL[0] ?? null
  );
  const [workspaceTab, setWorkspaceTab] = useState<HotelWorkspaceTab>('rooms');

  const [hotelName, setHotelName] = useState('');
  const [hotelDesc, setHotelDesc] = useState('');
  const [hotelServices, setHotelServices] = useState(
    'Desayuno incluido (7:00 am - 9:00 am), Wifi fibra óptica, Baño privado y agua caliente, TV Smart'
  );

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(2);
  const [newRoomPrice, setNewRoomPrice] = useState('120.00');

  const [invRoomTypeId, setInvRoomTypeId] = useState(
    SHOWCASE_HOTELS_DETAIL[0]?.roomTypes[0]?.id ?? ''
  );
  const [invDate, setInvDate] = useState('2026-12-18');
  const [invQty, setInvQty] = useState(6);

  const allDepartureChoices = [
    ...SHOWCASE_TOURS.flatMap((t) =>
      t.departures.map((d) => ({
        id: d.id,
        label: `${t.name} — ${formatLimaDateTime(d.startDate)}`,
      }))
    ),
    ...SHOWCASE_PACKAGES.flatMap((p) =>
      p.departures.map((d) => ({
        id: d.id,
        label: `${p.name} — ${formatLimaDateTime(d.startDate)}`,
      }))
    ),
  ];

  const [propDepartureId, setPropDepartureId] = useState(
    allDepartureChoices[0]?.id ?? '00000000-0000-4000-8000-000000000201'
  );
  const [propCheckInDate, setPropCheckInDate] = useState('2026-12-18');
  const [propNights, setPropNights] = useState(2);

  const loadHotels = async () => {
    if (apiOnline === false || isDemoSession) return;
    try {
      const hRes = await adminApi.listHotels(1, 50);
      const merged = mergeWithOfficialDmGoAdminHotels(hRes.items);
      setHotels(merged);
      if (merged.length > 0 && !merged.some((h) => h.id === selectedAdminHotelId)) {
        setSelectedAdminHotelId(merged[0]!.id);
      }
    } catch {
      // Conserva hoteles locales
    }
  };

  useEffect(() => {
    void loadHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession]);

  useEffect(() => {
    let active = true;
    if (!selectedAdminHotelId) {
      setSelectedHotelDetail(null);
      return;
    }

    (async () => {
      if (apiOnline === false || isDemoSession) {
        const localFound =
          SHOWCASE_HOTELS_DETAIL.find((h) => h.id === selectedAdminHotelId) ?? null;
        if (active) {
          setSelectedHotelDetail(localFound);
          if (localFound?.roomTypes[0]) {
            setInvRoomTypeId(localFound.roomTypes[0].id);
          }
        }
        return;
      }

      try {
        const detail = await hotelsApi.getPublicDetail(selectedAdminHotelId);
        if (!active) return;
        setSelectedHotelDetail(detail);
        if (detail.roomTypes[0]) {
          setInvRoomTypeId(detail.roomTypes[0].id);
        }
      } catch {
        if (active) {
          setSelectedHotelDetail(
            SHOWCASE_HOTELS_DETAIL.find((h) => h.id === selectedAdminHotelId) ?? null
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedAdminHotelId, apiOnline, isDemoSession]);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    const services = hotelServices
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (apiOnline === false || isDemoSession) {
      const newId = `hot-${Date.now()}`;
      setHotels((prev) => [
        {
          id: newId,
          name: hotelName,
          status: 'inactive',
          version: 1,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setHotelName('');
      setHotelDesc('');
      setWorkspaceTab('rooms');
      notifySuccess(
        'Hotel registrado en borrador',
        'Agrega sus habitaciones y fotografías antes de publicarlo.'
      );
      return;
    }

    try {
      const created = await adminApi.createHotel({
        name: hotelName.trim(),
        description:
          hotelDesc.trim() || 'Propiedad aliada en Ayacucho verificada por DM GO TRAVEL.',
        services,
      });
      setHotelName('');
      setHotelDesc('');
      setSelectedAdminHotelId(created.id);
      setWorkspaceTab('rooms');
      notifySuccess('Hotel creado en borrador');
      await loadHotels();
    } catch (err) {
      notifyError(err, 'No se pudo registrar el hotel');
    }
  };

  const handleToggleHotel = async (item: HotelAdminItemDto) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    if (apiOnline === false || isDemoSession) {
      setHotels((prev) =>
        prev.map((h) =>
          h.id === item.id ? { ...h, status: nextStatus, version: h.version + 1 } : h
        )
      );
      notifySuccess(`Hotel ${item.name}: ${nextStatus === 'active' ? 'Publicado' : 'Pausado'}`);
      return;
    }

    try {
      if (item.status === 'active') {
        await adminApi.deactivateHotel(item.id, item.version);
      } else {
        await adminApi.activateHotel(item.id, item.version);
      }
      notifySuccess(`Estado actualizado para ${item.name}`);
      await loadHotels();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar el estado del hotel');
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminHotelId) return;

    if (apiOnline === false || isDemoSession) {
      notifySuccess(`Habitación "${newRoomName}" (${formatPen(newRoomPrice)}) agregada`);
      setNewRoomName('');
      return;
    }

    try {
      const created = await adminApi.createRoomType(selectedAdminHotelId, {
        name: newRoomName.trim(),
        capacity: newRoomCapacity,
        basePrice: newRoomPrice.trim(),
      });
      setNewRoomName('');
      setInvRoomTypeId(created.id);
      notifySuccess(`Tipo de habitación "${created.name}" registrado`);
      const detail = await hotelsApi.getPublicDetail(selectedAdminHotelId).catch(() => null);
      if (detail) setSelectedHotelDetail(detail);
    } catch (err) {
      notifyError(err, 'No se pudo registrar la habitación');
    }
  };

  const handleSaveNightlyInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      notifySuccess(`Disponibilidad actualizada: ${invQty} habitaciones para el ${invDate}`);
      return;
    }
    try {
      await adminApi.updateRoomInventory(invRoomTypeId.trim(), invDate, invQty);
      notifySuccess('Cupos por noche actualizados correctamente');
    } catch (err) {
      notifyError(
        err,
        'No se puede reducir por debajo de las habitaciones que ya están reservadas esa noche.'
      );
    }
  };

  const handleCreateLodgingProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminHotelId || !propDepartureId.trim() || propNights < 1) return;

    const startUtcDate = new Date(`${propCheckInDate}T15:00:00Z`);
    const endUtcDate = new Date(startUtcDate.getTime() + propNights * 86_400_000);

    if (apiOnline === false || isDemoSession) {
      notifySuccess(
        `Hotel vinculado a la salida seleccionada (${propNights} noche${propNights === 1 ? '' : 's'})`
      );
      return;
    }

    try {
      await adminApi.createLodgingProposal({
        departureId: propDepartureId.trim(),
        hotelId: selectedAdminHotelId,
        startDate: startUtcDate.toISOString(),
        endDate: endUtcDate.toISOString(),
      });
      notifySuccess('Estancia de hotel habilitada para esta fecha de salida');
    } catch (err) {
      notifyError(err, 'No se pudo vincular el hotel a la salida');
    }
  };

  const selectedMeta = selectedHotelDetail
    ? extractHotelEditorialMeta(selectedHotelDetail)
    : null;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Alianzas Hoteleras en Ayacucho</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Hoteles Aliados y Habitaciones
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Selecciona cualquiera de los hoteles aliados de DM GO TRAVEL para revisar sus tarifas
            por habitación, ajustar la disponibilidad nocturna o vincularlo a una salida turística.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/galeria"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D2C6B4] bg-white hover:border-[#12232E] text-xs font-bold text-[#12232E]"
          >
            <ImagePlus className="w-4 h-4 text-[#B84A27]" />
            Cambiar fotos del hotel
          </Link>
          <button
            type="button"
            onClick={() => setWorkspaceTab('new-hotel')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1B5E4A] hover:bg-[#144738] text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo hotel aliado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Lista visual de los 9 hoteles */}
        <div className="lg:col-span-5 hairline-card rounded-2xl bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5DDD0] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#12232E]">
              Directorio de hoteles ({hotels.length})
            </h2>
            <span className="text-[11px] text-[#5C6B73]">Haz clic para administrar</span>
          </div>

          <div className="divide-y divide-[#E5DDD0] max-h-[600px] overflow-y-auto">
            {hotels.map((h, idx) => {
              const isSelected = h.id === selectedAdminHotelId && workspaceTab !== 'new-hotel';
              const detailMatch = SHOWCASE_HOTELS_DETAIL.find((d) => d.id === h.id);
              const thumb = resolveMediaUrl(
                detailMatch?.images[0]?.url,
                'hotel',
                idx,
                h.name
              );

              return (
                <div
                  key={h.id}
                  className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-[#E7F3EE]/60' : 'hover:bg-[#FAF7F2]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAdminHotelId(h.id);
                      if (workspaceTab === 'new-hotel') setWorkspaceTab('rooms');
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={thumb}
                      alt={h.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E5DDD0]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#12232E] truncate">{h.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusPill status={h.status} size="sm" />
                        {detailMatch && (
                          <span className="text-[11px] text-[#5C6B73]">
                            {detailMatch.roomTypes.length} tipos de hab.
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      to={`/hoteles/${h.id}`}
                      className="p-2 rounded-lg border border-[#E5DDD0] bg-white text-[#5C6B73] hover:text-[#12232E]"
                      title="Ver ficha pública"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleToggleHotel(h)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D2C6B4] bg-white hover:border-[#12232E] text-[11px] font-bold text-[#12232E] cursor-pointer"
                    >
                      {h.status === 'active' ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Espacio de trabajo por pestañas */}
        <div className="lg:col-span-7 hairline-card rounded-2xl bg-white overflow-hidden">
          {workspaceTab === 'new-hotel' ? (
            <form onSubmit={handleCreateHotel} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DDD0] pb-3">
                <h2 className="font-editorial text-2xl text-[#12232E] inline-flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-[#1B5E4A]" />
                  Registrar nuevo hotel aliado
                </h2>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('rooms')}
                  className="text-xs font-bold text-[#5C6B73] hover:text-[#12232E] cursor-pointer"
                >
                  Volver al hotel seleccionado
                </button>
              </div>

              <p className="text-xs text-[#5C6B73]">
                El nuevo hotel se guardará inicialmente en <strong>borrador</strong> hasta que
                registres sus tipos de habitación y al menos una fotografía.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Nombre comercial del hotel o casona
                </label>
                <input
                  type="text"
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="Ej. Casona Real de Huamanga"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Ubicación, categoría y horarios Check-in / Check-out
                </label>
                <textarea
                  rows={2}
                  value={hotelDesc}
                  onChange={(e) => setHotelDesc(e.target.value)}
                  placeholder="Ej. A 2 cuadras de la Plaza Mayor de Ayacucho. Check-in 1:00 pm | Check-out 12:00 pm."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Servicios incluidos (separados por coma)
                </label>
                <textarea
                  rows={2}
                  value={hotelServices}
                  onChange={(e) => setHotelServices(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1B5E4A] hover:bg-[#144738] text-white text-xs font-bold cursor-pointer"
              >
                Guardar nuevo hotel
              </button>
            </form>
          ) : (
            <>
              {/* Cabecera del hotel activo */}
              <div className="p-6 pb-4 bg-[#FAF7F2] border-b border-[#E5DDD0] space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E4A]">
                    Hotel seleccionado
                  </span>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#12232E] mt-0.5">
                    {selectedHotelDetail?.name ?? 'Hotel Aliado'}
                  </h2>
                  {selectedMeta && (
                    <p className="text-xs text-[#5C6B73] mt-1">
                      {selectedMeta.location} · Check-in {selectedMeta.checkIn} / Check-out{' '}
                      {selectedMeta.checkOut}
                    </p>
                  )}
                </div>

                {/* Pestañas del espacio de trabajo del hotel */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { key: 'rooms', label: '1. Habitaciones y tarifas', icon: BedDouble },
                    { key: 'inventory', label: '2. Cupos por noche', icon: CalendarPlus },
                    { key: 'proposals', label: '3. Vincular a salida (24 h)', icon: Link2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWorkspaceTab(key as HotelWorkspaceTab)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        workspaceTab === key
                          ? 'bg-[#12232E] text-white shadow-xs'
                          : 'bg-white text-[#5C6B73] border border-[#E5DDD0] hover:text-[#12232E]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido de la pestaña activa */}
              <div className="p-6">
                {workspaceTab === 'rooms' && (
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C6B73]">
                        Tarifario actual ({selectedHotelDetail?.roomTypes.length ?? 0} habitaciones)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {(selectedHotelDetail?.roomTypes ?? []).map((rt, rIdx) => (
                          <div
                            key={rt.id}
                            className="p-3 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {rt.images[0] && (
                                <img
                                  src={resolveMediaUrl(rt.images[0].url, 'room', rIdx, rt.name)}
                                  alt={rt.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E5DDD0]"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-[#12232E] truncate">{rt.name}</p>
                                <p className="text-[11px] text-[#5C6B73]">
                                  Hasta {rt.capacity} {rt.capacity === 1 ? 'huésped' : 'huéspedes'}
                                </p>
                              </div>
                            </div>
                            <strong className="font-bold text-[#1B5E4A] tabular-nums shrink-0">
                              {formatPen(rt.basePrice)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form
                      onSubmit={handleCreateRoomType}
                      className="pt-5 border-t border-[#E5DDD0] space-y-3"
                    >
                      <h3 className="text-sm font-bold text-[#12232E]">
                        Agregar nuevo tipo de habitación
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Ej. Hab. Matrimonial Superior"
                          className="sm:col-span-1 px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                        <input
                          type="number"
                          min={1}
                          required
                          value={newRoomCapacity}
                          onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                          placeholder="Capacidad (personas)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                        <input
                          type="text"
                          required
                          value={newRoomPrice}
                          onChange={(e) => setNewRoomPrice(e.target.value)}
                          placeholder="Tarifa S/ (120.00)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold cursor-pointer"
                      >
                        Agregar habitación
                      </button>
                    </form>
                  </div>
                )}

                {workspaceTab === 'inventory' && (
                  <form onSubmit={handleSaveNightlyInventory} className="space-y-4">
                    <p className="text-xs text-[#5C6B73]">
                      Define cuántas habitaciones físicas están disponibles para reservar en una
                      fecha específica. El sistema protege automáticamente las habitaciones que ya
                      tienen reserva activa.
                    </p>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                        Tipo de habitación
                      </label>
                      <select
                        value={invRoomTypeId}
                        onChange={(e) => setInvRoomTypeId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
                      >
                        {(selectedHotelDetail?.roomTypes ?? []).map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name} — {formatPen(rt.basePrice)} (Cap. {rt.capacity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                          Fecha de la noche
                        </label>
                        <input
                          type="date"
                          required
                          value={invDate}
                          onChange={(e) => setInvDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                          Habitaciones disponibles
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={invQty}
                          onChange={(e) => setInvQty(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold cursor-pointer"
                    >
                      Guardar disponibilidad nocturna
                    </button>
                  </form>
                )}

                {workspaceTab === 'proposals' && (
                  <form onSubmit={handleCreateLodgingProposal} className="space-y-4">
                    <p className="text-xs text-[#5C6B73]">
                      Habilita este hotel como opción de alojamiento cuando un viajero reserve una
                      fecha de salida específica (calculado en noches completas de 24 horas).
                    </p>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                        Salida turística a vincular
                      </label>
                      <select
                        value={propDepartureId}
                        onChange={(e) => setPropDepartureId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium text-[#12232E]"
                      >
                        {allDepartureChoices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                          Fecha de Check-in
                        </label>
                        <input
                          type="date"
                          required
                          value={propCheckInDate}
                          onChange={(e) => setPropCheckInDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                          Cantidad de noches (24 h c/u)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          required
                          value={propNights}
                          onChange={(e) => setPropNights(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#1B5E4A] hover:bg-[#144738] text-white text-xs font-bold cursor-pointer"
                    >
                      Vincular hotel a esta salida
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 7: FLOTA DE MOVILIDAD TURÍSTICA (/admin/movilidad)
// ============================================================================

export const AdminMobilityPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [mobility, setMobility] = useState<MobilityAdminItemDto[]>(DEMO_MOBILITY_ADMIN);
  const [mobName, setMobName] = useState('');
  const [mobType, setMobType] = useState('van');
  const [mobCapacity, setMobCapacity] = useState(15);
  const [mobDesc, setMobDesc] = useState('');

  const loadMobility = async () => {
    if (apiOnline === false || isDemoSession) return;
    try {
      const res = await adminApi.listMobility(1, 30);
      setMobility(res.items);
    } catch {
      // Conserva flota actual
    }
  };

  useEffect(() => {
    void loadMobility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession]);

  const handleCreateMobility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      const createdMob: MobilityAdminItemDto = {
        id: `mob-${Date.now()}`,
        name: mobName.trim(),
        description: mobDesc.trim() || 'Unidad turística equipada para rutas regionales.',
        type: mobType.trim(),
        capacity: mobCapacity,
        status: 'inactive',
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      setMobility((prev) => [createdMob, ...prev]);
      setMobName('');
      setMobDesc('');
      notifySuccess(
        'Unidad registrada en borrador',
        'Sube su fotografía en Galería Fotográfica para publicarla.'
      );
      return;
    }

    try {
      await adminApi.createMobility({
        name: mobName.trim(),
        description: mobDesc.trim() || 'Unidad turística equipada para rutas regionales.',
        type: mobType.trim(),
        capacity: mobCapacity,
      });
      setMobName('');
      setMobDesc('');
      notifySuccess('Unidad registrada en borrador; agrega su foto en Galería para activarla');
      await loadMobility();
    } catch (err) {
      notifyError(err, 'No se pudo registrar la unidad');
    }
  };

  const handleToggleMobility = async (item: MobilityAdminItemDto) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    if (apiOnline === false || isDemoSession) {
      setMobility((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, status: nextStatus, version: m.version + 1 } : m
        )
      );
      notifySuccess(`Unidad ${item.name}: ${nextStatus === 'active' ? 'Publicada' : 'Ocultada'}`);
      return;
    }

    try {
      if (item.status === 'active') {
        await adminApi.deactivateMobility(item.id, item.version);
      } else {
        await adminApi.activateMobility(item.id, item.version);
      }
      await loadMobility();
    } catch (err) {
      notifyError(err, 'Asegúrate de haber cargado una fotografía a la unidad antes de activarla');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Transporte y Confort en Ruta</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Flota de Movilidad Turística
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Presenta a tus viajeros los vehículos con los que operan los recorridos, su capacidad de
            asientos y equipamiento de seguridad.
          </p>
        </div>

        <Link
          to="/movilidad"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2C6B4] bg-white hover:border-[#12232E] text-xs font-semibold text-[#12232E]"
        >
          Ver sección pública
          <ExternalLink className="w-3.5 h-3.5 text-[#B84A27]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 hairline-card rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#12232E]">
              Unidades registradas ({mobility.length})
            </h2>
            <Link
              to="/admin/galeria"
              className="text-xs font-semibold text-[#B84A27] hover:underline"
            >
              Cambiar fotos de unidades →
            </Link>
          </div>

          <div className="divide-y divide-[#E5DDD0]">
            {mobility.map((m) => (
              <div
                key={m.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#FAF7F2]/60 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#B84A27] shrink-0" />
                    <strong className="text-sm text-[#12232E]">{m.name}</strong>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] text-[10px] font-semibold text-[#5C6B73]">
                      {m.capacity} pasajeros
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B73]">{m.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={m.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => void handleToggleMobility(m)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D2C6B4] bg-white hover:border-[#12232E] text-xs font-bold text-[#12232E] cursor-pointer"
                  >
                    {m.status === 'active' ? 'Ocultar' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleCreateMobility}
          className="lg:col-span-5 hairline-card rounded-2xl p-6 bg-white space-y-4"
        >
          <h2 className="font-editorial text-2xl text-[#12232E]">Registrar nueva unidad</h2>
          <p className="text-xs text-[#5C6B73]">
            Registra los datos del vehículo y luego carga su fotografía en Galería para mostrarlo en
            el portal público.
          </p>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Nombre del vehículo
            </label>
            <input
              type="text"
              required
              value={mobName}
              onChange={(e) => setMobName(e.target.value)}
              placeholder="Ej. Mercedes-Benz Sprinter Panorámica"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Categoría
              </label>
              <select
                value={mobType}
                onChange={(e) => setMobType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium"
              >
                <option value="van">Van turística</option>
                <option value="minibus">Minibús</option>
                <option value="suv">Camioneta 4x4 / SUV</option>
                <option value="sedan">Auto ejecutivo</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Capacidad (asientos)
              </label>
              <input
                type="number"
                min={1}
                required
                value={mobCapacity}
                onChange={(e) => setMobCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
              Equipamiento y comodidades
            </label>
            <textarea
              rows={3}
              value={mobDesc}
              onChange={(e) => setMobDesc(e.target.value)}
              placeholder="Ej. Aire acondicionado, asientos reclinables, botiquín de oxígeno y GPS..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold cursor-pointer"
          >
            Guardar unidad
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 8: GALERÍA FOTOGRÁFICA OFICIAL (/admin/galeria)
// ============================================================================

type MediaTargetKind = 'hotel' | 'room-type' | 'offer' | 'mobility';

export const AdminGalleryPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [mediaKind, setMediaKind] = useState<MediaTargetKind>('hotel');
  const [selectedHotelId, setSelectedHotelId] = useState(SHOWCASE_HOTELS_DETAIL[0]?.id ?? '');
  const [hotelDetail, setHotelDetail] = useState<HotelPublicDetailDto | null>(
    SHOWCASE_HOTELS_DETAIL[0] ?? null
  );
  const [roomTypeId, setRoomTypeId] = useState(
    SHOWCASE_HOTELS_DETAIL[0]?.roomTypes[0]?.id ?? ''
  );
  const [offerType, setOfferType] = useState<CatalogApiType>('tours');
  const [offerId, setOfferId] = useState(SHOWCASE_TOURS[0]?.id ?? '');
  const [mobilityId, setMobilityId] = useState(DEMO_MOBILITY_ADMIN[0]?.id ?? '');
  const [replaceImageId, setReplaceImageId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (apiOnline === false || isDemoSession) {
        const local = SHOWCASE_HOTELS_DETAIL.find((h) => h.id === selectedHotelId) ?? null;
        if (active) {
          setHotelDetail(local);
          if (local?.roomTypes[0]) setRoomTypeId(local.roomTypes[0].id);
          setReplaceImageId('');
        }
        return;
      }
      try {
        const detail = await hotelsApi.getPublicDetail(selectedHotelId);
        if (!active) return;
        setHotelDetail(detail);
        if (detail.roomTypes[0]) setRoomTypeId(detail.roomTypes[0].id);
        setReplaceImageId('');
      } catch {
        if (active) {
          setHotelDetail(SHOWCASE_HOTELS_DETAIL.find((h) => h.id === selectedHotelId) ?? null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedHotelId, apiOnline, isDemoSession]);

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(selectedFile.type)) {
      notifyError(
        new Error('Solo se aceptan imágenes en formato JPG, PNG o WebP.'),
        'Formato no válido'
      );
      return;
    }

    if (selectedFile.size > 5_000_000) {
      notifyError(
        new Error('La fotografía supera el peso máximo permitido de 5 MB.'),
        'Archivo demasiado grande'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      notifySuccess(
        `Fotografía "${selectedFile.name}" validada correctamente`,
        'En conexión real se almacenará y actualizará la galería al instante.'
      );
      setSelectedFile(null);
      return;
    }

    try {
      if (mediaKind === 'hotel') {
        if (replaceImageId) {
          await adminApi.replaceHotelImage(selectedHotelId, replaceImageId, selectedFile, isPrimary);
          notifySuccess('Fotografía del hotel reemplazada con éxito');
        } else {
          await adminApi.uploadHotelImage(selectedHotelId, selectedFile, isPrimary);
          notifySuccess('Nueva fotografía agregada a la galería del hotel');
        }
        const refreshed = await hotelsApi.getPublicDetail(selectedHotelId).catch(() => null);
        if (refreshed) setHotelDetail(refreshed);
      } else if (mediaKind === 'room-type') {
        if (replaceImageId) {
          await adminApi.replaceRoomTypeImage(
            selectedHotelId,
            roomTypeId,
            replaceImageId,
            selectedFile,
            isPrimary
          );
          notifySuccess('Fotografía de la habitación reemplazada');
        } else {
          await adminApi.uploadRoomTypeImage(selectedHotelId, roomTypeId, selectedFile, isPrimary);
          notifySuccess('Fotografía agregada a la habitación');
        }
      } else if (mediaKind === 'mobility') {
        await adminApi.replaceMobilityImage(mobilityId, selectedFile);
        notifySuccess('Fotografía de la unidad actualizada');
      } else {
        await adminApi.uploadOfferImage(offerType, offerId, selectedFile, isPrimary);
        notifySuccess('Fotografía agregada a la experiencia turística');
      }

      setSelectedFile(null);
      setReplaceImageId('');
    } catch (err) {
      notifyError(err, 'No se pudo cargar la imagen');
    }
  };

  const offerPool = offerType === 'packages' ? SHOWCASE_PACKAGES : SHOWCASE_TOURS;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] space-y-1.5">
        <SectionEyebrow>Gestión Visual del Catálogo</SectionEyebrow>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
          Galería Fotográfica Oficial
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
          Reemplaza las imágenes referenciales por fotografías originales de tus hoteles aliados,
          habitaciones, tours y vehículos (formatos JPG, PNG o WebP de hasta 5 MB).
        </p>
      </div>

      {/* Selector visual de categoría */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'hotel', label: 'Hoteles Aliados', icon: Hotel },
          { key: 'room-type', label: 'Habitaciones', icon: BedDouble },
          { key: 'offer', label: 'Tours y Paquetes', icon: Compass },
          { key: 'mobility', label: 'Flota Turística', icon: Bus },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMediaKind(key as MediaTargetKind);
              setReplaceImageId('');
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              mediaKind === key
                ? 'border-[#B84A27] bg-[#F7EAE4]/70 text-[#12232E] ring-1 ring-[#B84A27]'
                : 'border-[#E5DDD0] bg-white text-[#5C6B73] hover:text-[#12232E]'
            }`}
          >
            <Icon className="w-5 h-5 text-[#B84A27] mb-2" />
            <span className="block text-xs font-bold text-[#12232E]">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de subida */}
        <form
          onSubmit={handleUploadMedia}
          className="lg:col-span-5 hairline-card rounded-2xl p-6 bg-white space-y-4"
        >
          <h2 className="font-editorial text-2xl text-[#12232E]">Subir o reemplazar foto</h2>

          {(mediaKind === 'hotel' || mediaKind === 'room-type') && (
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Hotel aliado
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              >
                {DEMO_HOTELS_ADMIN.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mediaKind === 'hotel' && hotelDetail && hotelDetail.images.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Acción en la galería
              </label>
              <select
                value={replaceImageId}
                onChange={(e) => setReplaceImageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs text-[#12232E]"
              >
                <option value="">+ Agregar como nueva foto a la galería</option>
                {hotelDetail.images.map((img, i) => (
                  <option key={img.id} value={img.id}>
                    Reemplazar foto #{i + 1} ({img.isPrimary ? 'Portada principal' : 'Galería'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mediaKind === 'room-type' && hotelDetail && (
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Habitación
              </label>
              <select
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs text-[#12232E]"
              >
                {hotelDetail.roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.images.length > 0 ? 'Con foto actual' : 'Sin foto'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mediaKind === 'offer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Tipo de experiencia
                </label>
                <select
                  value={offerType}
                  onChange={(e) => {
                    const next = e.target.value as CatalogApiType;
                    setOfferType(next);
                    const pool = next === 'packages' ? SHOWCASE_PACKAGES : SHOWCASE_TOURS;
                    if (pool[0]) setOfferId(pool[0].id);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-medium"
                >
                  <option value="tours">Tours Turísticos</option>
                  <option value="packages">Paquetes Turísticos</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                  Experiencia
                </label>
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                >
                  {offerPool.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {mediaKind === 'mobility' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
                Vehículo de la flota
              </label>
              <select
                value={mobilityId}
                onChange={(e) => setMobilityId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              >
                {DEMO_MOBILITY_ADMIN.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mediaKind !== 'mobility' && (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#12232E] cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="accent-[#B84A27] w-4 h-4"
              />
              Usar como fotografía de portada principal
            </label>
          )}

          <div className="p-4 rounded-xl border border-dashed border-[#D2C6B4] bg-[#FAF7F2] space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs cursor-pointer"
            />
            <p className="text-[11px] text-[#5C6B73]">
              Formatos admitidos: JPG, PNG o WebP · Tamaño máximo: 5 MB
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedFile}
            className="w-full py-3 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-40 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {replaceImageId ? 'Reemplazar fotografía seleccionada' : 'Subir fotografía'}
          </button>
        </form>

        {/* Vista previa de la galería actual del hotel / habitaciones */}
        <div className="lg:col-span-7 hairline-card rounded-2xl p-6 bg-white space-y-4">
          <h2 className="text-sm font-bold text-[#12232E]">
            Vista previa de fotografías actuales
          </h2>

          {(mediaKind === 'hotel' || mediaKind === 'room-type') && hotelDetail ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hotelDetail.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setMediaKind('hotel');
                    setReplaceImageId(img.id);
                  }}
                  className={`group rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                    replaceImageId === img.id
                      ? 'border-[#B84A27] ring-2 ring-[#B84A27]/30'
                      : 'border-[#E5DDD0]'
                  }`}
                >
                  <img
                    src={resolveMediaUrl(img.url, 'hotel', i, hotelDetail.name)}
                    alt={`${hotelDetail.name} ${i + 1}`}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-2 bg-[#FAF7F2] text-[10px] font-semibold text-[#12232E] truncate">
                    {img.isPrimary ? '★ Portada principal' : `Galería #${i + 1}`}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5C6B73]">
              Selecciona el archivo en el panel izquierdo para actualizar la imagen pública de esta
              sección.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 9: DIRECTORIO DE CLIENTES (/admin/clientes)
// ============================================================================

export const AdminClientsPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientTotal, setClientTotal] = useState(DEMO_CLIENTS.length);
  const [clientHasNext, setClientHasNext] = useState(false);

  const [clients, setClients] = useState<ClientSummaryDto[]>(DEMO_CLIENTS);
  const [lastCsvReferenceAt, setLastCsvReferenceAt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadClients = async (targetPage = clientPage) => {
    if (registeredFrom && registeredTo && registeredFrom > registeredTo) {
      notifyError(
        new Error('La fecha inicial de registro no puede ser mayor que la fecha final.'),
        'Rango de fechas inválido'
      );
      return;
    }
    if (apiOnline === false || isDemoSession) return;
    try {
      const res = await adminApi.listClients({
        page: targetPage,
        pageSize: 10,
        name: clientName.trim() || undefined,
        email: clientEmail.trim() || undefined,
        status: clientStatus || undefined,
        registeredFrom: registeredFrom || undefined,
        registeredTo: registeredTo || undefined,
      });
      setClients(res.items);
      setClientPage(res.page);
      setClientTotal(res.total);
      setClientHasNext(res.hasNext);
    } catch (err) {
      notifyError(err, 'No se pudo consultar el directorio de clientes');
    }
  };

  useEffect(() => {
    void loadClients(clientPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession, clientPage]);

  const handleExportClientsCsv = async () => {
    if (registeredFrom && registeredTo && registeredFrom > registeredTo) {
      notifyError(
        new Error('Revisa el rango de fechas antes de exportar.'),
        'Exportación cancelada'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const refIso = new Date().toISOString();
      setLastCsvReferenceAt(refIso);
      const csv =
        'id,status,fullName,email,phone,emailVerified,registeredAt,reservationCount\ncl-01,active,"Valeria Quispe Mendoza",valeria.quispe@viajero.pe,"+51 987 654 321",true,2026-10-14T15:00:00Z,3\ncl-02,closed,,,,,1\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clientes-dmgotravel.csv';
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('Archivo CSV de clientes descargado');
      return;
    }

    setExporting(true);
    try {
      const accepted = await adminApi.createClientsExport({
        name: clientName.trim() || undefined,
        email: clientEmail.trim() || undefined,
        status: clientStatus || undefined,
        registeredFrom: registeredFrom || undefined,
        registeredTo: registeredTo || undefined,
      });
      setLastCsvReferenceAt(accepted.referenceAt);

      let job = await adminApi.getExportStatus(accepted.id);
      for (
        let i = 0;
        i < 6 &&
        job.status.toLowerCase() !== 'completed' &&
        job.status.toLowerCase() !== 'ready';
        i++
      ) {
        await new Promise((r) => setTimeout(r, 350));
        job = await adminApi.getExportStatus(accepted.id);
      }

      const { blob, fileName } = await adminApi.downloadExportCsv(accepted.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('Archivo CSV de clientes descargado');
    } catch (err) {
      notifyError(err, 'No se pudo descargar el archivo CSV');
    } finally {
      setExporting(false);
    }
  };

  const visibleClients =
    apiOnline === false || isDemoSession
      ? clients.filter((c) => {
          const isClosed = c.status.toLowerCase() === 'closed';
          if (clientStatus && c.status.toLowerCase() !== clientStatus) return false;
          if (clientName.trim()) {
            if (isClosed) return false;
            if (!(c.fullName ?? '').toLowerCase().includes(clientName.trim().toLowerCase())) {
              return false;
            }
          }
          if (clientEmail.trim()) {
            if (isClosed) return false;
            if (!(c.email ?? '').toLowerCase().includes(clientEmail.trim().toLowerCase())) {
              return false;
            }
          }
          return true;
        })
      : clients;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Comunidad de Viajeros</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Consulta de lectura de los viajeros registrados, cantidad de reservas realizadas y
            exportación en formato CSV compatible con Excel.
          </p>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleExportClientsCsv()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#B84A27] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#C89B54]" />
          {exporting ? 'Preparando CSV...' : 'Exportar Clientes CSV'}
        </button>
      </div>

      {lastCsvReferenceAt && (
        <div className="rounded-xl bg-[#E7F3EE] border border-[#B6DEC9] px-4 py-3 text-xs text-[#15523F] flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Última exportación generada con datos al{' '}
            <strong>{formatLimaDateTime(lastCsvReferenceAt)}</strong> (Hora de Perú).
          </span>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setClientPage(1);
          void loadClients(1);
        }}
        className="hairline-card rounded-2xl p-5 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
      >
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Nombre</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Correo</label>
          <input
            type="text"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Buscar por correo..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Estado</label>
          <select
            value={clientStatus}
            onChange={(e) => setClientStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          >
            <option value="">Todos</option>
            <option value="active">Cuentas activas</option>
            <option value="closed">Cuentas cerradas</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Desde</label>
          <input
            type="date"
            value={registeredFrom}
            onChange={(e) => setRegisteredFrom(e.target.value)}
            aria-label="Registro desde"
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-3 flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Hasta</label>
            <input
              type="date"
              value={registeredTo}
              onChange={(e) => setRegisteredTo(e.target.value)}
              aria-label="Registro hasta"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>
          <button
            type="submit"
            className="self-end py-2 px-3.5 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Buscar
          </button>
        </div>
      </form>

      {/* Tabla de clientes */}
      <div className="hairline-card rounded-2xl bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#B84A27]" />
          <h2 className="text-sm font-bold text-[#12232E]">
            Viajeros registrados ({visibleClients.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#5C6B73] border-b border-[#E5DDD0]">
              <tr>
                <th className="px-5 py-3">Viajero</th>
                <th className="px-5 py-3">Correo electrónico</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Fecha de registro</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Reservas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#5C6B73]">
                    No se encontraron clientes con esos criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                visibleClients.map((c) => {
                  const isClosed = c.status.toLowerCase() === 'closed';
                  return (
                    <tr key={c.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="px-5 py-3.5 font-semibold text-[#12232E]">
                        {isClosed ? 'Datos protegidos por cierre de cuenta' : c.fullName ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[#5C6B73]">
                        {isClosed ? (
                          '—'
                        ) : (
                          <span>
                            {c.email ?? '—'}{' '}
                            {c.emailVerified !== null && c.emailVerified !== undefined && (
                              <span className="text-[10px] font-bold text-[#1B5E4A]">
                                ({c.emailVerified ? 'Verificado' : 'Pendiente'})
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#5C6B73]">
                        {isClosed ? '—' : c.phone || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[#5C6B73] whitespace-nowrap">
                        {isClosed || !c.registeredAt ? '—' : formatLimaDateTime(c.registeredAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={c.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums text-[#12232E]">
                        {c.reservationCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-4">
          <PaginationControls
            page={clientPage}
            pageSize={10}
            total={clientTotal}
            hasNext={clientHasNext}
            onPageChange={setClientPage}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECCIÓN 10: HISTORIAL DE ACTIVIDAD Y SEGURIDAD (/admin/auditoria)
// ============================================================================

export const AdminAuditPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(DEMO_AUDIT.length);
  const [auditHasNext, setAuditHasNext] = useState(false);

  const [audit, setAudit] = useState<AuditEntryDto[]>(DEMO_AUDIT);
  const [exporting, setExporting] = useState(false);

  const loadAudit = async (targetPage = auditPage) => {
    if (auditFrom && auditTo && auditFrom > auditTo) {
      notifyError(
        new Error('La fecha inicial no puede ser posterior a la fecha final.'),
        'Rango de fechas inválido'
      );
      return;
    }
    if (apiOnline === false || isDemoSession) return;
    try {
      const res = await adminApi.listAudit({
        page: targetPage,
        pageSize: 12,
        from: auditFrom || undefined,
        to: auditTo || undefined,
        actor: actorFilter.trim() || undefined,
        entity: entityFilter.trim() || undefined,
        result: resultFilter.trim() || undefined,
      });
      setAudit(res.items);
      setAuditPage(res.page);
      setAuditTotal(res.total);
      setAuditHasNext(res.hasNext);
    } catch (err) {
      notifyError(err, 'No se pudo consultar el historial de actividad');
    }
  };

  useEffect(() => {
    void loadAudit(auditPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession, auditPage]);

  const handleExportAuditCsv = async () => {
    if (auditFrom && auditTo && auditFrom > auditTo) {
      notifyError(new Error('Revisa el rango de fechas antes de exportar.'), 'Filtro inválido');
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const csv =
        'id,occurredAt,actor,entity,entityId,action,result,correlationId\naud-101,2026-11-24T16:40:00Z,operaciones@dmgotravel.pe,ReportSnapshot,rep-2026-nov,REPORT_CREATED,SUCCESS,corr-98a4f21c\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'historial-actividad-dmgotravel.csv';
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('Archivo CSV de actividad descargado');
      return;
    }

    setExporting(true);
    try {
      const accepted = await adminApi.createAuditExport({
        from: auditFrom || undefined,
        to: auditTo || undefined,
        actor: actorFilter.trim() || undefined,
        entity: entityFilter.trim() || undefined,
        result: resultFilter.trim() || undefined,
      });

      let job = await adminApi.getExportStatus(accepted.id);
      for (
        let i = 0;
        i < 6 &&
        job.status.toLowerCase() !== 'completed' &&
        job.status.toLowerCase() !== 'ready';
        i++
      ) {
        await new Promise((r) => setTimeout(r, 350));
        job = await adminApi.getExportStatus(accepted.id);
      }

      const { blob, fileName } = await adminApi.downloadExportCsv(accepted.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('Archivo CSV de actividad descargado');
    } catch (err) {
      notifyError(err, 'No se pudo exportar el historial');
    } finally {
      setExporting(false);
    }
  };

  const visibleAudit =
    apiOnline === false || isDemoSession
      ? audit.filter((a) => {
          if (
            actorFilter.trim() &&
            !a.actor.toLowerCase().includes(actorFilter.trim().toLowerCase())
          ) {
            return false;
          }
          if (
            entityFilter.trim() &&
            !a.entity.toLowerCase().includes(entityFilter.trim().toLowerCase())
          ) {
            return false;
          }
          if (
            resultFilter.trim() &&
            a.result.toLowerCase() !== resultFilter.trim().toLowerCase()
          ) {
            return false;
          }
          return true;
        })
      : audit;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E5DDD0] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <SectionEyebrow>Seguridad y Trazabilidad</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
            Historial de Actividad del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B73] max-w-2xl">
            Registro cronológico e inalterable de inicios de sesión, cambios en el catálogo,
            reservas, pagos y devoluciones.
          </p>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleExportAuditCsv()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#12232E] hover:bg-[#B84A27] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#C89B54]" />
          {exporting ? 'Preparando CSV...' : 'Exportar Auditoría CSV'}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAuditPage(1);
          void loadAudit(1);
        }}
        className="hairline-card rounded-2xl p-5 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
      >
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Desde</label>
          <input
            type="date"
            value={auditFrom}
            onChange={(e) => setAuditFrom(e.target.value)}
            aria-label="Auditoría desde"
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Hasta</label>
          <input
            type="date"
            value={auditTo}
            onChange={(e) => setAuditTo(e.target.value)}
            aria-label="Auditoría hasta"
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">
            Usuario o proceso
          </label>
          <input
            type="text"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="Ej. operaciones@dmgotravel.pe"
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Módulo</label>
          <input
            type="text"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            placeholder="Ej. Reservation, Hotel..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
        </div>

        <div className="lg:col-span-3 flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#5C6B73] mb-1">Resultado</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            >
              <option value="">Todos</option>
              <option value="SUCCESS">Exitoso</option>
              <option value="FAILURE">Rechazado</option>
            </select>
          </div>
          <button
            type="submit"
            aria-label="Filtrar auditoría"
            className="self-end px-4 py-2 rounded-xl bg-[#12232E] hover:bg-[#243B4A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Filtrar
          </button>
        </div>
      </form>

      <div className="hairline-card rounded-2xl bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1B5E4A]" />
          <h2 className="text-sm font-bold text-[#12232E]">
            Eventos registrados ({visibleAudit.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#5C6B73] border-b border-[#E5DDD0]">
              <tr>
                <th className="px-5 py-3">Fecha y hora</th>
                <th className="px-5 py-3">Responsable</th>
                <th className="px-5 py-3">Módulo</th>
                <th className="px-5 py-3">Detalle de la actividad</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleAudit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#5C6B73]">
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                visibleAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF7F2]/60">
                    <td className="px-5 py-3.5 whitespace-nowrap text-[#5C6B73]">
                      {formatLimaDateTime(a.occurredAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#12232E]">
                      {a.actor === 'system' ? 'Sistema automático' : a.actor}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#12232E]">
                      {a.entity}{' '}
                      <span className="text-[11px] text-[#5C6B73]">({a.entityId})</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[#1B5E4A]">{a.action}</span>
                      {a.summary && (
                        <span className="block text-[11px] text-[#5C6B73] mt-0.5">{a.summary}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={a.result} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-4">
          <PaginationControls
            page={auditPage}
            pageSize={12}
            total={auditTotal}
            hasNext={auditHasNext}
            onPageChange={setAuditPage}
          />
        </div>
      </div>
    </div>
  );
};

// Alias de compatibilidad
export const AdminCommercialPage = AdminHotelsPage;
export const AdminGovernancePage = AdminClientsPage;
