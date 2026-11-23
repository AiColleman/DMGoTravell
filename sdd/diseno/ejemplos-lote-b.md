# Ejemplos OpenAPI — lote B (catálogo, hoteles y movilidad) v0.1

> **Fecha:** 2026-11-05. **Versión:** 0.1. **Registro:** DEC-226.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote A](ejemplos-lote-a.md), [plan de pruebas CT-12](plan-pruebas-contrato.md) y [paquete de ratificación](paquete-ratificacion.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de lectura pública; no cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos de respuesta para seis operaciones del lote B:

| Operación | Método y ruta | Ejemplo de éxito |
|---|---|---|
| `catalog.list` | `GET /api/v1/catalog/{type}` | `200` |
| `catalog.get` | `GET /api/v1/catalog/{type}/{id}` | `200` |
| `hotels.list` | `GET /api/v1/hotels` | `200` |
| `hotels.get` | `GET /api/v1/hotels/{id}` | `200` |
| `hotels.lodgingByDeparture` | `GET /api/v1/departures/{departureId}/lodging` | `200` |
| `mobility.list` | `GET /api/v1/mobility` | `200` |

Son **6 bloques de ejemplo** de respuesta. No hay cuerpos de solicitud porque todas son lecturas públicas.

Con el lote A, el OpenAPI acumula **13 bloques de ejemplo en 10 operaciones**.

## 2. Contenido de los ejemplos

- Tour ficticio `Tour de ejemplo`, precio `"120.00"` PEN, duración 1 día.
- Salida ficticia `2026-12-01T13:00:00Z` / `2026-12-01T23:00:00Z`.
- Hotel ficticio `Hotel de ejemplo`, servicio de desayuno y Wi-Fi.
- Habitación ficticia `Habitación doble`, capacidad 2, precio base `"180.00"` PEN.
- Propuesta de alojamiento ficticia para la salida `44444444-...`.
- Movilidad ficticia `Traslado de ejemplo`, capacidad 4.
- UUID, URL de imagen y fechas son ficticios; no corresponden a activos reales.

Las fechas de los ejemplos están entre comillas para que YAML las trate como texto ISO 8601, no como objetos de fecha.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote B con ejemplo de éxito | 6 de 6 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-226 |

La validación es estructural y de JSON Schema; no demuestra que un servidor real produzca estas respuestas.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación para los códigos declarados.
- Cubrir las **82 operaciones restantes**.
- Revisar parámetros, filtros y cuerpos contra el contrato textual.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote C** (reservas y pagos) se completó en [ejemplos-lote-c.md](ejemplos-lote-c.md), DEC-227, el **lote D** (administración de reservas y devoluciones) en [ejemplos-lote-d.md](ejemplos-lote-d.md), DEC-228, el **lote E** (webhooks y notificaciones) en [ejemplos-lote-e.md](ejemplos-lote-e.md), DEC-229, el **lote F** (catálogo administrativo y hoteles) en [ejemplos-lote-f.md](ejemplos-lote-f.md), DEC-230, el **lote G** (movilidad administrativa) en [ejemplos-lote-g.md](ejemplos-lote-g.md), DEC-231, y el **lote H** (salidas, precios e itinerarios) en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, datos/cuentas/proveedores reales, configuración, commits o push.
