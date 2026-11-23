# Spec 006 — Catálogo turístico: Tours y Paquetes

> **Estado:** **APROBADA** explícitamente por el usuario el 2026-10-30; aclaraciones funcionales propias cerradas.  
> **Versión aprobada:** 0.46. Este registro de aprobación no modifica los criterios funcionales de la versión presentada.  
> **Requisitos de origen:** RF01, RF02 y RF13; aplicación de RF23/RF24 y reglas compartidas con RF05/RF06. Se conservan sus identificadores.  
> **Fuentes:** F02 §§1 y 5, F03 §§1/3/5/6, F04 y F12 §2.3; [inventario](../../fuentes.md). DEC-004, DEC-005, DEC-025, DEC-031, DEC-032, DEC-044 y DEC-053–DEC-107 en [decisiones](../../decisiones.md). Fotos sin cantidad máxima comercial fija, con JPG/PNG/WebP de hasta 5 MB por archivo. Otros pendientes en ACL-29/ACL-30.  
> **Antecedente:** [acuerdos de presentación](acuerdos.md). Sus seis criterios se conservan como 006/RF-1–RF-6.  
> **Dependencias:** 001 Reservas aprobada v0.13; 005 Identidad, 007 Hoteles, 010 Auditoría y 012 Multimedia aún pendientes de especificación completa/aprobación. Esta spec aprobada no altera sus contratos ni habilita su implementación.

### Resumen para revisión

- Catálogo público completo por sección, sin login; Tours y Paquetes en orden alfabético, conservando las condiciones de publicación/disponibilidad.
- Tarjeta y detalle con descripción compartida; detalle con itinerario por días y galería. Descripción/itinerario sin máximo fijo de caracteres.
- El administrador sube a cada tour o paquete todas las fotos que necesite, sin cantidad máxima comercial; cada archivo sigue limitado a 5 MB y a JPG/PNG/WebP.
- Admin decide duración entera en horas o días, con una sola unidad por oferta y sin mínimo/máximo comercial fijo.
- Descuentos opcionales con precio final ingresado por admin, porcentaje informativo y sin acumulación de tarjeta/salida al reservar.
- Filtros de precio de tarjeta, duración mínima/máxima con 1 día = 24 horas, fechas inclusivas con salida disponible y destino en nombre o descripción; al combinarlos se deben cumplir todos.
- Rango invertido: «El rango no es válido», sin corregir extremos automáticamente. Consulta válida sin coincidencias: «No se encontraron resultados» y «Limpiar filtros».
- Cambios administrativos auditados; protección de fecha/hora e itinerario con reservas pendientes/confirmadas y de importes históricos. Fechas hoteleras se ajustan manualmente tras reprogramar, ocultando opciones pendientes.

Este resumen no sustituye los criterios ni constituye aprobación. La cantidad de fotos quedó resuelta sin máximo comercial (DEC-107); otros límites de campos y parámetros de consulta/calidad aún no definidos permanecen visibles al final y no se han rellenado por suposición.

## Contexto y objetivo

El visitante necesita conocer qué ofrece cada tour o paquete antes de reservar. El administrador necesita mantener esa oferta, sus precios, itinerarios, salidas y cupos. El catálogo presenta un resumen en las tarjetas de la landing y, al abrir una oferta, información e itinerario completos. Su disponibilidad alimenta la reserva sin permitir sobreventa ni alterar condiciones históricas de reservas ya creadas. Esta spec reúne el comportamiento documentado y los acuerdos previos; las reglas aún no definidas de publicación, edición y presentación permanecen visibles.

## Usuarios / actores

- **Visitante o cliente:** consulta catálogo, detalle e información para disponibilidad sin necesidad de autenticarse. Reservar requiere identidad según 001, pero consultar el catálogo no.
- **Administrador (`admin`):** crea, modifica, activa y desactiva ofertas; configura paquetes, salidas, precios y cupos según las reglas acordadas. Gestiona descuentos para tours y paquetes conforme a ACL-31. Las escrituras administrativas requieren su rol.
- **Sistema:** conserva los precios históricos de reservas y aplica las restricciones de disponibilidad y publicación en todos los flujos que las usan.

No se añaden roles de vendedor, guía o proveedor, portales externos ni un constructor de paquetes para el cliente.

## Historias de usuario

Texto e identificadores de F02, conservando prioridad original:

- **HU-01 — P1:** Como visitante, quiero consultar las ofertas activas para conocer los servicios y paquetes disponibles sin registrarme.
- **HU-02 — P1:** Como visitante, quiero consultar el detalle de una oferta para decidir si se ajusta a mi viaje.
- **HU-14 — P2:** Como administrador, quiero crear y editar ofertas para mantener actualizado el catálogo.
- **HU-15 — P2:** Como administrador, quiero retirar una oferta para impedir nuevas reservas.

HU-06/HU-07/HU-22 explican la relación con Reservas; no se duplican aquí sus contratos de creación/pago. DEC-005 define el paquete como oferta preconfigurada por admin con precio, duración, salida y cupos propios, seleccionada como una sola oferta.

## Requisitos funcionales (criterios de aceptación en EARS)

Son criterios locales `006/RF-n`, no una renumeración de RF01–RF24. Los seis primeros conservan el texto de `acuerdos.md`. Ningún criterio con duda explícita se considera completamente acordado por aparecer en el documento.

### Tarjetas y detalle

- **RF-1:** CUANDO el visitante consulta una tarjeta de tour en la landing, EL SISTEMA mostrará un resumen de esa oferta. (RF01, HU-01; DEC-044)
- **RF-2:** CUANDO el visitante consulta una tarjeta de paquete en la landing, EL SISTEMA mostrará un resumen de esa oferta. (RF01, HU-01; DEC-044)
- **RF-3:** CUANDO el visitante selecciona un tour activo para consultar su detalle, EL SISTEMA mostrará la información completa documentada de ese tour. (RF02, HU-02; DEC-044)
- **RF-4:** CUANDO el visitante selecciona un paquete activo para consultar su detalle, EL SISTEMA mostrará la información completa documentada de ese paquete. (RF02, HU-02; DEC-044)
- **RF-5:** CUANDO el visitante consulta el detalle de un tour activo, EL SISTEMA mostrará su itinerario completo. (RF02, HU-02; DEC-044)
- **RF-6:** CUANDO el visitante consulta el detalle de un paquete activo, EL SISTEMA mostrará su itinerario completo. (RF02, HU-02; DEC-044)
- **RF-7:** CUANDO un visitante consulta el catálogo o detalle público, EL SISTEMA permitirá esa consulta sin autenticación. (RF01/RF02; HU-01/HU-02; F01 §1)
- **RF-8:** CUANDO se consulta el catálogo público, EL SISTEMA excluirá las ofertas inactivas o eliminadas lógicamente. (HU-01/HU-15; RN-01)
- **RF-9:** CUANDO se consulta el listado público de ofertas mediante la consulta paginada definida en HU-01, EL SISTEMA devolverá resultados paginados. (HU-01; no limita el catálogo completo visible de las secciones de inicio, DEC-071; parámetros de consulta pendientes ACL-30)
- **RF-10:** CUANDO el visitante filtra el catálogo por un tipo admitido, EL SISTEMA devolverá únicamente ofertas de ese tipo. (HU-01; vocabulario exhaustivo y tipo inválido pendientes ACL-05/ACL-30)
- **RF-11:** CUANDO se consulta el detalle de una oferta activa visible, EL SISTEMA incluirá descripción, precio base, duración, itinerario, imágenes y datos necesarios para consultar disponibilidad. (RF02; HU-02)
- **RF-12:** SI la oferta solicitada no existe o no es públicamente visible, ENTONCES EL SISTEMA responderá como recurso no encontrado (`404`). (HU-02; código ya definido en la fuente, no decisión técnica nueva)

DEC-054 define los campos del resumen: imagen principal, título, descripción, duración y precio base. DEC-075 precisa que la descripción es la misma que se muestra al realizar la reserva, sin un texto breve administrado por separado. DEC-055 define para **tours y paquetes** un itinerario por días, con actividades en orden y descripción de cada actividad. No se añaden horarios de paradas, mapas o descargas por inferencia. El detalle conserva los campos originales; Movilidad sin página individual es otra funcionalidad.

DEC-071 establece secciones separadas en el inicio: **Tours** y **Paquetes turísticos**, cada una con todo su catálogo públicamente visible, sin paginación visible ni un máximo de cinco ofertas. DEC-096 añade filtros opcionales: sin filtros, o al limpiarlos, se mantiene todo el catálogo publicable; con filtros se muestran las coincidencias del tipo correspondiente. La paginación de consulta de HU-01 se conserva como requisito de origen; no autoriza a limitar el resultado visible a la primera página. El mecanismo pertenece al plan posterior. La organización y los filtros no reactivan ofertas ocultas según DEC-069/DEC-070.

DEC-072 ratifica que el visitante puede explorar todo ese catálogo **sin iniciar sesión** y extiende la misma presentación completa por sección a **Hoteles** y **Vehículos/Movilidad**. Hoteles se registra en [acuerdos de 007](../007-hoteles/acuerdos.md); Vehículos mantiene las categorías informativas de 013 aprobada. Esta consulta pública no cambia la autenticación exigida para reservar ni los permisos de administración. «Todos los servicios» se refiere al catálogo publicado, no a un límite ilimitado de fotografías.

