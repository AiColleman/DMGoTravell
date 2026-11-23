# Plan técnico — 013: Movilidad informativa

> **Fecha:** 2026-10-23. **Versión del plan:** 0.1.  
> **Base:** [spec v0.3 aprobada](spec.md), 32 criterios locales.  
> **Estado:** diseño propuesto para implementación futura; no ejecutado ni validado con código.  
> **Autorización:** «si» a crear plan/tareas de 013, después de planificar Reservas. Todos los cambios de esta actividad permanecen en `sdd/`.

## 1. Objetivo y fuentes

Publicar categorías de vehículos como tarjetas informativas en la landing y permitir su mantenimiento por el administrador. Las tarjetas muestran nombre/tipo, capacidad, una imagen y características; solo aparecen categorías activas, ordenadas alfabéticamente. Sin activos se ocultan sección y enlace. La creación es desactivada y la activación exige contenido completo y válido.

Fuentes: [constitución](../../constitution.md), [decisiones DEC-038–DEC-052](../../decisiones.md), [aclaraciones](../../aclaraciones.md) y [trazabilidad](../../trazabilidad.md). Los criterios `013/RF-*` son locales a la spec; no renumeran los RF originales. DEC-044 pertenece a Catálogo 006, no a Movilidad.

Las elecciones técnicas siguientes son **propuestas de este plan**, no nuevas reglas comerciales ni ADR aceptadas. Aplican el stack documentado: React/TypeScript/Vite, ASP.NET Core/C#, CQRS/MediatR, FluentValidation, PostgreSQL/EF Core/Npgsql, Identity/JWT, R2, OpenAPI y ProblemDetails. Se conserva un solo backend desplegable.

## 2. Alcance y dependencias

| Dependencia | Qué necesita 013 | Estado y efecto |
|---|---|---|
| 005 Identidad | Actor autenticado y permiso `admin` | Spec pendiente. Integración real bloqueada hasta definir contrato; un doble solo sirve para pruebas, no reemplaza autorización. |
| 010 Auditoría | Anexar actor, acción, entidad, identificador, fecha UTC y cambios relevantes | Spec pendiente. Las cuatro acciones de Movilidad ya están aprobadas por DEC-051; acordar contrato transaccional antes de integrar. |
| 012 Multimedia / adaptador compartido | Validación y almacenamiento de la imagen en R2 | Spec general pendiente. Los límites de **013** sí están definidos: una imagen JPG/PNG/WebP, hasta 5 MB y conservación ante fallo. No esperar ni inventar la política de todas las imágenes del producto. |
| Plataforma y landing | Host, migraciones, configuración segura y navegación pública | Aún no hay implementación. Confirmar estructura/versiones de ACL-18 y entornos de ACL-20 antes de ejecutar código. |
| 006 Catálogo | Convivencia de navegación Tours/Paquetes/Hoteles/Movilidad | Hay acuerdos, no spec completa. No implementar sus detalles ni alterar su navegación por deducción. |

013 no necesita lógica de cupos, reservas, pagos, vencimiento, alquileres, contacto, conductores o seguimiento de flota. No añade una relación entre categorías de movilidad y salidas turísticas. Las specs aprobadas 001 y 013 permanecen intactas.

## 3. Organización propuesta

Ubicar la capacidad informativa en un área `Mobility` dentro del mismo monolito, con las capas ya documentadas. Este nombre es organizativo; no crea microservicio, nuevo despliegue ni base de datos separada.

| Capa | Responsabilidad |
|---|---|
| Domain | Categoría, estado activo/inactivo e invariantes de publicación. Sin SDK, HTTP, ORM o R2. |
| Application | Crear/editar/activar/desactivar; consultas pública y administrativa; autorización; coordinación de imagen, persistencia y auditoría. |
| Infrastructure | EF Core/Npgsql, repositorio, transacciones, normalización/orden coherentes y adaptador R2 compartido. |
| Presentation | API pública y administrativa, autenticación, validación de entrada y mapeo ProblemDetails/OpenAPI. |
| Frontend | Sección y enlace condicionados al mismo resultado público; tarjetas; formulario/listado administrativo. |

Puertos propuestos: contexto de actor, repositorio de movilidad, lector público/administrativo, almacenamiento de imagen validada, escritor de auditoría y unidad transaccional. Usar contratos de Application; no consumir repositorios de otros módulos ni datos de negocio desde el navegador.

## 4. Datos e invariantes

