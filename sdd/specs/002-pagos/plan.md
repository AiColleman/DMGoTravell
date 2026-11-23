# Plan técnico — Spec 002: Pagos y confirmación

> **Fecha:** 2026-11-01. **Versión del plan:** 0.1.  
> **Base:** [spec v0.7 aprobada](spec.md), 70 criterios, DEC-171; dependencias funcionales cerradas en la [matriz](../../cierre-dependencias-002.md).  
> **Estado:** diseño propuesto y backlog documental; **NO EJECUTADO**. No prueba viabilidad del proveedor ni autoriza código.  
> **Autorización:** «continua» después de DEC-171–DEC-173; se continúa con planificación de 002 exclusivamente en `sdd/`. No se modifica ninguna spec aprobada ni planes/tareas existentes.

## 1. Objetivo y límites

Diseñar el procesamiento de un pago conjunto de una reserva propia mediante tarjeta/Yape en Culqi, la confirmación solo tras evidencia válida, el tratamiento de resultado desconocido, cobros tardíos/duplicados/observados, la devolución autorizada y la presentación de las ventanas de pago.

Conservar `002/RF-1–RF-70` y los estados de reserva `pending`, `confirmed`, `completed`, `cancelled`. Los estados internos de intento, recepción o devolución no se añaden al ciclo de vida de la reserva. No crear pagos parciales, cuotas, otro proveedor, confirmación manual ni una política nueva de devolución.

Fuentes: [constitución](../../constitution.md), [fuentes](../../fuentes.md), [trazabilidad](../../trazabilidad.md), DEC-001/DEC-002/DEC-012/DEC-013/DEC-017/DEC-020/DEC-024/DEC-027–DEC-034/DEC-120–DEC-132/DEC-170–DEC-173 en [decisiones](../../decisiones.md), y F01–F07/F12. Las elecciones técnicas siguientes son propuestas del plan, no nuevas ADR ni decisiones de negocio atribuidas al usuario.

## 2. Dependencias y puertas

| Origen | Contrato funcional aprobado | Validación técnica necesaria |
|---|---|---|
| 001 v0.13 | Importe histórico, propietario, límites guardados, transición protegida y retenciones | Coordinar serialización de pago/cancelación/vencimiento sin editar el plan histórico de 001. |
| 003 v0.1 | Cancelación/liberación única, corte 15/20 y máximo operativo 60 segundos | Validar reloj, invocación común, reintentos y alerta; Hangfire no amplía los plazos. |
| 004 base + complemento v0.1 | Comprobante, avisos y alertas recuperables, sin reversión por correo | Acordar entrega persistida, deduplicación, consulta de incidentes y recuperación. Todavía no tienen plan/tareas propios. |
| 005 v0.1 | Cliente autenticado y verificado, `admin` para devoluciones | Validación real de actor/rol/estado y ausencia de secretos en contratos. No tiene plan/tareas aún. |
| 006 v0.46 / 007 v0.2 | Capacidades e inventario, compromisos y datos históricos | Sus contratos técnicos no se dan por validados por tener specs aprobadas; probar liberación conjunta con 001/003/009. |
| 009 v0.2 | Cancelación confirmada válida, apertura local del caso y devolución total | Unificar creación de caso, liberación y auditoría; reembolso externo después del commit local. Sin plan propio todavía. |
| 010 v0.3 | Auditoría inmutable, evidencia externa y alertas de fallo persistente | Demostrar recuperación cuando falle el destino de auditoría; no basta una tabla en el mismo destino caído. Sin plan propio todavía. |

008/011/012 no se implementan aquí. No acceder directamente a repositorios o tablas ajenos; colaborar mediante contratos de Application y una unidad transaccional local compartida cuando el caso lo exija.

## 3. Evidencia de Culqi consultada y límites no comprobados

Lectura pública el **2026-11-01**, sin credenciales, llamadas de cobro ni pruebas de integración:

