# Tareas — Spec 003: Vencimiento y liberación automática

> **Fecha:** 2026-11-01.  
> **Base:** [spec v0.1 aprobada](spec.md), 20 criterios, DEC-134; [plan técnico v0.1](plan.md).  
> **Estado:** backlog documental, **24 tareas pendientes, 0 ejecutadas**.  
> **Regla:** no ejecutar sin autorización posterior para código; V-01–V-05 son puertas del plan. No editar specs ni planes previos para cerrar dependencias.

## Fase 0 — Contratos, tiempo y diseño de garantías

- [ ] **T003-01 — Validar contratos y plataforma.**
  - **Entregable:** matriz de 20 criterios y contrato de reserva, intento vigente, reloj, retenciones, transacción, auditoría/aviso e incidentes; versiones/almacenamiento Hangfire verificados.
  - **Aceptación:** mapear las dependencias aprobadas frente a integración real; no acceso directo a repositorios ajenos ni nuevos permisos de cancelación `pending`; registrar V-01/V-02 abiertas hasta evidencia.
  - **Dependencias:** autorización futura y specs 001/002/004+complemento/005/006/007/009/010.

- [ ] **T003-02 — Diseñar evaluación temporal única.**
  - **Entregable:** regla determinista de corte aplicable con plazos originales, reloj confiable y estado protegido del intento.
  - **Aceptación:** distinguir intento vigente, rechazado antes de 15, verificación y observado; cortes exactos excluyen nuevo pago/confirmación; cambios de configuración no reinician reservas existentes.
  - **Dependencias:** T003-01. [RF-1–RF-6/RF-15/RF-17/RF-19/RF-20]

- [ ] **T003-03 — Definir transacción, bloqueo y marcas idempotentes.**
  - **Entregable:** protocolo compatible con 001/002 para estado, liberaciones, auditoría e intención de aviso.
  - **Aceptación:** orden de adquisición compartido, marcas únicas por compromiso y diseño de rollback sin llamadas HTTP externas bajo locks; jobs duplicados no duplican efectos.
  - **Dependencias:** T003-01/T003-02. [RF-6–RF-9/RF-13/RF-16/RF-17]

- [ ] **T003-04 — Diseñar programación compatible con 60 segundos.**
  - **Entregable:** diferidos por cortes de cada reserva, intención durable, barrido de reparación y recuperación al arrancar.
  - **Aceptación:** no usar cron de un minuto como única garantía; validar configuración de sondeo propuesta de 5 segundos y presupuesto de cola/transacción del plan con el paquete elegido.
  - **Dependencias:** T003-01/T003-02. [RF-1–RF-5/RF-10/RF-15]

- [ ] **T003-05 — Definir retry y escalamiento técnicos.**
  - **Entregable:** política única de hasta 3 reintentos rápidos por ciclo (5/10/20 segundos), reevaluación degradada de 60 segundos y umbral de incidente del plan.
  - **Aceptación:** no duplicar cadenas con defaults de Hangfire; agotar el ciclo no abandona la reserva; escalar por fallo persistente o retraso detectado sin extender los cortes de negocio.
  - **Dependencias:** T003-01/T003-04. [RF-10–RF-14]

## Fase 1 — Persistencia y comando local

- [ ] **T003-06 — Modelar persistencia e índices operativos.**
  - **Entregable:** intenciones de programación, referencias únicas de ejecución/liberación e incidentes, con UTC y consultas de pendientes por corte.
  - **Aceptación:** no nuevos estados de reserva, no sobrescritura de snapshots y no secretos en argumentos/payloads; registrar la diferencia entre estado de job y negocio.
  - **Dependencias:** T003-01/T003-03/T003-04/T003-05. [RF-7–RF-9/RF-13–RF-16/RF-20]

- [ ] **T003-07 — Implementar selección de reservas candidatas.**
  - **Entregable:** lector paginado/lotes de reservas pendientes e intenciones recuperables según corte aplicable.
  - **Aceptación:** no cargar indiscriminadamente todo el historial; no modificar terminales; revalidar elegibilidad al ejecutar aunque la lista de candidatas sea anterior.
  - **Dependencias:** T003-02/T003-06. [RF-1–RF-6/RF-15]

