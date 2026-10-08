# 11. Arquitectura de despliegue

## Propósito

Definir cómo se desplegarán los componentes de DMGOTRAVEL en la primera versión de producción.

---

# 1. Topología

```mermaid
flowchart TB

    USER["👤 Usuario"]

    subgraph FRONT["Frontend"]
        VERCEL["Vercel"]
        REACT["React SPA"]
        VERCEL --> REACT
    end

    subgraph EDGE["API Edge"]
        CF["Cloudflare<br/>DNS / WAF / TLS / DDoS"]
    end

    subgraph APP["Backend"]
        RENDER["Render"]
        API["ASP.NET Core REST API<br/>Monolito Modular"]
        RENDER --> API
    end

    subgraph DATA["Persistencia y archivos"]
        SUPABASE[("Supabase<br/>PostgreSQL")]
        R2[("Cloudflare R2")]
    end

    subgraph EXT["Servicios externos"]
        CULQI["Culqi"]
        RESEND["Resend"]
        GOOGLE["Google OAuth"]
    end

    USER --> REACT
    REACT --> CF
    CF --> API

    API --> SUPABASE
    API --> R2
    API <--> CULQI
    API --> RESEND
    API <--> GOOGLE
```

---

# 2. Dominios

```text
dmgotravel.com
www.dmgotravel.com
    -> Vercel / React
```

```text
api.dmgotravel.com
    -> Cloudflare Proxy
    -> Render / ASP.NET Core
```

---

# 3. Cloudflare

Para la API, Cloudflare proporcionará:

- DNS;
- proxy;
- TLS;
- WAF;
- DDoS;
- reglas de seguridad.

Para el frontend alojado en Vercel, Cloudflare puede usarse como proveedor DNS sin introducir necesariamente un proxy adicional delante de Vercel.

---

# 4. Render

Render alojará el contenedor Docker del backend.

```text
Docker
  |
  v
ASP.NET Core
  |
  v
DMGOTRAVEL Monolith
```

El backend deberá ser stateless respecto al servidor.

---

# 5. Supabase

El acceso será desde el backend mediante:

```text
EF Core
Npgsql
Connection String
```

El frontend no accede directamente a las tablas del sistema.

---

# 6. R2

Cloudflare R2 almacenará:

- imágenes de tours;
- imágenes de hoteles;
- multimedia.

El backend almacenará referencias en PostgreSQL.

---

# 7. Secretos

Ejemplos:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
Culqi__PublicKey
Culqi__SecretKey
Resend__ApiKey
Google__ClientId
Google__ClientSecret
R2__AccountId
R2__AccessKeyId
R2__SecretAccessKey
R2__BucketName
```

Nunca se almacenarán secretos reales en GitHub.

---

# 8. Flujo de pago

```mermaid
sequenceDiagram

    actor Cliente
    participant React
    participant API as DMGOTRAVEL API
    participant Culqi
    participant DB as PostgreSQL
    participant Resend

    Cliente->>React: Realizar pago
    React->>Culqi: Tokenización / Checkout
    Culqi-->>React: Token / resultado inicial

    React->>API: Solicitar procesamiento
    API->>DB: Obtener reserva y monto
    API->>Culqi: Crear/procesar pago
    Culqi-->>API: Resultado

    Culqi-->>API: Webhook
    API->>API: Validar e idempotencia
    API->>DB: Actualizar Payment
    API->>DB: Confirmar Reservation
    API->>Resend: Enviar confirmación
```

---

# 9. Flujo de vencimiento

```text
Hangfire
   |
   v
Buscar reservas pending vencidas
   |
   v
Cancelar reserva
   |
   +--> liberar cupos
   +--> liberar inventario hotelero
   +--> auditoría
```

Hangfire se ejecuta dentro del mismo backend.

---

# 10. Evolución

Si el sistema aumenta significativamente su escala, podrán evaluarse:

- escalado horizontal;
- caché distribuida;
- workers separados;
- API Gateway;
- colas;
- servicios independientes.

Estas opciones no forman parte de la primera versión.
