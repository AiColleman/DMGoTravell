# Resultados de pruebas de contrato de la primera vertical slice

> **Fecha:** 2026-11-16. **Versión:** 0.8. **Registro:** DEC-243, DEC-244, DEC-245, DEC-246, DEC-247, DEC-248, DEC-249 y DEC-250.  
> **Objeto:** [plan de pruebas de contrato](plan-pruebas-contrato.md), [primera vertical slice](primera-vertical-slice.md), [OpenAPI](openapi/dmgo-api-v1.yaml) y [decisiones transversales](decisiones-transversales-api.md).  
> **Estado:** ejecución **parcial** de CT-02-CT-12 limitada a las operaciones implementadas. CT-05 pasa en la slice con idempotencia durable, incluido el reenvío de verificación; CT-10 pasa parcialmente para los CSV de auditoría y clientes; CT-11 incluye el rastro de auditoría sin secretos, la consulta saneada, los CSV sin secretos y la restricción de bajas lógicas de clientes; CT-08, CT-09 y CT-12 siguen pendientes. No cierra API-01 ni sustituye las pruebas de runtime, proveedor o topología pendientes.  
> **Límite:** solo `sdd/`; la evidencia se generó contra el harness local de integración, sin proveedores reales, datos de clientes, correos, pagos reales, imágenes publicadas, PDF, commits ni push.

## 1. Alcance ejecutado

La primera vertical slice implementa identidad, catálogo público de tours y paquetes, reservas de tour, pago simulado, idempotencia durable de reservas, pagos y reenvío de verificación, los flujos de recuperación y restablecimiento de contraseña, la auditoría persistida de las operaciones de identidad, la consulta/detalle administrativo de auditoría, la exportación CSV de auditoría, la consulta/detalle administrativo de clientes de solo lectura y la exportación CSV de clientes. Sobre ese perímetro se ejecutó el subconjunto automatizable de CT-02-CT-12 que no depende de Culqi, Resend, R2, PDF ni topología.

Entorno:

- `WebApplicationFactory<Program>` en memoria, sin puerto externo.
- PostgreSQL 16 local, base dedicada `dmgotravel_it`, recreada al inicio de cada ejecución; la conexión se fija con `ConnectionStrings__DefaultConnection` antes de que `Program` lea la configuración.
- Migraciones y `DevelopmentDataSeeder` aplicados por la API en entorno `Development`.
- Identidades y datos sintéticos; sin PII, tokens ni contraseñas reales.
- Runner in-process de xUnit v3, porque VSTest falla en este entorno con `Win32Exception (5): Acceso denegado`.

## 2. Resultados por caso

