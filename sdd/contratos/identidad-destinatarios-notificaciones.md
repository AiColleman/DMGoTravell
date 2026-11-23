# Contrato técnico propuesto: identidad, destinatarios y notificaciones

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-202.  
> **Estado:** propuesta documental pendiente de ratificación técnica y verificación; **NO IMPLEMENTADA**.  
> **Ámbito:** 004/004-C, 005, 008 y 010; AT-04/AT-05 del análisis transversal.  
> **Límite:** no cambia specs, planes, tareas, ADR, políticas de identidad o facultades administrativas; no emite enlaces/correos reales ni configura proveedores.  
> **Nota de vigencia:** DEC-208 aprueba 005-C y DEC-209 crea su plan propio. Las menciones a «reemisión de verificaciones fuera del alcance aprobado» de este contrato son anteriores a esa aprobación y se leen como antecedente; PM-01/PM-03 deben cubrir también 005-C. Esta nota no ratifica el contrato ni modifica la spec aprobada.

## 1. Autoridad y procedencia

Bases: [004 base](../specs/004-notificaciones/spec.md), [004-C](../specs/004-notificaciones/complemento-contratos.md), [005](../specs/005-identidad/spec.md), [008](../specs/008-perfil/spec.md), [010](../specs/010-clientes-auditoria/spec.md), [constitución](../constitution.md) y [análisis DEC-200](../analisis-consistencia.md). Diseño derivado de [004 plan §§5–9](../specs/004-notificaciones/plan.md), [005 plan §§5–8/10](../specs/005-identidad/plan.md), [008 plan §§7–10](../specs/008-perfil/plan.md) y [010 plan §§4–5](../specs/010-clientes-auditoria/plan.md).

La [coordinación transaccional DEC-201](coordinacion-transaccional.md) conserva el orden de protecciones de cuenta/solicitud y el commit local frente a efecto externo; sigue siendo propuesta no ratificada. Este documento concreta destinatarios, pruebas y entrega, no sustituye ese protocolo o sus PT-01–PT-04.

Identidad decide emisión/validez/consumo de pruebas; Perfil origina los propósitos propios de cambio de correo; Notificaciones transporta mensajes autorizados; Auditoría conserva evidencia saneada. El worker de correo no verifica direcciones por entregar un mensaje ni tiene facultad de emitir credenciales, renovar pruebas o corregir perfiles.

Los IDs CM/DM/EM/PM son referencias técnicas locales, no RF/HU oficiales o tareas añadidas. Fuera de alcance: marketing, MFA, enlace «deshacer cambio», correo de baja no solicitado, nuevas pantallas de cuentas/roles, reemisión de verificaciones fuera del alcance aprobado, TTL nuevos, elección de algoritmos/proveedores de claves, código/SQL/OpenAPI definitivo o configuración Resend/DNS.

## 2. Matriz de propósitos y destinatarios

| ID/propósito | Origen autorizante | Destinatario determinado por el origen | Regla de vigencia antes de admitir envío/retry | Contenido sensible permitido |
|---|---|---|---|---|
| DM-01 — Verificación de registro | 005; 005/RF-6–RF-8 y 004-C/RF-12 | Dirección ligada a la cuenta/solicitud admitida por 005 | Solicitud de verificación válida para esa cuenta/dirección, no invalidada/consumida/expirada | Solo enlace autorizado a ese destinatario, no contraseña o token bruto separado. |
| DM-02 — Recuperación de contraseña | 005; 005/RF-22–RF-25 y 004-C/RF-13 | Dirección autorizada por 005 para una solicitud admitida | Cuenta/propósito/prueba/versión/vigencia válidos según 005; respuesta pública sigue genérica | Solo enlace de restablecimiento previsto; no nueva contraseña o sesión. |
| DM-03 — Verificación de correo solicitado | 008, coordinado con 005; 008/RF-11–RF-16 | Nuevo correo de la última solicitud válida admitida | Generación actual de cambio, cuenta activa y prueba vigente; aún no sustituida/consumida | Solo enlace de esa solicitud al nuevo destino; no prueba al correo anterior. |
| DM-04 — Seguridad: correo anterior | 008; 008/RF-21 | Dirección anterior capturada en el cambio efectivamente aplicado | Hecho aplicado y propósito mínimo de seguridad; **no** exigir que esa dirección siga siendo correo vigente | Ninguna contraseña, prueba, token o enlace de acceso. |
| DM-05 — Seguridad: correo nuevo | 008; 008/RF-21 | Dirección nueva capturada en el mismo cambio aplicado | Hecho aplicado y propósito mínimo de seguridad; un cambio posterior no borra ese hecho | Ninguna contraseña, prueba, token o enlace de acceso. |

