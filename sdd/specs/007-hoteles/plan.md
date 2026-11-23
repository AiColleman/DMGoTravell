# Plan técnico — Spec 007: Hoteles y alojamiento

> **Fecha:** 2026-10-31. **Versión del plan:** 0.1.  
> **Base:** [spec v0.2 aprobada](spec.md), 58 criterios locales, aprobada explícitamente el 2026-10-31 (DEC-119).  
> **Estado:** diseño propuesto para implementación futura; no ejecutado ni validado con código.  
> **Autorización:** la aprobación de la spec habilita este plan y sus tareas; no autoriza implementar código ni modificar documentación original. Todos los cambios de esta actividad permanecen en `sdd/`.

## 1. Objetivo y fuentes

Implementar el catálogo público de hoteles y su administración: tarjetas y detalle, servicios como lista libre, fotos del hotel y de sus tipos de habitación, tipos de habitación con capacidad y tarifa, inventario por fecha, propuestas de alojamiento asociadas a una salida y protección de reservas existentes.

El resultado debe preservar los **58 criterios aprobados**. En especial: el catálogo muestra todos los hoteles activos sin login y en orden alfabético; un hotel activo sin cupo sigue visible con «Sin disponibilidad»; el cliente no elige fechas libres; la propuesta ofrece todos los tipos activos; no se sobrevende; y una reserva creada conserva sus condiciones ante cambios o desactivaciones.

Fuentes: [constitución](../../constitution.md), [decisiones DEC-006/DEC-007/DEC-008/DEC-018/DEC-031/DEC-032/DEC-072/DEC-086/DEC-087/DEC-108–DEC-119](../../decisiones.md), [aclaraciones](../../aclaraciones.md), [trazabilidad](../../trazabilidad.md) y [fuentes](../../fuentes.md). Los `007/RF-*` son criterios locales; no renumeran RF/HU/RN originales.

Las elecciones técnicas de este plan son **propuestas**, no reglas comerciales nuevas ni ADR aceptadas. Aplican el stack documentado: React/TypeScript/Vite, ASP.NET Core/C#, CQRS/MediatR, FluentValidation, PostgreSQL/EF Core/Npgsql, Identity/JWT, R2, OpenAPI y ProblemDetails. Un solo backend desplegable.

## 2. Alcance y dependencias

| Dependencia | Qué necesita 007 | Estado y efecto |
|---|---|---|
| 001 Reservas | Contrato de reserva compuesta, retención/liberación de habitaciones, importe hotelero histórico y bloqueos por reserva pendiente o confirmada | Aprobada v0.13. Integrar respetando sus invariantes; no duplicar reglas de reserva dentro de Lodging. |
| 005 Identidad | Actor autenticado y rol `admin` | Spec pendiente. La autorización real queda bloqueada hasta su contrato; un doble solo sirve para pruebas. |
| 006 Catálogo | Salidas turísticas, reprogramación y visibilidad de propuestas hoteleras | Aprobada v0.46. Consumir su frontera de salidas; no reimplementar tours/paquetes. |
| 010 Auditoría | Registro transaccional de cambios administrativos | Spec pendiente. Acordar contrato antes de cerrar la auditoría real. |
| 012 Multimedia | Validación y almacenamiento en R2, conservación de objetos | Spec pendiente. Los límites de 007 sí están definidos: JPG/PNG/WebP, 5 MB por archivo, cantidad libre y conservación ante fallo. |
| Plataforma y landing | Host, migraciones, configuración, navegación y estructura visual | Aún no implementada. Confirmar estructura/versiones antes de ejecutar código. |

007 no implementa pagos, vencimiento, identidad, reservas turísticas ni el catálogo completo de Tours/Paquetes/Movilidad. No crea endpoints de pago ni de reserva; consume las fronteras de 001 y 006.

## 3. Organización propuesta

Ubicar la funcionalidad en un área `Lodging` dentro del monolito modular, con las capas documentadas. El nombre es organizativo; no crea microservicio, despliegue ni base separada.

