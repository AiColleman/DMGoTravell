# Plan técnico — Spec 008: Perfil y baja lógica

> **Fecha:** 2026-11-02. **Versión del plan:** 0.1.  
> **Base:** [spec v0.1 aprobada](spec.md), 37 criterios, DEC-186; entrevista DEC-180–DEC-185.  
> **Estado:** propuesta técnica y planificación **NO EJECUTADA**.  
> **Autorización:** «continua» después del «si» de aprobación; solo `C:\Users\Asus TUF\Desktop\DMGoTravelll\sdd`. Sin cambios en criterios, specs o planes anteriores; sin código, datos/cuentas modificados, correos, configuración externa, commits ni push.

## 1. Objetivo y límites

Diseñar consulta/actualización propia de nombre y teléfono, solicitud y confirmación de correo diferido, avisos mínimos a ambas direcciones y baja lógica con bloqueo por reservas/pagos/devoluciones activos. Preservar `008/RF-1–RF-37`, Google previamente vinculado, unicidad de identidad, historial y protección de baja de 010.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [trazabilidad](../../trazabilidad.md), [fuentes](../../fuentes.md), RF12/HU-12/HU-13, RN-25/RN-28–RN-30 y AC04/AC05/AC07/AC09/AC11. Las propuestas de parámetros, puertos y mecanismos no son nuevas ADR o reglas comerciales.

No crear edición de cuentas ajenas/admin, reactivación, borrado físico, liberación del correo de una cuenta de baja, perfil ampliado o un comando de baja que cancele/reembolse para quedar sin bloqueos. No modificar passwords, vínculos Google o snapshots contratados desde los campos de perfil.

## 2. Dependencias y contratos nuevos de propósito

| Origen | Contrato necesario | Compatibilidad pendiente de evidencia |
|---|---|---|
| 005 Identidad | Titular activo, normalización/unicidad, estado, versión de seguridad, revocación y prueba de identidad | [Plan 005](../005-identidad/plan.md), intacto. 008 incorpora el propósito nuevo de cambio de correo; no usar tokens de registro/reset indistintamente. |
| 004 Notificaciones | Prueba al correo solicitado y avisos de cambio aplicado a direcciones anterior/nueva | [Plan 004](../004-notificaciones/plan.md), intacto; sus comprobaciones genéricas de correo vigente deben aceptar estos propósitos autorizados sin habilitar destinatario arbitrario. |
| 001/002 | Lectores completos de reservas/pagos/devoluciones y coordinación por cuenta | [Planes 001](../001-reservas/plan.md) y [002](../002-pagos/plan.md), intactos; una lectura de bloqueos sola no protege contra una operación nueva concurrente. |
| 003/009 | Estado canónico de reservas y casos | [Planes 003](../003-vencimiento/plan.md) y [009](../009-administracion-reservas/plan.md), intactos; 008 no completa/cancela para permitir una baja. |
| 010 Clientes/auditoría | Registro local anexado y estado de baja/privacidad actual para consulta/CSV | [Plan 010](../010-clientes-auditoria/plan.md), intacto; la máscara actual no borra historia ni cambia valores ordinarios de la copia temporal. |

La spec de 008 aprobada es la autoridad de los nuevos flujos; no atribuirlos a una aprobación previa de 004/005 ni alterar sus documentos para aparentar que ya estaban integrados. La integración real exige acuerdos de contratos y pruebas P-01–P-06 antes de ejecutar.

## 3. Evidencia técnica y decisiones de diseño

Lectura pública el **2026-11-02**, sin SQL, credenciales ni operaciones reales:

| Referencia | Aporte | Límite |
|---|---|---|
| [PostgreSQL: bloqueos](https://www.postgresql.org/docs/current/explicit-locking.html) | Modos compartidos/exclusivos y orden consistente de adquisición; las incompatibilidades dependen del modo, no de su nombre informal. | `FOR KEY SHARE` no sustituye cualquier barrera de elegibilidad ante cambios no clave de la cuenta. |
| [PostgreSQL: aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html) | Una consulta `READ COMMITTED` ve datos confirmados al comenzar esa consulta; lecturas sucesivas pueden diferir. | Un `NOT EXISTS` aislado de reservas activas no impide que otra transacción inserte una después. |
| [OWASP: autenticación](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) | Riesgo de cambios de correo y comprobación de identidad para acciones sensibles. | No copiar MFA, doble confirmación del correo anterior u otros flujos no aprobados; la política elegida sigue siendo verificar el nuevo y avisar a ambos tras aplicar. |

Mantener monolito ASP.NET Core/C#, Clean Architecture, CQRS/MediatR, FluentValidation y PostgreSQL/EF Core/Npgsql. Identity conserva propiedad de la cuenta, sesiones y pruebas; Payments/Reservations conservan sus datos. No HTTP entre módulos, acceso directo a repositorios ajenos, broker, proveedor nuevo o persistencia en disco efímero.

## 4. Parámetros técnicos iniciales

Propuestas verificables antes de implementación, no nuevas restricciones comerciales:

| Área | Propuesta inicial | Control |
|---|---|---|
| Nombre | Texto Unicode de 1–200 caracteres tras retirar espacios exteriores | No ASCII-only, cambios de mayúsculas/tildes o truncamiento silencioso; no reescribir snapshots históricos. |
| Teléfono | Opcional; vacío elimina el dato, omitido conserva; validar/normalizar formato telefónico con validador mantenido, región PE por defecto cuando aplique y formato internacional admitido | Verificar versión/comportamiento; no restringir por analogía solo a móvil ni consultar un proveedor externo por cada edición. |
| Correo | Misma normalización/formato e índice único canónico de 005 | No eliminar puntos/alias de proveedores por iniciativa de 008; la baja lógica no excluye la cuenta del índice. |
| Solicitud de cambio | Vigencia de 30 minutos, prueba opaca de 32 bytes aleatorios criptográficos y digest en almacén de Identity | Propósito/cuenta/correo origen/destino y versión de seguridad ligados; uso único y solo última válida. No reutilizar prueba de registro o reset. |
| Confirmación sensible | Prueba de identidad reciente para solicitar correo/baja, propuesta de hasta 5 minutos, además de confirmación explícita | Contraseña local o flujo de la misma identidad Google autorizada si no hay contraseña local; no crear una contraseña ficticia ni tomar un JWT refrescado como nueva prueba de identidad. |
| Límite de solicitudes de correo | 3 por cuenta/hora y 10 por IP/hora | Compartido entre instancias, sin cerrar correo actual mientras espera; reintento idempotente no se convierte en otra intención. |
| Confirmación de correo | 5 intentos por solicitud cada 15 minutos | Errores sin exponer otra cuenta o devolver enlaces/pruebas al solicitante anónimo. |
| Perfil/baja | Propuestas de 10 actualizaciones/minuto y 3 solicitudes de baja/15 minutos por cuenta, sujetas a carga/abuso | Sin convertir un control técnico en baja diferida, aprobación administrativa o cancelación automática. |

No confundir la vigencia de esta prueba con los TTL de 005, las 24 horas de Resend o los 15/20 minutos de la reserva. Si Google no aporta la prueba de identidad/recencia requerida por el contrato elegido, no fingirla por un `iat` recién emitido: validar un mecanismo compatible antes de habilitar la acción sensible. No añadir un factor de autenticación fuera de alcance.

## 5. Modelo, versiones y claves de operación

Registros lógicos propuestos, no tablas/clases existentes:

- **Perfil:** nombre/teléfono autorizados y versión de concurrencia de perfil; la actualización básica no cambia automáticamente la versión de seguridad ni revoca sesiones.
- **Solicitud de correo:** ID, cuenta, propósito, correo origen canónico, destino normalizado, creación/vencimiento, digest de prueba, versión de seguridad, generación y estado de uso/sustitución. Una referencia actual por cuenta identifica la última válida.
- **Cambio aplicado:** referencia de operación, cuenta estable, momento, destinos autorizados anterior/nuevo, versión de seguridad resultante y avisos asociados; no alias de acceso permanente al correo anterior.
- **Operación idempotente:** titular/acción/clave opaca, huella de contenido y resultado mínimo; no secreto en clave/huella expuesta o resultado recuperable por quien ya perdió autorización.
- **Baja:** estado/fecha, versión de privacidad/seguridad y referencias de evidencia; datos históricos y correo canónico conservados, no eliminación de cuenta física ni de filas financieras.

Unicidad de correo vigente incluye cuentas con baja lógica. Una solicitud pendiente **no reserva globalmente** su destino: otra cuenta/registro puede ocuparlo antes de confirmar, como prevé la spec. Las solicitudes de distintas cuentas pueden apuntar al mismo correo disponible; la primera confirmación válida que lo reclame gana la unicidad, no se fusionan cuentas.

Separar versión de perfil, versión/generación de solicitud y versión de seguridad. Editar nombre/teléfono no invalida por accidente la solicitud de correo o sesiones existentes. Una nueva intención válida cambia la generación pendiente, no el correo vigente; input inválido no sustituye lo que ya era válido. Igual normalizado al vigente es no-op de correo y no borra una solicitud pendiente distinta.

## 6. Coordinación por cuenta y transacciones

### Barrera de elegibilidad propuesta

La baja requiere saber que no existen bloqueos y evitar una inserción/admisión concurrente que invalide esa conclusión. Proponer una barrera persistente por cuenta, compartida por **todos** los participantes relevantes, no un lock en memoria ni una lectura de lista.

- Operaciones cliente que creen/admitan reserva, intento de pago u otro bloqueo obtienen una protección compatible compartida por cuenta y validan estado/seguridad antes de confirmar sus cambios.
- Cambio efectivo de correo y baja toman protección exclusiva por cuenta. Como propuesta PostgreSQL a verificar: `FOR SHARE` para elegibilidad y `FOR UPDATE` para mutación de cuenta; comprobar la matriz real de conflictos. No asumir que `FOR KEY SHARE` bloquea cambios no clave.
- Orden a validar: cuenta/elegibilidad → familia/solicitud cuando corresponda → reserva → pago/caso → compromisos ordenados. Precede, sin invertir, el orden financiero propuesto en planes previos. Todos los escritores deben adherirse; si un adaptador no lo hace, P-02 sigue abierta.
- Bajo exclusión de baja, releer estado canónico y bloqueos de reservas/pagos/devoluciones mediante sus contratos locales. Si una reserva/admisión ganó primero, baja se rechaza; si ganó la baja, una operación cliente nueva ve cuenta inactiva y se rechaza.
- Registrar un hecho financiero externo ya ocurrido **no exige que el titular siga activo**. Puede coordinarse con la misma barrera para ordenar su incorporación, pero no perder dinero/evidencia ni activar la cuenta por ese motivo. Si el hecho aparece después de la baja, aplicar 002 y preservar la baja.

Proponer `READ COMMITTED` con protecciones explícitas, unicidades y revalidación; demostrarlo con PostgreSQL real. No considerar un snapshot más antiguo prueba de ausencia actual de bloqueos. Si no puede comprobarse un origen o su estado de forma confiable, rechazar/retener la baja, nunca asumir que está libre.

Propuestas de espera/comando locales de 5/10 segundos y hasta dos reintentos transitorios acotados, con nueva lectura y autorización en cada intento. No reintentar automáticamente por bloqueo de negocio, versión cambiada, cuenta inactiva o prueba inválida. No mantener transacciones durante email/Google/proveedor de pagos o interacción de usuario.

Los cambios locales, solicitudes/consumos, revocaciones, auditoría e intenciones de aviso deben confirmarse juntos cuando forman una operación. Falla cualquiera y se revierte el conjunto; un fallo externo de envío posterior no revierte ese commit.

## 7. Perfil y cambio de correo

### Consulta y datos básicos

Obtener titular activo de 005, no del ID del cuerpo. Leer solo los campos autorizados y estado de solicitud, sin devolver digests/pruebas/enlaces. Payload con whitelist y distinción campo omitido/vacío; validar todo antes de aplicar nombre/teléfono y una solicitud de correo combinados. Si el correo de una actualización combinada es inválido/ocupado, no dejar los otros campos parcialmente aplicados.

### Solicitar un correo

1. Exigir titular activo, confirmación expresa y prueba de identidad reciente validada por 005 para la intención sensible.
2. Validar destino distinto del canónico, formato y unicidad actual. Retirar solo espacios/normalizar como 005; no crear alias ni cambiar propiedad de otra cuenta.
3. Con protección de cuenta/solicitud, crear una nueva intención válida y prueba; solo entonces sustituir/inutilizar la anterior. Repetición de la misma operación no crea otra generación.
4. Registrar intención de verificación y auditoría sin secreto, conservando correo/verificación/acceso vigentes. No incrementar la versión global ni cerrar sesiones por el mero estado pendiente.
5. Despachar después de commit por 004 con carga protegida y propósito específico; enviar no verifica por sí solo la dirección.

Si el usuario presenta después otra intención válida hacia el mismo destino aún pendiente, puede sustituir la prueba anterior; es una acción nueva, no el retry de un envío o el reenvío manual de 004. La prueba nueva tiene entrega/clave propias; un worker de un enlace sustituido/expirado no debe enviarlo como vigente.

### Confirmar el correo

Verificar solicitud vigente, propósito/digest/vigencia, cuenta activa, correo origen/versión de seguridad aún coherentes y destino todavía único. La confirmación usa la prueba ligada a esa cuenta; no acepta un ID/correo arbitrario ni requiere que la misma pestaña conserve una sesión vieja. Un logout ordinario no vuelve a validar una solicitud sustituida; una baja o cambio de seguridad que invalide su prueba no se ignora.

Con protección exclusiva, aplicar correo nuevo verificado, consumir solicitud, invalidar enlaces anteriores asociados, incrementar versión de seguridad/revocar todas las familias, anexar auditoría y registrar **dos avisos distintos** del mismo cambio. No tocar issuer/`sub` de Google ni reasignar historial. Responder sin credenciales; cliente vuelve a autenticarse por nuevo correo o Google ya vinculado.

Si el commit o su respuesta quedan inciertos, verificar operación con permisos/proof apropiados sin repetir efectos. Una prueba usada puede rechazarse conforme a la spec; idempotencia no obliga a devolver datos de cuenta o emitir una sesión nueva a un enlace reutilizado.

## 8. Contrato específico de notificaciones 008 → 005/004

| Propósito | Destinatario autorizado | Comprobación que no debe sustituirse por «igual al correo actual» |
|---|---|---|
| Verificación de cambio pendiente | Destino de una solicitud admitida por el titular activo | Última solicitud, cuenta/versión/propósito y vigencia, antes de emitir/reintentar; no destinatario libre del cuerpo de la llamada de envío. |
| Seguridad de cambio aplicado: anterior | Correo anterior capturado en el hecho aplicado | Hecho válido y propósito mínimo de seguridad, sin prueba o enlace de acceso; no alias/fallback para correos operativos distintos. |
| Seguridad de cambio aplicado: nuevo | Correo nuevo capturado en ese mismo hecho | Misma evidencia aplicada, aviso independiente sin credenciales; no confundirlo con enviar otra verificación. |

Es una extensión de consumo autorizada por 008, no permiso de enviar a cualquier dirección. La política genérica del plan de 004 que retiene una dirección cambiada debe resolverse por propósito validado, **sin editar ese plan** ni suprimir el aviso legítimo al anterior. Verificar el adaptador/contrato antes de integrarlo.

Proponer plantillas HTML/texto de 004: verificación de nuevo correo con su enlace autorizado y avisos mínimos «Cambio de correo completado» con fecha y referencia segura, sin contraseñas, pruebas, enlaces de acceso, datos de reservas o exposición innecesaria del otro destinatario. No añadir «deshacer cambio» por enlace ni correo de baja no aprobado.

Fijar destinos/versión/payload y claves independientes por hecho/propósito/destinatario; retries y reenvío único conservan 004 y su límite de idempotencia externo. El fallo del aviso anterior no suprime el del nuevo ni revierte el cambio. Si luego se aplicó otro cambio o baja, el aviso de un hecho anterior sigue siendo una comunicación mínima de ese hecho, no prueba de acceso vigente.

Proponer enlace en origen HTTPS permitido con prueba opaca no expuesta en query logs; para SPA, validar uso de fragmento retirado inmediatamente y envío de prueba en cuerpo de confirmación, `no-store`/`no-referrer` y ausencia de tracking/terceros antes de retirarlo. No prometer compatibilidad de clientes de correo sin probarla. Nunca access/refresh/password en URL, respuesta pública o auditoría. La carga secreta temporal cifrada y su limpieza siguen M-04/I-04, no un archivo local o texto plano en jobs.

## 9. Baja lógica y eventos posteriores

La consulta previa de bloqueos es orientativa; la decisión se hace nuevamente bajo protección por cuenta. Bloquear por `pending`/`confirmed`, pagos sin resolución y casos de devolución abiertos tal como los define 002; una reserva técnicamente vencida pero aún pendiente bloquea y no se cancela desde 008. Caso `devuelto` de 002 no exige demostrar un abono bancario adicional.

Tras confirmación expresa e identidad reciente, validar que no es cuenta administrativa y que ningún bloqueo sigue vigente. Aplicar estado/fecha de baja, versión de seguridad/privacidad, revocación de todas las familias y solicitudes de correo/verificación/reset, y auditoría en un commit. No borrar el correo canónico, roles/historia, ni ejecutar cancelación, liberación, reembolso o finalización para hacer pasar el guard.

La cuenta queda no autenticable; la baja no se revierte por signup/Google/reset anteriores. Mantener unicidad incluso con cuenta inactiva. No crear un procedimiento administrativo de reactivación o aprobación manual en este plan.

010 recibe el estado/versión de privacidad actuales a través del lector autorizado; perfil de baja muestra solo ID/estado/cantidad en cliente/CSV y puede forzar regenerar una variante antes de descargar. No modificar snapshots históricos, filas de auditoría ni conteos ordinarios capturados. Un evento financiero tardío sigue por 002, sin reactivar o perder trazabilidad por el titular inactivo.

## 10. API, interfaz, errores y evidencia

Proponer contratos versionados de perfil propio, actualización básica/solicitud de correo, confirmación de solicitud y baja. Payload whitelist, clave opaca y versión donde corresponda; no un endpoint general de editar cuenta/rol/estado. Publicar OpenAPI/ProblemDetails antes de implementar handlers.

Mostrar claramente correo vigente/pending, última solicitud sustituida/expirada, que el cambio efectivo cierra todas las sesiones y que la baja conserva historial y no es cancelación. En baja bloqueada mostrar referencias/estados propios, no IDs ajenos o errores de SQL. Una notificación enviada no equivale a dirección verificada; UI no presenta cambio/baja aplicados antes del commit.

La autorización precede al replay: una credencial invalidada por baja/cambio no recupera datos mediante la clave de una operación anterior. No registro de bodies con password/prueba/enlace; auditoría minimizada con actor real, operación, cuenta, fecha y cambios permitidos. Fallo de auditoría impide el cambio local controlable; entrega fallida posterior genera incidente por 004, no otra operación de cuenta o una recursión de alertas.

## 11. Pruebas y puertas de ejecución

| Prueba futura | Evidencia necesaria |
|---|---|
| Perfil | Campos omitidos/vacíos/extra, Unicode, teléfono, propiedad y sesiones conservadas al editar solo datos básicos. |
| Correo | Solicitudes concurrentes, inválida no sustituye válida, destino ocupado al confirmar, prueba vieja/expirada/usada y respuesta perdida. |
| Seguridad | Contexto reciente local/Google, CSRF/cookies/links, cuenta equivocada, versiones/familias revocadas y ningún token en logs/artefactos. |
| Baja y finanzas | Cada bloqueo, carrera con nueva reserva/intento/caso, estado no comprobable, no cancelación/reembolso automáticos y hecho externo tardío preservando baja. |
| Correo/auditoría | Propósitos anterior/nuevo/pendiente, dos entregas idempotentes, caída de envío tras commit y rollback por auditoría fallida. |
| Privacidad | Cliente de baja oculto en consultas/CSV incluso en una descarga preparada antes, sin borrar la fuente histórica. |

Puertas pendientes de evidencia, no nuevas preguntas comerciales:

1. **P-01 Contratos/identidad:** normalización, solicitudes, consumo/revocación, Google vinculado, índice único incluidas bajas y campos de perfil.
2. **P-02 Consistencia:** barrera por cuenta aplicada por todos los escritores relevantes, orden de locks compatible, rollback y carreras PostgreSQL reales; no basta una lectura `NOT EXISTS`.
3. **P-03 Enlaces/notificaciones:** prueba reciente validada, uso único, entrega por propósito, cuerpo/clave estables, protección temporal y compatibilidad de enlace/cliente de correo.
4. **P-04 Financiación/baja:** catálogo autoritativo de bloqueos y preservación de hechos externos de 002/003/009, sin exigir banco ni editar esos estados.
5. **P-05 Auditoría/privacidad:** registro anexado, recuperación e incidentes y estado actual disponible para protección de 010 antes de entrega.
6. **P-06 Autorización:** actividad posterior para código/datos/configuración. Este plan no emite enlaces/sesiones, cambia correos, aplica bajas o envía mensajes reales.

[tasks.md](tasks.md) contiene **T008-01–T008-30**, todas pendientes y con cobertura de los 37 criterios. No se declara implementado un contrato por tener spec aprobada o planificación redactada; los parámetros técnicos deben verificarse sin modificar reglas comerciales o documentos protegidos.