DM-04/DM-05 son entregas independientes: una dirección no ve a la otra en CC/BCC ni recibe datos de reservas u otras cuentas para explicar el cambio. El aviso contiene el hecho mínimo, fecha y referencia segura, no un permiso de acceso o un enlace de reversión. Un fallo de una entrega no suprime la otra ni revierte el cambio.

La regla genérica de 004 de retener al cambiar el correo no se aplica ciegamente a estos cinco propósitos: cada uno requiere la autoridad correspondiente. Esta excepción acotada no convierte una dirección histórica en alias permanente ni autoriza enviar un comprobante de reserva a una dirección antigua. Otros correos de negocio/administradores conservan su contrato propio.

Solo 008 exige explícitamente **la última solicitud válida** de cambio. Notificaciones no traslada ese criterio por analogía a todas las solicitudes de registro/reset: consulta la validez que 005 determine. PM-01 conserva la precisión de generaciones/invalidationes por propósito que el adaptador debe acreditar, sin inventar una política nueva de «último reset».

## 3. Fronteras lógicas entre módulos

| ID | Responsable | Entrada mínima confiable | Salida/efecto propuesto |
|---|---|---|---|
| CM-01 — Admitir intención de identidad/perfil | 005/008 | Cuenta, acción del titular o solicitud admitida, propósito y operación | Solicitud/hecho e intención de aviso durables junto con su auditoría y efectos locales requeridos. No enviar antes de commit. |
| CM-02 — Resolver destinatario por propósito | 005/008 | Referencia de solicitud/hecho, propósito y rol de destinatario | Destino autorizado y versión/generación aplicables, o rechazo/indisponibilidad. No correo libre del cuerpo de una llamada a 004. |
| CM-03 — Autorizar admisión de despacho | 005/008 con 004 | Solicitud/hecho y entrega original/manual, versión/generación y tiempo confiables | Decisión vigente bajo protección compatible de cuenta/solicitud: admitir esa emisión, suprimir por invalidez o retener por origen no comprobable. |
| CM-04 — Custodiar carga protegida | 005/004, adaptador restringido | Material secreto de enlace admitido o cuerpo congelado de entrega | Referencia opaca a envolvente cifrada y contextualizada; acceso mínimo solo para renderizar/despachar. No secreto en el job. |
| CM-05 — Reclamar y enviar entrega | 004 | Referencia de entrega/generación, autorización de propósito y payload estable | Intento durable antes del HTTP, clave/cuerpo estables y resultado aceptado/desconocido/rechazado; sin locks de negocio durante red. |
| CM-06 — Consumir prueba | 005; 008 para cambio de correo | Prueba ligada a propósito/solicitud/cuenta y acción admitida | Revalidación y uso único junto con la mutación local; invalidez no modifica cuenta. No consumir por evento de entrega de Resend. |
| CM-07 — Recuperar/reintentar/reenvío único | 004 con autoridad del origen | Entrega, generación, estado verificable y autorización actual | Misma operación automática admisible o única generación manual permitida; no emitir otra prueba ni cambiar destinatario/cuerpo por retry. |
| CM-08 — Anexar evidencia y limpiar material temporal | 010 y propietario del almacén protegido | Hecho/entrega/operación, fechas/resultados y referencias saneadas | Auditoría sin secretos y limpieza de carga temporal según elegibilidad/retención técnica; no borrar historial para limpiar una prueba. |

CM-02/CM-03 no son un único `bool`: distinguir solicitud vigente, sustituida, usada, expirada, cuenta inactiva, destinatario incompatible y origen indisponible sin revelar esos detalles en una respuesta pública de recuperación.

## 4. Datos compartidos, transporte y protección

### Contexto mínimo y separación de almacenes

Proponer referencias estables de operación, cuenta, solicitud/hecho, propósito, generación de solicitud, entrega y rol de destinatario. Separar versiones de perfil, solicitud y seguridad conforme al plan 008; editar nombre/teléfono no sustituye por accidente una solicitud de correo o cierra sesiones.

