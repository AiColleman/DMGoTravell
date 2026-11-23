# Spec 010 - Consulta de clientes y auditoría de operaciones

> **Estado:** aprobada v0.3; **APROBADA** el 2026-11-01 mediante DEC-169, con sus 59 criterios y puertas de integración documentadas.  
> **Versión:** 0.3, 2026-11-01.  
> **Requisitos de origen:** RF15 y RF23; HU-18 (P3), auditoría de HU-14, HU-15 y HU-20; RN-26, RN-28, RN-29 y RN-30. Se conservan sus identificadores.  
> **Fuentes:** F01 §2; F02 §§5/7/8/9/10; F03 §§1/2/3; F04 AC04/AC05/AC09; F05 RS02/RS03/RS07/RP08; F06 DA08; [inventario](../../fuentes.md); DEC-015, DEC-078 y DEC-155–DEC-168.  
> **Dependencias:** 001, 003, 004, 005, 006, 007 y 013 aprobadas; 002 y 009 en borrador; 008 y 011 pendientes de especificación. Este documento no aprueba otras specs ni habilita implementación.

## Resumen para revisión

- Consulta de clientes y auditoría exclusiva para administradores.
- Clientes: perfil básico, verificación, estado, fecha de registro y cantidad de reservas; sin edición, desactivación ni reactivación desde 010.
- Auditoría: operaciones críticas de 001–009, incluidas las realizadas por clientes, administradores y procesos automáticos; se conservan las obligaciones ya aprobadas de 013.
- Auditoría inmutable desde la aplicación y conservación indefinida.
- Consultas paginadas con filtros propios de clientes y auditoría.
- Exportación CSV de los resultados filtrados de ambas consultas, con los mismos permisos y exclusiones de datos sensibles.
- Si falla el guardado de auditoría, no se aplica una acción que aún pueda detenerse; se informa del error para intentarlo después.
- Si Culqi ya cobró, se conserva el resultado real sin repetir ni cancelar el cobro por ese fallo; se recupera la evidencia y se alerta si el fallo persiste.
- El CSV incluye todos los resultados tal como estaban al solicitarlo, aunque su preparación tarde más.
- Clientes con baja lógica: solo identificador, estado de baja y cantidad de reservas en consulta y CSV, sin nombre, correo ni teléfono.
- Filtros combinados: deben cumplirse todos; nombre/correo admite coincidencia parcial sin distinguir mayúsculas; rangos de días completos inclusivos en hora de Perú.
- Orden estable, páginas vacías sin error y cantidad de reservas calculada sin duplicados sobre todos los estados.
- La privacidad por baja lógica y los permisos vigentes se verifican antes de entregar el CSV, aunque se hubiese solicitado antes.

La primera entrevista definió alcance, conservación, filtros, datos visibles, solo lectura y CSV. v0.1 fue aprobada con pendientes mediante DEC-161. La segunda ronda cerró las dudas funcionales mediante DEC-162–DEC-167. La instrucción posterior «hay algun detalle que falta, hazlo de una vez» delega completar los bordes funcionales sin más preguntas (DEC-168), no aprobar la spec. v0.3 conserva RF-1–RF-47 y añade RF-48–RF-59. Las reglas de cierre de DEC-168 son criterios adoptados por delegación, no respuestas individuales del usuario.

## Contexto y objetivo

RF15/HU-18 exige que el administrador consulte clientes y auditoría para supervisar la plataforma. RF23/RN-28 exige registrar operaciones críticas con datos suficientes para reconstruirlas, y RN-29 impide modificar los registros desde la aplicación. 010 reúne ese contrato transversal sin sustituir las reglas de reservas, pagos, vencimiento, notificaciones, identidad o catálogo. La entrevista añade conservación indefinida y exportación CSV; no reemplaza el reporte PDF de 011/HU-19.

## Usuarios / actores

- **Administrador (`admin`):** consulta clientes, examina operaciones críticas y exporta resultados autorizados.
- **Cliente (`client`):** no accede a estas consultas administrativas ni a sus exportaciones.
- **Procesos automáticos:** originan registros identificables como acciones del sistema, no como acciones de un administrador ficticio.
- **Funcionalidades de origen:** producen la evidencia de sus operaciones críticas; 010 permite consultarla sin ejecutar de nuevo esas operaciones.

