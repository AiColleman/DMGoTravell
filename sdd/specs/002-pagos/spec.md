# Spec 002 — Pagos y confirmación

> **Estado:** aprobada v0.7; **APROBADA** el 2026-11-01 mediante DEC-171, con 70 criterios.  
> **Versión:** 0.7, 2026-11-01; 70 criterios. Cierre transversal por delegación en DEC-170 y [matriz de cierre](../../cierre-dependencias-002.md).  
> **Requisitos de origen:** RF07 y RF08; HU-08; RN-14–RN-18, RN-24 y RN-28. Se conservan sus identificadores.  
> **Fuentes:** F01 §3; F02 §1 y §9; F03 §§1/3/4/5/6/7; F04 AC02/AC04/AC05/AC07–AC11; F05 §§1–3 (RC14, RS02/RS05–RS09, RP01/RP08); F06 §§2/4 (DA04/DA05/DA08); F07 ADR-007; F12 §§2.6 y 5.4; [inventario](../../fuentes.md). DEC-001, DEC-002, DEC-012, DEC-013, DEC-017, DEC-020, DEC-024, DEC-027, DEC-028, DEC-033 y DEC-034; nuevas DEC-120–DEC-132.  
> **Dependencias:** 001 Reservas v0.13, 003 Vencimiento v0.1, base 004 Notificaciones v0.1, 005 Identidad v0.1, 009 v0.2, 010 Auditoría v0.3 y complemento 004 v0.1 aprobados. Quedan las puertas técnicas de la matriz de cierre; esta aprobación no habilita implementación.

## Resumen para revisión

- El cliente paga una reserva propia en estado `pending` mediante Culqi, con tarjeta o Yape, en un solo pago conjunto por el total oficial guardado.
- Cada intento se registra y conserva su relación con la reserva y los identificadores externos; no se almacenan datos sensibles de tarjeta.
- La reserva solo pasa a `confirmed` después de validar un pago exitoso, auténtico y coincidente en importe, moneda y referencia.
- Se conservan las ventanas de 001: quince minutos para iniciar el pago y cinco adicionales de tolerancia solo si hay un intento iniciado a tiempo; los cortes exactos no amplían el plazo.
- Un pago rechazado antes de los quince minutos permite reintentar sin reiniciar la ventana. Un rechazo definitivo durante la tolerancia cancela y libera de inmediato.
- Un resultado desconocido se muestra como «pago en verificación» y bloquea otro intento y la cancelación voluntaria; no se trata como rechazo.
- Un pago validado después de una cancelación mantiene la reserva cancelada y genera una devolución; no reactiva cupos ni habitaciones.
- Si hay dos pagos exitosos distintos, el primero confirma una sola vez y el segundo se registra como duplicado/excedente para devolución.
- Si el pago exitoso no coincide en importe o moneda, no se confirma: se registra como observado, se avisa al administrador, se bloquea otro cobro mientras el caso siga abierto y se devuelve el importe completo con el flujo normal.
- La reserva con pago observado permanece `pending` hasta el minuto 20; no se libera inventario por la sola discrepancia, se bloquea la cancelación voluntaria y, al vencer sin pago válido, se cancela y se devuelve el cobro.
- El cliente ve el tiempo restante y la hora límite de los quince minutos en el detalle de su reserva y en la pantalla de pago; al vencer se muestra «Plazo de pago vencido» y se deshabilita el pago.
- El administrador confirma la devolución dentro de DMGoTravell y el sistema la ejecuta con Culqi. El plazo para confirmarla es de un día hábil, de lunes a viernes en hora de Perú, excluyendo feriados nacionales.
- La devolución conserva fecha, importe, referencia/ID y observación; no exige comprobante adjunto. Si falla o queda desconocida, el caso sigue abierto, se avisa al administrador y se permite reintentar.

Este resumen no sustituye los criterios ni constituye aprobación. El contrato técnico de Culqi, la conciliación y los mecanismos de persistencia se resolverán en el plan.

## Contexto y objetivo

El cliente necesita pagar su reserva turística para confirmar el viaje. La reserva ya existe, pertenece al cliente, está `pending` y conserva el importe oficial calculado por 001. El pago debe cubrir el total de la reserva y no puede alterar precios, cupos ni condiciones históricas.

El objetivo es evitar que una reserva se confirme sin un pago válido, que un evento duplicado genere doble confirmación o doble cargo lógico, que un pago tardío reactive una reserva sin recursos y que un cobro que debe devolverse quede sin trazabilidad. La confirmación y la devolución deben ser verificables y auditables.

