# 05. Restricciones del sistema

## Propósito

Las restricciones limitan las alternativas tecnológicas, arquitectónicas u operativas permitidas en **DMGOTRAVEL**.

Estas restricciones constituyen decisiones obligatorias para la implementación inicial y deben mantenerse consistentes con los requisitos, atributos de calidad, drivers arquitectónicos, ADR y documentación de arquitectura.

---

# 1. Restricciones tecnológicas y arquitectónicas

| ID | Restricción | Descripción |
|---|---|---|
| **RC01** | Aplicación web | DMGOTRAVEL debe ser accesible desde navegador web. |
| **RC02** | Frontend | La interfaz cliente y administrativa se implementará con **React + TypeScript**, utilizando **Vite** como herramienta de desarrollo y construcción. |
| **RC03** | Backend | El backend se implementará con **ASP.NET Core y C#**. |
| **RC04** | Estilo de backend | La solución backend se desplegará inicialmente como **Monolito Modular**. |
| **RC05** | Enfoque interno | El backend aplicará **Clean Architecture**. |
| **RC06** | API | Frontend y backend se comunicarán mediante una **API REST** sobre **HTTPS** y **JSON**. |
| **RC07** | CQRS | Los casos de uso principales se organizarán mediante Commands y Queries utilizando **MediatR**. |
| **RC08** | Validación | Las validaciones de entrada se implementarán de manera consistente utilizando **FluentValidation** o mecanismos equivalentes definidos por la solución. |
| **RC09** | Persistencia | La base de datos relacional será **PostgreSQL**. |
| **RC10** | ORM | El acceso principal a persistencia se implementará con **Entity Framework Core** y **Npgsql**. |
| **RC11** | Proveedor gestionado | La primera infraestructura de PostgreSQL utilizará **Supabase**, salvo una nueva ADR que cambie esta decisión. |
| **RC12** | Autenticación | La API utilizará **ASP.NET Core Identity + JWT**; no se utilizarán sesiones de servidor como mecanismo principal entre React y la API. |
| **RC13** | OAuth / OIDC | La autenticación social inicial utilizará **Google OAuth 2.0 / OpenID Connect**. |
| **RC14** | Pagos | La pasarela de pago inicial será **Culqi**. |
| **RC15** | Correo | El servicio de correo transaccional será **Resend**. |
| **RC16** | Multimedia | Las imágenes y archivos multimedia se almacenarán en **Cloudflare R2**. |
| **RC17** | Background Jobs | Los trabajos persistentes y programados se gestionarán con **Hangfire**. |
| **RC18** | Hosting frontend | El frontend React + TypeScript se desplegará inicialmente en **Vercel**. |
| **RC19** | Hosting backend | El backend ASP.NET Core se desplegará inicialmente en **Render**. |
| **RC20** | DNS y perímetro | **Cloudflare** administrará el DNS del dominio. Para la API pública actuará como **Proxy/WAF**, proporcionando TLS, mitigación DDoS y reglas perimetrales. El frontend utilizará la infraestructura **Edge/CDN de Vercel** sin añadir inicialmente un proxy Cloudflare delante de Vercel. |
| **RC21** | Contenedores | El backend deberá ser ejecutable mediante **Docker**. |
| **RC22** | Versionamiento | El código y documentación se gestionarán mediante **Git y GitHub**. |
| **RC23** | API Gateway futuro | No se implementará un API Gateway independiente en la primera versión. Su incorporación requerirá una nueva ADR que demuestre una necesidad arquitectónica real. |

---

# 2. Restricciones de seguridad

| ID | Restricción |
|---|---|
| **RS01** | Todo tráfico público debe utilizar HTTPS. |
| **RS02** | Los secretos no pueden almacenarse en el repositorio. |
| **RS03** | Los endpoints administrativos requieren rol `admin`. |
| **RS04** | No existe registro público de administradores. |
| **RS05** | Los clientes solo pueden acceder a sus propios recursos privados. |
| **RS06** | El backend no puede confiar en precios ni totales calculados por el frontend. |
| **RS07** | DMGOTRAVEL no almacenará datos sensibles completos de tarjetas. |
| **RS08** | Los Webhooks de pago deben validarse mediante el mecanismo oficial definido por Culqi. |
| **RS09** | Las operaciones de pago deben ser idempotentes. |
| **RS10** | Los archivos cargados deben validarse antes de almacenarse. |
| **RS11** | CORS deberá permitir únicamente los orígenes autorizados de DMGOTRAVEL en producción. |
| **RS12** | Los endpoints públicos deberán aplicar rate limiting cuando corresponda. |

---

# 3. Restricciones de persistencia

