# 02. Historias de usuario

## Propósito

Este documento define las historias de usuario de DMGOTRAVEL y sus criterios de aceptación.

Las historias están organizadas por prioridad:

- **P1:** flujo esencial del negocio.
- **P2:** operación administrativa y soporte del negocio.
- **P3:** supervisión, mantenimiento y funciones complementarias.

Los criterios de aceptación describen el comportamiento esperado del sistema y sirven como base para requisitos, endpoints, casos de uso y pruebas.

---

# 1. Exploración y autenticación

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-01** | P1 | Como visitante, quiero consultar las ofertas activas para conocer los servicios y paquetes disponibles sin registrarme. | La API permite acceso anónimo; devuelve resultados paginados; excluye ofertas inactivas o eliminadas lógicamente; permite filtrar por tipo. |
| **HU-02** | P1 | Como visitante, quiero consultar el detalle de una oferta para decidir si se ajusta a mi viaje. | Una oferta activa devuelve descripción, precio base, duración, itinerario, imágenes y datos de disponibilidad; una oferta inexistente o no visible devuelve `404`. |
| **HU-21** | P1 | Como visitante, quiero explorar hoteles para conocer opciones de alojamiento, servicios y tarifas. | La API devuelve hoteles activos con sus tipos de habitación, imágenes, servicios, tarifa base y disponibilidad consultable. |
| **HU-03** | P1 | Como cliente, quiero registrarme para realizar reservas asociadas a mi cuenta. | Datos válidos crean una cuenta con rol `client`; la contraseña se almacena de forma segura; se retorna autenticación válida según la política JWT; entradas inválidas retornan errores de validación. |
| **HU-04** | P1 | Como cliente, quiero iniciar y cerrar sesión para acceder de forma segura a mis funciones privadas. | Credenciales válidas permiten obtener un token de acceso; credenciales incorrectas son rechazadas; el cierre de sesión invalida o revoca los mecanismos reutilizables definidos por la estrategia de autenticación. |
| **HU-05** | P2 | Como cliente, quiero iniciar sesión con Google para utilizar una identidad existente. | Se ejecuta el flujo OAuth; la identidad validada se vincula o crea localmente; el backend emite los tokens propios de DMGOTRAVEL; no se duplican cuentas por correo. |

---

# 2. Reservas y disponibilidad

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-06** | P1 | Como cliente autenticado, quiero reservar un servicio turístico para una fecha y cantidad de personas. | La salida o fecha seleccionada existe y está activa; la cantidad es mayor que cero; existen cupos suficientes; la operación es transaccional; se crea una reserva `pending`; los cupos quedan bloqueados temporalmente. |
| **HU-22** | P1 | Como cliente, quiero agregar alojamiento opcional a mi reserva turística para consolidar mi viaje. | El alojamiento no es obligatorio. Cuando se selecciona, deben indicarse hotel, tipo de habitación, `checkIn`, `checkOut` y cantidad de habitaciones; la disponibilidad turística y hotelera se valida dentro de una única operación transaccional. |
| **HU-07** | P1 | Como cliente, quiero conocer el precio total antes de pagar. | El backend calcula el total utilizando los precios vigentes; el cliente no puede imponer el importe; el precio utilizado queda registrado como valor histórico de la reserva. |
| **HU-10** | P1 | Como cliente, quiero consultar mi historial de reservas. | La API retorna únicamente reservas pertenecientes al usuario autenticado; incluye estado, fecha, oferta, alojamiento opcional, cantidades e importes; admite paginación. |
| **HU-11** | P1 | Como cliente, quiero cancelar una reserva pendiente que ya no deseo pagar. | La reserva pertenece al usuario; solo puede cancelarse si está `pending`; se liberan cupos y alojamiento bloqueado; la operación es idempotente. |

---

# 3. Pagos y notificaciones

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-08** | P1 | Como cliente, quiero pagar mi reserva mediante Culqi para confirmar mi viaje. | La reserva existe, pertenece al cliente y está `pending`; el backend utiliza el importe almacenado; se registra el intento de pago; el estado `confirmed` solo se alcanza después de validar un pago exitoso; eventos duplicados no generan doble confirmación ni doble cargo lógico. |
| **HU-09** | P1 | Como cliente, quiero recibir un comprobante por correo después de un pago exitoso. | Tras confirmar el pago, se genera una notificación; Resend procesa el envío; el intento queda registrado; reintentos no deben producir duplicados. |

---

# 4. Gestión de perfil

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-12** | P3 | Como cliente, quiero actualizar mis datos básicos. | El usuario solo modifica campos permitidos; se validan los datos; la operación afecta únicamente su cuenta. |
| **HU-13** | P3 | Como cliente, quiero solicitar la eliminación de mi cuenta. | Se aplica borrado lógico; se mantienen reservas, pagos y auditoría histórica; se invalidan los mecanismos de autenticación reutilizables; una cuenta administrativa no se elimina mediante este flujo. |

