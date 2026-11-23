# Ejemplos OpenAPI — lote K (clientes, auditoría y exportaciones) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-235.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote J](ejemplos-lote-j.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, datos de clientes reales, auditoría real, exportaciones reales, archivos CSV reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de listados y detalle de clientes y auditoría, y de solicitud, estado y descarga de exportaciones. No cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos para ocho operaciones del lote K:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `admin.clients.list` | `GET /api/v1/admin/clients` | No aplica | `200` |
| `admin.clients.get` | `GET /api/v1/admin/clients/{id}` | No aplica | `200` |
| `admin.audit.list` | `GET /api/v1/admin/audit` | No aplica | `200` |
| `admin.audit.get` | `GET /api/v1/admin/audit/{id}` | No aplica | `200` |
| `admin.exports.createClients` | `POST /api/v1/admin/exports/clients` | Sí | `202` |
| `admin.exports.createAudit` | `POST /api/v1/admin/exports/audit` | Sí | `202` |
| `admin.exports.get` | `GET /api/v1/admin/exports/{id}` | No aplica | `200` |
| `admin.exports.download` | `GET /api/v1/admin/exports/{id}/download` | No aplica | `200` `text/csv` |

Son **10 bloques de ejemplo**: 2 de solicitud y 8 de respuesta.

Con los lotes A–K, el OpenAPI acumula **109 bloques de ejemplo en 70 operaciones con ejemplos**. Quedan **22 operaciones sin ejemplo**, de las cuales 4 usan `204` sin cuerpo y 18 no tienen ejemplo de éxito.

## 2. Contenido de los ejemplos

- Dos clientes ficticios `18181818-...` y `19191919-...`, con correos `example.test`, estado y número de reservas.
- Listado paginado ficticio con `page`, `pageSize`, `total` y `hasNext`.
- Dos entradas de auditoría ficticias `20202020-...` y `21212121-...`, con actor, entidad, acción, resultado y `correlationId`.
- Exportación ficticia de clientes `22222222-...` y de auditoría `23232323-...`.
- Las solicitudes de exportación usan filtros ficticios; `202` no significa que el archivo esté listo.
- La descarga usa un CSV ficticio con encabezado y dos filas; no se generó ningún archivo real.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII real, tokens, clientes reales, auditoría real ni exportaciones reales.
- Los ejemplos no demuestran que un servidor real consulte clientes, audite operaciones o genere y sirva archivos.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| Ejemplo `text/csv` es una cadena ficticia | Sí |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones del lote K cubiertas | 8 de 8 |
| Operaciones con bloque de ejemplo | 8 de 8 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-235 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de consulta de clientes, de auditoría, de generación de CSV ni de descarga real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `409 stale_version`, `410 gone` y fallos de exportación.
- Cubrir las **22 operaciones sin ejemplo**.
- Añadir ejemplos de autenticación, perfil, reportes y media; quedan fuera de este lote.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote L** (reportes y media) se completó en [ejemplos-lote-l.md](ejemplos-lote-l.md), DEC-236, y el **lote M** (autenticación, perfil y cierres `204`/`302`) en [ejemplos-lote-m.md](ejemplos-lote-m.md), DEC-237. El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes. El **lote O** (errores específicos de identidad, perfil, reservas y pagos) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos en 13 componentes. El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos en 14 componentes. El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**. No se añaden todavía handlers, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, clientes reales, auditoría real, exportaciones reales, CSV reales, pagos, datos/cuentas/proveedores reales, configuración, commits o push.
