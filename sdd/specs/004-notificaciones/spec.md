# Spec 004 - Confirmaciones y comprobantes por correo

> **Estado:** aprobada v0.1; **APROBADA** el 2026-10-31.  
> **Versión:** 0.1, 2026-10-31.  
> **Requisitos de origen:** RF09; HU-09; RN-16 y RN-18; RN-28. Se conservan sus identificadores.  
> **Fuentes:** F01 §5; F02 §3; F03 §§1/3/4; F04 AC02/AC04/AC05/AC09/AC10/AC11; F05 RC15/RS02/RS07/RP01/RP08; F06 DA07; F07 ADR-008; 002 Pagos v0.6; 003 Vencimiento v0.1; DEC-135–DEC-140.  
> **Dependencias:** 001 Reservas aprobada v0.13; 002 Pagos; 003 Vencimiento aprobada v0.1; 005 Identidad; 009 Administración de reservas; 010 Auditoría. Esta spec no altera documentos aprobados ni habilita implementación.

## Resumen para revisión

- Después de confirmar un pago, el sistema envía al cliente un comprobante por correo mediante Resend.
- El comprobante incluye los datos esenciales de la reserva, el viaje, el importe y el pago; no incluye datos sensibles de tarjeta.
- Cada intento de envío queda registrado; los eventos duplicados y los reintentos no producen correos duplicados.
- Un fallo de correo no revierte la confirmación del pago ni bloquea la operación principal.
- Si el envío falla de forma persistente, el sistema alerta al administrador y conserva evidencia.
- Si el correo rebota o es inválido, se registra el fallo, se alerta al administrador y no se bloquea la reserva.
- El administrador puede solicitar un único reenvío manual de una notificación fallida; queda auditado y no duplica envíos.
- El sistema también envía avisos operativos al administrador por pago observado, fallo de devolución y fallo de vencimiento; cada aviso identifica reserva, motivo, fecha y acción requerida.
- El cliente recibe un aviso cuando una devolución está en gestión.

Este resumen no sustituye los criterios ni constituye aprobación. El formato exacto del comprobante, el número de reintentos y los destinatarios administrativos se concretan en el plan o en 005, sin cambiar el resultado funcional.

## Contexto y objetivo

Un pago confirmado en 002 cambia la reserva a `confirmed`, pero el cliente necesita un comprobante que pueda conservar y consultar. El envío depende de Resend, un servicio externo que puede fallar, demorar o rechazar el correo. La operación de pago no puede quedar bloqueada ni revertirse por ese fallo.

Además, 002 y 003 generan situaciones que requieren atención administrativa: un pago observado por importe o moneda, una devolución fallida y un vencimiento que no pudo completarse. Esas alertas necesitan un canal y un contenido mínimos para que el administrador pueda actuar.

El objetivo es que las notificaciones sean oportunas, trazables, idempotentes y seguras; que el cliente reciba un comprobante comprensible; y que el administrador reciba avisos accionables sin depender de revisar manualmente cada operación.

Esta spec define las notificaciones transaccionales por correo. La validación y confirmación del pago pertenecen a 002; el vencimiento a 003; la identidad, el correo de la cuenta y los roles a 005; la cancelación administrativa y la política de devolución a 009; la consulta de auditoría a 010; el formato gráfico y la plantilla exacta al plan.

## Usuarios / actores

- **Cliente propietario:** recibe el comprobante después de un pago confirmado y el aviso de devolución en gestión.
- **Administrador (`admin`):** recibe avisos operativos y puede solicitar un reenvío manual de una notificación fallida.
- **Sistema:** genera, envía, registra, reintenta y audita las notificaciones.
- **Resend:** proveedor externo de correo transaccional; procesa los envíos y devuelve un resultado o error.
- **Identidad (005):** determina el correo del cliente y los administradores activos; no se define aquí.

## Historias de usuario

Fuente: F02 §3. Se conserva el identificador y la prioridad original.

- **HU-09:** Como cliente, quiero recibir un comprobante por correo después de un pago exitoso. (P1)
  - Tras confirmar el pago, se genera una notificación.
  - Resend procesa el envío.
  - El intento queda registrado.
  - Reintentos no deben producir duplicados.

## Requisitos funcionales (criterios de aceptación en EARS)

### Comprobante al cliente

