# Ejemplos OpenAPI — lote I (imágenes de catálogo, habitaciones e inventario) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-233.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote H](ejemplos-lote-h.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, imágenes/habitaciones/inventario reales, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de imágenes de catálogo, tipos de habitación e inventario. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para seis operaciones del lote I:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.catalog.uploadImage` | `POST /api/v1/admin/catalog/{type}/{id}/images` | Sí, ilustrativa | `201` |
| `admin.catalog.replaceImage` | `PUT /api/v1/admin/catalog/{type}/{id}/images/{imageId}` | Sí, ilustrativa | `200` |
| `admin.catalog.deleteImage` | `DELETE /api/v1/admin/catalog/{type}/{id}/images/{imageId}` | No aplica | `204` sin cuerpo |
| `admin.hotels.createRoomType` | `POST /api/v1/admin/hotels/{id}/room-types` | Sí | `201` |
| `admin.hotels.updateRoomType` | `PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId}` | Sí | `200` |
| `admin.hotels.updateInventory` | `PUT /api/v1/admin/room-types/{id}/inventory` | Sí | `200` |

Son **10 bloques de ejemplo**: 5 de solicitud y 5 de respuesta. `deleteImage` se cubre con `204` sin cuerpo y no añade bloque.

Con los lotes A–I, el OpenAPI acumula **87 bloques de ejemplo en 56 operaciones con ejemplos**. Quedan **36 operaciones sin ejemplo**.

## 2. Contenido de los ejemplos

- Oferta ficticia `11111111-...` e imagen ficticia `13131313-...`.
- La carga usa un nombre de archivo ficticio `oferta-ficticia.jpg`; no se subió ningún binario.
- El reemplazo usa `oferta-ficticia-actualizada.jpg` y conserva el mismo identificador de imagen con versión `2`.
- El tipo de habitación ficticio `14141414-...` se llama `Habitación ficticia doble`, con capacidad 2 y precio base `"180.00"` PEN.
- La edición cambia el nombre, la capacidad a 3 y el precio base a `"195.00"`; las imágenes quedan como lista ficticia vacía.
- El inventario ficticio corresponde al `2026-12-15`, con cantidad 4 y versión `2`.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII, tokens, imágenes reales, habitaciones reales ni inventario real.
- Los ejemplos no demuestran que un servidor real suba imágenes, cree habitaciones o modifique inventario.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote I cubiertas | 6 de 6 |
| Operaciones con bloque de ejemplo | 5 de 6; `deleteImage` usa `204` sin cuerpo |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-233 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de carga de imágenes, de habitaciones ni de inventario real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version`, `413 payload_too_large`, `415 unsupported_media_type` y conflictos de inventario.
- Cubrir las **36 operaciones sin ejemplo**.
- Añadir ejemplos de imágenes de hotel y de habitación, propuestas de alojamiento, clientes, auditoría, exportaciones, reportes y media; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, imágenes/habitaciones/inventario reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
