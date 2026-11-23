# Tareas — Spec 005: Identidad y autenticación

> **Fecha:** 2026-11-01.  
> **Base:** [spec v0.1 aprobada](spec.md), 30 criterios, DEC-148; [plan v0.1](plan.md).  
> **Estado:** backlog documental, **32 tareas pendientes, 0 ejecutadas**.  
> **Regla:** no ejecutar sin autorización posterior; sin usuarios, claves, seed/migraciones, proveedores o código creados ahora. Carpeta confirmada: `DMGoTravelll`.

I-01–I-06 son las puertas del plan. Ninguna tarea se cierra por documentación o dobles cuando su aceptación requiere PostgreSQL, navegador o Google reales.

## Fase 0 — Contratos y garantías de seguridad

- [ ] **T005-01 — Validar línea base y fronteras.**
  - **Entregable:** matriz de 30 criterios, contratos de cuenta/actor/rol/verificación, familias, enlaces, notificación, reloj y auditoría.
  - **Aceptación:** no gestión de perfiles de 008, usuarios desde pantalla o rol público `admin`; separar referencia histórica a 009 de su alcance real de reservas.
  - **Dependencias:** autorización futura y specs 001/002/004+complemento/005/009/010.

- [ ] **T005-02 — Verificar plataforma y contrato oficial Google/JWT.**
  - **Entregable:** versiones compatibles y contratos de Identity, JWT estándar y OIDC, con evidencias oficiales y pruebas previstas.
  - **Aceptación:** no usar tokens propietarios de Identity API como si fuesen JWT; Google por issuer/`sub`, no correo como identificador; configuración real solo en test autorizado.
  - **Dependencias:** T005-01; I-01/I-02. [RF-2/RF-11/RF-17–RF-21]

- [ ] **T005-03 — Diseñar datos e invariantes de unicidad.**
  - **Entregable:** cuenta/correo normalizado, Google issuer/`sub`, familia/refresh digest, solicitudes de enlace y contexto OIDC de uso único.
  - **Aceptación:** restricciones PostgreSQL para duplicados/concurrencia; no secreto reutilizable en claro ni reutilización de correo dado de baja decidida por este plan.
  - **Dependencias:** T005-01/T005-02. [RF-1/RF-5/RF-12/RF-13/RF-18/RF-20/RF-24/RF-29]

- [ ] **T005-04 — Concretar y probar parámetros de seguridad.**
  - **Entregable:** configuración propuesta de TTL, contraseña, límites de uso/bloqueo y vencimientos del plan, con casos de prueba.
  - **Aceptación:** access 5 minutos, refresh/familia 14 días absolutos, verificación 24 horas y reset 30 minutos no se mezclan con 15/20 de reservas ni 24 horas del proveedor de correo; no defaults más débiles que la spec.
  - **Dependencias:** T005-01/T005-02. [RF-3/RF-11–RF-16/RF-24]

- [ ] **T005-05 — Validar diseño SPA/cookies/CORS/CSRF.**
  - **Entregable:** topología de orígenes y transporte de access en memoria/refresh HttpOnly con protección antiforgery y retorno limpio de Google.
  - **Aceptación:** nada de tokens propios en URL/web storage; `__Host-` si se usa con Path/host correctos; no wildcard con credenciales ni asumir cookies cross-site compatibles sin prueba.
  - **Dependencias:** T005-01/T005-02/T005-04; I-03. [RF-11/RF-12/RF-14/RF-17/RF-25]

- [ ] **T005-06 — Definir transacciones y protocolo de revocación.**
  - **Entregable:** bloqueo/actualización condicional de familia/token/cuenta/solicitud y versión global, con auditoría en el commit local.
  - **Aceptación:** no doble rotación/consumo ni emisión de tokens antes de commit; reset concurrente con refresh no deja una familia válida de la versión antigua.
  - **Dependencias:** T005-01/T005-03/T005-04/T005-05. [RF-4/RF-8/RF-12–RF-15/RF-23/RF-24/RF-30]

- [ ] **T005-07 — Diseñar gestión/protección de claves y secretos.**
  - **Entregable:** claves de firma, validación y protección de enlaces/cargas con persistencia compartida segura, rotación y restauración verificables.
  - **Aceptación:** no claves en repo/frontend/disco efímero ni tokens/enlaces en auditoría; no criptografía propia ni proveedor extra implícito.
  - **Dependencias:** T005-02/T005-04; I-01/I-04. [RF-2/RF-11/RF-12/RF-25]

## Fase 1 — Registro, acceso, refresh y recuperación

