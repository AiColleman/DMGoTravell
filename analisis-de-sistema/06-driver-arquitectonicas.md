# 06. Drivers arquitectónicos

## Propósito

Los drivers son las necesidades técnicas, operativas y de negocio que moldean profundamente la estructura del sistema. Esta síntesis se deriva del dominio de reservas turísticas (tours y hoteles), los atributos de calidad (AC) y las restricciones del sistema (RC) establecidas para la arquitectura en .NET y PostgreSQL.

## Objetivos de negocio

*   Centralizar la oferta turística y hotelera en un catálogo unificado.
*   Facilitar al cliente la reserva compuesta (tour + alojamiento) y el pago automatizado.
*   Garantizar a la agencia el control exacto de cupos, evitando la sobreventa.
*   Automatizar flujos operativos (cancelaciones, correos) para reducir la carga administrativa.

## Matriz de drivers arquitectónicos

| ID | Driver arquitectónico | Origen | ¿Por qué influye en la arquitectura? |
| :--- | :--- | :--- | :--- |
| **DA01** | El sistema debe soportar un incremento importante de usuarios durante campañas comerciales. | AC03 - Escalabilidad | Puede influir en la estrategia de escalamiento y despliegue. Obliga a diseñar un monolito sin estado (stateless) que pueda replicarse fácilmente. |
| **DA02** | El sistema debe mantener tiempos de respuesta adecuados durante una alta concurrencia. | AC01 - Rendimiento | Puede influir en la comunicación entre componentes, procesamiento y almacenamiento. Requiere el uso de cachés en memoria (`IMemoryCache` de .NET) para el catálogo. |
| **DA03** | El sistema debe proteger los datos de usuarios y operaciones de compra. | AC04 - Seguridad | Puede influir en autenticación, autorización y protección de datos. Exige el uso de JWT centralizado y encriptación de datos sensibles. |
| **DA04** | El sistema debe integrarse con una pasarela de pago externa para procesar las operaciones de pago. | RC04 - Pasarela de pago | Condiciona la forma de comunicación e infraestructura de red, requiriendo endpoints públicos seguros para recibir webhooks asíncronos de Culqi. |
| **DA05** | El sistema debe evitar estrictamente la sobreventa de cupos turísticos y habitaciones. | AC07 - Integridad y Concurrencia | Define el modelo de persistencia; obliga a usar transacciones con bloqueos de fila (`IsolationLevel`) en PostgreSQL mediante Entity Framework Core. |
| **DA06** | El sistema debe automatizar la liberación de cupos de reservas no pagadas. | RC09 - Tareas en Segundo Plano | Exige integrar mecanismos de procesamiento en background (ej. `BackgroundService` en ASP.NET Core) que operen sin bloquear el hilo principal de peticiones HTTP. |
| **DA07** | El sistema debe notificar al usuario sobre su comprobante de manera asíncrona y segura. | RC05 - Servicio de notificaciones | Introduce la necesidad de gestionar fallos de red hacia la API de Resend y aplicar un control de idempotencia (`comprobanteEnviado`) en la base de datos. |

## Driver principal: Integridad transaccional de la reserva compuesta

La reserva es el núcleo del negocio y ahora enlaza de forma opcional servicios turísticos y habitaciones de hotel en una misma transacción. Una inconsistencia aquí genera pérdida de dinero o sobreventa. Por ello, la arquitectura exige que el bloqueo de cupos de tours y el inventario de hoteles se ejecute bajo una única transacción ACID en PostgreSQL. Si cualquiera de las dos validaciones falla, se debe aplicar un `Rollback` completo.

## Tensiones arquitectónicas

| Tensión | Situación actual | Criterio de resolución |
| :--- | :--- | :--- |
| **Rendimiento vs. Consistencia de Cupos** | Se necesita leer el catálogo rápido, pero los cupos cambian cada segundo. | Cachear únicamente los datos descriptivos del catálogo (textos, fotos, precios base). El cálculo de cupos siempre debe consultar directamente a PostgreSQL. |
| **Monolito vs. Tareas asíncronas pesadas** | El Cronjob de cancelación (vencimiento de reservas) corre en el mismo servidor que la API web. | Utilizar hilos separados (`IHostedService`) y controlar el uso de CPU. Si el tráfico crece, este proceso deberá extraerse a un worker externo. |
| **Acoplamiento vs. Manejo de Webhooks** | El estado de la reserva depende de una llamada externa (Culqi) que puede demorar o fallar. | Separar la intención de compra (reserva `pending`) de la confirmación (reserva `confirmed`). El Webhook solo actualiza el estado, no procesa lógica de carrito. |
| **Eliminación vs. Integridad referencial** | Se requiere desactivar hoteles u ofertas, pero hay reservas históricas atadas a ellos. | Implementar Global Query Filters en EF Core para un borrado lógico estricto (`IsDeleted = true`), manteniendo las llaves foráneas intactas en la base de datos. |