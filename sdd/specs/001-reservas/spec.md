# Spec 001 — Reservas del cliente

> **Estado:** **APROBADA** explícitamente por el usuario el 2026-10-22; aclaraciones funcionales propias cerradas.
> **Versión aprobada:** 0.13. Este registro de aprobación no modifica los criterios funcionales de la versión presentada.
> **Alcance funcional aprobado:** RF05, RF06, RF10, RF11, RF18, RF19 y la liberación por cancelación de RF22, con las precisiones y dependencias descritas en esta versión.
> **Fuentes:** F02 §2 y §9; F03 §§1, 3–6; F04 AC05, AC07 y AC10. Rutas en el [inventario](../../fuentes.md).
> **Decisiones de origen:** DEC-001–DEC-037; evidencia, correcciones y límites en [aclaraciones](../../aclaraciones.md) y [decisiones](../../decisiones.md). La respuesta posterior «si» a la solicitud explícita de aprobar 001 v0.13 aprueba esta versión completa; no se deduce de las aclaraciones ni de «HAZLO».
> **Dependencias funcionales:** identidad 005, catálogo 006, hoteles 007, pagos 002, vencimiento 003 y auditoría 010, según el [índice](../README.md).

## Resumen para revisión

- Una oferta y salida por reserva: tour o paquete predefinido; alojamiento opcional de una habitación, de un tipo en un hotel.
- La propuesta hotelera se vincula a esa salida y fija sus horarios en hora Perú; duración por múltiplos completos de 24 horas y tarifa fija por período. Puede alojarse solo parte del grupo, mostrando capacidad y viajeros.
- Sin tolerancia hotelera ni devolución por retiro anticipado; se permiten estancias consecutivas en el mismo instante. Extensiones directamente con el hotel.
- Total oficial en PEN con dos decimales, histórico y pago conjunto por tarjeta/Yape mediante Culqi. Solicitud recibida antes de 15 minutos; solo con pago por validar, retención hasta antes de 20. Cortes exactos fuera de plazo; rechazo definitivo en tolerancia cancela al recibirse.
- Primera cancelación/inicio de pago registrada determina el resultado. Verificación bloquea cancelación voluntaria; cobro posterior a cancelación no reactiva y requiere devolución gestionada manualmente.
- Desactivaciones impiden nuevas reservas, sin cancelar las existentes. No reducir capacidad bajo compromisos vigentes. Historial propio con todos los estados, diez por página y creación descendente, con número único de reserva descendente para desempatar; auditoría de acciones acordadas.

La cancelación automática/liberación por vencimiento debe completarse en máximo 60 segundos sin ampliar pago. Página inválida: «Número de página no válido». Página válida sin resultados: lista vacía con «No hay reservas en esta página», sin error. En ambos casos no hay cambio automático a otra página. Los pendientes funcionales propios quedaron resueltos; devoluciones/comprobantes y otros detalles de dependencias se cerrarán en sus specs, no se dan por aprobados aquí.

## Contexto y objetivo

El cliente necesita reservar un tour o paquete predefinido para una salida y cantidad de personas, añadir opcionalmente una habitación de una propuesta publicada, conocer el total y gestionar sus reservas. El objetivo es evitar sobreventa y operaciones parciales, conservar precio y horarios contratados y admitir un único pago conjunto. La propuesta hotelera dura un múltiplo completo de 24 horas, sin tolerancia de salida, en hora de Perú; puede alojar solo a parte del grupo. El pago tiene ventana de 15 minutos y, solo con intento iniciado a tiempo por validar, tolerancia de 5 minutos.

## Usuarios / actores

- **Cliente autenticado (`client`):** crea reservas, consulta las propias y cancela las propias pendientes. Fuentes: F01 §1; HU-06, HU-10, HU-11, HU-22.
- **Administrador:** configura tours/paquetes, salidas, cupos y propuestas hoteleras con período, tipo, tarifa e inventario. Administra horarios por hotel sin alterar los de reservas ya creadas. Estas operaciones se especificarán en 006/007; no son permisos del flujo de cliente. Fuentes: F01 §2; HU-14, HU-23; DEC-005–DEC-008.
- **Sistema:** aplica precios oficiales, disponibilidad y ciclo de vida. Pago y vencimiento son procesos relacionados especificados por separado; sus resultados deben respetar las invariantes de esta spec.

## Historias de usuario

Fuente: F02 §2. Se conservan identificadores y prioridad **P1** de todas estas historias.

Se conservan las HU originales; DEC-006/DEC-007 y DEC-018 precisan HU-22: una habitación y un período múltiplo de 24 horas asignado por el administrador, no cantidad ni fechas libres del cliente. La fórmula original por noches de RF19 se conserva como fuente histórica; la lectura vigente SDD usa tarifa por cada 24 horas completas (ACL-25 resuelta en ese punto).

- **HU-06:** Como cliente autenticado, quiero reservar un servicio turístico para una fecha y cantidad de personas.
- **HU-07:** Como cliente, quiero conocer el precio total antes de pagar.
- **HU-10:** Como cliente, quiero consultar mi historial de reservas.
- **HU-11:** Como cliente, quiero cancelar una reserva pendiente que ya no deseo pagar.
- **HU-22:** Como cliente, quiero agregar alojamiento opcional a mi reserva turística para consolidar mi viaje.

## Requisitos funcionales (criterios de aceptación en EARS)

`RF-1` y sucesivos son criterios locales: por ejemplo, `001/RF-1`. No sustituyen los RF originales. Se conservan RF-1–RF-37; los criterios modificados reflejan decisiones explícitas, sin renumerarlos. Las referencias DEC identifican precisiones de entrevista, no contenidos atribuidos retrospectivamente a RF/HU/RN.

### Creación y disponibilidad

