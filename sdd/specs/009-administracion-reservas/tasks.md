# Tareas — Spec 009: Administración de reservas

> **Fecha:** 2026-11-02.  
> **Base:** [spec v0.2 aprobada](spec.md), 37 criterios, DEC-172; [plan técnico v0.1](plan.md).  
> **Estado:** backlog documental, **28 tareas pendientes, 0 ejecutadas**.  
> **Regla:** no ejecutar sin autorización posterior; carpeta confirmada `DMGoTravelll`. Sin cambios en specs/planes anteriores, código, reservas, inventario, pagos, correo o configuración.

R-01–R-06 son las puertas del plan. Cada tarea requiere entregable y evidencia; ningún resultado de implementación se afirma por esta lista.

## Fase 0 — Contratos y diseño verificable

- [ ] **T009-01 — Validar contratos y cobertura inicial.**
  - **Entregable:** matriz de 37 criterios, actores y fronteras con 001/002/003/004/005/006/007/010.
  - **Aceptación:** únicamente consulta y transiciones aprobadas; diferenciar contrato funcional de integración real y no ampliar cancelación `pending`, perfil o motor de pagos.
  - **Dependencias:** autorización futura, specs aprobadas y planes disponibles; 010 todavía sin plan propio.

- [ ] **T009-02 — Diseñar reloj y evaluación de componentes históricos.**
  - **Entregable:** contrato de inicio mínimo/fin máximo y fecha de decisión después de esperas/bloqueos.
  - **Aceptación:** no fecha del catálogo, navegador o inicio antiguo de transacción como prueba de elegibilidad; datos ausentes/inválidos bloquean transición sin inventar horarios.
  - **Dependencias:** T009-01. [RF-7/RF-8/RF-11/RF-20/RF-25–RF-27]

- [ ] **T009-03 — Diseñar atomicidad y protocolo de replay.**
  - **Entregable:** transacción, orden de bloqueos, versión esperada y claves/resultados de operación compatibles con 002/003.
  - **Aceptación:** reloj definitivo después de las esperas de las protecciones relevantes y sin HTTP externo bajo locks; replay autorizado no repite efectos, mismo ID con payload distinto no muta y commit desconocido exige verificar.
  - **Dependencias:** T009-01/T009-02. [RF-12/RF-13/RF-22/RF-28–RF-32]

- [ ] **T009-04 — Diseñar consultas, DTO y paginación.**
  - **Entregable:** parámetros/resultado e índices candidatos para lista/detalle; propuesta de página 20 y máximo 100, filtros AND, correo parcial e IDs exactos.
  - **Aceptación:** rangos inclusivos Perú convertidos a UTC, extremos abiertos, errores frente a vacíos y orden/desempate definidos; sin SQL/orden arbitrarios ni acceso por correo oculto de clientes de baja.
  - **Dependencias:** T009-01/T009-02. [RF-1–RF-6/RF-33–RF-36]

- [ ] **T009-05 — Modelar operación administrativa y referencias locales.**
  - **Entregable:** ID/actor/reserva/acción/huella/resultado, marcas de liberación, vínculo a caso de Payments e intención de aviso, sin duplicar datos ajenos.
  - **Aceptación:** unicidades/migraciones verificables; campos históricos inmutables y operación no equivale a nueva auditoría de éxito al repetir; no secreto o motivo en clave de idempotencia.
  - **Dependencias:** T009-03/T009-04. [RF-13/RF-17/RF-22/RF-23/RF-30/RF-31]

## Fase 1 — Autorización, lista y detalle

- [ ] **T009-06 — Integrar administrador y autorización vigente.**
  - **Entregable:** políticas de consulta y comando mediante el contexto real de 005.
  - **Aceptación:** cliente/actor revocado no consulta ni muta; rol/actor del cuerpo ignorados/rechazados; validar permisos también antes de devolver un replay.
  - **Dependencias:** T009-01/T009-05 y 005. [RF-5/RF-6/RF-24]

- [ ] **T009-07 — Implementar listado paginado y filtros.**
  - **Entregable:** lector de reservas, orden descendente estable y filtros parametrizados del plan.
  - **Aceptación:** todos los filtros se cumplen; correo parcial sin distinguir mayúsculas, espacios exteriores retirados y comodines como texto; invalidación explícita de fechas/página/tamaño, página válida vacía sin salto.
  - **Dependencias:** T009-04/T009-05/T009-06. [RF-1–RF-3/RF-5/RF-6/RF-33–RF-36]