## Historias de usuario

Fuente principal: F02 §7. No se inventan nuevos identificadores oficiales de HU.

- **HU-18 (P3):** Como administrador, quiero consultar clientes y auditoría para supervisar la plataforma.
  - Requiere rol `admin`.
  - Los registros de auditoría son solo lectura.
  - Las consultas deben permitir trazabilidad de operaciones críticas.
- **HU-14/HU-15 (P2):** se conserva la auditoría de cambios críticos y la integridad histórica de ofertas retiradas; la operación del catálogo pertenece a 006.
- **HU-20 (P2):** se conserva la evidencia del vencimiento y la acción exacta `reservation.auto_cancelled`; la cancelación y liberación pertenecen a 003.

### Alcance de operaciones críticas

| Origen | Evidencia conservada | Fuente y límite |
|---|---|---|
| 001 Reservas | Creación, cancelación y vencimiento | 001/RF-69; DEC-015; no auditar una visita pública como cambio de reserva. |
| 002 Pagos | Validación/rechazo, pagos observados, devoluciones y sus resultados | 002/RF-16/RF-48–RF-51 y reglas de devolución; 002 sigue en borrador. |
| 003 Vencimiento | Cancelación automática, liberación, fallos, reintentos y alertas | 003/RF-13/RF-14; conservar `reservation.auto_cancelled`. |
| 004 Notificaciones | Generación, envío, fallo, reintento, reenvío y alerta | 004/RF-19; no registrar secretos ni el contenido completo del correo por defecto. |
| 005 Identidad | Registro, verificación, login exitoso, fallo relevante de autenticación y cambios críticos definidos | 005/RF-30; no almacenar contraseñas ni tokens. |
| 006 Catálogo | Cambios administrativos aplicados a tours, paquetes, salidas, precios y descuentos | DEC-078; 006/RF-19; un intento rechazado no es una modificación aplicada. |
| 007 Hoteles | Cambios administrativos críticos de hoteles, tipos, tarifas, inventario y propuestas | RN-28/RN-29 y validaciones de 007; no alterar sus reglas aprobadas. |
| 008 Perfil | Operaciones críticas de perfil y baja cuando se definan | 008 aún no tiene spec; se conservan HU-13/RN-30 y 005/RF-30, sin inventar acciones nuevas. |
| 009 Administración de reservas | Transición, motivo, devolución relacionada y resultado | 009/RF-22; 009 sigue en borrador. |
| 013 Movilidad | Alta, edición, activación y desactivación | 013/RF-26–RF-29; obligación previa que DEC-155 no elimina. |

No se añaden nombres de eventos para acciones nuevas. La denominación exacta y la integración se definen posteriormente sin cambiar el alcance funcional de cada spec.

## Requisitos funcionales (criterios de aceptación en EARS)

### Autorización y consulta de clientes

- **RF-1:** EL SISTEMA restringirá las consultas de clientes, las consultas de auditoría y las exportaciones de 010 a administradores autenticados. (RF15; HU-18; RN-26; 005)
- **RF-2:** SI un usuario con rol `client` intenta acceder a una operación de 010, ENTONCES EL SISTEMA denegará el acceso sin revelar resultados. (F02 §9; RS03; RN-26)
- **RF-3:** CUANDO un administrador consulta clientes, EL SISTEMA devolverá una lista paginada de clientes. (RF15; DEC-157/DEC-160)
- **RF-4:** EL SISTEMA permitirá filtrar clientes por nombre, correo, identificador, estado y fecha de registro. (DEC-157)
- **RF-5:** CUANDO un administrador consulta un cliente sin baja lógica, EL SISTEMA mostrará su nombre, correo, teléfono disponible, fecha de registro, verificación de correo y estado. (RF15; DEC-158; excepción de baja en DEC-165/RF-44)
- **RF-6:** CUANDO un administrador consulta el resumen de un cliente, EL SISTEMA mostrará la cantidad de reservas asociadas a ese cliente. (DEC-158)
- **RF-7:** EL SISTEMA mantendrá los datos de clientes estrictamente en modo de consulta dentro de 010. (DEC-159)
- **RF-8:** EL SISTEMA excluirá contraseñas, credenciales, tokens, secretos y datos sensibles de tarjeta de las respuestas de clientes. (DEC-158; RN-18; RS02/RS07)

