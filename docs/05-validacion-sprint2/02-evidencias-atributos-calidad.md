# Evidencias y Resultados de Validación — Sprint 2

## 1. Información General de la Ejecución

| Campo | Valor |
|---|---|
| **Proyecto** | DMGOTRAVEL — Sistema Web para Agencia y Operadora Turística |
| **Fecha de ejecución (UTC)** | 2026-11-23 |
| **Versión / Stack ejecutado** | .NET 10.0.15 (ASP.NET Core Minimal API), EF Core 10, Npgsql, PostgreSQL 16-alpine (Docker), Node.js 22, Jest 29.7, Grafana k6 (`grafana/k6:latest`), xUnit v3 |
| **Entorno de medición** | Host Windows local (`Release` build para k6 en `http://0.0.0.0:5194`; contenedor Docker `postgres:16-alpine` en `localhost:5432`) |
| **Estilo y Enfoque implementado** | Cliente-Servidor + Monolito Modular (9 módulos) + Clean Architecture (4 capas: `Domain`, `Application`, `Infrastructure`, `Api`) + CQRS (MediatR + FluentValidation) |
| **Especificaciones SDD cubiertas** | `001` Reservas, `002` Pagos/Devoluciones/Culqi, `003` Vencimiento automático, `004` Notificaciones/Resend, `005` Identidad/JWT, `006` Catálogo admin, `007` Hoteles/Alojamiento, `008` Perfil/Baja lógica, `009` Admin Reservas, `010` Clientes/Auditoría/Exportación, `011` Reportes PDF 1.4, `012` Multimedia, `013` Movilidad informativa |
| **Documentación interactiva API** | OpenAPI 3.1 en `GET /openapi/v1.yaml` + Swagger UI en `GET /swagger` ([OpenApiEndpoints.cs](../../src/DMGoTravel.Api/Endpoints/OpenApiEndpoints.cs)) |

---

## 2. Trazabilidad de Principios SOLID y Patrones de Diseño Implementados

| Principio / Patrón | Implementación real en el repositorio |
|---|---|
| **SRP (Responsabilidad Única)** | Endpoints HTTP únicamente traducen peticiones/respuestas (`src/DMGoTravel.Api/Endpoints/*.cs`); Handlers orquestan casos de uso (`src/DMGoTravel.Application/Features/**`); Entidades protegen invariantes (`src/DMGoTravel.Domain/Modules/**`); Repositorios encapsulan SQL/EF Core (`src/DMGoTravel.Infrastructure/Persistence/Repositories/*.cs`). |
| **OCP & LSP (Abierto/Cerrado y Liskov)** | Integraciones externas aisladas tras puertos (`IPaymentGateway`, `IRefundGateway`, `IEmailSender`, `IMediaStorage`, `IWebhookSignatureVerifier`) con adaptadores sandbox intercambiables (`SimulatedPaymentGateway`, `SimulatedRefundGateway`, `SimulatedEmailSender`, `LocalSandboxMediaStorage`, `HmacWebhookSignatureVerifier`). |
| **ISP (Segregación de Interfaces)** | Puertos segregados por responsabilidad: `IAuditWriter` (solo anexado) separado de `IAuditRepository` (lectura); `ICacheInvalidator` separado de repositorios; repositorios específicos por agregado (`IOfferRepository`, `IHotelRepository`, `IReservationRepository`, `IRefundRepository`, `INotificationRepository`, `IMediaRepository`). |
| **DIP (Inversión de Dependencias)** | `DMGoTravel.Domain` tiene **0 dependencias** de EF Core, ASP.NET Core o proveedores externos (verificado automáticamente por `DMGoTravel.ArchitectureTests`). |
| **Decorator (GoF)** | `CachedOfferRepository` y `CachedMobilityRepository` (`src/DMGoTravel.Infrastructure/Persistence/Caching/CatalogCachingDecorators.cs`) envuelven repositorios base con `IMemoryCache` solo para lecturas públicas descriptivas. |
| **Adapter (GoF)** | Adaptadores de pago, devoluciones, correo, webhooks HMAC/Svix y almacenamiento multimedia en `src/DMGoTravel.Infrastructure/Integrations/`. |
| **Mediator + CQRS** | `MediatR` (`ValidationBehavior` + `IdempotencyBehavior`) separando Commands de mutación y Queries de proyección DTO. |
| **Repository + Unit of Work** | `IUnitOfWork` implementado por `ApplicationDbContext` garantizando transacciones atómicas y control de concurrencia optimista (`RowVersion`). |
| **Transactional Outbox** | `NotificationDelivery` + `NotificationDispatchWorker` y `PendingAuditEntry` + `PendingAuditRecoveryWorker` persistidos en PostgreSQL para recuperación ante fallos sin revertir pagos confirmados. |
| **Idempotent Consumer** | `IdempotencyRecord` (clave única por usuario/scope/key) y `ProcessedWebhookEvent` (clave única por proveedor/evento externo). |
| **Append-Only Audit** | `AuditLog` + `IAuditWriter` sin operaciones de edición/borrado y proyección segura `AuditProjection` sin secretos ni PII. |

