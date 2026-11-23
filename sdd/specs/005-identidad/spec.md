# Spec 005 - Identidad y autenticación

> **Estado:** aprobada v0.1; **APROBADA** el 2026-10-31.  
> **Versión:** 0.1, 2026-10-31.  
> **Requisitos de origen:** RF03 y RF04; HU-03, HU-04 y HU-05; RN-25, RN-26 y RN-27. Se conservan sus identificadores.  
> **Fuentes:** F01 §1/§2/§4/§6; F02 §1; F03 §7; F04 AC03/AC04/AC05/AC09/AC10/AC11; F05 RC12/RC13/RS01/RS02/RS03/RS04/RS05/RS12/RP01/RP08; F06 DA03/DA09; F07 ADR-009/ADR-010; 004 Notificaciones v0.1; DEC-142–DEC-147.  
> **Dependencias:** 001 Reservas aprobada v0.13; 004 Notificaciones aprobada v0.1; 008 Perfil; 009 Administración de reservas; 010 Auditoría. Esta spec no altera documentos aprobados ni habilita implementación.

## Resumen para revisión

- El cliente se registra con correo y contraseña administrados por DMGoTravell; la cuenta nace con rol `client`.
- El acceso usa ASP.NET Core Identity, JWT de acceso de corta duración y refresh tokens rotatorios.
- El refresh se guarda de forma segura, rota en cada uso y detecta reutilización; el logout revoca solo la sesión actual.
- El correo debe verificarse antes de crear una reserva o iniciar un pago; el cliente puede iniciar sesión mientras tanto.
- Google OAuth 2.0 / OpenID Connect se usa como identidad externa; si el correo ya pertenece a una cuenta con contraseña, se exige iniciar con contraseña y vincular Google después.
- La recuperación de contraseña usa un enlace único enviado por Resend; al restablecerla se revocan todas las sesiones.
- Los administradores no se registran públicamente; la cuenta inicial se crea por seed o migración controlada.
- Los endpoints administrativos exigen rol `admin`; un cliente no puede elevar su rol.
- Las operaciones críticas de identidad se auditan y nunca se registran contraseñas, tokens ni secretos.

Este resumen no sustituye los criterios ni constituye aprobación. La vigencia exacta de tokens, la política de contraseñas, los umbrales de rate limiting y el procedimiento de seed se concretan en el plan.

## Contexto y objetivo

RF03 exige registro de clientes con correo y contraseña administrados por DMGoTravell. RF04 exige autenticación con correo y contraseña o con Google, emitiendo tokens propios. HU-03 espera una cuenta `client` y autenticación válida; HU-04 espera login/logout seguro; HU-05 espera vincular o crear una identidad Google sin duplicar cuentas por correo.

La fuente deja pendientes la estrategia de access/refresh tokens, la rotación y revocación, la recuperación de contraseña y la verificación de correo. Esta spec cierra esas decisiones funcionales. No define el perfil editable ni la baja lógica, que corresponden a 008; tampoco la operación administrativa de reservas (009) ni la consulta de auditoría (010).

El objetivo es que la identidad sea segura, stateless para la API, comprensible para el cliente, resistente a duplicados y trazable, sin introducir sesiones de servidor como mecanismo principal.

## Usuarios / actores

- **Visitante:** puede registrarse o iniciar sesión; no accede a recursos privados.
- **Cliente:** cuenta con rol `client`; administra su acceso y debe verificar el correo antes de reservar o pagar.
- **Administrador (`admin`):** cuenta aprovisionada por seed/migración; accede a endpoints administrativos.
- **Google:** proveedor OAuth 2.0 / OpenID Connect; valida la identidad externa.
- **Resend:** entrega correos de verificación y recuperación; su contrato pertenece a 004.
- **Sistema:** emite, rota, revoca y audita tokens; aplica autorización y rate limiting.
- **Perfil (008):** actualización de datos personales y baja lógica; no se define aquí.

## Historias de usuario

Fuente: F02 §1. Se conservan identificadores y prioridades originales.

- **HU-03:** Como cliente, quiero registrarme para realizar reservas asociadas a mi cuenta. (P1)
  - Datos válidos crean una cuenta con rol `client`.
  - La contraseña se almacena de forma segura.
  - Se retorna autenticación válida según la política JWT.
  - Entradas inválidas retornan errores de validación.
