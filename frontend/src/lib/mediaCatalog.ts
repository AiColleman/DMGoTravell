import type {
  CatalogOfferDetailDto,
  CatalogOfferDto,
  HotelPublicItemDto,
  MobilityPublicItemDto,
} from '../types/api';

/**
 * Fotografías editoriales generadas en nuestro proyecto Stitch Enterprise Pro Plus
 * y respaldos curados de los Andes peruanos para ofertas de desarrollo cuyo URL sea *.example.test.
 */
export const STITCH_MEDIA = {
  millpu:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDmvm-3OklMOHOkhXLAS3lK7FEuOW7rqDh34hgKHsJKSNpGYk6zXZbKUvG97NS2DLz7zulwg_-LZq0reK4-GwZv5RrF8dJstVz4o6OPtf9yRSHoBCGGM7XaqFd5hPYbIuUacaGnPw_acqT5hCcdK9XKRd-TknUG9cW6jf9klkG8znPjqPITTLZdkgHztRdmmVz6uZGuJwqWFSF8hy8ShzM3cmdQpDcpErrGM7DFbPKC5YKM44Fd-GzAeShdt2lnCbs',
  huamanga:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDNEcMYEJNisKJ-ecHtliOtUIzyLD6ZkNoFBvysynfT5KFK-JzkRS2VCJwsY9RATm3J6N6oFgLUnoWXS3_wnRSmgIjtBrRImT7PO6-MyB4t0-p2PKknGkgyewWYWYTE-wC3Y9s8QdlA0DnKS8rPn2IWxEhQqF-fvjREfprDu4scmuNMbS_tCiccLvSlMjdtqx7LL8zrPVpiCufUOQxxxTBksd_I9VyUfi5CyWIGxlTYefFPcNkzKqMMhW7JAbIwXU',
  qorihuillca:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDd5i-Gup2cWdE6zdHZ3NyZbpWJx7mrKI7h03FhMl8Avuet0HrydTUSqvfL6adsmwPCOVNm6Iuzs7T4nN11-YTp30putY51_lCzB17hCb4JlbTbky3WrqA6ByWlTjYm-gpj2ltEPaHfNa2TZ8fqQr5mSyePNRl-JEhPM2BJNSkA5OyMeRDYQVeR86DRRGKHivZzBuRe9ORvGeg1lhBGxK2ojMnjJn1iLZBRo930FBDmrYHHDApgA3NGioazDtsNIQQ',
  vilcashuaman:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBwM0k76meZtnDnKPLiPTF4Itr4e2bMUy2fGk2-fhnJ8hrELPo2qmZ25SrU9YTgyQKvDA5v7eAlSEBsMq504aQne2UZkLuemJKq1xyV55_Cjll6Nm7ZXwwrSBWuxZWe3y8HG2dASuogqaFsdqWBRL27R3Lf6jkO77q0slVtb5_gogsfTzWUU3NJFO22e1e87O71_QWwuaOzOZWtMj3JMUWGZTNdsGgzJV56E3er7RzpNzBUFZ9rgzhYfRiVJmzoU1I',
  machuPicchu:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBi2jM3R1xHwx4_oo-7PUZXkXhsIP1akfmYfp1eLbj-iXyUKGY_Uxa4IW0vqtsQp1Lb13iewvJXoyzXbGCM5qUBBrkc-97c6ctfXWM62_VNuDYcyK_cNdPM8gSv6qjpK4mOfOLZnLAhw1v8n6l6ropKmRcPbgdEvsqXCTEaMQa64igXs1p3NT75BmpfHuCp_tHB9mdaHYok53wFkyd0Mnk3dMcjvhFVu32r_ryZjXuTAqz0iEsP4R1XJ-cSvxTx1H4',
  trekkingLagoon:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAzl7WTov75BH_ztOYs30OiS2spg3IIS2usVEFf6mvnLZr9FfgGWf2YLMq7vd8DimUpaAqlxJW-7xcf9ycbh000qrq94EWbXs2dPkOkwANqLDXAqVk9tNOf8xRjnaExKLDX7c2EmwsFCt2fDhaS3j7C24-vXHen5eKwPpBO6s6w3WlBoTea8As663B7Xdc0czxSeTzxAhXeDTYcqJDbeKcoOBCjjQXC6tkkLEzZuL_cauXgZ0iQLep2rJVUeteeHLY',
  hotelCourtyard:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA0e_ZyOEfGvW2AATZzBiHcFRnPyw2fslVHmfiA4MDPR70wKCZRCABP3DNczB88VyDChQArgV1jsi1kvChGqyK6TWGfKbtpG7YytSonNuMNN9_Ge1psGRVWfb7vxaguLCQlNH021ZZHh7cU-zyUQp2W52DD_D8up23tujInPypaTqmnkAMwzFxsg0Grqvcd7JRIv4RRropeUZcYAHQhd2Wy2RxfGXARnTOzMxk0UiWuhmivscMsW4lJ2-tQNaCGi2M',
  hotelSuite:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBP7_LyvF04b2xtp5ISFLWlorToOx1UfYsj6l3UhpoL-vUz7ranzyWUhTwdOhjgD_MjgZD6LmsJ5D-TqnQykUYmguGULHxLhiN7c03BBGDFeYweZzk0jvt_IZ0cbQf4igHjwWRxMXiLP8xKBykL3p9IucKlZec4P9VKnuaojP--JQpLssv8v6ji-JbPUK8X3ffe7AajmIf7DSwSSVW65Un5QkpUVJDfGdfWFhtABvQuNJqZGZrZp6-92v25561P1HU',
  hotelUrubamba:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBAPErBLduc877qvAnsTounZngm194VYx1yDAQTrLm3Hm5k5UkvL4swz4GEViugxD1Tk4WS8wUwspn97CrLLzOfGEOtuaRR9V1WkXhc8trusc46L_IXhMQpoNPHDFq63QUXKtXWZEkAyLqIPWltpXo2XmFwDJeUpLmTzocS_vVHScX0d8y9pDSbouKzNnQMZUX8rwZyXOXwYN8Vg5XCL5mUUsiTqVb_ZKXRjb2AIfPcYLdPhBSz5HhcLlB1bCttCNI',
  sprinterVip:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCJhEcIUNFAKWNdeak2IPUkGjHm-fi2rb7RZFVo2oqBEs-4TkSfRTtEoskDJ2UFxKRZSF_Aep14_gWY6FAMMPeIS8zvj7ARJLwcgyikMEwAScsQIr7TBjoFLIucRDpuInf42Xn-4id45TVVBbK-vfKhfih0FhvsJdukSeHjR-3Ab7sFrYvXLDc9owP9dNbFtCY-3Jzz_1o_SeJF_YSotQ2c2g36IM5SbffoMrYgsqBBN8B5HYAyH0BDPzG6kIwvoTs',
  vanEjecutiva:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCvLNTxTkD7CpVlhAieLVFsOBPI0Nn2xCi9-1m0ZFj5APUFbW7TCnT_92pNzgxbio9DFxGwUu7GnVvcHfdqCZSCgHcggUkzBpeu0aEwnCadB9eaE9qJOwwquAxtbVrr_jbprNvVBzVRmJALdR-xBLvlzSBf2ZMMah6GEwYtxMyps5ypbX8wx23gVkasqtEilyvxQdCchy3h4DnyHv_KoSddu8_TEvfkzEY41oqEduEJwWdGTMsItpymPDbPfPU6GKQ',
  busCrucero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBzErNvp9Sk5zmA7t60onRUGSqHgBGhk4cGNt2U6v_JIwT42ND22mYt-qfkJx4A--lasBkX6QBLzrztXTnE9IWf995Q3fqV-5l69b0ESlaxnsCztD9kzndp6-bgB5Y_KdO5ceYHNJeSHlArpRWLXTHA9YhOTpq9cX9TkTtl9pS4Hl89f5HFFIJcRgY2vcjgzCymU__YbJyBulKOmfMoEJOxBwnFSOZQ4aeHi3C0Mod-eDGWEhqOo1NAiSgTfrFhxyo',
};

