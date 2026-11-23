# Contrato técnico propuesto: coordinación transaccional

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-201.  
> **Estado:** propuesta documental pendiente de ratificación técnica y verificación; **NO IMPLEMENTADA**.  
> **Ámbito:** cuenta/identidad, reserva, pago, vencimiento, cancelación administrativa, compromisos de recursos, auditoría e intenciones de aviso.  
> **Autoridad:** concreta propuestas de planes existentes; no modifica specs, planes, tareas, ADR, reglas de negocio o autorización de ejecución.

## 1. Propósito, procedencia y límites

Concretar las fronteras de AT-07/AT-08 del [análisis transversal](../analisis-consistencia.md) para que cada participante sepa qué protege, qué aporta al commit local y qué no puede deducir de un fallo externo. Los nombres CT/ET/PT de este documento son referencias técnicas, no RF/HU nuevos ni tareas añadidas al backlog.

Bases funcionales: [001 v0.13](../specs/001-reservas/spec.md), [002 v0.7](../specs/002-pagos/spec.md), [003 v0.1](../specs/003-vencimiento/spec.md), [004 base](../specs/004-notificaciones/spec.md)/[complemento](../specs/004-notificaciones/complemento-contratos.md), [005 v0.1](../specs/005-identidad/spec.md), [006 v0.46](../specs/006-catalogo/spec.md), [007 v0.2](../specs/007-hoteles/spec.md), [008 v0.1](../specs/008-perfil/spec.md), [009 v0.2](../specs/009-administracion-reservas/spec.md) y [010 v0.3](../specs/010-clientes-auditoria/spec.md). Se mantienen RN-07/RN-12–RN-17/RN-19–RN-30 y las decisiones de cortes 15/20, recursos, historial y baja.

Procedencia técnica: [001 plan §§3/6](../specs/001-reservas/plan.md), [002 plan §§5–8](../specs/002-pagos/plan.md), [003 plan §§4–7](../specs/003-vencimiento/plan.md), [005 plan §§6–8](../specs/005-identidad/plan.md), [008 plan §§6/9](../specs/008-perfil/plan.md), [009 plan §§6–8](../specs/009-administracion-reservas/plan.md), [010 plan §5](../specs/010-clientes-auditoria/plan.md) y [constitución](../constitution.md).

Fuera de alcance: firmas C#/SQL/migraciones, rutas HTTP/OpenAPI finales, versiones de paquetes, compra/configuración de proveedores, nuevo sistema de estados, reparación administrativa de datos, reglas de destinatarios completas, limpieza R2 y generación CSV/PDF. No constituye una ADR aceptada, ejecución de tareas de diseño/implementación del backlog o prueba de PostgreSQL.

## 2. Propietarios y contratos lógicos

La colaboración es local, dentro del monolito, mediante puertos de Application y una unidad de trabajo compartida. Ningún módulo obtiene permiso para escribir repositorios ajenos; no hay HTTP interno, transacción distribuida o commit independiente oculto de un participante.

| ID | Propietario | Entrada autorizada mínima | Resultado aportado a la unidad de trabajo |
|---|---|---|---|
| CT-01 — Elegibilidad de cuenta | 005, consumido por 001/002/008/009 | Identidad confiable del actor, cuenta afectada, tipo de operación y versión/familia cuando aplique | Estado/rol/verificación/versión actuales y protección de cuenta; nunca actor/propietario impuesto por el cuerpo. |
| CT-02 — Reserva protegida | 001; usado por 002/003/009 | ID estable de reserva, acción específica, operación y versión esperada según caso | Estado, propietario, plazos originales, importes/horarios y compromisos históricos; transición admitida o rechazo explícito. |
| CT-03 — Cotización y compromiso turístico | 006 | Oferta/salida válida, cantidad, operación de reserva y protección común | Precio efectivo oficial y compromiso turístico único; confirmar/liberar solo el compromiso identificado. |
| CT-04 — Cotización y compromiso hotelero | 007 | Propuesta de la salida, hotel/tipo/período histórico y una habitación | Tarifa × períodos de 24 horas, compromiso único sobre inventario compartido y resultado por todo el intervalo. |
| CT-05 — Intento/hecho/caso financiero | 002 | Referencia de reserva/cobro, evidencia oficial saneada o autorización administrativa según acción | Intento, transacción real, clasificación/caso o ejecución confirmada, fechas propias e identidad externa; no un booleano genérico «pagado». |
| CT-06 — Bloqueos de baja | 001/002, consumido por 008 | Cuenta bajo exclusión y lectura vigente de ambos orígenes | Reservas `pending`/`confirmed`, pagos sin resolución y devoluciones abiertas; resultado completo, vacío conocido o indisponible, nunca indistintamente `false`. |
| CT-07 — Auditoría transaccional | 010, invocado por el origen | Actor real, hecho/operación, entidad, fecha, resultado y cambios de lista positiva | Registro anexado en el commit del origen; error impide aplicar una mutación local aún controlable. |
| CT-08 — Intención de aviso/recuperación | 004 con el origen | Hecho confirmado, propósito, destinatario autorizado por su contrato, referencias mínimas y clave de deduplicación | Intención durable local; envío posterior separado. No transforma «pendiente» en entregado ni usa el aviso como autorización financiera. |

