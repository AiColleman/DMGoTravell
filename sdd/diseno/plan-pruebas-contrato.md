# Plan de pruebas de contrato v0.1 — CT-02 a CT-12

> **Fecha:** 2026-11-05. **Versión:** 0.1. **Registro:** DEC-221.  
> **Objeto:** [plan API-01](plan-api-01.md), [contrato de API](contrato-api.md), [OpenAPI](openapi/dmgo-api-v1.yaml), [matriz de operaciones](matriz-operaciones-openapi.md), [política DEC-219](politica-versionado-api.md) y [decisiones DEC-220](decisiones-transversales-api.md).  
> **Estado:** **plan RATIFICADO DOCUMENTALMENTE por DEC-239**; PT-01–PT-06, el harness y la ejecución de CT-02–CT-12 siguen pendientes. No ejecuta pruebas, no crea harness, no genera código, handlers, SQL, migraciones, endpoints, proveedores, configuración, commits o push.  
> **Puerta:** API-01 sigue abierta. CT-02–CT-12 no se consideran superadas hasta que exista evidencia registrada contra una implementación o un harness autorizado.

## 1. Objetivo y límites

Este plan convierte la matriz CT-02–CT-12 del [plan API-01](plan-api-01.md) en casos verificables, evidencia mínima y dependencias. No sustituye las specs, el contrato ni las decisiones de diseño.

Límites:

- Solo `sdd/`; sin datos, cuentas, pagos, correos, imágenes o exportaciones reales.
- El OpenAPI sigue siendo un borrador no normativo; el contrato textual es la referencia de diseño.
- Una prueba solo se declara superada con evidencia reproducible y saneada.
- Un fallo de seguridad, privacidad o integridad no se compensa con pruebas de éxito.
- Las pruebas bloqueadas por runtime o proveedor se registran como **BLOQUEADAS**, no como aprobadas.

## 2. Principios de ejecución

1. **Contrato primero:** cada caso deriva de una operación, regla o decisión existente; no se inventan requisitos.
2. **Aislamiento:** entorno y datos sintéticos, sin producción ni cuentas de clientes.
3. **Reproducibilidad:** versión del OpenAPI, commit de la implementación, configuración no secreta y fecha de ejecución.
4. **Evidencia saneada:** solicitud/respuesta, estado, cabeceras relevantes, `traceId`, hash del cuerpo y logs sin secretos.
5. **Fallo cerrado:** ausencia de evidencia equivale a no superado.
6. **Sin atajos:** una prueba de esquema no acredita comportamiento; una prueba manual no sustituye un caso automatizable sin justificación.

## 3. Requisitos del harness

El harness no se implementa en esta actividad. Cuando se autorice, debe cubrir:

| Elemento | Requisito | Estado |
|---|---|---|
| Entorno | Local o staging aislado; URL base y versión identificadas. | PENDIENTE: PT-01 |
| Identidades | Cuentas sintéticas `anonymous`, `client`, `admin` y un segundo cliente para aislamiento. | PENDIENTE: PT-02 |
| Datos | Fábrica de catálogo, hoteles, movilidad, reservas, pagos, archivos y reportes ficticios; limpieza posterior. | PENDIENTE: PT-02 |
| Cliente HTTP | Envío de JSON, multipart, cookies, bearer, `Idempotency-Key`, `If-Match` y cabeceras de webhook. | PENDIENTE |
| Reloj | Control o espera acotada para vencimientos, ventanas y `Retry-After`. | PENDIENTE |
| Proveedores | Stubs o sandbox de Culqi/Resend; R2 y PDF según API-06/07/08. | BLOQUEADO |
| Evidencia | Almacenamiento saneado con caso, resultado, fecha, versión y `traceId`. | PENDIENTE: PT-04 |
| Seguridad | Sin secretos en logs; datos efímeros; acceso restringido a la evidencia. | PENDIENTE |

El harness no debe usar credenciales de producción ni convertir un stub en prueba de un proveedor real.

