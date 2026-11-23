# Complemento 005-C — Solicitar otro enlace de verificación de correo

> **Estado:** aprobado v0.1; **APROBADO** el 2026-11-02 mediante DEC-208, con 18 criterios locales.  
> **Versión:** 0.1, 2026-11-02; 18 criterios locales.  
> **Base preservada:** [005 v0.1 aprobada](spec.md), sus 30 criterios, plan y tareas permanecen intactos. `005-C/RF-n` identifica solo este complemento.  
> **Origen:** ampliación funcional de verificación de 005/RF-6–RF-8; HU-03/HU-04 (P1), RF03/RF04 como contexto, RN-25/RN-28–RN-30 y AC04/AC05/AC07/AC09; DEC-205–DEC-207 como decisiones nuevas. No se inventa una HU/RF oficial.  
> **Fuentes:** [inventario](../../fuentes.md), [decisiones](../../decisiones.md), [004-C](../004-notificaciones/complemento-contratos.md), [008](../008-perfil/spec.md), [010](../010-clientes-auditoria/spec.md) y contraste original al final.  
> **Plan/tareas de esta ampliación:** no creados; la planificación anterior de 005 no cubre por inferencia este nuevo alcance.

## Resumen para revisión

- El cliente activo puede solicitar otro enlace desde su propia cuenta si aún no verificó su correo, tanto antes como después de vencer el anterior.
- El enlace va al correo vigente de esa cuenta: no permite introducir otro destinatario ni reemplaza el cambio de correo de 008.
- Solo el enlace de la última solicitud válida admitida sirve; los anteriores quedan invalidados y, si se abre uno sustituido, se indica usar el más reciente.
- Solicitar o recibir el correo no verifica la dirección, no permite reservar/pagar sin verificar y no origina una sesión nueva.
- Una solicitud rechazada no invalida la anterior válida. Repetir la misma operación no origina otro enlace; una nueva petición aceptada sí.
- Si falla entregar el correo de una petición ya admitida, no reaparecen enlaces viejos válidos; la entrega sigue 004 y el cliente puede solicitar otro conforme a sus controles.
- Se conservan uso único, vigencia limitada, permisos, protección de secretos, auditoría y reglas de baja/cambio de correo ya aprobadas.

Tres preguntas funcionales respondidas; la aprobación posterior del documento completo se registra separadamente en DEC-208. No se usan las respuestas individuales como aprobación global. No se fijan aquí duración del enlace, esperas, frecuencia, mensajes exactos o mecanismos técnicos.

## Contexto y objetivo

005 exige verificar el correo antes de reservar o pagar, pero permite iniciar sesión sin haberlo verificado. Su contrato inicial describe la verificación tras registro, no una acción autogestionada de pedir otro enlace si vence o no se recibió. El plan de 005 conserva expresamente esa ausencia de alcance y no autoriza inventarla desde el reenvío administrativo de 004.

El usuario elige poder solicitar otro, también antes del vencimiento, y conservar únicamente el último. Este complemento añade ese comportamiento sin editar los 30 criterios aprobados de 005 o confundir una nueva solicitud del titular con el reintento de entrega del mismo correo.

## Usuarios / actores

- **Cliente titular activo con correo no verificado:** solicita otro enlace desde su propia cuenta y usa la prueba vigente para verificar ese correo.
- **005 Identidad:** determina cuenta, correo vigente, estado de verificación y validez/consumo de enlaces.
- **004 Notificaciones:** entrega el enlace autorizado y aplica sus políticas de fallos, retries y reenvío manual; no emite ni renueva pruebas por iniciativa propia.
- **008 Perfil:** conserva su flujo independiente de solicitar/confirmar otro correo y los efectos de baja/cambio efectivo.
- **010 Auditoría:** registra la acción y su resultado sin enlaces, tokens o secretos.
- **Administrador:** no puede emitir enlaces a cualquier correo, editar cuentas o ver la prueba secreta por este complemento.

## Historias de usuario

- **HU-03 (P1):** registro del cliente y autenticación válida; 005 ya añade verificación previa a reservar/pagar. La capacidad de pedir otro enlace es una ampliación de entrevista, no texto original de HU-03.
- **HU-04 (P1):** acceso del cliente a su cuenta; se conserva el login permitido aunque el correo aún no esté verificado. No se cambia la política de logout o sesiones.
- No se añade HU-24, un nuevo rol o una funcionalidad administrativa de gestión de cuentas.

