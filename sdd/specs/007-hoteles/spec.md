# Spec 007 — Hoteles y alojamiento

> **Estado:** **APROBADA** explícitamente el 2026-10-31; versión 0.2.  
> **Versión:** 0.2, 2026-10-31.  
> **Requisitos de origen:** RF17, RF20 y RF24; aplicación de RF18/RF19 y reglas compartidas con RF05/RF06/RF22. Se conservan sus identificadores.  
> **Fuentes:** F02 §§1 y 6, F03 §§1/3/5/6, F04 y F12 §2.4; [inventario](../../fuentes.md). DEC-006, DEC-007, DEC-008, DEC-018, DEC-019, DEC-023, DEC-025, DEC-026, DEC-031, DEC-032, DEC-072 y DEC-086/DEC-087; nuevas DEC-108–DEC-118 en [decisiones](../../decisiones.md).  
> **Antecedente:** [acuerdos parciales](acuerdos.md). Sus cuatro criterios se conservan como 007/RF-1–007/RF-4.  
> **Dependencias:** 001 Reservas aprobada v0.13; 005 Identidad, 006 Catálogo, 010 Auditoría y 012 Multimedia con contratos pendientes. Esta spec no altera sus documentos aprobados ni habilita implementación.

## Resumen para revisión

- Catálogo público de hoteles sin login: tarjetas y página de detalle con descripción, servicios, fotos y tipos de habitación.
- El hotel activo sigue visible aunque no tenga habitaciones disponibles; el detalle lo indica.
- Cada hotel se crea desactivado y se activa con nombre, descripción, al menos un servicio, al menos una foto y al menos un tipo de habitación con capacidad y tarifa válidas.
- Fotos: una principal y galería sin límite de cantidad para el hotel y para cada tipo de habitación; las del tipo son opcionales. JPG/PNG/WebP de hasta 5 MB por archivo.
- El administrador gestiona hoteles, tipos de habitación, tarifas e inventario por fecha, y propuestas de alojamiento por salida.
- Una propuesta agrupa una salida, un hotel y un período de 24 horas; dentro se ofrecen todos los tipos de habitación activos, cada uno con su tarifa y cupo.
- Los servicios del hotel se registran como una lista libre de textos, sin catálogo fijo.
- Se conservan las reglas de 001: una habitación, tarifa fija por período de 24 horas, sin fechas libres del cliente, sin tolerancia de salida y sin reserva hotelera independiente.

Este resumen no sustituye los criterios ni constituye aprobación. Los detalles técnicos de medición, almacenamiento y rendimiento se resolverán en el plan.

## Contexto y objetivo

El visitante necesita conocer los hoteles disponibles, sus servicios, fotos, tipos de habitación y tarifas antes de elegir alojamiento para una salida turística. El administrador necesita mantener hoteles, servicios como lista libre de textos, tipos de habitación, tarifas, inventario y propuestas asociadas a cada salida sin romper reservas históricas.

El alojamiento es opcional y complementa una reserva turística de 001. No se reserva un hotel por separado: el cliente elige una propuesta asociada a la salida y una habitación de un tipo, dentro de la misma operación de reserva.

## Usuarios / actores

- **Visitante o cliente:** consulta el catálogo público de hoteles sin autenticarse. Reservar requiere identidad según 001.
- **Administrador (`admin`):** crea y mantiene hoteles, servicios, tipos de habitación, tarifas, inventario y propuestas; activa, desactiva y ajusta fechas. Sus escrituras requieren rol `admin`.
- **Sistema:** aplica visibilidad, disponibilidad, tarifas y protección de reservas en todos los flujos que usan alojamiento.

## Historias de usuario

Fuente: F02 §1 y §6. Se conservan identificadores y prioridad original.

- **HU-21:** Como visitante, quiero explorar hoteles para conocer opciones de alojamiento, servicios y tarifas. (P1)
- **HU-23:** Como administrador, quiero gestionar hoteles, tipos de habitación e inventario para ofrecer alojamiento. (P2)
- **HU-22:** Como cliente, quiero agregar alojamiento opcional a mi reserva turística para consolidar mi viaje. (P1; su flujo de reserva pertenece a 001 y se referencia, no se reespecifica aquí.)