Cada resultado distingue ausencia conocida, condición de negocio rechazada y origen no comprobable. Los lectores no hacen cambios para facilitar su respuesta: CT-06 no cancela/completa ni cierra casos para permitir una baja.

## 3. Contexto de operación y datos

Proponer un contexto local con ID de operación opaco, origen/acción, actor humano o sistema, correlación, referencia de cuenta/reserva cuando exista, versión esperada y huella del **payload permitido**. Actor de sistema no equivale a inventar una cuenta administrativa. Una petición externa no es confiable por contener un ID válido.

Separar en el contexto y la evidencia:

- **Recepción de solicitud:** instante capturado por la frontera confiable de DMGoTravell, no por el navegador. Da el criterio de llegada anterior a 15, no una prioridad ficticia frente a una cancelación ya aplicada.
- **Comprobación de evidencia externa:** autenticidad y datos del proveedor verificados fuera de la transacción si requieren red. No equivale por sí sola a completar la validación de negocio sobre una reserva todavía cobrable.
- **Decisión protegida:** instante real tras las esperas y revalidaciones relevantes para aplicar la operación. No usar como sustituto un timestamp de inicio de transacción anterior al lock.
- **Operación/ejecución del proveedor:** fecha confirmada del hecho, conservada por 002; no sustituirla por recepción, incorporación o fecha de reintento. Son datos distintos para 011.
- **Incorporación/commit/recuperación:** referencia durable del resultado local y sus tiempos disponibles; no inventar una hora exacta de commit si el mecanismo no la acredita ni retrofechar auditoría recuperada.

No guardar PAN/CVV, códigos Yape, tokens de checkout/identidad, enlaces secretos o cuerpos crudos como evidencia/huella genérica. Identificadores externos recuperables se clasifican antes de persistir. Una huella para idempotencia se calcula sobre campos admitidos, no sirve para justificar conservar material sensible.

## 4. Protección común propuesta

### 4.1. Orden de adquisición y revalidación

Proponer el prefijo de cuenta del plan 008 por delante del orden financiero de 002/009:

1. **Cuentas involucradas**, por ID estable en un orden total único, con modo requerido decidido de antemano. Incluir la autorización del actor administrativo y la cuenta afectada cuando deban protegerse ambas; no tomar «actor primero» en una ruta y «titular primero» en otra.
2. **Familias/solicitudes de identidad** pertinentes, si la operación consume o revoca esas pruebas.
3. **Reserva** afectada; el contrato no admite transferirla de propietario durante la operación.
4. **Intentos, cobros y casos**, con orden estable por clase e ID; operaciones sobre un mismo cobro comparten la misma protección de su presupuesto de devolución.
5. **Raíces de recursos/compromisos**, con un orden total por clase e ID definido en la integración de 006/007. Revalidar salida/propuesta/precio/estado después de proteger sus raíces.
6. **Registros técnicos de operación, anexado de auditoría e intenciones**, sin callbacks que vuelvan a adquirir protecciones de niveles anteriores en orden inverso.

