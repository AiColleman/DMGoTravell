# Complemento de Spec 004 - Contratos de identidad, cancelación y auditoría

> **Estado:** aprobado v0.1; **APROBADO** el 2026-11-01 mediante DEC-173, con 16 criterios locales.  
> **Versión:** 0.1, 2026-11-01; 16 criterios locales.  
> **Base preservada:** [004 v0.1 aprobada](spec.md), con sus 22 criterios intactos. Este complemento no la sobrescribe ni renumera.  
> **Origen:** RF09/RF23, RN-18/RN-26/RN-28/RN-29, HU-09; DEC-152/DEC-166/DEC-170; obligaciones de 005/009/010. Los avisos nuevos son ampliaciones, no texto original de HU-09.  
> **Trazabilidad:** `004-C/RF-n` identifica exclusivamente criterios locales de este complemento; `004/RF-n` sigue identificando la base aprobada.

## Contexto y objetivo

005 exige correos de verificación y recuperación, 009 exige avisar al cliente de una cancelación administrativa y 010 exige alertar ante un fallo persistente de auditoría. Esos contratos no están completos en el alcance aprobado de 004. Se redactan juntos para no resolverlos informalmente en un plan ni editar una spec aprobada sin revisión. Fuente de cierre delegado: DEC-170 y [matriz de dependencias](../../cierre-dependencias-002.md).

## Usuarios / actores

- **Cliente propietario:** recibe únicamente los correos que correspondan a su cuenta o reserva.
- **Administrador activo:** recibe alertas operativas y consulta incidentes autorizados.
- **005 Identidad:** determina destinatario y validez de enlaces de verificación/recuperación.
- **002/009:** originan el caso de devolución y la cancelación aplicada.
- **010 Auditoría:** define evidencia e inmutabilidad; la indisponibilidad de su guardado no debe hacer desaparecer la alerta.

## Historias de usuario

- **HU-09:** se conserva la entrega transaccional de comprobantes sin duplicados de la base; no se inventa una HU oficial para los avisos nuevos.
- **HU-17:** la cancelación administrativa sigue su política; DEC-152 añade el aviso al cliente.
- **HU-18/RF23:** la evidencia permite reconstruir operaciones críticas; DEC-166 añade alerta por fallo persistente de auditoría.
- **RF03/RF04 y 005:** verificación y recuperación usan los enlaces autorizados de identidad; no se crea una política nueva de credenciales desde este complemento.

## Requisitos funcionales (criterios de aceptación en EARS)

- **RF-1:** CUANDO se aplica una cancelación administrativa válida de 009, EL SISTEMA generará un aviso para el cliente propietario. (DEC-152/DEC-170)
- **RF-2:** EL SISTEMA incluirá en ese aviso la reserva, el motivo registrado, la fecha de cancelación, el estado `cancelled`, el importe y moneda de devolución y la situación vigente de su gestión. (DEC-152/DEC-170)
- **RF-3:** CUANDO se informa de una devolución, EL SISTEMA distinguirá gestión iniciada, resultado pendiente de verificación y ejecución confirmada por el proveedor. (002/RF-70; precisión de DEC-170)
- **RF-4:** EL SISTEMA evitará prometer una fecha de abono bancario por el solo hecho de iniciar o ejecutar la devolución. (DEC-017/DEC-121/DEC-170)
- **RF-5:** SI persiste el fallo de guardado de auditoría de un cobro externo ya realizado, ENTONCES EL SISTEMA generará una alerta para administradores activos. (010/RF-41; DEC-166/DEC-170)
- **RF-6:** EL SISTEMA incluirá en la alerta de auditoría la operación y sus referencias disponibles, la fecha original, el fallo detectado y la acción requerida, sin inventar una reserva cuando la operación no la tenga. (RN-28; AC09; DEC-170)
- **RF-7:** MIENTRAS el guardado de auditoría esté indisponible, EL SISTEMA conservará evidencia recuperable del incidente y de su notificación sin depender de haber creado antes un registro de auditoría. (010/RF-38–RF-41; DEC-170)
- **RF-8:** CUANDO falla registrar o enviar una alerta sobre un incidente ya identificado, EL SISTEMA conservará el incidente original sin generar una cadena ilimitada de alertas sobre la propia alerta. (Idempotencia y cierre por DEC-170)
- **RF-9:** SI el correo de alerta también falla, ENTONCES EL SISTEMA mantendrá el incidente disponible para consulta operativa autorizada del administrador. (AC02/AC09; DEC-170)
- **RF-10:** CUANDO se reintenta un aviso de este complemento, EL SISTEMA evitará duplicar un envío ya confirmado del mismo aviso. (004/RF-5/RF-6; DEC-170)
- **RF-11:** SI falla un aviso de cancelación o devolución, ENTONCES EL SISTEMA conservará el estado real de reserva, pago y devolución sin revertirlos por ese fallo de correo. (ADR-008; 004/RF-18; DEC-170)
- **RF-12:** CUANDO 005 solicita verificar el correo de una cuenta, EL SISTEMA enviará al destinatario definido por 005 el enlace de verificación autorizado para esa solicitud. (005/RF-5–RF-8; DEC-143; DEC-170)
- **RF-13:** CUANDO 005 admite una solicitud de recuperación de contraseña, EL SISTEMA enviará al destinatario definido por 005 el enlace de recuperación autorizado para esa solicitud. (005/RF-22–RF-25; DEC-144; DEC-170)
- **RF-14:** EL SISTEMA dejará a 005 la decisión de vigencia, uso único, vinculación de cuenta y resultado de los enlaces de identidad. (005; DEC-170)
- **RF-15:** EL SISTEMA excluirá enlaces con secretos, contraseñas y tokens de identidad de logs, auditoría y avisos administrativos. (RN-18; AC04; 005/RF-30; DEC-170)
- **RF-16:** CUANDO se recupera el guardado de auditoría, EL SISTEMA registrará la evidencia pendiente preservando la fecha original de los hechos y su resultado real. (RN-28; AC09; 010/RF-40; DEC-170)