Esta spec define el comportamiento de pago y confirmación. El vencimiento automático pertenece a 003; el contenido y la entrega de correos a 004; la identidad a 005; la cancelación administrativa de una reserva confirmada y su política de devolución a 009; la consulta de auditoría a 010.

## Contraste con el análisis de sistema

Se revisaron F01-F07. No se detectan contradicciones funcionales con RF07/RF08 ni con HU-08; se identifica una ambigüedad de redacción en la matriz de actores y se conservan las dependencias:

| Fuente | Elemento | Cobertura / decisión |
|---|---|---|
| F01 §3 | Culqi procesa pagos y notifica; el backend calcula el importe, registra el intento, valida el Webhook y confirma solo con pago válido. | RF-3, RF-6, RF-11–RF-13, RF-48. La matriz de actores atribuye a Culqi «confirmar pago»; se interpreta como confirmación de la transacción, no de la reserva. La reserva la confirma DMGoTravell. |
| F02 HU-08 | Reserva propia `pending`, importe almacenado, intento registrado, confirmación solo con pago válido y sin doble efecto por eventos duplicados. | RF-1–RF-16; RF-13 se precisa para no duplicar el cargo lógico. |
| F02 HU-09/HU-17/HU-20 | Correo posterior, cancelación de una reserva confirmada y vencimiento automático. | Correo en 004; cancelación administrativa y devolución en 009; vencimiento en 003. 002 solo conserva los efectos de pago. |
| F03 RF07/RF08; RN-14–RN-18, RN-24, RN-28 | Procesar pagos, confirmar solo con pago válido, idempotencia, trazabilidad, no datos de tarjeta y auditoría. | RF-1–RF-16, RF-48–RF-51; RN-24 queda en 009. |
| F04 AC02/AC04/AC05/AC07/AC09/AC10/AC11 | Aislamiento de fallos, seguridad, privacidad, concurrencia, trazabilidad, usabilidad y testabilidad. | NFR de esta spec. |
| F05 RC14/RS02/RS05–RS09/RP01/RP08 | Culqi, secretos, propiedad, importe del backend, Webhooks oficiales, idempotencia, PostgreSQL y UTC. | RF-3/RF-4/RF-7/RF-11–RF-13 y NFR. |
| F06 DA04/DA05/DA08 | Pagos seguros, integridad y conservación histórica. | RF-10, RF-13, RF-14 y NFR. |
| F07 ADR-007 | Culqi, importe del backend, registro por intento, identificadores externos, idempotencia y confirmación tras validación. | RF-3, RF-6, RF-10–RF-13. |

**Precisiones del contraste:** (a) la confirmación de la reserva es de DMGoTravell, no de Culqi; (b) el contrato técnico de Culqi y la política de devolución de una reserva confirmada siguen pendientes en el plan/009; (c) las fechas se persisten en UTC y los plazos de negocio se interpretan en hora de Perú; (d) no se amplía el alcance a PagoEfectivo, pagos parciales ni confirmación manual.

## Usuarios / actores

- **Cliente propietario:** inicia el pago de su propia reserva `pending` dentro de la ventana vigente y consulta el resultado.
- **Administrador (`admin`):** revisa los casos de devolución, confirma su ejecución dentro de DMGoTravell y consulta el resultado. No confirma reservas sustituyendo la evidencia de pago.
- **Sistema:** registra intentos, valida resultados, aplica la transición a `confirmed`, conserva la reserva cancelada cuando corresponde y gestiona las devoluciones.
- **Culqi:** proveedor externo que procesa tarjetas y Yape y reporta resultados y notificaciones oficiales. No es un actor interno ni sustituye las reglas de DMGoTravell.

## Historias de usuario

Fuente: F02 §1. Se conserva el identificador y la prioridad original.

- **HU-08:** Como cliente, quiero pagar mi reserva mediante Culqi para confirmar mi viaje. (P1)
  - La reserva existe, pertenece al cliente y está `pending`; el backend utiliza el importe almacenado; se registra el intento de pago; el estado `confirmed` solo se alcanza después de validar un pago exitoso; eventos duplicados no generan doble confirmación ni doble cargo lógico.

No se inventa una HU nueva para devoluciones, pagos observados ni plazo visible. El comportamiento se deriva de DEC-001, DEC-017 y DEC-120–DEC-132.

## Requisitos funcionales (criterios de aceptación en EARS)

### Inicio y registro del pago

