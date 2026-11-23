# Decisiones transversales de API v0.1 — errores, idempotencia y paginación

> **Fecha:** 2026-11-04. **Versión:** 0.1. **Registro:** DEC-220.  
> **Objeto:** [contrato de API](contrato-api.md) §§2, 12, 13 y 14; [OpenAPI](openapi/dmgo-api-v1.yaml); [matriz de operaciones](matriz-operaciones-openapi.md); [plan API-01](plan-api-01.md).  
> **Estado:** **decisiones RATIFICADAS DOCUMENTALMENTE por DEC-239**; DT-06/09/12 y las pruebas CT-04–CT-07 siguen pendientes. No cierra API-03/API-04/API-05, no ejecuta CT-02–CT-12 y no autoriza código, handlers, SQL, migraciones, endpoints, proveedores, configuración, commits o push.  
> **Límite:** solo `sdd/`; sin operaciones ni datos reales.

## 1. Alcance

El contrato ya fija las reglas funcionales de errores, idempotencia, concurrencia, paginación, fechas y dinero. Este documento propone cómo aplicarlas de forma uniforme en la API y deja explícito lo que aún no está decidido.

No añade RF/HU/RN ni cambia el contrato. Cuando el contrato no fija un detalle técnico, se marca **PENDIENTE** en lugar de inventarlo.

## 2. API-03 — Errores

### 2.1 Forma única

- Todos los errores usan `application/problem+json` y el esquema `ProblemDetails`.
- Campos estables: `type`, `title`, `status`, `code`; `detail` es informativo.
- `traceId` se conserva para correlación; su obligatoriedad en todos los errores queda **PENDIENTE** de ratificación.
- `errors` solo aparece en validación de campos; `blockers` solo en baja bloqueada.
- No se devuelven tokens, enlaces, credenciales, PAN/CVV, cuerpos de proveedor, SQL, stack traces ni rutas internas.

### 2.2 Correspondencia propuesta

| Situación | HTTP | `code` |
|---|---:|---|
| Campos inválidos o no autorizados | 400 | `validation_failed` |
| Página 0/negativa/no entera | 400 | `invalid_page` |
| Rango invertido o fecha inválida | 400 | `invalid_range` |
| Filtro mal tipado o valor no admitido | 400 | `invalid_filter` |
| Enlace/prueba inválido, vencido o usado | 400 | `invalid_token` |
| Sin access válido | 401 | `unauthenticated` |
| Credenciales incorrectas | 401 | `invalid_credentials` |
| Rol/permiso insuficiente | 403 | `forbidden` |
| Correo no verificado para reservar/pagar | 403 | `email_not_verified` |
| Recurso inexistente o ajeno | 404 | `not_found` |
| Activo no publicado o no disponible | 404 | `media_not_published` |
| Conflicto de estado, unicidad, versión o transición | 409 | código específico |
| Artefacto expirado | 410 | `export_expired` / `report_expired` |
| Archivo/cuerpo demasiado grande | 413 | `payload_too_large` |
| Formato no admitido | 415 | `unsupported_media_type` |
| Límite de uso | 429 | `rate_limited` |
| Fallo no controlado | 500 | `internal_error` |
| Dependencia/capacidad no disponible | 503 | `provider_unavailable` / `capture_capacity_exceeded` |

- Un recurso ajeno se trata como **404**, no como 403, para no revelar existencia.
- El contrato usa **409 `stale_version`**; no se introduce 412 sin cambiar el contrato.
- No se usa 422: la validación de entrada se representa con 400 y `validation_failed`.
- Un `409` de negocio no se reintenta automáticamente.

### 2.3 Trazas y logs

- `traceId` permite correlacionar la respuesta con logs saneados.
- Los logs no incluyen contraseñas, JWT, refresh, tokens de un solo uso, enlaces, PAN/CVV, códigos Yape, credenciales ni cuerpos completos de proveedor.
- Un error de persistencia no se presenta como éxito; un fallo de proveedor no se convierte en confirmación.

### 2.4 Evidencia pendiente

CT-04 debe probar, por operación: código HTTP, `code`, `traceId`, forma de `errors`/`blockers`, ausencia de fugas y mensajes aprobados. La revisión documental no sustituye esas pruebas.

## 3. API-04 — Idempotencia y concurrencia

### 3.1 `Idempotency-Key`

Propuesta técnica:

- Clave opaca, sin PII, con caracteres ASCII imprimibles; longitud y charset exactos quedan **PENDIENTES** de fijar en el harness.
- Ámbito propuesto: actor + método + ruta + hash del payload.
- Misma clave y mismo payload: se devuelve el mismo resultado, sin repetir efectos, auditoría de éxito, liberación, caso o aviso.
- Misma clave y payload distinto: `409 idempotency_conflict`; no se ejecuta dos veces.
- Clave ausente en un comando que la exige: `400 validation_failed`; no se genera una clave por el servidor.
- La clave no se registra en logs ni se devuelve al cliente.

