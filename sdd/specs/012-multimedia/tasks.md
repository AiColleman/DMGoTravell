# Tareas — Spec 012: Multimedia

> **Fecha:** 2026-11-02. **Base:** [spec v0.1 aprobada](spec.md), 32 criterios, DEC-197; [plan v0.1](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  

U-01–U-06 permanecen abiertas hasta evidencia futura. Los parámetros técnicos propuestos no son nuevas cuotas comerciales o decisiones de negocio del usuario.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Contratos y seguridad de admisión

- [ ] **T012-01 — Verificar alcance y consumidores.** → **PARCIAL**: consumidores 006/007/013 implementados en `MediaEndpoints.cs`, pero no la matriz RF-1–RF-32.
  - **Entregable:** matriz RF-1–RF-32, reglas de 006/007/013, identidad/auditoría y obligaciones históricas.
  - **Aceptación:** sin nuevas galerías de Movilidad, mínimos de habitación, editor o biblioteca global; specs/planes previos intactos.
  - **Dependencias:** autorización futura y specs aprobadas.
- [ ] **T012-02 — Verificar R2/SDK y permisos de cuenta.** → **PENDIENTE**: no hay cuenta R2/SDK; el almacenamiento es `LocalSandboxMediaStorage.cs`.
  - **Entregable:** versión/operaciones/checksums/retries/timeout y bucket privado documentados con evidencia oficial y sandbox autorizado posteriormente.
  - **Aceptación:** no equiparar compatibilidad S3 con soporte de todo AWS o ausencia con escritura concluida; no acceso público directo a borradores.
  - **Dependencias:** T012-01, autorización específica para sandbox. [RF-3/RF-9/RF-24/RF-31/RF-32]
- [x] **T012-03 — Seleccionar validación de contenido y unidad del límite.** → **HECHO**: `ImageSignatureValidator.cs` valida MIME y contenido real JPG/PNG/WebP con límite de 5 MB; prueba `Phase6IntegrationsTests.Media_UploadValidate...`.
  - **Entregable:** decoder/versión/licencia/runtime, aliases JPG/JPEG, MIME y máximo propuesto de 5.000.000 bytes inclusivos por archivo.
  - **Aceptación:** validar contenido completo antes de R2; exacto límite no rechazado por overhead multipart; no librería instalada o exclusión de clase admitida por suposición.
  - **Dependencias:** T012-01; U-01. [RF-4–RF-7]
- [ ] **T012-04 — Dimensionar procesamiento seguro.** → **PARCIAL**: se acota la lectura por bytes, pero no hay límites de dimensiones/píxeles/memoria ni decodificación de imagen.
  - **Entregable:** límites de dimensiones/píxeles/frames/memoria/tiempo/concurrencia y lectura con contador real.
  - **Aceptación:** archivo comprimido no fuerza memoria ilimitada; límites compatibles con contrato o conflicto visible antes de habilitar; sin cupo comercial de fotos o destino local durable.
  - **Dependencias:** T012-03 y runtime objetivo. [RF-3–RF-7/RF-17/RF-29]
- [x] **T012-05 — Modelar activo, operaciones y clave inmutable.** → **HECHO**: `MediaAsset.cs` con versión, propietario/uso y clave opaca; prueba `Phase6DomainTests.MediaAsset_ValidationReplaceAndPublication_ShouldWork`.
  - **Entregable:** metadata de integridad, estado/versión, operación, propietario/uso, clave nueva no predecible y publicación histórica.
  - **Aceptación:** no sobrescritura de antigua, bucket/key del cliente, blobs en base de negocio o secretos en respuesta pública.
  - **Dependencias:** T012-01/T012-02/T012-03. [RF-2/RF-3/RF-8/RF-25/RF-31]
- [ ] **T012-06 — Contratar referencias y bloqueo con consumidores.** → **PARCIAL**: las referencias se asocian por entidad, pero no hay protocolo transaccional único ni bloqueo de consumidores.
  - **Entregable:** protocolo transaccional de asociación/activación/principal/historial para todos los escritores de 006/007/013.
  - **Aceptación:** registro de referencias no eventualmente consistente para borrar; origen que no participa o no responde impide limpiar; auditoría no se borra por retirar bytes.
  - **Dependencias:** T012-01/T012-05 y contratos reales 006/007/013/010. [RF-2/RF-12–RF-17/RF-21/RF-22/RF-26]

## Fase 1 — Carga, publicación y principal

- [x] **T012-07 — Integrar autorización y destino/uso válido.** → **HECHO**: endpoints admin con autorización y uso/ID validados; prueba `Media_UploadValidateReplaceDeleteAndServe...`.
  - **Entregable:** administrador vigente, protección CSRF/cookies aplicable, identidad de consumidor y versión revalidadas.
  - **Aceptación:** cliente/anónimo/rol retirado no gestiona; ruta/ID/uso manipulado no permite asociar un archivo ajeno o galería no admitida.
  - **Dependencias:** T012-05/T012-06 y 005. [RF-1/RF-2/RF-12/RF-16]
- [x] **T012-08 — Implementar admisión previa a almacenamiento.** → **HECHO**: validación completa antes de escribir en `MediaHandlers.cs`; prueba `Media_UploadValidate...`.
  - **Entregable:** carga backend con lectura acotada, extensión/MIME/contenido/tamaño completos validados.
  - **Aceptación:** inválido nunca se escribe primero en R2; no confiar en magic bytes/Content-Length únicamente ni cargar desde URL arbitraria.
  - **Dependencias:** T012-03/T012-04/T012-07. [RF-4–RF-7/RF-18/RF-31]
- [ ] **T012-09 — Integrar subida y confirmación de integridad.** → **PARCIAL**: `LocalSandboxMediaStorage.cs` guarda el archivo, sin verificación de huella/ETag ni PUT a R2.
  - **Entregable:** operación durable, PUT a clave propia nueva y comprobación de tamaño/formato/huella del origen según soporte verificado.
  - **Aceptación:** almacenamiento no anunciado como asociación/publicación; no ETag=hash asumido, borrado de anterior o retry ciego ante timeout.
  - **Dependencias:** T012-02/T012-05/T012-08. [RF-3/RF-8/RF-18–RF-20/RF-25]
- [x] **T012-10 — Confirmar asociación/publicación y auditoría.** → **HECHO**: asociación/publicación y auditoría en `MediaHandlers.cs`; prueba `Media_UploadValidateReplaceDeleteAndServe...`.
  - **Entregable:** commit local con referencias/uso/versión/primera publicación y evidencia saneada.
  - **Aceptación:** fallo de auditoría o conflicto conserva asociación anterior; commit desconocido se verifica antes de compensar/repetir; no archivo guardado ficticio.
  - **Dependencias:** T012-06/T012-07/T012-09 y 010. [RF-8/RF-12/RF-19/RF-20/RF-25–RF-28]
- [ ] **T012-11 — Integrar preview y publicación histórica con activación.** → **PARCIAL**: existe preview admin y lectura pública, pero no publicación histórica ligada a activación del consumidor.
  - **Entregable:** publicación solo al ser realmente público el consumidor y preview administrativo por backend.
  - **Aceptación:** conocer enlace de borrador no basta; activar/asociar a público marca publicación bajo protocolo común; foto pública luego desactivada conserva lectura mientras exista.
  - **Dependencias:** T012-06/T012-07/T012-10. [RF-9–RF-11/RF-31/RF-32]
- [ ] **T012-12 — Integrar lectura segura de fotos publicadas.** → **PARCIAL**: `GET /api/v1/media/{id}` sirve la imagen con `Cache-Control: public, max-age=300`, sin `nosniff` ni `no-store` inicial.
  - **Entregable:** ruta opaca con marca histórica, MIME/nombre seguros, `nosniff`, caché inicial no-store y origen privado.
  - **Aceptación:** lectura no revela metadata administrativa, publica servicio desactivado o aplica permiso publicitario a PDF/CSV/tokens; fallo no modifica foto/servicio.
  - **Dependencias:** T012-02/T012-05/T012-11. [RF-9–RF-11/RF-29–RF-32]
- [ ] **T012-13 — Aplicar sustitución explícita de principal.** → **PARCIAL**: `isPrimary` permite sustituir la principal, pero no hay prueba de sustitución explícita ni bloqueo del elemento.
  - **Entregable:** elección de sustituta asociada válida y versión/locks del elemento en la misma operación.
  - **Aceptación:** sin elección conservar actual, no asignar arbitrariamente o dejar activo incompleto; concurrencia no usa sustituta ya retirada.
  - **Dependencias:** T012-06/T012-10 y 006/007. [RF-12–RF-14/RF-19/RF-20/RF-26]
- [x] **T012-14 — Mantener reglas de habitación/Movilidad/cantidad.** → **HECHO**: hotel/habitación/movilidad y galerías soportadas; prueba `Media_...AcrossAllEntities`.
  - **Entregable:** adaptadores que permiten habitación sin fotos, Movilidad una y galerías sin máximo comercial donde ya están aprobadas.
  - **Aceptación:** sin placeholders, mínimo opcional convertido en obligatorio, galería de Movilidad o cupo nuevo; carga fallida conserva anterior o inactivo sin imagen según 013.
  - **Dependencias:** T012-06/T012-10/T012-13 y 006/007/013. [RF-14–RF-20]
- [ ] **T012-15 — Resolver repetición y cambios simultáneos.** → **PARCIAL**: los comandos usan idempotencia general, pero no hay prueba de dos cargas simultáneas ni payload distinto.
  - **Entregable:** identidad/payload/versionado, locks ordenados y resultados reutilizables de la misma operación.
  - **Aceptación:** mismo ID con otro contenido no se aplica, replay no duplica relaciones/auditoría y worker tardío no cambia otra generación/clave.
  - **Dependencias:** T012-05/T012-06/T012-09–T012-14. [RF-8/RF-19/RF-20/RF-25–RF-28]

## Fase 2 — Referencias y recuperación

- [ ] **T012-16 — Separar retirada lógica y limpieza física.** → **PARCIAL**: existe baja lógica/borrado del endpoint, pero la limpieza física no está implementada.
  - **Entregable:** asociación retirada válidamente, candidato sin referencias y estado físico por separado.
  - **Aceptación:** no borrar previamente la antigua o declarar eliminación física por quitar enlace; historial protegido impide limpiar.
  - **Dependencias:** T012-06/T012-10/T012-13–T012-15. [RF-14/RF-19–RF-24/RF-27/RF-28]
- [ ] **T012-17 — Integrar comprobación de referencias y fence durable.** → **PENDIENTE**: no hay comprobación de referencias ni fence durable antes de borrar.
  - **Entregable:** lease/protocolo que cierra nuevas asociaciones antes del envío de borrado y verifica todos los orígenes.
  - **Aceptación:** asociación concurrente gana antes del fence o se rechaza; origen caído/obligación histórica desconocida no significa cero; lease vencido no reabre activo en borrado.
  - **Dependencias:** T012-06/T012-15/T012-16. [RF-21–RF-23/RF-25/RF-26]
- [ ] **T012-18 — Implementar limpieza por clave exacta.** → **PARCIAL**: `LocalSandboxMediaStorage.cs` borra por clave, sin verificación de resultado contra origen remoto.
  - **Entregable:** intención local durable, DELETE fuera de transacción de red y verificación de resultado contra origen.
  - **Aceptación:** no lifecycle global por edad, borrado de otra generación/referencia vigente ni cerrar físicamente por 403/timeout; evidencia previa conservada.
  - **Dependencias:** T012-02/T012-17. [RF-21–RF-26/RF-27]
- [ ] **T012-19 — Reconciliar escrituras/borrados desconocidos.** → **PENDIENTE**: no hay tombstones ni reconciliación de escrituras/borrados desconocidos.
  - **Entregable:** tombstones, revisión de retries SDK y resultado desconocido conservado mientras puedan terminar escrituras anteriores.
  - **Aceptación:** un 404 no concluye PUT en vuelo; no clave reutilizada o cierre definitivo por TTL; objeto aparecido tarde se reconcilia sin referencia nueva expuesta.
  - **Dependencias:** T012-02/T012-09/T012-15/T012-17/T012-18. [RF-8/RF-19/RF-21–RF-26]
- [ ] **T012-20 — Programar recuperación y diagnóstico saneados.** → **PENDIENTE**: no hay recuperación programada ni diagnóstico de limpieza.
  - **Entregable:** revisión propuesta cada 15 minutos, edad candidata de 24 horas, backoff y métricas/estado consultable.
  - **Aceptación:** no SLA de borrado o retry automático de carga en UI, correo nuevo inferido o incidente guardado únicamente como éxito; claves/secretos fuera de logs públicos.
  - **Dependencias:** T012-16–T012-19 y 010. [RF-23–RF-29/RF-31]
- [ ] **T012-21 — Integrar API/UI y aislamiento de fallos.** → **PARCIAL**: `AdminCommercialPage.tsx` y `services.ts` permiten cargar/reemplazar imágenes; faltan reintentos y prueba de aislamiento.
  - **Entregable:** OpenAPI, comandos/preview/lectura, estado pendiente/confirmado y errores/mensaje acordados.
  - **Aceptación:** «No se pudo cargar la imagen» y conservación de anteriores; caída de lectura no desactiva/borra ni bloquea negocio no relacionado; sin carga masiva/orden manual nuevos.
  - **Dependencias:** T012-07–T012-20. [RF-1–RF-20/RF-24–RF-32]

## Fase 3 — Pruebas y puertas
- [ ] **T012-22 — Pruebas unitarias de admisión y reglas.** → **PARCIAL**: la admisión se prueba en integración (`Media_...`), no en una suite unitaria de límites y alias.
  - **Entregable:** formatos/aliases/MIME falsos, corrupto/vacío/truncado, fronteras de tamaño, principal/opcionalidad/cantidad.
  - **Aceptación:** bytes exactos inclusivos aceptables por tamaño, inválido no enviado a storage y reglas heredadas preservadas; dobles no acreditan R2 real.
  - **Dependencias:** T012-08/T012-13–T012-15/T012-21. [RF-1–RF-8/RF-12–RF-20]
- [ ] **T012-23 — Pruebas de PostgreSQL, auditoría y carreras.** → **PARCIAL**: hay pruebas de asociación/reemplazo, no de commit desconocido ni fence contra asociación.
  - **Entregable:** commit desconocido, activación/publicación, dos principales/retiradas, referencias compartidas y fence contra asociación.
  - **Aceptación:** no activo incompleto, foto anterior perdida o referencia real ausente del registro; auditoría requerida fallida aborta cambio controlable.
  - **Dependencias:** T012-06/T012-10–T012-20 y módulos reales. [RF-2/RF-8–RF-28]
- [ ] **T012-24 — Pruebas R2/SDK en sandbox autorizado.** → **PENDIENTE**: no hay pruebas contra R2/SDK en sandbox.
  - **Entregable:** PUT/HEAD/GET/DELETE, checksum, timeout/retry, lectura negativa seguida de PUT tardío, credenciales limitadas y acceso privado.
  - **Aceptación:** evidencia real contra origen sin CDN, borradores no públicos y ninguna afirmación de ausencia final ante escritura aún posible; solo objetos propios de prueba autorizados.
  - **Dependencias:** T012-02/T012-09/T012-12/T012-18/T012-19 y autorización de cuenta/objetos. [RF-3/RF-8–RF-11/RF-19–RF-26/RF-31/RF-32]
- [ ] **T012-25 — Pruebas de permisos/filtración/abuso.** → **PARCIAL**: se prueba autorización admin y validación, no IDs/destinos manipulados ni decodificación hostil.
  - **Entregable:** cliente/admin revocado, IDs/destinos/key/URL manipulados, preview adivinable, nombres maliciosos y decodificación hostil.
  - **Aceptación:** sin credenciales, accesos directos, SSRF/path traversal o autorización por enlace de documento privado; consumo acotado compatible con contrato.
  - **Dependencias:** T012-03/T012-04/T012-07/T012-11/T012-12/T012-21/T012-24. [RF-1–RF-9/RF-11/RF-29–RF-32]
- [ ] **T012-26 — Pruebas de recuperación y fallos parciales.** → **PARCIAL**: no hay inyección de fallos entre validación/PUT/commit/auditoría/borrado.
  - **Entregable:** fallo entre validación/PUT/commit/auditoría/respuesta/DELETE/confirmación, reinicio/lease vencido y origen de referencias caído.
  - **Aceptación:** asociación anterior preservada, desconocido no anunciado completado, no limpieza de activo protegido ni retry ciego; operación remota y local no tratadas como atómicas.
  - **Dependencias:** T012-15–T012-24. [RF-8/RF-18–RF-30]
- [x] **T012-27 — Pruebas E2E de consumidores y enlaces.** → **HECHO**: `Media_...AcrossAllEntities` recorre oferta, hotel, habitación y movilidad, incluida lectura/borrado.
  - **Entregable:** oferta/hotel activo con principal elegida, tipo opcional sin foto, Movilidad con única imagen y foto publicada luego desactivada.
  - **Aceptación:** enlace publicitario conserva lectura mientras exista sin republicar metadata, borrador sigue privado, sin placeholder/galería nuevos o credenciales del navegador.
  - **Dependencias:** T012-21–T012-26 y 005/006/007/010/013. [RF-1–RF-32]
- [ ] **T012-28 — Validar carga/capacidad/runtime.** → **PENDIENTE**: no hay mediciones de memoria/concurrencia/egress ni Linux.
  - **Entregable:** mediciones de memoria/decodificación, concurrencia/egress, referencias muchas y caída de storage bajo carga.
  - **Aceptación:** límite técnico no se convierte en máximo comercial o SLA ficticio; no bloqueo de reservas/pagos por lectura caída; Linux/decoder/licencias acreditados.
  - **Dependencias:** T012-04/T012-20–T012-27. [RF-3–RF-7/RF-17/RF-23/RF-29–RF-32]
- [ ] **T012-29 — Documentar operación y reconciliación.** → **PENDIENTE**: no existe runbook de operación/reconciliación.
  - **Entregable:** runbook de pendientes/incidentes, claves inmutables, fences, configuración privada y referencias históricas.
  - **Aceptación:** no resolución con borrado amplio, nuevas URLs públicas o supresión de auditoría; canal adicional/relajación de contrato requiere aprobación independiente.
  - **Dependencias:** T012-20/T012-23–T012-28. [RF-21–RF-32]
- [ ] **T012-30 — Cerrar cobertura y revisar U-01–U-06.** → **PENDIENTE**: no existe matriz RF-1–RF-32 ni revisión de puertas U-01–U-06.
  - **Entregable:** RF→implementación→prueba→resultado y evidencias de contratos/runtime/proveedor/permisos/recuperación.
  - **Aceptación:** 32 criterios cubiertos, planes anteriores preservados; ninguna puerta o tarea cerrada por redacción ni autorización de producción inferida.
  - **Dependencias:** T012-01–T012-29. [RF-1–RF-32]

## Matriz de cobertura funcional

| Criterios 012 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-8 | T012-01–T012-10/T012-15 | T012-22–T012-28 |
| RF-9–RF-11 | T012-02/T012-05–T012-07/T012-10–T012-12 | T012-23–T012-27 |
| RF-12–RF-17 | T012-01/T012-06/T012-07/T012-10/T012-13–T012-15 | T012-22/T012-23/T012-27/T012-28 |
| RF-18–RF-24 | T012-08–T012-10/T012-13–T012-20 | T012-22–T012-28 |
| RF-25–RF-28 | T012-05/T012-06/T012-10/T012-15–T012-20 | T012-23/T012-24/T012-26/T012-27/T012-29 |
| RF-29–RF-32 | T012-04/T012-05/T012-07/T012-11/T012-12/T012-20/T012-21 | T012-25–T012-29 |

**Auditoría: 7 HECHO, 15 PARCIAL, 8 PENDIENTE.** Lectura pública y trazabilidad no prueban cuenta/configuración, seguridad efectiva, limpieza o preservación bajo fallos reales.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 7 |
| PARCIAL (entrega incompleta o sin prueba) | 15 |
| PENDIENTE (sin evidencia) | 8 |
| **Total** | **30** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