Una consulta inicial puede resolver IDs/propietario desde persistencia para identificar las protecciones necesarias; no autoriza efectos. Después de bloquear se revalida todo. Si cambió el conjunto necesario, abortar/reiniciar la fase local compatible en vez de añadir una cuenta/recurso «hacia atrás» en el orden.

No prometer ausencia de deadlock por escribir una lista: unicidades, FK, inserciones, triggers y todos los escritores deben inspeccionarse en el esquema real. Los comandos de Catálogo/Hoteles que protegen una raíz antes de comprobar reservas no pueden ocultar una adquisición inversa de locks de reserva. Su participación concreta queda en PT-01.

### 4.2. Barrera por cuenta

| Tipo de operación | Protección propuesta sobre cuenta afectada | Elegibilidad que se vuelve a comprobar |
|---|---|---|
| Nueva reserva/inicio de intento del cliente | Compartida, propuesta `FOR SHARE` | Cuenta activa, autorización/familia/versión actuales y correo verificado donde lo exige 005. |
| Aplicación efectiva de cambio de correo/baja | Exclusiva desde el inicio, propuesta `FOR UPDATE` | Prueba/confirmación válidas; para baja, todos los bloqueos actuales de CT-06 y cuenta no administrativa. |
| Incorporación de hecho financiero ya ocurrido; vencimiento del sistema | Coordinación compartida sobre titular, si sigue esta propuesta | Correlación/autenticidad o mandato del proceso; **no exigir una sesión cliente activa para conservar el hecho o ejecutar el vencimiento autorizado**. |
| Comando administrativo válido | Protección de autorización del actor y coordinación sobre titular | Rol/familia actuales del administrador y precondiciones de la acción; cuenta cliente inactiva no borra un hecho financiero histórico. |

La barrera depende de la fila/raíz de cuenta persistente y la adhesión explícita de todos los participantes: no basta el lock implícito de una FK o un lock en memoria. La baja lógica conserva esa raíz. `FOR KEY SHARE` no se considera sustituto universal del modo propuesto.

No empezar con modo compartido para luego convertirlo en exclusivo en baja/cambio de correo: la propuesta solicita el modo más restrictivo previsto desde el inicio. Si una operación necesita subir de modo por un dato descubierto después, no se oculta esa conversión; se revisa/reinicia su fase local sin repetir efectos externos. Aislamiento propuesto: `READ COMMITTED` con estas protecciones, unicidades y lecturas nuevas después de obtener exclusión, no un snapshot anterior usado como prueba de ausencia vigente.

La exclusión de baja ordena **hechos locales conocidos**, no demuestra que el proveedor no pueda comunicar mañana un cobro tardío. Si el hecho aún no estaba incorporado y aparece tras una baja válida, 008/RF-33 exige conservar la baja y tramitarlo por 002. No hay rollback o reactivación de cuenta para hacer encajar ese hecho.

### 4.3. Inventario y datos ausentes

CT-03/CT-04 deben proteger una raíz estable de cupo/inventario, incluso si la consulta de compromisos devuelve cero filas. Bloquear solo las filas que una consulta encontró no protege una inserción nueva en el hueco. Rechazar una retención cuando falta inventario/cotización requerida, sin convertir esa ausencia en capacidad ilimitada o precio cero.

Creación, retención, confirmación, liberación y ajuste administrativo de capacidad participan del mismo contrato de recursos. Liberar un compromiso libera su cantidad/período históricos una sola vez; no aumenta capacidad total, crea inventario por salida o usa cantidades del navegador. Si hay hotel, no se confirma una reserva turística parcial ante fallo hotelero.

## 5. Fronteras de commit y de efecto externo

