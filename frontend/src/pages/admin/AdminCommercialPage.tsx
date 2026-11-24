import React, { useEffect, useState } from 'react';
import {
  Bus,
  CalendarPlus,
  Hotel,
  ImagePlus,
  Package,
  Plus,
  Power,
  Tag,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatLimaDateTime } from '../../lib/format';
import type {
  CatalogAdminItemDto,
  CatalogApiType,
  HotelAdminItemDto,
  MobilityAdminItemDto,
} from '../../types/api';

type CommercialTab = 'catalog' | 'hotels' | 'mobility';

export const AdminCommercialPage: React.FC = () => {
  const { apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [tab, setTab] = useState<CommercialTab>('catalog');
  const [catalogType, setCatalogType] = useState<CatalogApiType>('tours');

  // Listados administrativos
  const [offers, setOffers] = useState<CatalogAdminItemDto[]>([]);
  const [hotels, setHotels] = useState<HotelAdminItemDto[]>([]);
  const [mobilityList, setMobilityList] = useState<MobilityAdminItemDto[]>([]);

  // Formulario Nueva Oferta (Spec 006)
  const [offerName, setOfferName] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerPrice, setOfferPrice] = useState('135.00');
  const [offerDays, setOfferDays] = useState(1);
  const [offerCondition, setOfferCondition] = useState('Sujeto a cupos verificados en servidor.');
  const [day1Title, setDay1Title] = useState('Jornada principal guiada');
  const [day1Desc, setDay1Desc] = useState('Salida programada, guiado oficial y retorno.');

  // Formulario Salida + Precios + Imagen R2 sobre oferta seleccionada
  const [targetOfferId, setTargetOfferId] = useState('');
  const [depStart, setDepStart] = useState('2026-12-26T07:00');
  const [depEnd, setDepEnd] = useState('2026-12-26T19:00');
  const [depPrice, setDepPrice] = useState('120.00');
  const [depCap, setDepCap] = useState(16);
  const [normalPrice, setNormalPrice] = useState('140.00');
  const [discountedPrice, setDiscountedPrice] = useState('119.00');

  // Formulario Hotel + Habitación + Inventario Nocturno + Propuesta (Spec 007)
  const [hotelName, setHotelName] = useState('');
  const [hotelDesc, setHotelDesc] = useState('');
  const [hotelServices, setHotelServices] = useState('Desayuno regional, Wi-Fi fibra óptica, Agua caliente 24h');
  const [targetHotelId, setTargetHotelId] = useState('');
  const [roomName, setRoomName] = useState('Suite Matrimonial Superior');
  const [roomCap, setRoomCap] = useState(2);
  const [roomPrice, setRoomPrice] = useState('240.00');
  const [targetRoomTypeId, setTargetRoomTypeId] = useState('');
  const [invDate, setInvDate] = useState('2026-12-18');
  const [invQty, setInvQty] = useState(8);
  const [propDepartureId, setPropDepartureId] = useState('');
  const [propCheckIn, setPropCheckIn] = useState('2026-12-18T15:00:00Z');
  const [propCheckOut, setPropCheckOut] = useState('2026-12-20T15:00:00Z');

  // Formulario Movilidad Informativa (Spec 013)
  const [mobName, setMobName] = useState('');
  const [mobType, setMobType] = useState('Minibús Turístico');
  const [mobCap, setMobCap] = useState(19);
  const [mobDesc, setMobDesc] = useState('');

  const loadData = async () => {
    if (apiOnline === false) {
      setOffers([
        {
          id: '00000000-0000-4000-8000-000000000101',
          type: catalogType === 'packages' ? 'package' : 'tour',
          name:
            catalogType === 'packages'
              ? 'Paquete Ayacucho Místico 3D/2N'
              : 'Aguas Turquesas de Millpu Full Day',
          status: 'active',
          version: 3,
          updatedAt: '2026-11-24T08:00:00Z',
        },
      ]);
      setHotels([
        {
          id: '00000000-0000-4000-8000-000000000301',
          name: 'Hotel Boutique Santa Rosa de Huamanga',
          status: 'active',
          version: 2,
          updatedAt: '2026-11-24T08:00:00Z',
        },
      ]);
      setMobilityList([
        {
          id: '00000000-0000-4000-8000-000000000401',
          name: 'Mercedes-Benz Sprinter VIP Panorámica',
          description: 'Oxígeno medicinal, asientos reclinables y GPS 24/7.',
          type: 'Minibús Turístico',
          capacity: 19,
          status: 'active',
          version: 1,
          updatedAt: '2026-11-24T08:00:00Z',
        },
      ]);
      return;
    }

    try {
      const [catRes, hotRes, mobRes] = await Promise.all([
        adminApi.listCatalog(catalogType, 1, 20),
        adminApi.listHotels(1, 20),
        adminApi.listMobility(1, 20),
      ]);
      setOffers(catRes.items);
      setHotels(hotRes.items);
      setMobilityList(mobRes.items);
      if (!targetOfferId && catRes.items[0]) setTargetOfferId(catRes.items[0].id);
      if (!targetHotelId && hotRes.items[0]) setTargetHotelId(hotRes.items[0].id);
    } catch (err) {
      notifyError(err, 'No se pudo cargar el catálogo administrativo');
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogType]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminApi.createOffer(catalogType, {
        name: offerName.trim(),
        description: offerDesc.trim(),
        price: offerPrice,
        durationDays: offerDays,
        conditions: [offerCondition.trim()],
        itinerary: [{ day: 1, title: day1Title.trim(), description: day1Desc.trim() }],
      });
      setTargetOfferId(created.id);
      setOfferName('');
      setOfferDesc('');
      notifySuccess(
        'Oferta creada en borrador inactivo',
        'Sube una imagen principal y programa salidas antes de activarla.'
      );
      await loadData();
    } catch (err) {
      notifyError(err, 'Error al crear la oferta');
    }
  };

  const handleToggleOfferStatus = async (item: CatalogAdminItemDto) => {
    try {
      if (item.status === 'active') {
        await adminApi.deactivateOffer(catalogType, item.id, item.version);
        notifySuccess('Oferta retirada del catálogo público', 'Reservas existentes conservadas.');
      } else {
        await adminApi.activateOffer(catalogType, item.id, item.version);
        notifySuccess('Oferta activada y publicada', `${item.name} ya es visible públicamente.`);
      }
      await loadData();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar el estado de la oferta');
    }
  };

  const handleCreateDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOfferId) return;
    try {
      const dep = await adminApi.createDeparture(catalogType, targetOfferId, {
        startDate: new Date(depStart).toISOString(),
        endDate: new Date(depEnd).toISOString(),
        price: depPrice,
        capacity: depCap,
      });
      setPropDepartureId(dep.id);
      notifySuccess('Salida programada', `ID de salida: ${dep.id.slice(0, 8)} (${depCap} cupos).`);
    } catch (err) {
      notifyError(err, 'No se pudo registrar la salida');
    }
  };

  const handleUpdateOfferPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = offers.find((o) => o.id === targetOfferId);
    if (!found) return;
    try {
      await adminApi.updateOfferPricing(
        catalogType,
        found.id,
        normalPrice,
        discountedPrice.trim() || null,
        found.version
      );
      notifySuccess('Precios actualizados', 'Las reservas históricas mantienen su snapshot.');
      await loadData();
    } catch (err) {
      notifyError(err, 'Error al actualizar precios');
    }
  };

  const handleUploadOfferImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetOfferId) return;
    if (file.size > 5 * 1024 * 1024) {
      notifyError(new Error('El archivo supera el límite máximo de 5 MB (Spec 012).'));
      return;
    }
    try {
      await adminApi.uploadOfferImage(catalogType, targetOfferId, file, true);
      notifySuccess('Imagen subida a almacenamiento R2', 'Asociada como foto principal.');
    } catch (err) {
      notifyError(err, 'No se pudo subir la imagen de la oferta');
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminApi.createHotel({
        name: hotelName.trim(),
        description: hotelDesc.trim(),
        services: hotelServices
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setTargetHotelId(created.id);
      setHotelName('');
      setHotelDesc('');
      notifySuccess('Hotel creado en borrador', 'Agrega tipo de habitación e imagen para activar.');
      await loadData();
    } catch (err) {
      notifyError(err, 'Error al registrar hotel');
    }
  };

  const handleToggleHotelStatus = async (h: HotelAdminItemDto) => {
    try {
      if (h.status === 'active') {
        await adminApi.deactivateHotel(h.id, h.version);
      } else {
        await adminApi.activateHotel(h.id, h.version);
      }
      notifySuccess('Estado de hotel actualizado', h.name);
      await loadData();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar estado del hotel');
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHotelId) return;
    try {
      const rt = await adminApi.createRoomType(targetHotelId, {
        name: roomName.trim(),
        capacity: roomCap,
        basePrice: roomPrice,
      });
      setTargetRoomTypeId(rt.id);
      notifySuccess('Tipo de habitación creado', `UUID: ${rt.id.slice(0, 8)} · S/ ${rt.basePrice}`);
    } catch (err) {
      notifyError(err, 'No se pudo crear el tipo de habitación');
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoomTypeId) return;
    try {
      await adminApi.updateRoomInventory(targetRoomTypeId.trim(), invDate, invQty);
      notifySuccess(
        'Inventario nocturno actualizado',
        `Fecha ${invDate}: ${invQty} habitaciones totales.`
      );
    } catch (err) {
      notifyError(err, 'Error al actualizar inventario por noche (DEC-025)');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propDepartureId || !targetHotelId) return;
    try {
      await adminApi.createLodgingProposal({
        departureId: propDepartureId.trim(),
        hotelId: targetHotelId,
        startDate: propCheckIn,
        endDate: propCheckOut,
      });
      notifySuccess(
        'Propuesta de alojamiento vinculada',
        'Todos los tipos activos del hotel quedaron disponibles para esa salida.'
      );
    } catch (err) {
      notifyError(err, 'No se pudo vincular la propuesta de alojamiento');
    }
  };

  const handleUploadHotelImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetHotelId) return;
    try {
      await adminApi.uploadHotelImage(targetHotelId, file, true);
      notifySuccess('Imagen de hotel validada', 'Subida como imagen principal.');
    } catch (err) {
      notifyError(err, 'No se pudo subir imagen del hotel');
    }
  };

  const handleCreateMobility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createMobility({
        name: mobName.trim(),
        type: mobType.trim(),
        capacity: mobCap,
        description: mobDesc.trim(),
      });
      setMobName('');
      setMobDesc('');
      notifySuccess('Unidad informativa creada', 'Sube su imagen principal para activarla.');
      await loadData();
    } catch (err) {
      notifyError(err, 'No se pudo registrar unidad de movilidad');
    }
  };

  const handleReplaceMobilityImage = async (id: string, file?: File) => {
    if (!file) return;
    try {
      await adminApi.replaceMobilityImage(id, file);
      notifySuccess('Imagen de movilidad actualizada', 'Lista para activación en landing.');
      await loadData();
    } catch (err) {
      notifyError(err, 'Error al reemplazar imagen de movilidad');
    }
  };

  const handleToggleMobility = async (m: MobilityAdminItemDto) => {
    try {
      if (m.status === 'active') {
        await adminApi.deactivateMobility(m.id, m.version);
      } else {
        await adminApi.activateMobility(m.id, m.version);
      }
      notifySuccess('Estado de movilidad actualizado', m.name);
      await loadData();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar estado de la unidad');
    }
  };

  return (
    <div className="space-y-7">
      {/* Conmutador Superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="inline-flex p-1 rounded-xl bg-slate-100">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'catalog' ? 'bg-[#0B3B5B] text-white' : 'text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Tours, Paquetes, Salidas &amp; R2
          </button>
          <button
            type="button"
            onClick={() => setTab('hotels')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'hotels' ? 'bg-[#0B3B5B] text-white' : 'text-slate-600'
            }`}
          >
            <Hotel className="w-3.5 h-3.5" />
            Hoteles, Inventario por Noche &amp; Propuestas
          </button>
          <button
            type="button"
            onClick={() => setTab('mobility')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'mobility' ? 'bg-[#0B3B5B] text-white' : 'text-slate-600'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            Flota y Movilidad Informativa
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Multimedia validada: <strong>JPG / PNG / WebP ≤ 5 MB</strong>
        </span>
      </div>

      {/* ================= TAB 1: CATÁLOGO, SALIDAS Y MULTIMEDIA R2 ================= */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg text-slate-900">
                Ofertas Registradas ({catalogType === 'tours' ? 'Tours' : 'Paquetes'})
              </h2>
              <div className="inline-flex p-1 rounded-lg bg-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setCatalogType('tours')}
                  className={`px-3 py-1 rounded font-bold cursor-pointer ${
                    catalogType === 'tours' ? 'bg-white shadow-2xs text-[#0B3B5B]' : 'text-slate-500'
                  }`}
                >
                  Tours
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogType('packages')}
                  className={`px-3 py-1 rounded font-bold cursor-pointer ${
                    catalogType === 'packages'
                      ? 'bg-white shadow-2xs text-[#0B3B5B]'
                      : 'text-slate-500'
                  }`}
                >
                  Paquetes
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {offers.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setTargetOfferId(o.id)}
                  className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${
                    targetOfferId === o.id
                      ? 'border-[#0B3B5B] bg-sky-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900">{o.name}</p>
                      <StatusBadge status={o.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ID: {o.id.slice(0, 8)} · ETag v{o.version} · {formatLimaDateTime(o.updatedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleOfferStatus(o);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    {o.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>

            {/* Crear Nueva Oferta */}
            <form onSubmit={handleCreateOffer} className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-headline font-bold text-sm text-[#0B3B5B] inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#D95D39]" />
                Crear Nueva Oferta en Catálogo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="Nombre único de la oferta"
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="S/ Base"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                  <input
                    type="number"
                    min={1}
                    required
                    value={offerDays}
                    onChange={(e) => setOfferDays(Number(e.target.value))}
                    placeholder="Días"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
              </div>
              <textarea
                required
                rows={2}
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                placeholder="Descripción detallada del servicio turístico..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={day1Title}
                  onChange={(e) => setDay1Title(e.target.value)}
                  placeholder="Título Día 1"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  required
                  value={offerCondition}
                  onChange={(e) => setOfferCondition(e.target.value)}
                  placeholder="Condición comercial"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <input
                type="text"
                required
                value={day1Desc}
                onChange={(e) => setDay1Desc(e.target.value)}
                placeholder="Actividades Día 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
              >
                Guardar Borrador de Oferta
              </button>
            </form>
          </div>

          {/* Panel Derecho: Operaciones sobre la Oferta Seleccionada */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-headline font-bold text-sm text-slate-900 inline-flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-[#D95D39]" />
                Programar Salida (TourDeparture) y Multimedia R2
              </h3>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                Oferta seleccionada: {targetOfferId || 'Selecciona una oferta de la lista'}
              </p>

              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0B3B5B] bg-slate-50 text-xs font-bold text-[#0B3B5B] cursor-pointer">
                <ImagePlus className="w-4 h-4 text-[#D95D39]" />
                Subir Imagen Principal Validada (JPG/PNG/WebP ≤ 5 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => void handleUploadOfferImage(e)}
                  className="hidden"
                />
              </label>

              <form onSubmit={handleCreateDeparture} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Inicio salida
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={depStart}
                      onChange={(e) => setDepStart(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Fin salida
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={depEnd}
                      onChange={(e) => setDepEnd(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={depPrice}
                    onChange={(e) => setDepPrice(e.target.value)}
                    placeholder="Tarifa PEN de salida"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                  <input
                    type="number"
                    min={1}
                    required
                    value={depCap}
                    onChange={(e) => setDepCap(Number(e.target.value))}
                    placeholder="Capacidad cupos"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#D95D39] text-white text-xs font-bold cursor-pointer"
                >
                  Agregar Salida Programada
                </button>
              </form>
            </div>

            <form
              onSubmit={handleUpdateOfferPricing}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs"
            >
              <h3 className="font-headline font-bold text-sm text-slate-900 inline-flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#146C53]" />
                Actualizar Precio Normal y Rebajado (PEN)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={normalPrice}
                  onChange={(e) => setNormalPrice(e.target.value)}
                  placeholder="Precio Normal S/"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
                <input
                  type="text"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  placeholder="Rebajado S/ (opcional)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
              >
                Actualizar Precios con If-Match
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 2: HOTELES, INVENTARIO NOCTURNO Y PROPUESTAS ================= */}
      {tab === 'hotels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <h2 className="font-headline font-bold text-lg text-slate-900">
              Hoteles Aliados Registrados
            </h2>
            <div className="space-y-2.5">
              {hotels.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setTargetHotelId(h.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${
                    targetHotelId === h.id ? 'border-[#0B3B5B] bg-sky-50/40' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900">{h.name}</p>
                      <StatusBadge status={h.status} size="sm" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      ID: {h.id.slice(0, 8)} · ETag v{h.version}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleHotelStatus(h);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold cursor-pointer"
                  >
                    {h.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateHotel} className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-headline font-bold text-sm text-[#0B3B5B]">
                Registrar Nuevo Hotel Aliado
              </h3>
              <input
                type="text"
                required
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Nombre del hotel"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <textarea
                required
                rows={2}
                value={hotelDesc}
                onChange={(e) => setHotelDesc(e.target.value)}
                placeholder="Descripción del hotel..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                required
                value={hotelServices}
                onChange={(e) => setHotelServices(e.target.value)}
                placeholder="Servicios separados por coma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
              >
                Crear Hotel
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-headline font-bold text-sm text-slate-900">
                Imagen Principal y Tipos de Habitación del Hotel Seleccionado
              </h3>
              <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-[#0B3B5B] cursor-pointer">
                <ImagePlus className="w-4 h-4 text-[#D95D39]" />
                Subir Foto Principal del Hotel a R2
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => void handleUploadHotelImage(e)}
                  className="hidden"
                />
              </label>

              <form onSubmit={handleCreateRoomType} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Nombre tipo"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  required
                  value={roomCap}
                  onChange={(e) => setRoomCap(Number(e.target.value))}
                  placeholder="Capacidad"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
                <input
                  type="text"
                  required
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  placeholder="Tarifa S/"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
                <button
                  type="submit"
                  className="col-span-3 py-2.5 rounded-xl bg-[#146C53] text-white text-xs font-bold cursor-pointer"
                >
                  Agregar Tipo de Habitación (Tarifa Única 24h)
                </button>
              </form>
            </div>

            <form
              onSubmit={handleUpdateInventory}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs"
            >
              <h3 className="font-headline font-bold text-sm text-slate-900">
                Matriz de Inventario por Noche (RoomInventoryNight · DEC-025)
              </h3>
              <p className="text-[11px] text-slate-500">
                El backend impide reducir la cantidad total por debajo de las habitaciones ya
                comprometidas en esa noche.
              </p>
              <input
                type="text"
                required
                value={targetRoomTypeId}
                onChange={(e) => setTargetRoomTypeId(e.target.value)}
                placeholder="UUID del Tipo de Habitación"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  required
                  value={invQty}
                  onChange={(e) => setInvQty(Number(e.target.value))}
                  placeholder="Cantidad hab."
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
              >
                Actualizar Inventario Nocturno
              </button>
            </form>

            <form
              onSubmit={handleCreateProposal}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs"
            >
              <h3 className="font-headline font-bold text-sm text-slate-900">
                Vincular Propuesta de Alojamiento a Salida (LodgingProposal)
              </h3>
              <input
                type="text"
                required
                value={propDepartureId}
                onChange={(e) => setPropDepartureId(e.target.value)}
                placeholder="UUID de la Salida Turística (DepartureId)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={propCheckIn}
                  onChange={(e) => setPropCheckIn(e.target.value)}
                  placeholder="Check-in ISO"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  type="text"
                  required
                  value={propCheckOut}
                  onChange={(e) => setPropCheckOut(e.target.value)}
                  placeholder="Check-out ISO"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#D95D39] text-white text-xs font-bold cursor-pointer"
              >
                Crear Propuesta Hotelera para Salida
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MOVILIDAD INFORMATIVA (SPEC 013) ================= */}
      {tab === 'mobility' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="font-headline font-bold text-lg text-slate-900">
              Unidades de Movilidad Informativa (/api/v1/admin/mobility)
            </h2>
            <div className="space-y-3">
              {mobilityList.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{m.name}</span>
                      <StatusBadge status={m.status} size="sm" />
                    </div>
                    <p className="text-slate-600">
                      {m.type} · Capacidad: <strong>{m.capacity} pasajeros</strong>
                    </p>
                    <p className="text-slate-500">{m.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer">
                      Imagen R2
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => void handleReplaceMobilityImage(m.id, e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleToggleMobility(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#0B3B5B] text-white font-bold cursor-pointer"
                    >
                      {m.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateMobility}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-3.5 shadow-xs"
          >
            <h3 className="font-headline font-bold text-base text-slate-900">
              Registrar Nueva Categoría de Movilidad
            </h3>
            <p className="text-xs text-slate-500">
              Estrictamente informativa (sin tarifas ni reserva independiente · Spec 013).
            </p>
            <input
              type="text"
              required
              value={mobName}
              onChange={(e) => setMobName(e.target.value)}
              placeholder="Ej. Mercedes-Benz Sprinter VIP"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={mobType}
                onChange={(e) => setMobType(e.target.value)}
                placeholder="Tipo de unidad"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="number"
                min={1}
                required
                value={mobCap}
                onChange={(e) => setMobCap(Number(e.target.value))}
                placeholder="Capacidad pasajeros"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
              />
            </div>
            <textarea
              required
              rows={3}
              value={mobDesc}
              onChange={(e) => setMobDesc(e.target.value)}
              placeholder="Equipamiento y características de seguridad..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#D95D39] text-white text-xs font-bold cursor-pointer"
            >
              Crear Registro de Movilidad
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
