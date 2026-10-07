# 01. Actores del sistema

## Propósito

Este documento identifica los actores humanos, sistemas externos y procesos automatizados que interactúan con **DMGOTRAVEL**, delimitando sus responsabilidades y restricciones dentro del alcance del sistema.

La solución se implementará con **React** en el frontend y **ASP.NET Core** en el backend. La propia aplicación ASP.NET Core expondrá la **API REST**, utilizará **JWT** para autenticación, **PostgreSQL** como motor relacional, **Entity Framework Core** como ORM y servicios externos como **Culqi**, **Resend**, **Google OAuth** y **Cloudflare R2**.

---

## Resumen de actores

| Actor | Tipo | Responsabilidad principal |
|---|---|---|
| **Cliente** | Humano, primario | Consultar ofertas y hoteles, autenticarse, realizar reservas, pagar y gestionar su perfil. |
| **Administrador** | Humano, primario | Gestionar catálogo, hoteles, reservas, clientes, auditoría e indicadores. |
| **Culqi** | Sistema externo | Procesar pagos electrónicos y notificar eventos de pago mediante Webhooks. |
| **Google** | Sistema externo | Proveer autenticación social mediante OAuth 2.0 / OpenID Connect. |
| **Resend** | Sistema externo | Enviar correos transaccionales y comprobantes. |
| **Cloudflare R2** | Sistema externo | Almacenar imágenes y archivos multimedia del catálogo. |
| **Hangfire** | Proceso interno automatizado | Ejecutar trabajos en segundo plano, como vencimiento de reservas y reintentos controlados. |

---

## 1. Cliente

**Tipo:** Humano, primario.

**Descripción:** Usuario final de la plataforma. Puede explorar el catálogo de manera anónima, pero debe autenticarse para realizar operaciones asociadas a una cuenta, como reservar, pagar o consultar su historial.

### Responsabilidades

- Consultar el catálogo público de ofertas turísticas activas.
- Consultar hoteles, tipos de habitación, tarifas y disponibilidad.
- Registrarse mediante correo y contraseña.
- Iniciar sesión con credenciales locales.
- Iniciar sesión mediante Google OAuth.
- Crear una reserva turística.
- Agregar alojamiento de forma opcional.
- Consultar el precio total calculado por el backend.
- Realizar el pago electrónico mediante Culqi.
- Consultar su historial y el estado de sus reservas.
- Cancelar una reserva únicamente mientras se encuentre en estado `pending`.
- Actualizar sus datos personales permitidos.
- Solicitar la eliminación lógica de su cuenta.
- Recibir correos de confirmación y comprobantes.

### Restricciones

- No puede acceder a reservas pertenecientes a otros clientes.
- No puede establecer manualmente el precio de una reserva.
- No puede modificar directamente el estado de una reserva.
- No puede confirmar una reserva sin que exista un pago validado.
- No puede acceder a funciones administrativas.

---

## 2. Administrador

**Tipo:** Humano, primario.

**Descripción:** Usuario responsable de la operación administrativa de DMGOTRAVEL. Accede mediante autenticación y autorización basada en roles.

### Responsabilidades

- Crear, modificar, activar y desactivar ofertas turísticas.
- Gestionar paquetes turísticos.
- Registrar y actualizar hoteles.
- Gestionar tipos de habitación, tarifas e inventario.
- Consultar reservas de todos los clientes.
- Consultar clientes registrados.
- Gestionar estados operativos permitidos de las reservas.
- Consultar registros de auditoría.
- Consultar indicadores de operación y ventas.
- Exportar reportes administrativos.
- Supervisar tareas operativas y excepciones.

### Restricciones

- No existe registro público para cuentas administrativas.
- Una cuenta administrativa debe ser aprovisionada mediante un mecanismo interno controlado.
- No puede editar ni eliminar registros de auditoría.
- No debe cambiar una reserva `pending` a `confirmed` sin evidencia de un pago válido.
- Las operaciones críticas deben quedar registradas en auditoría.

---

## 3. Culqi

**Tipo:** Sistema externo, secundario.

**Descripción:** Pasarela de pagos encargada de procesar transacciones electrónicas.

### Responsabilidades

- Tokenizar o procesar la información de pago según el flujo oficial de Culqi.
- Procesar la transacción solicitada.
- Retornar el resultado del intento de pago.
- Emitir eventos mediante Webhooks cuando corresponda.

### Responsabilidades del backend frente a Culqi

El backend de DMGOTRAVEL debe:

- Calcular el importe final de la reserva en el servidor.
- No confiar en importes recibidos desde el frontend.
- Relacionar cada operación de pago con una reserva.
- Registrar el identificador externo de la operación.
- Validar la autenticidad del Webhook conforme al mecanismo oficial de Culqi.
- Implementar idempotencia para evitar procesamiento duplicado.
- Confirmar la reserva únicamente después de validar un pago exitoso.
- Registrar fallos, reintentos o eventos relevantes para trazabilidad.