| Referencia oficial | Qué se pudo comprobar | Qué no demuestra |
|---|---|---|
| [Checkout Custom](https://docs.culqi.com/es/documentacion/checkout/checkout-custom/) | Tokenización en checkout y envío del identificador al backend para crear el cargo; selección de medios de pago. | No acredita por sí sola autenticidad de Webhooks, conciliación o ausencia de doble cargo. No copiar los ejemplos de logs de tokens. |
| [Yape](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape) | La página indica PEN, máximo S/ 2.000 y código de aprobación con vigencia máxima de 2 minutos. | No modifica los 15/20 minutos del negocio ni garantiza las condiciones de la cuenta del comercio o el ambiente de pruebas. |
| [Webhooks](https://docs.culqi.com/es/documentacion/pagos-online/webhooks) | Configuración en CulqiPanel y categorías de eventos, incluidas cargos/devoluciones. | Esta guía no fija el mecanismo verificable de autenticidad, encabezados, acuses, reintentos ni orden de entrega que exige el adaptador. |
| [Devoluciones](https://docs.culqi.com/es/documentacion/pagos-online/operaciones/devoluciones) | Describe devolución por API/panel y enlaza creación, consulta y listado; advierte diferencias de plazos bancarios y condiciones de comisión. | No demuestra el importe neto recibido por el cliente en todos los casos ni la compatibilidad de devolución total para tarjeta/Yape del comercio. |
| [Referencia de API](https://apidocs.culqi.com/) | Portal oficial accesible; enlaces de operaciones desde la guía. | No se extrajo ni validó un contrato OpenAPI completo o una respuesta real. No inventar rutas, firma, tipos, códigos ni claves de idempotencia. |

### Bloqueos concretos, no preguntas nuevas de política

- **G-01 — Contrato de cobro/identidad externa:** documentar por cada medio la solicitud, respuesta, vínculo reserva/intento, identificadores recuperables y comportamiento ante timeout/desconexión. Validar monto/unidad y consulta posterior sin necesidad de PAN/CVV, token sensible persistido ni clave privada en frontend.
- **G-02 — Autenticidad/recepción:** obtener el contrato oficial de notificación y recuperación de resultados; demostrar rechazo de eventos falsos, duplicados y respuestas manipuladas. No diseñar un HMAC propio como si lo ofreciera Culqi. Una restricción de red por sí sola no confirma un pago.
- **G-03 — Devolución total efectiva:** verificar en documentación contractual aplicable y entorno de integración el efecto de comisiones, elegibilidad, tarjeta/Yape y resultado desconocido. Si el proveedor no permite cumplir el importe total aprobado, bloquear esa integración y elevar la incompatibilidad; no descontar comisiones al cliente ni cambiar de medio/proveedor por iniciativa técnica.
- **G-04 — Límite Yape:** verificar el límite vigente del comercio y representar la elegibilidad del medio sin fraccionar ni reducir el importe. Si Yape no admite un total, no enviar ese cobro ni habilitarlo engañosamente; tarjeta solo si el cliente la elige y resulta admisible. No extender la ventana por renovar un código de Yape.
- **G-05 — Recuperabilidad:** demostrar consulta/identificación de un efecto externo si el proceso cae después de enviarlo y antes de guardar su respuesta. Si no hay mecanismo fiable, no habilitar el envío real. Recibir un callback no es la única estrategia de recuperación.

Estos bloqueos son parte de T-01/T-03 de la matriz; no se marcan cumplidos por citar una página ni se ejecutan con este documento.

## 4. Organización técnica propuesta

Mantener un backend ASP.NET Core/C# en monolito modular, Clean Architecture, CQRS/MediatR, FluentValidation, PostgreSQL/EF Core/Npgsql y Hangfire persistente compatible con PostgreSQL. OpenAPI/ProblemDetails para HTTP, React/TypeScript/Vite para presentación. No incorporar broker, microservicios, Redis, almacenamiento durable en disco del contenedor ni llamadas HTTP entre módulos.

| Capa/área | Responsabilidad |
|---|---|
| Payments Domain | Intento, resultado validado, pago, observación, caso/intento de devolución y sus invariantes; sin SDK ni HTTP. |
| Payments Application | Autorización, elegibilidad temporal, idempotencia, interpretación de resultados y coordinación con reservas/auditoría/notificaciones. |
| Payments Infrastructure | Adaptador Culqi, persistencia, deduplicación, transacciones, consultas oficiales y tareas recuperables. |
| Presentation | Inicio y seguimiento propios, recepción externa dedicada, gestión de devoluciones `admin`, validación y errores uniformes. |
| Frontend | Checkout autorizado, estado leído del backend, contador y panel de devolución; nunca autoridad financiera. |

Puertos propuestos: actor actual/verificación, reloj, reserva cobrable y transición protegida, liberación idempotente, proveedor de pagos/consulta/devolución, lector de pagos, calendario hábil Perú, auditoría, notificación persistida e incidentes recuperables. Son responsabilidades lógicas, no firmas o nombres de clases ya existentes.

## 5. Modelo de datos y restricciones a diseñar

| Registro lógico | Información mínima y restricciones |
|---|---|
| Intento de pago | ID interno, reserva/propietario, medio, instante de recepción confiable, plazos originales, total/moneda históricos, referencia técnica de solicitud y estado interno. Un solo intento no resuelto activo por reserva. |
| Pago externo | Proveedor y ID de transacción únicos, intento/reserva relacionados, importe/moneda reportados y resultado validado. Un evento repetido no es otro pago distinto. |
| Recepción de resultado | Origen síncrono/Webhook/consulta, ID externo disponible, correlación, instante de recepción y de validación, huella de integridad y campos permitidos. No almacenar payload completo sin excluir secretos. |
| Caso de devolución | Cobro, reserva, motivo, detección y vencimiento hábil, importe/moneda, autorización administrativa y situación de gestión. Un caso lógico por cobro/motivo sin duplicarlo al repetir el hecho. |
| Intento de devolución | Autorización, referencia estable de operación, solicitud emitida, resultado/ID externo y consulta de verificación. Nunca otro envío mientras exista resultado desconocido o devolución en curso. |
| Intención de notificación/registro técnico recuperable | Correlación, referencia al hecho y campos no sensibles; deduplicación por hecho/tipo/destinatario. No crear una nueva confirmación comercial al reintentar entrega. |

Importes con precisión decimal exacta y dos decimales para PEN, nunca `float`. Una conversión a unidad menor del proveedor solo se implementa tras verificar el contrato de ese endpoint; el ejemplo del checkout no sustituye la validación de la API. Un pago observado conserva el importe/moneda efectivamente reportados; no convertirlo ni modificar el total de la reserva.

Proponer restricciones únicas de proveedor/transacción, operación de devolución y recepción identificada; índice parcial para el intento no resuelto activo; referencias históricas, índices de casos abiertos/vencidos y fechas UTC. La suma de devoluciones ejecutadas **más importes reservados para devoluciones en curso** debe caber en el cobro: comprobarlo bajo exclusión mutua por cobro, no solo con una validación anterior a la transacción.

No persistir PAN, CVV, código Yape, credenciales, tokens del checkout/identidad ni cuerpos que los incluyan. Los identificadores externos no sensibles se distinguen de credenciales; verificar esa clasificación antes de migraciones.

## 6. Consistencia, concurrencia y efectos externos

### 6.1 Estrategia local propuesta

Transacciones locales PostgreSQL cortas, bloqueo explícito o actualización condicional protegida de la reserva y unicidades de intento/pago. Propuesta inicial: `READ COMMITTED` con bloqueos de fila sobre las raíces que gobiernan el caso; verificar con PostgreSQL real y coordinar el mismo protocolo con 001/003/009. No confiar en bloqueos de proceso.

Definir un orden común de adquisición: reserva, intento/pago/caso y recursos de inventario ordenados por identificador. Cada módulo expone su operación transaccional sin que Payments escriba datos ajenos. La selección y aplicación definitiva del protocolo exige pruebas de deadlock/rollback y contratos de 006/007, no modificaciones a sus planes protegidos.

Una recepción única, un pago único y una confirmación única son restricciones distintas: deduplicar solo por ID de Webhook no cubre el mismo cobro llegado por la respuesta síncrona. Dos transacciones externas realmente distintas sí deben conservarse y la excedente genera devolución.

### 6.2 Protocolo de envío y recuperación

1. Autorizar y persistir la intención/intento antes de llamar al proveedor; si ese registro local no puede confirmarse, no enviar el cobro.
2. Liberar la transacción local antes de la llamada externa; no mantener inventario o reserva bloqueados durante HTTP.
3. Correlacionar la llamada con la intención durable y los identificadores oficialmente admitidos. No asumir que el proveedor acepta una clave de idempotencia inventada.
4. Aplicar respuesta y Webhook mediante el mismo caso de uso de resultado validado; la información de navegador es solo disparador no confiable.
5. Si el proceso cae o hay timeout, conservar intento no resuelto y consultar el resultado oficial; nunca repetir automáticamente el `POST` financiero por un error de transporte.
6. Tras validar, confirmar en una transacción local los cambios de reserva/pago, auditoría y una intención durable de notificación. El envío efectivo del correo es posterior y no puede revertir ese commit.

Proponer recepción tipo inbox y entrega tipo outbox en PostgreSQL con trabajadores internos/Hangfire; son mecanismos del plan, no una garantía de «exactamente una vez» del proveedor. La reserva puede confirmarse mientras el correo queda por entregar; la intención persistida no equivale a correo enviado.

Un outbox junto a la base que falla **no demuestra por sí solo** recuperación de un efecto externo ya ocurrido. La evidencia mínima anterior al envío, los identificadores/consultas oficiales y las pruebas de recuperación son obligatorios (G-05). Ante notificación entrante sin almacenamiento disponible, no emitir un acuse de persistencia falsa; el acuse exacto y la estrategia de recuperación deben corresponder al contrato verificado de Culqi. No asumir reentrega infinita.

## 7. Flujos de aplicación y tiempo

### Inicio

- Cliente autenticado y correo verificado por 005; reserva propia `pending`, importe histórico, medio permitido y elegible.
- Capturar recepción confiable en el servidor; comprobar recepción estrictamente anterior al corte original de 15 minutos bajo protección del estado. No aceptar timestamps del navegador ni renovar los plazos por otro token o intento.
- Si cancelación o vencimiento ya ganaron la operación protegida, rechazar sin enviar el cobro. Si ganó el inicio válido, bloquear cancelación voluntaria y nuevos intentos mientras se verifica.
- La cola o lentitud técnica no permite iniciar otro intento después del minuto 15 ni enviar una operación nueva sobre una reserva ya no cobrable.

### Resultado validado

Validar autenticidad y obtener evidencia oficial de resultado/importe/moneda/referencia antes de decidir. Registrar el instante real en que se completa esa validación; la fecha de éxito del proveedor o de llegada del Webhook no permite retrofechar la validación.

| Resultado y situación | Efecto local |
|---|---|
| Éxito coincidente, intento iniciado a tiempo, validación estrictamente antes de 20 y reserva cobrable | Confirmar una sola vez con sus valores históricos y registrar aviso. |
| Rechazo definitivo antes de 15 | Cerrar intento, mantener `pending`, permitir otro dentro de la ventana original. |
| Rechazo definitivo durante tolerancia | Cancelar/liberar una vez por el contrato común de 001/003, sin esperar a 20. |
| Timeout o resultado desconocido | No rechazar; bloquear otro intento/cancelación, mostrar «pago en verificación» y consultar oficialmente. |
| Éxito validado al cumplirse 20 o después, o sobre cancelada | No confirmar/reactivar; registrar caso de devolución, aunque la cancelación automática esté demorada. |
| Segundo cobro distinto exitoso | Conservar ambos, no repetir confirmación/aviso y devolver el excedente completo. |
| Importe/moneda discrepantes | Registrar observado, alertar y bloquear otro cobro; conservar `pending` hasta 20 sin liberar por la mera discrepancia y devolver el cobro observado. |

No permitir confirmación en el minuto operativo adicional de 003. Los relojes de aplicación/base deben estar sincronizados y el punto de decisión temporal compartido y probado. Usar UTC para persistencia y conversión explícita a hora Perú, no la zona local del host.

### Vencimiento y reconciliación

003 conserva la autoridad de cancelación y el máximo de 60 segundos de cancelación/liberación. La consulta oficial de resultados desconocidos se coordina con ese caso de uso, nunca prolonga el corte y no representa una conciliación contable de 011. La programación exacta de consultas debe definirse antes de ejecutar su tarea; un scheduler no es el reloj de elegibilidad.

Un fallo de auditoría antes de un efecto local impide el cambio según 010. Si el cobro ya existe, se conserva su realidad y se recupera el registro, sin volver a cobrar ni marcar una confirmación inexistente. Diseñar alerta persistente conforme al complemento de 004 y probar la caída simultánea de correo/auditoría.

## 8. Devoluciones y plazo hábil

- Crear casos para cobro tardío, duplicado/excedente, observado y cancelación válida de 009. La apertura del caso de 009 participa de su commit local con liberación/auditoría; la devolución HTTP no participa de ese commit.
- Calcular el vencimiento una sola vez desde detección; no reiniciarlo por otro aviso, reintento ni reinicio. Propuesta de cómputo del plan: siguiente día hábil conservando hora local de Perú; fines de semana/feriados nacionales se omiten. Ejemplos y calendario versionado deben validarse antes de la tarea de ejecución, sin confundirlo con 24 horas naturales o abono bancario.
- Un administrador activo autoriza explícitamente. Persistir actor, importe, caso y operación antes de enviar. Cambios de interfaz, botón repetido o job repetido no son autorizaciones financieras nuevas.
- Verificar resultado previo: desconocido/en curso implica consultar y no otro envío; éxito previo implica registrar sin repetir; rechazo definitivo verificado permite reintento autorizado.
- Proteger por cobro la suma ejecutada/en curso. Una devolución desconocida conserva su importe reservado hasta evidencia oficial que lo resuelva; no liberarlo por timeout local.
- Registrar resultado, fecha, referencia y observación sin exigir adjunto. Distinguir proveedor confirma ejecución, gestión aún no confirmada y abono bancario no comprobado.
- Si el caso supera un día hábil sin autorización, mantenerlo abierto y vencido; nunca autoautorizar ni cerrarlo. No establecer un máximo comercial de reintentos por configuración técnica.

## 9. API, presentación y seguridad

Contratos propuestos a publicar en OpenAPI antes de implementar handlers: inicio de intento propio, consulta de seguimiento propio, recepción externa, consulta administrativa de casos, autorización y seguimiento de devolución, y coordinación interna de cancelación de 009. No exponer una transición libre `pending → confirmed`.

ProblemDetails distingue validación/propiedad/estado/plazo/error técnico sin filtrar existencia de reserva ajena ni secretos. El rol no procede de un campo del cuerpo; Webhooks no requieren JWT de cliente pero sí validación oficial del proveedor. Límites de uso/tamaño y configuración TLS se fijan en T002-25/T002-29 sin sustituir autenticidad por mera confianza en IP.

La interfaz consulta el estado de backend; esconder botones no es autorización. El contador usa corte/hora de servidor y una duración transcurrida local para representar el paso del tiempo, resincronizando al volver a la vista; no acepta un reloj local como autoridad. Mostrar literalmente «Plazo de pago vencido», «pago en verificación» y «No se pudo procesar el pago» en sus casos. No presentar la tolerancia de 5 minutos como tiempo de nuevos pagos ni una devolución enviada como abono recibido.

La expiración de un código Yape no amplía ni reduce la ventana de la reserva: renovar un código solo si el estado permite iniciar a tiempo; un resultado financiero desconocido mantiene bloqueos aunque el código haya caducado. Ocultar cuotas/otros medios ofrecidos por defecto en ejemplos de Culqi. No copiar campos extra de marketing ni logs de tokens del ejemplo oficial.

## 10. Pruebas y fallos obligatorios

| Grupo | Evidencia futura requerida |
|---|---|
| Tiempo | Recepción justo antes/en/después de 15; validación antes/en/después de 20; reloj del cliente alterado; retorno a vista; job demorado y rechazo durante tolerancia. |
| Concurrencia PostgreSQL | Inicio/cancelación/vencimiento; respuesta síncrona/Webhook/consulta simultáneos; doble clic; dos cobros distintos; dos autorizaciones/reintentos de devolución sobre un cobro. |
| Fallos de proceso | Caída antes de enviar, después de enviar y antes de guardar respuesta; commit fallido tras cobro; base de auditoría caída; correo caído; worker reiniciado con intención pendiente. |
| Seguridad | Reserva ajena, rol falso, correo no verificado, payload/monto manipulado, Webhook falso/repetido, ausencia de PAN/CVV/tokens/código Yape en almacenamiento y logs. |
| Devolución | Desconocido no reenvía; consulta confirma éxito; rechazo verificado permite reintento autorizado; suma ejecutada/en curso no excede cobro; un día hábil con feriados; banco no abonó todavía. |
| Proveedor | Tarjeta/Yape en test, elegibilidad y límite observado, vigencia de código, montos y unidad, autenticidad, consulta, reembolso total efectivo y comisiones. No usar cargos live. |
| Integración | 001/003/004/005/006/007/009/010 con sus contratos reales, no solo dobles; datos históricos y liberación única. |
| Frontend/E2E | Pago, rechazo, verificación, observado, plazo vencido, reserva cancelada y gestión de devolución, con estado obtenido de API. |

Los dobles sirven para dominio/Application, no demuestran comportamiento de Culqi, PostgreSQL, Hangfire o Resend. No hay pruebas de implementación ejecutadas en esta actividad.

## 11. Cobertura y entregables

[tasks.md](tasks.md) registra **T002-01–T002-32**, todas pendientes, dependencias, entregables y criterios de aceptación verificables. Incluye matriz de cobertura de `002/RF-1–RF-70` sin huecos. No marca cumplidos criterios por haber escrito un documento.

Entregables futuros: contrato oficial verificado y capacidades por medio, contratos internos/OpenAPI, modelo/migraciones/índices, protocolo de consistencia e idempotencia, adaptador, recuperación/avisos, interfaces y evidencia de pruebas. Los nombres/firmas exactos y versiones de paquetes deben fijarse al validar plataforma; no inferirlos de ejemplos de docs.

### Puertas de ejecución

1. Autorización posterior explícita para código, ausente en esta actividad.
2. Cierre verificable de G-01–G-05 antes de cobros/reembolsos reales, especialmente devolución total y recuperación sin doble envío.
3. Validación de transacciones y contratos de 001/003/006/007/009/010, sin alterar los planes protegidos ni interpretar referencias históricas como reglas vigentes.
4. Planes/contratos técnicos de notificaciones, identidad y auditoría coordinados, sin declarar implementadas esas dependencias por tener aprobación funcional.
5. Trazabilidad y resultados reales de pruebas antes de marcar una tarea como terminada o habilitar producción.

No ejecutar estas tareas con este plan. La investigación pública no sustituye credenciales de test autorizadas, contratos del comercio ni pruebas contractuales.