const OFFER_IMAGE_POOL = [
  STITCH_MEDIA.millpu,
  STITCH_MEDIA.huamanga,
  STITCH_MEDIA.qorihuillca,
  STITCH_MEDIA.vilcashuaman,
  STITCH_MEDIA.machuPicchu,
  STITCH_MEDIA.trekkingLagoon,
];

export function resolveMediaUrl(
  rawUrl: string | null | undefined,
  category: 'tour' | 'package' | 'hotel' | 'room' | 'mobility' = 'tour',
  seedIndex = 0
): string {
  // Si el activo real fue subido al endpoint /api/v1/media/{guid}, úsalo directamente
  if (rawUrl && !rawUrl.includes('example.test')) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    if (rawUrl.startsWith('/')) {
      return `${apiBase}${rawUrl}`;
    }
    return rawUrl;
  }

  if (category === 'hotel') {
    const hotels = [STITCH_MEDIA.hotelCourtyard, STITCH_MEDIA.hotelUrubamba, STITCH_MEDIA.hotelSuite];
    return hotels[Math.abs(seedIndex) % hotels.length];
  }
  if (category === 'room') {
    return STITCH_MEDIA.hotelSuite;
  }
  if (category === 'mobility') {
    const fleet = [STITCH_MEDIA.sprinterVip, STITCH_MEDIA.vanEjecutiva, STITCH_MEDIA.busCrucero];
    return fleet[Math.abs(seedIndex) % fleet.length];
  }
  if (category === 'package') {
    const pkgs = [STITCH_MEDIA.huamanga, STITCH_MEDIA.machuPicchu, STITCH_MEDIA.vilcashuaman];
    return pkgs[Math.abs(seedIndex) % pkgs.length];
  }

  return OFFER_IMAGE_POOL[Math.abs(seedIndex) % OFFER_IMAGE_POOL.length];
}

