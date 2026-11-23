# Ejemplos OpenAPI — lote O (errores específicos de identidad, perfil, reservas y pagos) v0.1

> **Fecha:** 2026-11-10. **Versión:** 0.1. **Registro:** DEC-240.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote N](ejemplos-lote-n.md), [contrato de API](contrato-api.md), [plan API-01](plan-api-01.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits o push.  
> **Alcance:** sustituir referencias genéricas de error por componentes específicos en las operaciones de identidad, perfil, reservas, pagos y devoluciones que el contrato asocia a un código concreto. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron **17 ejemplos ficticios** en **13 componentes de respuesta específicos** y se sustituyeron **17 referencias genéricas** en **14 operaciones**:

| Componente específico | HTTP | Ejemplos | Operaciones que lo referencian |
|---|---:|---:|---|
| `InvalidCredentials` | `401` | 1 | `auth.login` |
| `InvalidToken` | `400` | 1 | `auth.verifyEmail`, `auth.resetPassword`, `profile.confirmEmailChange` |
| `AlreadyVerified` | `409` | 1 | `auth.verifyEmail` |
| `VerificationResendConflict` | `409` | 2 | `auth.resendVerification` |
| `EmailAlreadyRegistered` | `409` | 1 | `auth.register` |
| `EmailChangeConfirmConflict` | `409` | 2 | `profile.confirmEmailChange` |
| `StaleVersion` | `409` | 1 | `profile.update` |
| `AccountClosureBlocked` | `409` | 1 | `profile.requestClosure` |
| `EmailNotVerified` | `403` | 1 | `reservations.create` |
| `ReservationUnavailable` | `409` | 1 | `reservations.create` |
| `ReservationCancelConflict` | `409` | 2 | `reservations.cancel`, `admin.reservations.cancel`, `admin.reservations.complete` |
| `PaymentNotPayable` | `409` | 1 | `payments.start` |
| `RefundAuthorizationConflict` | `409` | 2 | `admin.refundCases.authorize` |

Los 13 componentes se referencian **17 veces** en **14 operaciones**. Los componentes genéricos del lote N se conservan para el resto de operaciones; el total de referencias de error sigue siendo **319 en 90 operaciones**, porque se sustituyeron referencias, no se añadieron respuestas nuevas.

Con los lotes A–O, el OpenAPI conserva **139 bloques de éxito en 86 operaciones con ejemplos de cuerpo** y reúne **39 ejemplos de error en 24 componentes** (22 compartidos del lote N y 17 específicos del lote O). Al resolver los componentes en cada operación, la validación estructural cuenta **860 ejemplos efectivos en 92 operaciones**, con **0 fallos de esquema**. El conteo baja respecto de los 919 del lote N porque las 17 referencias sustituidas ya no heredan todos los ejemplos genéricos; la cobertura de operaciones con errores declarados se mantiene en **90 de 90**.

## 2. Operaciones y reemplazos

| Operación | HTTP | Referencia anterior | Referencia nueva | Ejemplos |
|---|---:|---|---|---:|
| `auth.register` | `409` | `Conflict` | `EmailAlreadyRegistered` | 1 |
| `auth.login` | `401` | `Unauthorized` | `InvalidCredentials` | 1 |
| `auth.verifyEmail` | `400` | `BadRequest` | `InvalidToken` | 1 |
| `auth.verifyEmail` | `409` | `Conflict` | `AlreadyVerified` | 1 |
| `auth.resendVerification` | `409` | `Conflict` | `VerificationResendConflict` | 2 |
| `auth.resetPassword` | `400` | `BadRequest` | `InvalidToken` | 1 |
| `profile.update` | `409` | `Conflict` | `StaleVersion` | 1 |
| `profile.confirmEmailChange` | `400` | `BadRequest` | `InvalidToken` | 1 |
| `profile.confirmEmailChange` | `409` | `Conflict` | `EmailChangeConfirmConflict` | 2 |
| `profile.requestClosure` | `409` | `Conflict` | `AccountClosureBlocked` | 1 |
| `reservations.create` | `403` | `Forbidden` | `EmailNotVerified` | 1 |
| `reservations.create` | `409` | `Conflict` | `ReservationUnavailable` | 1 |
| `reservations.cancel` | `409` | `Conflict` | `ReservationCancelConflict` | 2 |
| `payments.start` | `409` | `Conflict` | `PaymentNotPayable` | 1 |
| `admin.refundCases.authorize` | `409` | `Conflict` | `RefundAuthorizationConflict` | 2 |
| `admin.reservations.cancel` | `409` | `Conflict` | `ReservationCancelConflict` | 2 |
| `admin.reservations.complete` | `409` | `Conflict` | `ReservationCancelConflict` | 2 |

`InvalidToken` se reutiliza en tres operaciones y `ReservationCancelConflict` en tres; el resto de componentes específicos se usa en una sola operación. No se cambiaron los códigos HTTP declarados ni se añadieron respuestas de error nuevas.

## 3. Códigos y contenido

- `InvalidCredentials`: `invalid_credentials` (`401`).
- `InvalidToken`: `invalid_token` (`400`).
- `AlreadyVerified`: `already_verified` (`409`).
- `VerificationResendConflict`: `already_verified`, `request_superseded` (`409`).
- `EmailAlreadyRegistered`: `email_already_registered` (`409`).
- `EmailChangeConfirmConflict`: `email_already_registered`, `request_superseded` (`409`).
- `StaleVersion`: `stale_version` (`409`).
- `AccountClosureBlocked`: `account_closure_blocked` (`409`).
- `EmailNotVerified`: `email_not_verified` (`403`).
- `ReservationUnavailable`: `reservation_unavailable` (`409`).
- `ReservationCancelConflict`: `transition_not_allowed`, `stale_version` (`409`).
- `PaymentNotPayable`: `payment_not_payable` (`409`).
- `RefundAuthorizationConflict`: `refund_not_authorizable`, `stale_version` (`409`).

Todos los ejemplos usan `ProblemDetails`, `traceId` ficticio, datos ficticios y códigos del enum `ProblemCode`. No representan respuestas reales, no confirman que el servidor emita esos códigos y no sustituyen la validación de la implementación.

## 4. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos específicos validan contra `ProblemDetails` | 17 de 17, 0 fallos |
| Ejemplos de error totales (compartidos y específicos) | 39 de 39, 0 fallos |
| Referencias únicas resueltas | 133, 0 faltantes |
| Ejemplos efectivos al resolver componentes por operación | 860, 0 fallos |
| Operaciones con errores declarados y ejemplo heredado | 90 de 90 |
| Operaciones sin errores declarados | 2: `hotels.list` y `mobility.list` |
| Operaciones con al menos un ejemplo (éxito o error) | 92 de 92 |
| UUID/formatos ficticios y sin PII/tokens reales | Sí |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-240 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de errores reales, de códigos emitidos, de sesiones, de proveedores ni de producción.

## 5. Límites

- En su momento, la cobertura específica del lote O se limitó a **identidad, perfil, reservas, pagos y autorización de devoluciones**; no alcanzaba catálogo, hoteles, movilidad, inventario, exportaciones, reportes ni media. El lote P posterior amplió esa cobertura.
- En el lote O quedaron sin ejemplo específico `auth.refresh`, `auth.logout`, `auth.googleStart`, `auth.googleCallback`, `auth.googleLink`, `profile.get`, `profile.requestEmailChange` y las operaciones administrativas de catálogo, hoteles, inventario, exportaciones y reportes; el lote P cubrió después catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada.
- Los componentes específicos agrupan varios códigos cuando una misma respuesta HTTP puede deberse a más de una causa; no se creó una respuesta inline por cada ejemplo.
- No se añadieron handlers, middleware, códigos nuevos ni cambios al catálogo `ProblemCode`.
- CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 6. Lote posterior

**Lote P — catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media:** se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos específicos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**, revisando también `413`, `415`, `429` y `503` por familia.

No se añaden todavía handlers, respuestas reales, códigos definitivos, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 7. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- DEC-239 ratificó documentalmente el paquete DEC-219–DEC-223; este lote O (DEC-240) es una propuesta de ejemplos no ratificada y no modifica esa ratificación.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, imágenes reales, pagos, datos/proveedores reales, configuración, commits o push.
