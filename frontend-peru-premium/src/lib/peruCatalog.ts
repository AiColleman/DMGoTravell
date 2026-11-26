import peruHeroImg from '../assets/peru-hero.webp';
import peruHeroAltImg from '../assets/peru-hero.jpg';
import cuscoImg from '../assets/cusco.webp';
import cuscoJpgImg from '../assets/cusco.jpg';
import ayacuchoImg from '../assets/ayacucho.webp';
import ayacuchoAltImg from '../assets/ayacucho.jpg';
import arequipaImg from '../assets/arequipa.webp';
import arequipaAltImg from '../assets/arequipa.jpg';
import limaImg from '../assets/lima.webp';
import limaJpgImg from '../assets/lima.jpg';
import colcaImg from '../assets/colca.webp';
import colcaJpgImg from '../assets/colca.jpg';
import hotelImg from '../assets/hotel.jpg';
import hotelWebpImg from '../assets/hotel.webp';

// Fotografías ficticias editoriales creadas para cada uno de los 9 hoteles reales de DM GO TRAVEL en Ayacucho
// (listas para ser reemplazadas por las fotografías originales en /public/assets/hotels/ o vía /admin/comercial)
import hotelInternazionaleImg from '../assets/hotels/hotel-internazionale.jpg';
import hotelSumaqPlazaImg from '../assets/hotels/hotel-sumaq-plaza.jpg';
import hotelRiveraImg from '../assets/hotels/hotel-rivera.jpg';
import hotelCondeduqueImg from '../assets/hotels/hotel-condeduque.jpg';
import hotelSamaryImg from '../assets/hotels/hotel-samary.jpg';
import hotelContinentalImg from '../assets/hotels/hotel-continental.jpg';
import hotelElLibertadorImg from '../assets/hotels/hotel-el-libertador.jpg';
import hotelCasaRusticaImg from '../assets/hotels/hotel-casa-rustica.jpg';
import hospedajeSantaLuciaImg from '../assets/hotels/hospedaje-santa-lucia.jpg';
import roomMatrimonialImg from '../assets/hotels/room-matrimonial.jpg';
import roomDobleImg from '../assets/hotels/room-doble.jpg';
import roomIndividualImg from '../assets/hotels/room-individual.jpg';
import roomQueenKingImg from '../assets/hotels/room-queen-king.jpg';
import roomTripleImg from '../assets/hotels/room-triple.jpg';
import roomFamiliarImg from '../assets/hotels/room-familiar.jpg';
import hotelDesayunoImg from '../assets/hotels/hotel-desayuno.jpg';

import type {
  CatalogOfferDetailDto,
  CatalogOfferDto,
  HotelAdminItemDto,
  HotelPublicDetailDto,
  HotelPublicItemDto,
  MobilityPublicItemDto,
} from '../types/api';

/**
 * Canales oficiales de contacto y atención de DM GO TRAVEL (Catálogo Oficial Ayacucho).
 */
export const DMGO_AGENCY_CONTACT = {
  brand: 'DM GO TRAVEL',
  tagline: '¡Hora de las vacaciones! Explora Ayacucho',
  socialHandle: '@dmgotravel',
  instagramUrl: 'https://www.instagram.com/dmgotravel',
  phones: ['913 249 767', '969 167 443'] as const,
  whatsappPrimaryUrl:
    'https://wa.me/51913249767?text=Hola%20DM%20GO%20TRAVEL%2C%20quisiera%20informaci%C3%B3n%20sobre%20tours%20y%20alojamiento%20aliado%20en%20Ayacucho.',
  whatsappSecondaryUrl:
    'https://wa.me/51969167443?text=Hola%20DM%20GO%20TRAVEL%2C%20quisiera%20informaci%C3%B3n%20sobre%20tours%20y%20alojamiento%20aliado%20en%20Ayacucho.',
  location: 'Ayacucho (Huamanga), Perú',
} as const;

/**
 * Fotografías editoriales locales en alta resolución + activos dedicados para los 9 hoteles reales
 * de DM GO TRAVEL y soporte transparente para /api/v1/media/{guid} y Cloudflare R2 (Spec 012).
 */
export const PERU_ASSETS = {
  peruHero: peruHeroImg,
  peruHeroAlt: peruHeroAltImg,
  cusco: cuscoImg,
  cuscoAlt: cuscoJpgImg,
  ayacucho: ayacuchoImg,
  ayacuchoAlt: ayacuchoAltImg,
  arequipa: arequipaImg,
  arequipaAlt: arequipaAltImg,
  lima: limaImg,
  limaAlt: limaJpgImg,
  colca: colcaImg,
  colcaAlt: colcaJpgImg,
  hotel: hotelImg,
  hotelAlt: hotelWebpImg,
  hotels: {
    internazionale: hotelInternazionaleImg,
    sumaqPlaza: hotelSumaqPlazaImg,
    rivera: hotelRiveraImg,
    condeduque: hotelCondeduqueImg,
    samary: hotelSamaryImg,
    continental: hotelContinentalImg,
    elLibertador: hotelElLibertadorImg,
    casaRustica: hotelCasaRusticaImg,
    santaLucia: hospedajeSantaLuciaImg,
    roomMatrimonial: roomMatrimonialImg,
    roomDoble: roomDobleImg,
    roomIndividual: roomIndividualImg,
    roomQueenKing: roomQueenKingImg,
    roomTriple: roomTripleImg,
    roomFamiliar: roomFamiliarImg,
    desayuno: hotelDesayunoImg,
  },
} as const;

export const EDITORIAL_DESTINATIONS = [
  {
    name: 'Ayacucho',
    region: 'Huamanga · 2,761 m s. n. m.',
    tagline: 'Piedra tallada, memoria Wari, 9 hoteles aliados y cañones turquesa',
    image: PERU_ASSETS.ayacucho,
    featured: true,
  },
  {
    name: 'Cusco',
    region: 'Sierra Sur · 3,399 m s. n. m.',
    tagline: 'Santuarios incas, andenería viva y Valle Sagrado',
    image: PERU_ASSETS.cusco,
    featured: false,
  },
  {
    name: 'Arequipa',
    region: 'Ciudad Blanca · 2,335 m s. n. m.',
    tagline: 'Sillar volcánico, Valle del Colca y vuelo del cóndor',
    image: PERU_ASSETS.colca,
    featured: false,
  },
  {
    name: 'Lima',
    region: 'Costa del Pacífico · Nivel del mar',
    tagline: 'Alta cocina contemporánea, acantilados y barrios históricos',
    image: PERU_ASSETS.lima,
    featured: false,
  },
] as const;