---

## 3. Resultados de Pruebas Automatizadas y Cobertura

### 3.1 Suite .NET (xUnit v3 — Dominio, Arquitectura e Integración PostgreSQL 16)

| Suite | Proyecto | Total | Aprobadas | Fallidas | Propósito |
|---|---|---:|---:|---:|---|
| Dominio | `DMGoTravel.Domain.Tests` | 30 | **30** | 0 | Reglas de negocio, invariantes, transiciones, vencimientos, hoteles, reportes, devoluciones, notificaciones y multimedia |
| Arquitectura | `DMGoTravel.ArchitectureTests` | 3 | **3** | 0 | Reglas de dependencia de Clean Architecture (0 violaciones en `Domain` y `Application`) |
| Integración real | `DMGoTravel.Api.IntegrationTests` | 70 | **70** | 0 | Flujos HTTP E2E contra PostgreSQL 16 real, concurrencia AC07, caché AC01, seguridad RBAC, webhooks HMAC/Svix, PDF 1.4, CSV y media |
| **Subtotal .NET** | | **103** | **103** | **0** | **100% aprobadas (0 advertencias, 0 errores de compilación)** |

### 3.2 Suite Jest con TypeScript y Reporte de Cobertura (`tests/jest/`)

Comando ejecutado: `npm --prefix tests/jest run test:coverage`

```text
PASS __tests__/openApiContract.test.ts
PASS __tests__/domainRules.test.ts
PASS __tests__/apiClient.test.ts
-----------------------------|---------|----------|---------|---------|-------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|-------------------
All files                    |     100 |    98.87 |     100 |     100 |
 apiClient.ts                |     100 |     87.5 |     100 |     100 | 52
 domainRules.ts              |     100 |      100 |     100 |     100 |
 openApiContractValidator.ts |     100 |      100 |     100 |     100 |
-----------------------------|---------|----------|---------|---------|-------------------
Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total
```

- **Integración CI/CD:** Automatizada mediante GitHub Actions en [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), ejecutando build `.NET 10`, pruebas unitarias/arquitectura con cobertura, pruebas de integración sobre servicio `postgres:16-alpine` y pruebas **Jest con reporte de cobertura** en cada `push` y `pull_request`.

---

## 4. Resultados de Pruebas de Carga con k6 (Hasta 2,000 Usuarios Virtuales Concurrentes)

### 4.1 Escenario Línea Base AC01 (`tests/k6/baseline-ac01.js`)
- **Configuración:** 50 VUs constantes durante 20 s contra `GET /api/v1/catalog/tours?page=1&pageSize=10` (API en modo `Release`, PostgreSQL 16 + Decorator `IMemoryCache`).
- **Resultados reales medidos:**
  - **Solicitudes completadas:** `49,942` (**`2,489.92 req/s`**)
  - **Latencia p50 (mediana):** **`9.44 ms`**
  - **Latencia promedio:** **`19.82 ms`**
  - **Latencia p90:** `40.28 ms`
  - **Latencia p95:** **`54.34 ms`** ✅ *(Criterio Sprint 1 AC01: `≤ 300 ms` — superado 5.5×)*
  - **Tasa de errores HTTP / 5xx:** **`0.00%`** (`0` de `49,942`)