- **RF-1:** CUANDO un cliente autenticado solicita una reserva turística válida con disponibilidad suficiente, EL SISTEMA creará la reserva en estado `pending`. (RF05; HU-06; RN-04)
- **RF-2:** SI una solicitud de creación de reserva no procede de un cliente autenticado, ENTONCES EL SISTEMA rechazará su creación. (HU-06; F01 §1)
- **RF-3:** SI la oferta seleccionada está inactiva o eliminada lógicamente, ENTONCES EL SISTEMA rechazará la nueva reserva. (RF05; RN-01)
- **RF-4:** SI la salida solicitada no existe o no permite nuevas reservas, ENTONCES EL SISTEMA rechazará la nueva reserva. (RF05; RN-05)
- **RF-5:** SI la cantidad de personas solicitada es menor o igual a cero, ENTONCES EL SISTEMA rechazará la nueva reserva. (RF05; RN-06)
- **RF-6:** SI la cantidad de personas solicitada supera los cupos disponibles, ENTONCES EL SISTEMA rechazará la nueva reserva. (RF05; RN-06)
- **RF-7:** CUANDO se crea una reserva `pending`, EL SISTEMA bloqueará temporalmente la disponibilidad necesaria para esa reserva. (RF05; RN-08; HU-06)
- **RF-8:** SI dos solicitudes concurrentes compiten por el último cupo turístico disponible, ENTONCES EL SISTEMA permitirá que solo una obtenga ese cupo. (RN-07; HU-06; F02 §9)
- **RF-9:** CUANDO una solicitud pierde el último cupo frente a otra solicitud concurrente, EL SISTEMA informará indisponibilidad. (HU-06; F02 §9)

### Alojamiento opcional y reserva compuesta

- **RF-10:** CUANDO un cliente solicita una reserva turística sin alojamiento, EL SISTEMA permitirá crearla sin exigir alojamiento. (RF18; RN-09; HU-22)
- **RF-11:** DONDE la reserva incluya alojamiento, EL SISTEMA obtendrá el hotel, tipo de habitación y período asignado a partir de la propuesta elegida por el cliente. (RF18; HU-22 precisada por DEC-006–DEC-007; cantidad fija de una habitación)
- **RF-12:** SI el hotel o el tipo de habitación seleccionado está inactivo o eliminado lógicamente, ENTONCES EL SISTEMA rechazará la nueva reserva compuesta. (RF18; RN-01)
- **RF-13:** SI la fecha de salida del alojamiento no es posterior a la fecha de entrada, ENTONCES EL SISTEMA rechazará la nueva reserva compuesta. (RF18; RN-10)
- **RF-14:** DONDE la reserva incluya alojamiento, EL SISTEMA comprobará la disponibilidad de una habitación del hotel y tipo elegidos durante el período asignado. (RF18; RN-11; DEC-006–DEC-007, DEC-018–DEC-019; sin margen adicional de salida)
- **RF-15:** SI dos solicitudes concurrentes compiten por la última habitación del mismo hotel y tipo en períodos incompatibles, ENTONCES EL SISTEMA permitirá que solo una obtenga esa habitación. (RN-11–RN-13; HU-22; F02 §9; DEC-006; sin inventarios independientes por salida turística)
- **RF-16:** CUANDO se crea una reserva compuesta, EL SISTEMA realizará conjuntamente los bloqueos turísticos y hoteleros como una operación indivisible. (RF18; RN-12)
- **RF-17:** SI falla cualquier validación de la reserva compuesta, ENTONCES EL SISTEMA dejará sin efecto todos los bloqueos efectuados por esa solicitud. (RF18; RN-13)
- **RF-18:** SI falla la creación de una reserva, ENTONCES EL SISTEMA no conservará una reserva parcialmente creada. (RF05, RF18; F03 §5)

### Precio oficial e histórico

- **RF-19:** CUANDO se crea una reserva turística, EL SISTEMA calculará el subtotal turístico a partir del precio vigente y la cantidad de personas solicitada. (RF06; HU-07)
- **RF-20:** CUANDO se crea una reserva con alojamiento, EL SISTEMA calculará el total sumando el componente turístico y el importe oficial de la única habitación para el período de la propuesta elegida. (RF19; HU-07, HU-22; DEC-004, DEC-006–DEC-008, DEC-018; tarifa por 24 horas según RF-80)
- **RF-21:** SI el cliente envía un precio o total manipulado, ENTONCES EL SISTEMA utilizará el importe calculado a partir de los precios oficiales. (RN-03; HU-07; F02 §9)
- **RF-22:** CUANDO se crea una reserva, EL SISTEMA conservará los precios utilizados como valores históricos de esa reserva. (RF06, RF19; RN-02; F03 §6)
- **RF-23:** CUANDO cambia el precio de una oferta o habitación, EL SISTEMA mantendrá los importes de las reservas ya creadas. (RN-02; F03 §6)
- **RF-24:** CUANDO el cliente consulta su reserva antes de pagar, EL SISTEMA mostrará el total oficial calculado. (HU-07; RF06, RF19)

Moneda PEN, dos decimales y tarifa independiente de ocupantes están acordadas. El importe hotelero es la tarifa fija por 24 horas multiplicada por el número entero de períodos de la propuesta; el total suma ese importe y el subtotal turístico. No se cobra una propuesta de 48 horas como si fuera una sola de 24. Para estas multiplicaciones/sumas de precios de dos decimales por cantidades enteras no hace falta introducir redondeos intermedios. Si posteriormente se aprueba un cálculo que produzca fracciones de céntimo, su política deberá aclararse (ACL-06); no se inventan impuestos, descuentos o comisiones.

### Consulta de reservas propias

- **RF-25:** CUANDO un cliente consulta su historial, EL SISTEMA devolverá únicamente reservas que le pertenecen. (RF10; RN-25; HU-10)
- **RF-26:** CUANDO un cliente consulta su historial, EL SISTEMA devolverá resultados paginados. (HU-10)
- **RF-27:** CUANDO un cliente consulta su historial, EL SISTEMA incluirá estado, fecha, oferta, alojamiento opcional, cantidades e importes de cada reserva devuelta. (HU-10)
- **RF-28:** SI un cliente solicita una reserva ajena, ENTONCES EL SISTEMA impedirá el acceso a esa reserva. (RF10; RN-25; F02 §9)

