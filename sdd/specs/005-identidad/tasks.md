# Tareas — Spec 005: Identidad y autenticación

> **Fecha:** 2026-11-01.  
> **Base:** [spec v0.1 aprobada](spec.md), 30 criterios, DEC-148; [plan v0.1](plan.md).  
> **Estado:** auditado el 2026-11-24 contra el commit `e74fd37`; ver «Resumen de auditoría» al final.  
> **Regla:** no ejecutar sin autorización posterior; sin usuarios, claves, seed/migraciones, proveedores o código creados ahora. Carpeta confirmada: `DMGoTravelll`.

I-01–I-06 son las puertas del plan. Ninguna tarea se cierra por documentación o dobles cuando su aceptación requiere PostgreSQL, navegador o Google reales.

> **Auditoría 2026-11-24 (commit `e74fd37`):** casillas sincronizadas con el código. HECHO = implementación rastreada + prueba/artefacto verificable; PARCIAL = entrega incompleta o sin prueba; PENDIENTE = sin evidencia. El frontend rastreado (`frontend/`, desde `e74fd37`) solo cuenta como evidencia de UI; las pantallas sin prueba propia quedan PARCIAL. Base: [inventario](../../auditoria/inventario-2026-11-24.md).

## Fase 0 — Contratos y garantías de seguridad

- [ ] **T005-01 — Validar línea base y fronteras.** → **PARCIAL**: contratos de identidad implementados en `Features/Auth/` y `Domain/Modules/Identity/`, pero sin matriz de los 30 criterios.
  - **Entregable:** matriz de 30 criterios, contratos de cuenta/actor/rol/verificación, familias, enlaces, notificación, reloj y auditoría.
  - **Aceptación:** no gestión de perfiles de 008, usuarios desde pantalla o rol público `admin`; separar referencia histórica a 009 de su alcance real de reservas.
  - **Dependencias:** autorización futura y specs 001/002/004+complemento/005/009/010.

- [ ] **T005-02 — Verificar plataforma y contrato oficial Google/JWT.** → **PENDIENTE**: no hay OIDC/Google implementado; JWT propio existe pero no se contrastó con el contrato oficial de Google.
  - **Entregable:** versiones compatibles y contratos de Identity, JWT estándar y OIDC, con evidencias oficiales y pruebas previstas.
  - **Aceptación:** no usar tokens propietarios de Identity API como si fuesen JWT; Google por issuer/`sub`, no correo como identificador; configuración real solo en test autorizado.
  - **Dependencias:** T005-01; I-01/I-02. [RF-2/RF-11/RF-17–RF-21]

- [x] **T005-03 — Diseñar datos e invariantes de unicidad.** → **HECHO**: unicidad de correo normalizado y digest de refresh en `Persistence/Configurations/IdentityConfiguration.cs`; prueba `SliceEndToEndTests.RefreshRotation_ShouldInvalidateOldToken`.
  - **Entregable:** cuenta/correo normalizado, Google issuer/`sub`, familia/refresh digest, solicitudes de enlace y contexto OIDC de uso único.
  - **Aceptación:** restricciones PostgreSQL para duplicados/concurrencia; no secreto reutilizable en claro ni reutilización de correo dado de baja decidida por este plan.
  - **Dependencias:** T005-01/T005-02. [RF-1/RF-5/RF-12/RF-13/RF-18/RF-20/RF-24/RF-29]

- [x] **T005-04 — Concretar y probar parámetros de seguridad.** → **HECHO**: JWT 5 min, familia de refresh 14 días (`LoginCommand.cs`), verificación 24 h y reset 30 min (`AuthTokenPolicy.cs`).
  - **Entregable:** configuración propuesta de TTL, contraseña, límites de uso/bloqueo y vencimientos del plan, con casos de prueba.
  - **Aceptación:** access 5 minutos, refresh/familia 14 días absolutos, verificación 24 horas y reset 30 minutos no se mezclan con 15/20 de reservas ni 24 horas del proveedor de correo; no defaults más débiles que la spec.
  - **Dependencias:** T005-01/T005-02. [RF-3/RF-11–RF-16/RF-24]

