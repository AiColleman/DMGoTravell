# 04. Atributos de calidad

## Propósito

Este documento define los atributos de calidad que condicionan la arquitectura de DMGOTRAVEL.

La arquitectura objetivo utiliza:

- React;
- ASP.NET Core;
- PostgreSQL;
- Entity Framework Core;
- MediatR;
- FluentValidation;
- Hangfire;
- Culqi;
- Resend;
- Cloudflare R2;
- Vercel;
- Render;
- Cloudflare.

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
- entrega de multimedia mediante R2/CDN.

### Restricción de caché

No se debe utilizar una caché en memoria como fuente de verdad para:

- cupos;
- inventario hotelero;
- estado de una reserva;
- estado de un pago.

La disponibilidad crítica debe consultarse o validarse contra PostgreSQL.

Cuando exista escalado horizontal, una caché local no se comparte entre instancias; por lo tanto, la invalidación debe diseñarse cuidadosamente o migrarse a una solución distribuida.

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

---

## AC03 — Escalabilidad

El backend se diseñará como servicio stateless:

- no almacenar sesión de usuario en memoria del servidor;
- autenticar mediante JWT;
- persistir estado de negocio en PostgreSQL;
- mantener archivos fuera del contenedor;
- utilizar R2 para multimedia;
- evitar dependencias de disco local.

---

## AC04 — Seguridad

Mecanismos:

- ASP.NET Core Identity;
- JWT;
- autorización basada en roles;
- HTTPS;
- Cloudflare WAF;
- CORS restrictivo en ASP.NET Core;
- rate limiting en ASP.NET Core y, cuando corresponda, reglas adicionales en Cloudflare;
- secretos mediante variables de entorno/plataforma;
- validación de Webhooks;
- validación de archivos;
- protección de endpoints administrativos;
- protección del panel de Hangfire;
- logging sin datos sensibles.

---

## AC05 — Privacidad y aislamiento

Toda consulta de cliente debe aplicar el identificador del usuario autenticado.

Ejemplo conceptual:

```text
Reservation.UserId == CurrentUser.Id
```

No se debe confiar en un `userId` enviado libremente por el frontend para determinar propiedad.

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
```

La lógica del dominio no debe depender de:

- PostgreSQL;
- Culqi;
- Resend;
- R2;
- ASP.NET Core;
- Render;
- Vercel.

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
- idempotencia.

Las pruebas de concurrencia son obligatorias para los flujos críticos.

---

## AC08 — Interoperabilidad

La API debe:

- utilizar JSON;
- versionarse;
- utilizar DTOs;
- documentarse mediante OpenAPI;
- retornar códigos HTTP correctos;
- manejar Webhooks en endpoints dedicados;
- utilizar un formato de error estándar, preferentemente `ProblemDetails`.

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

---

## AC10 — Usabilidad

El frontend debe distinguir claramente estados como:

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

---

## AC12 — Recuperabilidad

Consideraciones:

- migraciones versionadas;
- backups gestionados por PostgreSQL/Supabase según el plan contratado;
- procedimientos de restauración documentados;
- datos de infraestructura reproducibles;
- secretos fuera del repositorio.

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
15. observabilidad y logs.



---

# 5. Capa perimetral y API REST

Cloudflare y ASP.NET Core cumplen responsabilidades diferentes:

| Capa | Responsabilidad |
|---|---|
| **Cloudflare** | DNS, CDN, WAF, TLS, mitigación DDoS y reglas perimetrales. |
| **ASP.NET Core API** | CORS, rate limiting de aplicación, autenticación, autorización, OpenAPI, errores, logging y reglas de negocio. |

No se incorpora un API Gateway independiente en la primera versión porque existiría un único backend monolítico y varias de sus funciones se duplicarían con Cloudflare y ASP.NET Core.

Si la arquitectura evoluciona a múltiples backends, esta decisión podrá revisarse.