DEC-016 define todos los estados propios, historial vacío sin error, diez por página y más recientes primero. DEC-022 fija recurso ajeno no disponible sin revelar datos. DEC-035/DEC-036 distinguen entrada de página inválida y página válida sin resultados, sin sustitución automática. DEC-037 desempata creación por número único de reserva descendente. Los bordes del historial quedan cerrados en ACL-15; el mapeo HTTP corresponde al contrato técnico posterior.

### Cancelación por el cliente e invariantes de ciclo de vida

- **RF-29:** CUANDO un cliente cancela una reserva propia vigente en estado `pending` sin pago en verificación, EL SISTEMA cambiará su estado a `cancelled`. (RF11; RN-19; F03 §4; DEC-024 restringe cancelación durante verificación)
- **RF-30:** SI un cliente intenta cancelar una reserva ajena, ENTONCES EL SISTEMA rechazará la cancelación. (RF11; RN-19, RN-25)
- **RF-31:** SI un cliente intenta cancelar directamente una reserva `confirmed` o `completed`, ENTONCES EL SISTEMA rechazará la cancelación. (RF11; RN-19, RN-23; F02 §9)
- **RF-32:** CUANDO se cancela una reserva pendiente, EL SISTEMA liberará los cupos turísticos bloqueados por esa reserva. (RF22; RN-21; HU-11)
- **RF-33:** CUANDO se cancela una reserva pendiente con alojamiento, EL SISTEMA liberará el inventario hotelero bloqueado por esa reserva. (RF22; RN-21; HU-11)
- **RF-34:** SI se repite la cancelación de una reserva ya cancelada por el mismo cliente propietario, ENTONCES EL SISTEMA evitará una segunda liberación de recursos. (RF22; HU-11)
- **RF-35:** EL SISTEMA permitirá la transición de `pending` a `confirmed` únicamente después de validar un pago exitoso. (RF08; RN-14; F03 §4; comportamiento de pago desarrollado en 002)
- **RF-36:** EL SISTEMA conservará `completed` como estado terminal. (RN-23)
- **RF-37:** CUANDO se confirma un cobro asociado a una reserva ya cancelada por vencimiento, EL SISTEMA mantendrá esa reserva en estado `cancelled`. (DEC-001; aclara RF08, RF21 y F03 §4; incluye cobros realizados antes del vencimiento cuya validación llega después de la cancelación)

DEC-001 exige devolver el dinero e informar al cliente en RF-37. DEC-017 acuerda revisión/inicio manual por admin en máximo un día hábil, no abono en ese plazo; calendario/avisos se detallarán en 002. DEC-020 sustituye 15 + 2 por 15 + 5; DEC-024 bloquea cancelación voluntaria en verificación. DEC-033 resuelve la carrera: primera operación registrada gana y aplica devolución a un cobro posterior a cancelación ya aceptada (RF-94–RF-96). Respuesta a cancelación repetida: RF-58.

### Precisiones aprobadas de oferta y alojamiento

- **RF-38:** EL SISTEMA limitará cada reserva a una sola oferta turística, sea tour o paquete, con una salida. (DEC-005; RF05, RF18)
- **RF-39:** CUANDO el cliente selecciona un paquete, EL SISTEMA utilizará la oferta predefinida por el administrador con su precio, duración, salida y cupos propios. (DEC-005; RF13)
- **RF-40:** DONDE la reserva incluya alojamiento, EL SISTEMA limitará la selección a una sola habitación de un tipo perteneciente a un hotel. (DEC-006; precisa HU-22)
- **RF-41:** CUANDO el cliente elige una habitación con capacidad mayor a la cantidad de viajeros alojados, EL SISTEMA permitirá esa elección. (DEC-006; DEC-021 permite alojar solo parte del grupo)
- **RF-42:** CUANDO la habitación elegida no ocupa toda su capacidad, EL SISTEMA mantendrá la tarifa fija correspondiente a esa opción. (DEC-008)
- **RF-43:** DONDE la reserva incluya alojamiento, EL SISTEMA impedirá al cliente modificar las fechas y horas del período de la propuesta seleccionada. (DEC-007)
- **RF-44:** CUANDO el administrador cambia los horarios de un hotel, EL SISTEMA conservará los horarios asignados a las reservas ya creadas. (DEC-007; regla compartida con 007)
- **RF-45:** CUANDO el cliente consulta las condiciones del alojamiento seleccionado, EL SISTEMA indicará que no existe tolerancia adicional después de la salida asignada. (DEC-019 sustituye la tolerancia de 30 minutos de DEC-009; no implica nuevo cobro automático)
- **RF-46:** CUANDO un cliente se retira antes de la salida hotelera asignada, EL SISTEMA mantendrá el importe contratado sin devolución parcial por ese retiro anticipado. (DEC-010; no deroga DEC-001)
- **RF-47:** SI la habitación de la propuesta elegida resulta indisponible, ENTONCES EL SISTEMA informará esa indisponibilidad al cliente. (DEC-011; RN-13)
- **RF-48:** CUANDO existen otras propuestas disponibles tras fallar la elegida, EL SISTEMA ofrecerá al cliente seleccionar otra propuesta. (DEC-011)
- **RF-49:** CUANDO no quedan propuestas disponibles tras fallar la elegida, EL SISTEMA ofrecerá al cliente continuar con el tour o paquete sin alojamiento. (DEC-011; continuar requiere elección del cliente, no degradación automática)

### Total único e historial

