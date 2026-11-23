# Spec 003 - Vencimiento y liberación automática

> **Estado:** aprobada v0.1; **APROBADA** el 2026-10-31.  
> **Versión:** 0.1, 2026-10-31.  
> **Requisitos de origen:** RF21 y RF22; HU-20; RN-19–RN-22 y RN-28. Se conservan sus identificadores.  
> **Fuentes:** F01 §7; F02 §8; F03 §§1/3/4; F04 AC02/AC07/AC09/AC10/AC11; F05 RC17/RS09/RP01/RP08; F06 DA06; 001 Reservas v0.13; DEC-020, DEC-028, DEC-029, DEC-034 y DEC-133.  
> **Dependencias:** 001 Reservas aprobada v0.13; 002 Pagos; 004 Notificaciones; 007 Hoteles; 009 Administración de reservas; 010 Auditoría. Esta spec no altera documentos aprobados ni habilita implementación.

## Resumen para revisión

- El sistema cancela automáticamente una reserva `pending` cuando vence su límite aplicable: quince minutos sin pago iniciado o veinte minutos con un pago iniciado a tiempo que no se validó.
- La cancelación libera una sola vez los cupos turísticos y, cuando corresponde, el inventario hotelero.
- El proceso es idempotente: repetirlo no duplica la cancelación ni la liberación.
- La cancelación y la liberación se completan como máximo sesenta segundos después del vencimiento en el caso normal; ese minuto es demora operativa, no una prórroga para pagar o confirmar.
- Si el proceso falla o no completa en sesenta segundos, reintenta automáticamente; si el fallo persiste, alerta al administrador y conserva evidencia.
- Una reserva cancelada por vencimiento no se reactiva por un pago posterior; el cobro se trata en 002.
- El vencimiento termina en `cancelled`; no se crean estados `expired` ni `processing`.

Este resumen no sustituye los criterios ni constituye aprobación. La frecuencia del trabajo, el número de reintentos y el canal de alerta se resolverán en el plan o en 004, sin cambiar el resultado funcional.

## Contexto y objetivo

Una reserva creada en 001 bloquea cupos turísticos y, si corresponde, inventario hotelero mientras está `pending`. Ese bloqueo no puede durar indefinidamente: si el cliente no inicia el pago dentro de los quince minutos, o si el pago iniciado a tiempo no se valida antes de los veinte minutos, la reserva debe cancelarse y liberar sus recursos.

El objetivo es evitar dos extremos: mantener recursos bloqueados por una reserva que ya no puede pagarse y cancelar una reserva que aún tiene una validación de pago en curso dentro del límite. También se busca que la cancelación y la liberación sean únicas, auditables y recuperables ante fallos operativos.

Esta spec define el proceso automático de vencimiento y liberación. El procesamiento y la validación del pago pertenecen a 002; la cancelación voluntaria del cliente a 001; la cancelación administrativa y la devolución a 009; el contenido y envío de avisos a 004; la consulta de auditoría a 010; la gestión del inventario hotelero a 007.

## Usuarios / actores

- **Responsable de la operación:** necesita que las reservas vencidas se cancelen y liberen sin intervención manual en el caso normal.
- **Sistema:** ejecuta el proceso automático, cancela, libera, reintenta y audita.
- **Administrador (`admin`):** recibe la alerta cuando el proceso no completa la cancelación o liberación y supervisa la excepción. La resolución administrativa se define en 009.
- **Cliente propietario:** consulta el estado resultante; no ejecuta el vencimiento.

## Historias de usuario

Fuente: F02 §8. Se conserva el identificador y la prioridad original.

- **HU-20:** Como responsable de la operación, quiero que el sistema cancele automáticamente las reservas pendientes cuyo plazo de pago haya vencido para liberar disponibilidad. (P2)
  - Hangfire ejecuta periódicamente el trabajo.
  - El plazo máximo de una reserva pendiente se obtiene desde configuración.
  - Solo se procesan reservas `pending`.
  - La transición final es `cancelled`.
  - Se liberan los cupos turísticos bloqueados.
  - Se libera el inventario hotelero cuando corresponda.
  - Se registra la acción `reservation.auto_cancelled`.
  - El trabajo es idempotente.
  - Una reserva `confirmed`, `completed` o `cancelled` no debe ser modificada por este proceso.

## Requisitos funcionales (criterios de aceptación en EARS)

### Límites y cancelación

