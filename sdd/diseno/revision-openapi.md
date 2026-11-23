# Revisión del borrador OpenAPI v0.1

> **Fecha:** 2026-11-04. **Versión:** 0.1. **Registro:** DEC-217.  
> **Objeto:** [dmgo-api-v1.yaml](openapi/dmgo-api-v1.yaml), [contrato de API](contrato-api.md), [plan API-01](plan-api-01.md) y [matriz de cierre técnico](cierre-diseno-tecnico.md).  
> **Estado:** revisión documental **NO NORMATIVA**. No ratifica el OpenAPI, no cierra API-01 y no ejecuta CT-02–CT-12.  
> **Límite:** solo `sdd/`; sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.  
> **Actualización DEC-225/226/227/228/229/230/231/232/233/234/235/236/237/238/240/241:** los lotes [A](ejemplos-lote-a.md), [B](ejemplos-lote-b.md), [C](ejemplos-lote-c.md), [D](ejemplos-lote-d.md), [E](ejemplos-lote-e.md), [F](ejemplos-lote-f.md), [G](ejemplos-lote-g.md), [H](ejemplos-lote-h.md), [I](ejemplos-lote-i.md), [J](ejemplos-lote-j.md), [K](ejemplos-lote-k.md), [L](ejemplos-lote-l.md), [M](ejemplos-lote-m.md), [N](ejemplos-lote-n.md), [O](ejemplos-lote-o.md) y [P](ejemplos-lote-p.md) añaden 139 bloques de éxito en 86 operaciones con ejemplos de cuerpo, 22 ejemplos compartidos de error en 11 componentes y 36 ejemplos específicos en 27 componentes (identidad/perfil, lectura pública, reservas, pagos, administración, devoluciones, webhooks, notificaciones, catálogo, hoteles, movilidad, salidas, precios, itinerarios, imágenes, habitaciones, inventario, propuestas de alojamiento, clientes, auditoría, exportaciones, reportes, media, autenticación, perfil y errores); 4 respuestas `204` y 2 `302` no tienen cuerpo, las 92 operaciones tienen respuesta de éxito documentada y 90/92 tienen errores declarados cubiertos por componentes; 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos con 0 fallos; CT-12 sigue parcial y las conclusiones de esta revisión se mantienen.

## 1. Objetivo

Comprobar si el borrador OpenAPI refleja el inventario, la seguridad, los errores, la idempotencia, la concurrencia, la paginación y los ejemplos del contrato textual, sin convertir la revisión en una implementación.

Esta revisión responde a tres preguntas:

1. ¿Están todas las operaciones del contrato en el YAML?
2. ¿Los ejemplos añadidos son válidos contra sus esquemas?
3. ¿Qué sigue abierto para cerrar API-01?

## 2. Método

- Extracción de pares método/ruta de las tablas de `contrato-api.md`.
- Lectura del YAML con detección de claves duplicadas.
- Resolución de `$ref` internos para parámetros y esquemas.
- Comprobación de `operationId`, parámetros de ruta y referencias.
- Validación de los ejemplos de esquema con JSON Schema 2020-12.
- Revisión documental de seguridad, errores, idempotencia, concurrencia, paginación, tiempo y dinero.
- Sin cliente HTTP, sin servidor, sin proveedor, sin base de datos y sin datos reales.

La validación OpenAPI 3.1 de DEC-215 se conserva como antecedente. Esta pasada no ejecutó el validador externo `openapi-spec-validator`; ejecutó análisis estructural propio y validación JSON Schema de los ejemplos.

## 3. Inventario CT-01

| Comprobación | Resultado |
|---|---|
| Pares método/ruta extraídos del contrato | 86 |
| Operaciones de imágenes de hotel/tipo expandidas desde la fila agregada | 6 |
| Total esperado | 92 |
| Rutas en el YAML | 82 |
| Operaciones en el YAML | 92 |
| Operaciones del contrato ausentes en el YAML | 0 |
| Operaciones del YAML fuera del contrato | 0 |
| `operationId` únicos | 92 de 92 |
| Parámetros de ruta alineados tras resolver `$ref` | 0 discrepancias |

La fila combinada de activar/desactivar hoteles se expandió a dos operaciones; las imágenes de hotel y de tipo de habitación se expandieron a seis. Esas expansiones son las que llevan de los 86 pares a las 92 operaciones.

**Resultado:** CT-01 queda **superada documentalmente**. La superación documental no equivale a una prueba de contrato contra un servidor.

Las seis operaciones de imágenes expandidas son:

- `POST /api/v1/admin/hotels/{id}/images`
- `PUT /api/v1/admin/hotels/{id}/images/{imageId}`
- `DELETE /api/v1/admin/hotels/{id}/images/{imageId}`
- `POST /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images`
- `PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId}`
- `DELETE /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId}`

## 4. Estructura y referencias

| Comprobación | Resultado |
|---|---|
| OpenAPI | `3.1.0` |
| Versión del documento | `0.1.0-draft` |
| Esquemas | 88 |
| Referencias únicas | 146 |
| Ocurrencias de `$ref` | 711 |
| Referencias rotas | 0 |
| Claves duplicadas | 0 |
| Operaciones sin `security` explícito | 0 |

El YAML conserva `x-status: draft-not-normative`. La revisión no cambia la versión ni declara una fuente normativa.

## 5. Seguridad

- `security` global es `[]`; cada operación declara su propia seguridad.
- Hay **17 operaciones públicas** o de token/proveedor sin bearer de cliente.
- Las operaciones autenticadas usan `bearerAuth`; refresh y CSRF se representan con `refreshCookie` y `csrfToken`.
- Los webhooks de Culqi y Resend no usan JWT de cliente.
- Los recursos ajenos se documentan como `404`; no se añade una ruta de descubrimiento.