- **RF-1:** CUANDO se confirma un pago, EL SISTEMA generará una notificación de comprobante para el correo del cliente propietario. (RF09; HU-09; 002/RF-10)
- **RF-2:** EL SISTEMA incluirá en el comprobante el identificador de la reserva, el cliente, el tour o paquete, el alojamiento cuando exista, las fechas y viajeros, el total y la moneda, la fecha y referencia del pago y el estado `confirmed`. (RF09; DEC-136; 001/002)
- **RF-3:** EL SISTEMA enviará el comprobante mediante Resend. (RF09; RC15; ADR-008)
- **RF-4:** EL SISTEMA registrará cada intento de envío con destinatario, tipo de notificación, reserva o pago asociado, fecha, resultado y referencia externa o error disponible. (HU-09; ADR-008; RN-28)
- **RF-5:** CUANDO se repite el evento que originó una notificación ya enviada, EL SISTEMA no generará ni enviará una segunda notificación del mismo evento. (RN-16; 002/RF-13/RF-34)
- **RF-6:** SI un intento de envío falla, ENTONCES EL SISTEMA reintentará sin duplicar las notificaciones ya enviadas. (ADR-008; DEC-137)
- **RF-7:** SI el fallo de envío persiste, ENTONCES EL SISTEMA alertará al administrador, conservará evidencia y no revertirá la confirmación del pago. (ADR-008; DEC-137)
- **RF-8:** SI el correo del cliente rebota o es inválido, ENTONCES EL SISTEMA registrará el fallo, alertará al administrador y no bloqueará la reserva ni el pago. (DEC-139)
- **RF-9:** CUANDO el administrador solicita reenviar una notificación fallida, EL SISTEMA ejecutará un único reenvío, lo auditará y no duplicará envíos por solicitudes repetidas. (DEC-138)
- **RF-10:** SI el reenvío manual falla, ENTONCES EL SISTEMA registrará el fallo y alertará al administrador, sin repetirlo automáticamente. (DEC-138; DEC-137)

### Avisos al cliente y al administrador

- **RF-11:** CUANDO se confirma o ejecuta una devolución, EL SISTEMA notificará al cliente que la devolución está en gestión. (002/RF-42; DEC-135)
- **RF-12:** CUANDO se detecta un pago observado por importe o moneda, EL SISTEMA alertará al administrador. (002/RF-52–RF-59; DEC-135)
- **RF-13:** CUANDO falla una devolución o queda con resultado desconocido, EL SISTEMA alertará al administrador. (002/RF-43; DEC-135)
- **RF-14:** CUANDO el vencimiento automático no completa la cancelación o liberación, EL SISTEMA alertará al administrador. (003/RF-12; DEC-133/DEC-135)
- **RF-15:** EL SISTEMA incluirá en cada aviso operativo la reserva, el motivo, la fecha y la acción requerida. (DEC-140)
- **RF-16:** EL SISTEMA enviará los avisos operativos solo a administradores activos; la identidad y los roles corresponden a 005. (AC04; RS03; 005)
- **RF-17:** EL SISTEMA no incluirá datos sensibles de tarjeta, secretos ni tokens en comprobantes ni avisos. (RN-18; RS07)

### No bloqueo, trazabilidad y aislamiento

- **RF-18:** EL SISTEMA no bloqueará la confirmación del pago ni la operación principal por un fallo de correo. (ADR-008; AC02; DA07)
- **RF-19:** EL SISTEMA auditará la generación, el envío, el fallo, el reintento, el reenvío y la alerta con actor, destinatario, tipo, reserva o pago, fecha y resultado. (RN-28; AC09)
- **RF-20:** EL SISTEMA conservará la relación entre cada notificación, su reserva y su pago, y no enviará datos de otra reserva o cliente. (RN-17; AC05)
- **RF-21:** EL SISTEMA no generará un comprobante antes de que la reserva esté `confirmed`. (RF09; 002/RF-10)
- **RF-22:** SI el comprobante no se envía, ENTONCES la reserva conservará el estado `confirmed` y el caso quedará registrado para reintento o alerta. (ADR-008; DEC-137)

## Requisitos no funcionales