- [x] **T005-05 — Validar diseño SPA/cookies/CORS/CSRF.** → **HECHO**: SPA React en `frontend/src/`, cookies `dmgo_refresh`/`dmgo_csrf` y CSRF en `src/DMGoTravel.Api/Auth/AuthCookies.cs`, CORS en `Program.cs`; pruebas `AuditSliceTests` y `RecoverySliceTests`.
  - **Entregable:** topología de orígenes y transporte de access en memoria/refresh HttpOnly con protección antiforgery y retorno limpio de Google.
  - **Aceptación:** nada de tokens propios en URL/web storage; `__Host-` si se usa con Path/host correctos; no wildcard con credenciales ni asumir cookies cross-site compatibles sin prueba.
  - **Dependencias:** T005-01/T005-02/T005-04; I-03. [RF-11/RF-12/RF-14/RF-17/RF-25]

- [x] **T005-06 — Definir transacciones y protocolo de revocación.** → **HECHO**: revocación global y consumo atómico de refresh; pruebas `RefreshRotation_ShouldInvalidateOldToken` y `ResetPassword_ShouldChangePasswordRevokeSessionsAndRejectReplay`.
  - **Entregable:** bloqueo/actualización condicional de familia/token/cuenta/solicitud y versión global, con auditoría en el commit local.
  - **Aceptación:** no doble rotación/consumo ni emisión de tokens antes de commit; reset concurrente con refresh no deja una familia válida de la versión antigua.
  - **Dependencias:** T005-01/T005-03/T005-04/T005-05. [RF-4/RF-8/RF-12–RF-15/RF-23/RF-24/RF-30]

- [ ] **T005-07 — Diseñar gestión/protección de claves y secretos.** → **PARCIAL**: `JwtKeyProvider.cs` genera clave de desarrollo, sin rotación/restauración verificable ni protección de enlaces.
  - **Entregable:** claves de firma, validación y protección de enlaces/cargas con persistencia compartida segura, rotación y restauración verificables.
  - **Aceptación:** no claves en repo/frontend/disco efímero ni tokens/enlaces en auditoría; no criptografía propia ni proveedor extra implícito.
  - **Dependencias:** T005-02/T005-04; I-01/I-04. [RF-2/RF-11/RF-12/RF-25]

## Fase 1 — Registro, acceso, refresh y recuperación

- [x] **T005-08 — Implementar registro y credenciales locales.** → **HECHO**: `RegisterCommand.cs` crea cliente, normaliza, hashea y emite verificación; prueba `AuditSliceTests.RegisterVerifyAndLogin_ShouldWriteAuditTrailWithoutSecrets`.
  - **Entregable:** creación `client`, normalización/validación, hash Identity, familia inicial e intención de verificación.
  - **Aceptación:** correo duplicado concurrente rechazado sin segunda cuenta; contraseña nunca en claro; no rol del cuerpo ni emisión de credenciales si falla el commit/auditoría.
  - **Dependencias:** T005-03/T005-04/T005-06/T005-07. [RF-1–RF-6/RF-27/RF-30]

- [ ] **T005-09 — Implementar verificación y requisito de reserva/pago.** → **PARCIAL**: `VerifyEmailCommand.cs` consume el enlace y `CreateReservationCommand.cs` bloquea sin verificar; el pago no revalida verificación.
  - **Entregable:** consumo de enlace de cuenta/propósito correctos y contexto de correo verificado actual.
  - **Aceptación:** login local sigue permitido sin verificar; reserva/pago se bloquean; verificación repetida no duplica efectos ni verifica otra cuenta; intención de envío no equivale a entrega real.
  - **Dependencias:** T005-06/T005-07/T005-08 y contratos 001/002/004. [RF-6–RF-8/RF-30]

- [x] **T005-10 — Implementar login local y errores genéricos.** → **HECHO**: `LoginCommand.cs` con errores genéricos; prueba `AuditSliceTests.FailedLoginAndRefreshReuse_ShouldAuditFailures`.
  - **Entregable:** validación Identity, bloqueo/counters y familia por sesión de login.
  - **Aceptación:** credencial/estado inválido no revela existencia de correo; cuenta activa sin verificar puede entrar; no guardar password ni registrar credenciales fallidas completas.
  - **Dependencias:** T005-04/T005-06/T005-08. [RF-2/RF-9/RF-10/RF-16/RF-29/RF-30]