## Requisitos funcionales (criterios de aceptación en EARS)

### Acuerdos previos conservados

- **RF-1:** CUANDO un visitante consulta la sección Hoteles, EL SISTEMA permitirá explorar su catálogo público sin iniciar sesión. (RF17; HU-21; DEC-072)
- **RF-2:** CUANDO un visitante consulta la sección Hoteles de la página de inicio, EL SISTEMA mostrará todos los hoteles públicamente visibles en su sección correspondiente, sin paginación visible. (RF17; HU-21; DEC-072)
- **RF-3:** CUANDO se reprograma una salida sin reservas, EL SISTEMA conservará las fechas de sus propuestas hoteleras asociadas hasta que el administrador las modifique explícitamente. (DEC-086; RF20/HU-23)
- **RF-4:** MIENTRAS una propuesta hotelera asociada a una salida reprogramada tenga fechas pendientes de ajuste por admin, EL SISTEMA la excluirá de las opciones de alojamiento seleccionables de esa salida. (DEC-087; RF18; DEC-031)

### Catálogo público

- **RF-5:** CUANDO el visitante consulta una tarjeta de hotel con al menos un tipo de habitación activo, EL SISTEMA mostrará imagen principal, nombre, descripción, servicios y tarifa base más baja entre sus tipos de habitación activos. (RF17; HU-21; DEC-108)
- **RF-6:** CUANDO el visitante abre el detalle de un hotel públicamente visible, EL SISTEMA mostrará descripción, servicios, galería y tipos de habitación con su capacidad, tarifa base y, si existen, sus fotos. (RF17; HU-21; DEC-108/DEC-116)
- **RF-7:** CUANDO el visitante consulta la sección Hoteles, EL SISTEMA ordenará los hoteles alfabéticamente por nombre, de A a Z. (RF17; HU-21; DEC-113; coherencia con 006/DEC-073 y 013)
- **RF-8:** CUANDO se consulta el catálogo público de hoteles, EL SISTEMA excluirá los hoteles inactivos o eliminados lógicamente. (RF17; RN-01; RN-30)
- **RF-9:** MIENTRAS un hotel activo no tenga ningún tipo de habitación con inventario futuro disponible, EL SISTEMA mantendrá visible su tarjeta y su detalle e indicará «Sin disponibilidad». (RF17; HU-21; DEC-109)
- **RF-10:** CUANDO el visitante abre el detalle de un hotel, EL SISTEMA mostrará los tipos de habitación y su tarifa base; la disponibilidad concreta se consultará al elegir alojamiento para una salida. (RF17; HU-21; DEC-007/DEC-031; DEC-109)
- **RF-11:** SI el hotel solicitado no existe, está inactivo o fue eliminado lógicamente, ENTONCES EL SISTEMA responderá «Hotel no disponible» sin mostrar su detalle. (RF17; RN-01; RN-30)
- **RF-12:** MIENTRAS la sección Hoteles no tenga ningún hotel públicamente visible, EL SISTEMA ocultará la sección y su enlace de navegación. (RF17; HU-21; coherencia con 006/RF-62/RF-63)

### Administración de hoteles

- **RF-13:** CUANDO un administrador crea un hotel con datos admitidos, EL SISTEMA lo guardará desactivado. (RF20; HU-23; DEC-111)
- **RF-14:** CUANDO un administrador activa un hotel con nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo de habitación con capacidad y tarifa válidas, EL SISTEMA lo habilitará para consulta pública. (RF20; HU-23; DEC-111)
- **RF-15:** SI un administrador intenta activar un hotel sin nombre, descripción, al menos un servicio, al menos una imagen o al menos un tipo de habitación válido, ENTONCES EL SISTEMA rechazará la activación. (RF20; HU-23; DEC-111)
- **RF-16:** CUANDO un administrador modifica un hotel con datos admitidos, EL SISTEMA guardará los cambios y los aplicará a las nuevas consultas y reservas. (RF20; HU-23)
- **RF-17:** CUANDO un administrador desactiva un hotel, EL SISTEMA lo excluirá del catálogo público y de las nuevas reservas, conservando las reservas ya creadas. (RF20; RN-01; DEC-026/DEC-032)
- **RF-18:** CUANDO un hotel con relaciones históricas se elimina, EL SISTEMA aplicará borrado lógico sin romper reservas ni auditoría. (RF20; RN-30)
- **RF-19:** SI un usuario sin rol `admin` intenta crear, modificar, activar, desactivar o eliminar hoteles, tipos de habitación, tarifas, inventario o propuestas, ENTONCES EL SISTEMA rechazará la operación. (RF20; RN-26)
- **RF-20:** SI se intenta activar o renombrar un hotel con un nombre equivalente a otro hotel activo, ignorando mayúsculas/minúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará la operación. (RF20; DEC-113; coherencia con 006/RF-84/DEC-091/DEC-092)
- **RF-21:** CUANDO se aplica un cambio administrativo en hoteles, tipos de habitación, tarifas, inventario o propuestas, EL SISTEMA registrará actor, acción, entidad, identificador, fecha y cambios relevantes. (RF20/RF23; RN-28; DEC-113)