- **RF-50:** DONDE la reserva incluya alojamiento, EL SISTEMA presentará un único total pagadero por el tour o paquete y su habitación seleccionada. (DEC-012; RF19)
- **RF-51:** EL SISTEMA expresará los importes de la reserva en soles peruanos (`PEN`). (DEC-004)
- **RF-52:** EL SISTEMA calculará y mostrará los importes de reserva con dos decimales. (DEC-004; sumas y multiplicaciones enteras sin redondeo intermedio; ACL-06 solo condiciona cálculos futuros no aprobados)
- **RF-53:** CUANDO el cliente consulta el total de la reserva, EL SISTEMA mostrará el importe final sin añadir cargos o descuentos no acordados. (DEC-004; HU-07)
- **RF-54:** CUANDO un cliente consulta su historial, EL SISTEMA incluirá sus reservas de todos los estados documentados. (DEC-016; RF10; pending, confirmed, completed y cancelled)
- **RF-55:** SI el cliente no tiene reservas, ENTONCES EL SISTEMA mostrará un historial vacío sin tratarlo como error. (DEC-016)
- **RF-56:** CUANDO el cliente consulta una página de su historial, EL SISTEMA mostrará hasta diez reservas en esa página. (DEC-016; HU-10)
- **RF-57:** CUANDO el cliente consulta su historial, EL SISTEMA ordenará las reservas desde la creación más reciente hasta la más antigua. (DEC-016; empate resuelto por DEC-037 y RF-105)
- **RF-58:** CUANDO el propietario repite la cancelación de una reserva ya cancelada, EL SISTEMA informará que esa reserva ya está cancelada. (DEC-016; complementa RF-34)

### Condiciones compartidas con pagos y vencimiento

Estas condiciones delimitan lo que observa el cliente en 001; el procesamiento de pagos y ejecución de vencimientos se detallarán en 002/003 sin duplicar políticas distintas.

- **RF-59:** CUANDO se crea una reserva, EL SISTEMA establecerá una ventana inicial de quince minutos para iniciar su pago. (DEC-020 sustituye DEC-003; RN-08, RN-20; inicio recibido según RF-73)
- **RF-60:** MIENTRAS transcurren los cinco minutos de tolerancia posteriores a la ventana inicial, EL SISTEMA impedirá iniciar nuevos intentos de pago de esa reserva. (DEC-020)
- **RF-61:** MIENTRAS se valida durante la tolerancia un pago iniciado dentro de la ventana inicial, EL SISTEMA mantendrá los recursos de la reserva bloqueados. (DEC-020; RN-08)
- **RF-62:** CUANDO un pago iniciado a tiempo se valida antes de terminar el límite total de veinte minutos desde creación, EL SISTEMA confirmará la reserva pendiente cobrable conforme a la evidencia validada. (DEC-020, DEC-012; RF08)
- **RF-63:** CUANDO concluye la tolerancia de cinco minutos sin un pago válido confirmado, EL SISTEMA cancelará la reserva pendiente que conservaba recursos por un pago iniciado a tiempo. (DEC-020; RF21; liberación única RF22, RF-32–RF-34)
- **RF-64:** SI la validación del pago se completa al cumplirse exactamente veinte minutos desde creación o después, ENTONCES EL SISTEMA impedirá confirmar por ese pago una reserva que deba cancelarse por vencimiento. (DEC-020, DEC-028, DEC-001; devolución según DEC-017)
- **RF-65:** CUANDO Culqi rechaza un intento antes de terminar la ventana inicial de quince minutos, EL SISTEMA mantendrá la reserva pendiente mientras conserve vigencia. (DEC-013/DEC-024; DEC-027 distingue rechazo en tolerancia; no renovar ventana)
- **RF-66:** MIENTRAS el resultado de un pago siga desconocido, EL SISTEMA mostrará «pago en verificación». (DEC-013)
- **RF-67:** MIENTRAS el resultado de un pago siga desconocido, EL SISTEMA bloqueará iniciar otro intento para esa reserva. (DEC-013; no habilitar pagos al vencer)
- **RF-68:** CUANDO DMGoTravell valida automáticamente la notificación oficial de pago de Culqi, EL SISTEMA aplicará la confirmación solo si la reserva sigue siendo cobrable dentro de sus límites. (DEC-012; RN-14; no confirmación manual ni navegador como evidencia)
- **RF-69:** CUANDO ocurre creación, cancelación o vencimiento de reserva, EL SISTEMA registrará esa operación en auditoría con los datos definidos por RN-28. (DEC-015; RF23; HU-20 conserva `reservation.auto_cancelled`)

### Correcciones de la segunda ronda: ocupación, plazos y alojamiento

- **RF-70:** CUANDO la capacidad de la habitación es menor al total de viajeros del tour o paquete, EL SISTEMA permitirá elegirla para alojar solo a parte del grupo. (DEC-021; no autoriza sobreocupación física ni varias habitaciones)
- **RF-71:** DONDE la reserva incluya alojamiento, EL SISTEMA mostrará la capacidad de la habitación elegida antes de confirmar la reserva. (DEC-021)
- **RF-72:** DONDE la reserva incluya alojamiento, EL SISTEMA mostrará el total de viajeros del tour o paquete antes de confirmar la reserva. (DEC-021; junto con capacidad, sin exigir asignación nominativa)
- **RF-73:** CUANDO DMGoTravell recibe la solicitud de procesamiento de un pago antes de concluir los quince minutos iniciales, EL SISTEMA reconocerá ese intento como iniciado a tiempo. (DEC-020; abrir el checkout por sí solo no cumple esta condición)
- **RF-74:** CUANDO se cumplen quince minutos desde creación sin un pago iniciado, EL SISTEMA cancelará la reserva pendiente por vencimiento. (DEC-020; liberar según RF-32–RF-34 sin esperar otros cinco minutos)
- **RF-75:** MIENTRAS un pago de la reserva esté en verificación, EL SISTEMA rechazará la cancelación voluntaria solicitada por el cliente. (DEC-024; no bloquea el vencimiento automático al límite)
- **RF-76:** CUANDO Culqi rechaza un pago, EL SISTEMA registrará ese intento como rechazado. (DEC-024; antes de 15 no cancela toda la reserva; durante tolerancia aplica además RF-86; no confundir rechazo con resultado desconocido)
- **RF-77:** CUANDO se conoce el rechazo de un intento y aún queda ventana inicial de pago, EL SISTEMA permitirá otro intento para la misma reserva pendiente vigente. (DEC-024; sin reiniciar los quince minutos)
- **RF-78:** SI un cliente solicita consultar o cancelar una reserva ajena, ENTONCES EL SISTEMA responderá que el recurso no está disponible para ese cliente sin revelar información de la reserva. (DEC-022; no impide consulta administrativa autorizada)
- **RF-79:** DONDE la reserva incluya alojamiento, EL SISTEMA interpretará y mostrará los horarios asignados según la hora local de Perú. (DEC-023; la persistencia UTC permanece en la constitución)
- **RF-80:** CUANDO se calcula el componente de alojamiento, EL SISTEMA multiplicará la tarifa fija de la habitación por la cantidad de períodos completos de veinticuatro horas de la propuesta elegida. (DEC-018; una habitación, sin multiplicar otra vez por ocupantes)
- **RF-81:** DONDE exista una propuesta de alojamiento seleccionable, EL SISTEMA admitirá únicamente períodos cuya duración sea un múltiplo positivo de veinticuatro horas completas. (DEC-018; propuestas administradas en 007, cliente no cambia fechas/horas)

