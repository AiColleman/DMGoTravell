# Tareas — Spec 008: Perfil y baja lógica

> **Fecha:** 2026-11-02.  
> **Base:** [spec v0.1 aprobada](spec.md), 37 criterios, DEC-186; [plan técnico v0.1](plan.md).  
> **Estado:** backlog documental, **30 tareas pendientes, 0 ejecutadas**.  
> **Regla:** ejecutar solo en una actividad posterior autorizada; carpeta `DMGoTravelll`. Sin cambios de cuenta, correos, claves, datos, código o planes anteriores ahora.

P-01–P-06 son puertas del plan. La cobertura documental no es evidencia de identidad cambiada, correo entregado o baja aplicada.

## Fase 0 — Contratos, seguridad y consistencia

- [ ] **T008-01 — Validar contratos y cobertura inicial.**
  - **Entregable:** matriz de 37 criterios, autoridad de campos/bloqueos y contratos con 001/002/003/004/005/009/010.
  - **Aceptación:** distinguir propósito nuevo de correo del contrato genérico, sin editar planes previos ni añadir perfil ampliado/admin/finanzas.
  - **Dependencias:** autorización futura y specs aprobadas; P-01/P-04.

- [ ] **T008-02 — Definir validación, confirmación y parámetros sensibles.**
  - **Entregable:** nombre/teléfono/correo normalizados, límites/TTL de prueba del plan y contrato de identidad reciente local/Google.
  - **Aceptación:** confirmar expresamente sin exigir contraseña local a quien no la tiene ni fingir recencia por refresh/`iat`; nombre no vacío, teléfono opcional y no-op de correo normalizado correctamente diferenciados.
  - **Dependencias:** T008-01 y 005; P-01/P-03. [RF-1–RF-7/RF-9–RF-14/RF-37]

- [ ] **T008-03 — Modelar solicitudes, versiones y unicidad.**
  - **Entregable:** versión de perfil separada de seguridad/generación, solicitud de correo/prueba digest, operaciones y baja con evidencia.
  - **Aceptación:** único correo canónico incluidas bajas, destino pendiente no reservado globalmente, una última solicitud válida y ningún token bruto/alias histórico como credencial.
  - **Dependencias:** T008-01/T008-02. [RF-8–RF-20/RF-27–RF-32/RF-36]

- [ ] **T008-04 — Protocolar barrera por cuenta y atomicidad.**
  - **Entregable:** exclusión compartida/exclusiva, orden de locks, control de versión y unidad transaccional con orígenes de bloqueos.
  - **Aceptación:** reserva/pago concurrentes no pasan una baja tras lectura vacía; refresh/reset/cambio/baja no generan estados parciales o deadlocks por orden incompatible; no HTTP bajo locks.
  - **Dependencias:** T008-01/T008-03 y contratos de escritores; P-02. [RF-6/RF-12–RF-20/RF-23–RF-29/RF-34–RF-36]

- [ ] **T008-05 — Definir propósitos/destinatarios de notificaciones.**
  - **Entregable:** autorizaciones de prueba al destino pendiente y avisos mínimos al anterior/nuevo del hecho aplicado, con claves/payloads propios.
  - **Aceptación:** no usar «igual a correo vigente» para suprimir el aviso anterior ni habilitar cualquier dirección; no credenciales en avisos de finalización o alias/fallback operativo histórico.
  - **Dependencias:** T008-01/T008-02/T008-03 y 004/005. [RF-11/RF-12/RF-19/RF-21/RF-22/RF-34]

## Fase 1 — Perfil y correo diferido

- [ ] **T008-06 — Implementar consulta propia y autorización actual.**
  - **Entregable:** perfil/estado de solicitud mínimo del titular activo, sin selección arbitraria de cuenta.
  - **Aceptación:** ninguna lectura ajena o de secretos; verificación/solicitud pendientes visibles sin devolver enlace/digest; actor/rol no vienen del cuerpo.
  - **Dependencias:** T008-03/T008-04 y 005. [RF-1–RF-3/RF-23/RF-32]

- [ ] **T008-07 — Implementar actualización básica conjunta.**
  - **Entregable:** nombre/teléfono con whitelist, validación completa y distinción omitido/vacío.
  - **Aceptación:** input inválido/extra no aplica parte de la actualización; solo datos básicos no sustituyen correo ni revocan familias, cambian seguridad o reescriben historia.
  - **Dependencias:** T008-02/T008-04/T008-06. [RF-3–RF-9/RF-34–RF-36]

- [ ] **T008-08 — Implementar solicitud válida de nuevo correo.**
  - **Entregable:** flujo autorizado y confirmado con destino validado, referencia actual de solicitud y prueba/intención protegida.
  - **Aceptación:** validar antes de sustituir la anterior; no cambiar correo/funciones vigentes ni cerrar sesiones por esperar; nueva intención no se confunde con retry del mismo comando.
  - **Dependencias:** T008-02–T008-07 y 005. [RF-6/RF-10–RF-13/RF-22/RF-36/RF-37]