### Registro y conservación de auditoría

- **RF-9:** CUANDO ocurre una operación crítica del alcance definido en esta spec, EL SISTEMA registrará la operación en auditoría. (RF23; DEC-015/DEC-078/DEC-155; tabla de alcance)
- **RF-10:** CUANDO una operación crítica es automática, EL SISTEMA identificará al actor como sistema o proceso automático. (RN-28; 003/RF-13; DEC-155)
- **RF-11:** EL SISTEMA incluirá actor, acción, entidad e identificador de entidad en cada registro de auditoría. (RN-28)
- **RF-12:** CUANDO una operación crítica modifica datos, EL SISTEMA conservará sus cambios relevantes en la auditoría. (RN-28; AC09)
- **RF-13:** EL SISTEMA conservará la fecha de cada registro de auditoría en UTC. (F04 AC09; RP08)
- **RF-14:** CUANDO existe una referencia de correlación para la operación, EL SISTEMA la conservará en la auditoría. (F04 AC09; DEC-157)
- **RF-15:** EL SISTEMA conservará el resultado de la operación auditada. (DEC-157; 002/003/004/009)
- **RF-16:** EL SISTEMA impedirá editar o eliminar registros de auditoría desde la aplicación. (F01 §2; RN-29; HU-18)
- **RF-17:** EL SISTEMA conservará los registros de auditoría indefinidamente. (DEC-156)
- **RF-18:** CUANDO una entidad relacionada recibe una baja lógica, EL SISTEMA conservará su referencia histórica en la auditoría. (RN-30; HU-13/HU-15)
- **RF-19:** CUANDO se registra una cancelación automática por vencimiento, EL SISTEMA conservará el nombre de acción `reservation.auto_cancelled`. (HU-20; 003/RF-13)
- **RF-20:** CUANDO se repite un evento cuya operación aplicada ya está auditada, EL SISTEMA no presentará una segunda aplicación de esa operación como un nuevo éxito. (RN-16/RN-22; 002/003/009)
- **RF-21:** SI una operación es rechazada, ENTONCES EL SISTEMA no la presentará en auditoría como un cambio aplicado. (DEC-078; 006/RF-19; RN-28)

### Consulta de auditoría

- **RF-22:** CUANDO un administrador consulta auditoría, EL SISTEMA devolverá registros paginados. (RF15; HU-18; DEC-160)
- **RF-23:** EL SISTEMA permitirá filtrar auditoría por fecha, actor, acción, entidad, identificador de entidad, correlación y resultado. (DEC-157)
- **RF-24:** CUANDO un administrador consulta un registro de auditoría, EL SISTEMA mostrará sus datos de trazabilidad y cambios relevantes autorizados. (RN-28; HU-18)
- **RF-25:** CUANDO existen referencias entre reserva, pago, evento o notificación, EL SISTEMA permitirá reconocer esas relaciones en la consulta de auditoría. (RN-17; F04 AC09; 002/RF-51; 004/RF-20)
- **RF-26:** EL SISTEMA excluirá contraseñas, credenciales, tokens, secretos y datos sensibles de tarjeta de los registros de auditoría. (RN-18; 002/RF-49; 005/RF-30; AC04)

### Exportación y resultados de consulta

