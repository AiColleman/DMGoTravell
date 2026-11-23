# Spec 008 - Perfil y baja lógica de cuenta

> **Estado:** aprobada v0.1; **APROBADA** el 2026-11-02 mediante DEC-186, con 37 criterios.  
> **Versión:** 0.1, 2026-11-02; 37 criterios.  
> **Requisitos de origen:** RF12; HU-12 y HU-13 (P3); RN-25, RN-28, RN-29 y RN-30. Se conservan sus identificadores.  
> **Fuentes:** F01 §1/§2; F02 §4/§10; F03 RF12 y reglas de seguridad/historial; F04 AC04/AC05/AC07/AC09/AC10/AC11; F05 RS03/RS05/RP03/RP04; [inventario](../../fuentes.md); DEC-180–DEC-185.  
> **Dependencias:** 001, 002, 003, base/complemento 004, 005, 009 y 010 aprobadas. Esta aprobación no modifica sus documentos ni habilita implementación.

## Resumen para revisión

- El cliente consulta y actualiza únicamente su nombre y teléfono, y puede solicitar cambiar el correo.
- El correo actual sigue vigente hasta verificar el nuevo; solo la última solicitud válida de cambio permanece utilizable.
- Al aplicar el nuevo correo verificado, se cierran todas las sesiones y se avisa al correo anterior y al nuevo sin credenciales ni enlaces de acceso en esos avisos.
- La cuenta Google previamente vinculada conserva su relación con la misma cuenta local; no se duplica por cambiar el correo.
- La baja se rechaza mientras existan reservas `pending` o `confirmed`, pagos pendientes de resolución o devoluciones abiertas.
- La baja válida es lógica, conserva reservas/pagos/auditoría e invalida el acceso de todas las sesiones y enlaces pendientes de la cuenta.
- El cliente dado de baja aparece en consulta/CSV de clientes conforme a 010: solo ID, estado y cantidad de reservas.

Las seis respuestas de entrevista fijaron el alcance; la aprobación explícita posterior del documento completo se registra en DEC-186. La continuación documental posterior no autoriza implementación.

## Contexto y objetivo

RF12/HU-12 permite actualizar datos personales autorizados y HU-13 exige eliminación lógica con conservación de historial y revocación de acceso, sin aplicar ese flujo a cuentas administrativas. F03 y ACL-11 dejaban pendientes los campos y el efecto de la baja sobre operaciones activas. La entrevista concreta nombre/teléfono/cambio de correo y rechaza la baja hasta resolver esas operaciones, sin convertirla en cancelación de reservas o ejecución automática de devoluciones.

El objetivo es que el cliente gestione sus propios datos y cierre su cuenta sin perder trazabilidad, alterar condiciones ya contratadas, evadir pagos/devoluciones pendientes o permitir que un enlace antiguo cambie una identidad después de la baja.

## Usuarios / actores

- **Cliente titular autenticado y activo:** consulta/actualiza su perfil, solicita y confirma cambios de correo, solicita la baja.
- **Destinatario del nuevo correo:** confirma su control del correo solicitado mediante la prueba limitada a esa solicitud.
- **005 Identidad:** determina la identidad titular, correo único, verificación, sesiones y acceso Google ya vinculado.
- **001/002/003/009:** conservan la autoridad sobre reservas, pagos, devoluciones y sus estados; informan los bloqueos de baja vigentes.
- **004 Notificaciones:** entrega verificación del nuevo correo y avisos de cambio completado conforme al contrato funcional de esta spec.
- **010 Auditoría y clientes:** registra operaciones críticas y aplica la protección de baja en sus consultas/exportaciones.
- **Administrador:** no modifica perfiles ni da de baja cuentas mediante 008; el flujo no elimina cuentas administrativas.

## Historias de usuario

Fuente: F02 §4. Se conservan IDs y prioridades; las precisiones de correo/baja proceden de DEC-180–DEC-185, no de una HU nueva inventada.

- **HU-12 (P3):** Como cliente, quiero actualizar mis datos básicos.
  - El usuario solo modifica campos permitidos.
  - Se validan los datos.
  - La operación afecta únicamente su cuenta.