| Acción | Efectos que pertenecen al mismo commit local | Efectos que no pertenecen a ese commit |
|---|---|---|
| Crear reserva | `pending`, componentes/precios/plazos históricos, retenciones turísticas/hoteleras, auditoría e intención durable de programación | Registro/ejecución efectiva posterior de jobs; ningún cobro. |
| Admitir inicio de pago | Intento único no resuelto y correlación durable, estado que excluye otro intento/cancelación voluntaria, auditoría requerida | Petición a Culqi, siempre después de acreditar ese registro. Admisión no es pago ni confirmación. |
| Aplicar pago validado cobrable | Transacción real y evidencia permitida, transición única a `confirmed`, estado coherente de compromisos, auditoría e intención de comprobante | Entrega de correo; no vuelve a emitir el cargo recibido. |
| Cancelar `pending` por cliente/rechazo definitivo/vencimiento | Transición autorizada, liberaciones únicas y auditoría; intención de incidente/aviso solo si su origen lo exige | Culqi/Resend; no un correo nuevo inferido para todo tipo de cancelación. |
| Cancelar `confirmed` por 009 | Cancelación con motivo, liberación conjunta, obligación de devolución vinculada, auditoría e intención de aviso | Envío del reembolso; exige autorización financiera de 002 separada. |
| Completar por 009 | `confirmed → completed`, confirmación expresa/actor y auditoría | No nueva liberación, devolución o cobro. |
| Aplicar baja | Estado/fecha, versiones de seguridad/privacidad, invalidación de sesiones/solicitudes y auditoría | No cancelación/completado/liberación/reembolso para eliminar bloqueos. |
| Aplicar cambio de correo | Correo verificado nuevo, consumo de solicitud, revocación global/invalidaciones, auditoría y dos intenciones de aviso autorizadas | Envío posterior; no revierte cambio si el correo falla. |
| Autorizar devolución | Autorización administrativa, intención/operación única y reserva del importe en curso bajo protección del cobro, evidencia requerida | HTTP financiero posterior y resultado bancario. |

Los participantes enlistados no hacen `commit` por separado ni abren una conexión/transacción independiente que el origen crea poder revertir. Falla local antes del commit: rollback conjunto. Fallo de notificación posterior: estado local confirmado no se revierte.

Un cobro externo ocurrido no puede revertirse mediante rollback PostgreSQL. Si no puede incorporarse/auditarse, el estado local no se finge aplicado: queda pendiente de recuperación a partir de intención/referencias/evidencia oficial disponibles. La garantía de recuperar esa evidencia depende de G-05/M-05/A-03 y no queda resuelta por una tabla en la base que también está caída.

## 6. Tiempo, precedencia y resultados

### 6.1. Cortes que no se reinterpretan

- Solicitud de procesamiento recibida exactamente a 15 o después: no nuevo intento, 002/RF-8/RF-9. Abrir checkout o renovar un código no cambia recepción/plazos originales.
- Recepción anterior a 15 no permite eludir una cancelación que ganó la operación protegida, ni otro intento no resuelto. El caso de recepción temprana retenida técnicamente hasta después del corte se explicita en PT-02; no se resuelve cambiando «recibida» por «adquirió lock».
- Validación integral realmente completada exactamente a 20 o después: no confirmación, aunque el cargo sea anterior o siga `pending` por demora técnica. La comprobación externa aislada no retrofecha la evaluación protegida de estado/importe/moneda/referencia.
- Si una operación se decidió válidamente bajo todas las protecciones antes de su corte y confirma después, no se falsea el momento: decisión y commit son hechos distintos. Si hay que soltar locks, esperar de nuevo o reintentar la transacción, se revalida y no se reutiliza una decisión obsoleta.
- Si no hay intento vigente por verificar ni pago observado que exija conservar recursos hasta 20, vence al 15; con verificación iniciada a tiempo/observado según 002, el límite es 20. Un rechazo definitivo en tolerancia cancela/libera de inmediato; timeout no es rechazo.
- Cancelación administrativa solo antes del primer inicio histórico; finalización solo con todos los componentes terminados y confirmación expresa. Obtener locks después del corte no se salva con una lectura de reloj anterior.
- Los 60 segundos miden desde el corte aplicable hasta el commit de cancelación y ambas liberaciones, no desde el inicio del handler. No añaden tiempo para pagar/confirmar ni cambian el calendario hábil de devoluciones.

### 6.2. Resultados internos propuestos

Separar: aplicado con referencia durable; replay ya aplicado; validación rechazada; recurso no disponible/propiedad; estado/versión incompatible; corte no elegible; origen requerido indisponible; y commit de resultado desconocido. No son nuevos estados de reserva ni códigos HTTP finales. Los adaptadores preservan mensajes funcionales acordados y no revelan existencia de recursos ajenos.

