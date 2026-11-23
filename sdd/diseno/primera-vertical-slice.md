# Primera vertical slice — identidad, catálogo, reserva y pago simulado

- **Versión:** v0.9.
- **Fecha:** 2026-11-16.
- **Estado:** implementada y verificada en entorno local de desarrollo; idempotencia durable incorporada; reenvío de verificación y recuperación de contraseña incorporados sobre el almacén de correo de desarrollo; auditoría persistida de identidad en `audit_record`; consulta y detalle administrativo de auditoría con autorización vigente, filtros exactos, paginación y resumen saneado; exportación CSV de auditoría con captura completa, artefacto temporal privado, expiración y descarga autorizada; consulta y detalle administrativo de clientes de solo lectura con filtros, conteo de reservas y restricción de bajas lógicas; exportación CSV de clientes con captura completa, copia estructurada privada y revalidación de privacidad en la descarga; subconjunto de contrato CT-02/03/04/05/06/07/10 (auditoría y clientes)/11 ejecutado; pendientes CT-08/09/12, pantalla administrativa de 010, relaciones de RF-25, proveedores reales y ratificación formal del OpenAPI.
- **Decisión asociada:** [DEC-242](../decisiones.md#dec-242---primera-vertical-slice-implementada), [DEC-243](../decisiones.md#dec-243---resultados-parciales-de-contrato-de-la-primera-vertical-slice), [DEC-244](../decisiones.md#dec-244---idempotencia-durable-de-la-primera-vertical-slice), [DEC-245](../decisiones.md#dec-245---reemisión-de-verificación-y-recuperación-de-contraseña), [DEC-246](../decisiones.md#dec-246---auditoría-persistida-de-identidad), [DEC-247](../decisiones.md#dec-247---consulta-y-detalle-administrativo-de-auditoría), [DEC-248](../decisiones.md#dec-248---exportación-csv-de-auditoría), [DEC-249](../decisiones.md#dec-249---consulta-y-detalle-administrativo-de-clientes) y [DEC-250](../decisiones.md#dec-250---exportación-csv-de-clientes).

## 1. Propósito

Validar de extremo a extremo el recorrido mínimo del producto:

1. Una persona se registra, verifica su correo e inicia sesión.
2. Consulta el catálogo público de tours.
3. Crea un borrador de reserva sobre una salida concreta.
4. Paga con el proveedor simulado de desarrollo.
5. La reserva queda confirmada y puede consultarse.
6. Una reserva pendiente puede cancelarse de forma idempotente y libera sus cupos.

La slice existe para comprobar la arquitectura, el modelo de datos, la seguridad de sesión y los flujos principales antes de ampliar el producto.

## 2. Alcance implementado

### 2.1. Identidad y sesión

| Operación | Ruta | Estado |
|---|---|---|
| Registro de cliente | `POST /api/v1/auth/register` | Implementado |
| Inicio de sesión | `POST /api/v1/auth/login` | Implementado |
| Renovación de sesión | `POST /api/v1/auth/refresh` | Implementado con rotación y detección de reutilización |
| Cierre de sesión | `POST /api/v1/auth/logout` | Implementado |
| Verificación de correo | `POST /api/v1/auth/verify-email` | Implementado con token de desarrollo |
| Reenvío de verificación | `POST /api/v1/auth/verify-email/resend` | Implementado con `Idempotency-Key` durable; sustituye el enlace anterior |
| Recuperación de contraseña | `POST /api/v1/auth/password/forgot` | Implementado con respuesta genérica y token de desarrollo |
| Restablecimiento de contraseña | `POST /api/v1/auth/password/reset` | Implementado; uso único y revocación de todas las sesiones |
| Perfil propio | `GET /api/v1/profile` | Implementado |

Características de seguridad incluidas:

- Contraseñas con `PasswordHasher` de ASP.NET Core.
- Access token JWT firmado con RSA/RS256.
- Refresh token opaco, almacenado solo como hash, con rotación de un solo uso.
- Familia de refresh tokens con revocación completa ante reutilización.
- Cookies `HttpOnly`, `SameSite=Strict` y `Secure` fuera de desarrollo.
- Prueba CSRF de doble envío para `refresh` y `logout`.
- Enlaces de verificación y de restablecimiento opacos, de un solo uso, con digest SHA-256 y vigencia (24 horas y 30 minutos).
- El restablecimiento incrementa la versión de seguridad y revoca todas las familias de refresh del usuario.
- Respuestas de autenticación fallida en formato `application/problem+json`.
- Clave RSA de desarrollo en `src/DMGoTravel.Api/App_Data/dev-jwt-key.pem`, fuera de Git.
- Claves de protección de datos en `src/DMGoTravel.Api/App_Data/keys`, fuera de Git.

Reemisión y recuperación:

- Solo el titular autenticado solicita otro enlace; se envía al correo vigente y no verifica la cuenta.
- La solicitud admitida sustituye el enlace anterior; el replay con la misma `Idempotency-Key` devuelve la misma respuesta sin emitir otro enlace.
- La recuperación responde de forma genérica exista o no la cuenta; el enlace vence a los 30 minutos, es de un solo uso y al consumirse revoca todas las sesiones.
- `429` y el rate limiting de identidad siguen pendientes; el contrato los declara pero no se ejecutan en esta entrega.

Auditoría de identidad:

- Registro, verificación, reenvío, login, rotación de refresh, logout, recuperación y restablecimiento añaden una fila a `audit_record` en el mismo `SaveChanges` que la operación; un fallo de auditoría revierte el cambio controlable (010/RF-36/RF-37).
- La fila conserva origen, `operationId` y acción del OpenAPI, actor humano o no identificado, entidad `user_account` con su identificador público, fecha UTC, correlación de la petición, resultado y cambios mínimos.
- Login inválido y reutilización de refresh se registran como `failure`; el replay idempotente del reenvío no duplica el registro de éxito.
- No se guardan correo, contraseñas, tokens, digests, cookies ni secretos. La exportación CSV de auditoría se describe en §2.6; la exportación CSV de clientes se describe en §2.5; la pantalla administrativa sigue pendiente de 010.

### 2.2. Catálogo público

| Operación | Ruta | Estado |
|---|---|---|
| Listado de catálogo | `GET /api/v1/catalog/{type}` | Implementado para `tours` y `packages` |
| Detalle de oferta | `GET /api/v1/catalog/{type}/{id}` | Implementado |

Incluye paginación, filtros básicos por precio, duración, fechas y destino, imágenes, condiciones, itinerario y salidas con disponibilidad.

### 2.3. Reservas

| Operación | Ruta | Estado |
|---|---|---|
| Crear borrador | `POST /api/v1/reservations` | Implementado solo para tours; exige `Idempotency-Key` |
| Listar reservas propias | `GET /api/v1/reservations` | Implementado con paginación |
| Consultar reserva propia | `GET /api/v1/reservations/{id}` | Implementado |
| Cancelar reserva pendiente | `POST /api/v1/reservations/{id}/cancel` | Implementado, idempotente y con `Idempotency-Key` durable |

Reglas aplicadas:

- La reserva se crea en estado `pending`.
- Se retienen cupos de la salida y se liberan al cancelar.
- El alojamiento se rechaza explícitamente en esta entrega con `400 validation_failed`.
- La cancelación de una reserva no pendiente devuelve `409 transition_not_allowed`.
- La cancelación repetida de una reserva ya cancelada devuelve el mismo resultado sin efectos adicionales.
- Los conflictos de concurrencia se traducen a `409`.
- La cabecera `Idempotency-Key` es obligatoria, admite de 1 a 128 caracteres y se aplica por cuenta y operación.
- Repetir la misma clave con el mismo cuerpo devuelve la respuesta original sin duplicar la reserva ni liberar cupos dos veces.
- Reutilizar la clave con otro cuerpo devuelve `409 idempotency_conflict`.
- La operación y el registro de idempotencia se confirman en la misma transacción; un fallo revierte ambos.

### 2.4. Pagos simulados

| Operación | Ruta | Estado |
|---|---|---|
| Iniciar pago | `POST /api/v1/reservations/{id}/payments` | Implementado con proveedor simulado y `Idempotency-Key` durable |
| Consultar pago | `GET /api/v1/payments/{id}` | Implementado |

El proveedor simulado:

- Acepta `card` y `yape`.
- Devuelve un identificador ficticio con prefijo `sim_`.
- Registra un `ExternalPayment` con proveedor `simulated`.
- Aprueba el pago y confirma la reserva de forma automática.
- Reutiliza un intento en estado `created` si una llamada previa no llegó a invocar al proveedor.
- Repetir el pago con la misma clave devuelve el intento aprobado original incluso si la reserva ya está confirmada; no crea un segundo `ExternalPayment`.
- Reutilizar la clave con otro método devuelve `409 idempotency_conflict`.

### 2.5. Clientes

| Operación | Ruta | Estado |
|---|---|---|
| Listar clientes | `GET /api/v1/admin/clients` | Implementado con autorización vigente, filtros, paginación y orden estable |
| Consultar cliente | `GET /api/v1/admin/clients/{id}` | Implementado por identificador público y con restricción de baja lógica |
| Solicitar exportación | `POST /api/v1/admin/exports/clients` | Implementado con `Idempotency-Key`, captura completa y artefacto temporal |
| Consultar exportación | `GET /api/v1/admin/exports/{id}` | Implementado; solo el solicitante autorizado |
| Descargar CSV | `GET /api/v1/admin/exports/{id}/download` | Implementado; revalida la baja actual y expira a las 24 horas |

Reglas aplicadas:

- Solo un administrador vigente puede consultar clientes. Además del `bearerAuth`, se relee en base el rol, estado, baja lógica, `SecurityVersion` y familia de refresh activa; si no puede verificarse, la respuesta falla cerrada con `401`/`403`.
- `page` debe ser positivo y `pageSize` se limita a 1-100, con 25 por defecto. Una página válida sin resultados devuelve `items: []`, sin saltar a otra página.
- `name` y `email` aplican coincidencia parcial sin distinguir mayúsculas; `id` y `status` exigen coincidencia exacta. Los estados expuestos son `active`, `suspended` y `closed`; `closed` es el estado de baja.
- `registeredFrom` y `registeredTo` son fechas comerciales `YYYY-MM-DD` de `America/Lima`, inclusivas y convertidas a un intervalo UTC semiabierto. Un rango invertido o una fecha inválida devuelve `400 invalid_range`; un identificador o estado no admitido devuelve `400 invalid_filter`.
- Todos los filtros se combinan con AND. Un texto vacío después de retirar espacios no aplica el filtro.
- La lista ordena por fecha de registro descendente y desempata por identificador interno descendente. El detalle busca por UUID público y devuelve `404 not_found` si el identificador no corresponde a un cliente.
- La cantidad de reservas cuenta una sola vez cada reserva en `pending`, `confirmed`, `completed` o `cancelled`, aunque tenga varios holds, noches o eventos.
- Un cliente con baja lógica solo expone `id`, `status` y `reservationCount`; se omiten `fullName`, `email`, `phone`, `emailVerified` y `registeredAt`. Las búsquedas nuevas por nombre o correo no lo encuentran por esos datos ocultos.
- Para clientes sin baja se exponen nombre, correo, teléfono disponible, fecha de registro, verificación de correo, estado y cantidad de reservas; no se exponen credenciales, tokens ni atributos internos.
- El esquema `ClientSummary` se corrigió para que los datos personales sean opcionales y se omitan en baja; `phone` y `emailVerified` ya estaban previstos por RF-5 y el plan. No se añadieron rutas, acciones ni operaciones de edición, desactivación o reactivación.
- La exportación acepta el mismo cuerpo opcional `{ "filters": { ... } }`, las mismas claves y la misma semántica que la consulta, sin paginación. Exige `Idempotency-Key`, captura el conjunto completo en una consulta dentro de la transacción de idempotencia y responde `202` con `id`, `status: accepted`, `referenceAt` y `expiresAt`; no recorta por volumen. Un filtro desconocido o de tipo inválido devuelve `400 invalid_filter`; una fecha inválida o un rango invertido devuelve `400 invalid_range`.
- El CSV de clientes usa la cabecera estable `id,fullName,email,phone,registeredAt,emailVerified,status,reservationCount`, RFC 4180, UTF-8 y la misma neutralización soportada de prefijos de fórmula. Las filas siguen el orden de registro descendente con desempate estable, conservan la cantidad de reservas de la captura y no incorporan clientes creados después de la solicitud. Un CSV sin coincidencias entrega solo la cabecera.
- Un cliente con baja lógica solo entrega `id`, `status=closed` y `reservationCount`; `fullName`, `email`, `phone`, `registeredAt` y `emailVerified` quedan vacíos. Si la baja ocurre después de solicitar el CSV, la descarga relee la baja actual y vuelve a renderizar desde una copia estructurada privada para enmascarar la fila antes de entregarla, sin eliminar filas, añadir registros nuevos ni refrescar las cantidades ordinarias. Si el cliente ya no puede verificarse, se enmascara igual.
- La copia estructurada de clientes no se expone por la API. La descarga exige autorización vigente y propiedad del artefacto; otro administrador recibe `404`, un artefacto vencido devuelve `410 export_expired` y la consulta de estado lo muestra como `expired`. La respuesta incluye `X-Export-Reference-At` con el instante UTC de la captura, conforme a RF-59.

### 2.6. Auditoría administrativa

| Operación | Ruta | Estado |
|---|---|---|
| Listar auditoría | `GET /api/v1/admin/audit` | Implementado con autorización vigente, filtros exactos, paginación y orden estable |
| Consultar entrada | `GET /api/v1/admin/audit/{id}` | Implementado por identificador público |
| Solicitar exportación | `POST /api/v1/admin/exports/audit` | Implementado con `Idempotency-Key`, captura completa y artefacto temporal |
| Consultar exportación | `GET /api/v1/admin/exports/{id}` | Implementado; solo el solicitante autorizado |
| Descargar CSV | `GET /api/v1/admin/exports/{id}/download` | Implementado; expira a las 24 horas |

Reglas aplicadas:

- Solo un administrador vigente puede consultar o exportar. Además del `bearerAuth`, se relee en base el rol, estado, baja lógica, `SecurityVersion` y familia de refresh activa; si no puede verificarse, la respuesta falla cerrada con `401`/`403`.
- `page` debe ser positivo y `pageSize` se limita a 1-100, con 25 por defecto. La paginación no interviene en la exportación.
- `from` y `to` son fechas comerciales `YYYY-MM-DD` de `America/Lima`; ambos extremos incluyen el día completo y se convierten a un intervalo UTC semiabierto.
- `actor` acepta el UUID público de una cuenta o los tipos `human`, `system` y `unidentified`. `entity`, `correlationId`, `action`, `type` y `result` exigen coincidencia exacta; los textos vacíos no aplican filtro.
- La lista ordena por fecha de operación descendente y desempata por identificador interno descendente. El detalle busca por UUID público y devuelve `404 not_found` si no existe.
- La respuesta usa el UUID público del registro y no expone la clave interna. El resumen se deriva solo de claves y valores permitidos de los cambios y excluye correo, tokens, digests, cookies y `familyId`.
- La exportación acepta un cuerpo opcional `{ "filters": { ... } }` con las mismas claves y semántica exacta de la consulta. Un filtro desconocido o un tipo inválido devuelve `400 invalid_filter`; un rango invertido o una fecha inválida devuelve `400 invalid_range`.
- `POST` exige `Idempotency-Key`, captura el conjunto completo en una única consulta materializada dentro de la transacción de idempotencia y responde `202` con `id`, `status: accepted`, `referenceAt` y `expiresAt`. No se pagina ni se recorta el resultado; un fallo no deja un archivo parcial presentado como completo.
- El `referenceAt` es el instante UTC de la solicitud. El artefacto privado dura 24 horas y un servicio en segundo plano elimina los vencidos cada 6 horas; no hay enlaces públicos. `GET /{id}` devuelve `createdAt` igual al instante de referencia y `downloadPath` mientras esté vigente. La descarga informa el instante de referencia con la cabecera `X-Export-Reference-At` en ISO 8601 UTC, además del nombre de archivo y las cabeceras privadas de entrega.
- El CSV usa cabeceras estables, RFC 4180 y neutraliza como texto los valores con prefijo de fórmula soportado (`=`, `+`, `-`, `@` y tabulación/CR/LF iniciales, también tras espacios). La matriz completa de hojas de cálculo sigue pendiente. No incluye correo, tokens, digests, cookies, `familyId` ni el JSON almacenado.
- Un CSV sin coincidencias entrega solo la cabecera y ninguna fila ficticia. La descarga exige de nuevo autorización vigente y propiedad del artefacto; otro administrador recibe `404`, un artefacto vencido devuelve `410 export_expired` y la consulta de estado lo muestra como `expired`.
- La consulta y la exportación solo ven los registros de identidad ya persistidos. Las relaciones de auditoría entre reserva, pago, evento o notificación (010/RF-25) siguen pendientes porque esos módulos aún no generan sus filas.

### 2.7. Persistencia y datos

- PostgreSQL 16 en contenedor `dmgotravel-postgres`.
- Base de datos `dmgotravel_dev`.
- Migraciones `20261111202423_InitialCreate`, `20261113004006_AddIdempotencyRecords`, `20261113021233_AddPasswordResetToken`, `20261115005813_AddExportJobs` y `20261116051941_AddExportSnapshot` aplicadas.
- Tablas principales: usuarios, perfiles, refresh tokens, ofertas, itinerarios, imágenes, salidas, reservas, snapshots, holds, pagos, `idempotency_record`, `audit_record` y `export_job`.
- `audit_record` ya existía desde la migración inicial; la auditoría de identidad usa sus columnas actuales y no requirió una migración nueva.
- `export_job` es metadata temporal de entrega, no un segundo historial: guarda `kind` (`audit` o `clients`), solicitante, referencia, expiración, filtros normalizados, recuento de filas, huella SHA-256 y el CSV ya renderizado. Para clientes conserva además una copia estructurada privada (`SnapshotContent`) que permite revalidar la baja antes de entregar sin exponerla por la API. La consulta y la descarga filtran por solicitante y no exponen un enlace público.
- `idempotency_record` guarda la huella SHA-256 del cuerpo, la respuesta JSON, el usuario, el ámbito, la clave y la expiración; el índice único `(user_id, scope, key)` arbitra la concurrencia.
- La retención de idempotencia es de 48 horas (`OperationalParameters:IdempotencyKeyRetentionHours`); la de exportación es de 24 horas. Dos servicios en segundo plano eliminan los registros vencidos cada 6 horas.
- `UseQuerySplittingBehavior(SplitQuery)` configurado para evitar consultas cartesianas con varias colecciones.
- Datos ficticios de desarrollo mediante `DevelopmentDataSeeder`.

## 3. Fuera de alcance

No se implementaron en esta slice:

- Proveedores reales de pago (Culqi), correo (Resend) ni almacenamiento (R2).
- Envío real de correos; los tokens de verificación y restablecimiento se exponen solo en el almacén de desarrollo.
- Imágenes reales, reportes, PDF o archivos publicados.
- Alojamiento, hoteles, movilidad, inventario administrativo ni panel de administración.
- Cambio de correo, cierre de cuenta, reenvío de verificación administrativo y vínculo con Google.
- Idempotencia durable para registro y recuperación de contraseña; la slice la aplica a reservas, pagos y reenvío de verificación.
- Rate limiting, respuestas `429`, bloqueo por intentos fallidos y limpieza programada de refresh tokens.
- Pantalla administrativa de 010; la consulta, el detalle y la exportación CSV de clientes ya están implementados (DEC-249 y DEC-250). Triggers de inmutabilidad, retención programada de auditoría, deduplicación por `dedup_key`, catálogo oficial versionado de acciones y auditoría de módulos distintos de identidad. La consulta, el detalle y la exportación CSV de auditoría ya están implementados (DEC-247 y DEC-248), pero no cubren las relaciones de 010/RF-25. Tampoco se implementaron snapshot PostgreSQL exportado, chunks, worker asíncrono ni respuesta `503` por capacidad de captura; la captura actual usa una consulta materializada y un artefacto temporal síncrono. La matriz completa de fórmulas/hojas de cálculo de RF-31 sigue pendiente.
- Matriz completa de pruebas de contrato CT-02–CT-12; el subconjunto aplicable a la slice ya se ejecutó y se documenta en [resultados-pruebas-contrato.md](resultados-pruebas-contrato.md).
- Ratificación formal del OpenAPI.

## 4. Evidencia de verificación

### 4.1. Compilación

```text
dotnet build DMGoTravel.slnx --nologo
0 errores, 0 advertencias
```

### 4.2. Pruebas automatizadas

El host de VSTest falla en este entorno con `Win32Exception (5): Acceso denegado` al abrir el proceso padre. Las pruebas se ejecutan con el runner in-process de xUnit v3:

| Proyecto | Total | Errores | Fallidas | Omitidas |
|---|---:|---:|---:|---:|
| `DMGoTravel.Domain.Tests` | 11 | 0 | 0 | 0 |
| `DMGoTravel.ArchitectureTests` | 3 | 0 | 0 | 0 |
| `DMGoTravel.Api.IntegrationTests` | 47 | 0 | 0 | 0 |

La suite de integración `tests/DMGoTravel.Api.IntegrationTests` usa `WebApplicationFactory<Program>` y PostgreSQL real. La base `dmgotravel_it` se recrea al inicio de cada ejecución y la conexión se fija con una variable de entorno antes de que `Program` construya su configuración; la API aplica migraciones y siembra los datos ficticios en `Development`. Cubre salud, registro, verificación, reenvío de verificación, recuperación y restablecimiento de contraseña, login, perfil, catálogo, reserva, pago simulado, cancelación idempotente, rechazo de paquetes y alojamiento, `401` en `problem+json`, rotación con reutilización de refresh token, la idempotencia durable de reservas, pagos y reenvío, el rastro de auditoría de identidad, la consulta/detalle administrativo de auditoría con autorización vigente, la exportación CSV de auditoría con captura completa, filtros, idempotencia, propiedad y expiración, la consulta/detalle de clientes con filtros, conteo y restricción de bajas lógicas, y la exportación CSV de clientes con captura completa, privacidad de bajas, revalidación en la descarga, idempotencia, propiedad y expiración.

El subconjunto de contrato se documenta en [resultados-pruebas-contrato.md](resultados-pruebas-contrato.md): CT-02, CT-03, CT-04, CT-05, CT-06, CT-07 y CT-11 pasan en el perímetro implementado; CT-10 pasa parcialmente para los CSV de auditoría y clientes, pero no cubre PDF ni una matriz completa de hojas de cálculo; CT-08 y CT-09 quedan bloqueadas; CT-12 sigue parcial.

```text
dotnet run --project tests\DMGoTravel.Api.IntegrationTests --no-build
```

Cobertura añadida en esta slice:

- `Money.Copy()` devuelve una instancia independiente.
- `RefreshToken` se consume una sola vez y se revoca.
- `TourDeparture` retiene y libera cupos sin exceder la capacidad.
- `Reservation.CancelByClient` es idempotente y libera holds.
- `Offer.Activate` exige itinerario y permite asociar imágenes.
- La suite de integración cubre el recorrido completo, las reglas de alcance y la rotación de refresh.
- `ContractSliceTests` cubre CT-02, CT-03, CT-04, CT-06, CT-07 y CT-11 en el perímetro implementado.
- `IdempotencySliceTests` cubre replay de creación, conflicto por cuerpo distinto, cabecera obligatoria, longitud máxima, replay de pago tras confirmar, conflicto por método distinto, replay y conflicto de cancelación y dos creaciones concurrentes con una sola reserva resultante.
- `RecoverySliceTests` cubre reenvío autenticado con cabecera obligatoria, sustitución del enlace anterior, replay con la misma clave, conflicto `already_verified`, respuesta genérica ante cuenta inexistente, restablecimiento con uso único, rechazo de prueba inválida o contraseña corta y revocación de la sesión previa.
- `AuditSliceTests` cubre el rastro de registro, verificación y login sin secretos; reenvío con replay sin duplicar el éxito; recuperación y restablecimiento auditados; login fallido y reutilización de refresh como `failure`; identificador público, correlación y ausencia de contraseñas y tokens.
- `AdminAuditTests` cubre autorización anónima, de cliente y de administrador; rechazo tras cambio de rol o revocación de la familia de refresh; filtros exactos por entidad, actor, resultado, acción y correlación; rango de fechas inclusivo en hora de Perú; paginación con página vacía; orden estable; detalle por UUID público; `404`; y resumen sin correo, tokens ni `familyId`.
- `AdminAuditExportTests` cubre `401`/`403`, cabecera `Idempotency-Key` obligatoria, cuerpo opcional, captura completa de cinco filas, cabeceras y orden CSV, neutralización de fórmula, ausencia de correo/tokens/`familyId`, filtros exactos con AND, rango inclusivo de Perú, CSV vacío solo con cabecera, replay idempotente, conflicto por cuerpo distinto, aislamiento entre administradores, expiración con `410 export_expired` y descarga con `text/csv`, `Content-Disposition`, `X-Export-Reference-At` y sin caché.
- `AdminClientTests` cubre `401` anónimo, `403` de cliente, `200` de administrador, filtros parciales de nombre/correo sin distinguir mayúsculas, identificador y estado exactos, rango de registro inclusivo en hora de Perú, combinación AND, paginación con página vacía, orden por registro y desempate, conteo único de reservas en los cuatro estados, detalle por UUID público, `404` para inexistente o cuenta no cliente, estados `active`/`suspended`/`closed` y baja lógica con solo identificador, estado y cantidad.
- `AdminClientExportTests` cubre `401`/`403`, `202` con `Idempotency-Key`, cuerpo opcional, captura completa de clientes con filtros de rango, cabecera y orden CSV, filas con comas/comillas/saltos de línea, neutralización de fórmula, baja con solo `id`/`closed`/cantidad y ausencia de PII, baja posterior enmascarada sin añadir clientes ni refrescar cantidades, CSV vacío solo con cabecera, filtros parciales de nombre/correo e `id`/`status` exactos, rango inclusivo de Perú, `400 invalid_filter`/`invalid_range`, replay idempotente, conflicto por cuerpo distinto, aislamiento entre administradores, expiración con `410 export_expired`, pérdida de autorización y descarga con `text/csv`, `Content-Disposition`, `X-Export-Reference-At` y sin caché.
- Los listados de catálogo y reservas devuelven `400 invalid_page` para `page` no válido.

### 4.3. Smoke test manual

| Escenario | Resultado |
|---|---|
| `GET /health` | `200 Healthy` |
| Registro de usuario | `201 Created` |
| Verificación de correo | `200` |
| Reenvío de verificación | `202 accepted`; el enlace anterior deja de verificar |
| Recuperación de contraseña | `202 accepted` genérico, exista o no la cuenta |
| Restablecimiento con enlace válido | `200 completed`; todas las sesiones quedan revocadas |
| Restablecimiento con enlace usado | `400 invalid_token` |
| Login | `200` con access token y cookies |
| Rotación de refresh token | `200` con nuevo refresh |
| Reutilización de refresh token | `401` y revocación de familia |
| `GET /profile` sin token | `401 application/problem+json` |
| Listado y detalle de catálogo | `200` |
| Creación de reserva de tour | `201 pending`, cupos retenidos |
| Pago simulado con `card` | `201 approved`, reserva `confirmed` |
| Pago simulado con `yape` | `201 approved`, reserva `confirmed` |
| Cancelación de reserva pendiente | `200 cancelled`, cupos liberados |
| Cancelación repetida | `200 cancelled`, sin cambios adicionales |
| Cancelación de reserva confirmada | `409 transition_not_allowed` |
| Reserva con alojamiento | `400 validation_failed` |
| Reserva de paquete | `409 reservation_unavailable` |
| Consulta de pago | `200` con proveedor `simulated` |
| Creación repetida con la misma clave y cuerpo | `201` con el mismo `id`; una sola reserva |
| Creación con la misma clave y otro cuerpo | `409 idempotency_conflict` |
| Creación sin `Idempotency-Key` | `400 validation_failed` |
| Pago repetido con la misma clave | `201` con el mismo pago aprobado |
| Cancelación repetida con la misma clave | `200` con la misma respuesta |
| Dos creaciones concurrentes con la misma clave | Una sola reserva |

Las filas de idempotencia se verificaron con `IdempotencySliceTests` sobre PostgreSQL real, no solo con el smoke test manual. El rastro de auditoría se verificó con `AuditSliceTests` contra `audit_record`, incluida la ausencia de secretos y el replay sin duplicado. La consulta y el detalle administrativo se verificaron con `AdminAuditTests`, incluida la autorización vigente y el resumen saneado. La exportación CSV se verificó con `AdminAuditExportTests` contra PostgreSQL real, incluida la captura completa, el CSV vacío con cabecera, la expiración y la ausencia de secretos. La consulta y el detalle de clientes se verificaron con `AdminClientTests`, incluida la autorización vigente, los filtros, el conteo y la restricción de bajas lógicas. La exportación CSV de clientes se verificó con `AdminClientExportTests` contra PostgreSQL real, incluida la captura completa, la revalidación de baja antes de la descarga, la ausencia de PII de clientes dados de baja y la cabecera `X-Export-Reference-At`.

### 4.4. Advertencias

- Sin advertencias de instancias `Money` compartidas ni de tipos owned.
- Sin advertencia de múltiples colecciones incluidas tras configurar `SplitQuery`.
- La migración `20261113004006_AddIdempotencyRecords` se aplicó sin errores; el índice único `(user_id, scope, key)` está activo.
- La migración `20261113021233_AddPasswordResetToken` se aplicó sin errores y añade el digest y la vigencia del restablecimiento.
- La migración `20261115005813_AddExportJobs` se aplicó sin errores y añade `export_job` con índices por solicitante/fecha, expiración y UUID público. La migración `20261116051941_AddExportSnapshot` añade `SnapshotContent` para la copia estructurada privada de clientes.
- La auditoría de identidad no requirió migración: `audit_record` ya existía y sus columnas cubren origen, operación, actor, acción, entidad, fechas, correlación, resultado y cambios.
- Los servicios de limpieza de idempotencia y de exportaciones se ejecutan cada 6 horas y no interfieren con las pruebas.
- Persiste la advertencia de desarrollo por la licencia de MediatR; no afecta la slice.

## 5. Criterio de cierre de la slice

La slice se considera cerrada cuando:

1. La solución compila con 0 errores.
2. Las pruebas de dominio, arquitectura, integración y el subconjunto de contrato pasan.
3. El smoke test completo de la sección 4.3 pasa sobre PostgreSQL local.
4. No hay advertencias de tipos owned compartidos.
5. La migración inicial, la de idempotencia, la de restablecimiento de contraseña, la de exportaciones y la de la copia estructurada de clientes están aplicadas.
6. Las operaciones de identidad implementadas dejan su registro en `audit_record`, en el mismo commit y sin secretos.
7. DEC-242, DEC-243, DEC-244, DEC-245, DEC-246, DEC-247, DEC-248, DEC-249, DEC-250 y este documento están registrados.
8. Las limitaciones de la sección 3 quedan explícitamente aceptadas como pendientes.

## 6. Próximos pasos

1. Conectar Resend; el flujo de reenvío y recuperación ya funciona con el almacén de desarrollo y la auditoría de identidad ya se persiste.
2. Completar CT-08, CT-09, CT-10 y CT-12; el subconjunto CT-02, CT-03, CT-04, CT-05, CT-06, CT-07, CT-10 (auditoría y clientes) y CT-11 ya se ejecutó.
3. Implementar la pantalla administrativa de 010, además de las relaciones de RF-25 que dependen de auditoría de reservas, pagos, eventos y notificaciones; la consulta, el detalle y la exportación CSV de clientes, y la consulta, el detalle y la exportación CSV de auditoría ya están disponibles.
4. Completar la matriz de pruebas de fórmulas/hojas de cálculo y evaluar snapshot PostgreSQL exportado, chunks, worker asíncrono y `503` por capacidad antes de considerar A-04.
5. Integrar proveedores reales solo con autorización separada.
6. Ratificar formalmente el OpenAPI.
7. Añadir rate limiting, `429` y limpieza programada de refresh tokens.
8. Implementar `ETag`/`If-Match` y decidir DT-09 para el rechazo de `pageSize` superior al máximo.