### Protección compartida con administración de capacidad

- **RF-82:** SI una reducción administrativa de cupos deja la capacidad de una salida turística por debajo de sus reservas y retenciones pendientes vigentes, ENTONCES EL SISTEMA rechazará esa reducción. (DEC-025; RF13, RN-07, AC07; administración detallada en 006)
- **RF-83:** SI una reducción administrativa del inventario de un hotel y tipo de habitación deja menos habitaciones que las comprometidas en el período afectado, ENTONCES EL SISTEMA rechazará esa reducción. (DEC-025; RF20, RN-11–RN-13, AC07; incluye retenciones pendientes vigentes; administración detallada en 007)

La reducción no elimina reservas ni bloqueos para hacer caber el nuevo total. Por ejemplo, dos habitaciones comprometidas permiten bajar un total de tres a dos, no a una. DEC-026 resuelve por separado la desactivación de un hotel.

- **RF-84:** CUANDO se desactiva un hotel, EL SISTEMA lo excluirá de las opciones seleccionables para nuevas reservas. (DEC-026; RF17, RN-01; administración detallada en 007)
- **RF-85:** CUANDO se desactiva un hotel, EL SISTEMA conservará las reservas ya creadas que lo incluyen sin cancelar ni liberar sus bloqueos por ese motivo. (DEC-026; incluye pending con sus condiciones y plazos originales; no prorroga pago/vencimiento)

### Rechazo definitivo durante tolerancia de pago

- **RF-86:** CUANDO se valida un rechazo definitivo del intento de pago durante los cinco minutos de tolerancia, EL SISTEMA cancelará la reserva pendiente en ese momento. (DEC-027; liberar una sola vez cupos/habitación según RF-32–RF-34 y auditar según RF-69; no esperar al minuto 20)

RF-86 no trata ausencia de respuesta ni timeout como rechazo definitivo. Resultado desconocido mantiene verificación y retenciones hasta resultado válido o límite acordado. Antes de terminar la ventana inicial se conservan RF-65/RF-77 para reintentar sin nueva reserva.

- **RF-87:** SI DMGoTravell recibe una nueva solicitud de pago al cumplirse exactamente quince minutos desde creación o después, ENTONCES EL SISTEMA rechazará ese nuevo intento para la reserva. (DEC-028; abrir checkout antes del corte no modifica la recepción)
- **RF-88:** CUANDO cambia la configuración de los plazos de pago o tolerancia, EL SISTEMA conservará los límites originales de las reservas ya creadas. (DEC-029; nueva configuración solo para nuevas reservas, sin reiniciar contadores ni reabrir canceladas)

### Última ronda: contigüidad, relación por salida y operaciones concurrentes

- **RF-89:** CUANDO una estancia comienza exactamente al terminar otra en la misma habitación, EL SISTEMA considerará compatibles esos extremos para consultar disponibilidad. (DEC-030; no margen de preparación ni tolerancia añadidos; las demás ocupaciones/bloqueos siguen aplicando)
- **RF-90:** CUANDO el cliente reserva una salida de tour o paquete, EL SISTEMA mostrará únicamente las propuestas hoteleras seleccionables asociadas a esa salida concreta. (DEC-031; no basta compartir tour/paquete en otra fecha)
- **RF-91:** SI la propuesta hotelera solicitada no está asociada a la salida turística seleccionada, ENTONCES EL SISTEMA rechazará crear esa reserva compuesta. (DEC-031; no omitir hotel ni crear bloqueos parciales)
- **RF-92:** CUANDO se desactiva una oferta, salida, tipo de habitación o propuesta hotelera, EL SISTEMA excluirá el elemento desactivado de la creación de nuevas reservas. (DEC-032; complementa RF-3–RF-4, RF-12 y RF-84)
- **RF-93:** CUANDO se desactiva una oferta, salida, tipo de habitación o propuesta hotelera, EL SISTEMA conservará las reservas ya creadas que lo incluyen con sus condiciones y plazos originales. (DEC-032; incluye pending; no cancelar/liberar solo por desactivación, ni ampliar vigencia)
- **RF-94:** SI la cancelación válida de una reserva fue registrada antes de un inicio de pago concurrente, ENTONCES EL SISTEMA rechazará ese inicio de pago posterior. (DEC-033; si el inicio válido fue primero aplica bloqueo de cancelación RF-75, sin dos resultados incompatibles)
- **RF-95:** CUANDO se valida un cobro después de una cancelación voluntaria ya aceptada, EL SISTEMA mantendrá la reserva cancelada. (DEC-033; no reactivar recursos; RF-37 conserva su alcance original de vencimiento)
- **RF-96:** CUANDO se valida un cobro después de una cancelación voluntaria ya aceptada, EL SISTEMA registrará el caso para devolución conforme al tratamiento acordado. (DEC-033, DEC-017; aviso y gestión manual en 002, no un reembolso automático)

### Umbral operativo de vencimiento

- **RF-97:** CUANDO vence una reserva pendiente según su límite aplicable, EL SISTEMA completará la cancelación automática como máximo sesenta segundos después del instante de vencimiento. (DEC-034; RF21, HU-20, RN-20; no modifica el corte de 15/20)
- **RF-98:** CUANDO vence una reserva pendiente según su límite aplicable, EL SISTEMA completará la liberación única de los recursos bloqueados como máximo sesenta segundos después del instante de vencimiento. (DEC-034; RF22, RN-21–RN-22; cupos y habitación si corresponde)