Mantener tres clases distintas:

1. **Verificador de uso:** digest/verificador protegido con propósito/cuenta/dirección/generación/vigencia. Permite comprobar la prueba, no reconstruir el secreto aleatorio para enviarlo.
2. **Carga temporal protegida de transporte:** prueba/enlace o contenido exacto necesario para enviar/repetir, cifrado con acceso restringido y referencia opaca. Su existencia no vuelve vigente una prueba revocada.
3. **Evidencia de entrega/auditoría:** IDs, propósito, destino o referencia minimizada autorizada, plantilla, estado, fechas y referencia externa; no cuerpo completo, prueba o enlace secreto.

El dispatcher necesita conservar contenido recuperable para repetir **la misma** solicitud autorizada; no puede regenerar un token desde un digest o crear otra prueba bajo la misma clave. Tampoco «cifrado» basta como garantía: PM-02 exige mecanismo mantenido, separación de permisos, claves durables protegidas entre réplicas, versionado/rotación/restauración y verificación de vinculación de la envolvente a cuenta/solicitud/propósito/entrega para impedir intercambio de cargas.

Nada secreto en argumentos de Hangfire, outbox de consulta general, logs/APM, excepciones, cuerpos de incidentes, métricas o CSV/PDF. Una referencia a material cifrado tampoco concede acceso por mero conocimiento. No elegir un proveedor nuevo de claves o depender del disco efímero del contenedor.

### Contenido inmutable de la entrega

Congelar para cada generación: destinatario autorizado, remitente, asunto, cuerpo renderizado, plantilla/versión y clave de idempotencia, incluyendo el mismo enlace cuando lo lleve. No insertar fecha «actual», nuevo token, otro destinatario o una plantilla distinta en un retry con la misma clave.

Proponer una clave opaca de entrega/generación sin correo, token o PII. Generación de solicitud y generación manual de entrega son cosas distintas: reenviar manualmente un correo fallido no sustituye la solicitud ni renueva la prueba. Una solicitud nueva válida de 008 sí crea otra generación y deja inválida la anterior, con intención/clave propias.

### Canal al destinatario y consumo

Solo el destinatario previsto recibe el enlace autorizado, excepción delimitada por 004-C y la lectura conjunta de 005/RF-6/RF-22/RF-25. La respuesta pública de solicitud no devuelve enlace/token; un administrador consulta evidencia, no secretos o contenido protegido de la prueba. Los avisos DM-04/DM-05 nunca transportan esa excepción.

El plan 008 propone origen HTTPS permitido, prueba en fragmento retirado inmediatamente, envío al backend en cuerpo y `no-store`/`no-referrer`, sin tracking/terceros antes de retirarla. Se mantiene como opción a comprobar en PM-02, no compatibilidad demostrada de todos los clientes de correo. No access/refresh/contraseña en enlace, URL o redirección; no destino arbitrario/redirección abierta del cliente.

Proponer una entrada de navegación que no consuma ni modifique identidad por un GET/HEAD de previsualización, escáner o apertura automática; consumo en comando explícito con prueba y validaciones de su caso de uso. Abrir, entregar, hacer clic o recibir `email.delivered` no basta para cambiar contraseña/correo o emitir una sesión. No añadir factor de autenticación, aprobación del correo anterior o requisito de misma pestaña a la confirmación de 008.

## 5. Commit, envío e invalidación concurrente

### Orden local propuesto

1. El origen admite la solicitud/hecho y registra intención/carga protegida necesaria en el commit local correspondiente. Si falla auditoría antes de una mutación controlable, no aplicar el cambio; envío posterior fallido no revierte uno confirmado.
2. Un worker reclama por lease durable una entrega, usando la referencia de trabajo, no una entidad/token serializados. El lease identifica al ejecutor; no es autorización del destinatario o prueba de no envío anterior.
3. Bajo protección de cuenta/solicitud y entrega compatible con DEC-201, revalidar propósito/generación/destino/vigencia, material protegido y resultado previo. Congelar/reutilizar el payload e incorporar admisión/intento antes del HTTP.
4. Soltar la transacción antes de llamar al proveedor. Si no se puede confirmar la admisión, no enviar por suposición. Si el proceso/commit es incierto, verificar la misma operación antes de reclamar otra emisión.
5. Conservar resultado real/ID externo o incertidumbre y evidencia saneada. Cada retry vuelve a consultar al origen; una decisión anterior no da permiso perpetuo.

