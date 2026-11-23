# Ejemplos OpenAPI — lote E (webhooks y notificaciones) v0.1

> **Fecha:** 2026-11-06. **Versión:** 0.1. **Registro:** DEC-229.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote D](ejemplos-lote-d.md), [contrato de API](contrato-api.md), [modelo de datos](modelo-datos.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, webhooks reales, correos, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de recepción de webhooks y administración de notificaciones; no cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para cinco operaciones del lote E:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `webhooks.culqi` | `POST /api/v1/webhooks/culqi` | Sí | `200` y `202` |
| `webhooks.resend` | `POST /api/v1/webhooks/resend` | Sí | `200` y `202` |
| `admin.notifications.listIncidents` | `GET /api/v1/admin/notification-incidents` | No aplica | `200` |
| `admin.notifications.getIncident` | `GET /api/v1/admin/notification-incidents/{id}` | No aplica | `200` |
| `admin.notifications.resend` | `POST /api/v1/admin/notification-deliveries/{id}/resend` | Sí | `202` |

Son **10 bloques de ejemplo**: 3 de solicitud y 7 de respuesta.

Con los lotes A, B, C, D y E, el OpenAPI acumula **43 bloques de ejemplo en 29 operaciones**.

## 2. Contenido de los ejemplos

- Evento Culqi ficticio `evt_fake_culqi_0001`, tipo `payment.succeeded`, referencia ficticia y importe `"300.00"` PEN.
- Evento Resend ficticio `evt_fake_resend_0001`, tipo `email.delivered` y referencia ficticia.
- Respuestas `WebhookAccepted` con `received: true` y `duplicate: false`, tanto para recepción persistida (`200`) como para admisión durable (`202`).
- Incidente ficticio `dddddddd-...`, tipo `delivery_failed`, estado `open`, entrega `eeeeeeee-...` y destinatario enmascarado `c***e@example.test`.
- Reenvío manual ficticio con motivo y `version: 1`; respuesta `202` con operación `ffffffff-...` y estado `accepted`.
- Los cuerpos de los webhooks son **ilustrativos**: la forma exacta del proveedor sigue pendiente de API-06/API-07. No se modelan campos internos como contrato.
- Las firmas y cabeceras son ficticias; no se incluyen secretos, firmas reales, correos reales ni tokens.
- El estado `open` del incidente es ilustrativo y no crea un enum nuevo.

Los ejemplos no demuestran que un proveedor envíe eventos, que una firma se verifique o que un correo se entregue.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens/firmas reales | Sí |
| Operaciones del lote E con ejemplo de éxito | 5 de 5 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-229 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de firma ni de entrega de correo.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `400`/`401` de webhook y `409 already_manually_resent`.
- Añadir ejemplos específicos de evento duplicado y de evento no autenticado; en este lote solo se cubre la recepción ficticia con `duplicate: false`.
- Cubrir las **63 operaciones restantes**.
- Revisar cuerpos, estados, idempotencia y concurrencia contra el contrato textual.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote F** (catálogo administrativo y hoteles) se completó en [ejemplos-lote-f.md](ejemplos-lote-f.md), DEC-230, el **lote G** (movilidad administrativa) en [ejemplos-lote-g.md](ejemplos-lote-g.md), DEC-231, y el **lote H** (salidas, precios e itinerarios) en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, webhooks, correos, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
