# 08. Arquitectura inicial

A partir de las decisiones documentadas (Monolito en .NET, React, PostgreSQL y Clean Architecture), la arquitectura inicial del sistema se organiza separando claramente las responsabilidades. La siguiente estructura clasifica los componentes lógicos y físicos del proyecto tomando como referencia los grupos principales de diseño.

| Grupo | Elementos | Descripción en la arquitectura DMGOTRAVEL |
| :--- | :--- | :--- |
| **Actores** | Cliente, Administrador | Los usuarios que interactúan con el sistema mediante la interfaz de usuario. (Se omite el rol *Seller* por no aplicar al modelo de negocio de agencia centralizada). |
| **Presentación** | Aplicación Web, API REST | **Aplicación Web:** SPA construida en React y alojada en Vercel.<br>**API REST:** Monolito desarrollado en ASP.NET Core y desplegado en Render. |
| **Negocio** | Usuarios, Catálogo, Reservas | Los módulos principales (reemplazando *Carrito y Pedidos* por **Reservas** de tours y hoteles). La lógica se implementa usando el patrón CQRS (MediatR) y las tareas asíncronas con Hangfire. |
| **Datos** | Base de datos, Almacenamiento multimedia | **Base de datos:** Motor relacional PostgreSQL alojado en Supabase con Connection Pooling.<br>**Almacenamiento:** Cloudflare R2 para las imágenes del catálogo. |
| **Sistemas externos** | Pasarela de pago, Servicio de envío, Red / DNS | **Pasarela de pago:** Integración con Culqi para tokenización y recepción de Webhooks.<br>**Servicio de envío:** Integración con la API de Resend para comprobantes.<br>**Red:** Cloudflare (CDN/WAF) y Namecheap (Dominio). |

## Diagrama de la Arquitectura de Despliegue

El siguiente esquema refleja cómo interactúan estos grupos de elementos en el entorno de producción definido en las decisiones arquitectónicas (ADR):

```mermaid
flowchart TD
    %% Actores
    Cliente((Cliente))
    Admin((Administrador))

    %% Capa Perimetral y Presentación (Frontend)
    subgraph Edge ["Capa Perimetral (Edge & CDN)"]
        CF[Cloudflare CDN / WAF]
    end

    subgraph Presentacion ["Presentación (Vercel)"]
        React[SPA React]
    end

    %% Capa de Negocio (Backend)
    subgraph Negocio ["Monolito API (Render)"]
        API[API REST ASP.NET Core]
        Hangfire[Hangfire Background Service]
        API --- Hangfire
    end

    %% Capa de Datos
    subgraph Datos ["Capa de Datos y Medios"]
        DB[(PostgreSQL - Supabase)]
        R2[(Cloudflare R2 - Imágenes)]
    end

    %% Sistemas Externos
    subgraph Externos ["Sistemas Externos"]
        Culqi[Culqi API / Webhooks]
        Resend[Resend API - Correos]
    end

    %% Relaciones
    Cliente --> CF
    Admin --> CF
    CF --> React
    React -->|Peticiones JSON / JWT| API
    
    API -->|CQRS Lectura/Escritura| DB
    Hangfire -->|Lectura/Actualización de estados| DB
    API -->|Subida/Lectura| R2
    
    API -->|Validación de firmas| Culqi
    Culqi -->|Webhook de pago| API
    
    API -->|Envío de recibos| Resend