- [ ] **T009-08 — Implementar detalle histórico autorizado.**
  - **Entregable:** reserva/cliente/oferta/componentes/importes/estado/pago/devolución mediante lectores de cada origen y contratos por lote.
  - **Aceptación:** datos históricos sin recalcular con catálogo, sin PAN/CVV/tokens/contactos ocultos o acceso a escritura de módulos; no inventar estado financiero ante un lector fallido.
  - **Dependencias:** T009-04/T009-06/T009-07 y 001/002/005/010. [RF-4–RF-6/RF-17/RF-23]

## Fase 2 — Transiciones y efectos locales

- [ ] **T009-09 — Implementar validación de cancelación.**
  - **Entregable:** comando tipado con motivo, confirmación de acción, versión esperada y clave estable.
  - **Aceptación:** solo `confirmed` antes del primer inicio; motivo recortado no vacío y sin truncamiento; propuesta de longitud 1–2.000 validada; no bypass por UI, datos ausentes o corte cruzado durante espera.
  - **Dependencias:** T009-02/T009-03/T009-05/T009-06/T009-08. [RF-8–RF-14/RF-20/RF-25/RF-37]

- [ ] **T009-10 — Integrar liberación turística de confirmada cancelada.**
  - **Entregable:** contrato de liberación del compromiso histórico turístico dentro de la transacción común.
  - **Aceptación:** devolver únicamente sus cupos una vez, sin aumentar capacidad total ni usar un comando de cancelar `pending` para omitir el estado confirmado.
  - **Dependencias:** T009-03/T009-05/T009-09 y 001/006. [RF-13/RF-28/RF-30/RF-31]

- [ ] **T009-11 — Integrar liberación hotelera de confirmada cancelada.**
  - **Entregable:** liberación del tipo/período y compromiso contratados con Hotels.
  - **Aceptación:** conjunto de fechas liberado una vez, sin inventarios por salida ni recursos de otra reserva; sin hotel no existe efecto hotelero.
  - **Dependencias:** T009-03/T009-05/T009-09/T009-10 y 007. [RF-13/RF-29–RF-31]

- [ ] **T009-12 — Integrar obligación local de devolución con Payments.**
  - **Entregable:** apertura/vínculo idempotente de caso por cancelación aplicada, pago confirmado y total, con detección original.
  - **Aceptación:** no caso duplicado sobre una obligación ya cubierta o en curso, importe desde Payments sin penalidad; cancelar no autoriza ni envía por sí solo un reembolso externo.
  - **Dependencias:** T009-03/T009-05/T009-09 y 002. [RF-13/RF-15/RF-16/RF-19/RF-24/RF-31/RF-32]

- [ ] **T009-13 — Implementar commit conjunto de cancelación.**
  - **Entregable:** transición, liberaciones, caso/vínculo, auditoría e intención de aviso en una transacción local.
  - **Aceptación:** fallo inyectado en cualquier paso revierte todo; no notificación/reembolso de cancelación no aplicada ni estado `cancelled` con liberación parcial.
  - **Dependencias:** T009-03/T009-06/T009-09–T009-12 y 004/010. [RF-8/RF-13–RF-18/RF-22/RF-28–RF-31]

- [ ] **T009-14 — Implementar finalización explícita.**
  - **Entregable:** comando `confirmed → completed` con versión, clave y declaración del administrador.
  - **Aceptación:** todos los componentes históricos terminados; no finalización automática por el reloj ni de terminales/`pending`; no crear devolución, alterar pago o liberar otra vez.
  - **Dependencias:** T009-02/T009-03/T009-05/T009-06/T009-08 y 010. [RF-7/RF-9–RF-13/RF-21–RF-24/RF-26/RF-27]

- [ ] **T009-15 — Resolver replay, versiones y commit desconocido.**
  - **Entregable:** recuperación de resultado durable y conflictos sin efectos duplicados para ambas transiciones.
  - **Aceptación:** clave/payload distintos no reutilizan operación; solicitud nueva con versión cambiada se rechaza; respuesta perdida se verifica con misma clave sin repetir auditoría, recursos, caso o aviso.
  - **Dependencias:** T009-03/T009-05/T009-13/T009-14. [RF-10/RF-12/RF-13/RF-30/RF-31]

## Fase 3 — Avisos, seguimiento y contratos HTTP/UI