| Caso | Resultado | Evidencia |
|---|---|---|
| CT-02 Seguridad | **PASS parcial** | Catálogo anónimo `200`; perfil, listado, detalle y creación de reserva sin token devuelven `401 application/problem+json` con `code: unauthenticated`; un cliente no lee, cancela ni paga la reserva de otro (`404 not_found`); la auditoría administrativa, las exportaciones de auditoría y clientes y la consulta/detalle de clientes devuelven `401` sin token, `403` a un cliente y `200`/`202` a un administrador vigente; otro administrador no consulta ni descarga el artefacto ajeno (`404 not_found`). |
| CT-03 Éxito | **PASS parcial** | Registro `201` con `Location: /api/v1/profile`; reserva `201` con `Location: /api/v1/reservations/{id}`; pago `201` con `Location: /api/v1/payments/{id}`; catálogo, perfil, consulta/detalle de auditoría y consulta/detalle de clientes `200`; exportaciones de auditoría y clientes `202 accepted` y descargas `200 text/csv` con `X-Export-Reference-At`. |
| CT-04 Errores | **PASS parcial** | Validación `400 validation_failed` con `type`, `title`, `status`, `code`, `traceId` y `errors`; recurso ajeno o inexistente `404 not_found`; paquete no reservable `409 reservation_unavailable`; exportación de auditoría con filtro desconocido o actor/resultado inválido `400 invalid_filter`; rango invertido o fecha inválida `400 invalid_range`; cliente con `id`/`status` inválido `400 invalid_filter`, rango de registro inválido `400 invalid_range` y detalle inexistente o de una cuenta no cliente `404 not_found`; exportación de clientes con filtro desconocido o `id`/`status` inválido `400 invalid_filter`, rango invertido o fecha inválida `400 invalid_range`, cuerpo/`Idempotency-Key` inválido `400 validation_failed` y artefacto ajeno `404 not_found`; auditoría inexistente `404 not_found`; descarga vencida `410 export_expired`; conflicto de idempotencia `409 idempotency_conflict`. |
| CT-05 Idempotencia | **PASS en la slice** | `Idempotency-Key` obligatoria en creación, cancelación, pago, reenvío de verificación y exportaciones de auditoría y clientes; replay con la misma clave y cuerpo devuelve la respuesta original; misma clave con otro cuerpo devuelve `409 idempotency_conflict`; dos creaciones concurrentes con la misma clave producen una sola reserva; el pago repetido no crea un segundo `ExternalPayment`; el reenvío repetido no emite otro enlace; la exportación repetida devuelve el mismo `id`; la operación y el registro se confirman en la misma transacción. |
| CT-06 Concurrencia y versión | **PASS parcial** | Cancelación con versión obsoleta devuelve `409 stale_version`; la cancelación válida incrementa `version` y devuelve `cancelled`. |
| CT-07 Paginación, filtros, tiempo y dinero | **PASS parcial** | `page=0`, negativo y no entero devuelven `400 invalid_page`; página válida sin resultados devuelve `200` con `items: []`; importes como cadena decimal `PEN` con dos decimales. En auditoría, `pageSize` fuera de 1-100 devuelve `400 invalid_filter`, el rango de fechas usa días completos de `America/Lima` y los filtros se combinan con coincidencia exacta; la exportación reutiliza esos filtros, no pagina y conserva el mismo rango inclusivo. En clientes, `pageSize` fuera de 1-100 devuelve `400 invalid_filter`, `name`/`email` son parciales sin distinguir mayúsculas, `id`/`status` son exactos, el rango de registro es inclusivo en hora de Perú, los filtros se combinan con AND y el orden es registro descendente con desempate estable. El rechazo de `pageSize` superior al máximo en el resto de listados queda pendiente de DT-09. |
| CT-08 Archivos y multimedia | **BLOCKED** | R2, carga y publicación de imágenes no implementados. |
| CT-09 Webhooks | **BLOCKED** | Culqi y Resend no integrados; no hay firmas ni sandbox. |
| CT-10 Exportaciones y PDF | **PASS parcial (auditoría y clientes)** | `POST /api/v1/admin/exports/audit` y `POST /api/v1/admin/exports/clients` exigen administrador vigente e `Idempotency-Key`, aceptan filtros opcionales, capturan todas las filas en una consulta materializada y entregan `202 accepted` con referencia y expiración. `GET /{id}` informa el estado y `GET /{id}/download` entrega `text/csv` con cabeceras estables y `X-Export-Reference-At`. La exportación de clientes revalida la baja antes de entregar y no añade filas ni refresca cantidades; el PDF y el worker asíncrono no están implementados. |
| CT-11 Privacidad y fugas | **PASS parcial** | Aislamiento entre clientes verificado; el cuerpo de error `404` no contiene excepciones, SQL, Npgsql, stack traces, contraseñas ni el access token; `audit_record` no guarda correo, contraseñas, tokens, digests ni cookies; la respuesta administrativa de auditoría usa UUID públicos y su resumen excluye correo, tokens y `familyId`; el CSV de auditoría no contiene correo, tokens, digests, cookies ni `familyId`, neutraliza prefijos de fórmula soportados y no expone el JSON almacenado; el CSV de clientes no expone datos personales de una baja, neutraliza prefijos de fórmula y, si la baja ocurre después de solicitar el archivo, la descarga vuelve a enmascarar la fila sin añadir clientes ni refrescar cantidades; un cliente con baja lógica solo muestra identificador, estado y cantidad, y no se localiza por nombre o correo ocultos. |
| CT-12 Ejemplos | **PARCIAL** | YAML parseado y ejemplos validados contra JSON Schema; no se ejecutaron todos los ejemplos contra runtime. |