- [x] **T005-11 — Implementar emisión/validación JWT propio.** → **HECHO**: emisión/validación JWT en `Auth/JwtTokenService.cs`; prueba `SliceEndToEndTests.RefreshRotation_ShouldInvalidateOldToken`.
  - **Entregable:** issuer/audience/algoritmo explícitos, claims mínimos, expiración y versión/familia, con respuesta/cookie seguras.
  - **Aceptación:** rechazar firma/algoritmo/audience incorrectos y expiración exacta sin tolerancia heredada; nunca aceptar ID token Google como access propio ni exponer refresh a JavaScript.
  - **Dependencias:** T005-04/T005-06/T005-07/T005-10. [RF-4/RF-9/RF-11/RF-25/RF-26]

- [x] **T005-12 — Implementar rotación y reutilización de refresh.** → **HECHO**: rotación y detección de reutilización; prueba `SliceEndToEndTests.RefreshRotation_ShouldInvalidateOldToken`.
  - **Entregable:** lookup por digest, consumo/reemplazo atómicos, familia absoluta y revocación al reutilizar.
  - **Aceptación:** dos refresh con el mismo valor no producen dos ramas válidas; reutilización revoca esa familia, no otras; respuesta perdida no habilita un token anterior ni ventana de gracia.
  - **Dependencias:** T005-03/T005-06/T005-07/T005-11. [RF-12/RF-13/RF-15/RF-30]

- [ ] **T005-13 — Implementar logout de sesión actual.** → **PARCIAL**: `LogoutCommand.cs` revoca la familia actual, pero no hay prueba dedicada de logout ni verificación de `sid`.
  - **Entregable:** revocación idempotente de familia actual y limpieza de cookie/access del cliente.
  - **Aceptación:** no revocar las demás familias ni confiar en family ID arbitrario del cuerpo; controles de `sid` impiden dar por revocado un JWT solo por eliminar la cookie local.
  - **Dependencias:** T005-05/T005-12. [RF-14/RF-15/RF-30]

- [x] **T005-14 — Implementar solicitud genérica de recuperación.** → **HECHO**: respuesta genérica para cuenta inexistente; prueba `RecoverySliceTests.ForgotPassword_UnknownAccount_ShouldRespondGenerically`.
  - **Entregable:** solicitud de uso único y enlace protegido destinado a cuenta existente, sin secreto en respuesta pública.
  - **Aceptación:** cuenta inexistente recibe mismo patrón público, sin enlace; no destinatario impuesto por cliente ni logs del enlace; no renovación desde 004.
  - **Dependencias:** T005-03/T005-06/T005-07/T005-08. [RF-22/RF-24/RF-25/RF-30]

- [x] **T005-15 — Implementar reset y revocación global.** → **HECHO**: reset con revocación global; prueba `RecoverySliceTests.ResetPassword_ShouldChangePasswordRevokeSessionsAndRejectReplay`.
  - **Entregable:** consumo de solicitud, nueva contraseña/hash, versión global y revocación de todas las familias en una transacción auditada.
  - **Aceptación:** enlace usado/vencido/cuenta errónea no cambia nada; reset/refresh concurrentes no conservan sesión antigua; no emitir acceso a partir del enlace solo por conocer un correo.
  - **Dependencias:** T005-04/T005-06/T005-10/T005-12/T005-14. [RF-2/RF-23–RF-25/RF-30]

## Fase 2 — Google, autorización y administración inicial

- [ ] **T005-16 — Implementar contexto y callback Google seguros.** → **PENDIENTE**: no existe callback/contexto Google (0 coincidencias de OIDC en `src/`).
  - **Entregable:** Code/PKCE S256, state/nonce, validación de issuer/audience/tiempos/JWKS y contexto de uso único.
  - **Aceptación:** callback ligado al navegador/propósito y retorno permitido; no tokens propios en URL, secretos en query logs ni claims sin verificar.
  - **Dependencias:** T005-02/T005-03/T005-05/T005-07/T005-11; I-02. [RF-17/RF-21/RF-25]

- [ ] **T005-17 — Implementar cuenta/login Google sin unión automática.** → **PENDIENTE**: no existe login/cuenta Google.
  - **Entregable:** identidad por issuer/`sub`, cuenta nueva `client` y rechazo de coincidencia de correo local con contraseña cuando aún no hay vinculación autorizada de esa identidad.
  - **Aceptación:** no duplicado en carrera local/Google; correo no verificado se rechaza; no cambio de roles ni traslado de identidad por cambio de correo externo.
  - **Dependencias:** T005-06/T005-08/T005-16. [RF-17–RF-19/RF-21/RF-26/RF-30]