- [ ] **T008-09 — Implementar prueba de confirmación ligada al propósito.**
  - **Entregable:** verificación de digest, cuenta/versión, origen/destino, vencimiento y generación vigente, sin propósito intercambiable con registro/reset.
  - **Aceptación:** vencida/usada/sustituida/cuenta inactiva no cambia nada; otro registro puede ocupar destino y la confirmación debe volver a verificar unicidad.
  - **Dependencias:** T008-02/T008-03/T008-04/T008-08 y 005. [RF-10/RF-11/RF-13–RF-16/RF-19/RF-29]

- [ ] **T008-10 — Aplicar correo y revocación global en commit local.**
  - **Entregable:** nuevo correo verificado, consumo, invalidación de enlaces anteriores, versión de seguridad, revocación de todas las familias, auditoría y dos intenciones de aviso.
  - **Aceptación:** fallo local revierte todo; no contraseña o sesión nueva en respuesta, ni cambio de Google/cuenta/historia. Correo anterior deja de acceder a la cuenta de origen.
  - **Dependencias:** T008-04/T008-05/T008-09 y 005/010. [RF-8/RF-15–RF-21/RF-34–RF-36]

- [ ] **T008-11 — Integrar ambos avisos de seguridad.**
  - **Entregable:** entregas independientes y mínimas para direcciones anterior/nueva del mismo hecho, con evidencia de propósito autorizado.
  - **Aceptación:** ningún enlace de acceso/token/password o información financiera; fallo de una entrega no elimina la otra ni revierte correo aplicado; sin bucles/duplicados por reintento.
  - **Dependencias:** T008-05/T008-10 y 004. [RF-21/RF-22/RF-34/RF-36]

- [ ] **T008-12 — Integrar rechazo de solicitudes obsoletas y envíos pendientes.**
  - **Entregable:** revalidación de propósito/generación/vigencia al emitir o repetir enlaces por 004 y estados saneados para la UI.
  - **Aceptación:** no entregar una prueba sustituida como vigente, regenerarla con misma clave de correo ni renovar desde 004; logout ordinario no es una reactivación de una prueba inválida.
  - **Dependencias:** T008-03/T008-08–T008-11 y 004/005. [RF-11–RF-14/RF-19/RF-22/RF-29/RF-36]

## Fase 2 — Baja, finanzas y privacidad

- [ ] **T008-13 — Implementar lector autoritativo y guard de baja.**
  - **Entregable:** referencias propias de reservas `pending`/`confirmed`, pagos sin resolución y casos de devolución abiertos, revalidados bajo barrera.
  - **Aceptación:** datos no comprobables no equivalen a cero bloqueos; vencida aún pendiente/confirmada aún no completada bloquean; no exigir abono bancario adicional ni cerrar casos para permitir baja.
  - **Dependencias:** T008-01/T008-03/T008-04/T008-06 y 001/002/003/009. [RF-23–RF-26/RF-33/RF-35]

- [ ] **T008-14 — Aplicar baja lógica e invalidación conjunta.**
  - **Entregable:** baja/fecha, seguridad/privacidad, todas las familias y solicitudes invalidadas y auditoría local.
  - **Aceptación:** solo titular activo no administrativo con confirmación/identidad reciente y sin bloqueos; no borrado físico, cancelación/liberación/reembolso, reactivación o correo canónico liberado.
  - **Dependencias:** T008-04/T008-10/T008-12/T008-13 y 005/010. [RF-8/RF-23–RF-32/RF-34–RF-37]

- [ ] **T008-15 — Integrar hechos financieros posteriores sin reactivar.**
  - **Entregable:** contrato con 002 para registrar/reconciliar efectos externos que aparezcan después, con referencia al titular inactivo.
  - **Aceptación:** no perder un cobro por falta de acceso cliente, crear una sesión nueva o devolver desde 008; el guard de nueva operación cliente no bloquea conservar evidencia de un efecto externo real.
  - **Dependencias:** T008-04/T008-13/T008-14 y 002/003. [RF-8/RF-24/RF-26/RF-33]

- [ ] **T008-16 — Integrar estado de privacidad actual con 010.**
  - **Entregable:** lector/versión de baja para consultas/CSV y prueba de variante preparada antes de baja.
  - **Aceptación:** solo ID/estado/cantidad en clientes de baja, sin contactos ocultos; no borrar auditoría ni actualizar conteos/snapshots ordinarios capturados para ocultar una incompatibilidad.
  - **Dependencias:** T008-06/T008-14/T008-15 y 010. [RF-8/RF-30/RF-31/RF-32]