## Requisitos funcionales (criterios de aceptación en EARS)

- **RF-1:** CUANDO el titular activo de una cuenta con correo no verificado solicita otro enlace después de vencer el anterior, EL SISTEMA admitirá una nueva solicitud válida de verificación. (DEC-205; ampliación de 005/RF-6)
- **RF-2:** CUANDO el titular activo de una cuenta con correo no verificado solicita otro enlace antes de vencer el anterior, EL SISTEMA admitirá una nueva solicitud válida de verificación. (DEC-206)
- **RF-3:** EL SISTEMA restringirá la solicitud de otro enlace al cliente autenticado titular de la cuenta activa correspondiente. (RN-25; AC04/AC05; acceso desde su cuenta de DEC-205)
- **RF-4:** EL SISTEMA enviará el enlace solicitado únicamente al correo vigente no verificado de esa misma cuenta. (005; 004-C/RF-12/RF-14; separación de 008)
- **RF-5:** EL SISTEMA aplicará a cada enlace nuevo una vigencia limitada y un solo uso. (005/RF-6/RF-8; sin renovar el enlace anterior)
- **RF-6:** CUANDO se admite una nueva solicitud válida de verificación de ese correo, EL SISTEMA invalidará sus enlaces de verificación anteriores. (DEC-207)
- **RF-7:** SI el cliente presenta un enlace sustituido, ENTONCES EL SISTEMA le indicará que use el enlace más reciente sin verificar el correo con el sustituido. (DEC-207; texto exacto pendiente del plan)
- **RF-8:** CUANDO se repite la misma operación de solicitud ya admitida, EL SISTEMA impedirá que esa repetición genere otra solicitud o enlace. (AC07; idempotencia de 004/005/008)
- **RF-9:** SI una petición de nuevo enlace no puede admitirse, ENTONCES EL SISTEMA conservará la validez que aún tenga la solicitud anterior. (DEC-207: solo una nueva solicitud válida sustituye; 010/RF-36/RF-37)
- **RF-10:** SI falla la entrega del correo de una solicitud nueva ya admitida, ENTONCES EL SISTEMA no restaurará la validez de los enlaces que esa solicitud sustituyó. (DEC-207; separación de solicitud y entrega de 004)
- **RF-11:** CUANDO se reintenta la entrega de la misma solicitud, EL SISTEMA conservará su enlace y vigencia originales sin emitir una solicitud nueva. (004/004-C/RF-14; distinción con DEC-205–DEC-207)
- **RF-12:** MIENTRAS el correo siga sin verificarse, EL SISTEMA mantendrá bloqueadas la creación de reservas y el inicio de pagos. (005/RF-7; DEC-143)
- **RF-13:** CUANDO se consume un enlace vigente válido de esa cuenta y correo, EL SISTEMA verificará ese correo sin duplicar efectos por repeticiones posteriores. (005/RF-8; uso único de RF-5)
- **RF-14:** SI el correo ya está verificado al decidir sobre una solicitud nueva, ENTONCES EL SISTEMA no emitirá otro enlace de verificación para ese correo. (Alcance de 005/RF-6–RF-8; sin reversión de verificación)
- **RF-15:** EL SISTEMA excluirá pruebas, enlaces secretos y credenciales de respuestas públicas, logs, auditoría y consultas administrativas. (004-C/RF-15; 005/RF-25/RF-30; excepción acotada de entrega al destinatario previsto)
- **RF-16:** CUANDO se admite una solicitud de reemisión, EL SISTEMA auditará titular, cuenta, propósito, fecha y resultado sin secretos. (RN-28/RN-29; AC09; 005/RF-30)
- **RF-17:** SI no puede registrarse la auditoría requerida antes de admitir la solicitud, ENTONCES EL SISTEMA no aplicará esa nueva solicitud. (010/RF-36/RF-37; RF-9)
- **RF-18:** CUANDO cambia efectivamente el correo de la cuenta o se aplica su baja lógica, EL SISTEMA invalidará los enlaces pendientes de verificación asociados al correo anterior o a la cuenta dada de baja. (008/RF-19/RF-29; sin excepción por reemisión)

### Precisiones funcionales