### Carrera que no puede ocultarse

Si la sustitución/baja/invalidation ganó **antes de la admisión protegida**, el enlace no se admite como vigente. Si la admisión ganó y el envío ya quedó en vuelo/aceptado antes de una invalidación posterior, no puede retirarse ese correo con rollback SQL. No mantener locks durante HTTP para fingir esa atomicidad.

La prueba deja de ser utilizable al invalidarla y su consumo vuelve a consultar estado/generación/vigencia aunque el mensaje llegue después. Debe distinguirse **admitido para enviar**, **petición externa incierta/aceptada** y **entregado al servidor destinatario**. PM-03 exige definir/probar también la ventana entre admisión y envío: una admisión antigua no habilita iniciar cualquier envío futuro ni repetir una prueba ya inválida. Este contrato no promete «ningún mensaje antiguo puede aparecer» ni declara resuelta esa frontera por un lease o check previo.

DM-04/DM-05 se autorizan por su hecho aplicado, no por una prueba vigente: un cambio de correo o baja posterior no borra ese hecho ni su aviso mínimo. No retargetear al correo más reciente el aviso dirigido a una dirección capturada. Mensajes independientes pueden llegar fuera de orden; fecha/referencia del hecho evita afirmar que describen el estado actual.

### Consumo y resultado de identidad

005/008 comprueban cuenta/propósito/solicitud/prueba/vigencia/generación y unicidad que corresponda. Cambio de correo: consumir solicitud, aplicar correo verificado, invalidar enlaces anteriores, revocar todas las familias, auditar y registrar DM-04/DM-05 conjuntamente. Si el correo se ocupó al confirmar, no sustituirlo ni transferir otra cuenta. Un fallo posterior de confirmación de correo no deshace una edición básica ya aceptada antes.

Reset: contraseña válida, consumo de prueba y revocación global según 005; entrega SMTP no ejecuta ninguno de esos pasos. Repetir una prueba usada no entrega credenciales o datos a quien perdió autorización. Baja invalida solicitudes de identidad según 008 y no se revierte por un correo en cola, enlace antiguo o recepción tardía del aviso.

## 6. Retry, incertidumbre y limpieza

- Usar los parámetros y límites de 004/005/008 ya propuestos, sin añadir TTL aquí. Las 24 horas de idempotencia de Resend no son vigencia de prueba; una prueba propuesta de 30 minutos puede vencer mucho antes de esa ventana y la verificación propuesta de registro de 24 horas no obtiene extensión por reenvío.
- Deduplicación local no caduca con las 24 horas externas. Resultado desconocido no se resuelve creando otra clave/entrega, cambiando el cuerpo o enviando a otro destinatario. Repetición automática solo bajo la ventana segura y autoridad de propósito que el plan 004 exige.
- Si vence/se sustituye/invalida una prueba, no mandar de nuevo el enlace como válido ni generar otro desde 004. Si la entrega era desconocida, conservar esa incertidumbre/evidencia aunque quede suprimida la autorización de futuros envíos: invalidez no demuestra que el proveedor no aceptó el anterior.
- Solo un reenvío manual autorizado para una entrega fallida y verificable; no para aceptación desconocida sin resolver. Revalidar propósito/prueba/destino. Si esa generación manual falla/desconocida, consultar evidencia sin otro envío automático o segundo permiso.
- Si hace falta otra prueba, la origina un flujo autorizado de 005/008; no se inventa reemisión de verificación de registro o «renovar por panel» para cerrar un fallo de correo. Lo que esté fuera de criterios aprobados necesita alcance independiente.
- Limpiar material secreto temporal cuando ya no sea necesario/admisible para transporte o recuperación según el plan validado, conservando referencias/evidencia saneadas. No borrar auditoría, solicitud consumida o digests necesarios para rechazo/replay solo porque se limpia el cuerpo protegido. PM-02 conserva retención/respaldos/rotación pendientes: no se garantiza borrado físico universal de copias por limpiar una fila.
- Un único dueño de retry por generación, sin sumar SDK/Hangfire/supervisor. Correo/auditoría caídos generan incidente primario recuperable conforme 004-C; el propio aviso fallido no crea una cadena infinita. No declarar recuperación por una tabla en la misma base totalmente caída.

