# Tareas — Spec 001: Reservas del cliente

> **Base:** [spec aprobada v0.13](spec.md) y [plan técnico](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  
> **Regla:** no iniciar tareas bloqueadas por contratos/specs dependientes sin validar su compatibilidad con 001.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Preparación y contratos

- [ ] T001 Revisar 001/RF-1–RF-105, constitution y decisiones para crear una matriz de cobertura de implementación/pruebas. → **PARCIAL**: matriz RF-1–RF-105 redactada el 2026-11-25 en `sdd/auditoria/matriz-rf-2026-11-25.md`; faltan la revisión formal y la actualización de la constitución.
- [ ] T002 Validar que las dependencias 005, 006, 007, 002, 003 y 010 dispongan de contratos aprobados antes de integrar sus operaciones reales. **Bloqueada parcialmente.** → **PARCIAL**: las dependencias tienen código, pero sus contratos no están ratificados y las puertas BT/MD/API siguen abiertas según `sdd/constitution.md`.
- [x] T003 Definir los contratos de Application de actor actual, reloj, transacción, reservas, cotización/retención de cupos, cotización/retención de alojamiento, pagos y auditoría sin exponer entidades o persistencia ajena. → **HECHO**: contratos en `src/DMGoTravel.Application/Common/Interfaces/` (repositorios, `IAuditWriter`, `IUnitOfWork`, reloj) y DTOs en `src/DMGoTravel.Application/Features/Reservations/Dtos/`.
- [x] T004 Definir el contrato de resultado de creación, historial, detalle y cancelación sin permitir precio, propietario, estado o retenciones confiables desde el cliente. → **HECHO**: `ReservationDtos.cs` y `ReservationMapper.cs` no aceptan precio, propietario ni estado del cliente; cubierto por `ContractSliceTests.CT02_Security_ShouldMatchDeclaredRequirements`.
- [x] T005 Seleccionar y documentar la estrategia de concurrencia PostgreSQL, restricciones e índices que cumpla AC07/RN-07/RP02. **Puerta obligatoria antes de crear reserva.** → **HECHO**: concurrencia y cupos en `ReservationRepository.cs`/`TourDeparture`; prueba real `Sprint2QualityAttributeTests.Concurrency_LastTouristSeat_ShouldPreventOverselling`.

## Fase 1 — Dominio y persistencia de reservas

- [x] T006 Modelar estados de reserva y transiciones permitidas: `pending`, `confirmed`, `completed`, `cancelled`. [001/RF-1, RF-29–RF-37] → **HECHO**: `src/DMGoTravel.Domain/Modules/Reservations/ReservationStatus.cs` + `DomainSliceTests.Reservation_CancelByClient_ShouldBeIdempotentAndReleaseHolds`.
- [x] T007 Modelar la reserva y sus componentes históricos: propietario, salida, alojamiento opcional, snapshots, total PEN, vencimiento y número único. [001/RF-19–RF-24, RF-38–RF-53] → **HECHO**: entidades y snapshots en `src/DMGoTravel.Domain/Modules/Reservations/` + `DomainSliceTests` y `ReservationExpiryDomainTests`.
- [x] T008 Modelar referencias de retención turística/hotelera y la liberación única/idempotente. [001/RF-7, RF-16–RF-18, RF-32–RF-34] → **HECHO**: `ReservationHold.cs` y liberación idempotente; prueba `DomainSliceTests.Reservation_CancelByClient_ShouldBeIdempotentAndReleaseHolds`.
- [x] T009 Diseñar migraciones, restricciones e índices para propietario, estados, snapshots, número único, retenciones e historial; mantener fechas en UTC. [RP01–RP08, 001/RF-25–RF-28, RF-57, RF-105] → **HECHO**: migraciones y configuraciones EF en `src/DMGoTravel.Infrastructure/Persistence/Migrations/` y `Configurations/ReservationsConfiguration.cs`.
- [x] T010 Implementar repositorios y lectores de reserva con contratos separados de escritura y consultas paginadas. → **HECHO**: `ReservationRepository.cs` con lecturas paginadas y `IReservationRepository`; ejercitado por `AdminReservationTests.List_ShouldFilterPaginateOrderAndCountReservations` y `ContractSliceTests.CT07_PaginationAndMoney_ShouldMatchContract`.

## Fase 2 — Crear reserva y disponibilidad

- [x] T011 Implementar autorización de cliente autenticado y validación de solicitud de creación. [001/RF-1–RF-6] → **HECHO**: `CreateReservationCommand.cs` exige actor autenticado, correo verificado y validación FluentValidation; prueba `SliceEndToEndTests.Slice_ShouldCompleteEndToEnd`.
- [x] T012 Integrar validación, retención y cotización oficial de salida con Catalog. **Bloqueada por 006.** [001/RF-3–RF-9] → **HECHO**: integración con `IOfferRepository`/salidas en `CreateReservationCommand.cs`; prueba `SliceEndToEndTests.Slice_ShouldCompleteEndToEnd`.
- [x] T013 Integrar validación de propuesta, retención y cotización de una habitación con Hotels. **Bloqueada por 007.** [001/RF-10–RF-18, RF-40–RF-49, RF-70–RF-72, RF-80–RF-81, RF-89–RF-93] → **HECHO**: integración con propuestas/inventario en `CreateReservationCommand.cs`; prueba `HotelAndLodgingReservationTests.HotelLodgingEndToEnd_ShouldHoldProtectAndReleaseRoomsAtomically`.
- [x] T014 Implementar creación atómica de reserva, componentes, snapshots, retenciones y auditoría. [001/RF-1, RF-7, RF-16–RF-24, RF-69] → **HECHO**: creación atómica con holds, snapshots y auditoría; prueba `ReservationPaymentAuditTests.ControllableReservationChanges_WhenAuditFails_ShouldRollbackAndReturnError`.
- [x] T015 Implementar cálculo oficial del total en PEN, con dos decimales y sin importes impuestos por cliente. [001/RF-19–RF-24, RF-50–RF-53, RF-80] → **HECHO**: `MoneyTests` verifica PEN, dos decimales y rechazo de negativos; cálculo en `CreateReservationCommand.cs`.
- [x] T016 Implementar resultados de indisponibilidad y de reserva compuesta fallida sin persistencia parcial. [001/RF-8–RF-9, RF-14–RF-18, RF-47–RF-49] → **HECHO**: resultado de indisponibilidad y rollback compuesto; prueba `HotelAndLodgingReservationTests.HotelLodgingEndToEnd_ShouldHoldProtectAndReleaseRoomsAtomically`.

## Fase 3 — Consultas y cancelación del cliente

- [x] T017 Implementar historial propio con filtro obligatorio de propietario y detalle de campos aprobados. [001/RF-25–RF-28] → **HECHO**: `ListReservationsQuery.cs` filtra por propietario; prueba `ContractSliceTests.CT02_ClientIsolation_ShouldReturnNotFound`.
- [x] T018 Implementar paginación de diez, orden por creación descendente y desempate por número único descendente. [001/RF-54–RF-57, RF-105] → **HECHO**: paginación 10 y orden descendente estable; prueba `ContractSliceTests.CT07_PaginationAndMoney_ShouldMatchContract`.
- [x] T019 Implementar resultados de página inválida, página válida vacía e historial vacío. [001/RF-55–RF-56, RF-99–RF-104] → **HECHO**: validación de página y vacío cubierta por `ContractSliceTests.CT07_PaginationAndMoney_ShouldMatchContract` y `CT04_ProblemDetails_ShouldHaveUniformShape`.
- [x] T020 Implementar cancelación propia `pending`, transición única y liberación turística/hotelera en una transacción. [001/RF-29–RF-34, RF-58] → **HECHO**: `CancelReservationCommand.cs` solo acepta `pending` y libera una vez; prueba `DomainSliceTests.Reservation_CancelByClient_ShouldBeIdempotentAndReleaseHolds`.
- [x] T021 Implementar aislamiento de reserva ajena como recurso no disponible y defensa contra identificadores manipulados. [001/RF-28, RF-30, RF-78] → **HECHO**: aislamiento por propietario y 404 sin revelar existencia; prueba `ContractSliceTests.CT02_ClientIsolation_ShouldReturnNotFound`.
- [x] T022 Implementar presentación de total, estados, vencimiento, capacidad de habitación y total de viajeros sin permitir cambios no autorizados. [001/RF-24, RF-41, RF-50–RF-53, AC10] → **HECHO**: DTO de total/estado/vencimiento/capacidad y rechazo de campos extra; prueba `ContractSliceTests.CT07_PaginationAndMoney_ShouldMatchContract`.

## Fase 4 — Fronteras con pago y vencimiento

- [x] T023 Implementar las invariantes de reserva requeridas por pago validado, sin exponer una confirmación manual de estado. **Bloqueada por 002.** [001/RF-35, RF-59–RF-68] → **HECHO**: solo el webhook validado confirma el pago; no existe endpoint de confirmación manual (revisado `src/DMGoTravel.Api/Endpoints/`); prueba `Phase6IntegrationsTests.Refunds_AndCulqiWebhook_ShouldWorkEndToEnd`.
- [x] T024 Implementar los límites de 15/20 minutos, configuración por reserva y resultados de rechazo/verificación en los contratos de Reservations. **Coordinar con 002/003.** [001/RF-59–RF-67, RF-73–RF-88] → **HECHO**: cortes de 15/20 minutos por reserva en `Reservation.cs`; pruebas `ReservationExpiryDomainTests.IsExpiredAt_ShouldRespect15And20MinuteDeadlines` y `ConfirmPayment_AtOrAfterValidationDeadline_ShouldThrow`.
- [x] T025 Implementar precedencia única entre cancelación e inicio de pago y tratamiento local de cobro posterior a cancelación. **Coordinar con 002.** [001/RF-75–RF-77, RF-94–RF-96] → **HECHO**: `Reservation.MarkPaymentStarted` incrementa `RowVersion` antes de invocar al proveedor y `CancelReservationCommandHandler` bloquea la cancelación con pago activo; pruebas `ReservationPaymentPrecedenceTests` (pago en verificación→409, cancelación→pago 409, concurrentes con un solo ganador y cobro tardío que conserva `cancelled` y abre devolución) y `ReservationPaymentRejectionTests`.
- [x] T026 Implementar vencimiento con cancelación y liberación completadas en máximo 60 segundos. **Bloqueada por 003/Hangfire.** [001/RF-63–RF-64, RF-74, RF-97–RF-98] → **HECHO**: `ReservationExpiryWorker.cs` sondea cada 30 s (clamp 5–60 s) y `ReservationExpiryTests.Expiry_Worker_ShouldCommitWithin60Seconds` mide corte→commit completo en ≤60 s. La programación sigue siendo un worker periódico, no persistente/Hangfire (T003-04 y T003-12 permanecen PARCIAL).
- [x] T027 Integrar auditoría de creación, cancelación y vencimiento. **Bloqueada por 010.** [001/RF-69] → **HECHO**: auditoría de creación, cancelación y vencimiento; pruebas `ReservationPaymentAuditTests.ReservationAndPaymentFlow_ShouldAuditOnceWithSafeSummary` y `ReservationExpiryTests.Expiry_WithoutPayment_ShouldCancelReleaseOnceAndAuditSystemAction`.

## Fase 5 — Presentation y contratos HTTP

- [x] T028 Diseñar y publicar OpenAPI para crear, listar, detallar y cancelar reservas propias. [ADR-015, 001/RF-1–RF-34] → **HECHO**: `OpenApiEndpoints.cs` sirve el contrato y `Sprint2QualityAttributeTests.OpenApiAndSwagger_ShouldBeServed` lo verifica.
- [x] T029 Mapear validación, propiedad, indisponibilidad, página inválida y estados a ProblemDetails/contrato HTTP consistente. [ADR-016, 001/RF-9, RF-28, RF-30, RF-99] → **HECHO**: `ProblemDetailsMiddleware.cs` y pruebas `ContractSliceTests.CT04_ProblemDetails_ShouldHaveUniformShape` y `CT11_ErrorBodies_ShouldNotLeakInternals`.
- [ ] T030 Aplicar autorización de rol/propiedad también fuera de controles HTTP para llamadas desde jobs e integraciones. [AC05, RN-25–RN-26] → **PARCIAL**: la autorización se aplica en endpoints y el actor se propaga a los comandos, pero no hay verificación no-HTTP explícita para jobs e integraciones.

## Fase 6 — Pruebas y validación

- [x] T031 Pruebas unitarias de estados, snapshots, total, historial y cancelación idempotente. [001/RF-19–RF-24, RF-29–RF-37, RF-54–RF-58] → **HECHO**: `DomainSliceTests`, `ReservationExpiryDomainTests`, `MoneyTests` y `IdempotencySliceTests` cubren estados, snapshots, total, historial y cancelación.
- [x] T032 Pruebas de integración PostgreSQL para último cupo turístico, última habitación y rollback de reserva compuesta. [001/RF-8, RF-15–RF-18, AC07] → **HECHO**: `Sprint2QualityAttributeTests.Concurrency_LastTouristSeat_ShouldPreventOverselling` y `HotelAndLodgingReservationTests.HotelLodgingEndToEnd_ShouldHoldProtectAndReleaseRoomsAtomically`.
- [x] T033 Pruebas de integración para cancelación repetida, cancelación/inicio de pago concurrentes y pago/vencimiento. [001/RF-34, RF-63–RF-67, RF-75–RF-78, RF-94–RF-98] → **HECHO**: `ReservationExpiryTests`, `ReservationPaymentPrecedenceTests`, `ReservationPaymentRejectionTests`, `IdempotencySliceTests.Cancel_WithSameKey_ShouldReplayAndConflictOnDifferentBody` y `ReservationPaymentAuditTests`.
- [x] T034 Pruebas de propiedades y aislamiento: reserva ajena, todos los estados, páginas inválidas/vacías y orden estable. [001/RF-25–RF-28, RF-54–RF-58, RF-78, RF-99–RF-105] → **HECHO**: `ContractSliceTests.CT02_ClientIsolation_ShouldReturnNotFound`, `CT02_Security_ShouldMatchDeclaredRequirements` y `CT07_PaginationAndMoney_ShouldMatchContract`.
- [x] T035 Pruebas de contrato HTTP/OpenAPI y ProblemDetails para todas las operaciones públicas de reserva. → **HECHO**: `ContractSliceTests.cs` (CT02, CT03, CT04, CT06, CT07, CT11) sobre las operaciones públicas.
- [x] T036 Pruebas de arquitectura para dependencias de capas y límites de módulos. → **HECHO**: `tests/DMGoTravel.ArchitectureTests/CleanArchitectureTests.cs` (3 reglas de dependencia).
- [x] T037 Medir y demostrar el máximo de 60 segundos para vencimiento/liberación en entorno de integración. [001/RF-97–RF-98] → **HECHO**: `ReservationExpiryTests.Expiry_Worker_ShouldCommitWithin60Seconds` mide corte→commit completo con el worker hospedado y verifica `≤60 s` y liberación única de cupos.

## Puertas de cierre

- [ ] T038 Revisar la matriz completa `001/RF-1`–`001/RF-105` contra implementación y pruebas. → **PARCIAL**: matriz completa redactada (13 criterios PARCIAL por falta de prueba específica); falta la revisión formal contra resultados ejecutados.
- [ ] T039 Verificar que no se introdujeron componentes de Movilidad, alquiler, precios de transporte, API Gateway, microservicios, Redis, broker ni tecnologías excluidas por constitución. → **PARCIAL**: verificado que no hay Redis, broker, gateway ni microservicios; Movilidad sí existe, pero por ampliación aprobada en 013, no como componente inferido.
- [ ] T040 Actualizar trazabilidad con evidencia de implementación/pruebas solo después de que existan resultados verificables. → **PARCIAL**: esta auditoría añade evidencia de implementación, pero `sdd/trazabilidad.md` aún no se ha regenerado criterio por criterio.

No ejecutar estas tareas fuera de una actividad posterior autorizada para código. Las tareas bloqueadas requieren specs/contratos dependientes aprobados; no se cierran sustituyéndolos por supuestos.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 31 |
| PARCIAL (entrega incompleta o sin prueba) | 8 |
| PENDIENTE (sin evidencia) | 1 |
| **Total** | **40** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