### Administración de ofertas

- **RF-13:** CUANDO un administrador crea un tour o paquete con datos admitidos, EL SISTEMA guardará la oferta en estado desactivado. (RF13; HU-14; DEC-053)
- **RF-14:** CUANDO un administrador modifica una oferta con datos admitidos, EL SISTEMA guardará los cambios autorizados de esa oferta. (RF13; HU-14; completitud de ofertas publicadas según DEC-074; demás límites pendientes ACL-29)
- **RF-15:** CUANDO un administrador activa un tour o paquete con título, descripción, precio, duración, itinerario, al menos una imagen y condiciones completos y válidos, EL SISTEMA lo habilitará para consulta pública. (RF13; DEC-053; límites concretos de validación pendientes ACL-29)
- **RF-16:** CUANDO un administrador desactiva una oferta, EL SISTEMA la excluirá del catálogo público. (RF13; HU-15; DEC-032)
- **RF-17:** SI un usuario sin rol `admin` intenta crear, modificar, activar o desactivar ofertas o gestionar sus salidas, precios, descuentos y cupos, ENTONCES EL SISTEMA rechazará esa modificación. (RN-26/RS03; RF13; DEC-005/DEC-025/DEC-058)
- **RF-18:** CUANDO un administrador crea o modifica una oferta, EL SISTEMA validará tipo, título, precio base, duración, condiciones y los datos requeridos para esa operación. (HU-14; límites/valores permitidos pendientes ACL-29, no inventados)
- **RF-19:** CUANDO se aplica un cambio del administrador en tours, paquetes, salidas, precios o descuentos, EL SISTEMA registrará actor, acción, entidad, identificador, fecha y cambios relevantes en auditoría. (RF23; HU-14; RN-28; alcance concretado por DEC-078)
- **RF-20:** CUANDO se elimina una oferta que necesita conservar relaciones históricas, EL SISTEMA aplicará borrado lógico. (RN-30; HU-15; no define una operación pública de borrado físico)
- **RF-21:** CUANDO cambia el precio de una oferta, EL SISTEMA conservará los importes de las reservas que ya se habían creado. (RN-02; F03 §6; 001/RF-23)
- **RF-22:** CUANDO se desactiva un tour o paquete, EL SISTEMA conservará las reservas ya creadas con sus condiciones, cupos y plazos normales. (DEC-032; 001/RF-93; incluye pending sin prórroga)

DEC-053 establece alta desactivada y activación administrativa con contenido completo, incluso si los datos ya estaban completos al crear la oferta. El itinerario sigue DEC-055. DEC-083 define formatos JPG/PNG/WebP y máximo 5 MB por imagen; DEC-107 elimina la cantidad máxima comercial de fotos. Otros límites de campos siguen pendientes.

DEC-078 considera críticos todos los cambios administrativos aplicados a esos ámbitos: creación, edición, activación, desactivación y baja lógica donde corresponda, así como cambios de cupos, contenido, imágenes, precios y configuración/retiro de descuentos. La auditoría permite conocer quién hizo el cambio, qué cambió y cuándo, conservando los datos exigidos por RN-28 y su inmutabilidad RN-29. Un intento rechazado no se registra como un cambio aplicado; no se incorpora auditoría de visitas públicas ni un nuevo historial editable. El contrato compartido de 010 sigue pendiente de su propia especificación.

### Paquetes, salidas y cupos compartidos con Reservas

- **RF-23:** CUANDO el administrador configura un paquete, EL SISTEMA lo tratará como una oferta predefinida con precio, duración, salida y cupos propios. (DEC-005; RF13; cliente no compone un carrito de servicios)
- **RF-24:** CUANDO el administrador configura una salida de tour o paquete, EL SISTEMA la asociará a la oferta turística correspondiente. (DEC-005; RN-05; validaciones de creación pendientes ACL-29; protección temporal según DEC-068)
- **RF-25:** SI una reducción administrativa deja los cupos de una salida por debajo de sus reservas y bloqueos pendientes vigentes, ENTONCES EL SISTEMA rechazará esa reducción. (DEC-025; RN-07; 001/RF-82)
- **RF-26:** CUANDO se desactiva una salida, EL SISTEMA impedirá crear nuevas reservas para esa salida. (DEC-032; RN-05; 001/RF-92)
- **RF-27:** CUANDO se desactiva una salida, EL SISTEMA conservará las reservas ya creadas para ella con sus condiciones y plazos originales. (DEC-032; 001/RF-93; no equivale a cancelación operativa del servicio)
- **RF-28:** CUANDO se crea una nueva reserva de un tour o paquete, EL SISTEMA utilizará como precio turístico de la salida elegida su precio final rebajado vigente si tiene descuento o su precio normal vigente si no lo tiene. (RF06; RN-03; HU-07; DEC-056/DEC-066; datos oficiales del catálogo, frontera con 001)
- **RF-29:** CUANDO el cliente consulta opciones de alojamiento para una salida, EL SISTEMA mostrará únicamente propuestas hoteleras seleccionables asociadas a esa salida concreta. (DEC-031; 001/RF-90; gestión hotelera en 007)
- **RF-30:** CUANDO se muestran precios oficiales del catálogo, EL SISTEMA los expresará en soles peruanos (`PEN`) con dos decimales. (DEC-004; fuente de precio para 001)
- **RF-31:** SI solicitudes concurrentes compiten por el último cupo de una salida, ENTONCES EL SISTEMA permitirá que solo una obtenga ese cupo. (RN-07; HU-06/F02 §9; invariante compartida con 001)
- **RF-32:** MIENTRAS una reserva pendiente mantiene cupos bloqueados, EL SISTEMA los considerará comprometidos al determinar la disponibilidad de esa salida. (RN-08; DEC-025; 001/RF-7)

### Protección de publicación

- **RF-33:** SI un administrador intenta activar un tour o paquete sin título, descripción, precio, duración, itinerario, al menos una imagen o condiciones completos, ENTONCES EL SISTEMA rechazará la activación. (DEC-053; RF13)

### Contenido del resumen

- **RF-34:** CUANDO el visitante consulta una tarjeta de tour o paquete, EL SISTEMA mostrará imagen principal, título, descripción de la oferta, duración y precio base. (RF01; HU-01; DEC-044/DEC-054/DEC-075)

La descripción de la tarjeta procede del mismo contenido de la oferta que se presenta al reservar (DEC-075). No se solicita al admin una segunda descripción breve ni se genera un resumen alternativo. DEC-094 establece descripción y texto del itinerario sin límite fijo de caracteres; la cantidad de imágenes del detalle queda sin máximo comercial por DEC-107.

### Organización del itinerario

- **RF-35:** CUANDO el visitante consulta el itinerario de un tour o paquete, EL SISTEMA mostrará las actividades agrupadas por día, en su orden definido y con una descripción de cada actividad. (RF02; HU-02; DEC-044/DEC-055)

La estructura corresponde al itinerario que mantiene el administrador para cada oferta. Se aplica expresamente tanto a tours como a paquetes predefinidos; no añade composición de paquetes por el cliente ni horarios obligatorios por actividad.

DEC-088 añade la petición de actualizar el itinerario; DEC-089 precisa que ese cambio corresponde al tour/paquete completo y alcanza sus demás salidas. Cada oferta mantiene un itinerario compartido, no variantes independientes por salida. La estructura por días de DEC-055 sigue vigente. DEC-090 impide cambiarlo si cualquiera de esas salidas tiene al menos una reserva pendiente o confirmada; se conserva el itinerario anterior para respetar lo reservado.

### Precio por salida

- **RF-36:** CUANDO un administrador configura el precio de una salida de tour o paquete, EL SISTEMA permitirá guardar un precio propio para esa salida, independiente del de las demás salidas de la oferta. (RF13; HU-14; DEC-056)

Los precios mantienen PEN y dos decimales (DEC-004). Cambiar una tarifa no recalcula reservas ya creadas (RF-21). DEC-057 establece un precio base público independiente del de las salidas. DEC-077 impide reservar sin precio normal propio de salida; no se toma el precio de tarjeta como sustituto. DEC-079 exige que los precios normales definidos para tours, paquetes y salidas sean mayores que cero. Precio ausente y precio cero son casos distintos: el primero no habilita reservar y el segundo no se admite como precio válido.

### Precio base público y descuentos

