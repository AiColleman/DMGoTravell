# Tareas — Complemento 005-C: Reemisión de verificación

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-209.  
> **Base:** [005-C v0.1 aprobado](complemento-reemision-verificacion.md), 18 criterios, DEC-208; [plan propio](plan-reemision-verificacion.md).  
> **Estado:** **16 tareas pendientes, 0 ejecutadas**. No sustituyen las 32 tareas base de 005 o incluyen trabajo ajeno como completado. Sin código, cuentas/enlaces/correos reales o configuración.

## Fase 0 — Compatibilidad y modelo

- [ ] **T005V-01 — Contrastar emisor inicial, consumidores y ampliación.**
  - **Entregable:** contratos de 004/005/008/010 y matriz de los 18 criterios.
  - **Aceptación:** enlace inicial también participa de sustitución/consumo; ningún camino antiguo valida prueba sustituida ni se modifica otra política de reset/cambio de correo.
  - **Dependencias:** actividad futura autorizada y specs aprobadas. [RF-1–RF-18; RV-01]
- [ ] **T005V-02 — Concretar parámetros, API y presentación.**
  - **Entregable:** propuesta verificable de TTL/límites, comando propio/consumo, OpenAPI/errores y textos.
  - **Aceptación:** acción antes/después de vencer, sin correo libre o secreto en respuesta; 24 horas y cuotas son parámetros técnicos, no decisiones comerciales o evidencia medida.
  - **Dependencias:** T005V-01. [RF-1–RF-5/RF-7/RF-12/RF-14/RF-15; RV-04]
- [ ] **T005V-03 — Modelar generación, operación y custodia separadas.**
  - **Entregable:** referencia actual del propósito, solicitudes/verificadores, operación idempotente y carga cifrada temporal con contexto/claves.
  - **Aceptación:** no mezclar generación con versión global/sesiones, 008/reset o entrega manual; digest no se usa para reconstruir prueba, ningún secreto en jobs/logs/admin.
  - **Dependencias:** T005V-01/T005V-02 y contratos de Identity/004. [RF-5/RF-6/RF-8/RF-15/RF-18; RV-01/RV-03]

## Fase 1 — Solicitud, entrega y consumo

- [ ] **T005V-04 — Integrar titular, elegibilidad y controles de abuso.**
  - **Entregable:** cuenta/familia/rol actuales, correo vigente no verificado y cuota compartida antes de sustituir.
  - **Aceptación:** rechazo por límites/permisos/cuenta verificada no invalida anterior; replay no consume otra admisión; login sin verificar sigue permitido.
  - **Dependencias:** T005V-02/T005V-03 y 005. [RF-1–RF-4/RF-9/RF-12/RF-14; RV-01/RV-04]
- [ ] **T005V-05 — Admitir y sustituir conjuntamente.**
  - **Entregable:** protección de cuenta/solicitud, nueva generación/prueba, invalidación, intención/carga protegida, operación y auditoría en un commit local.
  - **Aceptación:** sin anterior invalidada si falla cualquier paso; solo última admitida válida, incluido enlace inicial; no modificar sesiones/correo/verificación por pedir enlace.
  - **Dependencias:** T005V-03/T005V-04 y 004/010. [RF-1/RF-2/RF-5/RF-6/RF-9/RF-16/RF-17; RV-02]
- [ ] **T005V-06 — Integrar transporte y retry sin renovar prueba.**
  - **Entregable:** 004 consume intención y revalida contexto/generación/vigencia/destino; payload/clave/plantilla/enlace estables.
  - **Aceptación:** correo fallido/desconocido no restaura antiguos o crea otra prueba; manual único y sin retry automático de su generación; sin HTTP bajo locks de negocio.
  - **Dependencias:** T005V-03/T005V-05 y 004. [RF-4/RF-5/RF-10/RF-11/RF-15; RV-03]
- [ ] **T005V-07 — Integrar consumo vigente y mensaje de enlace sustituido.**
  - **Entregable:** validación de prueba/contexto/generación/expiración, consumo/verificación/auditoría conjunta y salida sin secretos.
  - **Aceptación:** solo prueba actual verifica, igualdad al vencimiento ya no; GET/HEAD/entrega SMTP no verifican, replay no duplica o crea sesión, mensaje indica usar más reciente.
  - **Dependencias:** T005V-03/T005V-05 y consumidor base 005. [RF-5–RF-7/RF-12–RF-15; RV-02/RV-04]
- [ ] **T005V-08 — Resolver replay y carreras de identidad.**
  - **Entregable:** operación/payload/versión, commit incierto y coordinación con verificación/correo/baja.
  - **Aceptación:** replay de solicitud vieja no la vuelve actual; si verificación ganó no emitir otra, si reemisión ganó la prueba anterior no verifica; baja/correo invalidan sin excepciones.
  - **Dependencias:** T005V-04–T005V-07 y 008/005. [RF-6–RF-9/RF-13/RF-14/RF-18; RV-02]
