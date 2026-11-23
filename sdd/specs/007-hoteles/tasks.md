# Tareas — Spec 007: Hoteles y alojamiento

> **Fecha:** 2026-10-31. **Base:** [spec aprobada v0.2](spec.md) y [plan técnico v0.1](plan.md).  
> **Estado:** backlog no ejecutado; todas las casillas quedan pendientes.  
> Los IDs `T007` son locales a este backlog. Las referencias `RF-*` son criterios locales de 007. Las rutas de código se definirán al resolver la estructura técnica; esta actividad solo modifica `sdd/`.

## Fase 0 — Contratos y diseño

- [ ] **T007-01 — Confirmar dependencias y stack.** Entrega: contratos de actor `admin` (005), auditoría transaccional (010), almacenamiento R2 (012), frontera de salidas/reprogramación (006) y reserva compuesta/cupos/importes (001). Salida: puertas identificadas; ninguna dependencia se aprueba por inferencia. Cubre soporte de RF-1–RF-58.
- [ ] **T007-02 — Concretar modelo y puertas técnicas.** Entrega: esquema del plan §4, normalización de nombres, colación, token de concurrencia, traducción de 5 MB a bytes, zona `America/Lima`, períodos de 24 horas y parámetros de consulta. Salida: decisiones técnicas trazables, sin topes comerciales inventados. Referencias: RF-7, RF-20, RF-25, RF-32/RF-33, RF-45–RF-50, RF-58.

## Fase 1 — Persistencia y dominio

- [ ] **T007-03 — Persistir hoteles y servicios.** Entrega: migración EF Core, repositorio y lectores para hoteles, descripción, servicios como lista libre, estado activo/inactivo, borrado lógico, versión y clave normalizada. Salida: borradores incompletos persisten; activos conservan integridad. Referencias: RF-13–RF-21, RF-54, RF-58.
- [ ] **T007-04 — Persistir tipos de habitación.** Entrega: tipos por hotel, nombre, capacidad, tarifa base PEN con dos decimales, estado, borrado lógico, versión y clave normalizada por hotel. Salida: nombre único dentro del hotel; capacidad/tarifa válidas. Referencias: RF-22–RF-28.
- [ ] **T007-05 — Persistir inventario por fecha/noche.** Entrega: filas por tipo y fecha, cantidad entera no negativa, compromisos y token de concurrencia. Salida: disponibilidad exige todas las noches; reducción bajo compromisos se rechaza. Referencias: RF-29–RF-30, RF-37–RF-39, RF-44.
- [ ] **T007-06 — Persistir propuestas de alojamiento.** Entrega: propuesta por salida/hotel/período, estado, fechas pendientes de ajuste, versión y relación con la salida. Salida: todos los tipos activos se derivan del hotel; no hay tarifa por propuesta ni subconjunto de tipos. Referencias: RF-3–RF-4, RF-34–RF-44, RF-57.
- [ ] **T007-07 — Persistir imágenes de hotel y tipo.** Entrega: colecciones abiertas de imágenes, referencia principal, metadatos de formato/tamaño y orden estable. Salida: cantidad libre sin tope comercial; hotel requiere al menos una para activar; tipo puede no tener fotos. Referencias: RF-45–RF-50, RF-55–RF-56.

## Fase 2 — Casos de uso administrativos