## 4. Casos por CT

### CT-02 — Seguridad

**Cobertura:** las 92 operaciones, agrupadas por seguridad declarada.

Casos mínimos:

- Operación anónima sin `Authorization`: éxito esperado; no exige bearer.
- Operación de cliente sin access: `401 unauthenticated`.
- Operación de cliente con access de otro cliente: no accede a recursos ajenos; `404` cuando corresponda.
- Operación de admin con access de cliente: `403 forbidden`.
- Operación de admin con access de admin: continúa al caso de éxito.
- Refresh/logout con cookie: valida cookie, CSRF y revocación según contrato.
- Webhook: sin JWT; firma inválida se rechaza antes de deserializar.

**Evidencia:** matriz operación → seguridad → resultado, códigos y `traceId`; sin tokens en la evidencia.

**Bloqueos:** API-02 para topología, cookies, CSRF, CORS y revocación.

### CT-03 — Éxito

**Cobertura:** las 92 operaciones.

Casos mínimos:

- Código HTTP declarado y cuerpo válido contra el esquema.
- `Location` en creaciones cuando el contrato lo exige.
- `ETag` en recursos versionados; `Cache-Control`/tipo de contenido cuando aplique.
- Estado persistido coherente con la respuesta; sin efectos laterales no declarados.
- Operaciones internas no aparecen como rutas públicas.

**Evidencia:** solicitud/respuesta saneada, esquema validado, cabeceras y comprobación de estado.

**Bloqueos:** API-02, API-06, API-07 y API-08 según la operación.

### CT-04 — Errores

**Cobertura:** errores declarados por operación y errores transversales.

Casos mínimos:

- `application/problem+json` con `type`, `title`, `status`, `code`; `detail` cuando aplique.
- `traceId` presente según la decisión pendiente DT-04.
- Validación: `400 validation_failed` con `errors` acotados.
- Recurso ajeno: `404`, no `403`.
- Conflicto de estado/versión: `409` con código específico.
- Baja bloqueada: `409` con `blockers` acotados.
- Sin stack, SQL, tokens, enlaces, PAN/CVV, cuerpos de proveedor ni rutas internas.
- Un `5xx` no se presenta como éxito ni confirma pago/reserva.

**Evidencia:** código, `code`, `traceId`, forma del error y búsqueda de fugas en cuerpo/log.

**Bloqueos:** API-03 y mensajes aprobados.

### CT-05 — Idempotencia

**Cobertura:** las 22 operaciones con `Idempotency-Key` y los comandos internos equivalentes.

Casos mínimos:

- Primera solicitud válida: efecto aplicado una vez.
- Replay con misma clave y mismo payload: mismo resultado; sin duplicar auditoría, liberación, caso o aviso.
- Misma clave con payload distinto: `409 idempotency_conflict`; no se aplica el segundo efecto.
- Clave ausente: `400 validation_failed`; el servidor no inventa una clave.
- Respuesta perdida: el replay recupera el resultado sin repetir el efecto.
- Concurrencia con la misma clave: un efecto; el comportamiento exacto queda pendiente DT-06.

**Evidencia:** dos o más solicitudes, estados, cuerpos, auditoría y conteos de efectos.

**Estado en la slice:** ejecutado para creación de reserva, cancelación y pago con `idempotency_record`, índice único `(user_id, scope, key)` y transacción compartida. Quedan pendientes el resto de operaciones con `Idempotency-Key` y la ratificación formal de DT-06.

**Bloqueos restantes:** API-04, BT/MD para las operaciones no incluidas en la slice.

### CT-06 — Concurrencia y versión

**Cobertura:** ediciones administrativas y transiciones con `ETag`/`If-Match` o `version`.

Casos mínimos:

