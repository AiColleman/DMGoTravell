# Spec 013 — Movilidad informativa en la landing

> **Estado:** **APROBADA** explícitamente por el usuario el 2026-10-22.
> **Versión aprobada:** 0.3. El registro de aprobación no modifica los criterios presentados.
> **Fuente del alcance nuevo:** solicitud y respuestas del usuario, DEC-038–DEC-052 en [decisiones](../../decisiones.md). No existe un RF/HU original de Movilidad; no se inventan identificadores oficiales de producto.
> **Restricciones transversales:** [constitución](../../constitution.md), F01/F04/F05 en [fuentes](../../fuentes.md). No quedan dudas funcionales propias en ACL-26/ACL-27.
> **Separación:** no modifica la spec 001 v0.13 aprobada ni la precisión de Tours/Paquetes DEC-044, asignada a 006.

## Contexto y objetivo

DMGoTravell quiere mostrar al visitante los vehículos o tipos de vehículos con los que cuenta la empresa, para que conozca su capacidad y características. La nueva sección «Movilidad» de la landing será pública y únicamente informativa, separada de Tours, Paquetes y Hoteles. No ofrecerá contratación, precios ni disponibilidad de transporte. El administrador mantendrá la información que aparece en las tarjetas.

## Usuarios / actores

- **Visitante o cliente:** consulta información pública sin necesidad de iniciar sesión.
- **Administrador:** crea, edita, activa y desactiva los registros informativos de movilidad.

Se reutilizan los actores documentados (F01 §§1–2 y F15 §3). No hay nuevo rol de conductor, transportista, propietario o proveedor de vehículos.

## Historias de usuario

Las fuentes originales no contienen una HU de Movilidad. Los enunciados siguientes sintetizan las necesidades expresadas en DEC-038–DEC-051; **no son HU oficiales nuevas ni tienen prioridad P1/P2/P3 asignada**:

- Como visitante, quiero conocer las opciones de movilidad de DMGoTravell y sus características en la landing. (DEC-038/DEC-039)
- Como administrador, quiero mantener los registros informativos y elegir cuáles se publican mediante su estado activo. (DEC-040/DEC-041)

## Requisitos funcionales (criterios de aceptación en EARS)

`RF-1` y sucesivos son criterios **locales de 013**, referenciables como `013/RF-1`; no sustituyen ni amplían por renumeración RF01–RF24.

- **RF-1:** CUANDO un visitante consulta la sección Movilidad de la landing, EL SISTEMA permitirá consultar su información pública sin autenticación. (DEC-038)
- **RF-2:** CUANDO se presentan registros de movilidad publicados, EL SISTEMA los mostrará como tarjetas informativas dentro de la sección Movilidad de la landing. (DEC-042)
- **RF-3:** CUANDO se muestra una tarjeta de movilidad, EL SISTEMA presentará nombre o tipo, capacidad de pasajeros, imagen y características principales del registro. (DEC-039)
- **RF-4:** MIENTRAS exista al menos un registro de movilidad activo, EL SISTEMA ofrecerá la opción «Movilidad» junto a Tours, Paquetes y Hoteles. (DEC-043, DEC-045)
- **RF-5:** CUANDO el visitante selecciona «Movilidad» en la navegación, EL SISTEMA lo llevará a la sección Movilidad de la landing. (DEC-043)
- **RF-6:** EL SISTEMA limitará la presentación pública individual de movilidad a las tarjetas de la landing, sin una página de detalle por vehículo. (DEC-042)
- **RF-7:** CUANDO un administrador crea un registro informativo de movilidad, EL SISTEMA lo conservará inicialmente desactivado para su administración. (DEC-040, DEC-047)
- **RF-8:** CUANDO un administrador edita un registro informativo de movilidad con datos admitidos, EL SISTEMA guardará los cambios de ese registro. (DEC-040; reglas concretas RF-17–RF-25)
- **RF-9:** CUANDO un administrador activa un registro de movilidad que cumple las condiciones de publicación, EL SISTEMA lo habilitará para aparecer en la sección pública. (DEC-040/DEC-041/DEC-047)
- **RF-10:** CUANDO un administrador desactiva un registro de movilidad, EL SISTEMA lo excluirá de la consulta pública de la sección. (DEC-040/DEC-041)
- **RF-11:** CUANDO se consulta la movilidad pública, EL SISTEMA mostrará únicamente los registros activos. (DEC-041)
- **RF-12:** MIENTRAS un registro de movilidad permanezca desactivado, EL SISTEMA lo conservará accesible para su administración. (DEC-041; no historial de versiones nuevo)
- **RF-13:** SI un usuario sin rol `admin` solicita crear, editar, activar o desactivar movilidad, ENTONCES EL SISTEMA rechazará esa modificación. (DEC-040; RN-26, RS03 y F01 §2 como restricciones transversales)

