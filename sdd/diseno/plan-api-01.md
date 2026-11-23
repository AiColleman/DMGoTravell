# Plan de ratificación API-01 — OpenAPI y versionado

> **Fecha:** 2026-11-03. **Versión:** 0.1. **Registro:** DEC-214.  
> **Objeto:** [contrato de API v0.1](contrato-api.md), DEC-212, y su [validación documental](validacion-contrato-api.md), DEC-213.  
> **Estado:** plan documental **PARCIALMENTE EJECUTADO**. DEC-215 creó el borrador OpenAPI 3.1 en la ubicación propuesta; DEC-217 superó CT-01 y añadió ejemplos de esquema; los lotes O y P ampliaron los ejemplos específicos de error. Faltan ejemplos específicos residuales, revisión por operación y CT-02–CT-12. No crea código, controladores, handlers, pruebas ejecutables, migraciones o configuración.  
> **Puerta:** API-01 sigue abierta hasta que el OpenAPI esté revisado, versionado y contrastado con pruebas de contrato.

## 1. Resultado esperado

API-01 exige una fuente normativa legible por máquina, una política de versión/compatibilidad y evidencia de pruebas de contrato. Este plan fija cómo producirla sin convertir el contrato textual en una implementación anticipada.

La secuencia propuesta es:

1. Aprobar este plan y el alcance del OpenAPI.
2. Crear `sdd/diseno/openapi/dmgo-api-v1.yaml` como **borrador no normativo**.
3. Validar sintaxis, referencias, ejemplos e inventario de operaciones.
4. Revisar seguridad, errores, idempotencia, paginación y archivos contra el contrato.
5. Ejecutar pruebas de contrato cuando exista implementación o un harness autorizado.
6. Declarar API-01 cerrada solo con evidencia de los pasos 3–5.

**Estado de avance (DEC-215):** pasos 1–2 completados con el borrador `sdd/diseno/openapi/dmgo-api-v1.yaml`. La sintaxis YAML, las referencias y el inventario se validaron; los ejemplos y CT-02–CT-12 siguen pendientes. API-01 no se cierra.

**Estado de cierre (DEC-216):** la [matriz de cierre del diseño técnico](cierre-diseno-tecnico.md) clasifica API-01 como **parcial**: el borrador está validado estructuralmente, pero faltan revisión contra el contrato, ejemplos y CT-02–CT-12. La matriz no altera este plan ni cierra la puerta.

**Estado de revisión (DEC-217):** la [revisión del OpenAPI](revision-openapi.md) supera documentalmente CT-01 (92/92 operaciones, 0 faltantes/sobrantes), confirma 92 `operationId` únicos y añade 8 ejemplos ficticios en 7 esquemas con 0 fallos JSON Schema. CT-12 sigue parcial; CT-02–CT-12 no se ejecutaron. API-01 permanece abierta.

**Estado operativo (DEC-218):** la [matriz de operaciones](matriz-operaciones-openapi.md) recorre las 92 operaciones por sección del contrato, con seguridad, `Idempotency-Key`, `If-Match`, éxito y errores declarados. No sustituye la revisión de cuerpos ni CT-02–CT-12; API-01 sigue abierta.

**Estado de política (DEC-219):** la [política de versión/propiedad/deprecación](politica-versionado-api.md) propone SemVer, `/api/v1`, clasificación de cambios y ventana de 90 días. PV-01–PV-06 siguen pendientes de ratificación; no cierra API-01.

**Estado transversal (DEC-220):** las [decisiones transversales](decisiones-transversales-api.md) proponen errores, idempotencia/concurrencia y paginación/tiempo/dinero. DT-01–DT-12 y los pendientes de formato/retención/orden/redondeo siguen abiertos; no cierran API-03/API-04/API-05.

**Estado de pruebas (DEC-221):** el [plan de pruebas de contrato](plan-pruebas-contrato.md) detalla CT-02-CT-12 con casos, evidencia, fases y PT-01-PT-06. No ejecuta pruebas ni crea harness; CT-02-CT-12 siguen sin ejecutar y CT-12 sigue parcial.