- [ ] **T005V-09 — Integrar recuperación y limpieza temporal.**
  - **Entregable:** resultados de entrega conocidos/desconocidos, supresión de nuevos envíos inválidos, incidentes y limpieza protegida.
  - **Aceptación:** prueba inválida no equivale a correo nunca aceptado; sin otra clave/copia ciega, restauración de prueba antigua, auditoría borrada o garantía ficticia de retirada SMTP/respaldos.
  - **Dependencias:** T005V-06/T005V-08 y 004/010. [RF-5/RF-8–RF-11/RF-15/RF-18; RV-03]

## Fase 2 — Integración y verificaciones, pendientes

- [ ] **T005V-10 — Integrar UI y guardias de reserva/pago.**
  - **Entregable:** acción de solicitud/estado/mensajes y lectura de verificación actual por 001/002.
  - **Aceptación:** «solicitud registrada» no finge entrega; cuenta sigue no verificada hasta consumo válido, sin login nuevo o desbloqueo por correo/contador.
  - **Dependencias:** T005V-02/T005V-04–T005V-08 y 001/002. [RF-1/RF-2/RF-7/RF-12–RF-15; RV-04]
- [ ] **T005V-11 — Verificar seguridad, runtime y claves.**
  - **Entregable:** protección de prueba/carga/transporte, rotación/réplicas, CSRF/topología y ausencia de filtraciones.
  - **Aceptación:** sin secretos en URL de acceso, API pública, jobs/logs/admin/artefactos; cuenta/prueba/propósito cruzados y cargas intercambiadas no autorizan operaciones.
  - **Dependencias:** T005V-03/T005V-06–T005V-09 y 005/004. [RF-3–RF-5/RF-15/RF-18; RV-03/RV-04]
- [ ] **T005V-12 — Integrar evidencia saneada y fallos de auditoría.**
  - **Entregable:** anexado por solicitud/resultado y recuperación/incidente según origen sin secretos.
  - **Aceptación:** fallo antes de admitir revierte sustitución; aceptación externa posterior no se pierde o repite por fallo local; sin recursión de alertas.
  - **Dependencias:** T005V-05/T005V-06/T005V-09 y 010/004. [RF-8–RF-11/RF-15–RF-17; RV-02/RV-03]
- [ ] **T005V-13 — Pruebas unitarias, contrato HTTP y presentación.**
  - **Entregable:** escenarios de los 18 criterios, fronteras temporales/límites, mensajes, titular/estado y campos extra.
  - **Aceptación:** no decisiones de negocio nuevas; antes/después de vencer y solo último verificados con dobles, sin afirmar por ello garantías de PostgreSQL o Resend.
  - **Dependencias:** T005V-04–T005V-12. [RF-1–RF-18; RV-04]
- [ ] **T005V-14 — Pruebas PostgreSQL y concurrencia real.**
  - **Entregable:** dos solicitudes/consumos, enlace inicial, verificación vs reemisión, baja/correo, rollback y respuesta perdida con varios workers.
  - **Aceptación:** una generación válida; no resurrección por replay o filas vacías, sesión conservada donde corresponde y solicitud anterior válida si no se admitió nueva.
  - **Dependencias:** T005V-03–T005V-12 y módulos reales. [RF-3/RF-5–RF-9/RF-13/RF-14/RF-16–RF-18; RV-01/RV-02]
- [ ] **T005V-15 — Pruebas de entrega/recuperación y capacidad en entorno autorizado.**
  - **Entregable:** SMTP fuera de orden, invalidación antes/después de admisión, lease vencido, 24 horas/TTL, caída de base/correo, claves/réplicas y límites bajo carga.
  - **Aceptación:** no envíos ciegos o prueba renovada por retry; mensajes tardíos no verifican, fallo no restaura antiguos; solo destinatarios/credenciales/entorno de test autorizados posteriormente.
  - **Dependencias:** T005V-06/T005V-09–T005V-14 y autorización específica de integración. [RF-4–RF-12/RF-15–RF-18; RV-03/RV-04/RV-05]
- [ ] **T005V-16 — Cerrar cobertura y revisar RV-01–RV-05.**
  - **Entregable:** criterio→implementación→prueba→resultado, evidencias pendientes y límites de habilitación.
  - **Aceptación:** 18 criterios cubiertos, sin marcar tarea/puerta por redacción o integración pública supuesta; bases/aprobaciones protegidas y sin producción por tener plan.
  - **Dependencias:** T005V-01–T005V-15. [RF-1–RF-18]

## Matriz de cobertura funcional

| Criterios 005-C | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-4 | T005V-01/T005V-02/T005V-04/T005V-05/T005V-06 | T005V-10/T005V-11/T005V-13–T005V-15 |
| RF-5–RF-8 | T005V-03/T005V-05–T005V-08 | T005V-11/T005V-13–T005V-15 |
| RF-9–RF-11 | T005V-04–T005V-06/T005V-08/T005V-09/T005V-12 | T005V-13–T005V-15 |
| RF-12–RF-14 | T005V-04/T005V-07/T005V-08/T005V-10 | T005V-13–T005V-15 |
| RF-15–RF-18 | T005V-03–T005V-09/T005V-11/T005V-12 | T005V-13–T005V-15 |

**16 tareas pendientes, ninguna ejecutada.** El inventario global pasa de 386 a 402 tareas pendientes; criterios aprobados se mantienen en 677. No se alteran las casillas o entregables del backlog base de 005.
