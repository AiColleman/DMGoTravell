# 09. Estilo Arquitectónico

La estructura global del sistema DMGOTRAVEL se define mediante una combinación de estilos arquitectónicos que abordan tanto la distribución física de los componentes (despliegue) como la organización interna del código fuente (diseño de software). 

El sistema adopta principalmente un estilo **Cliente-Servidor** distribuido a nivel de red, soportado por un backend estructurado como un **Monolito Modular** basado en los principios de la **Arquitectura Limpia (Clean Architecture)** y el patrón **CQRS**.

## 1. Estilo Cliente-Servidor (Desacoplamiento físico)

La arquitectura divide claramente las responsabilidades de interfaz de usuario y procesamiento de negocio en dos nodos físicos distintos que se comunican exclusivamente a través de la red (HTTP/REST):

*   **Cliente (Frontend):** Una Single Page Application (SPA) en React. Es responsable de la renderización del lado del cliente, el enrutamiento de la interfaz, el manejo del estado global y la captura de eventos del usuario. Se despliega de forma independiente en una red de entrega de contenido (Vercel + Cloudflare).
*   **Servidor (Backend API):** Un servicio centralizado en ASP.NET Core que expone endpoints RESTful. Es responsable de la validación de reglas de negocio, persistencia de datos, seguridad, integración con pasarelas (Culqi) y tareas asíncronas (Hangfire).

## 2. Monolito Modular (Estrategia de Despliegue)

A nivel de despliegue, el backend huye de la micro-segmentación (microservicios) para evitar latencias de red interna y complejidad operativa. Todo el código del servidor se compila y despliega en **un único proceso (Monolito)** dentro de un contenedor Docker en Render. 

Sin embargo, internamente el código está fuertemente cohesionado en **módulos lógicos** (Catálogo, Reservas, Pagos, Usuarios). Si en el futuro un módulo requiere escalar independientemente, la separación lógica ya existe, facilitando la extracción a un microservicio.

## 3. Clean Architecture (Estructura interna del Monolito)

Para garantizar la mantenibilidad (ADR-002), el código fuente del backend en .NET se organiza en anillos concéntricos o capas con una **Regla de Dependencia estricta**: las capas exteriores dependen de las interiores, pero las interiores no saben nada de las exteriores.

| Capa | Responsabilidad | Tecnologías y Patrones |
| :--- | :--- | :--- |
| **1. Dominio (Core)** | Contiene las reglas empresariales puras y universales. No tiene dependencias externas. | Entidades (Tour, Hotel, Reservation), Value Objects, Enums, Interfaces de Repositorios. |
| **2. Aplicación** | Contiene los casos de uso específicos del sistema. Orquesta el flujo de datos usando las entidades del dominio. | Casos de uso (Handlers), Interfaces de servicios externos (Email, Storage), DTOs, Validaciones (FluentValidation). |
| **3. Infraestructura** | Implementa los detalles técnicos, persistencia y comunicación externa definidos por las interfaces de la capa de Aplicación. | Entity Framework Core, Npgsql (Supabase), Hangfire, Clientes HTTP (Culqi, Resend), AWS SDK (Cloudflare R2). |
| **4. Presentación** | Punto de entrada del sistema. Recibe peticiones HTTP, enruta y devuelve respuestas JSON estándar. | Controladores API REST (ASP.NET Core), Middleware de manejo de excepciones, Filtros de Autenticación (JWT). |

## 4. Patrón CQRS (Segregación de Responsabilidades)

Dentro de la capa de **Aplicación**, DMGOTRAVEL implementa el patrón *Command and Query Responsibility Segregation* utilizando la librería MediatR.

*   **Commands (Comandos):** Operaciones que mutan el estado del sistema (ej. `CrearReservaCommand`, `ConfirmarPagoCommand`). Utilizan el ORM para aplicar validaciones transaccionales y bloqueos de concurrencia.
*   **Queries (Consultas):** Operaciones que solo leen datos (ej. `ObtenerCatalogoQuery`, `ObtenerHistorialReservasQuery`). Se optimizan para lecturas rápidas, apoyándose en la caché en memoria (`IMemoryCache`) y evitando la carga de relaciones innecesarias.

## Diagrama de la Arquitectura Limpia (.NET)
![Arquitectura del monolito DMGOTRAVEL](./imagenes/DMGOTRAVEL-arquitectura-monolito.png)