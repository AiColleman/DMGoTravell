# 07. Decisiones arquitectónicas

## Propósito

Este documento registra las decisiones arquitectónicas principales de **DMGOTRAVEL**.

Una decisión arquitectónica debe ser consistente con:

- requisitos funcionales;
- atributos de calidad;
- restricciones;
- drivers arquitectónicos;
- documentación de arquitectura;
- futuras especificaciones generadas mediante Spec-Driven Development.

---

# ADR-001 — Monolito Modular con ASP.NET Core

**Estado:** Aceptada.

**Decisión:** El backend se implementará como un **Monolito Modular** utilizando ASP.NET Core.

**Drivers:** DA01, DA09, DA10.

### Justificación

- menor complejidad operativa inicial;
- un único despliegue;
- comunicación interna de baja latencia;
- transacciones más sencillas;
- permite modularidad sin introducir infraestructura distribuida.

### Consecuencias

- todos los módulos comparten el proceso de despliegue;
- un fallo grave del proceso puede afectar a todos los módulos;
- los límites modulares deben respetarse explícitamente;
- una futura extracción a microservicios será una decisión posterior, no un objetivo inmediato.

---

# ADR-002 — Clean Architecture

**Estado:** Aceptada.

**Decisión:** La solución utilizará las capas:

```text
Domain
Application
Infrastructure
Presentation
```

**Drivers:** DA03, DA05, DA09.

### Regla de dependencia

Las dependencias deben apuntar hacia el núcleo.

```text
Presentation ----\
                  -> Application -> Domain
Infrastructure --/
```

`Domain` no dependerá de EF Core, ASP.NET Core, Culqi, Resend, R2 ni proveedores de hosting.

---

# ADR-003 — CQRS con MediatR

**Estado:** Aceptada.

**Decisión:** Los casos de uso se organizarán utilizando Commands y Queries con MediatR.

**Drivers:** DA02, DA09.

### Justificación

CQRS se utilizará para:

- separar operaciones de lectura y escritura;
- representar casos de uso explícitos;
- centralizar validaciones;
- facilitar pruebas;
- facilitar optimizaciones de lectura sin mezclar lógica de mutación.

### Consecuencia

No se utilizará CQRS para crear infraestructura distribuida ni buses externos en la primera versión.

---

# ADR-004 — PostgreSQL con Supabase

**Estado:** Aceptada.

**Decisión:** La base de datos será PostgreSQL, alojada inicialmente en Supabase.

**Drivers:** DA05, DA08, DA10.

### Implementación

```text
PostgreSQL
Entity Framework Core
Npgsql
EF Core Migrations
```

### Justificación

- soporte ACID;
- transacciones;
- bloqueo y control de concurrencia;
- restricciones e índices;
- ecosistema sólido con .NET.

### Exclusión

SQL Server no forma parte de la arquitectura inicial.

---

# ADR-005 — Hangfire para trabajos en segundo plano

**Estado:** Aceptada.

**Decisión:** Se utilizará Hangfire para trabajos persistentes y programados.

**Drivers:** DA06, DA07.

### Casos iniciales

- cancelación automática de reservas vencidas;
- reintentos controlados;
- tareas de notificación que requieran ejecución diferida.

### Reglas

- los trabajos deben ser idempotentes;
- el Dashboard debe protegerse;
- Hangfire utilizará persistencia compatible con PostgreSQL.

---

# ADR-006 — Cloudflare R2 para multimedia

**Estado:** Aceptada.

**Decisión:** Las imágenes y archivos del catálogo se almacenarán fuera del backend, en Cloudflare R2.

**Drivers:** DA01, DA02.

### Consecuencias

- el contenedor backend permanece stateless;
- se reduce dependencia del disco local;
- se requiere validación de uploads;
- PostgreSQL almacena metadatos y referencias, no el archivo binario principal.

---

# ADR-007 — Culqi como pasarela de pago

**Estado:** Aceptada.

**Decisión:** Culqi será la pasarela de pago inicial.

**Drivers:** DA03, DA04, DA05.

### Reglas arquitectónicas

- el backend calcula el monto;
- cada intento se representa mediante un registro de pago;
- se almacenan identificadores externos necesarios;
- los eventos se procesan de forma idempotente;
- los Webhooks se validan según el mecanismo oficial;
- una reserva solo pasa a `confirmed` después de pago validado.

---

# ADR-008 — Resend para correo transaccional

**Estado:** Aceptada.

**Decisión:** Resend será el proveedor inicial para correos transaccionales.