- **RF-1:** CUANDO una reserva `pending` alcanza su límite aplicable, EL SISTEMA la cancelará por vencimiento. (RF21; HU-20; RN-20; 001/RF-63/RF-74; DEC-020/DEC-028)
- **RF-2:** CUANDO se cumplen quince minutos desde la creación sin una solicitud de pago recibida, EL SISTEMA cancelará la reserva y liberará sus recursos sin esperar la tolerancia. (RF21; 001/RF-74; DEC-020)
- **RF-3:** MIENTRAS exista un pago iniciado a tiempo en verificación, EL SISTEMA conservará los recursos de la reserva hasta el límite total de veinte minutos. (001/RF-61; DEC-020)
- **RF-4:** CUANDO concluye el límite de veinte minutos sin un pago válido confirmado, EL SISTEMA cancelará la reserva y liberará sus recursos. (RF21; 001/RF-63; DEC-020)
- **RF-5:** SI la validación de un pago se completa exactamente a los veinte minutos o después, ENTONCES EL SISTEMA no confirmará la reserva y aplicará el vencimiento. (001/RF-64; DEC-028)
- **RF-6:** EL SISTEMA procesará únicamente reservas `pending`; no modificará reservas `confirmed`, `completed` ni `cancelled`. (HU-20; RN-20)
- **RF-7:** CUANDO se cancela una reserva por vencimiento, EL SISTEMA liberará una sola vez los cupos turísticos bloqueados. (RF22; RN-21; 001/RF-32)
- **RF-8:** CUANDO se cancela por vencimiento una reserva con alojamiento, EL SISTEMA liberará una sola vez el inventario hotelero bloqueado. (RF22; RN-21; 001/RF-33)
- **RF-9:** CUANDO se repite el proceso sobre una reserva ya cancelada por vencimiento, EL SISTEMA no repetirá la cancelación ni la liberación. (RN-22; 001/RF-34)
- **RF-10:** CUANDO vence una reserva `pending`, EL SISTEMA intentará completar la cancelación y la liberación como máximo sesenta segundos después del instante de vencimiento; si no lo logra, se aplica RF-11. (001/RF-97/RF-98; DEC-034)

### Fallo, reintento y alerta

- **RF-11:** SI el proceso automático no completa la cancelación o la liberación en sesenta segundos, ENTONCES EL SISTEMA reintentará automáticamente y conservará evidencia del fallo. (DEC-133)
- **RF-12:** SI tras los reintentos persiste el fallo, ENTONCES EL SISTEMA alertará al administrador, mantendrá la reserva `pending` sin admitir nuevos pagos ni confirmación y no marcará la liberación como completada. (DEC-133; 001/RF-64/RF-87)
- **RF-13:** CUANDO se cancela por vencimiento, EL SISTEMA registrará la acción `reservation.auto_cancelled` con actor sistema, reserva, fecha, límite aplicable y resultado. (RN-28; 001/RF-69; HU-20)
- **RF-14:** CUANDO ocurre un fallo, un reintento o una alerta, EL SISTEMA registrará el evento en auditoría con reserva, fecha y resultado. (RN-28; DEC-133)

### Conservación y límites de alcance

- **RF-15:** CUANDO cambia la configuración de los plazos, EL SISTEMA conservará los límites originales de las reservas ya creadas. (001/RF-88; DEC-029)
- **RF-16:** CUANDO se cancela por vencimiento, EL SISTEMA conservará los importes, condiciones y datos históricos de la reserva. (RN-02; 001)
- **RF-17:** SI un rechazo definitivo se valida durante la tolerancia, ENTONCES EL SISTEMA cancelará y liberará en ese momento, sin esperar al límite de veinte minutos. (001/RF-86; DEC-027)
- **RF-18:** CUANDO el cliente consulta una reserva cancelada por vencimiento, EL SISTEMA mostrará el estado `cancelled` y no `pending`. (AC10; 001/RF-54)
- **RF-19:** EL SISTEMA no reactivará una reserva cancelada por vencimiento por un pago posterior; el cobro se trata en 002. (001/RF-37; DEC-001)
- **RF-20:** EL SISTEMA no creará estados `expired` ni `processing`; el vencimiento termina en `cancelled`. (001; DEC-020)

## Requisitos no funcionales

