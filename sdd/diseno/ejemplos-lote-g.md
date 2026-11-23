# Ejemplos OpenAPI — lote G (movilidad administrativa) v0.1

> **Fecha:** 2026-11-07. **Versión:** 0.1. **Registro:** DEC-231.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote F](ejemplos-lote-f.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, vehículos/servicios reales, imágenes, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de administración de movilidad. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para las siete operaciones del lote G:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.mobility.list` | `GET /api/v1/admin/mobility` | No aplica | `200` |
| `admin.mobility.create` | `POST /api/v1/admin/mobility` | Sí | `201` |
| `admin.mobility.get` | `GET /api/v1/admin/mobility/{id}` | No aplica | `200` |
| `admin.mobility.update` | `PUT /api/v1/admin/mobility/{id}` | Sí | `200` |
| `admin.mobility.replaceImage` | `PUT /api/v1/admin/mobility/{id}/image` | Sí, ilustrativa | `200` |
| `admin.mobility.activate` | `POST /api/v1/admin/mobility/{id}/activate` | No aplica | `200` |
| `admin.mobility.deactivate` | `POST /api/v1/admin/mobility/{id}/deactivate` | No aplica | `200` |

Son **10 bloques de ejemplo**: 3 de solicitud y 7 de respuesta.

Con los lotes A–G, el OpenAPI acumula **67 bloques de ejemplo en 46 operaciones**.

## 2. Contenido de los ejemplos

- Movilidad ficticia `77777777-...`, nombre `Traslado ficticio Cusco`, tipo `van` y capacidad ficticia de 8 personas.
- Versiones ficticias: `1` creada, `2` editada, `3` activada y `4` desactivada.
- La edición conserva el estado `inactive`; activar y desactivar cambian solo la publicación, no el contenido.
- Imagen ficticia `33333333-...` con URL `https://media.example.test/mobility-ficticia.jpg`, sin archivo real ni carga en R2.
- La solicitud de imagen usa `multipart/form-data` con un nombre de archivo ficticio; no se subió ningún binario.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII, tokens, vehículos reales ni tarifas reales.
- Los ejemplos no demuestran que un servidor real cree, edite, active, desactive o ilustre movilidad.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote G con ejemplo de éxito | 7 de 7 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-231 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de carga de imágenes ni de administración real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version`, `413 payload_too_large` y `415 unsupported_media_type`.
- Cubrir las **46 operaciones restantes**.
- Añadir ejemplos de habitaciones, inventario, salidas, precios, itinerarios e imágenes de catálogo; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote H** (salidas, precios e itinerarios) se completó en [ejemplos-lote-h.md](ejemplos-lote-h.md), DEC-232. El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, movilidad/imágenes reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