const TOUR_FALLBACKS = [
  PERU_ASSETS.cusco,
  PERU_ASSETS.ayacucho,
  PERU_ASSETS.colca,
  PERU_ASSETS.peruHero,
  PERU_ASSETS.lima,
  PERU_ASSETS.arequipa,
];

const HOTEL_FALLBACKS = [
  PERU_ASSETS.hotels.internazionale,
  PERU_ASSETS.hotels.sumaqPlaza,
  PERU_ASSETS.hotels.condeduque,
  PERU_ASSETS.hotels.rivera,
  PERU_ASSETS.hotels.samary,
  PERU_ASSETS.hotels.continental,
  PERU_ASSETS.hotels.elLibertador,
  PERU_ASSETS.hotels.casaRustica,
  PERU_ASSETS.hotels.santaLucia,
];

export const EDITORIAL_SVG_PLACEHOLDER =
  `data:image/svg+xml;charset=utf-8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#12232E"/><stop offset="60%" stop-color="#1D3545"/><stop offset="100%" stop-color="#B84A27"/></linearGradient></defs><rect width="1200" height="750" fill="url(#g)"/><path d="M0 560 L280 340 L520 490 L790 260 L1200 540 L1200 750 L0 750 Z" fill="#0B1720" fill-opacity="0.55"/><path d="M180 600 L480 380 L740 530 L1020 330 L1200 470 L1200 750 L0 750 Z" fill="#0B1720" fill-opacity="0.75"/></svg>`
  );

function isPlaceholderOrInvalidUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('example.test') ||
    lower.includes('example.com') ||
    lower.includes('example.org') ||
    lower.includes('.invalid')
  );
}

function pickLocalFallback(
  category: 'tour' | 'package' | 'hotel' | 'room' | 'mobility',
  seedIndex: number,
  hintText: string
): string {
  const lower = hintText.toLowerCase();

  if (category === 'room') {
    if (lower.includes('individual')) return PERU_ASSETS.hotels.roomIndividual;
    if (lower.includes('queen') || lower.includes('king')) return PERU_ASSETS.hotels.roomQueenKing;
    if (lower.includes('4 pers')) return PERU_ASSETS.hotels.roomFamiliar;
    if (lower.includes('triple') || lower.includes('3 pers')) return PERU_ASSETS.hotels.roomTriple;
    if (lower.includes('doble')) return PERU_ASSETS.hotels.roomDoble;
    return PERU_ASSETS.hotels.roomMatrimonial;
  }

  if (category === 'hotel') {
    if (lower.includes('internazionale')) return PERU_ASSETS.hotels.internazionale;
    if (lower.includes('sumaq')) return PERU_ASSETS.hotels.sumaqPlaza;
    if (lower.includes('rivera')) return PERU_ASSETS.hotels.rivera;
    if (lower.includes('condeduque')) return PERU_ASSETS.hotels.condeduque;
    if (lower.includes('samary')) return PERU_ASSETS.hotels.samary;
    if (lower.includes('continental')) return PERU_ASSETS.hotels.continental;
    if (lower.includes('libertador')) return PERU_ASSETS.hotels.elLibertador;
    if (lower.includes('rústica') || lower.includes('rustica')) return PERU_ASSETS.hotels.casaRustica;
    if (lower.includes('santa lucía') || lower.includes('santa lucia')) return PERU_ASSETS.hotels.santaLucia;
    if (lower.includes('arequipa') || lower.includes('sillar') || lower.includes('misti')) {
      return PERU_ASSETS.arequipaAlt;
    }
    if (lower.includes('lima') || lower.includes('barranco') || lower.includes('pacífico') || lower.includes('pacifico')) {
      return PERU_ASSETS.lima;
    }
    return HOTEL_FALLBACKS[Math.abs(seedIndex) % HOTEL_FALLBACKS.length]!;
  }

  if (category === 'mobility') {
    const fleet = [PERU_ASSETS.peruHeroAlt, PERU_ASSETS.arequipa, PERU_ASSETS.colca];
    return fleet[Math.abs(seedIndex) % fleet.length]!;
  }

  if (lower.includes('millpu') || lower.includes('vilcashuam') || lower.includes('titanka')) {
    return PERU_ASSETS.ayacuchoAlt;
  }
  if (lower.includes('ayacucho') || lower.includes('huamanga') || lower.includes('wari') || lower.includes('qorihuillca')) {
    return PERU_ASSETS.ayacucho;
  }
  if (lower.includes('colca') || lower.includes('cóndor') || lower.includes('condor')) {
    return PERU_ASSETS.colca;
  }
  if (lower.includes('arequipa') || lower.includes('sillar')) {
    return PERU_ASSETS.arequipa;
  }
  if (lower.includes('lima') || lower.includes('barranco') || lower.includes('miraflores')) {
    return PERU_ASSETS.lima;
  }
  if (lower.includes('machu')) {
    return PERU_ASSETS.peruHero;
  }
  if (lower.includes('cusco') || lower.includes('sagrado') || lower.includes('urubamba')) {
    return category === 'package' ? PERU_ASSETS.peruHero : PERU_ASSETS.cusco;
  }

  return TOUR_FALLBACKS[Math.abs(seedIndex) % TOUR_FALLBACKS.length]!;
}

export function resolveMediaUrl(
  rawUrl: string | null | undefined,
  category: 'tour' | 'package' | 'hotel' | 'room' | 'mobility' = 'tour',
  seedIndex = 0,
  hintText = ''
): string {
  const trimmed = rawUrl?.trim() ?? '';
  if (trimmed && !isPlaceholderOrInvalidUrl(trimmed)) {
    if (trimmed.startsWith('/api/')) {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      return `${apiBase}${trimmed}`;
    }
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/assets/') ||
      trimmed.startsWith('/src/') ||
      trimmed.startsWith('/@fs/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
  }

  return pickLocalFallback(category, seedIndex, hintText);
}

export function inferDestination(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('cusco') || lower.includes('machu') || lower.includes('sagrado') || lower.includes('urubamba')) {
    return 'Cusco';
  }
  if (
    lower.includes('ayacucho') ||
    lower.includes('huamanga') ||
    lower.includes('millpu') ||
    lower.includes('vilcashuam') ||
    lower.includes('qorihuillca') ||
    lower.includes('wari') ||
    lower.includes('emadi') ||
    lower.includes('plaza mayor') ||
    lower.includes('sumaq') ||
    lower.includes('condeduque') ||
    lower.includes('samary')
  ) {
    return 'Ayacucho';
  }
  if (lower.includes('arequipa') || lower.includes('colca') || lower.includes('sillar')) {
    return 'Arequipa';
  }
  if (lower.includes('lima') || lower.includes('barranco') || lower.includes('miraflores')) {
    return 'Lima';
  }
  return 'Perú';
}

