# 02. Historias de usuario

## Criterios de organización

Las historias se redactan a partir de las especificaciones y los flujos identificados en la nueva arquitectura del sistema. Los identificadores HU son propios de esta documentación. La prioridad **P1** corresponde al flujo esencial, **P2** a la operación y **P3** a supervisión o funciones complementarias. 

Los criterios describen el comportamiento esperado para la aceptación en producción; no representan resultados de pruebas ejecutadas, e incluyen la opcionalidad de módulos compuestos como alojamiento.

## Exploración y autenticación (Cliente)

| ID | Prioridad | Historia | Criterios de aceptación |
| --- | --- | --- | --- |
| HU-01 | P1 | Como cliente, quiero consultar las ofertas activas para conocer los servicios y paquetes disponibles sin necesidad de registrarme. | Sin token, la API devuelve un listado paginado; omite ofertas inactivas; admite el parámetro `type`. |
| HU-02 | P1 | Como cliente, quiero consultar el detalle de una oferta para decidir si se ajusta a mi viaje. | Una oferta activa devuelve sus datos; una inexistente o inactiva devuelve 404; se presenta la imagen asociada cuando existe. |
| HU-21 | P1 | Como cliente, quiero explorar el catálogo de hoteles para conocer las opciones de alojamiento y sus tarifas. | La API devuelve un listado de hoteles activos, con tipos de habitación, fotos, precio por noche y servicios incluidos. |
| HU-03 | P1 | Como cliente, quiero registrarme para realizar reservas vinculadas a mi cuenta. | Los datos válidos crean un usuario `client`; se entrega token de acceso; entradas inválidas generan un error de validación. |
| HU-04 | P1 | Como cliente, quiero iniciar y cerrar sesión para acceder a las funciones de mi perfil. | Credenciales válidas generan un token Sanctum; credenciales incorrectas se rechazan; logout revoca el token utilizado. |
| HU-05 | P2 | Como cliente, quiero ingresar con mi cuenta de Google para utilizar mi identidad existente y agilizar mi registro. | Se inicia el flujo OAuth; la identidad se vincula o registra localmente; se obtiene un token Sanctum. |

## Gestión de Reservas y Pagos (Cliente)

| ID | Prioridad | Historia | Criterios de aceptación |
| --- | --- | --- | --- |
| HU-06 | P1 | Como cliente autenticado, quiero reservar una oferta para una fecha y cantidad de personas. | La oferta está activa; fecha válida; cantidad > 0; hay cupos; se crea una reserva `pending` bloqueando el cupo temporalmente. |
| HU-22 | P1 | Como cliente, quiero tener la opción de agregar un hotel a mi reserva turística para consolidar mi viaje si lo necesito. | La selección de alojamiento es **opcional**. Si se selecciona, ambos servicios se unifican en una reserva compuesta bloqueando cupos turísticos y habitaciones simultáneamente. La API no exige `hotel_id` para procesar la reserva con éxito. |
| HU-07 | P1 | Como cliente, quiero conocer el precio total de mi reserva antes de pagar. | El backend calcula el total sumando el servicio turístico vigente (por persona) y, de existir, el costo del hotel (tarifa × noches). Rechaza montos manipulados desde el frontend. |
| HU-08 | P1 | Como cliente, quiero pagar mi reserva de forma segura con tarjeta para confirmar mi viaje al instante. | El checkout integra Culqi; el pago exitoso dispara un Webhook al backend; la API valida los fondos y cambia la reserva de `pending` a `confirmed`. |
| HU-09 | P1 | Como cliente, quiero recibir mi comprobante de pago en mi correo para tener un respaldo de la transacción. | Tras el Webhook de Culqi, el backend genera el recibo y lo envía vía Resend; se marca `comprobanteEnviado: true` en la BD para evitar envíos duplicados. |
| HU-10 | P1 | Como cliente, quiero consultar mi historial para conocer el estado de mis solicitudes. | La API retorna únicamente mis reservas con paginación; cada registro identifica oferta, hotel (si aplica), fecha, personas, importe y estado. |
| HU-11 | P1 | Como cliente, quiero cancelar una reserva pendiente si decido no concretar el pago. | La reserva me pertenece y está en `pending`; se cambia a `cancelled` y se liberan tanto los cupos turísticos como las habitaciones bloqueadas; no se pueden cancelar reservas `confirmed` desde el perfil. |
| HU-12 | P3 | Como cliente, quiero actualizar mi nombre y teléfono para mantener mis datos vigentes. | La API valida nombre obligatorio y teléfono opcional; actualiza al usuario autenticado. |
| HU-13 | P3 | Como cliente, quiero eliminar mi cuenta para dejar de utilizar el servicio. | La API revoca mis tokens y aplica borrado lógico de usuario; impide eliminar cuentas administrativas. |