### 4.1 Categoría informativa

Modelo técnico propuesto, a concretar en la migración:

- Identificador interno de categoría.
- Un nombre/tipo visible y su clave normalizada de comparación; no dos identidades comerciales distintas para el mismo registro.
- Capacidad de pasajeros, representada como entero cuando esté presente.
- Características principales como contenido textual, sin editor enriquecido nuevo.
- `IsActive`, inicialmente falso.
- Una referencia de imagen principal válida, con tipo detectado y tamaño; sin colección/galería.
- Fechas UTC de creación/actualización y token de concurrencia para evitar sobreescrituras silenciosas.

Un registro incompleto puede persistir inactivo; no forzar campos obligatorios de publicación como `NOT NULL` indiscriminadamente en borradores. Para **todo estado activo**, incluido después de editar uno ya publicado, comprobar nombre no vacío, características no vacías, capacidad entera positiva e imagen válida. Una edición no debe eludir las condiciones de activación ni dejar dos activos equivalentes. El plan propone rechazar esa edición inválida preservando la versión persistida, sin desactivar automáticamente por una regla no aprobada.

### 4.2 Unicidad y concurrencia

Propuesta: normalizar nombre/tipo mediante recorte de espacios exteriores y comparación sin distinguir mayúsculas, sin quitar acentos ni colapsar espacios internos por inferencia. Definir una sola semántica comprobada entre aplicación y PostgreSQL; documentar casos con espacios, mayúsculas y caracteres acentuados en T013-02.

Respaldar la unicidad con un **índice único parcial para registros activos** sobre la clave normalizada. Dos borradores pueden conservar el mismo nombre; al activar o renombrar un activo, una restricción de base de datos resuelve la carrera. No basta consultar antes de guardar. Capturar conflicto de unicidad como error funcional sin sobrescribir ni fusionar registros. Una transacción fallida no registra una activación/edición exitosa en auditoría.

Usar control de concurrencia también al reemplazar imagen, editar y activar/desactivar. Si la versión cambió, rechazar la escritura obsoleta y devolver conflicto; no perder una imagen o un estado actualizado por otra operación. Esta es la propuesta técnica para preservar las invariantes, no una nueva función de edición colaborativa.

### 4.3 Lecturas

- Consulta pública: solo activos, proyección de campos públicos y orden alfabético por nombre/tipo. El plan propone una colación española coherente entre entorno y pruebas; no ordenar por un identificador en vez del nombre.
- Consulta administrativa: incluye activos e inactivos y metadatos necesarios para editar, restringida a `admin`.
- Sin filtros, buscador, carrusel, orden manual ni paginación añadidos. Sin endpoint público de detalle individual.
- El índice parcial y la colación deben verificarse con PostgreSQL real antes de cerrar T013-02; no se promete que cualquier configuración regional tenga exactamente la misma comparación.

## 5. Contratos HTTP propuestos

Las rutas y códigos siguientes son diseño para concretar en OpenAPI, no implementación existente:

| Operación | Ruta propuesta | Respuesta |
|---|---|---|
| Consultar tarjetas públicas | `GET /api/v1/mobility` | `200` con colección de activos; `[]` si no hay ninguno. Sin JWT requerido. |
| Listar registros administrables | `GET /api/v1/admin/mobility` | `200`, activos e inactivos. |
| Leer registro para editar | `GET /api/v1/admin/mobility/{id}` | `200` o `404`. No es detalle público. |
| Crear borrador | `POST /api/v1/admin/mobility` | `201`, registro desactivado. Ignorar como autoridad cualquier rol/estado activo suministrado por cliente. |
| Guardar contenido | `PUT /api/v1/admin/mobility/{id}` | `200`, versión persistida; no aceptar cambiar estado por esta operación. |
| Cargar/reemplazar imagen principal | `PUT /api/v1/admin/mobility/{id}/image` | `200` al completar referencia persistida; fallo no cambia imagen anterior. |
| Activar | `POST /api/v1/admin/mobility/{id}/activate` | `200` si cumple invariantes, `409` si nombre activo duplicado. |
| Desactivar | `POST /api/v1/admin/mobility/{id}/deactivate` | `200`, registro conservado y oculto del público. |

Autenticación requerida para **todas** las rutas admin: `401` sin identidad válida y `403` con rol insuficiente. Application vuelve a comprobar permisos aunque se invoque sin controlador. No crear eliminación física ni endpoints de reserva, disponibilidad, precio o contacto.

