# 04. Atributos de calidad

## Propósito

Este documento define los atributos de calidad que condicionan la arquitectura de **DMGOTRAVEL**.

La arquitectura objetivo utiliza:

### Frontend

- React;
- TypeScript;
- Vite;
- Vercel como hosting y Edge/CDN.

### Backend

- ASP.NET Core;
- C#;
- Monolito Modular;
- Clean Architecture;
- MediatR;
- FluentValidation;
- Hangfire.

### Persistencia

- PostgreSQL;
- Supabase;
- Entity Framework Core;
- Npgsql.

### Seguridad e identidad

- ASP.NET Core Identity;
- JWT;
- Google OAuth 2.0 / OpenID Connect;
- RBAC.

### Integraciones

- Culqi;
- Resend;
- Cloudflare R2.

### Infraestructura

- Docker;
- Render;
- Cloudflare como proveedor DNS;
- Cloudflare Proxy/WAF para la API;
- Vercel Edge/CDN para el frontend.

---

# 1. Escenarios de calidad

| ID | Atributo | Escenario |
|---|---|---|
| **AC01** | Rendimiento | Las consultas habituales de catálogo deben responder con baja latencia bajo condiciones normales de operación. El objetivo inicial para endpoints simples de lectura será aproximadamente `< 300 ms` en el backend, excluyendo latencia de terceros y red pública. |
| **AC02** | Disponibilidad | Una falla temporal en Resend, R2 o un trabajo de Hangfire no debe bloquear las peticiones HTTP no relacionadas. |
| **AC03** | Escalabilidad | El backend debe diseñarse de forma stateless para permitir escalado horizontal cuando la infraestructura lo requiera. |
| **AC04** | Seguridad | Autenticación, autorización, secretos, Webhooks y operaciones administrativas deben protegerse mediante controles explícitos. |
| **AC05** | Privacidad y aislamiento | Un cliente no debe acceder a información perteneciente a otros clientes. |
| **AC06** | Mantenibilidad | El sistema debe estar organizado mediante Clean Architecture y módulos funcionales cohesionados. |
| **AC07** | Integridad y concurrencia | Dos reservas concurrentes no deben producir sobreventa de cupos ni inventario hotelero. |
| **AC08** | Interoperabilidad | El backend debe exponer contratos JSON consistentes y recibir eventos de servicios externos en endpoints específicos. |
| **AC09** | Trazabilidad | Las operaciones críticas deben poder reconstruirse mediante logs y auditoría. |
| **AC10** | Usabilidad | El usuario debe recibir mensajes claros sobre reserva, pago, errores y estado de operación. |
| **AC11** | Testabilidad | Las reglas de dominio y casos de uso deben poder probarse sin depender de servicios externos reales. |
| **AC12** | Recuperabilidad | La aplicación debe permitir recuperar el estado de operación a partir de PostgreSQL y mecanismos de respaldo del proveedor. |

---

# 2. Mecanismos arquitectónicos

## AC01 — Rendimiento

Mecanismos:

- consultas optimizadas con EF Core;
- proyecciones DTO;
- paginación;
- índices en PostgreSQL;
- evitar carga innecesaria de relaciones;
- `IMemoryCache` únicamente para datos seguros de cachear;
- almacenamiento multimedia fuera del backend mediante Cloudflare R2;
- entrega del frontend mediante la infraestructura Edge/CDN de Vercel;
- reglas de caché perimetral para recursos públicos únicamente cuando sea seguro y esté explícitamente configurado.

### Restricción de caché

No se debe utilizar una caché en memoria ni una caché perimetral como fuente de verdad para:

- cupos;
- inventario hotelero;
- estado de una reserva;
- estado de un pago.

La disponibilidad crítica debe consultarse o validarse contra PostgreSQL.

Cuando exista escalado horizontal, una caché local no se comparte entre instancias; por lo tanto, la invalidación debe diseñarse cuidadosamente o migrarse a una solución distribuida si aparece una necesidad real.

---

## AC02 — Disponibilidad

Mecanismos:

- tareas de segundo plano con Hangfire;
- timeouts en llamadas HTTP externas;
- reintentos controlados;
- manejo global de excepciones;
- health checks;
- separación entre confirmación de pago y envío de correo.

Un fallo de Resend no debe revertir un pago ya confirmado.