/**
 * Orden alfabético ascendente A–Z exigido por Spec 007 (RF-7 / DEC-113).
 */
export function sortHotelsAlphabetically<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export interface HotelEditorialMeta {
  destination: string;
  stars?: number;
  categoryBadge: string;
  summaryText: string;
  location: string;
  proximity: string;
  checkIn: string;
  checkOut: string;
  breakfastPartner?: string;
}

interface StaticHotelMetaEntry {
  stars?: number;
  categoryBadge: string;
  summaryText: string;
  location: string;
  proximity: string;
  checkIn: string;
  checkOut: string;
  breakfastPartner?: string;
}

const KNOWN_AYACUCHO_HOTELS_META: Record<string, StaticHotelMetaEntry> = {
  'hotel internazionale (hotel - restaurant)': {
    stars: 3,
    categoryBadge: '3 estrellas · Hotel - Restaurant',
    summaryText:
      'Propiedad de 3 estrellas con cafetería, restaurante propio, cochera privada y ascensor, ideal para viajeros y familias que buscan amplitud y desayuno buffet en Ayacucho.',
    location: 'Jr. José Olaya N° 588, Emadi — Ayacucho',
    proximity: 'A 10 min de la Plaza Mayor',
    checkIn: '1:00 pm',
    checkOut: '12:00 pm',
  },
  'hotel sumaq plaza': {
    categoryBadge: 'Eco-amigable · Pet Friendly',
    summaryText:
      'Ambiente eco-amigable con decoración típica ayacuchana a pasos del centro histórico, equipado con friobar, microondas, desayuno a la carta y hospitalidad Pet Friendly.',
    location: 'Centro Histórico — A pocos pasos de la Plaza Mayor de Ayacucho',
    proximity: 'A pasos de la Plaza Mayor',
    checkIn: '11:00 am',
    checkOut: '11:00 am',
  },
  'hotel rivera': {
    stars: 2,
    categoryBadge: '2 estrellas · Tradición Urbana',
    summaryText:
      'Hotel de 2 estrellas de ubicación estratégica en el jirón Callao, con desayuno americano-continental, bebidas calientes en el primer nivel y habitaciones familiares amplias.',
    location: 'Jr. Callao N° 316, Ayacucho',
    proximity: 'A 2 cuadras de la Plaza Mayor',
    checkIn: '12:00 pm',
    checkOut: '12:00 pm',
  },
  'hotel condeduque': {
    categoryBadge: 'Arquitectura Colonial',
    summaryText:
      'Combina el carácter colonial huamanguino en sus instalaciones a solo media cuadra de la Plaza Mayor, ofreciendo descanso sereno, bebidas calientes y atención cercana.',
    location: 'Jr. Asamblea N° 159, Ayacucho',
    proximity: 'A media cuadra de la Plaza Mayor',
    checkIn: '12:00 pm',
    checkOut: '12:00 pm',
  },
  'hotel samary (hotel & apartment)': {
    categoryBadge: 'Hotel & Apartment · Moderno',
    summaryText:
      'Combina instalaciones modernas de formato Hotel & Apartment con cochera privada, Smart TV de 50" con Disney+ y convenio gastronómico con el Hotel Sumaq Plaza.',
    location: 'Jr. Callao N° 335, Ayacucho',
    proximity: 'A 2 cuadras de la Plaza Mayor',
    checkIn: '12:00 pm',
    checkOut: '11:00 am',
    breakfastPartner: 'Hotel Sumaq Plaza',
  },
  'hotel continental': {
    stars: 2,
    categoryBadge: '2 estrellas · Corte Moderno',
    summaryText:
      'Propiedad moderna de 2 estrellas dotada de ascensor y cafetería propia a tres cuadras de la Plaza Mayor, con desayuno matutino atendido en el Hotel Sumaq Plaza.',
    location: 'Jr. Carlos F. Vivanco N° 475, Ayacucho',
    proximity: 'A 3 cuadras de la Plaza Mayor',
    checkIn: '12:00 pm',
    checkOut: '11:00 am',
    breakfastPartner: 'Hotel Sumaq Plaza',
  },
  'hotel el libertador': {
    categoryBadge: 'Estilo Colonial',
    summaryText:
      'Combina la calidez colonial ayacuchana en el tradicional jirón San Martín con habitaciones funcionales de hasta cuatro huéspedes y desayuno en el Hotel Sumaq Plaza.',
    location: 'Jr. San Martín N° 324, Ayacucho',
    proximity: 'A 3 cuadras de la Plaza Mayor',
    checkIn: '12:00 pm',
    checkOut: '11:00 am',
    breakfastPartner: 'Hotel Sumaq Plaza',
  },
  'hotel casa rústica': {
    categoryBadge: 'Casona Colonial Rústica',
    summaryText:
      'Combina detalles coloniales y rústicos en pleno centro histórico de Huamanga, con estación de bebidas calientes en el primer nivel y desayuno americano-continental.',
    location: 'Jr. San Martín N° 324, Ayacucho',
    proximity: 'A 3 cuadras de la Plaza Mayor',
    checkIn: '1:00 pm',
    checkOut: '11:00 am',
  },
  'hospedaje santa lucía': {
    stars: 2,
    categoryBadge: 'Hostal 2 estrellas · Colonial',
    summaryText:
      'Acogedor hostal de 2 estrellas que combina arquitectura colonial tradicional en el jirón Sol de Huamanga con desayuno americano-continental y excelente relación tarifa-confort.',
    location: 'Jr. Sol N° 140, Huamanga — Ayacucho',
    proximity: 'A 4 cuadras de la Plaza Mayor',
    checkIn: '1:00 pm',
    checkOut: '11:00 am',
  },
};

/**
 * Extrae metadatos estructurados para la vista editorial a partir de las propiedades opcionales
 * o de la descripción persistida en el backend (manteniendo intacto el contrato OpenAPI 3.1).
 */
