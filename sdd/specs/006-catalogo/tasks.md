# Tareas — Spec 006: Catálogo turístico (Tours y Paquetes)

> **Fecha:** 2026-10-30. **Base:** [spec aprobada v0.46](spec.md) y [plan técnico v0.1](plan.md).  
> **Estado:** backlog no ejecutado; todas las casillas quedan pendientes.  
> Los IDs `T006` son locales a este backlog. Las referencias `RF-*` son criterios locales de 006. Las rutas de código se definirán al resolver la estructura técnica; esta actividad solo modifica `sdd/`.

## Fase 0 — Contratos y diseño

- [ ] **T006-01 — Confirmar dependencias y stack.** Entrega: contratos de actor `admin` (005), auditoría transaccional (010), almacenamiento R2 (012), frontera de cupos/precios con 001 y estructura de landing. Salida: puertas identificadas; ninguna dependencia se aprueba por inferencia. Cubre soporte de RF-1–RF-103.
- [ ] **T006-02 — Concretar modelo y puertas técnicas.** Entrega: esquema del plan §4, normalización de nombres, colación, token de concurrencia, traducción de 5 MB a bytes, límites de título/condiciones y parámetros de consulta. Salida: decisiones técnicas trazables, sin topes comerciales inventados. Referencias: RF-18, RF-59, RF-70/RF-71, RF-84, RF-89–RF-103.

## Fase 1 — Persistencia y dominio

- [ ] **T006-03 — Persistir ofertas y estado.** Entrega: migración EF Core, repositorio y lectores para tours/paquetes, estado activo/inactivo, borrado lógico, versión y clave normalizada por tipo. Salida: borradores incompletos persisten; publicados conservan integridad. Referencias: RF-8, RF-13–RF-20, RF-60, RF-84.
- [ ] **T006-04 — Persistir salidas, cupos y precios.** Entrega: salidas por oferta, fecha/hora, cupos, precio normal propio, descuento por salida y referencias de retención. Salida: una salida sin precio no es reservable; no se sobrevende. Referencias: RF-23–RF-32, RF-36, RF-49–RF-50, RF-64–RF-65.
- [ ] **T006-05 — Persistir itinerario compartido.** Entrega: días/actividades ordenados por oferta, sin variantes por salida. Salida: un cambio permitido se refleja en todas las salidas. Referencias: RF-35, RF-82–RF-83.
- [ ] **T006-06 — Persistir imágenes principal y galería.** Entrega: colección abierta de imágenes por oferta, referencia principal, metadatos de formato/tamaño y orden de presentación estable. Salida: cantidad libre sin tope comercial; mínimo una para publicar. Referencias: RF-15, RF-33, RF-66, RF-70–RF-73, RF-103.

## Fase 2 — Casos de uso administrativos