Errores propuestos: `400` para entrada inválida/activación incompleta, `404` si no existe registro, `409` para unicidad o versión obsoleta, `413` para tamaño excesivo y `415` para formato no admitido. Error de almacenamiento/persistencia se devuelve mediante ProblemDetails y código técnico consistente que no revele secretos; la interfaz muestra **«No se pudo cargar la imagen»** para la carga/reemplazo fallido. OpenAPI debe documentar también el caso de imagen previa conservada y no presentar un éxito antes del commit.

## 6. Flujos y auditoría

### Crear, editar, activar y desactivar

1. Obtener actor `admin` autenticado; validar solicitud y versión cuando corresponda.
2. Aplicar reglas del caso de uso. Crear siempre inactivo; activar solo con contenido completo, imagen válida y sin otro activo equivalente.
3. Persistir cambio y auditoría de la operación exitosa en una sola transacción local. Si falla auditoría, no publicar una modificación sin su registro obligatorio.
4. Responder con estado persistido; la consulta pública aplica `IsActive`, no un indicador suministrado por frontend.

Creación, edición, activación y desactivación se auditan con RN-28/RN-29. Un reemplazo exitoso de imagen es edición; no inventar una quinta acción pública ni nombres oficiales de auditoría antes de acordar el contrato de 010. No registrar binarios, tokens o credenciales en cambios auditados. La lectura pública no añade auditoría por visitante.

### Cargar/reemplazar la imagen

1. Comprobar autorización y existencia del registro antes de cargar a R2. Guardar la referencia y versión anterior para la comprobación concurrente posterior.
2. Aplicar límite de **5 MB**; este plan propone interpretarlo como **5 000 000 bytes** (MB decimal), límite inclusivo. Es precisión técnica a ratificar antes de implementar, no cambio silencioso a MiB. Validar extensión, MIME y contenido real decodificable JPG/JPEG, PNG o WebP; no confiar solo en el nombre del archivo. JPG y JPEG denominan el mismo formato, no otro tipo de imagen.
3. Cargar bajo una clave nueva no predecible, fuera de la transacción SQL. Nunca sobrescribir el objeto que respalda la imagen anterior.
4. Tras confirmar almacenamiento, reabrir transacción local, comprobar versión actual y publicar la nueva referencia con metadatos validados y auditoría de edición en el mismo commit.
5. Si falla carga, validación, concurrencia o commit, no reemplazar la referencia anterior. Mostrar el mensaje acordado. Si no existía imagen, el registro permanece desactivado y no debe activarse por un resultado parcial.
6. Solo la referencia persistida determina la única imagen principal. La operación de imagen no modifica otros textos ni los elimina por fallar. No se añade placeholder, galería ni reintento automático de la carga.

PostgreSQL no revierte R2: un objeto cargado antes de un fallo SQL puede quedar sin referencia. **NECESITA ACLARACIÓN técnica (ACL-13/ACL-17):** conservación/eliminación de objetos anteriores y sin referencia. No introducir un job de limpieza ni borrar un objeto aún referenciado por suposición. La preservación funcional de la imagen anterior no depende de resolver inmediatamente la eliminación de esos objetos. La política debe concretarse antes de habilitar reemplazos productivos.

## 7. Frontend propuesto

- Una consulta pública entrega el conjunto de tarjetas; sección y enlace de navegación derivan de ese mismo conjunto. Con cero activos se ocultan ambos; al activar el primero aparecen en la siguiente consulta válida. Desactivar el último elimina ambos en la siguiente consulta válida. No afirmar actualización instantánea de pestañas abiertas sin mecanismo acordado.
- Cada tarjeta muestra nombre/tipo, capacidad, una imagen y características. No enlaza a detalle individual ni agrega botones comerciales.
- Formulario admin permite guardar borradores inactivos; botón de activación devuelve los errores de completitud correspondientes. No tratar habilitación/deshabilitación visual de botones como control de seguridad suficiente.
- La vista administrativa muestra el estado de carga y el resultado persistido de la imagen; ante fallo conserva la vista de la imagen anterior y presenta el texto exacto acordado. Sin imagen, mostrar registro inactivo, sin imagen ficticia pública.
- Orden visual consistente con la colección del servidor, sin reordenar por otro criterio en React. No extrapolar a Tours/Paquetes la ausencia de detalle público de esta sección.

## 8. Decisiones técnicas pendientes y dependencias de ejecución

