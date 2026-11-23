# Contrato de API v0.1 — operaciones, permisos y errores

> **Versión:** 0.1, 2026-11-03. **Registro:** DEC-212.  
> **Estado:** propuesta documental **NO IMPLEMENTADA**; no es código, controlador, middleware ni contrato de proveedor verificado. DEC-215 creó un borrador OpenAPI 3.1 no normativo en `diseno/openapi/dmgo-api-v1.yaml`; el texto de este contrato sigue siendo la referencia de diseño hasta su revisión.  
> **Ámbito:** superficie HTTP de las specs 001–013 y complementos 004/005, con permisos, formas de solicitud/respuesta, códigos de error, idempotencia y paginación.  
> **Preservación:** specs, planes, tareas, análisis, contratos y modelo de datos anteriores intactos. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. Sin código, endpoints desplegados, datos reales, proveedores, configuración, commits o push.  
> **Validación:** [revisión documental v0.1](validacion-contrato-api.md), DEC-213; registra hallazgos y puertas abiertas, pero no ratifica este contrato.  
> **Plan API-01:** [plan v0.1](plan-api-01.md), DEC-214; fija la fuente OpenAPI 3.1 y las pruebas de contrato. DEC-215 creó el [borrador OpenAPI](openapi/dmgo-api-v1.yaml), no normativo y sin handlers o endpoints.

## 1. Autoridad y límites

Este contrato deriva de las rutas y condiciones ya propuestas en los planes de [001](../specs/001-reservas/plan.md), [002](../specs/002-pagos/plan.md), [003](../specs/003-vencimiento/plan.md), [004](../specs/004-notificaciones/plan.md), [005](../specs/005-identidad/plan.md), [005-C](../specs/005-identidad/plan-reemision-verificacion.md), [006](../specs/006-catalogo/plan.md), [007](../specs/007-hoteles/plan.md), [008](../specs/008-perfil/plan.md), [009](../specs/009-administracion-reservas/plan.md), [010](../specs/010-clientes-auditoria/plan.md), [011](../specs/011-reportes/plan.md), [012](../specs/012-multimedia/plan.md) y [013](../specs/013-movilidad-informativa/plan.md), y del [modelo de datos](modelo-datos.md).

Reglas de lectura:

- Las rutas, nombres de campos, códigos y ejemplos son **propuestas de diseño**. La fuente normativa es OpenAPI versionada que se publique antes de implementar; este texto no crea endpoints.
- Ninguna operación añade una regla comercial. Si una spec no define un comportamiento, el contrato lo marca como pendiente en lugar de inventarlo.
- Las rutas administrativas exigen rol `admin` **y** comprobación de autorización en Application. Un `403` de presentación no sustituye esa comprobación.
- Los recursos ajenos responden como no disponibles (`404`) para no revelar su existencia; no se usa `403` para ocultar propiedad.
- Los contratos de Culqi y Resend no están verificados. Los campos de sus llamadas y webhooks quedan condicionados a API-06/M-02/G-05; no se copian ejemplos de la documentación como si fueran el contrato real.
- Este documento no ratifica la [base técnica](base-tecnica.md) ni los [contratos propuestos](../contratos/). No autoriza código, migraciones, proveedores ni producción.

## 2. Convenciones de plataforma

| Tema | Propuesta | Condición |
|---|---|---|
| Base | HTTPS obligatorio; prefijo `/api/v1`; JSON UTF-8; `application/problem+json` para errores. | La versión exacta de OpenAPI y la política de compatibilidad se fijan en API-01. |
| Versionado | Cambios incompatibles crean `/api/v2`; adiciones compatibles permanecen en v1. | No romper clientes por cambiar un campo o un mensaje. |
| Identificadores | `uuid` opaco en rutas públicas; `reservationNumber` es un identificador legible separado. | Formato y generación según el modelo de datos; no exponer claves internas. |
| Autenticación API | `Authorization: Bearer <access JWT>`; access corto en memoria del cliente. | Claims mínimos; revocación comprobada contra persistencia en operaciones protegidas. |
| Refresh | Cookie `HttpOnly`, `Secure`, host-only, sin `Domain`; rotación por uso. | `SameSite`, prefijo `__Host-` y CSRF dependen de la topología real (API-02). |
| CSRF | Token antiforgery y verificación de origen en refresh/logout y endpoints autenticados por cookie. | No sustituible por un JWT en header para el canal cookie. |
| CORS | Orígenes explícitos; nunca `*` con credenciales. | Validar Vercel/Render y preflight reales. |
| Roles | `anonymous`, `client`, `admin`; `admin` solo por seed/migración controlada. | El rol nunca se acepta del cuerpo ni de un claim sin revalidación. |
| Propiedad | El cliente solo opera sus reservas, pagos y perfil. | Recurso ajeno = `404`; no revelar estado, importe ni existencia. |
| Idempotencia | `Idempotency-Key` opaca en comandos sensibles; mismo actor/acción/payload devuelve el mismo resultado. | Misma clave con payload distinto = `409 idempotency_conflict`; la clave no contiene PII. |
| Concurrencia | `ETag`/`If-Match` o `version` en el cuerpo para ediciones y transiciones. | Desactualizado = `409 stale_version`; no aplicar silenciosamente. |
| Paginación | `page` entero positivo desde 1; `pageSize` con máximo por módulo; página válida vacía = `200` con `items: []`. | Página 0/negativa/no entera = `400 invalid_page`; no sustituir por la primera. |
| Filtros | Parámetros explícitos; texto vacío tras recortar se omite; filtros combinados con AND. | Rango invertido o fecha inválida = `400`; no reinterpretar. |
| Fechas | Instantes ISO 8601 con offset/UTC; fechas comerciales `YYYY-MM-DD` en `America/Lima`. | No aceptar hora local del navegador como autoridad. |
| Dinero | `"123.45"` como cadena decimal, moneda `"PEN"`; nunca `float` en JSON. | Dos decimales; el backend calcula, el cliente no impone importes. |
| Archivos | `multipart/form-data`; JPG/PNG/WebP; máximo propuesto 5 000 000 bytes por archivo. | Validar MIME y contenido real; `413`/`415`; no confiar en el nombre. |
| Trazas | `traceId` en ProblemDetails; logs sin secretos, tokens, PAN/CVV, enlaces ni cuerpos completos. | No devolver SQL, stack traces ni rutas internas. |
| Rate limiting | Límites por cuenta/IP y por operación; `429` con `Retry-After`. | Valores concretos se calibran; no son SLA. |