/**
 * Datos curados de respaldo visual únicamente para el modo sin conexión local
 * (cuando la API ASP.NET Core aún no ha sido iniciada).
 */
export const SHOWCASE_TOURS: CatalogOfferDetailDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    type: 'tour',
    name: 'Aguas Turquesas de Millpu & Mirador de Cóndores',
    description:
      'Recorre las veinte piscinas naturales escalonadas de color turquesa en el cañón de Circamarca (Huancaraylla), con caminata guiada segura, oxígeno medicinal en ruta y degustación de trucha andina.',
    price: '119.00',
    originalPriceHint: '140.00',
    badgeHint: '-15% OFF',
    nextDepartureHint: 'Próxima salida · 14 cupos disponibles',
    currency: 'PEN',
    durationDays: 1,
    images: [
      { id: '1', url: STITCH_MEDIA.millpu, isPrimary: true, version: 1 },
      { id: '2', url: STITCH_MEDIA.qorihuillca, isPrimary: false, version: 1 },
      { id: '3', url: STITCH_MEDIA.vilcashuaman, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Sujeto a disponibilidad de cupos verificados transaccionalmente.',
      'Altitud máxima 3,600 m s. n. m. Unidad equipada con balón de oxígeno medicinal.',
      'Precios congelados mediante snapshot histórico al crear tu reserva.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Salida de Huamanga, Cañón de Millpu, Pozas Turquesas y Retorno',
        description:
          '06:00 Partida desde Plaza Mayor de Huamanga en Sprinter VIP · 09:30 Caminata interpretativa por las pozas naturales y cascadas de Pumapaqcha · 13:30 Almuerzo regional de trucha · 18:30 Arribo a Ayacucho.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000201',
        startDate: '2026-12-15T11:00:00Z',
        endDate: '2026-12-15T23:30:00Z',
        price: '119.00',
        currency: 'PEN',
        capacity: 18,
        available: 14,
      },
      {
        id: '00000000-0000-4000-8000-000000000202',
        startDate: '2026-12-20T11:00:00Z',
        endDate: '2026-12-20T23:30:00Z',
        price: '129.00',
        currency: 'PEN',
        capacity: 18,
        available: 9,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    type: 'tour',
    name: 'Cañón Secreto de Qorihuillca & Ruta Artesanal Wari',
    description:
      'Aventura fotográfica cruzando las grietas rojizas de roca volcánica de Qorihuillca combinada con visita a la capital imperial Wari y talleres maestros de piedra de Huamanga en Quinua.',
    price: '95.00',
    nextDepartureHint: 'Salidas semanales · 12 cupos libres',
    currency: 'PEN',
    durationDays: 1,
    images: [{ id: '4', url: STITCH_MEDIA.qorihuillca, isPrimary: true, version: 1 }],
    conditions: [
      'Incluye cascos homologados, linternas frontales y guía oficial DIRCETUR.',
      'Cancelación sin cargo mientras la reserva permanezca en estado Pendiente.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Laberinto de Qorihuillca, Complejo Wari y Pueblo Histórico de Quinua',
        description:
          '08:00 Ingreso con equipo de seguridad al cañón · 12:00 Museo de sitio Wari · 15:00 Santuario Histórico de la Pampa de Ayacucho y talleres ceramistas.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000203',
        startDate: '2026-12-16T13:00:00Z',
        endDate: '2026-12-16T22:00:00Z',
        price: '95.00',
        currency: 'PEN',
        capacity: 16,
        available: 12,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    type: 'tour',
    name: 'Santuario Inca de Vilcashuamán, Intihuatana & Puyas de Raimondi',
    description:
      'Explora el centro administrativo más imponente del Tahuantinsuyo en Ayacucho: el Ushnu ceremonial de cinco plataformas, el Templo del Sol y el bosque milenario de titankas.',
    price: '135.00',
    originalPriceHint: '150.00',
    badgeHint: '-10% OFF',
    nextDepartureHint: 'Salida Sábado · 10 cupos libres',
    currency: 'PEN',
    durationDays: 1,
    images: [{ id: '5', url: STITCH_MEDIA.vilcashuaman, isPrimary: true, version: 1 }],
    conditions: ['Incluye boleto turístico arqueológico y movilidad climatizada.'],
    itinerary: [
      {
        day: 1,
        title: 'Bosque de Puyas en Vischongo, Laguna Pumaqocha y Ciudadela de Vilcashuamán',
        description:
          'Recorrido cultural completo de día entero con paradas fotográficas en Intihuatana y el Ushnu imperial.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000204',
        startDate: '2026-12-19T11:00:00Z',
        endDate: '2026-12-19T23:00:00Z',
        price: '135.00',
        currency: 'PEN',
        capacity: 15,
        available: 10,
      },
    ],
  },
];

export const SHOWCASE_PACKAGES: CatalogOfferDetailDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000104',
    type: 'package',
    name: 'Paquete Ayacucho Místico: Millpu, Wari, Quinua y Vilcashuamán 3D/2N',
    description:
      'Programa integral de tres días diseñado para vivir lo mejor de Huamanga colonial, las aguas turquesas de Millpu y la herencia arqueológica Wari-Inca, combinable con hoteles boutique aliados.',
    price: '590.00',
    originalPriceHint: '670.00',
    badgeHint: '-12% OFF',
    nextDepartureHint: 'Salida 18 Dic · 9 cupos disponibles',
    currency: 'PEN',
    durationDays: 3,
    images: [
      { id: '6', url: STITCH_MEDIA.huamanga, isPrimary: true, version: 1 },
      { id: '7', url: STITCH_MEDIA.millpu, isPrimary: false, version: 1 },
      { id: '8', url: STITCH_MEDIA.vilcashuaman, isPrimary: false, version: 1 },
      { id: '9', url: STITCH_MEDIA.hotelCourtyard, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Traslados aeropuerto/terminal incluidos en unidad ejecutiva.',
      'Permite consolidar alojamiento opcional en la misma transacción (períodos exactos de 24h).',
      'Confirmación sujeta exclusivamente a validación de pago exitoso en Culqi.',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Recepción en Huamanga, Casonas Virreinales, Wari y Pampa de Ayacucho',
        description:
          'Bienvenida en aeropuerto Crnl. FAP Alfredo Mendívil Duarte, recorrido histórico y tarde cultural en Quinua.',
      },
      {
        day: 2,
        title: 'Expedición Full Day a las Aguas Turquesas de Millpu',
        description:
          'Visita guiada por los miradores naturales del cañón de Circamarca, cascadas cristalinas y gastronomía andina.',
      },
      {
        day: 3,
        title: 'Ciudadela Inca de Vilcashuamán, Laguna Pumaqocha y Despedida',
        description:
          'Exploración del Ushnu ceremonial, Templo del Sol y traslado puntual de retorno.',
      },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000205',
        startDate: '2026-12-18T12:00:00Z',
        endDate: '2026-12-20T23:00:00Z',
        price: '590.00',
        currency: 'PEN',
        capacity: 16,
        available: 9,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000105',
    type: 'package',
    name: 'Paquete Cusco Imperial, Valle Sagrado & Machu Picchu 4D/3N',
    description:
      'Circuito andino completo con boletos de tren panorámico, ingreso programado al santuario histórico de Machu Picchu, Pisac, Ollantaytambo y asistencia permanente.',
    price: '1485.00',
    originalPriceHint: '1650.00',
    badgeHint: '-10% OFF',
    nextDepartureHint: 'Aforo garantizado · 6 cupos libres',
    currency: 'PEN',
    durationDays: 4,
    images: [
      { id: '10', url: STITCH_MEDIA.machuPicchu, isPrimary: true, version: 1 },
      { id: '11', url: STITCH_MEDIA.hotelUrubamba, isPrimary: false, version: 1 },
    ],
    conditions: [
      'Incluye boletos ferroviarios ida/vuelta, bus Consettur e ingresos oficiales.',
      'Tarifa oficial expresada en Soles Peruanos (PEN).',
    ],
    itinerary: [
      { day: 1, title: 'Arribo a Cusco, Qorikancha y Sacsayhuamán', description: 'Aclimatación asistida y circuito arqueológico.' },
      { day: 2, title: 'Valle Sagrado: Pisac, Urubamba y Fortaleza de Ollantaytambo', description: 'Recorrido escénico y conexión ferroviaria.' },
      { day: 3, title: 'Amanecer en la Ciudadela de Machu Picchu', description: 'Guiado privado de 2.5 horas y retorno a Cusco.' },
      { day: 4, title: 'Mañana libre artesanal en San Blas y Traslado de Salida', description: 'Despedida y traslado puntual al aeropuerto.' },
    ],
    departures: [
      {
        id: '00000000-0000-4000-8000-000000000206',
        startDate: '2026-12-22T12:00:00Z',
        endDate: '2026-12-25T22:00:00Z',
        price: '1485.00',
        currency: 'PEN',
        capacity: 12,
        available: 6,
      },
    ],
  },
];