Este minuto es un máximo de ejecución automática, no otra tolerancia comercial. En el corte de 15/20 se aplican ya las prohibiciones de RF-64/RF-87; no confirmar por una cancelación aún en proceso. Cancelaciones voluntarias y rechazo definitivo siguen liberando al procesarse, sin esperar ese minuto.

### Entrada de página de historial inválida

- **RF-99:** SI el cliente solicita una página de historial inválida, ENTONCES EL SISTEMA mostrará «Número de página no válido». (DEC-035; RF10, HU-10; incluye página cero, negativa o texto)
- **RF-100:** SI el cliente solicita una página de historial inválida, ENTONCES EL SISTEMA evitará sustituirla automáticamente por otra página. (DEC-035; no devolver otra página como si fuera la solicitada)

### Página válida vacía y desempate del historial

- **RF-101:** CUANDO el cliente solicita una página válida de su historial sin reservas, EL SISTEMA devolverá una lista vacía para esa página. (DEC-036; RF10, HU-10)
- **RF-102:** CUANDO el cliente solicita una página válida de su historial sin reservas, EL SISTEMA mostrará «No hay reservas en esta página». (DEC-036)
- **RF-103:** CUANDO el cliente solicita una página válida de su historial sin reservas, EL SISTEMA tratará esa consulta como una consulta sin resultados, no como un error. (DEC-036; distingue RF-99)
- **RF-104:** CUANDO el cliente solicita una página válida de su historial sin reservas, EL SISTEMA mantendrá la página solicitada sin cambiar automáticamente a otra. (DEC-036)
- **RF-105:** CUANDO varias reservas del historial tienen el mismo instante de creación, EL SISTEMA las ordenará por su número único de reserva de mayor a menor. (DEC-037; solo desempate, no sustituye orden principal RF-57)

El orden definido por RF-57/RF-105 es estable para el mismo conjunto de reservas: no cambia aleatoriamente los empates al navegar por páginas. Esto no congela el historial frente a nuevas reservas. El formato y generación del número se resolverán en el plan, sin imponer aquí un esquema de datos.

Se aplica el orden de operaciones aceptadas que registra el sistema, no la hora de pulsación en navegador. Si el inicio válido se registra primero, el pago entra en verificación y la cancelación voluntaria se rechaza por RF-75. La garantía técnica de un único orden y liberación idempotente se concretará en el plan, sin elegir aquí algoritmos ni mecanismos de persistencia.

Inicio RF-73 y cancelación sin intento RF-74 están cerrados. DEC-028 fija ventanas excluyentes: recepción antes del corte de 15 y validación antes del corte de 20, medidos desde creación. En el corte exacto ya no se admite la operación correspondiente. El pago iniciado a tiempo en verificación conserva recursos durante tolerancia; no se cancela por cerrar la admisión al 15. No se añaden estados `expired`, `processing` o «pago en verificación». La ausencia de tolerancia hotelera no altera los cinco minutos técnicos de pago.

## Requisitos no funcionales

- **AC05 / RS05:** aislamiento entre clientes; las consultas y cambios utilizan la identidad autenticada para determinar propiedad (F04 AC05).
- **AC07:** ausencia de sobreventa y efectos parciales bajo concurrencia. La verificación debe incluir último cupo, última habitación y rollback completo de reserva compuesta (F04 AC07).
- **AC10:** la presentación distingue `pending`, `confirmed`, `completed` y `cancelled`; no muestra confirmación antes de que el sistema la determine. Se informan indisponibilidad, errores de validación y vencimiento según corresponda (F04 AC10).
- **AC09 / RF23 / RN-28:** DEC-015 concreta creación/cancelación/vencimiento, pagos validados y cambios administrativos de horarios/propuestas. En esta spec aplica RF-69; las otras acciones corresponden a 002/007/010. Auditoría no editable.
- **AC11:** las reglas y casos de uso deben admitir verificación aislada; las garantías de concurrencia requieren además comprobación de integración (F04 AC11).
- **Rendimiento:** las fuentes no fijan un objetivo cuantitativo de latencia específico para crear/cancelar reservas; no se inventa uno ni se extiende el objetivo aproximado de lecturas simples de AC01 a escrituras. El umbral operativo de vencimiento sí queda medido en RF-97/RF-98. La medición técnica de otros tiempos se tratará en el plan, sin afirmar un SLA no documentado.

Las restricciones transversales documentadas se conservan en la [constitución](../../constitution.md); su aplicación técnica se detallará en el plan después de aprobar esta spec.

## Casos límite

