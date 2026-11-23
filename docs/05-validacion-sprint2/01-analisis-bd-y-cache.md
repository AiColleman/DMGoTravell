# Análisis de Base de Datos y Estrategia de Caché (Sprint 2)

**Fecha de evaluación (UTC):** 2026-11-23  
**Motor de base de datos:** PostgreSQL 16 (`postgres:16-alpine`) + Entity Framework Core 10 + Npgsql  
**Entorno:** Local Docker (`dmgotravel-postgres:5432`, base `dmgotravel_dev` y `dmgotravel_it`)

---

## 1. Arquitectura de Persistencia e Indexación

La base de datos relacional del monolito modular **DMGOTRAVEL** se construye exclusivamente mediante **8 migraciones versionadas de EF Core** (`src/DMGoTravel.Infrastructure/Persistence/Migrations/`), generando **26 tablas** y **92 índices verificados** en `pg_indexes` (claves primarias, índices únicos de negocio, claves de idempotencia y deduplicación, e índices compuestos de consulta).

### Índices críticos verificados en PostgreSQL 16

| Tabla | Índice | Propósito arquitectónico |
|---|---|---|
| `offer` | `IX_offer_Type_NormalizedKey`, `IX_offer_PublicId` | Listado público filtrado por tipo y unicidad de claves públicas |
| `offer_departure` | `IX_offer_departure_OfferId_StartsAtUtc`, `IX_offer_departure_PublicId` | Consulta de salidas futuras por oferta y búsqueda por UUID |
| `reservation` | `IX_reservation_AccountId_CreatedAtUtc`, `IX_reservation_ReservationNumber`, `IX_reservation_PublicId` | Aislamiento por cliente (AC05), historial paginado y número único |
| `reservation_hold` | `IX_reservation_hold_ResourceType_ResourceId_State`, `IX_reservation_hold_ReservationId` | Control de retenciones turísticas/hoteleras y liberación idempotente (AC07) |
| `idempotency_record` | `IX_idempotency_record_user_id_scope_key` (UNIQUE), `IX_idempotency_record_expires_at_utc` | Idempotencia fuerte en reservas, pagos, cancelaciones, devoluciones y reenvíos |
| `external_payment` | `IX_external_payment_Provider_ProviderTransactionId` (UNIQUE) | Evitar doble registro de una transacción externa de Culqi |
| `processed_webhook_event` | `IX_processed_webhook_event_Provider_ExternalEventId` (UNIQUE) | Patrón Idempotent Consumer para webhooks Culqi y Resend |
| `refund_case` | `IX_refund_case_ExternalPaymentId` (UNIQUE), `IX_refund_case_Status`, `IX_refund_case_ExecutedAtUtc` | Una sola devolución por cobro externo y cálculo financiero neto en reportes 011 |
| `notification_delivery` | `IX_notification_delivery_Status_NextRetryAtUtc`, `IX_notification_delivery_ProviderMessageId` | Patrón Transactional Outbox y reconciliación rápida por `email_id` de Resend |
| `audit_record` | `IX_audit_record_OccurredAtUtc`, `IX_audit_record_EntityType_EntityId` | Consulta administrativa ordenada cronológicamente y trazabilidad por entidad (AC09) |

---

## 2. Diagnóstico Real con `EXPLAIN (ANALYZE, BUFFERS)`

Se ejecutaron consultas críticas directamente sobre `dmgotravel_dev` en PostgreSQL 16 para verificar el comportamiento del planificador:

### 2.1 Consulta de catálogo activo (`offer`)
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM offer WHERE "IsActive" = true AND "DeletedAtUtc" IS NULL AND "Type" = 1;
```
**Resultado observado:**
- **Plan:** `Index Scan using "IX_offer_Type_NormalizedKey" on offer`
- **Buffers:** `shared hit=2` (0 lecturas de disco)
- **Planning Time:** `1.206 ms` | **Execution Time:** **`0.063 ms`**

### 2.2 Deduplicación de webhook externo (`processed_webhook_event`)
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM processed_webhook_event
WHERE "Provider" = 'culqi' AND "ExternalEventId" = 'evt_demo';
```
**Resultado observado:**
- **Plan:** `Index Scan using "IX_processed_webhook_event_Provider_ExternalEventId"`
- **Buffers:** `shared hit=2`
- **Planning Time:** `0.514 ms` | **Execution Time:** **`0.027 ms`**

