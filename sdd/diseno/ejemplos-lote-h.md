# Ejemplos OpenAPI — lote H (salidas, precios e itinerarios) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-232.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote G](ejemplos-lote-g.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, salidas/precios reales, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de salidas, precios e itinerarios de catálogo. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para las cinco operaciones del lote H:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.catalog.createDeparture` | `POST /api/v1/admin/catalog/{type}/{id}/departures` | Sí | `201` |
| `admin.catalog.updateDeparture` | `PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId}` | Sí | `200` |
| `admin.catalog.updatePricing` | `PUT /api/v1/admin/catalog/{type}/{id}/pricing` | Sí | `200` |
| `admin.catalog.updateDeparturePricing` | `PUT /api/v1/admin/catalog/{type}/{id}/departures/{departureId}/pricing` | Sí | `200` |
| `admin.catalog.updateItinerary` | `PUT /api/v1/admin/catalog/{type}/{id}/itinerary` | Sí | `200` |

Son **10 bloques de ejemplo**: 5 de solicitud y 5 de respuesta.

Con los lotes A–H, el OpenAPI acumula **77 bloques de ejemplo en 51 operaciones**.

## 2. Contenido de los ejemplos

- Oferta ficticia `11111111-...`, tipo `tour`, nombre `Tour ficticio Machu Picchu actualizado`.
- Salida ficticia `12121212-...`, del 15 al 16 de diciembre de 2026, precio `"450.00"` PEN y capacidad ficticia de 20 personas.
- La edición de salida cambia fechas, precio a `"470.00"` y capacidad a 18; la disponibilidad es ficticia.
- El precio de oferta usa `normalPrice: "450.00"` y `discountedPrice: "420.00"`.
- El precio de salida usa `normalPrice: "470.00"` y `discountedPrice: "420.00"`; no se calcula ni reserva disponibilidad real.
- El itinerario ficticio conserva dos días con actividades ficticias.
- Versiones ficticias de oferta: `5` tras actualizar precio y `6` tras actualizar itinerario; el estado sigue `inactive`.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII, tokens, precios reales ni disponibilidad real.
- Los ejemplos no demuestran que un servidor real cree salidas, cambie precios o guarde itinerarios.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote H con ejemplo de éxito | 5 de 5 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-232 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de precios ni de disponibilidad real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version` y conflictos de salidas, precios o capacidad.
- Cubrir las **41 operaciones restantes**.
- Añadir ejemplos de imágenes, tipos de habitación, inventario, propuestas de alojamiento y el resto de administración; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, salidas/precios/imágenes/inventario reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