- **AC07:** la cancelación y la liberación no dejan efectos parciales; la concurrencia y la liberación única se verifican con pruebas de integración, no solo con dobles. (F04 AC07; RN-22)
- **AC09/RN-28:** la auditoría permite reconstruir la cancelación, la liberación, los reintentos y la alerta; los logs técnicos no sustituyen la auditoría. (F04 AC09; RN-28)
- **AC10:** la presentación distingue `pending`, `confirmed`, `completed` y `cancelled`; una reserva vencida no se muestra como confirmada. (F04 AC10)
- **AC11:** las reglas deben poder verificarse de forma aislada; la idempotencia y la concurrencia requieren comprobación de integración. (F04 AC11)
- **AC02:** un fallo del proceso automático no debe bloquear peticiones HTTP no relacionadas. (F04 AC02)
- **RP01/RP08:** reservas, pagos y auditoría se persisten en PostgreSQL; las fechas se almacenan en UTC y los límites de negocio se calculan en hora de Perú. (F05 RP01/RP08; 001/RF-79)
- **RC17/DA06:** el proceso automático se ejecuta mediante el mecanismo de trabajos en segundo plano definido por la arquitectura; la frecuencia y el número máximo de reintentos se concretan en el plan. (F05 RC17; F06 DA06)

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Reserva sin pago iniciado al minuto 15 | Se cancela y libera en ese momento | RF-2 |
| Pago solicitado al minuto 14:59 y validado al 19:59 | Se confirma; no se aplica vencimiento | RF-3/RF-4 |
| Pago solicitado al minuto 14:59 sin validación al minuto 20 | Se cancela y libera | RF-4 |
| Validación exactamente al minuto 20 o después | No se confirma; se cancela y libera | RF-5 |
| Proceso demorado más de 60 segundos | Reintenta; si persiste, alerta al administrador | RF-10–RF-12 |
| Reintento tras una liberación parcial | No se libera dos veces el mismo recurso | RF-9 |
| Reserva confirmada, completada o cancelada | El proceso no la modifica | RF-6 |
| Rechazo definitivo al minuto 18 | Se cancela y libera en ese momento | RF-17 |
| Resultado desconocido al minuto 20 | Se cancela y libera; no se confirma por suposición | RF-4/RF-5 |
| Reserva con tour y alojamiento | Se liberan ambos recursos una sola vez | RF-7/RF-8 |
| Cambio de configuración con reservas creadas | Se conservan los límites originales | RF-15 |
| Pago posterior a la cancelación por vencimiento | La reserva sigue `cancelled`; el cobro se trata en 002 | RF-19 |
| Fallo persistente tras reintentos | Alerta al administrador; la reserva sigue `pending`; no se admiten nuevos pagos ni confirmación | RF-12 |

## Fuera de alcance

- Procesamiento, validación y confirmación de pagos: corresponden a 002.
- Cancelación voluntaria del cliente: corresponde a 001.
- Cancelación administrativa de una reserva confirmada y política de devolución: corresponden a 009.
- Contenido, formato y entrega de correos o alertas: corresponden a 004.
- Consulta, filtros y exportación de auditoría: corresponden a 010.
- Gestión de inventario hotelero y disponibilidad: corresponden a 007.
- Frecuencia exacta del trabajo, número máximo de reintentos y mecanismo de alerta: se concretan en el plan o en 004.
- Nuevos estados de reserva, prórrogas de pago, pagos después del vencimiento y reactivación de reservas canceladas.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-20 numerados y trazados a RF/HU/RN/DEC o 001.
- No duplicar las reglas de pago de 002 ni las de cancelación voluntaria de 001.
- Conservar los textos exactos de estado y la acción `reservation.auto_cancelled`.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar cancelación al minuto 15 sin pago iniciado y al minuto 20 con pago no validado.
- Verificar que una validación al minuto 20 o después no confirme.
- Verificar liberación única de cupos y alojamiento, incluso con reintentos.
- Verificar el máximo de 60 segundos y el camino de fallo con reintento y alerta.
- Verificar que solo se procesen reservas `pending`.
- Verificar auditoría de cancelación, liberación, fallo, reintento y alerta.
- Verificar conservación de importes y condiciones históricas.
- Verificar que no se creen estados `expired` o `processing`.

## Dudas abiertas

- **LÍMITE:** DEC-133 ordena reintentar y alertar si el fallo persiste; no se fija un número máximo de reintentos ni el canal de la alerta. Se concretan en el plan/004.
- **PENDIENTE DE 009:** la intervención administrativa para resolver un fallo persistente se define en 009.
- **PENDIENTE DE 004:** el contenido y el canal del aviso al administrador se definen en 004.
- **PENDIENTE DE 010:** la consulta y exportación de la auditoría se definen en 010.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1.
- **Aprobación explícita del documento completo:** sí, 2026-10-31.
- **Fecha de aprobación:** 2026-10-31.
- **Reglas previas:** se reutilizan 001 v0.13 y DEC-020/DEC-028/DEC-029/DEC-034; no se reabren.
- **Decisiones parciales:** DEC-133 registra el reintento y la alerta ante fallo persistente; DEC-134 registra la aprobación de esta spec.
- **Plan/tareas:** no creados en esta actividad. No se autoriza código ni cambios fuera de `sdd/`.
