# DMGOTRAVEL — Frontend Web Empresarial

Aplicación SPA desarrollada con **React 19 + TypeScript + Vite + Tailwind CSS v4**, conectada al backend **Monolito Modular ASP.NET Core 10** (`/api/v1/...`) e implementada sobre el sistema de diseño **DMGOTRAVEL Enterprise Pro Plus** de Stitch.

## Scripts principales

```bash
# Desarrollo local en http://localhost:5173 (con proxy /api -> http://localhost:5194)
npm run dev

# Verificación estricta de tipos TypeScript
npm run typecheck

# Suite de pruebas automatizadas con Vitest + Testing Library
npm test

# Compilación optimizada para producción (Vercel)
npm run build
```

## Módulos implementados (Specs 001–013)

- **Portal Público (`/` y `/catalogo`)**: Hero con buscador sincronizado, catálogo con los **4 filtros oficiales** (`destination`, `startDate`–`endDate`, `priceMin`–`priceMax` en `PEN`, `durationMin`–`durationMax`), hoteles aliados con soporte `Sin disponibilidad` y **Movilidad Informativa (Spec 013)** sin precios ni alquiler.
- **Detalle y Reserva Compuesta (`/catalogo/:type/:id`)**: Galería multimedia, itinerario diario, selector de salida (`TourDeparture`), propuestas de alojamiento opcional (`LodgingProposal` + `RoomType` por períodos de 24h) y cálculo oficial en Soles (`PEN`).
- **Checkout Seguro Culqi & Yape (`/checkout/:reservationId`)**: Ventana temporal en vivo de **15/20 minutos**, snapshot histórico inmutable, métodos `card` y `yape`, `Idempotency-Key` y protección contra doble cobro durante estado `unknown`.
- **Identidad y Portal del Viajero (`/acceso` y `/cuenta`)**: Login/Registro, Google OAuth 2.0, verificación de correo de un solo uso con sustitución (`Spec 005-C`), historial de reservas propias, actualización de perfil con `ETag`/`If-Match`, cambio de correo y baja lógica con visualización de bloqueos.
- **Consola Empresarial Administrativa (`/admin/*`)**:
  - `/admin/reportes`: Captura `ReportSnapshot` (`Spec 011`), separación de bloque operativo vs. financiero (`PEN`) y descarga de **PDF Oficial**.
  - `/admin/reservas`: Operación de reservas (`RN-14`), casos de devolución `RefundCase` (`Spec 002`) e incidentes `Resend` (`Spec 004`).
  - `/admin/comercial`: Administración de catálogo, salidas, precios, hoteles, inventario por noche (`RoomInventoryNight`), propuestas, carga multimedia a **Cloudflare R2** (`≤ 5 MB`) y movilidad.
  - `/admin/gobernanza`: Directorio de clientes solo lectura (ocultando PII en cuentas con baja lógica), explorador de **Auditoría Inmutable** y exportaciones **CSV** basadas en snapshot (`Spec 010`).
