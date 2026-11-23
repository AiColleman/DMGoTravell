# Ejemplos OpenAPI — lote J (imágenes de hotel/habitación y propuestas de alojamiento) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-234.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote I](ejemplos-lote-i.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, imágenes/hoteles/habitaciones/propuestas reales, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de imágenes de hotel y de tipo de habitación, y de propuestas de alojamiento. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para ocho operaciones del lote J:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.hotels.createLodgingProposal` | `POST /api/v1/admin/lodging-proposals` | Sí | `201` |
| `admin.hotels.updateLodgingProposal` | `PUT /api/v1/admin/lodging-proposals/{id}` | Sí | `200` |
| `admin.hotels.uploadImage` | `POST /api/v1/admin/hotels/{id}/images` | Sí, ilustrativa | `201` |
| `admin.hotels.replaceImage` | `PUT /api/v1/admin/hotels/{id}/images/{imageId}` | Sí, ilustrativa | `200` |
| `admin.hotels.deleteImage` | `DELETE /api/v1/admin/hotels/{id}/images/{imageId}` | No aplica | `204` sin cuerpo |
| `admin.hotels.uploadRoomTypeImage` | `POST /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images` | Sí, ilustrativa | `201` |
| `admin.hotels.replaceRoomTypeImage` | `PUT /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId}` | Sí, ilustrativa | `200` |
| `admin.hotels.deleteRoomTypeImage` | `DELETE /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId}` | No aplica | `204` sin cuerpo |

Son **12 bloques de ejemplo**: 6 de solicitud y 6 de respuesta. Las dos eliminaciones se cubren con `204` sin cuerpo y no añaden bloque.

Con los lotes A–J, el OpenAPI acumula **99 bloques de ejemplo en 62 operaciones con ejemplos**. Quedan **30 operaciones sin ejemplo**, de las cuales 4 usan `204` sin cuerpo y 26 no tienen ejemplo de éxito.

## 2. Contenido de los ejemplos

- Hotel ficticio `55555555-...`, salida ficticia `12121212-...`, tipo de habitación `14141414-...` y propuesta `15151515-...`.
- La propuesta usa fechas ISO 8601 con zona UTC y una lista de tipos de habitación ficticios.
- La edición desplaza la fecha de fin una hora; no modifica disponibilidad ni precios reales.
- Imagen de hotel ficticia `16161616-...`; carga y reemplazo con nombres `hotel-ficticio.jpg` y `hotel-ficticio-actualizado.jpg`, versión `1` y `2`.
- Imagen de tipo de habitación ficticia `17171717-...`; carga y reemplazo con nombres `habitacion-ficticia.jpg` y `habitacion-ficticia-actualizada.jpg`, versión `1` y `2`.
- No se subió ningún binario; las URL `media.example.test` son ficticias.
- Datos sin PII, tokens, imágenes reales, hoteles reales, habitaciones reales ni propuestas reales.
- Los ejemplos no demuestran que un servidor real cree propuestas, asocie imágenes o modifique alojamientos.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote J cubiertas | 8 de 8 |
| Operaciones con bloque de ejemplo | 6 de 8; dos eliminaciones usan `204` sin cuerpo |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-234 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de carga de imágenes, de propuestas de alojamiento ni de disponibilidad.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version`, `413 payload_too_large`, `415 unsupported_media_type` y conflictos de propuestas.
- Cubrir las **30 operaciones sin ejemplo**.
- Añadir ejemplos de autenticación, perfil, clientes, auditoría, exportaciones, reportes y media; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, imágenes/hoteles/habitaciones/propuestas reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