Un fallo temporal de un servicio externo no relacionado no debe bloquear funcionalidades independientes.

---

## AC03 — Escalabilidad

El backend se diseñará como servicio stateless:

- no almacenar sesión de usuario en memoria del servidor;
- autenticar mediante JWT;
- persistir estado de negocio en PostgreSQL;
- mantener archivos fuera del contenedor;
- utilizar R2 para multimedia;
- evitar dependencias de disco local;
- permitir múltiples instancias del backend sin cambiar las reglas de negocio.

La escalabilidad no implica adoptar microservicios.

La primera estrategia será escalar el Monolito Modular antes de considerar extracción de servicios.

---

## AC04 — Seguridad

Mecanismos:

- ASP.NET Core Identity;
- JWT;
- Google OAuth 2.0 / OpenID Connect;
- autorización basada en roles;
- HTTPS;
- Cloudflare Proxy/WAF para la API;
- CORS restrictivo en ASP.NET Core;
- rate limiting en ASP.NET Core y, cuando corresponda, reglas adicionales en Cloudflare;
- secretos mediante variables de entorno o mecanismos seguros de la plataforma;
- validación de Webhooks;
- validación de archivos;
- protección de endpoints administrativos;
- protección del panel de Hangfire;
- logging sin datos sensibles;
- ausencia de secretos reales en el repositorio.

### Separación de responsabilidades

Cloudflare protege el perímetro de la API.

ASP.NET Core sigue siendo responsable de:

- autenticación;
- autorización;
- validaciones;
- reglas de negocio;
- control de acceso a recursos;
- procesamiento de reservas;
- pagos;
- auditoría.

---

## AC05 — Privacidad y aislamiento

Toda consulta de cliente debe aplicar el identificador del usuario autenticado.

Ejemplo conceptual:

```text
Reservation.UserId == CurrentUser.Id
```

No se debe confiar en un `userId` enviado libremente por el frontend para determinar propiedad.

Los endpoints administrativos deben estar protegidos explícitamente mediante autorización basada en roles.

---

## AC06 — Mantenibilidad

El backend se organiza mediante:

```text
Domain
Application
Infrastructure
Presentation
```

y módulos de negocio como:

```text
Identity
Catalog
Hotels
Reservations
Payments
Notifications
Reports
Audit
Background Jobs
```

La lógica del dominio no debe depender de:

- PostgreSQL;
- Entity Framework Core;
- Culqi;
- Resend;
- Cloudflare R2;
- ASP.NET Core;
- Render;
- Vercel;
- Cloudflare.

El frontend utilizará:

```text
React
TypeScript
Vite
```

TypeScript debe favorecer contratos más claros, refactorizaciones seguras y una integración consistente con la API.

---

## AC07 — Integridad y concurrencia

La persistencia utilizará:

```text
PostgreSQL
Entity Framework Core
Npgsql
```

Las reservas deben implementar una estrategia explícita de concurrencia mediante:

- transacciones;
- aislamiento adecuado;
- bloqueo pesimista cuando sea necesario;
- restricciones e índices en base de datos;
- idempotencia;
- rollback ante fallos.

Las pruebas de concurrencia son obligatorias para los flujos críticos.

Casos mínimos:

```text
último cupo turístico
última habitación disponible
reserva compuesta tour + hotel
Webhook duplicado
trabajo Hangfire repetido
```

---

## AC08 — Interoperabilidad

La API debe:

- utilizar JSON;
- versionarse;
- utilizar DTOs;
- documentarse mediante OpenAPI;
- retornar códigos HTTP correctos;
- manejar Webhooks en endpoints dedicados;
- utilizar un formato de error estándar basado en `ProblemDetails`.

El contrato OpenAPI deberá servir como referencia entre:

```text
React + TypeScript
        |
        v
ASP.NET Core REST API
```

---

## AC09 — Trazabilidad

Registrar:

- actor;
- acción;
- entidad;
- identificador;
- fecha UTC;
- valores relevantes;
- `CorrelationId` cuando corresponda.

Se recomienda generar o propagar un `CorrelationId` desde la API y utilizar logging estructurado para relacionar:

```text
Request
  -> Reservation
  -> Payment
  -> Webhook
  -> Notification
```

Los logs técnicos y los registros de auditoría cumplen objetivos diferentes y no deben confundirse.

---

## AC10 — Usabilidad