- **AC02/DA07:** el envío es asíncrono y desacoplado; una falla de Resend no bloquea peticiones HTTP no relacionadas ni la operación principal. (F04 AC02; F06 DA07)
- **AC09/RN-28:** la auditoría permite reconstruir qué se generó, a quién se envió, qué falló y qué se reintentó; los logs técnicos no sustituyen la auditoría. (F04 AC09; RN-28)
- **AC10:** el comprobante y los avisos usan mensajes claros sobre reserva, pago, devolución y estado de la operación. (F04 AC10)
- **AC11:** la generación y el envío deben poder probarse sin depender de Resend real; las pruebas de integración cubren fallos, rebotes y duplicados. (F04 AC11; ADR-008)
- **AC05/RS05:** un cliente solo recibe información de sus propias reservas y pagos; los avisos operativos no se envían a clientes. (F04 AC05; F05 RS05)
- **RP01/RP08:** los intentos y su trazabilidad se persisten en PostgreSQL; las fechas se almacenan en UTC y los plazos de negocio se interpretan en hora de Perú. (F05 RP01/RP08; 001/RF-79)
- **RC15/ADR-008:** Resend es el proveedor inicial; los intentos son trazables, un fallo no revierte un pago confirmado y los reintentos no duplican correos. (F05 RC15; F07 ADR-008)

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Pago confirmado | Se genera un comprobante al cliente | RF-1 |
| Webhook de pago repetido | No se envía un segundo comprobante | RF-5 |
| Resend tarda o falla una vez | Se reintenta sin duplicar un envío ya exitoso | RF-6 |
| Resend falla de forma persistente | Se alerta al administrador; la reserva sigue `confirmed` | RF-7/RF-22 |
| Correo del cliente inválido o rebotado | Se registra, se alerta al administrador y no se bloquea la reserva | RF-8 |
| Administrador reenvía una notificación fallida | Un único reenvío, auditado, sin duplicados | RF-9 |
| El reenvío manual también falla | Se registra y se alerta; no se repite automáticamente | RF-10 |
| Devolución confirmada o ejecutada | El cliente recibe aviso de que está en gestión | RF-11 |
| Pago observado por importe o moneda | El administrador recibe aviso con reserva, motivo, fecha y acción | RF-12/RF-15 |
| Devolución fallida | El administrador recibe aviso con reserva, motivo, fecha y acción | RF-13/RF-15 |
| Vencimiento que no completa | El administrador recibe aviso con reserva, motivo, fecha y acción | RF-14/RF-15 |
| Reserva aún `pending` | No se genera comprobante | RF-21 |
| Intento de enviar datos de otra reserva | Se rechaza y no se envía | RF-20 |

## Fuera de alcance

- Validación, confirmación y devolución de pagos: corresponden a 002.
- Vencimiento y liberación automática: corresponden a 003.
- Registro, autenticación, cambio de correo y roles: corresponden a 005.
- Cancelación administrativa y política de devolución: corresponden a 009.
- Consulta, filtros y exportación de auditoría: corresponden a 010.
- Plantilla visual exacta, asunto, remitente, adjuntos y formato PDF: se concretan en el plan.
- Número máximo de reintentos, frecuencia y destinatarios administrativos exactos: se concretan en el plan o en 005.
- Correos de marketing, recuperación de contraseña, verificación de correo y avisos de cancelación por vencimiento no solicitados.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-22 numerados y trazados a RF/HU/RN/DEC o specs dependientes.
- Conservar la diferencia entre comprobante al cliente y aviso operativo al administrador.
- No convertir la plantilla, el asunto o el formato PDF en criterios funcionales.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar generación del comprobante solo después de `confirmed`.
- Verificar contenido mínimo y ausencia de datos sensibles.
- Verificar envío por Resend y registro de cada intento.
- Verificar idempotencia ante webhooks y reintentos.
- Verificar fallo persistente, rebote, correo inválido y alerta al administrador.
- Verificar reenvío manual único y auditado.
- Verificar avisos de pago observado, devolución fallida y vencimiento fallido.
- Verificar que un fallo de correo no revierta la confirmación ni bloquee la operación principal.
- Verificar aislamiento por cliente y destinatarios administrativos.

## Dudas abiertas

- **LÍMITE:** DEC-137 ordena reintentar y alertar si el fallo persiste; no se fija un número máximo de reintentos ni la frecuencia. Se concretan en el plan.
- **PENDIENTE DE 005:** el correo del cliente, los administradores activos y el cambio de correo se definen en 005.
- **PENDIENTE DE 009:** el aviso de cancelación administrativa y la política de devolución se definen en 009.
- **PENDIENTE DE 010:** la consulta y exportación de la auditoría se definen en 010.
- **FORMATO:** la plantilla, el asunto, el remitente, los adjuntos y el formato PDF se definen en el plan; esta spec solo fija el contenido mínimo.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1.
- **Aprobación explícita del documento completo:** sí, 2026-10-31.
- **Fecha de aprobación:** 2026-10-31.
- **Reglas previas:** se reutilizan ADR-008 y las reglas de 002/003; no se reabren.
- **Decisiones parciales:** DEC-135–DEC-140 registran las respuestas de la entrevista; DEC-141 registra la aprobación de esta spec.
- **Plan/tareas:** no creados en esta actividad. No se autoriza código ni cambios fuera de `sdd/`.
