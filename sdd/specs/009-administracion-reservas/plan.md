# Plan técnico — Spec 009: Administración de reservas

> **Fecha:** 2026-11-02. **Versión del plan:** 0.1.  
> **Base:** [spec v0.2 aprobada](spec.md), 37 criterios, DEC-172; DEC-149–DEC-154/DEC-170 y [matriz de cierre](../../cierre-dependencias-002.md).  
> **Estado:** diseño propuesto, **NO EJECUTADO** ni validado mediante implementación.  
> **Alcance autorizado:** «continua de manera profesional», reiterado con «continua» durante la actividad; solo documentación en `C:\Users\Asus TUF\Desktop\DMGoTravelll\sdd`. Specs y planes anteriores intactos. Sin código, consultas/mutaciones reales, reembolsos, envíos, commits o push.

## 1. Objetivo y restricciones

Planificar consulta administrativa paginada y dos transiciones explícitas: `confirmed → cancelled` antes del inicio del primer componente, con devolución total y liberación única; `confirmed → completed` después de finalizar todos los componentes, con confirmación expresa del administrador.

Conservar `009/RF-1–RF-37`. No confirmar o cancelar `pending` manualmente, reactivar terminales, editar importes/fechas/viajeros/oferta ni convertir una acción administrativa en validación de pago. 009 abre o vincula el caso de devolución local; **no autoriza ni ejecuta automáticamente un reembolso financiero por cancelar**.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [trazabilidad](../../trazabilidad.md), [fuentes](../../fuentes.md), RF14/HU-16/HU-17, RN-14/RN-23/RN-24/RN-26/RN-28/RN-29 y AC05/AC07/AC09/AC11. Las elecciones técnicas de este plan son propuestas, no nuevas reglas de negocio, ADR o cambios de otras specs.

## 2. Compatibilidad de contratos

| Dependencia | Contrato que consume 009 | Condición técnica de integración |
|---|---|---|
| 001 v0.13 | Estado, versión de concurrencia, componentes/precios/horarios históricos y compromisos de recursos | Leer/escribir mediante su frontera; no recalcular con catálogo ni editar su plan protegido. |
| 002 v0.7 | Pago confirmado, caso de devolución total, autorización administrativa y resultado externo | [Plan 002](../002-pagos/plan.md) conserva G-01–G-05. Apertura del caso es local; envío/consulta del reembolso pertenecen a Payments. |
| 003 v0.1 | Exclusión de vencimiento sobre reservas no `pending` y protocolo de liberación | [Plan 003](../003-vencimiento/plan.md); no usar su job para forzar una cancelación administrativa de `pending`. |
| 004 base + complemento v0.1 | Aviso de cancelación aplicada y fase real de devolución, con entrega recuperable | [Plan 004](../004-notificaciones/plan.md); una intención persistida no equivale a correo entregado. |
| 005 v0.1 | Administrador activo y autorización vigente, no solo claim de rol antiguo | [Plan 005](../005-identidad/plan.md); no cuerpo de solicitud con rol/actor confiables. |
| 006 v0.46 / 007 v0.2 | Liberar compromisos turísticos y hoteleros ya confirmados, sin alterar capacidad total | Deben admitir la operación local de liberación de una confirmada cancelada por 009; no suponer que un puerto de cancelación pendiente ya tiene esa semántica. |
| 010 v0.3 | Auditoría inmutable, contexto de transición e incidentes; protección de clientes de baja | Spec aprobada, plan propio aún pendiente. Los registros no se modifican desde 009. |

Las referencias históricas que llaman pendientes a 009 o a los avisos no anulan DEC-172/DEC-173. Su aprobación funcional no prueba contratos de ejecución ni supera las condiciones de proveedor de 002.

## 3. Evidencia técnica de PostgreSQL

Consulta pública el **2026-11-02**, sin instalar versiones ni ejecutar SQL:

| Referencia oficial | Aporte al diseño | Límite |
|---|---|---|
| [Funciones de fecha/hora](https://www.postgresql.org/docs/current/functions-datetime.html) | `CURRENT_TIMESTAMP`/`transaction_timestamp()` representan el inicio de la transacción; `clock_timestamp()` refleja el reloj durante la ejecución. | No usar un timestamp de inicio anterior a una espera de bloqueo como prueba de que aún no comenzó el servicio. |
| [Bloqueos explícitos](https://www.postgresql.org/docs/current/explicit-locking.html) | Bloqueos incompatibles pueden esperar; adquirir objetos en orden consistente ayuda a evitar deadlocks. | Ningún bloqueo garantiza por sí solo el tiempo comercial ni autoriza mantenerlo durante HTTP externo. |
| [Aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html) | Niveles de aislamiento y snapshots deben elegirse según la operación. | Leer un listado no protege una transición posterior; la mutación debe revalidar estado, versión y tiempo. |

Estas referencias no seleccionan una versión instalada, prueban Npgsql/EF Core ni validan rendimiento en Supabase. Se verificarán con el runtime/storage reales antes de implementación.

## 4. Organización y contratos de aplicación

Aplicar el monolito ASP.NET Core/C#, Clean Architecture, CQRS/MediatR, FluentValidation, PostgreSQL/EF Core/Npgsql, OpenAPI/ProblemDetails y React/TypeScript documentados. 009 es una capacidad administrativa de Reservations, no un nuevo servicio desplegable ni una copia de Payments/Inventory.

Separar consultas de lista/detalle de comandos de cancelación y finalización. No exponer un `PATCH` genérico que permita elegir libremente estado o modificar datos históricos.

Puertos propuestos: actor/política administrativa actual, reloj confiable, lector autorizado de reservas, operación protegida de reserva, liberación por compromiso de Catalog/Hotels, obligación de devolución de Payments, auditoría y notificación durable. Cada módulo conserva propiedad de sus datos; no modificar su repositorio o entidades desde 009.

Proponer para comandos: ID de reserva, versión esperada y clave opaca de operación; cancelación añade motivo y finalización añade confirmación expresa. No aceptar importe, moneda, cliente destino, fechas, estado objetivo libre o cantidades de liberación como autoridad del navegador.

## 5. Consulta, filtros y protección de datos

Propuesta técnica de paginación: **20 reservas por página**, límite configurable inicial de **100**; página y tamaño enteros positivos, tamaño excesivo rechazado con validación, no truncado silenciosamente. Son valores propios de 009, no los diez elementos del historial de 001 ni una restricción de CSV de 010.

Orden: fecha de creación descendente e ID único descendente. Combinar todos los filtros elegidos; estado/tour/hotel/IDs exactos, correo parcial sin distinguir mayúsculas después de recortar espacios exteriores. Filtro textual vacío se omite; comodines SQL introducidos por el usuario se tratan como texto, no como instrucciones de búsqueda. Consultas parametrizadas y campos de orden permitidos, sin SQL o expresiones arbitrarias del cliente.

Interpretar filtros de creación por días completos en `America/Lima` y convertir a UTC; internamente puede usarse inicio inclusivo y comienzo del día siguiente exclusivo. Esto incluye todo el día final sin depender de una fracción de segundo artificial. Un extremo omitido deja rango abierto; fechas inválidas/invertidas o parámetros mal tipados se rechazan, no se reinterpretan como filtros vacíos.

Una página válida sin coincidencias devuelve la misma página vacía sin salto. Un filtro tipado válido que no encuentre registros no es un error de servidor. La paginación no promete una vista inmóvil entre peticiones mientras cambian datos; si se expone un total, obtenerlo consistentemente con la página mediante una lectura local breve. No mantener una transacción de lectura abierta durante navegación de UI ni llamadas externas.

Detalle/lista leen el estado canónico y los snapshots de reserva. Enriquecer pago/devolución/cliente con lectores autorizados por lote, evitando N+1 y sin dar acceso a escrituras ajenas. Proponer índices por creación/ID y filtros frecuentes; validar planes de consulta, coste de conteo y profundidad de página con datos representativos antes de crear índices/extensiones.

No exponer PAN/CVV, credenciales, tokens, enlaces secretos o cargas crudas del proveedor. Clientes de baja no se localizan por correo oculto; mostrar la referencia de cliente y datos de reserva necesarios, sin usar un lector de reservas como atajo a los contactos que 010 oculta. La minimización en respuesta no borra el historial almacenado. 009 no recupera el correo oculto para actuar como fallback de notificación: destinatario autorizado sigue siendo decisión de 005/004.

## 6. Tiempo de servicio y matriz de transición

Usar datos **contratados de la reserva**, nunca los horarios/duración actuales del catálogo. En simple, inicio/fin de actividad turística; en compuesta, inicio mínimo y fin máximo de sus componentes. Ante datos históricos ausentes/inválidos, rechazar la transición y generar diagnóstico autorizado; no inferir fin cero, corregir fechas desde 009 ni inventar un permiso de reparación.

| Estado/instante protegido | Cancelar | Completar |
|---|---|---|
| `pending` | No | No |
| `confirmed`, estrictamente antes del primer inicio | Sí, con motivo válido | No |
| `confirmed`, desde primer inicio hasta antes del último fin | No | No |
| `confirmed`, todos los períodos terminados | No | Solo con confirmación expresa del administrador |
| `cancelled` / `completed` | No nueva transición | No nueva transición |

La UI puede indicar acciones posibles al leer, pero esa indicación no las reserva. Capturar tiempo de decisión **después de obtener la protección y de revalidar el estado**, no el tiempo del navegador ni `now()` de una transacción iniciada antes de esperar. Proponer reloj de aplicación contrastado con PostgreSQL o lectura de reloj real equivalente tras las esperas; probar el instante exacto. Nunca retrofechar la decisión para aceptar una cancelación cuyo corte ya pasó.

Volver a comprobar el corte tras esperas/reintentos antes de mutar. El fin contratado ya alcanzado habilita comprobar la finalización, pero no la ejecuta automáticamente: registrar la declaración expresa del administrador con actor/fecha. Completar no genera devolución, no altera pago ni libera recursos otra vez.

## 7. Concurrencia, idempotencia y consistencia local

### Diseño propuesto

Transacción PostgreSQL breve compatible con [002 plan §6](../002-pagos/plan.md): `READ COMMITTED` con protección de la raíz reserva, versión esperada y unicidades sobre operación/compromiso/caso. Compartir orden de bloqueo reserva → pago/caso → inventarios en orden estable; verificar los contratos de todos los participantes. No depender de locks del proceso ni de deshabilitar un botón.

Registrar operación administrativa con clave opaca, actor, reserva, acción, huella del payload normalizado y resultado local. Autenticar/autorizar **antes de devolver un resultado de replay**. Misma clave/actor/reserva/acción/payload recupera el mismo resultado; clave reutilizada con contenido distinto se rechaza. La clave no contiene email, motivo o secretos.

Una solicitud nueva sobre una versión modificada se rechaza por conflicto y requiere nueva lectura; no aplicar silenciosamente la transición sobre un estado distinto. Un replay de una operación ya confirmada no produce otra transición, auditoría de éxito, liberación, caso o aviso. No confundir ese replay con una segunda acción independiente de otro administrador.

Propuesta de límites técnicos: espera de bloqueo hasta 5 segundos y presupuesto del comando local de 10 segundos, sujetos a prueba. Hasta dos reintentos locales acotados para deadlock/conflicto transitorio, cada uno con nueva lectura/tiempo/autorización; no reintentar por cambios de estado, versión, permisos o corte expirado. No mantener locks durante HTTP de Culqi/Resend.

### Cancelación: secuencia local indivisible

1. Resolver administrador activo y validar forma de solicitud, versión, clave y motivo. Propuesta de motivo: texto plano de 1 a 2.000 caracteres después de retirar espacios exteriores, sin truncamiento silencioso; longitud es validación de aplicación, no catálogo de causas.
2. Abrir transacción y comprobar replay/versión con protección de reserva y datos relacionados en orden consistente; adquirir también las protecciones de pago/caso y compromisos de inventario necesarias antes de la evaluación temporal definitiva.
3. Revalidar `confirmed`, primer inicio no alcanzado, datos históricos íntegros y autorización vigente; si falla, no aplicar transición.
4. Cambiar a `cancelled`; liberar **solo** los compromisos turísticos/hoteleros históricos de esa reserva, con marcas únicas compartidas de liberación.
5. Mediante Payments, abrir o vincular la obligación de devolución total del pago confirmado sin duplicar una obligación preexistente. Payments decide importe/casos ya ejecutados o en curso; 009 no envía otro reembolso ni ignora los límites acumulados del cobro.
6. Anexar auditoría de transición y una intención durable de aviso para 004 con el mismo hecho/correlación.
7. Confirmar todo junto. Si falla reserva, liberación, caso, auditoría o registro de intención, rollback local completo; no respuesta de cancelación aplicada ni reembolso externo de una cancelación que no se confirmó.

La liberación no aumenta capacidad total ni crea inventarios por salida. No llamar al puerto de cancelar `pending` para eludir su restricción; la integración debe soportar explícitamente liberar compromisos de una confirmada cancelada por 009. Los recursos son reales y compartidos: probar que otra reserva no recupera capacidad ficticia o doble.

### Resultado desconocido del commit y recuperación

Si la conexión se pierde al confirmar, el cliente no debe crear otra operación porque recibió un error de transporte. Consultar/repetir con la misma clave y verificar resultado durable; si no puede saberse, indicar incertidumbre técnica sin afirmar cancelación/finalización ni disparar pagos. Una caída después del commit no se resuelve repitiendo liberaciones.

Completar usa el mismo protocolo de autorización/versión/replay y commit de transición/declaración/auditoría, **sin** llamadas a liberación o creación/envío de devoluciones. No reactivar un estado terminal para corregir un fallo de presentación.

## 8. Separación de cancelación y reembolso externo

La cancelación abre/vincula un caso con fecha de detección; el administrador revisa y confirma su ejecución mediante 002 dentro de un día hábil, sin promesa de abono. El botón de cancelar no equivale a confirmar por segunda vía el pago original ni a autorizar automáticamente un `POST` financiero.

Después del commit local, 004 despacha el aviso de cancelación/fase de devolución y Payments gestiona la autorización y operación externa. Si correo o reembolso fallan/desconocidos, mantener `cancelled`, recursos liberados y caso abierto; no reconstruir una reserva activa ni bloquear inventario hasta el banco.

Casos de cobros tardíos, duplicados o moneda/importe discrepantes conservan las reglas de 002; no los prohíbe el corte de cancelación de 009. 009 no calcula conversión monetaria, penalidad, importe parcial o comisión a trasladar al cliente.

Antes de habilitar la integración operativa, validar viabilidad de devolución total y recuperación de 002/G-01–G-05. Esto es una puerta de despliegue, **no** una nueva regla para rechazar una cancelación válida por una caída transitoria posterior del proveedor. No alterar el contrato funcional para acomodar una incompatibilidad de Culqi.

## 9. API, interfaz, privacidad y auditoría

Proponer operaciones versionadas separadas de lista/detalle, cancelación y finalización; DTO de comando con whitelist. Publicar OpenAPI y ProblemDetails antes de handlers. Ausencia de autenticación y falta de rol se distinguen según contrato de plataforma; validación es error de entrada, versión/estado incompatible conflicto y datos de reserva inexistente resultado de recurso no disponible. No copiar mensajes exactos de 001 como si estuvieran aprobados para 009.

No admitir sobreescritura de precios, fechas, viajeros, oferta, destino de devolución, estado arbitrario o rol/actor del cliente, incluidos campos extra de solicitudes. La lectura de reserva no habilita su modificación si el permiso se retiró después. Las acciones administrativas de devolución se muestran/derivan al caso de uso de 002, no se implementa un motor financiero en 009.

La UI muestra estado real, componentes/horarios contratados, total/moneda históricos y situación de pago/devolución. Para cancelar, advertir que el **motivo se comunica al cliente**, previsualizarlo escapado y exigir confirmación; para completar, exigir declaración expresa. Controles deshabilitados son orientativos: el servidor revalida todo y explica conflicto sin fingir éxito.

Tratar motivo y nombres como entradas no confiables: escapar HTML/encabezados, no insertar contenido como marcado y no guardar cuerpos completos de solicitudes fallidas en logs. Validar/advertir la prohibición de datos sensibles; no prometer detección automática infalible de secretos dentro de texto libre. El motivo no puede usarse como almacén de PAN/CVV/tokens.

Auditar actor real, reserva, estado anterior/nuevo, motivo aplicable, declaración de finalización, referencias de obligación de devolución, fecha de decisión/commit/resultado y correlación, con inmutabilidad de 010. Motivo de cancelación no se convierte en motivo obligatorio de una finalización que la spec no lo exige. Fallo de auditoría impide una transición controlable; fallos de entrega posterior se registran como incidentes independientes, no como otra cancelación aplicada.

## 10. Pruebas, riesgos y puertas de ejecución

| Riesgo | Evidencia requerida | Puerta |
|---|---|---|
| Cancelación aceptada usando hora anterior a espera de lock | Pruebas antes/en/después de primer inicio, incluida espera/reintento que cruza el corte | R-01/R-05 |
| Liberación/caso/auditoría parciales o dobles | Fallo inyectado en cada paso, dos administradores, replay y pérdida de respuesta de commit en PostgreSQL real | R-02 |
| Doble reembolso o reembolso sin cancelación aplicada | Caso local único/vinculado y autorización externa exclusiva en 002; límites por cobro y recuperación | R-03 |
| Fuga de secretos/datos de baja o escalada | Roles actuales, DTO minimizado, filtros parametrizados y ausencia de campos extra aceptados | R-04/R-05 |
| Confundir correo/intención con efecto de negocio | Pruebas con Resend/auditoría caídos y reserva realmente cancelada; recuperación de evidencia sin recursión | R-04 |

Puertas no superadas por escribir el plan:

1. **R-01 Contratos/datos:** contratos de lectura/comando y horarios/compromisos históricos completos, reloj confiable y versión esperada verificables.
2. **R-02 Consistencia:** PostgreSQL real, orden de bloqueo común, inventario de confirmadas y rollback/idempotencia bajo concurrencia; validar 001/006/007 sin modificar sus planes protegidos.
3. **R-03 Payments:** obligación local, importe total y no duplicación, calendario y autorización por 002; condiciones de proveedor según sus G-01–G-05 no asumidas.
4. **R-04 Identidad/avisos/auditoría:** estado/rol vigente de 005, entrega recuperable de 004 y escritura/consulta de 010, cuyo plan aún está pendiente.
5. **R-05 Calidad:** pruebas de filtros/paginación/fechas, privacidad, conflictos, carga y bloqueo; sin inventar un SLA a partir de una lectura vacía o dobles.
6. **R-06 Autorización:** actividad posterior explícita de código/configuración/mutación. Este plan no cancela, completa, libera, reembolsa ni envía nada.

[tasks.md](tasks.md) contiene **T009-01–T009-28**, todas pendientes, con cobertura de los 37 criterios. Los contratos que ya tienen spec aprobada no se dan por integrados; las pruebas con dobles no acreditan consistencia financiera o de inventario real.
