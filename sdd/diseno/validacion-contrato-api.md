# Validación documental del contrato de API v0.1

> **Fecha:** 2026-11-03. **Versión:** 0.1. **Registro:** DEC-213.  
> **Objeto:** [contrato de API v0.1](contrato-api.md), DEC-212.  
> **Alcance:** contraste documental con specs 001–013, complementos 004/005 y sus planes, además de la [base técnica](base-tecnica.md) y el [modelo de datos](modelo-datos.md).  
> **Estado:** revisión documental **SIN IMPLEMENTACIÓN**; no es OpenAPI, código, prueba de integración, contrato de proveedor verificado ni autorización de implementación.  
> **Nota de vigencia:** DEC-214 añadió un [plan de API-01](plan-api-01.md) y DEC-215 un [borrador OpenAPI no normativo](openapi/dmgo-api-v1.yaml). DEC-217 añadió su [revisión documental](revision-openapi.md), que supera CT-01 y valida ejemplos de esquema; DEC-218 añadió la [matriz de operaciones](matriz-operaciones-openapi.md), DEC-219 la [política de versión/propiedad/deprecación](politica-versionado-api.md), DEC-220 las [decisiones transversales](decisiones-transversales-api.md), DEC-221 el [plan de pruebas](plan-pruebas-contrato.md), DEC-225 el [lote A de ejemplos](ejemplos-lote-a.md), DEC-226 el [lote B](ejemplos-lote-b.md), DEC-227 el [lote C](ejemplos-lote-c.md), DEC-228 el [lote D](ejemplos-lote-d.md), DEC-229 el [lote E](ejemplos-lote-e.md), DEC-230 el [lote F](ejemplos-lote-f.md), DEC-231 el [lote G](ejemplos-lote-g.md), DEC-232 el [lote H](ejemplos-lote-h.md), DEC-233 el [lote I](ejemplos-lote-i.md), DEC-234 el [lote J](ejemplos-lote-j.md), DEC-235 el [lote K](ejemplos-lote-k.md), DEC-236 el [lote L](ejemplos-lote-l.md), DEC-237 el [lote M](ejemplos-lote-m.md), DEC-238 el [lote N](ejemplos-lote-n.md), DEC-240 el [lote O](ejemplos-lote-o.md) y DEC-241 el [lote P](ejemplos-lote-p.md). Ninguna de esas piezas ratifica el OpenAPI ni ejecuta pruebas. Esta validación sigue refiriéndose al contrato textual y no evalúa ese borrador ni lo ratifica.

## 1. Resultado

No se encontró una superficie pública o administrativa aprobada que falte por completo en el contrato. Las operaciones que no deben exponerse —confirmar pago, cancelar por vencimiento, liberar inventario, anexar auditoría y crear intención de notificación— permanecen como puertos internos.

La revisión sí detectó varias imprecisiones de contrato, ya corregidas en el documento DEC-212: una ruta administrativa de vencimiento no autorizada por 003, un estado técnico de pago que no existe en el modelo, la idempotencia enviada en el cuerpo, conflictos de nombre en borradores, eliminación de la última imagen y lectura de media tras desactivar el servicio. También se precisaron reglas de 005-C, 008 y 002.

**Conclusión:** el contrato es coherente a nivel documental con las specs y planes revisados, pero **no está ratificado ni implementado**. Las puertas API-01–API-08 y las puertas técnicas previas siguen abiertas.

## 2. Método y límites

Se contrastaron las tablas de operaciones, permisos, estados, errores, paginación, idempotencia y transiciones del contrato con:

- los criterios y secciones de comportamiento de 001–013 y complementos 004/005;
- las rutas y condiciones ya propuestas en los planes;
- los estados y restricciones del [modelo de datos](modelo-datos.md);
- las fronteras de los [contratos propuestos](../contratos/).

No se ejecutaron peticiones, migraciones, pruebas de carga, llamadas a Culqi/Resend/R2 ni consultas a PostgreSQL. Esta revisión no creó OpenAPI, controlador, middleware, esquema SQL ni tarea nueva; el borrador posterior es DEC-215 y no forma parte de esta validación.

## 3. Cobertura por funcionalidad

| Fuente | Superficie del contrato | Resultado |
|---|---|---|
| 001 | Reserva propia, historial, detalle y cancelación `pending`. | Cubierta; no se expone `pending → confirmed` ni cancelación de `confirmed` como cliente. |
| 002 | Inicio/consulta de pago, webhook Culqi y casos/devoluciones. | Cubierta; estados técnicos alineados con el modelo y confirmación interna. |
| 003 | Vencimiento y liberación. | Sin ruta administrativa dedicada; evidencia por 010/004. No se añade panel ni cancelación forzada. |
| 004/004-C | Webhook Resend, incidentes y reenvío manual. | Cubierta; el reenvío no crea ni renueva enlaces de identidad. |
| 005/005-C | Registro, login, refresh, logout, verificación, reenvío, recuperación y Google. | Cubierta; reglas de sustitución/consumo de 005-C incorporadas. |
| 006 | Catálogo público/administrativo, salidas, precios, itinerario e imágenes. | Cubierta; borradores incompletos permitidos y conflicto de nombre al activar. |
| 007 | Hoteles, tipos, inventario, propuestas e imágenes. | Cubierta; inventario y publicación alineados con 007. |
| 008 | Perfil, cambio de correo y baja. | Cubierta; solicitud vigente, cierre de sesiones, invalidación de enlaces y avisos incluidos. |
| 009 | Reservas administrativas, cancelación y finalización. | Cubierta; transiciones y motivo alineados con 009. |
| 010 | Clientes, auditoría y CSV. | Cubierta; captura materializada y descarga privada. |
| 011 | Reporte, filas y PDF. | Cubierta; PDF completo y sin datos personales de cliente. |
| 012 | Lectura y previsualización de media. | Cubierta; publicación histórica y preview administrativa. |
| 013 | Movilidad pública/administrativa e imagen. | Cubierta; sin detalle público, filtros, galería ni eliminación física. |