La entrega al destinatario previsto de un enlace de identidad no habilita almacenarlo en auditoría ni reenviarlo a administradores. Las solicitudes admitidas, respuestas genéricas, renovación e invalidación de enlaces conservan las reglas de 005. El complemento no vuelve a enviar un enlace ya invalidado como si fuese válido.

Para estos avisos se mantiene la base aprobada: destinatarios autorizados, registro de intentos, ausencia de datos de otra cuenta, reintento/alerta y reenvío manual único conforme a 004/RF-4–RF-10/RF-16–RF-20. Un cambio legítimo de fase de devolución no es un duplicado del mismo aviso; repetir el mismo hecho sí lo es. No se usa el contenido completo del correo como evidencia sin excluir secretos.

## Requisitos no funcionales

- **AC02/ADR-008:** un fallo de correo no revierte una operación confirmada.
- **AC04/AC05:** destinatarios y contenido limitados a lo autorizado; los enlaces solo se entregan al destinatario de identidad.
- **AC09/RN-28/RN-29:** evidencia reconstruible e inmutable una vez registrada; no confundir incidente operativo con edición manual de auditoría.
- **Integridad:** el canal de aviso no puede depender exclusivamente del mismo guardado de auditoría que está fallando.

## Casos límite

| Caso | Resultado esperado |
|---|---|
| Cancelación local rechazada o no aplicada | No se envía un aviso que afirme cancelación realizada. |
| Cancelación aplicada, reembolso aún no abonado | Se informa de la gestión real, sin promesa de abono. |
| Reembolso con resultado desconocido | Estado pendiente de verificación, no presentado como devuelto. |
| Fallan auditoría y correo de alerta | Incidente con evidencia recuperable y consulta administrativa; sin recursión infinita. |
| Se recupera auditoría | Conservar fecha original, no fingir que el hecho ocurrió al reintentar. |
| Enlace de identidad inválido o expirado | Su validez sigue siendo decisión de 005; no se entrega como enlace vigente. |
| Evento o solicitud repetidos | No duplicar el mismo aviso confirmado. |

## Fuera de alcance

- Cambiar reglas de autenticación, cancelación, devolución, plazos o estados de reserva.
- Editar 004 v0.1, 005 v0.1, 010 v0.3 o documentos protegidos.
- Marketing, nuevos proveedores, facturación fiscal o un reporte PDF nuevo.
- Seleccionar arquitectura, almacenamiento, firmas, algoritmos, nombres de eventos no aprobados o configuración de proveedores.
- Fijar número/frecuencia de reintentos, asunto, diseño visual, remitente o adjuntos; corresponden al plan posterior.

## Criterios de finalización

- Verificar los 16 criterios y su independencia de los 22 de la base aprobada.
- Verificar cancelación aplicada frente a rechazada y fases de devolución sin prometer abono.
- Verificar fallos simultáneos de auditoría/correo, evidencia recuperable y ausencia de recursión.
- Verificar no duplicación, destinatarios, enlaces definidos por 005 y ausencia de secretos en evidencia.
- Aprobar este complemento expresamente antes de crear su planificación o ejecutar la integración afectada.

## Dudas abiertas

- **CERRADO FUNCIONALMENTE POR DELEGACIÓN:** origen, destinatarios, contenido mínimo, efecto de fallo y recuperación de los avisos; DEC-170.
- **PUERTA TÉCNICA:** demostrar recuperación de evidencia cuando falle el guardado de auditoría y consulta del incidente cuando falle correo, sin asumir disponibilidad de ese guardado.
- **PENDIENTE DEL PLAN:** parámetros de reintento/alerta, conservación operativa, plantillas, contrato de envío y pruebas con el proveedor; no son preguntas de política de negocio.
- **APROBACIONES REGISTRADAS:** este complemento, 002 v0.7 y 009 v0.2 fueron aprobados expresamente mediante DEC-171–DEC-173. Las bases aprobadas permanecen intactas y quedan las puertas técnicas documentadas.

## Aprobación

- **Versión aprobada:** 0.1, con 16 criterios locales `004-C/RF-1–RF-16`.
- **Aprobación explícita:** sí; respuesta «si» a la solicitud que enumeró expresamente 002 v0.7, 009 v0.2 y este complemento v0.1.
- **Fecha de aprobación:** 2026-11-01; DEC-173. La delegación anterior de DEC-170 no se usó como aprobación automática.
- **Plan/tareas:** no creados. Sin código, commits ni push.
