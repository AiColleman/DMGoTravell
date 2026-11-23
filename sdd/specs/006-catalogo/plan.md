# Plan técnico — Spec 006: Catálogo turístico (Tours y Paquetes)

> **Fecha:** 2026-10-30. **Versión del plan:** 0.1.  
> **Base:** [spec v0.46 aprobada](spec.md), 103 criterios locales, aprobada explícitamente el 2026-10-30.  
> **Estado:** diseño propuesto para implementación futura; no ejecutado ni validado con código.  
> **Autorización:** la aprobación de la spec habilita este plan y sus tareas; no autoriza implementar código ni modificar documentación original. Todos los cambios de esta actividad permanecen en `sdd/`.

## 1. Objetivo y fuentes

Implementar el catálogo público de tours y paquetes y su administración: tarjetas y detalle, itinerario, galería, precios y descuentos, salidas y cupos compartidos con Reservas, publicación controlada, filtros turísticos y protección de reservas existentes.

El resultado debe preservar los **103 criterios aprobados**. En especial: el catálogo muestra todas las ofertas públicamente visibles de cada sección sin login; el precio de reserva proviene de la salida; no se permite sobreventa; una oferta publicada no queda incompleta por una edición; y filtrar no altera cupos, precios ni reservas.

Fuentes: [constitución](../../constitution.md), [decisiones DEC-004/DEC-005/DEC-025/DEC-031/DEC-032/DEC-044/DEC-053–DEC-107](../../decisiones.md), [aclaraciones](../../aclaraciones.md), [trazabilidad](../../trazabilidad.md) y [fuentes](../../fuentes.md). Los `006/RF-*` son criterios locales; no renumeran RF/HU/RN originales.

Las elecciones técnicas de este plan son **propuestas**, no reglas comerciales nuevas ni ADR aceptadas. Aplican el stack documentado: React/TypeScript/Vite, ASP.NET Core/C#, CQRS/MediatR, FluentValidation, PostgreSQL/EF Core/Npgsql, Identity/JWT, R2, OpenAPI y ProblemDetails. Un solo backend desplegable.

## 2. Alcance y dependencias

| Dependencia | Qué necesita 006 | Estado y efecto |
|---|---|---|
| 001 Reservas | Contrato de retención/liberación de cupos, precio histórico y bloqueos por reserva pendiente o confirmada | Aprobada v0.13. Integrar respetando sus invariantes; no duplicar reglas de reserva dentro de Catalog. |
| 005 Identidad | Actor autenticado y rol `admin` | Spec pendiente. La autorización real queda bloqueada hasta su contrato; un doble solo sirve para pruebas. |
| 007 Hoteles | Propuestas asociadas a salida, fechas hoteleras y visibilidad temporal | Acuerdos parciales. No implementar ni inventar su contrato completo. |
| 010 Auditoría | Registro transaccional de cambios administrativos | Spec pendiente. Acordar contrato antes de cerrar la auditoría real. |
| 012 Multimedia | Validación y almacenamiento en R2, conservación de objetos | Spec pendiente. Los límites de 006 sí están definidos: JPG/PNG/WebP, 5 MB por archivo, cantidad libre y conservación ante fallo. |
| Plataforma y landing | Host, migraciones, configuración, navegación y estructura visual | Aún no implementada. Confirmar estructura/versiones antes de ejecutar código. |

006 no implementa pagos, vencimiento, identidad, reservas hoteleras ni el catálogo completo de Hoteles/Movilidad. No crea endpoints de pago ni de reserva; consume la frontera de 001.

## 3. Organización propuesta

Ubicar la funcionalidad en un área `Catalog` dentro del monolito modular, con las capas documentadas. El nombre es organizativo; no crea microservicio, despliegue ni base separada.

| Capa | Responsabilidad |
|---|---|
| Domain | Oferta, tipo, estado, salida, cupo, precio, descuento, itinerario e invariantes de publicación. Sin SDK, HTTP, ORM o R2. |
| Application | Casos de uso administrativos y consultas públicas; validaciones; autorización; coordinación de imágenes, auditoría y reservas. |
| Infrastructure | EF Core/Npgsql, repositorios, transacciones, índices de unicidad, colación y adaptador R2 compartido. |
| Presentation | API pública y administrativa, validación de entrada, ProblemDetails y OpenAPI. |
| Frontend | Landing por secciones, tarjetas, detalle, galería, filtros y panel administrativo. |

