# Ejemplos OpenAPI — lote L (reportes y media) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-236.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote K](ejemplos-lote-k.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, reportes reales, PDF reales, imágenes publicadas reales, archivos generados, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de reportes y lectura de media. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para siete operaciones del lote L:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.reports.create` | `POST /api/v1/admin/reports` | Sí | `202` |
| `admin.reports.get` | `GET /api/v1/admin/reports/{id}` | No aplica | `200` |
| `admin.reports.rows` | `GET /api/v1/admin/reports/{id}/rows` | No aplica | `200` |
| `admin.reports.requestPdf` | `POST /api/v1/admin/reports/{id}/pdf` | No aplica | `202` |
| `admin.reports.downloadPdf` | `GET /api/v1/admin/reports/{id}/pdf` | No aplica | `200` `application/pdf` |
| `media.getPublished` | `GET /api/v1/media/{assetId}` | No aplica | `200` JPEG/PNG/WebP |
| `media.adminPreview` | `GET /api/v1/admin/media/{assetId}` | No aplica | `200` JPEG/PNG/WebP |

Son **12 bloques de ejemplo**: 1 de solicitud y 11 de respuesta. `media.getPublished` y `media.adminPreview` tienen un ejemplo por representación JPEG, PNG y WebP; los valores son marcadores ficticios, no imágenes reales.

Con los lotes A–L, el OpenAPI acumula **121 bloques de ejemplo en 77 operaciones con ejemplos**. Quedan **15 operaciones sin ejemplo**, de las cuales 4 usan `204` sin cuerpo y 11 no tienen ejemplo de éxito.

## 2. Contenido de los ejemplos

- Reporte ficticio `24242424-...`, con `referenceAt`, estado, vencimiento, dos filas y `pdfStatus`.
- Las filas usan claves ilustrativas (`reservationId`, `status`, `currency`, `total`, `createdAt`); no se declaran columnas normativas de 011.
- PDF ficticio `25252525-...` admitido para generación y descarga simulada con el texto `PDF ficticio; no es un archivo real.`
- Activo ficticio `26262626-...` para media publicada y previsualización administrativa.
- Los ejemplos de imagen son cadenas marcadoras (`JPEG ficticio`, `PNG ficticio`, `WebP ficticio`); no se cargó ni generó ninguna imagen.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII real, tokens, reportes reales, PDF reales, imágenes reales ni archivos reales.
- Los ejemplos no demuestran que un servidor real cree reportes, genere PDF, publique imágenes o permita previsualizarlas.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| Ejemplos binarios son cadenas ficticias | Sí |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote L cubiertas | 7 de 7 |
| Operaciones con bloque de ejemplo | 7 de 7 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-236 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de generación de reportes, de PDF, de publicación de imágenes ni de previsualización real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version`, `410 gone` y fallos de generación de PDF.
- Cubrir las **6 respuestas sin cuerpo** (`4` × `204`, `2` × `302`) con su documentación específica.
- Los ejemplos de autenticación y perfil se añadieron en el lote M (DEC-237).
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Lote M completado y siguiente lote

El **lote M** (autenticación, perfil y cierres `204`/`302`) se completó en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237, con `auth.refresh`, `auth.logout`, `auth.verifyEmail`, `auth.resendVerification`, `auth.forgotPassword`, `auth.resetPassword`, `auth.googleStart`, `auth.googleCallback`, `auth.googleLink`, `profile.requestEmailChange`, `profile.confirmEmailChange`, `profile.requestClosure`, `admin.catalog.deleteImage`, `admin.hotels.deleteImage` y `admin.hotels.deleteRoomTypeImage`.

Las tres eliminaciones y `auth.logout` se documentaron como `204` sin cuerpo y los dos flujos de Google como `302` sin cuerpo; no se inventaron cuerpos de respuesta. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, reportes reales, PDF reales, imágenes reales, archivos reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