export const SHOWCASE_HOTELS: HotelPublicItemDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000301',
    name: 'Hotel Boutique Santa Rosa de Huamanga',
    description:
      'Casona virreinal del siglo XVII restaurada con arquerías de piedra de Huamanga, a dos cuadras de la Plaza Mayor. Confort térmico y descanso garantizado.',
    services: [
      'Desayuno buffet artesanal',
      'Wi-Fi fibra óptica 200 Mbps',
      'Calefacción ecológica',
      'Custodia de equipaje',
    ],
    images: [{ id: 'h1', url: STITCH_MEDIA.hotelCourtyard, isPrimary: true, version: 1 }],
    hasAvailability: true,
    lowestBasePrice: '220.00',
  },
  {
    id: '00000000-0000-4000-8000-000000000302',
    name: 'Andean Sanctuary Lodge Urubamba',
    description:
      'Refugio de montaña en el corazón del Valle Sagrado con jardines botánicos nativos, ideal para aclimatación previa a Machu Picchu.',
    services: ['Desayuno orgánico andino', 'Vistas a la cordillera', 'Traslado estación Ollantaytambo', 'Agua caliente solar 24h'],
    images: [{ id: 'h2', url: STITCH_MEDIA.hotelUrubamba, isPrimary: true, version: 1 }],
    hasAvailability: true,
    lowestBasePrice: '340.00',
  },
  {
    id: '00000000-0000-4000-8000-000000000303',
    name: 'Posada Colonial San Cristóbal',
    description:
      'Arquitectura tradicional ayacuchana con patio florido y atención familiar. Permanece visible en el catálogo aun cuando su inventario nocturno está completo (Spec 007).',
    services: ['Patio colonial central', 'Infusiones de muña y coca 24h', 'Wi-Fi en áreas comunes'],
    images: [{ id: 'h3', url: STITCH_MEDIA.hotelSuite, isPrimary: true, version: 1 }],
    hasAvailability: false,
    lowestBasePrice: '190.00',
  },
];

