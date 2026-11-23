# Tareas — 013: Movilidad informativa

> **Fecha:** 2026-10-23. **Base:** [spec aprobada v0.3](spec.md) y [plan técnico v0.1](plan.md).  
> **Estado:** backlog no ejecutado; todas las casillas quedan pendientes.  
> Los IDs T013 evitan colisiones con las tareas de Reservas. Las referencias RF son criterios locales de 013, no RF originales del proyecto. Las rutas de entrega de código se definirán al resolver la estructura técnica, no se crean en esta actividad.

## Fase 0 — Cierre de contratos y diseño

- [ ] **T013-01 — Confirmar bases y contratos transversales.** Dependencias: ninguna. Entrega: registrar versiones/estructura (ACL-18), entorno/secretos (ACL-20), contrato de actor `admin` (005), escritor transaccional de auditoría (010) y almacenamiento R2 compartido (012). Salida: decisiones/contratos trazables, sin aprobar las specs enteras por inferencia. Las integraciones reales quedan bloqueadas mientras falte su contrato. Cubre soporte de RF-1–RF-32.
- [ ] **T013-02 — Concretar modelo y reglas persistibles.** Depende de T013-01 para estructura. Entrega: esquema propuesto del plan §4, campos opcionales de borrador, invariantes de activo, normalización idéntica en todas las escrituras, colación alfabética y token de concurrencia. Ratificar traducción de 5 MB a bytes para API/pruebas. Salida: no se altera nombre/tipo único entre activos ni se obliga a publicar borradores incompletos. Referencias: RF-3, RF-7–RF-12, RF-16–RF-25.

## Fase 1 — Persistencia, autorización e imagen

- [ ] **T013-03 — Crear persistencia de categorías.** Depende de T013-02. Entrega futura: migración EF Core, repositorio y lectores con PostgreSQL; índice único parcial para clave normalizada activa y protección de versión. Salida: borradores duplicados no se fusionan, un activo duplicado no se guarda, las ediciones no eluden validación de publicación. Referencias: RF-7–RF-12, RF-16–RF-24.
- [ ] **T013-04 — Integrar autorización administrativa.** Depende de T013-01 y contrato 005; **bloqueada para uso real hasta ese contrato**. Entrega: controles HTTP y Application para crear/editar/activar/desactivar/cargar imagen; lectura pública anónima. Salida: visitante/cliente no modifica ni carga archivos mediante llamadas directas. Referencias: RF-1, RF-13.
- [ ] **T013-05 — Validar imagen principal.** Depende de T013-02. Entrega: validación compartida de extensión, MIME y contenido real JPG/JPEG, PNG o WebP; una imagen principal, límite inclusivo de 5 MB con bytes acordados; detener cargas inválidas antes de R2. Salida: casos de formato falso, corrupto y tamaño excesivo identificados, sin publicación de imagen inválida. Referencias: RF-3, RF-19, RF-22, RF-23, RF-30.
- [ ] **T013-06 — Integrar carga/reemplazo sin pérdida de imagen anterior.** Depende de T013-03–T013-05 y contratos R2/Audit; **bloqueada en producción por acceso/conservación de objetos ACL-13/ACL-17**. Entrega: nueva clave por carga, fuera de transacción SQL; publicar referencia solo tras carga válida y commit con auditoría/versión. Salida: falla de carga/commit/concurrencia conserva anterior; sin anterior mantiene inactivo; mensaje exacto acordado. No añadir galería, reintentos automáticos o job de limpieza. Referencias: RF-3, RF-19, RF-22, RF-23, RF-27, RF-30–RF-32.

## Fase 2 — Casos de uso y API

- [ ] **T013-07 — Crear y editar categorías con auditoría.** Depende de T013-03/T013-04 y contrato 010; **integración real de auditoría bloqueada hasta acordarlo**. Entrega: Commands/handlers de creación inactiva y edición; cambio local y auditoría en un commit. Salida: edición de activo no permite datos incompletos ni nombre duplicado; fallar auditoría revierte el cambio. Referencias: RF-7, RF-8, RF-12, RF-13, RF-16–RF-24, RF-26, RF-27.
- [ ] **T013-08 — Activar y desactivar con invariantes.** Depende de T013-03/T013-04/T013-05/T013-07; consume referencia de imagen válida de T013-06. Entrega: Commands de estado explícitos, validación completa e índice único aplicado; auditoría transaccional. Salida: activar sin datos admitidos falla; desactivar conserva el registro administrable; carrera de activación produce como máximo un activo equivalente. Referencias: RF-9–RF-13, RF-17–RF-24, RF-28, RF-29.
- [ ] **T013-09 — Definir y exponer consultas/contrato OpenAPI.** Depende de T013-03/T013-04 y casos de uso para sus operaciones de escritura. Entrega: rutas propuestas del plan §5, DTO público mínimo, listado/lectura admin, colección pública de activos ordenada y errores ProblemDetails documentados. Salida: ninguna ruta pública de detalle individual, alquiler, precio o reserva; leer sin login funciona y la lista admin no filtra inactivos. Referencias: RF-1–RF-6, RF-10–RF-16, RF-25, RF-30.