Un resultado «aplicado» identifica la operación y lo confirmado, no promete un correo entregado, dinero devuelto o abono bancario. Ante commit desconocido, no inventar éxito/fallo definitivo; verificar la misma operación antes de otro intento local o cualquier despacho externo.

## 7. Idempotencia, presupuesto financiero y recuperación

- Proponer unicidad por origen/acción/actor autorizado/clave de operación, con huella de campos permitidos. Misma clave con otro payload es conflicto; un replay requiere autorización actual antes de revelar su resultado. Una credencial revocada por baja/cambio no recupera datos por conocer una clave anterior.
- Restricciones diferentes para recepción externa, transacción real, aplicación de transición, compromiso liberado, caso/operación de devolución e intención de aviso. Un único ID de Webhook no deduplica el mismo cobro recibido por otro canal.
- Dos cobros reales distintos se conservan como tales; el excedente/observado/tardío sigue 002. La deduplicación no elimina el segundo hecho para que cuadre con una sola reserva.
- Por cada cobro, suma de devoluciones ejecutadas **más importes comprometidos en devoluciones en curso/desconocidas** no supera su importe real, con moneda propia y exclusión mutua. Timeout no libera ese presupuesto; verificar antes de reintento autorizado. No convertir el techo en autorización de devolución parcial.
- Deadlock/conflicto transitorio: una sola política por caso de uso, acotada según su plan, con transacción nueva y estado/tiempo/autorización reevaluados. No apilar retries del ORM/SDK/Hangfire/supervisor ni repetir HTTP financiero bajo un retry de transacción.
- Jobs, callbacks y cliente pueden repetir una operación; eso no implica otra cancelación/confirmación/liberación/caso/aviso. El retry de infraestructura no da autorización administrativa para dinero o estados.
- Caída antes/después de enviar o confirmar se clasifica por evidencia, no por excepción de transporte. Ningún acuse al proveedor afirma persistencia si no se produjo; la respuesta exacta/reentrega se valida con su contrato, sin inventar HMAC, idempotencia o reentrega infinita.

## 8. Escenarios de aceptación técnica futuros

Todos figuran como **no ejecutados**. Son casos de los backlogs existentes, no tareas nuevas o pruebas aprobadas por estar escritas.