- **HU-13 (P3):** Como cliente, quiero solicitar la eliminación de mi cuenta.
  - Se aplica borrado lógico.
  - Se mantienen reservas, pagos y auditoría histórica.
  - Se invalidan los mecanismos de autenticación reutilizables.
  - Una cuenta administrativa no se elimina mediante este flujo.

## Requisitos funcionales (criterios de aceptación en EARS)

### Consulta y datos básicos

- **RF-1:** CUANDO un cliente titular autenticado y activo consulta su perfil, EL SISTEMA mostrará sus datos autorizados de nombre, teléfono disponible, correo vigente, verificación y solicitud de cambio de correo pendiente cuando exista. (RF12; HU-12; RN-25; 005/010)
- **RF-2:** SI un cliente intenta consultar o modificar el perfil de otra cuenta, ENTONCES EL SISTEMA rechazará la operación sin revelar datos de esa cuenta. (RN-25; AC05)
- **RF-3:** EL SISTEMA limitará las modificaciones de 008 a nombre, teléfono y solicitud de cambio de correo. (RF12; DEC-180)
- **RF-4:** SI el nombre solicitado queda vacío al retirar espacios exteriores, ENTONCES EL SISTEMA rechazará la actualización. (HU-12; validación de datos autorizados)
- **RF-5:** EL SISTEMA permitirá mantener o dejar vacío el teléfono por ser un dato opcional. (HU-12; teléfono disponible de 010/RF-5)
- **RF-6:** SI una actualización contiene datos inválidos o campos no autorizados, ENTONCES EL SISTEMA rechazará esa actualización sin aplicar modificaciones parciales. (HU-12; RN-25; AC04/AC07)
- **RF-7:** CUANDO se acepta una actualización válida de nombre o teléfono, EL SISTEMA aplicará esos cambios sin sustituir por ello el correo vigente. (DEC-180/DEC-181)
- **RF-8:** EL SISTEMA conservará los datos históricos contratados y las relaciones de reservas, pagos y auditoría ante cambios de perfil, correo o baja lógica. (RN-29/RN-30; HU-13; 001)
- **RF-9:** CUANDO se modifica únicamente nombre o teléfono, EL SISTEMA conservará las sesiones de acceso existentes. (Alcance de HU-12; cierre por cambio de correo en DEC-183)

### Solicitud y confirmación de cambio de correo

- **RF-10:** CUANDO se solicita un correo distinto del vigente, EL SISTEMA validará su formato y unicidad conforme a las reglas de identidad. (DEC-180; 005/RF-5)
- **RF-11:** CUANDO se admite una solicitud de cambio de correo, EL SISTEMA enviará al nuevo destinatario una prueba de verificación de uso único y vigencia limitada para esa solicitud. (DEC-180/DEC-181; 005/004-C)
- **RF-12:** MIENTRAS no se confirme la solicitud vigente de cambio de correo, EL SISTEMA conservará el correo actual y las funciones permitidas por su verificación actual. (DEC-181)
- **RF-13:** CUANDO se admite una nueva solicitud válida de cambio de correo, EL SISTEMA invalidará la solicitud anterior de cambio de esa cuenta. (DEC-185)
- **RF-14:** SI se presenta una confirmación vencida, usada, sustituida, inválida o de una cuenta no activa, ENTONCES EL SISTEMA rechazará el cambio de correo sin modificar el vigente. (DEC-181/DEC-185; 005; RN-25)
- **RF-15:** CUANDO se confirma una solicitud vigente, EL SISTEMA volverá a comprobar que el correo solicitado no pertenece a otra cuenta. (005/RF-5; HU-12; AC07)
- **RF-16:** CUANDO se admite la confirmación válida y única, EL SISTEMA establecerá el correo solicitado como correo vigente verificado de la misma cuenta. (DEC-181; RN-25)
- **RF-17:** CUANDO se aplica un cambio de correo, EL SISTEMA cerrará todas las sesiones de esa cuenta, incluida la actual. (DEC-183)
- **RF-18:** CUANDO se aplica un cambio de correo, EL SISTEMA dejará de aceptar el correo anterior como credencial o alias de acceso a esa cuenta. (DEC-181/DEC-183; 005)
- **RF-19:** CUANDO se aplica un cambio de correo, EL SISTEMA invalidará los enlaces pendientes de cambio, verificación o recuperación asociados al correo anterior de esa cuenta. (005; RN-25; protección de la identidad cambiada)
- **RF-20:** EL SISTEMA conservará las vinculaciones Google previamente autorizadas con la misma cuenta local al cambiar su correo. (005/RF-17–RF-21; DEC-183)
- **RF-21:** CUANDO se completa el cambio de correo, EL SISTEMA enviará un aviso de seguridad tanto al correo anterior como al nuevo sin contraseñas, tokens ni enlaces de acceso en esos avisos. (DEC-184)
- **RF-22:** SI falla la entrega de la verificación o de un aviso de cambio de correo, ENTONCES EL SISTEMA no revertirá una operación local ya aplicada por ese fallo de envío. (004/RF-18; ADR-008; AC02)

