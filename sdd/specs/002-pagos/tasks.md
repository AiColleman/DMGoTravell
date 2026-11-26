# Tareas — Spec 002: Pagos y confirmación

> **Fecha:** 2026-11-01.  
> **Base:** [spec v0.7 aprobada](spec.md), 70 criterios, DEC-171; [plan técnico v0.1](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  
> **Regla global:** no ejecutar sin autorización posterior para código ni cerrar tareas con documentación o dobles cuando su aceptación exige evidencia externa/PostgreSQL real.

Los IDs `T002-nn` son propios de Pagos y no renumeran T001/T007 ni tareas de otros planes. G-01–G-05 son las puertas del plan; T-01–T-05 pertenecen a la matriz de cierre transversal. Una dependencia funcional aprobada no equivale a integración disponible.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Evidencia y contratos antes de habilitar efectos financieros

- [ ] **T002-01 — Línea base y contratos internos.** → **PARCIAL**: contratos internos existen en `src/DMGoTravel.Application/Common/Interfaces/`, pero no hay matriz de los 70 criterios ni contratos ratificados.
  - **Entregable:** matriz de los 70 criterios, plataforma/versiones verificadas y contratos de actor verificado, reloj, reserva protegida, liberación, pago, devolución, calendario, auditoría y notificación.
  - **Aceptación:** cada contrato tiene propietario de datos y pruebas previstas; no permite precio/rol/estado confiables desde cliente ni acceso a repositorios ajenos. Diferenciar dependencias aprobadas de las aún no implementadas.
  - **Dependencias:** autorización futura de ejecución y specs 001/003/004+complemento/005/006/007/009/010; respetar sus planes existentes.

- [ ] **T002-02 — Verificar cobro tarjeta/Yape y elegibilidad.** → **PENDIENTE**: no hay pruebas contra Culqi test; el cobro usa `SimulatedPaymentGateway.cs`.
  - **Entregable:** contrato oficial aplicable al comercio con unidad monetaria, referencias, capacidades y límites por medio.
  - **Aceptación:** probar tarjeta/Yape en test, límite publicado de S/ 2.000 y su vigencia real, importe inferior/en/superior al límite, código caducado, PEN y ausencia de cuotas/medios no aprobados. No fraccionar ni cambiar el total para que un medio sea admisible.
  - **Dependencias:** T002-01; acceso test autorizado; **G-01/G-04, bloquean envíos reales**. [RF-3–RF-9]

- [ ] **T002-03 — Verificar autenticidad y entrega de resultados.** → **PARCIAL**: webhook con verificación HMAC simulada en `Integrations/HmacWebhookSignatureVerifier.cs` y `ProcessCulqiWebhookCommand.cs`; no se validó el contrato oficial de Culqi.
  - **Entregable:** contrato de Webhooks/respuestas/consultas con fuentes oficiales, autenticidad comprobable, campos permitidos y política de acuse/recuperación.
  - **Aceptación:** evidencia test de notificación falsa, alterada, repetida, fuera de orden y fallo de persistencia antes del acuse; no suponer firma, reentrega o clave de idempotencia que no estén documentadas.
  - **Dependencias:** T002-01/T002-02; **G-02/G-05**. [RF-11–RF-13, RF-27, RF-51]

- [ ] **T002-04 — Verificar devolución total y resultado desconocido.** → **PARCIAL**: máquina de devoluciones en `Domain/Modules/Payments/RefundCase.cs` y prueba `Phase6DomainTests.RefundCase_StateMachine_ShouldEnforceTransitions`; devolución total contra proveedor no verificada.
  - **Entregable:** contrato de creación/consulta/listado y conciliación de devolución aplicable a tarjeta/Yape, con efecto de comisiones y plazos bancarios.
  - **Aceptación:** demostrar cómo recibe el cliente el importe total aprobado y cómo identificar una devolución enviada aunque se pierda la respuesta. Si es incompatible, mantener G-03 bloqueada y elevar el hallazgo, sin introducir penalidades ni otro proveedor.
  - **Dependencias:** T002-01/T002-02; **G-03/G-05**. [RF-39–RF-47, RF-56, RF-66–RF-70]

- [x] **T002-05 — Protocolar concurrencia y deduplicación.** → **HECHO**: índices únicos e idempotencia en `Persistence/Idempotency/` y `Configurations/PaymentsConfiguration.cs`; pruebas `IdempotencySliceTests`.
  - **Entregable:** protocolo PostgreSQL compartido de reserva/intento/pago/caso/inventario, índices únicos y orden de bloqueos.
  - **Aceptación:** plan de pruebas de exclusión por reserva y cobro, misma transacción externa en distintos canales, dos transacciones distintas, caída y rollback; sin locks solo en memoria ni llamada externa dentro de la transacción local.
  - **Dependencias:** T002-01/T002-03/T002-04; contratos 001/003/006/007/009/010. [RF-10–RF-19, RF-31–RF-35, RF-45, RF-65–RF-69]

- [ ] **T002-06 — Demostrar diseño recuperable antes de enviar dinero.** → **PARCIAL**: existe intención durable de auditoría (`PendingAuditEntry` y `PendingAuditRecoveryWorker.cs`), pero el envío de dinero es simulado.
  - **Entregable:** ensayo técnico de intención previa durable y recuperación por referencias oficiales, incluido fallo de auditoría y correo.
  - **Aceptación:** detener el envío si no existe intención durable; recuperar un efecto ya enviado sin otro cargo/reembolso; demostrar el escenario donde el mismo destino de auditoría está caído. Un outbox en ese destino no cierra por sí solo la prueba.
  - **Dependencias:** T002-02–T002-05 y complemento 004/010; **G-05/T-03**. [RF-6, RF-16, RF-23–RF-27, RF-43–RF-51, RF-66–RF-68]

## Fase 1 — Dominio, persistencia y autorización

- [x] **T002-07 — Modelar datos y migraciones de Payments.** → **HECHO**: entidades en `Domain/Modules/Payments/`, migración `20261123220300_AddPhase6ExternalIntegrations` y configuración EF.
  - **Entregable:** intentos, pagos externos, recepciones, casos/intentos de devolución, índices y restricciones, fechas UTC y precisión exacta.
  - **Aceptación:** migración reversible en entorno de prueba, unicidad por transacción externa, intento activo no duplicado y ausencia de PAN/CVV/tokens/códigos Yape. Conservar importe reportado de pago observado sin recalcular la reserva.
  - **Dependencias:** T002-01/T002-05/T002-06. [RF-3, RF-5–RF-7, RF-14, RF-36, RF-41, RF-48/RF-49/RF-51/RF-53]

- [ ] **T002-08 — Integrar actor, verificación y propiedad.** → **PARCIAL**: propiedad y rol se validan en endpoints y comandos, pero el pago no exige correo verificado (solo la reserva lo hace en `CreateReservationCommand.cs`).
  - **Entregable:** autorización real de cliente verificado para pagos propios y administrador para devoluciones.
  - **Aceptación:** rechazar reserva ajena, rol manipulado, cliente no verificado y actor no autorizado, sin filtrar datos de otra cuenta.
  - **Dependencias:** T002-01/T002-07 y 005. [RF-1/RF-2/RF-50]

## Fase 2 — Inicio, resultados y recuperación

- [x] **T002-09 — Implementar inicio protegido e idempotente.** → **HECHO**: `StartPaymentCommand.cs` registra el intento antes de la pasarela y usa idempotencia; pruebas `IdempotencySliceTests.Payment_WithSameKey_ShouldReplayEvenAfterConfirmation`.
  - **Entregable:** comando que registra intento antes de la llamada externa y usa la ventana histórica y recepción de servidor.
  - **Aceptación:** doble clic no duplica; llegada exacta al minuto 15 se rechaza; cancelación previa gana; abrir checkout no inicia pago; importe y moneda proceden de reserva.
  - **Dependencias:** T002-02/T002-05/T002-07/T002-08. [RF-1–RF-9]

- [ ] **T002-10 — Implementar adaptador de cobro sin retry financiero ciego.** → **PARCIAL**: adaptador `SimulatedPaymentGateway.cs` con resultados tipados, pero sin contrato HTTP oficial ni prueba de timeout real.
  - **Entregable:** adaptación del contrato oficial a resultados internos seguros, con timeouts y referencias verificadas.
  - **Aceptación:** ningún `POST` financiero se repite por política HTTP automática ante timeout/desconexión; no persistir token/código ni habilitar medios/importe incompatibles.
  - **Dependencias:** T002-02/T002-03/T002-06/T002-09; contratos documentados y ejecución solo en test autorizado. [RF-4–RF-7, RF-23/RF-27]
  - **Puerta de habilitación real:** T002-28/T002-32 después de construir/probar el adaptador; no son dependencias para su construcción de prueba y no habilitan llamadas live sin autorización.

- [x] **T002-11 — Unificar recepción y normalización de resultados.** → **HECHO**: recepción unificada por webhook/consulta en `ProcessCulqiWebhookCommand.cs` y `GetPaymentQuery.cs`; prueba `Phase6IntegrationsTests.Refunds_AndCulqiWebhook_ShouldWorkEndToEnd`.
  - **Entregable:** caso de uso único para respuesta síncrona, notificación validada y consulta oficial; recepción deduplicada y correlacionada.
  - **Aceptación:** un pago recibido en tres canales conserva una sola aplicación; resultado falso/manipulado no confirma; recepción y validación tienen instantes distintos.
  - **Dependencias:** T002-03/T002-05/T002-07/T002-10. [RF-11–RF-13/RF-51]

- [x] **T002-12 — Aplicar confirmación transaccional.** → **HECHO**: confirmación transaccional con pago, auditoría y aviso; pruebas `ReservationPaymentAuditTests.ReservationAndPaymentFlow_ShouldAuditOnceWithSafeSummary`.
  - **Entregable:** transición protegida a `confirmed`, pago, auditoría e intención de comprobante en commit local conjunto.
  - **Aceptación:** solo éxito auténtico coincidente antes de 20; no confirmación manual, cambio de snapshots ni doble notificación lógica; un fallo local no deja confirmación parcial.
  - **Dependencias:** T002-11 y contratos 001/004/010. [RF-10–RF-16]

- [ ] **T002-13 — Aplicar rechazo y liberación durante tolerancia.** → **PARCIAL**: el vencimiento con pago en curso está probado (`ReservationExpiryTests`), pero no el rechazo definitivo en minuto 18 con liberación inmediata.
  - **Entregable:** rechazo definitivo con motivo seguro, retry antes de 15 y cancelación/liberación en tolerancia.
  - **Aceptación:** no reiniciar ventana; rechazo en minuto 18 cancela sin esperar a 20; fallback exacto «No se pudo procesar el pago» y sin datos sensibles.
  - **Dependencias:** T002-11 y contratos 001/003/006/007/010. [RF-17–RF-22]

- [ ] **T002-14 — Implementar verificación y reconciliación técnica.** → **PARCIAL**: existe consulta de pago y reconciliación técnica básica, pero no un programador persistente de verificación de desconocidos.
  - **Entregable:** consulta oficial recuperable de intentos desconocidos con programación persistente y límites definidos para operación.
  - **Aceptación:** timeout no rechaza; bloquea nuevo intento/cancelación; resolución válida antes de 20 aplica sus reglas y desde 20 nunca confirma; no ampliar ventanas por cola/reintento.
  - **Dependencias:** T002-03/T002-06/T002-11/T002-13 y 003. [RF-23–RF-30]

- [ ] **T002-15 — Aplicar cobros tardíos, excedentes y observados.** → **PARCIAL**: hay casos de devolución y cobro externo, pero no flujo de pago observado ni clasificación de excedentes con pruebas.
  - **Entregable:** clasificación y creación idempotente de casos de devolución sobre el cobro real.
  - **Aceptación:** no reactivar cancelada ni duplicar confirmación; un importe/moneda distintos no confirma ni habilita otro cobro; observado conserva `pending` e inventario hasta 20 y bloquea cancelación voluntaria.
  - **Dependencias:** T002-11/T002-12/T002-14 y 003/004/009/010. [RF-31–RF-36, RF-47, RF-52–RF-59/RF-65]

## Fase 3 — Devoluciones, notificaciones y auditoría

- [ ] **T002-16 — Implementar casos y calendario hábil Perú.** → **PARCIAL**: existen casos de devolución (`RefundCase.cs`), pero no calendario hábil peruano ni vencimiento persistido por día hábil.
  - **Entregable:** detección, motivo, vencimiento persistido, calendario nacional verificable y consulta de casos abiertos/vencidos.
  - **Aceptación:** pruebas de detección en viernes, fin de semana, feriado y cambio de año; no reiniciar detección por reintento ni prometer abono en un día. Validar la convención técnica de conservar hora local del plan.
  - **Dependencias:** T002-07/T002-15 y fuentes oficiales de calendario. [RF-36–RF-38/RF-44/RF-70]

- [x] **T002-17 — Implementar autorización y envío de devolución.** → **HECHO**: `RefundHandlers.cs` + `AdminRefundEndpoints.cs` con autorización admin e idempotencia; prueba `Phase6IntegrationsTests.Refunds_AndCulqiWebhook_ShouldWorkEndToEnd`.
  - **Entregable:** comando administrativo que persiste autorización e intención antes de llamar al proveedor, después de cancelación local válida cuando corresponda.
  - **Aceptación:** sin admin no se envía; doble clic/job no duplica; registrar fecha/importe/referencia/observación, sin adjunto obligatorio; integrar caso de 009 sin bloquear liberación por el abono externo.
  - **Dependencias:** T002-04/T002-05/T002-06/T002-08/T002-16 y 009. [RF-39–RF-42/RF-46/RF-47/RF-56/RF-65]

- [ ] **T002-18 — Resolver desconocidos y proteger el importe devuelto.** → **PARCIAL**: la máquina de estados impide repetir una devolución completada, pero la verificación oficial de desconocidos no existe.
  - **Entregable:** verificación oficial antes de reintento y exclusión por cobro con importes ejecutados/en curso.
  - **Aceptación:** desconocido no dispara otro envío; éxito previo se registra sin repetir; solo rechazo/no ejecución verificados permiten reintento autorizado; dos operaciones concurrentes nunca exceden el cobro.
  - **Dependencias:** T002-04/T002-05/T002-06/T002-17. [RF-43–RF-45/RF-66–RF-70]

- [x] **T002-19 — Integrar entrega persistida de comprobantes/avisos.** → **HECHO**: outbox de notificaciones deduplicado en `Features/Notifications/`; prueba `Phase6IntegrationsTests.Notifications_OutboxResendWebhookIncidentsAndManualResend_ShouldWork`.
  - **Entregable:** intención durable deduplicada y contrato con base/complemento de 004; fallos/reintentos separados del resultado financiero.
  - **Aceptación:** un evento repetido no duplica aviso confirmado; fase de devolución distinta no se pierde como si fuese duplicado; fallo de correo no revierte pago/cancelación; no se promete abono ni se incluye información ajena.
  - **Dependencias:** T002-12/T002-15/T002-17/T002-18 y contratos técnicos de 004. [RF-13/RF-16/RF-34/RF-42/RF-43/RF-48/RF-54/RF-70]

- [x] **T002-20 — Integrar auditoría, recuperación e incidentes.** → **HECHO**: auditoría y recuperación vía `PendingAuditEntry`; pruebas `ReservationPaymentAuditTests.StartPayment_WhenAuditFailsAfterGatewayApproval_ShouldPreservePaymentResult` y `AdminReportsAndAuditRecoveryTests.PendingAuditRecovery_AfterPaymentAuditFailure_ShouldRecoverToAuditLog`.
  - **Entregable:** registros anexados y recuperación de evidencia de pagos/devoluciones con correlación y fechas originales.
  - **Aceptación:** cambio aún controlable sin auditoría no se aplica; cobro ya realizado conserva realidad sin repetición; fallos persistentes alertan y quedan consultables aun con correo caído, sin recursión ni secretos.
  - **Dependencias:** T002-06/T002-12/T002-17/T002-18/T002-19 y 004-C/010. [RF-6/RF-16/RF-41/RF-46/RF-48–RF-51]

## Fase 4 — Consultas, presentación y HTTP

- [x] **T002-21 — Exponer consultas de seguimiento autorizadas.** → **HECHO**: `GetPaymentQuery.cs` y DTO de reserva exponen estado/plazos sin datos sensibles; prueba `Phase6IntegrationsTests.Refunds_AndCulqiWebhook_ShouldWorkEndToEnd`.
  - **Entregable:** DTO de estado de reserva/pago/caso, plazos originales y hora de servidor, con referencias no sensibles.
  - **Aceptación:** propietario o admin según operación; no transferir entidades, secretos o importes del catálogo actual; no permitir al cliente mutar estado financiero.
  - **Dependencias:** T002-08/T002-12–T002-20. [RF-2/RF-3/RF-24/RF-44/RF-49–RF-51/RF-55/RF-60–RF-64]

- [ ] **T002-22 — Presentar contador y cortes de pago.** → **PARCIAL**: `frontend/src/components/ui/CountdownBadge.tsx` y `pages/CheckoutPage.tsx` existen; sin prueba E2E del contador.
  - **Entregable:** tiempo restante y corte exacto en detalle de reserva y pantalla de pago, resincronizados con servidor.
  - **Aceptación:** al cero detener/deshabilitar y mostrar «Plazo de pago vencido»; abrir después de 15 no muestra contador activo; no mostrar tolerancia como tiempo para pagar ni usar reloj local como autoridad.
  - **Dependencias:** T002-21. [RF-60–RF-64]

- [ ] **T002-23 — Integrar checkout y estados visibles.** → **PARCIAL**: `frontend/src/pages/CheckoutPage.tsx` integra estados y pago; sin prueba E2E del checkout.
  - **Entregable:** tarjeta/Yape elegibles con configuración restringida y presentación segura de rechazo/verificación/observación.
  - **Aceptación:** no cuotas/otros medios ni logs de token/código; timeout muestra «pago en verificación», no rechazo; el cliente no ve confirmación hasta que backend la emita; renovar código no reabre plazos.
  - **Dependencias:** T002-02/T002-10/T002-13/T002-14/T002-15/T002-21/T002-22. [RF-4/RF-5/RF-20–RF-26/RF-54/RF-55/RF-57–RF-64]

- [ ] **T002-24 — Presentar gestión administrativa de devoluciones.** → **PARCIAL**: `frontend/src/pages/admin/AdminReservationsPage.tsx` lista y opera devoluciones; sin prueba de esa pantalla.
  - **Entregable:** casos abiertos/vencidos, autorización, verificación, resultado y evidencia, sin botón para confirmar reservas manualmente.
  - **Aceptación:** estado desconocido no ofrece un nuevo envío a ciegas; devuelta no reenvía; distinguir gestión/ejecución de abono; solo admin según autorización actual.
  - **Dependencias:** T002-16–T002-21 y 005/009/010. [RF-15/RF-36–RF-46/RF-50/RF-65–RF-70]

- [ ] **T002-25 — Publicar y probar OpenAPI/ProblemDetails.** → **PARCIAL**: OpenAPI y ProblemDetails publicados y probados (`ContractSliceTests`), pero el contrato de eventos del proveedor no es el oficial.
  - **Entregable:** contratos versionados de inicio/consulta, recepción externa y devolución, mapeos de errores, autenticación y límites de entrada configurados.
  - **Aceptación:** rutas/cuerpos no expongan cambio libre de estado; propiedad/rol/plazos no dependan de UI; acuses de eventos correspondan al contrato de T002-03.
  - **Dependencias:** T002-01/T002-03/T002-08/T002-21/T002-24. [RF-1/RF-2/RF-9/RF-11/RF-15/RF-40/RF-50]

## Fase 5 — Pruebas y puertas de cierre
- [ ] **T002-26 — Pruebas unitarias y de Application.** → **PARCIAL**: hay pruebas de dominio/integración de pagos y devoluciones, pero no una suite que trace los 70 criterios.
  - **Entregable:** casos deterministas de los 70 criterios con reloj/actor/proveedor controlados.
  - **Aceptación:** estados, snapshots, ventanas, mensajes, desconocidos, observados, calendario, autorizaciones y clasificación de devoluciones cubiertos; no declarar garantías externas por el éxito de dobles.
  - **Dependencias:** T002-09–T002-25. [RF-1–RF-70]

- [x] **T002-27 — Pruebas PostgreSQL de concurrencia/rollback.** → **HECHO**: `IdempotencySliceTests` y `Phase6IntegrationsTests` ejercen concurrencia/replay contra PostgreSQL.
  - **Entregable:** ejecución concurrente real de pago/cancelación/vencimiento, canales de resultado y devolución por cobro.
  - **Aceptación:** un único efecto local, sin retenciones/liberaciones parciales, sin doble pago lógico/aviso y sin exceder devolución; comprobar recuperación tras conflicto/deadlock.
  - **Dependencias:** T002-05/T002-07/T002-12–T002-20 y módulos integrados. [RF-8–RF-19/RF-25–RF-35/RF-45/RF-57–RF-59/RF-65–RF-69]

- [ ] **T002-28 — Pruebas contractuales del proveedor en test.** → **PENDIENTE**: no hay entorno de pruebas de Culqi ni evidencia contractual del proveedor.
  - **Entregable:** evidencia saneada de tarjeta/Yape, autenticidad, consultas, errores, devolución total y comisiones del comercio.
  - **Aceptación:** cerrar G-01–G-05 con resultados reproducibles y sin cargos live ni secretos en evidencias; incompatibilidad mantiene la puerta cerrada.
  - **Dependencias:** T002-02–T002-04/T002-10/T002-11/T002-17/T002-18 y entorno test autorizado. [RF-4/RF-7/RF-11–RF-13/RF-23/RF-27/RF-39–RF-47/RF-66–RF-70]

- [x] **T002-29 — Pruebas de seguridad y arquitectura.** → **HECHO**: `CleanArchitectureTests` y pruebas de aislamiento/errores sin secretos (`ContractSliceTests.CT11`).
  - **Entregable:** aislamiento/rol/verificación, eventos manipulados, ausencia de secretos y dependencias Clean Architecture.
  - **Aceptación:** inspección de almacenamiento/logs/respuestas/artefactos sin PAN/CVV/tokens/código Yape; Domain independiente y sin acceso directo entre repositorios de módulos; sin tecnologías fuera de constitución.
  - **Dependencias:** T002-08/T002-20/T002-25 y arquitectura integrada. [RF-2/RF-7/RF-11/RF-15/RF-22/RF-49/RF-50]

- [ ] **T002-30 — Pruebas de interfaz/E2E de los flujos autorizados.** → **PARCIAL**: hay pantallas de checkout/admin y pruebas en `frontend/src/test/app.test.tsx`, pero no E2E de los flujos de pago.
  - **Entregable:** evidencia de pago, rechazo, verificación, observado, vencimiento y gestión de devolución en interfaz conectada a API.
  - **Aceptación:** mensajes exactos, contador/servidor, restricciones de medios, estado real y reservas propias; no sustituir esta evidencia por pruebas de componentes aislados.
  - **Dependencias:** T002-21–T002-25 y entorno integrado. [RF-20–RF-26/RF-38/RF-44/RF-54/RF-55/RF-60–RF-64/RF-70]

- [ ] **T002-31 — Pruebas de caída/recuperación y límites temporales.** → **PARCIAL**: hay pruebas de fallo de auditoría y de pago en curso, pero no inyección de caída del proveedor/commit.
  - **Entregable:** fallos inyectados antes/después del efecto externo y commit; reinicios y reloj controlado; auditoría/correo caídos juntos.
  - **Aceptación:** recuperar sin repetir dinero; no confirmar por validación desde 20 ni por job demorado; medir integración con cancelación/liberación en máximo 60 segundos de 003 sin añadir tolerancia comercial; no marcar evidencia ausente como éxito.
  - **Dependencias:** T002-06/T002-14/T002-18–T002-20/T002-27/T002-28 y 003/004-C/010. [RF-8/RF-9/RF-16/RF-19/RF-23–RF-32/RF-43/RF-48/RF-57–RF-59/RF-66–RF-69]

- [ ] **T002-32 — Cerrar cobertura y preparar revisión de habilitación.** → **PENDIENTE**: no existe matriz RF-1–RF-70 ni revisión de puertas G-01–G-05 con evidencia real.
  - **Entregable:** matriz RF→implementación→prueba→resultado, contratos y registro de puertas técnicas con evidencia.
  - **Aceptación:** RF-1–RF-70 sin huecos, G-01–G-05 y contratos reales validados, sin tareas cerradas por mera redacción; pase a producción y credenciales live requieren autorización distinta. Mantener planes/specs protegidos intactos.
  - **Dependencias:** T002-01–T002-31 y autorización correspondiente. [RF-1–RF-70; AC04/AC07/AC09/AC11]

## Matriz de cobertura funcional

Todos los criterios quedan asociados a trabajo y prueba futura; la tabla no afirma que estén implementados.

| Criterios 002 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-9 | T002-02/T002-07–T002-10 | T002-26/T002-27/T002-28/T002-29 |
| RF-10–RF-16 | T002-03/T002-11/T002-12/T002-20 | T002-26–T002-29/T002-31 |
| RF-17–RF-23 | T002-10/T002-13/T002-14/T002-23 | T002-26–T002-31 |
| RF-24–RF-30 | T002-14/T002-21/T002-23 | T002-26/T002-27/T002-30/T002-31 |
| RF-31–RF-35 | T002-05/T002-15/T002-19 | T002-26/T002-27/T002-31 |
| RF-36–RF-38 | T002-15/T002-16/T002-24 | T002-26/T002-30 |
| RF-39–RF-42 | T002-04/T002-17/T002-19/T002-24 | T002-26/T002-28/T002-30 |
| RF-43–RF-47 | T002-17/T002-18/T002-20/T002-24 | T002-26–T002-28/T002-31 |
| RF-48–RF-51 | T002-07/T002-08/T002-11/T002-20/T002-21 | T002-26/T002-28/T002-29/T002-31 |
| RF-52–RF-59 | T002-15/T002-17/T002-21/T002-23 | T002-26/T002-27/T002-30/T002-31 |
| RF-60–RF-64 | T002-21/T002-22/T002-23 | T002-26/T002-30 |
| RF-65–RF-70 | T002-04/T002-15–T002-19/T002-24 | T002-26–T002-28/T002-30/T002-31 |

**Ninguna tarea está ejecutada.** Los detalles no comprobados del proveedor permanecen como bloqueos técnicos con dueño y evidencia requerida, no como autorización para ignorar la spec aprobada.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 11 |
| PARCIAL (entrega incompleta o sin prueba) | 18 |
| PENDIENTE (sin evidencia) | 3 |
| **Total** | **32** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