**Drivers:** DA07.

### Reglas

- los intentos de envío deben ser trazables;
- un fallo de correo no revierte un pago confirmado;
- los reintentos no deben producir correos duplicados.

---

# ADR-009 — ASP.NET Core Identity + JWT + Google OAuth 2.0 / OpenID Connect

**Estado:** Aceptada.

**Decisión:** La identidad se administrará con ASP.NET Core Identity; la API utilizará JWT y permitirá autenticación social con Google mediante OAuth 2.0 / OpenID Connect.

**Drivers:** DA03, DA09.

### Consecuencias

- Laravel Sanctum no se utiliza;
- Laravel Socialite no se utiliza;
- no se utilizan sesiones PHP;
- los tokens de DMGOTRAVEL se emiten únicamente después de autenticar correctamente al usuario;
- la política detallada de access tokens, refresh tokens, rotación y revocación se definirá antes de implementar Identity.

---

# ADR-010 — Borrado lógico y conservación histórica

**Estado:** Aceptada.

**Decisión:** Usuarios, ofertas y hoteles que deban conservar relaciones históricas utilizarán borrado lógico.

**Drivers:** DA08.

### Implementación conceptual

```text
IsDeleted
DeletedAt
```

o una convención equivalente definida por el modelo de datos.

Los filtros globales de EF Core podrán utilizarse donde sea apropiado.

---

# ADR-011 — Snapshots de precios

**Estado:** Aceptada.

**Decisión:** Las reservas almacenarán los precios utilizados en el momento de su creación.

**Drivers:** DA05, DA08.

### Objetivo

Evitar que cambios posteriores en el catálogo modifiquen:

- reservas históricas;
- comprobantes;
- reportes financieros.

---

# ADR-012 — Frontend React + TypeScript + Vite en Vercel

**Estado:** Aceptada.

**Decisión:** El frontend de DMGOTRAVEL se implementará utilizando **React + TypeScript**, utilizará **Vite** para desarrollo y construcción, y será desplegado inicialmente en **Vercel**.

**Drivers:** DA01, DA02, DA09, DA10.

### Justificación

TypeScript se adopta como lenguaje oficial del frontend para:

- disponer de tipado estático;
- reducir errores de integración;
- mejorar la mantenibilidad;
- facilitar refactorizaciones;
- definir contratos claros con la API;
- mejorar la integración futura con OpenAPI;
- favorecer un desarrollo asistido por IA más consistente.

Vite se utilizará para:

- entorno de desarrollo;
- compilación;
- empaquetado del frontend;
- gestión del flujo de construcción para Vercel.

### Stack frontend

```text
React
TypeScript
Vite
Vercel
```

### Comunicación

La aplicación se comunicará con la API exclusivamente mediante HTTPS.

```text
React + TypeScript
        |
        v
HTTPS / REST / JSON
        |
        v
ASP.NET Core REST API
```

### Restricciones

- no se utilizará JavaScript sin tipado como lenguaje principal del frontend;
- el frontend no accederá directamente a PostgreSQL;
- el frontend no será la fuente oficial de precios o totales financieros.

---

# ADR-013 — Backend Docker en Render

**Estado:** Aceptada.

**Decisión:** El backend ASP.NET Core será empaquetado con Docker y desplegado inicialmente en Render.

**Drivers:** DA01, DA10.

### Consecuencias

- configuración mediante variables de entorno;
- filesystem local no persistente como dependencia de negocio;
- necesidad de health checks;
- portabilidad del contenedor.

---

# ADR-014 — Cloudflare como proveedor DNS y capa perimetral de la API

**Estado:** Aceptada.

**Decisión:** Cloudflare administrará el DNS del dominio de DMGOTRAVEL y actuará como capa perimetral de seguridad para la **API pública**. El frontend utilizará la infraestructura Edge/CDN nativa de Vercel.

**Drivers:** DA01, DA03, DA10.

## Frontend

La publicación del frontend seguirá este flujo:

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

### Decisiones para frontend

- Cloudflare administrará DNS.
- No se añadirá inicialmente un proxy Cloudflare delante de Vercel.
- Vercel proporcionará hosting y Edge/CDN del frontend.
- Esta separación evita una capa de proxy innecesaria para el sitio web.

## API

La API seguirá este flujo:

```text
React + TypeScript
        |
        v
api.dmgotravel.com
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
```

### Responsabilidades de Cloudflare para la API

- DNS;
- proxy HTTP/HTTPS;
- TLS;
- WAF;
- mitigación DDoS;
- filtrado de tráfico;
- reglas perimetrales;
- rate limiting perimetral cuando sea apropiado.