---

# 5. Administración del catálogo turístico

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-14** | P2 | Como administrador, quiero crear y editar ofertas para mantener actualizado el catálogo. | Se validan tipo, título, precio base, duración, condiciones y datos requeridos; se registran cambios críticos en auditoría. |
| **HU-15** | P2 | Como administrador, quiero retirar una oferta para impedir nuevas reservas. | Se aplica desactivación o borrado lógico; las reservas históricas mantienen su integridad; la oferta deja de aparecer públicamente. |

---

# 6. Administración hotelera

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-23** | P2 | Como administrador, quiero gestionar hoteles, tipos de habitación e inventario para ofrecer alojamiento. | Permite crear y actualizar hoteles; administrar tipos de habitación; establecer precios; gestionar inventario por fecha; desactivar registros sin romper reservas históricas. |

---

# 7. Administración de reservas y operación

| ID | Prioridad | Historia | Criterios de aceptación |
|---|---|---|---|
| **HU-16** | P2 | Como administrador, quiero consultar todas las reservas para organizar la operación. | La API devuelve datos paginados; permite filtrar por estado y otros criterios definidos; requiere rol `admin`. |
| **HU-17** | P2 | Como administrador, quiero gestionar el estado operativo de las reservas confirmadas. | Una reserva `confirmed` puede pasar a `completed` cuando el servicio finaliza; una cancelación posterior al pago debe seguir la política de devolución definida; no se permite `pending → confirmed` manualmente sin pago validado. |
| **HU-18** | P3 | Como administrador, quiero consultar clientes y auditoría para supervisar la plataforma. | Requiere rol `admin`; los registros de auditoría son solo lectura; las consultas deben permitir trazabilidad de operaciones críticas. |
| **HU-19** | P3 | Como administrador, quiero consultar indicadores y exportar un reporte para analizar la operación. | Los indicadores oficiales son calculados por el backend a partir de datos persistidos; React únicamente presenta los resultados; el reporte puede exportarse a PDF. |

---

# 8. Automatización operativa

## HU-20 — Liberar reservas vencidas

**Prioridad:** P2.

**Historia:** Como responsable de la operación, quiero que el sistema cancele automáticamente las reservas pendientes cuyo plazo de pago haya vencido para liberar disponibilidad.

### Criterios de aceptación

- Hangfire ejecuta periódicamente el trabajo.
- El plazo máximo de una reserva pendiente se obtiene desde configuración.
- Solo se procesan reservas `pending`.
- La transición final es `cancelled`.
- Se liberan los cupos turísticos bloqueados.
- Se libera el inventario hotelero cuando corresponda.
- Se registra la acción `reservation.auto_cancelled`.
- El trabajo es idempotente.
- Una reserva `confirmed`, `completed` o `cancelled` no debe ser modificada por este proceso.

---

# 9. Casos de aceptación críticos

| Caso | Resultado esperado | Historias |
|---|---|---|
| Reserva sin hotel | La operación se procesa correctamente sin requerir alojamiento. | HU-06, HU-22 |
| Reserva con hotel | Tour y alojamiento se validan y bloquean dentro de la misma transacción lógica. | HU-06, HU-22 |
| Cupos insuficientes | La reserva se rechaza sin realizar bloqueos parciales. | HU-06 |
| Dos clientes solicitan el último cupo | Solo una transacción puede confirmar el bloqueo; la otra recibe indisponibilidad. | HU-06 |
| Dos clientes solicitan la última habitación | Solo una transacción puede bloquear el inventario correspondiente. | HU-22 |
| Cliente modifica el precio desde el frontend | El backend ignora el importe recibido y utiliza el precio vigente persistido. | HU-07 |
| Pago exitoso con respuesta tardía | El estado se reconcilia mediante el mecanismo oficial de Culqi y el procesamiento idempotente. | HU-08 |
| Webhook duplicado | El evento no genera una segunda confirmación ni notificaciones duplicadas. | HU-08, HU-09 |
| Cliente cancela una reserva `confirmed` | La operación directa se rechaza; debe utilizarse el flujo administrativo/política de devolución. | HU-11, HU-17 |
| Reserva pendiente vence | Hangfire cambia el estado a `cancelled` y libera disponibilidad. | HU-20 |
| Cliente intenta consultar reserva ajena | El backend responde con acceso denegado o recurso no disponible según la política de seguridad. | HU-10 |
| Cliente accede a endpoint administrativo | Respuesta `403 Forbidden`. | HU-16, HU-18, HU-19 |

---

# 10. Criterios transversales

Todas las historias deben cumplir:

- validación de entrada;
- autorización por rol cuando corresponda;
- aislamiento por usuario;
- respuesta JSON consistente;
- auditoría de operaciones críticas;
- manejo global de errores;
- operaciones transaccionales en procesos de reserva;
- protección frente a procesamiento duplicado en pagos y tareas;
- borrado lógico donde se requiera conservar historial.