- **RF-27:** CUANDO un administrador solicita exportar clientes, EL SISTEMA generará un CSV correspondiente al conjunto de resultados filtrados de clientes. (DEC-160)
- **RF-28:** CUANDO un administrador solicita exportar auditoría, EL SISTEMA generará un CSV correspondiente al conjunto de resultados filtrados de auditoría. (DEC-160)
- **RF-29:** EL SISTEMA limitará las columnas exportadas a datos que el administrador está autorizado a consultar en 010. (RN-26; DEC-158/DEC-160; AC05)
- **RF-30:** CUANDO un valor exportado contiene separadores, comillas o saltos de línea, EL SISTEMA lo representará sin alterar los límites de sus campos y filas. (Integridad del CSV de DEC-160)
- **RF-31:** CUANDO un valor textual exportado puede interpretarse como fórmula, EL SISTEMA lo representará como texto inerte en el CSV. (AC04; seguridad de la ampliación DEC-160)
- **RF-32:** SI falla la generación de un CSV, ENTONCES EL SISTEMA informará el fallo sin presentar un archivo incompleto como una exportación exitosa. (DEC-160; integridad de resultados)
- **RF-33:** SI una consulta no tiene coincidencias, ENTONCES EL SISTEMA mostrará un resultado vacío sin presentarlo como un fallo. (Consulta de RF15; sin copiar mensajes de otras specs)
- **RF-34:** SI los filtros o parámetros de paginación son inválidos, ENTONCES EL SISTEMA rechazará la consulta con un error de validación. (F02 §10; DEC-157)
- **RF-35:** EL SISTEMA conservará sin modificaciones los datos fuente durante las consultas y exportaciones de 010. (HU-18; RN-29; DEC-159/DEC-160)

### Cierre de dudas: fallos, CSV, privacidad y filtros

- **RF-36:** SI no puede guardarse la auditoría de una acción crítica que aún puede detenerse, ENTONCES EL SISTEMA no aplicará esa acción. (DEC-162)
- **RF-37:** SI se rechaza una acción por fallo al guardar auditoría, ENTONCES EL SISTEMA informará del error para permitir un intento posterior. (DEC-162)
- **RF-38:** SI Culqi ya realizó un cobro y falla el guardado de auditoría, ENTONCES EL SISTEMA conservará el resultado real del pago. (DEC-166; RN-17)
- **RF-39:** SI falla el guardado de auditoría de un cobro ya realizado, ENTONCES EL SISTEMA no repetirá ni cancelará el cobro por ese fallo. (DEC-166)
- **RF-40:** SI falla el guardado de auditoría de un cobro ya realizado, ENTONCES EL SISTEMA reintentará guardar la evidencia del resultado real. (DEC-166)
- **RF-41:** SI persiste el fallo al guardar la auditoría de un cobro ya realizado, ENTONCES EL SISTEMA alertará al administrador. (DEC-166)
- **RF-42:** CUANDO un administrador solicita una exportación CSV, EL SISTEMA fijará como referencia de su contenido los datos y filtros del instante de la solicitud. (DEC-163)
- **RF-43:** CUANDO los filtros devuelven muchos resultados, EL SISTEMA incluirá todos esos resultados en la exportación CSV sin recortarlos por volumen. (DEC-164)
- **RF-44:** MIENTRAS un cliente tenga baja lógica, EL SISTEMA limitará su información en consulta y CSV de clientes al identificador, estado de baja y cantidad de reservas. (DEC-165)
- **RF-45:** CUANDO se aplican varios filtros, EL SISTEMA devolverá únicamente resultados que cumplan todos los filtros elegidos. (DEC-167)
- **RF-46:** CUANDO se busca por nombre o correo, EL SISTEMA admitirá coincidencias parciales sin distinguir mayúsculas de minúsculas. (DEC-167)
- **RF-47:** CUANDO se filtra por un rango de fechas, EL SISTEMA incluirá completos el primer y último día indicados en hora de Perú. (DEC-167)

### Bordes funcionales completados por delegación