- **RF-1:** CUANDO un cliente autenticado inicia el pago de una reserva propia en estado `pending` y dentro de su ventana de pago, EL SISTEMA permitirá iniciar un intento mediante Culqi. (RF07; HU-08; 001/RF-59; DEC-020)
- **RF-2:** SI el cliente intenta pagar una reserva ajena, inexistente, cancelada, confirmada, completada o fuera de su ventana de pago, ENTONCES EL SISTEMA rechazará el inicio del intento. (RF07; RN-14; 001/RF-59–RF-60/RF-74/RF-87)
- **RF-3:** EL SISTEMA obtendrá el importe y la moneda del registro histórico de la reserva y no aceptará que el cliente los defina. (RF07; HU-08; DEC-004; 001)
- **RF-4:** EL SISTEMA permitirá pagar con tarjeta o Yape mediante Culqi y no admitirá PagoEfectivo ni otro medio en esta versión. (RF07; DEC-002)
- **RF-5:** EL SISTEMA exigirá un solo pago conjunto por reserva para cubrir el total oficial y no admitirá pagos parciales ni divididos entre medios. (RF07; HU-08; DEC-002; 001)
- **RF-6:** CUANDO se inicia un intento, EL SISTEMA lo asociará a la reserva y conservará identificadores externos, importe, moneda, fecha y resultado. (RF07; RN-17)
- **RF-7:** EL SISTEMA no almacenará PAN, CVV ni otros datos sensibles de tarjeta. (RN-18; DEC-002)
- **RF-8:** CUANDO DMGoTravell recibe la solicitud de procesamiento antes de concluir los quince minutos iniciales, EL SISTEMA reconocerá el intento como iniciado a tiempo; abrir el checkout por sí solo no cumple esta condición. (RF07; 001/RF-73; DEC-020)
- **RF-9:** SI la solicitud de procesamiento se recibe al cumplirse exactamente quince minutos desde la creación o después, ENTONCES EL SISTEMA rechazará el nuevo intento. (RF07; 001/RF-87; DEC-028)

### Confirmación de la reserva

- **RF-10:** CUANDO se valida un pago exitoso y la reserva sigue `pending` y cobrable dentro de sus límites, EL SISTEMA cambiará la reserva a `confirmed`. (RF08; HU-08; RN-14; 001/RF-35/RF-62)
- **RF-11:** EL SISTEMA confirmará un pago solo después de validar autenticidad, resultado exitoso, importe, moneda y referencia con la reserva. (RF08; RN-14; F12 §2.6)
- **RF-12:** CUANDO el resultado síncrono y la notificación oficial de Culqi reportan el mismo pago, EL SISTEMA los procesará mediante la misma operación sin duplicar efectos. (RF08; RN-15; DEC-012)
- **RF-13:** CUANDO se recibe un evento de pago ya procesado, EL SISTEMA no duplicará la confirmación, el registro de pago, el cargo lógico ni la notificación. (RN-16; HU-08; DEC-012)
- **RF-14:** CUANDO se confirma una reserva, EL SISTEMA conservará el importe, la moneda y las condiciones históricas de la reserva. (RF08; 001; DEC-004)
- **RF-15:** EL SISTEMA no permitirá que un administrador confirme una reserva sustituyendo la evidencia validada de pago. (RF08; RN-14; F12 §2.6)
- **RF-16:** CUANDO se confirma o rechaza un pago, EL SISTEMA registrará actor de sistema, acción, reserva, pago, fecha, importe y resultado en auditoría. (RN-28; DEC-015)

### Rechazos y reintentos

- **RF-17:** CUANDO Culqi rechaza un intento, EL SISTEMA registrará el intento como rechazado con el código o motivo disponible. (RF07; 001/RF-76; DEC-024)
- **RF-18:** CUANDO se conoce un rechazo antes de terminar la ventana inicial y la reserva sigue `pending`, EL SISTEMA mantendrá la reserva `pending` y permitirá otro intento sin reiniciar los quince minutos. (RF07; 001/RF-65/RF-77; DEC-024)
- **RF-19:** CUANDO se valida un rechazo definitivo durante los cinco minutos de tolerancia, EL SISTEMA cancelará la reserva en ese momento y liberará sus recursos una sola vez. (RF08; 001/RF-86; DEC-027)
- **RF-20:** CUANDO Culqi rechaza un intento e informa un motivo comprensible, EL SISTEMA mostrará ese motivo al cliente. (RF07; DEC-122)
- **RF-21:** CUANDO Culqi rechaza un intento sin un motivo comprensible, EL SISTEMA mostrará literalmente «No se pudo procesar el pago». (RF07; DEC-122)
- **RF-22:** EL SISTEMA no mostrará datos sensibles de la tarjeta en el mensaje de rechazo. (RN-18; DEC-122)
- **RF-23:** CUANDO el resultado de un pago es desconocido o se agota el tiempo de espera, EL SISTEMA no lo tratará como rechazo. (RF07; 001/RF-66; DEC-013)