## 7. Escenarios de aceptación técnica futuros

Todos **no ejecutados**; se vinculan al backlog existente, sin nuevas casillas o aprobación de tests.

| ID | Escenario | Resultado a verificar | Referencia |
|---|---|---|---|
| EM-01 | Registro/reset admitido frente a consulta pública | Respuesta sin enlace/token; contenido secreto solo al destinatario autorizado | 005/RF-6/RF-22/RF-25; 004-C/RF-12–RF-15. |
| EM-02 | Dirección/propósito/cuenta/generación manipulados | Rechazo, sin entrega a correo arbitrario o consumo cruzado de prueba | 008/RF-2/RF-14; I-04/P-03. |
| EM-03 | Nueva solicitud válida de correo y worker de la anterior | No admitir envío/retry de anterior si ya fue sustituida; anterior no usable al consumir | 008/RF-13/RF-14; PM-03. |
| EM-04 | Nueva dirección inválida/ocupada o actualización solo nombre/teléfono | No sustituir solicitud válida ni revocar sesiones por edición básica | 008/RF-6/RF-9; precisiones de 008. |
| EM-05 | Nueva cuenta ocupa correo solicitado antes de confirmar | Unicidad revalidada, sin cambio/transferencia de identidad o confirmación parcial | 008/RF-15/RF-16; P-01/P-02. |
| EM-06 | Confirmación de correo aplicada con sesión activa | Revocación global/invalidaciones y dos intenciones en un commit; no sesión nueva por respuesta perdida | 008/RF-16–RF-21/RF-36; I-05/P-02. |
| EM-07 | Aviso al anterior después de cambiar correo | No suprimir por dejar de ser correo vigente; hecho mínimo sin credenciales/enlace/otro destinatario | 008/RF-21; DM-04. |
| EM-08 | Un aviso falla y otro se acepta; otro cambio ocurre antes de entrega | Entregas independientes del hecho original, sin rollback/retarget/CC o falsa descripción de estado actual | 008/RF-21/RF-22; P-03. |
| EM-09 | Prueba vencida/usada/invalidada antes de admisión | No admitir envío/retry ni consumo; conservar estado real de entrega si antes era desconocido | 004-C/RF-14; 008/RF-14/RF-19; PM-03. |
| EM-10 | Invalidación tras admisión frente a envío en vuelo/aceptado | Prueba no utilizable; registrar lo realmente conocido, sin prometer retirada SMTP o despacho futuro ilimitado | 008/RF-13/RF-14; PM-03. |
| EM-11 | Preview GET/HEAD, escáner de enlaces o evento `email.delivered` | No consumo/mutación/sesión por ese hecho; comando válido conserva uso único | 005/RF-8/RF-23/RF-24; 008/RF-14; PM-02. |
| EM-12 | Retry automático con mismo hecho/generación | Cuerpo/clave/destinatario/plantilla/enlace estables, sin renovar prueba o incorporar fecha variable | 004/RF-5/RF-6; M-02/M-04. |
| EM-13 | Respuesta perdida y frontera de 24 horas de Resend | No otra clave/copia ciega; deduplicación local conserva resultado o incertidumbre | 004/RF-5/RF-6; M-02. |
| EM-14 | Dos admins piden reenvío manual; su envío falla/desconocido | Una generación manual, sin retry automático de esa generación ni nuevo token | 004/RF-9/RF-10; M-02. |
| EM-15 | Dos workers, lease vencido y primero aún potencialmente enviando | No asumir ausencia de envío por vencimiento; reconciliar operación sin duplicado | 004/RF-5/RF-6; M-02; PM-03. |
| EM-16 | Fallo antes del commit y fallo después de aceptación externa | Antes: sin efecto controlable parcial; después: conservar resultado/recuperar sin otra copia | 008/RF-22/RF-35; 010/RF-36/RF-37; M-05. |
| EM-17 | Envolvente intercambiada, clave rotada o réplica reiniciada | Rechazo de contexto ajeno; recuperación protegida donde sea válida, sin regenerar secretos o usar disco efímero | I-01/I-04; PM-02. |
| EM-18 | Baja o cambio de correo invalida enlaces con mensaje ya en cola | Acceso/consumo rechazado cuando corresponda; aviso histórico mínimo no reactiva cuenta | 008/RF-19/RF-28/RF-29/RF-32; P-03. |
| EM-19 | Escaneo de logs/jobs/incidentes/auditoría/exportaciones y errores | Sin enlaces/tokens/cuerpos secretos; administrador no descarga carga protegida para reenviar manualmente | 004-C/RF-15; 005/RF-30; 008/RF-34; A-03. |
| EM-20 | Fallan base/auditoría y correo/alerta simultáneamente | Evidencia recuperable y consulta autorizada sin recursión, sin declarar éxito ni crear credenciales por recuperar entrega | 004-C/RF-7–RF-9; M-05; PM-04. |

