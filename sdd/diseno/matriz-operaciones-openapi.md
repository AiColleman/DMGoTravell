# Matriz de operaciones del OpenAPI v0.1

> **Fecha:** 2026-11-04. **Versión:** 0.1. **Registro:** DEC-218.  
> **Objeto:** [dmgo-api-v1.yaml](openapi/dmgo-api-v1.yaml), [contrato de API](contrato-api.md), [revisión OpenAPI](revision-openapi.md) y [plan API-01](plan-api-01.md).  
> **Estado:** matriz documental **NO NORMATIVA**; no ratifica el OpenAPI, no ejecuta CT-02–CT-12 y no genera handlers.  
> **Límite:** solo `sdd/`; sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.

## 1. Objetivo

Recorrer las **92 operaciones** del borrador OpenAPI y dejar visible, para cada una, su módulo, seguridad, idempotencia, control de concurrencia, códigos de éxito y errores declarados. La matriz sirve para preparar CT-02–CT-12; no sustituye su ejecución.

## 2. Método y alcance

- Lectura del YAML y resolución de parámetros `$ref`.
- Agrupación por sección del contrato (`x-contract-section`).
- Seguridad derivada de `security`: `público`, `bearer`, `cookie`, `cookie+CSRF`, `firma`.
- `Idem` = presencia de `Idempotency-Key`; `If-Match` = presencia de la cabecera de concurrencia.
- Éxito = respuestas `2xx`/`3xx`; errores = respuestas `4xx`/`5xx` declaradas.
- Los códigos de error del contrato son principales, no necesariamente exhaustivos; la matriz refleja lo declarado en el YAML.

## 3. Resumen

| Sección | Operaciones |
|---|---:|
| 4.1 — Autenticación | 11 |
| 4.2 — Perfil y baja | 5 |
| 5 — Catálogo, hoteles y movilidad públicos | 6 |
| 6 — Reservas del cliente | 4 |
| 7 — Pagos, webhooks y devoluciones | 7 |
| 8.1 — Administración de catálogo | 13 |
| 8.2 — Administración de hoteles | 16 |
| 8.3 — Administración de movilidad | 7 |
| 9.1 — Administración de reservas | 4 |
| 9.2 — Clientes, auditoría y exportaciones | 8 |
| 9.3 — Reportes | 5 |
| 10.1 — Notificaciones | 4 |
| 11 — Multimedia | 2 |
| **Total** | **92** |

| Indicador | Total |
|---|---:|
| Operaciones | 92 |
| Públicas o con firma | 17 |
| Con `Idempotency-Key` | 22 |
| Con `If-Match` | 21 |
| Con éxito `2xx`/`3xx` | 92 |
| Con errores `4xx`/`5xx` | 90 |

## 4. Matriz por sección

### 4.1 — Autenticación (11)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| auth.googleCallback | Auth | GET /api/v1/auth/google/callback | público | — | — | 302 | 400, 401, 409 |
| auth.googleStart | Auth | GET /api/v1/auth/google/start | público | — | — | 302 | 429 |
| auth.googleLink | Auth | POST /api/v1/auth/google/link | bearer | — | — | 200 | 401, 409 |
| auth.login | Auth | POST /api/v1/auth/login | público | — | — | 200 | 400, 401, 429 |
| auth.logout | Auth | POST /api/v1/auth/logout | bearer | — | — | 204 | 401 |
| auth.forgotPassword | Auth | POST /api/v1/auth/password/forgot | público | — | — | 202 | 400, 429 |
| auth.resetPassword | Auth | POST /api/v1/auth/password/reset | público | — | — | 200 | 400, 429 |
| auth.refresh | Auth | POST /api/v1/auth/refresh | cookie+CSRF | — | — | 200 | 401, 429 |
| auth.register | Auth | POST /api/v1/auth/register | público | sí | — | 201 | 400, 409, 429 |
| auth.verifyEmail | Auth | POST /api/v1/auth/verify-email | público | — | — | 200 | 400, 409 |
| auth.resendVerification | Auth | POST /api/v1/auth/verify-email/resend | bearer | sí | — | 202 | 401, 409, 429 |

### 4.2 — Perfil y baja (5)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| profile.get | Profile | GET /api/v1/profile | bearer | — | — | 200 | 401 |
| profile.requestClosure | Profile | POST /api/v1/profile/closure | bearer | sí | — | 200 | 400, 401, 409 |
| profile.requestEmailChange | Profile | POST /api/v1/profile/email-change | bearer | sí | — | 202 | 400, 401, 409, 429 |
| profile.confirmEmailChange | Profile | POST /api/v1/profile/email-change/confirm | público | — | — | 200 | 400, 409 |
| profile.update | Profile | PUT /api/v1/profile | bearer | — | sí | 200 | 400, 401, 409 |

