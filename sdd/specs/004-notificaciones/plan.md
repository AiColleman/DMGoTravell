# Plan técnico — Spec 004 y complemento: Notificaciones

> **Fecha:** 2026-11-01. **Versión del plan:** 0.1.  
> **Base:** [004 v0.1 aprobada](spec.md), 22 criterios, DEC-141; [complemento v0.1 aprobado](complemento-contratos.md), 16 criterios locales, DEC-173.  
> **Estado:** propuesta técnica para implementación futura, **NO EJECUTADA**.  
> **Autorización:** «continua entonces» después de indicar que procedía planificar 004; cambios solo en `sdd/`. Specs y planes anteriores intactos, sin código, envíos, DNS, commits ni push.

## 1. Objetivo, fuentes y límites

Diseñar comprobantes de pago, avisos de devolución/cancelación, alertas operativas y correos de identidad mediante Resend, preservando aislamiento de destinatarios, idempotencia, evidencia y no reversión de operaciones por un fallo de correo.

Los **38 criterios** conservan dos espacios separados: `004/RF-1–RF-22` y `004-C/RF-1–RF-16`. No renumerarlos como una spec nueva ni atribuir el complemento a la aprobación original de la base. Las elecciones de plantillas y mecanismos siguientes son propuestas técnicas, no nuevas decisiones comerciales ni ADR.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [trazabilidad](../../trazabilidad.md), [fuentes](../../fuentes.md), F01 §5/F02 HU-09/F03 RF09/F04 AC02/AC04/AC05/AC09/AC11, ADR-005/ADR-008; contratos aprobados de 001/002/003/005/009/010 y [matriz de cierre](../../cierre-dependencias-002.md). Consumir [002 plan](../002-pagos/plan.md) y [003 plan](../003-vencimiento/plan.md) sin modificarlos.

No implementar identidad, validar/cobrar/reembolsar pagos, cancelar reservas, marketing, facturación tributaria o reportes PDF de 011. Un correo nunca es prueba suficiente para confirmar una reserva ni comprobar abono bancario.

## 2. Dependencias y autoridad de datos

| Origen | Información/efecto requerido | Límite |
|---|---|---|
| 001 v0.13 | Reserva, componentes y precios/fechas históricos | No recalcular con catálogo ni aceptar identificadores/datos de otra reserva desde el cliente. |
| 002 v0.7 | Confirmación validada, pago observado y fases reales de devolución | Notificar un hecho persistido, no confirmar pago a partir de correo o Webhook de Resend. |
| 003 v0.1 | Incidente de vencimiento y recuperación | El fallo de correo no amplía el corte ni cambia estado/liberación. |
| 005 v0.1 | Destinatario autorizado, administradores activos, enlaces de identidad y su vigencia | 004 no emite credenciales, decide TTL ni corrige el correo de la cuenta desde su panel. Su plan todavía no existe. |
| 009 v0.2 | Cancelación aplicada, motivo y caso de devolución | No enviar cancelación aplicada si el commit local fue rechazado. |
| 010 v0.3 | Auditoría inmutable, secretos excluidos y recuperación | No depender de guardar una alerta solo en el destino de auditoría que falla. Su plan todavía no existe. |

El complemento aprobado habilita los correos de identidad que estaban fuera del alcance de la base. Lectura conjunta con 005: entregar **solo el enlace autorizado al destinatario previsto**, nunca contraseña ni token bruto por separado, en una respuesta pública, en auditoría o a un administrador. No reinterpretar esa excepción como permiso para registrar el enlace secreto o reenviarlo fuera de su finalidad.

## 3. Evidencia oficial de Resend y puertas

Documentación pública consultada el **2026-11-01**; sin cuenta, credenciales, envíos, alta de dominio o cambios DNS:

| Fuente oficial | Comprobado en la guía | Alcance no probado |
|---|---|---|
| [Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys.md) | `Idempotency-Key` en envío, conservación de claves durante **24 horas**, misma respuesta para misma solicitud; conflicto si cambia el payload de una clave ya usada. | No equivale a deduplicación perpetua ni garantiza consulta por clave después de ese período. |
| [Verify Webhooks Requests](https://resend.com/docs/webhooks/verify-webhooks-requests.md) | Verificación sobre cuerpo original y `svix-id`, `svix-timestamp`, `svix-signature` con secreto del endpoint; SDK/Svix como opciones oficiales. | No se eligió/instaló una librería o versión .NET ni se probaron firmas/replay reales. |
| [Event Types](https://resend.com/docs/webhooks/event-types.md) | `email.sent` significa solicitud API exitosa; `email.delivered`, aceptación por servidor destinatario; también delayed, bounced, failed y suppressed. | Ni aceptación ni entrega prueban lectura humana o identidad del lector. No añadir seguimiento de aperturas/clics. |
| [Add and verify a domain](https://resend.com/docs/add-a-domain.md) | Dominio propio verificado y registros generados por Resend; configuración de SPF/DKIM, recomendación de DMARC y subdominio. | No hay dominio/remitente/valores DNS del proyecto verificados. Ejemplos `example.com`/`resend.dev` no son configuración de producción. |
| [Usage Limits](https://resend.com/docs/api-reference/rate-limit.md) | Límite publicado predeterminado de 10 solicitudes/s por equipo, encabezados de cuota/rate y `retry-after`; cuota diaria Free se reinicia por día UTC. | No demuestra cuota/límite real de una cuenta ni autoriza contratar un plan, ampliar cuotas o comprar dominios. |

Puertas previas a ejecución integrada:

- **M-01 Cuenta/dominio:** verificar dominio, remitente, credencial de mínimo privilegio, destinatarios permitidos de test, cuota y configuración DNS/TLS. No realizar esas acciones con esta actividad.
- **M-02 Envío/recuperación:** probar contrato .NET/HTTP de envío y consulta por ID externo, idempotencia de 24 horas y resolución de respuesta perdida. Si no puede acreditarse aceptación/no aceptación, no enviar otra copia a ciegas ni rotar la clave para eludir un conflicto.
- **M-03 Eventos:** verificar firma con cuerpo original, tolerancia temporal/replay según librería oficial, deduplicación y eventos fuera de orden. No confiar en el JSON parseado sin autenticar.
- **M-04 Identidad/secretos:** validar con 005 un transporte durable protegido del enlace, control de expiración y destinatario; no guardar tokens/enlaces en claro en tablas generales, trazas o serialización de jobs.
- **M-05 Incidentes/auditoría:** demostrar evidencia recuperable y consulta operativa aunque falle auditoría y correo. Un outbox en la misma base totalmente caída no demuestra esa garantía.
- **M-06 Habilitación:** autorización posterior de código y pruebas de integración; ningún envío a destinatarios reales, cambio DNS o uso live está autorizado ahora.

## 4. Organización y contratos propuestos

Mantener el monolito ASP.NET Core/C# y Clean Architecture con CQRS/MediatR, PostgreSQL/EF Core/Npgsql, Hangfire persistente compatible y React/TypeScript. Resend queda detrás de un adaptador en Infrastructure, no en Domain. No añadir broker, microservicios, base de negocio distinta o disco local persistente.

| Área | Responsabilidad |
|---|---|
| Domain | Identidad lógica de notificación/entrega, evidencia de intento, presupuesto de reenvío manual y resultados internos, sin SDK/HTML/HTTP. |
| Application | Solicitar aviso, validar origen/destinatario, deduplicar, decidir retry/manual, recuperar incidentes y auditar. |
| Infrastructure | Outbox/inbox PostgreSQL, arrendamiento de trabajo, adaptador Resend, validación de Webhook y renderizador versionado. |
| Presentation | Recepción externa autenticada y consultas/solicitudes administrativas protegidas; no endpoints públicos para enviar a un correo arbitrario. |

Puertos: actor/administradores activos, destinatario de identidad, lector de hechos históricos autorizados, reloj, transacción, cola durable, renderizado seguro, proveedor de correo/consulta, auditoría e incidentes recuperables. La llamada de origen registra una **intención local**, no ejecuta HTTP sincrónico al proveedor dentro del commit de pago o cancelación.

## 5. Modelo, deduplicación y resultado

Registros lógicos propuestos, a concretar en migraciones sin exponer entidades ajenas:

- **Notificación lógica:** origen, ID del hecho, tipo/fase y referencias de reserva/pago/cuenta/incidente. Un hecho de devolución de fase distinta no se descarta como duplicado del anterior.
- **Entrega por destinatario:** ID estable, identidad del destinatario y dirección autorizada, generación original o manual única, plantilla/versión, huella del payload y estado interno.
- **Intento de envío:** entrega, instante, clave de idempotencia, referencia externa disponible, error saneado y resultado aceptado/desconocido/rechazado. No guardar tokens ni cuerpos secretos en auditoría.
- **Evento de proveedor:** identificador de notificación externa, ID de correo, tipo, fecha del proveedor y recepción verificada; no confundirlo con un evento de pago.
- **Incidente operativo:** causa primaria, relación con entrega/origen, evidencias, alertas y recuperación; evitar generar un incidente nuevo por cada fallo del mismo aviso.

Proponer unicidad local por origen/hecho/tipo/fase/destinatario, por ID externo de correo/evento y por **una sola generación manual de cada entrega original**. Resolver concurrencia con transacciones/actualizaciones condicionales y marcas durables, no con memoria o un botón deshabilitado.

Separar al menos intención pendiente, emisión iniciada, aceptación del proveedor, resultado desconocido, entrega al servidor destinatario y rechazo/rebote. Son estados técnicos de entrega, no nuevos estados de reserva. No llamar «entregado» a un HTTP exitoso ni «leído» a `email.delivered`.

### Claves e identidad del contenido

Proponer una clave opaca derivada del ID estable de entrega/generación, sin correo, token ni datos personales. Cada repetición de una solicitud original automática conserva clave, destinatario, cuerpo y versión de plantilla; no regenerar HTML o el enlace con la misma clave y distinto payload. Registrar el primer instante de emisión antes del HTTP para calcular un límite local conservador de reutilización.

La restricción local de unicidad **no caduca a las 24 horas**. Una entrega aceptada/entregada nunca se crea de nuevo por volver a recibir el hecho. Una respuesta perdida puede repetirse automáticamente con la misma clave/payload solo dentro del período seguro probado y en la generación automática; fuera de ese período, verificar por referencia oficial o escalar, no reenviar a ciegas. Un `409` por payload diferente es un fallo de contrato, no señal para generar otra clave y mandar otra copia.

El reenvío manual consume una generación adicional distinta y está sujeto a §8; no reutiliza la clave de una entrega previamente aceptada como si fuese otro envío real.

## 6. Contenido y destinatarios

Propuesta de representación inicial: **HTML escapado + texto plano**, sin adjuntos ni PDF por defecto. El comprobante es constancia de operación, no factura fiscal ni el reporte PDF de 011. Asuntos/versiones son elecciones de presentación del plan, no mensajes comerciales exactos añadidos a la spec.

| Tipo | Asunto propuesto | Contenido mínimo y origen |
|---|---|---|
| Comprobante | «Confirmación de reserva {número}» | 004/RF-2: cliente, reserva, oferta/hotel si existe, fechas/viajeros, total/moneda, fecha/referencia de pago y confirmación del hecho. |
| Devolución | «Devolución de reserva {número}: {fase}» | Reserva/caso, importe/moneda, fecha y situación real: iniciada, pendiente de verificación o ejecución confirmada. No prometer abono bancario. |
| Cancelación administrativa | «Cancelación de reserva {número}» | Cancelación aplicada, motivo escapado, fecha, importe/moneda y fase de devolución; solo después del commit de 009. |
| Alerta operativa | «Acción requerida: {tipo de incidente}» | Referencias disponibles, motivo saneado, fecha, resultado conocido y acción requerida. No inventar reserva para un incidente que no la tenga. |
| Verificación | «Verifica tu correo» | Propósito y enlace autorizado por 005; no contraseña o token bruto separado. |
| Recuperación | «Restablece tu contraseña» | Propósito y enlace autorizado por 005, sin revelar existencia de cuenta en la respuesta pública del solicitante. |

Proponer remitente transaccional configurable de un subdominio propio verificado; no fijar una dirección real sin datos del proyecto. Validar/escapar encabezados y contenido, no insertar HTML del motivo, nombre o campos del proveedor. URLs solo de origen HTTPS permitido y ruta definida por 005; no aceptar destinos/redirecciones del cuerpo del cliente.

Cliente: identidad y destinatario autorizados por 005, vinculados al hecho propio. Administradores: resolver únicamente cuentas activas/autorizadas y generar entrega independiente por destinatario, sin exponer la lista en CC. Revalidar autorización antes de emitir; si cambió el correo o perdió autorización, no mutar silenciosamente destinatario/payload del retry ni enviarlo al anterior: retener/escalar conforme al contrato de identidad.

Si no hay administrador/destinatario válido, conservar el incidente y no usar un correo de ejemplo o de cliente como fallback. No bloquear/revertir pago por ese fallo. El incidente operativo debe ser consultable por administración autorizada una vez disponible.

Los correos reflejan el hecho y su fecha, no garantizan el estado actual al leerlos; incluir referencia a la consulta propia vigente. No suponer que la entrega SMTP conserva el orden de fases ni suprimir un aviso requerido solo porque otro hecho ocurrió después. No habilitar aperturas/clics, listas de marketing ni contactos comerciales por integrar eventos transaccionales.

### Enlaces secretos de identidad

005 controla destinatario, emisión, vigencia, uso único, renovación y revocación. Proponer una carga temporal cifrada con acceso restringido para entrega, separada de auditoría/consulta general y argumentos de Hangfire; validar gestión de claves y vida útil antes de usarla. No sustituir evidencia de seguridad por decir «cifrado» sin probar protección/restauración.

El worker comprueba con 005 que la solicitud/enlace siguen vigentes antes de enviar o reintentar. Si caducó o fue invalidado, no entregar un enlace como válido ni generar otro desde 004; registrar el resultado sin secreto y dejar que un flujo autorizado de 005 origine otra solicitud. El TTL de ese enlace no procede de las 24 horas de idempotencia de Resend ni de la ventana 15/20 de reservas.

## 7. Despacho y eventos del proveedor

1. El origen registra intención junto con su operación local; duplicar el hecho solo recupera la misma notificación lógica. Un comprobante requiere evidencia de confirmación, no un token de checkout o una afirmación del navegador.
2. El dispatcher reclama una entrega mediante una marca persistida de ejecución/arrendamiento. No mantener una transacción local abierta durante HTTP y no permitir a dos workers enviar la misma generación sin protección.
3. Congelar/validar payload, destinatario, versión y clave; guardar intento antes de emitir. El adaptador no habilita por defecto retries HTTP/SDK adicionales a la política de este plan.
4. Enviar a Resend fuera de la transacción de pago/cancelación y conservar respuesta/ID externo o resultado desconocido. Nunca marcar entregado por el mero éxito del API.
5. Verificar el Webhook con el **cuerpo original** antes de deserializar la evidencia de negocio, encabezados Svix y secreto del endpoint conforme al contrato oficial. Mantener el cuerpo secreto fuera de logs/almacenamiento general.
6. Persistir recepción verificada/deduplicada y actualizar la proyección por hechos/fechas, no por el orden de llegada. `email.sent` posterior no debe borrar un rebote o una entrega ya conocida; preservar el historial.
7. Si no se puede persistir la recepción, no afirmar acuse durable inexistente; contrato de acuse/recuperación se verifica con el proveedor. Reconciliar por ID de correo cuando esté disponible; no inventar consulta por clave si la API no la documenta.

PostgreSQL es la fuente de deduplicación/outbox/inbox; Hangfire coordina ejecución dentro del backend. Un outbox solo no prueba la recuperación si cae toda la base. No usar otra cola externa o disco del contenedor como solución implícitamente autorizada.

## 8. Reintentos automáticos, resultados desconocidos y reenvío manual

Propuestas técnicas a verificar, sin cambiar la regla de reenvío único:

| Situación | Tratamiento propuesto |
|---|---|
| Fallo transitorio del envío original automático | Hasta 3 reintentos adicionales con esperas iniciales 30 segundos, 2 minutos y 10 minutos; mismo payload/clave dentro de su período seguro. Una política única, sin sumar defaults de Hangfire/SDK. |
| `429` | Respetar `retry-after`/límites reales y diferenciar cuota diaria/mensual de rate temporal; no loop rápido ni compra/ampliación de cuota automática. Si excede el período seguro o TTL del enlace, retener/escalar. |
| Timeout o respuesta perdida | Resultado desconocido; misma solicitud dentro del período oficial y solo para generación automática, o consulta de referencia existente. No una nueva notificación/clave para eludir incertidumbre. |
| Fuera de las 24 horas del proveedor | No repetir a ciegas una entrega desconocida; resolver con evidencia oficial o incidente. Deduplicación local permanente. |
| Correo inválido, rebote permanente, supresión o error de configuración | Registrar y alertar; no insistir con copias automáticas a la misma dirección inválida ni llamar «entregado» al correo. Corrección de cuenta pertenece a 005/008, no a este panel. |
| Ciclo automático agotado | Incidente persistente y alerta administrativa deduplicada; pago/reserva no cambian. No perder la notificación ni fingir éxito. |
| Solicitud de reenvío manual | Solo admin activo y notificación con fallo comprobado, no ya entregada ni aceptación desconocida sin resolver. Reservar atómicamente una única generación manual por entrega original. |
| Reenvío manual fallido/desconocido | Registrar y alertar; **ningún nuevo envío automático de esa generación manual**. Si existe referencia, consultar/recibir evento sin volver a mandar. Solicitudes repetidas devuelven la misma operación, no consumen un segundo permiso. |

El período seguro de repetición automática se calcula conservadoramente desde la primera emisión local, con margen técnico antes de 24 horas; probar bordes y reloj, no prometer que el proveedor recuerda la clave para siempre. Un retry no cambia el contenido de un enlace o la fase de devolución; una fase nueva tiene su hecho y notificación propios.

Antes de habilitar reenvío manual, comprobar que el origen de identidad/negocio sigue autorizando contenido y destinatario. Si es necesario un enlace nuevo, debe originarlo 005 con sus controles; 004 no convierte el reenvío de una notificación fallida en una forma de emitir o renovar credenciales.

## 9. Auditoría e incidentes no recursivos

Auditar generación, intentos, aceptación/fallo, reintento, reenvío y alerta con actor, destinatario autorizado o su referencia minimizada, tipo, reserva/pago cuando corresponda, fecha y resultado. Conservar fecha del hecho y de registro/recuperación por separado. No copiar cuerpo completo, headers sensibles, enlaces de identidad o tokens a auditoría/CSV/admin.

Si falla guardar un registro de una operación aún controlable, mantenerla pendiente sin ejecutarla sin evidencia. Si un correo ya fue aceptado externamente, conservar su resultado y recuperarlo sin otra copia. La indisponibilidad de auditoría no se soluciona condicionando la creación de la alerta a un registro exitoso en ese mismo destino.

Agrupar un incidente por causa/operación y registrar las fallas de sus avisos sobre él, sin crear una cadena infinita de nuevos incidentes. El administrador consulta el incidente con autorización real incluso si no llegó el correo cuando el mecanismo operativo esté disponible. Ante caída total de almacenamiento, se requiere evidencia de recuperación compatible con la plataforma y una prueba de fallos simultáneos (M-05); no declarar esa garantía cumplida por logs volátiles ni falsear eventos que no se pudieron conservar.

La consulta operativa y el único reenvío son capacidades aprobadas, no permisos de editar auditoría, corregir perfiles, confirmar pagos, devolver dinero o cancelar reservas desde 004.

## 10. Configuración, pruebas y habilitación

Configuración del despliegue a verificar: remitente/dominio propios, secreto Resend y secreto de Webhook separados, acceso mínimo, DNS generado para el dominio, límites/cuotas por cuenta, host activo y retención del material secreto temporal. Nunca introducir claves o direcciones reales en estos documentos ni enviar a destinatarios arbitrarios para «probar».

| Prueba futura | Evidencia requerida |
|---|---|
| Unitarias/renderizado | Contenido mínimo de 22+16 criterios, fases, motivos escapados, texto plano y ninguna contraseña/token bruto fuera del enlace destinado a su usuario. |
| PostgreSQL/concurrencia | Un hecho repetido, dos workers, múltiples administradores solicitando el reenvío y ciclo de vida de arrendamientos; una sola generación manual. |
| Contrato Resend | Misma clave/payload, conflicto de payload, borde de 24 horas, respuesta perdida, IDs/eventos, cuota/rate y firma/replay; solo entorno/destinatarios de prueba autorizados. |
| Caída | Antes/después de enviar y guardar respuesta, reinicio de worker, caída simultánea de correo/auditoría y recuperación sin duplicar ni revertir pago/cancelación. |
| Identidad/privacidad | Enlace expirado/invalidado, destinatario no autorizado/cambiado, administrador deshabilitado, acceso a incidentes y escaneo de logs/tablas/artefactos sin secretos. |
| Integración real de módulos | Hechos de 002/003/005/009 y evidencia de 010 sin suponer que sus contratos están implementados por tener spec aprobada. |

[tasks.md](tasks.md) contiene **T004-01–T004-30**, todas pendientes, con cobertura separada de los 22 criterios de base y 16 del complemento. Los tests con dobles no validan Resend, DNS o el guardado recuperable. La lectura pública no cierra M-01–M-06 ni autoriza configuración, envíos o producción.