- [ ] **T005-08 — Implementar registro y credenciales locales.**
  - **Entregable:** creación `client`, normalización/validación, hash Identity, familia inicial e intención de verificación.
  - **Aceptación:** correo duplicado concurrente rechazado sin segunda cuenta; contraseña nunca en claro; no rol del cuerpo ni emisión de credenciales si falla el commit/auditoría.
  - **Dependencias:** T005-03/T005-04/T005-06/T005-07. [RF-1–RF-6/RF-27/RF-30]

- [ ] **T005-09 — Implementar verificación y requisito de reserva/pago.**
  - **Entregable:** consumo de enlace de cuenta/propósito correctos y contexto de correo verificado actual.
  - **Aceptación:** login local sigue permitido sin verificar; reserva/pago se bloquean; verificación repetida no duplica efectos ni verifica otra cuenta; intención de envío no equivale a entrega real.
  - **Dependencias:** T005-06/T005-07/T005-08 y contratos 001/002/004. [RF-6–RF-8/RF-30]

- [ ] **T005-10 — Implementar login local y errores genéricos.**
  - **Entregable:** validación Identity, bloqueo/counters y familia por sesión de login.
  - **Aceptación:** credencial/estado inválido no revela existencia de correo; cuenta activa sin verificar puede entrar; no guardar password ni registrar credenciales fallidas completas.
  - **Dependencias:** T005-04/T005-06/T005-08. [RF-2/RF-9/RF-10/RF-16/RF-29/RF-30]

- [ ] **T005-11 — Implementar emisión/validación JWT propio.**
  - **Entregable:** issuer/audience/algoritmo explícitos, claims mínimos, expiración y versión/familia, con respuesta/cookie seguras.
  - **Aceptación:** rechazar firma/algoritmo/audience incorrectos y expiración exacta sin tolerancia heredada; nunca aceptar ID token Google como access propio ni exponer refresh a JavaScript.
  - **Dependencias:** T005-04/T005-06/T005-07/T005-10. [RF-4/RF-9/RF-11/RF-25/RF-26]

- [ ] **T005-12 — Implementar rotación y reutilización de refresh.**
  - **Entregable:** lookup por digest, consumo/reemplazo atómicos, familia absoluta y revocación al reutilizar.
  - **Aceptación:** dos refresh con el mismo valor no producen dos ramas válidas; reutilización revoca esa familia, no otras; respuesta perdida no habilita un token anterior ni ventana de gracia.
  - **Dependencias:** T005-03/T005-06/T005-07/T005-11. [RF-12/RF-13/RF-15/RF-30]

- [ ] **T005-13 — Implementar logout de sesión actual.**
  - **Entregable:** revocación idempotente de familia actual y limpieza de cookie/access del cliente.
  - **Aceptación:** no revocar las demás familias ni confiar en family ID arbitrario del cuerpo; controles de `sid` impiden dar por revocado un JWT solo por eliminar la cookie local.
  - **Dependencias:** T005-05/T005-12. [RF-14/RF-15/RF-30]

- [ ] **T005-14 — Implementar solicitud genérica de recuperación.**
  - **Entregable:** solicitud de uso único y enlace protegido destinado a cuenta existente, sin secreto en respuesta pública.
  - **Aceptación:** cuenta inexistente recibe mismo patrón público, sin enlace; no destinatario impuesto por cliente ni logs del enlace; no renovación desde 004.
  - **Dependencias:** T005-03/T005-06/T005-07/T005-08. [RF-22/RF-24/RF-25/RF-30]

- [ ] **T005-15 — Implementar reset y revocación global.**
  - **Entregable:** consumo de solicitud, nueva contraseña/hash, versión global y revocación de todas las familias en una transacción auditada.
  - **Aceptación:** enlace usado/vencido/cuenta errónea no cambia nada; reset/refresh concurrentes no conservan sesión antigua; no emitir acceso a partir del enlace solo por conocer un correo.
  - **Dependencias:** T005-04/T005-06/T005-10/T005-12/T005-14. [RF-2/RF-23–RF-25/RF-30]

## Fase 2 — Google, autorización y administración inicial

- [ ] **T005-16 — Implementar contexto y callback Google seguros.**
  - **Entregable:** Code/PKCE S256, state/nonce, validación de issuer/audience/tiempos/JWKS y contexto de uso único.
  - **Aceptación:** callback ligado al navegador/propósito y retorno permitido; no tokens propios en URL, secretos en query logs ni claims sin verificar.
  - **Dependencias:** T005-02/T005-03/T005-05/T005-07/T005-11; I-02. [RF-17/RF-21/RF-25]

