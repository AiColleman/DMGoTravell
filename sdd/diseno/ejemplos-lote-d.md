# Ejemplos OpenAPI — lote D (administración de reservas y devoluciones) v0.1

> **Fecha:** 2026-11-06. **Versión:** 0.1. **Registro:** DEC-228.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote C](ejemplos-lote-c.md), [contrato de API](contrato-api.md), [modelo de datos](modelo-datos.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, devoluciones, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de administración de reservas y casos de devolución; no cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para ocho operaciones del lote D:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.reservations.list` | `GET /api/v1/admin/reservations` | No aplica | `200` |
| `admin.reservations.get` | `GET /api/v1/admin/reservations/{id}` | No aplica | `200` |
| `admin.reservations.cancel` | `POST /api/v1/admin/reservations/{id}/cancel` | Sí | `200` |
| `admin.reservations.complete` | `POST /api/v1/admin/reservations/{id}/complete` | Sí | `200` |
| `admin.refundCases.list` | `GET /api/v1/admin/refund-cases` | No aplica | `200` |
| `admin.refundCases.get` | `GET /api/v1/admin/refund-cases/{id}` | No aplica | `200` |
| `admin.refundCases.authorize` | `POST /api/v1/admin/refund-cases/{id}/authorize` | Sí | `200` |
| `admin.refundCases.retry` | `POST /api/v1/admin/refund-cases/{id}/retry` | No aplica | `202` |

Son **11 bloques de ejemplo**: 3 de solicitud y 8 de respuesta.

Con los lotes A, B, C y D, el OpenAPI acumula **33 bloques de ejemplo en 24 operaciones**.

## 2. Contenido de los ejemplos

- Reserva ficticia `R-00000000`, dos viajeros, total `"300.00"` PEN.
- Cliente ficticio `aaaaaaaa-...`, correo `cliente.ficticio@example.test`, estado `active`.
- Reserva administrativa `confirmed` con versión 2; cancelación a `cancelled` versión 3; finalización a `completed` versión 3.
- Caso de devolución ficticio `bbbbbbbb-...`, pago `22222222-...`, importe `"300.00"` PEN.
- Estados de devolución tomados del modelo de datos: `open` y `authorized`. No se inventan estados adicionales.
- La autorización no se presenta como abono recibido; la evidencia es ficticia y no contiene credenciales.
- El reintento devuelve `202` con una operación ficticia `cccccccc-...` y estado `accepted`.
- Fechas ISO 8601 citadas, UUID ficticios y sin PAN, CVV, tokens de checkout ni datos personales reales.

Los ejemplos no demuestran que un servidor real cancele reservas, complete servicios, autorice devoluciones o ejecute reintentos.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Estados de devolución alineados con el modelo de datos | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote D con ejemplo de éxito | 8 de 8 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-228 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de autorización administrativa ni de devolución real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación para los códigos declarados, incluidos `409 stale_version`, `409 refund_not_authorizable` y conflictos de transición.
- Cubrir las **68 operaciones restantes**.
- Revisar cuerpos, estados, idempotencia y concurrencia contra el contrato textual.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote E** (webhooks y notificaciones) se completó en [ejemplos-lote-e.md](ejemplos-lote-e.md), DEC-229, el **lote F** (catálogo administrativo y hoteles) en [ejemplos-lote-f.md](ejemplos-lote-f.md), DEC-230, el **lote G** (movilidad administrativa) en [ejemplos-lote-g.md](ejemplos-lote-g.md), DEC-231, y el **lote H** (salidas, precios e itinerarios) en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, devoluciones, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
