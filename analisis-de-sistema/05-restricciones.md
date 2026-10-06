# 05. Restricciones del sistema


## Definición y alcance

Una restricción limita las alternativas de diseño o el comportamiento permitido. Aquí se distinguen las restricciones declaradas por el proyecto de las reglas efectivamente observadas. Las diferencias se registran para evitar presentar una intención documental como un cumplimiento demostrado.


Identificar las **restricciones** que condicionan las decisiones de diseño y arquitectura del sistema.

| ID | Restricción | Descripción |
| :--- | :--- | :--- |
| **RC01** | Aplicación web | El sistema debe desarrollarse como una aplicación accesible mediante un navegador web. El frontend cliente y administrativo se construirá en React. |
| **RC02** | Control de versiones | El código fuente debe gestionarse utilizando Git y mantenerse en un repositorio compartido. |
| **RC03** | API REST | La comunicación entre el frontend y los servicios del sistema debe realizarse mediante una API REST. Esta comunicación utilizará exclusivamente formato JSON. |
| **RC04** | Pasarela de pago | El sistema debe integrarse con una pasarela de pago externa para procesar las operaciones de pago. En este caso, la integración obligatoria es con Culqi (tokenización y webhooks). |
| **RC05** | Servicio de notificaciones | El sistema debe integrarse con un servicio externo de envío para gestionar la información relacionada con la entrega de los comprobantes de pago digitales al correo del cliente, utilizando estrictamente la API de Resend. |
| **RC06** | Framework y Arquitectura | El backend debe desarrollarse obligatoriamente bajo una arquitectura monolítica utilizando el framework .NET (ASP.NET Core), limitando la creación de microservicios externos. |
| **RC07** | Motor de Base de Datos | La persistencia de datos relacionales, transacciones y bloqueos de concurrencia deben ejecutarse exclusivamente sobre PostgreSQL utilizando Entity Framework Core como ORM. |
| **RC08** | Protocolo de Seguridad | La autenticación de la API REST debe implementarse utilizando JSON Web Tokens (JWT) sin estado. No se permite el uso de sesiones basadas en cookies de servidor para la comunicación entre React y .NET. |
| **RC09** | Tareas en Segundo Plano | Los procesos asíncronos, como la cancelación de reservas vencidas (Cronjob), deben ejecutarse dentro del mismo proceso del monolito utilizando `BackgroundService` o herramientas compatibles con .NET (como Hangfire), sin depender de programadores de tareas del sistema operativo (cron de Linux). |