- Versión correcta: actualización aplicada y nueva versión/`ETag`.
- Versión desactualizada: `409 stale_version`; sin escritura parcial.
- Dos escrituras concurrentes: solo una gana; la otra no pisa cambios.
- Replay de una transición aplicada: resultado estable; sin nueva auditoría de éxito.
- `If-Match: *` según decisión pendiente DT-07; no se acepta por defecto.
- Fallo de persistencia: no se devuelve éxito ni se confirma pago.

**Evidencia:** versiones antes/después, respuestas, estado final y ausencia de efectos duplicados.

**Bloqueos:** API-04 y runtime.

### CT-07 — Paginación, filtros, tiempo y dinero

**Cobertura:** operaciones de listado, historial, auditoría, clientes, reportes y exportaciones.

Casos mínimos:

- `page=1` válido; `page=0`, negativo y no entero: `400 invalid_page`.
- `pageSize` dentro del máximo por módulo; por encima del máximo, rechazo según DT-09.
- Página válida sin resultados: `200` con `items: []`.
- `total` coherente con la página; no se promete inmovilidad.
- Filtros combinados con AND; texto vacío se omite; comodines SQL se tratan como texto.
- Fechas: día completo en `America/Lima`, inicio inclusivo y día siguiente exclusivo; UTC en instantes.
- Dinero: cadena decimal PEN de dos decimales; sin `float`; importes calculados por backend.
- Orden estable documentado; no se aceptan campos u orden arbitrarios.
- Página fuera del total: respuesta vacía, no error, salvo decisión contraria.

**Evidencia:** parámetros, respuestas, totales, zona horaria y valores monetarios exactos.

**Bloqueos:** API-05 y datos sintéticos suficientes.

### CT-08 — Archivos y multimedia

**Cobertura:** carga/edición de imágenes de catálogo, hotel/tipo y movilidad; lectura publicada y previsualización admin.

Casos mínimos:

- Multipart válido; MIME y contenido verificados, no solo extensión.
- Límite de 5 000 000 bytes; exceso rechazado.
- Fallo de carga/edición conserva la imagen anterior; no deja estado parcial.
- Archivo no publicado no se lee públicamente; `404 media_not_published`.
- Activo publicado se lee con MIME canónico, `nosniff`, longitud/integridad y `Cache-Control` inicial.
- Previsualización admin requiere rol y no publica.
- Desactivar el servicio no borra la marca ni republica; el enlace conocido puede seguir leyendo mientras el archivo se conserve.

**Evidencia:** archivos ficticios, metadatos, respuestas, estado de publicación y ausencia de huérfanos.

**Bloqueos:** API-07, R2 y runtime.

### CT-09 — Webhooks

**Cobertura:** webhook Culqi y webhook Resend.

Casos mínimos:

- Firma validada antes de deserializar; firma inválida no crea estado.
- `2xx` solo después de persistencia durable; fallo de persistencia no confirma.
- Replay del mismo evento no duplica pago, reserva, incidente, caso o aviso.
- Evento desconocido o fuera de orden no corrompe el estado.
- Cuerpo de proveedor no se copia como contrato propio ni se expone.
- Respuesta de error permite reintento del proveedor según contrato.

**Evidencia:** eventos firmados ficticios, estados, idempotencia y logs saneados.

**Bloqueos:** API-06, contratos reales de Culqi/Resend y runtime.

### CT-10 — Exportaciones y PDF

**Cobertura:** exportación de clientes/auditoría, estado/descarga y reportes/PDF.

Casos mínimos:

- Crear exportación/reporte devuelve `202`; no es archivo listo.
- Captura materializada coherente con el corte; no cambia por altas posteriores.
- Estado y descarga respetan rol, expiración y `409`/`410` del contrato.
- PDF completo, sin PII innecesaria ni datos de otras cuentas.
- Fallo de generación no deja descarga parcial ni estado listo falso.
- Enlaces de descarga no se registran en logs ni se reutilizan fuera de ventana.

**Evidencia:** solicitud, estado, archivo ficticio, corte, expiración y revisión de PII.

**Bloqueos:** API-08, R2, PDF/licencia y runtime.

### CT-11 — Privacidad y fugas

