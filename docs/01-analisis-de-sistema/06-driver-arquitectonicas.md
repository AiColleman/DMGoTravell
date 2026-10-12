# 06. Drivers arquitectónicos

## Propósito

Los drivers arquitectónicos representan las necesidades de negocio, calidad y restricciones que influyen directamente en la estructura de DMGOTRAVEL.

---

# 1. Objetivos de negocio

DMGOTRAVEL debe:

- centralizar la oferta turística y hotelera;
- permitir reservas simples y compuestas;
- procesar pagos electrónicos;
- evitar sobreventa;
- automatizar tareas operativas;
- conservar trazabilidad;
- mantener un costo operativo razonable;
- permitir crecimiento progresivo sin introducir complejidad distribuida innecesaria.

---

# 2. Drivers principales

| ID | Driver | Origen | Impacto arquitectónico |
|---|---|---|---|
| **DA01** | Soportar crecimiento del tráfico. | AC03 | Backend stateless, frontend independiente y posibilidad de escalado horizontal. |
| **DA02** | Mantener buen rendimiento en catálogo y consultas. | AC01 | Paginación, índices, DTOs, consultas optimizadas y caché limitada a datos no críticos. |
| **DA03** | Proteger identidad y datos de clientes. | AC04, AC05 | Identity, JWT, RBAC, aislamiento por usuario, HTTPS y políticas de seguridad. |
| **DA04** | Procesar pagos externos de forma segura. | RC14 | Integración desacoplada, idempotencia, Webhooks y trazabilidad de pagos. |
| **DA05** | Evitar sobreventa. | AC07 | PostgreSQL, transacciones y estrategia explícita de concurrencia. |
| **DA06** | Automatizar vencimiento de reservas. | RC17 | Hangfire y trabajos idempotentes. |
| **DA07** | Enviar notificaciones sin bloquear la operación principal. | RC15 | Servicio de correo desacoplado e intentos persistidos. |
| **DA08** | Conservar historial. | RN, AC09 | Snapshots de precio, borrado lógico y auditoría. |
| **DA09** | Mantener el sistema modificable y testeable. | AC06, AC11 | Clean Architecture, módulos, interfaces y CQRS. |
| **DA10** | Reducir complejidad de infraestructura inicial. | Restricción de proyecto | Monolito Modular en lugar de microservicios. |

---

# 3. Driver principal: integridad transaccional

El núcleo del sistema es la reserva.

Una reserva puede involucrar:

```text
Tour
+
Alojamiento opcional
+
Pago
```

La creación de la reserva debe evitar inconsistencias como:

- reservar un tour sin cupos;
- bloquear hotel sin poder bloquear tour;
- descontar dos veces la misma habitación;
- confirmar una reserva sin pago válido;
- liberar disponibilidad dos veces.

Por lo tanto, **integridad y concurrencia** son los drivers técnicos más importantes del dominio.

---

# 4. Decisiones derivadas

## DA05 — Concurrencia

Implica:

```text
PostgreSQL
+
Entity Framework Core
+
Transacciones
+
Bloqueos/controles de concurrencia
+
Restricciones de BD
```

La solución exacta se documentará en el diseño de persistencia.

---

## DA04 — Pagos

Implica separar:

```text
Reserva pending
        |
        v
Intento de pago
        |
        v
Confirmación del proveedor
        |
        v
Reserva confirmed
```

La API no debe utilizar un botón administrativo como mecanismo normal de confirmación de pagos.

---

## DA06 — Automatización

El vencimiento se ejecutará con Hangfire.

```text
Reserva pending
      |
      | plazo vencido
      v
Hangfire
      |
      v
cancelled
      |
      +--> liberar tour
      +--> liberar hotel
      +--> auditoría
```

---

# 5. Tensiones arquitectónicas

| Tensión | Riesgo | Resolución inicial |
|---|---|---|
| Rendimiento vs consistencia | Cachear disponibilidad puede mostrar datos incorrectos. | Cachear contenido descriptivo, no disponibilidad crítica. |
| Simplicidad vs modularidad | Un monolito puede convertirse en código fuertemente acoplado. | Monolito Modular + Clean Architecture. |
| Escalado horizontal vs caché local | `IMemoryCache` no se comparte entre instancias. | Utilizarlo solo donde sea seguro y diseñar migración futura a caché distribuida. |
| Pago síncrono vs eventos externos | Puede existir retraso entre intento y confirmación. | Persistir Payment y procesar Webhooks de forma idempotente. |
| Correo vs confirmación | Un fallo de correo no debe revertir un pago. | Confirmar pago primero y manejar notificación como proceso separado. |
| Borrado vs historial | Eliminar catálogo puede romper reservas antiguas. | Soft delete y snapshots de datos críticos. |
| Bajo costo vs alta disponibilidad | Los planes gratuitos o básicos pueden tener límites. | Diseñar portabilidad mediante Docker y servicios desacoplados. |

---

# 6. Priorización

| Prioridad | Driver |
|---|---|
| **Crítica** | DA05 — Integridad y concurrencia |
| **Crítica** | DA04 — Seguridad e idempotencia de pagos |
| **Alta** | DA03 — Seguridad e identidad |
| **Alta** | DA09 — Mantenibilidad y testabilidad |
| **Alta** | DA06 — Automatización operativa |
| **Media** | DA01 — Escalabilidad |
| **Media** | DA02 — Rendimiento |
| **Media** | DA07 — Notificaciones |
| **Media** | DA08 — Historial |
| **Media** | DA10 — Simplicidad operativa |

---

# 7. Trazabilidad de drivers

```text
Objetivos de negocio
       |
       v
Historias de usuario
       |
       v
Requisitos
       |
       v
Atributos de calidad / Restricciones
       |
       v
Drivers arquitectónicos
       |
       v
ADR
       |
       v
Implementación
```

Toda decisión arquitectónica importante debe poder vincularse al menos con un driver.

---

# 8. API Gateway como evolución futura

Un API Gateway independiente no es un driver de la primera versión porque:

- existe un único backend monolítico;
- ASP.NET Core ya gestiona routing, CORS, rate limiting, autenticación y logging;
- Cloudflare ya cubre WAF, DDoS, TLS y políticas perimetrales;
- añadir un Gateway introduciría una nueva capa operativa con beneficios limitados en el escenario actual.

Se considerará como evolución si aparecen múltiples APIs, BFF, microservicios o necesidades avanzadas de routing.