### 2.1 Forma de error

```json
{
  "type": "https://dmgo.travel/problems/validation-failed",
  "title": "Solicitud inválida",
  "status": 400,
  "detail": "Revisa los datos enviados.",
  "instance": "/api/v1/reservations",
  "code": "validation_failed",
  "traceId": "00000000000000000000000000000000",
  "errors": {
    "travelers": ["La cantidad de personas debe ser mayor que cero."]
  }
}
```

- `code` es estable y sirve para que la interfaz muestre el mensaje aprobado; `detail` es informativo y no sustituye la regla.
- `errors` solo aparece en validación de campos. `blockers` solo en baja bloqueada, con referencias y situación propia, sin datos de otras cuentas.
- No se incluyen tokens, enlaces, credenciales, PAN/CVV, cuerpos de proveedor ni detalles de infraestructura.

### 2.2 Códigos HTTP

| Código | Uso |
|---|---|
| `200` | Lectura o comando aplicado con cuerpo. |
| `201` | Recurso creado; `Location` cuando corresponda. |
| `202` | Trabajo admitido (envío, exportación, PDF, reenvío) sin resultado final. |
| `204` | Comando aplicado sin cuerpo (logout). |
| `400` | Entrada inválida, token inválido, página/rango inválido o webhook mal formado. |
| `401` | Sin identidad válida, credenciales inválidas o refresh inválido. |
| `403` | Identidad válida sin rol/permiso; correo no verificado para reservar/pagar. |
| `404` | Recurso inexistente o ajeno/no visible. |
| `409` | Conflicto de estado, unicidad, versión, idempotencia o transición. |
| `410` | Artefacto de exportación/reporte expirado y no recuperable. |
| `413` | Archivo o cuerpo demasiado grande. |
| `415` | Formato de archivo no admitido. |
| `429` | Límite de uso; respetar `Retry-After`. |
| `500` | Error interno saneado. |
| `503` | Dependencia/capacidad no disponible; no presentar éxito ficticio. |

## 3. Matriz de permisos

| Superficie | Anónimo | Cliente | Admin | Proveedor |
|---|---|---|---|---|
| Catálogo, hoteles, propuestas, movilidad, media publicada | Sí | Sí | Sí | No |
| Registro/login/refresh/verificación/recuperación | Sí, con límites | Sí | Sí | No |
| Perfil, cambio de correo, baja | No | Solo titular | No modifica perfiles | No |
| Reservas propias, pagos propios, cancelación `pending` | No | Solo propias | No como cliente | No |
| Reservas administrativas, clientes, auditoría, reportes, exportaciones | No | No | Sí | No |
| Catálogo/hoteles/movilidad administrativos | No | No | Sí | No |
| Casos de devolución | No | No | Sí | No |
| Webhooks Culqi/Resend | No | No | No | Firma/contrato del proveedor |
| Jobs, outbox, conciliación | No | No | No | No; puertos internos |

La autorización se comprueba en Application además del middleware. Un `admin` no obtiene acceso a datos de otro cliente fuera de las consultas aprobadas por 009/010/011.

## 4. Identidad, acceso y perfil

### 4.1 Autenticación

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Registro | `POST /api/v1/auth/register` | Anónimo, rate limit, `Idempotency-Key` | `201` + access + cookie refresh | `400`, `409 email_already_registered`, `429` |
| Login local | `POST /api/v1/auth/login` | Anónimo, rate limit | `200` + access + cookie refresh | `401 invalid_credentials`, `429` |
| Renovar access | `POST /api/v1/auth/refresh` | Cookie refresh + CSRF | `200` + access rotado | `401`, `429` |
| Logout actual | `POST /api/v1/auth/logout` | Cliente | `204` | `401` |
| Verificar correo | `POST /api/v1/auth/verify-email` | Prueba de un solo uso | `200` | `400 invalid_token`, `409 already_verified` |
| Reenviar verificación | `POST /api/v1/auth/verify-email/resend` | Cliente titular | `202` | `401`, `409 already_verified`, `429` |
| Solicitar recuperación | `POST /api/v1/auth/password/forgot` | Anónimo, rate limit | `202` genérico | `429` |
| Restablecer contraseña | `POST /api/v1/auth/password/reset` | Prueba de un solo uso | `200` | `400 invalid_token`, `429` |
| Iniciar Google | `GET /api/v1/auth/google/start` | Anónimo | `302` al proveedor | `429` |
| Callback Google | `GET /api/v1/auth/google/callback` | Google | `302` a ruta permitida + cookie | `400`, `401`, `409` |
| Vincular Google | `POST /api/v1/auth/google/link` | Cliente con contraseña | `200` | `401`, `409` |

Reglas:

- Registro y login devuelven el access en el cuerpo y el refresh solo en cookie; nunca el refresh en JSON, URL, fragmento o HTML registrable.
- Login con credenciales inválidas responde genérico, sin distinguir correo inexistente, contraseña incorrecta o cuenta bloqueada.
- El registro crea `client`; no existe registro público de `admin` ni endpoint de cambio de rol.
- La verificación consume la prueba una sola vez; repetir no duplica efectos. La cuenta puede iniciar sesión sin verificar, pero no reservar/pagar.
- **005-C:** el reenvío es una operación autenticada del titular; una admisión válida sustituye los enlaces anteriores y solo el último es consumible. Un enlace sustituido responde `409 request_superseded` o `400 invalid_token` sin verificar. Una solicitud rechazada no invalida el enlace anterior; un fallo de entrega posterior no restaura enlaces antiguos; un reintento de entrega no crea otra generación ni renueva la prueba. Solicitar otro enlace no verifica la cuenta, no desbloquea reserva/pago, no cierra sesiones, no cambia el correo ni invalida solicitudes de cambio de correo o recuperación. El consumo comprueba la prueba ligada a la cuenta y no exige la misma pestaña ni una sesión antigua.
- La recuperación responde `202` aunque la cuenta no exista; no se envía enlace a un correo distinto del autorizado.
- Google solo crea/vinculará si el correo está verificado y no pertenece a otra cuenta; un correo de cuenta con contraseña exige login con contraseña y vinculación posterior.
- Reutilizar un refresh ya rotado revoca la familia y exige un nuevo login; una cuenta deshabilitada o con baja lógica no obtiene login ni refresh.
- `429` respeta `Retry-After`; no se promete un límite distinto del calibrado.