## Administrador

| ID | Prioridad | Historia | Criterios de aceptación |
| --- | --- | --- | --- |
| HU-14 | P2 | Como administrador, quiero crear y editar ofertas para mantener actualizado el catálogo. | Se validan tipo `servicio` o `paquete`, precio no negativo, cupos y duración; se admiten itinerario e imagen; el cambio se audita. |
| HU-15 | P2 | Como administrador, quiero retirar una oferta del catálogo para impedir nuevas reservas. | Se marca `is_active=false` (ocultamiento lógico) para conservar las reservas históricas sin afectar la integridad referencial de la BD. |
| HU-23 | P2 | Como administrador, quiero registrar y gestionar hoteles y habitaciones para ofrecer opciones de estadía. | Permite crear perfiles de hoteles, definir tipos de habitación, establecer precios por noche y gestionar stock. |
| HU-16 | P2 | Como administrador, quiero consultar todas las reservas para organizar la operación del día. | La API devuelve reservas paginadas con cliente, oferta y hotel (si aplica); admite filtro por estado; la interfaz incluye búsqueda ágil. |
| HU-17 | P2 | Como administrador, quiero gestionar el estado operativo de las reservas para reflejar la realidad del servicio. | Las reservas pagadas (`confirmed` por el webhook de Culqi) pueden ser pasadas manualmente a `completed` una vez que el turista recibe el servicio, o a `cancelled` en caso de devoluciones. |
| HU-18 | P3 | Como administrador, quiero consultar clientes y auditoría para supervisar la actividad de la plataforma. | Obtengo lista de clientes y logs de sistema; requiere rol `admin`; la edición de logs está deshabilitada. |
| HU-19 | P3 | Como administrador, quiero consultar indicadores y descargar un PDF para analizar las ventas. | React calcula ingresos y ocupación desde los datos recibidos y permite la exportación visual a PDF. |

## Automatización operativa

**HU-20 — Liberar cupos de solicitudes vencidas (Cronjob), P2.** Como administrador del sistema, quiero que un proceso automático cancele las reservas no pagadas a tiempo para no bloquear disponibilidad a otros clientes.

- El **Sistema de Tareas (Cronjob)** se ejecuta periódicamente.
- Selecciona reservas en estado `pending` cuya fecha de creación supere el límite de tiempo (ej. 1 o 2 horas máximo para pagos online).
- Cambia el estado a `cancelled` automáticamente.
- Libera inmediatamente los cupos de los servicios turísticos y las habitaciones de hotel bloqueadas.
- Registra en auditoría la acción `reservation.auto_cancelled` con actor nulo/sistema.

## Casos de aceptación críticos

| Caso | Resultado esperado | Historias |
| --- | --- | --- |
| Cliente crea reserva solo de tour sin seleccionar hotel. | La API procesa la solicitud exitosamente; el campo `hotel_id` es estrictamente opcional. | HU-06, HU-22 |
| Un cliente intenta acceder a reportes de administrador. | Acceso denegado por rol (HTTP 403). | HU-04, HU-16 |
| Oferta con 10 cupos, 8 ocupados; se solicitan 3. | Rechazo por disponibilidad insuficiente. | HU-06 |
| Dos clientes solicitan los últimos cupos o habitaciones simultáneamente. | La transacción y el bloqueo de base de datos aseguran que solo un cliente logre la reserva en `pending`. | HU-06, HU-22 |
| Falla de red tras cobro exitoso en Culqi. | El Webhook de Culqi asegura que el backend reciba la confirmación de todas formas y envíe el correo vía Resend. | HU-08, HU-09 |
| El sistema intenta enviar el correo 2 veces por error. | El flag `comprobanteEnviado: true` lo impide. | HU-09 |
| Un cliente intenta cancelar una reserva `confirmed`. | La API rechaza la operación (HTTP 422). | HU-11 |
| Reserva `pending` cumple su tiempo límite sin pago. | El Cronjob la cambia a `cancelled` y libera tanto el cupo del tour como el de la habitación (si aplicaba). | HU-20 |