# Plan técnico — Complemento 005-C: Reemisión de verificación

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-209.  
> **Base:** [005-C v0.1 aprobado](complemento-reemision-verificacion.md), 18 criterios, DEC-208; respuestas DEC-205–DEC-207.  
> **Estado:** planificación documental **NO EJECUTADA**. No código, SQL, cuentas, enlaces/correos reales o configuración externa.  
> **Preservación:** [spec base](spec.md), [plan base](plan.md), [tasks base](tasks.md), complemento aprobado y documentos anteriores intactos. Este plan cubre solo 005-C; no reemplaza las 32 tareas originales de 005.

## 1. Objetivo y contratos

Planificar la solicitud propia de otro enlace antes/después de vencer, con solo última solicitud válida admitida, sin cambiar correo/estado de acceso ni confundir reemisión del titular con retry del mensaje o reenvío administrativo.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [fuentes](../../fuentes.md), 005/RF-6–RF-8/RF-16/RF-29/RF-30, 004-C/RF-12–RF-15, 008/RF-19/RF-29 y 010/RF-36/RF-37. Se reutilizan responsabilidades de [004 plan](../004-notificaciones/plan.md), [008 plan](../008-perfil/plan.md), [010 plan](../010-clientes-auditoria/plan.md) y las propuestas de [coordinación](../../contratos/coordinacion-transaccional.md)/[identidad y entrega](../../contratos/identidad-destinatarios-notificaciones.md), sin ratificarlas por referencia.

| Participante | Contrato requerido | Límite |
|---|---|---|
| 005 registro/verificación | Emisión inicial y consumo del mismo propósito de verificación del correo vigente, estado/rol/familia actuales | La reemisión debe invalidar también el enlace inicial, no solo los creados por esta acción. No dejar un consumidor antiguo que omita la generación actual. |
| 004/004-C | Intención durable, destinatario autorizado, carga protegida, payload/clave estables y resultado de entrega | 004 transporta la prueba de Identity; no la renueva ni vuelve válido un enlace sustituido. |
| 008 | Correo vigente/versión de contexto y baja/cambio efectivo | No sustituir la solicitud pendiente de cambio de correo de 008 ni crear un destinatario nuevo desde reemisión. |
| 010 | Anexado local, actor/propósito/resultado saneados y recuperación de evidencia | Auditoría requerida fallida impide admitir una solicitud, no borra la anterior válida. |
| 001/002 | Verificación actual antes de reservar/pagar | Pedir, enviar o aceptar correo no elimina este guard. |

## 2. Parámetros técnicos propuestos

Se concretan aquí sin trasladar preguntas técnicas al usuario ni presentarlos como reglas comerciales aprobadas. Deben calibrarse y verificarse antes de habilitar.

| Parámetro | Propuesta inicial | Condición |
|---|---|---|
| Vigencia de nueva solicitud | 24 horas desde su admisión, como propone la verificación del plan base 005 | Uso válido mientras el instante real sea anterior al vencimiento; igualdad ya vencida. El retry no cambia creación/expiración. No procede de las 24 horas de Resend. |
| Prueba opaca | 32 bytes aleatorios criptográficos, verificador/digest protegido y contexto cuenta/correo/propósito/generación | Biblioteca mantenida y validación de seguridad/runtime; no contraseña, JWT o refresh reutilizados. |
| Solicitud de reemisión | 3 solicitudes nuevas admitidas por cuenta/hora y 10 por IP/hora | Límites iniciales contra abuso, compartidos entre instancias y sujetos a NAT/carga. No máximo de enlaces de por vida o espera obligatoria hasta vencer. |
| Consumo | Mantener propuesta base de 5 intentos por solicitud cada 15 minutos | No emitir otro enlace al fallar consumo ni filtrar datos de otra cuenta. |
| Operación local | Presupuesto inicial de 10 segundos; hasta dos reintentos locales transitorios con nueva validación | No retry por cuenta verificada/inactiva, permisos, conflicto de payload o límite de abuso. Sin HTTP dentro de la transacción. |

El replay autenticado de una misma solicitud confirmada no consume otra admisión/cuota o invalida una generación más reciente. Los límites se evalúan antes de sustituir: una petición rechazada por ellos conserva la solicitud anterior aún válida. No introducir una espera comercial nueva para justificar las cuotas técnicas.

## 3. Modelo e identidad de operación

Mantener monolito/capas/CQRS y PostgreSQL documentados, puertos de Application y adaptadores de Identity/correo. No HTTP interno, nuevo servicio, broker o disco local durable.