### 4.2 Perfil y baja

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Consultar perfil | `GET /api/v1/profile` | Cliente titular | `200` | `401` |
| Actualizar nombre/teléfono | `PUT /api/v1/profile` | Cliente titular | `200` + `ETag` | `400`, `401`, `409 stale_version` |
| Solicitar cambio de correo | `POST /api/v1/profile/email-change` | Cliente titular + confirmación expresa | `202` | `400`, `401`, `409`, `429` |
| Confirmar cambio de correo | `POST /api/v1/profile/email-change/confirm` | Prueba vinculada | `200`; sesiones cerradas | `400 invalid_token`, `409 email_already_registered`, `409 request_superseded` |
| Solicitar baja | `POST /api/v1/profile/closure` | Cliente titular + confirmación expresa | `200` | `400`, `401`, `409 account_closure_blocked` |

Reglas:

- `GET /profile` incluye nombre, teléfono, correo vigente, estado de verificación y solicitud de cambio pendiente cuando exista; no incluye digests, pruebas, enlaces ni tokens.
- `PUT /profile` acepta solo `fullName` y `phone`; campos omitidos conservan valor, teléfono vacío lo elimina. No acepta correo, rol, estado, contraseña ni datos de reservas.
- La actualización de nombre/teléfono no cierra sesiones ni invalida una solicitud de cambio de correo pendiente; el cambio de correo sí cierra todas y exige volver a entrar.
- Mientras no se confirme la solicitud, el correo actual y su verificación siguen vigentes. Una solicitud pendiente no reserva el destino; la confirmación vuelve a comprobar unicidad. Si otra cuenta lo ocupó, `409 email_already_registered`.
- Una nueva solicitud válida invalida la anterior y solo la última es confirmable. Una confirmación vencida, usada, sustituida, inválida o de una cuenta no activa se rechaza sin cambiar el correo. Un correo que solo difiere en normalización del vigente no crea otra solicitud ni cierra sesiones.
- Al aplicar el cambio, el correo nuevo queda vigente y verificado, el anterior deja de ser credencial o alias y el Google ya vinculado sigue identificando la misma cuenta.
- El cambio aplicado invalida los enlaces pendientes de cambio, verificación y recuperación del correo anterior, y avisa al correo anterior y al nuevo sin contraseñas, tokens ni enlaces de acceso. Un fallo de entrega no revierte el cambio ya aplicado.
- La baja exige confirmación expresa; si hay reservas `pending`/`confirmed`, pago sin resolver o devolución abierta, `409 account_closure_blocked` con `blockers` de referencias propias. No cancela reservas ni ejecuta devoluciones.
- La baja es lógica: conserva historial y unicidad del correo, invalida sesiones y enlaces pendientes y no permite reactivación por login, Google, enlace o nuevo registro.
- Las respuestas de perfil no incluyen digests, pruebas, enlaces, tokens ni datos de otras cuentas.

## 5. Catálogo, hoteles y movilidad públicos

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Listar tours/paquetes | `GET /api/v1/catalog/{type}` | Anónimo | `200` con `items` | `400 invalid_filter`, `400 invalid_range` |
| Detalle de oferta | `GET /api/v1/catalog/{type}/{id}` | Anónimo | `200` | `404` |
| Listar hoteles | `GET /api/v1/hotels` | Anónimo | `200` con `items` | — |
| Detalle de hotel | `GET /api/v1/hotels/{id}` | Anónimo | `200` | `404` |
| Propuestas de una salida | `GET /api/v1/departures/{departureId}/lodging` | Anónimo | `200` | `404` |
| Movilidad pública | `GET /api/v1/mobility` | Anónimo | `200` con `items` | — |

Reglas:

- `type` propuesto en la ruta: `tours` o `packages`; un valor distinto responde `404`. El modelo usa `tour`/`package` como enum interno; el plural público es una propuesta de ruta, no una segunda taxonomía. La taxonomía exacta y el tratamiento del tipo inválido siguen sujetos a ACL-05/ACL-30; este contrato no las cierra.
- Catálogo: sin paginación visible, orden alfabético; filtros opcionales por precio de tarjeta, duración mínima/máxima, fechas inclusivas y destino en nombre/descripción. Rango invertido = `400` con `El rango no es válido`; sin coincidencias = `200` con `items: []`, `No se encontraron resultados` y `Limpiar filtros`.
- Detalle de oferta no visible = `404` con `Oferta no disponible`; no se devuelve un borrador ni se revela que existe.
- Hoteles: sin paginación ni filtros; un hotel activo sin inventario sigue visible con `Sin disponibilidad`. Inactivo/eliminado = `404` con `Hotel no disponible`.
- Propuestas: devuelven todos los tipos activos del hotel y disponibilidad por noche; no retienen cupos ni alteran precios.
- Movilidad: solo activos, orden alfabético, sin detalle público individual, filtros, buscador, carrusel ni paginación.
- Las lecturas públicas no exigen JWT y no exponen datos internos, auditoría ni referencias administrativas.

## 6. Reservas del cliente

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Crear reserva | `POST /api/v1/reservations` | Cliente verificado | `201` + `Location` | `400`, `401`, `403 email_not_verified`, `409 reservation_unavailable`, `429` |
| Historial propio | `GET /api/v1/reservations` | Cliente titular | `200` paginado | `400 invalid_page`, `401` |
| Detalle propio | `GET /api/v1/reservations/{id}` | Cliente titular | `200` | `401`, `404` |
| Cancelar `pending` | `POST /api/v1/reservations/{id}/cancel` | Cliente titular | `200` | `401`, `404`, `409 transition_not_allowed`, `409 stale_version` |

Solicitud de creación propuesta:

```json
{
  "departureId": "00000000-0000-0000-0000-000000000000",
  "travelers": 2,
  "lodging": {
    "proposalId": "00000000-0000-0000-0000-000000000000",
    "roomTypeId": "00000000-0000-0000-0000-000000000000"
  }
}
```

