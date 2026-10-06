# Actores del sistema

A continuación se definen los actores que interactúan con el sistema DMGOTRAVEL, incluyendo usuarios humanos, sistemas externos y procesos automatizados necesarios para la operación en un entorno de producción.

## Resumen de Actores

| Actor | ¿Qué necesita realizar? | 
| ----- | ----- | 
| **Cliente** | Conocer la oferta turística, solicitar y gestionar sus reservas, realizar el pago de las mismas, y administrar sus datos personales. | 
| **Administrador** | Mantener el catálogo actualizado, controlar la operación de reservas, gestionar estados y consultar indicadores o auditorías. | 
| **Pasarela de Pago (Culqi)** | Procesar de manera segura las transacciones de pago con tarjeta y notificar al sistema la confirmación de los fondos. | 
| **Google** | Proveer la identidad del usuario de manera segura para permitir el acceso mediante autenticación social. | 
| **Resend** | Enviar de manera automatizada y única los comprobantes de pago exitoso al correo electrónico de los clientes. | 
| **Sistema de Tareas (Cronjob)** | Proceso automatizado interno que audita y cancela periódicamente las reservas pendientes que han superado el tiempo límite de pago. | 

## Descripción Detallada y Responsabilidades

### Cliente

* **Tipo:** Humano, primario.
* **Descripción:** Es el usuario final del sistema. Puede ser alguien que explora la plataforma de forma anónima o alguien ya registrado (con el rol `client` o vía Google). Su objetivo es explorar el catálogo, concretar y hacer seguimiento a sus viajes.
* **Responsabilidades y límites:**
  * Accede al catálogo público para consultar detalles de las ofertas (título, descripción, precio, capacidad, duración).
  * Debe autenticarse para solicitar reservas para las ofertas activas en fechas disponibles.
  * Realiza el proceso de pago a través del checkout integrado.
  * Consulta el historial de sus propias reservas y tiene permisos para cancelar exclusivamente aquellas que se encuentren en estado `pending`.
  * Recibe en su correo electrónico un comprobante de pago exitoso tras completar el proceso de reserva y cobro.
  * Puede actualizar sus datos básicos (nombre y teléfono) y solicitar la eliminación lógica de su cuenta.

### Administrador

* **Tipo:** Humano, primario.
* **Descripción:** Es el usuario encargado del back-office y la gestión operativa de DMGOTRAVEL. Accede a través de rutas protegidas específicas para su rol (`role:admin`).
* **Responsabilidades y límites:**
  * Crea, actualiza y gestiona el catálogo de servicios o paquetes (precios, cupos, duración e itinerarios).
  * Revisa las reservas de todos los clientes, monitorea los estados y aplica las transiciones válidas de forma manual si se requiere.
  * Consulta la lista de clientes, revisa los registros de auditoría y exporta resúmenes administrativos e indicadores a PDF.
  * *Límite:* No existe un registro público para este rol; las cuentas administrativas deben ser provisionadas internamente.

### Pasarela de Pago (Culqi)

* **Tipo:** Sistema externo, secundario.
* **Descripción:** Servicio de terceros encargado de procesar los cobros de las reservas mediante tarjetas de crédito o débito directamente en la plataforma.
* **Responsabilidades y límites:**
  * Recibe los datos de pago tokenizados desde el frontend.
  * Valida y procesa la transacción de cobro, comunicándose con las redes financieras.
  * Devuelve una respuesta al cliente en el frontend y, de manera asíncrona y segura, emite un evento (*Webhook*) al backend de Laravel para confirmar la captura de fondos y habilitar la generación del comprobante.

### Google

* **Tipo:** Sistema externo, secundario.
* **Descripción:** Proveedor de identidad que facilita el acceso rápido y seguro a la plataforma mediante el flujo de Social Login (OAuth).
* **Responsabilidades y límites:**
  * Autentica al usuario en sus propios servidores y solicita su consentimiento para compartir datos básicos (email, nombre).
  * Devuelve la identidad al backend (mediante Laravel Socialite) tras el callback exitoso.

### Resend

* **Tipo:** Sistema externo, secundario.
* **Descripción:** Plataforma de servicio de correo transaccional utilizada para enviar notificaciones críticas y documentos, específicamente los comprobantes de pago, a los clientes.
* **Responsabilidades y límites:**
  * Recibe la petición desde el backend una vez que el sistema confirma vía webhook que el pago (vía Culqi) fue exitoso.
  * Toma el documento generado por el backend (comprobante en HTML o archivo PDF) y lo envía a la dirección de correo electrónico asociada al cliente.
  * *Límite / Control interno:* Su ejecución depende del backend, el cual asegura un envío único al registrar la marca `comprobanteEnviado: true` en la base de datos tras la solicitud, evitando que el cliente reciba correos duplicados por reintentos o errores.

### Sistema de Tareas (Cronjob / Laravel Scheduler)

* **Tipo:** Proceso interno automatizado.
* **Descripción:** Tarea en segundo plano programada en el servidor que reemplaza la intervención manual para el mantenimiento de la integridad de los datos de las reservas.
* **Responsabilidades y límites:**
  * Se ejecuta periódicamente (ej. cada hora o según la regla de negocio) revisando la base de datos de DMGOTRAVEL.
  * Identifica las reservas en estado `pending` cuyo tiempo límite para realizar el pago ha expirado.
  * Ejecuta la cancelación automática (`cancelled`), liberando así los cupos para que otros clientes puedan reservar.