- [ ] **T008-17 — Verificar Google y acceso posterior al cambio/baja.**
  - **Entregable:** integración de resolución por issuer/`sub` ya vinculado y autenticación con correo canónico.
  - **Aceptación:** cambio de correo no crea/fusiona cuenta ni altera vínculo; baja impide login/token/registro con su correo retenido y no se salta por callback/enlace anterior.
  - **Dependencias:** T008-10/T008-14/T008-15 y 005. [RF-17–RF-20/RF-28/RF-29/RF-31/RF-32]

- [ ] **T008-18 — Resolver replay, concurrencia y respuesta perdida.**
  - **Entregable:** resultado mínimo/clave de operación por titular/acción y control de versiones, distinguiendo intención nueva de repetición.
  - **Aceptación:** sin segundo efecto/aviso; una cuenta/sesión que perdió autorización no recibe datos por replay. Un commit incierto se verifica sin repetir la baja o correo.
  - **Dependencias:** T008-07/T008-08/T008-10/T008-14/T008-16/T008-17. [RF-2/RF-6/RF-13–RF-19/RF-27–RF-29/RF-34–RF-36]

## Fase 3 — Auditoría, contratos y protección de uso

- [ ] **T008-19 — Integrar auditoría e incidentes saneados.**
  - **Entregable:** actor/cuenta/acción/fecha/cambios/resultado con escritura anexada y fallos de entrega recuperables.
  - **Aceptación:** ninguna prueba/enlace/password en logs/admin/CSV; auditoría fallida no aplica cambio controlable; no reactivación o bucles de aviso como recuperación.
  - **Dependencias:** T008-04/T008-07–T008-18 y 004/010. [RF-8/RF-21/RF-22/RF-34–RF-36]

- [ ] **T008-20 — Publicar OpenAPI y UI propia acotada.**
  - **Entregable:** consulta/edición/solicitud/confirmación/baja, errores, confirmaciones y separación vigente/pendiente sin datos de otra cuenta.
  - **Aceptación:** sin perfil admin, rol/estado mutable, contraseña en perfil o nueva función financiera; mostrar causa propia de baja bloqueada y cierre de sesiones tras correo aplicado, no antes.
  - **Dependencias:** T008-06–T008-19 y 005. [RF-1–RF-7/RF-10–RF-18/RF-21–RF-29/RF-32/RF-37]

- [ ] **T008-21 — Integrar CSRF, rate y control de enlaces.**
  - **Entregable:** controles compartidos por cuenta/solicitud/IP, protección de propósito/identidad, origen/retorno y retirada de prueba en cliente.
  - **Aceptación:** sin token propio en URL/query/log/web storage, flujo confirmado por prueba no acepta otra cuenta/destino y correo actualizado no elude barreras de abuso ni permisos de 005.
  - **Dependencias:** T008-02/T008-04/T008-06/T008-08/T008-09/T008-13/T008-20; P-03. [RF-2/RF-10–RF-19/RF-23/RF-28/RF-29/RF-32/RF-37]

## Fase 4 — Pruebas y cierre, todas pendientes

- [ ] **T008-22 — Pruebas unitarias/Application.**
  - **Entregable:** casos deterministas de los 37 criterios y parámetros propuestos, con reloj/actor/lectores/entrega controlados.
  - **Aceptación:** cubrir datos omitidos/vacíos, última válida, email igual/ocupado, prueba inválida, bloqueos, revocación, avisos y privacidad; no presentar dobles como integración real.
  - **Dependencias:** T008-06–T008-21. [RF-1–RF-37]

- [ ] **T008-23 — Pruebas PostgreSQL de carreras y barreras.**
  - **Entregable:** dos solicitudes/confirmaciones, registro reclamando destino y baja compitiendo con reserva/intento/caso/refresh/reset.
  - **Aceptación:** un correo canónico, ningún hueco por lectura vacía, solicitud inválida no sustituye válida y no estados parciales; comprobar todos los escritores, no solo el handler de baja.
  - **Dependencias:** T008-03/T008-04/T008-07–T008-19 y módulos reales. [RF-6/RF-10–RF-20/RF-23–RF-29/RF-34–RF-36]

- [ ] **T008-24 — Pruebas reales de contrato de identidad/notificación.**
  - **Entregable:** evidencia de destinos pendiente/anterior/nuevo, proof vigente, payload/clave estables y reglas de sesión/Google de 005.
  - **Aceptación:** no suprimir aviso legítimo al anterior por no ser ya canónico, enviar a dirección arbitraria o reemitir pruebas desde 004; solo entorno/destinatarios de test autorizados, sin cambios a planes previos.
  - **Dependencias:** T008-05/T008-08–T008-12/T008-19/T008-20/T008-22 y 004/005.

