# Ejemplos OpenAPI — lote N (errores compartidos) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-238.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote M](ejemplos-lote-m.md), [contrato de API](contrato-api.md), [plan API-01](plan-api-01.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits o push.  
> **Alcance:** añadir ejemplos ficticios de `ProblemDetails` a los componentes de respuesta de error compartidos. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron **22 ejemplos ficticios** a **11 componentes de respuesta**:

| Componente | HTTP | Ejemplos | Operaciones que lo referencian |
|---|---:|---:|---:|
| `BadRequest` | `400` | 2 | 43 |
| `Unauthorized` | `401` | 2 | 79 |
| `Forbidden` | `403` | 2 | 63 |
| `NotFound` | `404` | 2 | 56 |
| `Conflict` | `409` | 6 | 42 |
| `Gone` | `410` | 2 | 5 |
| `PayloadTooLarge` | `413` | 1 | 7 |
| `UnsupportedMediaType` | `415` | 1 | 7 |
| `TooManyRequests` | `429` | 1 | 12 |
| `ServiceUnavailable` | `503` | 2 | 5 |
| `InternalError` | `500` | 1 | 0 |

Los diez componentes referenciados por operaciones acumulan **319 referencias de error** en **90 operaciones**. `InternalError` tiene ejemplo, pero ninguna operación lo referencia todavía. `hotels.list` y `mobility.list` no declaran respuestas de error; por eso no heredan ningún ejemplo de error.

Con los lotes A–N, el OpenAPI conserva **139 bloques de éxito en 86 operaciones con ejemplos de cuerpo** y añade **22 ejemplos compartidos de error**. Al resolver los componentes en cada operación, la validación estructural cuenta **919 ejemplos efectivos en 92 operaciones**, con **0 fallos de esquema**.

## 2. Códigos y contenido

- `BadRequest`: `validation_failed`, `invalid_page`.
- `Unauthorized`: `unauthenticated`, `invalid_credentials`.
- `Forbidden`: `forbidden`, `email_not_verified`.
- `NotFound`: `not_found`, `media_not_published`.
- `Conflict`: `stale_version`, `idempotency_conflict`, `duplicate_name`, `email_already_registered`, `account_closure_blocked`, `inventory_below_commitments`.
- `Gone`: `export_expired`, `report_expired`.
- `PayloadTooLarge`: `payload_too_large`.
- `UnsupportedMediaType`: `unsupported_media_type`.
- `TooManyRequests`: `rate_limited`.
- `ServiceUnavailable`: `provider_unavailable`, `capture_capacity_exceeded`.
- `InternalError`: `internal_error`.

Todos los ejemplos usan `ProblemDetails`, `traceId` ficticio, fechas/datos ficticios y códigos del enum `ProblemCode`. No representan respuestas reales, no confirman que el servidor emita esos códigos y no sustituyen la validación de la implementación.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de componente validan contra `ProblemDetails` | 22 de 22, 0 fallos |
| Ejemplos efectivos al resolver componentes por operación | 919, 0 fallos |
| Operaciones con errores declarados y ejemplo heredado | 90 de 90 |
| Operaciones sin errores declarados | 2: `hotels.list` y `mobility.list` |
| Operaciones con al menos un ejemplo (éxito o error) | 92 de 92 |
| UUID/formatos ficticios y sin PII/tokens reales | Sí |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-238 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de errores reales, de códigos emitidos, de sesiones, de proveedores ni de producción.

## 4. Límites

- Los ejemplos son **compartidos**: ilustran códigos frecuentes, pero no garantizan que cada operación use el código concreto que le corresponde.
- No hay ejemplos específicos por operación para todos los `409`, `400`, `404`, `410`, `413`, `415`, `429` y `503`.
- `InternalError` no está referenciado por ninguna operación; su ejemplo queda como componente documental.
- No se añadieron respuestas de error inline, handlers, middleware, códigos nuevos ni cambios al catálogo `ProblemCode`.
- CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Lotes posteriores

**Lote O — errores específicos por operación:** se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos específicos en 13 componentes para identidad, perfil, reservas, pagos y autorización de devoluciones.

**Lote P — catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media:** se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos específicos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**, revisando también `413`, `415`, `429` y `503` por familia.

No se añaden todavía handlers, respuestas reales, códigos definitivos, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, imágenes reales, pagos, datos/proveedores reales, configuración, commits o push.