### 5 — Catálogo, hoteles y movilidad públicos (6)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| catalog.list | Catalog | GET /api/v1/catalog/{type} | público | — | — | 200 | 400, 404 |
| catalog.get | Catalog | GET /api/v1/catalog/{type}/{id} | público | — | — | 200 | 404 |
| hotels.lodgingByDeparture | Hotels | GET /api/v1/departures/{departureId}/lodging | público | — | — | 200 | 404 |
| hotels.list | Hotels | GET /api/v1/hotels | público | — | — | 200 | — |
| hotels.get | Hotels | GET /api/v1/hotels/{id} | público | — | — | 200 | 404 |
| mobility.list | Mobility | GET /api/v1/mobility | público | — | — | 200 | — |

### 6 — Reservas del cliente (4)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| reservations.list | Reservations | GET /api/v1/reservations | bearer | — | — | 200 | 400, 401 |
| reservations.get | Reservations | GET /api/v1/reservations/{id} | bearer | — | — | 200 | 401, 404 |
| reservations.create | Reservations | POST /api/v1/reservations | bearer | sí | — | 201 | 400, 401, 403, 409, 429 |
| reservations.cancel | Reservations | POST /api/v1/reservations/{id}/cancel | bearer | sí | sí | 200 | 401, 404, 409 |

### 7 — Pagos, webhooks y devoluciones (7)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.refundCases.list | Payments | GET /api/v1/admin/refund-cases | bearer | — | — | 200 | 400, 401, 403 |
| admin.refundCases.get | Payments | GET /api/v1/admin/refund-cases/{id} | bearer | — | — | 200 | 401, 403, 404 |
| payments.get | Payments | GET /api/v1/payments/{id} | bearer | — | — | 200 | 401, 404 |
| admin.refundCases.authorize | Payments | POST /api/v1/admin/refund-cases/{id}/authorize | bearer | sí | sí | 200 | 401, 403, 404, 409 |
| admin.refundCases.retry | Payments | POST /api/v1/admin/refund-cases/{id}/retry | bearer | sí | — | 202 | 401, 403, 404, 409, 429 |
| payments.start | Payments | POST /api/v1/reservations/{id}/payments | bearer | sí | — | 201 | 400, 401, 403, 404, 409, 429 |
| webhooks.culqi | Webhooks | POST /api/v1/webhooks/culqi | firma | — | — | 200, 202 | 400, 401, 503 |

### 8.1 — Administración de catálogo (13)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.catalog.deleteImage | AdminCatalog | DELETE /api/v1/admin/catalog/{type}/{id}/images/{imageId} | bearer | — | — | 204 | 401, 403, 404, 409 |
| admin.catalog.list | AdminCatalog | GET /api/v1/admin/catalog/{type} | bearer | — | — | 200 | 400, 401, 403 |
| admin.catalog.create | AdminCatalog | POST /api/v1/admin/catalog/{type} | bearer | sí | — | 201 | 400, 401, 403 |
| admin.catalog.activate | AdminCatalog | POST /api/v1/admin/catalog/{type}/{id}/activate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.catalog.deactivate | AdminCatalog | POST /api/v1/admin/catalog/{type}/{id}/deactivate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.catalog.createDeparture | AdminCatalog | POST /api/v1/admin/catalog/{type}/{id}/departures | bearer | sí | — | 201 | 400, 401, 403, 404, 409 |
| admin.catalog.uploadImage | AdminCatalog | POST /api/v1/admin/catalog/{type}/{id}/images | bearer | — | — | 201 | 401, 403, 404, 413, 415 |
| admin.catalog.update | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.catalog.updateDeparture | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.catalog.updateDeparturePricing | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId}/pricing | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.catalog.replaceImage | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id}/images/{imageId} | bearer | — | — | 200 | 401, 403, 404, 413, 415 |
| admin.catalog.updateItinerary | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id}/itinerary | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.catalog.updatePricing | AdminCatalog | PUT /api/v1/admin/catalog/{type}/{id}/pricing | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |

### 8.2 — Administración de hoteles (16)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.hotels.deleteImage | AdminHotels | DELETE /api/v1/admin/hotels/{id}/images/{imageId} | bearer | — | — | 204 | 401, 403, 404, 409 |
| admin.hotels.deleteRoomTypeImage | AdminHotels | DELETE /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId} | bearer | — | — | 204 | 401, 403, 404, 409 |
| admin.hotels.list | AdminHotels | GET /api/v1/admin/hotels | bearer | — | — | 200 | 401, 403 |
| admin.hotels.create | AdminHotels | POST /api/v1/admin/hotels | bearer | sí | — | 201 | 400, 401, 403 |
| admin.hotels.activate | AdminHotels | POST /api/v1/admin/hotels/{id}/activate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.hotels.deactivate | AdminHotels | POST /api/v1/admin/hotels/{id}/deactivate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.hotels.uploadImage | AdminHotels | POST /api/v1/admin/hotels/{id}/images | bearer | — | — | 201 | 401, 403, 404, 413, 415 |
| admin.hotels.createRoomType | AdminHotels | POST /api/v1/admin/hotels/{id}/room-types | bearer | sí | — | 201 | 400, 401, 403, 404, 409 |
| admin.hotels.uploadRoomTypeImage | AdminHotels | POST /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images | bearer | — | — | 201 | 401, 403, 404, 413, 415 |
| admin.hotels.createLodgingProposal | AdminHotels | POST /api/v1/admin/lodging-proposals | bearer | sí | — | 201 | 400, 401, 403, 404, 409 |
| admin.hotels.update | AdminHotels | PUT /api/v1/admin/hotels/{id} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.hotels.replaceImage | AdminHotels | PUT /api/v1/admin/hotels/{id}/images/{imageId} | bearer | — | — | 200 | 401, 403, 404, 413, 415 |
| admin.hotels.updateRoomType | AdminHotels | PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.hotels.replaceRoomTypeImage | AdminHotels | PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId} | bearer | — | — | 200 | 401, 403, 404, 413, 415 |
| admin.hotels.updateLodgingProposal | AdminHotels | PUT /api/v1/admin/lodging-proposals/{id} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.hotels.updateInventory | AdminHotels | PUT /api/v1/admin/room-types/{id}/inventory | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |

### 8.3 — Administración de movilidad (7)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.mobility.list | AdminMobility | GET /api/v1/admin/mobility | bearer | — | — | 200 | 401, 403 |
| admin.mobility.get | AdminMobility | GET /api/v1/admin/mobility/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.mobility.create | AdminMobility | POST /api/v1/admin/mobility | bearer | sí | — | 201 | 400, 401, 403 |
| admin.mobility.activate | AdminMobility | POST /api/v1/admin/mobility/{id}/activate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.mobility.deactivate | AdminMobility | POST /api/v1/admin/mobility/{id}/deactivate | bearer | — | sí | 200 | 401, 403, 404, 409 |
| admin.mobility.update | AdminMobility | PUT /api/v1/admin/mobility/{id} | bearer | — | sí | 200 | 400, 401, 403, 404, 409 |
| admin.mobility.replaceImage | AdminMobility | PUT /api/v1/admin/mobility/{id}/image | bearer | — | — | 200 | 401, 403, 404, 413, 415 |

### 9.1 — Administración de reservas (4)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.reservations.list | AdminReservations | GET /api/v1/admin/reservations | bearer | — | — | 200 | 400, 401, 403 |
| admin.reservations.get | AdminReservations | GET /api/v1/admin/reservations/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.reservations.cancel | AdminReservations | POST /api/v1/admin/reservations/{id}/cancel | bearer | sí | sí | 200 | 400, 401, 403, 404, 409 |
| admin.reservations.complete | AdminReservations | POST /api/v1/admin/reservations/{id}/complete | bearer | sí | sí | 200 | 400, 401, 403, 404, 409 |

### 9.2 — Clientes, auditoría y exportaciones (8)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.audit.list | AdminAudit | GET /api/v1/admin/audit | bearer | — | — | 200 | 400, 401, 403 |
| admin.audit.get | AdminAudit | GET /api/v1/admin/audit/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.clients.list | AdminClients | GET /api/v1/admin/clients | bearer | — | — | 200 | 400, 401, 403 |
| admin.clients.get | AdminClients | GET /api/v1/admin/clients/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.exports.get | AdminExports | GET /api/v1/admin/exports/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.exports.download | AdminExports | GET /api/v1/admin/exports/{id}/download | bearer | — | — | 200 | 401, 403, 404, 409, 410 |
| admin.exports.createAudit | AdminExports | POST /api/v1/admin/exports/audit | bearer | sí | — | 202 | 400, 401, 403, 503 |
| admin.exports.createClients | AdminExports | POST /api/v1/admin/exports/clients | bearer | sí | — | 202 | 400, 401, 403, 503 |

