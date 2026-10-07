# 08. Arquitectura inicial

## Propósito

Este documento define la arquitectura inicial de **DMGOTRAVEL** a partir de las decisiones adoptadas en el análisis del sistema.

La solución se implementará como una aplicación web con:

- **Frontend:** React.
- **Backend:** ASP.NET Core.
- **Estilo de backend:** Monolito Modular.
- **Enfoque interno:** Clean Architecture.
- **Patrón de aplicación:** CQRS con MediatR.
- **Persistencia:** PostgreSQL mediante Entity Framework Core.
- **Background Jobs:** Hangfire.
- **Pagos:** Culqi.
- **Correo:** Resend.
- **Multimedia:** Cloudflare R2.
- **Hosting frontend:** Vercel.
- **Hosting backend:** Render.
- **Capa perimetral:** Cloudflare.
- **API Gateway independiente:** no requerido en la primera versión.

---

# 1. Vista general

DMGOTRAVEL se organiza en cuatro zonas principales:

```text
1. Frontend
2. Capa perimetral
3. Backend monolítico
4. Persistencia e integraciones externas
```

```mermaid
flowchart LR

    U["👤 Cliente / Administrador"]

    subgraph FRONT["Frontend"]
        VERCEL["Vercel"]
        REACT["React SPA"]
        VERCEL --> REACT
    end

    subgraph EDGE["Capa perimetral de la API"]
        CF["Cloudflare<br/>DNS + WAF + TLS + DDoS"]
    end

    subgraph BACK["Backend"]
        API["ASP.NET Core REST API<br/>Monolito Modular"]
    end

    subgraph DATA["Persistencia"]
        DB[("PostgreSQL<br/>Supabase")]
        R2[("Cloudflare R2<br/>Multimedia")]
    end

    subgraph EXT["Servicios externos"]
        CULQI["Culqi"]
        RESEND["Resend"]
        GOOGLE["Google OAuth"]
    end

    U --> REACT
    REACT -->|"HTTPS / JSON"| CF
    CF --> API

    API --> DB
    API --> R2
    API <--> CULQI
    API --> RESEND
    API <--> GOOGLE
```

---

# 2. Flujo de acceso

## 2.1 Frontend

El frontend se publicará en Vercel.

```text
https://dmgotravel.com
https://www.dmgotravel.com
```

Cloudflare podrá gestionar el DNS del dominio. Para evitar una capa de proxy innecesaria delante de Vercel, el dominio del frontend puede mantenerse como **DNS only** cuando corresponda.

```text
Usuario
   |
   v
Vercel
   |
   v
React SPA
```

## 2.2 API

La API se publicará mediante:

```text
https://api.dmgotravel.com
```

```text
React
  |
  v
Cloudflare
DNS + WAF + TLS + DDoS
  |
  v
ASP.NET Core REST API
Render
```

En esta primera versión **no existe un API Gateway independiente**.

---

# 3. Backend monolítico

El backend constituye una sola aplicación desplegable.

```text
DMGOTRAVEL Backend
|
+-- Identity
+-- Catalog
+-- Hotels
+-- Reservations
+-- Payments
+-- Notifications
+-- Reports
+-- Audit
+-- Background Jobs
```

Todos los módulos forman parte de la misma solución, se despliegan juntos y utilizan la misma persistencia PostgreSQL.

Esto corresponde a un **Monolito Modular**, no a microservicios.

---

# 4. Módulos funcionales

| Módulo | Responsabilidad |
|---|---|
| **Identity** | Usuarios, autenticación, roles y Google OAuth. |
| **Catalog** | Tours, servicios, paquetes e imágenes. |
| **Hotels** | Hoteles, tipos de habitación, tarifas e inventario. |
| **Reservations** | Reservas, disponibilidad y ciclo de vida. |
| **Payments** | Culqi, pagos, eventos e idempotencia. |
| **Notifications** | Correos transaccionales mediante Resend. |
| **Reports** | Indicadores y reportes. |
| **Audit** | Registro de operaciones críticas. |
| **Background Jobs** | Vencimiento de reservas y tareas con Hangfire. |

---

# 5. Clean Architecture

```text
Presentation
Application
Domain
Infrastructure
```

```mermaid
flowchart TB
    Presentation["Presentation<br/>ASP.NET Core REST API"]
    Application["Application<br/>CQRS / MediatR / Use Cases"]
    Domain["Domain<br/>Entidades / Reglas / Value Objects"]
    Infrastructure["Infrastructure<br/>EF Core / Culqi / Resend / R2 / Identity"]

    Presentation --> Application
    Application --> Domain
    Infrastructure --> Application
    Infrastructure --> Domain
```

---

# 6. Persistencia

```text
PostgreSQL
Supabase
Entity Framework Core
Npgsql
```

El backend será el único responsable de acceder a la base de datos.

```text
React
  |
REST API
  |
ASP.NET Core
  |
EF Core
  |
PostgreSQL
```

---

# 7. Servicios externos

## Culqi

Los Webhooks serán recibidos por la propia API.

```text
POST /api/v1/webhooks/culqi
```

## Resend

```text
ASP.NET Core
  |
  v
Resend API
```

## Cloudflare R2

```text
ASP.NET Core
  |
  v
Cloudflare R2
```

---

# 8. Background Jobs

Hangfire formará parte del mismo backend monolítico.

```text
DMGOTRAVEL Monolith
|
+-- API REST
+-- CQRS
+-- EF Core
+-- Hangfire
```

Hangfire no constituye un microservicio separado.

---

# 9. Evolución futura

La primera versión no requiere:

- microservicios;
- service mesh;
- API Gateway independiente;
- event bus distribuido;
- múltiples bases de datos por módulo.

Un API Gateway podrá evaluarse si aparecen múltiples APIs, BFF, microservicios o necesidades avanzadas de routing.