### Resultado desconocido y verificación

- **RF-24:** MIENTRAS el resultado de un pago siga desconocido, EL SISTEMA mostrará «pago en verificación». (RF07; 001/RF-66; DEC-013)
- **RF-25:** MIENTRAS el resultado de un pago siga desconocido, EL SISTEMA bloqueará iniciar otro intento para esa reserva. (RF07; 001/RF-67; DEC-013)
- **RF-26:** MIENTRAS el resultado de un pago siga desconocido, EL SISTEMA rechazará la cancelación voluntaria de la reserva. (RF08; 001/RF-75; DEC-024)
- **RF-27:** EL SISTEMA reconciliará un resultado desconocido con Culqi mediante su mecanismo oficial, sin confirmar ni rechazar por suposición. (RF07; RS08; DEC-013)
- **RF-28:** CUANDO la reconciliación obtiene un resultado exitoso antes del límite de veinte minutos, EL SISTEMA aplicará la confirmación si la reserva sigue cobrable. (RF08; DEC-020)
- **RF-29:** CUANDO la reconciliación obtiene un rechazo, EL SISTEMA aplicará las reglas de rechazo según el momento en que se valide. (RF08; DEC-024/DEC-027)
- **RF-30:** SI la validación del pago se completa al cumplirse exactamente veinte minutos desde la creación o después, ENTONCES EL SISTEMA no confirmará la reserva por ese pago. (RF08; 001/RF-64; DEC-020/DEC-028)

### Pagos tardíos y duplicados

- **RF-31:** CUANDO se valida un pago exitoso para una reserva ya cancelada, EL SISTEMA mantendrá la reserva en estado `cancelled`. (RF08; 001/RF-37; DEC-001)
- **RF-32:** CUANDO se valida un pago exitoso para una reserva ya cancelada, EL SISTEMA registrará el cobro para devolución y no reactivará sus cupos ni habitaciones. (RF08; DEC-001/DEC-033)
- **RF-33:** CUANDO se valida un segundo pago exitoso distinto para una reserva ya confirmada, EL SISTEMA lo registrará como pago duplicado o excedente. (RF07; DEC-120)
- **RF-34:** CUANDO se registra un pago duplicado o excedente, EL SISTEMA no cambiará el estado de la reserva ni generará una segunda confirmación o notificación. (RF08; DEC-120)
- **RF-35:** CUANDO se registra un pago duplicado o excedente, EL SISTEMA generará un caso de devolución por el importe completo del cobro. (RF08; DEC-120)

### Devoluciones

- **RF-36:** CUANDO se detecta un cobro que debe devolverse, EL SISTEMA registrará un caso con motivo, pago, reserva, importe, moneda y fecha de detección. (RF08; DEC-001/DEC-120/DEC-123)
- **RF-37:** EL SISTEMA calculará el plazo máximo de un día hábil para confirmar la devolución, contado desde la detección, de lunes a viernes en hora de Perú y excluyendo feriados nacionales. (RF08; DEC-121)
- **RF-38:** SI el plazo de un día hábil vence sin que el administrador haya confirmado la devolución, ENTONCES EL SISTEMA mantendrá el caso abierto y lo destacará como vencido. (RF08; DEC-121)
- **RF-39:** CUANDO el administrador confirma la devolución, EL SISTEMA la ejecutará con Culqi. (RF08; DEC-124)
- **RF-40:** EL SISTEMA no ejecutará una devolución sin la confirmación del administrador. (RF08; DEC-124)
- **RF-41:** CUANDO la devolución se ejecuta correctamente, EL SISTEMA registrará fecha, importe, referencia/ID y observación, marcará el caso como devuelto y no exigirá comprobante adjunto. (RF08; DEC-123)
- **RF-42:** CUANDO se confirma o ejecuta una devolución, EL SISTEMA informará al cliente que la devolución está en gestión; el contenido y envío del correo corresponden a 004. (RF08; DEC-123)
- **RF-43:** SI la devolución falla o queda con resultado desconocido, ENTONCES EL SISTEMA no la marcará como devuelta, avisará al administrador y permitirá reintentar. (RF08; DEC-125)