- [ ] **T003-08 — Implementar coordinador de vencimiento protegido.**
  - **Entregable:** comando común que revalida estado/tiempo y coordina transición, puertos de liberación, auditoría e intención de aviso en commit conjunto.
  - **Aceptación:** fallo local revierte el conjunto; no confirmar pago, invocar reembolso ni introducir `expired`/`processing`; recepción repetida reconoce un resultado ya aplicado.
  - **Dependencias:** T003-02/T003-03/T003-06/T003-07. [RF-1–RF-10/RF-13/RF-16/RF-19/RF-20]

- [ ] **T003-09 — Integrar liberación turística.**
  - **Entregable:** contrato real con Reservations/Catalog para liberar solo el compromiso turístico de la reserva.
  - **Aceptación:** reserva con varias personas devuelve exactamente esos cupos una vez; repetir no aumenta capacidad total ni libera compromisos ajenos.
  - **Dependencias:** T003-03/T003-08 y contratos 001/006. [RF-7/RF-9/RF-16]

- [ ] **T003-10 — Integrar liberación hotelera.**
  - **Entregable:** liberación del compromiso del hotel/tipo/período histórico dentro de la transacción común.
  - **Aceptación:** liberar todas las fechas comprometidas sin parcialidad ni duplicar inventario por salida; reserva sin hotel no produce efecto hotelero.
  - **Dependencias:** T003-03/T003-08/T003-09 y 007. [RF-8/RF-9/RF-16]

- [ ] **T003-11 — Integrar competencia con pago/rechazo/cancelación.**
  - **Entregable:** invocación común con 001/002 y protocolo de exclusión por reserva.
  - **Aceptación:** confirmación válida ya aplicada se respeta; validación desde 20 no confirma aunque el job tarde; rechazo definitivo en minuto 18 cancela/libera sin esperar al job de 20; cobro tardío solo va al flujo de 002.
  - **Dependencias:** T003-02/T003-08–T003-10 y contratos 001/002. [RF-3–RF-6/RF-9/RF-17/RF-19]

## Fase 2 — Hangfire, recuperación, auditoría y alerta

- [ ] **T003-12 — Integrar registro/ejecución persistente de jobs.**
  - **Entregable:** dispatcher de intenciones, jobs diferidos de cortes originales, barrido de huérfanas y recuperación al inicio.
  - **Aceptación:** una caída entre commit de reserva y registro del job no pierde el vencimiento; un doble job no duplica liberación; ningún reencolado reinicia 15/20 minutos.
  - **Dependencias:** T003-04/T003-06/T003-07/T003-08/T003-11. [RF-1–RF-10/RF-15]

- [ ] **T003-13 — Integrar retry y supervisor de incidentes.**
  - **Entregable:** política del plan con contadores persistidos, ciclo rápido y reevaluación degradada sin cadenas paralelas ilimitadas.
  - **Aceptación:** ante fallo persistente conservar `pending` y compromisos reales, bloquear por corte nuevos pagos/confirmación y no marcar liberación completa; conservar el retraso respecto del corte original.
  - **Dependencias:** T003-05/T003-08/T003-12. [RF-10–RF-12/RF-14]

- [ ] **T003-14 — Integrar auditoría y evidencia recuperable.**
  - **Entregable:** registro anexado de `reservation.auto_cancelled`, fallos/reintentos/alertas, actor sistema, corte, fechas y correlación.
  - **Aceptación:** no repetir auditoría de una cancelación aplicada ni inventar intentos no conservados; conservar evidencia cuando falle el destino de auditoría y completar su recuperación sin falsificar fechas.
  - **Dependencias:** T003-06/T003-08/T003-13 y 010/complemento 004. [RF-9/RF-13/RF-14/RF-16]

- [ ] **T003-15 — Integrar alerta y consulta operativa.**
  - **Entregable:** aviso de fallo persistente por 004 con incidente consultable autorizado y deduplicación por reserva/corte.
  - **Aceptación:** correo fallido no borra el incidente ni genera recursión; no avisos idénticos por cada sondeo; recuperación no reabre la reserva ni habilita cancelar `pending` manualmente.
  - **Dependencias:** T003-13/T003-14 y 004/005/009/010. [RF-11/RF-12/RF-14]

- [ ] **T003-16 — Integrar estado visible y no prórroga.**
  - **Entregable:** proyección/contrato para consulta de 001 y seguimiento de 002, sin una API pública nueva de vencimiento.
  - **Aceptación:** cancelación confirmada se muestra `cancelled`; fallo persistente sigue `pending` sin pago/confirmación fuera de corte; no presentar «liberado» sin commit ni ocultar la excepción con un estado inventado.
  - **Dependencias:** T003-08–T003-15 y contratos 001/002. [RF-5/RF-6/RF-12/RF-18–RF-20]

