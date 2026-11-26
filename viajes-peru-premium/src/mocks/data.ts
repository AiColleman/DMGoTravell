import type { AuditLog, Hotel, Payment, Reservation, Tour, User } from '@/types/domain';
import peruHero from '@/assets/peru-hero.webp';
import cusco from '@/assets/cusco.webp';
import ayacucho from '@/assets/ayacucho.webp';
import arequipa from '@/assets/arequipa.webp';
import lima from '@/assets/lima.webp';
import colca from '@/assets/colca.webp';
import hotel from '@/assets/hotel.jpg';

export const media = { peru: peruHero, cusco, ayacucho, arequipa, lima, colca, hotel };

function demoDate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function departures(price: number) {
  return [
    { id: crypto.randomUUID(), date: demoDate(18), available: 12, price },
    { id: crypto.randomUUID(), date: demoDate(32), available: 8, price },
    { id: crypto.randomUUID(), date: demoDate(46), available: 16, price },
  ];
}

const standardRecommendations = [
  'Consulta las condiciones definitivas del operador antes de contratar.',
  'Considera ropa cómoda, agua y protección solar según el destino.',
];

export const tours: Tour[] = [
  {
    id: 'machu-picchu', title: 'Machu Picchu y Valle Sagrado', destination: 'Cusco', category: 'Cultural',
    duration: '2 días · 1 noche', days: 2, price: 890, image: cusco, gallery: [cusco, peruHero], badge: 'Patrimonio',
    active: true,
    description: 'Una propuesta para conocer el paisaje andino y el patrimonio inca de Cusco, con tiempo para apreciar cada parada.',
    departures: departures(890),
    itinerary: [
      { day: 1, title: 'Valle Sagrado', description: 'Recorrido orientativo por el valle y sus espacios culturales.' },
      { day: 2, title: 'Machu Picchu', description: 'Jornada dedicada a la ciudadela y retorno según el programa oficial.' },
    ],
    includes: ['Servicios descritos en el programa de demostración.'],
    excludes: ['Alojamiento adicional y gastos no especificados.'],
    recommendations: ['Consulta los requisitos de ingreso y documentos necesarios antes del viaje.', ...standardRecommendations],
  },
  {
    id: 'ayacucho', title: 'Huamanga: arte, historia y tradición', destination: 'Ayacucho', category: 'Cultural',
    duration: 'Full day', days: 1, price: 180, image: ayacucho, gallery: [ayacucho], badge: 'Identidad local', active: true,
    description: 'Un recorrido de demostración por la arquitectura, el arte y la memoria cultural de Huamanga.',
    departures: departures(180),
    itinerary: [{ day: 1, title: 'Huamanga y su patrimonio', description: 'Propuesta de recorrido urbano y cultural, sujeta a validación del operador.' }],
    includes: ['Recorrido cultural de demostración.'], excludes: ['Alimentación y gastos personales.'], recommendations: standardRecommendations,
  },
  {
    id: 'colca', title: 'Valle del Colca y paisaje andino', destination: 'Arequipa', category: 'Naturaleza',
    duration: '2 días · 1 noche', days: 2, price: 420, image: colca, gallery: [colca, arequipa], badge: 'Naturaleza', active: true,
    description: 'Una escapada para contemplar el valle del Colca, sus terrazas y el entorno natural de Arequipa.',
    departures: departures(420),
    itinerary: [
      { day: 1, title: 'Camino al valle', description: 'Desplazamiento y paradas paisajistas de demostración.' },
      { day: 2, title: 'Miradores del Colca', description: 'Tiempo para apreciar el valle antes del retorno.' },
    ],
    includes: ['Programa turístico de demostración.'], excludes: ['Servicios no detallados en el programa oficial.'], recommendations: standardRecommendations,
  },
  {
    id: 'valle-sagrado', title: 'Valle Sagrado a tu ritmo', destination: 'Cusco', category: 'Aventura',
    duration: 'Full day', days: 1, price: 260, image: peruHero, gallery: [peruHero, cusco], active: true,
    description: 'Una jornada entre paisajes andinos y patrimonio cultural para descubrir el Valle Sagrado.',
    departures: departures(260),
    itinerary: [{ day: 1, title: 'Ruta por el Valle Sagrado', description: 'Secuencia de visitas referencial, sin horarios operativos confirmados.' }],
    includes: ['Recorrido de demostración.'], excludes: ['Alojamiento y gastos personales.'], recommendations: standardRecommendations,
  },
  {
    id: 'sabores-lima', title: 'Lima: cultura y sabores', destination: 'Lima', category: 'Gastronomía',
    duration: 'Medio día', days: 1, price: 210, image: lima, gallery: [lima], active: true,
    description: 'Una propuesta urbana para acercarse a la diversidad cultural y gastronómica de la capital peruana.',
    departures: departures(210),
    itinerary: [{ day: 1, title: 'Recorrido por Lima', description: 'Experiencia urbana de demostración con paradas por definir.' }],
    includes: ['Experiencia de demostración.'], excludes: ['Consumos no indicados y gastos personales.'], recommendations: standardRecommendations,
  },
  {
    id: 'vilcashuaman', title: 'Vilcashuamán y memoria inca', destination: 'Ayacucho', category: 'Aventura',
    duration: 'Full day', days: 1, price: 195, image: ayacucho, gallery: [ayacucho], active: true,
    description: 'Una ruta de demostración hacia el patrimonio arqueológico y los paisajes del sur de Ayacucho.',
    departures: departures(195),
    itinerary: [{ day: 1, title: 'Ruta a Vilcashuamán', description: 'Recorrido referencial por el patrimonio de la región.' }],
    includes: ['Programa de demostración.'], excludes: ['Alimentación y gastos personales.'], recommendations: standardRecommendations,
  },
];