- [ ] **T008-25 — Pruebas de seguridad y privacidad.**
  - **Entregable:** titular ajeno/inactivo/admin, prueba robada de otro propósito, replay, HTML/headers, orígenes y contactos de baja en UI/CSV.
  - **Aceptación:** nada de acceso por correo anterior a cuenta de origen, enlaces usados/obsoletos/role falso o secreto en artefactos; Google no se exige como si fuese contraseña local inexistente.
  - **Dependencias:** T008-09/T008-10/T008-12/T008-14/T008-16–T008-21/T008-23/T008-24. [RF-1–RF-3/RF-14/RF-17–RF-20/RF-23/RF-28–RF-32/RF-34–RF-37]

- [ ] **T008-26 — Pruebas de fallo y recuperación.**
  - **Entregable:** caídas antes/durante/después de commit, respuesta perdida y destinos de auditoría/correo fallidos.
  - **Aceptación:** no datos básicos parcialmente aplicados, identidad/sesiones inconsistentes, duplicación de aviso/baja o reversión por correo fallido; resultado público saneado si ya perdió acceso.
  - **Dependencias:** T008-04/T008-10–T008-19/T008-23/T008-24. [RF-6–RF-9/RF-16–RF-22/RF-27–RF-36]

- [ ] **T008-27 — Pruebas E2E de perfil y baja.**
  - **Entregable:** consulta/edición, correo pendiente/sustituido/aplicado y baja aceptada/bloqueada con contratos reales de 001/002/004/005/009/010.
  - **Aceptación:** el correo anterior mantiene funciones hasta confirmar, después se cierran todas las sesiones; cada bloqueo se muestra sin autocancelar/devolver; datos de baja se protegen antes de CSV. Sin datos u operaciones reales.
  - **Dependencias:** T008-20–T008-26 y disponibilidad real de módulos. [RF-1–RF-37]

- [ ] **T008-28 — Validar limpieza temporal y observabilidad.**
  - **Entregable:** vencimiento/limpieza de cargas secretas y solicitudes técnicas, métricas/diagnóstico sin PII o credenciales.
  - **Aceptación:** nunca borrar correo canónico/historia/auditoría por expirar una solicitud; un worker no manda prueba sustituida, alerta no genera recursión y fallos no se convierten en reactivación.
  - **Dependencias:** T008-12/T008-14/T008-19/T008-21/T008-25/T008-26. [RF-8/RF-11–RF-14/RF-19/RF-21/RF-22/RF-29–RF-36]

- [ ] **T008-29 — Validar capacidad y coordinación operativa.**
  - **Entregable:** índices/consulta de bloqueos, límites distribuidos, costos de barrera y tiempos bajo carga/varias instancias.
  - **Aceptación:** calibrar parámetros sin quitar la coordinación con escritores o prometer un SLA vacío; no bloquear colas financieras/vencimiento con HTTP/correo bajo locks ni ocultar inconsistencias para mejorar latencia.
  - **Dependencias:** T008-04/T008-21/T008-23–T008-28. [RF-6/RF-10/RF-15/RF-23–RF-26/RF-34–RF-36; AC07/AC09]

- [ ] **T008-30 — Cerrar cobertura y revisar P-01–P-06.**
  - **Entregable:** RF→implementación→prueba→resultado y puertas de identidad/consistencia/correo/finanzas/privacidad/autorización.
  - **Aceptación:** 37 criterios sin huecos, ninguna tarea cerrada por redacción y todos los documentos previos intactos; no cambios reales de cuenta, baja o correo por el solo hecho de tener plan.
  - **Dependencias:** T008-01–T008-29. [RF-1–RF-37]

## Matriz de cobertura funcional

| Criterios 008 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-9 | T008-02/T008-03/T008-06/T008-07/T008-19/T008-20 | T008-22/T008-23/T008-25–T008-27 |
| RF-10–RF-16 | T008-02–T008-05/T008-08–T008-10/T008-12/T008-21 | T008-22–T008-27 |
| RF-17–RF-22 | T008-05/T008-10–T008-12/T008-17/T008-19/T008-20 | T008-22–T008-28 |
| RF-23–RF-29 | T008-04/T008-06/T008-13–T008-15/T008-17/T008-20/T008-21 | T008-22/T008-23/T008-25–T008-27/T008-29 |
| RF-30–RF-33 | T008-14–T008-17/T008-19 | T008-22/T008-25–T008-28 |
| RF-34–RF-37 | T008-02/T008-04/T008-07–T008-14/T008-18–T008-21 | T008-22–T008-29 |

**30 tareas pendientes; ninguna ejecutada.** La matriz no prueba una cuenta modificada, una baja aplicada o un mensaje enviado en una implementación real.