- **RF-37:** CUANDO el visitante consulta el precio base de un tour o paquete en tarjeta o detalle, EL SISTEMA mostrará el precio base independiente definido por el administrador para esa oferta. (RF01/RF02/RF13; DEC-054/DEC-057)
- **RF-38:** EL SISTEMA permitirá al administrador configurar descuentos para tours y paquetes. (DEC-058; ampliación explícita del usuario, sin nuevo RF/HU oficial inventado; reglas concretadas en ACL-31)
- **RF-39:** CUANDO una tarjeta de tour o paquete con descuento se muestra en la landing inicial, EL SISTEMA mostrará tachado su precio normal. (DEC-059)
- **RF-40:** CUANDO una tarjeta de tour o paquete con descuento se muestra en la landing inicial, EL SISTEMA mostrará después del precio normal tachado el precio rebajado en soles con dos decimales. (DEC-004/DEC-059)
- **RF-41:** EL SISTEMA permitirá al administrador mantener un tour o paquete sin descuento. (DEC-060)
- **RF-42:** CUANDO una tarjeta de tour o paquete sin descuento se muestra en la landing inicial, EL SISTEMA mostrará únicamente su precio normal sin tachado. (DEC-060; DEC-004/DEC-057)
- **RF-43:** CUANDO el administrador configura un descuento para un tour o paquete, EL SISTEMA permitirá ingresar directamente el precio final rebajado en soles. (DEC-061; DEC-004)
- **RF-44:** CUANDO un tour o paquete tiene descuento con precio normal positivo, EL SISTEMA calculará automáticamente el porcentaje equivalente como `(precio normal − precio final rebajado) / precio normal × 100`. (DEC-062; presentación según DEC-064)
- **RF-45:** CUANDO una tarjeta de tour o paquete con descuento se muestra en la landing inicial, EL SISTEMA mostrará el porcentaje equivalente calculado junto al precio normal tachado y el precio final rebajado. (DEC-059/DEC-062)
- **RF-46:** SI una configuración de descuento de tour o paquete, incluida una salida concreta, tiene un precio final rebajado menor o igual a cero o mayor o igual a su precio normal correspondiente, ENTONCES EL SISTEMA rechazará guardar esa configuración. (DEC-063/DEC-065)
- **RF-47:** CUANDO el porcentaje equivalente de un descuento mostrado en landing, detalle o selección de salida es mayor o igual al 1 %, EL SISTEMA mostrará ese porcentaje sin decimales, redondeado hacia abajo al entero. (DEC-064/DEC-085)
- **RF-48:** CUANDO el porcentaje equivalente de un descuento mostrado en landing, detalle o selección de salida es mayor que cero y menor al 1 %, EL SISTEMA mostrará «Menos del 1 %» como indicación del porcentaje. (DEC-064/DEC-085)
- **RF-49:** CUANDO el administrador configura un descuento para una salida de tour o paquete, EL SISTEMA permitirá guardar un precio final rebajado propio para esa salida, independiente del de las demás salidas. (DEC-061/DEC-065)
- **RF-50:** CUANDO se determina el precio turístico para reservar una salida, EL SISTEMA excluirá cualquier rebaja adicional derivada de la promoción de la tarjeta de inicio. (DEC-066)
- **RF-51:** MIENTRAS el administrador no cambie ni retire un descuento de tour, paquete o salida, EL SISTEMA mantendrá vigente ese descuento sin vencimiento automático. (DEC-067)

### Protección de fecha y hora de salidas

- **RF-52:** SI se intenta cambiar la fecha o la hora de una salida de tour o paquete con al menos una reserva pendiente o confirmada, ENTONCES EL SISTEMA rechazará ese cambio. (DEC-068; RF13; protección compartida con 001)

La salida conserva su fecha y hora al rechazarse el cambio; no se trasladan ni cancelan reservas para eludir esta restricción. La decisión no equivale a prohibir cambios de precio o desactivaciones, cuyas reglas siguen vigentes. No establece por sí sola todas las validaciones de una reprogramación sin reservas pendientes ni confirmadas.

### Visibilidad según salidas disponibles

- **RF-53:** CUANDO se consulta el listado público de tours o paquetes, EL SISTEMA excluirá las ofertas que no tengan ninguna salida disponible para reservar. (DEC-069; RF01; RN-05/RN-06)
- **RF-54:** CUANDO una oferta activa y no eliminada vuelve a tener una salida disponible para reservar, EL SISTEMA la incluirá nuevamente entre las ofertas elegibles del listado público. (DEC-069; RF01; filtros y paginación conservados)
- **RF-55:** CUANDO un visitante abre el enlace directo de un tour o paquete oculto por falta de salidas disponibles, EL SISTEMA mostrará «Oferta no disponible». (DEC-070)
- **RF-56:** MIENTRAS un tour o paquete no tiene salidas disponibles, EL SISTEMA omitirá su información de detalle en el acceso público directo. (DEC-070; RF02/HU-02; RF-12)

### Catálogo completo por sección

- **RF-57:** CUANDO el visitante consulta la sección Tours de la página de inicio, EL SISTEMA mostrará todas las ofertas de tipo tour públicamente visibles en esa sección. (DEC-071; RF01/HU-01)
- **RF-58:** CUANDO el visitante consulta la sección Paquetes turísticos de la página de inicio, EL SISTEMA mostrará todas las ofertas de tipo paquete públicamente visibles en esa sección. (DEC-071; RF01/HU-01)
- **RF-59:** CUANDO el visitante consulta las ofertas de una sección de Tours o Paquetes turísticos, EL SISTEMA las presentará en orden alfabético ascendente por nombre dentro de esa sección. (DEC-073; RF01/HU-01)

El orden es independiente por sección; el administrador no elige posiciones prioritarias para estas ofertas. La elección no establece el orden de Hoteles. Movilidad conserva el orden alfabético ya aprobado en 013.

### Integridad de ofertas publicadas

- **RF-60:** SI una edición de un tour o paquete publicado lo deja sin alguno de los datos obligatorios de publicación, ENTONCES EL SISTEMA rechazará guardar esa edición. (DEC-074; DEC-053; RF13/HU-14)

Los datos obligatorios son los ya acordados: título, descripción, precio, duración, itinerario, al menos una imagen y condiciones. Incluye quitar la última imagen de una oferta publicada. El rechazo conserva la información persistida anterior; no se desactiva automáticamente la oferta para aceptar una edición incompleta. Los borradores inactivos mantienen su tratamiento propio.

### Descripción compartida

- **RF-61:** CUANDO el visitante consulta la descripción de un tour o paquete en su tarjeta, EL SISTEMA mostrará la misma descripción de la oferta que se presenta al realizar la reserva. (DEC-075; RF01/RF02; HU-01/HU-02)

La descripción completa de la oferta se mantiene como contenido único, compartido por catálogo, detalle y presentación al reservar. Este acuerdo no exige agregar una nueva edición de texto a Reservas ni versionado histórico de descripciones; las condiciones históricas ya acordadas en 001 se conservan.

### Secciones sin ofertas visibles

- **RF-62:** MIENTRAS la sección Tours o Paquetes turísticos no tenga ninguna oferta públicamente visible de su tipo, EL SISTEMA ocultará esa sección de la página de inicio. (DEC-076)
- **RF-63:** MIENTRAS la sección Tours o Paquetes turísticos no tenga ninguna oferta públicamente visible de su tipo, EL SISTEMA ocultará su enlace correspondiente del menú público. (DEC-076)

La condición se evalúa por separado para Tours y Paquetes. Cuando vuelva a existir una oferta visible del tipo correspondiente, se mostrarán nuevamente esa sección y su enlace, con el catálogo completo y orden acordados. Se considera el conjunto de ofertas publicables, no una página parcial de consulta ni un resultado de filtro vacío. Hoteles mantiene su pendiente propio; Movilidad conserva la regla ya aprobada en 013.

### Precio requerido para reservar una salida

- **RF-64:** SI se intenta reservar una salida de tour o paquete sin precio normal propio definido por el administrador, ENTONCES EL SISTEMA rechazará la creación de la reserva para esa salida. (DEC-077; RF06; RN-03; HU-07)
- **RF-65:** SI se intenta guardar un precio normal de tour, paquete o salida menor o igual a cero, ENTONCES EL SISTEMA rechazará ese precio. (DEC-079; RF13/HU-14)

La salida sin precio no cuenta como disponible para reservar, aunque tenga cupos; al asignarle precio siguen aplicando las demás condiciones de disponibilidad. No se exige un descuento para reservar: con precio normal propio y sin descuento rige RF-28. La regla no impide por sí sola conservar una salida incompleta para gestión administrativa ni modifica reservas ya creadas.

### Galería de fotos en el detalle

- **RF-66:** CUANDO el visitante abre el detalle de un tour o paquete públicamente visible, EL SISTEMA mostrará una galería con las fotografías asociadas a esa oferta. (DEC-080; RF02/RF24; HU-02)

La galería permite varias fotos en el detalle, además de la imagen principal presentada en la tarjeta. No exige cargar varias para publicar: se mantiene el mínimo de una imagen ya acordado. DEC-083 admite JPG, PNG y WebP de hasta 5 MB por archivo, tanto para la principal como para las fotos de galería. DEC-084 define el mensaje de fallo y conservación de imágenes anteriores. DEC-107 elimina la cantidad máxima comercial: el administrador puede asociar todas las fotos que necesite (RF-103). No se deducen controles de carrusel, zoom, carga masiva o un orden manual por esta decisión; Movilidad conserva su spec aprobada.

### Duración de la oferta

- **RF-67:** CUANDO el administrador configura la duración de un tour o paquete, EL SISTEMA permitirá seleccionar exactamente una unidad para esa oferta: horas o días. (DEC-081/DEC-093; RF13/HU-14)
- **RF-68:** CUANDO se presenta la duración de un tour o paquete en tarjeta o detalle, EL SISTEMA mostrará su valor acompañado de la unidad configurada por el administrador. (DEC-081; RF01/RF02; HU-01/HU-02)
- **RF-69:** SI se intenta guardar una duración de tour o paquete con parte fraccionaria en la unidad elegida, ENTONCES EL SISTEMA rechazará ese valor. (DEC-082; RF13/HU-14)

