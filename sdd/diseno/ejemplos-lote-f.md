# Ejemplos OpenAPI — lote F (catálogo administrativo y hoteles) v0.1

> **Fecha:** 2026-11-07. **Versión:** 0.1. **Registro:** DEC-230.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote E](ejemplos-lote-e.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, ofertas/hoteles reales, imágenes, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de administración de catálogo y hoteles; la movilidad administrativa se separa al lote G. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para diez operaciones del lote F:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.catalog.list` | `GET /api/v1/admin/catalog/{type}` | No aplica | `200` |
| `admin.catalog.create` | `POST /api/v1/admin/catalog/{type}` | Sí | `201` |
| `admin.catalog.update` | `PUT /api/v1/admin/catalog/{type}/{id}` | Sí | `200` |
| `admin.catalog.activate` | `POST /api/v1/admin/catalog/{type}/{id}/activate` | No aplica | `200` |
| `admin.catalog.deactivate` | `POST /api/v1/admin/catalog/{type}/{id}/deactivate` | No aplica | `200` |
| `admin.hotels.list` | `GET /api/v1/admin/hotels` | No aplica | `200` |
| `admin.hotels.create` | `POST /api/v1/admin/hotels` | Sí | `201` |
| `admin.hotels.update` | `PUT /api/v1/admin/hotels/{id}` | Sí | `200` |
| `admin.hotels.activate` | `POST /api/v1/admin/hotels/{id}/activate` | No aplica | `200` |
| `admin.hotels.deactivate` | `POST /api/v1/admin/hotels/{id}/deactivate` | No aplica | `200` |

Son **14 bloques de ejemplo**: 4 de solicitud y 10 de respuesta.

Con los lotes A–F, el OpenAPI acumula **57 bloques de ejemplo en 39 operaciones**.

## 2. Contenido de los ejemplos

- Oferta ficticia `11111111-...`, tipo `tour`, nombre `Tour ficticio Machu Picchu`, precio `"450.00"` y duración de 2 días.
- Itinerario ficticio de dos días, condiciones ficticias y estado `inactive` al crear; `active` tras activar.
- Versiones ficticias de oferta: `1` creada, `2` editada, `3` activada y `4` desactivada.
- Hotel ficticio `55555555-...`, nombre `Hotel ficticio Cusco`, servicios ficticios y estado `inactive` al crear; `active` tras activar.
- Versiones ficticias de hotel: `1` creado, `2` editado, `3` activado y `4` desactivado.
- Fechas ISO 8601 citadas y UUID ficticios; sin imágenes, precios reales, disponibilidad real ni datos personales.
- Los ejemplos no demuestran que un servidor real cree, edite, active o desactive ofertas u hoteles.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote F con ejemplo de éxito | 10 de 10 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-230 |

La validación es estructural y de JSON Schema; no es una prueba de contrato ni una prueba de administración real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version` y conflictos de activación/desactivación.
- Cubrir las **53 operaciones restantes**.
- Añadir ejemplos de salidas, precios, itinerarios, habitaciones, inventario, propuestas de alojamiento e imágenes; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote G** (movilidad administrativa) se completó en [ejemplos-lote-g.md](ejemplos-lote-g.md), DEC-231, y el **lote H** (salidas, precios e itinerarios) en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, ofertas/hoteles/imágenes reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