| Caso | Resultado conocido / criterio | Pendiente |
|---|---|---|
| Reserva sin hotel | No exige alojamiento; RF-10. | Ninguno para esa opcionalidad. |
| Último cupo o última habitación concurrente | Solo una solicitud obtiene el recurso; RF-8, RF-15. | Contrato exacto de errores se concreta tras aclaración. |
| Período de propuesta sin disponibilidad | Sin reserva/bloqueo parcial; informar y ofrecer otra propuesta; RF-14–RF-18, RF-47–RF-49. | No hay tolerancia hotelera; extremos contiguos compatibles por RF-89. |
| Fallo después de bloquear el tour | Sin reserva parcial ni bloqueo parcial del conjunto; RF-16–RF-18. | Diseño de la garantía en el plan. |
| Hotel desactivado tras crear una reserva | Conservar reserva, alojamiento y bloqueos; si está pending mantiene posibilidad de pago y sus plazos; RF-84–RF-85. | Resuelto por DEC-026; no prolonga vigencia ni elimina vencimiento. |
| Nueva reserva intenta seleccionar hotel ya desactivado | No seleccionable; RF-12, RF-84. | No confundir creación nueva con pago de una reserva existente. |
| Oferta/salida/tipo/propuesta desactivados independientemente | No admitir nuevas; mantener reservas creadas, incluidas pending con plazos normales; RF-92–RF-93. | Resuelto por DEC-032; no es cancelación por imposibilidad real del servicio. |
| Habitación con salida 12:00 y siguiente entrada 12:00 | Extremos compatibles, sin margen adicional; RF-89. | Resuelto por DEC-030; no permite ocupaciones que se solapen. |
| Mismo tour con salidas de dos fechas distintas | Mostrar solo propuestas asociadas a la salida elegida; RF-90–RF-91. | Resuelto por DEC-031; mismo hotel puede participar sin duplicar inventario. |
| Precio alterado por cliente o precio posterior cambiado | Importe oficial e histórico, PEN/dos decimales; RF-21–RF-23, RF-51–RF-53; tarifa por 24 horas RF-80. | No hay cálculo por noche ni tarifa por ocupante. |
| Propuesta con varias habitaciones o tipo ajeno al hotel | Una habitación, un tipo en un hotel; RF-11, RF-40. | No aceptar referencias inconsistentes como otra selección válida. |
| Grupo mayor a la capacidad de una habitación | Permitir elección para parte del grupo, mostrar capacidad y total de viajeros; RF-70–RF-72. | Resuelto por DEC-021; no autoriza exceder la capacidad física. |
| Habitación mayor al grupo | Permitida con tarifa fija sin rebaja; RF-41–RF-42. | No multiplicar nuevamente por ocupantes. |
| Propuesta de 24/48/72 horas o duración de 23 horas | Admitir múltiplos completos de 24 y calcular tarifa por cantidad de períodos; RF-80–RF-81. Una estancia de 23 horas no cumple. | Resuelto por DEC-018; sin tolerancia hotelera DEC-019. |
| Cambio de horarios tras reservar | Mantener los contratados; RF-44. | No volver a calcular historia con horarios actuales. |
| Admin reduce tres habitaciones a una con dos comprometidas | Rechazar ajuste; RF-83. Reducir a dos sí respeta el compromiso. | Resuelto por DEC-025; mismo principio para cupos de salida RF-82. |
| Cuenta ajena | Recurso no disponible sin revelar existencia/datos; RF-28, RF-30, RF-78. | Resuelto funcionalmente; mapeo HTTP en contrato posterior. |
| Cancelación repetida | Informa ya cancelada, sin segunda liberación; RF-34, RF-58. | Resuelto. |
| Cliente cancela reserva pagada | Rechazo de cancelación directa; RF-31. | ACL-02 para el flujo administrativo, fuera de esta spec. |
| Solicitud recibida minuto 14 y validación minuto 19 | Confirmar con recursos retenidos; RF-60–RF-62, RF-73. | Máximo total de 20, no 20 adicionales. |
| Cobro confirmado tras cancelar por vencimiento | Permanece cancelled; RF-37/DEC-001. Admin revisa e inicia devolución en máximo un día hábil; DEC-017. | Calendario, avisos/evidencia en 002, no plazo de abono. |
| Validación exactamente en minuto 20 o después con reserva aún pending por ejecución tardía del vencimiento | No confirmar; corresponde cancelar/liberar y devolución; RF-63–RF-64. | Cancelación/liberación en máximo 60 segundos desde vencimiento; RF-97–RF-98, no desde llegada del aviso tardío. |
| Reserva vence a las 10:20 con pago sin resultado válido | No confirmar desde las 10:20; cancelación y recursos liberados como máximo a las 10:21; RF-97–RF-98. | DEC-034 no amplía el plazo de pago ni garantiza recepción de Culqi en ese minuto. |
| Nuevo intento durante tolerancia o tras vencimiento | No permitido; RF-60, DEC-013. | No confundir tolerancia con prórroga para pagar. |
| Pago rechazado / resultado desconocido | Mantener pending vigente / mostrar verificación y bloquear otro intento; RF-65–RF-67. | Reintento permitido solo si rechazo conocido y queda ventana de pago. |
| Cliente cancela durante verificación | Rechazar cancelación voluntaria; RF-75. Vencimiento automático sigue aplicando. | DEC-033 resuelve orden concurrente; no vuelve a consultar esta precedencia. |
| Cancelación e inicio de pago concurrentes | Primera operación registrada gana; RF-94 y RF-75. Si cancelación primero, no iniciar pago; si inicio primero, no cancelar voluntariamente. | Un solo resultado sobre la reserva, sin doble liberación. |
| Cobro después de cancelación voluntaria aceptada | Mantener cancelled y registrar devolución; RF-95–RF-96. | Gestión manual acordada; detalles de aviso/calendario/evidencia en 002. |
| Rechazo antes del minuto 15 | Cerrar solo el intento; mantener reserva vigente y permitir reintento; RF-65, RF-76–RF-77. | No renovar ventana ni cancelar toda la reserva. |
| Rechazo definitivo en minuto 18 | Cancelar y liberar al recibirlo, sin esperar al minuto 20; RF-86, RF-32–RF-34. | Resuelto por DEC-027; no habilitar otro intento. |
| Timeout o resultado desconocido en minuto 18 | Mantener verificación y recursos hasta resultado válido o límite de 20; RF-61, RF-63, RF-66–RF-67. | No clasificar como rechazo por suposición. |
| Reserva sin ningún intento al minuto 15 | Cancelar y liberar en ese momento; RF-74. | Resuelto por DEC-020. |
| Solo abre Culqi antes de 15, sin solicitud recibida | No constituye inicio; cancelar/liberar a los 15; RF-73–RF-74. | Resuelto por DEC-020. |
| Solicitud recibida exactamente en minuto 15 | Rechazar nuevo intento; RF-87. | Resuelto por DEC-028; no influye haber abierto checkout antes. |
| Cambio de plazos con reservas ya creadas | Conservar ventana y tolerancia originales; RF-88. Nuevas reservas usan nueva configuración. | Resuelto por DEC-029; no requiere añadir pantalla de configuración a esta spec. |
| Historial vacío | Mostrar vacío sin error; RF-55. | Resuelto. |
| Página 0, negativa o texto | Mensaje «Número de página no válido», sin sustituir por otra página; RF-99–RF-100. | Resuelto por DEC-035; historial vacío no es una entrada inválida. |
| Página válida sin resultados, por ejemplo página tres si solo dos tienen reservas | Lista vacía y «No hay reservas en esta página», sin error ni cambio de página; RF-101–RF-104. | Resuelto por DEC-036. |
| Varias reservas creadas en el mismo instante | Desempatar por número único de reserva descendente; RF-105, manteniendo orden principal RF-57. | Resuelto por DEC-037; no exige números cronológicos para reservas de instantes distintos. |