Puertos propuestos: actor actual, repositorio/lector de catálogo, disponibilidad y cupos, precios/descuentos, almacenamiento de imágenes, escritor de auditoría y unidad transaccional. No consumir repositorios de otros módulos ni aceptar precios, estado, cupos o propietario desde el navegador.

## 4. Modelo funcional y de persistencia a diseñar

### 4.1 Oferta (tour o paquete)

Modelo técnico propuesto, a concretar en la migración:

- Identificador interno y tipo `tour` o `package`; el tipo no se deduce del nombre.
- Nombre visible y clave normalizada para unicidad por tipo.
- Descripción e itinerario por días/actividades, sin máximo fijo de caracteres.
- Duración entera con una sola unidad `hours` o `days`.
- Precio base público en `PEN` con dos decimales; descuento opcional con precio final rebajado.
- Estado activo/inactivo y borrado lógico cuando existan relaciones históricas.
- Condiciones y demás campos obligatorios de publicación.
- Fechas UTC de creación/actualización y token de concurrencia.

Un borrador inactivo puede persistir incompleto. Para **todo estado activo** se comprueban título, descripción, precio, duración, itinerario, al menos una imagen y condiciones. Una edición de una oferta publicada que quite un dato obligatorio se rechaza conservando la versión persistida; no se desactiva automáticamente (RF-60).

### 4.2 Unicidad y concurrencia

Propuesta: normalizar el nombre con recorte de espacios exteriores y comparación sin distinguir mayúsculas, sin quitar acentos ni colapsar espacios internos por inferencia (RF-84, DEC-091/DEC-092). La unicidad es independiente por tipo: un tour y un paquete pueden compartir nombre; dos tours publicados no.

Respaldar con un índice único parcial para ofertas publicadas sobre `(tipo, clave_normalizada)`. Dos borradores pueden coincidir; la activación o el renombre resuelven la carrera en base de datos. Capturar el conflicto como error funcional sin fusionar ni sobrescribir. Usar token de concurrencia en ediciones, activación, desactivación y cambios de salidas.

### 4.3 Salidas, cupos y precios

- Cada salida pertenece a una oferta y tiene fecha/hora futura en hora de Perú (RF-80/RF-81), cupos y precio normal propio opcional.
- Una salida sin precio normal propio no es reservable ni se compensa con el precio de tarjeta (RF-64).
- Los precios normales de oferta y salida son mayores que cero (RF-65).
- La reducción de cupos por debajo de reservas y bloqueos vigentes se rechaza (RF-25).
- La desactivación impide nuevas reservas y conserva las existentes (RF-26/RF-27).
- La reserva usa el precio efectivo de la salida: rebajado si tiene descuento válido; normal si no. No se aplica una segunda rebaja de tarjeta (RF-28/RF-50).
- La creación/retención/confirmación/liberación de cupos se coordina con 001 en una unidad transaccional local; la última unidad no se sobrevende (RF-31/RF-32).

El plan propone almacenar importes como decimal exacto y fechas en UTC, presentando y validando la fecha de salida en zona `America/Lima`.

### 4.4 Descuentos

- Descuento opcional por oferta y por salida; sin descuento se muestra solo el precio normal (RF-41/RF-42).
- El admin ingresa el precio final rebajado, no un porcentaje ni un importe a restar (RF-43).
- Debe cumplirse `0 < precio_rebajado < precio_normal` (RF-46).
- El porcentaje equivalente es informativo y automático; sin decimales hacia abajo y «Menos del 1 %» cuando corresponde (RF-44/RF-47/RF-48).
- El descuento no vence por el paso del tiempo; cambia o se retira por acción administrativa (RF-51).
- Una reserva ya creada conserva sus importes (RF-21/RF-50).

### 4.5 Itinerario compartido