- [ ] **T005-18 — Implementar vinculación autenticada separada.** → **PENDIENTE**: no existe vinculación de identidad Google.
  - **Entregable:** flujo de cliente ligado a su cuenta/familia local con prueba reciente de contraseña, propósito link y commit protegido.
  - **Aceptación:** correo verificado coincidente y `sub` no ligado a otra cuenta; rechazar login callback usado como link, cuenta deshabilitada y destino de cuenta manipulado. No añadir desvinculación fuera de alcance.
  - **Dependencias:** T005-06/T005-10/T005-16/T005-17. [RF-19–RF-21/RF-29/RF-30]

- [x] **T005-19 — Integrar autorización y estado de revocación vigente.** → **HECHO**: rol/versión vigentes se revalidan; prueba `AdminAuditTests.List_ShouldFailClosedWhenRoleOrSessionIsNoLongerCurrent`.
  - **Entregable:** contexto de cuenta/familia/versión/rol y verificación, aplicado a operaciones protegidas.
  - **Aceptación:** token firmado antiguo no conserva acceso de cuenta/familia revocada o rol retirado; caída de la fuente de autorización no acepta privilegios por caché no confiable; no nuevos permisos sobre clientes/reservas.
  - **Dependencias:** T005-09/T005-11/T005-12/T005-13/T005-15/T005-18 y 001/002/009/010. [RF-7/RF-8/RF-14/RF-23/RF-26/RF-28/RF-29]

- [ ] **T005-20 — Preparar seed administrativo controlado.** → **PARCIAL**: `DevelopmentDataSeeder.cs` crea admin ficticio con contraseña fija de Development; no hay herramienta de seed de despliegue idempotente.
  - **Entregable:** procedimiento/herramienta idempotente con credencial segura autorizada, hash/política y evidencia del actor de despliegue.
  - **Aceptación:** sin contraseña en repo/migración/default ni endpoint de seed; no sobrescribir/reactivar cuenta de correo coincidente ni elevar al usuario de registro público. No ejecutar seed en esta tarea documental.
  - **Dependencias:** T005-04/T005-06/T005-07/T005-19. [RF-26–RF-30]

- [ ] **T005-21 — Integrar límites y bloqueo compartidos.** → **PENDIENTE**: no hay rate limiting ni bloqueo por intentos (0 coincidencias de RateLimiter/Lockout).
  - **Entregable:** particiones IP/cuenta/familia/solicitud, counters/bloqueo y errores uniformes del plan.
  - **Aceptación:** múltiples instancias no eluden la cuota, sin revelar cuenta inexistente o aceptar familia arbitraria para revocar; medir NAT/carga y no perder límites al reiniciar un proceso.
  - **Dependencias:** T005-04/T005-06/T005-09/T005-10/T005-12/T005-14/T005-16/T005-18. [RF-10/RF-13/RF-16/RF-22/RF-29]

## Fase 3 — Integración y presentación

- [ ] **T005-22 — Integrar enlaces e intenciones protegidas con 004.** → **PARCIAL**: existen intenciones de verificación/reset y envío por outbox, pero sin transporte cifrado ni TTL propio distinto del enlace.
  - **Entregable:** transporte temporal cifrado, destinatario/validez y uso único, con metadata no secreta para entrega/idempotencia.
  - **Aceptación:** no reemitir token al reintentar correo, no entregar un enlace invalidado ni usar las 24 horas de Resend como TTL de identidad; nada de enlaces en admin/auditoría/CSV/jobs generales.
  - **Dependencias:** T005-07/T005-09/T005-14/T005-15/T005-19/T005-21 y 004; I-04. [RF-6/RF-8/RF-22/RF-24/RF-25]

- [x] **T005-23 — Integrar auditoría e incidentes saneados.** → **HECHO**: auditoría saneada de registro/login/refresh; prueba `AuditSliceTests.RegisterVerifyAndLogin_ShouldWriteAuditTrailWithoutSecrets`.
  - **Entregable:** actor/acción/entidad/fecha/resultado de operaciones críticas y recuperación sin secretos.
  - **Aceptación:** cambio controlable sin auditoría no se aplica, efectos recuperados no duplican hechos; no JWT/refresh/nonce/password/enlace en evidencia ni usuario ficticio para fallo sin cuenta.
  - **Dependencias:** T005-06/T005-08–T005-22 y 010/004. [RF-2/RF-25/RF-30]