**Estado de ejemplos (DEC-225):** el [lote A](ejemplos-lote-a.md) añade 7 bloques de ejemplo en 4 operaciones de identidad/perfil (`auth.register`, `auth.login`, `profile.get`, `profile.update`), validados contra JSON Schema. Faltan errores por operación y 88 operaciones; CT-12 sigue parcial y API-01 abierta.

**Estado de ejemplos (DEC-226):** el [lote B](ejemplos-lote-b.md) añade 6 bloques de respuesta para `catalog.list`, `catalog.get`, `hotels.list`, `hotels.get`, `hotels.lodgingByDeparture` y `mobility.list`. Acumula 13 bloques en 10 operaciones; faltan errores por operación y 82 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-227):** el [lote C](ejemplos-lote-c.md) añade 9 bloques para `reservations.create`, `reservations.list`, `reservations.get`, `reservations.cancel`, `payments.start` y `payments.get`. Acumula 22 bloques en 16 operaciones; faltan errores por operación y 76 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-228):** el [lote D](ejemplos-lote-d.md) añade 11 bloques para `admin.reservations.list`, `admin.reservations.get`, `admin.reservations.cancel`, `admin.reservations.complete`, `admin.refundCases.list`, `admin.refundCases.get`, `admin.refundCases.authorize` y `admin.refundCases.retry`. Acumula 33 bloques en 24 operaciones; faltan errores por operación y 68 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-229):** el [lote E](ejemplos-lote-e.md) añade 10 bloques para `webhooks.culqi`, `webhooks.resend`, `admin.notifications.listIncidents`, `admin.notifications.getIncident` y `admin.notifications.resend`. Acumula 43 bloques en 29 operaciones; faltan errores por operación y 63 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-230):** el [lote F](ejemplos-lote-f.md) añade 14 bloques para `admin.catalog.list`, `admin.catalog.create`, `admin.catalog.update`, `admin.catalog.activate`, `admin.catalog.deactivate`, `admin.hotels.list`, `admin.hotels.create`, `admin.hotels.update`, `admin.hotels.activate` y `admin.hotels.deactivate`. Acumula 57 bloques en 39 operaciones; faltan errores por operación y 53 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-231):** el [lote G](ejemplos-lote-g.md) añade 10 bloques para `admin.mobility.list`, `admin.mobility.create`, `admin.mobility.get`, `admin.mobility.update`, `admin.mobility.replaceImage`, `admin.mobility.activate` y `admin.mobility.deactivate`. Acumula 67 bloques en 46 operaciones; faltan errores por operación y 46 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-232):** el [lote H](ejemplos-lote-h.md) añade 10 bloques para `admin.catalog.createDeparture`, `admin.catalog.updateDeparture`, `admin.catalog.updatePricing`, `admin.catalog.updateDeparturePricing` y `admin.catalog.updateItinerary`. Acumula 77 bloques en 51 operaciones; faltan errores por operación y 41 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-233):** el [lote I](ejemplos-lote-i.md) añade 10 bloques para `admin.catalog.uploadImage`, `admin.catalog.replaceImage`, `admin.catalog.deleteImage`, `admin.hotels.createRoomType`, `admin.hotels.updateRoomType` y `admin.hotels.updateInventory`. Acumula 87 bloques en 56 operaciones con ejemplos; faltan errores por operación y 36 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-234):** el [lote J](ejemplos-lote-j.md) añade 12 bloques para `admin.hotels.createLodgingProposal`, `admin.hotels.updateLodgingProposal`, `admin.hotels.uploadImage`, `admin.hotels.replaceImage`, `admin.hotels.deleteImage`, `admin.hotels.uploadRoomTypeImage`, `admin.hotels.replaceRoomTypeImage` y `admin.hotels.deleteRoomTypeImage`. Acumula 99 bloques en 62 operaciones con ejemplos; faltan errores por operación y 30 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-235):** el [lote K](ejemplos-lote-k.md) añade 10 bloques para `admin.clients.list`, `admin.clients.get`, `admin.audit.list`, `admin.audit.get`, `admin.exports.createClients`, `admin.exports.createAudit`, `admin.exports.get` y `admin.exports.download`. Acumula 109 bloques en 70 operaciones con ejemplos; faltan errores por operación y 22 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-236):** el [lote L](ejemplos-lote-l.md) añade 12 bloques para `admin.reports.create`, `admin.reports.get`, `admin.reports.rows`, `admin.reports.requestPdf`, `admin.reports.downloadPdf`, `media.getPublished` y `media.adminPreview`. Acumula 121 bloques en 77 operaciones con ejemplos; faltan errores por operación y 15 operaciones; CT-12 sigue parcial.