- [ ] **T006-07 — Crear y editar ofertas.** Entrega: Commands/handlers de alta desactivada y edición con validaciones de tipo, título, precio, duración, descripción, itinerario y condiciones. Salida: una edición de publicada que quite un obligatorio se rechaza y conserva lo anterior. Referencias: RF-13–RF-15, RF-18, RF-33, RF-60, RF-85–RF-88.
- [ ] **T006-08 — Activar y desactivar.** Entrega: activación solo con contenido completo, al menos una imagen válida y nombre único por tipo; desactivación conserva reservas. Salida: activación incompleta o duplicada falla; carrera de activación deja como máximo una publicada equivalente. Referencias: RF-15–RF-17, RF-33, RF-84.
- [ ] **T006-09 — Gestionar salidas y cupos.** Entrega: crear/reprogramar salidas con fecha futura en hora de Perú, ajustar cupos y desactivar salidas. Salida: se rechaza fecha inválida, reducción bajo compromisos y cambio con reservas; las reservas existentes se conservan. Referencias: RF-24–RF-27, RF-31–RF-32, RF-52, RF-64, RF-80–RF-81.
- [ ] **T006-10 — Gestionar precios y descuentos.** Entrega: precio base público, precio por salida, descuento con precio final rebajado y porcentaje informativo. Salida: se rechazan precios ≤ 0, rebajado ≤ 0, igual o superior al normal; no hay doble rebaja. Referencias: RF-21, RF-28, RF-36–RF-51, RF-64–RF-65, RF-74–RF-76.
- [ ] **T006-11 — Gestionar itinerario.** Entrega: actualización del itinerario compartido con comprobación de reservas pendientes/confirmadas en cualquier salida. Salida: con reservas se rechaza y conserva el anterior; sin reservas se aplica a todas las salidas. Referencias: RF-82–RF-83.
- [ ] **T006-12 — Proteger fecha/hora y alojamiento.** Entrega: bloqueo de reprogramación con reservas, conservación de fechas hoteleras sin reservas, ocultación temporal de propuestas y reserva solo turística. Salida: no se mueven reservas ni se desplazan fechas hoteleras por inferencia. Referencias: RF-52, RF-77–RF-79.
- [ ] **T006-13 — Auditar cambios administrativos.** Entrega: registro transaccional de creación, edición, activación, desactivación, salidas, precios, descuentos, itinerario e imágenes. Salida: una operación rechazada no figura como exitosa; fallar auditoría revierte el cambio. Referencias: RF-19, DEC-078.

## Fase 3 — Consultas públicas

- [ ] **T006-14 — Implementar catálogo por sección.** Entrega: consulta pública sin login de tours y paquetes, solo visibles, con todo el catálogo de cada sección y orden alfabético. Salida: sin ofertas se ocultan sección y enlace; no hay límite de cinco ni primera página. Referencias: RF-7–RF-10, RF-53–RF-54, RF-57–RF-59, RF-62–RF-63.
- [ ] **T006-15 — Implementar detalle público.** Entrega: descripción compartida, precio, duración, itinerario y galería; respuesta de oferta inexistente/no visible. Salida: enlace directo a oculta muestra «Oferta no disponible» sin detalle. Referencias: RF-3–RF-6, RF-11–RF-12, RF-34–RF-35, RF-55–RF-56, RF-61, RF-66, RF-68.
- [ ] **T006-16 — Implementar filtros.** Entrega: filtros de precio de tarjeta, duración con 1 día = 24 horas, fecha inclusiva con salida disponible y destino en nombre/descripción. Salida: se cumplen todos los aplicados; rango invertido se rechaza sin intercambio; vacío ofrece mensaje y limpieza. Referencias: RF-89–RF-102.
- [ ] **T006-17 — Exponer contratos OpenAPI.** Entrega: rutas públicas/admin del plan §6, DTO mínimos, códigos y ProblemDetails. Salida: ninguna ruta pública permite reservar, pagar o administrar; las admin exigen rol. Referencias: RF-1–RF-12, RF-17.

## Fase 4 — Frontend

- [ ] **T006-18 — Integrar landing por secciones.** Entrega: secciones Tours/Paquetes, tarjetas con imagen principal, título, descripción, duración y precio; visibilidad y orden del servidor. Salida: sin ofertas se ocultan sección y enlace; no se reordena en React. Referencias: RF-1–RF-2, RF-34, RF-39–RF-42, RF-57–RF-59, RF-62–RF-63.
- [ ] **T006-19 — Integrar detalle y galería.** Entrega: detalle completo, itinerario por días, galería y presentación de descuento. Salida: sin datos inventados; oferta oculta no muestra detalle. Referencias: RF-3–RF-6, RF-11, RF-35, RF-55–RF-56, RF-61, RF-66, RF-74–RF-76.
- [ ] **T006-20 — Integrar filtros y estados.** Entrega: controles de precio, duración, fechas y destino; validación de rangos; mensajes exactos y limpieza. Salida: un error no se muestra como búsqueda vacía. Referencias: RF-89–RF-102.
- [ ] **T006-21 — Integrar panel administrativo.** Entrega: ofertas, salidas, cupos, precios, descuentos, itinerario e imágenes; estado y errores reales. Salida: edición incompleta no publica; fallo de imagen conserva la anterior y muestra el mensaje exacto. Referencias: RF-13–RF-22, RF-33, RF-36–RF-52, RF-60, RF-67–RF-73, RF-77–RF-88, RF-103.