- «Última» se refiere a solicitud nueva válida y admitida, no a correo que llegó último, petición inválida o callback del proveedor. Solicitudes concurrentes no pueden dejar dos enlaces actuales válidos para este mismo propósito/cuenta/correo.
- La sustitución se aplica al admitir la solicitud, no al abrirla, entregarla o recibir un evento de correo. Si no se admitió, no invalida; si se admitió y luego falló el envío, sigue siendo la actual hasta que se consuma, venza o sustituya/invalide legítimamente.
- La llegada tardía de un correo anterior no vuelve utilizable su enlace. No se promete retirar correos ya en vuelo o descargados; la verificación siempre respeta la validez vigente al aplicarse.
- La verificación no ocurre por pedir otro enlace, recibir/abrir un correo o iniciar sesión. Una prueba inválida no modifica verificación, correo, sesiones o reservas.
- El destinatario no se introduce libremente en esta acción. Pedir otro enlace para el correo vigente no confirma ni sustituye una solicitud de cambio de correo de 008; los propósitos son distintos.
- El cliente puede iniciar sesión con correo no verificado según 005. La reemisión no es login, recuperación de contraseña o emisión de nuevas credenciales de acceso.
- Los controles antiabuso y de autenticación existentes siguen aplicándose. Rechazar una petición por validación/permisos/límites o fallo local no invalida la anterior por el mero intento; no se fija aquí una cuota comercial de enlaces.
- Repetir una operación por respuesta perdida no equivale a volver a pulsar deliberadamente «solicitar otro» para originar una intención nueva. El resultado no se devuelve a credenciales que dejaron de estar autorizadas por conocer una referencia anterior.

## Requisitos no funcionales

- **AC04/AC05/RN-25:** solo el titular activo solicita para su cuenta; no datos ajenos, dirección libre o secretos en respuestas/admin/logs.
- **RS12/005/RF-16:** controles de abuso en solicitud/verificación; valores y mensajes técnicos se concretan después sin inventar una espera funcional durante esta entrevista.
- **AC07/AC11:** coherencia entre nueva solicitud, sustitución, verificación concurrente, baja/cambio de correo y repetición, con evidencia futura de integración.
- **AC02/ADR-008:** un fallo posterior de entrega no verifica el correo, restaura pruebas viejas o revierte efectos locales admitidos.
- **AC09/RN-28/RN-29:** evidencia anexada de actor, propósito y resultado sin prueba secreta; no modificar auditoría para rehacer una entrega.
- **Vigencia y transporte:** se conservan las restricciones aprobadas de 005/004-C; duración concreta, controles de entrega y recuperación son trabajo del plan posterior, no reglas nuevas atribuidas al usuario.

## Casos límite

| Caso | Resultado esperado | Criterios |
|---|---|---|
| Enlace anterior vencido | Puede pedir otro desde su cuenta no verificada | RF-1/RF-3 |
| Enlace anterior aún vigente, correo no encontrado | Puede pedir otro; el nuevo admitido sustituye al anterior | RF-2/RF-6 |
| Otra cuenta o cuenta inactiva intenta solicitar | No reemisión autorizada | RF-3/RF-4 |
| Abre enlace sustituido, incluso si llegó después por correo | No verifica; indicación de usar el más reciente | RF-6/RF-7 |
| Misma solicitud repetida tras respuesta perdida | No otra generación ni entrega lógica duplicada | RF-8 |
| Nueva petición inválida/no admitida o auditoría falla | Conservar la solicitud anterior aún válida | RF-9/RF-17 |
| Nueva solicitud admitida, entrega fallida/desconocida | No restaurar anteriores ni afirmar verificación; entrega sigue 004 | RF-10/RF-12 |
| Retry/reenvío de entrega de una solicitud | Mismo enlace/expiración; no renovar prueba o emitir otra desde 004 | RF-11 |
| Verificación válida gana frente a nueva solicitud | Cuenta verificada; no emitir otro enlace para ese correo | RF-13/RF-14 |
| Dos nuevas solicitudes válidas concurrentes | Solo la última admitida conserva enlace utilizable | RF-5/RF-6 |
| Cambio efectivo de correo o baja con enlace en cola | Enlace anterior deja de verificar; sin reactivación por correo tardío | RF-18 |
| Solicitar otro, pero no verificarlo | Reservar/pagar siguen bloqueados | RF-12 |

## Fuera de alcance