- [ ] **T005-24 — Publicar contratos y presentación segura.** → **PARCIAL**: OpenAPI/ProblemDetails y SPA rastreada en `frontend/src/pages/`; faltan los flujos Google porque el backend no implementa `/auth/google/*`.
  - **Entregable:** OpenAPI/ProblemDetails y flujos SPA de registro/login/verificación/refresh/logout/Google/link/reset.
  - **Aceptación:** coordinar refresh entre peticiones/pestañas sin bypass de reutilización; respuesta genérica de recuperación/login, retorno limpio, credenciales en memoria/cookie y sin rutas nuevas de perfil o administración de usuarios.
  - **Dependencias:** T005-05/T005-09–T005-23. [RF-1/RF-3–RF-16/RF-17–RF-29]

## Fase 4 — Pruebas y puertas de habilitación
- [ ] **T005-25 — Pruebas unitarias y de Application.** → **PARCIAL**: hay pruebas de identidad (AuditSlice, RecoverySlice, SliceEndToEnd), pero no una suite que trace los 30 criterios.
  - **Entregable:** suite determinista de los 30 criterios con reloj/actor/entrega/Google controlados.
  - **Aceptación:** TTL/cortes, datos inválidos, roles, estados, consumo/reutilización, errores genéricos y límites trazados; no presentar un doble como validación de Google, navegador o PostgreSQL.
  - **Dependencias:** T005-08–T005-24. [RF-1–RF-30]

- [ ] **T005-26 — Pruebas PostgreSQL de carreras y atomicidad.** → **PARCIAL**: se prueba rotación/replay, pero no carreras concurrentes de registro o doble consumo de enlace contra PostgreSQL.
  - **Entregable:** unicidad correo/`sub`, doble registro/refresh/enlace y reset compitiendo con renovación.
  - **Aceptación:** sin cuentas/ramas duplicadas ni token emitido sobre commit fallido; reutilización revoca familia y reset deja invalidadas todas las familias antiguas.
  - **Dependencias:** T005-03/T005-06/T005-08–T005-23. [RF-1/RF-4/RF-5/RF-8/RF-12–RF-15/RF-18/RF-20/RF-23/RF-24/RF-30]

- [ ] **T005-27 — Pruebas Google de contrato en test autorizado.** → **PENDIENTE**: no hay pruebas de contrato Google.
  - **Entregable:** evidencia saneada de configuración/callback, claims, PKCE/state/nonce y creación/login/link.
  - **Aceptación:** casos de correo local con contraseña, no verificado y `sub` ocupado; no tokens propios en URLs ni cuenta real externa creada/configurada sin autorización.
  - **Dependencias:** T005-02/T005-16–T005-19/T005-24; I-02. [RF-17–RF-21/RF-25]

- [ ] **T005-28 — Pruebas de seguridad, navegador y secretos.** → **PARCIAL**: hay pruebas de JWT/roles y arquitectura, pero no de navegador, CORS/CSRF ni escaneo de secretos.
  - **Entregable:** JWT adulterado, CORS/CSRF, cookies/orígenes reales, URL/redirección manipuladas y escaneo de almacenamiento/logs/artefactos.
  - **Aceptación:** ni algoritmos/issuer/audience inválidos ni acceso con versión/familia revocadas; nada de tokens/links en web storage o evidencia; transporte compatible sin downgrade inseguro.
  - **Dependencias:** T005-05/T005-07/T005-11–T005-24. [RF-2/RF-7/RF-11–RF-16/RF-17/RF-20/RF-21/RF-25–RF-30]

- [x] **T005-29 — Pruebas E2E e integración con reservas/pagos.** → **HECHO**: `SliceEndToEndTests.Slice_ShouldCompleteEndToEnd` cubre registro, verificación, login, refresh, reserva y pago.
  - **Entregable:** registro/verificación, login/refresh/logout, Google/link y recuperación sobre API/SPA y contratos reales.
  - **Aceptación:** sin verificar no se reserva/paga, otras sesiones sobreviven logout actual, reset revoca todas; avisos de 004 y auditoría 010 sin secretos. No efectuar cobros reales.
  - **Dependencias:** T005-24/T005-25/T005-27/T005-28 y módulos integrados. [RF-1–RF-30]