### Responsabilidades que Cloudflare no asume

Cloudflare no implementará:

- lógica de negocio;
- reglas de reservas;
- autorización del dominio;
- procesamiento de pagos;
- acceso directo a PostgreSQL;
- CQRS;
- lógica de inventario.

Estas responsabilidades permanecen en ASP.NET Core.

### Consecuencias

- el frontend utiliza directamente la infraestructura Edge/CDN de Vercel;
- la API dispone de una capa perimetral independiente;
- se mantiene un único backend de negocio;
- no se introduce un API Gateway independiente;
- se reduce duplicidad de infraestructura delante del frontend.

---

# ADR-015 — Contratos API mediante OpenAPI

**Estado:** Aceptada.

**Decisión:** La API deberá documentarse mediante OpenAPI/Swagger.

**Drivers:** DA09.

### Objetivos

- contrato claro entre React + TypeScript y ASP.NET Core;
- documentación de endpoints;
- definición de DTOs;
- facilitar pruebas e integración;
- permitir generación o tipado futuro de clientes a partir del contrato.

---

# ADR-016 — ProblemDetails para errores HTTP

**Estado:** Aceptada.

**Decisión:** La API utilizará un formato consistente basado en `ProblemDetails` para errores.

**Drivers:** DA09, AC08, AC10.

Ejemplo conceptual:

```json
{
  "type": "https://dmgotravel/errors/insufficient-capacity",
  "title": "Insufficient capacity",
  "status": 409,
  "detail": "No existen cupos suficientes.",
  "traceId": "..."
}
```

---

# ADR-017 — API Gateway independiente

**Estado:** Diferida / No adoptada en la primera versión.

**Decisión:** DMGOTRAVEL no implementará un API Gateway independiente durante la primera versión.

### Justificación

El sistema utiliza un único backend Monolito Modular en ASP.NET Core. Las capacidades que normalmente justificarían un Gateway ya están cubiertas por:

- Cloudflare: WAF, DDoS, TLS, DNS y políticas perimetrales para la API;
- ASP.NET Core: routing, JWT, autorización, CORS, rate limiting, logging, OpenAPI y middleware.

Añadir YARP en esta fase duplicaría responsabilidades y aumentaría:

- complejidad operativa;
- mantenimiento;
- despliegues;
- observabilidad;
- posibles puntos de fallo.

### Evolución futura

La decisión podrá revisarse si aparecen:

- múltiples backends;
- BFF;
- microservicios;
- APIs especializadas;
- routing avanzado;
- políticas centralizadas que justifiquen una capa adicional.

---

# Matriz resumida

| ADR | Decisión | Estado |
|---|---|---|
| ADR-001 | Monolito Modular ASP.NET Core | Aceptada |
| ADR-002 | Clean Architecture | Aceptada |
| ADR-003 | CQRS + MediatR | Aceptada |
| ADR-004 | PostgreSQL + Supabase | Aceptada |
| ADR-005 | Hangfire | Aceptada |
| ADR-006 | Cloudflare R2 | Aceptada |
| ADR-007 | Culqi | Aceptada |
| ADR-008 | Resend | Aceptada |
| ADR-009 | Identity + JWT + Google OAuth 2.0 / OIDC | Aceptada |
| ADR-010 | Soft delete | Aceptada |
| ADR-011 | Snapshot de precios | Aceptada |
| ADR-012 | React + TypeScript + Vite + Vercel | Aceptada |
| ADR-013 | Docker + Render | Aceptada |
| ADR-014 | Cloudflare DNS + Proxy/WAF para API | Aceptada |
| ADR-015 | OpenAPI | Aceptada |
| ADR-016 | ProblemDetails | Aceptada |
| ADR-017 | API Gateway independiente | Diferida / No adoptada |

---

# Stack oficial resultante

```text
Frontend
  React
  TypeScript
  Vite
  Vercel

Backend
  ASP.NET Core
  C#
  Clean Architecture
  Modular Monolith
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
  Cloudflare Proxy/WAF para API
  Vercel Edge/CDN para frontend
```

---

# Regla de gobierno documental

Si una decisión futura contradice una ADR aceptada, se deberá:

1. crear una nueva ADR;
2. marcar la anterior como `Superseded`;
3. actualizar requisitos y restricciones afectados;
4. actualizar README y diagramas;
5. actualizar las especificaciones de Spec Kit afectadas;
6. evitar mantener dos decisiones incompatibles como activas.