## 3. Evidencia reproducible

```text
dotnet build DMGoTravel.slnx --no-incremental --nologo
0 errores, 0 advertencias

dotnet run --project tests\DMGoTravel.Domain.Tests --no-build
Total: 11, Errors: 0, Failed: 0

dotnet run --project tests\DMGoTravel.ArchitectureTests --no-build
Total: 3, Errors: 0, Failed: 0

dotnet run --project tests\DMGoTravel.Api.IntegrationTests --no-build
Total: 47, Errors: 0, Failed: 0
```

Las cuarenta y siete pruebas de integración se dividen en:

- `SliceEndToEndTests`: salud, recorrido completo, reglas de alcance, `401` y rotación de refresh.
- `ContractSliceTests`: CT-02 seguridad, CT-02 aislamiento, CT-03 `Location`, CT-04 `problem+json`, CT-06 versión obsoleta, CT-07 paginación y dinero, CT-11 no fugas.
- `IdempotencySliceTests`: CT-05 replay, conflicto de cuerpo, cabecera obligatoria, longitud máxima, pago repetido, conflicto por método, cancelación repetida y concurrencia.
- `RecoverySliceTests`: reenvío autenticado, sustitución del enlace, replay, `already_verified`, respuesta genérica de recuperación, restablecimiento, uso único, prueba inválida, contraseña corta y revocación global de la sesión.
- `AuditSliceTests`: registro, verificación y login sin secretos; reenvío con replay sin duplicar el éxito; recuperación y restablecimiento; login fallido y reutilización de refresh como `failure`.
- `AdminAuditTests`: autorización anónima, de cliente y de administrador; cambio de rol y revocación de familia; filtros exactos, rango inclusivo, paginación, orden estable, detalle, `404` y resumen sin PII, tokens ni `familyId`.
- `AdminAuditExportTests`: `401`/`403`, cabecera obligatoria, cuerpo opcional, captura completa, CSV con cabecera y orden, neutralización de fórmula, filtros exactos y rango inclusivo, CSV vacío solo con cabecera, idempotencia y conflicto, propiedad del artefacto, expiración `410 export_expired` y metadatos de descarga con `X-Export-Reference-At`.
- `AdminClientTests`: `401`/`403`/`200`, filtros parciales de nombre/correo sin distinguir mayúsculas, identificador y estado exactos, rango de registro inclusivo en hora de Perú, combinación AND, paginación con página vacía, orden y desempate, conteo único de reservas en cuatro estados, estados `active`/`suspended`/`closed`, detalle por UUID público, `404` para inexistente o cuenta no cliente y baja lógica con solo identificador, estado y cantidad.
- `AdminClientExportTests`: `401`/`403`/`202`, cuerpo opcional, captura completa, CSV con cabecera y orden, filas con comas/comillas/saltos de línea, neutralización de fórmula, baja con solo identificador/estado/cantidad y sin PII, baja posterior enmascarada sin añadir clientes ni refrescar cantidades, CSV vacío con cabecera, filtros parciales y exactos, rango inclusivo, `400 invalid_filter`/`invalid_range`, idempotencia y conflicto, propiedad del artefacto, expiración `410 export_expired`, pérdida de autorización y metadatos de descarga con `X-Export-Reference-At`.