- `Idempotency-Key` viaja en la cabecera, no en el cuerpo; es obligatoria para crear la reserva y su replay no duplica compromisos.
- El backend obtiene propietario, precios, disponibilidad y estado; ignora cualquier precio/total/estado enviado por el cliente.
- `travelers` entero positivo; el alojamiento es opcional y, si existe, una sola propuesta/tipo/período/habitación.
- Respuesta: `id`, `reservationNumber`, `status`, `departure`, `lodging` opcional, `travelers`, `total`, `currency`, `paymentDeadlineAt`, `validationDeadlineAt`, `version`.
- Historial: página 1-based, 10 elementos por página, orden por creación descendente y número de reserva descendente. Página 0/negativa/texto = `400` con `Número de página no válido`; página válida vacía = `200` con `items: []` y mensaje de lista vacía.
- Detalle/cancelación de reserva ajena = `404`; no se revela su existencia.
- Cancelación solo `pending`; durante pago en verificación se rechaza (`409 transition_not_allowed`). Repetir una cancelación ya aplicada devuelve el estado sin liberar otra vez.
- No existe endpoint público para `pending → confirmed`, para modificar importes/estado ni para cancelar `confirmed` como cliente. La confirmación y el vencimiento usan puertos internos, no una transición HTTP libre.

## 7. Pagos, webhooks y devoluciones

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Iniciar pago | `POST /api/v1/reservations/{id}/payments` | Cliente titular, reserva `pending`, dentro de 15 min | `201` con intento | `400`, `401`, `403`, `404`, `409 payment_not_payable`, `429` |
| Consultar pago propio | `GET /api/v1/payments/{id}` | Cliente titular | `200` | `401`, `404` |
| Webhook Culqi | `POST /api/v1/webhooks/culqi` | Firma/contrato del proveedor | `200`/`202` tras recepción durable | `400`, `401`, `503` |
| Listar casos de devolución | `GET /api/v1/admin/refund-cases` | Admin | `200` paginado | `400`, `401`, `403` |
| Detalle de caso | `GET /api/v1/admin/refund-cases/{id}` | Admin | `200` | `401`, `403`, `404` |
| Autorizar devolución | `POST /api/v1/admin/refund-cases/{id}/authorize` | Admin | `200` | `401`, `403`, `404`, `409 refund_not_authorizable`, `409 stale_version` |
| Reintentar devolución | `POST /api/v1/admin/refund-cases/{id}/retry` | Admin | `202` | `401`, `403`, `404`, `409`, `429` |

Reglas:

- Medios: `card` o `yape`; no PagoEfectivo, pagos parciales ni otro medio. Si Yape no admite el total, no se envía el cobro ni se fracciona; renovar un código Yape no amplía la ventana.
- El inicio registra el intento antes de llamar al proveedor; no se acepta un intento en el corte de 15 o después ni sobre una reserva no cobrable. Un segundo intento no resuelto activo = `409 payment_not_payable`.
- La respuesta de inicio solo contiene datos oficiales del proveedor validados en el contrato real; no PAN, CVV, código Yape, credenciales ni tokens de checkout. Los campos exactos quedan pendientes de API-06.
- El estado del intento es técnico (`created`, `sent`, `unknown`, `approved`, `rejected`); no se presenta como estado comercial de la reserva. «Pago en verificación» es una etiqueta de presentación para `sent`/`unknown`, no un estado almacenado adicional, y no se trata como rechazo.
- Un rechazo definitivo antes del minuto 15 cierra solo el intento y permite otro dentro de la ventana original; durante la tolerancia cancela la reserva. Un `unknown` mantiene los bloqueos hasta resultado oficial o corte de 20; un intento rechazado no se reabre. La validación en el minuto 20 o después no confirma y deja paso a la cancelación por vencimiento.
- El webhook no usa JWT de cliente; valida autenticidad/firma y responde `2xx` solo tras recepción durable. Un evento repetido no duplica pago/confirmación; uno distinto se conserva y el excedente genera devolución. Un timeout o error de transporte no repite el `POST` financiero: se consulta el resultado oficial.
- La confirmación de la reserva ocurre por el caso de uso interno tras validar el pago; no existe un endpoint público `pending → confirmed`.
- Devoluciones: solo `admin` autoriza; el caso conserva importe/moneda/fechas/referencia; no se exige adjunto ni se crea una política nueva de devolución. Un caso vencido sigue abierto; no se autoautoriza. La suma ejecutada más la reservada en intentos en curso/desconocidos no puede exceder el cobro.
- El webhook no devuelve detalles internos ni el cuerpo completo a logs; un fallo de persistencia no se acusa como éxito.
- Una devolución enviada no se presenta como abono recibido; el estado del caso y la evidencia oficial gobiernan la presentación.

## 8. Administración de catálogo, hoteles y movilidad

### 8.1 Catálogo

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Listar administrables | `GET /api/v1/admin/catalog/{type}` | `200` | `400`, `401`, `403` |
| Crear oferta | `POST /api/v1/admin/catalog/{type}` | `201`, desactivada | `400`, `401`, `403` |
| Editar oferta | `PUT /api/v1/admin/catalog/{type}/{id}` | `200` + `ETag` | `400`, `401`, `403`, `404`, `409 incomplete_publication`, `409 stale_version` |
| Activar | `POST /api/v1/admin/catalog/{type}/{id}/activate` | `200` | `401`, `403`, `404`, `409` |
| Desactivar | `POST /api/v1/admin/catalog/{type}/{id}/deactivate` | `200` | `401`, `403`, `404`, `409` |
| Crear salida | `POST /api/v1/admin/catalog/{type}/{id}/departures` | `201` | `400`, `401`, `403`, `404`, `409` |
| Editar salida | `PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId}` | `200` | `400`, `401`, `403`, `404`, `409` |
| Precio de oferta | `PUT /api/v1/admin/catalog/{type}/{id}/pricing` | `200` | `400`, `401`, `403`, `404`, `409` |
| Precio de salida | `PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId}/pricing` | `200` | `400`, `401`, `403`, `404`, `409` |
| Itinerario | `PUT /api/v1/admin/catalog/{type}/{id}/itinerary` | `200` | `400`, `401`, `403`, `404`, `409` |
| Subir imagen | `POST /api/v1/admin/catalog/{type}/{id}/images` | `201` | `401`, `403`, `404`, `413`, `415` |
| Reemplazar imagen | `PUT /api/v1/admin/catalog/{type}/{id}/images/{imageId}` | `200` | `401`, `403`, `404`, `413`, `415` |
| Eliminar imagen | `DELETE /api/v1/admin/catalog/{type}/{id}/images/{imageId}` | `204` | `401`, `403`, `404`, `409 incomplete_publication` |

Reglas:

- `type` público = `tours`/`packages`; no se deduce del nombre ni se confunde con el enum interno singular.
- Crear deja la oferta desactivada. Activar exige nombre, descripción, precio, duración, itinerario, al menos una imagen y condiciones; si falta, `409 incomplete_publication`.
- Un borrador puede guardarse incompleto; editar una oferta publicada sin los datos obligatorios = `409 incomplete_publication` y conserva la versión anterior.
- Nombres únicos por tipo entre publicadas; dos borradores pueden coincidir. El conflicto se comprueba al publicar/activar (`409 duplicate_name`); no fusionar ni sobrescribir.
- Salida sin precio normal propio no es reservable; no se hereda precio/descuento de la tarjeta. Precio normal/rebajado inválido = `400`.
- Reducir cupos por debajo de compromisos = `409`; desactivar impide nuevas reservas y conserva existentes.
- Itinerario con reservas pendientes/confirmadas = `409`; no se crean variantes por salida.
- Imágenes: una principal y galería; sin máximo comercial; 5 MB por archivo; fallo conserva las anteriores. Quitar la última imagen de una oferta publicada = `409 incomplete_publication`. La respuesta no expone bucket, claves internas ni URLs firmadas.
- La lista administrativa puede paginarse técnicamente si el volumen de colecciones abiertas lo exige; no se convierte en un límite comercial de cantidad.

### 8.2 Hoteles

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Listar administrables | `GET /api/v1/admin/hotels` | `200` | `401`, `403` |
| Crear hotel | `POST /api/v1/admin/hotels` | `201`, desactivado | `400`, `401`, `403` |
| Editar hotel | `PUT /api/v1/admin/hotels/{id}` | `200` + `ETag` | `400`, `401`, `403`, `404`, `409 incomplete_publication`, `409 stale_version` |
| Activar/desactivar | `POST /api/v1/admin/hotels/{id}/activate` \| `/deactivate` | `200` | `401`, `403`, `404`, `409` |
| Crear tipo | `POST /api/v1/admin/hotels/{id}/room-types` | `201` | `400`, `401`, `403`, `404`, `409 duplicate_name` |
| Editar tipo | `PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId}` | `200` | `400`, `401`, `403`, `404`, `409` |
| Actualizar inventario | `PUT /api/v1/admin/room-types/{id}/inventory` | `200` | `400`, `401`, `403`, `404`, `409 inventory_below_commitments` |
| Crear propuesta | `POST /api/v1/admin/lodging-proposals` | `201` | `400`, `401`, `403`, `404`, `409` |
| Editar propuesta | `PUT /api/v1/admin/lodging-proposals/{id}` | `200` | `400`, `401`, `403`, `404`, `409` |
| Imágenes de hotel/tipo | `POST`/`PUT`/`DELETE .../images[/{imageId}]` | `201`/`200`/`204` | `401`, `403`, `404`, `409 incomplete_publication`, `413`, `415` |

Reglas:

- Hotel activo exige nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo válido; si no, `409 incomplete_publication`.
- Nombre único entre hoteles activos; un borrador puede coincidir y el conflicto se comprueba al activar (`409 duplicate_name`).
- Un hotel desactivado puede guardarse incompleto; editar un hotel activo sin los datos obligatorios = `409 incomplete_publication` y conserva la versión anterior.
- Tipo: nombre único dentro del hotel, capacidad entera positiva, tarifa base positiva; una sola tarifa por tipo.
- Inventario: una fila por tipo/fecha/noche, cantidad no negativa; reducción por debajo de compromisos = `409`; no se bloquea parcialmente una estancia.
- Propuesta: salida/hotel/período futuro múltiplo de 24 h; ofrece todos los tipos activos; no se guarda subconjunto. Cambiar fechas no altera reservas existentes.
- Imágenes de tipo opcionales; sin fotos no se muestra placeholder. Quitar la última imagen de un hotel activo = `409 incomplete_publication`; la de un tipo no exige imagen.

### 8.3 Movilidad

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Listar administrables | `GET /api/v1/admin/mobility` | `200` | `401`, `403` |
| Leer para editar | `GET /api/v1/admin/mobility/{id}` | `200` | `401`, `403`, `404` |
| Crear borrador | `POST /api/v1/admin/mobility` | `201`, desactivado | `400`, `401`, `403` |
| Guardar contenido | `PUT /api/v1/admin/mobility/{id}` | `200` + `ETag` | `400`, `401`, `403`, `404`, `409 stale_version` |
| Cargar/reemplazar imagen | `PUT /api/v1/admin/mobility/{id}/image` | `200` | `401`, `403`, `404`, `413`, `415` |
| Activar | `POST /api/v1/admin/mobility/{id}/activate` | `200` | `401`, `403`, `404`, `409 duplicate_name`, `409 incomplete_publication` |
| Desactivar | `POST /api/v1/admin/mobility/{id}/deactivate` | `200` | `401`, `403`, `404` |

Reglas:

- Crear deja desactivado; un borrador puede guardarse incompleto. Activar exige nombre, características, capacidad positiva e imagen válida.
- Unicidad de nombre/tipo entre activos, comprobada al activar (`409 duplicate_name`); no se fusionan registros.
- Una sola imagen principal; sin galería, filtros, buscador, paginación ni eliminación física.
- `PUT` no cambia el estado; activar/desactivar son operaciones separadas y auditadas.

## 9. Administración de reservas, clientes, auditoría y reportes

### 9.1 Reservas

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Listar reservas | `GET /api/v1/admin/reservations` | `200` paginado | `400 invalid_filter`, `401`, `403` |
| Detalle | `GET /api/v1/admin/reservations/{id}` | `200` | `401`, `403`, `404` |
| Cancelar `confirmed` antes del inicio | `POST /api/v1/admin/reservations/{id}/cancel` | `200` | `400`, `401`, `403`, `404`, `409 transition_not_allowed`, `409 stale_version` |
| Completar `confirmed` al terminar | `POST /api/v1/admin/reservations/{id}/complete` | `200` | `400`, `401`, `403`, `404`, `409 transition_not_allowed`, `409 stale_version` |

Reglas:

- Lista: 20 por página, máximo 100; filtros por estado, tour, hotel, IDs exactos y correo parcial; fechas por día completo en hora Perú. Página inválida = `400`; página vacía = `200` con `items: []`.
- Cancelación: solo `confirmed` estrictamente antes del primer inicio contratado, con motivo de 1–2000 caracteres y confirmación; no `pending`/`completed`/`cancelled`. Abre/vincula devolución total sin duplicar un caso existente.
- Completar: solo `confirmed` con todos los períodos terminados y confirmación expresa del administrador; no genera devolución ni libera recursos.
- Un replay de la misma operación devuelve el mismo resultado; una versión distinta = `409 stale_version`; un estado incompatible = `409 transition_not_allowed`.
- No se expone un `PATCH` libre de estado ni se aceptan importes, fechas, cliente o cantidades de liberación del navegador.