## Fuera de alcance

Límites de **esta spec**, sin eliminar los requisitos globales:

- Procesamiento de pagos, validación de evidencia, devolución y comunicación al cliente previstas en DEC-001: 002. Las invariantes RF-35 y RF-37 siguen siendo obligatorias aquí.
- Ejecución automática del vencimiento: 003. Sus efectos deben concordar con la creación y liberación descritas aquí.
- Envío de comprobante: 004; acceso y perfil: 005/008.
- Administración de catálogo e inventario: 006/007; administración de reservas y cancelaciones pagadas: 009.
- Definición global de auditoría: 010; indicadores/reportes: 011; gestión multimedia: 012.
- No hay reserva exclusivamente hotelera, carrito de múltiples ofertas, selección libre de fechas hoteleras ni más de una habitación/tipo/hotel por reserva (DEC-005–DEC-007).
- Extensiones y su pago se gestionan directamente con el hotel, no en DMGoTravell (DEC-010). Informar condiciones no implica implementar seguimiento físico de entradas/salidas ni cobros automáticos de demora.
- No se agregan descuentos, penalidades o políticas de devolución sin fuente o aprobación explícita. DEC-001 aporta una decisión aprobada para el supuesto de cancelación por vencimiento.

## Criterios de finalización

### Cierre de la especificación

- Mantener correspondencia verificable entre cada criterio local y su RF/HU/RN de origen.
- Resolver o delimitar explícitamente las aclaraciones que afecten a alcance, cálculo, disponibilidad, plazos, ciclo de vida y resultados observables de esta spec. No interpretar aprobación funcional como cierre de un pendiente no contestado.
- Revisar coherencia con las funcionalidades dependientes, especialmente pagos y vencimiento.
- Solicitar y registrar la **aprobación explícita del usuario para esta versión**. Hasta entonces no crear `plan.md` ni `tasks.md`.

### Aceptación de una implementación futura

- Aportar evidencia de cumplimiento de todos los criterios aprobados, incluidos aislamiento, precio histórico, opcionalidad de alojamiento y cancelación repetida.
- Superar los casos críticos de concurrencia y ausencia de bloqueos/reservas parciales exigidos por AC07.
- Comprobar los escenarios de pago/vencimiento conforme a la política que se acuerde.

**PROPUESTA SDD:** usar la matriz de criterios locales como registro de evidencia de aceptación. No hay implementación ni verificaciones funcionales realizadas por esta actividad documental.

## Dudas abiertas

Registro completo y fuentes: [aclaraciones](../../aclaraciones.md).

### Pendientes funcionales propios

No quedan abiertas las preguntas de comportamiento de esta spec tratadas en la entrevista. ACL-03 cerrada por DEC-034; bordes del historial de ACL-15 cerrados por DEC-035–DEC-037. No reabrir demora, página vacía, página inválida o desempate como dudas pendientes. **Esta versión completa fue aprobada explícitamente el 2026-10-22**; las dependencias siguientes conservan sus pendientes.

### Pendientes de funcionalidades dependientes, no resueltos por aprobar 001

- **002 Pagos:** calendario de día hábil, avisos/evidencia de devolución, pagos excedentes y contrato oficial de integración (ACL-01/ACL-04).
- **004 Notificaciones:** contenido/formato del comprobante y reintentos (ACL-12).
- **006/007 Administración:** diseño detallado de publicación e inventario. No imponer entrada antes del tour ni cobertura mínima total: el acuerdo de esta spec es propuesta asociada a salida concreta y período asignado por admin (DEC-031), no una nueva desigualdad temporal.
- **005 Identidad:** políticas pendientes no se completan por inferencia (ACL-09/ACL-10).

**Cerrados:** contigüidad ACL-25, relación por salida ACL-07, desactivaciones ACL-08, precedencia de ACL-01, demora ACL-03 y bordes del historial ACL-15. Las ACL transversales conservan pendientes de otras funcionalidades; aprobar 001 no cierra todo el proyecto. La aprobación habilita pasar al plan y tareas de esta spec, respetando sus límites y resolviendo el diseño técnico sin aprobar por inferencia otras specs. Cualquier cambio de comportamiento posterior requiere revisión y aprobación de la spec afectada. Este registro no crea todavía plan/tareas ni autoriza código o cambios fuera de `sdd/`.

## Aprobación de esta especificación

- **Versión aprobada:** 0.13.
- **Solicitud presentada:** «¿Apruebas explícitamente la especificación 001 — Reservas del cliente, versión 0.13?».
- **Respuesta explícita del usuario:** «si».
- **Fecha de aprobación:** 2026-10-22.
- **Alcance de la aprobación:** contenido funcional completo de 001 v0.13, incluidos sus 105 criterios locales y límites/dependencias. No aprueba las specs 002–012 ni resuelve los pendientes técnicos o de otras funcionalidades por inferencia.
- **Decisiones de origen:** DEC-001–DEC-037; fuente, sustituciones y límites en decisiones.md/aclaraciones.md. La aprobación del documento es este acto explícito posterior, no la acumulación de respuestas de aclaración.
- **Cambios respecto a 0.12:** RF-101–RF-104 fijan página válida vacía sin error/cambio automático y RF-105 define desempate por número único descendente. Se conservan RF-1–RF-100 y se cierran las dudas funcionales propias del historial.
- **Efecto:** superado el requisito de aprobación previo al plan y tareas de 001. No se crean esos archivos en este registro; no se modifica código, documentación original ni Git. Cualquier cambio funcional posterior exige nueva revisión/aprobación.