## 8. Precisiones pendientes y vínculo con tareas existentes

| ID | Evidencia pendiente antes de ratificar/habilitar | Puertas existentes |
|---|---|---|
| PM-01 | Contrato de validez/invalidación por propósito de 005/008: generaciones, versiones, correo origen/destino, destinatarios históricos y lecturas completas. No imponer «solo último reset» desde Notificaciones o usar «igual al correo vigente» para todos los mensajes. | I-04/I-05; P-01/P-03; M-04. |
| PM-02 | Custodia/retención/rotación/restauración y contexto de cargas cifradas, acceso mínimo; renderizado/payload estable; enlace/orígenes/fragmento/cliente de correo/escáner y consumo seguro en runtime objetivo. No elegir algoritmo/proveedor o prometer borrado de respaldos sin evidencia. | I-01/I-03/I-04; P-03; M-04. |
| PM-03 | Punto de admisión de envío y su relación con invalidación/tiempo/lease; límites de reutilización de autorización y desconocidos, SDK/Resend/idempotencia/eventos. La separación local/HTTP no equivale a envío atómico con estado de identidad. | M-02/M-03/M-04; P-02/P-03; PT-01/PT-03 de DEC-201. |
| PM-04 | Recuperación de aceptación/commit desconocidos, fallo simultáneo de correo/auditoría, incidentes sin recursión y limpieza que no destruya evidencia. Entorno/destinatarios/credenciales de test requieren autorización posterior. | M-01/M-05/M-06; A-03; I-06/P-06. |

Trabajo ya previsto: [004 tasks](../specs/004-notificaciones/tasks.md), T004-03–T004-07/T004-11–T004-18/T004-20–T004-25/T004-28; [005 tasks](../specs/005-identidad/tasks.md), T005-06/T005-07/T005-09/T005-14/T005-15/T005-22/T005-26/T005-28/T005-30; [008 tasks](../specs/008-perfil/tasks.md), T008-03–T008-05/T008-08–T008-12/T008-18/T008-19/T008-21/T008-23–T008-26/T008-28; [010 tasks](../specs/010-clientes-auditoria/tasks.md) para anexado/recuperación saneados. Son referencias de apoyo, **no entregables/tareas marcados completados por redactar este contrato**.

Sin nuevas consultas externas: se usan las fuentes y evidencias con fecha/alcance ya registradas en [fuentes](../fuentes.md) y planes. No se acredita vigencia de una cuenta/API/SDK por esta redacción, ni se repite como exitosa la reconsulta PostgreSQL fallida de DEC-201.

Inventario preservado: **659 criterios, 386 tareas pendientes y cero ejecutadas**. Specs/planes/tasks y documentos DEC-200/DEC-201 intactos. Este contrato queda propuesto, sin ratificación, implementación, permisos nuevos o cierre de puertas.

### Comprobación documental de cierre

- 878 enlaces locales comprobados, ninguno roto; DM-01–DM-05, CM-01–CM-08, EM-01–EM-20 y PM-01–PM-04 consecutivos y únicos. Referencias explícitas de RF y tareas contrastadas con los documentos existentes.
- 45 documentos previos intactos: los 43 Markdown protegidos de `specs/` salvo su índice, el análisis DEC-200 y el contrato DEC-201; huellas SHA-256 coincidentes con las de inicio de esta actividad.
- DEC-202 único y ningún encabezado DEC duplicado; las 386 casillas continúan pendientes. Son comprobaciones de archivos, no pruebas de correo, criptografía, runtime, carreras o proveedores.