### Formatos y tamaño de imágenes

- **RF-70:** SI se intenta cargar una imagen de tour o paquete en un formato distinto de JPG, PNG o WebP, ENTONCES EL SISTEMA rechazará ese archivo. (DEC-083; RF24; RS10)
- **RF-71:** SI se intenta cargar una imagen de tour o paquete cuyo tamaño supera 5 MB, ENTONCES EL SISTEMA rechazará ese archivo. (DEC-083; RF24; RS10)
- **RF-72:** SI falla la carga o el reemplazo de una foto de tour o paquete, ENTONCES EL SISTEMA mostrará «No se pudo cargar la imagen». (DEC-084; RF24)
- **RF-73:** SI falla la carga o el reemplazo de una foto de tour o paquete, ENTONCES EL SISTEMA conservará las imágenes anteriores de esa oferta. (DEC-084; RF24)

### Descuento en detalle y selección de salida

- **RF-74:** CUANDO se presenta un descuento en el detalle de un tour o paquete o al elegir una salida, EL SISTEMA mostrará tachado el precio normal correspondiente. (DEC-085)
- **RF-75:** CUANDO se presenta un descuento en el detalle de un tour o paquete o al elegir una salida, EL SISTEMA mostrará el precio final rebajado correspondiente en soles con dos decimales. (DEC-085; DEC-004)
- **RF-76:** CUANDO se presenta un descuento en el detalle de un tour o paquete o al elegir una salida, EL SISTEMA mostrará el porcentaje equivalente calculado entre los precios correspondientes. (DEC-085; DEC-062/DEC-064)

En el detalle general se presentan los precios de la oferta; al elegir una salida se presentan sus propios precios y descuento, si lo tiene. El porcentaje compara el normal y rebajado del mismo ámbito, no precios de la oferta con los de otra salida. Se conserva el formato de RF-47/RF-48. Sin descuento se presenta el precio normal correspondiente; no se hereda ni acumula una rebaja de tarjeta según DEC-066. La presentación no cambia el importe con el que se continúa la reserva.

### Fechas del alojamiento al reprogramar una salida

- **RF-77:** CUANDO el administrador reprograma una salida sin reservas, EL SISTEMA conservará las fechas actuales de las propuestas de alojamiento asociadas hasta que el administrador las ajuste explícitamente. (DEC-086; RF13/RF20; gestión hotelera en 007)
- **RF-78:** MIENTRAS una propuesta de alojamiento asociada a una salida reprogramada conserve sus fechas pendientes de ajuste por el administrador, EL SISTEMA la ocultará de las opciones seleccionables para esa salida. (DEC-087; RF18; DEC-031)
- **RF-79:** CUANDO el cliente solicita reservar solo el tour o paquete de una salida que cumple las condiciones de reserva y tiene alojamiento pendiente de ajuste tras reprogramación, EL SISTEMA permitirá la reserva sin alojamiento. (DEC-087; RF05; HU-06; frontera con 001)

### Fecha y hora al crear o reprogramar salidas

- **RF-80:** SI al guardar la creación o reprogramación de una salida su fecha y hora no son posteriores al momento actual, ENTONCES EL SISTEMA rechazará esa creación o reprogramación. (DEC-088; RF13/HU-14)
- **RF-81:** EL SISTEMA utilizará la hora de Perú como referencia de las fechas y horas de salida configuradas y presentadas al usuario. (DEC-088)

### Itinerario compartido entre salidas

- **RF-82:** CUANDO el administrador guarda un cambio permitido de itinerario de un tour o paquete, EL SISTEMA aplicará el itinerario actualizado a todas las salidas de esa misma oferta. (DEC-089/DEC-090; RF13/HU-14; DEC-055)
- **RF-83:** SI se intenta modificar el itinerario de un tour o paquete y cualquiera de sus salidas tiene una reserva pendiente o confirmada, ENTONCES EL SISTEMA rechazará ese cambio de itinerario. (DEC-090; RF13/HU-14)

### Nombres únicos entre ofertas publicadas del mismo tipo

- **RF-84:** SI activar o editar una oferta produce dos tours publicados o dos paquetes publicados cuyos nombres coinciden sin distinguir mayúsculas/minúsculas e ignorando espacios al inicio y al final, ENTONCES EL SISTEMA rechazará esa activación o edición. (DEC-091/DEC-092; RF13/HU-14)

La unicidad se evalúa por tipo de oferta, usando su nombre/título público. Un tour y un paquete no compiten entre sí por esta regla; no se exige unicidad entre borradores inactivos ni se fusionan ofertas por nombre. La edición de un nombre publicado conserva la misma restricción que la activación. DEC-092 confirma que «Tour Cusco», «tour cusco» y ese nombre con espacios al inicio/final se consideran iguales. La regla define comparación para unicidad, no una conversión obligatoria del nombre mostrado a minúsculas ni eliminación de acentos o espacios interiores.

### Duración sin máximo fijo

- **RF-85:** EL SISTEMA permitirá configurar la duración de tours y paquetes sin imponer un máximo fijo como regla de negocio. (DEC-093; RF13/HU-14)

El admin indica el valor entero y selecciona una sola unidad, horas o días, según la oferta; no se exige introducir ambas a la vez ni una duración compuesta de días y horas. DEC-095 confirma que decide la duración de cada oferta sin un mínimo fijo impuesto por el sistema; DEC-093 conserva ausencia de máximo fijo. Esto no modifica las demás validaciones acordadas ni promete capacidad numérica infinita. Los límites de representación técnica se documentarán en el plan sin presentarlos como límites comerciales aprobados.

### Textos y duración configurables

- **RF-86:** EL SISTEMA permitirá al administrador mantener la descripción de un tour o paquete sin imponer un máximo fijo de caracteres como regla de negocio. (DEC-094; RF13/HU-14)
- **RF-87:** EL SISTEMA permitirá al administrador mantener el texto del itinerario de un tour o paquete sin imponer un máximo fijo de caracteres como regla de negocio. (DEC-094; RF13/HU-14)
- **RF-88:** EL SISTEMA permitirá al administrador decidir la duración de cada tour o paquete sin imponer un mínimo fijo como regla de negocio. (DEC-095; RF13/HU-14)

Sin límite de caracteres no significa contenido opcional ni eliminación de la estructura del itinerario por días y actividades; se conservan completitud, permisos y protección de reservas existentes. No se aprueba almacenamiento infinito. La ausencia de máximo fijo se aplica a descripción e itinerario; las fotos tienen cantidad libre por DEC-107 pero conservan formato y 5 MB por archivo, mientras títulos y condiciones mantienen límites pendientes. La duración mantiene valor entero y una sola unidad según RF-67–RF-69, sin un nuevo ajuste global de mínimo/máximo distinto de la configuración de cada oferta.

### Filtros del catálogo de Tours y Paquetes

- **RF-89:** CUANDO el visitante explora una sección de Tours o Paquetes turísticos, EL SISTEMA ofrecerá filtros por precio, duración, fecha de salida y destino. (DEC-096; ampliación explícita de RF01/HU-01, sin nuevos IDs oficiales)
- **RF-90:** CUANDO el visitante filtra por un rango de precio, EL SISTEMA seleccionará las ofertas según su precio visible de tarjeta, rebajado si tienen descuento o normal si no lo tienen. (DEC-097; DEC-057/DEC-066)
- **RF-91:** SI ninguna oferta públicamente visible coincide con los filtros del visitante, ENTONCES EL SISTEMA mostrará «No se encontraron resultados». (DEC-098)
- **RF-92:** SI ninguna oferta públicamente visible coincide con los filtros del visitante, ENTONCES EL SISTEMA ofrecerá el botón «Limpiar filtros». (DEC-098)
- **RF-93:** CUANDO el visitante selecciona «Limpiar filtros», EL SISTEMA restablecerá la vista de todo el catálogo públicamente visible de la sección sin los filtros aplicados. (DEC-098; DEC-071/DEC-072)
- **RF-94:** CUANDO el visitante escribe un destino en su filtro, EL SISTEMA mostrará las ofertas públicamente visibles de la sección cuyo nombre o descripción contenga el texto buscado. (DEC-099/DEC-102; DEC-096)
- **RF-95:** CUANDO el visitante filtra por duración, EL SISTEMA permitirá indicar un valor mínimo y uno máximo con selección de horas o días. (DEC-100; DEC-081/DEC-082)
- **RF-96:** CUANDO el visitante filtra por fecha de salida, EL SISTEMA permitirá seleccionar un rango de fechas. (DEC-101)
- **RF-97:** CUANDO el filtro de duración compara ofertas configuradas en horas o días, EL SISTEMA usará la equivalencia de 1 día = 24 horas. (DEC-103; DEC-100)
- **RF-98:** CUANDO el visitante aplica un rango de fechas de salida válido, EL SISTEMA seleccionará las ofertas con al menos una salida disponible cuya fecha esté comprendida entre el día inicial y el final, incluidos ambos días. (DEC-104; DEC-101; RN-05/RN-06)
- **RF-99:** SI el extremo mínimo o inicial de un rango de precio, duración o fecha de salida es mayor que su extremo máximo o final, ENTONCES EL SISTEMA rechazará aplicar ese rango. (DEC-105)
- **RF-100:** SI se intenta aplicar un rango invertido de precio, duración o fecha de salida, ENTONCES EL SISTEMA mostrará «El rango no es válido». (DEC-105)
- **RF-101:** SI se introduce un rango invertido de precio, duración o fecha de salida, ENTONCES EL SISTEMA conservará los extremos introducidos sin intercambiarlos automáticamente. (DEC-105)
- **RF-102:** CUANDO el visitante combina filtros del catálogo, EL SISTEMA mostrará únicamente ofertas que cumplan todos los filtros aplicados. (DEC-106; criterio habitual adoptado por delegación del usuario)