## Fase 5 — Verificaciones

- [ ] **T006-22 — Pruebas de publicación, edición y unicidad.** Evidencia: alta desactivada, activación incompleta, edición que quita obligatorios, nombres equivalentes por mayúsculas/espacios, mismo nombre entre tour y paquete permitido, carreras de activación. Referencias: RF-13–RF-20, RF-33, RF-60, RF-84–RF-88.
- [ ] **T006-23 — Pruebas de salidas, fechas y alojamiento.** Evidencia: fecha pasada/actual/futura en Perú, cambio con reservas, reducción de cupos, reprogramación sin reservas, fechas hoteleras conservadas y opciones ocultas. Referencias: RF-24–RF-27, RF-31–RF-32, RF-52, RF-77–RF-81.
- [ ] **T006-24 — Pruebas de precios y descuentos.** Evidencia: precio por salida, salida sin precio no reservable, precios ≤ 0, rebajado inválido, porcentaje exacto/fraccionario/menor al 1 %, sin doble rebaja y conservación histórica. Referencias: RF-21, RF-28, RF-36–RF-51, RF-64–RF-65, RF-74–RF-76.
- [ ] **T006-25 — Pruebas de filtros y catálogo.** Evidencia: secciones completas, orden alfabético, visibilidad por disponibilidad, precio de tarjeta, duración 24 horas, fechas inclusivas, destino en uno/dos campos, combinación, rangos invertidos y vacío/limpieza. Referencias: RF-7–RF-12, RF-53–RF-63, RF-89–RF-102.
- [ ] **T006-26 — Pruebas de imágenes.** Evidencia: formatos JPG/PNG/WebP, tamaño inferior/igual/superior a 5 MB, muchas fotos sin rechazo por cantidad, fallo con/sin imagen previa, conservación y mensaje exacto. Referencias: RF-66, RF-70–RF-73, RF-103.
- [ ] **T006-27 — Pruebas de concurrencia y auditoría.** Evidencia: última unidad sin sobreventa, reserva concurrente frente a reprogramación, dos activaciones equivalentes, conflicto de versión, auditoría de éxitos y ausencia de registro de rechazos. Referencias: RF-19, RF-25, RF-31–RF-32, RF-52, RF-84.
- [ ] **T006-28 — Verificación de extremo a extremo.** Evidencia: crear inactivo → completar → activar → consultar sin login → filtrar → abrir detalle → reservar con 001; editar, desactivar y recuperar visibilidad. Referencias: RF-1–RF-103 según matriz del plan §9.

## Fase 6 — Cierre trazable

- [ ] **T006-29 — Cerrar puertas técnicas y evidencia.** Entrega: matriz de cobertura RF-1–RF-103 con evidencia, puertas ACL-13/ACL-17, ACL-29, ACL-30 y AC01 resueltas o explícitamente pendientes. Salida: ninguna prueba simulada se presenta como integración real. Depende de T006-22–T006-28.
- [ ] **T006-30 — Actualizar estado y documentación de entrega.** Entrega: enlaces a implementación/pruebas en trazabilidad y registro de decisiones técnicas; preservar el texto aprobado de 006 v0.46. No marcar completa esta tarea por haber redactado el plan. Requiere una actividad posterior que autorice cambios fuera de `sdd/`.

## Dependencias y reglas de ejecución

- T006-01/T006-02 concretan contratos y diseño antes de migraciones o integraciones finales; los IDs T006 son locales.
- 005, 007, 010 y 012 requieren contratos aprobados. Se puede probar con dobles, pero T006-27–T006-29 no se cierran sin las integraciones reales.
- La frontera con 001 debe validar cupos y precios históricos sin duplicar reglas de reserva.
- No se ejecuta código ahora, no se modifican 001/013 ni sus planes/tareas, y no se crean commits o push.