RF-43 permite gestionar un reintento, no enviar otro reembolso a ciegas: RF-66–RF-68 exigen verificar el resultado anterior y conservar la confirmación administrativa.
- **RF-44:** MIENTRAS una devolución siga abierta, EL SISTEMA mostrará al cliente que está en gestión. (RF08; DEC-125)
- **RF-45:** EL SISTEMA impedirá que una devolución ya completada se ejecute dos veces. (RF08; RN-15; DEC-125)
- **RF-46:** CUANDO se ejecuta una devolución, EL SISTEMA auditará actor administrador, pago, reserva, importe, referencia, fecha y resultado. (RN-28; DEC-123/DEC-124)
- **RF-47:** CUANDO se devuelve un pago tardío o duplicado, EL SISTEMA devolverá su importe completo y no aplicará penalidades ni devoluciones parciales no especificadas. (RF08; DEC-001/DEC-120)

### Seguridad, trazabilidad y auditoría

- **RF-48:** EL SISTEMA auditará el inicio, resultado, confirmación, rechazo, verificación, observación y devolución de pagos con actor, acción, entidad, identificador, fecha y cambios relevantes. (RN-28; DEC-015)
- **RF-49:** EL SISTEMA no incluirá datos sensibles de tarjeta, secretos ni tokens en la auditoría. (RN-18/RN-28)
- **RF-50:** EL SISTEMA permitirá iniciar pagos solo al propietario de la reserva y confirmar devoluciones solo a un administrador autenticado. (RF07; RN-14; 005/AC04)
- **RF-51:** EL SISTEMA conservará la trazabilidad entre cada pago, sus eventos y la reserva asociada. (RF07; RN-17)

### Pago con importe o moneda distintos

- **RF-52:** CUANDO se valida un pago exitoso cuyo importe o moneda no coincide con el total guardado, EL SISTEMA no confirmará la reserva. (RF08; RN-14; DEC-126)
- **RF-53:** CUANDO se detecta esa discrepancia, EL SISTEMA registrará el pago como observado con el importe, la moneda y la referencia reportados. (RF08; RN-17; DEC-126)
- **RF-54:** CUANDO se registra un pago observado, EL SISTEMA avisará al administrador y bloqueará otro cobro para esa reserva mientras el caso siga abierto. (RF08; DEC-126)
- **RF-55:** MIENTRAS el pago observado siga abierto, EL SISTEMA mostrará al cliente que el pago está en revisión. (RF08; DEC-126)
- **RF-56:** CUANDO el administrador confirma la devolución del pago observado, EL SISTEMA devolverá el importe completo cobrado mediante el flujo de devolución de esta spec. (RF08; DEC-124/DEC-126)
- **RF-57:** CUANDO se detecta un pago observado y la reserva sigue `pending`, EL SISTEMA mantendrá la reserva `pending` sin liberar sus recursos antes del límite de veinte minutos. (RF08; 001/RF-64; DEC-127)
- **RF-58:** CUANDO se cumple el límite de veinte minutos sin un pago válido para una reserva con pago observado, EL SISTEMA aplicará la cancelación de 003 y la devolución del cobro observado. (RF08; 001/RF-64; DEC-127)
- **RF-59:** MIENTRAS el pago observado siga abierto y la reserva siga `pending`, EL SISTEMA rechazará la cancelación voluntaria hasta el límite de veinte minutos. (RF08; 001/RF-75; DEC-128)

### Seguimiento del plazo de pago

- **RF-60:** MIENTRAS una reserva propia permanezca `pending` y esté dentro de los quince minutos para iniciar el pago, y no exista un pago en verificación, EL SISTEMA mostrará en el detalle de la reserva y en la pantalla de pago el tiempo restante y la hora límite. (RF07; HU-08; DEC-129–DEC-131)
- **RF-61:** EL SISTEMA calculará el tiempo restante con la hora del servidor y lo actualizará mientras la vista esté visible, sin depender del reloj del cliente. (RF07; DEC-129/DEC-130)
- **RF-62:** CUANDO el contador llegue a cero, EL SISTEMA mostrará «Plazo de pago vencido», detendrá el contador y deshabilitará el inicio de un nuevo pago. (RF07; DEC-132)
- **RF-63:** CUANDO el cliente abra una reserva `pending` después de los quince minutos, EL SISTEMA mostrará «Plazo de pago vencido» y no un contador activo. (RF07; DEC-132)
- **RF-64:** EL SISTEMA no mostrará los cinco minutos de tolerancia como tiempo de pago disponible para el cliente. (RF07; DEC-129)

### Cierre de contratos y prevención de doble devolución