| Capa | Responsabilidad |
|---|---|
| Domain | Hotel, servicio, tipo de habitación, inventario, propuesta e invariantes de activación, capacidad, tarifa y disponibilidad. Sin SDK, HTTP, ORM o R2. |
| Application | Casos de uso administrativos y consultas públicas; validaciones; autorización; coordinación de imágenes, auditoría y reservas. |
| Infrastructure | EF Core/Npgsql, repositorios, transacciones, índices de unicidad, bloqueo de inventario y adaptador R2 compartido. |
| Presentation | API pública y administrativa, validación de entrada, ProblemDetails y OpenAPI. |
| Frontend | Landing, tarjetas, detalle, galería, fotos de habitación y panel administrativo. |

Puertos propuestos: actor actual, repositorio/lector de hoteles, disponibilidad e inventario, propuestas por salida, precios hoteleros, almacenamiento de imágenes, escritor de auditoría y unidad transaccional. No consumir repositorios de otros módulos ni aceptar estado, tarifas, cupos o propietario desde el navegador.

## 4. Modelo funcional y de persistencia a diseñar

### 4.1 Hotel y servicios

Modelo técnico propuesto, a concretar en la migración:

- Identificador interno, nombre visible y clave normalizada para unicidad entre hoteles activos.
- Descripción obligatoria para activar, sin máximo fijo de caracteres.
- Servicios como lista ordenada de textos libres; sin catálogo fijo ni máximo comercial. Al menos uno para activar.
- Estado activo/inactivo y borrado lógico cuando existan relaciones históricas.
- Imagen principal y galería a nivel de hotel.
- Fechas UTC de creación/actualización y token de concurrencia.

Un hotel inactivo puede persistir incompleto. Para **todo hotel activo** se comprueban nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo de habitación válido. Una edición que deje incompleto un hotel activo se rechaza conservando la versión persistida (RF-54); no se desactiva automáticamente.

### 4.2 Tipos de habitación

- Pertenecen a un hotel; nombre visible y clave normalizada única dentro del hotel, comparando sin distinguir mayúsculas y con recorte de espacios exteriores.
- Capacidad entera positiva; tarifa base positiva en `PEN` con dos decimales.
- Estado activo/inactivo y borrado lógico cuando existan relaciones históricas.
- Imagen principal y galería propias, opcionales para activar el tipo.
- No se permite un tipo sin nombre, capacidad o tarifa válidas.

La tarifa es **única por tipo** y se usa en todas las salidas y propuestas (DEC-114). No hay tarifa por salida, temporada, fecha u ocupante. El importe hotelero es `tarifa_base × períodos_completos_de_24_horas` (RF-32).

### 4.3 Inventario

- Una fila por tipo de habitación y fecha/noche, con cantidad entera no negativa.
- La disponibilidad de una estancia exige cupo en **todas** las noches del período; no se bloquea parcialmente.
- La reducción por debajo de reservas y bloqueos vigentes se rechaza (RF-30).
- La creación de una reserva y el consumo de la última habitación se coordinan con 001 en una unidad transaccional local; no se sobrevende (RF-39).
- Dos estancias del mismo tipo que terminan y comienzan en el mismo instante no se consideran solapadas (RF-44).

El plan propone almacenar fechas de noche como `date` y horas de salida como `timestamptz` UTC, presentando y validando en zona `America/Lima`. La frontera con 001 debe permitir consultar compromisos sin duplicar el libro de reservas.

### 4.4 Propuestas de alojamiento

- Asociadas a una salida, un hotel y un período de entrada/salida múltiplo positivo de 24 horas, con fechas futuras en hora de Perú.
- Ofrecen automáticamente **todos** los tipos de habitación activos del hotel; el administrador no elige un subconjunto (DEC-117).
- El cliente elige un tipo y reserva exactamente una habitación; no se reservan varios tipos ni varios hoteles en la misma reserva.
- El inventario se comparte por tipo y fecha/noche entre propuestas del mismo hotel; no se crean inventarios independientes por salida.
- Una propuesta puede desactivarse; conserva reservas existentes.
- Al reprogramar una salida sin reservas, las fechas hoteleras se conservan hasta ajuste manual; mientras estén pendientes, la propuesta se oculta al cliente y el administrador conserva acceso (RF-3/RF-4/RF-41/RF-42).
- Cambiar las fechas de una propuesta no altera reservas ya creadas (RF-57).

### 4.5 Imágenes