El itinerario pertenece a la oferta, no a cada salida. Un cambio permitido se refleja en todas sus salidas (RF-82). Si cualquier salida tiene reserva pendiente o confirmada, se rechaza el cambio y se conserva el itinerario anterior (RF-83). La comprobación debe cubrir concurrencia con la creación de reservas; no se crean variantes por salida.

### 4.6 Imágenes

- Una imagen principal para la tarjeta y una galería en el detalle (RF-66).
- Mínimo una imagen para publicar (RF-15/RF-33).
- Cantidad libre de fotos por oferta, contando principal y galería; sin máximo comercial (RF-103).
- JPG/PNG/WebP y hasta 5 MB por archivo, de forma independiente de la cantidad (RF-70/RF-71).
- Fallo de carga/reemplazo: «No se pudo cargar la imagen» y conservación de las imágenes anteriores (RF-72/RF-73).

Propuesta técnica: interpretar 5 MB como 5 000 000 bytes (MB decimal), inclusivo, a ratificar antes de implementar. Validar extensión, MIME y contenido real decodificable; no confiar solo en el nombre. Guardar cada archivo bajo una clave nueva; publicar la referencia solo tras carga válida y commit. Sin máximo de cantidad, el diseño debe soportar colecciones abiertas y paginar la vista administrativa si hace falta, sin introducir un tope comercial.

### 4.7 Visibilidad pública

Una oferta es públicamente visible si está activa, no eliminada y tiene al menos una salida disponible para reservar (RF-8/RF-53). Vuelve a mostrarse al recuperar una salida disponible o cupos (RF-54). El enlace directo a una oferta oculta responde «Oferta no disponible» sin detalle (RF-12/RF-55/RF-56). La visibilidad no cambia el estado administrativo ni cancela reservas.

## 5. Consultas públicas y filtros

- Secciones separadas de Tours y Paquetes, cada una con **todo** su catálogo visible, sin paginación visible ni límite de cinco (RF-57/RF-58).
- Orden alfabético ascendente por nombre dentro de cada sección (RF-59). El plan propone una colación española coherente entre PostgreSQL, aplicación y pruebas.
- Si una sección no tiene ofertas visibles, se ocultan sección y enlace; la otra sección no se afecta (RF-62/RF-63).
- Filtros opcionales por precio, duración, fecha de salida y destino (RF-89).
- Precio: usa el precio visible de tarjeta, rebajado si existe (RF-90).
- Duración: mínimo/máximo con unidad; comparación con 1 día = 24 horas (RF-95/RF-97).
- Fecha: rango inclusivo; coincide la oferta con al menos una salida disponible dentro del rango, en hora de Perú (RF-96/RF-98).
- Destino: texto contenido en nombre **o** descripción; basta uno (RF-94).
- Filtros combinados: deben cumplirse todos (RF-102).
- Rango invertido: no se aplica; se muestra «El rango no es válido» y se conservan los extremos sin intercambio (RF-99–RF-101).
- Sin coincidencias: «No se encontraron resultados» y «Limpiar filtros»; limpiar recupera todo el catálogo publicable de la sección (RF-91–RF-93).

La consulta no retiene cupos, no altera precios y no cambia la reservabilidad. Un error de validación no se presenta como búsqueda válida vacía.

## 6. Contratos HTTP propuestos

Rutas y códigos de diseño, a concretar en OpenAPI; no son implementación existente:

| Operación | Ruta propuesta | Respuesta |
|---|---|---|
| Listar sección pública | `GET /api/v1/catalog/{type}` | `200` con todas las ofertas visibles, orden alfabético; filtros por query; `[]` si no hay. Sin JWT. |
| Detalle público | `GET /api/v1/catalog/{type}/{id}` | `200` con detalle, itinerario y galería; `404`/«Oferta no disponible» si no es visible. |
| Listar administrables | `GET /api/v1/admin/catalog/{type}` | `200`, activos e inactivos. |
| Crear oferta | `POST /api/v1/admin/catalog/{type}` | `201`, oferta desactivada. |
| Editar oferta | `PUT /api/v1/admin/catalog/{type}/{id}` | `200` con versión persistida; rechazo si deja incompleta una publicada. |
| Activar/desactivar | `POST /api/v1/admin/catalog/{type}/{id}/activate` \| `/deactivate` | `200`; `409` por nombre duplicado o versión obsoleta. |
| Gestionar salidas | `POST`/`PUT /api/v1/admin/catalog/{type}/{id}/departures[/{departureId}]` | `201`/`200`; `409` por reservas, cupos o fecha inválida. |
| Gestionar precios/descuentos | `PUT .../pricing` y `PUT .../departures/{departureId}/pricing` | `200`; `400` por precios inválidos. |
| Gestionar itinerario | `PUT .../itinerary` | `200`; `409` si hay reservas pendientes/confirmadas. |
| Imagen principal/galería | `POST`/`PUT`/`DELETE .../images[/{imageId}]` | `200`/`201`; `413` tamaño, `415` formato; fallo conserva anteriores. |