- [ ] **T009-16 — Integrar aviso posterior al commit.**
  - **Entregable:** notificación de cancelación/fase de devolución mediante base/complemento y plan de 004.
  - **Aceptación:** motivo escapado visible para cliente y estado real; no envío por cancelación rechazada, duplicado por replay ni reversión por correo fallido.
  - **Dependencias:** T009-13/T009-15 y 004/005. [RF-13/RF-17/RF-18/RF-22]

- [ ] **T009-17 — Integrar seguimiento del caso sin duplicar motor financiero.**
  - **Entregable:** acceso autorizado al estado/caso de 002 y enlace a su autorización explícita, con plazo hábil y evidencias.
  - **Aceptación:** fallo/desconocido externo mantiene cancelada y liberada; no abono prometido, reenvío ciego de devolución ni tratamiento de duplicados/observados distinto de 002. Verificar G-01–G-05 antes de habilitación integrada, no bloquear una cancelación válida por una caída posterior.
  - **Dependencias:** T009-12/T009-13/T009-16 y 002. [RF-15–RF-20/RF-24/RF-32]

- [ ] **T009-18 — Integrar auditoría y fallos operativos.**
  - **Entregable:** transición con actor, estados, motivo/declaración, caso, fechas/correlación y resultado, anexado según 010.
  - **Aceptación:** un fallo de auditoría impide un cambio controlable; replay no crea otro éxito; errores de entrega no reactivan reserva ni generan alertas recursivas; no cuerpos con secretos en logs.
  - **Dependencias:** T009-13–T009-17 y 004/010. [RF-13/RF-14/RF-17–RF-19/RF-22/RF-23/RF-27/RF-31/RF-32]

- [ ] **T009-19 — Publicar OpenAPI y errores uniformes.**
  - **Entregable:** lista/detalle/cancelación/finalización versionadas, DTO whitelist, claves/versiones y ProblemDetails.
  - **Aceptación:** sin endpoint de cambio de estado libre ni campos mutables no aprobados; rechazar parámetros/campos extra y pérdida de autorización; conflicto no se presenta como éxito ni sustituye el pago validado.
  - **Dependencias:** T009-06–T009-08/T009-13–T009-18. [RF-1–RF-6/RF-9–RF-14/RF-20/RF-23/RF-24/RF-33–RF-37]

- [ ] **T009-20 — Implementar interfaz administrativa acotada.**
  - **Entregable:** lista/detalle y confirmaciones de cancelar/completar con estado real, motivo comunicado al cliente y seguimiento de caso.
  - **Aceptación:** acciones orientativas no eluden validación del servidor; no edición de fechas/importes/viajeros/oferta, confirmación de `pending` o creación de usuarios; navegar a 002 no autoriza implícitamente dinero.
  - **Dependencias:** T009-07/T009-08/T009-15–T009-19 y 005. [RF-1–RF-6/RF-7–RF-11/RF-14/RF-16–RF-24/RF-25–RF-27/RF-37]

## Fase 4 — Pruebas y cierre, todas pendientes

- [ ] **T009-21 — Pruebas unitarias/Application.**
  - **Entregable:** casos deterministas de los 37 criterios con reloj/actor/lectores/puertos controlados.
  - **Aceptación:** estados/cortes, todos los componentes, declaración explícita, filtros/motivo y reglas financieras sin inventar efectos externos; dobles no acreditan atomicidad real.
  - **Dependencias:** T009-06–T009-20. [RF-1–RF-37]

- [ ] **T009-22 — Pruebas PostgreSQL de concurrencia.**
  - **Entregable:** dos administradores, replay con misma/nueva clave, versión obsoleta y espera de locks que cruza el inicio/fin de componentes.
  - **Aceptación:** máximo un efecto por operación; nueva solicitud sobre cambio de estado se rechaza; hora de inicio de transacción no permite cancelar después del corte; ninguna combinación modifica `pending` o reabre terminales.
  - **Dependencias:** T009-02/T009-03/T009-09–T009-15/T009-18 y módulos reales. [RF-7–RF-13/RF-20/RF-25–RF-31]

- [ ] **T009-23 — Pruebas de rollback y respuesta de commit perdida.**
  - **Entregable:** fallo en estado, tour, hotel, caso, auditoría/intención y conexión antes/después de commit.
  - **Aceptación:** no efecto parcial ni reembolso por cancelación no aplicada; resultado ya aplicado se recupera sin duplicar recursos/caso/aviso; incidentes no falsean resultados.
  - **Dependencias:** T009-10–T009-18/T009-22. [RF-12–RF-19/RF-22/RF-28–RF-32]

