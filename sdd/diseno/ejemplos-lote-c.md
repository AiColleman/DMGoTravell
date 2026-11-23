# Ejemplos OpenAPI — lote C (reservas y pagos) v0.1

> **Fecha:** 2026-11-06. **Versión:** 0.1. **Registro:** DEC-227.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote A](ejemplos-lote-a.md), [lote B](ejemplos-lote-b.md), [plan de pruebas CT-12](plan-pruebas-contrato.md) y [paquete de ratificación](paquete-ratificacion.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, pagos, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de reservas y pagos; no cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos de solicitud y respuesta para seis operaciones del lote C:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `reservations.create` | `POST /api/v1/reservations` | Sí | `201` |
| `reservations.list` | `GET /api/v1/reservations` | No aplica | `200` |
| `reservations.get` | `GET /api/v1/reservations/{id}` | No aplica | `200` |
| `reservations.cancel` | `POST /api/v1/reservations/{id}/cancel` | Sí | `200` |
| `payments.start` | `POST /api/v1/reservations/{id}/payments` | Sí | `201` |
| `payments.get` | `GET /api/v1/payments/{id}` | No aplica | `200` |

Son **9 bloques de ejemplo**: 3 de solicitud y 6 de respuesta.

Con los lotes A, B y C, el OpenAPI acumula **22 bloques de ejemplo en 16 operaciones**.

## 2. Contenido de los ejemplos

- Reserva ficticia `R-00000000`, estado `pending`, total `"300.00"` PEN, dos viajeros.
- Salida ficticia `44444444-...`, hotel `55555555-...`, propuesta `77777777-...` y habitación `66666666-...`.
- Fechas ISO 8601 citadas: pago `2026-12-01T15:15:00Z`, validación `2026-12-01T15:20:00Z`.
- Cancelación con `version: 1` y respuesta `cancelled` con `version: 2`.
- Pago ficticio `22222222-...`, método `card`, estado `created`, importe `"300.00"` PEN.
- `providerData` usa `providerReference: fake-provider-reference`; no incluye PAN, CVV, tokens de checkout ni credenciales.
- UUID, correo, fechas y referencias son ficticios.

Los ejemplos no demuestran que un servidor real cree reservas, cobre, cancele o consulte pagos.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote C con ejemplo de éxito | 6 de 6 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-227 |

La validación es estructural y de JSON Schema; no es una prueba de contrato ni una prueba de pago.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación para los códigos declarados.
- Cubrir las **76 operaciones restantes**.
- Revisar cuerpos, estados, idempotencia y concurrencia contra el contrato textual.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote D** (administración de reservas y devoluciones) se completó en [ejemplos-lote-d.md](ejemplos-lote-d.md), DEC-228, el **lote E** (webhooks y notificaciones) en [ejemplos-lote-e.md](ejemplos-lote-e.md), DEC-229, el **lote F** (catálogo administrativo y hoteles) en [ejemplos-lote-f.md](ejemplos-lote-f.md), DEC-230, el **lote G** (movilidad administrativa) en [ejemplos-lote-g.md](ejemplos-lote-g.md), DEC-231, y el **lote H** (salidas, precios e itinerarios) en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