---

## 4. Google

**Tipo:** Sistema externo, secundario.

**Descripción:** Proveedor de identidad utilizado para autenticación social.

### Responsabilidades

- Autenticar al usuario en la infraestructura de Google.
- Solicitar consentimiento para compartir información autorizada.
- Proporcionar al backend la identidad verificada del usuario.

### Responsabilidades del backend

- Validar correctamente la respuesta del proveedor.
- Vincular la identidad externa con una cuenta local.
- Evitar duplicación de usuarios por correo.
- Emitir los tokens de acceso propios de DMGOTRAVEL después de validar la identidad.

---

## 5. Resend

**Tipo:** Sistema externo, secundario.

**Descripción:** Servicio de correo transaccional.

### Responsabilidades

- Enviar mensajes generados por DMGOTRAVEL.
- Entregar confirmaciones y comprobantes de pago.
- Retornar el resultado de la solicitud de envío.

### Responsabilidades del backend

- Registrar cada intento de notificación.
- Evitar envíos duplicados.
- Conservar el identificador retornado por el proveedor cuando esté disponible.
- Reintentar únicamente cuando corresponda.
- No bloquear la confirmación del pago por un fallo temporal del servicio de correo.

---

## 6. Cloudflare R2

**Tipo:** Sistema externo, secundario.

**Descripción:** Servicio de almacenamiento de objetos utilizado para archivos multimedia.

### Responsabilidades

- Almacenar imágenes del catálogo turístico y hoteles.
- Proporcionar acceso controlado a los archivos.

### Responsabilidades del backend

- Validar extensión, tipo MIME y tamaño máximo.
- Generar nombres de archivo no predecibles.
- Almacenar únicamente las referencias necesarias en PostgreSQL.
- Aplicar una estrategia consistente de eliminación o reemplazo de archivos.

---

## 7. Hangfire

**Tipo:** Proceso interno automatizado.

**Descripción:** Mecanismo de trabajos en segundo plano integrado en el backend ASP.NET Core.

### Responsabilidades

- Detectar reservas `pending` cuyo plazo de pago haya vencido.
- Cambiar las reservas vencidas a `cancelled`.
- Liberar cupos turísticos bloqueados.
- Liberar inventario hotelero bloqueado.
- Registrar la operación automática en auditoría.
- Ejecutar reintentos controlados de procesos que lo requieran.

### Consideraciones

- El tiempo máximo de una reserva pendiente debe definirse mediante configuración.
- Los trabajos deben ser idempotentes.
- Una ejecución repetida no debe liberar dos veces el mismo inventario ni alterar una reserva ya finalizada.

---

## Matriz actor-funcionalidad

| Funcionalidad | Cliente | Administrador | Culqi | Google | Resend | R2 | Hangfire |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Consultar catálogo | ✓ | ✓ |  |  |  | ✓ |  |
| Gestionar catálogo |  | ✓ |  |  |  | ✓ |  |
| Registrarse / iniciar sesión | ✓ | ✓ |  | ✓ |  |  |  |
| Crear reserva | ✓ |  |  |  |  |  |  |
| Procesar pago | ✓ |  | ✓ |  |  |  |  |
| Confirmar pago |  |  | ✓ |  |  |  |  |
| Enviar comprobante |  |  |  |  | ✓ |  | ✓ |
| Consultar historial | ✓ | ✓ |  |  |  |  |  |
| Cancelar reserva pendiente | ✓ | ✓ |  |  |  |  | ✓ |
| Gestionar hoteles |  | ✓ |  |  |  | ✓ |  |
| Consultar auditoría |  | ✓ |  |  |  |  |  |
| Ejecutar tareas automáticas |  |  |  |  |  |  | ✓ |

---

## Criterio de consistencia tecnológica

A partir de este documento, toda la documentación del proyecto debe considerar como base:

```text
Frontend        React
Backend         ASP.NET Core / C#
API             REST / JSON
Autenticación   ASP.NET Core Identity + JWT
OAuth           Google
ORM             Entity Framework Core
Base de datos   PostgreSQL / Supabase
CQRS            MediatR
Validación      FluentValidation
Background      Hangfire
Pagos           Culqi
Correo          Resend
Archivos        Cloudflare R2
Hosting web     Vercel
Hosting API     Render
Edge            Cloudflare CDN / WAF
```


---

## Evolución futura de entrada a la API

La primera versión de DMGOTRAVEL no requiere un API Gateway independiente.

La topología inicial será:

```text
Cliente
  |
Cloudflare
  |
ASP.NET Core REST API
```

Si en el futuro existen múltiples servicios backend, BFF, APIs especializadas o necesidades avanzadas de enrutamiento, podrá evaluarse la incorporación de un API Gateway mediante una nueva ADR.