### Segunda ronda: publicación, validación, orden y auditoría

- **RF-14:** MIENTRAS no exista ningún registro de movilidad activo, EL SISTEMA ocultará la sección Movilidad de la landing. (DEC-045)
- **RF-15:** MIENTRAS no exista ningún registro de movilidad activo, EL SISTEMA ocultará la opción pública «Movilidad» de la navegación. (DEC-045)
- **RF-16:** EL SISTEMA representará cada registro informativo de movilidad como una categoría o tipo de vehículo, no como una unidad individual. (DEC-046)
- **RF-17:** SI un administrador intenta activar un registro sin nombre o tipo, ENTONCES EL SISTEMA impedirá su activación. (DEC-047)
- **RF-18:** SI un administrador intenta activar un registro sin capacidad de pasajeros válida, ENTONCES EL SISTEMA impedirá su activación. (DEC-047, DEC-049)
- **RF-19:** SI un administrador intenta activar un registro sin imagen principal válida, ENTONCES EL SISTEMA impedirá su activación. (DEC-047, DEC-048)
- **RF-20:** SI un administrador intenta activar un registro sin características principales, ENTONCES EL SISTEMA impedirá su activación. (DEC-047)
- **RF-21:** SI la capacidad de pasajeros de un registro no es un número entero mayor que cero, ENTONCES EL SISTEMA impedirá su activación. (DEC-049)
- **RF-22:** SI la imagen principal de un registro no es JPG, PNG o WebP, ENTONCES EL SISTEMA impedirá su activación. (DEC-048)
- **RF-23:** SI la imagen principal de un registro excede 5 MB, ENTONCES EL SISTEMA impedirá su activación. (DEC-048)
- **RF-24:** SI un administrador intenta activar un registro cuyo nombre o tipo coincide con el de otro registro activo al ignorar mayúsculas y espacios exteriores, ENTONCES EL SISTEMA impedirá esa activación. (DEC-049)
- **RF-25:** CUANDO se presentan varios registros de movilidad activos, EL SISTEMA los ordenará alfabéticamente por nombre o tipo. (DEC-050)
- **RF-26:** CUANDO un administrador crea un registro de movilidad, EL SISTEMA registrará esa operación en auditoría. (DEC-051; RN-28)
- **RF-27:** CUANDO un administrador edita un registro de movilidad, EL SISTEMA registrará esa operación en auditoría. (DEC-051; RN-28)
- **RF-28:** CUANDO un administrador activa un registro de movilidad, EL SISTEMA registrará esa operación en auditoría. (DEC-051; RN-28)
- **RF-29:** CUANDO un administrador desactiva un registro de movilidad, EL SISTEMA registrará esa operación en auditoría. (DEC-051; RN-28)
- **RF-30:** SI falla la carga o reemplazo de una imagen principal, ENTONCES EL SISTEMA mostrará «No se pudo cargar la imagen». (DEC-052)
- **RF-31:** SI falla el reemplazo de una imagen principal y el registro ya tenía una imagen, ENTONCES EL SISTEMA conservará la imagen principal anterior. (DEC-052)
- **RF-32:** SI falla la carga de imagen de un registro que no tenía imagen principal, ENTONCES EL SISTEMA mantendrá el registro desactivado. (DEC-052; no publicar sin imagen)

Las activaciones son verificables con RF-17–RF-24 y los fallos de imagen con RF-30–RF-32. Los criterios locales no crean RF/HU oficiales nuevos ni una política técnica de recuperación no acordada.

## Requisitos no funcionales

- **AC04 / RS03:** gestión de contenido restringida a administrador; el acceso público no otorga permisos de edición. Los controles administrativos se mantienen aunque se altere una petición fuera de la interfaz.
- **AC08 / AC10:** presentar los datos acordados y comunicar errores conforme a las convenciones transversales. No se inventan textos de error o respuestas precisas para casos no acordados.
- **RS10:** validar imágenes antes de almacenarlas. Para Movilidad, formatos permitidos JPG/PNG/WebP, una imagen principal y máximo 5 MB (DEC-048); ante fallo informar, conservar la anterior si existe o mantener desactivado si no existe (DEC-052).
- **AC11:** los comportamientos de publicación, exclusión de inactivos y permisos deben poder verificarse sin depender de un proveedor externo real en cada prueba.
- No se añade un SLA de carga, idioma adicional o requisito cuantitativo de accesibilidad que no esté definido en las fuentes. Las restricciones técnicas del proyecto permanecen en la constitución; su concreción pertenece al plan, no a esta spec.

## Casos límite