Autenticación obligatoria en rutas admin: `401` sin identidad y `403` con rol insuficiente. Application vuelve a comprobar permisos. Errores mediante ProblemDetails; los mensajes funcionales exactos se conservan en la interfaz.

## 7. Flujos y auditoría

### Crear, editar, activar y desactivar

1. Obtener actor `admin`; validar solicitud y versión.
2. Crear siempre desactivado; guardar borrador admitido.
3. Al activar, comprobar completitud, al menos una imagen válida y unicidad por tipo.
4. Al editar una oferta publicada, rechazar si quita un dato obligatorio; conservar lo persistido.
5. Persistir cambio y auditoría de la operación exitosa en una sola transacción local. Si falla auditoría, no confirmar el cambio.
6. Responder con el estado persistido; la consulta pública decide por estado y disponibilidad, no por indicadores del frontend.

Se auditan creación, edición, activación, desactivación, salidas, precios, descuentos, itinerario e imágenes (RF-19, DEC-078), con actor, contenido cambiado y fecha. Una operación rechazada no se registra como modificación exitosa. No se registran binarios ni secretos.

### Salidas y protección de reservas

1. Validar fecha/hora futura en hora de Perú y cupos.
2. Rechazar cambio de fecha/hora si existe reserva pendiente o confirmada (RF-52).
3. Rechazar reducción de cupos bajo compromisos (RF-25).
4. Al reprogramar sin reservas, conservar las fechas hoteleras hasta el ajuste manual del admin (RF-77); ocultar propuestas pendientes para esa salida y permitir reservar solo el tour/paquete si cumple condiciones (RF-78/RF-79).
5. Coordinar con 001 la retención y liberación de cupos; una reserva concurrente no debe quedar asociada a otra fecha/hora.

### Imágenes

1. Autorizar y validar formato, tamaño y contenido real antes de subir a R2.
2. Subir bajo clave nueva; nunca sobrescribir la imagen anterior.
3. Tras confirmar almacenamiento, publicar la referencia y auditar en el mismo commit, comprobando versión.
4. Ante fallo, conservar las referencias anteriores y mostrar el mensaje exacto. Sin imagen previa, la oferta no cumple el mínimo de publicación.
5. La cantidad de fotos no tiene tope comercial; el diseño debe permitir agregar más sin cambiar reglas.

**Puerta técnica:** la conservación/eliminación de objetos R2 sin referencia y la política de acceso público/firmado pertenecen a 012/ACL-13 y deben acordarse antes de habilitar reemplazos productivos. No se borra por suposición un objeto aún referenciado.

## 8. Frontend propuesto

- Landing con secciones Tours y Paquetes; cada tarjeta muestra imagen principal, título, descripción compartida, duración y precio base (RF-34). Orden y visibilidad provienen del servidor.
- Detalle con descripción, precio, duración, itinerario por días y galería; sin inventar horarios, mapas o descargas.
- Descuento: precio normal tachado, precio rebajado y porcentaje informativo; sin descuento, solo precio normal.
- Filtros visibles con validación de rangos; mensaje «El rango no es válido» sin intercambiar extremos; sin coincidencias, «No se encontraron resultados» y «Limpiar filtros».
- Panel admin: crear/editar oferta, estado, salidas, cupos, precios, descuentos, itinerario e imágenes. Mostrar errores de completitud y conflictos sin éxito ficticio.
- Al fallar una imagen, conservar visualmente la anterior y mostrar «No se pudo cargar la imagen». Sin imagen, la oferta permanece inactiva.