### Baja lógica y protección de historial

- **RF-23:** CUANDO el cliente titular activo solicita una baja válida de una cuenta no administrativa, EL SISTEMA permitirá tramitar la baja de esa cuenta. (HU-13; RN-25; DEC-182)
- **RF-24:** MIENTRAS exista una reserva `pending` o `confirmed`, un pago sin resolución o una devolución abierta de la cuenta, EL SISTEMA rechazará la baja. (DEC-182)
- **RF-25:** CUANDO se rechaza la baja por una operación activa, EL SISTEMA informará al titular de la referencia y situación propia que impiden completarla. (DEC-182; RN-25)
- **RF-26:** EL SISTEMA evitará cancelar reservas, liberar recursos o ejecutar devoluciones como efecto automático de una solicitud de baja. (DEC-182; límites de 001/002/003/009)
- **RF-27:** CUANDO se confirma una baja válida sin bloqueos vigentes, EL SISTEMA marcará la cuenta con baja lógica. (HU-13; RN-30)
- **RF-28:** CUANDO se aplica la baja lógica, EL SISTEMA invalidará el acceso y los mecanismos reutilizables de todas las sesiones de la cuenta. (HU-13; 005/RF-29)
- **RF-29:** CUANDO se aplica la baja lógica, EL SISTEMA invalidará sus solicitudes pendientes de cambio de correo, verificación y recuperación. (005; RN-25; protección de baja lógica)
- **RF-30:** MIENTRAS la cuenta tenga baja lógica, EL SISTEMA limitará su información en consulta y CSV de clientes de 010 al identificador, estado de baja y cantidad de reservas. (010/RF-44/RF-54/RF-56)
- **RF-31:** EL SISTEMA conservará el correo vigente de una cuenta dada de baja sujeto a la unicidad de identidad, sin liberarlo por el mero borrado lógico. (RN-30; 005/RF-5)
- **RF-32:** MIENTRAS la cuenta tenga baja lógica, EL SISTEMA impedirá recuperarla o reactivarla mediante login, Google, un enlace anterior o un nuevo registro con su mismo correo asociado. (005/RF-5/RF-29; HU-13)
- **RF-33:** SI se conoce un cobro o devolución después de la baja, ENTONCES EL SISTEMA conservará la baja y tratará el hecho financiero por las reglas de 002. (RN-30; 002; sin reactivación por efectos externos)

### Confirmación, auditoría y repetición

- **RF-34:** EL SISTEMA auditará actualizaciones aplicadas de perfil, solicitudes/confirmaciones de cambio de correo y bajas con actor, cuenta, fecha, cambios permitidos y resultado, sin contraseñas, enlaces ni tokens. (RF23; RN-28/RN-29; 005/RF-30; 010)
- **RF-35:** SI no puede registrarse la auditoría de una operación aún controlable, ENTONCES EL SISTEMA no aplicará esa operación sobre la cuenta. (010/RF-36/RF-37)
- **RF-36:** CUANDO se repite una operación ya aplicada, EL SISTEMA impedirá duplicar sus efectos y avisos. (AC07; 004/005/010; HU-13)
- **RF-37:** CUANDO se solicita baja o cambio de correo, EL SISTEMA exigirá confirmación expresa del titular de la acción solicitada. (HU-12/HU-13; RN-25; AC04)