Ejemplo de rango invertido: precio mínimo S/200 y máximo S/100, duración mínima 5 días y máxima 2, o fecha inicial posterior a la final. El usuario debe corregir la entrada; un error de rango no se comunica como búsqueda válida sin coincidencias. Los filtros no aplicados no restringen el resultado; sin filtros se mantiene todo el catálogo publicable. Dentro del filtro de destino sigue bastando coincidencia en nombre **o** descripción: combinar filtros no exige presencia del texto en ambos campos.

La combinación mantiene orden, publicación y disponibilidad. No sustituye la tarifa de la salida por la de la tarjeta ni retiene cupos. DEC-106 adopta esta conducta habitual bajo la instrucción «usa la logica»; no se presenta como una nueva respuesta explícita «si» a cada detalle ni permite inventar límites comerciales.

La comparación utiliza la fecha de salida en hora de Perú (RF-81). Por ejemplo, del 10 al 15 de noviembre incluye salidas disponibles del 10, 12 y 15; una oferta con salida disponible solo el 20 no coincide. Una salida sin cupos o no reservable dentro del rango no basta por tener otra disponible fuera del rango. La consulta sigue siendo informativa: no bloquea cupos ni cambia fechas de la oferta. Mostrar una coincidencia no evita validar de nuevo la salida al reservar.

Buscar entre 1 y 2 días también incluye ofertas de 24 a 48 horas, sujetas a publicación y disponibilidad. La equivalencia solo compara duraciones en la búsqueda: no cambia el valor/unidad guardado de la oferta, el itinerario ni los períodos, tarifas o inventario del alojamiento.

El precio del filtro es el de la tarjeta, no el mínimo ni el precio propio de una salida; la reserva mantiene su precio efectivo según DEC-066. Duración admite mínimo/máximo con unidad, mientras que fecha de salida se selecciona por rango, no mediante una modalidad adicional de día único. No se introduce reserva por intervalo: el cliente sigue eligiendo una salida concreta.

Destino es búsqueda sobre el nombre y la descripción existentes, sin lista adicional que el admin deba crear o asignar. Basta que el texto aparezca en cualquiera de los dos campos; por ejemplo, «Cusco» encuentra ofertas que lo mencionan en el nombre o en la descripción (DEC-102). No requiere que el campo completo sea igual al destino ni añade extracción geográfica, mapas o proveedores externos. Se conservan publicación, acceso anónimo, sección por tipo y orden alfabético. Un filtro sin coincidencias no elimina una sección con catálogo publicable: ofrece mensaje y limpieza según DEC-076/DEC-098. No añade filtros a Movilidad ni a Hoteles sin su propio acuerdo.

Combinación de filtros e intervalos invertidos resueltos por DEC-105/DEC-106. Fuente/presencia del destino resueltas por DEC-102, equivalencia de duración por DEC-103 y fecha inclusiva con disponibilidad por DEC-104. Los detalles de comparación textual no fijados no se atribuyen al usuario; no introducir equivalencias geográficas, límites de fotos ni otras políticas comerciales bajo la delegación de validaciones habituales. Parámetros de consulta y calidad pendientes permanecen en sus ámbitos, sin reabrir estas reglas.

La restricción de futuro aplica al crear una salida o cambiar su fecha/hora, no transforma el paso del tiempo en un cambio de las salidas históricas. Se conserva RF-52: una fecha futura tampoco habilita reprogramar si hay reservas pendientes o confirmadas. El bloqueo de itinerario RF-83 abarca todas las salidas de la oferta, no solo la que esté consultando el admin. Una edición rechazada conserva el itinerario guardado y las reservas; no cancela ni mueve reservas para permitir el cambio. Sin esas reservas, la edición conserva las demás validaciones de contenido completo y auditoría. Cambiar itinerario no reprograma automáticamente fechas/horas ni traslada propuestas hoteleras.

Cambiar la fecha del tour/paquete no desplaza automáticamente las fechas hoteleras. El administrador realiza el ajuste manual en las propuestas asociadas; [007 acuerdos](../007-hoteles/acuerdos.md) recoge la misma frontera funcional. Hasta el ajuste, esas propuestas no se ofrecen al cliente para la salida afectada. Cada propuesta ajustada vuelve a ser elegible si cumple las demás condiciones de selección, estado activo y disponibilidad. La salida puede reservarse sin hotel mientras sus opciones de alojamiento permanecen ocultas, conservando validaciones de identidad, estado, precio y cupos de 001.

Se conserva el bloqueo de reprogramación con reservas pendientes o confirmadas (RF-52), los períodos/horarios hoteleros de 001 y las condiciones históricas. La ocultación afecta a las opciones de esa salida; no desactiva el hotel en su catálogo general ni cambia otras salidas, inventario o reservas. Las propuestas siguen accesibles al administrador para ajustar fechas.

El máximo es inclusivo por archivo: una imagen de exactamente 5 MB cumple el límite de tamaño, sujeta a las otras validaciones. Abarca cargas nuevas y reemplazos de imagen principal o galería. No limita el catálogo a cinco ofertas ni establece cinco fotos por oferta; DEC-107 elimina la cantidad máxima comercial, así que el número de fotos no se restringe por esta regla. RS10 conserva la validación de extensión, tipo y contenido según las fuentes transversales.

DEC-084 aplica tanto a imagen principal como a galería: una carga/reemplazo fallida no borra ni sustituye las imágenes que ya estaban guardadas. Si no había ninguna, el fallo no satisface el requisito de imagen de publicación (RF-15/RF-33). No se agregan imágenes ficticias ni reintentos automáticos por esta decisión. Tampoco se define una operación de carga masiva o se descartan otras ediciones por inferencia.

La elección se hace por oferta, sin imponer horas a todos los tours ni días a todos los paquetes. DEC-082 admite únicamente números enteros: por ejemplo, 2 horas o 3 días; 1,5 horas y 2,5 días se rechazan sin redondeo automático. DEC-093/DEC-095 confirman una sola unidad y ausencia de mínimo/máximo fijo de negocio; no volver a preguntar esos límites. El itinerario sigue por días según DEC-055 y el alojamiento conserva períodos completos de 24 horas de 001. No se calcula una estancia ni se reprograma una salida a partir de la duración por inferencia.

Cada sección contiene únicamente las ofertas de su tipo. La propuesta anterior de cinco imágenes por oferta no fue aceptada ni fija un límite de ofertas. DEC-080 confirma galería en detalle para Tours/Paquetes y DEC-107 elimina la cantidad máxima comercial de fotos. DEC-072 conserva catálogo completo sin login en las cuatro secciones; no fija cantidad de fotos.

La ocultación incluye las tarjetas de la landing. Cubre ausencia de fechas futuras reservables y agotamiento de todos los cupos; los bloqueos pendientes siguen contando como comprometidos según RF-32. Una salida agotada no oculta la oferta si existe otra reservable. Cuando se programa una salida válida o se recuperan cupos, la oferta activa vuelve a ser elegible en la siguiente consulta del listado; no se promete actualización instantánea de pestañas abiertas. No se desactiva administrativamente la oferta ni se alteran reservas existentes por ocultarla del listado.

DEC-070 resuelve el enlace directo: «Oferta no disponible», sin detalle ni posibilidad de reservar. La oferta sin salidas disponibles queda no visible también para el detalle público, conforme a RF-12/HU-02; el estado administrativo no cambia. Los criterios RF-3–RF-6 se aplican a ofertas públicamente visibles, no eluden esta condición. Al recuperar disponibilidad se recupera la visibilidad pública si la oferta sigue activa. El usuario prevé cupos suficientes para todos al inicio: es contexto operativo, no capacidad ilimitada ni eliminación de validaciones. Si una sección completa de Tours/Paquetes no tiene ofertas visibles, se ocultan sección y enlace según DEC-076.

El descuento se configura mediante el precio final rebajado (DEC-061). El porcentaje es un resultado automático de comparar ese precio con el normal y se muestra en la landing por solicitud posterior DEC-062; no es un porcentaje que ingrese el admin para calcular el precio. Ejemplo ilustrativo, no tarifas acordadas: ~~S/200.00~~ **S/180.00**, **10 % de descuento**. El precio normal de la tarjeta sigue siendo el precio base público independiente de DEC-057.