- **RF-48:** CUANDO se consulta una lista de 010, EL SISTEMA ordenará los clientes por fecha de registro descendente y la auditoría por fecha de operación descendente, con identificador único descendente como desempate en cada lista. (DEC-168; criterio de orden estable propio de 010)
- **RF-49:** SI una página válida no contiene resultados, ENTONCES EL SISTEMA devolverá esa página vacía sin sustituirla por otra. (DEC-168; precisión de RF-33)
- **RF-50:** CUANDO se filtra por identificadores de cliente, actor, entidad o correlación, o por acción, tipo de entidad, estado o resultado, EL SISTEMA exigirá coincidencia exacta con los valores seleccionados. (DEC-168; precisión de DEC-157)
- **RF-51:** SI un rango de fechas está invertido o contiene fechas inválidas, ENTONCES EL SISTEMA rechazará la consulta o exportación con un error de validación. (DEC-168; precisión de RF-34)
- **RF-52:** CUANDO un filtro textual está vacío después de retirar espacios exteriores, EL SISTEMA lo tratará como filtro no aplicado. (DEC-168)
- **RF-53:** CUANDO se calcula la cantidad de reservas de un cliente, EL SISTEMA contará una sola vez cada reserva asociada en cualquiera de los estados `pending`, `confirmed`, `completed` o `cancelled`. (DEC-168; precisión de DEC-158)
- **RF-54:** CUANDO se evalúan filtros de una nueva consulta o exportación de clientes, EL SISTEMA excluirá de coincidencias por nombre o correo ocultos a los clientes que ya tienen baja lógica. (DEC-168; privacidad de DEC-165)
- **RF-55:** SI una exportación CSV no contiene resultados, ENTONCES EL SISTEMA entregará un archivo con las cabeceras previstas y ninguna fila de datos. (DEC-168; precisión de RF-27/RF-28/RF-33)
- **RF-56:** SI un cliente recibe baja lógica después de solicitar un CSV de clientes pero antes de entregarlo, ENTONCES EL SISTEMA aplicará a su fila la restricción de RF-44 antes de entregar el archivo. (DEC-168; prevalencia de privacidad de DEC-165)
- **RF-57:** CUANDO se solicita descargar un CSV ya generado, EL SISTEMA comprobará la autorización vigente del solicitante conforme a 005. (DEC-168; RN-26; precisión de RF-1)
- **RF-58:** SI el solicitante ya no está autorizado como administrador al entregar el CSV, ENTONCES EL SISTEMA impedirá la descarga. (DEC-168; RN-26)
- **RF-59:** CUANDO se entrega una exportación CSV, EL SISTEMA informará el instante de referencia de sus resultados con zona horaria identificable. (DEC-168; AC09; precisión de RF-42)

El CSV no se limita a la página visible ni incorpora cambios ordinarios posteriores a su solicitud; se requiere otra exportación para verlos. Como excepción de seguridad adoptada por delegación, la baja lógica y la pérdida de autorización antes de la entrega prevalecen sobre la copia temporal: RF-56 oculta los campos de la fila, sin eliminarla ni incorporar clientes nuevos; RF-58 bloquea una descarga no autorizada. Los registros y valores ordinarios, incluida la cantidad de reservas, mantienen la referencia del inicio. El instante de referencia se informa sin añadir filas ficticias al conjunto de datos del CSV.

Exportar todos no promete un tiempo máximo ni capacidad física ilimitada: si falla, se aplica RF-32 y nunca se presenta un recorte como archivo completo. RF-44 también se aplica al detalle del cliente; no habilita borrar el historial de reservas o auditoría. RF-54 impide inferir la identidad oculta mediante búsquedas de nombre/correo; la consulta histórica de auditoría sigue su alcance propio y no se borra ni se convierte en una edición de clientes. RF-20 no elimina la evidencia de fallos o reintentos distintos exigida por 003/004.

En nombre/correo se retiran los espacios exteriores antes de la coincidencia parcial; no se adopta búsqueda sin tildes o fonética. En actor y correlación se usan sus identificadores, no búsquedas parciales de nombres. Los extremos de fecha pueden omitirse para expresar un rango abierto; sin fechas no hay restricción temporal. Si se indican ambos extremos, RF-47 y RF-51 fijan sus límites y validación. No se permite reinterpretar parámetros inválidos como filtros omitidos.

RF-38 no implica aprobar o confirmar una reserva por el solo hecho de existir un cobro. La validación, los cortes de pago y las devoluciones siguen en 002; un fallo de auditoría no amplía los límites de 001/003 ni reactiva reservas canceladas. 010 no cambia las specs protegidas: su plan debe contrastar este contrato transversal con cada origen antes de ejecutarlo.

## Requisitos no funcionales