### Precisiones para evitar ambigüedades

- Nombre y teléfono válidos se aplican en la actualización aceptada; confirmar el correo es una operación posterior. Un fallo de esa confirmación no deshace cambios básicos ya aceptados válidamente.
- Datos omitidos conservan su valor; el teléfono vacío elimina únicamente ese dato opcional. Correo con solo diferencias de normalización respecto del vigente no origina otro cambio, cierre de sesiones o aviso; no sustituye una solicitud pendiente distinta porque no constituye una nueva solicitud de cambio.
- Solo una solicitud **válida y admitida** sustituye a la anterior. Una dirección inválida/ocupada no invalida una solicitud válida existente. Repetir una misma operación por fallo de respuesta no equivale a una nueva intención del cliente.
- La unicidad se comprueba también al confirmar: otro registro/cambio concurrente puede haber ocupado el correo. En tal caso no se sustituye la identidad ni se vincula otra cuenta.
- Confirmación de correo, establecimiento del nuevo correo verificado, cierre de sesiones e invalidación de enlaces antiguos se aplican sin estados parciales. El titular deberá volver a entrar; su Google ya vinculado puede seguir identificando la misma cuenta.
- El correo anterior sustituido deja de ser acceso a la cuenta de origen; cualquier registro posterior sigue la unicidad de 005 y nunca reasigna el historial o Google por coincidir con ese correo histórico. El correo vigente de una cuenta con baja lógica no queda libre: la cuenta sigue existiendo.
- Los bloqueos de baja se evalúan sobre el estado vigente al decidir, no solo sobre una vista anterior. Una `pending` vencida pero no cancelada todavía sigue bloqueando; una `confirmed` cuyo servicio terminó sigue bloqueando hasta su finalización válida por 009. Una cancelada/completada no bloquea por ese estado, pero un pago sin resolución o devolución abierta sí.
- La resolución de pago/devolución se determina por sus casos y evidencia de 002; 008 no exige demostrar un abono bancario fuera de ese contrato ni cierra un caso financiero para permitir una baja.
- Una solicitud de correo pendiente no es una operación financiera bloqueante: si la baja resulta válida, esa solicitud queda invalidada. No se conserva un enlace para reactivar después la cuenta.
- Las acciones concurrentes de crear una reserva/iniciar pago, aplicar un cambio de correo o dar de baja no pueden evadir el estado activo, los bloqueos ni las invalidaciones vigentes. Si la operación ya no es válida al aplicarla, se rechaza sin efectos parciales.
- Baja y cierre de sesiones no borran historial ni suponen que el banco no pueda emitir un evento tardío. Los hechos financieros nuevos se gestionan por 002, con seguimiento administrativo autorizado, sin reactivar el acceso del cliente.
- La confirmación de una solicitud de correo utiliza la prueba vinculada a esa solicitud y cuenta; no permite indicar otra cuenta o correo arbitrario como destino del cambio. La consulta y modificación del perfil requieren la identidad titular activa.
- RF-36 exige no duplicar efectos, no devolver resultados a quien perdió autorización: tras la baja, un acceso con credenciales invalidadas puede ser rechazado sin aplicar otra baja ni avisos.

## Requisitos no funcionales

- **Propiedad/autorización:** solo el titular activo gestiona su perfil; no se amplían facultades de un cliente o del administrador de consultas. (RN-25; RS03/RS05)
- **Confidencialidad:** respuestas, auditoría y avisos de finalización no incluyen contraseñas/tokens/enlaces de acceso. La prueba de verificación solo se entrega al nuevo destinatario previsto; no a administradores ni en una respuesta pública. (AC04/AC05; 005/004-C)
- **Historial:** conservar snapshots y relaciones históricos; actualizar el perfil no reescribe una reserva pasada ni editar/borrar auditoría. (RN-29/RN-30; RP03/RP04)
- **Consistencia:** cambio de correo y baja aplican conjuntamente sus efectos locales; las carreras con reserva/pago o confirmación repetida requieren pruebas reales antes de ejecución. (AC07/AC11)
- **Notificaciones:** fallos/reintentos/rebotes conservan la política de 004 y nunca convierten una entrega pendiente en prueba de verificación completada. (ADR-008; AC02/AC09)
- **Presentación:** distinguir correo vigente, correo solicitado pendiente, solicitud sustituida/expirada, baja bloqueada y baja aplicada, sin inventar estados de reserva. (AC10)
- **Medición:** no se fija un SLA o una vigencia comercial no decididos; parámetros verificables y condiciones de carga se definen en el plan posterior.