export const hotels: Hotel[] = [
  {
    id: 'casa-valle', name: 'Casa del Valle', destination: 'Cusco', category: 4, image: hotel, price: 280, active: true,
    description: 'Concepto de alojamiento boutique para complementar una experiencia en Cusco. Nombre, fotografía y servicios son ilustrativos.',
    services: ['Wi-Fi', 'Desayuno', 'Restaurante', 'Recepción'],
    rooms: [{ id: 'doble', name: 'Doble superior', capacity: 2, price: 280, inventory: 6 }, { id: 'suite', name: 'Suite', capacity: 3, price: 420, inventory: 3 }],
  },
  {
    id: 'casona-huamanga', name: 'Casona de Huamanga', destination: 'Ayacucho', category: 3, image: hotel, price: 180, active: true,
    description: 'Concepto de casona de descanso para una escapada cultural. Información completamente demostrativa.',
    services: ['Wi-Fi', 'Desayuno', 'Patio', 'Recepción'],
    rooms: [{ id: 'doble', name: 'Doble estándar', capacity: 2, price: 180, inventory: 8 }, { id: 'familiar', name: 'Familiar', capacity: 4, price: 290, inventory: 4 }],
  },
  {
    id: 'sillar-jardin', name: 'Sillar & Jardín', destination: 'Arequipa', category: 4, image: hotel, price: 240, active: true,
    description: 'Concepto de alojamiento sereno inspirado en la arquitectura de Arequipa. Datos no comerciales.',
    services: ['Wi-Fi', 'Desayuno', 'Jardín', 'Restaurante'],
    rooms: [{ id: 'doble', name: 'Doble jardín', capacity: 2, price: 240, inventory: 5 }],
  },
  {
    id: 'pacifico-urbano', name: 'Pacífico Urbano', destination: 'Lima', category: 3, image: hotel, price: 220, active: true,
    description: 'Concepto de alojamiento urbano para complementar una visita a Lima. Datos no comerciales.',
    services: ['Wi-Fi', 'Gimnasio', 'Desayuno', 'Recepción'],
    rooms: [{ id: 'doble', name: 'Doble urbana', capacity: 2, price: 220, inventory: 9 }],
  },
];

export const demoUser: User = { id: 'u1', name: 'Valeria', lastName: 'Quispe', email: 'cliente@demo.dmgotravel.test', phone: '', role: 'customer', active: true };
export const customers: User[] = [
  demoUser,
  { id: 'u2', name: 'Diego', lastName: 'Torres', email: 'diego@demo.dmgotravel.test', phone: '', role: 'customer', active: true },
  { id: 'u3', name: 'Lucía', lastName: 'Ramos', email: 'lucia@demo.dmgotravel.test', phone: '', role: 'customer', active: false },
];

export const reservations: Reservation[] = [
  { id: 'r1', code: 'DMG-DEMO-001', userId: 'u1', tourId: 'machu-picchu', status: 'confirmed', date: demoDate(18), travelers: 2, items: [{ type: 'tour', name: tours[0]!.title, quantity: 2, unitPrice: 890, total: 1780 }], total: 1780, createdAt: demoDate(-4) },
  { id: 'r2', code: 'DMG-DEMO-002', userId: 'u1', tourId: 'ayacucho', status: 'pending', date: demoDate(32), travelers: 2, items: [{ type: 'tour', name: tours[1]!.title, quantity: 2, unitPrice: 180, total: 360 }], total: 360, createdAt: demoDate(-2) },
  { id: 'r3', code: 'DMG-DEMO-003', userId: 'u1', tourId: 'colca', status: 'completed', date: demoDate(-35), travelers: 1, items: [{ type: 'tour', name: tours[2]!.title, quantity: 1, unitPrice: 420, total: 420 }], total: 420, createdAt: demoDate(-45) },
  { id: 'r4', code: 'DMG-DEMO-004', userId: 'u2', tourId: 'sabores-lima', status: 'cancelled', date: demoDate(-15), travelers: 2, items: [{ type: 'tour', name: tours[4]!.title, quantity: 2, unitPrice: 210, total: 420 }], total: 420, createdAt: demoDate(-22) },
];

export const payments: Payment[] = ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'].map((status, index) => ({
  id: `p${index + 1}`, reservationId: reservations[index % 4]!.id, status: status as Payment['status'],
  amount: reservations[index % 4]!.total, externalReference: `REFERENCIA-DEMO-${1001 + index}`, date: `${demoDate(-index - 1)}T14:30:00Z`,
}));

export const auditLogs: AuditLog[] = [
  { id: 'a1', actor: 'Operador demo', action: 'Contenido actualizado', entity: 'Tour', entityId: 'ayacucho', date: `${demoDate(-1)}T01:20:00Z` },
  { id: 'a2', actor: 'Sistema demo', action: 'Evento de pago registrado', entity: 'Payment', entityId: 'p3', date: `${demoDate(-2)}T18:15:00Z` },
  { id: 'a3', actor: 'Cliente demo', action: 'Reserva creada', entity: 'Reservation', entityId: 'r2', date: `${demoDate(-2)}T14:30:00Z` },
  { id: 'a4', actor: 'Operador demo', action: 'Inventario actualizado', entity: 'Hotel', entityId: 'casona-huamanga', date: `${demoDate(-3)}T10:00:00Z` },
];