DEC-060 precisa que los descuentos son **opcionales**, a elección del administrador para cada tour o paquete. Publicar una oferta no exige configurar un descuento. Sin descuento, se muestra solo el precio normal; la presentación de RF-39/RF-40 corresponde únicamente a ofertas para las que el administrador decida aplicar una rebaja. DEC-067 mantiene el descuento hasta que el administrador lo cambie o quite, sin fecha automática de vencimiento. Al retirarlo se aplica el comportamiento sin descuento ya definido; las reservas existentes conservan sus importes.

La entrada de RF-38 está resuelta por DEC-061; se guarda el precio final rebajado, no un importe a restar. DEC-063 exige **0 < precio rebajado < precio normal**. DEC-079 exige precio normal positivo también cuando no hay descuento; no se admiten tours, paquetes ni salidas gratuitos o con precios negativos. DEC-064 adopta porcentaje sin decimales hacia abajo o «Menos del 1 %»; el indicador no modifica el importe en soles. DEC-065 permite precios rebajados propios por salida, comparados con su tarifa normal. DEC-066 establece el precio con el que se continúa la reserva y pago: rebajado de la salida si tiene descuento, normal de esa salida si no lo tiene. No se añade otra rebaja por la tarjeta. El importe turístico así obtenido participa en el total según las cantidades de 001; el alojamiento conserva su cálculo independiente. Una reserva ya creada conserva sus importes aunque después cambien o se retiren descuentos, conforme a RF-21/001. Vigencia manual resuelta por DEC-067 y presentación en detalle/selección de salida por DEC-085.

La posibilidad de configurar una rebaja por salida no obliga a descontar todas las salidas. Si una salida no tiene descuento, se usa su precio normal aunque la tarjeta pública tenga una promoción; no se hereda ni acumula esa rebaja (DEC-066). La selección de precio no cambia la conservación histórica ni las reglas de pago de 001.

No se reasignan reservas por desactivar contenido ni se implementa aquí una cancelación administrativa pagada. La consulta informativa no crea una retención: al reservar se valida de nuevo y la operación compuesta sigue siendo indivisible según 001.

### Cantidad de fotos por oferta

- **RF-103:** EL SISTEMA permitirá al administrador asociar a un tour o paquete todas las fotografías que necesite, sin imponer una cantidad máxima fija como regla de negocio. (DEC-107; DEC-080; RF24)

No hay un número máximo comercial de fotos por tour o paquete, contando la imagen principal y las de galería. El mínimo de una imagen para publicar se conserva (RF-15/RF-33). Cada archivo mantiene de forma independiente los formatos JPG/PNG/WebP y el máximo de 5 MB de RF-70/RF-71: subir más fotos no amplía el tamaño permitido por archivo. La capacidad de almacenamiento y los límites técnicos de la plataforma se documentarán en el plan sin presentarlos como una restricción comercial acordada. Esto no promete almacenamiento infinito, no autoriza archivos defectuosos y no define por inferencia carga masiva, orden manual, carrusel o zoom.

## Requisitos no funcionales

- **AC04 / RN-26 / RS03:** operaciones administrativas autorizadas explícitamente; visitante y cliente no editan catálogo, precios o cupos.
- **AC07:** no sobreventa por reservas o ajustes concurrentes. Validar conservación de compromisos y fallo completo de una reserva compuesta en la integración con 001/007.
- **AC09 / RN-28–RN-29:** todos los cambios administrativos definidos en DEC-078 son reconstruibles mediante auditoría no editable. El alcance funcional de 006 está definido; contrato compartido de 010 y su integración siguen pendientes.
- **AC10:** información e itinerario consultables para la oferta correcta; ocultar contenido no visible de manera coherente con el resultado ya definido por HU-02.
- **AC01:** objetivo inicial aproximado de lecturas simples menor a 300 ms en backend, excluyendo red pública/terceros. **PENDIENTE TÉCNICO (plan):** fijar volumen, carga y consultas de verificación (ACL-15). No convertirlo en un SLA nuevo ni afirmar que ya se cumple.
- **AC11:** casos de consulta/publicación y reglas de capacidad verificables de manera aislada; garantías de integridad requieren pruebas de integración reales en su plan.

Las tecnologías y estrategias de persistencia/integración se consultan en la constitución y se definen en el plan, no en los criterios funcionales aprobados.

## Casos límite

| Caso | Resultado conocido | Pendiente |
|---|---|---|
| Visitante sin sesión | Consulta pública permitida; RF-7. | Ninguno sobre autenticación de lectura. |
| Oferta desactivada o eliminada lógicamente | Fuera de listado; detalle no encontrado; RF-8/RF-12. | No confundir desactivación con eliminación de reservas históricas. |
| Paquete o tour activo | Tarjeta con campos RF-34 y descripción compartida RF-61; detalle con itinerario RF-35. Textos sin máximo fijo de caracteres RF-86/RF-87. | Longitud de estos textos resuelta por DEC-094; demás validaciones se conservan. |
| Más ofertas publicables que las incluidas en una página de consulta | Todas aparecen en su sección de inicio correspondiente en orden alfabético por nombre; RF-57–RF-59. | Parámetros de consulta pendientes ACL-30; no limitan ni reinician el orden del catálogo visible. |
| Oferta nueva con itinerario o imagen incompletos | Alta desactivada; activación rechazada mientras falte contenido obligatorio; RF-13/RF-33, DEC-053. | Límites de validación pendientes ACL-29; estructura del itinerario resuelta por DEC-055. |
| Oferta nueva con todos los datos completos | Se crea desactivada; el administrador puede activarla; RF-13/RF-15. | No se publica automáticamente al crearla. |
| Edición de oferta publicada elimina precio, itinerario, última imagen u otro dato obligatorio | Rechazar la edición y conservar los datos anteriores; RF-60. | Resuelto por DEC-074; no desactivación automática. |
| Oferta activa sin salidas futuras reservables o con todos los cupos agotados | Ocultar del listado/landing; enlace directo con «Oferta no disponible», sin detalle; RF-53–RF-56. | Si no queda ninguna oferta visible de ese tipo, ocultar sección y enlace; RF-62/RF-63. |
| Una salida agotada y otra disponible | La oferta activa sigue siendo elegible en el listado. | La reserva vuelve a validar disponibilidad; mostrar tarjeta no retiene cupos. |
| Filtros sin coincidencias en una sección con catálogo publicable | «No se encontraron resultados» y «Limpiar filtros»; RF-91–RF-93. | No ocultar sección/enlace por ese único resultado; limpiar recupera catálogo publicable. |
| Precio de tarjeta distinto del precio de una salida | Filtro de precio usa tarjeta, con rebaja si existe; RF-90. Reserva usa su salida según RF-28. | No convertir el filtro en un precio impuesto a la reserva. |
| Búsqueda por destino | «Cusco» encuentra ofertas que lo mencionan en nombre o descripción; RF-94. Sin coincidencias rigen RF-91–RF-93. | Fuente y presencia de texto resueltas por DEC-102; no lista administrativa adicional. |
| Duración mínima/máxima en horas o días; fecha por rango | Duración compara 1 día = 24 horas; fecha incluye ambos días con salida disponible; RF-95–RF-98. | Rangos invertidos rechazados con mensaje según RF-99–RF-101. |
| Rango mínimo/inicial mayor que máximo/final | «El rango no es válido»; no aplicar ni intercambiar extremos; RF-99–RF-101. | No confundir error de validación con «No se encontraron resultados». |
| Varios filtros aplicados | Cada oferta cumple todos; dentro de destino basta nombre o descripción; RF-94/RF-102. | No ampliar resultados silenciosamente al incumplir un filtro. |
| Oferta con única salida disponible fuera del rango buscado | No coincide con el filtro de fecha, aunque sea publicable sin filtros; RF-98. | No cancelar ni ocultar administrativamente la oferta por el resultado de búsqueda. |
| Página de consulta o tipo inválidos | Consulta paginada original y separación por tipo conservadas. | Resultado/mensajes pendientes ACL-30; no copiar diez por página ni mensajes de 001. |
| Distintas salidas del mismo tour o paquete | Tarifa por salida administrable; precio base público independiente; RF-28/RF-36/RF-37. | Una salida sin precio normal propio no admite reservas; RF-64. |
| Tarjeta con precio y salida todavía sin precio asignado | Rechazar reserva de esa salida hasta asignar su precio; RF-64. | No heredar automáticamente el precio de tarjeta ni tratar precio ausente como cero. |
| Precio base distinto de la tarifa de la salida | La reserva continúa con el rebajado de la salida si tiene descuento o con su normal; no acumula promoción de tarjeta; RF-28/RF-50. | Resuelto por DEC-066. |
| Tarjeta con descuento y salida elegida sin descuento | Se continúa con el precio normal de esa salida; RF-28/RF-50. | No se hereda la rebaja de la tarjeta. |
| Dos salidas del mismo tour o paquete con descuentos distintos | Admin puede guardar un precio final rebajado distinto en cada salida; RF-49. | No inferir que todas las salidas deben tener descuento o heredan el de la tarjeta. |
| Descuento en landing, detalle o selección de salida | Precio normal tachado, rebajado en soles y porcentaje automático del ámbito correspondiente; RF-39/RF-40/RF-47/RF-48/RF-74–RF-76. | Resuelto por DEC-085; sin descuento de la salida no se aplica el de la tarjeta. |
| Transcurre tiempo sin cambios del administrador | El descuento permanece vigente sin caducar automáticamente; RF-51. | No prorroga ni reactiva salidas o reservas; sus reglas se conservan. |
| Admin quita un descuento | Se vuelve al comportamiento sin descuento para nuevas consultas/reservas del ámbito afectado; RF-28/RF-42. | Las reservas ya creadas conservan el importe histórico; RF-21. |
| Porcentaje equivalente con fracción, por ejemplo S/120.00 → S/100.00 | Mostrar 16 %; el precio final sigue siendo S/100.00. | Resuelto por DEC-064; no redondear al entero más cercano. |
| Rebaja inferior al 1 %, por ejemplo S/100.00 → S/99.50 | Mostrar «Menos del 1 %», además de los precios correspondientes. | Resuelto por DEC-064; la rebaja sigue siendo opcional y válida. |
| Precio rebajado cero/negativo, igual o superior al normal | Rechazar configuración; RF-46. Un descuento con precio normal cero tampoco puede satisfacer la regla. | Resuelto por DEC-063; no inventar un porcentaje para una configuración rechazada. |
| Precio normal de tour, paquete o salida igual a cero o negativo | Rechazar ese precio, haya o no descuento; RF-65. | Resuelto por DEC-079; no se admite gratuidad turística. |
| Admin no desea descuento para un tour o paquete | Oferta admitida sin descuento; tarjeta con solo precio normal sin tachar; RF-41/RF-42. | El descuento no es obligatorio para publicar; se conservan los demás requisitos de publicación. |
| Cambio de precio con reserva existente | Importe histórico intacto; RF-21. | No se reabre la conservación histórica al permitir tarifas por salida. |
| Reducción de capacidad bajo compromisos | Rechazar; RF-25. | Ya aprobado; no volver a preguntar esa protección. |
| Oferta/salida desactivada con reserva pending | Conservar reserva y sus plazos; RF-22/RF-27. | Ya aprobado; no prorrogar ni cancelar de forma implícita. |
| Último cupo concurrente | Una sola retención, RF-31; no disponibilidad doble. | Estrategia técnica en el plan. |
| Cambio de fecha u hora de salida con reserva pendiente o confirmada | Rechazar el cambio, conservando fecha/hora y reservas; RF-52. | Resuelto por DEC-068; no autoriza traslado ni cancelación automática de reservas. |
| Reprogramación de una salida sin reservas con alojamiento asociado | Fechas hoteleras conservadas hasta ajuste manual; opciones afectadas ocultas; salida reservable sin alojamiento si cumple sus condiciones; RF-77–RF-79. | Fechas futuras según DEC-088; cambio de itinerario compartido por la oferta según DEC-089. |
| Nueva fecha/hora de salida pasada o igual al momento actual | Rechazar creación/reprogramación; RF-80, usando hora de Perú RF-81. | No cambia fechas de salidas históricas por el mero paso del tiempo. |
| Cambio de itinerario de una oferta con varias salidas | Cambio permitido se aplica a todas; si alguna tiene reserva pendiente o confirmada, rechazar y conservar el anterior; RF-82/RF-83. | Resuelto por DEC-090; consultar solo la salida seleccionada no basta. |
| Admin ajusta fechas de una propuesta tras reprogramar la salida | La propuesta vuelve a ser elegible para esa salida si cumple condiciones de selección y disponibilidad. | No reactiva hoteles inactivos ni altera reservas históricas. |
| Falla carga o reemplazo de imagen principal/galería | Mostrar «No se pudo cargar la imagen» y conservar imágenes anteriores; RF-72/RF-73. | Resuelto por DEC-084; sin imágenes previas sigue faltando el requisito para publicar. |
| Imagen excede 5 MB o tiene formato no admitido | Rechazar archivo; RF-70/RF-71. | Exactamente 5 MB cumple tamaño; cantidad de fotos sin máximo comercial por DEC-107. |
| Oferta con muchas fotos | Se aceptan todas las que el admin necesite; RF-103. | 5 MB por archivo sigue aplicando; capacidad técnica se trata en el plan, no como límite comercial. |

