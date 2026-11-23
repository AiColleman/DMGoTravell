# Plan técnico — Spec 010: Clientes y auditoría

> **Fecha:** 2026-11-02. **Versión del plan:** 0.1.  
> **Base:** [spec v0.3 aprobada](spec.md), 59 criterios, DEC-169; DEC-155–DEC-168.  
> **Estado:** diseño propuesto, **NO EJECUTADO** ni validado mediante implementación.  
> **Alcance:** «continua» tras planificar 009; solo `C:\Users\Asus TUF\Desktop\DMGoTravelll\sdd`. Sin modificar specs/planes anteriores, consultar datos reales, exportar información, crear infraestructura, ejecutar código, commits o push.

## 1. Objetivo, fuentes y alcance

Diseñar consultas administrativas de clientes y auditoría, registro inmutable de operaciones críticas, conservación indefinida y CSV completo de resultados filtrados con referencia temporal fija, protección de clientes de baja y autorización vigente antes de descarga.

Preservar `010/RF-1–RF-59`. Clientes estrictamente de solo lectura: no editar, desactivar, reactivar, cambiar roles ni ejecutar pagos/cancelaciones/reenvíos desde auditoría. CSV no incluye JSON como formato adicional ni sustituye el reporte PDF de 011.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [fuentes](../../fuentes.md), [trazabilidad](../../trazabilidad.md), RF15/RF23, HU-18/HU-14/HU-15/HU-20, RN-26/RN-28–RN-30 y AC04/AC05/AC09. Consumir contratos/planes de 001/002/003/004/005/006/007/009/013 sin modificarlos. 008 no tiene spec; registrar únicamente sus obligaciones existentes cuando su flujo esté aprobado.

Las menciones históricas de la spec a 002/009 en borrador no revierten sus aprobaciones posteriores DEC-171/DEC-172. Las elecciones de este plan son propuestas técnicas, no nuevas ADR ni políticas comerciales.

## 2. Evidencia técnica consultada

Lectura pública el **2026-11-02**, sin consultas SQL o pruebas sobre cuentas/datos reales:

| Fuente | Información aplicada | Límite |
|---|---|---|
| [PostgreSQL: aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html) | `REPEATABLE READ` mantiene el snapshot fijado al primer comando no transaccional de su transacción. | Una fecha guardada no permite consultar versiones antiguas arbitrarias cuando el worker arranque después. |
| [PostgreSQL: sincronización de snapshots](https://www.postgresql.org/docs/current/functions-admin.html) | `pg_export_snapshot()` permite compartir una vista mientras siga viva la transacción exportadora; no es un respaldo durable. | Guardar ese identificador y cerrar la transacción no conserva la vista para un job futuro o reinicio. |
| [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html) | Comillas, separadores y saltos de línea tienen reglas de representación/escape. | Quoting correcto no convierte una fórmula maliciosa en texto seguro. |
| [OWASP: CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection) | Celdas de texto con prefijos peligrosos pueden ejecutar fórmulas; guardar/reabrir en aplicaciones de hoja de cálculo puede invalidar mitigaciones simples. | No existe una transformación universal probada para todas las aplicaciones/transformaciones posteriores; exigir una matriz explícita de formatos/clientes soportados. |

## 3. Contratos y organización

Mantener el monolito ASP.NET Core/C#, Clean Architecture, CQRS/MediatR, PostgreSQL/EF Core/Npgsql, Hangfire persistente y OpenAPI/ProblemDetails. Domain no depende de HTTP, CSV o proveedores. No añadir un broker, base de negocio distinta, almacenamiento local persistente o un servicio de auditoría separado.

| Origen | Responsabilidad propia | Contrato para 010 |
|---|---|---|
| 001/006/007/009/013 | Aplicar operaciones y preservar sus invariantes | Enviar hechos/cambios relevantes mediante puerto de auditoría dentro de su transacción local; no permitir que el consumidor reejecute el cambio. |
| 002 | Dinero, evidencia externa y consultas de resultado | Identificadores/intención durable y resultado real; recuperar evidencia sin volver a cobrar o devolver por una falla de auditoría. |
| 003/004 | Jobs, intentos, envío, fallos, reintentos/alertas | Distinguir repetición del mismo hecho de otro intento con resultado propio; evitar recursión de alertas. |
| 005 | Cuenta/rol/familia/versiones vigentes y datos de cliente autorizados | Autorizar consultas y descargas, filtrar clientes y comprobar baja sin copiar sus reglas de identidad. |
| 001 | Reserva por ID y relación con cliente | Cantidad distinta de reservas en los cuatro estados, calculada en el mismo contexto de lectura cuando forme parte de una copia temporal. |
| 008/011/012 | Alcances aún no especificados de perfil/reportes/multimedia | No implementarlos por integrar consultas, retención o exportación de 010. |

Separar puertos lógicos de anexado transaccional, lectura de clientes/auditoría, consulta de privacidad/autorización actual, captura de exportación, generación/entrega y gestión de incidentes. Sin endpoint HTTP público para insertar auditoría arbitraria con actor/fecha impuestos por el cliente.

## 4. Modelo de auditoría e inmutabilidad

Sobre proyecciones/contratos autorizados, diseñar:

- **Registro de auditoría:** ID único, origen, operación/hecho/intento identificable, actor humano/sistema/no identificado cuando corresponda, acción, entidad e ID, fecha original en UTC, fecha de incorporación, correlación disponible, resultado y cambios permitidos.
- **Esquema de cambios por origen:** lista positiva de campos relevantes y versión. No snapshots completos de entidades ni serialización genérica del objeto/payload HTTP. Prohibir password, JWT, refresh, tokens/enlaces/códigos, PAN/CVV y credenciales incluso anidados.
- **Referencias históricas:** IDs estables preservados tras baja lógica; no FK en cascada que borre auditoría ni enriquecimiento con un nombre actual que reescriba el significado del hecho.
- **Catálogo de acciones:** versionado por módulo/operación y acordado en contratos técnicos. Conservar exactamente `reservation.auto_cancelled`; no inventar nuevos nombres como si estuvieran ya en las specs.

Unicidad propuesta por origen/operación/hecho/paso o intento, no solo por reserva. El mismo evento reprocesado no crea otra aplicación exitosa; un reintento real distinto sí registra su propio fallo/resultado. Un rechazo no es un cambio aplicado: resultado y cambios dejan esa diferencia explícita.

Proponer rol de migración/propietario separado de credenciales runtime. Lectura y anexado con mínimos privilegios; aplicación sin `UPDATE`, `DELETE`, `TRUNCATE`, `DROP` o modificación de particiones sobre auditoría. Probar permisos efectivos, no confiar solo en que no exista un botón. El administrador de negocio no recibe credenciales de dueño de base.

No prometer inmutabilidad frente al superusuario, operador de almacenamiento o modificación de respaldos por el solo hecho de restringir la aplicación; la spec exige inmutabilidad **desde la aplicación**. Definir pruebas de restauración y control operativo sin convertir una propuesta de hash/WORM en una garantía inexistente.

## 5. Escritura, fallo y recuperación

Los cambios controlables se confirman con su auditoría en el mismo commit local. El puerto de anexado se incorpora a la unidad transaccional del origen; no usar un «fire-and-forget» posterior como sustituto de RN-28. Si falla, abortar/informar sin dejar la operación aplicada y sin insertar después un éxito inventado.

Un efecto externo ya ocurrido es diferente. 002 debe haber persistido su intención antes de enviarlo, conservar referencias recuperables y validar consulta oficial; un fallo posterior no permite otro `POST` financiero ni cancelar el cobro por ese fallo. Reconciliar el resultado real y anexar evidencia pendiente con fecha del hecho conocida y momento real de incorporación/recuperación. Si se desconoce cuándo se recibió una respuesta, no inventarlo ni retrofechar la validación de pago para entrar en la ventana de 20 minutos.

Proponer un procesador persistente de pendientes con idempotencia por hecho y evidencias saneadas. La intención previa y el registro externo canónico solo acreditan recuperación si G-05 de 002 lo demuestra; una tabla en la misma base caída no registra por arte de magia un incidente mientras no está disponible. M-05 de 004 y la recuperación de 003 deben probar fallos simultáneos y consulta administrativa del incidente sin recursión. Si no existe evidencia durable suficiente, mantener bloqueada esa integración en vez de declarar una garantía.

La consulta de auditoría no ejecuta acciones de reparación ni reenvíos/cancelaciones/devoluciones. Los incidentes se integran con 004; reintentar anexado no crea un nuevo hecho de negocio ni un bucle de auditoría sobre su propio fallo.

## 6. Consulta de clientes y auditoría

Autorización real `admin` vigente por 005 antes de cada lista/detalle/solicitud/descarga; familia o rol revocados no conservan acceso solo por una firma JWT válida. Si no puede verificarse la autorización, fallar cerrado sin exponer resultados. No inferir actor/rol de IDs del cuerpo.

Clientes: lector de cuentas cliente de 005 y lector de reservas de 001. Sin inventar teléfono/nombre ausentes ni completar fechas con «ahora». Datos permitidos de cliente sin baja: nombre, correo, teléfono disponible, registro, verificación, estado y cantidad de reservas; no credenciales ni atributos internos por defecto.

Cantidad de reservas: contar IDs distintos en `pending`, `confirmed`, `completed`, `cancelled`; una reserva con varias noches/eventos no cuenta varias veces. Leer por lote o proyección autorizada, no N+1 por cliente ni acceso a repositorios ajenos. En exportación, la cantidad pertenece a la misma vista temporal que sus demás valores.

Cliente con baja lógica: **solo ID, estado de baja y cantidad** en lista, detalle y CSV de clientes; sin nombre/correo/teléfono/fecha de registro/verificación expuestos. Si ya tiene baja al evaluar una búsqueda nueva, no coincide por esos nombre/correo ocultos. Esta regla no borra ni reescribe registros históricos de auditoría autorizados y no crea una operación de baja/reactivación en 010.

Auditoría: mostrar campos permitidos/cambios relevantes y relaciones disponibles entre reserva/pago/evento/notificación, sin reconstruir una acción que nunca se registró. No añadir búsqueda libre por payload, visitas públicas o contactos ocultos como atajo de reidentificación. Referencias pueden conducir a consultas existentes autorizadas, nunca a comandos de negocio desde esta pantalla.

### Filtros y paginación

Propuesta técnica propia de 010: 25 filas por página y máximo 100; enteros positivos, exceso/formato inválido con error, no clamp ni cambio automático de página. No confundir esos tamaños con el conjunto **completo** exportado.

Clientes filtran nombre/correo parcial sin distinguir mayúsculas, ID/estado exactos y fecha de registro. Auditoría filtra fecha de operación, IDs de actor/entidad/correlación, acción, tipo de entidad y resultado, con coincidencia exacta de opciones/IDs. Todos los filtros se combinan mediante AND; texto vacío tras retirar espacios se omite, no parámetros mal formados. No añadir normalización sin tildes/fonética.

Rangos por días completos inclusivos en hora de Perú, convertidos a UTC; implementación propuesta con inicio inclusivo y comienzo del día siguiente exclusivo, sin restar una fracción artificial. Un extremo omitido deja rango abierto; inversión/fecha inválida produce error. Fecha de incorporación de auditoría se conserva para reconstrucción, pero no sustituye silenciosamente el filtro aprobado por fecha de operación.

Orden por registro de cliente o fecha de operación de auditoría descendentes, desempate ID único descendente. Página válida vacía se devuelve vacía sin saltar a otra. Cada llamada obtiene su lectura local coherente; no prometer inmovilidad entre páginas de distintas peticiones mientras cambia la fuente.

## 7. Captura consistente de exportación: punto de referencia real

**No basta** guardar `requestedAt`, filtrar `createdAt <= requestedAt` o conservar un ID de `pg_export_snapshot()` después de cerrar su transacción. Clientes pueden cambiar, reservas añadirse y auditorías incorporarse tarde con fecha original anterior.

Propuesta: **materializar una copia temporal privada de filas/columnas autorizadas bajo un snapshot PostgreSQL adquirido en el flujo inicial de admisión**, antes de encolar la generación diferida. Congelar filtros, solicitante, tipo, versión de columnas y punto de referencia visible del backend; el instante no proviene del navegador ni del inicio posterior de un worker.

1. Autorizar y validar; comprobar capacidad de captura antes de admitir trabajo. Si está saturada, informar sin aceptar un job que luego use otra vista fingiendo que es la original.
2. Abrir contexto de captura `REPEATABLE READ` y fijar su snapshot en el primer comando de datos de esa fase. Registrar el punto de referencia real y una identidad de solicitud opaca/idempotente.
3. Leer todos los resultados filtrados y cantidades bajo ese mismo contexto mediante contratos autorizados entre módulos; copiar solo campos permitidos a preparación privada. Escrituras limitadas a metadata/copia de exportación, no a clientes, reservas o auditoría fuente. No declarar la transacción SQL `READ ONLY` si debe insertar esa copia.
4. Confirmar copia, manifest y marca de captura completa como un conjunto. Solo una captura confirmada puede pasar a renderizado diferido; un identificador de snapshot huérfano no es copia durable.
5. Si cae la conexión/proceso antes de confirmar, fallar explícitamente la solicitud o verificar si su captura se confirmó; **no recrear una vista nueva bajo la referencia vieja**. Tras captura confirmada sí se puede reintentar el renderizado desde esa copia sin releer valores ordinarios actuales.

El punto de referencia se fija al admitir la solicitud autorizada y adquirir la vista, no al pulsar un botón o al momento en que un mensaje llegó a una cola. El contrato HTTP debe hacer visible cuándo se aceptó una captura real; no devolver éxito de captura antes de poseerla. Repetición con la misma clave consulta el resultado/estado de esa solicitud, no crea una segunda exportación con datos nuevos etiquetados como antiguos.

Una transacción larga de captura consume recursos/MVCC. Probar tamaño/carga y presión sobre vacuum antes de habilitar; no poner un límite comercial de filas o truncamiento silencioso para ocultar la falta de capacidad. Si se cancela por límite técnico, devolver fallo sin archivo parcial presentado como completo.

## 8. Generación completa, CSV seguro y almacenamiento temporal

Propuesta inicial de captura/generación: una captura concurrente y dos workers de renderizado, lectura por lotes de 1.000 filas; valores a calibrar, **no máximo de resultados**. Se exporta todo el conjunto capturado. No mantener una transacción abierta entre peticiones del navegador o para que un worker futuro importe un snapshot ya inválido.

Proponer preparación y artefacto en tablas privadas de PostgreSQL con bloques/chunks y manifest de tamaño/conteo/huella, sin disco persistente del contenedor ni buckets/enlaces públicos. Es metadata/representación temporal de entrega, no un segundo historial de auditoría. Verificar capacidad/privilegios/cifrado de plataforma antes de elegir almacenamiento físico definitivo; no agregar un proveedor por iniciativa del plan.

Construir el archivo completo y verificar manifest antes de marcarlo listo. Separar captura, renderizado, listo, fallo y expirado como estados **técnicos de exportación**, no de reserva. Una interrupción no publica el prefijo generado como archivo final. Retomar desde copia confirmada o fallar; no completar la exportación con registros de una captura distinta.

### Formato propuesto

- `text/csv; charset=utf-8`, cabeceras estables, separador coma, terminación de fila CRLF; citar campos y duplicar comillas conforme a RFC 4180. Conservar tildes/Unicode; no cortar saltos internos para ocultar un error de serialización.
- Columnas clientes: ID, nombre, correo, teléfono, fecha de registro con zona, verificación, estado y cantidad. Para bajas, solo ID/estado/cantidad con celdas restantes vacías; no cambiar de esquema ni inventar datos. Auditoría: ID, actor/tipo, acción, entidad/ID, fecha original UTC, fecha de incorporación UTC, correlación, resultado y cambios saneados permitidos.
- Cantidades/fechas producidas desde tipos controlados y cultura estable; no concatenar cadenas del usuario como números o fórmulas. Cambios complejos se representan como texto estructurado saneado, no payload crudo.
- Archivo sin coincidencias: mismas cabeceras y cero filas; no una fila ficticia de «sin resultados». El punto de referencia se informa en metadata/contrato de descarga, no como filas que contaminen los datos.

### Protección frente a fórmulas

Usar un serializador dedicado y una política de texto inerte para entradas no confiables con `=`, `+`, `-`, `@`, controles iniciales o variantes peligrosas. Quoting RFC y TLS **no** bastan. Proponer codificación de texto con marcador de neutralización dentro del campo citado, documentada para exportación destinada a lectura en hoja de cálculo; no modificar la fuente para sanear la descarga.

Validar el método final en la matriz real de hojas/clientes/versiones soportados, casos de separadores/comillas/multilínea y guardado/reapertura. OWASP advierte que apóstrofo/quotes simples no son universales y que tabulación tiene diferencias entre aplicaciones. No declarar que una prefijación es segura para cualquier herramienta o modificación futura. Si no se acredita que la salida sea texto inerte en el alcance soportado, no habilitar la exportación ni quitar RF-31 para publicar un CSV inseguro.

## 9. Privacidad vigente y descarga controlada

El conjunto de filas y sus valores ordinarios permanecen como estaban en la captura; **privacidad y permisos son una excepción vigente**, no otro snapshot de negocio. Al solicitar descarga:

1. Validar administrador/familia/rol actuales y pertenencia/autorización de la solicitud; ID de exportación no es una credencial. No enlazar un archivo público ni entregar un enlace directo reutilizable que omita esta validación posterior.
2. Comprobar estado de baja actual con una lectura nueva, no con la vista de captura. Nunca revelar nombre/correo/etc. que ya estaban ocultos al inicio. Si hubo una baja posterior, conservar esa fila/ID y la cantidad del inicio, pero eliminar de la representación entregada todos los otros campos restringidos por RF-44.
3. Si un artefacto listo contiene campos ahora restringidos, invalidar esa variante y producir otra completa desde la misma copia capturada más la máscara de privacidad actual; no servirlo primero y corregir después. No añadir clientes/registros nuevos ni refrescar cantidades ordinarias.
4. Fijar y probar el punto de comprobación de privacidad/autorización inmediatamente anterior a iniciar la entrega; si cambian mientras se prepara la variante, reevaluar antes de publicar su respuesta. No mantener locks de clientes durante toda una descarga de red.
5. Entregar solo variante completa validada, con tamaño conocido, huella, nombre seguro e instante de referencia/zona, mediante backend autorizado y caché `private/no-store`. La UI dice «archivo listo» solo cuando corresponde; iniciar una respuesta no demuestra que el usuario la haya recibido completa.

Contrato de privacidad/versiones a verificar con 005 y el estado de baja de 008 cuando exista, sin implementar baja/reactivación en 010. La protección antes de entregar no permite borrar auditoría histórica ni promete retirar bytes ya recibidos en una descarga anterior autorizada.

Si se corta la transferencia, no declarar descarga exitosa por haber abierto el enlace; preservar el estado del artefacto completo y permitir otra solicitud autorizada con privacidad reevaluada. No sustituir la revisión actual por una firma de URL o por el permiso guardado al crear el job.

## 10. Retención, archivo y permisos

Auditoría indefinida, sin TTL de borrado ni limpieza automática por aplicación. Proponer índices por fecha/ID/origen/entidad/actor/correlación y una estrategia de particiones/archivo consultable, sometida a capacidad/restauración. Mover a un archivo no puede perder la consulta ni habilitar `DELETE`/`DROP` runtime. La autorización de conservación no implica capacidad física ilimitada o una promesa legal de inmutabilidad frente a operador privilegiado.

Las copias/artefactos temporales de exportación no son el historial canónico. Propuesta: 24 horas de disponibilidad desde que estén listos, cleanup propio con permisos exclusivamente sobre preparación/artefactos/metadata técnica, nunca sobre auditoría o entidades fuente. Un job incompleto necesita detección de abandono/cancelación técnica sin publicar contenido; no confundir su expiración con borrar evidencia histórica.

Pruebas de mínimos privilegios separan escritor de auditoría, lectores, workers de captura/renderizado/cleanup y propietario/migraciones. Un worker que elimina exportaciones temporales no hereda permiso de borrar auditoría. El administrador de negocio no recibe conexiones SQL o acceso a chunks/copia sin el backend.

## 11. API, interfaz y observabilidad

Proponer endpoints versionados de lista/detalle de clientes y auditoría, solicitud/estado/descarga de CSV. No endpoints de edición/baja/reactivación de cliente ni actualización/eliminación de auditoría. Las escrituras de metadata de exportación son internas, no una mutación de los recursos de negocio de RF-35.

OpenAPI/ProblemDetails debe distinguir filtros inválidos, página vacía, acceso denegado, captura no admitida, generación fallida, artefacto no listo o expirado, sin devolver un archivo incompleto como éxito. Respuestas y logs excluyen secretos/errores internos de SQL; nombres de archivo no incorporan texto arbitrario del cliente.

La UI muestra claramente solo lectura, zona/fecha del registro y referencia de exportación, filtros activos, generación/estado y errores. No un botón de reparación que altere historia ni una acción financiera en una fila de auditoría. Cargas paginadas no significan «solo se exporta esta página».

Medir latencia de consulta/captura, duración de snapshot, bloat/espera de vacuum, presión de staging/chunks, filas/bytes capturados/generados, fallos de reconciliación y privacidad. No registrar contenido personal o enlaces secretos en métricas. Ninguna cuota de concurrencia o timeout técnico puede presentarse como un CSV completo truncado.

## 12. Pruebas, entregables y puertas

[tasks.md](tasks.md) registra **T010-01–T010-34**, todas pendientes, cubriendo los 59 criterios. Pruebas esenciales: permisos SQL efectivos, transacción local con auditoría, evidencia externa recuperada sin repetir dinero, captura con cambios concurrentes, registro tardío con fecha original antigua, CSV malicioso, baja antes de descargar, pérdida de rol, caída antes/después de materializar y archivo incompleto.

Puertas pendientes de evidencia:

1. **A-01 Contratos/catálogo:** campos/acciones por origen y lectores de clientes/reservas; no payload arbitrario, nombres históricos inventados ni funciones nuevas de 008.
2. **A-02 Inmutabilidad/retención:** privilegios reales, ausencia de cascadas y conservación/consulta/restauración indefinidas probadas.
3. **A-03 Consistencia/recuperación:** anexado conjunto con efectos controlables y recuperación externa de 002/004 sin dependencia circular o repetición financiera; validar sus G/M y contratos de 009.
4. **A-04 Snapshot/escala:** copia confirmada en admisión, conteo/orden/datos coherentes, capacidad sin truncamiento y recuperación sin sustituir la referencia temporal.
5. **A-05 CSV/privacidad:** serialización e inercia probadas en clientes soportados, máscara actual de baja y rol vigente antes de entrega; archivo completo, no URL pública.
6. **A-06 Autorización:** actividad posterior explícita para código/datos/infraestructura. Este plan no inserta auditorías, consulta clientes reales, ejecuta jobs ni genera archivos reales.

Al completar esta planificación quedan planes documentales para la cadena aprobada de Pagos; **no** quedan implementaciones, pruebas reales o autorizaciones de producción por ese hecho. 008/011/012 siguen requiriendo su propio proceso de especificación.