- [ ] **T005-17 — Implementar cuenta/login Google sin unión automática.**
  - **Entregable:** identidad por issuer/`sub`, cuenta nueva `client` y rechazo de coincidencia de correo local con contraseña cuando aún no hay vinculación autorizada de esa identidad.
  - **Aceptación:** no duplicado en carrera local/Google; correo no verificado se rechaza; no cambio de roles ni traslado de identidad por cambio de correo externo.
  - **Dependencias:** T005-06/T005-08/T005-16. [RF-17–RF-19/RF-21/RF-26/RF-30]

- [ ] **T005-18 — Implementar vinculación autenticada separada.**
  - **Entregable:** flujo de cliente ligado a su cuenta/familia local con prueba reciente de contraseña, propósito link y commit protegido.
  - **Aceptación:** correo verificado coincidente y `sub` no ligado a otra cuenta; rechazar login callback usado como link, cuenta deshabilitada y destino de cuenta manipulado. No añadir desvinculación fuera de alcance.
  - **Dependencias:** T005-06/T005-10/T005-16/T005-17. [RF-19–RF-21/RF-29/RF-30]

- [ ] **T005-19 — Integrar autorización y estado de revocación vigente.**
  - **Entregable:** contexto de cuenta/familia/versión/rol y verificación, aplicado a operaciones protegidas.
  - **Aceptación:** token firmado antiguo no conserva acceso de cuenta/familia revocada o rol retirado; caída de la fuente de autorización no acepta privilegios por caché no confiable; no nuevos permisos sobre clientes/reservas.
  - **Dependencias:** T005-09/T005-11/T005-12/T005-13/T005-15/T005-18 y 001/002/009/010. [RF-7/RF-8/RF-14/RF-23/RF-26/RF-28/RF-29]

- [ ] **T005-20 — Preparar seed administrativo controlado.**
  - **Entregable:** procedimiento/herramienta idempotente con credencial segura autorizada, hash/política y evidencia del actor de despliegue.
  - **Aceptación:** sin contraseña en repo/migración/default ni endpoint de seed; no sobrescribir/reactivar cuenta de correo coincidente ni elevar al usuario de registro público. No ejecutar seed en esta tarea documental.
  - **Dependencias:** T005-04/T005-06/T005-07/T005-19. [RF-26–RF-30]

- [ ] **T005-21 — Integrar límites y bloqueo compartidos.**
  - **Entregable:** particiones IP/cuenta/familia/solicitud, counters/bloqueo y errores uniformes del plan.
  - **Aceptación:** múltiples instancias no eluden la cuota, sin revelar cuenta inexistente o aceptar familia arbitraria para revocar; medir NAT/carga y no perder límites al reiniciar un proceso.
  - **Dependencias:** T005-04/T005-06/T005-09/T005-10/T005-12/T005-14/T005-16/T005-18. [RF-10/RF-13/RF-16/RF-22/RF-29]

## Fase 3 — Integración y presentación

- [ ] **T005-22 — Integrar enlaces e intenciones protegidas con 004.**
  - **Entregable:** transporte temporal cifrado, destinatario/validez y uso único, con metadata no secreta para entrega/idempotencia.
  - **Aceptación:** no reemitir token al reintentar correo, no entregar un enlace invalidado ni usar las 24 horas de Resend como TTL de identidad; nada de enlaces en admin/auditoría/CSV/jobs generales.
  - **Dependencias:** T005-07/T005-09/T005-14/T005-15/T005-19/T005-21 y 004; I-04. [RF-6/RF-8/RF-22/RF-24/RF-25]

- [ ] **T005-23 — Integrar auditoría e incidentes saneados.**
  - **Entregable:** actor/acción/entidad/fecha/resultado de operaciones críticas y recuperación sin secretos.
  - **Aceptación:** cambio controlable sin auditoría no se aplica, efectos recuperados no duplican hechos; no JWT/refresh/nonce/password/enlace en evidencia ni usuario ficticio para fallo sin cuenta.
  - **Dependencias:** T005-06/T005-08–T005-22 y 010/004. [RF-2/RF-25/RF-30]

- [ ] **T005-24 — Publicar contratos y presentación segura.**
  - **Entregable:** OpenAPI/ProblemDetails y flujos SPA de registro/login/verificación/refresh/logout/Google/link/reset.
  - **Aceptación:** coordinar refresh entre peticiones/pestañas sin bypass de reutilización; respuesta genérica de recuperación/login, retorno limpio, credenciales en memoria/cookie y sin rutas nuevas de perfil o administración de usuarios.
  - **Dependencias:** T005-05/T005-09–T005-23. [RF-1/RF-3–RF-16/RF-17–RF-29]