## Fase 3 — Interfaz

- [ ] **T013-10 — Integrar sección y navegación pública.** Depende de T013-09 y estructura de landing acordada en T013-01. Entrega: tarjetas con datos de categoría y una imagen, orden del servidor y enlace hacia sección; sección/enlace derivados del mismo conjunto. Salida: cero activos oculta ambos, primer activo muestra ambos y no crea detalle individual ni botón comercial. Referencias: RF-1–RF-6, RF-11, RF-14–RF-16, RF-25.
- [ ] **T013-11 — Integrar formulario/listado admin.** Depende de T013-06–T013-09 y autorización real. Entrega: crear/editar, estado visible, activar/desactivar, cargar/reemplazar una imagen. Salida: datos incompletos permanecen inactivos, los errores se muestran sin éxito ficticio; la imagen previa se conserva visualmente ante fallo, registro sin imagen permanece inactivo. Referencias: RF-7–RF-13, RF-17–RF-24, RF-30–RF-32.

## Fase 4 — Verificaciones de comportamiento

- [ ] **T013-12 — Pruebas aisladas de publicación/validación.** Depende de T013-05/T013-07/T013-08. Evidencia: campos requeridos para activo frente a borrador, entero positivo, formatos, capacidad ausente, normalización sin mayúsculas/espacios exteriores y límite exacto/inferior/superior de bytes. No usar dobles para afirmar garantías de PostgreSQL. Referencias: RF-7–RF-9, RF-17–RF-24, RF-30.
- [ ] **T013-13 — Integración con PostgreSQL y permisos HTTP.** Depende de T013-03/T013-04/T013-07–T013-09. Evidencia: dos activaciones simultáneas con nombre equivalente, renombre de activo hacia otro existente, persistencia de inactivos, rollback ante auditoría fallida, lista pública solo activa y orden alfabético. Consultas anónimas permitidas y mutaciones directas negadas sin admin. Referencias: RF-1, RF-7–RF-29.
- [ ] **T013-14 — Fallos de imagen y concurrencia de reemplazo.** Depende de T013-06 y entorno de integración. Evidencia: fallo de validación, R2 indisponible, carga aceptada con commit SQL fallido, conflicto de versión y dos reemplazos simultáneos; con/sin imagen anterior. Debe haber una sola referencia persistida válida, mensaje acordado y ninguna destrucción de imagen referenciada. Referencias: RF-19, RF-22, RF-23, RF-27, RF-30–RF-32.
- [ ] **T013-15 — Verificación de extremo a extremo de landing/admin.** Depende de T013-10/T013-11 y controles reales. Evidencia: crear inactivo → completar → activar → consultar sin cuenta → editar → desactivar último activo. Comprobar visibilidad conjunta de sección/enlace, campos, orden, fallo de imagen y ausencia de detalle/galería/contratación. Referencias: RF-1–RF-32, según matriz del plan §9.
- [ ] **T013-16 — Contratos y arquitectura.** Depende de T013-09 y adaptadores completos. Evidencia: OpenAPI/ProblemDetails reflejan resultados reales; Domain no referencia SDK/EF/HTTP; autorización no depende solo de botones; adaptadores implementan puertos sin nuevo servicio desplegable. Referencias: AC04, AC08, AC11, RC04–RC07, ADR-001–ADR-003/ADR-015–ADR-016.

## Fase 5 — Cierre trazable

- [ ] **T013-17 — Cerrar cobertura y pendientes técnicos.** Depende de T013-12–T013-16. Entrega: matriz del plan §9 con evidencia por RF-1–RF-32 y decisiones de las puertas del plan §8, incluidas conservación/acceso de imágenes y colación. Salida: ninguna prueba simulada presentada como evidencia real de integración.
- [ ] **T013-18 — Actualizar estado y documentación de entrega.** Depende de T013-17 y autorización de la actividad de implementación futura. Entrega: enlaces a implementación/pruebas en trazabilidad y registro de decisiones técnicas; preservar aprobación y texto funcional de 013 v0.3. No marcar completa esta tarea por haber redactado el plan.

## Dependencias y reglas de ejecución

- T013-01/T013-02 concretan el diseño antes de migraciones o contratos finales; los IDs T013 son locales a este backlog.
- Autorización 005, auditoría 010 y almacenamiento R2 real requieren contratos acordados. Se pueden probar reglas con dobles, pero T013-13–T013-17 no se cierran sin las integraciones correspondientes.
- Pruebas de concurrencia se requieren por unicidad/actualización y conservación de imágenes, no por sobreventa: Movilidad no administra cupos.
- No se ejecuta código ahora, no se modifican las specs aprobadas ni el plan/tareas de Reservas, y no se crean commits o push. Implementar exige una actividad posterior que permita cambios fuera de `sdd/`.
