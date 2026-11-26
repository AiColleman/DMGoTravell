# Inventario de evidencia — auditoría de tareas 2026-11-24

> **Commit base:** `e74fd37` (2026-11-24, rama `main`). La auditoría comenzó sobre `1303848`; el delta de `e74fd37` añade la SPA rastreada `frontend/` y garantiza el admin ficticio en `DevelopmentDataSeeder.cs`, sin cambios en el backend de negocio.
> **Cambios no auditados:** el árbol de trabajo tiene modificaciones sin confirmar en `Program.cs`, hoteles, media y seeding, además de dos SPA sin rastrear; no forman parte de esta auditoría.
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
| Frontend | SPA rastreada en `frontend/` (React 19 + TypeScript + Vite): 28 archivos fuente, 7 pruebas Vitest en verde y `typecheck` sin errores (2026-11-25) | `frontend/package.json`, `frontend/src/test/app.test.tsx` |
| Frontend sin rastrear | `frontend-peru-premium/` (12 pruebas Vitest y `typecheck` en verde, ejecutados el 2026-11-25) y `viajes-peru-premium/` (scaffold Lovable); no se usan como evidencia por no estar en git | `git status` |

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

## 6. Qué NO existe o no se pudo verificar

- Pruebas de integración .NET reproducidas en la fecha de esta auditoría (Docker detenido y testhost con «Acceso denegado»); sus archivos y atributos sí existen.
- Certificación de proveedores externos reales: Culqi, Resend, R2 y Google OAuth son adaptadores simulados o no están implementados (`SimulatedIntegrations.cs`, `LocalSandboxMediaStorage.cs`; 0 coincidencias de OIDC en `src/`).
- Roles SQL de solo lectura/anexado para auditoría, rate limiting y bloqueo por intentos.
- Archivo/retención a largo plazo de auditoría, reconciliación de medios y mediciones de carga (k6 con 2000 VU existe como artefacto, no como ejecución verificada).
- Las dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) no forman parte de la evidencia auditada.

## 7. Resultado de la sincronización de tareas

Auditoría estática sobre `e74fd37`; HECHO exige código rastreado + prueba o artefacto localizable.

| Spec | Archivo | HECHO | PARCIAL | PENDIENTE | Total |
|---|---|---:|---:|---:|---:|
| 001 | `001-reservas/tasks.md` | 31 | 8 | 1 | 40 |
| 002 | `002-pagos/tasks.md` | 11 | 18 | 3 | 32 |
| 003 | `003-vencimiento/tasks.md` | 12 | 6 | 6 | 24 |
| 004 | `004-notificaciones/tasks.md` | 6 | 18 | 6 | 30 |
| 005 | `005-identidad/tasks.md` | 13 | 11 | 8 | 32 |
| 005-C | `005-identidad/tasks-reemision-verificacion.md` | 4 | 10 | 2 | 16 |
| 006 | `006-catalogo/tasks.md` | 18 | 12 | 0 | 30 |
| 007 | `007-hoteles/tasks.md` | 20 | 10 | 0 | 30 |
| 008 | `008-perfil/tasks.md` | 12 | 14 | 4 | 30 |
| 009 | `009-administracion-reservas/tasks.md` | 14 | 12 | 2 | 28 |
| 010 | `010-clientes-auditoria/tasks.md` | 21 | 10 | 3 | 34 |
| 011 | `011-reportes/tasks.md` | 16 | 10 | 2 | 28 |
| 012 | `012-multimedia/tasks.md` | 7 | 15 | 8 | 30 |
| 013 | `013-movilidad-informativa/tasks.md` | 10 | 8 | 0 | 18 |
| **Total** | | **195** | **162** | **45** | **402** |

**Lectura:** el backend de las 13 specs está mayormente implementado y probado; los pendientes se concentran en proveedores reales (Culqi, Resend, R2, Google), calendario hábil de devoluciones, rate limiting, roles SQL de auditoría, observabilidad/carga y cierre formal RF por RF. Las tareas de UI quedan PARCIAL: la SPA rastreada cubre las pantallas principales, pero sin E2E contra la API ni pruebas por pantalla.

La expansión criterio por criterio está en [matriz RF 2026-11-25](matriz-rf-2026-11-25.md): 677 criterios, 379 derivados de las tablas de 002–012 y 298 redactados para 001, 006, 007 y 013. De esos 298, 60 quedan PARCIAL por falta de prueba específica o evidencia solo de UI.