| ID | Escenario/inyección | Resultado a verificar | Referencia funcional/puerta |
|---|---|---|---|
| ET-01 | Crear reserva gana frente a baja | Reserva completa; baja observa `pending` y se rechaza, sin borrar retenciones | 001/RF-1; 008/RF-24; P-02. |
| ET-02 | Baja gana frente a nueva reserva/intento cliente | Operación nueva rechazada por estado/autorización actual, sin efecto parcial | 008/RF-27–RF-32; I-05/P-02. |
| ET-03 | `pending` ya vencida o `confirmed` con servicio ya terminado | Siguen bloqueando baja hasta transición válida, sin reparación desde 008 | 008 precisiones de RF-24; P-04. |
| ET-04 | Lector financiero no disponible durante baja | No interpretar como ausencia de bloqueos ni aplicar baja | 008/RF-24/RF-35; P-02/P-04. |
| ET-05 | Cambiar correo compite con un comando de sesión anterior | Efectos ordenados; después de revocar no aplicar comando con versión/familia obsoleta | 008/RF-17/RF-19; 005/RF-15; I-05/P-02. |
| ET-06 | Cobro/devolución conocido después de baja | Hecho conservado por 002, cuenta sigue de baja, sin sesión cliente como requisito de recepción | 008/RF-33; G-05/P-04. |
| ET-07 | Cancelación propia e inicio de pago compiten | Gana la primera operación protegida admitida; no cancelación voluntaria durante verificación | 001/RF-94–RF-96; 002/RF-26; V-02. |
| ET-08 | Recepción exactamente al corte de 15 | No nuevo intento; no ampliar plazo por cola, contador o token | 002/RF-8/RF-9; G-01/V-02. |
| ET-09 | Recepción antes de 15, admisión/despacho demorados más allá del corte | Evidencia de recepción y prioridad protegida coherentes; protocolo concreto aún por validar en PT-02, no resultado inventado | 002/RF-8/RF-9; DEC-033; G-01/V-02. |
| ET-10 | Validación integral al corte de 20; evidencia externa comprobada antes pero protección obtenida después | No retrofechar validación ni confirmar por fecha de cargo/recepción; preservar cobro/caso y vencimiento | 002/RF-30–RF-32; V-02/V-03. |
| ET-11 | Rechazo definitivo al 18 frente a timeout al 18 | Rechazo cancela/libera; timeout conserva verificación hasta corte, sin nuevo intento | 002/RF-19/RF-23–RF-26; V-02. |
| ET-12 | Pago observado antes de 20 | No confirmar ni liberar solo por discrepancia; caso/importe real preservados y baja bloqueada | 002/RF-52–RF-59; P-04/V-02. |
| ET-13 | Dos workers de vencimiento y respuesta perdida tras commit | Una cancelación/liberación conjunta, acción `reservation.auto_cancelled` única por aplicación; reintentos con evidencia propia | 003/RF-1–RF-20; V-02/V-04. |
| ET-14 | Cancelación administrativa espera y cruza primer inicio | Rechazo sin transición/liberación/caso; no usar hora anterior a espera | 009/RF-11/RF-25; R-01/R-02. |
| ET-15 | Completar cuando todos los componentes terminaron | Solo con declaración expresa; no segunda liberación ni devolución | 009/RF-26/RF-27; R-02/R-05. |
| ET-16 | Misma transacción por respuesta, Webhook y consulta; después otro cobro distinto | Primera se registra una vez; segunda se conserva y trata como excedente sin otra confirmación | 002/RF-12/RF-13/RF-33–RF-35; G-05. |
| ET-17 | Dos autorizaciones de devolución compiten y una queda desconocida | Presupuesto en curso retenido y límite acumulado cumplido; consulta previa a otro envío | 002/RF-66–RF-69; G-03/G-05/R-03. |
| ET-18 | Fallo de auditoría/intención local antes del commit | Ningún cambio controlable parcial; no aviso que afirme un efecto no confirmado | 010/RF-36/RF-37; A-03. |
| ET-19 | Cobro real seguido de caída de base/auditoría/correo | No repetir cobro, fabricar confirmación o perder evidencia por exigir auditoría disponible; recuperación demostrable | 010/RF-38–RF-41; 004-C/RF-7–RF-9; G-05/M-05. |
| ET-20 | Último cupo/habitación, rango sin filas y reducción de inventario simultáneos | No sobreventa/compromiso parcial; raíz protegida incluso sin filas de compromiso y capacidad no ficticia | RN-07/RN-12/RN-13; 006/007; PT-01. |
| ET-21 | Commit incierto y replay con rol/familia revocados | No otro efecto; no resultado protegido devuelto con autorización obsoleta | 008/RF-36; 009 replay; I-05/R-02. |
| ET-22 | Deadlock/worker duplicado con retry que cruza plazo | Nueva lectura/tiempo, sin reenvío financiero ni ampliación 15/20/60; un único dueño del retry | V-02–V-04/G-05/R-02/P-02. |

## 9. Pendientes técnicos explícitos y evidencia necesaria

| ID | Precisión pendiente | Evidencia requerida, sin alterar negocio |
|---|---|---|
| PT-01 | Raíces/filas físicas y orden real de todos los escritores | Esquema/contratos participantes de 005/006/007/001/002/003/008/009/010, modos y orden de locks/índices/FK/inserciones; carreras ET-01–ET-07/ET-20/ET-22 en PostgreSQL real. Una lista abstracta no demuestra ausencia de deadlock o de huecos. |
| PT-02 | Frontera confiable de recepción/admisión/despacho y decisión temporal | Contrato de entrada y captura durable de tiempos/operación, antes/en/después de 15/20 con contención, proceso reiniciado y cancelación concurrente. No sustituir «recibida antes de 15» por «lock antes de 15», otorgar prioridad por timestamp o enviar una operación nueva fuera de ventana por suposición; cualquier incompatibilidad con spec se eleva antes de ratificar. |
| PT-03 | Unidades de trabajo, unicidades y recuperación financiera | Evidencia de enlistamiento de participantes, estados conocidos/desconocidos, fecha real de hechos/validación e IDs recuperables de Culqi; G-01–G-05/A-03, sin transacción externa ficticia. |
| PT-04 | Operación de host, retries y evidencia cuando falla persistencia | Scheduler/colas/locks dentro de presupuesto medido de 60 segundos, políticas no superpuestas y recuperación/alerta sin depender solo del destino caído; V-01–V-04/M-05/I-05. |