Quedan **PENDIENTES**: formato/longitud, ventana de retención, comportamiento ante dos solicitudes concurrentes con la misma clave y tratamiento de una respuesta perdida.

### 3.2 `ETag` / `If-Match`

- Las ediciones administrativas y las transiciones usan `ETag`/`If-Match` o `version` en el cuerpo.
- Una versión desactualizada devuelve `409 stale_version`; no se aplica escritura parcial.
- Un replay de una operación ya aplicada devuelve el resultado sin nueva auditoría de éxito, liberación, caso o aviso.
- El uso de `If-Match: *` en transiciones queda **PENDIENTE**; no se acepta por defecto.
- El formato exacto del `ETag` queda **PENDIENTE**; debe ser estable y no exponer datos internos.

### 3.3 Frontera interna

Confirmar pago, cancelar por vencimiento, liberar inventario, anexar auditoría y crear intención de notificación siguen siendo puertos internos. No se exponen como rutas HTTP ni se sustituyen por webhooks.

### 3.4 Evidencia pendiente

CT-05 y CT-06 deben probar replay, payload distinto, respuesta perdida, concurrencia, versión desactualizada y ausencia de efectos duplicados. La revisión documental no acredita que el servidor los implemente.

## 4. API-05 — Paginación, tiempo y dinero

### 4.1 Paginación

- `page` es entero positivo desde 1.
- `pageSize` tiene máximo por módulo: historial 10, administración de reservas 20, clientes/auditoría/reportes 25; máximo absoluto 100.
- Página válida sin resultados: `200` con `items: []`; no es `404` ni salto de página.
- `total` es informativo y coherente con la página; no se promete inmovilidad entre peticiones.
- Filtros combinados con AND; texto vacío tras recortar se omite; comodines SQL se tratan como texto.
- No se aceptan campos u orden arbitrarios.

Quedan **PENDIENTES**: valor por defecto de `pageSize`, código exacto para `pageSize` inválido, orden estable por operación y tratamiento de páginas fuera del total.

### 4.2 Tiempo

- Instantes: ISO 8601/RFC 3339 con offset/UTC.
- Fechas comerciales: `YYYY-MM-DD` en `America/Lima`.
- Filtros de fecha: días completos en hora Perú, inicio inclusivo y comienzo del día siguiente exclusivo; un extremo omitido deja rango abierto.
- No se acepta la hora local del navegador como autoridad.
- `paymentDeadlineAt` y `validationDeadlineAt` son instantes; la presentación en Perú no cambia el instante almacenado.

### 4.3 Dinero

- `"123.45"` como cadena decimal, moneda `"PEN"`, dos decimales.
- Nunca `float` en JSON; el backend calcula y el cliente no impone importes.
- No se mezclan monedas ni se redondea silenciosamente.
- La regla de redondeo y el tratamiento de importes límite quedan **PENDIENTES** de ratificación.

### 4.4 Evidencia pendiente

CT-07 debe probar página 0/negativa/texto, página vacía, máximos, filtros, rangos, zona horaria Perú/UTC y precisión monetaria. La revisión documental no sustituye esas pruebas.

## 5. Decisiones y pendientes

| ID | Decisión propuesta | Estado |
|---|---|---|
| DT-01 | `ProblemDetails` único y `code` estable. | Propuesta |
| DT-02 | Recurso ajeno = `404`; no se usa 403 para ocultar existencia. | Propuesta |
| DT-03 | `stale_version` usa 409; no se introduce 412 sin cambiar el contrato. | Propuesta |
| DT-04 | `traceId` en errores; obligatoriedad pendiente. | Parcial |
| DT-05 | `Idempotency-Key` opaca, sin PII, con replay y conflicto. | Propuesta |
| DT-06 | Formato, retención y concurrencia de la clave. | Pendiente |
| DT-07 | `ETag`/`If-Match` para ediciones y transiciones; `*` pendiente. | Propuesta |
| DT-08 | Paginación 1-based, máximos por módulo y página vacía 200. | Propuesta |
| DT-09 | Default de `pageSize`, error de `pageSize` y orden estable. | Pendiente |
| DT-10 | Fechas UTC/Perú y filtros por día completo. | Propuesta |
| DT-11 | Dinero como cadena decimal PEN de dos decimales. | Propuesta |
| DT-12 | Redondeo y límites monetarios. | Pendiente |

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