- [ ] **T007-08 — Crear y editar hoteles.** Entrega: Commands/handlers de alta desactivada y edición con validaciones de nombre, descripción y servicios. Salida: una edición que deje incompleto un hotel activo se rechaza y conserva lo anterior. Referencias: RF-13–RF-16, RF-20–RF-21, RF-54, RF-58.
- [ ] **T007-09 — Activar, desactivar y eliminar hoteles.** Entrega: activación solo con contenido completo, al menos una imagen y al menos un tipo válido; desactivación y borrado lógico conservan reservas. Salida: activación incompleta o duplicada falla; carrera de activación deja como máximo un hotel activo equivalente. Referencias: RF-14–RF-21, RF-51–RF-54.
- [ ] **T007-10 — Gestionar tipos de habitación.** Entrega: crear/editar/activar/desactivar/eliminar tipos con nombre único, capacidad entera positiva y tarifa positiva de dos decimales. Salida: tipo inactivo no se ofrece en nuevas propuestas; reservas existentes se conservan. Referencias: RF-22–RF-28, RF-51–RF-52.
- [ ] **T007-11 — Gestionar inventario.** Entrega: ajuste de cupos por tipo y fecha/noche, con bloqueo y validación de compromisos. Salida: no se aceptan cantidades negativas ni reducciones bajo reservas/bloqueos; la última habitación no se sobrevende. Referencias: RF-29–RF-30, RF-37–RF-39, RF-44.
- [ ] **T007-12 — Gestionar propuestas y reprogramación.** Entrega: crear/editar/desactivar propuestas; validar salida, hotel, período de 24 horas y fechas futuras en Perú; conservar fechas hoteleras al reprogramar sin reservas y ocultar propuestas pendientes. Salida: no se mueven reservas ni se alteran importes; la propuesta se reofrece solo si sigue activa y hay inventario. Referencias: RF-3–RF-4, RF-33–RF-44, RF-51–RF-53, RF-57.
- [ ] **T007-13 — Gestionar imágenes.** Entrega: carga, reemplazo, principal y galería para hotel y tipo; validación JPG/PNG/WebP, 5 MB y contenido real; conservación ante fallo. Salida: mensaje exacto «No se pudo cargar la imagen»; sin foto de tipo se muestra sin imagen ni placeholder. Referencias: RF-45–RF-50, RF-55–RF-56.
- [ ] **T007-14 — Auditar cambios administrativos.** Entrega: registro transaccional de hoteles, servicios, tipos, tarifas, inventario, propuestas e imágenes. Salida: una operación rechazada no figura como exitosa; fallar auditoría revierte el cambio. Referencias: RF-21, DEC-113.

## Fase 3 — Consultas públicas

- [ ] **T007-15 — Implementar catálogo público de hoteles.** Entrega: consulta sin login de hoteles activos, todo el catálogo, orden alfabético, sin filtros ni buscador ni paginación visible. Salida: hotel activo sin inventario sigue visible; sin hoteles se ocultan sección y enlace. Referencias: RF-1–RF-2, RF-7–RF-9, RF-12.
- [ ] **T007-16 — Implementar detalle público.** Entrega: descripción, servicios, galería, tipos con capacidad, tarifa y fotos si existen; respuesta de hotel inexistente/no visible. Salida: enlace directo a inactivo/eliminado muestra «Hotel no disponible» sin detalle; sin cupo indica «Sin disponibilidad». Referencias: RF-5–RF-6, RF-8–RF-11.
- [ ] **T007-17 — Implementar disponibilidad por salida.** Entrega: propuestas de una salida, todos los tipos activos, disponibilidad por todas las noches y tipo sin cupo como «Sin disponibilidad» no seleccionable. Salida: no se eligen fechas libres; no hay reserva hotelera independiente. Referencias: RF-10, RF-33–RF-39, RF-43–RF-44, RF-51–RF-53.
- [ ] **T007-18 — Exponer contratos OpenAPI.** Entrega: rutas públicas/admin del plan §6, DTO mínimos, códigos y ProblemDetails. Salida: ninguna ruta pública permite reservar, pagar o administrar; las admin exigen rol. Referencias: RF-1–RF-12, RF-21.

## Fase 4 — Frontend

- [ ] **T007-19 — Integrar landing y tarjetas.** Entrega: sección Hoteles, tarjetas con imagen principal, nombre, descripción, servicios y tarifa base más baja; visibilidad y orden del servidor. Salida: sin hoteles se ocultan sección y enlace; sin cupo se indica «Sin disponibilidad»; sin filtros ni buscador. Referencias: RF-1–RF-2, RF-5, RF-7–RF-9, RF-12.
- [ ] **T007-20 — Integrar detalle, galería y fotos de habitación.** Entrega: detalle completo, galería del hotel, tipos con capacidad, tarifa y fotos propias si existen. Salida: sin fotos de tipo no se inventa placeholder; hotel no visible no muestra detalle. Referencias: RF-5–RF-6, RF-10–RF-11, RF-45–RF-50, RF-55–RF-56.
- [ ] **T007-21 — Integrar selección de alojamiento en la reserva.** Entrega: propuestas de la salida, tipos activos, disponibilidad y selección de una habitación; mensaje «Sin disponibilidad» cuando corresponda. Salida: no se eligen fechas ni se reserva hotel por separado; una sola habitación por reserva. Referencias: RF-33–RF-39, RF-51–RF-53.
- [ ] **T007-22 — Integrar panel administrativo.** Entrega: hoteles, servicios como lista libre, tipos, tarifas, inventario, propuestas e imágenes; estado y errores reales. Salida: edición incompleta no publica; fallo de imagen conserva la anterior y muestra el mensaje exacto; activación incompleta se rechaza. Referencias: RF-13–RF-32, RF-34–RF-50, RF-54–RF-58.