### Tipos de habitación

- **RF-22:** CUANDO un administrador crea o modifica un tipo de habitación, EL SISTEMA guardará nombre, capacidad y tarifa base. (RF20; HU-21/HU-23)
- **RF-23:** SI se intenta guardar un tipo de habitación con capacidad menor o igual a cero o con parte fraccionaria, ENTONCES EL SISTEMA rechazará ese valor. (RF20; DEC-113; coherencia con 013/RF-8)
- **RF-24:** SI se intenta guardar una tarifa base menor o igual a cero o con más de dos decimales, ENTONCES EL SISTEMA rechazará ese valor. (RF20; RN-02; DEC-008/DEC-018; ACL-06)
- **RF-25:** SI se intenta guardar un tipo de habitación con un nombre equivalente a otro del mismo hotel, ignorando mayúsculas/minúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará la operación. (RF20; DEC-113)
- **RF-26:** CUANDO un administrador desactiva un tipo de habitación, EL SISTEMA impedirá nuevas reservas de ese tipo y conservará las reservas ya creadas. (RF20; RN-01; DEC-032)
- **RF-27:** CUANDO un tipo de habitación con reservas históricas se elimina, EL SISTEMA aplicará borrado lógico. (RF20; RN-30)
- **RF-28:** MIENTRAS un tipo de habitación esté inactivo o eliminado lógicamente, EL SISTEMA no lo ofrecerá en nuevas reservas ni en propuestas nuevas. (RF20; RN-01)

### Inventario y tarifas

- **RF-29:** CUANDO el administrador configura inventario, EL SISTEMA lo controlará por tipo de habitación y fecha/noche, como cantidad entera no negativa. (RF20; RN-11; DEC-025)
- **RF-30:** SI una reducción administrativa de inventario deja menos habitaciones que las comprometidas por reservas o retenciones pendientes vigentes en el período afectado, ENTONCES EL SISTEMA rechazará esa reducción. (RF20; RN-11–RN-13; DEC-025)
- **RF-31:** CUANDO cambia la tarifa base de un tipo de habitación, EL SISTEMA conservará los importes de las reservas ya creadas y aplicará la tarifa vigente a las nuevas. (RF20; RN-02; DEC-008)
- **RF-32:** CUANDO se calcula el importe hotelero de una reserva, EL SISTEMA multiplicará la tarifa base del tipo de habitación por la cantidad de períodos completos de 24 horas de la propuesta elegida, sin multiplicar por ocupantes. (RF19; DEC-008/DEC-018/DEC-114; 001/RF-80)
- **RF-33:** CUANDO el administrador crea o modifica una propuesta, EL SISTEMA exigirá que su período sea un múltiplo positivo de 24 horas y que sus fechas sean futuras en hora de Perú. (RF20; DEC-018/DEC-023; 001/RF-81)

### Propuestas de alojamiento por salida