**Estado de ejemplos (DEC-237):** el [lote M](ejemplos-lote-m.md) añade 18 bloques para `auth.refresh`, `auth.logout`, `auth.verifyEmail`, `auth.resendVerification`, `auth.forgotPassword`, `auth.resetPassword`, `auth.googleStart`, `auth.googleCallback`, `auth.googleLink`, `profile.requestEmailChange`, `profile.confirmEmailChange`, `profile.requestClosure`, `admin.catalog.deleteImage`, `admin.hotels.deleteImage` y `admin.hotels.deleteRoomTypeImage`. Acumula 139 bloques en 86 operaciones con ejemplos de cuerpo; 4 respuestas `204` y 2 `302` sin cuerpo, y las 92 operaciones con respuesta de éxito documentada. Faltan ejemplos de error por operación; CT-12 sigue parcial.

**Estado de ejemplos (DEC-238):** el [lote N](ejemplos-lote-n.md) añade 22 ejemplos de error en 11 componentes de respuesta, con 319 referencias en 90 operaciones y 919 ejemplos efectivos en 92 operaciones. Los ejemplos son compartidos y no específicos por operación; faltan ejemplos de error específicos por código/operación y CT-12 sigue parcial.

**Estado de ejemplos (DEC-240):** el [lote O](ejemplos-lote-o.md) añade 17 ejemplos específicos en 13 componentes y sustituye 17 referencias genéricas en 14 operaciones de identidad, perfil, reservas, pagos y autorización de devoluciones. Acumula 39 ejemplos de error en 24 componentes y 860 ejemplos efectivos en 92 operaciones; en ese momento la cobertura específica de catálogo, hoteles, inventario, exportaciones y reportes seguía pendiente y CT-12 sigue parcial.

**Estado de ejemplos (DEC-241):** el [lote P](ejemplos-lote-p.md) añade 19 ejemplos específicos en 14 componentes y sustituye 17 referencias genéricas en 15 operaciones de catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada. Acumula 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos en 92 operaciones; la cobertura específica residual de autenticación, perfil, notificaciones, media administrativa y operaciones de creación sigue pendiente y CT-12 sigue parcial.

Ningún paso autoriza handlers, endpoints desplegados, proveedores reales o datos de producción.

## 2. Fuente y autoridad

| Elemento | Propuesta |
|---|---|
| Fuente funcional | Specs 001–013 y complementos 004/005, ya aprobados. |
| Fuente de diseño | [contrato de API v0.1](contrato-api.md) y [validación DEC-213](validacion-contrato-api.md). |
| Fuente normativa futura | OpenAPI 3.1 versionado; el texto del contrato queda como justificación, no como sustituto del YAML. |
| Ubicación propuesta | `sdd/diseno/openapi/dmgo-api-v1.yaml`, un archivo para la versión mayor `/api/v1`; componentes reutilizables en el mismo documento. |
| Versión del documento | `0.1.0-draft` mientras no esté ratificado; `1.0.0` solo al cerrar API-01. |
| Prefijo de rutas | `/api/v1`; un cambio incompatible exige `/api/v2`, no una mutación silenciosa de v1. |

El OpenAPI no puede añadir una operación, campo, estado o regla que no esté en el contrato o en una spec aprobada. Si falta un dato, se marca como pendiente en una nota de diseño; no se inventa.

## 3. Convenciones de autoría