- **HU-04:** Como cliente, quiero iniciar y cerrar sesión para acceder de forma segura a mis funciones privadas. (P1)
  - Credenciales válidas permiten obtener un token de acceso.
  - Credenciales incorrectas son rechazadas.
  - El cierre de sesión invalida o revoca los mecanismos reutilizables definidos por la estrategia de autenticación.
- **HU-05:** Como cliente, quiero iniciar sesión con Google para utilizar una identidad existente. (P2)
  - Se ejecuta el flujo OAuth.
  - La identidad validada se vincula o crea localmente.
  - El backend emite los tokens propios de DMGoTravell.
  - No se duplican cuentas por correo.

## Requisitos funcionales (criterios de aceptación en EARS)

### Registro y verificación de correo

- **RF-1:** CUANDO un visitante envía datos válidos de registro, EL SISTEMA creará una cuenta activa con rol `client`, correo normalizado y contraseña administrada por DMGoTravell. (RF03; HU-03)
- **RF-2:** EL SISTEMA almacenará la contraseña mediante el mecanismo de hash de ASP.NET Core Identity y nunca la conservará en claro ni la registrará en logs. (RF03; AC04; ADR-009)
- **RF-3:** SI los datos de registro son inválidos, ENTONCES EL SISTEMA rechazará la solicitud con errores de validación y no creará la cuenta. (HU-03)
- **RF-4:** CUANDO se crea una cuenta válida, EL SISTEMA emitirá un access token y un refresh token según la política de DEC-142. (HU-03; DEC-142)
- **RF-5:** SI el correo normalizado ya pertenece a una cuenta, ENTONCES EL SISTEMA rechazará el registro sin crear una cuenta duplicada. (HU-05; RN-25)
- **RF-6:** CUANDO se crea una cuenta, EL SISTEMA enviará un correo de verificación mediante Resend con un token de un solo uso y vigencia limitada. (DEC-143; 004/RF-3)
- **RF-7:** MIENTRAS el correo no esté verificado, EL SISTEMA permitirá iniciar sesión pero impedirá crear reservas e iniciar pagos. (DEC-143)
- **RF-8:** CUANDO el correo queda verificado, EL SISTEMA permitirá crear reservas e iniciar pagos y no repetirá efectos por verificaciones posteriores. (DEC-143)

### Inicio y cierre de sesión

- **RF-9:** CUANDO un cliente presenta correo y contraseña válidos, EL SISTEMA emitirá un access token y un refresh token. (RF04; HU-04; DEC-142)
- **RF-10:** SI las credenciales son inválidas, ENTONCES EL SISTEMA rechazará el acceso con un mensaje genérico que no revele si el correo existe. (HU-04; AC04)
- **RF-11:** EL SISTEMA emitirá access tokens JWT firmados, de corta duración y con claims mínimos; no incluirá contraseñas, refresh tokens ni secretos. (ADR-009; DEC-142)
- **RF-12:** EL SISTEMA almacenará el refresh token de forma segura y lo rotará en cada uso; el refresh anterior dejará de ser válido. (DEC-142)
- **RF-13:** SI se reutiliza un refresh token ya rotado, ENTONCES EL SISTEMA revocará la familia de refresh asociada y exigirá un nuevo inicio de sesión. (DEC-142)
- **RF-14:** CUANDO el cliente cierra sesión, EL SISTEMA revocará el refresh de la sesión actual y las demás sesiones seguirán activas. (HU-04; DEC-147)
- **RF-15:** SI un refresh token está vencido, revocado o es inválido, ENTONCES EL SISTEMA no emitirá un nuevo access token y exigirá iniciar sesión. (DEC-142)
- **RF-16:** EL SISTEMA aplicará rate limiting a registro, login, refresh, verificación y recuperación de contraseña. (RS12; AC04)

### Google OAuth 2.0 / OpenID Connect

- **RF-17:** CUANDO un visitante completa el flujo de Google OAuth 2.0 / OpenID Connect, EL SISTEMA validará la identidad y emitirá tokens propios de DMGoTravell. (RF04; HU-05; RC13)
- **RF-18:** SI Google devuelve un correo verificado sin cuenta local, ENTONCES EL SISTEMA creará una cuenta `client` sin duplicar correos. (HU-05; DEC-146)
- **RF-19:** SI Google devuelve un correo que ya pertenece a una cuenta con contraseña, ENTONCES EL SISTEMA rechazará el inicio con Google e indicará iniciar con contraseña y vincular Google después. (DEC-146)
- **RF-20:** CUANDO un cliente autenticado con contraseña solicita vincular Google, EL SISTEMA vinculará la identidad solo si el correo verificado de Google coincide con el de la cuenta y no está vinculado a otra cuenta. (DEC-146)
- **RF-21:** SI Google no confirma la verificación del correo, ENTONCES EL SISTEMA rechazará el inicio o la vinculación. (DEC-146; AC04)