- **RF-34:** CUANDO el administrador configura una propuesta de alojamiento, EL SISTEMA la asociará a una salida, un hotel y un período; la propuesta ofrecerá todos los tipos de habitación activos del hotel. (RF20; HU-23; DEC-031; DEC-112/DEC-117)
- **RF-35:** CUANDO el cliente consulta el alojamiento de una salida, EL SISTEMA mostrará únicamente las propuestas asociadas a esa salida. (RF18; HU-22; DEC-031)
- **RF-36:** CUANDO el cliente elige una propuesta, EL SISTEMA permitirá seleccionar uno de los tipos de habitación activos ofrecidos y reservará exactamente una habitación. (RF18; HU-22; DEC-006; 001/RF-40)
- **RF-37:** CUANDO se valida la disponibilidad de una propuesta, EL SISTEMA comprobará el inventario del tipo de habitación en todas las fechas/noches del período. (RF18; RN-11–RN-13; 001/RF-14)
- **RF-38:** SI falta inventario en cualquiera de las fechas/noches del período, ENTONCES EL SISTEMA rechazará la reserva sin bloquear parcialmente otras noches. (RF18; RN-13; 001/RF-16)
- **RF-39:** SI dos solicitudes concurrentes compiten por la última habitación del mismo tipo en períodos que se solapan, ENTONCES EL SISTEMA permitirá que solo una la obtenga. (RF18; RN-11–RN-13; 001/RF-15)
- **RF-40:** CUANDO un administrador desactiva una propuesta, EL SISTEMA impedirá nuevas reservas para esa propuesta y conservará las ya creadas. (RF20; DEC-032)
- **RF-41:** CUANDO un administrador ajusta las fechas de una propuesta afectada por reprogramación, EL SISTEMA la volverá a ofrecer si la propuesta, el hotel y el tipo de habitación siguen activos y hay inventario. (RF20; DEC-087)
- **RF-42:** MIENTRAS una propuesta esté oculta por fechas pendientes de ajuste, EL SISTEMA mantendrá su acceso para el administrador sin mostrarla al cliente. (RF20; DEC-087)
- **RF-43:** CUANDO el mismo hotel se asocia a distintas salidas, EL SISTEMA compartirá su inventario real por tipo y fecha, sin crear inventarios independientes por salida. (RF20; DEC-031; RN-11)
- **RF-44:** CUANDO dos estancias del mismo tipo terminan y comienzan en el mismo instante, EL SISTEMA permitirá esa continuidad sin contarlas como solapadas. (RF18; 001/RF-81; coherencia con 001)

### Imágenes

- **RF-45:** CUANDO el administrador gestiona las fotos de un hotel, EL SISTEMA permitirá designar una imagen principal y asociar una galería que se muestra en el detalle. (RF24; HU-21; DEC-110)
- **RF-46:** SI se intenta cargar una imagen de hotel o de tipo de habitación en un formato distinto de JPG, PNG o WebP, ENTONCES EL SISTEMA rechazará ese archivo. (RF24; DEC-110/DEC-116)
- **RF-47:** SI se intenta cargar una imagen de hotel o de tipo de habitación cuyo tamaño supera 5 MB, ENTONCES EL SISTEMA rechazará ese archivo. (RF24; DEC-110/DEC-116)
- **RF-48:** EL SISTEMA permitirá al administrador asociar a un hotel o a un tipo de habitación todas las fotografías que necesite, sin imponer una cantidad máxima fija como regla de negocio. (RF24; DEC-110/DEC-116)
- **RF-49:** SI falla la carga o el reemplazo de una foto de hotel o de tipo de habitación, ENTONCES EL SISTEMA mostrará «No se pudo cargar la imagen». (RF24; DEC-110/DEC-116)
- **RF-50:** SI falla la carga o el reemplazo de una foto de hotel o de tipo de habitación, ENTONCES EL SISTEMA conservará las imágenes anteriores de ese hotel o tipo. (RF24; DEC-110/DEC-116)

### Protección de reservas y límites con 001

- **RF-51:** SI el hotel o el tipo de habitación de una propuesta está inactivo o eliminado lógicamente, ENTONCES EL SISTEMA rechazará la nueva reserva compuesta. (RF18; RN-01; 001/RF-12)
- **RF-52:** CUANDO se desactiva un hotel, un tipo de habitación o una propuesta, EL SISTEMA conservará las reservas ya creadas con sus condiciones, precios y plazos. (RF20; DEC-026/DEC-032)
- **RF-53:** EL SISTEMA no permitirá reservar un hotel de forma independiente de una salida turística. (RF17/RF18; 001/RF-10–RF-11; fuera de alcance de esta spec)
- **RF-54:** SI una edición deja un hotel activo sin nombre, descripción, al menos un servicio o al menos una imagen, ENTONCES EL SISTEMA rechazará la edición y conservará los datos anteriores. (RF20; DEC-111/DEC-113; coherencia con 006/DEC-074)