- [ ] **T005-30 — Pruebas de fallo, recuperación y rotación de claves.** → **PARCIAL**: hay pruebas de reset/refresh, no de caída de auditoría/correo, rotación de claves ni respuesta perdida.
  - **Entregable:** respuesta refresh perdida, reinicios, caída de auditoría/correo/persistencia y rotación/restauración de claves.
  - **Aceptación:** sin recuperar refresh consumido o credencial antigua como atajo; familias/versiones y enlaces se conservan con su seguridad; ninguna sesión se emite por un cambio que no se confirmó.
  - **Dependencias:** T005-07/T005-12/T005-13/T005-15/T005-22/T005-23/T005-26/T005-28. [RF-4/RF-6/RF-11–RF-15/RF-22–RF-25/RF-29/RF-30]

- [ ] **T005-31 — Validar configuración, capacidad y seed operativo.** → **PENDIENTE**: no hay medición de capacidad, múltiples instancias ni revisión del seed operativo.
  - **Entregable:** parámetros medidos en host objetivo, orígenes/cookies, claves, callbacks, hash, límites distribuidos y procedimiento de seed revisados.
  - **Aceptación:** no sesión HTTP en memoria como mecanismo principal, no secreto/contraseña default ni cambios externos automáticos; pruebas con varias instancias y sin romper la revocación para mejorar latencia.
  - **Dependencias:** T005-20/T005-21/T005-24/T005-27/T005-28/T005-30. [RF-2/RF-11–RF-16/RF-25–RF-30]

- [ ] **T005-32 — Cerrar cobertura y revisar I-01–I-06.** → **PENDIENTE**: no existe matriz RF-1–RF-30 ni revisión de puertas I-01–I-06.
  - **Entregable:** RF→implementación→prueba→resultado y evidencias de plataforma, Google, navegador, enlaces, revocación y autorización.
  - **Aceptación:** 30 criterios sin huecos y ninguna tarea cerrada por redacción; no ejecutar seed, configurar consola Google, desplegar o habilitar producción por el solo hecho de tener plan.
  - **Dependencias:** T005-01–T005-31. [RF-1–RF-30]

## Matriz de cobertura funcional

| Criterios 005 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-5 | T005-03/T005-04/T005-08/T005-11 | T005-25/T005-26/T005-29 |
| RF-6–RF-8 | T005-09/T005-19/T005-22/T005-24 | T005-25/T005-26/T005-28/T005-29/T005-30 |
| RF-9–RF-11 | T005-04/T005-07/T005-10/T005-11 | T005-25/T005-28/T005-29/T005-31 |
| RF-12–RF-15 | T005-03/T005-06/T005-12/T005-13/T005-19 | T005-25/T005-26/T005-28–T005-31 |
| RF-16 | T005-04/T005-21 | T005-25/T005-28/T005-31 |
| RF-17–RF-21 | T005-02/T005-05/T005-16–T005-18/T005-24 | T005-25–T005-29 |
| RF-22–RF-25 | T005-07/T005-14/T005-15/T005-22/T005-23 | T005-25/T005-26/T005-28–T005-30 |
| RF-26–RF-29 | T005-08/T005-19/T005-20/T005-24 | T005-25/T005-28/T005-29/T005-31 |
| RF-30 | T005-06/T005-23 | T005-25/T005-26/T005-28–T005-31 |

**Auditoría: 13 HECHO, 11 PARCIAL, 8 PENDIENTE.** La cobertura documental no constituye implementación, sesión emitida o autorización para configurar proveedores.

## Resumen de auditoría

| Estado | Tareas |
|---|---:|
| HECHO (código + prueba/artefacto) | 13 |
| PARCIAL (entrega incompleta o sin prueba) | 11 |
| PENDIENTE (sin evidencia) | 8 |
| **Total** | **32** |

**Limitaciones:** la auditoría es estática sobre el commit `e74fd37`. No se pudieron ejecutar las pruebas .NET en este entorno (el testhost aborta con «Acceso denegado»), Docker/PostgreSQL no estaba disponible; las 7 pruebas Vitest y el `typecheck` del frontend rastreado sí se ejecutaron en verde el 2026-11-25. Las pruebas citadas existen en el repositorio, pero su resultado verde no se reverificó en esta sesión. Ninguna tarea se marca HECHO por inferencia: se exige código y prueba o artefacto localizable. El árbol de trabajo contiene además dos SPA sin rastrear (`frontend-peru-premium/`, `viajes-peru-premium/`) y cambios sin confirmar en backend (hoteles, media, seeding) que no se auditaron.