- [ ] **T009-24 — Pruebas de seguridad y privacidad.**
  - **Entregable:** JWT/rol revocado, usuario cliente, campos extra, motivo/HTML/header maliciosos, SQL/comodines y datos ocultos de baja.
  - **Aceptación:** sin lectura/mutación no autorizada, contacto oculto recuperable por filtros, PAN/CVV/tokens o payload sensible en respuestas/logs; no edición encubierta de historia.
  - **Dependencias:** T009-04/T009-06–T009-08/T009-18–T009-20 y 005/010. [RF-2/RF-4–RF-6/RF-14/RF-22–RF-24/RF-33–RF-37]

- [ ] **T009-25 — Pruebas reales de contratos de caso/inventario/avisos.**
  - **Entregable:** integración de 001/002/003/004/005/006/007/010, sin modificar sus planes para ocultar incompatibilidades.
  - **Aceptación:** devolución total solo por autorización en 002, recursos liberados aunque el reembolso/correo fallen, ledger idempotente y evidencias reales; no cobros/reembolsos live en estas pruebas.
  - **Dependencias:** T009-10–T009-18/T009-22–T009-24 y disponibilidad de módulos. [RF-13/RF-15–RF-24/RF-28–RF-32]

- [ ] **T009-26 — Pruebas E2E administrativas.**
  - **Entregable:** lista/filtros/detalle, cancelación con motivo, finalización expresa y consulta de devolución mediante interfaz/API.
  - **Aceptación:** diálogo que cruza el corte es rechazado por servidor; tour terminado/hotel vigente no completa; página válida vacía no salta; errores no parecen éxito ni entregan datos ocultos.
  - **Dependencias:** T009-19–T009-21/T009-24/T009-25. [RF-1–RF-27/RF-33–RF-37]

- [ ] **T009-27 — Validar capacidad, índices y diagnóstico.**
  - **Entregable:** planes de consulta, lectura por lotes, costes de páginas/conteos y métricas de bloqueo/retry/rollback con carga definida.
  - **Aceptación:** parámetros 20/100, motivo 1–2.000 y límites 5/10 segundos contrastados; sin SLA ficticio, N+1 no controlado, locks durante HTTP externo ni reintentos que retrofechen el corte.
  - **Dependencias:** T009-04/T009-07/T009-08/T009-19/T009-22–T009-26. [RF-1–RF-4/RF-12/RF-31/RF-33–RF-37; AC07/AC09]

- [ ] **T009-28 — Cerrar matriz y revisar R-01–R-06.**
  - **Entregable:** RF→implementación→prueba→resultado y estado documentado de contratos, consistencia, pagos, avisos, calidad y autorización.
  - **Aceptación:** 37 criterios sin huecos, ninguna tarea cerrada por mera redacción y specs/planes previos intactos; no cancelar/liberar/reembolsar en producción por tener un plan.
  - **Dependencias:** T009-01–T009-27. [RF-1–RF-37]

## Matriz de cobertura funcional

| Criterios 009 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-6 | T009-04/T009-06–T009-08/T009-19/T009-20 | T009-21/T009-24/T009-26/T009-27 |
| RF-7–RF-13 | T009-02/T009-03/T009-09/T009-13–T009-15 | T009-21–T009-23/T009-26 |
| RF-14–RF-20 | T009-09/T009-12/T009-13/T009-16–T009-18/T009-20 | T009-21/T009-23–T009-26 |
| RF-21–RF-24 | T009-06/T009-08/T009-14/T009-18–T009-20 | T009-21/T009-24/T009-25/T009-26 |
| RF-25–RF-27 | T009-02/T009-09/T009-14/T009-18/T009-20 | T009-21/T009-22/T009-26 |
| RF-28–RF-32 | T009-03/T009-05/T009-10–T009-13/T009-15/T009-17 | T009-21–T009-23/T009-25 |
| RF-33–RF-37 | T009-04/T009-07/T009-09/T009-19/T009-20 | T009-21/T009-24/T009-26/T009-27 |

**28 tareas pendientes; ninguna ejecutada.** La cobertura documental no demuestra inventario liberado, devolución enviada o transición real aplicada.
