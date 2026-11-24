# Inventario de evidencia — auditoría de tareas 2026-11-24

> **Commit base:** `1303848` (2026-11-23, rama `main`).
> **Objeto:** servir de referencia común para sincronizar los `tasks.md` de `sdd/specs/001`–`013` con el código real.
> **Regla:** este inventario solo enumera lo que existe en el repositorio. No afirma conformidad funcional con ningún RF.

## 1. Verificación de la base técnica

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Compilación | 0 errores, 0 advertencias | `dotnet build DMGoTravel.slnx` (2026-11-24) |
| Suite Jest | 20/20 pruebas, 3 suites | `npm test` en `tests/jest` |
| Pruebas .NET | 103 casos declarados (30 dominio + 3 arquitectura + 70 integración) | atributos `[Fact]`/`[Theory]` en `tests/` |
| Ejecución .NET local | No reproducible en este entorno: testhost aborta con `Acceso denegado` | limitación del shell, no del código |
| Pruebas de integración | Requieren PostgreSQL 16; Docker no está disponible actualmente | `docker ps` falla |
| Frontend | No existe código de frontend en el repositorio | solo `tests/jest` tiene `package.json` |

## 2. Capa API — endpoints expuestos

Carpeta `src/DMGoTravel.Api/Endpoints/`.

| Archivo | Operaciones |
|---|---|
| `ReservationEndpoints.cs` | `POST /reservations`, `GET /reservations`, `GET /reservations/{id}`, `POST /reservations/{id}/cancel` |
| `PaymentEndpoints.cs` | `POST /reservations/{id}/payments`, `GET /payments/{id}` |
| `WebhookEndpoints.cs` | `POST /webhooks/culqi`, `POST /webhooks/resend` |
| `AuthEndpoints.cs` | `register`, `login`, `refresh`, `logout`, `verify-email`, `verify-email/resend`, `password/forgot`, `password/reset` |
| `ProfileEndpoints.cs` | `GET /profile`, `PUT /profile`, `POST /profile/email-change`, `POST /profile/email-change/confirm`, `POST /profile/closure` |
| `CatalogEndpoints.cs` | `GET /catalog/{type}`, `GET /catalog/{type}/{id}` |
| `AdminCatalogEndpoints.cs` | listar, crear, editar, activar, desactivar, precios, itinerario, crear/editar salidas, precio de salida |
| `HotelEndpoints.cs` | hoteles públicos, detalle, propuestas de alojamiento por salida, listado admin, alta/edición, activar/desactivar, tipos de habitación, inventario, propuestas admin |
| `MobilityEndpoints.cs` | `GET /mobility` público; admin: listar, crear, detalle, editar, activar, desactivar |
| `MediaEndpoints.cs` | lectura pública/admin de media, imágenes de catálogo, de hotel y de tipo de habitación, imagen de movilidad |
| `AdminReservationEndpoints.cs` | listar, detalle, cancelar, completar |
| `AdminClientEndpoints.cs` | listar, detalle |
| `AuditEndpoints.cs` | listar, detalle |
| `AdminExportEndpoints.cs` | exportar clientes, exportar auditoría, consultar export, descargar export |
| `AdminReportEndpoints.cs` | crear reporte, consultar, filas, generar PDF, descargar PDF |
| `AdminRefundEndpoints.cs` | listar devoluciones, detalle, autorizar, reintentar |
| `AdminNotificationEndpoints.cs` | incidencias (listar/detalle), reenvío de entregas |
| `OpenApiEndpoints.cs` | `GET /openapi/v1.yaml`, `GET /swagger` |

## 3. Capa Application — casos de uso

Carpeta `src/DMGoTravel.Application/Features/`.

| Módulo | Casos de uso |
|---|---|
| `Reservations` | crear, cancelar, consultar, listar, expirar, mapper y DTO factory |
| `Payments` | iniciar pago, consultar pago, devoluciones (autorizar/reintentar/consultar) |
| `Webhooks` | procesar webhook Culqi, procesar webhook Resend |
| `Auth` | registro, login, refresh, logout, verificación y reenvío, olvido y restablecimiento de contraseña |
| `Profile` | consultar, actualizar, cambio de correo y confirmación, solicitud de baja |
| `Catalog` | listar y detalle públicos |
| `AdminCatalog` | handlers administrativos de catálogo |
| `Hotels` | handlers públicos y administrativos de hoteles, habitaciones, inventario y propuestas |
| `Mobility` | listado público y handlers administrativos |
| `Media` | handlers de imágenes y validador de firma de imagen |
| `AdminReservations` | listar, detalle, cancelar, completar |
| `Clients` | listar, detalle |
| `Audit` | listar, detalle, recuperación de auditoría pendiente, proyección |
| `Exports` | exportación de clientes y auditoría, CSV, consulta/descarga |
| `Reports` | generación de reporte, filas, PDF |
| `Notifications` | entregas, incidencias y reenvío |

## 4. Capa Domain — módulos y entidades

Carpeta `src/DMGoTravel.Domain/Modules/`.

| Módulo | Tipos |
|---|---|
| `Reservations` | `Reservation`, `ReservationHold`, `ReservationOfferSnapshot`, `ReservationLodgingSnapshot`, `ReservationStatus`, `CancellationOrigin` |
| `Payments` | `PaymentAttempt`, `PaymentStatus`, `PaymentMethod`, `RefundCase`, `ExternalPayment`, `ProcessedWebhookEvent` |
| `Identity` | `User`, `UserProfile`, `UserRole`, `UserStatus`, `RefreshToken` |
| `Catalog` | `Offer`, `OfferType`, `TourDeparture`, `OfferItineraryDay`, `DurationUnit`, `MediaAsset` |
| `Hotels` | `Hotel`, `HotelService`, `RoomType`, `RoomInventoryNight`, `LodgingProposal` |
| `Mobility` | `MobilityItem` |
| `Notifications` | `NotificationDelivery`, `NotificationIncident` |
| `Audit` | `AuditLog`, `PendingAuditEntry` |
| `Exports` | `ExportJob` |
| `Reports` | `ReportSnapshot` |

## 5. Pruebas automatizadas

| Proyecto | Archivos | Casos | Naturaleza |
|---|---|---|---|
| `tests/DMGoTravel.Domain.Tests` | 10 | 30 | reglas de dominio aisladas |
| `tests/DMGoTravel.ArchitectureTests` | 1 | 3 | reglas de dependencia Clean Architecture |
| `tests/DMGoTravel.Api.IntegrationTests` | 18 | 70 | HTTP E2E contra PostgreSQL 16 |
| `tests/jest` | 3 | 20 | contrato OpenAPI, reglas y cliente |

## 6. Qué NO existe

- Código de frontend (React, Vite, TypeScript de aplicación): las fases de interfaz de todas las specs quedan sin implementación.
- Evidencia de ejecución de pruebas de integración en la fecha de esta auditoría (Docker detenido).
- Certificación de proveedores externos reales: las integraciones son adaptadores simulados según `docs/05-validacion-sprint2/02-evidencias-atributos-calidad.md`.