- Modificar el correo destinatario, verificar el correo nuevo de 008 o trasladar esta regla de «último» a todas las recuperaciones de contraseña.
- Reemisión anónima por correo libre, emisión por soporte/admin, pantalla de gestión de usuarios, desbloqueo manual de reservas/pagos o reactivación de cuentas.
- Nuevos roles, proveedores, sesiones, contraseñas o mecanismos de autenticación; no se cambian login/logout o vinculación Google.
- Renovar enlaces automáticamente por un retry de correo o usar el reenvío manual de 004 para crear pruebas nuevas.
- Mensajes exactos, duración del enlace, intervalos, máximos de solicitudes, arquitectura, almacenamiento, endpoints, algoritmos y herramientas: corresponden al plan posterior.
- Editar documentos aprobados de 005/004/008/010 o sus planes/tareas, crear planificación de esta ampliación antes de aprobarla, código, envíos/cuentas reales, commits o push.

## Criterios de finalización

### Documento

- Conservar las tres respuestas DEC-205–DEC-207 separadas de la aprobación del complemento completo.
- Mantener 18 criterios verificables y numeración propia `005-C/RF-1–RF-18`, sin cambiar los 30 de 005.
- Conservar todas las secciones de la plantilla, contraste de fuentes y límites con 004/008/recuperación de contraseña.
- Obtener aprobación expresa antes de plan/tareas; respuestas individuales y «continua» no la sustituyen.

### Implementación futura

- Verificar reemisión antes/después de vencimiento, autorización/destinatario propios y solo último enlace válido.
- Verificar solicitud rechazada frente a admitida con correo fallido, replay, dos solicitudes y verificación concurrentes.
- Verificar bloqueo de reserva/pago hasta consumo válido, cuenta ya verificada, baja/cambio de correo y ausencia de secretos.
- Verificar auditoría conjunta, transporte/retry sin renovar prueba y mensajes comprensibles sin confundir solicitud con verificación.

## Contraste con las fuentes originales

| Fuente | Cobertura y límite |
|---|---|
| F02 HU-03/HU-04; F03 RF03/RF04 | Registro y acceso propios preservados; no contienen la acción específica de solicitar otro enlace. Es ampliación de entrevista, no cobertura original inventada. |
| 005/RF-6–RF-8/RF-16/RF-25/RF-29/RF-30 | Verificación limitada/de un uso, login sin verificar, bloqueo de reserva/pago, seguridad, cuenta activa y auditoría heredados. Los 30 criterios y su aprobación no se editan. |
| 004-C/RF-12–RF-15 y 004 | Enlace solo al destinatario previsto, autoridad de identidad, evidencia saneada y retry/reenvío propios; no emisión de pruebas desde el canal de correo. |
| 008/RF-19/RF-29 | Cambio de correo y baja invalidan los enlaces anteriores; reemisión no crea excepción ni cambia el destino de 008. |
| 010/RF-36/RF-37 | Fallo de auditoría antes de una acción controlable impide aplicarla; no se invalida antes lo que no pudo sustituirse. |
| DEC-205–DEC-207 | Nuevo alcance autogestionado, admisión también antes de vencer y solo último enlace válido. No son aprobación global del documento. |

## Dudas abiertas

- **RESUELTO EN ENTREVISTA:** pedir otro desde la cuenta tras vencer, también antes del vencimiento y conservar solo el último válido.
- **PRECISIONES HEREDADAS/DE COHERENCIA:** titular/correo vigente, estado no verificado, uso único/vigencia limitada, separación con entrega, solicitud rechazada no sustituye, auditoría y baja/cambio conservan sus contratos; no se atribuyen como preguntas nuevas contestadas.
- **PENDIENTE DEL PLAN:** duración/controles de abuso, interfaz/mensajes, identidad/repetición de operación, sustitución/consumo, transporte/recuperación y carreras de solicitud/envío/verificación. Las condiciones técnicas de contratos propuestos no se declaran probadas.
- **APROBACIÓN REGISTRADA:** complemento completo v0.1 con 18 criterios mediante DEC-208. Sin nueva planificación, tareas o implementación; se conservan las comprobaciones técnicas pendientes.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1, 18 criterios `005-C/RF-1–RF-18`.
- **Aprobación expresa del documento completo:** sí; selección «Aprobar complemento» a «¿Apruebas el complemento 005-C v0.1 completo, con sus 18 criterios para solicitar otro enlace de verificación?».
- **Fecha de aprobación:** 2026-11-02; DEC-208.
- **Respuestas de entrevista:** DEC-205–DEC-207; no aprueban el complemento completo.
- **Preservación:** base 005 y todos los documentos aprobados/planes/tasks y propuestas previas intactos.
- **Plan/tareas de esta ampliación:** no creados; sin código, cuentas/enlaces/correos reales, configuración, commits o push.