- **RF-65:** CUANDO 009 registra una cancelación administrativa válida de una reserva confirmada, EL SISTEMA abrirá el caso de devolución total asociado al pago confirmado. (RN-24; DEC-150; DEC-170; 009 v0.2)
- **RF-66:** MIENTRAS una devolución tenga resultado desconocido, EL SISTEMA verificará el resultado anterior con el proveedor antes de admitir otro envío de devolución. (DEC-125; DEC-170; idempotencia de RN-15)
- **RF-67:** CUANDO la verificación confirma que una devolución ya se ejecutó, EL SISTEMA registrará ese resultado sin ejecutar otra devolución. (DEC-125; DEC-170)
- **RF-68:** CUANDO la verificación descarta una devolución ejecutada o en curso, EL SISTEMA permitirá un reintento autorizado por el administrador. (DEC-124/DEC-125; DEC-170)
- **RF-69:** EL SISTEMA impedirá devolver sobre un mismo cobro un importe acumulado superior al importe efectivamente cobrado. (DEC-120/DEC-126; DEC-170)
- **RF-70:** CUANDO se informa del resultado de una devolución, EL SISTEMA distinguirá su ejecución confirmada por el proveedor del abono efectivo en la cuenta del cliente. (DEC-017/DEC-121; DEC-170)

El plazo de un día hábil exige revisión, confirmación e inicio administrativo desde detectar el caso; no garantiza abono bancario. Un resultado desconocido no equivale a fallo definitivo ni justifica otro envío. No se convierte el límite de RF-69 en autorización de reembolsos parciales o penalidades: cada caso conserva su importe total y sus referencias. Las devoluciones concurrentes sobre un cobro deben respetar conjuntamente ese límite.

## Requisitos no funcionales

