# 05. Restricciones del sistema

## Propósito

Las restricciones limitan las alternativas tecnológicas, arquitectónicas u operativas permitidas en DMGOTRAVEL.

Estas restricciones constituyen decisiones obligatorias para la implementación inicial.

---

# 1. Restricciones tecnológicas y arquitectónicas

| ID | Restricción | Descripción |
|---|---|---|
| **RC01** | Aplicación web | DMGOTRAVEL debe ser accesible desde navegador web. |
| **RC02** | Frontend | La interfaz cliente y administrativa se implementará con React. |
| **RC03** | Backend | El backend se implementará con ASP.NET Core y C#. |
| **RC04** | Estilo de backend | La solución backend se desplegará inicialmente como Monolito Modular. |
| **RC05** | Enfoque interno | El backend aplicará Clean Architecture. |
| **RC06** | API | Frontend y backend se comunicarán mediante una API REST sobre HTTPS y JSON. |
| **RC07** | CQRS | Los casos de uso principales se organizarán mediante Commands y Queries utilizando MediatR. |
| **RC08** | Validación | Las validaciones de entrada se implementarán de manera consistente utilizando FluentValidation o mecanismos equivalentes definidos por la solución. |
| **RC09** | Persistencia | La base de datos relacional será PostgreSQL. |
| **RC10** | ORM | El acceso principal a persistencia se implementará con Entity Framework Core y Npgsql. |
| **RC11** | Proveedor gestionado | La primera infraestructura de PostgreSQL utilizará Supabase, salvo una nueva ADR que cambie esta decisión. |
| **RC12** | Autenticación | La API utilizará ASP.NET Core Identity y JWT; no se utilizarán sesiones de servidor como mecanismo principal entre React y la API. |
| **RC13** | OAuth | La autenticación social inicial utilizará Google. |
| **RC14** | Pagos | La pasarela de pago inicial será Culqi. |
| **RC15** | Correo | El servicio de correo transaccional será Resend. |
| **RC16** | Multimedia | Las imágenes y archivos multimedia se almacenarán en Cloudflare R2. |
| **RC17** | Background jobs | Los trabajos persistentes y programados se gestionarán con Hangfire. |
| **RC18** | Hosting frontend | El frontend se desplegará inicialmente en Vercel. |
| **RC19** | Hosting backend | El backend se desplegará inicialmente en Render. |
| **RC20** | Edge | DNS, CDN y WAF se gestionarán mediante Cloudflare. |
| **RC21** | Contenedores | El backend deberá ser ejecutable mediante Docker. |
| **RC22** | Versionamiento | El código y documentación se gestionarán mediante Git y GitHub. |
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

---

# 4. Restricciones de despliegue

El entorno productivo inicial será:

```text
Usuario
  |
Cloudflare
  |
Vercel / React
  |
HTTPS / REST
  |
Cloudflare
  |
Render / ASP.NET Core
  |
  +--> PostgreSQL / Supabase
  +--> Cloudflare R2
  +--> Culqi
  +--> Resend
  +--> Google OAuth
```

---

# 5. Restricciones de alcance

Para la primera versión:

- no se utilizarán microservicios;
- no se utilizará SQL Server;
- no se utilizará Laravel;
- no se utilizará Laravel Sanctum;
- no se utilizará Laravel Socialite;
- no se utilizará Laravel Scheduler;
- no se utilizarán sesiones PHP;
- no se almacenarán imágenes en el filesystem local del backend;
- no se utilizará el frontend como fuente oficial para cálculos financieros;

---

# 6. Cambios de restricciones

Cualquier modificación importante deberá registrarse mediante una nueva decisión arquitectónica.

Ejemplos:

- cambiar PostgreSQL por otro motor;
- sustituir Culqi;
- mover el backend a otro proveedor;
- sustituir Hangfire;
- introducir microservicios;
- cambiar el mecanismo de autenticación.

Una restricción no debe modificarse de manera silenciosa en un documento aislado.