Proponer por cuenta una referencia/generación actual del propósito **verificación del correo vigente**, distinta de cambio de correo, reset, perfil y versión global de sesiones. Solicitud: ID, cuenta, correo/contexto autorizado, generación, creación/vencimiento, verificador y estado de uso/sustitución. La emisión inicial de registro participa de esa misma familia lógica; no hace falta editar el documento base para exigir compatibilidad en implementación futura.

La operación idempotente liga actor/cuenta/acción/clave opaca con huella de campos admitidos y resultado mínimo. El cliente no manda propietario, destino, rol, expiración o generación como autoridad. Misma clave/payload devuelve resultado de esa operación, sin mostrar prueba; misma clave con otro contenido produce conflicto. Una operación anterior confirmada no se convierte otra vez en la generación actual al reproducirse después de una nueva petición.

Separar verificador, carga cifrada temporal de transporte y evidencia de auditoría/entrega. El digest no reconstruye el secreto; el worker tampoco emite otro para poder enviarlo. Enlace/cuerpo recuperable solo en almacenamiento protegido con acceso mínimo, claves durables/versionadas y contexto de envolvente verificado. Jobs llevan referencias no secretas; no material de prueba en logs/APM/admin/CSV/PDF.

## 4. Admitir, sustituir y entregar

1. Autenticar titular activo con familia/versión vigentes; admitir login sin verificar conforme a 005. Determinar correo vigente en servidor, comprobar que aún no esté verificado y validar comando/clave/límites.
2. Abrir unidad local y proteger la cuenta desde el principio con exclusión suficiente —propuesta `FOR UPDATE`—, antes de solicitud/familia/datos relacionados según orden común. Así no se intenta subir un lock compartido a exclusivo después de admitir cambios. Validar la adhesión de todos los escritores con PostgreSQL real.
3. Revalidar permisos/correo/estado/replay bajo protección. La cuenta estable actúa como raíz aunque no haya solicitudes previas; una búsqueda vacía de solicitudes no sustituye la barrera.
4. Crear nueva solicitud/generación y su prueba limitada; invalidar enlaces anteriores del **mismo propósito/cuenta/correo**, incluidos el de registro. Incorporar verificador, carga protegida e intención de correo con destinatario del servidor, admisión/cuota durable, resultado de operación y auditoría saneada en el mismo commit.
5. Si falla cualquier parte local, rollback: no solicitud nueva aplicada o invalidez parcial de anterior. Si la respuesta/commit es desconocido, verificar por la misma operación antes de originar otra o despachar; no recuperar el secreto por una respuesta pública.
6. Después del commit, 004 prepara/despacha la misma entrega: revalida solicitud/generación/destino/vigencia antes de admitir cada envío/retry. Payload, clave, plantilla y enlace estables; no alargar expiración o restaurar enlace anterior si falla.

La generación nueva no incrementa por sí sola la versión global de seguridad, revoca sesiones, marca verificado o invalida propósitos de 008/reset. Si verificación ya ganó, una nueva reemisión se rechaza; si ganó la nueva solicitud, el enlace antiguo no verifica. Cambio efectivo de correo/baja invalida lo que corresponde por 008; una edición básica de nombre/teléfono no cancela accidentalmente una solicitud.

Solo peticiones válidas **admitidas** sustituyen, no entradas inválidas, retries de la misma operación o eventos SMTP. La sustitución no depende de que el correo llegue; si no llegó, el titular puede crear otra intención nueva bajo controles, no recuperar como válidos los anteriores.

## 5. Consumo y enlace sustituido

El consumidor de verificación —incluido el del enlace inicial— comprueba prueba, propósito, cuenta activa, correo/contexto actuales, generación vigente, no uso y vencimiento real bajo la protección común. Proponer comando explícito de consumo; GET/HEAD de navegación/escáner no aplica cambios. No exigir la misma pestaña o una sesión antigua como sustituto de comprobar la prueba ligada a su cuenta.

Consumo válido: verificar el correo y marcar uso/auditar conjuntamente; no emitir nuevas credenciales por ese acto ni duplicar sus efectos al repetirlo. Verificación actual de 005 permite después reservar/pagar mediante sus guardias existentes, no desde un botón de reemisión o evento del proveedor.

Propuesta de mensaje para sustituido/inválido: «Este enlace ya no es válido. Usa el correo de verificación más reciente o solicita otro desde tu cuenta». Puede presentarse sin revelar correo/cuenta o distinguir públicamente si existe una solicitud. El plan de interfaz puede distinguir expirado/ya verificado cuando el contexto autorizado lo permita, sin prometer que un enlace sustituido verifique.

## 6. Entrega desconocida, carreras y recuperación

