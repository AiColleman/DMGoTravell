# Ejemplos OpenAPI — lote P (errores específicos de catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) v0.1

> **Fecha:** 2026-11-11. **Versión:** 0.1. **Registro:** DEC-241.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote O](ejemplos-lote-o.md), [contrato de API](contrato-api.md), [plan API-01](plan-api-01.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits o push.  
> **Alcance:** sustituir referencias genéricas de error por componentes específicos en las operaciones administrativas y de descarga que el contrato asocia a un código concreto. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron **19 ejemplos ficticios** en **14 componentes de respuesta específicos** y se sustituyeron **17 referencias genéricas** en **15 operaciones**:

| Componente específico | HTTP | Ejemplos | Operaciones que lo referencian |
|---|---:|---:|---|
| `CatalogUpdateConflict` | `409` | 2 | `admin.catalog.update` |
| `CatalogActivationConflict` | `409` | 2 | `admin.catalog.activate` |
| `HotelUpdateConflict` | `409` | 2 | `admin.hotels.update` |
| `HotelActivationConflict` | `409` | 2 | `admin.hotels.activate` |
| `RoomTypeCreateConflict` | `409` | 1 | `admin.hotels.createRoomType` |
| `InventoryConflict` | `409` | 1 | `admin.hotels.updateInventory` |
| `ExportNotReady` | `409` | 1 | `admin.exports.download` |
| `ExportExpired` | `410` | 1 | `admin.exports.download` |
| `ReportExpired` | `410` | 1 | `admin.reports.get`, `admin.reports.rows`, `admin.reports.requestPdf`, `admin.reports.downloadPdf` |
| `ReportNotReady` | `409` | 1 | `admin.reports.downloadPdf` |
| `MediaNotPublished` | `404` | 1 | `media.getPublished` |
| `CaptureCapacityExceeded` | `503` | 1 | `admin.exports.createClients` |
| `MobilityUpdateConflict` | `409` | 1 | `admin.mobility.update` |
| `MobilityActivationConflict` | `409` | 2 | `admin.mobility.activate` |

Los 14 componentes se referencian **17 veces** en **15 operaciones**. Los componentes genéricos del lote N se conservan para el resto de operaciones; el total de referencias de error sigue siendo **319 en 90 operaciones**, porque se sustituyeron referencias, no se añadieron respuestas nuevas. El componente genérico `Gone` queda sin referencias tras el lote P, pero se conserva definido.

Con los lotes A–P, el OpenAPI conserva **139 bloques de éxito en 86 operaciones con ejemplos de cuerpo** y reúne **58 ejemplos de error en 38 componentes** (22 compartidos del lote N y 36 específicos de los lotes O y P). Al resolver los componentes en cada operación, la validación estructural cuenta **808 ejemplos efectivos en 92 operaciones**, con **0 fallos de esquema**. El conteo baja respecto de los 860 del lote O porque las 17 referencias sustituidas ya no heredan todos los ejemplos genéricos; la cobertura de operaciones con errores declarados se mantiene en **90 de 90**.

Las referencias únicas pasan de **133 a 146**: se añaden 14 componentes y `Gone` deja de estar referenciado, por lo que el saldo es +13. Las ocurrencias de `$ref` pasan de **697 a 711** por las 14 definiciones nuevas; no hay referencias faltantes.

## 2. Operaciones y reemplazos

| Operación | HTTP | Referencia anterior | Referencia nueva | Ejemplos |
|---|---:|---|---|---:|
| `admin.catalog.update` | `409` | `Conflict` | `CatalogUpdateConflict` | 2 |
| `admin.catalog.activate` | `409` | `Conflict` | `CatalogActivationConflict` | 2 |
| `admin.hotels.update` | `409` | `Conflict` | `HotelUpdateConflict` | 2 |
| `admin.hotels.activate` | `409` | `Conflict` | `HotelActivationConflict` | 2 |
| `admin.hotels.createRoomType` | `409` | `Conflict` | `RoomTypeCreateConflict` | 1 |
| `admin.hotels.updateInventory` | `409` | `Conflict` | `InventoryConflict` | 1 |
| `admin.mobility.update` | `409` | `Conflict` | `MobilityUpdateConflict` | 1 |
| `admin.mobility.activate` | `409` | `Conflict` | `MobilityActivationConflict` | 2 |
| `admin.exports.createClients` | `503` | `ServiceUnavailable` | `CaptureCapacityExceeded` | 1 |
| `admin.exports.download` | `409` | `Conflict` | `ExportNotReady` | 1 |
| `admin.exports.download` | `410` | `Gone` | `ExportExpired` | 1 |
| `admin.reports.get` | `410` | `Gone` | `ReportExpired` | 1 |
| `admin.reports.rows` | `410` | `Gone` | `ReportExpired` | 1 |
| `admin.reports.requestPdf` | `410` | `Gone` | `ReportExpired` | 1 |
| `admin.reports.downloadPdf` | `409` | `Conflict` | `ReportNotReady` | 1 |
| `admin.reports.downloadPdf` | `410` | `Gone` | `ReportExpired` | 1 |
| `media.getPublished` | `404` | `NotFound` | `MediaNotPublished` | 1 |

`ReportExpired` se reutiliza en cuatro operaciones; el resto de componentes específicos se usa en una sola operación. No se cambiaron los códigos HTTP declarados ni se añadieron respuestas de error nuevas.

## 3. Códigos y contenido

- `CatalogUpdateConflict`: `incomplete_publication`, `stale_version` (`409`).
- `CatalogActivationConflict`: `duplicate_name`, `incomplete_publication` (`409`).
- `HotelUpdateConflict`: `incomplete_publication`, `stale_version` (`409`).
- `HotelActivationConflict`: `duplicate_name`, `incomplete_publication` (`409`).
- `RoomTypeCreateConflict`: `duplicate_name` (`409`).
- `InventoryConflict`: `inventory_below_commitments` (`409`).
- `ExportNotReady`: `export_not_ready` (`409`).
- `ExportExpired`: `export_expired` (`410`).
- `ReportExpired`: `report_expired` (`410`).
- `ReportNotReady`: `report_not_ready` (`409`).
- `MediaNotPublished`: `media_not_published` (`404`).
- `CaptureCapacityExceeded`: `capture_capacity_exceeded` (`503`).
- `MobilityUpdateConflict`: `stale_version` (`409`).
- `MobilityActivationConflict`: `duplicate_name`, `incomplete_publication` (`409`).

Todos los ejemplos usan `ProblemDetails`, `traceId` ficticio, datos ficticios y códigos del enum `ProblemCode`. No representan respuestas reales, no confirman que el servidor emita esos códigos y no sustituyen la validación de la implementación.

## 4. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos específicos validan contra `ProblemDetails` | 19 de 19, 0 fallos |
| Ejemplos de error totales (compartidos y específicos) | 58 de 58, 0 fallos |
| Referencias únicas resueltas | 146, 0 faltantes |
| Ejemplos efectivos al resolver componentes por operación | 808, 0 fallos |
| Operaciones con errores declarados y ejemplo heredado | 90 de 90 |
| Operaciones con algún ejemplo específico | 29 de 92 (14 del lote O y 15 del lote P) |
| Operaciones sin errores declarados | 2: `hotels.list` y `mobility.list` |
| Operaciones con al menos un ejemplo (éxito o error) | 92 de 92 |
| UUID/formatos ficticios y sin PII/tokens reales | Sí |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-241 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de errores reales, de códigos emitidos, de sesiones, de proveedores ni de producción.

## 5. Límites

- La cobertura específica del lote P se limita a **catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada**; no alcanza todas las operaciones administrativas ni las de notificaciones.
- Quedan con componentes genéricos `admin.catalog.create`, `admin.catalog.deactivate`, las operaciones de salidas/precios/itinerario, `admin.hotels.deactivate`, `admin.hotels.updateRoomType`, `admin.hotels.updateLodgingProposal`, `admin.exports.createAudit` (`503`), `admin.reports.create` y el `409` de `admin.reports.requestPdf`, además de las operaciones de autenticación, perfil, notificaciones y media administrativa.
- Los códigos `413`, `415`, `429` y los `503` restantes siguen cubiertos por ejemplos compartidos; el lote P no creó componentes específicos por operación para todos ellos.
- Los componentes específicos agrupan varios códigos cuando una misma respuesta HTTP puede deberse a más de una causa; no se creó una respuesta inline por cada ejemplo.
- No se añadieron handlers, middleware, códigos nuevos ni cambios al catálogo `ProblemCode`.
- CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 6. Siguiente lote propuesto

**Lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación:** revisar las operaciones que aún usan `BadRequest`, `Conflict`, `ServiceUnavailable`, `PayloadTooLarge`, `UnsupportedMediaType` o `TooManyRequests`, empezando por `auth.refresh`, `auth.logout`, las operaciones Google, `profile.get`, `profile.requestEmailChange`, notificaciones, media administrativa, `admin.exports.createAudit`, `admin.reports.create` y el `409` de `admin.reports.requestPdf`.

No se añaden todavía handlers, respuestas reales, códigos definitivos, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 7. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- DEC-239 ratificó documentalmente el paquete DEC-219–DEC-223; este lote P (DEC-241) es una propuesta de ejemplos no ratificada y no modifica esa ratificación.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, imágenes reales, pagos, datos/proveedores reales, configuración, commits o push.
