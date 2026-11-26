# Tareas — Spec 003: Vencimiento y liberación automática

> **Fecha:** 2026-11-01.  
> **Base:** [spec v0.1 aprobada](spec.md), 20 criterios, DEC-134; [plan técnico v0.1](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  
> **Regla:** no ejecutar sin autorización posterior para código; V-01–V-05 son puertas del plan. No editar specs ni planes previos para cerrar dependencias.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Contratos, tiempo y diseño de garantías

- [ ] **T003-01 — Validar contratos y plataforma.** → **PARCIAL**: contratos y reloj existen, pero no se verificó Hangfire: el proyecto no referencia el paquete (0 coincidencias) y usa `BackgroundService`.
  - **Entregable:** matriz de 20 criterios y contrato de reserva, intento vigente, reloj, retenciones, transacción, auditoría/aviso e incidentes; versiones/almacenamiento Hangfire verificados.
  - **Aceptación:** mapear las dependencias aprobadas frente a integración real; no acceso directo a repositorios ajenos ni nuevos permisos de cancelación `pending`; registrar V-01/V-02 abiertas hasta evidencia.
  - **Dependencias:** autorización futura y specs 001/002/004+complemento/005/006/007/009/010.

- [x] **T003-02 — Diseñar evaluación temporal única.** → **HECHO**: regla temporal en `Domain/Modules/Reservations/Reservation.cs`; pruebas `ReservationExpiryDomainTests.IsExpiredAt_ShouldRespect15And20MinuteDeadlines` y `ConfirmPayment_AtOrAfterValidationDeadline_ShouldThrow`.
  - **Entregable:** regla determinista de corte aplicable con plazos originales, reloj confiable y estado protegido del intento.
  - **Aceptación:** distinguir intento vigente, rechazado antes de 15, verificación y observado; cortes exactos excluyen nuevo pago/confirmación; cambios de configuración no reinician reservas existentes.
  - **Dependencias:** T003-01. [RF-1–RF-6/RF-15/RF-17/RF-19/RF-20]

- [x] **T003-03 — Definir transacción, bloqueo y marcas idempotentes.** → **HECHO**: cancelación/liberación idempotente en `Reservation.cs` y `ReservationRepository.cs`; prueba `TryCancelByExpiry_ShouldBeIdempotentAndIgnoreConfirmed`.
  - **Entregable:** protocolo compatible con 001/002 para estado, liberaciones, auditoría e intención de aviso.
  - **Aceptación:** orden de adquisición compartido, marcas únicas por compromiso y diseño de rollback sin llamadas HTTP externas bajo locks; jobs duplicados no duplican efectos.
  - **Dependencias:** T003-01/T003-02. [RF-6–RF-9/RF-13/RF-16/RF-17]

- [ ] **T003-04 — Diseñar programación compatible con 60 segundos.** → **PARCIAL**: `ReservationExpiryWorker.cs` sondea cada 30 s (clamp 5–60 s), no hay jobs diferidos ni barrido de huérfanas.
  - **Entregable:** diferidos por cortes de cada reserva, intención durable, barrido de reparación y recuperación al arrancar.
  - **Aceptación:** no usar cron de un minuto como única garantía; validar configuración de sondeo propuesta de 5 segundos y presupuesto de cola/transacción del plan con el paquete elegido.
  - **Dependencias:** T003-01/T003-02. [RF-1–RF-5/RF-10/RF-15]

- [ ] **T003-05 — Definir retry y escalamiento técnicos.** → **PARCIAL**: el ciclo se repite por sondeo, pero no existe política 5/10/20 s ni escalamiento a incidentes.
  - **Entregable:** política única de hasta 3 reintentos rápidos por ciclo (5/10/20 segundos), reevaluación degradada de 60 segundos y umbral de incidente del plan.
  - **Aceptación:** no duplicar cadenas con defaults de Hangfire; agotar el ciclo no abandona la reserva; escalar por fallo persistente o retraso detectado sin extender los cortes de negocio.
  - **Dependencias:** T003-01/T003-04. [RF-10–RF-14]

## Fase 1 — Persistencia y comando local

- [x] **T003-06 — Modelar persistencia e índices operativos.** → **HECHO**: estado y marcas de liberación en `Reservation`/`ReservationHold` con migraciones y configuración EF.
  - **Entregable:** intenciones de programación, referencias únicas de ejecución/liberación e incidentes, con UTC y consultas de pendientes por corte.
  - **Aceptación:** no nuevos estados de reserva, no sobrescritura de snapshots y no secretos en argumentos/payloads; registrar la diferencia entre estado de job y negocio.
  - **Dependencias:** T003-01/T003-03/T003-04/T003-05. [RF-7–RF-9/RF-13–RF-16/RF-20]

- [x] **T003-07 — Implementar selección de reservas candidatas.** → **HECHO**: `ProcessExpiredReservationsCommand.cs` selecciona pendientes por corte y revalida al ejecutar.
  - **Entregable:** lector paginado/lotes de reservas pendientes e intenciones recuperables según corte aplicable.
  - **Aceptación:** no cargar indiscriminadamente todo el historial; no modificar terminales; revalidar elegibilidad al ejecutar aunque la lista de candidatas sea anterior.
  - **Dependencias:** T003-02/T003-06. [RF-1–RF-6/RF-15]

- [x] **T003-08 — Implementar coordinador de vencimiento protegido.** → **HECHO**: `ProcessExpiredReservationsCommand.cs` coordina transición, liberación, auditoría y aviso en una transacción.
  - **Entregable:** comando común que revalida estado/tiempo y coordina transición, puertos de liberación, auditoría e intención de aviso en commit conjunto.
  - **Aceptación:** fallo local revierte el conjunto; no confirmar pago, invocar reembolso ni introducir `expired`/`processing`; recepción repetida reconoce un resultado ya aplicado.
  - **Dependencias:** T003-02/T003-03/T003-06/T003-07. [RF-1–RF-10/RF-13/RF-16/RF-19/RF-20]

- [x] **T003-09 — Integrar liberación turística.** → **HECHO**: liberación turística en `ReservationHold`; prueba `ReservationExpiryTests.Expiry_WithoutPayment_ShouldCancelReleaseOnceAndAuditSystemAction`.
  - **Entregable:** contrato real con Reservations/Catalog para liberar solo el compromiso turístico de la reserva.
  - **Aceptación:** reserva con varias personas devuelve exactamente esos cupos una vez; repetir no aumenta capacidad total ni libera compromisos ajenos.
  - **Dependencias:** T003-03/T003-08 y contratos 001/006. [RF-7/RF-9/RF-16]

- [x] **T003-10 — Integrar liberación hotelera.** → **HECHO**: liberación hotelera en `ReservationLodgingSnapshot`/inventario; prueba `HotelAndLodgingReservationTests.HotelLodgingEndToEnd_ShouldHoldProtectAndReleaseRoomsAtomically`.
  - **Entregable:** liberación del compromiso del hotel/tipo/período histórico dentro de la transacción común.
  - **Aceptación:** liberar todas las fechas comprometidas sin parcialidad ni duplicar inventario por salida; reserva sin hotel no produce efecto hotelero.
  - **Dependencias:** T003-03/T003-08/T003-09 y 007. [RF-8/RF-9/RF-16]

- [x] **T003-11 — Integrar competencia con pago/rechazo/cancelación.** → **HECHO**: competencia pago/vencimiento; prueba `ReservationExpiryTests.Expiry_WithTimelyPaymentInProgress_ShouldWaitUntil20Minutes`.
  - **Entregable:** invocación común con 001/002 y protocolo de exclusión por reserva.
  - **Aceptación:** confirmación válida ya aplicada se respeta; validación desde 20 no confirma aunque el job tarde; rechazo definitivo en minuto 18 cancela/libera sin esperar al job de 20; cobro tardío solo va al flujo de 002.
  - **Dependencias:** T003-02/T003-08–T003-10 y contratos 001/002. [RF-3–RF-6/RF-9/RF-17/RF-19]

## Fase 2 — Hangfire, recuperación, auditoría y alerta

- [ ] **T003-12 — Integrar registro/ejecución persistente de jobs.** → **PARCIAL**: existe worker periódico (`ReservationExpiryWorker.cs`), pero no registro persistente de jobs ni recuperación de huérfanas.
  - **Entregable:** dispatcher de intenciones, jobs diferidos de cortes originales, barrido de huérfanas y recuperación al inicio.
  - **Aceptación:** una caída entre commit de reserva y registro del job no pierde el vencimiento; un doble job no duplica liberación; ningún reencolado reinicia 15/20 minutos.
  - **Dependencias:** T003-04/T003-06/T003-07/T003-08/T003-11. [RF-1–RF-10/RF-15]

- [ ] **T003-13 — Integrar retry y supervisor de incidentes.** → **PENDIENTE**: no hay política de reintentos ni supervisor de incidentes para vencimiento.
  - **Entregable:** política del plan con contadores persistidos, ciclo rápido y reevaluación degradada sin cadenas paralelas ilimitadas.
  - **Aceptación:** ante fallo persistente conservar `pending` y compromisos reales, bloquear por corte nuevos pagos/confirmación y no marcar liberación completa; conservar el retraso respecto del corte original.
  - **Dependencias:** T003-05/T003-08/T003-12. [RF-10–RF-12/RF-14]

- [x] **T003-14 — Integrar auditoría y evidencia recuperable.** → **HECHO**: auditoría `reservation.auto_cancelled` con actor sistema; prueba `Expiry_WithoutPayment_ShouldCancelReleaseOnceAndAuditSystemAction`.
  - **Entregable:** registro anexado de `reservation.auto_cancelled`, fallos/reintentos/alertas, actor sistema, corte, fechas y correlación.
  - **Aceptación:** no repetir auditoría de una cancelación aplicada ni inventar intentos no conservados; conservar evidencia cuando falle el destino de auditoría y completar su recuperación sin falsificar fechas.
  - **Dependencias:** T003-06/T003-08/T003-13 y 010/complemento 004. [RF-9/RF-13/RF-14/RF-16]

- [ ] **T003-15 — Integrar alerta y consulta operativa.** → **PARCIAL**: existen `NotificationIncident` y endpoints admin de notificaciones, pero no alerta específica de vencimiento fallido.
  - **Entregable:** aviso de fallo persistente por 004 con incidente consultable autorizado y deduplicación por reserva/corte.
  - **Aceptación:** correo fallido no borra el incidente ni genera recursión; no avisos idénticos por cada sondeo; recuperación no reabre la reserva ni habilita cancelar `pending` manualmente.
  - **Dependencias:** T003-13/T003-14 y 004/005/009/010. [RF-11/RF-12/RF-14]

- [x] **T003-16 — Integrar estado visible y no prórroga.** → **HECHO**: el estado `cancelled` se proyecta y no hay prórroga; prueba `Expiry_WithTimelyPaymentInProgress_ShouldWaitUntil20Minutes`.
  - **Entregable:** proyección/contrato para consulta de 001 y seguimiento de 002, sin una API pública nueva de vencimiento.
  - **Aceptación:** cancelación confirmada se muestra `cancelled`; fallo persistente sigue `pending` sin pago/confirmación fuera de corte; no presentar «liberado» sin commit ni ocultar la excepción con un estado inventado.
  - **Dependencias:** T003-08–T003-15 y contratos 001/002. [RF-5/RF-6/RF-12/RF-18–RF-20]

- [ ] **T003-17 — Proteger operación y Dashboard.** → **PENDIENTE**: no existe dashboard operativo ni panel de jobs que proteger.
  - **Entregable:** autenticación/autorización administrativa del Dashboard y parámetros operativos seguros.
  - **Aceptación:** un cliente no dispara/reconfigura jobs ni cambia estados; reintento operativo invoca el mismo comando; no se aceptan credenciales o roles en argumentos serializados.
  - **Dependencias:** T003-04/T003-15/T003-16 y 005; sin nuevas facultades administrativas. [RF-6/RF-12/RF-20; RS03]

## Fase 3 — Pruebas y cierre
- [x] **T003-18 — Pruebas de dominio/Application con reloj controlado.** → **HECHO**: `ReservationExpiryDomainTests` cubre cortes exactos, terminales y configuración preservada.
  - **Entregable:** suite para los 20 criterios con dobles explícitamente limitados al dominio/casos de uso.
  - **Aceptación:** probar cada corte exacto, configuración preservada, intento rechazado/vigente/observado, terminales, eventos, estados y fallo persistente; sin afirmar latencia de Hangfire por estas pruebas.
  - **Dependencias:** T003-02/T003-08–T003-16. [RF-1–RF-20]

- [x] **T003-19 — Pruebas PostgreSQL de concurrencia e idempotencia.** → **HECHO**: `ReservationExpiryTests` ejercita PostgreSQL real con pago en curso y cancelación única.
  - **Entregable:** escenarios reales multiworker y fallo en cada paso de cancelación/liberación/auditoría.
  - **Aceptación:** no cambios parciales, no doble devolución de cupos/habitaciones, no dos resultados incompatibles de pago/vencimiento y terminales intactas; comprobar anomalías sin reparación manual no autorizada.
  - **Dependencias:** T003-03/T003-08–T003-14 y módulos integrados. [RF-1–RF-9/RF-13/RF-16/RF-17/RF-19/RF-20]

- [ ] **T003-20 — Medir el máximo de 60 segundos extremo a extremo.** → **PENDIENTE**: no existe medición extremo a extremo del máximo de 60 s.
  - **Entregable:** pruebas con Hangfire/storage PostgreSQL/colas reales, carga definida y reserva simple/compuesta.
  - **Aceptación:** medir corte hasta commit completo, no solo handler ni promedio; todas las muestras del escenario normal definido dentro de 60 segundos. Si se supera, V-03 sigue bloqueada y no se relaja el umbral.
  - **Dependencias:** T003-04/T003-05/T003-12/T003-13/T003-19. [RF-2/RF-4/RF-7/RF-8/RF-10]

- [ ] **T003-21 — Pruebas de caída/reinicio y recuperación degradada.** → **PENDIENTE**: no hay pruebas de caída/reinicio ni recuperación degradada.
  - **Entregable:** fallos antes/después del commit y entrega del job, proceso suspendido y destinos auditoría/correo caídos.
  - **Aceptación:** recuperar trabajos sin nueva ventana, reintentar sin abandono al agotar el ciclo rápido, mantener incidente y estado real, y no fabricar una liberación o alerta puntual inexistente durante una caída total.
  - **Dependencias:** T003-12–T003-15/T003-19/T003-20. [RF-9–RF-16/RF-19/RF-20]

- [ ] **T003-22 — Pruebas de contrato, autorización y presentación.** → **PARCIAL**: hay pruebas de contrato generales (`ContractSliceTests`) y del flujo de vencimiento, pero no la matriz de autorización/presentación de 003.
  - **Entregable:** integración de 001/002/004/005/009/010 con sus contratos reales y controles de acceso.
  - **Aceptación:** estado mostrado consistente con commit; job tardío no habilita pago; alertas solo para administradores; no ruta libre de cambio de estado ni cancelación admin de `pending`. No enviar dinero real para estas pruebas.
  - **Dependencias:** T003-11/T003-15–T003-18. [RF-5/RF-6/RF-12/RF-13/RF-14/RF-17–RF-20]

- [ ] **T003-23 — Validar capacidad, observabilidad y despliegue activo.** → **PENDIENTE**: no hay evidencia de backlog, espera, host/storage ni observabilidad de jobs.
  - **Entregable:** evidencia de backlog, espera en cola, duración de transacción, retraso desde corte, intentos y host/storage activos.
  - **Aceptación:** parámetros propuestos contrastados con versiones/entorno, Dashboard protegido y recuperación con múltiples instancias; no atribuir 60 segundos garantizados a un host suspendido ni alterar ventanas para absorber demora.
  - **Dependencias:** T003-17/T003-20–T003-22. [RF-10–RF-14/RF-15; AC02/AC07/AC09]

- [ ] **T003-24 — Cerrar cobertura y revisar puertas de habilitación.** → **PENDIENTE**: no existe matriz RF-1–RF-20 ni revisión de puertas V-01–V-05.
  - **Entregable:** matriz RF→implementación→prueba→resultado y estado verificable de V-01–V-05.
  - **Aceptación:** 20 criterios sin huecos, evidencia real de transacción/tiempo/recuperación y autorización correspondiente; ninguna tarea cerrada por redacción o pruebas con dobles cuando se exige integración.
  - **Dependencias:** T003-01–T003-23. [RF-1–RF-20]

## Matriz de cobertura funcional

La cobertura documental no demuestra implementación ni ejecución de pruebas.

| Criterios 003 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-5 | T003-02/T003-04/T003-07/T003-08/T003-11/T003-12 | T003-18–T003-22 |
| RF-6 | T003-07/T003-08/T003-11/T003-16 | T003-18/T003-19/T003-22 |
| RF-7–RF-9 | T003-03/T003-08–T003-10/T003-12/T003-14 | T003-18–T003-21 |
| RF-10 | T003-04/T003-05/T003-12/T003-13 | T003-20/T003-21/T003-23 |
| RF-11–RF-12 | T003-05/T003-13/T003-15/T003-16 | T003-18/T003-21/T003-22/T003-23 |
| RF-13–RF-14 | T003-06/T003-08/T003-13/T003-14/T003-15 | T003-18/T003-19/T003-21/T003-22 |
| RF-15–RF-16 | T003-02/T003-06/T003-09/T003-10/T003-12/T003-14 | T003-18/T003-19/T003-21/T003-23 |
| RF-17 | T003-02/T003-08/T003-11 | T003-18/T003-19/T003-22 |
| RF-18–RF-20 | T003-08/T003-11/T003-16/T003-17 | T003-18/T003-19/T003-21/T003-22 |

**Auditoría: 12 HECHO, 6 PARCIAL, 6 PENDIENTE.** No se ejecutan jobs, alteran reservas, crean credenciales ni modifican documentos protegidos en esta actividad.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 12 |
| PARCIAL (entrega incompleta o sin prueba) | 6 |
| PENDIENTE (sin evidencia) | 6 |
| **Total** | **24** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