## Casos límite

| Caso | Resultado esperado | Criterios |
|---|---|---|
| Perfil de otra cuenta | Rechazo sin datos ajenos | RF-1/RF-2 |
| Nombre vacío o datos no válidos | Sin modificación parcial | RF-4/RF-6 |
| Teléfono omitido/vacío | Mantenerlo si se omite; dejarlo vacío si se solicita | RF-5/RF-7 |
| Intento de modificar rol, estado, reservas o contraseña desde perfil | Rechazo; contraseña/Google siguen en 005 | RF-3/RF-6 |
| Correo pendiente no confirmado | Sigue vigente el anterior y su verificación actual | RF-12 |
| Nueva solicitud válida | Solo su prueba queda vigente | RF-13 |
| Solicitud nueva inválida/ocupada | No cambia la cuenta ni invalida una solicitud válida existente | RF-6/RF-10/RF-13 |
| Correo ocupado después de solicitarlo | Rechazar al confirmar, sin duplicar cuenta | RF-15 |
| Confirmación vieja/expirada/usada o posterior a baja | No modifica la identidad | RF-14/RF-29/RF-32 |
| Cambio aplicado | Nuevo correo verificado, todas las sesiones cerradas y avisos a ambos destinatarios | RF-16–RF-21 |
| Correo no entregado o rebotado | Registrar/tratar según 004 sin revertir cambio aplicado | RF-22 |
| Google previamente vinculado | Conserva relación con la misma cuenta, sin fusión por correo | RF-20 |
| Reserva `pending`/`confirmed` o pago/devolución pendientes | Baja rechazada y causa propia informada | RF-24/RF-25 |
| Solo reservas completadas/canceladas y sin casos abiertos | Puede confirmar baja lógica | RF-23/RF-27 |
| Cuenta administrativa | No se elimina por este flujo | RF-23 |
| Baja aplicada | Acceso y solicitudes pendientes invalidados, historial conservado | RF-8/RF-27–RF-32 |
| Exportación de clientes preparada antes de baja | 010 aplica su protección vigente antes de entregar | RF-30 |
| Cobro conocido después de la baja | Tratamiento por 002, sin reactivar cuenta | RF-33 |
| Fallo de auditoría o repetición concurrente | No aplicación parcial ni efectos/avisos duplicados | RF-34–RF-36 |

## Fuera de alcance

- Contraseñas, acceso Google, emisión de credenciales y recuperación de identidad: sus reglas son de 005, no campos editables de perfil.
- Reactivación de cuentas dadas de baja, borrado físico o liberación del correo de una cuenta eliminada lógicamente.
- Baja, edición o alta de administradores desde este flujo; modificación de cuentas ajenas por administración.
- Cancelar reservas, liberar inventario, confirmar pagos o ejecutar devoluciones como parte de la baja.
- Reescribir datos históricos contratados o borrar auditoría.
- Fotos de perfil, documentos, direcciones, facturación, marketing o campos personales adicionales no seleccionados.
- Aviso adicional de baja por correo o una fase de aprobación administrativa no solicitados.
- Definir mecanismos técnicos, valores de vigencia, formato de prueba, plantillas exactas, rutas o parámetros de infraestructura antes del plan.
- Cambiar archivos aprobados o planes/tareas previos; escribir código, ejecutar operaciones, commits o push.

## Criterios de finalización

### Documento

- Conservar RF12/HU-12/HU-13 y RF-1–RF-37 locales con fuente identificada.
- Registrar DEC-180–DEC-185 sin tratar respuestas parciales como aprobación de la spec completa.
- Contrastar con análisis de sistema y contratos aprobados, manteniendo la distinción entre cambio de identidad, operación financiera e historial.
- Pedir aprobación explícita antes de plan/tareas.