### 9.3 — Reportes (5)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.reports.get | AdminReports | GET /api/v1/admin/reports/{id} | bearer | — | — | 200 | 401, 403, 404, 410 |
| admin.reports.downloadPdf | AdminReports | GET /api/v1/admin/reports/{id}/pdf | bearer | — | — | 200 | 401, 403, 404, 409, 410 |
| admin.reports.rows | AdminReports | GET /api/v1/admin/reports/{id}/rows | bearer | — | — | 200 | 400, 401, 403, 404, 410 |
| admin.reports.create | AdminReports | POST /api/v1/admin/reports | bearer | sí | — | 202 | 400, 401, 403, 503 |
| admin.reports.requestPdf | AdminReports | POST /api/v1/admin/reports/{id}/pdf | bearer | sí | — | 202 | 401, 403, 404, 409, 410 |

### 10.1 — Notificaciones (4)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| admin.notifications.listIncidents | Notifications | GET /api/v1/admin/notification-incidents | bearer | — | — | 200 | 401, 403 |
| admin.notifications.getIncident | Notifications | GET /api/v1/admin/notification-incidents/{id} | bearer | — | — | 200 | 401, 403, 404 |
| admin.notifications.resend | Notifications | POST /api/v1/admin/notification-deliveries/{id}/resend | bearer | sí | — | 202 | 401, 403, 404, 409, 429 |
| webhooks.resend | Webhooks | POST /api/v1/webhooks/resend | firma | — | — | 200, 202 | 400, 401, 503 |

### 11 — Multimedia (2)

| operationId | Tag | Método y ruta | Seguridad | Idem | If-Match | Éxito | Errores |
|---|---|---|---|---|---|---|---|
| media.adminPreview | Media | GET /api/v1/admin/media/{assetId} | bearer | — | — | 200 | 401, 403, 404 |
| media.getPublished | Media | GET /api/v1/media/{assetId} | público | — | — | 200 | 404 |

## 5. Hallazgos de la matriz

| ID | Hallazgo | Estado |
|---|---|---|
| MO-01 | Las 92 operaciones tienen `operationId`, tag y sección de contrato. | Superado documentalmente |
| MO-02 | Las 92 operaciones declaran `security`; 17 son públicas o de firma. | Superado documentalmente |
| MO-03 | 22 operaciones declaran `Idempotency-Key`; 21 declaran `If-Match`. | Superado documentalmente |
| MO-04 | Los códigos de éxito y error están declarados por operación. | Parcial: faltan pruebas |
| MO-05 | Existen 8 ejemplos de esquema, 139 bloques de éxito en 86 operaciones, 22 ejemplos compartidos de error en 11 componentes y 36 ejemplos específicos en 27 componentes para 29 operaciones; 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos en 92 operaciones; 6 operaciones no tienen cuerpo (`4` × `204`, `2` × `302`). La cobertura específica residual de autenticación, perfil, notificaciones, media administrativa y operaciones de creación sigue pendiente. | Abierto: CT-12 |
| MO-06 | La seguridad real, cookies, CSRF y CORS dependen de API-02. | Abierto: API-02 |
| MO-07 | Los errores, replays y concurrencia no están probados. | Abierto: API-03/API-04 |
| MO-08 | Paginación, fechas, dinero y archivos no están probados. | Abierto: API-05/API-07 |
| MO-09 | Webhooks y proveedores no tienen contrato real verificado. | Abierto: API-06 |
| MO-10 | Exportaciones/PDF no tienen runtime ni licencia verificada. | Abierto: API-08 |

## 6. Uso para CT-02–CT-12

- **CT-02:** recorrer las filas por `Seguridad`; probar `401`, `403` y `404` en recursos ajenos.
- **CT-03:** contrastar el código de éxito y el cuerpo de cada operación.
- **CT-04:** contrastar `ProblemDetails`, `code`, `traceId` y ausencia de fugas.
- **CT-05:** probar las 22 operaciones con `Idempotency-Key`, incluido payload distinto.
- **CT-06:** probar las 21 operaciones con `If-Match`/`version`.
- **CT-07:** probar paginación, filtros, fechas Perú/UTC y dinero decimal.
- **CT-08:** probar las operaciones de imágenes de catálogo, hotel y tipo.
- **CT-09:** probar los webhooks Culqi/Resend con firma y replay.
- **CT-10:** probar exportaciones y PDF, incluido `202`, `409` y `410`.
- **CT-11:** probar ausencia de datos de otras cuentas, tokens, PAN/CVV y URLs firmadas.
- **CT-12:** añadir ejemplos de error específicos por operación y validarlos contra el esquema; los ejemplos de éxito ya cubren las 92 operaciones y los errores declarados tienen ejemplos compartidos.

## 7. Límites

- La matriz no ejecuta peticiones ni valida respuestas reales.
- No ratifica el OpenAPI ni cierra API-01.
- No crea handlers, controladores, endpoints, SQL, migraciones o configuración.
- No sustituye el contrato textual ni las pruebas de contrato.

## 8. Preservación

- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