La solicitud de 005-C y la generación de entrega de 004 son identidades diferentes. Retry automático conserva la entrega original y solo opera si la prueba sigue vigente; reenvío manual único conserva reglas de 004 y nunca crea prueba nueva o otro retry automático de esa generación manual.

Las 24 horas externas de Resend no dan idempotencia perpetua ni renuevan prueba. Aceptación desconocida se consulta/reconcilia conforme a contrato verificado; no cambiar de clave/cuerpo/destino para eludirla. Una solicitud sustituida puede conservar entrega desconocida: dejar de autorizar más envíos no demuestra que el proveedor no aceptó uno anterior.

Si sustitución/baja ganó antes de la admisión protegida del despacho, no enviar ese enlace como vigente. Si había petición externa en vuelo/aceptada antes de invalidación, no prometer retirar el correo por rollback local. La prueba queda inutilizable al consumirla, aunque llegue después. La ventana entre admisión y envío, lease/retry y recuperación requiere RV-03, no locks de negocio durante HTTP o autorización de despacho reutilizable indefinidamente.

Limpiar carga secreta temporal cuando deje de ser necesaria/admisible para transporte/recuperación según política validada, conservando referencias/resultados y evidencia necesaria de sustitución/uso. No borrar auditoría, usar claves perdidas como motivo para emitir otra prueba o prometer borrado de respaldos al limpiar una fila. Probar rotación/reinicio/réplicas y fallo simultáneo de correo/auditoría; una tabla en la misma base caída no acredita recuperación por sí sola.

## 7. API/UI y observabilidad propuestas

Añadir operación autenticada propia de solicitar otro enlace y ampliar el consumidor de verificación existente con la comprobación de generación. No operación anónima por correo libre, reemisión administrativa o endpoint de cambiar estado/verificación arbitraria. Versionado/OpenAPI/ProblemDetails siguen el contrato de plataforma; no se crean rutas en código con esta actividad.

Desde cuenta activa no verificada: acción «Solicitar otro enlace» accesible antes/después de vencer. Tras admisión: «Solicitud registrada. Revisa tu correo: solo funciona el enlace más reciente», no «Correo entregado» sin evidencia. Cuenta ya verificada no muestra una acción que vuelva a desverificar; cuenta inaccesible no obtiene identidad por replay. Respuesta nunca incluye prueba/enlace secreto; UI maneja envío/fallo/límite y estado real sin desbloquear reservar/pagar antes de verificar.

Telemetría propuesta: admisiones/replays/rechazos por razón saneada, solicitudes sustituidas/consumidas, fallos/tiempos de entrega y recuperación. Nada de direcciones, pruebas, cuerpos, URLs secretas o claves en métricas/logs. La auditoría registra origen/actor/cuenta/propósito/operación/fecha/resultado con lista positiva, no una serialización de solicitud HTTP.

## 8. Pruebas y puertas

[Tareas de la ampliación](tasks-reemision-verificacion.md): **T005V-01–T005V-16**, todas pendientes, trazadas a 005-C/RF-1–RF-18. No duplican ni cierran tareas base.

| Puerta | Evidencia requerida antes de habilitar |
|---|---|
| RV-01 — Contratos/compatibilidad | Emisor inicial y todos los consumidores/reemisores validan misma generación/contexto; 004/005/008/010 integrados sin renumerar bases o aplicar «solo último» a otros propósitos. |
| RV-02 — Consistencia | PostgreSQL real: dos solicitudes/consumos, verificación vs reemisión, cambios de correo/baja, rollback de auditoría/intención y replay tras respuesta perdida sin resucitar generaciones viejas. |
| RV-03 — Transporte/secretos/recuperación | Carga protegida/contexto/claves/runtime y payload estable, revalidación al despachar, SMTP fuera de transacción, ventanas/leases/desconocidos/24 horas y mensajes tardíos con prueba ya inválida. |
| RV-04 — Calidad/abuso/interfaz | TTL/bordes, límites compartidos/NAT/carga, errores/mensajes/CSRF y ausencia de secretos; bloqueo de reserva/pago conservado hasta verificación válida. Sin SLA o cuota comercial inventados. |
| RV-05 — Autorización | Código, instalación, migraciones, cuentas/claves, pruebas de proveedor/correos reales y configuración requieren actividad posterior explícita. Esta planificación no las autoriza. |

No se consultaron fuentes externas nuevas: referencias públicas conservan fecha/alcance de planes y contratos anteriores. Tampoco se da por elegida/verificada una versión/runtime, cuenta/SDK Resend o custodia efectiva de claves. La aprobación de la spec y la redacción de este plan no cierran RV/I/M/P/A por sí solas.