- **OpenAPI 3.1.0**, JSON Schema 2020-12 compatible.
- `operationId` estable con formato `modulo.accion`, por ejemplo `auth.register`, `reservations.create`, `admin.catalog.activate`.
- `tags` por módulo: `Auth`, `Profile`, `Catalog`, `Hotels`, `Mobility`, `Reservations`, `Payments`, `AdminCatalog`, `AdminHotels`, `AdminMobility`, `AdminReservations`, `AdminClients`, `AdminAudit`, `AdminExports`, `AdminReports`, `Notifications`, `Media`, `Webhooks`.
- Esquemas en `PascalCase`; solicitudes con sufijo `Request`, respuestas con el nombre del recurso. Fechas en RFC 3339 UTC; fechas de negocio como `date`; dinero como cadena decimal PEN, nunca `number` flotante.
- Seguridad: `bearerAuth` para access JWT; `refreshCookie` para refresh; `csrfToken` para operaciones con cookie. Webhooks sin JWT, con firma del proveedor.
- Cabeceras comunes: `Idempotency-Key`, `If-Match`, `ETag`, `Location`, `Retry-After`.
- Errores: `ProblemDetails` con `type`, `title`, `status`, `detail`, `code`, `traceId` y extensiones acotadas como `blockers` o `errors`.
- Ejemplos ficticios, sin cuentas, reservas, pagos, correos, tokens, enlaces, PAN/CVV ni datos reales.
- `additionalProperties: false` en solicitudes; en respuestas, solo las propiedades documentadas. Los campos de proveedor no confirmados quedan como `x-pending-provider-contract`, no como invenciones.

## 4. Inventario de operaciones

El OpenAPI debe contener exactamente las operaciones del contrato, sin rutas adicionales:

| Módulo | Operaciones del contrato |
|---|---|
| Autenticación | Registro, login, refresh, logout, verificar, reenviar, recuperar, restablecer, Google start/callback/link. |
| Perfil | Consultar, actualizar, solicitar/confirmar cambio de correo, solicitar baja. |
| Catálogo/hoteles/movilidad públicos | Listar/detallar catálogo, listar/detallar hoteles, propuestas por salida, listar movilidad. |
| Reservas del cliente | Crear, historial, detalle, cancelar `pending`. |
| Pagos/devoluciones | Iniciar pago, consultar pago, webhook Culqi, listar/detallar/autorizar/reintentar devolución. |
| Catálogo administrativo | Listar, crear, editar, activar/desactivar, salidas, precios, itinerario e imágenes. |
| Hoteles administrativos | Listar, crear, editar, activar/desactivar, tipos, inventario, propuestas e imágenes de hotel/tipo. |
| Movilidad administrativa | Listar, leer, crear, guardar, imagen, activar/desactivar. |
| Reservas administrativas | Listar, detallar, cancelar `confirmed`, completar. |
| Clientes/auditoría/exportaciones | Listar/detallar clientes y auditoría, exportar clientes/auditoría, estado y descarga. |
| Reportes | Crear, consultar, filas, solicitar PDF, descargar PDF. |
| Notificaciones | Webhook Resend, listar/detallar incidentes, reenvío manual. |
| Multimedia | Leer publicada, previsualizar como admin. |

No se incluyen rutas de vencimiento, confirmación de pago, liberación de inventario, auditoría o intención de notificación: son puertos internos. Tampoco se incluyen usuarios/roles, edición de auditoría, baja/reactivación de clientes o reparación financiera.

## 5. Matriz de pruebas de contrato

Estas pruebas se ejecutarán contra la implementación o un harness autorizado. No se ejecutan en esta actividad documental.

