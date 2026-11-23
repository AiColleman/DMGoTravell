# Plan técnico — Spec 003: Vencimiento y liberación automática

> **Fecha:** 2026-11-01. **Versión del plan:** 0.1.  
> **Base:** [spec v0.1 aprobada](spec.md), 20 criterios, DEC-134; [cierre funcional](../../cierre-dependencias-002.md).  
> **Estado:** diseño propuesto, **NO EJECUTADO** ni validado con implementación.  
> **Autorización:** «continua» después de plan/tasks de 002; solo planificación documental en `sdd/`. Specs y planes anteriores intactos, sin código, commits ni push.

## 1. Objetivo y fuentes

Diseñar la cancelación de reservas `pending` al corte aplicable, con liberación única de recursos turísticos/hoteleros, auditoría `reservation.auto_cancelled`, reintento y alerta. Conservar `003/RF-1–RF-20`: no extender el pago ni añadir estados `expired`/`processing`.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [fuentes](../../fuentes.md), [aclaraciones](../../aclaraciones.md), [trazabilidad](../../trazabilidad.md); RF21/RF22, HU-20, RN-19–RN-22/RN-28, AC02/AC07/AC09/AC10/AC11, ADR-004/ADR-005. Se reutilizan [001 plan](../001-reservas/plan.md) y [002 plan](../002-pagos/plan.md) sin modificarlos. Las selecciones técnicas de este plan no son nuevas políticas comerciales ni ADR aceptadas.

## 2. Contratos y responsabilidades

| Origen | Contrato necesario | Estado/puerta |
|---|---|---|
| 001 v0.13 | Estado, plazos originales, retenciones históricas y transición protegida | Aprobada; validar el protocolo real con sus casos de uso, no escribir su persistencia directamente. |
| 002 v0.7 | Intento admitido a tiempo, verificación/observación, éxito/rechazo validado y exclusión de pagos fuera de plazo | Spec y plan/tasks disponibles, no implementados; coordinar exclusión mutua y tiempo de decisión. |
| 006 v0.46 / 007 v0.2 | Liberar únicamente el compromiso de la reserva, sin aumentar capacidad total o duplicar inventario | Aprobadas con planes no ejecutados; contratos técnicos pendientes de pruebas. |
| 004 base/complemento v0.1 | Aviso de fallo de vencimiento, intento de envío, deduplicación y consulta de incidentes | Aprobados, sin planes propios todavía; entrega real no demostrada. |
| 005 v0.1 | Administrador activo para consulta/alertas y protección del Dashboard | Aprobada, integración de autorización pendiente. Un proceso de sistema no adopta un usuario administrador ficticio. |
| 009 v0.2 | Consulta operativa y transiciones de confirmadas | Aprobada; **no autoriza cancelar manualmente `pending`**, incluso ante fallo persistente. |
| 010 v0.3 | Auditoría inmutable y evidencia recuperable | Aprobada; validar el camino de fallo de su almacenamiento. |

La referencia histórica de 003 a una futura intervención administrativa no crea una excepción a DEC-149. Ante un fallo persistente, el administrador supervisa y se recupera el proceso automático; no se añade un endpoint de cancelación forzada o liberación manual desde este plan.

## 3. Evidencia oficial de Hangfire

Consulta pública el **2026-11-01**, sin instalar paquetes ni ejecutar trabajos:

| Documentación oficial | Evidencia utilizada | Límite |
|---|---|---|
| [Performing Recurrent Tasks](https://docs.hangfire.io/en/latest/background-methods/performing-recurrent-tasks.html) | El scheduler recurrente revisa las entradas con intervalo basado en minutos y requiere servidor activo. | Un cron por minuto puede consumir por sí solo casi todo el margen de 60 segundos, sin contar cola/transacción. |
| [Calling Methods with Delay](https://docs.hangfire.io/en/latest/background-methods/calling-methods-with-delay.html) | Trabajos diferidos persistidos y sondeo predeterminado publicado de 15 segundos, configurable mediante `SchedulePollingInterval`. | La guía no prueba la latencia del storage PostgreSQL concreto, carga o despliegue del proyecto. |
| [Dealing with Exceptions](https://docs.hangfire.io/en/latest/background-processing/dealing-with-exceptions.html) | Reintento automático global predeterminado de 10 intentos y demora creciente; configuración explícita por trabajo. | No aceptar los valores predeterminados como demostración del límite comercial u operativo. |

Estas guías también muestran opciones de otros storages/despliegues; no autorizan SQL Server/Redis, IIS ni otro proceso desplegable en el proyecto. Seleccionar y verificar versión de Hangfire y storage compatible con PostgreSQL antes de implementar; no dar por aceptada una versión o API de un paquete no inspeccionado.

## 4. Tiempo de negocio y decisión protegida

Usar los instantes originales de cada reserva y un reloj de servidor contrastado con PostgreSQL; persistencia UTC. No recalcular vencimientos con la configuración actual ni usar tiempo del navegador o la hora programada de un job como autoridad.

| Situación al evaluar bajo protección de la reserva | Decisión |
|---|---|
| No hay intento pendiente de validación iniciado a tiempo y aún no se cumplen 15 minutos | No cancelar; conservar el vencimiento original. |
| Se cumplen 15 sin intento vigente iniciado a tiempo | Cancelar/liberar, sin tolerancia adicional. |
| Existe intento iniciado antes de 15 aún en verificación y no se cumplen 20 | Conservar recursos hasta 20. Un timeout no es rechazo. |
| Pago observado en una `pending` antes de 20 | Conservar recursos hasta 20 conforme a 002/RF-57–RF-59; no cancelar por la mera discrepancia. |
| Se cumplen 20 sin confirmación válida dentro del corte | Cancelar/liberar; jamás confirmar por una validación posterior. |
| Rechazo definitivo durante tolerancia | Aplicar inmediatamente el comando común de cancelación/liberación; no esperar un job de 20. |
| Estado ya `confirmed`, `completed` o `cancelled` | No modificar por el proceso de vencimiento. |

Un historial con intentos rechazados antes de 15 no concede por sí solo otros cinco minutos: importa el intento vigente iniciado a tiempo que deba verificarse. En los instantes exactos de corte ya aplican las prohibiciones de nuevo pago/confirmación. El máximo de 60 segundos es para completar el efecto local, no una ampliación del plazo.

La protección común de 001/002/003 serializa inicio, cancelación y confirmación. La fecha de creación de un job, de un evento del proveedor o de su recepción no retrofecha una validación. Una confirmación válida que ganó antes del corte impide que el job posterior altere `confirmed`; un job demorado no habilita confirmar después de 20 aunque la fila siga `pending` por fallo técnico.

## 5. Modelo y atomicidad propuestos

Responsabilidades lógicas, no nombres de tablas/clases existentes:

- **Intención de programación:** reserva, cortes originales, identificación estable de trabajo y evidencia de registro/entrega al scheduler. Registrar junto con la creación local de reserva o mediante un contrato durable equivalente para no perder la programación en una caída posterior al commit.
- **Ejecución/intento:** reserva, origen (job, recuperación o rechazo validado), límite aplicable, inicio/fin, resultado y referencia de correlación; registrar cada reintento distinto sin fingir una segunda cancelación exitosa.
- **Marca de liberación por compromiso:** identidad de retención/recurso/operación para impedir duplicar contadores; conservar cantidad/período históricos de tour y hotel.
- **Incidente operativo:** primer fallo, último fallo, corte, retraso, intentos y aviso relacionado; separado del estado comercial de reserva. Ningún incidente crea `expired`/`processing`.

Proponer índices de reservas pendientes por cortes originales, intención de programación única por reserva/corte y marca de liberación única por compromiso. El estado de Hangfire no reemplaza el estado de negocio. Los argumentos de jobs contienen identificadores/referencias no sensibles, no entidades serializadas, credenciales o datos de tarjeta.

Para aplicar la cancelación, usar el protocolo transaccional compatible con [002 plan §6](../002-pagos/plan.md): protección de la reserva, lectura del intento vigente y revalidación temporal; transición a `cancelled`, liberación turística/hotelera, auditoría de éxito e intención de aviso si corresponde en un único commit local. Orden de bloqueo compartido y consistente; no locks solo en memoria ni HTTP a proveedores dentro de la transacción.

No efectuar cobros, reembolsos o consultas lentas a Culqi desde el comando de vencimiento. Un cobro posterior se registra por 002 para devolución sin reactivar. Una caída antes del commit revierte el conjunto; una caída después de commit hace que el reintento detecte el resultado aplicado y no vuelva a liberar.

Los reintentos no deben ocultar anomalías heredadas de liberación parcial: comprobar marcas de compromisos antes de modificar contadores. La implementación nueva no puede generar esa parcialidad. Si se detecta inconsistencia sobre una reserva ya terminal, registrar/escalar sin modificarla desde 003; no inventar una herramienta de reparación autorizada por este plan.

## 6. Programación propuesta y presupuesto de 60 segundos

### Ruta principal

1. Una intención durable identifica los trabajos diferidos de los cortes originales de 15 y 20 minutos. Registrar ambos evita depender de crear el de 20 precisamente cuando el intento de pago cambia de estado.
2. El dispatcher entrega la intención a Hangfire de forma repetible. Una caída entre crear el job y marcar la intención puede duplicar jobs, no efectos comerciales; el comando de negocio sigue siendo idempotente.
3. En 15, el comando decide cancelar o conservar hasta 20 según estado protegido. En 20, vuelve a evaluar: una reserva confirmada se omite; una pendiente no confirmable se cancela.
4. Un barrido recurrente por minuto y una recuperación inmediata al arrancar detectan reservas/intenciones huérfanas. Son mecanismos de reparación, **no la única ruta que acredita 60 segundos en el caso normal**.
5. Al registrar una reserva o reiniciar el proceso, comprobar intención/cortes antes de confirmar la recuperación del scheduler. La recuperación de un corte pasado encola evaluación inmediata, no una nueva ventana de 15/20.

### Valores técnicos iniciales del plan

Propuestas de configuración, no SLA cumplido ni cifras ya medidas:

| Parámetro | Propuesta inicial | Comprobación antes de ejecutar en operación |
|---|---|---|
| Entrega de intenciones pendientes | Cada 5 segundos como máximo objetivo de sondeo del dispatcher interno | Compatibilidad real con host, almacenamiento y carga; no persistencia solo en memoria. |
| Sondeo de trabajos diferidos | `SchedulePollingInterval` de 5 segundos | Confirmar nombre/configuración en la versión elegida y soporte del storage. |
| Espera en cola de vencimiento | Presupuesto normal de hasta 10 segundos | Trabajadores/capacidad bajo carga y aislamiento de tareas de correo o consultas lentas. |
| Protección/transacción por reserva | Presupuesto normal de hasta 10 segundos | Contención, rollback, cantidad de compromisos e índices de PostgreSQL real. |
| Reintentos rápidos de un fallo transitorio | Hasta 3 por ciclo, con esperas de 5, 10 y 20 segundos | Política única y contadores persistidos; no acumularla con 10 reintentos implícitos de Hangfire. |
| Recuperación degradada tras ciclo fallido | Reevaluar reservas pendientes afectadas cada 60 segundos | No abandonar una reserva por agotar el ciclo rápido; no multiplicar cadenas de jobs concurrentes. |
| Reparación recurrente de huérfanas | Cada minuto, más recuperación al inicio | No usar el barrido como prueba única de que se cumple el margen de 60 segundos. |

El presupuesto normal propuesto suma sondeo de intención (5), sondeo de scheduler (5), cola (10) y transacción (10): **30 segundos de diseño**, dejando margen hasta los 60 aprobados. No constituye un resultado de medición ni una garantía bajo indisponibilidad. Si la prueba extremo a extremo supera 60, no habilitar operación normal ni alargar el umbral: corregir capacidad/programación o registrar el fallo según RF-11/RF-12.

El tiempo se mide desde el **corte de negocio aplicable hasta el commit de cancelación y ambas liberaciones**, no desde el comienzo del handler ni hasta que Hangfire marque su job como completado. Un registro de job «Succeeded» sin efectos locales completos no satisface la spec.

## 7. Fallos, recuperación y alerta

- Reintentar fallos transitorios sin cambiar los cortes originales. Clasificar errores permanentes de contrato/datos para no generar una tormenta de jobs; mantener incidente y recuperación supervisada, no marcar reserva liberada por agotamiento de intentos.
- Escalar un incidente cuando se agote el ciclo rápido o cuando se detecte que se excedieron 60 segundos sin completar; no esperar un nuevo período comercial. Una vez excedido, la recuperación sigue intentando el efecto pendiente sin ocultar la demora.
- La política persistente de reintento debe tener un único dueño: configurar explícitamente el comportamiento de Hangfire para que no duplique las cadenas del supervisor. Tres reintentos por ciclo no es un abandono definitivo después de tres errores ni un límite de la spec.
- Ante fallo persistente, conservar `pending`, compromisos no liberados y evidencia; rechazar pagos/inicio/confirmación por elegibilidad temporal, no por la llegada del aviso. No presentar al cliente `cancelled` mientras el commit no exista.
- Aviso al administrador por el servicio de 004 y consulta del incidente operativo autorizado, deduplicado por reserva/corte/incidente. Los reintentos distintos dejan evidencia; no enviar una nueva alerta idéntica por cada sondeo ni crear una cadena de alertas sobre alertas.
- Si falla el guardado de auditoría, no completar un cambio controlable sin su registro (010/RF-36). Diseñar conservación/recuperación verificable de evidencia conforme al complemento 004; una tabla en el mismo destino caído no demuestra esa recuperación.
- Si el backend o storage están completamente caídos, no afirmar que se ejecutó cancelación o se alertó en tiempo. Al restablecerse, detectar cortes incumplidos y conservar fechas originales y momento real de detección; no fabricar registros individuales de reintentos que no pudieron ejecutarse o conservarse.
- Al recuperarse, usar el mismo comando; si todos sus efectos locales se confirman, cerrar el incidente operativo sin reactivar reserva ni cambiar snapshots. No se añade un permiso administrativo de cancelación `pending`.

El máximo de 60 segundos sigue siendo criterio medible del caso normal. El camino de indisponibilidad no se usa para declarar cumplida esa medición ni para liberar recursos ficticiamente. Debe existir un plan de capacidad y despliegue siempre activo para que el scheduler pueda trabajar; no asumir que un contenedor en suspensión procesa trabajos.

## 8. Auditoría, consulta y seguridad

Auditar `reservation.auto_cancelled` con actor sistema, reserva, corte, fecha y resultado; conservar las referencias de liberación y valores históricos. Fallos, reintentos y alertas tienen registros propios conforme a RF-14, sin confundirlos con otra cancelación aplicada.

El registro de intentos/temporización/errores no incluye secretos ni datos de tarjeta. Los clientes ven el estado realmente confirmado por el backend y solo sus reservas mediante 001; 003 no crea una API pública de vencimiento ni cambia mensajes de 001/002. La consulta de auditoría y los incidentes se integran con 010/004 dentro de lo aprobado.

El Dashboard y las operaciones de infraestructura de Hangfire requieren administración autenticada y despliegue protegido según 005/RS03. Reintentar un job desde herramientas operativas invoca el mismo comando idempotente; no equivale a permitir editar estados, plazos o contadores de inventario. No añadir nuevas herramientas administrativas por esta planificación.

## 9. Pruebas y evidencias necesarias

| Área | Evidencia futura requerida |
|---|---|
| Tiempo | Antes/en/después de 15/20; intento rechazado antes de 15 frente a vigente/observado; recepción temprana y validación tardía; configuración nueva sin alterar reservas creadas. |
| PostgreSQL | Transacción conjunta, fallo de cada paso, no doble liberación, inicio/confirmación/cancelación/vencimiento concurrentes y múltiples workers. |
| Scheduler | Diferidos persistidos, jobs duplicados/perdidos, recuperación al inicio, sondeo real y cola cargada; no probar solo la llamada directa al handler. |
| Umbral | Medición desde corte hasta commit en entorno representativo, incluido tour + hotel; demostrar todas las muestras del escenario normal acordado dentro de 60 segundos y registrar volumen/carga. |
| Recuperación | Proceso detenido antes/después de commit; caída de storage/auditoría/correo; agotamiento de ciclo rápido y recuperación degradada sin abandono ni prórroga. |
| Auditoría/alertas | Acción exacta, fechas originales, intento/resultado, aviso deduplicado, consulta segura y evidencia recuperable. |
| Límites | No modificar terminales, no nuevos estados, no devolución/cobro desde 003 ni cancelación administrativa de `pending`. |

El volumen, duración y concurrencia del escenario de medición se fijan antes de ejecutarlo; no reemplazar el máximo por un promedio o p95 que permita ocultar casos normales fuera de 60 segundos. Las pruebas de dominio con reloj controlado no demuestran la latencia real de Hangfire/PostgreSQL.

## 10. Entregables y puertas de ejecución

[tasks.md](tasks.md): **T003-01–T003-24**, todas pendientes, con dependencias, aceptación y cobertura de los 20 criterios.

Puertas a cerrar con evidencia, no con más preguntas funcionales:

1. **V-01 Plataforma:** versión/almacenamiento Hangfire compatibles con PostgreSQL, persistencia de jobs y host siempre activo; no instalar ni desplegar en esta actividad.
2. **V-02 Consistencia:** protocolo probado con 001/002/006/007/009/010 y sin alterar planes protegidos; los dobles no bastan.
3. **V-03 Tiempo:** medición extremo a extremo menor o igual a 60 segundos para cancelación/liberación en el caso normal, sin depender solo de cron por minuto.
4. **V-04 Fallos/avisos:** persistencia y recuperación de evidencia, política única de retry, alertas reales y consulta de incidentes, incluidos fallos simultáneos.
5. **V-05 Autorización:** nueva actividad autorizada para código; este plan no ejecuta trabajos ni cambia datos de reserva.

Los parámetros aquí propuestos pueden calibrarse durante validación técnica sin cambiar el resultado aprobado; cualquier modificación de estados, ventanas, facultades administrativas o liberación exige revisar la spec, no ajustar silenciosamente una opción.