export const SHOWCASE_MOBILITY: MobilityPublicItemDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000401',
    name: 'Mercedes-Benz Sprinter VIP Panorámica',
    vehicleTypeHint: 'Minibús Turístico Especializado',
    description:
      'Asientos anatómicos reclinables de cuero con cinturón de 3 puntos, balón de oxígeno medicinal normado, botiquín de alta montaña, climatizador bi-zona y monitoreo GPS 24/7.',
    capacity: 19,
    image: { id: 'm1', url: STITCH_MEDIA.sprinterVip, isPrimary: true, version: 1 },
  },
  {
    id: '00000000-0000-4000-8000-000000000402',
    name: 'Hyundai H1 Ejecutiva Privada',
    vehicleTypeHint: 'Van Ejecutiva Familiar / Corporativa',
    description:
      'Ideal para grupos reducidos y traslados aeropuerto-hotel. Equipada con puertos USB por fila, amplio maletero hermético, suspensión reforzada y SOAT turístico nacional.',
    capacity: 10,
    image: { id: 'm2', url: STITCH_MEDIA.vanEjecutiva, isPrimary: true, version: 1 },
  },
  {
    id: '00000000-0000-4000-8000-000000000403',
    name: 'Scania Irizar i6 Crucero Andino',
    vehicleTypeHint: 'Bus Turístico de Gran Capacidad',
    description:
      'Máxima estabilidad para paquetes multidía y delegaciones. Asientos semi-cama 140°, sistema de audio para Guía Oficial DIRCETUR, aislamiento térmico y retardador hidráulico.',
    capacity: 36,
    image: { id: 'm3', url: STITCH_MEDIA.busCrucero, isPrimary: true, version: 1 },
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
  };
}