### 4.2 Escenario Rampa Progresiva hasta 2,000 VUs Concurrentes (`tests/k6/load-2000vu.js`)
- **Configuración:** 6 etapas progresivas: `100 VUs (10s) → 500 VUs (10s) → 1,000 VUs (15s) → 2,000 VUs (15s) → 2,000 VUs sostenidos (10s) → 0 VUs (10s)` distribuidas sobre `/api/v1/catalog/tours`, `/api/v1/catalog/packages` y `/api/v1/mobility`.
- **Resultados reales medidos:**
  - **VUs concurrentes máximos alcanzados:** **`2,000 VUs`**
  - **Solicitudes completadas:** **`103,591`** (**`1,472.23 req/s`** sostenidos)
  - **Checks aprobados:** **`100.00%`** (`207,182 / 207,182`)
  - **Tasa de errores 5xx (`http_5xx_errors`):** **`0.00%`** (`0` de `103,591`) ✅
  - **Tasa de fallos HTTP (`http_req_failed`):** **`0.00%`** (`0` de `103,591`) ✅
  - **Latencia p50 (mediana):** **`50.39 ms`**
  - **Latencia promedio:** **`153.22 ms`**
  - **Latencia p90:** `476.63 ms`
  - **Latencia p95 bajo pico de 2,000 VUs (1 instancia local):** `568.98 ms` *(máx. `1.12 s`)*
- **Interpretación arquitectónica:** Una sola instancia local del monolito modular absorbe el pico extremo de **2,000 usuarios virtuales concurrentes sin un solo error 5xx ni desconexión**. Como era esperable en una única instancia local con 2,000 conexiones simultáneas, el percentil p95 sube a `568.98 ms`, lo que demuestra empíricamente el valor de mantener el backend stateless (AC03) para escalar horizontalmente y ubicar Cloudflare Proxy/CDN (ADR-014) delante en producción para cargas sostenidas superiores a 1,000 VUs.

---

## 5. Matriz Consolidada de Validación de Atributos de Calidad (`AC01`–`AC12`)

Siguiendo la plantilla oficial definida en [`08-mediciones-de-atributos-de-calidad.md`](../01-analisis-de-sistema/08-mediciones-de-atributos-de-calidad.md):