### 2.3 Consultas paginadas sobre tablas de baja cardinalidad inicial (`reservation`, `audit_record`, `idempotency_record`)
- `reservation` por `AccountId` ordenado por `CreatedAtUtc DESC LIMIT 10`: **`0.131 ms`** (`shared hit=5`).
- `audit_record` ordenado por `OccurredAtUtc DESC LIMIT 25`: **`0.043 ms`**.
- `idempotency_record` por `(user_id, scope, key)`: **`0.033 ms`** (`shared hit=7`).
- **Observación técnica:** En volumen de desarrollo (< 50 filas por tabla), el optimizador de costos de PostgreSQL elige `Seq Scan` sobre 1–2 páginas en memoria compartida porque es más económico que un salto de índice; al escalar a miles de filas, los índices compuestos ya creados (`IX_reservation_AccountId_CreatedAtUtc`, `IX_audit_record_OccurredAtUtc`, `IX_idempotency_record_user_id_scope_key`) garantizan búsqueda logarítmica $O(\log N)$ sin escaneo completo.

---

## 3. Control de Concurrencia y Transacciones (AC07)

Para prevenir sobreventa y estados parciales en reservas simples y compuestas (`tour + hotel`):
1. **Control de concurrencia optimista (`RowVersion` como Concurrency Token):** Configurado en `offer_departure`, `room_inventory_night`, `reservation`, `payment_attempt`, `refund_case`, `hotel`, `room_type` y `mobility_category`.
2. **Atomicidad mediante `IUnitOfWork` (`ApplicationDbContext`):** La retención de cupos turísticos, retención de todas las noches hoteleras (sin reservas parciales), creación de snapshots históricos de precios y registro de auditoría se confirman en una única transacción PostgreSQL.
3. **Verificación empírica (AC07):** En la prueba automatizada `Concurrency_LastTouristSeat_ShouldPreventOverselling` (`Sprint2QualityAttributeTests.cs`), **8 clientes verificados concurrentes** compitieron por una salida con `CapacityTotal = 1`: exactamente **1 reserva** obtuvo `201 Created`, las **7 restantes** fueron rechazadas de forma controlada con `409 Conflict` y PostgreSQL registró `CapacityCommitted = 1`, `AvailableCapacity = 0` (**cero sobreventas**).

---

## 4. Estrategia de Caché Segura (Patrón Decorator + `IMemoryCache`)

Respetando explícitamente la restricción de **AC01** definida en el Sprint 1 (`docs/01-analisis-de-sistema/04-atributos-de-calidad.md`) y el patrón **Decorator** previsto en `docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md`:

### Qué SÍ se cachea
- **`CachedOfferRepository.ListActiveAsync(OfferType)`** (`src/DMGoTravel.Infrastructure/Persistence/Caching/CatalogCachingDecorators.cs`): listado público descriptivo de tours y paquetes con TTL corto configurable (`Caching:PublicCatalogTtlSeconds = 30`).
- **`CachedMobilityRepository.ListActiveOrderedAsync()`**: listado público informativo de vehículos de movilidad (Spec 013).

### Qué NUNCA se cachea (fuente de verdad exclusiva: PostgreSQL)
- Cupos disponibles de salidas (`GetDepartureByPublicIdAsync`, `GetDepartureByIdAsync`).
- Inventario hotelero por noche (`RoomInventoryNight`).
- Estado y detalle de reservas (`Reservation`).
- Estado de intentos de pago y devoluciones (`PaymentAttempt`, `ExternalPayment`, `RefundCase`).
- Datos administrativos y auditoría.

### Estrategia de invalidación
- **Invalidación inmediata basada en escritura:** `ApplicationDbContext.SaveChangesAsync()` detecta cambios sobre `Offer`, `TourDeparture`, `OfferItineraryDay`, `MediaAsset` y `MobilityItem` e invoca automáticamente `ICacheInvalidator.InvalidateCatalog()` / `InvalidateMobility()` tras confirmar la transacción.
- Verificada automáticamente mediante `PublicCatalogCache_ShouldInvalidateImmediatelyOnMutation` (`Sprint2QualityAttributeTests.cs`): una nueva oferta activa es visible de inmediato sin esperar la expiración del TTL de 30 s.
- **Impacto medido bajo carga (k6):** Con el Decorator de caché activo, el backend alcanzó **`2,489.92 req/s`** con `p95 = 54.34 ms` a 50 VUs y **`103,591` solicitudes con `0.00%` de errores 5xx** escalando progresivamente hasta **2,000 usuarios virtuales concurrentes** en una única instancia local sin saturar el pool de conexiones de PostgreSQL.

### Consideración para escalado horizontal (AC03)
Dado que `IMemoryCache` es local al proceso, al desplegar múltiples instancias en producción se deberá mantener TTL corto (≤ 30 s) o sustituir únicamente la implementación de `ICacheInvalidator` / caché por una caché distribuida (ej. Redis) sin alterar ninguna capa de `Domain` ni `Application`.
