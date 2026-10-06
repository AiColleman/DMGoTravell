# 03. Requisitos funcionales

## Requisitos Funcionales

| ID | Requisito funcional |
| :--- | :--- |
| **RF01** | El sistema debe permitir consultar el catálogo público de ofertas turísticas activas sin necesidad de autenticación. |
| **RF02** | El sistema debe permitir consultar el detalle de una oferta activa, incluyendo su imagen, itinerario y disponibilidad. |
| **RF17** | El sistema debe permitir consultar el catálogo de hoteles activos, incluyendo detalle de habitaciones, precios por noche y disponibilidad. |
| **RF03** | El sistema debe permitir registrar clientes nuevos asignándoles el rol correspondiente y emitiendo un token de acceso. |
| **RF04** | El sistema debe permitir autenticar usuarios mediante correo y contraseña, o acceso social con Google. |
| **RF05** | El sistema debe permitir registrar una reserva turística en estado pendiente, validando que la fecha sea válida y existan cupos suficientes. |
| **RF18** | El sistema debe permitir al cliente generar una reserva simple (solo tour) o, de forma opcional, una reserva compuesta agregando alojamiento (tour + hotel) en un mismo flujo. |
| **RF06** | El sistema debe calcular y conservar el precio del servicio turístico multiplicando el precio vigente por la cantidad de personas. |
| **RF19** | El sistema debe calcular el precio total de forma dinámica: cobrando solo el tour (reserva simple), o sumando el costo del tour más el costo del hotel (tarifa × noches) para reservas compuestas. |
| **RF07** | El sistema debe permitir procesar el pago de la reserva integrando la pasarela de pagos Culqi (Tokenización de tarjeta y validación por Webhook). |
| **RF08** | El sistema debe enviar un comprobante de pago exitoso al correo del cliente mediante Resend y marcar la transacción en la BD para evitar envíos duplicados. |
| **RF09** | El sistema debe permitir al cliente consultar el historial de sus propias reservas con su estado actualizado y detalles de los servicios incluidos. |
| **RF10** | El sistema debe permitir al cliente cancelar exclusivamente sus propias reservas que se encuentren en estado pendiente, liberando los cupos correspondientes. |
| **RF11** | El sistema debe permitir al cliente actualizar sus datos básicos (nombre, teléfono) y solicitar la eliminación lógica de su cuenta. |
| **RF12** | El sistema debe permitir al administrador crear, modificar y retirar ofertas (servicios o paquetes) del catálogo. |
| **RF20** | El sistema debe permitir al administrador crear, modificar y desactivar hoteles, así como gestionar el inventario y tipos de sus habitaciones. |
| **RF13** | El sistema debe permitir al administrador consultar todas las reservas de la plataforma y cambiar sus estados siguiendo las transiciones válidas. |
| **RF14** | El sistema debe permitir al administrador consultar el listado de clientes registrados y visualizar los registros de auditoría del sistema. |
| **RF15** | El sistema debe permitir generar y descargar un PDF con el resumen de los indicadores y la actividad comercial mensual. |
| **RF16** | El sistema debe cancelar automáticamente las reservas pendientes que superen el tiempo límite mediante un proceso automatizado (Cronjob) para liberar cupos turísticos y habitaciones. |

## Relación entre HU y Requisitos Funcionales

| Historia de usuario | Requisitos funcionales relacionados |
| :--- | :--- |
| HU-01, HU-02 Explorar catálogo turístico | RF01, RF02 |
| HU-21 Explorar catálogo de hoteles | RF17 |
| HU-03, HU-04, HU-05 Autenticación e identidad | RF03, RF04 |
| HU-06, HU-22 Solicitar reserva (Simple o Compuesta) | RF05, RF18 |
| HU-07 Calcular total a pagar | RF06, RF19 |
| HU-08 Procesar pago de reserva (Culqi) | RF07 |
| HU-09 Notificación de comprobante (Resend) | RF08 |
| HU-10, HU-11, HU-12, HU-13 Gestión de cuenta y reservas | RF09, RF10, RF11 |
| HU-14, HU-15 Administrar ofertas turísticas | RF12 |
| HU-23 Administrar hoteles y habitaciones | RF20 |
| HU-16, HU-17, HU-18 Administrar reservas, auditoría y clientes | RF13, RF14 |
| HU-19 Consultar indicadores y exportar PDF | RF15 |
| HU-20 Cancelación automática de reservas (Cronjob) | RF16 |

## Reglas de negocio

| ID | Regla |
| :--- | :--- |
| **RN-01** | Solo las ofertas y hoteles marcados como activos pueden originar nuevas reservas en el sistema. |
| **RN-02** | La fecha solicitada para una reserva debe ser obligatoriamente igual o posterior a la fecha actual del servidor. |
| **RN-03** | Los cupos ocupados para tours se calculan sumando las reservas pendientes y confirmadas de la misma oferta (por persona) en la fecha específica. |
| **RN-07** | El control de cupos para hoteles se calcula estrictamente con base en **habitaciones disponibles por noche**, no por personas. |
| **RN-08** | Una reserva compuesta debe bloquear transaccionalmente tanto los cupos del servicio turístico como las habitaciones del hotel de forma simultánea. |
| **RN-09** | La vinculación de un hotel a una reserva es **estrictamente opcional**. La API no debe exigir un `hotel_id` para procesar exitosamente la reserva de un tour. |
| **RN-04** | Una reserva nace obligatoriamente en estado `pending` y permanece así hasta recibir la confirmación de pago (Webhook de Culqi) o la intervención manual del administrador. |
| **RN-05** | Las transiciones de estado de reserva son estrictas: `cancelled` y `completed` son estados terminales irreversibles. |
| **RN-06** | El registro de actividad (Auditoría) debe capturar el actor, la acción, la entidad afectada, la fecha y los valores anteriores/nuevos para cada modificación de catálogo o cambio de estado. |

## Ciclo de vida de la reserva

```mermaid
stateDiagram-v2
    [*] --> pending: Cliente crea reserva (Simple o Compuesta)
    pending --> confirmed: Pago validado (Webhook Culqi) o Admin confirma
    pending --> cancelled: Cliente cancela manualmente
    pending --> cancelled: Vencimiento de tiempo (Cronjob automático)
    confirmed --> completed: Admin completa (servicio finalizado)
    confirmed --> cancelled: Admin cancela (fuerza mayor o reembolso)
    completed --> [*]
    cancelled --> [*]