## Fase 4 — Pruebas y puertas de habilitación, pendientes

- [ ] **T005-25 — Pruebas unitarias y de Application.**
  - **Entregable:** suite determinista de los 30 criterios con reloj/actor/entrega/Google controlados.
  - **Aceptación:** TTL/cortes, datos inválidos, roles, estados, consumo/reutilización, errores genéricos y límites trazados; no presentar un doble como validación de Google, navegador o PostgreSQL.
  - **Dependencias:** T005-08–T005-24. [RF-1–RF-30]

- [ ] **T005-26 — Pruebas PostgreSQL de carreras y atomicidad.**
  - **Entregable:** unicidad correo/`sub`, doble registro/refresh/enlace y reset compitiendo con renovación.
  - **Aceptación:** sin cuentas/ramas duplicadas ni token emitido sobre commit fallido; reutilización revoca familia y reset deja invalidadas todas las familias antiguas.
  - **Dependencias:** T005-03/T005-06/T005-08–T005-23. [RF-1/RF-4/RF-5/RF-8/RF-12–RF-15/RF-18/RF-20/RF-23/RF-24/RF-30]

- [ ] **T005-27 — Pruebas Google de contrato en test autorizado.**
  - **Entregable:** evidencia saneada de configuración/callback, claims, PKCE/state/nonce y creación/login/link.
  - **Aceptación:** casos de correo local con contraseña, no verificado y `sub` ocupado; no tokens propios en URLs ni cuenta real externa creada/configurada sin autorización.
  - **Dependencias:** T005-02/T005-16–T005-19/T005-24; I-02. [RF-17–RF-21/RF-25]

- [ ] **T005-28 — Pruebas de seguridad, navegador y secretos.**
  - **Entregable:** JWT adulterado, CORS/CSRF, cookies/orígenes reales, URL/redirección manipuladas y escaneo de almacenamiento/logs/artefactos.
  - **Aceptación:** ni algoritmos/issuer/audience inválidos ni acceso con versión/familia revocadas; nada de tokens/links en web storage o evidencia; transporte compatible sin downgrade inseguro.
  - **Dependencias:** T005-05/T005-07/T005-11–T005-24. [RF-2/RF-7/RF-11–RF-16/RF-17/RF-20/RF-21/RF-25–RF-30]

- [ ] **T005-29 — Pruebas E2E e integración con reservas/pagos.**
  - **Entregable:** registro/verificación, login/refresh/logout, Google/link y recuperación sobre API/SPA y contratos reales.
  - **Aceptación:** sin verificar no se reserva/paga, otras sesiones sobreviven logout actual, reset revoca todas; avisos de 004 y auditoría 010 sin secretos. No efectuar cobros reales.
  - **Dependencias:** T005-24/T005-25/T005-27/T005-28 y módulos integrados. [RF-1–RF-30]

- [ ] **T005-30 — Pruebas de fallo, recuperación y rotación de claves.**
  - **Entregable:** respuesta refresh perdida, reinicios, caída de auditoría/correo/persistencia y rotación/restauración de claves.
  - **Aceptación:** sin recuperar refresh consumido o credencial antigua como atajo; familias/versiones y enlaces se conservan con su seguridad; ninguna sesión se emite por un cambio que no se confirmó.
  - **Dependencias:** T005-07/T005-12/T005-13/T005-15/T005-22/T005-23/T005-26/T005-28. [RF-4/RF-6/RF-11–RF-15/RF-22–RF-25/RF-29/RF-30]

- [ ] **T005-31 — Validar configuración, capacidad y seed operativo.**
  - **Entregable:** parámetros medidos en host objetivo, orígenes/cookies, claves, callbacks, hash, límites distribuidos y procedimiento de seed revisados.
  - **Aceptación:** no sesión HTTP en memoria como mecanismo principal, no secreto/contraseña default ni cambios externos automáticos; pruebas con varias instancias y sin romper la revocación para mejorar latencia.
  - **Dependencias:** T005-20/T005-21/T005-24/T005-27/T005-28/T005-30. [RF-2/RF-11–RF-16/RF-25–RF-30]

- [ ] **T005-32 — Cerrar cobertura y revisar I-01–I-06.**
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

**Todas las tareas permanecen pendientes.** La cobertura documental no constituye implementación, sesión emitida o autorización para configurar proveedores.