### Recuperación de contraseña

- **RF-22:** CUANDO se solicita recuperación de contraseña, EL SISTEMA responderá de forma genérica y, si la cuenta existe, enviará por Resend un enlace único de restablecimiento. (DEC-144; 004/RF-3)
- **RF-23:** CUANDO se usa un enlace de restablecimiento válido, EL SISTEMA permitirá establecer una nueva contraseña, la almacenará con hash y revocará todas las sesiones del usuario. (DEC-144)
- **RF-24:** SI el enlace de restablecimiento está vencido, ya fue usado o es inválido, ENTONCES EL SISTEMA rechazará el cambio sin modificar la contraseña. (DEC-144)
- **RF-25:** EL SISTEMA no incluirá contraseñas, tokens de verificación ni tokens de restablecimiento en correos, logs o respuestas. (AC04; RS02)

### Roles, administración y trazabilidad

- **RF-26:** EL SISTEMA reconocerá los roles `client` y `admin`; todo endpoint administrativo exigirá rol `admin`. (RN-26; RS03)
- **RF-27:** EL SISTEMA no permitirá registro público de administradores; la cuenta inicial se creará por seed o migración controlada. (RN-27; RS04; DEC-145)
- **RF-28:** SI se intenta cambiar un rol sin autorización administrativa, ENTONCES EL SISTEMA rechazará la operación; ningún usuario podrá elevar su propio rol. (AC04; RN-28)
- **RF-29:** SI una cuenta está deshabilitada o marcada con baja lógica, ENTONCES EL SISTEMA impedirá su login y la emisión o renovación de tokens. (ADR-010; 008)
- **RF-30:** EL SISTEMA auditará registro, verificación, login exitoso, fallo de autenticación relevante, vinculación/desvinculación de Google, cambio de contraseña, cambio de rol y baja lógica, sin almacenar secretos. (RN-28; AC09)

## Requisitos no funcionales

- **AC03/ADR-009:** la API es stateless; no usa sesiones de servidor como mecanismo principal y autentica con JWT. (F04 AC03; F07 ADR-009)
- **AC04/RS01/RS02:** HTTPS obligatorio, secretos fuera del repositorio, controles explícitos de autenticación/autorización y rate limiting en endpoints sensibles. (F04 AC04; F05 RS01/RS02/RS12)
- **AC05/RN-25:** un cliente solo accede a su propia identidad y recursos; no puede consultar ni modificar los de otro. (F04 AC05; RN-25)
- **AC09/RN-28:** la auditoría de identidad permite reconstruir actor, acción, entidad, fecha y cambios relevantes; no sustituye logs técnicos ni almacena secretos. (F04 AC09; RN-28)
- **AC10:** los errores de registro, login, verificación y recuperación son claros y no revelan información sensible ni la existencia de cuentas. (F04 AC10)
- **AC11:** las reglas de identidad y tokens se prueban sin depender de Google o Resend reales; las pruebas cubren expiración, rotación, reutilización y revocación. (F04 AC11)
- **RP01/RP08:** cuentas, refresh tokens, verificaciones y auditoría se persisten en PostgreSQL; las fechas se almacenan en UTC y los plazos de negocio se interpretan en hora de Perú. (F05 RP01/RP08)
- **RC12/RC13:** ASP.NET Core Identity + JWT y Google OAuth 2.0 / OpenID Connect son las tecnologías iniciales. (F05 RC12/RC13)
- **Contraseñas:** la política mínima exige al menos 8 caracteres y rechaza una contraseña igual al correo; el plan puede endurecerla sin reducir este mínimo. (AC04)

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Registro válido | Cuenta `client` creada y tokens emitidos | RF-1/RF-4 |
| Registro con correo duplicado | Rechazo sin cuenta duplicada | RF-5 |
| Datos inválidos | Errores de validación; no se crea cuenta | RF-3 |
| Correo sin verificar intenta reservar | Se bloquea la reserva o el pago | RF-7 |
| Verificación repetida | No duplica efectos; el correo queda verificado | RF-8 |
| Login con credenciales válidas | Access y refresh emitidos | RF-9 |
| Login con credenciales inválidas | Mensaje genérico; no revela existencia | RF-10 |
| Refresh rotado y reutilizado | Se revoca la familia y se exige login | RF-13 |
| Logout | Solo se revoca la sesión actual | RF-14 |
| Refresh vencido o revocado | No se renueva; se exige login | RF-15 |
| Google con correo nuevo y verificado | Cuenta `client` creada | RF-18 |
| Google con correo de cuenta con contraseña | Se rechaza; se indica login con contraseña y vincular después | RF-19 |
| Google sin correo verificado | Se rechaza | RF-21 |
| Vinculación Google con correo distinto | Se rechaza; no se vincula | RF-20 |
| Recuperación de correo inexistente | Respuesta genérica; no se envía enlace | RF-22 |
| Enlace de recuperación usado dos veces | Se rechaza sin cambiar contraseña | RF-24 |
| Restablecimiento válido | Nueva contraseña y todas las sesiones revocadas | RF-23 |
| Registro público de admin | Se rechaza | RF-27 |
| Cliente intenta elevar su rol | Se rechaza | RF-28 |
| Cuenta deshabilitada o con baja lógica | No puede autenticarse ni renovar | RF-29 |
| Muchos intentos de login | Rate limiting | RF-16 |