- **Seguridad y privacidad:** aplicar las exclusiones de secretos a pantalla y CSV; la exportación no constituye un permiso adicional para datos personales. (AC04/AC05; RN-18/RN-26)
- **Trazabilidad:** los logs técnicos no sustituyen los registros de auditoría consultables. (F04 AC09)
- **Integridad histórica:** conservar las relaciones históricas aunque cambien el nombre o el estado actual de la entidad. (RN-28/RN-30; DA08)
- **Fechas:** las fechas mostradas o exportadas deben identificar su zona horaria; no se asume que la hora local del dispositivo sea la referencia de auditoría. (AC09; RP08)
- **Conservación:** la retención indefinida no promete capacidad física ilimitada ni permite perder la consulta del historial archivado. (DEC-156)
- **Rendimiento:** no se fija un SLA sin volumen y condiciones de medición; los objetivos verificables quedan pendientes del plan y ACL-15.

## Casos límite

| Caso | Resultado esperado | Criterios |
|---|---|---|
| Cliente intenta abrir consulta o CSV administrativo | Acceso denegado sin resultados | RF-1/RF-2 |
| Perfil sin teléfono | Se muestra el dato como no disponible, sin inventarlo | RF-5 |
| Cliente sin reservas | Resumen con cantidad cero | RF-6 |
| Intento de editar, desactivar o reactivar cliente desde 010 | No hay acción habilitada | RF-7/RF-35 |
| Proceso automático sin usuario humano | Actor identificado como sistema/proceso | RF-10 |
| Operación sin referencia de correlación existente | No se inventa una referencia histórica | RF-14 |
| Baja lógica de cliente, oferta u hotel | Auditoría histórica conservada | RF-18 |
| Evento repetido | No se representa una nueva aplicación exitosa | RF-20 |
| Reintento distinto con nuevo resultado | Se conserva su evidencia según la spec de origen | RF-9/RF-15 |
| Cambio de catálogo rechazado | No figura como cambio aplicado | RF-21 |
| Filtros sin coincidencias | Resultado vacío, no fallo | RF-33 |
| Filtro o paginación inválidos | Error de validación | RF-34 |
| Valores con comillas, saltos o apariencia de fórmula | CSV conserva campos con contenido inerte | RF-30/RF-31 |
| Fallo al generar CSV | Error, no archivo incompleto presentado como éxito | RF-32 |
| Fallo de auditoría antes de aplicar un cambio | Cambio no aplicado y error para intentar después | RF-36/RF-37 |
| Culqi ya cobró y falla el guardado de auditoría | Conservar resultado, no repetir/cancelar por ese fallo, recuperar evidencia y alertar si persiste | RF-38–RF-41 |
| Datos nuevos o modificados durante la generación de CSV | Archivo con la referencia del inicio; nueva exportación para cambios posteriores | RF-42 |
| Muchos resultados | Exportación completa sin recorte silencioso | RF-43 |
| Cliente con baja lógica | Solo ID, estado de baja y cantidad de reservas en consulta y CSV | RF-44 |
| Varios filtros aplicados | Cumplir todos; no basta uno | RF-45 |
| Búsqueda «ana» sobre «Ana Pérez» | Coincidencia parcial sin distinguir mayúsculas | RF-46 |
| Fechas inicial y final iguales | Se incluye el día completo en hora de Perú | RF-47 |
| Fechas invertidas o inválidas | Error de validación; no exportación parcial | RF-51 |
| Filtro vacío o con espacios exteriores | Se omite si queda vacío; el texto restante conserva la búsqueda acordada | RF-52 |
| Fechas omitidas | Rango abierto por el extremo omitido; sin ambos no hay restricción temporal | Precisión de RF-47/RF-51 |
| Dos registros con igual fecha | Desempate estable por identificador único descendente | RF-48 |
| Página válida más allá de los resultados | Vacía, sin salto a otra página | RF-49 |
| Cliente con reservas en distintos estados | Contar cada reserva una vez, sin excluir canceladas | RF-53 |
| Búsqueda del correo de un cliente dado de baja | No encontrarlo mediante ese dato oculto | RF-54 |
| CSV sin coincidencias | Cabeceras, sin filas ficticias | RF-55 |
| Baja de cliente mientras se prepara el CSV | Fila conservada con solo los datos permitidos por RF-44 | RF-56 |
| Pérdida de permisos durante la preparación | Descarga bloqueada | RF-57/RF-58 |
| CSV entregado | Instante de referencia informado sin confundirlo con el fin de generación | RF-59 |