- **RN-14:** una reserva solo pasa de `pending` a `confirmed` después de validar un pago exitoso.
- **RN-15/RN-16:** los eventos de pago se procesan sin duplicar efectos; un evento repetido no duplica confirmación, registro de pago ni notificación.
- **RN-17:** cada pago se relaciona con una reserva y conserva los identificadores externos necesarios para trazabilidad.
- **RN-18:** no se almacenan datos sensibles de tarjeta.
- **Plazo visible:** el contador y la hora límite se calculan con la hora del servidor; el reloj del cliente no altera la elegibilidad ni el corte de los quince minutos.
- **RN-24:** la cancelación posterior a un pago confirmado sigue la política administrativa y de devolución que defina 009; esta spec no la inventa.
- **RN-28:** las operaciones críticas registran actor, acción, entidad, identificador, fecha y cambios relevantes; la auditoría no es editable desde la aplicación.
- **AC07:** la confirmación y la liberación/cancelación no dejan efectos parciales; la concurrencia se verifica con pruebas de integración, no solo con dobles.
- **AC10:** la presentación distingue `pending`, `confirmed`, `completed` y `cancelled`; no muestra confirmación antes de que el sistema la determine.
- **AC11:** las reglas deben poder verificarse de forma aislada; las garantías de concurrencia e idempotencia requieren comprobación de integración.
- **AC02:** un fallo de un servicio externo o de un proceso de correo no debe bloquear peticiones HTTP no relacionadas; la confirmación no depende del envío de correo (F04 AC02; ADR-008).
- **AC04/RS02/RS03/RS08/RS09:** los Webhooks se validan con el mecanismo oficial de Culqi; los secretos no se almacenan en el repositorio; las operaciones de pago son idempotentes; los endpoints administrativos exigen `admin` (F04 AC04; F05 RS02/RS03/RS08/RS09).
- **AC05/RS05:** un cliente solo accede a sus propios pagos y reservas; la confirmación de devoluciones queda reservada al administrador (F04 AC05; F05 RS05; RF-2/RF-50).
- **AC08:** los eventos externos se reciben en endpoints específicos y los contratos JSON se definen en el plan; esta spec no fija firmas ni formatos (F04 AC08).
- **AC09:** la auditoría permite reconstruir las operaciones críticas; los logs técnicos no sustituyen la auditoría (F04 AC09; RN-28).
- **RP01/RP08:** reservas, pagos y auditoría se persisten en PostgreSQL; las fechas se almacenan en UTC y los plazos de negocio se calculan en hora de Perú (F05 RP01/RP08; 001/RF-79).

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Reserva ajena, inexistente o no `pending` | Se rechaza el inicio del pago | RF-2 |
| Pago solicitado exactamente a los 15 minutos o después | Se rechaza el nuevo intento | RF-9 |
| Pago rechazado antes de los 15 minutos | La reserva sigue `pending`; se permite reintentar sin reiniciar la ventana | RF-17/RF-18 |
| Rechazo definitivo durante la tolerancia | Se cancela y libera en ese momento, sin esperar al minuto 20 | RF-19 |
| Resultado desconocido o timeout | «pago en verificación»; sin nuevo intento ni cancelación voluntaria | RF-23–RF-26 |
| Validación exitosa antes de los 20 minutos | Se confirma si la reserva sigue cobrable | RF-10/RF-28 |
| Validación al cumplirse los 20 minutos o después | No se confirma; se aplica cancelación y devolución | RF-30/RF-31 |
| Pago exitoso después de una cancelación | La reserva sigue `cancelled`; se registra devolución; no se reactivan recursos | RF-31/RF-32 |
| Dos pagos exitosos distintos | El primero confirma; el segundo se registra como duplicado/excedente y se devuelve | RF-33–RF-35 |
| Evento o webhook repetido | No duplica confirmación, pago ni notificación | RF-13 |
| Administrador intenta confirmar manualmente | Se rechaza; solo la evidencia validada confirma | RF-15 |
| Cliente intenta cancelar una reserva confirmada | Se rechaza la cancelación directa; el flujo administrativo y la devolución corresponden a 009 | 001/RF-31; fuera de alcance 009 |
| Devolución sin confirmación del administrador | No se ejecuta | RF-40 |
| Devolución ejecutada correctamente | Se registra evidencia y se marca como devuelta | RF-41 |
| Devolución fallida o con resultado desconocido | El caso sigue abierto, se avisa y se permite reintentar | RF-43/RF-44 |
| Devolución ya completada | No se ejecuta dos veces | RF-45 |
| Pago con importe o moneda distintos | No se confirma; se registra como observado, se avisa al administrador, se bloquea otro cobro y se devuelve el importe completo | RF-52–RF-56 |
| Pago observado antes del minuto 20 | La reserva sigue `pending`; no se libera inventario; se bloquea la cancelación voluntaria; al vencer se cancela y se devuelve el cobro | RF-57–RF-59 |
| Reserva pending dentro de los 15 minutos | Se muestra contador y hora límite en la reserva y en el pago | RF-60/RF-61 |
| Contador llega a 00:00 | «Plazo de pago vencido»; pago deshabilitado | RF-62 |
| Reserva abierta después de los 15 minutos | «Plazo de pago vencido»; sin contador activo | RF-63 |
| Pago en verificación | Se oculta el contador y se muestra «pago en verificación» | RF-24/RF-60 |
| Cancelación administrativa de una reserva confirmada | Caso de devolución total tras cancelación válida de 009 v0.2, pendiente de aprobación | RF-65 |
| Resultado de devolución desconocido | Verificar antes de otro envío; no repetir si ya se ejecutó | RF-66–RF-68 |
| Devoluciones concurrentes sobre un cobro | Nunca superar el importe cobrado | RF-69 |
| Proveedor confirma ejecución, banco aún no abona | Informar de ejecución sin prometer abono | RF-70 |

## Fuera de alcance

- Vencimiento automático, cancelación y liberación por plazos: corresponden a 003.
- Contenido, formato y entrega efectiva de correos: corresponden a 004.
- Registro, inicio de sesión, recuperación de cuenta y permisos de identidad: corresponden a 005.
- Cancelación administrativa de una reserva confirmada y su política de devolución: corresponden a 009/ACL-02.
- Consulta, filtros y exportación de auditoría: corresponden a 010.
- Indicadores, reportes y conciliación contable: corresponden a 011.
- PagoEfectivo, otros proveedores, pagos parciales, cuotas, suscripciones, tarjetas guardadas, múltiples monedas, contracargos y disputas.
- Devoluciones automáticas sin confirmación del administrador, penalidades, reembolsos parciales o políticas de cancelación no aprobadas.
- Almacenamiento de PAN, CVV, secretos o tokens de tarjeta.
- Confirmación manual de una reserva o cambio directo de estado sin evidencia de pago.
- Facturación, impuestos o comprobantes fiscales.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-70 numerados y trazados a RF/HU/RN o DEC.
- Conservar los textos exactos «pago en verificación» y «No se pudo procesar el pago» cuando correspondan.
- No convertir propuestas técnicas de integración, persistencia o conciliación en criterios funcionales.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar inicio de pago, propiedad, estado, ventana y uso del importe histórico.
- Verificar confirmación solo con evidencia válida, autenticidad, importe, moneda y referencia.
- Verificar rechazos, reintentos, cortes exactos, tolerancia y cancelación por rechazo definitivo.
- Verificar resultado desconocido, visualización, bloqueo de nuevo intento y cancelación voluntaria.
- Verificar pagos tardíos, duplicados, eventos repetidos y ausencia de doble confirmación, doble cargo lógico o doble devolución.
- Verificar que la confirmación de la reserva la realice DMGoTravell tras validar el pago, sin atribuirla a Culqi ni a un botón administrativo.
- Verificar pagos observados por importe o moneda, bloqueo de otro cobro y de la cancelación voluntaria, reserva `pending` hasta el minuto 20 y devolución del importe completo.
- Verificar contador y hora límite en la reserva y el pago, cálculo con hora del servidor, mensaje «Plazo de pago vencido» y bloqueo del pago al vencer.
- Verificar devoluciones, plazo de un día hábil, evidencia, ejecución con Culqi, fallo y reintento.
- Verificar que un resultado desconocido se consulte antes de otro envío, sin superar el importe de un cobro ni duplicar una devolución aplicada.
- Verificar el caso de devolución de 009 y los avisos del complemento de 004 sin prometer un plazo de abono.
- Verificar permisos, auditoría, ausencia de datos sensibles y trazabilidad entre pago, eventos y reserva.