## Fase 5 — Verificaciones

- [ ] **T007-23 — Pruebas de publicación, edición y unicidad.** Evidencia: alta desactivada, activación incompleta, edición que quita obligatorios, nombres equivalentes por mayúsculas/espacios, mismo nombre permitido entre hoteles inactivos, carreras de activación. Referencias: RF-13–RF-21, RF-54, RF-58.
- [ ] **T007-24 — Pruebas de habitaciones, tarifas e inventario.** Evidencia: capacidad/tarifa inválidas, nombre duplicado en el hotel, tarifa única por tipo, cálculo por 24 horas, reducción bajo compromisos, última habitación sin sobreventa y continuidad de estancias. Referencias: RF-22–RF-33, RF-37–RF-39, RF-44.
- [ ] **T007-25 — Pruebas de propuestas, fechas y reservas.** Evidencia: período no múltiplo de 24 h, fecha pasada/actual/futura en Perú, todos los tipos activos, tipo sin cupo, propuesta desactivada, reprogramación sin reservas, propuesta oculta y cambio de fechas sin alterar reservas. Referencias: RF-3–RF-4, RF-33–RF-44, RF-51–RF-53, RF-57.
- [ ] **T007-26 — Pruebas de imágenes.** Evidencia: JPG/PNG/WebP, tamaño inferior/igual/superior a 5 MB, muchas fotos sin rechazo por cantidad, fallo con/sin imagen previa, conservación y mensaje exacto; tipo sin fotos sin placeholder. Referencias: RF-45–RF-50, RF-55–RF-56.
- [ ] **T007-27 — Pruebas de permisos y auditoría.** Evidencia: rutas admin sin identidad/rol, escrituras de visitante rechazadas, auditoría de éxitos y ausencia de registro de rechazos, conflicto de versión. Referencias: RF-21, DEC-113.
- [ ] **T007-28 — Verificación de extremo a extremo.** Evidencia: crear hotel inactivo → agregar servicios, tipos, fotos e inventario → activar → consultar sin login → abrir detalle → elegir salida → ver propuesta → reservar una habitación con 001; editar, desactivar y conservar reservas. Referencias: RF-1–RF-58 según matriz del plan §9.

## Fase 6 — Cierre trazable

- [ ] **T007-29 — Cerrar puertas técnicas y evidencia.** Entrega: matriz de cobertura RF-1–RF-58 con evidencia, puertas ACL-13/ACL-17, AC01 y contratos 005/006/010/012 resueltos o explícitamente pendientes. Salida: ninguna prueba simulada se presenta como integración real. Depende de T007-23–T007-28.
- [ ] **T007-30 — Actualizar estado y documentación de entrega.** Entrega: enlaces a implementación/pruebas en trazabilidad y registro de decisiones técnicas; preservar el texto aprobado de 007 v0.2. No marcar completa esta tarea por haber redactado el plan. Requiere una actividad posterior que autorice cambios fuera de `sdd/`.

## Dependencias y reglas de ejecución

- T007-01/T007-02 concretan contratos y diseño antes de migraciones o integraciones finales; los IDs T007 son locales.
- 005, 010 y 012 requieren contratos aprobados; 006 debe exponer su frontera de salidas/reprogramación y 001 la reserva compuesta, cupos e importes históricos. Se puede probar con dobles, pero T007-27–T007-29 no se cierran sin las integraciones reales.
- La frontera con 001 debe validar cupos, importes históricos y bloqueos sin duplicar reglas de reserva.
- No se ejecuta código ahora, no se modifican 001/006/013 ni sus planes/tareas, y no se crean commits o push.