El frontend React + TypeScript debe distinguir claramente estados como:

```text
pending
confirmed
completed
cancelled
```

y mostrar mensajes específicos frente a:

- indisponibilidad;
- validaciones;
- pago rechazado;
- pago pendiente;
- reserva expirada;
- error temporal de terceros.

La interfaz no debe mostrar como confirmada una operación hasta que el backend determine el estado correspondiente.

---

## AC11 — Testabilidad

Las integraciones externas deben consumirse mediante interfaces definidas en Application.

Ejemplo conceptual:

```text
IPaymentGateway
IEmailService
IObjectStorage
ICurrentUser
IClock
```

Esto permitirá utilizar dobles de prueba.

La solución deberá permitir:

- pruebas unitarias de Domain;
- pruebas unitarias de Application;
- pruebas de integración con PostgreSQL;
- pruebas de arquitectura;
- pruebas de concurrencia;
- pruebas de contratos HTTP;
- pruebas de idempotencia.

---

## AC12 — Recuperabilidad

Consideraciones:

- migraciones versionadas;
- backups gestionados por PostgreSQL/Supabase según el plan contratado;
- procedimientos de restauración documentados;
- datos de infraestructura reproducibles;
- secretos fuera del repositorio;
- archivos multimedia fuera del filesystem local de Render.

El backend debe poder reconstruirse desde el código, configuración segura y persistencia externa sin depender del disco local del contenedor.

---

# 3. Métricas iniciales

| Área | Métrica inicial |
|---|---|
| API | Latencia p95 de endpoints principales |
| Errores | Tasa de respuestas 5xx |
| Reservas | Porcentaje de conflictos de disponibilidad |
| Pagos | Pagos exitosos, rechazados y pendientes |
| Webhooks | Eventos procesados, duplicados y fallidos |
| Jobs | Ejecuciones exitosas/fallidas de Hangfire |
| DB | Tiempo de consultas críticas |
| Recursos | CPU y memoria del backend |
| Disponibilidad | Health checks y uptime |
| Correo | Envíos exitosos/fallidos |

---

# 4. Criterios para pase a producción

Antes de producción se debe validar:

1. pruebas de concurrencia para últimos cupos;
2. pruebas de concurrencia para habitaciones;
3. Webhooks duplicados;
4. idempotencia de pagos;
5. vencimiento automático;
6. aislamiento por usuario;
7. control de roles;
8. manejo de fallos de Culqi;
9. manejo de fallos de Resend;
10. validación de cargas a R2;
11. health checks;
12. recuperación frente a fallos de base de datos;
13. CORS y rate limiting;
14. gestión segura de secretos;
15. observabilidad y logs;
16. despliegue reproducible del backend mediante Docker;
17. configuración correcta de Cloudflare para `api.dmgotravel.com`;
18. configuración correcta de Vercel para el frontend;
19. ausencia de acceso directo del frontend a PostgreSQL;
20. validación del contrato OpenAPI entre frontend y backend.

---

# 5. Capa perimetral, frontend y API REST

Cloudflare, Vercel y ASP.NET Core cumplen responsabilidades diferentes.

| Capa | Responsabilidad |
|---|---|
| **Cloudflare DNS** | Administrar los registros DNS del dominio. |
| **Vercel Edge/CDN** | Hosting, distribución y entrega del frontend React + TypeScript. |
| **Cloudflare Proxy/WAF para API** | Proteger `api.dmgotravel.com` mediante proxy, WAF, TLS, mitigación DDoS y reglas perimetrales. |
| **ASP.NET Core API** | CORS, rate limiting de aplicación, autenticación, autorización, OpenAPI, errores, logging y reglas de negocio. |

## Flujo del frontend

```text
Usuario
   |
Cloudflare DNS
DNS Only
   |
Vercel Edge/CDN
   |
React + TypeScript
```

## Flujo de la API

```text
React + TypeScript
        |
Cloudflare Proxy/WAF
        |
Render
        |
ASP.NET Core REST API
```

No se incorpora un API Gateway independiente en la primera versión porque existe un único backend monolítico y varias de las responsabilidades de entrada ya están cubiertas por Cloudflare y ASP.NET Core.

Si la arquitectura evoluciona a múltiples backends, BFF o servicios independientes, esta decisión podrá revisarse mediante una nueva ADR.