### Implementación futura

- Verificar edición/consulta propia, validación, campos omitidos/opcionales e invariancia histórica.
- Verificar correo diferido, unicidad al solicitar/confirmar y solo última solicitud válida.
- Verificar cierre global de sesiones, enlaces antiguos invalidados y Google previo conservado.
- Verificar dos avisos de seguridad mínimos y fallos de envío sin reversión.
- Verificar bloqueo de baja por cada operación activa y ausencia de cancelaciones/reembolsos automáticos.
- Verificar baja lógica, revocación, privacidad de 010 y eventos financieros posteriores sin reactivación.
- Verificar concurrencia, auditoría y no duplicación sin acceder a datos ajenos o secretos.

## Contraste con docs/01-analisis-de-sistema/

| Fuente | Cobertura y distinción |
|---|---|
| F01 §1/§2 | Gestión propia de datos y baja de cliente, sin ampliar gestión de cuentas administrativas. |
| F02 §4, HU-12/HU-13 | Campos permitidos/validación/titularidad y baja lógica conservando historial e invalidando acceso. Ambas siguen siendo P3. |
| F03 RF12; RN-25/RN-28–RN-30 | Actualización autorizada, auditoría, inmutabilidad y conservación histórica, sin borrado físico. |
| F04 AC04/AC05/AC07/AC09/AC11 | Propiedad, secretos excluidos, efectos coherentes, trazabilidad y evidencia futura de pruebas. |
| F05/F06/F07 | Se respetan restricciones, historial y ADR; no se selecciona una arquitectura nueva ni se cambia la autenticación aprobada. |
| Entrevista DEC-180–DEC-185 | Cambio de correo, momento de efecto, sesiones, avisos y bloqueos de baja son precisiones del usuario, no campos o reglas previamente detallados en HU-12/HU-13. |

No se detecta contradicción con los requisitos originales en este alcance. DEC-186 aprueba los flujos nuevos de 008; su detalle no se atribuye retrospectivamente a las aprobaciones de 004/005 ni modifica sus archivos existentes.

## Dudas abiertas

- **RESUELTO POR ENTREVISTA:** nombre/teléfono/correo autorizados, efecto del cambio solo tras verificar, baja bloqueada por operaciones activas, cierre de todas las sesiones, avisos a ambos correos y vigencia exclusiva de la última solicitud válida.
- **CONTRATO NUEVO DE 008:** verificación al correo solicitado aún no vigente y aviso mínimo al anterior después del cambio. Su propósito y destinatarios quedan definidos aquí; antes de implementar se debe validar el consumo por 004/005 sin que la revalidación de destinatarios suprima esos avisos legítimos ni autorice envíos arbitrarios. No se edita su planificación existente para aparentar compatibilidad.
- **PENDIENTE DEL PLAN:** vigencia/seguridad de la prueba de cambio de correo, controles de confirmación/identidad, validaciones concretas de texto/teléfono, reintentos/plantillas y pruebas de carreras con reserva/pago/baja. No se inventan esos mecanismos en la spec.
- **LÍMITE DE IDENTIDAD:** correo vigente de baja conserva unicidad; correo anterior sustituido ya no es acceso/alias. No hay flujo de reactivación ni reasignación de historial por coincidencia de correo.
- **APROBACIÓN REGISTRADA:** documento completo v0.1 mediante DEC-186; no se aprueban ampliaciones de otros archivos por referencia ni se cierran sus puertas técnicas de integración.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1, con 37 criterios.
- **Aprobación explícita del documento completo:** sí; respuesta «si» a «¿Apruebas 008 v0.1?».
- **Fecha de aprobación:** 2026-11-02; DEC-186.
- **Decisiones de entrevista:** DEC-180–DEC-185, registradas el 2026-11-02; no equivalen a aprobar esta spec completa.
- **Preservación:** todas las specs y planes/tasks previos intactos, incluido el cierre de la cadena de Pagos.
- **Plan/tareas al registrar la aprobación:** no creados; la continuación posterior se registra por separado. Sin implementación, cuentas modificadas, correos reales, commits ni push.