## Fuera de alcance

- Crear/pagar/cancelar reservas del cliente: 001/002/003. Se mantienen aquí solo las garantías compartidas de oferta, precio y cupos.
- Registro/inicio de sesión y políticas de identidad: 005.
- Administración hotelera y propuestas de alojamiento: 007; la asociación por salida sigue siendo una condición compartida.
- La presentación pública completa de Hoteles acordada en DEC-072 se registra en 007; no convierte esta spec de Tours/Paquetes en la spec hotelera ni en una revisión de 013.
- Devoluciones y cancelación por imposibilidad real de prestar un servicio pagado: 002/009; desactivar contenido no equivale a cancelar reservas.
- Catálogo de Movilidad: 013 aprobada, exclusivamente informativa y sin detalle individual. No afecta el detalle turístico.
- Mecanismo de gestión multimedia: 012. RF24 se conserva como dependencia necesaria de las imágenes, no se elimina al separarlo.
- Constructor de paquetes por cliente, carrito de varias ofertas, comparadores, reseñas, favoritos, mapas o descargas no definidos.
- Los descuentos de tours/paquetes pasan al alcance por DEC-058; no se amplían por inferencia a alojamiento, cupones o programas de fidelidad.
- Copiar por analogía estados iniciales, límite de imagen, paginación o unicidad de nombres de 001/013. Sus reglas no se propagan automáticamente a este catálogo.

## Criterios de finalización

### Documento

- Resolver las decisiones que bloquean publicación/validación y presentación, sin reemplazar requisitos originales ni acuerdos previos.
- Mantener RF-1–RF-6 de `acuerdos.md` y trazar los criterios restantes a RF/HU/RN o DEC existentes.
- Revisar coherencia con 001 aprobada, especialmente cupos, precios, desactivaciones y propuestas hoteleras.
- Completar las reglas de descuentos de ACL-31 y su relación con el precio base, tarifa por salida e importes de nuevas reservas antes de aprobar 006.
- Presentar la versión completa para **aprobación explícita propia de 006**. No crear `plan.md` ni `tasks.md` de 006 antes de recibirla.

### Implementación futura