## Fuera de alcance

- Editar clientes o ejecutar bajas, desactivaciones, reactivaciones o cambios de rol desde 010.
- Ejecutar pagos, devoluciones, cancelaciones, liberaciones o reenvíos desde la consulta de auditoría.
- Alterar reglas aprobadas de 001, 003, 004, 005, 006, 007 o 013.
- Aprobar por referencia los borradores 002 y 009 o definir las operaciones aún no especificadas de 008.
- Auditoría indiscriminada de navegación pública, de cada lectura o de cada petición sin carácter crítico.
- Sustituir logs técnicos o incorporar sus cargas completas en la auditoría.
- Indicadores, fórmulas de negocio, reportes consolidados y exportación PDF de 011/HU-19.
- Exportación JSON, importación CSV y edición masiva de clientes.
- Modificar fuentes originales, código, planes o tareas en esta actividad.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-59 numerados, verificables y trazados a sus fuentes.
- Mantener explícitas las diferencias entre alcance original, precisiones de entrevista y ampliación CSV.
- Conservar los límites de 002/009 como borradores y las dudas funcionales sin inventar decisiones.
- Registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar permisos de clientes, auditoría y ambas exportaciones.
- Verificar filtros, paginación, perfiles, resumen de reservas y ausencia de acciones de modificación.
- Verificar datos de auditoría, procesos automáticos, historial, retención e inmutabilidad.
- Verificar la reconstrucción de los flujos críticos sin duplicar operaciones aplicadas.
- Verificar filtros equivalentes entre consulta y CSV, exclusión de secretos y protección de campos exportados.
- Verificar vacíos, parámetros inválidos y errores de exportación.
- Verificar rechazo de acciones controlables cuando falla auditoría, sin efectos parciales.
- Verificar recuperación de evidencia de un cobro externo sin volver a cobrar ni alterar reglas de reserva.
- Verificar CSV completo con referencia temporal del inicio, también ante cambios concurrentes.
- Verificar consulta y CSV restringidos de clientes con baja lógica.
- Verificar combinación de filtros, coincidencia parcial y rangos inclusivos en hora de Perú.
- Verificar orden/desempate, rangos abiertos o inválidos, filtros vacíos y conteo de todos los estados sin duplicados.
- Verificar CSV vacío y referencia temporal informada sin filas ficticias.
- Verificar baja concurrente y pérdida de permisos antes de la descarga sin revelar datos ocultos.
- Cerrar las dudas funcionales antes de ejecutar las partes afectadas.

## Contraste con docs/01-analisis-de-sistema/

| Fuente | Resultado del contraste |
|---|---|
| F01 §2 | Se conserva consulta administrativa y prohibición de editar/eliminar auditoría. |
| F02 HU-18 | Se conservan prioridad P3, rol `admin`, solo lectura y trazabilidad. Paginación, filtros detallados y CSV son precisiones de entrevista, no texto original de HU-18. |
| F02 HU-14/HU-15/HU-20 | Se preservan auditoría de cambios y bajas, así como `reservation.auto_cancelled`; no se reemplazan las reglas de cada funcionalidad. |
| F03 RF15/RF23; RN-26/RN-28–RN-30 | Cobertura por consultas, datos de auditoría, permisos, inmutabilidad y preservación histórica. |
| F04 AC04/AC05/AC09 | Exclusión de secretos, protección de datos y fecha UTC con correlación cuando corresponda; logs y auditoría siguen separados. |
| F05/F06/F07 | Se respetan privacidad, fechas e historial; esta spec no cambia restricciones ni ADR ni selecciona mecanismos técnicos. |
| F02 HU-19 | CSV de clientes/auditoría es ampliación explícita DEC-160; no elimina el reporte PDF requerido en 011. |