export function extractHotelEditorialMeta(hotel: HotelPublicItemDto): HotelEditorialMeta {
  const normalizedName = hotel.name.trim().toLowerCase();
  const known = KNOWN_AYACUCHO_HOTELS_META[normalizedName];
  const destination =
    hotel.destinationHint ||
    (known ? 'Ayacucho' : inferDestination(`${hotel.name} ${hotel.description}`));

  if (known) {
    return {
      destination,
      stars: hotel.starsHint ?? known.stars,
      categoryBadge: hotel.categoryHint ?? known.categoryBadge,
      summaryText: known.summaryText,
      location: hotel.locationHint ?? known.location,
      proximity: hotel.proximityHint ?? known.proximity,
      checkIn: hotel.checkInHint ?? known.checkIn,
      checkOut: hotel.checkOutHint ?? known.checkOut,
      breakfastPartner: hotel.breakfastPartnerHint ?? known.breakfastPartner,
    };
  }

  const locMatch = hotel.description.match(/Ubicación:\s*([^.]+(?:\.[^.]+)*?)(?:\s*Horarios:|$)/i);
  const schedMatch = hotel.description.match(
    /Check-in\s*([0-9: ]+(?:am|pm))\s*\|\s*Check-out\s*([0-9: ]+(?:am|pm))/i
  );

  return {
    destination,
    stars: hotel.starsHint,
    categoryBadge:
      hotel.categoryHint ??
      (hotel.starsHint ? `${hotel.starsHint} estrellas` : 'Alojamiento Aliado'),
    summaryText: hotel.description,
    location: hotel.locationHint ?? (locMatch?.[1]?.trim() || `${destination}, Perú`),
    proximity: hotel.proximityHint ?? `${destination}, Perú`,
    checkIn: hotel.checkInHint ?? (schedMatch?.[1]?.trim() || '12:00 pm'),
    checkOut: hotel.checkOutHint ?? (schedMatch?.[2]?.trim() || '11:00 am'),
    breakfastPartner: hotel.breakfastPartnerHint,
  };
}

// ============================================================================
// Catálogo Editorial de Respaldo (cuando la API local ASP.NET Core está apagada)
// ============================================================================