| Caso | Resultado documentado | Pendiente |
|---|---|---|
| Visitante sin cuenta | Puede consultar información pública; RF-1. | Ninguno respecto a autenticación de lectura. |
| Usuario cliente intenta editar movilidad | Rechazar modificación; RF-13. | Mapeo técnico de errores posterior. |
| Registro desactivado | No aparece en público y sigue administrable; RF-10–RF-12. | No convertirlo en eliminación física. |
| Ningún registro o ninguno activo | Ocultar sección y enlace; RF-14–RF-15. | Resuelto por DEC-045; no mostrar ejemplos ficticios/inactivos. |
| Registro nuevo | Se conserva desactivado; RF-7. | Solo se activa al cumplir RF-17–RF-24. |
| Datos incompletos o capacidad inválida | Puede permanecer desactivado para edición; no se activa; RF-17–RF-21. | No se elimina ni publica automáticamente. |
| Tipo/categoría frente a unidad concreta | Representa categoría, no unidad individual; RF-16. | Resuelto por DEC-046; no matrículas/inventario de flota. |
| Dos registros activos equivalentes | Activación del segundo se impide; RF-24. | Comparación definida; no fusión automática. |
| Varios registros activos | Solo activos, orden alfabético; RF-11/RF-25. | Sin carrusel, filtros, buscador o paginación. |
| Imagen ausente/no permitida/mayor a 5 MB | No se activa; RF-19/RF-22/RF-23. | Resuelto por DEC-048; no publicar sin imagen. |
| Falla carga o reemplazo de imagen | Mostrar «No se pudo cargar la imagen»; conservar imagen anterior o mantener desactivado sin imagen; RF-30–RF-32. | Resuelto por DEC-052; sin placeholder/reintento automático. |

## Fuera de alcance

- Reservas de vehículos o transporte, tarifas, cotización y disponibilidad operativa.
- Alquileres, solicitudes de contacto o contratación desde esta sección.
- Añadir movilidad como componente de reservas de tour/paquete/hotel, asignar vehículo a una salida o modificar totales/pagos.
- Seguimiento de flota, rutas, GPS, conductores y nuevos roles de usuario.
- Página pública individual por vehículo, buscador, filtros, carrusel o paginación no acordados.
- Eliminación física, importaciones, orden manual y un nuevo historial de versiones del contenido no solicitados.
- Detalle e itinerario de Tours/Paquetes: corresponde a 006 y DEC-044, no desaparece por no tener Movilidad una página de detalle.

Estas exclusiones son locales a Movilidad, no retiran los precios, disponibilidad o reservas de las otras funcionalidades existentes.

## Criterios de finalización

### Cierre documental

- Mantener cada criterio local enlazado con la decisión fuente y las restricciones aplicables.
- Mantener cada decisión de publicación, validación, presentación y fallo de imagen enlazada con su fuente, sin añadir políticas no acordadas.
- Presentar esta spec completa al usuario y registrar **aprobación explícita de su versión**. Las aprobaciones de las seis decisiones de entrevista y «dale» no aprueban automáticamente el documento.
- No crear `plan.md` ni `tasks.md` de 013 antes de esa aprobación.

### Aceptación de una implementación futura

- Verificar consulta anónima, campos visibles, navegación a sección, tarjetas sin página individual, cambios administrativos y exclusión de inactivos.
- Verificar que clientes/visitantes no puedan modificar contenido y que la sección no ofrezca reservas, tarifas o contratación.
- Comprobar sección sin activos, estado inicial desactivado, condiciones de activación, orden alfabético, auditoría y el comportamiento de fallo de imagen acordado.

Esta actividad solo documenta; no hay código, pruebas de producto o despliegue de Movilidad.

## Dudas abiertas

No quedan abiertas las preguntas funcionales propias de Movilidad tratadas en la entrevista. ACL-26 cerrada por DEC-045 y ACL-27 por DEC-046–DEC-052. No reabrir presencia sin activos, categoría, activación, imagen, orden, auditoría o fallo de imagen como dudas pendientes. **Esta versión completa fue aprobada explícitamente el 2026-10-22.**

## Aprobación de esta especificación

- **Versión aprobada:** 0.3.
- **Solicitud presentada:** «¿Apruebas explícitamente la especificación 013 — Movilidad informativa en landing, versión 0.3?».
- **Respuesta explícita del usuario:** «ya te dije si»; interpretada como confirmación de esa solicitud explícita después de señalar la repetición de la pregunta.
- **Fecha de aprobación:** 2026-10-22.
- **Alcance de la aprobación:** los 32 criterios locales, límites y dependencias de esta versión. No aprueba 006 ni otras specs; no convierte Movilidad en reserva, precio, disponibilidad, alquiler o contacto.
- **Planes/tareas:** no creados en este registro. La aprobación habilita pasar a plan/tareas de 013, sin autorizar código, documentación original, commits ni push.