No se detectan contradicciones con las fuentes originales en el alcance contrastado. La retención indefinida procede de DEC-156, no de una obligación de duración deducida de RN-29. DEC-162–DEC-167 complementan las fuentes con políticas de fallo, exportación y visibilidad de bajas. DEC-168 registra los criterios de cierre adoptados por delegación, incluida la prevalencia de privacidad/permisos actuales sobre la referencia temporal del CSV; no se presenta esta excepción como una regla respondida individualmente por el usuario. No se modifican las aprobaciones ni reglas de negocio de otras specs.

## Dudas abiertas

- **RESUELTO — DEC-162/DEC-166:** no aplicar una acción aún controlable si falla su auditoría; un cobro externo ya realizado conserva su resultado, sin repetición/cancelación por ese fallo, con recuperación de evidencia y alerta si persiste.
- **RESUELTO — DEC-163/DEC-164:** el CSV representa todos los resultados al inicio de la solicitud; no se trunca por volumen ni incorpora cambios posteriores.
- **RESUELTO — DEC-165:** el cliente con baja lógica aparece solo con ID, estado de baja y cantidad de reservas en consulta y CSV; no se elimina historial por esta regla.
- **RESUELTO — DEC-167:** todos los filtros elegidos deben cumplirse; nombre/correo parcial sin distinguir mayúsculas; fechas inclusivas de días completos en hora de Perú.
- **COMPLETADO POR DELEGACIÓN — DEC-168:** orden/desempate, parámetros vacíos o inválidos, coincidencias exactas de identificadores/opciones, rangos abiertos, conteo de reservas, CSV vacío, protección de bajas concurrentes, autorización antes de descarga y referencia temporal visible. El texto y los formatos exactos de presentación se fijan en el plan, sin inventar nuevos mensajes aprobados.
- **PENDIENTE DEL PLAN:** tamaño de página, formato de fecha y columnas CSV, nomenclatura de acciones sin nombre ya fijado, integración y pruebas con cada origen, condiciones de medición y conservación del historial archivado.
- **PENDIENTE DEL PLAN:** recuperación verificable de evidencia externa, reintentos y umbral/canal de alerta por auditoría, exportaciones completas con referencia temporal fija y protección de datos de baja, sin relajar RF-36–RF-47. No se crean mecanismos ni umbrales en esta spec.
- **PUERTA DE INTEGRACIÓN:** antes de ejecutar, demostrar cómo se conserva y recupera evidencia cuando falla el guardado de auditoría. La alerta por fallo persistente de auditoría no forma parte del alcance aprobado de 004 v0.1: debe formalizarse su contrato sin modificarla silenciosamente. Este punto bloquea la integración afectada, no se presenta como resuelto por nombrar un canal en el plan.
- **PENDIENTE DE 008/011:** perfil/baja y reportes se especifican por separado; no crear acciones nuevas desde 010.
- **PENDIENTE DE APROBACIÓN:** 002 y 009 conservan su estado de borrador; la aprobación de 010 no los aprobaría.

## Aprobación de esta especificación

- **Antecedente aprobado:** v0.1 con 35 criterios y pendientes explícitos; respuesta «si , o aun hay dudas?» el 2026-11-01, DEC-161. Esa aprobación no se extiende a v0.2/v0.3.
- **Revisión anterior:** v0.2 con 47 criterios, presentada pero no aprobada explícitamente.
- **Versión aprobada:** 0.3, con 59 criterios.
- **Aprobación explícita de v0.3 completa:** sí; respuesta «si» a «¿Apruebas 010 v0.3?».
- **Fecha de aprobación de v0.3:** 2026-11-01; DEC-169.
- **Decisiones de entrevista y delegación:** DEC-155–DEC-160 y DEC-162–DEC-168; no equivalen a aprobación del documento completo.
- **Límite:** la delegación «hazlo» no constituyó aprobación; la respuesta posterior «si» sí aprueba v0.3 mediante DEC-169. No aprueba 002/009 ni cambia documentos protegidos. Quedan detalles técnicos y puertas de integración visibles; no se autoriza implementación por esta aprobación.
- **Plan/tareas:** no creados; no se autoriza código, commits ni push.