- Hotel: una imagen principal y una galería en el detalle.
- Tipo de habitación: una imagen principal y una galería, opcionales; si no hay fotos, se muestra sin imagen ni placeholder (RF-55/RF-56).
- Cantidad libre de fotos por hotel y por tipo, contando principal y galería; sin máximo comercial.
- JPG/PNG/WebP y hasta 5 MB por archivo.
- Fallo de carga/reemplazo: «No se pudo cargar la imagen» y conservación de las imágenes anteriores.

Propuesta técnica: interpretar 5 MB como 5 000 000 bytes (MB decimal), inclusivo, a ratificar antes de implementar. Validar extensión, MIME y contenido real decodificable; no confiar solo en el nombre. Guardar cada archivo bajo una clave nueva; publicar la referencia solo tras carga válida y commit. Sin máximo de cantidad, el diseño debe soportar colecciones abiertas y paginar la vista administrativa si hace falta, sin introducir un tope comercial.

### 4.6 Unicidad y concurrencia

- Nombre de hotel único entre hoteles activos, normalizado con recorte de espacios exteriores y comparación sin distinguir mayúsculas; no quitar acentos ni colapsar espacios internos por inferencia.
- Nombre de tipo de habitación único dentro del hotel con la misma comparación.
- Índices únicos parciales para hoteles activos y tipos no eliminados; dos borradores pueden coincidir y la activación/renombre resuelve la carrera.
- Token de concurrencia en ediciones, activación, desactivación, inventario y propuestas.
- Bloqueo/transacción para la última habitación y para reducciones de inventario; no confiar en comprobaciones previas del navegador.

### 4.7 Visibilidad pública

Un hotel es públicamente visible si está activo y no eliminado. La visibilidad **no** depende de que tenga inventario futuro: si no lo tiene, su tarjeta y detalle indican «Sin disponibilidad» (RF-9). Los hoteles inactivos o eliminados se excluyen y su enlace directo responde «Hotel no disponible» (RF-11). Si no hay hoteles visibles, se ocultan sección y enlace (RF-12).

La disponibilidad concreta se consulta al elegir alojamiento para una salida; el cliente no elige fechas ni horarios. No existe reserva hotelera independiente (RF-53).

## 5. Consultas públicas

- Sección Hoteles con **todo** el catálogo visible, sin paginación visible ni filtros ni buscador (DEC-072/DEC-115).
- Orden alfabético ascendente por nombre (RF-7). El plan propone una colación española coherente entre PostgreSQL, aplicación y pruebas.
- Tarjeta: imagen principal, nombre, descripción, servicios y tarifa base más baja entre los tipos activos (RF-5).
- Detalle: descripción, servicios, galería, tipos de habitación con capacidad, tarifa base y fotos si existen (RF-6).
- Si el hotel no tiene ningún tipo con inventario futuro disponible, tarjeta y detalle indican «Sin disponibilidad» (RF-9).
- Para una salida, se muestran las propuestas asociadas; cada una ofrece todos los tipos activos del hotel. Un tipo sin cupo para todas las noches se muestra como «Sin disponibilidad» y no se puede seleccionar.
- La consulta no retiene cupos, no altera precios y no cambia la reservabilidad.

## 6. Contratos HTTP propuestos

Rutas y códigos de diseño, a concretar en OpenAPI; no son implementación existente:

| Operación | Ruta propuesta | Respuesta |
|---|---|---|
| Listar hoteles públicos | `GET /api/v1/hotels` | `200` con todos los hoteles visibles, orden alfabético; `[]` si no hay. Sin JWT. |
| Detalle público | `GET /api/v1/hotels/{id}` | `200` con servicios, galería, tipos y fotos; `404`/«Hotel no disponible» si no es visible. |
| Propuestas de una salida | `GET /api/v1/departures/{departureId}/lodging` | `200` con propuestas y tipos activos; disponibilidad por noche; `404` si la salida no existe. |
| Listar administrables | `GET /api/v1/admin/hotels` | `200`, activos e inactivos. |
| Crear hotel | `POST /api/v1/admin/hotels` | `201`, hotel desactivado. |
| Editar hotel | `PUT /api/v1/admin/hotels/{id}` | `200` con versión persistida; rechazo si deja incompleto un hotel activo. |
| Activar/desactivar | `POST /api/v1/admin/hotels/{id}/activate` \| `/deactivate` | `200`; `409` por nombre duplicado, incompletitud o versión obsoleta. |
| Tipos de habitación | `POST`/`PUT /api/v1/admin/hotels/{id}/room-types[/{roomTypeId}]` | `201`/`200`; `409` por nombre duplicado; `400` por capacidad/tarifa inválidas. |
| Inventario | `PUT /api/v1/admin/room-types/{id}/inventory` | `200`; `409` si la reducción queda bajo compromisos. |
| Propuestas | `POST`/`PUT /api/v1/admin/lodging-proposals[/{proposalId}]` | `201`/`200`; `409` por fechas, salida, hotel o versión inválidos. |
| Imágenes de hotel/tipo | `POST`/`PUT`/`DELETE .../images[/{imageId}]` | `200`/`201`; `413` tamaño, `415` formato; fallo conserva anteriores. |