## Fuera de alcance

- Actualización de datos personales y baja lógica solicitada por el cliente: corresponden a 008.
- Operación administrativa de reservas: corresponde a 009.
- Consulta, filtros y exportación de auditoría: corresponden a 010.
- Plantillas y entrega de correos: corresponden a 004 y al plan.
- MFA, biometría, passkeys y proveedores sociales distintos de Google.
- Gestión administrativa de usuarios o alta de administradores desde pantalla: no se incluye; el seed/migración es el mecanismo inicial.
- Valores exactos de vigencia de access/refresh, tokens de verificación/restablecimiento, complejidad de contraseña, bloqueo por intentos y umbrales de rate limiting: se concretan en el plan.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-30 numerados y trazados a RF/HU/RN/DEC o specs dependientes.
- Conservar la diferencia entre autenticación (005), perfil/baja (008), operación administrativa (009) y auditoría consultable (010).
- No convertir la vigencia exacta de tokens ni la plantilla de correo en criterios funcionales.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar registro, correo único, hash de contraseña y rol `client`.
- Verificar verificación de correo y bloqueo de reserva/pago sin verificar.
- Verificar login, mensaje genérico, access JWT y refresh rotatorio.
- Verificar rotación, reutilización, revocación de familia y logout de la sesión actual.
- Verificar Google: cuenta nueva, correo existente con contraseña, correo no verificado y vinculación.
- Verificar recuperación: respuesta genérica, enlace único, expiración y revocación de sesiones.
- Verificar roles, ausencia de registro público de admin y seed controlado.
- Verificar rate limiting, HTTPS, secretos y ausencia de datos sensibles en logs/respuestas.
- Verificar auditoría de identidad y aislamiento por cliente.

## Dudas abiertas

- **LÍMITE:** DEC-142 fija access JWT + refresh rotatorio; la vigencia exacta, el algoritmo y el almacenamiento del refresh se concretan en el plan.
- **LÍMITE:** DEC-144 fija enlace único por Resend; la vigencia exacta del enlace y la política de contraseña se concretan en el plan.
- **PENDIENTE DE 004:** las plantillas de verificación y recuperación usan el servicio de 004; su contenido exacto queda en el plan.
- **PENDIENTE DE 008:** la baja lógica y la actualización de datos personales se definen en 008; 005 solo exige que una cuenta dada de baja no pueda autenticarse.
- **PENDIENTE DE 009:** la administración de usuarios y roles operativos se define en 009; 005 fija la autorización mínima.
- **PENDIENTE DE 010:** la consulta y exportación de la auditoría de identidad se definen en 010.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1.
- **Aprobación explícita del documento completo:** sí, 2026-10-31.
- **Fecha de aprobación:** 2026-10-31.
- **Reglas previas:** se reutilizan ADR-009, ADR-010, 004 v0.1 y las reglas de 001; no se reabren.
- **Decisiones parciales:** DEC-142–DEC-147 registran las respuestas de la entrevista; DEC-148 registra la aprobación de esta spec.
- **Plan/tareas:** no creados en esta actividad. No se autoriza código ni cambios fuera de `sdd/`.
