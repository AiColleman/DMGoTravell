import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Bus,
  CalendarPlus,
  Clock,
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
  mergeWithOfficialDmGoAdminHotels,
  SHOWCASE_HOTELS_DETAIL,
  SHOWCASE_MOBILITY,
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

const DEMO_CATALOG_ADMIN: CatalogAdminItemDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000105',
    type: 'package',
    name: 'Cusco Imperial, Valle Sagrado & Machu Picchu 4D/3N',
    status: 'active',
    version: 3,
    updatedAt: '2026-11-24T12:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000101',
    type: 'tour',
    name: 'Huamanga Virreinal, Talleres de Piedra & Ruta Wari',
    status: 'active',
    version: 2,
    updatedAt: '2026-11-23T16:30:00Z',
  },
];

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

type MediaTargetKind = 'hotel' | 'room-type' | 'offer' | 'mobility';

export const AdminCommercialPage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [catalogType, setCatalogType] = useState<CatalogApiType>('tours');
  const [offers, setOffers] = useState<CatalogAdminItemDto[]>(DEMO_CATALOG_ADMIN);
  const [hotels, setHotels] = useState<HotelAdminItemDto[]>(DEMO_HOTELS_ADMIN);
  const [mobility, setMobility] = useState<MobilityAdminItemDto[]>(DEMO_MOBILITY_ADMIN);

  // Detalle activo del hotel seleccionado para gestionar sus habitaciones e imágenes
  const [selectedAdminHotelId, setSelectedAdminHotelId] = useState<string>(
    SHOWCASE_HOTELS_DETAIL[0]?.id ?? ''
  );
  const [selectedHotelDetail, setSelectedHotelDetail] = useState<HotelPublicDetailDto | null>(
    SHOWCASE_HOTELS_DETAIL[0] ?? null
  );

  // Creación rápida de oferta (nace desactivada · Spec 006)
  const [offerName, setOfferName] = useState('');
  const [offerPrice, setOfferPrice] = useState('240.00');
  const [offerDays, setOfferDays] = useState(1);
  const [offerDesc, setOfferDesc] = useState('');

  // Creación de salida programada (Spec 006) y propuesta de alojamiento 24h (Spec 007 RF-34 / Spec 001 RF-81)
  const [depOfferId, setDepOfferId] = useState(DEMO_CATALOG_ADMIN[1]?.id ?? '');
  const [depStartIso, setDepStartIso] = useState('2026-12-20T08:00');
  const [depEndIso, setDepEndIso] = useState('2026-12-21T18:00');
  const [depPrice, setDepPrice] = useState('240.00');
  const [depCapacity, setDepCapacity] = useState(16);

  const [propDepartureId, setPropDepartureId] = useState('00000000-0000-4000-8000-000000000208');
  const [propCheckInDate, setPropCheckInDate] = useState('2026-12-20');
  const [propNights, setPropNights] = useState(2);

  // Creación rápida de hotel (nace inactivo según Spec 007 RF-13)
  const [hotelName, setHotelName] = useState('');
  const [hotelDesc, setHotelDesc] = useState('');
  const [hotelServices, setHotelServices] = useState(
    'Desayuno americano - continental (7:00 am - 9:00 am), Wifi fibra óptica, Baño privado y agua caliente, TV Smart 50", Escritorio y ropero'
  );

  // Creación rápida de RoomType e Inventario nocturno
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(2);
  const [newRoomPrice, setNewRoomPrice] = useState('120.00');

  const [invRoomTypeId, setInvRoomTypeId] = useState(
    SHOWCASE_HOTELS_DETAIL[0]?.roomTypes[0]?.id ?? ''
  );
  const [invDate, setInvDate] = useState('2026-12-18');
  const [invQty, setInvQty] = useState(6);

  // Movilidad informativa (Spec 013 — nace desactivada, requiere foto para activar)
  const [mobName, setMobName] = useState('');
  const [mobType, setMobType] = useState('van');
  const [mobCapacity, setMobCapacity] = useState(12);
  const [mobDesc, setMobDesc] = useState('');

  // Carga y reemplazo de fotografías originales (Spec 007 RF-45..50, RF-55, Spec 012 & Spec 013)
  const [mediaKind, setMediaKind] = useState<MediaTargetKind>('hotel');
  const [mediaOfferId, setMediaOfferId] = useState('');
  const [mediaMobilityId, setMediaMobilityId] = useState(DEMO_MOBILITY_ADMIN[0]?.id ?? '');
  const [mediaRoomTypeId, setMediaRoomTypeId] = useState(
    SHOWCASE_HOTELS_DETAIL[0]?.roomTypes[0]?.id ?? ''
  );
  const [mediaReplaceImageId, setMediaReplaceImageId] = useState('');
  const [mediaIsPrimary, setMediaIsPrimary] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadCommercial = async () => {
    if (apiOnline === false || isDemoSession) return;
    try {
      const [cRes, hRes, mRes] = await Promise.all([
        adminApi.listCatalog(catalogType, 1, 20),
        adminApi.listHotels(1, 50),
        adminApi.listMobility(1, 20),
      ]);
      const mergedAdminHotels = mergeWithOfficialDmGoAdminHotels(hRes.items);
      setOffers(cRes.items);
      setHotels(mergedAdminHotels);
      setMobility(mRes.items);
      if (cRes.items[0] && !depOfferId) {
        setDepOfferId(cRes.items[0].id);
      }
      if (mRes.items[0] && !mediaMobilityId) {
        setMediaMobilityId(mRes.items[0].id);
      }
      if (
        mergedAdminHotels.length > 0 &&
        !mergedAdminHotels.some((h) => h.id === selectedAdminHotelId)
      ) {
        setSelectedAdminHotelId(mergedAdminHotels[0]!.id);
      }
    } catch {
      // Mantiene datos de respaldo
    }
  };

  useEffect(() => {
    void loadCommercial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogType, apiOnline, isDemoSession]);

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
            setMediaRoomTypeId(localFound.roomTypes[0].id);
          }
          setMediaReplaceImageId('');
        }
        return;
      }

      try {
        const detail = await hotelsApi.getPublicDetail(selectedAdminHotelId);
        if (!active) return;
        setSelectedHotelDetail(detail);
        if (detail.roomTypes[0]) {
          setInvRoomTypeId(detail.roomTypes[0].id);
          setMediaRoomTypeId(detail.roomTypes[0].id);
        }
        setMediaReplaceImageId('');
      } catch {
        if (active) {
          setSelectedHotelDetail(
            SHOWCASE_HOTELS_DETAIL.find((h) => h.id === selectedAdminHotelId) ?? null
          );
          setMediaReplaceImageId('');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedAdminHotelId, apiOnline, isDemoSession]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      setOffers((prev) => [
        {
          id: `cat-${Date.now()}`,
          type: catalogType === 'packages' ? 'package' : 'tour',
          name: offerName,
          status: 'inactive',
          version: 1,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setOfferName('');
      setOfferDesc('');
      notifySuccess('Oferta creada desactivada en sesión vista previa (Spec 006)');
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
        conditions: ['Disponibilidad validada transaccionalmente en servidor.'],
        itinerary: itineraryItems,
      });
      setOfferName('');
      setOfferDesc('');
      setDepOfferId(created.id);
      notifySuccess('Oferta creada en estado inactivo (agrega salida e imagen para activar)');
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'No se pudo crear la oferta');
    }
  };

  const handleCreateDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    const startUtc = new Date(depStartIso).toISOString();
    const endUtc = new Date(depEndIso).toISOString();
    if (endUtc <= startUtc) {
      notifyError(
        new Error('La fecha/hora de término debe ser posterior a la fecha/hora de inicio.'),
        'Rango de salida inválido'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const fakeId = `dep-${Date.now().toString().slice(-5)}`;
      setPropDepartureId(fakeId);
      notifySuccess(`Salida programada creada (${fakeId}) en vista previa`);
      return;
    }

    try {
      const created = await adminApi.createDeparture(catalogType, depOfferId.trim(), {
        startDate: startUtc,
        endDate: endUtc,
        price: depPrice.trim(),
        capacity: depCapacity,
      });
      setPropDepartureId(created.id);
      notifySuccess('Salida programada creada', `ID: ${created.id}`);
    } catch (err) {
      notifyError(err, 'No se pudo crear la salida programada');
    }
  };

  const handleCreateLodgingProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminHotelId || !propDepartureId.trim() || propNights < 1) return;

    // Spec 001 RF-81 & Spec 007 RF-34: período estricto en múltiplos positivos de 24 horas completas
    const startUtcDate = new Date(`${propCheckInDate}T15:00:00Z`);
    const endUtcDate = new Date(startUtcDate.getTime() + propNights * 86_400_000);

    if (apiOnline === false || isDemoSession) {
      notifySuccess(
        `Propuesta de alojamiento vinculada (${propNights} períodos de 24 h · Spec 007 RF-34)`
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
      notifySuccess(
        'LodgingProposal vinculada a la salida',
        `Estancia de ${propNights} noche(s) (múltiplo exacto de 24 h · RF-81)`
      );
    } catch (err) {
      notifyError(err, 'No se pudo vincular la propuesta de alojamiento');
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
      notifySuccess(`Estado cambiado a ${nextStatus}`);
      return;
    }
    try {
      if (item.status === 'active') {
        await adminApi.deactivateOffer(catalogType, item.id, item.version);
      } else {
        await adminApi.activateOffer(catalogType, item.id, item.version);
      }
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'Error al actualizar estado de oferta');
    }
  };

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
      notifySuccess('Hotel registrado desactivado en vista previa (Spec 007 · RF-13)');
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
      notifySuccess('Hotel creado desactivado (agrega habitación e imagen para activar)');
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'No se pudo crear el hotel');
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
      notifySuccess(`Hotel ${item.name}: estado actualizado a ${nextStatus}`);
      return;
    }

    try {
      if (item.status === 'active') {
        await adminApi.deactivateHotel(item.id, item.version);
      } else {
        await adminApi.activateHotel(item.id, item.version);
      }
      notifySuccess(`Hotel ${item.name} actualizado`);
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar el estado del hotel');
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminHotelId) return;

    if (apiOnline === false || isDemoSession) {
      notifySuccess(
        `Tipo "${newRoomName}" (${formatPen(newRoomPrice)}) registrado en vista previa`
      );
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
      notifySuccess(`Tipo de habitación "${created.name}" creado en PEN`);
      const detail = await hotelsApi.getPublicDetail(selectedAdminHotelId).catch(() => null);
      if (detail) setSelectedHotelDetail(detail);
    } catch (err) {
      notifyError(err, 'No se pudo crear el tipo de habitación');
    }
  };

  const handleSaveNightlyInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      notifySuccess(`Inventario nocturno (${invDate}: ${invQty} hab.) actualizado en vista previa`);
      return;
    }
    try {
      await adminApi.updateRoomInventory(invRoomTypeId.trim(), invDate, invQty);
      notifySuccess('RoomInventoryNight actualizado (respeta retenciones vigentes · RF-83)');
    } catch (err) {
      notifyError(
        err,
        'No se pudo reducir o actualizar inventario (verifica habitaciones comprometidas · RF-83)'
      );
    }
  };

  const handleCreateMobility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiOnline === false || isDemoSession) {
      const createdMob: MobilityAdminItemDto = {
        id: `mob-${Date.now()}`,
        name: mobName.trim(),
        description: mobDesc.trim() || 'Servicio informativo de movilidad turística.',
        type: mobType.trim(),
        capacity: mobCapacity,
        status: 'inactive',
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      setMobility((prev) => [createdMob, ...prev]);
      setMediaMobilityId(createdMob.id);
      setMobName('');
      setMobDesc('');
      notifySuccess('Movilidad registrada desactivada en vista previa (Spec 013)');
      return;
    }

    try {
      const created = await adminApi.createMobility({
        name: mobName.trim(),
        description: mobDesc.trim() || 'Servicio informativo de movilidad turística.',
        type: mobType.trim(),
        capacity: mobCapacity,
      });
      setMediaMobilityId(created.id);
      setMobName('');
      setMobDesc('');
      notifySuccess('Movilidad creada desactivada (carga su foto para activar · Spec 013)');
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'No se pudo registrar la unidad de movilidad');
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
      notifySuccess(`Movilidad ${item.name}: ${nextStatus}`);
      return;
    }

    try {
      if (item.status === 'active') {
        await adminApi.deactivateMobility(item.id, item.version);
      } else {
        await adminApi.activateMobility(item.id, item.version);
      }
      notifySuccess(`Movilidad ${item.name} actualizada`);
      await loadCommercial();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar estado de movilidad (verifica imagen asociada)');
    }
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Spec 007 RF-46 & RF-47 / Spec 012: solo JPG/PNG/WebP y hasta 5,000,000 bytes (5 MB)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(selectedFile.type)) {
      notifyError(
        new Error(
          'Formato no admitido. Solo se permiten archivos JPG, PNG o WebP (Spec 007 · RF-46).'
        ),
        'No se pudo cargar la imagen'
      );
      return;
    }

    if (selectedFile.size > 5_000_000) {
      notifyError(
        new Error('El archivo supera el límite máximo permitido de 5 MB (Spec 007 · RF-47).'),
        'No se pudo cargar la imagen'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      notifySuccess(
        `Fotografía original "${selectedFile.name}" validada (≤ 5 MB) para reemplazo en vista previa`
      );
      setSelectedFile(null);
      return;
    }

    try {
      if (mediaKind === 'hotel') {
        if (!selectedAdminHotelId) throw new Error('Selecciona un hotel aliado.');
        if (mediaReplaceImageId.trim()) {
          await adminApi.replaceHotelImage(
            selectedAdminHotelId,
            mediaReplaceImageId.trim(),
            selectedFile,
            mediaIsPrimary
          );
          notifySuccess('Fotografía del hotel reemplazada exitosamente');
        } else {
          await adminApi.uploadHotelImage(selectedAdminHotelId, selectedFile, mediaIsPrimary);
          notifySuccess('Fotografía original agregada al hotel aliado');
        }
        const refreshed = await hotelsApi
          .getPublicDetail(selectedAdminHotelId)
          .catch(() => null);
        if (refreshed) setSelectedHotelDetail(refreshed);
      } else if (mediaKind === 'room-type') {
        if (!selectedAdminHotelId || !mediaRoomTypeId.trim()) {
          throw new Error('Selecciona el hotel y el tipo de habitación.');
        }
        if (mediaReplaceImageId.trim()) {
          await adminApi.replaceRoomTypeImage(
            selectedAdminHotelId,
            mediaRoomTypeId.trim(),
            mediaReplaceImageId.trim(),
            selectedFile,
            mediaIsPrimary
          );
          notifySuccess('Fotografía del tipo de habitación reemplazada');
        } else {
          await adminApi.uploadRoomTypeImage(
            selectedAdminHotelId,
            mediaRoomTypeId.trim(),
            selectedFile,
            mediaIsPrimary
          );
          notifySuccess('Fotografía agregada al tipo de habitación');
        }
      } else if (mediaKind === 'mobility') {
        await adminApi.replaceMobilityImage(mediaMobilityId.trim(), selectedFile);
        notifySuccess('Fotografía de movilidad cargada/reemplazada (Spec 013)');
      } else {
        await adminApi.uploadOfferImage(
          catalogType,
          mediaOfferId.trim(),
          selectedFile,
          mediaIsPrimary
        );
        notifySuccess('Imagen cargada a la oferta turística');
      }

      setSelectedFile(null);
      setMediaReplaceImageId('');
    } catch (err) {
      // Spec 007 RF-49 & RF-50: mostrar «No se pudo cargar la imagen» y conservar las anteriores
      notifyError(err, 'No se pudo cargar la imagen');
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#E5DDD0]">
        <SectionEyebrow>Administración Comercial · Specs 006, 007, 012 &amp; 013</SectionEyebrow>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E] mt-1">
          Catálogo, Hoteles DM GO TRAVEL, Propuestas 24 h, Movilidad &amp; Fotos
        </h1>
      </div>

      {/* ================= SECCIÓN 1: HOTELES REALES DM GO TRAVEL & FOTOS ORIGINALES ================= */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Directorio Administrativo de los 9+ Hoteles Aliados */}
          <div className="lg:col-span-7 hairline-card rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5DDD0]">
              <div>
                <h2 className="font-editorial text-2xl text-[#12232E]">
                  Catálogo de Hoteles Aliados ({hotels.length})
                </h2>
                <p className="text-xs text-[#5C6B73]">
                  Selecciona un hotel para gestionar sus habitaciones, cupos nocturnos, propuestas o
                  reemplazar sus fotos ficticias por las originales.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#E5DDD0] max-h-[420px] overflow-y-auto pr-1">
              {hotels.map((h) => {
                const isSelected = h.id === selectedAdminHotelId;
                return (
                  <div
                    key={h.id}
                    className={`py-3 px-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                      isSelected ? 'bg-[#F3EDE2]/75' : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAdminHotelId(h.id)}
                      className="text-left cursor-pointer"
                    >
                      <p className="font-bold text-[#12232E]">{h.name}</p>
                      <p className="font-mono text-[10px] text-[#5C6B73]">
                        UUID: {h.id} · ETag v{h.version}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <StatusPill status={h.status} size="sm" />
                      <Link
                        to={`/hoteles/${h.id}`}
                        className="p-1.5 rounded-lg border border-[#E5DDD0] bg-[#FFFCF8] text-[#5C6B73] hover:text-[#12232E]"
                        title="Ver ficha pública"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleToggleHotel(h)}
                        className="px-3 py-1.5 rounded-lg border border-[#D2C6B4] bg-[#FFFCF8] text-[11px] font-bold text-[#12232E] cursor-pointer"
                      >
                        {h.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alta de Nuevo Hotel Aliado (Spec 007 RF-13 & RF-58) */}
          <form
            onSubmit={handleCreateHotel}
            className="lg:col-span-5 hairline-card rounded-2xl p-6 space-y-3.5"
          >
            <h3 className="font-editorial text-2xl text-[#12232E] inline-flex items-center gap-2">
              <Hotel className="w-5 h-5 text-[#1B5E4A]" />
              Registrar Nuevo Hotel
            </h3>
            <p className="text-[11px] text-[#5C6B73]">
              Todo hotel se crea en estado <strong>Inactivo</strong> y se habilita tras contar con
              servicio, foto y al menos un tipo de habitación válido (Spec 007 · RF-13 &amp; RF-14).
            </p>
            <input
              type="text"
              required
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Nombre oficial del hotel o casona"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <textarea
              rows={2}
              value={hotelDesc}
              onChange={(e) => setHotelDesc(e.target.value)}
              placeholder="Categoría, dirección en Ayacucho y horarios Check-in / Check-out..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <textarea
              rows={2}
              value={hotelServices}
              onChange={(e) => setHotelServices(e.target.value)}
              placeholder="Servicios libres separados por coma (RF-58)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1B5E4A] hover:bg-[#154A3A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Guardar Hotel en Borrador
            </button>
          </form>
        </div>

        {/* Sub-paneles para el Hotel Seleccionado: Habitaciones, Cupo Nocturno, Propuesta 24h y Fotos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Crear Tipo de Habitación */}
          <form
            onSubmit={handleCreateRoomType}
            className="hairline-card rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-[#B84A27]" />
              Tipo de Habitación
            </h3>
            <p className="text-[11px] text-[#5C6B73] truncate">
              Hotel: <strong className="text-[#12232E]">{selectedHotelDetail?.name ?? '—'}</strong>
            </p>
            <input
              type="text"
              required
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Ej. Hab. Matrimonial Queen"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                required
                value={newRoomCapacity}
                onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                placeholder="Capacidad"
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <input
                type="text"
                required
                value={newRoomPrice}
                onChange={(e) => setNewRoomPrice(e.target.value)}
                placeholder="Tarifa S/ (120.00)"
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
            >
              Crear Tipo (PEN)
            </button>
          </form>

          {/* 2. Inventario por Noche */}
          <form
            onSubmit={handleSaveNightlyInventory}
            className="hairline-card rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
              Inventario por Noche (RF-83)
            </h3>
            {selectedHotelDetail && selectedHotelDetail.roomTypes.length > 0 ? (
              <select
                value={invRoomTypeId}
                onChange={(e) => setInvRoomTypeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
              >
                {selectedHotelDetail.roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatPen(rt.basePrice)} · Cap. {rt.capacity})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={invRoomTypeId}
                onChange={(e) => setInvRoomTypeId(e.target.value)}
                placeholder="UUID de RoomType"
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <input
                type="number"
                min={0}
                required
                value={invQty}
                onChange={(e) => setInvQty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
            >
              Actualizar Cupo Nocturno
            </button>
          </form>

          {/* 3. Propuesta de Alojamiento por Salida (Spec 007 RF-34 / Spec 001 RF-81) */}
          <form
            onSubmit={handleCreateLodgingProposal}
            className="hairline-card rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#1B5E4A]" />
              Propuesta 24 h por Salida
            </h3>
            <input
              type="text"
              required
              value={propDepartureId}
              onChange={(e) => setPropDepartureId(e.target.value)}
              placeholder="UUID de Salida (DepartureId)"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={propCheckInDate}
                onChange={(e) => setPropCheckInDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <input
                type="number"
                min={1}
                max={30}
                required
                value={propNights}
                onChange={(e) => setPropNights(Number(e.target.value))}
                title="Cantidad de períodos completos de 24 horas"
                className="w-full px-2.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1B5E4A] text-white text-xs font-bold cursor-pointer"
            >
              Vincular Propuesta ({propNights} × 24h)
            </button>
          </form>

          {/* 4. Subir / Reemplazar Imágenes Ficticias por Fotografías Originales (Spec 007, 012 & 013) */}
          <form onSubmit={handleUploadMedia} className="hairline-card rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-[#B84A27]" />
              Fotos Originales (≤ 5 MB)
            </h3>

            <select
              aria-label="Destino de imagen"
              value={mediaKind}
              onChange={(e) => {
                setMediaKind(e.target.value as MediaTargetKind);
                setMediaReplaceImageId('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-semibold text-[#12232E]"
            >
              <option value="hotel">Hotel ({selectedHotelDetail?.name ?? 'Actual'})</option>
              <option value="room-type">Habitación del Hotel</option>
              <option value="offer">Oferta Turística</option>
              <option value="mobility">Unidad de Movilidad</option>
            </select>

            {mediaKind === 'hotel' && selectedHotelDetail && selectedHotelDetail.images.length > 0 && (
              <select
                value={mediaReplaceImageId}
                onChange={(e) => setMediaReplaceImageId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs text-[#12232E]"
              >
                <option value="">+ Agregar nueva foto a galería</option>
                {selectedHotelDetail.images.map((img, i) => (
                  <option key={img.id} value={img.id}>
                    Reemplazar {img.isPrimary ? 'Principal' : `Galería #${i + 1}`} (v{img.version})
                  </option>
                ))}
              </select>
            )}

            {mediaKind === 'room-type' && selectedHotelDetail && (
              <select
                value={mediaRoomTypeId}
                onChange={(e) => setMediaRoomTypeId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs text-[#12232E]"
              >
                {selectedHotelDetail.roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.images.length > 0 ? `${rt.images.length} foto` : 'Sin foto'})
                  </option>
                ))}
              </select>
            )}

            {mediaKind === 'offer' && (
              <input
                type="text"
                required
                value={mediaOfferId}
                onChange={(e) => setMediaOfferId(e.target.value)}
                placeholder="UUID de Oferta destino"
                className="w-full px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
              />
            )}

            {mediaKind === 'mobility' && (
              <select
                value={mediaMobilityId}
                onChange={(e) => setMediaMobilityId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs text-[#12232E]"
              >
                {mobility.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {mediaKind !== 'mobility' && (
              <label className="inline-flex items-center gap-2 text-[11px] font-medium text-[#5C6B73] cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaIsPrimary}
                  onChange={(e) => setMediaIsPrimary(e.target.checked)}
                  className="accent-[#B84A27]"
                />
                Designar como principal
              </label>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs"
            />

            <button
              type="submit"
              disabled={!selectedFile}
              className="w-full py-2 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-40 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {mediaReplaceImageId ? 'Reemplazar Foto' : 'Subir Fotografía'}
            </button>
          </form>
        </div>
      </section>

      {/* ================= SECCIÓN 2: CATÁLOGO DE TOURS, PAQUETES & SALIDAS (SPEC 006) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleCreateOffer} className="hairline-card rounded-2xl p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-2xl text-[#12232E]">Crear Oferta (Spec 006)</h2>
              <select
                value={catalogType}
                onChange={(e) => setCatalogType(e.target.value as CatalogApiType)}
                className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-bold"
              >
                <option value="tours">Tours</option>
                <option value="packages">Paquetes</option>
              </select>
            </div>

            <input
              type="text"
              required
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              placeholder="Título editorial de la experiencia"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Precio PEN (ej. 240.00)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
              />
              <input
                type="number"
                min={1}
                required
                value={offerDays}
                onChange={(e) => setOfferDays(Number(e.target.value))}
                placeholder="Días"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>

            <textarea
              rows={2}
              value={offerDesc}
              onChange={(e) => setOfferDesc(e.target.value)}
              placeholder="Descripción curada del recorrido..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crear Oferta Desactivada
            </button>
          </form>

          <form
            onSubmit={handleCreateDeparture}
            className="hairline-card rounded-2xl p-6 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-[#B84A27]" />
              Programar Salida con Cupos (Departure)
            </h3>
            <select
              value={depOfferId}
              onChange={(e) => setDepOfferId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            >
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                required
                value={depStartIso}
                onChange={(e) => setDepStartIso(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <input
                type="datetime-local"
                required
                value={depEndIso}
                onChange={(e) => setDepEndIso(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={depPrice}
                onChange={(e) => setDepPrice(e.target.value)}
                placeholder="Precio PEN"
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
              />
              <input
                type="number"
                min={1}
                required
                value={depCapacity}
                onChange={(e) => setDepCapacity(Number(e.target.value))}
                placeholder="Cupos"
                className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
            >
              Crear Salida Programada
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 hairline-card rounded-2xl p-6 space-y-4">
          <h2 className="font-editorial text-2xl text-[#12232E]">
            Ofertas Administrables ({offers.length})
          </h2>
          <div className="divide-y divide-[#E5DDD0]">
            {offers.map((o) => (
              <div
                key={o.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#12232E]">{o.name}</p>
                  <p className="font-mono text-[10px] text-[#5C6B73]">
                    ID: {o.id} · ETag v{o.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={o.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => void handleToggleOffer(o)}
                    className="px-3 py-1.5 rounded-lg border border-[#D2C6B4] text-[11px] font-bold cursor-pointer"
                  >
                    {o.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SECCIÓN 3: MOVILIDAD INFORMATIVA (SPEC 013) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreateMobility}
          className="lg:col-span-5 hairline-card rounded-2xl p-6 space-y-3"
        >
          <h3 className="font-editorial text-2xl text-[#12232E] inline-flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#B84A27]" />
            Registrar Movilidad (Spec 013)
          </h3>
          <p className="text-[11px] text-[#5C6B73]">
            Servicio exclusivamente informativo sin reserva aislada; nace inactivo hasta cargar su
            imagen oficial.
          </p>
          <input
            type="text"
            required
            value={mobName}
            onChange={(e) => setMobName(e.target.value)}
            placeholder="Nombre de unidad (ej. Sprinter Panorámica)"
            className="w-full px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={mobType}
              onChange={(e) => setMobType(e.target.value)}
              placeholder="Tipo (van, minibus...)"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="number"
              min={1}
              required
              value={mobCapacity}
              onChange={(e) => setMobCapacity(Number(e.target.value))}
              placeholder="Capacidad"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
          </div>
          <textarea
            rows={2}
            value={mobDesc}
            onChange={(e) => setMobDesc(e.target.value)}
            placeholder="Equipamiento, climatización y seguridad..."
            className="w-full px-3.5 py-2 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer"
          >
            Crear Movilidad Desactivada
          </button>
        </form>

        <div className="lg:col-span-7 hairline-card rounded-2xl p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#12232E]">
            Unidades de Movilidad Informativa ({mobility.length})
          </h3>
          <div className="divide-y divide-[#E5DDD0]">
            {mobility.map((m) => (
              <div
                key={m.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#12232E]">{m.name}</p>
                  <p className="text-[11px] text-[#5C6B73]">
                    {m.type} · Cap. {m.capacity} pax · ETag v{m.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={m.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => void handleToggleMobility(m)}
                    className="px-3 py-1.5 rounded-lg border border-[#D2C6B4] text-[11px] font-bold cursor-pointer"
                  >
                    {m.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO 4: GOBERNANZA — CLIENTES SOLO LECTURA, AUDITORÍA INMUTABLE & CSV (SPEC 010)
// ============================================================================

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
    summary: 'Captura inmutable de reporte operativo y financiero PEN.',
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
    summary: 'Cancelación automática por vencimiento y liberación única de cupos (Spec 003 / HU-20).',
  },
];

export const AdminGovernancePage: React.FC = () => {
  const { apiOnline, isDemoSession } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  // Filtros oficiales Spec 010 RF-4 (Clientes)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientTotal, setClientTotal] = useState(DEMO_CLIENTS.length);
  const [clientHasNext, setClientHasNext] = useState(false);

  // Filtros oficiales Spec 010 RF-23 (Auditoría)
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [correlationFilter, setCorrelationFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(DEMO_AUDIT.length);
  const [auditHasNext, setAuditHasNext] = useState(false);

  const [clients, setClients] = useState<ClientSummaryDto[]>(DEMO_CLIENTS);
  const [audit, setAudit] = useState<AuditEntryDto[]>(DEMO_AUDIT);
  const [lastCsvReferenceAt, setLastCsvReferenceAt] = useState<string | null>(null);
  const [exportingKind, setExportingKind] = useState<'clients' | 'audit' | null>(null);

  const loadClients = async (targetPage = clientPage) => {
    if (registeredFrom && registeredTo && registeredFrom > registeredTo) {
      notifyError(
        new Error('El rango de fechas de registro de clientes está invertido (Spec 010 · RF-51).'),
        'Filtro inválido'
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

  const loadAudit = async (targetPage = auditPage) => {
    if (auditFrom && auditTo && auditFrom > auditTo) {
      notifyError(
        new Error('El rango de fechas de auditoría está invertido (Spec 010 · RF-51).'),
        'Filtro inválido'
      );
      return;
    }
    if (apiOnline === false || isDemoSession) return;
    try {
      const res = await adminApi.listAudit({
        page: targetPage,
        pageSize: 10,
        from: auditFrom || undefined,
        to: auditTo || undefined,
        actor: actorFilter.trim() || undefined,
        entity: entityFilter.trim() || undefined,
        action: actionFilter.trim() || undefined,
        correlationId: correlationFilter.trim() || undefined,
        result: resultFilter.trim() || undefined,
      });
      setAudit(res.items);
      setAuditPage(res.page);
      setAuditTotal(res.total);
      setAuditHasNext(res.hasNext);
    } catch (err) {
      notifyError(err, 'No se pudo consultar la bitácora de auditoría');
    }
  };

  useEffect(() => {
    void loadClients(clientPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession, clientPage]);

  useEffect(() => {
    void loadAudit(auditPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOnline, isDemoSession, auditPage]);

  // Spec 010 RF-27, RF-28, RF-42, RF-44, RF-59: exportación CSV basada en filtros activos e instante de referencia
  const handleCsvExport = async (kind: 'clients' | 'audit') => {
    if (kind === 'clients' && registeredFrom && registeredTo && registeredFrom > registeredTo) {
      notifyError(
        new Error('El rango de fechas está invertido (Spec 010 · RF-51).'),
        'Exportación rechazada'
      );
      return;
    }
    if (kind === 'audit' && auditFrom && auditTo && auditFrom > auditTo) {
      notifyError(
        new Error('El rango de fechas está invertido (Spec 010 · RF-51).'),
        'Exportación rechazada'
      );
      return;
    }

    if (apiOnline === false || isDemoSession) {
      const refIso = new Date().toISOString();
      setLastCsvReferenceAt(refIso);
      const csv =
        kind === 'clients'
          ? 'id,status,fullName,email,phone,emailVerified,registeredAt,reservationCount\ncl-01,active,"Valeria Quispe Mendoza",valeria.quispe@viajero.pe,"+51 987 654 321",true,2026-10-14T15:00:00Z,3\ncl-02,closed,,,,,1\n'
          : 'id,occurredAt,actor,entity,entityId,action,result,correlationId\naud-101,2026-11-24T16:40:00Z,operaciones@dmgotravel.pe,ReportSnapshot,rep-2026-nov,REPORT_CREATED,SUCCESS,corr-98a4f21c\naud-102,2026-11-24T15:12:00Z,system,Reservation,DMG-2026-004499,reservation.auto_cancelled,SUCCESS,corr-77b1e09a\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dmgotravel-${kind}-snapshot.csv`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess(
        `Exportación CSV (${kind}) entregada`,
        `Referencia oficial: ${formatLimaDateTime(refIso)} (Hora Perú · RF-59)`
      );
      return;
    }

    setExportingKind(kind);
    try {
      const accepted =
        kind === 'clients'
          ? await adminApi.createClientsExport({
              name: clientName.trim() || undefined,
              email: clientEmail.trim() || undefined,
              status: clientStatus || undefined,
              registeredFrom: registeredFrom || undefined,
              registeredTo: registeredTo || undefined,
            })
          : await adminApi.createAuditExport({
              from: auditFrom || undefined,
              to: auditTo || undefined,
              actor: actorFilter.trim() || undefined,
              entity: entityFilter.trim() || undefined,
              action: actionFilter.trim() || undefined,
              correlationId: correlationFilter.trim() || undefined,
              result: resultFilter.trim() || undefined,
            });

      setLastCsvReferenceAt(accepted.referenceAt);

      // Verifica el estado del ExportJob asíncrono antes de descargar (202 Accepted -> completed/ready)
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
      notifySuccess(
        'CSV completo descargado (Spec 010 · RF-42, RF-43)',
        `Referencia oficial: ${formatLimaDateTime(accepted.referenceAt)} (America/Lima UTC-5 · RF-59)`
      );
    } catch (err) {
      notifyError(err, 'No se pudo completar o descargar la exportación CSV (RF-32)');
    } finally {
      setExportingKind(null);
    }
  };

  // Spec 010 RF-44 & RF-54: en vista previa local también se excluye de búsqueda por nombre/correo a cuentas con baja lógica
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

  const visibleAudit =
    apiOnline === false || isDemoSession
      ? audit.filter((a) => {
          if (actorFilter.trim() && a.actor !== actorFilter.trim()) return false;
          if (entityFilter.trim() && a.entity.toLowerCase() !== entityFilter.trim().toLowerCase()) {
            return false;
          }
          if (actionFilter.trim() && a.action !== actionFilter.trim()) return false;
          if (correlationFilter.trim() && a.correlationId !== correlationFilter.trim()) {
            return false;
          }
          if (resultFilter.trim() && a.result.toLowerCase() !== resultFilter.trim().toLowerCase()) {
            return false;
          }
          return true;
        })
      : audit;

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#E5DDD0] flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow>Gobernanza, Privacidad &amp; Trazabilidad · Spec 010</SectionEyebrow>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E] mt-1">
            Directorio de Clientes &amp; Auditoría Inmutable
          </h1>
          <p className="text-xs text-[#5C6B73] mt-1">
            Consultas paginadas de solo lectura (<span className="font-mono">RF-7, RF-16</span>) y
            exportación CSV completa con protección inmediata de baja lógica (<span className="font-mono">RF-44, RF-56</span>).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exportingKind !== null}
            onClick={() => void handleCsvExport('clients')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D2C6B4] bg-[#FFFCF8] disabled:opacity-50 text-xs font-bold text-[#12232E] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#B84A27]" />
            {exportingKind === 'clients' ? 'Generando CSV (202)...' : 'Exportar Clientes CSV'}
          </button>
          <button
            type="button"
            disabled={exportingKind !== null}
            onClick={() => void handleCsvExport('audit')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#12232E] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C89B54]" />
            {exportingKind === 'audit' ? 'Generando CSV (202)...' : 'Exportar Auditoría CSV'}
          </button>
        </div>
      </div>

      {lastCsvReferenceAt && (
        <div className="rounded-xl bg-[#E7F3EE] border border-[#B6DEC9] px-4 py-3 text-xs text-[#15523F] flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Última exportación CSV fijada al instante de referencia:{' '}
            <strong className="font-mono">
              {formatLimaDateTime(lastCsvReferenceAt)} (America/Lima UTC-5 · Spec 010 RF-59)
            </strong>
          </span>
        </div>
      )}

      {/* Directorio de Clientes Solo Lectura con Protección PII (Spec 010 RF-3..RF-8, RF-44) */}
      <div className="hairline-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B84A27]" />
            Clientes Registrados (Solo Lectura · Sin edición ni reactivación desde 010 · RF-7)
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setClientPage(1);
              void loadClients(1);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5"
          >
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre parcial (RF-46)"
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="text"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Correo parcial (RF-46)"
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <select
              value={clientStatus}
              onChange={(e) => setClientStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="closed">Baja lógica (closed)</option>
            </select>
            <input
              type="date"
              value={registeredFrom}
              onChange={(e) => setRegisteredFrom(e.target.value)}
              aria-label="Registro desde"
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="date"
              value={registeredTo}
              onChange={(e) => setRegisteredTo(e.target.value)}
              aria-label="Registro hasta"
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#12232E] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Consultar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#5C6B73]">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Titular</th>
                <th className="px-5 py-3">Correo &amp; Verificación</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Registro (Lima)</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Reservas (RF-53)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#5C6B73]">
                    Sin clientes que coincidan con los filtros seleccionados (RF-33).
                  </td>
                </tr>
              ) : (
                visibleClients.map((c) => {
                  const isClosed = c.status.toLowerCase() === 'closed';
                  return (
                    <tr key={c.id}>
                      <td className="px-5 py-3.5 font-mono text-[11px]">{c.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#12232E]">
                        {isClosed
                          ? 'Omitido por baja lógica (RF-44)'
                          : c.fullName ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[#5C6B73]">
                        {isClosed ? (
                          '—'
                        ) : (
                          <span>
                            {c.email ?? '—'}{' '}
                            {c.emailVerified !== null && c.emailVerified !== undefined && (
                              <span className="text-[10px] font-bold text-[#1B5E4A]">
                                ({c.emailVerified ? 'Verificado' : 'No verificado'})
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
                      <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
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

      {/* Explorador de Auditoría Inmutable (Spec 010 RF-9..RF-26, RF-50) */}
      <div className="hairline-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12232E] inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B5E4A]" />
            Bitácora de Auditoría Inmutable (Conservación indefinida · RF-16, RF-17)
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAuditPage(1);
              void loadAudit(1);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2"
          >
            <input
              type="date"
              value={auditFrom}
              onChange={(e) => setAuditFrom(e.target.value)}
              aria-label="Auditoría desde"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="date"
              value={auditTo}
              onChange={(e) => setAuditTo(e.target.value)}
              aria-label="Auditoría hasta"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Actor exacto (system...)"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="text"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Entidad (Reservation...)"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
            />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Acción exacta"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
            />
            <input
              type="text"
              value={correlationFilter}
              onChange={(e) => setCorrelationFilter(e.target.value)}
              placeholder="CorrelationId"
              className="px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                placeholder="Resultado"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
              />
              <button
                type="submit"
                aria-label="Filtrar auditoría"
                className="px-2.5 py-1.5 rounded-lg bg-[#12232E] text-white text-xs font-bold cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#5C6B73]">
              <tr>
                <th className="px-5 py-3">Fecha (Lima)</th>
                <th className="px-5 py-3">Actor (RF-10)</th>
                <th className="px-5 py-3">Entidad</th>
                <th className="px-5 py-3">Acción &amp; Resultado</th>
                <th className="px-5 py-3">CorrelationId</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {visibleAudit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#5C6B73]">
                    Sin eventos de auditoría para los filtros seleccionados (RF-33).
                  </td>
                </tr>
              ) : (
                visibleAudit.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {formatLimaDateTime(a.occurredAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#12232E]">{a.actor}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      {a.entity} ({a.entityId})
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-[#1B5E4A]">{a.action}</span>{' '}
                      <span className="text-[10px] font-bold text-[#5C6B73]">[{a.result}]</span>
                      {a.summary && (
                        <span className="block text-[11px] text-[#5C6B73]">{a.summary}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#5C6B73]">
                      {a.correlationId || '—'}
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
            pageSize={10}
            total={auditTotal}
            hasNext={auditHasNext}
            onPageChange={setAuditPage}
          />
        </div>
      </div>
    </div>
  );
};