export const SHOWCASE_TOURS: CatalogOfferDetailDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    type: 'tour',
    name: 'Huamanga Virreinal, Talleres de Piedra & Ruta Wari',
    destinationHint: 'Ayacucho',
    categoryHint: 'Patrimonio Cultural',
    badgeHint: 'Identidad Local',
    nextDepartureHint: '14 cupos disponibles',
    description:
      'Un recorrido íntimo por las casonas señoriales de Huamanga, los maestros talladores de alabastro andino, la antigua metrópoli imperial Wari y el pueblo histórico de Quinua.',
    price: '185.00',
    originalPriceHint: '215.00',
    currency: 'PEN',
    durationDays: 1,
    images: [
      { id: 'img-ay-1', url: PERU_ASSETS.ayacucho, isPrimary: true, version: 1 },
      { id: 'img-ay-2', url: PERU_ASSETS.ayacuchoAlt, isPrimary: false, version: 1 },
      { id: 'img-ay-3', url: PERU_ASSETS.hotels.condeduque, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Disponibilidad controlada transaccionalmente en el servidor (Spec 001).',
      'Incluye Guía Oficial de Turismo DIRCETUR, ingresos culturales y transporte climatizado.',
      'Cancelación sin penalidad mientras la reserva permanezca en estado Pendiente.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Centro Histórico de Huamanga, Complejo Wari y Santuario de Quinua',
        description:
          '08:30 Encuentro en el Portal de la Constitución · 09:30 Casonas coloniales y talleres de piedra de Huamanga · 12:30 Ciudadela Wari · 15:30 Pampa de Ayacucho y talleres ceramistas.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000201',
        startDate: '2026-12-12T13:00:00Z',
        endDate: '2026-12-12T23:00:00Z',
        price: '185.00',
        currency: 'PEN',
        capacity: 16,
        available: 14,
      },
      {
        id: '00000000-0000-4000-8000-000000000202',
        startDate: '2026-12-19T13:00:00Z',
        endDate: '2026-12-19T23:00:00Z',
        price: '195.00',
        currency: 'PEN',
        capacity: 16,
        available: 9,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    type: 'tour',
    name: 'Valle del Colca, Andenerías Preincas & Mirador del Cóndor',
    destinationHint: 'Arequipa',
    categoryHint: 'Naturaleza Andina',
    badgeHint: 'Alta Montaña',
    nextDepartureHint: '10 cupos disponibles',
    description:
      'Travesía escénica desde la Ciudad Blanca cruzando la Reserva Nacional de Salinas y Aguada Blanca hacia los pueblos tradicionales y cañones profundos del Colca.',
    price: '420.00',
    currency: 'PEN',
    durationDays: 2,
    images: [
      { id: 'img-aq-1', url: PERU_ASSETS.colca, isPrimary: true, version: 1 },
      { id: 'img-aq-2', url: PERU_ASSETS.arequipa, isPrimary: false, version: 1 },
      { id: 'img-aq-3', url: PERU_ASSETS.hotel, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Unidad equipada con oxígeno medicinal y monitoreo satelital permanente.',
      'Precios congelados en Soles Peruanos (PEN) mediante snapshot histórico al reservar.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arequipa, Pampa Cañahuas, Patapampa (4,910 m) y Chivay',
        description:
          'Avistamiento de vicuñas en su hábitat altoandino, mirador de los volcanes Ampato y Sabancaya, y tarde de reposo en el valle.',
      },
      {
        day: 2,
        title: 'Cruz del Cóndor, Pinchollo, Maca y Retorno a Arequipa',
        description:
          'Contemplación matutina del vuelo del cóndor andino sobre terrazas agrícolas milenarias y retorno panorámico.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000203',
        startDate: '2026-12-15T11:30:00Z',
        endDate: '2026-12-16T22:30:00Z',
        price: '420.00',
        currency: 'PEN',
        capacity: 14,
        available: 10,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    type: 'tour',
    name: 'Lima Contemporánea: Centro Virreinal, Barranco & Sabores del Pacífico',
    destinationHint: 'Lima',
    categoryHint: 'Gastronomía & Arte',
    badgeHint: 'Autor',
    nextDepartureHint: '12 cupos disponibles',
    description:
      'Recorrido curado entre balcones republicanos, galerías independientes en Barranco, mercados de biodiversidad peruana y cata marina frente al océano Pacífico.',
    price: '230.00',
    currency: 'PEN',
    durationDays: 1,
    images: [
      { id: 'img-lm-1', url: PERU_ASSETS.lima, isPrimary: true, version: 1 },
      { id: 'img-lm-2', url: PERU_ASSETS.peruHero, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Grupos reducidos de máximo 12 viajeros.',
      'Incluye degustaciones seleccionadas y guía especializado en historia del arte y cocina peruana.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Plaza Mayor, Convento de San Francisco, Mercado Local y Barranco Bohemio',
        description:
          '09:00 Arquitectura virreinal · 11:30 Ruta de frutas nativas y cacao de origen · 13:30 Barra marina frente al mar en Barranco.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000204',
        startDate: '2026-12-14T14:00:00Z',
        endDate: '2026-12-14T21:30:00Z',
        price: '230.00',
        currency: 'PEN',
        capacity: 12,
        available: 12,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    type: 'tour',
    name: 'Santuario Inca de Vilcashuamán, Ushnu Imperial & Bosque de Titankas',
    destinationHint: 'Ayacucho',
    categoryHint: 'Arqueología',
    nextDepartureHint: '8 cupos disponibles',
    description:
      'Viaje hacia el corazón administrativo del Tahuantinsuyo en el sur de Ayacucho: el Templo del Sol, la piedra de vaticinio y las monumentales Puyas de Raimondi en Vischongo.',
    price: '195.00',
    currency: 'PEN',
    durationDays: 1,
    images: [
      { id: 'img-vc-1', url: PERU_ASSETS.ayacuchoAlt, isPrimary: true, version: 1 },
      { id: 'img-vc-2', url: PERU_ASSETS.ayacucho, isPrimary: false, version: 1 },
    ],
    conditions: ['Boleto arqueológico integral y movilidad turística certificada incluidos.'],
    itinerary: [
      {
        day: 1,
        title: 'Vischongo, Laguna Pumaqocha (Intihuatana) y Pirámide Ceremonial de Vilcashuamán',
        description: 'Jornada cultural completa con acompañamiento histórico especializado.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000205',
        startDate: '2026-12-21T11:00:00Z',
        endDate: '2026-12-21T23:00:00Z',
        price: '195.00',
        currency: 'PEN',
        capacity: 14,
        available: 8,
      },
    ],
  },
];

export const SHOWCASE_PACKAGES: CatalogOfferDetailDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000105',
    type: 'package',
    name: 'Cusco Imperial, Valle Sagrado & Ciudadela de Machu Picchu 4D/3N',
    destinationHint: 'Cusco',
    categoryHint: 'Gran Recorrido',
    badgeHint: 'Patrimonio Mundial',
    nextDepartureHint: '6 cupos disponibles',
    description:
      'Una travesía serena y cuidadosamente orquestada por Qorikancha, Pisac, Ollantaytambo y Machu Picchu en tren panorámico, diseñada para combinarse en una sola reserva con casonas y lodges aliados.',
    price: '1480.00',
    originalPriceHint: '1650.00',
    currency: 'PEN',
    durationDays: 4,
    images: [
      { id: 'img-cu-1', url: PERU_ASSETS.peruHero, isPrimary: true, version: 1 },
      { id: 'img-cu-2', url: PERU_ASSETS.cusco, isPrimary: false, version: 1 },
      { id: 'img-cu-3', url: PERU_ASSETS.hotel, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Incluye tren panorámico ida y vuelta, bus ecológico Consettur e ingresos oficiales a Machu Picchu.',
      'Permite consolidar alojamiento opcional validado por períodos de 24 horas en la misma transacción.',
      'Confirmación emitida exclusivamente tras validación de pago en Culqi (RN-14).',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Recepción en Cusco, Barrio de San Blas, Qorikancha y Sacsayhuamán',
        description: 'Aclimatación pausada a 3,399 m s. n. m. y recorrido vespertino por templos incas.',
      },
      {
        day: 2,
        title: 'Valle Sagrado de los Incas: Andenes de Pisac, Urubamba y Ollantaytambo',
        description: 'Exploración de arquitectura viva inca y conexión ferroviaria hacia Aguas Calientes.',
      },
      {
        day: 3,
        title: 'Amanecer en el Santuario Histórico de Machu Picchu',
        description: 'Visita guiada de autor por los sectores sagrados y retorno panorámico a Cusco.',
      },
      {
        day: 4,
        title: 'Mañana Libre Editorial y Traslado Puntual de Despedida',
        description: 'Tiempo para cafés de especialidad y traslado privado al aeropuerto.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000206',
        startDate: '2026-12-18T12:00:00Z',
        endDate: '2026-12-21T22:00:00Z',
        price: '1480.00',
        currency: 'PEN',
        capacity: 12,
        available: 6,
      },
      {
        id: '00000000-0000-4000-8000-000000000207',
        startDate: '2026-12-26T12:00:00Z',
        endDate: '2026-12-29T22:00:00Z',
        price: '1540.00',
        currency: 'PEN',
        capacity: 12,
        available: 10,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000106',
    type: 'package',
    name: 'Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D/2N',
    destinationHint: 'Ayacucho',
    categoryHint: 'Cultura & Paisaje',
    badgeHint: '-12% Temporada',
    nextDepartureHint: '9 cupos disponibles',
    description:
      'Tres jornadas equilibradas entre arte virreinal, pozas naturales color turquesa en Circamarca y arquitectura imperial inca, ideal para vincular con cualquiera de los 9 hoteles aliados de DM GO TRAVEL en Ayacucho.',
    price: '590.00',
    originalPriceHint: '670.00',
    currency: 'PEN',
    durationDays: 3,
    images: [
      { id: 'img-pa-1', url: PERU_ASSETS.ayacucho, isPrimary: true, version: 1 },
      { id: 'img-pa-2', url: PERU_ASSETS.ayacuchoAlt, isPrimary: false, version: 1 },
      { id: 'img-pa-3', url: PERU_ASSETS.hotels.sumaqPlaza, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Traslados aeropuerto/terminal incluidos.',
      'Compatible con reserva compuesta de hotel aliado en Ayacucho (Spec 007).',
    ],
    itinerary: [
      { day: 1, title: 'Recepción en Huamanga, Ruta Colonial, Wari y Quinua', description: 'Bienvenida y patrimonio histórico.' },
      { day: 2, title: 'Cañón de Circamarca y Pozas Turquesas de Millpu', description: 'Senderismo paisajístico y almuerzo regional.' },
      { day: 3, title: 'Vilcashuamán, Pumaqocha y Retorno', description: 'Cierre arqueológico y traslado de salida.' },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000208',
        startDate: '2026-12-18T12:00:00Z',
        endDate: '2026-12-20T23:00:00Z',
        price: '590.00',
        currency: 'PEN',
        capacity: 16,
        available: 9,
      },
    ],
  },
];

// ============================================================================
// Catálogo Real de Hoteles en Ayacucho — DM GO TRAVEL (Spec 007)
// UUIDs sincronizados 1:1 con DevelopmentDataSeeder.cs en el backend .NET 10
// ============================================================================

const RAW_DMGO_AYACUCHO_HOTELS: HotelPublicDetailDto[] = [
  {
    id: '00000000-0000-4000-8007-000000000101',
    name: 'Hotel Internazionale (Hotel - Restaurant)',
    destinationHint: 'Ayacucho',
    starsHint: 3,
    categoryHint: '3 estrellas · Hotel - Restaurant',
    locationHint: 'Jr. José Olaya N° 588, Emadi — Ayacucho',
    proximityHint: 'A 10 min de la Plaza Mayor',
    checkInHint: '1:00 pm',
    checkOutHint: '12:00 pm',
    description:
      'Categoría: 3 estrellas · Hotel - Restaurant. Ubicación: A 10 minutos de la Plaza Mayor de Ayacucho — Jr. José Olaya N° 588, Emadi. Horarios: Check-in 1:00 pm | Check-out 12:00 pm.',
    services: [
      'Desayuno Buffet (7:00 am - 9:00 am)',
      'Bebidas calientes en el primer nivel',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 50"',
      'Escritorio y ropero',
      'Cochera',
      'Cafetería y restaurante',
      'Ascensor',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000101', url: PERU_ASSETS.hotels.internazionale, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000101', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000101', url: PERU_ASSETS.hotels.roomDoble, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000101', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '100.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8701-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '100.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '110.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000003',
        name: 'Hab. Matrimonial Queen',
        capacity: 2,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000003', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000004',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000004', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000005',
        name: 'Hab. Triple',
        capacity: 3,
        basePrice: '150.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000005', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000006',
        name: 'Hab. Triple (4 pers.)',
        capacity: 4,
        basePrice: '190.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000006', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000007',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '200.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000007', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8701-000000000008',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '240.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8721-000000000008', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000102',
    name: 'Hotel Sumaq Plaza',
    destinationHint: 'Ayacucho',
    categoryHint: 'Eco-amigable · Pet Friendly',
    locationHint: 'Centro Histórico — A pocos pasos de la Plaza Mayor de Ayacucho',
    proximityHint: 'A pasos de la Plaza Mayor',
    checkInHint: '11:00 am',
    checkOutHint: '11:00 am',
    description:
      'Ambiente eco-amigable y decoración típica de la zona. Ubicación: A pocos pasos de la Plaza Mayor de Ayacucho. Horarios: Check-in 11:00 am | Check-out 11:00 am.',
    services: [
      'Desayuno a la carta (7:00 am - 9:00 am)',
      'Bebidas calientes',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 50"',
      'Escritorio y ropero',
      'Friobar y microondas',
      'Hotel Pet Friendly',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000102', url: PERU_ASSETS.hotels.sumaqPlaza, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000102', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000102', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000102', url: PERU_ASSETS.ayacucho, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '100.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8702-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '100.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '120.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000003',
        name: 'Hab. Matrimonial King',
        capacity: 2,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000003', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000004',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000004', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000005',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000005', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000006',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '180.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000006', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8702-000000000007',
        name: 'Hab. Triple (4 pers.)',
        capacity: 4,
        basePrice: '200.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8722-000000000007', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000103',
    name: 'Hotel Rivera',
    destinationHint: 'Ayacucho',
    starsHint: 2,
    categoryHint: '2 estrellas · Tradición Urbana',
    locationHint: 'Jr. Callao N° 316, Ayacucho',
    proximityHint: 'A 2 cuadras de la Plaza Mayor',
    checkInHint: '12:00 pm',
    checkOutHint: '12:00 pm',
    description:
      'Categoría: 2 estrellas. Ubicación: A 2 cuadras de la Plaza Mayor de Ayacucho — Jr. Callao N° 316, Ayacucho. Horarios: Check-in 12:00 pm | Check-out 12:00 pm.',
    services: [
      'Desayuno americano - continental (7:00 am - 9:00 am)',
      'Bebidas calientes en el primer nivel',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 50"',
      'Escritorio y ropero',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000103', url: PERU_ASSETS.hotels.rivera, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000103', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000103', url: PERU_ASSETS.hotels.roomDoble, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000103', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '130.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8703-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '180.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '200.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000005',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '220.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000005', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000006',
        name: 'Hab. Triple',
        capacity: 3,
        basePrice: '220.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000006', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8703-000000000007',
        name: 'Hab. Triple (4 pers.)',
        capacity: 4,
        basePrice: '240.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8723-000000000007', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000104',
    name: 'Hotel Condeduque',
    destinationHint: 'Ayacucho',
    categoryHint: 'Arquitectura Colonial',
    locationHint: 'Jr. Asamblea N° 159, Ayacucho',
    proximityHint: 'A media cuadra de la Plaza Mayor',
    checkInHint: '12:00 pm',
    checkOutHint: '12:00 pm',
    description:
      'Combina lo colonial en sus instalaciones. Ubicación: A media cuadra de la Plaza Mayor de Ayacucho — Jr. Asamblea N° 159. Horarios: Check-in 12:00 pm | Check-out 12:00 pm.',
    services: [
      'Desayuno americano - continental (7:00 am - 9:00 am)',
      'Bebidas calientes en el primer nivel',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 45"',
      'Escritorio y ropero',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000104', url: PERU_ASSETS.hotels.condeduque, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000104', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000104', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000104', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '110.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8704-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '110.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8724-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8704-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8724-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8704-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8724-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8704-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '210.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8724-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8704-000000000005',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '230.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8724-000000000005', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000105',
    name: 'Hotel Samary (Hotel & Apartment)',
    destinationHint: 'Ayacucho',
    categoryHint: 'Hotel & Apartment · Moderno',
    locationHint: 'Jr. Callao N° 335, Ayacucho',
    proximityHint: 'A 2 cuadras de la Plaza Mayor',
    checkInHint: '12:00 pm',
    checkOutHint: '11:00 am',
    breakfastPartnerHint: 'Hotel Sumaq Plaza',
    description:
      'Combina lo moderno en sus instalaciones (Hotel & Apartment). Ubicación: A 2 cuadras de la Plaza Mayor de Ayacucho — Jr. Callao N° 335. Horarios: Check-in 12:00 pm | Check-out 11:00 am.',
    services: [
      'Desayuno servido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 50" con Disney+',
      'Escritorio y ropero',
      'Cochera',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000105', url: PERU_ASSETS.hotels.samary, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000105', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000105', url: PERU_ASSETS.hotels.roomDoble, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000105', url: PERU_ASSETS.hotels.sumaqPlaza, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '80.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8705-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '80.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8725-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8705-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '100.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8725-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8705-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '110.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8725-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8705-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8725-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000106',
    name: 'Hotel Continental',
    destinationHint: 'Ayacucho',
    starsHint: 2,
    categoryHint: '2 estrellas · Corte Moderno',
    locationHint: 'Jr. Carlos F. Vivanco N° 475, Ayacucho',
    proximityHint: 'A 3 cuadras de la Plaza Mayor',
    checkInHint: '12:00 pm',
    checkOutHint: '11:00 am',
    breakfastPartnerHint: 'Hotel Sumaq Plaza',
    description:
      'Categoría: 2 estrellas · Combina lo moderno en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. Carlos F. Vivanco N° 475. Horarios: Check-in 12:00 pm | Check-out 11:00 am.',
    services: [
      'Desayuno atendido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 45"',
      'Escritorio y ropero',
      'Cafetería',
      'Ascensor',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000106', url: PERU_ASSETS.hotels.continental, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000106', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000106', url: PERU_ASSETS.hotels.roomDoble, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000106', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '80.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8706-000000000001',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '80.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000001', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8706-000000000002',
        name: 'Hab. Matrimonial Queen',
        capacity: 2,
        basePrice: '90.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000002', url: PERU_ASSETS.hotels.roomQueenKing, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8706-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '110.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8706-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8706-000000000005',
        name: 'Hab. Triple (3 pers.)',
        capacity: 3,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000005', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8706-000000000006',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '150.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8726-000000000006', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000107',
    name: 'Hotel El Libertador',
    destinationHint: 'Ayacucho',
    categoryHint: 'Estilo Colonial',
    locationHint: 'Jr. San Martín N° 324, Ayacucho',
    proximityHint: 'A 3 cuadras de la Plaza Mayor',
    checkInHint: '12:00 pm',
    checkOutHint: '11:00 am',
    breakfastPartnerHint: 'Hotel Sumaq Plaza',
    description:
      'Combina lo colonial en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. San Martín N° 324. Horarios: Check-in 12:00 pm | Check-out 11:00 am.',
    services: [
      'Desayuno atendido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 45"',
      'Escritorio y ropero',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000107', url: PERU_ASSETS.hotels.elLibertador, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000107', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000107', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000107', url: PERU_ASSETS.hotels.sumaqPlaza, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '80.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8707-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '80.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8727-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8707-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '100.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8727-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8707-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '120.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8727-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8707-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8727-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8707-000000000005',
        name: 'Hab. Doble (4 pers.)',
        capacity: 4,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8727-000000000005', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000108',
    name: 'Hotel Casa Rústica',
    destinationHint: 'Ayacucho',
    categoryHint: 'Casona Colonial Rústica',
    locationHint: 'Jr. San Martín N° 324, Ayacucho',
    proximityHint: 'A 3 cuadras de la Plaza Mayor',
    checkInHint: '1:00 pm',
    checkOutHint: '11:00 am',
    description:
      'Combina lo colonial en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. San Martín N° 324. Horarios: Check-in 1:00 pm | Check-out 11:00 am.',
    services: [
      'Desayuno americano - continental (7:00 am - 9:00 am)',
      'Bebidas calientes en el primer nivel',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 45"',
      'Escritorio y ropero',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000108', url: PERU_ASSETS.hotels.casaRustica, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000108', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000108', url: PERU_ASSETS.hotels.roomTriple, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000108', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '80.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8708-000000000001',
        name: 'Hab. Individual Sup.',
        capacity: 1,
        basePrice: '80.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8708-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '100.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8708-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8708-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '150.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8708-000000000005',
        name: 'Hab. Triple (3 pers.)',
        capacity: 3,
        basePrice: '150.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000005', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8708-000000000006',
        name: 'Hab. Triple (4 pers.)',
        capacity: 4,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8728-000000000006', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8007-000000000109',
    name: 'Hospedaje Santa Lucía',
    destinationHint: 'Ayacucho',
    starsHint: 2,
    categoryHint: 'Hostal 2 estrellas · Colonial',
    locationHint: 'Jr. Sol N° 140, Huamanga — Ayacucho',
    proximityHint: 'A 4 cuadras de la Plaza Mayor',
    checkInHint: '1:00 pm',
    checkOutHint: '11:00 am',
    description:
      'Categoría: Hostal 2 estrellas · Combina lo colonial en sus instalaciones. Ubicación: A 4 cuadras de la Plaza Mayor — Jr. Sol N° 140, Huamanga. Horarios: Check-in 1:00 pm | Check-out 11:00 am.',
    services: [
      'Desayuno americano - continental (7:00 am - 9:00 am)',
      'Wifi fibra óptica',
      'Baño privado y agua caliente',
      'TV Smart 45"',
      'Escritorio y ropero',
    ],
    images: [
      { id: '00000000-0000-4000-8710-000000000109', url: PERU_ASSETS.hotels.santaLucia, isPrimary: true, version: 1 },
      { id: '00000000-0000-4000-8711-000000000109', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8712-000000000109', url: PERU_ASSETS.hotels.roomDoble, isPrimary: false, version: 1 },
      { id: '00000000-0000-4000-8713-000000000109', url: PERU_ASSETS.hotels.desayuno, isPrimary: false, version: 1 },
    ],
    hasAvailability: true,
    lowestBasePrice: '80.00',
    roomTypes: [
      {
        id: '00000000-0000-4000-8709-000000000001',
        name: 'Hab. Individual',
        capacity: 1,
        basePrice: '80.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8729-000000000001', url: PERU_ASSETS.hotels.roomIndividual, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8709-000000000002',
        name: 'Hab. Matrimonial',
        capacity: 2,
        basePrice: '110.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8729-000000000002', url: PERU_ASSETS.hotels.roomMatrimonial, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8709-000000000003',
        name: 'Hab. Doble (2 pers.)',
        capacity: 2,
        basePrice: '130.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8729-000000000003', url: PERU_ASSETS.hotels.roomDoble, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8709-000000000004',
        name: 'Hab. Doble (3 pers.)',
        capacity: 3,
        basePrice: '140.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8729-000000000004', url: PERU_ASSETS.hotels.roomTriple, isPrimary: true, version: 1 }],
      },
      {
        id: '00000000-0000-4000-8709-000000000005',
        name: 'Hab. Triple (4 pers.)',
        capacity: 4,
        basePrice: '160.00',
        currency: 'PEN',
        images: [{ id: '00000000-0000-4000-8729-000000000005', url: PERU_ASSETS.hotels.roomFamiliar, isPrimary: true, version: 1 }],
      },
    ],
  },
];

export const SHOWCASE_HOTELS_DETAIL: HotelPublicDetailDto[] =
  sortHotelsAlphabetically(RAW_DMGO_AYACUCHO_HOTELS);

export const SHOWCASE_HOTELS: HotelPublicItemDto[] = SHOWCASE_HOTELS_DETAIL.map(
  ({ roomTypes: _rt, ...summary }) => summary
);

const LEGACY_PLACEHOLDER_HOTEL_NAMES = new Set([
  'hotel de ejemplo',
  'casa del valle & patio inca',
  'casona santa rosa de huamanga',
  'sillar & jardín boutique',
  'casa pacífico barranco',
  'hotel boutique santa rosa de huamanga',
  'andean sanctuary lodge urubamba',
  'posada colonial san cristóbal',
]);

/**
 * Garantiza que el catálogo público siempre incorpore los 9 hoteles reales de DM GO TRAVEL en Ayacucho
 * incluso cuando la base PostgreSQL local aún no haya sido reiniciada y solo devuelva hoteles previos.
 */
export function mergeWithOfficialDmGoHotels(
  apiItems: readonly HotelPublicItemDto[]
): HotelPublicItemDto[] {
  const cleanedApi = apiItems.filter(
    (item) => !LEGACY_PLACEHOLDER_HOTEL_NAMES.has(item.name.trim().toLowerCase())
  );

  const byId = new Set(cleanedApi.map((h) => h.id.toLowerCase()));
  const byName = new Set(cleanedApi.map((h) => h.name.trim().toLowerCase()));

  const enrichedApi = cleanedApi.map((item) => {
    const officialMatch = SHOWCASE_HOTELS.find(
      (o) =>
        o.id.toLowerCase() === item.id.toLowerCase() ||
        o.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    if (!officialMatch) return item;

    const validImages =
      item.images && item.images.length > 0
        ? item.images.length >= 3
          ? item.images
          : [
              ...item.images,
              ...officialMatch.images.filter(
                (fImg) => !item.images.some((cur) => cur.id === fImg.id)
              ),
            ]
        : officialMatch.images;

    return {
      ...officialMatch,
      ...item,
      images: validImages,
      lowestBasePrice: item.lowestBasePrice ?? officialMatch.lowestBasePrice,
    };
  });

  const missingOfficial = SHOWCASE_HOTELS.filter(
    (official) =>
      !byId.has(official.id.toLowerCase()) &&
      !byName.has(official.name.trim().toLowerCase())
  );

  return sortHotelsAlphabetically([...enrichedApi, ...missingOfficial]);
}

export function mergeWithOfficialDmGoAdminHotels(
  apiItems: readonly HotelAdminItemDto[]
): HotelAdminItemDto[] {
  const cleanedApi = apiItems.filter(
    (item) => !LEGACY_PLACEHOLDER_HOTEL_NAMES.has(item.name.trim().toLowerCase())
  );
  const byId = new Set(cleanedApi.map((h) => h.id.toLowerCase()));
  const byName = new Set(cleanedApi.map((h) => h.name.trim().toLowerCase()));

  const missingOfficial: HotelAdminItemDto[] = SHOWCASE_HOTELS_DETAIL.filter(
    (official) =>
      !byId.has(official.id.toLowerCase()) &&
      !byName.has(official.name.trim().toLowerCase())
  ).map((h) => ({
    id: h.id,
    name: h.name,
    status: 'active',
    version: 1,
    updatedAt: '2026-11-25T00:00:00Z',
  }));

  return sortHotelsAlphabetically([...cleanedApi, ...missingOfficial]);
}

export const SHOWCASE_MOBILITY: MobilityPublicItemDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000401',
    name: 'Mercedes-Benz Sprinter Panorámica Andina',
    vehicleTypeHint: 'Minibús Turístico de Alta Montaña',
    description:
      'Butacas reclinables anatómicas con cinturón de tres puntos, balón de oxígeno medicinal certificado, botiquín de altura, climatización bi-zona y telemetría GPS 24/7.',
    capacity: 19,
    image: { id: 'm1', url: PERU_ASSETS.peruHeroAlt, isPrimary: true, version: 1 },
  },
  {
    id: '00000000-0000-4000-8000-000000000402',
    name: 'Van Ejecutiva Privada H1 Confort',
    vehicleTypeHint: 'Traslados Privados & Grupos Reducidos',
    description:
      'Unidad silenciosa para recepciones aeroportuarias y rutas privadas por el Valle Sagrado o Huamanga. Equipada con puertos de carga USB y SOAT turístico nacional.',
    capacity: 10,
    image: { id: 'm2', url: PERU_ASSETS.arequipa, isPrimary: true, version: 1 },
  },
  {
    id: '00000000-0000-4000-8000-000000000403',
    name: 'Crucero Turístico Scania Irizar i6',
    vehicleTypeHint: 'Gran Capacidad · Circuitos Multidía',
    description:
      'Estabilidad superior en rutas interandinas, asientos semi-cama 140°, cabina insonorizada, audio dedicado para Guía Oficial DIRCETUR y freno hidrodinámico.',
    capacity: 36,
    image: { id: 'm3', url: PERU_ASSETS.colca, isPrimary: true, version: 1 },
  },
];

export function asCatalogSummary(detail: CatalogOfferDetailDto): CatalogOfferDto {
  return {
    id: detail.id,
    type: detail.type,
    name: detail.name,
    description: detail.description,
    price: detail.price,
    currency: detail.currency,
    durationDays: detail.durationDays,
    images: detail.images,
    conditions: detail.conditions,
    originalPriceHint: detail.originalPriceHint,
    badgeHint: detail.badgeHint,
    nextDepartureHint: detail.nextDepartureHint,
    destinationHint: detail.destinationHint,
    categoryHint: detail.categoryHint,
  };
}