Autenticación obligatoria en rutas admin: `401` sin identidad y `403` con rol insuficiente. Application vuelve a comprobar permisos. Errores mediante ProblemDetails; los mensajes funcionales exactos se conservan en la interfaz.

## 7. Flujos y auditoría

### Crear, editar, activar y desactivar hoteles

1. Obtener actor `admin`; validar solicitud y versión.
2. Crear siempre desactivado; guardar borrador admitido.
3. Al activar, comprobar nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo válido; comprobar unicidad entre activos.
4. Al editar un hotel activo, rechazar si quita un dato obligatorio; conservar lo persistido.
5. Persistir cambio y auditoría de la operación exitosa en una sola transacción local. Si falla auditoría, no confirmar el cambio.
6. Responder con el estado persistido; la consulta pública decide por estado, no por indicadores del frontend.

### Tipos de habitación e inventario

1. Validar nombre único dentro del hotel, capacidad entera positiva y tarifa positiva con dos decimales.
2. Impedir ofrecer tipos inactivos en nuevas propuestas; conservar reservas existentes.
3. Al ajustar inventario, rechazar cantidades negativas o reducciones bajo compromisos.
4. Al cambiar tarifa, conservar importes de reservas creadas y aplicar la vigente a nuevas reservas.
5. Coordinar con 001 la última habitación; una reserva concurrente no debe sobrevender.

### Propuestas y reprogramación

1. Validar salida, hotel, período múltiplo de 24 horas y fechas futuras en Perú.
2. Ofrecer todos los tipos activos del hotel; no aceptar un subconjunto desde el navegador.
3. Compartir inventario por tipo y fecha/noche entre propuestas del mismo hotel.
4. Al desactivar una propuesta, impedir nuevas reservas y conservar las existentes.
5. Al reprogramar una salida sin reservas, conservar fechas hoteleras; ocultar propuestas pendientes de ajuste y permitir reservar solo el tour/paquete si cumple condiciones.
6. Al ajustar fechas, reofrecer la propuesta si sigue activa, el hotel/tipo siguen activos y hay inventario; no alterar reservas creadas.

### Imágenes

1. Autorizar y validar formato, tamaño y contenido real antes de subir a R2.
2. Subir bajo clave nueva; nunca sobrescribir la imagen anterior.
3. Tras confirmar almacenamiento, publicar la referencia y auditar en el mismo commit, comprobando versión.
4. Ante fallo, conservar las referencias anteriores y mostrar el mensaje exacto. Sin imagen, el hotel no cumple el mínimo de activación; el tipo puede activarse sin fotos.
5. La cantidad de fotos no tiene tope comercial; el diseño debe permitir agregar más sin cambiar reglas.

Se auditan creación, edición, activación, desactivación, tipos, tarifas, inventario, propuestas e imágenes, con actor, contenido cambiado y fecha. Una operación rechazada no se registra como modificación exitosa. No se registran binarios ni secretos.

**Puerta técnica:** la conservación/eliminación de objetos R2 sin referencia y la política de acceso público/firmado pertenecen a 012/ACL-13 y deben acordarse antes de habilitar reemplazos productivos. No se borra por suposición un objeto aún referenciado.

## 8. Frontend propuesto