**Pendiente:** API-02 debe fijar topología, `SameSite`, `__Host-`, CSRF, CORS, revocación y pruebas de navegador. La revisión no asume `Lax` ni declara cookies seguras por redacción.

## 6. Errores

- `ProblemDetails` exige `type`, `title`, `status` y `code`.
- `ValidationProblemDetails`, `FieldError` y `ClosureBlocker` están definidos.
- El catálogo `ProblemCode` incluye los códigos del contrato, incluidos `invalid_page`, `stale_version`, `idempotency_conflict`, `account_closure_blocked`, `export_not_ready`, `export_expired`, `report_not_ready` y `report_expired`.
- Se añadieron ejemplos ficticios de página inválida y baja bloqueada.

**Pendiente:** API-03 debe probar mensajes, `traceId`, ausencia de stack/SQL/tokens y recursos ajenos. La revisión no valida respuestas reales.

## 7. Idempotencia y concurrencia

| Comprobación | Resultado |
|---|---|
| Operaciones con `Idempotency-Key` | 22 |
| Operaciones con `If-Match` | 21 |
| Respuestas con cabecera `ETag` | 15 |
| Pruebas de replay/concurrencia | Pendientes |

Los comandos idempotentes del contrato tienen representación en el YAML. Las ediciones administrativas y transiciones usan `If-Match`/`version`.

**Pendiente:** API-04 debe probar replay, respuesta perdida, misma clave con payload distinto, versión desactualizada y escrituras concurrentes. La revisión no acredita que el servidor los implemente.

## 8. Paginación, tiempo y dinero

- `PageMeta` exige `page`, `pageSize`, `total` y `hasNext`.
- La paginación es 1-based; `pageSize` tiene máximo 100 y cada módulo conserva su límite en el contrato.
- El dinero se representa como cadena decimal PEN con patrón de dos decimales.
- Las fechas se representan como `date-time` RFC 3339; las fechas de negocio como `date`.
- Se añadió un ejemplo de página vacía válida.

**Pendiente:** API-05 debe probar página 0/negativa/texto, página vacía, orden estable, zona horaria Perú/UTC y precisión monetaria.

## 9. Ejemplos ficticios

Se añadieron **8 ejemplos** en **7 esquemas**:

| Esquema | Ejemplos |
|---|---|
| `ProblemDetails` | Página inválida; baja bloqueada |
| `PageMeta` | Página 1 vacía |
| `AuthSession` | Sesión ficticia con access y usuario de ejemplo |
| `Reservation` | Reserva creada ficticia |
| `PaymentAttempt` | Intento de pago ficticio |
| `WebhookAccepted` | Webhook aceptado sin duplicado |
| `ImageAsset` | Imagen ficticia publicada |

Validación realizada:

- JSON Schema 2020-12 sobre los esquemas resueltos.
- **8 ejemplos, 0 fallos.**
- Sin correos, tokens, PAN/CVV, enlaces, reservas, pagos o imágenes reales.
- Los ejemplos del contrato §16 se incorporaron al YAML.

**Pendiente:** CT-12 no se cierra. Faltan ejemplos a nivel de operación/respuesta, ejemplos de error por código y una validación contra un harness o implementación. Los ejemplos actuales son ilustrativos y no prueban el comportamiento del servidor.

## 10. Hallazgos

| ID | Hallazgo | Estado |
|---|---|---|
| RO-01 | Inventario contrato/YAML coincide: 92 operaciones, 0 faltantes y 0 sobrantes. | Superado documentalmente |
| RO-02 | Los 92 `operationId` son únicos y los parámetros de ruta están alineados. | Superado documentalmente |
| RO-03 | Los ejemplos de esquema son válidos y no usan datos reales. | Parcial: solo 7 esquemas |
| RO-04 | La seguridad está declarada por operación, pero la topología y CSRF no están probados. | Abierto: API-02 |
| RO-05 | ProblemDetails y códigos están representados; decisión DEC-220 propuesta, sin pruebas de errores. | Parcial: API-03 |
| RO-06 | Idempotencia y `If-Match` están representados; decisión DEC-220 propuesta, sin pruebas concurrentes. | Parcial: API-04 |
| RO-07 | Paginación, fechas y dinero están representados; decisión DEC-220 propuesta, sin pruebas de borde. | Parcial: API-05 |
| RO-08 | Los campos de proveedor siguen marcados `x-pending-provider-contract`. | Abierto: API-06 |
| RO-09 | Archivos, exportaciones y PDF están representados, sin R2/runtime/licencia. | Abierto: API-07/API-08 |
| RO-10 | Política de propietario, compatibilidad y deprecación propuesta en DEC-219; falta ratificación. | Parcial: API-01 |

## 11. Qué queda para cerrar API-01

1. Revisar operación por operación contra el contrato, no solo el inventario. La [matriz de operaciones](matriz-operaciones-openapi.md), DEC-218, deja el recorrido preparado.
2. Añadir ejemplos de solicitud/respuesta y errores por operación.
3. Validar ejemplos contra un harness o implementación autorizada.
4. Ejecutar CT-02–CT-12 con el [plan de pruebas](plan-pruebas-contrato.md), DEC-221.
5. Ratificar la [política de versión/propiedad/deprecación](politica-versionado-api.md), DEC-219, y las [decisiones transversales](decisiones-transversales-api.md), DEC-220.
6. Confirmar que no se generaron handlers antes de la revisión.

Mientras falte cualquiera de estos puntos, API-01 permanece abierta y el contrato textual sigue siendo la referencia de diseño.

## 12. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