Corrección de contrato incluida: los listados de catálogo y reservas interpretan `page` como entero positivo y devuelven `400 invalid_page` para valores no válidos, en lugar de `validation_failed` o `malformed_request`.

## 4. Brechas y bloqueos

- CT-05: **PASS en la slice** para creación, cancelación, pago, reenvío de verificación y solicitud de exportación de auditoría. No cubre registro, recuperación de contraseña ni cambios de perfil; la recuperación no usa `Idempotency-Key` porque es anónima y su respuesta genérica no debe depender de una cuenta.
- DT-06: implementado para la slice con clave de 1-128 caracteres, retención de 48 horas y concurrencia arbitrada por el índice único `(user_id, scope, key)`. La ratificación formal de la decisión y su extensión al resto de operaciones siguen pendientes.
- Reemisión/recuperación: el enlace de verificación dura 24 horas y el de restablecimiento 30 minutos; ambos son de un solo uso, se guardan como digest y el restablecimiento revoca todas las familias de refresh. La entrega usa el almacén de desarrollo, no Resend.
- Auditoría: `audit_record` recibe registro, verificación, reenvío, login, refresh, logout, recuperación y restablecimiento en el mismo commit; login fallido y reutilización de refresh se registran como `failure`. La consulta, el detalle y la exportación CSV administrativa ya leen esos registros con autorización vigente, filtros exactos, orden estable y resumen saneado (DEC-247 y DEC-248). La exportación CSV de clientes está implementada (DEC-250), pero no hay pantalla administrativa, triggers de inmutabilidad ni catálogo oficial de acciones. RF-25 sigue pendiente porque no existen todavía filas de auditoría de reservas, pagos, eventos o notificaciones que permitan reconocer relaciones.
- Clientes: la consulta y el detalle de solo lectura están implementados (DEC-249) con autorización vigente, filtros, paginación, orden, conteo de reservas y restricción de bajas lógicas. La exportación CSV de clientes está implementada (DEC-250) con captura completa, copia estructurada privada y revalidación de la baja antes de la descarga. `ClientSummary` se corrigió para omitir los datos personales en baja y se añadieron `phone` y `emailVerified`, ya previstos por RF-5 y el plan; no se añadieron operaciones de edición, desactivación ni reactivación. La pantalla administrativa sigue pendiente.
- Exportación: `export_job` guarda una copia temporal privada durante 24 horas; la captura se materializa en una sola consulta dentro de la transacción de idempotencia y no se pagina ni se trunca. La exportación de clientes conserva además una copia estructurada privada (`SnapshotContent`) para regenerar la variante de entrega con la privacidad vigente; no se expone por la API. No se implementaron snapshot PostgreSQL exportado, chunks, worker asíncrono, cuota de capacidad con `503`, enlaces públicos ni PDF. La neutralización de fórmulas cubre la matriz automatizada de prefijos soportados; la validación contra todas las hojas de cálculo objetivo sigue pendiente, por lo que RF-31 no se declara cerrado.
- CT-07: el `pageSize` máximo ya se rechaza en auditoría y clientes; el resto de listados sigue pendiente de DT-09.
- CT-06: `ETag`/`If-Match` no implementados; la slice usa `version` en el cuerpo.
- CT-08 y CT-09: dependen de R2 y de Culqi/Resend. CT-10 queda parcial: los CSV de auditoría y clientes están implementados; el PDF y el worker asíncrono no.
- CT-12: la validación documental no acredita el runtime de las 92 operaciones.
- API-01 sigue abierta; este resultado no la cierra.

## 5. Preservación

- No se añadieron RF/HU/RN, criterios ni tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin proveedores reales, pagos reales, correos, imágenes, PDF, datos de clientes, commits ni push.
- 91 archivos Markdown, 1 OpenAPI YAML, 1.674 enlaces locales y 0 rotos, 250 identificadores DEC (248 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`) y 0 tablas inconsistentes.