### 9.2 Clientes y auditoría

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Listar clientes | `GET /api/v1/admin/clients` | `200` paginado | `400 invalid_filter`, `401`, `403` |
| Detalle de cliente | `GET /api/v1/admin/clients/{id}` | `200` | `401`, `403`, `404` |
| Listar auditoría | `GET /api/v1/admin/audit` | `200` paginado | `400 invalid_filter`, `401`, `403` |
| Detalle de auditoría | `GET /api/v1/admin/audit/{id}` | `200` | `401`, `403`, `404` |
| Exportar clientes CSV | `POST /api/v1/admin/exports/clients` | `202` + `exportId` | `400`, `401`, `403`, `503 capture_capacity_exceeded` |
| Exportar auditoría CSV | `POST /api/v1/admin/exports/audit` | `202` + `exportId` | `400`, `401`, `403`, `503` |
| Estado de exportación | `GET /api/v1/admin/exports/{id}` | `200` | `401`, `403`, `404` |
| Descargar exportación | `GET /api/v1/admin/exports/{id}/download` | `200` archivo | `401`, `403`, `404`, `409 export_not_ready`, `410 export_expired` |

Reglas:

- Clientes: 25 por página, máximo 100; filtros por nombre/correo parcial, ID/estado exactos y fecha de registro. Cliente con baja: solo ID, estado de baja y cantidad de reservas.
- Auditoría: 25 por página, máximo 100; filtros por fecha, actor, entidad, correlación, acción, tipo y resultado; sin búsqueda libre por payload.
- Rangos por días completos inclusivos en hora Perú, convertidos a UTC; inversión/fecha inválida = `400`; página vacía = `200`.
- La captura de exportación se materializa al admitir la solicitud; `202` no significa archivo listo. Repetir la misma clave devuelve el mismo `exportId`; no crea otra captura.
- La descarga no entrega un archivo parcial; un artefacto expirado = `410`; uno no listo = `409`.
- No hay endpoints de edición/baja/reactivación de clientes ni de modificación/eliminación de auditoría.

### 9.3 Reportes

| Operación | Método y ruta | Éxito | Errores principales |
|---|---|---|---|
| Crear resultado de reporte | `POST /api/v1/admin/reports` | `202` + `reportId` + `referenceAt` | `400`, `401`, `403`, `503` |
| Consultar resultado | `GET /api/v1/admin/reports/{id}` | `200` | `401`, `403`, `404`, `410 report_expired` |
| Leer filas | `GET /api/v1/admin/reports/{id}/rows` | `200` paginado | `400 invalid_page`, `401`, `403`, `404`, `410 report_expired` |
| Solicitar PDF | `POST /api/v1/admin/reports/{id}/pdf` | `202` | `401`, `403`, `404`, `409`, `410 report_expired` |
| Descargar PDF | `GET /api/v1/admin/reports/{id}/pdf` | `200` PDF | `401`, `403`, `404`, `409 report_not_ready`, `410 report_expired` |

Reglas:

- El cuerpo contiene selección/filtros/referencia; no agregados, tipos de cambio ni estados objetivo calculados por el cliente.
- El resultado se captura bajo una vista coherente; `referenceAt` es el punto real de la captura, no el reloj del navegador ni el arranque del worker.
- Filas: 25 por página, máximo 100; el PDF incluye **todas** las filas capturadas, no solo la página visible.
- Una referencia expirada/no recuperable = `410`; no se recalcula con datos nuevos bajo el identificador antiguo.
- El PDF no incluye contactos/ID de cliente, tarjetas, credenciales, enlaces de acceso ni imágenes remotas no solicitadas.

## 10. Notificaciones y vencimiento

### 10.1 Notificaciones

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Webhook Resend | `POST /api/v1/webhooks/resend` | Firma Svix/contrato | `200`/`202` tras recepción durable | `400`, `401`, `503` |
| Listar incidentes | `GET /api/v1/admin/notification-incidents` | Admin | `200` paginado | `401`, `403` |
| Detalle de incidente | `GET /api/v1/admin/notification-incidents/{id}` | Admin | `200` | `401`, `403`, `404` |
| Reenvío manual | `POST /api/v1/admin/notification-deliveries/{id}/resend` | Admin | `202` | `401`, `403`, `404`, `409 already_manually_resent`, `429` |

Reglas:

- El webhook valida el cuerpo original y la firma antes de deserializar; no usa JWT de cliente; no acusa persistencia que no ocurrió.
- Un evento repetido no duplica entrega; un evento posterior no borra un rebote/entrega conocida. «Aceptado» no es «entregado»; «entregado» no es «leído».
- El reenvío manual es una generación nueva y única por entrega original; no reutiliza la clave de una aceptada, no crea ni renueva un enlace de identidad y no se envía a un correo arbitrario.
- Si el destinatario cambió o perdió autorización, no se muta silenciosamente: se retiene/escala.

### 10.2 Vencimiento

Este contrato **no define una ruta administrativa dedicada al vencimiento**. La evidencia de fallo, reintento y alerta se consulta mediante la auditoría/incidentes de 010/004 dentro de su alcance aprobado; no se añade un panel, una cancelación forzada ni una liberación manual.

Reglas:

- No existe endpoint público de vencimiento ni cancelación forzada/liberación manual.
- Los jobs usan el mismo comando idempotente; el estado de Hangfire no es estado de negocio.
- Un incidente no crea `expired`/`processing` ni reactiva una reserva. El máximo de 60 segundos no se amplía desde la API.

## 11. Multimedia

| Operación | Método y ruta | Permiso | Éxito | Errores principales |
|---|---|---|---|---|
| Leer imagen publicada | `GET /api/v1/media/{assetId}` | Anónimo | `200` binario | `404 media_not_published` |
| Previsualizar activo | `GET /api/v1/admin/media/{assetId}` | Admin | `200` binario | `401`, `403`, `404` |

Reglas:

- Solo se lee públicamente si existe marca durable de publicación y el objeto está disponible; subir a un borrador no publica. Desactivar el servicio no borra esa marca ni republica el servicio, y el enlace conocido puede seguir leyendo mientras el archivo se conserve.
- La respuesta usa MIME canónico, `X-Content-Type-Options: nosniff`, longitud/integridad verificadas y `Cache-Control: no-store` inicial.
- La previsualización administrativa es privada y no genera una URL pública temporal.
- No existe un endpoint genérico de subida pública; las cargas se ligan al consumidor (oferta, hotel, tipo, movilidad) y a su transacción.
- Un fallo de carga/asociación conserva las referencias anteriores; no se borra otra foto en compensación. Un fallo de lectura no borra la asociación ni desactiva el servicio.
- No se exponen bucket, claves administrativas, rutas temporales ni cabeceras firmadas.

## 12. Catálogo de errores de dominio

| `code` | HTTP | Cuándo | Mensaje/tratamiento |
|---|---|---|---|
| `validation_failed` | 400 | Campos inválidos o no autorizados | Errores por campo; sin cambios parciales. |
| `invalid_page` | 400 | Página 0/negativa/no entera | `Número de página no válido`. |
| `invalid_range` | 400 | Rango invertido o fecha inválida | `El rango no es válido`; no intercambiar extremos. |
| `invalid_filter` | 400 | Filtro mal tipado/valor no admitido | No reinterpretar como filtro vacío. |
| `invalid_token` | 400 | Enlace/prueba inválido, vencido o usado | No modificar identidad/contraseña. |
| `unauthenticated` | 401 | Sin access válido | No revelar si la cuenta existe. |
| `invalid_credentials` | 401 | Login incorrecto | Mensaje genérico. |
| `forbidden` | 403 | Rol/permiso insuficiente | No ejecutar la operación. |
| `email_not_verified` | 403 | Reservar/pagar sin verificar | Mantener login, bloquear reserva/pago. |
| `not_found` | 404 | Recurso inexistente o ajeno | No revelar existencia de recursos ajenos. |
| `reservation_unavailable` | 409 | Salida/hotel/cupo no disponible | No crear reserva parcial. |
| `payment_not_payable` | 409 | Reserva no cobrable, corte vencido o intento activo | No iniciar otro cobro. |
| `transition_not_allowed` | 409 | Estado/instante incompatible | Conservar estado; no forzar transición. |
| `stale_version` | 409 | `If-Match`/versión desactualizada | Releer antes de reintentar. |
| `duplicate_name` | 409 | Unicidad de nombre/tipo | No fusionar ni sobrescribir. |
| `incomplete_publication` | 409 | Activar/editar publicado sin datos obligatorios | Conservar versión persistida. |
| `inventory_below_commitments` | 409 | Reducción bajo reservas/bloqueos | Rechazar; no sobrevender. |
| `account_closure_blocked` | 409 | Reservas/pagos/devoluciones activos | `blockers` con referencias propias; no cancelar. |
| `email_already_registered` | 409 | Correo ocupado por otra cuenta | No duplicar ni fusionar. |
| `already_verified` | 409 | Reenviar verificación ya completada | No emitir otro enlace. |
| `request_superseded` | 409 | Enlace anterior sustituido | Usar el más reciente. |
| `idempotency_conflict` | 409 | Misma clave con payload distinto | Rechazar; no ejecutar dos veces. |
| `already_manually_resent` | 409 | Segunda generación manual | No duplicar el envío. |
| `refund_not_authorizable` | 409 | Caso ya ejecutado/en curso/no autorizable | Consultar antes de reintentar. |
| `export_not_ready` | 409 | Artefacto aún no generado | Consultar estado; no descargar parcial. |
| `report_not_ready` | 409 | PDF aún no generado | Consultar estado; no descargar parcial. |
| `payload_too_large` | 413 | Archivo/cuerpo excede límite | No publicar; conservar anterior. |
| `unsupported_media_type` | 415 | Formato no admitido | No publicar; conservar anterior. |
| `rate_limited` | 429 | Límite de uso | Respetar `Retry-After`; no loop rápido. |
| `export_expired` | 410 | Referencia/artefacto de exportación expirado | Solicitar una referencia nueva. |
| `report_expired` | 410 | Resultado/PDF de reporte no recuperable | Solicitar una referencia nueva. |
| `media_not_published` | 404 | Activo no publicado o no disponible | No revelar borradores. |
| `capture_capacity_exceeded` | 503 | Captura de exportación saturada | No admitir un job con otra vista. |
| `provider_unavailable` | 503 | Culqi/Resend/R2 no disponible | No declarar éxito; recuperar según contrato. |
| `internal_error` | 500 | Fallo no controlado | Mensaje saneado + `traceId`. |

Los mensajes exactos de interfaz aprobados se conservan en la UI; el `code` es el contrato estable. No se añaden mensajes comerciales nuevos por este catálogo.

## 13. Idempotencia, concurrencia y transiciones

### 13.1 Comandos idempotentes

| Comando | Clave | Replay |
|---|---|---|
| Registro | `Idempotency-Key` | Devuelve la misma cuenta; no duplica correo ni tokens. |
| Crear reserva | `Idempotency-Key` | Devuelve la misma reserva; no duplica compromisos. |
| Iniciar pago | `Idempotency-Key` | Devuelve el mismo intento; no envía otro cobro. |
| Cancelar/completar admin | `Idempotency-Key` + `If-Match` | Devuelve el mismo resultado; no repite liberación/devolución/aviso. |
| Cambio de correo/baja | `Idempotency-Key` | No duplica generaciones ni avisos. |
| Exportación/reporte/PDF | `Idempotency-Key` | Devuelve el mismo trabajo; no crea otra captura. |
| Reenvío manual | `Idempotency-Key` | Una sola generación manual; la segunda se rechaza. |

### 13.2 Versiones

- Las ediciones administrativas y las transiciones de reserva usan `ETag`/`If-Match` o `version` en el cuerpo.
- Una versión desactualizada devuelve `409 stale_version`; no se aplica la escritura sobre un estado distinto.
- Un replay de una operación ya aplicada devuelve el resultado sin nueva auditoría de éxito, liberación, caso o aviso.
- Un `409` de negocio no se reintenta automáticamente; solo deadlocks/conflictos transitorios pueden reintentarse con nueva lectura y autorización.

### 13.3 Frontera interna