- Landing con sección Hoteles; cada tarjeta muestra imagen principal, nombre, descripción, servicios y tarifa base más baja. Orden y visibilidad provienen del servidor.
- Detalle con descripción, servicios, galería, tipos de habitación, capacidad, tarifa y fotos del tipo si existen; sin imagen de ejemplo cuando no hay fotos.
- Si el hotel no tiene inventario futuro, tarjeta y detalle indican «Sin disponibilidad»; no se oculta el hotel.
- Flujo de reserva de 001: elegir salida, ver propuestas, elegir un tipo y reservar una habitación; sin fechas libres ni reserva hotelera independiente.
- Panel admin: hoteles, servicios como lista libre, tipos, tarifas, inventario por fecha, propuestas e imágenes. Mostrar errores de completitud y conflictos sin éxito ficticio.
- Al fallar una imagen, conservar visualmente la anterior y mostrar «No se pudo cargar la imagen». Sin imagen, el hotel permanece inactivo; el tipo puede activarse sin fotos.
- Sin filtros ni buscador hoteleros; solo orden alfabético.

## 9. Matriz de cobertura

| Criterios | Diseño/tareas que los cubren |
|---|---|
| RF-1–RF-4 | Consulta pública, catálogo completo, reprogramación y propuestas ocultas (§5, §7; T007-12/T007-15/T007-16). |
| RF-5–RF-12 | Tarjetas, detalle, orden, visibilidad sin cupo, enlace no disponible y sección vacía (§4.7/§5; T007-15/T007-16/T007-19/T007-20). |
| RF-13–RF-21 | Alta desactivada, activación completa, edición, desactivación, borrado lógico, permisos, unicidad y auditoría (§4.1/§4.6/§7; T007-08/T007-09/T007-14/T007-22). |
| RF-22–RF-28 | Tipos de habitación, capacidad, tarifa, unicidad, desactivación y borrado lógico (§4.2; T007-04/T007-10/T007-24). |
| RF-29–RF-33 | Inventario por fecha, reducción bajo compromisos, tarifa histórica, cálculo 24 h y fechas futuras (§4.2/§4.3; T007-05/T007-11/T007-17/T007-24). |
| RF-34–RF-44 | Propuestas por salida/hotel/período, todos los tipos activos, una habitación, disponibilidad completa, concurrencia, desactivación, ajuste, inventario compartido y continuidad (§4.4/§7; T007-06/T007-12/T007-17/T007-25). |
| RF-45–RF-50 | Imágenes de hotel, formatos, tamaño, cantidad libre y fallos (§4.5; T007-07/T007-13/T007-26). |
| RF-51–RF-54 | Rechazo con hotel/tipo inactivo, conservación de reservas, prohibición independiente y completitud activa (§4.1/§4.4/§7; T007-09/T007-10/T007-12/T007-25). |
| RF-55–RF-56 | Fotos de tipos, principal + galería, opcionalidad y ausencia de placeholder (§4.5; T007-07/T007-13/T007-20/T007-26). |
| RF-57 | Cambio de fechas de propuesta sin alterar reservas (§4.4/§7; T007-12/T007-25). |
| RF-58 | Servicios como lista libre de textos (§4.1/§7; T007-03/T007-08/T007-22). |

## 10. Puertas técnicas y riesgos

- **ACL-13/ACL-17:** conservación/eliminación de objetos R2 y acceso público/firmado; no borrar objetos referenciados.
- **AC01:** definir volumen, carga y consultas para verificar lecturas simples bajo 300 ms; no presentarlo como SLA nuevo.
- **5 MB:** ratificar 5 000 000 bytes y validación de contenido real antes de implementar.
- **Zona horaria:** validar fechas futuras y períodos en `America/Lima`; almacenar en UTC sin ambigüedad.
- **Concurrencia:** índices únicos parciales, token de versión y transacciones para inventario, unicidad y auditoría; no confiar en comprobaciones previas.
- **Dependencias:** 005/010/012 siguen sin spec completa y 006 tiene contratos de salida; deben validarse antes de integrar. Los dobles de prueba no acreditan cumplimiento.
- **Reservas:** la frontera con 001 debe validar cupos, importes históricos y bloqueos sin duplicar reglas de reserva.

## 11. Criterios de aceptación de este plan

- Cada RF-1–RF-58 tiene al menos una tarea y una verificación asociada.
- Ninguna decisión técnica introduce un límite comercial, un estado o un flujo no aprobado por la spec.
- Las dependencias pendientes se identifican como puertas, no se resuelven por inferencia.
- El plan no se presenta como implementación, prueba ejecutada ni evidencia de cumplimiento.
- Cualquier cambio funcional posterior exige revisar y aprobar la spec 007.