| Puerta | Resolver antes de | Estado |
|---|---|---|
| Versiones runtime/SDK, estructura de solución y configuración por entorno (ACL-18/ACL-20) | Crear solución real, migraciones y adaptadores | **NECESITA ACLARACIÓN técnica.** No hay versiones aprobadas; no escogerlas como requisito funcional. |
| Contrato Identity/JWT/actor de 005 | Habilitar rutas admin reales | Bloqueada por contrato de identidad; pruebas con actor doble no habilitan producción. |
| Contrato de escritura Audit de 010 | Persistir cambios productivos de Movilidad | Bloqueada por contrato; esta spec ya establece qué cuatro operaciones se auditan. |
| Acceso público o firmado, permisos y conservación de R2 (ACL-13/ACL-17) | Integración productiva de imagen | **NECESITA ACLARACIÓN técnica.** Sin inventar eliminación automática ni entregar credenciales al navegador. |
| Normalización/colación y traducción exacta de 5 MB | Cerrar migración/OpenAPI y pruebas de borde | Propuestas de este plan; registrar elección coherente antes de ejecutar T013-03/T013-05. |

Estas puertas no reabren las reglas aprobadas ni añaden funcionalidades. El diseño propuesto no se presenta como una ADR aceptada. Integraciones se habilitan al validar los contratos necesarios en su ámbito, sin exigir a Movilidad implementar todo el sistema de reservas.

## 9. Verificación y trazabilidad completa

No se escriben ni ejecutan pruebas de producto en esta actividad documental. Las pruebas futuras deben demostrar resultados y fallos relevantes:

| Criterios locales de la spec | Diseño | Tareas de entrega | Evidencia futura |
|---|---|---|---|
| RF-1, RF-2, RF-3, RF-4, RF-5, RF-6 | §§5/7, lectura pública y tarjetas | T013-09, T013-10 | Consulta anónima, campos, navegación y ausencia de detalle/comercio; T013-13/T013-15. |
| RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13 | §§4–6, escritura y permisos | T013-03, T013-04, T013-07, T013-08, T013-09, T013-11 | Crear inactivo, editar, publicar, ocultar y negar escritura sin admin; T013-12–T013-15. |
| RF-14, RF-15, RF-16 | §§4/7, categorías y vacío | T013-02, T013-09, T013-10 | Cero activos/primero/último y categoría sin matrícula; T013-13/T013-15. |
| RF-17, RF-18, RF-19, RF-20, RF-21 | §§4/6, activación completa | T013-02, T013-07, T013-08, T013-11 | Activación incompleta/entero inválido rechazada; T013-12/T013-13. |
| RF-22, RF-23 | §6, validación real de imagen | T013-05, T013-06 | Formato falso, imagen corrupta y tamaños debajo/exacto/encima del límite; T013-12/T013-14. |
| RF-24 | §4.2, unicidad de activos | T013-02, T013-03, T013-08 | Dos activaciones concurrentes y renombre de activo en PostgreSQL; T013-13. |
| RF-25 | §4.3/7, orden alfabético | T013-02, T013-09, T013-10 | Orden de nombres mixtos coherente entre servidor/UI; T013-13/T013-15. |
| RF-26, RF-27, RF-28, RF-29 | §6, auditoría transaccional | T013-07, T013-08 | Actor/datos correctos y rollback ante fallo de auditoría; T013-13. |
| RF-30, RF-31, RF-32 | §6/7, referencia de imagen conservada | T013-06, T013-11 | Falla R2, commit fallido y conflicto concurrente, con/sin imagen anterior; T013-14/T013-15. |

Pruebas de integridad requieren PostgreSQL real; dobles son apropiados para fallos de almacenamiento y reglas aisladas, no para demostrar índice único o transacciones. La matriz cubre los 32 criterios y sus tareas; no es evidencia de cumplimiento actual.

## 10. Cierre del trabajo futuro

- Todas las tareas ejecutadas con evidencia, puertas técnicas resueltas y cobertura de RF-1–RF-32 verificada.
- OpenAPI, migraciones, integraciones y mensajes coinciden con la spec v0.3; variaciones de comportamiento vuelven a revisión antes de implementarse.
- Sin nuevos flujos comerciales, cambios de Reservas ni aprobación implícita de Catálogo 006.
- Las aprobaciones funcionales existentes se conservan; este plan y [tasks.md](tasks.md) son documentos no ejecutados. La implementación de código necesita una actividad posterior autorizada fuera del alcance documental actual.