- Confirmar pago, cancelar por vencimiento, liberar inventario, anexar auditoría y crear intención de notificación son **puertos internos**, no rutas HTTP públicas.
- No se expone una transición libre `pending → confirmed` ni un endpoint para editar estado, importe, propietario, fechas o retenciones.
- Los webhooks solo reciben el hecho externo y lo correlacionan con el caso de uso; no sustituyen la validación oficial ni la transacción local.

## 14. Paginación, filtros y respuestas de lista

Forma propuesta:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "hasNext": false
}
```

- `page` desde 1; `pageSize` con máximo por módulo: historial 10, administración de reservas 20, clientes/auditoría/reportes 25; máximo 100.
- `total` es informativo y se obtiene de forma coherente con la página; no se promete inmovilidad entre peticiones.
- Página válida sin resultados = `200` con `items: []`; no es `404` ni salto de página.
- Filtros de fecha usan días completos en hora Perú, con inicio inclusivo y comienzo del día siguiente exclusivo; un extremo omitido deja rango abierto.
- Texto vacío tras recortar se omite; comodines SQL se tratan como texto; no se aceptan campos/orden arbitrarios.
- Las listas públicas de catálogo/hoteles/movilidad no se paginan visiblemente; no se añade un límite de cinco ni un carrusel.

## 15. Seguridad, privacidad y archivos

- HTTPS obligatorio; HSTS y TLS verificados en el entorno real. No se acepta tráfico mixto.
- Access en memoria; refresh en cookie segura; no `localStorage`/`sessionStorage`, URL o fragmento.
- CORS explícito; CSRF/origen en endpoints de cookie; no wildcard con credenciales.
- Errores y logs sin contraseñas, JWT, refresh, tokens, enlaces, PAN/CVV, códigos Yape, credenciales ni cuerpos completos de proveedor.
- Recursos ajenos = `404`; no se filtra existencia, importe, estado ni correo.
- Archivos: validar extensión, MIME y contenido real; límite 5 000 000 bytes; sin filesystem persistente; sin ejecutar contenido subido.
- Exportaciones/PDF: artefactos privados, nombres seguros, sin texto arbitrario del cliente; descarga solo con autorización vigente.
- No se añaden endpoints de usuarios/roles, edición de auditoría, baja/reactivación de clientes ni reparación financiera.

## 16. Ejemplos ficticios

### 16.1 Reserva creada

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "reservationNumber": "R-00000000",
  "status": "pending",
  "travelers": 2,
  "total": "250.00",
  "currency": "PEN",
  "paymentDeadlineAt": "2026-11-03T15:15:00Z",
  "validationDeadlineAt": "2026-11-03T15:20:00Z",
  "version": 1
}
```

### 16.2 Página inválida

```json
{
  "type": "https://dmgo.travel/problems/invalid-page",
  "title": "Solicitud inválida",
  "status": 400,
  "detail": "Número de página no válido",
  "code": "invalid_page",
  "traceId": "00000000000000000000000000000000"
}
```

### 16.3 Baja bloqueada

```json
{
  "type": "https://dmgo.travel/problems/account-closure-blocked",
  "title": "No se puede completar la baja",
  "status": 409,
  "detail": "Existen operaciones activas que impiden la baja.",
  "code": "account_closure_blocked",
  "blockers": [
    { "type": "reservation", "reference": "R-00000000", "status": "confirmed" }
  ],
  "traceId": "00000000000000000000000000000000"
}
```

Los ejemplos no representan datos reales, cuentas, reservas, pagos ni correos.

## 17. Puertas del contrato de API

| ID | Condición pendiente | Evidencia requerida |
|---|---|---|
| API-01 — OpenAPI y versionado | Fuente normativa, versión OpenAPI, nombres, compatibilidad y deprecación | OpenAPI revisado y contract tests; no generar handlers antes. |
| API-02 — Autenticación/transporte | Cookies cross-site, `SameSite`, `__Host-`, CSRF, CORS, refresh y revocación | Pruebas en topología real Vercel/Render; no asumir `Lax`. |
| API-03 — Errores | ProblemDetails, catálogo de códigos, mensajes, no filtración y `traceId` | Pruebas de errores y recursos ajenos; sin stack/SQL. |
| API-04 — Idempotencia/concurrencia | Claves, `ETag`/`If-Match`, replays, versiones y conflictos | Pruebas concurrentes y de respuesta perdida. |
| API-05 — Paginación/filtros/tiempo/dinero | Límites por módulo, fechas Perú/UTC, decimales y orden | Pruebas de borde y contract tests. |
| API-06 — Proveedores | Contrato real Culqi/Resend, webhooks, firmas, idempotencia y recuperación | Contratos oficiales verificados; sin operaciones live. |
| API-07 — Archivos/media | Multipart, 5 MB = 5 000 000 bytes, MIME/contenido, publicación y previsualización | Pruebas de carga/reemplazo/fallo y lectura publicada. |
| API-08 — Exportaciones/PDF | Captura, estados, descarga, expiración y PDF completo | Pruebas de caída, concurrencia y artefacto no listo. |

Estas puertas se suman a BT-01–BT-04, MD-01–MD-08, RV-01–RV-05, G/V/M/I/P/R/A/Q/U y a las puertas específicas de cada plan. Ninguna se cierra por redactar este contrato.

## 18. Trazabilidad y conteos

| Fuente | Superficie principal |
|---|---|
| 001 | Reservas propias, historial, detalle, cancelación `pending`. |
| 002 | Inicio/consulta de pago, webhook Culqi, casos/devoluciones. |
| 003 | Sin endpoint dedicado de vencimiento ni cancelación forzada; evidencia vía 010/004. |
| 004 | Webhook Resend, incidentes y reenvío manual. |
| 005/005-C | Registro, login, refresh, logout, verificación, reenvío, reset y Google. |
| 006 | Catálogo público/administrativo, salidas, precios, itinerario, imágenes. |
| 007 | Hoteles, tipos, inventario, propuestas e imágenes. |
| 008 | Perfil, cambio de correo y baja. |
| 009 | Reservas administrativas, cancelación y finalización. |
| 010 | Clientes, auditoría y CSV. |
| 011 | Reporte, filas y PDF. |
| 012 | Lectura/previsualización de media. |
| 013 | Movilidad pública/administrativa e imagen. |

No se añaden RF, HU, RN, criterios ni tareas. El inventario permanece en **677 criterios aprobados y 402 tareas pendientes**, cero ejecutadas. Este contrato es una propuesta de diseño; no ratifica la base técnica, el modelo de datos, los contratos propuestos ni la arquitectura, y no autoriza implementación.