- [ ] **T003-17 — Proteger operación y Dashboard.**
  - **Entregable:** autenticación/autorización administrativa del Dashboard y parámetros operativos seguros.
  - **Aceptación:** un cliente no dispara/reconfigura jobs ni cambia estados; reintento operativo invoca el mismo comando; no se aceptan credenciales o roles en argumentos serializados.
  - **Dependencias:** T003-04/T003-15/T003-16 y 005; sin nuevas facultades administrativas. [RF-6/RF-12/RF-20; RS03]

## Fase 3 — Pruebas y cierre, pendientes

- [ ] **T003-18 — Pruebas de dominio/Application con reloj controlado.**
  - **Entregable:** suite para los 20 criterios con dobles explícitamente limitados al dominio/casos de uso.
  - **Aceptación:** probar cada corte exacto, configuración preservada, intento rechazado/vigente/observado, terminales, eventos, estados y fallo persistente; sin afirmar latencia de Hangfire por estas pruebas.
  - **Dependencias:** T003-02/T003-08–T003-16. [RF-1–RF-20]

- [ ] **T003-19 — Pruebas PostgreSQL de concurrencia e idempotencia.**
  - **Entregable:** escenarios reales multiworker y fallo en cada paso de cancelación/liberación/auditoría.
  - **Aceptación:** no cambios parciales, no doble devolución de cupos/habitaciones, no dos resultados incompatibles de pago/vencimiento y terminales intactas; comprobar anomalías sin reparación manual no autorizada.
  - **Dependencias:** T003-03/T003-08–T003-14 y módulos integrados. [RF-1–RF-9/RF-13/RF-16/RF-17/RF-19/RF-20]

- [ ] **T003-20 — Medir el máximo de 60 segundos extremo a extremo.**
  - **Entregable:** pruebas con Hangfire/storage PostgreSQL/colas reales, carga definida y reserva simple/compuesta.
  - **Aceptación:** medir corte hasta commit completo, no solo handler ni promedio; todas las muestras del escenario normal definido dentro de 60 segundos. Si se supera, V-03 sigue bloqueada y no se relaja el umbral.
  - **Dependencias:** T003-04/T003-05/T003-12/T003-13/T003-19. [RF-2/RF-4/RF-7/RF-8/RF-10]

- [ ] **T003-21 — Pruebas de caída/reinicio y recuperación degradada.**
  - **Entregable:** fallos antes/después del commit y entrega del job, proceso suspendido y destinos auditoría/correo caídos.
  - **Aceptación:** recuperar trabajos sin nueva ventana, reintentar sin abandono al agotar el ciclo rápido, mantener incidente y estado real, y no fabricar una liberación o alerta puntual inexistente durante una caída total.
  - **Dependencias:** T003-12–T003-15/T003-19/T003-20. [RF-9–RF-16/RF-19/RF-20]

- [ ] **T003-22 — Pruebas de contrato, autorización y presentación.**
  - **Entregable:** integración de 001/002/004/005/009/010 con sus contratos reales y controles de acceso.
  - **Aceptación:** estado mostrado consistente con commit; job tardío no habilita pago; alertas solo para administradores; no ruta libre de cambio de estado ni cancelación admin de `pending`. No enviar dinero real para estas pruebas.
  - **Dependencias:** T003-11/T003-15–T003-18. [RF-5/RF-6/RF-12/RF-13/RF-14/RF-17–RF-20]

- [ ] **T003-23 — Validar capacidad, observabilidad y despliegue activo.**
  - **Entregable:** evidencia de backlog, espera en cola, duración de transacción, retraso desde corte, intentos y host/storage activos.
  - **Aceptación:** parámetros propuestos contrastados con versiones/entorno, Dashboard protegido y recuperación con múltiples instancias; no atribuir 60 segundos garantizados a un host suspendido ni alterar ventanas para absorber demora.
  - **Dependencias:** T003-17/T003-20–T003-22. [RF-10–RF-14/RF-15; AC02/AC07/AC09]

- [ ] **T003-24 — Cerrar cobertura y revisar puertas de habilitación.**
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

**Todas las tareas están pendientes.** No se ejecutan jobs, alteran reservas, crean credenciales ni modifican documentos protegidos en esta actividad.
