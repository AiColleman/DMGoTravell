# Tareas — Spec 001: Reservas del cliente

> **Base:** [spec aprobada v0.13](spec.md) y [plan técnico](plan.md).  
> **Estado:** backlog de implementación; no ejecutado.  
> **Regla:** no iniciar tareas bloqueadas por contratos/specs dependientes sin validar su compatibilidad con 001.

## Fase 0 — Preparación y contratos

- [ ] T001 Revisar 001/RF-1–RF-105, constitution y decisiones para crear una matriz de cobertura de implementación/pruebas.
- [ ] T002 Validar que las dependencias 005, 006, 007, 002, 003 y 010 dispongan de contratos aprobados antes de integrar sus operaciones reales. **Bloqueada parcialmente.**
- [ ] T003 Definir los contratos de Application de actor actual, reloj, transacción, reservas, cotización/retención de cupos, cotización/retención de alojamiento, pagos y auditoría sin exponer entidades o persistencia ajena.
- [ ] T004 Definir el contrato de resultado de creación, historial, detalle y cancelación sin permitir precio, propietario, estado o retenciones confiables desde el cliente.
- [ ] T005 Seleccionar y documentar la estrategia de concurrencia PostgreSQL, restricciones e índices que cumpla AC07/RN-07/RP02. **Puerta obligatoria antes de crear reserva.**

## Fase 1 — Dominio y persistencia de reservas

- [ ] T006 Modelar estados de reserva y transiciones permitidas: `pending`, `confirmed`, `completed`, `cancelled`. [001/RF-1, RF-29–RF-37]
- [ ] T007 Modelar la reserva y sus componentes históricos: propietario, salida, alojamiento opcional, snapshots, total PEN, vencimiento y número único. [001/RF-19–RF-24, RF-38–RF-53]
- [ ] T008 Modelar referencias de retención turística/hotelera y la liberación única/idempotente. [001/RF-7, RF-16–RF-18, RF-32–RF-34]
- [ ] T009 Diseñar migraciones, restricciones e índices para propietario, estados, snapshots, número único, retenciones e historial; mantener fechas en UTC. [RP01–RP08, 001/RF-25–RF-28, RF-57, RF-105]
- [ ] T010 Implementar repositorios y lectores de reserva con contratos separados de escritura y consultas paginadas.

## Fase 2 — Crear reserva y disponibilidad

- [ ] T011 Implementar autorización de cliente autenticado y validación de solicitud de creación. [001/RF-1–RF-6]
- [ ] T012 Integrar validación, retención y cotización oficial de salida con Catalog. **Bloqueada por 006.** [001/RF-3–RF-9]
- [ ] T013 Integrar validación de propuesta, retención y cotización de una habitación con Hotels. **Bloqueada por 007.** [001/RF-10–RF-18, RF-40–RF-49, RF-70–RF-72, RF-80–RF-81, RF-89–RF-93]
- [ ] T014 Implementar creación atómica de reserva, componentes, snapshots, retenciones y auditoría. [001/RF-1, RF-7, RF-16–RF-24, RF-69]
- [ ] T015 Implementar cálculo oficial del total en PEN, con dos decimales y sin importes impuestos por cliente. [001/RF-19–RF-24, RF-50–RF-53, RF-80]
- [ ] T016 Implementar resultados de indisponibilidad y de reserva compuesta fallida sin persistencia parcial. [001/RF-8–RF-9, RF-14–RF-18, RF-47–RF-49]

## Fase 3 — Consultas y cancelación del cliente

- [ ] T017 Implementar historial propio con filtro obligatorio de propietario y detalle de campos aprobados. [001/RF-25–RF-28]
- [ ] T018 Implementar paginación de diez, orden por creación descendente y desempate por número único descendente. [001/RF-54–RF-57, RF-105]
- [ ] T019 Implementar resultados de página inválida, página válida vacía e historial vacío. [001/RF-55–RF-56, RF-99–RF-104]
- [ ] T020 Implementar cancelación propia `pending`, transición única y liberación turística/hotelera en una transacción. [001/RF-29–RF-34, RF-58]
- [ ] T021 Implementar aislamiento de reserva ajena como recurso no disponible y defensa contra identificadores manipulados. [001/RF-28, RF-30, RF-78]
- [ ] T022 Implementar presentación de total, estados, vencimiento, capacidad de habitación y total de viajeros sin permitir cambios no autorizados. [001/RF-24, RF-41, RF-50–RF-53, AC10]