### Fotos de tipos de habitación

- **RF-55:** CUANDO el administrador gestiona las fotos de un tipo de habitación, EL SISTEMA permitirá designar una imagen principal y asociar una galería que se muestra en el detalle; las fotos serán opcionales para activar el tipo. (RF24; DEC-116)
- **RF-56:** SI un tipo de habitación no tiene fotos, ENTONCES EL SISTEMA lo mostrará sin imagen, sin placeholder ni imagen de ejemplo. (RF24; DEC-116)

### Protección de reservas ante cambios

- **RF-57:** CUANDO se modifican las fechas de una propuesta, EL SISTEMA conservará las reservas ya creadas con sus condiciones e importes. (RF20; DEC-113; 001/ACL-07)

### Servicios del hotel

- **RF-58:** EL SISTEMA permitirá al administrador registrar los servicios de un hotel como una lista de textos libres, sin exigir un catálogo fijo. (RF20; HU-21; DEC-118)

## Requisitos no funcionales

- **AC04 / RN-26:** las operaciones administrativas requieren rol `admin`; visitantes y clientes no modifican hoteles, servicios, tarifas, inventario ni propuestas.
- **AC07 / RN-11–RN-13:** no sobreventa por reservas o ajustes concurrentes; la validación y el bloqueo de todas las noches son indivisibles.
- **RN-28/RN-29:** auditoría de operaciones críticas con actor, acción, entidad, identificador, fecha y cambios; registros no modificables desde la aplicación.
- **RN-30:** borrado lógico de hoteles y tipos de habitación con historial.
- **AC01:** objetivo inicial aproximado de lecturas simples menor a 300 ms en backend, excluyendo red pública/terceros. **PENDIENTE TÉCNICO (plan):** volumen, carga y consultas de verificación (ACL-15). No es un SLA nuevo.

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Hotel activo sin habitaciones disponibles | Sigue visible; tarjeta/detalle indican «Sin disponibilidad» | RF-9 |
| Hotel inactivo o eliminado | No aparece en catálogo; detalle directo «Hotel no disponible» | RF-8/RF-11 |
| Sección Hoteles sin hoteles visibles | Se ocultan sección y enlace | RF-12 |
| Activación sin foto o sin tipo de habitación válido | Se rechaza la activación; el hotel sigue desactivado | RF-15 |
| Nombre de hotel equivalente a otro activo | Se rechaza; no se fusionan ni sobrescriben | RF-20 |
| Tipo de habitación duplicado en el mismo hotel | Se rechaza | RF-25 |
| Capacidad o tarifa inválida | Se rechaza el guardado | RF-23/RF-24 |
| Reducción de inventario bajo compromisos | Se rechaza; no se cancelan reservas | RF-30 |
| Cambio de tarifa con reservas creadas | Las reservas conservan sus importes | RF-31 |
| Propuesta con período que no es múltiplo de 24 h | Se rechaza | RF-33 |
| Propuesta con fecha pasada o actual en Perú | Se rechaza | RF-33 |
| Falta una noche del período | Se rechaza la reserva completa, sin bloqueo parcial | RF-38 |
| Dos clientes piden la última habitación | Solo una reserva la obtiene | RF-39 |
| Reprogramación de salida sin reservas | Fechas hoteleras se conservan hasta ajuste manual; propuestas afectadas ocultas | RF-3/RF-4/RF-41/RF-42 |
| Hotel o tipo desactivado con reservas | Las reservas existentes se conservan; no hay nuevas | RF-17/RF-26/RF-52 |
| Falla de carga de foto | Mensaje exacto y conservación de imágenes anteriores | RF-49/RF-50 |
| Tipo de habitación sin fotos | Se muestra sin imagen; no impide activarlo | RF-55/RF-56 |
| Tipo de habitación con fotos | Imagen principal y galería en el detalle | RF-55 |
| Se intenta una tarifa distinta por salida o temporada | Se rechaza; rige la tarifa única del tipo | RF-32/DEC-114 |
| Se busca un filtro o buscador hotelero | No existe; el catálogo solo se ordena alfabéticamente | RF-7/DEC-115 |
| Hotel sin servicios | No se activa; la activación se rechaza | RF-14/RF-15 |
| Servicios del hotel | Lista libre de textos; se muestran en tarjeta y detalle | RF-5/RF-6/RF-58 |