## Dudas abiertas

- **Resuelto por DEC-126:** un pago exitoso con importe o moneda distintos no confirma la reserva; se registra como observado, se avisa al administrador, se bloquea otro cobro mientras el caso siga abierto y se devuelve el importe completo mediante el flujo normal.
- **Resuelto por DEC-127:** la reserva con pago observado permanece `pending` hasta el minuto 20; no se libera inventario por la sola discrepancia y, al vencer sin pago válido, se cancela y se devuelve el cobro.
- **Resuelto por DEC-128:** mientras el pago observado siga abierto, la cancelación voluntaria se rechaza hasta el minuto 20; al vencer se cancela y se devuelve el cobro.
- **Resuelto por DEC-129–DEC-132:** el cliente ve los quince minutos para iniciar el pago, con contador y hora límite, en la reserva y el pago; al vencer se muestra «Plazo de pago vencido» y se deshabilita el pago.
- **PENDIENTE TÉCNICO (plan):** contrato oficial de Culqi para autenticidad, acuses, resultado síncrono, notificación oficial y conciliación (ACL-04). No se inventa firma, garantía temporal ni formato de evento.
- **CONTRATO FUNCIONAL APROBADO:** [009 v0.2](../009-administracion-reservas/spec.md), DEC-172, concreta cancelación antes del primer componente, devolución total y liberación idempotente. No se reabre DEC-150.
- **CONTRATO FUNCIONAL APROBADO:** [complemento 004 v0.1](../004-notificaciones/complemento-contratos.md), DEC-173, cierra avisos de cancelación, devolución y fallo de auditoría. El comprobante de la base 004 v0.1 y la consulta de auditoría de 010 v0.3 conservan sus aprobaciones; quedan pruebas e integración.
- **LÍMITE:** DEC-125 permite reintentar una devolución fallida; no se fija un número máximo de reintentos en esta versión.
- **RESUELTO POR DELEGACIÓN — DEC-170:** los reintentos de devolución desconocida requieren verificación previa y autorización administrativa, sin doble envío. No se inventa una firma, respuesta o garantía de Culqi; la evidencia del contrato oficial y sus pruebas siguen como puerta técnica previa a ejecutar.

## Aprobación de esta especificación

- **Versión aprobada:** 0.7, con 70 criterios.
- **Aprobación explícita del documento completo:** sí; respuesta «si» a la solicitud que enumeró expresamente 002 v0.7, 009 v0.2 y complemento de 004 v0.1.
- **Fecha de aprobación:** 2026-11-01; DEC-171.
- **Reglas previas:** se reutilizan DEC-001/DEC-002/DEC-012/DEC-013/DEC-017/DEC-020/DEC-024/DEC-027/DEC-028/DEC-033/DEC-034 y las reglas de 001; no se reabren.
- **Decisiones parciales:** DEC-120–DEC-132 registran las respuestas de entrevista; DEC-170 registra el cierre delegado de contratos y casos límite. No equivalen a aprobar esta spec completa.
- **Contraste:** F01–F07 revisados; no se detectan contradicciones funcionales con RF07/RF08 ni HU-08. La matriz de actores se interpreta como confirmación de la transacción por Culqi, no de la reserva.
- **Plan/tareas:** no creados. No se autoriza código ni cambios fuera de `sdd/`.