## 4. Hallazgos y disposición

| ID | Área | Hallazgo | Disposición |
|---|---|---|---|
| VA-01 | 003 | El contrato proponía `GET /admin/expiry-incidents`; el plan de 003 prohíbe añadir herramientas administrativas nuevas. | Corregido: sin ruta dedicada; evidencia por 010/004. |
| VA-02 | 002 | Se listaba `verifying` como estado técnico del intento; el modelo usa `created`, `sent`, `unknown`, `approved`, `rejected`. | Corregido: «pago en verificación» es etiqueta de presentación. |
| VA-03 | 001/global | La creación de reserva enviaba `idempotencyKey` en el cuerpo y el contrato exige cabecera. | Corregido: `Idempotency-Key` en cabecera; registro añadido como comando idempotente. |
| VA-04 | 006/007/013 | Crear un borrador con nombre repetido devolvía `409 duplicate_name`, aunque la unicidad se exige entre publicados/activos. | Corregido: el borrador puede coincidir; el conflicto se comprueba al activar. |
| VA-05 | 006/007 | Faltaba impedir quitar la última imagen de una oferta/hotel publicado/activo. | Corregido: `409 incomplete_publication`. |
| VA-06 | 012 | «Leer activo publicado» podía interpretarse como exigir que el servicio siguiera activo. | Corregido: la marca de publicación histórica permite leer el enlace conocido tras desactivar. |
| VA-07 | Errores | `410` se describía como enlace expirado, pero el catálogo usa `400 invalid_token` para enlaces. | Corregido: `410` solo para artefactos de exportación/reporte. |
| VA-08 | 005-C/008 | Faltaban detalles de solicitud rechazada, reintento, cambio de correo vigente y baja. | Corregido: reglas añadidas sin crear estados ni transiciones nuevas. |
| VA-09 | 002 | Faltaban reglas explícitas de rechazo antes de 15, tolerancia, `unknown`, Yape, timeout y devolución enviada. | Corregido: reglas añadidas; no se altera la política de devolución. |
| VA-10 | 006 | El valor público `tours`/`packages` no coincidía literalmente con el enum interno `tour`/`package`. | Aclarado: el plural es propuesta de ruta; la taxonomía sigue en ACL-05/ACL-30. |
| VA-11 | Global | ¿Hay criterios sin superficie? | No se detectó una capacidad aprobada sin ruta o puerto interno identificado. |
| VA-12 | Inventario | ¿La revisión añade criterios o tareas? | No. Se conservan 677 criterios y 402 tareas pendientes. |

## 5. Puertas que permanecen abiertas

| Puerta | Evidencia que falta |
|---|---|
| API-01 | OpenAPI versionado, fuente normativa, compatibilidad y contract tests. |
| API-02 | Topología real, cookies, `SameSite`, `__Host-`, CSRF, CORS y revocación. |
| API-03 | Pruebas de ProblemDetails, códigos, mensajes y no filtración. |
| API-04 | Pruebas concurrentes de claves, `ETag`/`If-Match`, replays y conflictos. |
| API-05 | Paginación, filtros, fechas Perú/UTC, dinero decimal y orden. |
| API-06 | Contratos reales de Culqi/Resend, firmas, webhooks y recuperación. |
| API-07 | Multipart, 5 MB = 5 000 000 bytes, MIME/contenido, publicación y preview. |
| API-08 | Captura, estados, descarga, expiración y PDF completo. |

Se suman BT-01–BT-04, MD-01–MD-08, RV-01–RV-05, G/V/M/I/P/R/A/Q/U y las puertas específicas de cada plan. Ninguna se cierra por esta revisión.

## 6. Validación documental al cierre de DEC-213

- 63 archivos Markdown en `sdd/`.
- 1.074 enlaces locales, 0 rotos.
- 213 registros DEC, 0 duplicados.
- 0 tablas inconsistentes.
- 402 tareas pendientes, 0 ejecutadas.
- 677 criterios aprobados conservados.

La validación acredita integridad documental, no funcionamiento. No se usaron cuentas, reservas, pagos, correos, imágenes, exportaciones, proveedores ni bases de datos reales.

## 7. Preservación

Specs, planes, tareas, análisis y contratos anteriores permanecen intactos. Esta revisión no creó código, OpenAPI, migración, configuración, commit o push; el borrador posterior DEC-215 no cambia sus conclusiones. El contrato de API sigue siendo una propuesta de diseño; esta validación no lo ratifica.