| ID | Prueba | Evidencia mínima |
|---|---|---|
| CT-01 | Inventario | Toda operación del contrato existe en OpenAPI; no hay ruta documentada fuera del contrato. |
| CT-02 | Seguridad | `anonymous`, `client` y `admin`; `401` sin access, `403` por rol, `404` para recurso ajeno. |
| CT-03 | Éxito | Código, cuerpo, `Location`, `ETag` y cabeceras de cada operación coinciden. |
| CT-04 | Errores | `ProblemDetails`, `code`, `traceId`, mensajes aprobados y ausencia de stack/SQL/tokens. |
| CT-05 | Idempotencia | Replay devuelve el mismo resultado; misma clave con payload distinto = `409 idempotency_conflict`. |
| CT-06 | Concurrencia | `If-Match`/`version` desactualizado = `409 stale_version`; no se aplica escritura parcial. |
| CT-07 | Paginación/filtros | Página 1-based, máximos por módulo, página vacía `200`, filtros/fechas/dinero correctos. |
| CT-08 | Archivos | Multipart, 5 000 000 bytes, MIME/contenido, fallo conserva anterior, lectura publicada. |
| CT-09 | Webhooks | Firma validada antes de deserializar, `2xx` solo tras persistencia durable, replay sin duplicar. |
| CT-10 | Exportaciones/PDF | Captura materializada, `202` no es archivo listo, `409`/`410`, PDF completo sin PII. |
| CT-11 | Privacidad | Sin datos de otras cuentas, tokens, enlaces, PAN/CVV, claves internas o URLs firmadas. |
| CT-12 | Ejemplos | Ejemplos válidos contra esquema y sin datos reales. |

## 6. Evidencia para cerrar API-01

API-01 no se cierra por tener un YAML. Requiere:

- OpenAPI 3.1 revisado y versionado, con fuente y propietario definidos.
- YAML válido, `$ref` resueltos, operaciones y esquemas sin duplicados.
- Inventario CT-01 sin rutas faltantes o sobrantes; superado documentalmente en DEC-217.
- Matriz de operaciones DEC-218 con 92 filas, seguridad, idempotencia, `If-Match`, éxito y errores.
- Política de versión/propiedad/deprecación DEC-219 ratificada documentalmente por DEC-239; PV-01–PV-06 pendientes.
- Decisiones transversales DEC-220 ratificadas documentalmente por DEC-239; DT-06/09/12 y pruebas abiertos.
- Plan de pruebas DEC-221 ratificado documentalmente por DEC-239; CT-02–CT-12 no ejecutadas.
- Ejemplos de esquema validados; lotes A/B/C/D/E/F/G/H/I/J/K/L/M con 86 operaciones con ejemplos de cuerpo y 139 bloques; 6 operaciones sin cuerpo (4 `204`, 2 `302`); lote N con 22 ejemplos compartidos de error, lote O con 17 ejemplos específicos en 13 componentes y lote P con 19 ejemplos específicos en 14 componentes; 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos; cobertura específica residual de autenticación, perfil, notificaciones, media administrativa y operaciones de creación aún parcial.
- Política de compatibilidad y deprecación aprobada.
- CT-02–CT-12 ejecutadas con resultados registrados.
- Ausencia de handlers generados antes de la revisión del contrato.
- Enlaces y conteos documentales consistentes.

Mientras falte cualquiera de estos puntos, API-01 permanece abierta y el contrato textual sigue siendo la referencia de diseño.

## 7. Dependencias y límites

- **API-02:** topología real, cookies, CSRF, CORS y revocación.
- **API-03–API-05:** errores, concurrencia, paginación, tiempo y dinero.
- **API-06:** contratos reales de Culqi/Resend.
- **API-07–API-08:** archivos/media y exportaciones/PDF.
- **BT-01–BT-04, MD-01–MD-08, RV-01–RV-05:** plataforma, PostgreSQL, entrega y autorización.

Este plan no cierra esas puertas, no crea tareas de implementación y no modifica specs, planes, tareas, contratos o análisis anteriores. Inventario intacto: **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.

## 8. Próximo artefacto

El **borrador OpenAPI 3.1** fue creado en la ubicación propuesta por DEC-215. Sigue siendo no normativo: requiere revisión contra el contrato, ejemplos ficticios validados y CT-02–CT-12 ejecutadas. El [plan de pruebas](plan-pruebas-contrato.md), DEC-221, ya detalla los casos y la evidencia, pero no ejecuta pruebas. No se generan handlers, controladores ni endpoints a partir de él hasta que API-01 se cierre con evidencia.