Estas precisiones no se convierten en preguntas comerciales repetidas o opciones técnicas que el usuario deba adivinar. Tampoco se declaran cerradas por aprobar una spec: las pruebas y la ratificación técnica siguen pendientes. Este documento no elige versiones/topología, solicita credenciales, publica endpoints o autoriza infraestructura.

### Fuentes técnicas y limitación de reconsulta

Los planes de 008/009 ya registran lecturas de [bloqueos PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html), [aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html) y [fecha/hora](https://www.postgresql.org/docs/current/functions-datetime.html). Se intentó reconsultarlas el 2026-11-02, pero la petición falló por resolución DNS (`ENOTFOUND`); **no se obtuvo nueva evidencia oficial ni se validó una versión instalada**. Se conservan esas referencias y el carácter propuesto de modos/aislamiento/reloj. PT-01–PT-04 requieren comprobación antes de ratificar/habilitar; no se disfraza la indisponibilidad de red de verificación exitosa.

## 10. Trazabilidad a trabajo existente y estado final

| Frente | Ubicación existente, sin marcar completada | Puertas que conserva |
|---|---|---|
| Contratos/recursos históricos | [001 tasks](../specs/001-reservas/tasks.md): T003–T005/T012–T016/T024–T027/T032–T037; [006](../specs/006-catalogo/tasks.md)/[007 tasks](../specs/007-hoteles/tasks.md) | ACL-17 y puertas de inventario/consistencia. |
| Finanzas/idempotencia | [002 tasks](../specs/002-pagos/tasks.md): T002-01/T002-05/T002-06/T002-09–T002-20/T002-27/T002-31 | G-01–G-05. |
| Vencimiento/60 segundos | [003 tasks](../specs/003-vencimiento/tasks.md): T003-02–T003-05/T003-08–T003-15/T003-19–T003-23 | V-01–V-04. |
| Identidad/baja/correo | [005 tasks](../specs/005-identidad/tasks.md); [008 tasks](../specs/008-perfil/tasks.md): T008-04/T008-10/T008-13–T008-15 | I-01/I-05; P-01/P-02/P-04/P-05. |
| Transiciones administrativas | [009 tasks](../specs/009-administracion-reservas/tasks.md): T009-02/T009-03/T009-09–T009-18/T009-22/T009-23 | R-01–R-04. |
| Auditoría/intenciones/recuperación | [004 tasks](../specs/004-notificaciones/tasks.md)/[010 tasks](../specs/010-clientes-auditoria/tasks.md) | M-04/M-05; A-02/A-03. |

Se mantiene el inventario de **659 criterios y 386 tareas pendientes**. CT-01–CT-08 son contratos lógicos propuestos; ET-01–ET-22, escenarios no ejecutados; PT-01–PT-04, evidencia pendiente. Ninguno añade una aprobación, cierra una puerta, cambia una casilla o autoriza código/SQL/proveedores. Specs, planes, tareas y análisis DEC-200 se conservan intactos.

### Comprobación documental de cierre

- 852 enlaces locales comprobados, ninguno roto; no se declara validado su contenido por existir la ruta.
- CT-01–CT-08, ET-01–ET-22 y PT-01–PT-04 consecutivos y únicos; referencias explícitas `NNN/RF-n` comprobadas contra los IDs existentes.
- Huella agregada de los 43 Markdown protegidos de `specs/`, excluido su índice, coincide con la registrada en DEC-200: `CC61D4E68C3738DEAFB42CC6AF13945B9F40AD1C77FA72A9CF50BC019FEF9981`.
- Análisis DEC-200 intacto, SHA-256 `E74D2388855DF63670D8EACCE78515D93A305B78D090EF48EC5A6D6D9A4EE879`; DEC-201 único y registros DEC sin encabezados duplicados.
- Estos resultados son validación de documentos; no prueban el protocolo, los locks, el reloj, la recuperación, el proveedor o una ejecución real de ET.