| ID | Atributo | Resultado obtenido | Criterio Sprint 1 | Estado | Evidencia principal |
|---|---|---|---|---|---|
| **AC01** | Rendimiento | Línea base 50 VUs: `p95 = 54.34 ms`, `2,489.9 req/s`, `0%` errores; SQL `EXPLAIN ANALYZE` `0.027–0.131 ms`. | `p95 ≤ 300 ms` en lecturas simples en operación normal. | **Aprobado** | `tests/k6/baseline-ac01.js`, `01-analisis-bd-y-cache.md`, `Sprint2QualityAttributeTests.cs` |
| **AC02** | Disponibilidad | Fallo de auditoría/correo post-pago no revierte la confirmación (`PendingAuditEntry` + `NotificationDelivery` outbox); `/health` activo. | Fallo externo no bloquea funciones independientes ni revierte pagos. | **Aprobado** | `AdminReportsAndAuditRecoveryTests.cs`, `Phase6IntegrationsTests.cs` |
| **AC03** | Escalabilidad | Backend 100% stateless con JWT RS256, sin sesiones en memoria; absorbe 2,000 VUs concurrentes con `0.00%` 5xx (`103,591 reqs`). | Estado en PostgreSQL sin afinidad de sesión. | **Aprobado (1 instancia)** | `tests/k6/load-2000vu.js`, `JwtTokenService.cs` *(multi-instancia pendiente de staging cloud)* |
| **AC04** | Seguridad | JWT RS256, RBAC `admin`/`client`, rotación y detección de reúso de refresh tokens, HMAC-SHA256 en Culqi, Svix en Resend, magic bytes en media, sin secretos en Git. | 100% controles críticos aprobados; 0 secretos expuestos. | **Aprobado** | `AuthSliceTests.cs`, `AdminClientTests.cs`, `Phase6IntegrationsTests.cs`, `tests/jest/__tests__/domainRules.test.ts` |
| **AC05** | Privacidad y aislamiento | Acceso cruzado entre clientes rechazado (`404`/`403`), baja lógica anonimiza vistas admin, reportes PDF sin PII, incidentes con correo enmascarado (`bo***@example.test`). | Cero exposición de datos ajenos. | **Aprobado** | `SliceEndToEndTests.cs`, `ProfileSliceTests.cs`, `AdminClientTests.cs`, `AdminReportsAndAuditRecoveryTests.cs` |
| **AC06** | Mantenibilidad | Clean Architecture + 9 módulos + SOLID + 10 patrones de diseño; **0 violaciones de dependencia**. | Cero violaciones de Clean Architecture. | **Aprobado** | `DMGoTravel.ArchitectureTests` (3/3) |
| **AC07** | Integridad y concurrencia | 8 reservas simultáneas sobre último cupo (`1 Created / 7 Conflict / 0 sobreventas`), multi-noche hotel atómico sin reserva parcial, webhooks duplicados idempotentes (`duplicate: true`), expiración idempotente. | Cero sobreventas, cero inventario negativo, cero efectos duplicados. | **Aprobado** | `Sprint2QualityAttributeTests.cs`, `HotelAndLodgingReservationTests.cs`, `ReservationExpiryTests.cs`, `Phase6IntegrationsTests.cs` |
| **AC08** | Interoperabilidad | OpenAPI 3.1 en `/openapi/v1.yaml` y Swagger UI en `/swagger`; 55+ `operationId` únicos; RFC 7807 `ProblemDetails` verificado en todos los errores; colección Postman lista. | Cumplimiento OpenAPI + ProblemDetails. | **Aprobado** | `tests/jest/__tests__/openApiContract.test.ts`, `tests/postman/DMGoTravel.postman_collection.json`, `Sprint2QualityAttributeTests.cs` |
| **AC09** | Trazabilidad | Auditoría `audit_record` fail-closed en mutaciones críticas + recuperación post-cobro + `CorrelationId` + `AuditProjection` sin secretos. | Cobertura completa de operaciones críticas con actor, entidad y UTC. | **Aprobado** | `AdminAuditTests.cs`, `ReservationPaymentAuditTests.cs`, `AdminReportsAndAuditRecoveryTests.cs` |
| **AC10** | Usabilidad | Estados diferenciados (`pending`/`confirmed`/`completed`/`cancelled`) y mensajes claros `ProblemDetails` validados en API. | Requiere evaluación con usuarios sobre frontend React. | **Pendiente (Fase Frontend)** | Contrato de mensajes/estados verificado en API; falta sesión con usuarios en SPA React |
| **AC11** | Testabilidad | **123/123 pruebas automatizadas** (103 xUnit + 20 Jest con 100% líneas/sentencias) ejecutables sin credenciales externas reales; CI en GitHub Actions. | Casos críticos probados sin servicios externos reales. | **Aprobado** | `.github/workflows/ci.yml`, `tests/jest/`, `tests/DMGoTravel.*Tests/` |
| **AC12** | Recuperabilidad | Esquema reproducible al 100% desde 8 migraciones EF Core versionadas (probado con recreación limpia de `dmgotravel_it` en cada ejecución). | Simulacro de restauración de backup gestionado Supabase + R2 en staging/producción. | **Parcial (Reconstrucción local verificada)** | Migraciones EF Core verificadas; simulacro RTO/RPO en Supabase/R2 pendiente de aprovisionamiento cloud |
