import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import {
  buildValidPdf14Bytes,
  calculateNights24h,
  canAdminCancel,
  canAdminComplete,
  canCustomerCancel,
  canManuallyConfirm,
  formatIfMatchHeader,
  formatPen,
  parseEtagVersion,
  pickSmartDeparture,
} from '../lib/format';
import {
  mergeWithOfficialDmGoAdminHotels,
  mergeWithOfficialDmGoHotels,
  PERU_ASSETS,
  resolveMediaUrl,
  SHOWCASE_HOTELS,
  SHOWCASE_HOTELS_DETAIL,
} from '../lib/peruCatalog';
import { PeruPhoto } from '../components/ui/EditorialPrimitives';
import { authApi } from '../api/services';
import { CORRELATION_HEADER_NAME, requestWithMeta } from '../api/httpClient';
import { createCulqiCheckoutAdapter } from '../integrations/culqiCheckout';

function renderAt(route = '/') {
  return render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

describe('Viajes Perú Premium — Reglas de dominio y formateo PEN', () => {
  it('genera binarios PDF 1.4 válidos con cabecera %PDF-1.4, xref y %%EOF', () => {
    const bytes = buildValidPdf14Bytes([
      'DM GO TRAVEL - REPORTE EJECUTIVO',
      'Total contratado: S/ 1,440.00 PEN',
    ]);
    const text = new TextDecoder('ascii').decode(bytes);
    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text).toContain('xref\n');
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('formatea importes exactos en Soles Peruanos (PEN)', () => {
    expect(formatPen('1480.00')).toContain('S/');
    expect(formatPen(0)).toBe('S/ 0.00');
  });

  it('extrae y formatea versiones ETag / If-Match correctamente', () => {
    expect(parseEtagVersion('"v3"')).toBe(3);
    expect(parseEtagVersion('W/"2"')).toBe(2);
    expect(formatIfMatchHeader(4)).toBe('"v4"');
  });

  it('calcula períodos de 24 horas para propuestas de alojamiento', () => {
    expect(calculateNights24h('2026-12-18T15:00:00Z', '2026-12-20T15:00:00Z')).toBe(2);
  });

  it('respeta invariantes RN-14, RN-19 y Spec 009 (RF-8, RF-9) de transiciones de estado de reserva', () => {
    expect(canCustomerCancel('pending')).toBe(true);
    expect(canCustomerCancel('confirmed')).toBe(false);
    expect(canManuallyConfirm('pending')).toBe(false);
    expect(canAdminComplete('confirmed')).toBe(true);
    expect(canAdminComplete('pending')).toBe(false);
    // Spec 009 RF-9: el administrador jamás puede cancelar ni confirmar manualmente una reserva pending
    expect(canAdminCancel('pending')).toBe(false);
    expect(canAdminCancel('confirmed')).toBe(true);
    expect(canAdminCancel('completed')).toBe(false);
  });
});

describe('Viajes Perú Premium — Navegación Editorial e Integración UI', () => {
  it('renderiza el Hero Editorial Peruano y el buscador sincronizado en /', async () => {
    renderAt('/');
    expect(await screen.findByText(/El viaje empieza por un lugar que/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar rutas/i })).toBeInTheDocument();
  });

  it('separa de forma descentralizada Tours Turísticos (/tours) y Paquetes Turísticos (/paquetes) con los 4 filtros oficiales', async () => {
    renderAt('/tours');
    const mainNav = screen.getByRole('navigation', { name: /Navegación principal/i });
    expect(mainNav).toHaveTextContent('Tours Turísticos');
    expect(mainNav).toHaveTextContent('Paquetes Turísticos');
    expect(mainNav).not.toHaveTextContent('Experiencias');
    expect(mainNav).not.toHaveTextContent('Nosotros');

    expect(
      await screen.findByRole('heading', { level: 1, name: /^Tours Turísticos$/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/4 Filtros Oficiales/i)).toBeInTheDocument();

    renderAt('/paquetes');
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Paquetes Turísticos$/i })
    ).toBeInTheDocument();
  });

  it('permite iniciar sesión rápida de exploración como Viajero y ver Mis Reservas organizadas por secciones limpias', async () => {
    renderAt('/acceso');
    const quickClientBtn = await screen.findByRole('button', { name: /Entrar como Viajero/i });
    fireEvent.click(quickClientBtn);
    expect(
      await screen.findByRole('heading', { name: /^Mis Reservas$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Mis Reservas/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: /Nueva Reserva/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Datos de Contacto/i })).toBeInTheDocument();
    expect(screen.queryByText(/ETag v/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Registrada en snapshot/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Nueva Reserva/i }));
    expect(await screen.findByText(/¿Qué deseas reservar hoy\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Datos de Contacto/i }));
    expect(await screen.findByText(/Datos del Viajero Titular/i)).toBeInTheDocument();
  });

  it('permite ingresar como Admin y visualizar la consola de Reportes Snapshot conforme a Spec 011 (RF-6, RF-9, RF-11, RF-23, RF-29, RF-38)', async () => {
    renderAt('/acceso');
    const quickAdminBtn = await screen.findByRole('button', { name: /Entrar como Admin/i });
    fireEvent.click(quickAdminBtn);
    expect(
      await screen.findByRole('heading', { name: /Reportes Financieros y PDF Oficial/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Hospedaje Santa Lucía').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText('Hotel Internazionale (Hotel - Restaurant)').length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Casa del Valle/i)).not.toBeInTheDocument();

    // Verifica que el menú lateral exhibe las 10 secciones dedicadas y limpias
    for (const navLabel of [
      'Reportes Financieros',
      'Gestión de Reservas',
      'Devoluciones',
      'Correos y Avisos',
      'Tours y Paquetes',
      'Hoteles y Habitaciones',
      'Flota Turística',
      'Galería Fotográfica',
      'Directorio de Clientes',
      'Historial de Actividad',
    ]) {
      expect(screen.getAllByText(navLabel).length).toBeGreaterThanOrEqual(1);
    }

    // Spec 011 RF-6: filtros de oferta turística y hotel contratado, sin selector de estado comercial que distorsione el resumen
    expect(screen.getByLabelText(/Filtrar reporte por oferta turística/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filtrar reporte por hotel contratado/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Estado comercial$/i)).not.toBeInTheDocument();

    // Spec 011 RF-23 & RF-38: Diferencia de movimientos etiquetada sin llamarla ganancia ni saldo bancario
    expect(screen.getByText(/Diferencia de movimientos \(PEN\)/i)).toBeInTheDocument();

    // Captura nueva consulta -> pdfStatus pasa a not_requested y permite preparar PDF (202 -> ready)
    fireEvent.click(screen.getByRole('button', { name: /Generar reporte/i }));
    const prepPdfBtn = await screen.findByRole('button', {
      name: /Preparar PDF de esta consulta/i,
    });
    fireEvent.click(prepPdfBtn);
    expect(
      screen.queryByRole('button', { name: /Preparar PDF de esta consulta/i })
    ).not.toBeInTheDocument();
  });

  it('resuelve URLs ficticias (*.example.test) y claves relativas hacia fotografías editoriales locales', () => {
    expect(
      resolveMediaUrl('https://media.example.test/tour-ejemplo.jpg', 'tour', 0, 'Valle del Colca')
    ).toBe(PERU_ASSETS.colca);
    expect(resolveMediaUrl('dev/paquete-ejemplo.jpg', 'package', 0, 'Machu Picchu Cusco')).toBe(
      PERU_ASSETS.peruHero
    );
    expect(resolveMediaUrl('/api/v1/media/1234', 'tour', 0)).toBe('/api/v1/media/1234');
  });

  it('aplica fallback escalonado en PeruPhoto cuando una URL remota falla', () => {
    render(
      <PeruPhoto
        src="/api/v1/media/00000000-0000-0000-0000-000000000000"
        alt="Andenerías del Valle del Colca"
        category="tour"
        hintText="Colca Arequipa"
      />
    );
    const img = screen.getByAltText('Andenerías del Valle del Colca') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/api/v1/media/00000000-0000-0000-0000-000000000000');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe(PERU_ASSETS.colca);
  });

  it('cumple ADR-007, RS07 y AC11: Culqi Checkout tokeniza sin exponer inputs de PAN ni CVV en el DOM', async () => {
    const adapter = createCulqiCheckoutAdapter('');
    expect(adapter.mode).toBe('sandbox-ac11');
    const token = await adapter.tokenize({
      reservationNumber: 'DMG-2026-004821',
      amountPen: '1600.00',
      email: 'valeria.quispe@viajero.pe',
      method: 'card',
    });
    expect(token.tokenId).toMatch(/^tok_sandbox_card_/);
    expect(token.amountCents).toBe(160000);
    expect(token.currency).toBe('PEN');

    renderAt('/acceso');
    fireEvent.click(await screen.findByRole('button', { name: /Entrar como Viajero/i }));
    const payLinks = await screen.findAllByRole('link', { name: /Pagar ahora/i });
    fireEvent.click(payLinks[0]!);

    expect(await screen.findByText(/Pasarela Oficial Culqi/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/4111/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/12\/28/i)).not.toBeInTheDocument();

    // Verifica RC12 / ADR-009 / AC04: ningún accessToken real ni demo se persiste en storage
    const allSessionValues = Object.keys(window.sessionStorage).map(
      (k) => window.sessionStorage.getItem(k) ?? ''
    );
    expect(allSessionValues.join(' ')).not.toContain('accessToken');
  });

  it('cumple ADR-009, ADR-015 y AC09: ruta Google OAuth 2.0 y propagación de X-Correlation-Id', async () => {
    expect(authApi.getGoogleStartUrl('/cuenta')).toBe(
      '/api/v1/auth/google/start?returnUrl=%2Fcuenta'
    );

    const originalFetch = globalThis.fetch;
    let capturedCorrelation = '';
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      capturedCorrelation = h.get(CORRELATION_HEADER_NAME) ?? '';
      return new Response(JSON.stringify({ status: 'Healthy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', [CORRELATION_HEADER_NAME]: capturedCorrelation },
      });
    }) as typeof fetch;

    try {
      const res = await requestWithMeta<{ status: string }>('/health');
      expect(capturedCorrelation.length).toBeGreaterThan(8);
      expect(res.correlationId).toBe(capturedCorrelation);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('cumple Spec 007 (RF-2, RF-5, RF-7, DEC-115): exhibe los 9 hoteles reales de DM GO TRAVEL en Ayacucho ordenados A–Z sin filtros y con galería ficticia completa', async () => {
    expect(SHOWCASE_HOTELS).toHaveLength(9);
    const totalRooms = SHOWCASE_HOTELS_DETAIL.reduce((acc, h) => acc + h.roomTypes.length, 0);
    expect(totalRooms).toBe(53);

    // Todos los 9 hoteles poseen galería de 4 fotos ficticias y los 53 tipos de habitación tienen foto ficticia
    for (const detail of SHOWCASE_HOTELS_DETAIL) {
      expect(detail.images.length).toBeGreaterThanOrEqual(4);
      for (const rt of detail.roomTypes) {
        expect(rt.images.length).toBeGreaterThanOrEqual(1);
      }
    }

    // Verifica orden alfabético ascendente A–Z (Spec 007 · RF-7)
    expect(SHOWCASE_HOTELS[0]?.name).toBe('Hospedaje Santa Lucía');
    expect(SHOWCASE_HOTELS[8]?.name).toBe('Hotel Sumaq Plaza');

    // Si una BD local heredada devuelve solo 2 hoteles previos, se consolidan los 9 hoteles reales oficiales
    const mergedPublic = mergeWithOfficialDmGoHotels([
      {
        id: 'legacy-h1',
        name: 'Casa del Valle & Patio Inca',
        description: 'Demo antiguo',
        services: ['Wifi'],
        images: [],
        hasAvailability: true,
      },
      SHOWCASE_HOTELS[8]!,
    ]);
    expect(mergedPublic).toHaveLength(9);
    expect(mergedPublic.some((h) => h.name.includes('Casa del Valle'))).toBe(false);
    expect(mergeWithOfficialDmGoAdminHotels([])).toHaveLength(9);

    // Verifica resolución de imágenes ficticias dedicadas por hotel
    expect(resolveMediaUrl(null, 'hotel', 0, 'Hotel Internazionale')).toBe(
      PERU_ASSETS.hotels.internazionale
    );
    expect(resolveMediaUrl(null, 'hotel', 0, 'Hotel Sumaq Plaza')).toBe(
      PERU_ASSETS.hotels.sumaqPlaza
    );

    renderAt('/hoteles');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Catálogo de Hoteles en Ayacucho — DM GO TRAVEL/i,
      })
    ).toBeInTheDocument();

    for (const hotel of SHOWCASE_HOTELS) {
      expect(screen.getByText(hotel.name)).toBeInTheDocument();
    }

    // Contactos oficiales de agencia
    expect(screen.getAllByText('@dmgotravel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('913 249 767').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('969 167 443').length).toBeGreaterThanOrEqual(1);
  });

  it('cumple Spec 007 (RF-6, RF-11, RF-55, RF-56): detalle de Hotel Internazionale muestra sus 8 tarifas reales con fotos ficticias, omite placeholder cuando una habitación no tiene imagen y responde Hotel no disponible ante ID inválido', async () => {
    renderAt('/hoteles/00000000-0000-4000-8007-000000000101');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Hotel Internazionale \(Hotel - Restaurant\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Jr\. José Olaya N° 588, Emadi/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Desayuno Buffet \(7:00 am - 9:00 am\)/i)).toBeInTheDocument();
    expect(screen.getByText('Hab. Matrimonial Queen')).toBeInTheDocument();
    expect(screen.getByText('Hab. Doble (4 pers.)')).toBeInTheDocument();

    // RF-55: las habitaciones con foto registrada muestran su imagen ficticia dedicada
    expect(
      screen.getByAltText(/Hotel Internazionale \(Hotel - Restaurant\) — Hab\. Individual/i)
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(/Hotel Internazionale \(Hotel - Restaurant\) — Hab\. Triple$/i)
    ).toBeInTheDocument();

    // RF-56: si el backend retorna un tipo de habitación con images: [], no se muestra imagen ni placeholder
    const originalFetch = globalThis.fetch;
    const samaryDetail = SHOWCASE_HOTELS_DETAIL.find(
      (h) => h.id === '00000000-0000-4000-8007-000000000105'
    )!;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/hotels/00000000-0000-4000-8007-000000000105')) {
        return new Response(
          JSON.stringify({
            ...samaryDetail,
            roomTypes: samaryDetail.roomTypes.map((rt) =>
              rt.name === 'Hab. Doble (3 pers.)' ? { ...rt, images: [] } : rt
            ),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ title: 'Not Found', status: 404 }), { status: 404 });
    }) as typeof fetch;

    try {
      renderAt('/hoteles/00000000-0000-4000-8007-000000000105');
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: /Hotel Samary \(Hotel & Apartment\)/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByAltText(/Hotel Samary \(Hotel & Apartment\) — Hab\. Individual/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByAltText(/Hotel Samary \(Hotel & Apartment\) — Hab\. Doble \(3 pers\.\)/i)
      ).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }

    // RF-11: enlace inexistente responde «Hotel no disponible»
    renderAt('/hoteles/00000000-0000-4000-8007-999999999999');
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Hotel no disponible$/i })
    ).toBeInTheDocument();
  });

  it('cumple Spec 009 (RF-8, RF-9, RF-14, RF-27, RF-37) y Spec 002: exige motivo obligatorio al cancelar, confirmación expresa al completar y estados reales de RefundCase', async () => {
    renderAt('/acceso');
    fireEvent.click(await screen.findByRole('button', { name: /Entrar como Admin/i }));
    await screen.findByRole('heading', { name: /Reportes Financieros y PDF Oficial/i });

    renderAt('/admin/reservas');
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Gestión de Reservas$/i })
    ).toBeInTheDocument();

    // Spec 009 RF-9: la reserva pending muestra aviso de espera de pago y no botón de cancelación manual
    expect(screen.getAllByText(/En espera de pago del cliente/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Cancelar con motivo/i })).toHaveLength(1);

    // Spec 009 RF-27: completar exige marcar casilla de confirmación expresa
    fireEvent.click(screen.getByRole('button', { name: /^Completar$/i }));
    const confirmCompleteSubmit = await screen.findByRole('button', {
      name: /Marcar Completada/i,
    });
    expect(confirmCompleteSubmit).toBeDisabled();
    fireEvent.click(
      screen.getByLabelText(/Confirmo expresamente que todos los servicios contratados/i)
    );
    expect(confirmCompleteSubmit).not.toBeDisabled();

    // Spec 009 RF-14 & RF-15: cancelar abre formulario de motivo y genera RefundCase en la sección Devoluciones
    fireEvent.click(screen.getByRole('button', { name: /Cancelar con motivo/i }));
    const reasonBox = await screen.findByPlaceholderText(/Describe el motivo operativo/i);
    fireEvent.change(reasonBox, {
      target: { value: 'Solicitud formal del cliente verificada antes del inicio' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Confirmar Cancelación y Abrir Devolución/i })
    );

    // Spec 002: en la sección dedicada /admin/devoluciones, autorizar pasa de open -> authorized
    renderAt('/admin/devoluciones');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Devoluciones y Reembolsos/i })
    ).toBeInTheDocument();
    const authorizeButtons = await screen.findAllByRole('button', { name: /^Autorizar$/i });
    fireEvent.click(authorizeButtons[0]!);
    expect(await screen.findByText(/Autorizado \(sin abono\)/i)).toBeInTheDocument();
  });

  it('cumple Spec 001 (RF-45, RF-70..RF-72, RF-99, RF-102) y Spec 010 (RF-44): alojamiento parcial del grupo, páginas inválidas/vacías de historial y anonimización en baja lógica', async () => {
    // 1. Reserva compuesta en paquete de Ayacucho: cotizador fijo centrado + selector compacto de 9 hoteles + alojamiento parcial (RF-70)
    renderAt('/paquetes/00000000-0000-4000-8000-000000000106');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D\/2N/i,
      })
    ).toBeInTheDocument();

    const pricingAside = screen.getByRole('complementary', {
      name: /Tarifario y resumen de reserva/i,
    });
    expect(pricingAside).toHaveTextContent(/Tarifa Oficial por Viajero/i);
    expect(pricingAside).toHaveTextContent(/Reservar y pasar al checkout/i);

    fireEvent.click(screen.getByLabelText(/Aumentar viajeros/i)); // 2 -> 3 viajeros
    fireEvent.click(screen.getByRole('button', { name: /Consolidar Tour \+ Casona Aliada/i }));
    expect(screen.getByText(/9 hoteles disponibles/i)).toBeInTheDocument();

    // RF-45: indica expresamente que no existe tolerancia adicional tras salida asignada
    expect(
      await screen.findByText(/no existe tolerancia adicional después del horario de salida asignado/i)
    ).toBeInTheDocument();

    const individualRadio = screen.getAllByRole('radio')[0] as HTMLInputElement;
    expect(individualRadio).not.toBeDisabled();
    fireEvent.click(individualRadio);
    expect(screen.getByText(/Viajeros totales del grupo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Capacidad de habitación elegida:/i)).toBeInTheDocument();

    // 2. Inicia sesión como Viajero y verifica RF-99 (página inválida) y RF-102 (página válida vacía)
    renderAt('/acceso');
    fireEvent.click(await screen.findByRole('button', { name: /Entrar como Viajero/i }));
    await screen.findByRole('heading', { name: /^Mis Reservas$/i });

    renderAt('/cuenta?page=0');
    expect(await screen.findByText('Número de página no válido')).toBeInTheDocument();

    renderAt('/cuenta?page=3');
    expect(await screen.findByText('No hay reservas en esta página')).toBeInTheDocument();

    // 3. Spec 010 RF-44: en Directorio de Clientes (/admin/gobernanza -> /admin/clientes), clientes con baja lógica omiten PII
    renderAt('/acceso');
    fireEvent.click(await screen.findByRole('button', { name: /Entrar como Admin/i }));
    renderAt('/admin/gobernanza');
    expect(
      await screen.findByText(/Datos protegidos por cierre de cuenta/i)
    ).toBeInTheDocument();
  });

  it('aplica lógica inteligente de selección de fecha de salida: calendario interactivo, fecha más próxima disponible, bloqueo de agotados, ajuste de viajeros y preservación de hotel', async () => {
    const sampleDeps = [
      { id: 'd-soldout', startDate: '2026-12-26T13:00:00Z', available: 0 },
      { id: 'd-later', startDate: '2026-12-19T13:00:00Z', available: 9 },
      { id: 'd-first', startDate: '2026-12-05T13:00:00Z', available: 11 },
      { id: 'd-low', startDate: '2026-12-24T13:00:00Z', available: 3 },
    ];
    const nowRef = new Date('2026-11-26T12:00:00Z').getTime();

    // Ordena cronológicamente y recomienda la primera salida con cupo suficiente
    const defPick = pickSmartDeparture(sampleDeps, { travelers: 4, nowMs: nowRef });
    expect(defPick.departure?.id).toBe('d-first');
    expect(defPick.sortedFuture[0]?.id).toBe('d-first');

    // Si el cliente pide una fecha intermedia o agotada, sugiere la más cercana disponible
    const nearPick = pickSmartDeparture(sampleDeps, {
      requestedDateIso: '2026-12-15',
      travelers: 2,
      nowMs: nowRef,
    });
    expect(nearPick.departure?.id).toBe('d-later');
    expect(nearPick.matchKind).toBe('nearest-after');

    const avoidSoldOut = pickSmartDeparture(sampleDeps, {
      requestedDateIso: '2026-12-26',
      travelers: 2,
      nowMs: nowRef,
    });
    expect(avoidSoldOut.departure?.id).not.toBe('d-soldout');

    // Integración UI en Tour Huamanga (/tours/00000000-0000-4000-8000-000000000101)
    renderAt('/tours/00000000-0000-4000-8000-000000000101');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Huamanga Virreinal, Talleres de Piedra & Ruta Wari/i,
      })
    ).toBeInTheDocument();

    // Selecciona un hotel específico (Hotel Sumaq Plaza) y sube viajeros a 5
    const consolidateBtn = await screen.findByRole('button', {
      name: /Consolidar Tour \+ Casona Aliada/i,
    });
    fireEvent.click(consolidateBtn);
    fireEvent.click(await screen.findByRole('button', { name: /Hotel Sumaq Plaza/i }));
    fireEvent.click(screen.getByLabelText(/Aumentar viajeros/i)); // 3
    fireEvent.click(screen.getByLabelText(/Aumentar viajeros/i)); // 4
    fireEvent.click(screen.getByLabelText(/Aumentar viajeros/i)); // 5

    // 1) Elige una fecha sin salida exacta (2026-12-20) con 5 viajeros -> ubica la próxima salida con capacidad para los 5 viajeros y conserva Hotel Sumaq Plaza
    const dateInput = screen.getByLabelText(/Elegir fecha deseada/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-20' } });

    expect(
      await screen.findByText(/No hay salida exacta el/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 3, name: /Hotel Sumaq Plaza/i })
    ).toBeInTheDocument();

    // 2) Elige explícitamente la fecha exacta de últimos cupos (2026-12-24, solo 3 cupos) -> ajusta viajeros de 5 a 3 automáticamente conservando Hotel Sumaq Plaza
    fireEvent.change(dateInput, { target: { value: '2026-12-24' } });
    expect(
      await screen.findByText(/Ajustamos la reserva a 3 viajeros según los cupos libres/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 3, name: /Hotel Sumaq Plaza/i })
    ).toBeInTheDocument();

    // 3) Intenta elegir una fecha agotada (2026-12-26, 0 cupos) -> informa agotado y sugiere automáticamente la siguiente salida con cupos
    fireEvent.change(dateInput, { target: { value: '2026-12-26' } });
    expect(
      await screen.findByText(/está agotada; te sugerimos la fecha disponible más próxima/i)
    ).toBeInTheDocument();

    // Permite alternar a vista Calendario interactivo
    fireEvent.click(screen.getByRole('button', { name: /^Calendario$/i }));
    expect(screen.getByLabelText(/Mes siguiente/i)).toBeInTheDocument();
  });
});