## Fase 4 — Fronteras con pago y vencimiento

- [ ] T023 Implementar las invariantes de reserva requeridas por pago validado, sin exponer una confirmación manual de estado. **Bloqueada por 002.** [001/RF-35, RF-59–RF-68]
- [ ] T024 Implementar los límites de 15/20 minutos, configuración por reserva y resultados de rechazo/verificación en los contratos de Reservations. **Coordinar con 002/003.** [001/RF-59–RF-67, RF-73–RF-88]
- [ ] T025 Implementar precedencia única entre cancelación e inicio de pago y tratamiento local de cobro posterior a cancelación. **Coordinar con 002.** [001/RF-75–RF-77, RF-94–RF-96]
- [ ] T026 Implementar vencimiento con cancelación y liberación completadas en máximo 60 segundos. **Bloqueada por 003/Hangfire.** [001/RF-63–RF-64, RF-74, RF-97–RF-98]
- [ ] T027 Integrar auditoría de creación, cancelación y vencimiento. **Bloqueada por 010.** [001/RF-69]

## Fase 5 — Presentation y contratos HTTP

- [ ] T028 Diseñar y publicar OpenAPI para crear, listar, detallar y cancelar reservas propias. [ADR-015, 001/RF-1–RF-34]
- [ ] T029 Mapear validación, propiedad, indisponibilidad, página inválida y estados a ProblemDetails/contrato HTTP consistente. [ADR-016, 001/RF-9, RF-28, RF-30, RF-99]
- [ ] T030 Aplicar autorización de rol/propiedad también fuera de controles HTTP para llamadas desde jobs e integraciones. [AC05, RN-25–RN-26]

## Fase 6 — Pruebas y validación

- [ ] T031 Pruebas unitarias de estados, snapshots, total, historial y cancelación idempotente. [001/RF-19–RF-24, RF-29–RF-37, RF-54–RF-58]
- [ ] T032 Pruebas de integración PostgreSQL para último cupo turístico, última habitación y rollback de reserva compuesta. [001/RF-8, RF-15–RF-18, AC07]
- [ ] T033 Pruebas de integración para cancelación repetida, cancelación/inicio de pago concurrentes y pago/vencimiento. [001/RF-34, RF-63–RF-67, RF-75–RF-78, RF-94–RF-98]
- [ ] T034 Pruebas de propiedades y aislamiento: reserva ajena, todos los estados, páginas inválidas/vacías y orden estable. [001/RF-25–RF-28, RF-54–RF-58, RF-78, RF-99–RF-105]
- [ ] T035 Pruebas de contrato HTTP/OpenAPI y ProblemDetails para todas las operaciones públicas de reserva.
- [ ] T036 Pruebas de arquitectura para dependencias de capas y límites de módulos.
- [ ] T037 Medir y demostrar el máximo de 60 segundos para vencimiento/liberación en entorno de integración. [001/RF-97–RF-98]

## Puertas de cierre

- [ ] T038 Revisar la matriz completa `001/RF-1`–`001/RF-105` contra implementación y pruebas.
- [ ] T039 Verificar que no se introdujeron componentes de Movilidad, alquiler, precios de transporte, API Gateway, microservicios, Redis, broker ni tecnologías excluidas por constitución.
- [ ] T040 Actualizar trazabilidad con evidencia de implementación/pruebas solo después de que existan resultados verificables.

No ejecutar estas tareas fuera de una actividad posterior autorizada para código. Las tareas bloqueadas requieren specs/contratos dependientes aprobados; no se cierran sustituyéndolos por supuestos.