- Comprobar catálogo anónimo, solo activos, paginación/filtro acordados y detalle con todos los campos/itinerario para tours y paquetes.
- Comprobar detalle con varias fotos asociadas a la oferta correcta, manteniendo imagen principal en tarjeta y mínimo de publicación de una imagen; no mezclar fotos entre tours y paquetes.
- Comprobar formatos JPG/PNG/WebP y rechazo de otros formatos; tamaño inferior, igual y superior a 5 MB por archivo, tanto en principal como galería.
- Comprobar fallo de carga nueva y reemplazo de principal/galería, con y sin imágenes previas: mensaje exacto, conservación de las anteriores y ninguna imagen fallida presentada como guardada.
- Comprobar ofertas con muchas fotos: no existe rechazo por cantidad; cada archivo sigue sujeto a formato y 5 MB, y el mínimo de una imagen para publicar se conserva.
- Comprobar configuración y presentación de duración en horas y en días para ambos tipos de oferta, sin perder la unidad ni alterar el cálculo hotelero aprobado.
- Comprobar elección exclusiva de horas o días y ausencia de un máximo comercial arbitrario, conservando el valor entero y la unidad seleccionada.
- Comprobar que no se agrega un mínimo comercial fijo a la duración decidida por admin ni un máximo fijo de caracteres a descripción/itinerario; conservar datos obligatorios y estructura acordada.
- Comprobar filtros de precio visible de tarjeta con/sin descuento, duración por mínimo/máximo y unidad, fecha por rango y búsqueda automática de destino sobre catálogo existente.
- Comprobar búsqueda de 1 a 2 días con ofertas de 24 y 48 horas y ofertas fuera del intervalo; conservar duración/unidad original al mostrar resultados, sin alterar alojamiento.
- Comprobar rango de fechas con salidas disponibles en día inicial, intermedio y final; excluir ofertas con disponibilidad solo fuera del rango y con salidas agotadas dentro de él. Usar fecha local de Perú y no retener cupos al filtrar.
- Comprobar rango invertido de precio, duración y fecha: rechazar aplicación, mensaje exacto y extremos sin intercambio automático; no informar un error como vacío válido.
- Comprobar filtros individuales y combinados: excluir ofertas que incumplan cualquiera de los aplicados y conservar coincidencia de destino en uno de sus dos campos; no alterar orden, publicación o disponibilidad.
- Comprobar destino presente solo en el nombre, solo en la descripción, en ambos o en ninguno; basta coincidencia en un campo y no debe duplicarse la tarjeta si coincide en los dos.
- Comprobar «No se encontraron resultados» y botón «Limpiar filtros»; limpiar recupera todo el catálogo publicable, ordenado y en la sección correcta, sin reactivar ofertas ocultas ni afectar reservas.
- Comprobar rechazo de duraciones fraccionarias en ambas unidades, sin redondeo silencioso; los valores enteros se someten a las demás validaciones acordadas.
- Comprobar sección Tours vacía con Paquetes visible, caso inverso y recuperación de la primera oferta visible; sección y enlace correspondientes desaparecen/reaparecen juntos sin afectar la otra sección.
- Comprobar con más ofertas que una página de consulta que Tours y Paquetes turísticos muestran cada uno todo su catálogo publicable, sin mezclar tipos ni limitarse a cinco ofertas o a la primera página.
- Comprobar orden alfabético ascendente por nombre en cada sección con ofertas creadas en distinto orden; conservar ese orden en todo el conjunto visible.
- Comprobar en la landing que las tarjetas de tours y paquetes con descuento muestran el precio normal tachado seguido del precio rebajado en soles con dos decimales.
- Comprobar la misma presentación en detalle y selección de salida, usando los precios propios de cada ámbito; una salida sin descuento muestra su normal aunque la oferta tenga promoción.
- Comprobar la entrada directa del precio final y el porcentaje equivalente automático en ambas categorías; la precisión visual acordada no altera los importes en soles.
- Comprobar rechazo de precio rebajado negativo, cero, igual o superior al normal; aceptar descuentos que cumplen 0 < rebajado < normal y las demás validaciones acordadas.
- Comprobar rechazo de precios normales cero/negativos en ofertas y salidas, incluso sin descuento; conservar la distinción entre precio ausente y precio inválido.
- Comprobar porcentaje exacto, fraccionario y menor al 1 %: 10 % permanece 10 %, 16,666… % muestra 16 % y 0,5 % muestra «Menos del 1 %», sin modificar precios.
- Comprobar que dos salidas de un tour o paquete admiten precios finales rebajados distintos, válidos respecto de su propia tarifa normal.
- Comprobar que una salida sin precio propio no admite reserva aunque la tarjeta tenga precio y existan cupos; al asignarlo se mantienen las demás validaciones y se usa la tarifa de esa salida.
- Comprobar continuidad del precio rebajado de la salida al reservar y pagar, precio normal cuando no hay descuento y ausencia de una segunda rebaja procedente de la tarjeta; los importes de reservas ya creadas se conservan.
- Comprobar que el paso del tiempo no vence descuentos; cambiarlos o retirarlos por admin afecta las nuevas condiciones, conservando los importes de reservas ya creadas.
- Comprobar rechazo de cambios de fecha y de hora con una reserva pendiente o confirmada; una reserva concurrente no debe quedar asociada a una fecha/hora distinta de la aceptada al crearla.
- Comprobar que reprogramar una salida sin reservas conserva las fechas del alojamiento asociado hasta una edición explícita del admin; no aplica un desplazamiento automático de días a las propuestas.
- Comprobar ocultación de propuestas pendientes de ajuste, reserva turística sin hotel y recuperación de opciones ajustadas disponibles; no ocultar hoteles del catálogo general ni afectar otras salidas.
- Comprobar creación/reprogramación con fecha pasada, actual y futura en hora de Perú; una fecha futura no elude el bloqueo si existen reservas pendientes o confirmadas.
- Comprobar que cambiar el itinerario del tour/paquete se refleja en sus distintas salidas, sin crear variantes por salida ni afectar itinerarios de otras ofertas.
- Comprobar bloqueo de itinerario por una reserva pendiente o confirmada en cualquier salida de la oferta, incluso distinta de la consultada; conservar el anterior y cubrir la concurrencia con creación de reservas.
- Comprobar listado sin fechas reservables, agotamiento de la última salida, otra salida aún disponible y recuperación de cupos: ocultar/reincluir sin cambiar el estado administrativo ni las reservas existentes.
- Comprobar que un enlace directo guardado de una oferta sin salidas disponibles muestra «Oferta no disponible» sin detalle, aunque se espere disponibilidad suficiente al inicio.
- Comprobar que publicar un tour o paquete no exige descuento y que su tarjeta sin descuento muestra únicamente el precio normal sin tachado.
- Comprobar permisos, rechazo de datos no admitidos y conservación de reservas históricas ante precios/desactivaciones.
- Comprobar que quitar cada dato obligatorio o la última imagen de un tour/paquete publicado rechaza la edición y conserva su contenido persistido; las ediciones completas siguen permitidas.
- Comprobar rechazo de publicación o renombre duplicado dentro de Tours y dentro de Paquetes, sin impedir por esta regla el mismo nombre entre ambos tipos; dos activaciones concurrentes no deben dejar duplicados publicados.
- Comprobar equivalencia de nombres con diferencias de mayúsculas/minúsculas y espacios exteriores tanto en activación como renombre; la regla sigue siendo independiente por tipo y no impone cambiar la presentación del nombre.
- Comprobar que tarjeta y presentación al reservar usan la misma descripción de oferta, sin requerir un resumen administrable independiente.
- Verificar que cambios de capacidad y reservas concurrentes no produzcan sobreventa y que cambios críticos queden auditados.
- Verificar auditoría de cambios aplicados a tours, paquetes, salidas, precios y descuentos con actor, contenido cambiado y fecha correctos; no confundir una operación rechazada con una modificación exitosa.
- Registrar evidencia por criterio después de implementar; esta spec no ejecuta pruebas de producto ni habilita código por sí sola.

## Dudas abiertas

Se incorporan confirmación de rangos inválidos e instrucción de aplicar validaciones habituales sin preguntas obvias (DEC-105/DEC-106), recibidas durante modo de planificación, y la cantidad de fotos sin máximo comercial (DEC-107), confirmada con «si». No se reabre esa entrevista. Las preguntas funcionales propias de Catálogo quedaron cerradas. Los límites concretos de validación de campos y los parámetros de la consulta paginada original son puertas técnicas del plan: no se convierten en topes comerciales inventados ni reabren la spec. **Esta versión completa fue aprobada explícitamente el 2026-10-30**; sus dependencias conservan sus propios pendientes.

1. **ACL-29 — Completitud, duración y nombres:** reglas acordadas conservadas; duración entera en una sola unidad sin mínimo ni máximo comercial fijo, a elección del admin (DEC-095). **PENDIENTE TÉCNICO (plan):** fijar validaciones concretas de título, tipo y condiciones sin inventar topes comerciales ni reabrir duración o unicidad.
2. **ACL-28 — Presentación, itinerario y descripción compartida:** textos de descripción e itinerario sin máximo fijo de caracteres por DEC-094; estructura y contenido obligatorio conservados. Este punto queda resuelto funcionalmente; no volver a preguntar longitudes de esos dos textos.
3. **ACL-29 — Precios definidos por DEC-056/DEC-057/DEC-077/DEC-079:** tarifa propia por salida y precio base público independiente, ambos mayores que cero en PEN con dos decimales. Salida sin precio propio no admite reservas ni hereda el precio de tarjeta. Conservación histórica ya definida; no reabrir gratuidad o aceptación de negativos.
4. **ACL-29 — Protección temporal, alojamiento e itinerario definidos por DEC-068/DEC-086–DEC-090:** fechas futuras en hora de Perú, ajuste manual del alojamiento e itinerario compartido. Bloquear edición de itinerario si alguna salida tiene reservas pendientes o confirmadas. Este punto queda resuelto; no reabrirlo ni alterar condiciones históricas.
5. **ACL-30 — Filtros DEC-096–DEC-106:** fuentes, unidades, fechas, vacío/limpieza, combinación de todos los filtros y rechazo de rangos invertidos definidos. **PENDIENTE TÉCNICO (plan):** concretar parámetros y errores de la consulta paginada original por tipo, sin trasladarlos como límite visual del catálogo completo.
6. **ACL-13/ACL-14/ACL-15:** galería DEC-080, formatos/tamaño DEC-083, fallo con mensaje/conservación DEC-084 y cantidad de fotos sin máximo comercial DEC-107 definidos; auditoría DEC-078 y contrato 010 pendiente. **PENDIENTE TÉCNICO (plan):** condiciones de medición, almacenamiento y conservación de objetos, sin reintroducir un máximo comercial de fotos ni reabrir el tratamiento de fallos.
7. **ACL-31 — Reglas funcionales de descuentos tratadas, resueltas:** opcionales, precio final directo válido, porcentaje informativo, precio efectivo de salida sin doble rebaja y vigencia manual. DEC-085 completa presentación en detalle y selección de salida. No reabrir esos acuerdos; otros pendientes del catálogo y contratos compartidos siguen en sus ámbitos.

## Aprobación de esta especificación

- **Versión aprobada:** 0.46.
- **Solicitud presentada:** «¿Apruebas la versión 0.46 como spec final de Catálogo 006?».
- **Respuesta explícita del usuario:** «aprobado».
- **Fecha de aprobación:** 2026-10-30.
- **Alcance de la aprobación:** contenido funcional completo de 006 v0.46, incluidos sus 103 criterios locales y sus límites/dependencias. No aprueba 005, 007, 010 ni 012; sus contratos y pendientes conservan su propio estado.
- **Decisiones de origen:** DEC-053–DEC-107; procedencia y límites en [decisiones](../../decisiones.md) y [aclaraciones](../../aclaraciones.md). La aprobación es este acto explícito posterior, no la acumulación de respuestas de aclaración.
- **Efecto:** superado el requisito de aprobación previo al plan y tareas de 006. Habilita su diseño técnico, no la implementación. Cualquier cambio funcional posterior exige nueva revisión y aprobación.
- **Plan/tareas:** creados después de esta aprobación como documentos no ejecutados; no autorizan código, documentación original, commits ni push.