| ID | Restricción |
|---|---|
| **RP01** | Reservas, pagos y auditoría deben almacenarse en PostgreSQL. |
| **RP02** | Los procesos críticos de disponibilidad deben utilizar transacciones. |
| **RP03** | Los registros históricos no deben depender del precio actual del catálogo. |
| **RP04** | Los registros que requieran conservar historial utilizarán borrado lógico. |
| **RP05** | Las migraciones de Entity Framework Core deben versionarse. |
| **RP06** | La disponibilidad no puede depender exclusivamente de una caché en memoria. |
| **RP07** | El frontend no tendrá acceso directo a PostgreSQL ni utilizará Supabase como capa de acceso a los datos de negocio. |
| **RP08** | Las fechas persistidas por el backend deberán almacenarse de forma consistente en UTC. |

---

# 4. Restricciones de despliegue

La infraestructura productiva inicial utiliza **dos flujos diferenciados**: frontend y API.

## 4.1 Frontend

```text
Usuario
   |
   v
dmgotravel.com / www.dmgotravel.com
   |
   v
Cloudflare DNS
DNS Only
   |
   v
Vercel
Edge / CDN / Hosting
   |
   v
React + TypeScript
```

### Reglas

- Cloudflare administrará los registros DNS del dominio.
- El frontend utilizará inicialmente la infraestructura Edge/CDN de Vercel.
- No se añadirá un proxy Cloudflare adicional delante de Vercel en la primera versión.
- React consumirá la API exclusivamente mediante HTTPS.
- La URL pública de la API se configurará mediante variables de entorno del frontend.

---

## 4.2 API

```text
React + TypeScript
        |
        v
https://api.dmgotravel.com
        |
        v
Cloudflare Proxy
WAF / TLS / DDoS
        |
        v
Render
        |
        v
ASP.NET Core REST API
Monolito Modular
        |
        +--> PostgreSQL / Supabase
        +--> Cloudflare R2
        +--> Culqi
        +--> Resend
        +--> Google OAuth 2.0 / OpenID Connect
```

### Reglas

- `api.dmgotravel.com` será el punto de entrada público de la API.
- Cloudflare protegerá el tráfico HTTP/HTTPS dirigido a la API.
- Render alojará la aplicación ASP.NET Core empaquetada mediante Docker.
- ASP.NET Core continuará siendo el único backend de negocio.
- Cloudflare no contendrá lógica de negocio.
- No se implementará un API Gateway independiente en V1.

---

# 5. Restricciones de alcance

Para la primera versión:

- no se utilizarán microservicios;
- no se utilizará un API Gateway independiente;
- no se utilizará SQL Server;
- no se utilizará Laravel;
- no se utilizará Laravel Sanctum;
- no se utilizará Laravel Socialite;
- no se utilizará Laravel Scheduler;
- no se utilizarán sesiones PHP;
- no se almacenarán imágenes en el filesystem local del backend;
- no se utilizará el frontend como fuente oficial para cálculos financieros;
- no se utilizará el frontend como acceso directo a la base de datos;
- no se introducirán Redis, RabbitMQ, Kafka o Kubernetes sin una necesidad arquitectónica documentada;
- no se separarán módulos del monolito en servicios independientes sin una nueva ADR.

---

# 6. Stack tecnológico obligatorio de V1

```text
Frontend
  React
  TypeScript
  Vite
  Vercel

Backend
  ASP.NET Core
  C#
  Monolito Modular
  Clean Architecture
  CQRS
  MediatR
  FluentValidation
  Hangfire

Security
  ASP.NET Core Identity
  JWT
  Google OAuth 2.0 / OpenID Connect
  RBAC

Persistence
  PostgreSQL
  Supabase
  Entity Framework Core
  Npgsql

Integrations
  Culqi
  Resend
  Cloudflare R2

Infrastructure
  Docker
  Render
  Cloudflare DNS
  Cloudflare Proxy/WAF para la API
  Vercel Edge/CDN para el frontend
```

---

# 7. Cambios de restricciones

Cualquier modificación importante deberá registrarse mediante una nueva decisión arquitectónica.

Ejemplos:

- cambiar PostgreSQL por otro motor;
- sustituir Culqi;
- mover el backend a otro proveedor;
- sustituir Hangfire;
- introducir microservicios;
- incorporar un API Gateway;
- modificar la estrategia de autenticación;
- sustituir React, TypeScript o Vite;
- cambiar la estrategia Cloudflare/Vercel.

Una restricción no debe modificarse de manera silenciosa en un documento aislado.

Cuando una restricción cambie, deberán revisarse también:

1. requisitos afectados;
2. atributos de calidad;
3. drivers arquitectónicos;
4. ADR;
5. README principal;
6. diagramas;
7. especificaciones de Spec Kit que dependan de la decisión.
