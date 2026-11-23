# Plan técnico — Spec 005: Identidad y autenticación

> **Fecha:** 2026-11-01. **Versión del plan:** 0.1.  
> **Base:** [spec v0.1 aprobada](spec.md), 30 criterios, DEC-148; DEC-142–DEC-147 y contratos aprobados de 004/004-C/010.  
> **Estado:** propuesta técnica, **NO EJECUTADA** ni validada mediante implementación.  
> **Directorio confirmado:** `C:\Users\Asus TUF\Desktop\DMGoTravelll`; actividad exclusiva en su `sdd/`. No escribir en la carpeta homónima `DMGoTravell`. Sin código, cuentas, claves, configuración externa, commits ni push.

## 1. Objetivo y límites

Planificar registro/login local, verificación de correo, JWT propio con refresh rotatorio, logout de sesión actual, acceso/vinculación Google, recuperación de contraseña, autorización `client`/`admin`, seed controlado y auditoría. Preservar `005/RF-1–RF-30`, las specs aprobadas y todos los planes previos.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [fuentes](../../fuentes.md), [trazabilidad](../../trazabilidad.md), RF03/RF04, HU-03/HU-04/HU-05, RN-25–RN-27, RS01–RS05/RS12 y ADR-009/ADR-010. [004 plan](../004-notificaciones/plan.md) determina transporte protegido y entrega, sin emitir enlaces por iniciativa propia.

No implementar perfil/baja de 008, gestión administrativa de usuarios desde pantalla, MFA, passkeys u otro proveedor social. La referencia histórica de la spec a administración de usuarios en 009 no autoriza esa funcionalidad: 009 gestiona reservas y 010 consulta clientes en solo lectura.

## 2. Evidencia pública consultada

Consulta el **2026-11-01**, sin instalar paquetes ni configurar proveedores:

| Referencia oficial | Información utilizada | Límite de evidencia |
|---|---|---|
| [Microsoft: Identity configuration](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration) | Identity permite configurar contraseña, bloqueo y correo único; sus valores predeterminados no equivalen a la política aprobada del proyecto. | No fija la versión/runtime/paquetes de este repositorio ni justifica copiar SQL Server/Razor/cookies como arquitectura principal. |
| [Microsoft: Identity API authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization) | Los tokens incorporados de Identity API no son JWT estándar; emitir un token no garantiza revocarlo antes de expirar sin controles adicionales. | No sustituye el JWT propio y refresh rotatorio de DEC-142 ni demuestra su implementación. |
| [Google: OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) | Validar issuer/audience/expiración/nonce; `sub` es identificador estable de Google, no el correo. `state`/contexto de flujo protegen el retorno. | No acredita client ID, secret, callbacks o dominios de una aplicación Google del proyecto. |
| [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | Protección de refresh, rotación/detección de reutilización y defensas del flujo de autorización, incluidas PKCE y vinculación de contexto. | Es referencia de seguridad, no permiso para agregar proveedores, roles o mecanismos fuera de la spec. |

Seleccionar y verificar versiones compatibles de ASP.NET Core Identity, JwtBearer/validación JWT, OIDC y Npgsql antes de implementar. No asumir que `MapIdentityApi` cubre por defecto la política de este plan.

## 3. Dependencias y datos autorizados

| Origen | Contrato requerido | Límite |
|---|---|---|
| 004 base + complemento | Entregar enlace autorizado, payload temporal protegido, destinatario/validez antes de emitir o reintentar | Plan y 30 tareas disponibles, no ejecutados; un reenvío manual no crea/renueva enlaces. |
| 001/002 | Contexto de cliente/propietario y correo verificado antes de reservar o pagar | No aceptar usuario, rol o verificación impuestos por el navegador; no editar sus reglas comerciales. |
| 009/010 | Rol administrativo y lectura autorizada de cuenta/estado | No convertir una consulta de clientes en gestión de roles o una edición de cuentas. |
| 008 | Señal de cuenta deshabilitada/baja lógica, cuando se especifique | 005 bloquea acceso según el estado persistido; no decide campos editables, reutilización de correo ni efectos de baja sobre reservas. |
| 010 | Auditoría de acciones críticas, solo anexada, sin secretos | Contrato aprobado, plan propio aún pendiente; registro local conjunto para efectos controlables y recuperación verificable. |

Lectura conjunta de 005/RF-6/RF-22/RF-25 con el complemento aprobado: únicamente el **enlace previsto para su destinatario** puede transportar la prueba de verificación/restablecimiento. No enviar token bruto separado, contraseña, enlaces a administradores o secretos en respuestas públicas/logs/auditoría. El complemento es la excepción acotada de entrega, no una relajación general de RF-25.

## 4. Organización técnica propuesta

Mantener monolito ASP.NET Core/C#, Clean Architecture, CQRS/MediatR, FluentValidation y PostgreSQL/EF Core/Npgsql. Identity administra usuarios/password hashing/roles; un emisor de JWT propio y un almacén de refresh implementan las reglas explícitas. Google es adaptador OIDC externo; Resend sigue detrás de 004.

Domain no depende de middleware/HTTP/SDK. Application coordina actor, cuentas, sesiones/familias, solicitudes de enlace, autorización, reloj, límites de uso y auditoría. Infrastructure implementa Identity stores, criptografía/validación JWT/OIDC y transacciones. Presentation define endpoints y transporte seguro; frontend conserva access solo en memoria y nunca gobierna roles/verificación.

No usar ASP.NET Session o sesión en memoria como mecanismo principal, Redis/broker, otro servidor de identidad desplegable o proveedor nuevo. Consultar estado persistido para revocación/autorización no convierte una sesión HTTP de servidor en el mecanismo de acceso: la credencial presentada sigue siendo el JWT.

## 5. Parámetros técnicos iniciales

Propuestas del plan, pendientes de pruebas de seguridad/compatibilidad y configuración antes de ejecutar; no son cambios de la spec:

| Parámetro | Propuesta | Condición |
|---|---|---|
| Access JWT | 5 minutos; tolerancia de validación temporal explícita de 0 segundos | Relojes de backend sincronizados; no heredar un margen del middleware que cambie silenciosamente el vencimiento. |
| Familia de refresh | 14 días absolutos desde login/registro, sin extender la fecha al rotar | Cada refresh de un solo uso, con expiración limitada por la familia. |
| Refresh opaco | 32 bytes de aleatoriedad criptográfica, transporte codificado seguro y digest SHA-256 en el almacén | No contraseña ni token predecible; no persistir el valor reutilizable en claro. |
| Verificación de correo | 24 horas, uso único | Persistir solicitud/consumo y comprobar vigencia antes de entregar; no equivalencia con la ventana Resend. |
| Restablecimiento | 30 minutos, uso único | Consumo, cambio de contraseña y revocación de familias en una transacción local. |
| Flujo Google | Hasta 10 minutos, `state`/nonce/PKCE/contexto de un solo uso | Identidad, callback y navegador vinculados; no prolongar el flujo por un replay. |
| Reautenticación para vincular Google | Contraseña local validada en los últimos 5 minutos | Prueba de autenticación local ligada a cuenta/flujo; no es un nuevo factor ni acepta solo un correo coincidente. |
| Contraseña local | 12 a 128 caracteres Unicode; permitir frases/espacios, sin exigir clases arbitrarias | Endurece el mínimo 8 permitido por la spec; rechazar igualdad con correo y no recortar/normalizar silenciosamente la contraseña guardada. |
| Hash de contraseña | Implementación versionada de ASP.NET Core Identity, con rehash al evolucionar parámetros | Verificar configuración/work factor y medir en host objetivo; no criptografía propia ni hashes rápidos de contraseña. |

Propuesta de límites iniciales, compartidos entre instancias y no colas largas que oculten bloqueo:

| Operación | Límite técnico inicial |
|---|---|
| Registro | 5 solicitudes por IP cada 15 minutos. |
| Login local | 10 solicitudes por IP/minuto y bloqueo de cuenta por 15 minutos tras 5 contraseñas fallidas; respuesta genérica. |
| Refresh | 30 por familia/minuto y 120 por IP/minuto; no aceptar familia arbitraria del cuerpo para aplicar revocación. |
| Uso de enlace de verificación | 5 intentos por solicitud cada 15 minutos. |
| Recuperación | 3 solicitudes por cuenta/correo normalizado cada hora y 10 por IP/hora; mismo patrón de respuesta para cuenta inexistente. |
| Inicio/callback Google | 10 flujos por IP cada 15 minutos y consumo único de cada contexto. |

Medir estos valores con carga/NAT y pruebas de abuso, sin revelar si el correo existe por un error distinto. No copiar el estado `RequireConfirmedAccount` como bloqueo global de login: la spec permite iniciar sesión local sin verificar, pero prohíbe reservar/pagar. Los mecanismos de rate/bloqueo no modifican plazos de reservas.

## 6. Modelo e invariantes de persistencia

- **Cuenta:** ID interno, correo normalizado único, estado/verificación, hash Identity cuando exista, roles y versión global de seguridad. No unir automáticamente cuentas por correo, eliminar unicidad al dar de baja ni decidir reutilización pendiente de 008.
- **Identidad Google:** proveedor/issuer y `sub` únicos, relacionados con ID local. Correo es atributo/condición de vinculación, nunca la clave externa estable.
- **Familia/sesión de refresh:** ID opaco, cuenta, creación/expiración absoluta, revocación/motivo y versión de seguridad al emitir; cada login crea una familia propia.
- **Refresh:** digest único, familia, emisión/expiración, consumo/reemplazo y revocación. Conservar evidencia de digests consumidos mientras sea necesaria para detectar reutilización de una familia vigente; no conservar el secreto bruto.
- **Solicitud de enlace:** ID, cuenta, propósito, fecha/vencimiento/consumo y verificador protegido o digest; separación de transporte secreto de 004 y evidencia sin secreto de 010.
- **Flujo OIDC:** propósito login/vinculación, cuenta/familia esperadas si corresponde, verificadores de contexto y vencimiento, uso único y destino de retorno de lista permitida. No serializar secretos en jobs ni logs.

Unicidad efectiva de correo normalizado y proveedor/`sub` en PostgreSQL, no solo validación antes de insertar. Transacciones y bloqueo/actualización condicional sobre familia, token y solicitud impiden dos rotaciones o dos consumos del mismo enlace. Definir orden de bloqueo común y pruebas reales, no exclusión solo en memoria.

Cambios de cuenta/familia/enlace y auditoría de operaciones controlables se confirman juntos; no devolver tokens o marcar un enlace consumido si el commit falló. Una respuesta perdida no justifica saltarse el consumo único o restaurar un token antiguo.

## 7. JWT, cookies, frontend y revocación

Proponer JWT firmado con algoritmo asimétrico permitido explícitamente (inicialmente RS256) y claves gestionadas fuera del repositorio; validar algoritmo, firma, `iss`, `aud`, `exp`, `nbf` y clave activa/retirada según rotación. Verificar implementación y tamaño de claves con librería mantenida, no aceptar `alg=none` ni algoritmos decididos por input externo.

Claims mínimos: ID local como `sub`, ID de token `jti`, familia `sid`, rol y versión de seguridad, además de tiempos/issuer/audience. No incluir email/datos de perfil sin necesidad, contraseña, refresh o secretos. La verificación de correo y estado/rol efectivos se comprueban contra la fuente autorizada, no solo un claim obsoleto.

Antes de autorizar cada operación protegida, validar cuenta activa, familia no revocada y versión de seguridad vigente contra persistencia confiable. Esto hace comprobable la revocación de la sesión actual y el reset global sin fingir que una firma deja de ser válida por sí sola. Si ese estado no puede comprobarse, fallar cerrado para la operación protegida; no confiar en un caché de proceso como única autoridad de revocación.

Frontend: access solo en memoria, no `localStorage`/`sessionStorage` o URLs. Refresh en cookie `HttpOnly`, `Secure`, host-only, sin `Domain`; si se adopta prefijo `__Host-`, respetar `Path=/` y sus restricciones. No devolver el refresh al JavaScript de la SPA por comodidad.

Definir topología de orígenes antes de fijar `SameSite`: sitio propio común permite una política restrictiva compatible; Vercel/Render en sitios distintos requieren validar cookies cross-site y protección CSRF, no prometer funcionamiento con `Lax` por defecto. CORS solo para orígenes explícitos, nunca wildcard con credenciales. Refresh/logout y endpoints que autentican por cookie requieren token antiforgery, verificación de origen y encabezados apropiados; JWT en header no sustituye esa protección del canal cookie.

No ampliar el alcance a un BFF o servicio nuevo para ocultar un problema de cookies. Si el navegador/despliegue no permite el transporte seguro, la puerta I-03 sigue bloqueada hasta validar una configuración compatible; no cambiar a almacenamiento inseguro.

## 8. Flujos locales y concurrencia

### Registro y correo verificado

Validar datos/contraseña, normalizar correo mediante el contrato de Identity y crear cuenta `client` bajo unicidad. Persistir cuenta, familia/refresh, solicitud/intención de verificación y auditoría antes de responder con access y cookie de refresh. Un correo duplicado se rechaza sin crear otra cuenta; evitar que errores de base filtren información adicional.

El login local sin verificar está permitido. La autorización de reservar/pagar comprueba el estado verificado actual, no que el registro devolvió tokens. La verificación consume una solicitud válida una sola vez; repetición no duplica efectos y no marca otra cuenta/correo como verificados.

### Login, rotación y logout

- Login: validación con Identity y respuesta genérica de credenciales/estado inválidos; no publicar si falló correo, cuenta o bloqueo. Autenticación/auditoría/familia se coordinan antes de emitir credenciales.
- Refresh: buscar por digest real, bloquear familia/token, verificar estado/vencimiento/versión y consumo, marcar usado y crear reemplazo con el mismo vencimiento absoluto de familia. Emitir access/cookie solo tras commit; rotar atómicamente también bajo dos workers.
- Reutilización de refresh consumido: revocar **esa familia**, no todas las del usuario, y exigir login. No crear una ventana de gracia que permita reutilizar el refresh aprobado como de un solo uso.
- Una doble petición legítima concurrente o una respuesta perdida pueden activar esa detección estricta. La SPA debe coordinar refresh entre peticiones/pestañas y limpiar el acceso si se revoca; no resolverlo revalidando el token anterior ni guardando el reemplazo en claro.
- Logout: revocar solo la familia actual/refresh reutilizable, limpiar cookie y access en cliente; otras familias siguen activas. La autorización por `sid` evita prometer una revocación imposible de un JWT aislado sin comprobación de estado.

### Recuperación y reset

Responder genéricamente a la solicitud; cuenta inexistente no genera enlace. Para una cuenta válida, crear solicitud de uso único e intención protegida de correo; nunca devolver el enlace en el response público o enviarlo a un correo arbitrario distinto del autorizado.

Al consumir un enlace válido: comprobar propósito/cuenta/vigencia/uso, validar nueva contraseña, cambiar hash y versión global, consumir solicitud y revocar todas las familias en un commit local auditado. Un refresh concurrente se serializa con ese cambio y no permite mantener una sesión válida por el orden de llegada de respuestas. Un segundo reset con enlace usado/vencido falla sin cambiar contraseña.

Reintentos/reenvíos de 004 no renuevan enlaces ni extienden TTL. La spec no define un flujo nuevo de reemisión de verificación vencida o cambio de correo; no inventar endpoints de gestión de perfil desde este plan. Si la implementación exige ampliar ese alcance, formalizar la ampliación antes de ejecutarla, no usar el reenvío manual de 004 como atajo.

## 9. Google OIDC: login y vinculación separados

Proponer Authorization Code con PKCE S256, `state` y `nonce`, callback backend fijo HTTPS y scopes mínimos `openid email profile` sin acceso offline o APIs ajenas a identidad. Configurar metadatos/JWKS oficiales y validación de issuer/audience/expiración/nonce; el ID token no se acepta como JWT propio de la API.

Consumir una sola vez un contexto OIDC del navegador, propósito y retorno permitido. No aceptar códigos, callback URI o cuenta de destino suministrados sin vinculación al flujo. Guardar verificadores/credenciales protegidos fuera de auditoría y no registrar query strings de callback con código/token.

| Resultado | Decisión del backend |
|---|---|
| Identidad validada, correo verificado y sin cuenta local | Crear `client` sin duplicar correo/`sub`, respetando unicidad transaccional y estado verificado según el contrato de la spec. |
| Correo ya corresponde a cuenta con contraseña y no existe una vinculación previa de esa identidad Google | Rechazar login Google e indicar acceso local y vinculación posterior; jamás unir automáticamente por email. |
| `sub` ya vinculado | Autenticar únicamente su cuenta local activa, sin cambiar roles por claims del proveedor. Un cambio de correo externo no reubica la identidad en otra cuenta. |
| Correo externo no verificado, claims/issuer/audience/nonce inválidos | Rechazar sin emitir tokens propios ni vincular. |
| Vinculación iniciada por cliente local autenticado con contraseña | Exigir contexto ligado a su cuenta/familia y prueba local reciente; correo Google verificado coincidente y `sub` no vinculado a otra cuenta. No extender el flujo a administración de usuarios. |

Resolver primero una identidad issuer/`sub` ya vinculada; la prohibición de unir por correo protege el caso sin vinculación previa, no convierte en inútil una vinculación autorizada ya realizada. Login y vinculación son propósitos distintos; no convertir un callback de login fallido en vinculación ni crear una cuenta nueva cuando se estaba vinculando una existente. En vinculación volver a validar cuenta/estado y contexto antes del commit, sin confiar solo en el ID incluido en una URL.

Al terminar el flujo, el backend establece el transporte seguro de la familia propia y redirige a una ruta limpia permitida; la SPA obtiene el access por un intercambio/refresh protegido del propio backend. No colocar access/refresh propios en URL, fragmento, redirección abierta o HTML registrable. El código de autorización de Google en su callback se trata como secreto de protocolo y se sanea de logs.

No añadir desvinculación, gestión administrativa de cuentas o un proveedor extra por el hecho de que la auditoría mencione acciones de identidad. Los detalles de una operación futura fuera de criterios existentes requieren su alcance aprobado.

## 10. Roles, seed, secretos y auditoría

- Registro público admite únicamente rol `client`, nunca un rol del cuerpo. Políticas administrativas comprueban rol vigente además de firma; no depender de un claim antiguo para una elevación o cuenta deshabilitada.
- Seed inicial por herramienta/migración controlada, **sin contraseña embebida en migraciones/repositorio ni una contraseña por defecto**. Tomar credencial de fuente segura autorizada, aplicar política/hash y auditar actor de despliegue. Operación idempotente, sin recrear, reactivar o sobrescribir silenciosamente una cuenta con correo coincidente.
- Ningún endpoint público crea `admin`, cambia roles o recibe una credencial de seed; no crear una pantalla de usuarios/roles fuera de alcance. Resolver roles `client`/`admin` con IDs propios, no con Google `hd` o una lista de correos hardcodeada.
- Gestionar y rotar claves de firma/validación y protección de enlaces/cargas temporales con almacenamiento compartido durable y protegido entre réplicas; no depender del disco efímero del contenedor. No elegir un proveedor de claves nuevo sin decisión correspondiente.
- Auditar registro, verificación, login/fallo relevante, vinculación, cambios críticos permitidos y revocación con referencias mínimas, actor, fecha y resultado. No registrar password, JWT, refresh, código, nonce/verifier o enlaces de identidad. No inventar un actor usuario para credenciales inválidas sin cuenta identificada.
- Fallo de auditoría antes de un cambio controlable impide ese cambio; una notificación ya emitida no se repite ciegamente por un fallo local. Integrar incidentes/evidencia conforme a 004/010 sin afirmar recuperación por escribir una tabla en el destino caído.

## 11. Pruebas y puertas de ejecución

| Prueba futura | Evidencia requerida |
|---|---|
| Registro/credenciales | Correo normalizado concurrente, Google/local compitiendo, política mínima, hash/rehash y rol impuesto por servidor. |
| JWT/refresh | Firma/algoritmo/issuer/audience, instante exacto de expiración, doble refresh, respuesta perdida, reutilización revoca familia y logout no revoca otras familias. |
| Reset/verificación | Consumo concurrente y replay, enlace expirado/cuenta errónea, reset frente a refresh, versión global y revocación de todas las familias. |
| Google | PKCE/state/nonce, callbacks cruzados login/link, identidad falsa/correo no verificado, correo con contraseña y `sub` vinculado a otra cuenta. |
| Navegador/despliegue | Cookie HttpOnly/Secure/host/path, CORS/CSRF, sitios reales, pestañas, reinicio y ausencia de tokens propios en URL/almacenamiento web. |
| Integración | 001/002 bloquean sin correo verificado; 004 entrega enlaces válidos sin secretos filtrados; 009/010 usan roles/estado actuales y auditoría real. |

Puertas que no se dan por cumplidas por redactar el plan:

1. **I-01 Plataforma/criptografía:** versiones, hash Identity, JWT estándar, claves/rotación y unicidades/transacciones probadas con PostgreSQL.
2. **I-02 Google:** configuración real de aplicación de test, callbacks, claims y protecciones OIDC verificadas; sin configurar consola ni crear secretos en esta actividad.
3. **I-03 Navegador/topología:** orígenes, cookies, CORS y CSRF compatibles en despliegue representativo, sin downgrade a almacenamiento inseguro.
4. **I-04 Enlaces/evidencia:** transporte protegido, uso único, entrega vigente por 004 y auditoría/recuperación comprobables sin secretos.
5. **I-05 Revocación/abuso:** pruebas de carreras, respuesta perdida, revocación global/de familia y límites compartidos entre instancias, no un caché local como única barrera.
6. **I-06 Autorización:** actividad posterior explícita de código/configuración; no crear usuarios, ejecutar seed, emitir credenciales o configurar Google/Resend ahora.

[tasks.md](tasks.md) contiene T005-01–T005-32, todas pendientes, con cobertura documental de los 30 criterios. Los valores propuestos se calibran con evidencia; cambios de política, alcance de perfil o facultades administrativas no se introducen como meras opciones técnicas.