## Fuera de alcance

- Reserva hotelera independiente, sin tour o paquete asociado.
- Varias habitaciones, varios hoteles o varios tipos en una misma reserva.
- Fechas u horarios elegidos libremente por el cliente; el período lo asigna el administrador.
- Tarifas por ocupante, por salida, por temporada o por fecha distintos de la tarifa base única del tipo de habitación (DEC-114).
- Descuentos, cupones, impuestos o comisiones hoteleras.
- Integración con APIs externas de hoteles, ERP, portales de hoteleros o proveedores de reservas.
- Políticas de cancelación o devolución propias del hotel; rigen las de 001/002.
- Reseñas, valoraciones, mapas, buscador o filtros del catálogo hotelero (DEC-115).
- Fotos de tours, paquetes o movilidad; esta spec solo cubre fotos del hotel y de sus tipos de habitación.
- Catálogo fijo, categorías o iconos de servicios; se usan textos libres (DEC-118).
- Pagos, vencimiento, notificaciones y auditoría detallada de otros módulos.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-58 numerados y trazados a RF/HU/RN o DEC.
- Conservar literalmente RF-1–RF-4 de `acuerdos.md`.
- No convertir propuestas técnicas en criterios funcionales.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar catálogo público, tarjetas, detalle, orden, visibilidad sin disponibilidad y estados vacíos.
- Verificar alta desactivada, activación completa, servicios como lista libre, unicidad, permisos y auditoría.
- Verificar tipos de habitación, capacidad, tarifa, inventario por fecha y protección de compromisos.
- Verificar propuestas por salida, períodos de 24 h, una habitación, concurrencia y ausencia de sobreventa.
- Verificar imágenes del hotel y de tipos de habitación, formatos, tamaño, cantidad libre, opcionalidad del tipo y conservación ante fallo.
- Verificar conservación de reservas históricas ante cambios y desactivaciones.

## Dudas abiertas

Las preguntas funcionales propias de Hoteles tratadas en la entrevista quedaron resueltas por DEC-108–DEC-112 y DEC-114–DEC-118. DEC-113 adopta por delegación las validaciones habituales de 006/013 (orden alfabético, unicidad de nombres activos, permisos y auditoría), sin reabrir esas preguntas.

- **PENDIENTE TÉCNICO (plan):** interpretación exacta de 5 MB en bytes y validación de contenido real de las imágenes.
- **PENDIENTE TÉCNICO (plan):** volumen, carga y consultas para verificar AC01.
- **PENDIENTE TÉCNICO (plan):** conservación/eliminación de objetos R2 sin referencia y política de acceso público/firmado (ACL-13/ACL-17).

## Aprobación de esta especificación

- **Versión aprobada:** 0.2.
- **Aprobación explícita del documento completo:** **APROBADA** el 2026-10-31 con la respuesta «si» a la solicitud de aprobar la spec 007 v0.2 y sus 58 criterios.
- **Fecha de aprobación:** 2026-10-31.
- **Reglas previas:** se reutilizan las DEC citadas y RF/HU/RN; ni esas decisiones ni aprobar 001/006/013 aprueban este documento por inferencia.
- **Decisiones parciales:** DEC-108–DEC-112 y DEC-114–DEC-118 registran las respuestas de la entrevista; DEC-113 adopta por delegación las validaciones habituales, no como nuevas respuestas literales. La aprobación completa se registra en DEC-119.
- **Plan/tareas:** [plan](plan.md) y [tasks](tasks.md) creados como documentos de diseño/backlog no ejecutados. No se autoriza código ni cambios fuera de `sdd/`.
