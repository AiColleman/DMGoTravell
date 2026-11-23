# Acuerdos parciales — Hoteles

> **Fecha:** 2026-10-24. **Estado:** antecedente de acuerdos parciales; los cuatro criterios se conservaron en la [spec 007 v0.2](spec.md), aprobada el 2026-10-31. [Plan](plan.md) y [tareas](tasks.md) son backlog no ejecutado.
> **Actualización:** 2026-10-26, DEC-086/DEC-087 definen ajuste manual de fechas y ocultación de opciones de alojamiento hasta completarlo.
> **Actualización:** 2026-10-30/31, entrevista de Hoteles completada con DEC-108–DEC-118; la spec completa fue aprobada el 2026-10-31 (DEC-119).

## Fuentes y alcance

- **RF17 / HU-21:** consulta de hoteles activos, tipos de habitación, imágenes, servicios, tarifa base e información de disponibilidad. Fuentes: F03 §1 y F02 §1; [inventario](../../fuentes.md).
- **DEC-072:** el usuario pide todo el catálogo de cada sección sin iniciar sesión y lo extiende expresamente a Hoteles y Vehículos. Evidencia en [decisiones](../../decisiones.md).
- **DEC-026/DEC-032 y 001 aprobada:** conservar publicación y reservas existentes; el alojamiento continúa como complemento asociado a una salida según las reglas acordadas.
- **DEC-086 / RF20 / HU-23:** al reprogramar una salida sin reservas, el administrador ajusta manualmente las fechas del alojamiento asociado; no desplazamiento automático. Contraparte en [006/RF-77](../006-catalogo/spec.md).
- **DEC-087 / RF18:** ocultar las propuestas afectadas hasta ajustar sus fechas, permitiendo reservar la salida sin alojamiento según 001. Contraparte en 006/RF-78/RF-79.

## Criterios locales incorporados a la spec 007

Los IDs siguientes son locales `007/RF-n`, no nuevos RF/HU oficiales del producto.

- **RF-1:** CUANDO un visitante consulta la sección Hoteles, EL SISTEMA permitirá explorar su catálogo público sin iniciar sesión. (RF17; HU-21; DEC-072)
- **RF-2:** CUANDO un visitante consulta la sección Hoteles de la página de inicio, EL SISTEMA mostrará todos los hoteles públicamente visibles en su sección correspondiente, sin paginación visible. (RF17; HU-21; DEC-072)
- **RF-3:** CUANDO se reprograma una salida sin reservas, EL SISTEMA conservará las fechas de sus propuestas hoteleras asociadas hasta que el administrador las modifique explícitamente. (DEC-086; RF20/HU-23)
- **RF-4:** MIENTRAS una propuesta hotelera asociada a una salida reprogramada tenga fechas pendientes de ajuste por admin, EL SISTEMA la excluirá de las opciones de alojamiento seleccionables de esa salida. (DEC-087; RF18; DEC-031)

## Límites y pendientes

- Mantener los campos de consulta documentados en RF17/HU-21; no inferir una nueva reserva hotelera independiente ni trasladar descuentos turísticos a hoteles.
- El acceso público no habilita escrituras administrativas ni elimina la autenticación requerida para reservar según 001.
- «Todo el catálogo» conserva exclusión de hoteles inactivos/eliminados; no vuelve públicos borradores.
- **Resuelto por DEC-108/DEC-109/DEC-113/DEC-115:** tarjetas y detalle, orden alfabético, estados vacíos, visibilidad del hotel activo sin cupo con «Sin disponibilidad», exclusión de inactivos/eliminados y ausencia de filtros o buscador. No se copia automáticamente la ocultación por falta de salidas de Tours/Paquetes.
- **Resuelto por DEC-110/DEC-116:** imagen principal y galería sin cantidad máxima comercial, JPG/PNG/WebP de hasta 5 MB; las fotos de tipos de habitación son opcionales.
- **Resuelto por DEC-087:** propuestas pendientes de ajuste ocultas en esa salida; las ya ajustadas vuelven a ser elegibles si cumplen estado y disponibilidad. Se permite reservar el tour/paquete sin hotel. No se oculta el hotel de su catálogo ni se afectan otras salidas o reservas; admin conserva acceso para ajustar fechas. Mantener períodos/horarios de 001.
- La spec 007 v0.2 fue aprobada explícitamente el 2026-10-31 (DEC-119); su [plan](plan.md) y [tareas](tasks.md) son backlog no ejecutado. Cualquier cambio funcional posterior exige revisar y aprobar la spec.
