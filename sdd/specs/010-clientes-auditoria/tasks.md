# Tareas — Spec 010: Clientes y auditoría

> **Fecha:** 2026-11-02.  
> **Base:** [spec v0.3 aprobada](spec.md), 59 criterios, DEC-169; [plan v0.1](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  
> **Regla:** no ejecutar sin autorización posterior; carpeta confirmada `DMGoTravelll`. Sin consultas/escrituras/exportaciones reales, código o cambios en specs/planes anteriores.

A-01–A-06 son puertas del plan, no pruebas superadas. La cobertura no convierte logs técnicos, snapshots huérfanos o un CSV parcialmente generado en evidencia suficiente.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Contratos, modelo y seguridad

- [ ] **T010-01 — Validar alcance, acciones y cobertura inicial.** → **PARCIAL**: implementación y acciones auditadas existen en `IAuditWriter.cs`, pero no la matriz de 59 criterios.
  - **Entregable:** matriz de 59 criterios y catálogo de operaciones/campos permitidos por origen 001–009 y obligaciones previas 013.
  - **Aceptación:** conservar `reservation.auto_cancelled`; no nuevos flujos de 008 o auditoría indiscriminada de visitas; no payload genérico que incluya secretos anidados.
  - **Dependencias:** autorización futura y specs aprobadas/planes disponibles; A-01.

- [x] **T010-02 — Definir puertos de anexado/lectura y envelope saneado.** → **HECHO**: puertos `IAuditWriter`/`IAuditRepository` y proyección saneada en `Features/Audit/AuditProjection.cs`.
  - **Entregable:** actor/acción/entidad/IDs/fechas/correlación/resultado/cambios y responsabilidades de cada origen.
  - **Aceptación:** origen y versión de campos definidos; sistema no adopta admin ficticio, actor desconocido no se inventa por un correo presentado y no endpoints de auditoría arbitraria públicos.
  - **Dependencias:** T010-01. [RF-9–RF-15/RF-19–RF-21/RF-25/RF-26]

- [ ] **T010-03 — Diseñar privilegios y prohibiciones efectivas.** → **PENDIENTE**: no hay roles SQL de lectura/anexado ni pruebas de denegación de UPDATE/DELETE sobre auditoría.
  - **Entregable:** roles runtime de lectura/anexado/exportación/cleanup separados de propietario/migraciones y reglas de no cascada.
  - **Aceptación:** app sin UPDATE/DELETE/TRUNCATE/DROP sobre auditoría; cleanup temporal sin esos permisos sobre historia; no acceso SQL entregado al administrador de negocio.
  - **Dependencias:** T010-01/T010-02. [RF-1/RF-7/RF-16–RF-18/RF-35]

- [x] **T010-04 — Modelar auditoría, deduplicación e índices.** → **HECHO**: `AuditLog.cs`, `PendingAuditEntry.cs` e índices en `Configurations/AuditConfiguration.cs`/`PendingAuditConfiguration.cs`.
  - **Entregable:** registro inmutable y referencias con fecha original/incorporación, unicidades por operación/hecho/paso/intento e índices autorizados.
  - **Aceptación:** no duplicar una aplicación exitosa al reprocesar evento, conservar intentos distintos y rechazo sin cambios aplicados; no secretos, cascadas o TTL de historia.
  - **Dependencias:** T010-02/T010-03. [RF-9–RF-21/RF-26]

- [x] **T010-05 — Definir anexado transaccional y fallo cerrado.** → **HECHO**: auditoría en el commit y fallo cerrado; prueba `ReservationPaymentAuditTests.ControllableReservationChanges_WhenAuditFails_ShouldRollbackAndReturnError`.
  - **Entregable:** protocolo integrado en la unidad transaccional local de cada origen para cambio y auditoría.
  - **Aceptación:** fallo de auditoría impide el efecto aún controlable y se informa; no fire-and-forget posterior presentado como atomicidad ni registro de éxito de cambio rechazado.
  - **Dependencias:** T010-02/T010-04 y contratos de orígenes. [RF-9/RF-12/RF-15/RF-21/RF-36/RF-37]

- [x] **T010-06 — Diseñar recuperación de efectos externos reales.** → **HECHO**: `PendingAuditRecoveryWorker.cs` recupera evidencia con fecha original; prueba `AdminReportsAndAuditRecoveryTests.PendingAuditRecovery_AfterPaymentAuditFailure_ShouldRecoverToAuditLog`.
  - **Entregable:** identificación durable previa y consulta/verificación por 002/004, pendientes saneados y recuperación de fechas/resultados.
  - **Aceptación:** cobro ya realizado no se repite/cancela por auditoría fallida; no retrofechar validación ni fingir evidencia si cayó el mismo destino; A-03 no se cierra sin pruebas.
  - **Dependencias:** T010-02/T010-04/T010-05 y G-05/M-05 de 002/004. [RF-13/RF-15/RF-25/RF-26/RF-38–RF-41]

- [x] **T010-07 — Integrar autorización vigente y solicitudes privadas.** → **HECHO**: autorización admin vigente y descarga propia; pruebas `AdminAuditTests.List_ShouldFailClosedWhenRoleOrSessionIsNoLongerCurrent` y `AdminAuditExportTests.GetAndDownload_ShouldEnforceOwnershipAndExpiry`.
  - **Entregable:** administrador/familia/rol actual y propiedad/autorización del ID de exportación según 005.
  - **Aceptación:** cliente/rol revocado no ve resultados ni descarga; ID/clave de job no es credencial; estado de autorización no verificable falla cerrado sin resultados.
  - **Dependencias:** T010-02/T010-03 y 005. [RF-1/RF-2/RF-29/RF-57/RF-58]

- [x] **T010-08 — Diseñar consultas y filtros compartidos.** → **HECHO**: filtros/paginación compartidos; prueba `AdminAuditTests.List_ShouldFilterPaginateAndOrderStably` y `AdminClientTests.List_ShouldFilterPaginateOrderAndCountReservations`.
  - **Entregable:** DTO/validación, página 25/máximo 100 propuestos, texto/IDs exactos según campo, rangos Perú y orden/desempate.
  - **Aceptación:** AND de filtros, parciales solo nombre/correo, sin SQL/comodines/arbitrarios ni tildes/fonética añadidas; página vacía no salta y rango invertido no se omite.
  - **Dependencias:** T010-02/T010-07. [RF-3/RF-4/RF-22/RF-23/RF-33/RF-34/RF-45–RF-52]

## Fase 1 — Lectores y proyecciones autorizadas

- [x] **T010-09 — Implementar clientes de solo lectura.** → **HECHO**: `Features/Clients/ClientProjection.cs` y endpoints de solo lectura; prueba `AdminClientTests.Get_ShouldReturnAuthorizedDetailAndRestrictDeletedClient`.
  - **Entregable:** lista/detalle de campos permitidos desde lector autorizado de 005.
  - **Aceptación:** datos ausentes no se inventan, sin permisos de editar/desactivar/reactivar ni campos de credenciales; cualquier metadata de exportación queda separada de cuenta fuente.
  - **Dependencias:** T010-03/T010-07/T010-08 y 005. [RF-3–RF-5/RF-7/RF-8/RF-35]

- [x] **T010-10 — Implementar resumen distinto de reservas.** → **HECHO**: conteo de reservas por cliente; prueba `AdminClientTests.List_ShouldFilterPaginateOrderAndCountReservations`.
  - **Entregable:** lector por lote de conteo de IDs de reserva por cliente, compatible con contexto de snapshot.
  - **Aceptación:** incluir los cuatro estados, cero si no hay reservas y una reserva contada una vez aunque tenga varias noches/eventos; no N+1 ni consulta fuera de la copia temporal al exportar.
  - **Dependencias:** T010-02/T010-08/T010-09 y 001. [RF-6/RF-53]

- [x] **T010-11 — Implementar auditoría paginada y detalle correlacionado.** → **HECHO**: `ListAuditQuery.cs`/`GetAuditQuery.cs`; prueba `AdminAuditTests.List_ShouldFilterPaginateAndOrderStably` y `Get_ShouldReturnPublicIdAndSanitizedSummary`.
  - **Entregable:** lector de registros/cambios permitidos, fechas y referencias de reserva/pago/evento/notificación.
  - **Aceptación:** sin ejecutar comandos desde auditoría, sin búsqueda libre de secretos/contactos ni nombres actuales que reescriban el hecho; fechas de operación/incorporación distinguidas.
  - **Dependencias:** T010-04/T010-07/T010-08. [RF-11–RF-15/RF-18/RF-22–RF-26/RF-48–RF-52]

- [x] **T010-12 — Aplicar privacidad de clientes con baja.** → **HECHO**: clientes de baja con datos restringidos; prueba `AdminClientTests.Get_ShouldReturnAuthorizedDetailAndRestrictDeletedClient`.
  - **Entregable:** proyección de lista/detalle y política de selección que devuelve solo ID/estado/cantidad en baja.
  - **Aceptación:** no coincidencia por nombre/correo ocultos en búsquedas nuevas; no fecha/verificación/contactos extra ni borrado/modificación del historial de auditoría por esta regla.
  - **Dependencias:** T010-07/T010-09/T010-10 y contrato de estado 005/008, sin implementar la baja. [RF-8/RF-18/RF-44/RF-54]

## Fase 2 — Copia temporal y generación CSV

- [x] **T010-13 — Probar protocolo de captura consistente en admisión.** → **HECHO**: captura con instantánea persistida (`AddExportSnapshot`) y replay; prueba `AdminClientExportTests.Create_ShouldApplyFiltersReplayIdempotentlyAndKeepEmptyHeader`.
  - **Entregable:** materialización completa bajo snapshot PostgreSQL inicial, contexto compartido de lectura y manifest/marca de captura confirmada.
  - **Aceptación:** no timestamp-only ni ID de snapshot usado después de cerrar su transacción; no encolar primero y capturar datos después bajo referencia antigua; fallo de captura no se sustituye por vista nueva.
  - **Dependencias:** T010-03/T010-08–T010-12; A-04. [RF-27/RF-28/RF-35/RF-42/RF-43/RF-53]

- [x] **T010-14 — Modelar solicitudes y preparación privadas de exportación.** → **HECHO**: `ExportJob.cs`, `ExportRepository.cs` y `CreateClientsExportCommand.cs` con filtros y snapshot.
  - **Entregable:** identidad idempotente de solicitud, filtros/columnas, copia capturada, manifest y bloques/metadata de artefacto sin disco local o URL pública.
  - **Aceptación:** escrituras solo en áreas técnicas propias, no clientes/auditoría fuente; distinguir captura/renderizado/listo/fallo/expiración, sin máximo comercial de filas.
  - **Dependencias:** T010-03/T010-07/T010-13. [RF-27–RF-29/RF-32/RF-35/RF-42/RF-43]

- [ ] **T010-15 — Diseñar y probar serializador CSV seguro.** → **PARCIAL**: `CsvFieldFormatter.cs` neutraliza fórmulas y CRLF, pero no hay prueba dedicada de compatibilidad con hojas de cálculo.
  - **Entregable:** cabeceras/versiones, Unicode, comillas/separadores/CRLF y política de texto inerte probada en clientes/versiones soportados.
  - **Aceptación:** quoting no se acepta como protección suficiente de fórmulas; sin secretos ni filas ficticias de metadata; no modificar valores fuente al sanear la representación.
  - **Dependencias:** T010-02/T010-08/T010-14; A-05. [RF-8/RF-26/RF-29–RF-32/RF-35/RF-55/RF-59]

- [x] **T010-16 — Implementar captura/exportación de clientes.** → **HECHO**: exportación de clientes completa; prueba `AdminClientExportTests.Create_ShouldRequireAdminAndDeliverCompleteCsv`.
  - **Entregable:** todos los resultados filtrados con perfil permitido y conteos bajo la misma copia temporal.
  - **Aceptación:** página visible no limita exportación; clientes ya de baja solo ID/estado/cantidad y campos restantes vacíos; no filas duplicadas ni registro/contactos inventados.
  - **Dependencias:** T010-09/T010-10/T010-12–T010-15. [RF-5/RF-6/RF-27/RF-29/RF-42–RF-44/RF-53–RF-55]

- [x] **T010-17 — Implementar captura/exportación de auditoría.** → **HECHO**: exportación de auditoría saneada; prueba `AdminAuditExportTests.Create_ShouldRequireAdminAndDeliverCompleteCsv`.
  - **Entregable:** todos los registros filtrados y columnas saneadas/relaciones disponibles de la vista capturada.
  - **Aceptación:** auditoría que se incorpora después con fecha original antigua no entra en la copia previa; no payload completo con secretos ni valores ordinarios refrescados durante renderizado.
  - **Dependencias:** T010-04/T010-11/T010-13–T010-15. [RF-13/RF-24–RF-26/RF-28/RF-29/RF-42/RF-43/RF-55]

- [x] **T010-18 — Generar artefacto completo y recuperable desde copia confirmada.** → **HECHO**: artefacto completo con conteo/huella; pruebas `AdminClientExportTests` y `AdminAuditExportTests`.
  - **Entregable:** renderizado por lotes/chunks, conteo/tamaño/huella y publicación de variante lista solo tras terminar y verificar el conjunto.
  - **Aceptación:** sin recortes por volumen, prefijo parcial como éxito ni mezcla de snapshots; caída anterior a captura falla, posterior permite recuperar solo desde esa copia.
  - **Dependencias:** T010-14–T010-17. [RF-27/RF-28/RF-30–RF-32/RF-42/RF-43/RF-55]

- [x] **T010-19 — Revalidar baja y regenerar variante de entrega.** → **HECHO**: máscara por baja posterior; prueba `AdminClientExportTests.Download_ShouldMaskLaterDeletionAndKeepCapturedCount`.
  - **Entregable:** lectura actual de privacidad y máscara sobre copia inicial, con invalidación de variante que conserve campos ahora restringidos.
  - **Aceptación:** baja entre solicitud/listo/descarga conserva fila e ID/cantidad del inicio, oculta lo demás; no clientes nuevos ni actualización de conteos ordinarios; revisar otra vez antes de iniciar entrega si cambió durante preparación.
  - **Dependencias:** T010-07/T010-12/T010-16/T010-18 y contrato de estado 005/008. [RF-29/RF-42/RF-44/RF-54/RF-56]

- [x] **T010-20 — Implementar descarga autorizada e íntegra.** → **HECHO**: descarga autorizada; prueba `AdminClientExportTests.Download_ShouldMaskLaterDeletionAndKeepCapturedCount`.
  - **Entregable:** entrega por backend de variante lista con tamaño/huella/nombre seguro, caché privada y referencia temporal visible con zona.
  - **Aceptación:** permiso revocado bloquea descarga incluso con job/archivo ya listo; sin URL pública/firmada que omita nueva autorización, datos restringidos ni éxito por una transferencia iniciada o incompleta.
  - **Dependencias:** T010-07/T010-15/T010-18/T010-19 y 005. [RF-1/RF-2/RF-29/RF-32/RF-56–RF-59]

- [x] **T010-21 — Gestionar expiración y limpieza de copias temporales.** → **HECHO**: `ExportCleanupService.cs` y expiración; prueba `AdminAuditExportTests.GetAndDownload_ShouldEnforceOwnershipAndExpiry`.
  - **Entregable:** disponibilidad propuesta de 24 horas desde listo, abandono de jobs y cleanup limitado a preparación/artefactos técnicos.
  - **Aceptación:** nunca borrar auditoría/negocio por expirar una copia; job en fallo/expirado no entrega prefijo parcial ni usa una referencia nueva sin solicitud nueva.
  - **Dependencias:** T010-03/T010-14/T010-18/T010-20. [RF-16–RF-18/RF-32/RF-35/RF-42/RF-43]

## Fase 3 — Retención, incidentes, API y presentación

- [ ] **T010-22 — Diseñar retención/archivo consultable indefinido.** → **PARCIAL**: la auditoría se conserva sin TTL, pero no hay archivo/particionado ni restauración probada.
  - **Entregable:** índices/particiones/archivo, capacidad, privilegios y restauración con referencias históricas conservadas.
  - **Aceptación:** sin TTL de eliminación de auditoría o pérdida de consulta al archivar; owner operativo no se confunde con admin de negocio ni cleanup de exportación.
  - **Dependencias:** T010-03/T010-04/T010-11/T010-21; A-02. [RF-16–RF-18/RF-24/RF-25]

- [x] **T010-23 — Integrar pendientes y alertas sin recursión.** → **HECHO**: pendientes y alertas sin recursión; prueba `PendingAuditEntry_RetriesAndAlertEscalation_ShouldWork`.
  - **Entregable:** recuperación de evidencia externa, referencia de incidente y aviso por 004, con fecha original conocida y registro actual.
  - **Aceptación:** no repetir dinero ni fingir efecto local/aplicado; fallo de alerta no crea cadena infinita; caída total exige mecanismo recuperable probado, no una tabla en el mismo destino indisponible.
  - **Dependencias:** T010-05/T010-06/T010-04/T010-11 y 002/003/004/009. [RF-9/RF-13/RF-15/RF-20/RF-21/RF-36–RF-41]

- [x] **T010-24 — Publicar contratos HTTP de solo lectura/exportación.** → **HECHO**: endpoints de listas/detalles/exportación con ProblemDetails; pruebas `AdminClientTests`/`AdminAuditTests`/`Admin*ExportTests`.
  - **Entregable:** OpenAPI/ProblemDetails de listas/detalles/solicitud/estado/descarga y política de autorización/errores.
  - **Aceptación:** sin endpoints de edición/baja/roles o auditoría arbitraria; validación, vacío, saturación antes de admitir captura, fallo/no listo/expirado son distinguibles sin exponer datos o SQL internos.
  - **Dependencias:** T010-07–T010-12/T010-18–T010-23. [RF-1–RF-8/RF-16/RF-22–RF-35/RF-49–RF-52/RF-57–RF-59]

- [ ] **T010-25 — Implementar interfaz administrativa acotada.** → **PARCIAL**: `frontend/src/pages/admin/AdminGovernancePage.tsx` integra clientes, auditoría y exportaciones; sin prueba de la consola.
  - **Entregable:** pestañas de clientes/auditoría, filtros/páginas, relaciones y seguimiento de exportación, sin acciones de mutación de negocio.
  - **Aceptación:** indicar solo lectura, campos permitidos y referencia temporal; exportar todos no significa solo página; no declarar descarga exitosa al hacer clic ni ofrecer reparación de auditoría/finanzas/perfil.
  - **Dependencias:** T010-09–T010-12/T010-20/T010-24. [RF-3–RF-8/RF-22–RF-25/RF-27/RF-28/RF-33/RF-44/RF-48/RF-49/RF-59]

## Fase 4 — Pruebas y cierre
- [ ] **T010-26 — Pruebas unitarias/Application.** → **PARCIAL**: hay pruebas de lista/detalle/exportación, pero no una suite que trace los 59 criterios.
  - **Entregable:** casos deterministas de 59 criterios, envelope saneado, filtros, permisos, privacidad, fases de captura y CSV.
  - **Aceptación:** 59 criterios trazados sin afirmar inmutabilidad SQL, recuperación externa o snapshot real a partir de dobles.
  - **Dependencias:** T010-05–T010-25. [RF-1–RF-59]

- [ ] **T010-27 — Pruebas PostgreSQL de permisos, anexado y lectura.** → **PARCIAL**: se prueba append/lectura vía API, pero sin roles SQL reales ni denegación de mutaciones.
  - **Entregable:** roles reales, transacciones del origen, unicidades, rechazo de mutaciones de auditoría y lectura sin cambios de fuente.
  - **Aceptación:** no UPDATE/DELETE/TRUNCATE/DROP runtime en auditoría, no cascadas ni éxito doble por replay; fallo del anexado revierte el efecto controlable.
  - **Dependencias:** T010-03–T010-12/T010-21–T010-23 y módulos reales. [RF-7/RF-9–RF-21/RF-26/RF-35–RF-37]

- [ ] **T010-28 — Pruebas de snapshot y cambios concurrentes.** → **PARCIAL**: hay captura y replay, no modificaciones concurrentes entre solicitud, captura y entrega.
  - **Entregable:** modificaciones de clientes, reservas nuevas/canceladas y auditoría tardía entre solicitud, captura, worker y entrega.
  - **Aceptación:** conjunto/valores ordinarios y conteos del inicio, ningún registro futuro con fecha retroactiva incluido y ninguna recaptura nueva bajo referencia antigua; baja posterior aplica la excepción sin eliminar fila.
  - **Dependencias:** T010-10/T010-13–T010-20/T010-27. [RF-27/RF-28/RF-35/RF-42–RF-44/RF-53–RF-56/RF-59]

- [ ] **T010-29 — Pruebas CSV malicioso y compatibilidad.** → **PARCIAL**: `CsvFieldFormatter.cs` neutraliza fórmulas, pero no se abre/guarda el CSV en hojas de cálculo soportadas.
  - **Entregable:** parsing independiente y apertura/guardado/reapertura en matriz explícita de hojas/versiones soportadas, con fórmulas, controles, Unicode, comillas y multilineales.
  - **Aceptación:** campos/filas intactos y texto inerte demostrado en alcance soportado; quoting o apóstrofo sin prueba no cierra RF-31; cabeceras sin resultados y metadata sin filas ficticias.
  - **Dependencias:** T010-15–T010-20; A-05. [RF-8/RF-26/RF-29–RF-32/RF-55/RF-59]

- [x] **T010-30 — Pruebas de autorización y privacidad de descarga.** → **HECHO**: descarga con permiso actual y baja durante preparación; pruebas `AdminClientExportTests` y `AdminAuditExportTests.GetAndDownload...`.
  - **Entregable:** cliente, admin revocado/deshabilitado, job ajeno, baja durante preparación y artefacto listo con campos que ya no se permiten.
  - **Aceptación:** nada de contactos ocultos por búsqueda/CSV, permiso inicial o URL pública como bypass; revalidar antes de entrega sin borrar historial o refrescar valores ordinarios.
  - **Dependencias:** T010-07/T010-12/T010-19/T010-20/T010-24/T010-25 y 005. [RF-1/RF-2/RF-8/RF-26/RF-29/RF-44/RF-54/RF-56–RF-58]

- [ ] **T010-31 — Pruebas de caída y resultado desconocido.** → **PARCIAL**: no hay pruebas de caída antes/durante/después de captura ni transferencia interrumpida.
  - **Entregable:** fallo antes/durante/después de captura y renderizado, conexión perdida al commit, reinicio, entrega interrumpida y destino de auditoría/correo caídos.
  - **Aceptación:** no archivo incompleto presentado como completo, snapshot perdido recreado con fecha falsa, evidencia inventada ni nuevo envío financiero por recuperar auditoría.
  - **Dependencias:** T010-05/T010-06/T010-13–T010-23/T010-27/T010-28/T010-30. [RF-9/RF-13/RF-20/RF-21/RF-32/RF-35–RF-43/RF-56–RF-59]

- [ ] **T010-32 — Verificar integración de todos los orígenes.** → **PARCIAL**: se integran auditoría de pagos/reservas, pero no los orígenes 001–009 completos ni 013.
  - **Entregable:** evidencia real de operaciones críticas de 001–009 y las aprobadas de 013, con contratos de cada propietario.
  - **Aceptación:** acción exacta `reservation.auto_cancelled`, actores/resultados/fechas/referencias correctos, reintentos distintos conservados y secreto excluido; 008 solo cuando su flujo esté especificado, sin inventarlo aquí.
  - **Dependencias:** T010-26–T010-31 y disponibilidad de orígenes. [RF-9–RF-26/RF-36–RF-41]

- [ ] **T010-33 — Validar capacidad, archivo y observabilidad.** → **PENDIENTE**: no hay capacidad, archivo ni observabilidad medidos.
  - **Entregable:** pruebas de consultas y captura/renderizado grandes, presión MVCC/vacuum, concurrencia/lotes propuestos, cleanup/restauración y métricas sin PII.
  - **Aceptación:** todos los resultados o fallo explícito sin truncamiento, autorización antes de entrega y retención indefinida consultable sin permisos de borrado runtime; no SLA universal ni capacidad ilimitada afirmada.
  - **Dependencias:** T010-20–T010-22/T010-28–T010-32. [RF-16–RF-18/RF-27–RF-35/RF-42/RF-43/RF-48/RF-49/RF-55–RF-59]

- [ ] **T010-34 — Cerrar matriz y revisar A-01–A-06.** → **PENDIENTE**: no existe matriz RF-1–RF-59 ni revisión de puertas A-01–A-06.
  - **Entregable:** RF→implementación→prueba→resultado y evidencia de contrato, inmutabilidad, recuperación, snapshot, CSV/privacidad y autorización.
  - **Aceptación:** 59 criterios sin huecos; specs/planes previos intactos; ninguna tarea cerrada por redacción ni alta de infraestructura/producción por tener plan. Identificar 008/011/012 fuera de esta cadena.
  - **Dependencias:** T010-01–T010-33. [RF-1–RF-59]

## Matriz de cobertura funcional

| Criterios 010 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-8 | T010-03/T010-07–T010-10/T010-12/T010-24/T010-25 | T010-26/T010-27/T010-30 |
| RF-9–RF-15 | T010-02/T010-04–T010-06/T010-11/T010-23 | T010-26/T010-27/T010-31/T010-32 |
| RF-16–RF-21 | T010-03/T010-04/T010-11/T010-22/T010-23 | T010-26/T010-27/T010-32/T010-33 |
| RF-22–RF-26 | T010-02/T010-08/T010-11/T010-24/T010-25 | T010-26/T010-27/T010-30/T010-32 |
| RF-27–RF-32 | T010-13–T010-20/T010-24/T010-25 | T010-26/T010-28–T010-31/T010-33 |
| RF-33–RF-35 | T010-03/T010-08–T010-12/T010-14/T010-24 | T010-26–T010-28/T010-33 |
| RF-36–RF-41 | T010-05/T010-06/T010-23 | T010-26/T010-27/T010-31/T010-32 |
| RF-42–RF-44 | T010-12–T010-20 | T010-26/T010-28/T010-30/T010-31/T010-33 |
| RF-45–RF-52 | T010-08–T010-11/T010-24/T010-25 | T010-26–T010-28/T010-33 |
| RF-53–RF-56 | T010-10/T010-12/T010-13/T010-15/T010-16/T010-19 | T010-26/T010-28–T010-31 |
| RF-57–RF-59 | T010-07/T010-15/T010-19/T010-20/T010-24/T010-25 | T010-26/T010-29–T010-31/T010-33 |

**Auditoría: 21 HECHO, 10 PARCIAL, 3 PENDIENTE.** La matriz no acredita datos leídos, auditados, conservados o exportados en una implementación real.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 21 |
| PARCIAL (entrega incompleta o sin prueba) | 10 |
| PENDIENTE (sin evidencia) | 3 |
| **Total** | **34** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