**Cobertura:** transversal a todas las operaciones.

Casos mínimos:

- Un cliente no lee recursos, historial, pagos, archivos o exportaciones de otro.
- Respuestas y logs no contienen access/refresh, tokens de un solo uso, enlaces, PAN/CVV, códigos Yape, credenciales, claves internas ni URLs firmadas.
- Errores no revelan existencia de recursos ajenos.
- Exportaciones/PDF no incluyen PII de otras cuentas.
- Evidencia de prueba no conserva secretos.

**Evidencia:** búsqueda automatizada de patrones y revisión manual de respuestas/logs.

**Bloqueos:** API-03, API-07, API-08 y runtime.

### CT-12 — Ejemplos

**Cobertura:** OpenAPI y documentación.

Casos mínimos:

- Los 8 ejemplos de esquema, los 139 bloques de éxito, los 22 ejemplos compartidos y los 36 específicos de error validan contra sus esquemas.
- Cada operación tiene ejemplo de solicitud y respuesta cuando aplique; las 6 respuestas sin cuerpo (`4` × `204`, `2` × `302`) están documentadas como tales.
- Cada error declarado tiene un ejemplo heredado de `ProblemDetails`; los lotes O y P cubren identidad, perfil, reservas, pagos, autorización de devoluciones, catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada; quedan autenticación residual, perfil, notificaciones, media administrativa y operaciones de creación.
- Los ejemplos son ficticios y no contienen datos reales, tokens, enlaces, PAN/CVV ni PII.
- Los ejemplos no contradicen el contrato ni las decisiones DEC-219/220.

**Evidencia:** validación JSON Schema, inventario de ejemplos por operación y revisión de datos.

**Bloqueos:** ninguno para ampliar ejemplos; la ejecución de CT-12 completa depende de la revisión por operación.

## 5. Orden de ejecución

| Fase | Pruebas | Requisito | Estado |
|---|---|---|---|
| A | CT-01, CT-12 parcial | OpenAPI y ejemplos | CT-01 documental superado; CT-12 parcial |
| B | CT-02, CT-03, CT-04, CT-11 | Harness base e identidades | BLOQUEADA: PT-01/PT-02 |
| C | CT-05, CT-06, CT-07 | Runtime, persistencia y datos | CT-05 ejecutado en la slice; CT-06/CT-07 parciales; API-04/05 y BT/MD siguen abiertos para el resto |
| D | CT-08, CT-09, CT-10 | R2, Culqi/Resend, PDF | BLOQUEADA: API-06/07/08 |

No se declarará API-01 cerrada por completar solo la fase A.

## 6. Evidencia y cierre

Cada caso se registra como:

- **PASS:** evidencia reproducible y criterio cumplido.
- **FAIL:** diferencia respecto del contrato; requiere corrección o decisión.
- **BLOCKED:** falta entorno, proveedor, permiso o decisión; no cuenta como PASS.
- **NOT RUN:** no ejecutado; no cuenta como PASS.

API-01 requiere CT-02–CT-12 en PASS o una excepción documentada con propietario, justificación y fecha. Las excepciones de seguridad, privacidad o integridad financiera no se aceptan sin decisión explícita.

El resultado se registrará en un futuro `resultados-pruebas-contrato.md`; este plan no lo crea.

## 7. Decisiones pendientes

| ID | Pendiente | Impacto |
|---|---|---|
| PT-01 | Entorno, URL base y propietario del harness. | CT-02–CT-11 |
| PT-02 | Identidades y fábrica de datos sintéticos. | CT-02–CT-10 |
| PT-03 | Stubs/sandbox de Culqi, Resend, R2 y PDF. | CT-08–CT-10 |
| PT-04 | Formato, retención y acceso a la evidencia. | Todas |
| PT-05 | Criterio de excepciones y aprobación. | Cierre API-01 |
| PT-06 | Automatización mínima y pruebas manuales justificadas. | Todas |

## 8. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, harness, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