## 9. Matriz de cobertura

| Criterios | Diseño/tareas que los cubren |
|---|---|
| RF-1–RF-12 | Consultas públicas, detalle, visibilidad y contrato HTTP (§5, §6; T006-14/T006-15/T006-17). |
| RF-13–RF-22 | Administración, borrado lógico, protección histórica y auditoría (§4.1, §7; T006-07/T006-08/T006-13). |
| RF-23–RF-32 | Paquetes, salidas, cupos, precios y coordinación con 001 (§4.3; T006-04/T006-09/T006-27). |
| RF-33–RF-35 | Completitud, contenido de tarjeta e itinerario (§4.1/§4.5; T006-05/T006-07/T006-08). |
| RF-36–RF-51 | Precio por salida, precio base y descuentos (§4.3/§4.4; T006-10/T006-24). |
| RF-52 | Bloqueo de fecha/hora con reservas (§7; T006-12). |
| RF-53–RF-56 | Visibilidad por disponibilidad y enlace directo (§4.7; T006-14/T006-15). |
| RF-57–RF-59 | Catálogo completo por sección y orden alfabético (§5; T006-14/T006-18). |
| RF-60–RF-63 | Integridad de publicadas, descripción compartida y secciones vacías (§4.1/§5; T006-07/T006-14). |
| RF-64–RF-65 | Precio requerido y precios positivos (§4.3; T006-09/T006-10). |
| RF-66–RF-73 | Galería, formatos, tamaño y fallos (§4.6; T006-06/T006-26). |
| RF-74–RF-76 | Presentación del descuento en detalle/salida (§8; T006-19/T006-24). |
| RF-77–RF-79 | Fechas hoteleras y reserva solo turística (§7; T006-12/T006-23). |
| RF-80–RF-81 | Fecha futura y hora de Perú (§4.3; T006-09/T006-23). |
| RF-82–RF-83 | Itinerario compartido y bloqueo (§4.5; T006-05/T006-11). |
| RF-84 | Unicidad por tipo (§4.2; T006-03/T006-08/T006-22). |
| RF-85–RF-88 | Duración y textos configurables (§4.1; T006-07/T006-22). |
| RF-89–RF-102 | Filtros, vacíos y rangos (§5; T006-16/T006-20/T006-25). |
| RF-103 | Cantidad de fotos sin máximo comercial (§4.6; T006-06/T006-26). |

## 10. Puertas técnicas y riesgos

- **ACL-29:** fijar validaciones concretas de título, tipo y condiciones sin inventar topes comerciales; la descripción y el itinerario no tienen máximo fijo.
- **ACL-30:** concretar parámetros y errores de la consulta paginada original por tipo, sin limitar el catálogo completo de las secciones.
- **ACL-13/ACL-17:** conservación/eliminación de objetos R2 y acceso público/firmado; no borrar objetos referenciados.
- **AC01:** definir volumen, carga y consultas para verificar lecturas simples bajo 300 ms; no presentarlo como SLA nuevo.
- **5 MB:** ratificar 5 000 000 bytes y validación de contenido real antes de implementar.
- **Colación:** verificar orden alfabético con PostgreSQL real; no prometer el mismo resultado en cualquier configuración regional.
- **Concurrencia:** índices únicos parciales, token de versión y transacciones para cupos, unicidad y auditoría; no confiar en comprobaciones previas.
- **Dependencias:** 005/007/010/012 siguen sin spec completa. Sus contratos deben validarse antes de integrar; los dobles de prueba no acreditan cumplimiento.

## 11. Criterios de aceptación de este plan

- Cada RF-1–RF-103 tiene al menos una tarea y una verificación asociada.
- Ninguna decisión técnica introduce un límite comercial, un estado o un flujo no aprobado por la spec.
- Las dependencias pendientes se identifican como puertas, no se resuelven por inferencia.
- El plan no se presenta como implementación, prueba ejecutada ni evidencia de cumplimiento.
- Cualquier cambio funcional posterior exige revisar y aprobar la spec 006.
