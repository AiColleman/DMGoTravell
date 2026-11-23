# Contrato técnico propuesto: consultas, exportación y privacidad

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-204.  
> **Estado:** propuesta documental pendiente de ratificación/verificación; **NO IMPLEMENTADA**.  
> **Ámbito:** 010/011 con lectores de 001/002/005/006/007/008/009; AT-02/AT-09 del análisis.  
> **Límite:** sin consultas/exportaciones de datos reales, código, SQL, archivos CSV/PDF generados, dependencias instaladas o configuración externa.

## 1. Autoridad y procedencia

Bases funcionales: [010 v0.3](../specs/010-clientes-auditoria/spec.md), [011 v0.1](../specs/011-reportes/spec.md), [005](../specs/005-identidad/spec.md), [008](../specs/008-perfil/spec.md), [constitución](../constitution.md) y [análisis DEC-200](../analisis-consistencia.md). Diseño derivado de [010 plan §§6–10](../specs/010-clientes-auditoria/plan.md), [011 plan §§2–7](../specs/011-reportes/plan.md) y [008 plan §9](../specs/008-perfil/plan.md).

Las propuestas de [coordinación DEC-201](coordinacion-transaccional.md), [identidad DEC-202](identidad-destinatarios-notificaciones.md) y [multimedia DEC-203](multimedia-publicacion-referencias.md) se conservan intactas. La lectura publicitaria de una foto y el transporte de enlaces de identidad no autorizan descargar artefactos administrativos.

CX/DX/EX/PX son referencias técnicas locales, no RF/HU nuevos o tareas añadidas. Fuera de alcance: edición/baja/reactivación desde 010, reparación de auditoría, conciliación/pagos/devoluciones desde 011, prorrateo/conversión/contabilidad nuevos, importación, nuevos formatos o envío por correo, almacenamiento público, rutas/SQL/firmas finales y selección/compra de biblioteca PDF.

## 2. Tres tipos que no comparten una política indiscriminada

| ID/tipo | Referencia y contenido | Privacidad y permiso de entrega |
|---|---|---|
| DX-01 — CSV de clientes, 010 | Todos los resultados/filtros de la captura al admitir la exportación, incluidos conteos distintos de reservas de sus cuatro estados | Baja al inicio: solo ID/estado/cantidad y no coincidencia nueva por nombre/correo ocultos. Baja posterior: misma fila/ID y cantidad del inicio, campos restantes restringidos; admin actual antes de descargar. |
| DX-02 — CSV de auditoría, 010 | Todos los registros filtrados y campos/cambios autorizados de la captura inicial, fecha original e incorporación diferenciadas | Sin secretos; no borrar/recalcular historia por baja de entidad. La máscara de DX-01 no convierte los registros auditados en filas de clientes; admin actual antes de descargar. |
| DX-03 — PDF de indicadores, 011 | Resultados oficiales, filtros/definiciones/referencia de la consulta vista, con todas las reservas de su conjunto operativo | Sin nombres/contactos/ID de cliente desde la captura/modelo público de reporte; número de reserva permitido. Baja posterior no quita reservas, cambia importes/fechas o aplica máscara de cliente; admin actual antes de descargar. |

La excepción de privacidad actual de DX-01 no permite actualizar cantidades o incorporar clientes posteriores. La inclusión histórica de DX-02/DX-03 tampoco permite consultar contactos ocultos por un atajo de enriquecimiento. Cada tipo usa lista positiva de campos y fuente autorizada, nunca serialización genérica de entidades o cuerpos de proveedor.

## 3. Fronteras y responsabilidades

| ID | Responsable | Entrada confiable | Resultado propuesto |
|---|---|---|---|
| CX-01 — Autorizar/normalizar selección | 010/011 con 005 | Actor/familia/rol actuales, tipo y filtros/página de lista según su contrato | Selección normalizada válida, rechazo explícito o vacío conocido; no aceptar rol/cifras del cliente. |
| CX-02 — Leer fuentes coherentes | Módulos propietarios mediante Application | Selección y contexto de captura común | Proyecciones mínimas de cuentas/reservas/auditoría/hechos financieros con procedencia/fechas, o indisponibilidad; no conexiones independientes ocultas con vistas diferentes. |
| CX-03 — Confirmar captura durable | 010 para CSV; 011 para consulta oficial | Proyecciones completas bajo la vista adquirida, solicitante autorizado, tipo/filtros/definiciones | Copia privada confirmada con referencia real, conteo/manifiesto y estado completo antes de generación diferida. |
| CX-04 — Calcular reporte oficial | 011 con hechos persistidos | Tres poblaciones coherentes, importes/cantidades históricos y fechas propias | Indicadores operativos/contratados/financieros según spec; no mezcla de monedas/cohortes o cero ficticio por fuente fallida. |
| CX-05 — Generar artefacto completo | 010 serializador CSV; 011 motor PDF | Solo captura confirmada y política/versiones propias del tipo | Archivo completo validado, conteo/bytes/huella y variante vinculados a captura, o fallo explícito sin prefijo publicado como archivo final. |
| CX-06 — Revalidar privacidad y autorización | 005/008 y 010/011 | Solicitud/artefacto y estado vigente de actor; para DX-01, privacidad actual de filas capturadas | Descarga autorizada, regeneración de variante restringida, denegación o indisponibilidad; sin refrescar negocio ordinario. |
| CX-07 — Entregar por backend | 010/011 | Variante completa admitida y autorización/privacidad revalidadas | Bytes/tamaño/nombre seguros, referencia/zona y caché privada/no-store; ID/URL no son credenciales. |
| CX-08 — Recuperar/expirar/limpiar copias | Propietario técnico del artefacto | Identidad de captura/variante/operación y resultado durable | Retry desde la misma copia, fallo/expiración explícitos y limpieza solo técnica; no borrar auditoría o fuentes ni recalcular bajo referencia vieja. |

010/011 no obtienen permiso de modificar repositorios ajenos por leer sus datos. Persistir preparación/artefactos técnicos no es editar clientes/reservas/pagos/auditoría fuente. No HTTP interno, transacción distribuida, broker, nuevo servicio desplegable o disco local durable.

## 4. Captura y referencia temporal

Proponer solicitud/captura con ID opaco, tipo DX, solicitante, selección normalizada, versión de columnas/definiciones, referencia con zona y manifiesto de completitud. Separar captura de artefacto y de variante: volver a renderizar una misma copia no es capturar datos nuevos.

En 010, una lista paginada no es una copia inmóvil entre peticiones. Solicitar CSV fija la vista de la exportación al admitir/capturar la solicitud, no necesariamente la página que se vio antes. En 011, la consulta oficial ya debe conservar el resultado visto para exportarlo después sin cambios. No aplicar a ambos flujos la misma regla de «refrescar al pulsar descargar».

Secuencia propuesta de los planes:

1. Validar autorización/selección/capacidad antes de aceptar una captura que no se puede conservar. Saturación no admite un job que después use una vista distinta fingiendo la referencia original.
2. Adquirir contexto común PostgreSQL, propuesta `REPEATABLE READ`, y fijar el punto de referencia al adquirir realmente su vista. Las fechas del dispositivo, recepción en cola o arranque de worker no la sustituyen.
3. Leer/copiar todas las proyecciones requeridas y calcular bajo ese contexto. Las filas/copias privadas pueden requerir escrituras técnicas: no declarar transacción SQL `READ ONLY` si se inserta la preparación. Confirmar copia/manifiesto/completitud conjuntamente, sin mutar fuentes.
4. Encolar/renderizar solo desde captura confirmada. No mantener la transacción de fuentes abierta durante navegación, espera de worker, renderizado o transferencia de red.
5. Commit incierto: verificar identidad de operación antes de repetir. Si no puede recuperarse la captura, informar; no recrear otra vista bajo el mismo ID/referencia. Después de confirmar copia, retry de renderizado no relee fuentes ordinarias.

No basta `createdAt <= referenceAt`: cambia el estado de una reserva, cambia un nombre, aumenta un conteo o aparece una auditoría/cobro tardío con fecha original antigua. Tampoco un ID de snapshot exportado después de cerrar su transacción conserva una copia durable para otro worker. PX-01 exige demostrar coherencia de todos los lectores y su referencia, no solo guardar un timestamp.

Tipos de filtro/días/orden/paginación mantienen su contrato propio: 010 permite rangos abiertos; 011 usa su período con oferta/hotel opcionales sobre la identidad histórica. Días completos inclusivos en Perú se traducen a inicio inclusivo y comienzo del día siguiente exclusivo según propuesta de planes. Una página válida vacía no salta a otra; un parámetro inválido no se trata como omitido.

## 5. Reporte: poblaciones y datos mínimos

Para DX-03, un mismo predicado de oferta/hotel se aplica a reservas relacionadas, pero **no una única fecha para todos los hechos**:

- Reservas distintas creadas en el período, estados conocidos a referencia, viajeros turísticos y componentes contratados históricos. Hotel es subconjunto, no otra reserva global. No inferir huéspedes/ocupación de capacidad o tamaño del grupo.
- Cobros reales confirmados distintos por fecha de operación confirmada, aunque la reserva sea anterior. Callback/respuesta/consulta de una transacción no son tres cobros; dos transacciones reales distintas sí se conservan, incluso excedentes/observadas/tardías.
- Devoluciones ejecutadas confirmadas distintas por fecha propia, aunque cobro/reserva sean anteriores. No limitarse a cobros del mismo período ni incluir desconocido/autorización como ejecución o abono.

Por moneda: cobros menos devoluciones, admitiendo negativos; sin conversiones/comisiones/gastos/impuestos/ganancia/saldo bancario inventados. Incidencias pueden solaparse y no se suman para reconstruir total único. Contrato turístico + hotelero reconcilia con total contratado, no vuelve a sumarse como otro ingreso real. Precisión exacta del origen, sin `float` o redondeo por callback.

El lector de Payments aporta identidad, estado validado y fechas propias acreditables. Fecha de recepción/incorporación no sustituye operación/ejecución; un dato necesario ausente significa indisponibilidad, no cero/registro descartado. El resultado conocido vacío sí produce cero/tablas vacías y PDF válido de ese conjunto.

Proyección de DX-03 excluye identidad/contactos del cliente, tarjetas/credenciales/tokens; no completar mediante un lector de clientes que introduzca PII o un campo escondido en metadata PDF. Datos del artefacto/dueño para autorización se mantienen privados y separados del contenido del reporte. Un cambio posterior requiere nueva consulta explícita, no refrescar silenciosamente el resultado descargado.

## 6. Generación segura y variantes privadas

CSV: esquema estable por tipo, UTF-8/serializador y formato propuestos por plan 010; campos con separadores/comillas/saltos conservan límites. Archivo vacío con cabeceras, sin fila ficticia de referencia o «sin resultados». La referencia/zona va en metadata de entrega/contrato, no una fila añadida al conjunto.

Quoting CSV no garantiza texto inerte: comprobar fórmulas/controles/untrusted text en herramientas/versiones soportadas, incluida reapertura. No tratar números/fechas tipados como expresiones del usuario o alterar fuente para sanear descarga. Una prefijación no es garantía universal; PX-02 conserva elección/pruebas de neutralización antes de habilitar, sin eliminar 010/RF-31 para publicar inseguro.

PDF: usar resultado tipado congelado, texto escapado y lista completa de reservas, no solo página visual. Multipágina/Unicode, columnas/totales/monedas/filtros/definiciones/referencia visibles y sin recursos remotos o código activo por texto de oferta/hotel. Biblioteca/versión/licencia/fuentes/Linux siguen Q-04: no se elige, instala, compra o presupone MIT de ejemplos sobre la biblioteca candidata por este contrato.

Preparación/artefactos privados según propuesta de planes, con manifiesto que vincula captura, tipo, variante, esquema/plantilla, conteo/bytes/huella y estado completo. No reutilizar un artefacto de otro tipo/dueño o capturas mezcladas porque coinciden filtros/nombre. Falla de proceso no publica un archivo parcial como listo; tamaño de página/lote/concurrencia no limita filas exportadas.

### Privacidad vigente de DX-01

Antes de entrega, leer estado de baja actual desde la fuente autorizada, no desde snapshot viejo. Si el cliente ya estaba oculto al capturar, nunca revelar luego nombre/correo/etc. Si la baja ocurrió después, conservar fila/ID/cantidad de la captura y dejar solo campos permitidos; no incorporar el conteo nuevo o quitar la fila porque ya no coincide su nombre visible.

Invalidar una variante ahora demasiado amplia y producir otra completa desde **la misma captura**, con máscara actual. Proponer identidad/versionado de variante que permita acreditar qué protección se aplicó; si cambia durante su regeneración, reevaluar antes de entregar. Que exista un archivo «listo» no permite omitir esa revalidación. Origen de privacidad no comprobable: no entregar una variante potencialmente reveladora.

Para consultas/exportaciones nuevas, clientes que ya tienen baja no coinciden por nombre/correo ocultos. Esta regla no se transforma en un recálculo retroactivo de las filas de una captura previa: 010/RF-56 restringe esa fila, no la borra. La auditoría histórica de DX-02 conserva su ámbito propio y no se reescribe como cliente; DX-03 conserva resultado sin PII y sus datos de reserva permitidos.

## 7. Entrega, incertidumbre y retención

Revalidar solicitante/rol/familia vigentes y autorización de la referencia **antes de exponer resultados o iniciar entrega**; conocer ID/URL, una firma de enlace o permiso al solicitar el job no basta. Estado no verificable falla cerrado. Ninguna variante/listado de chunks queda accesible como objeto público de 012 o mediante el storage sin backend.

PX-03 requiere acreditar el punto inmediatamente anterior a iniciar respuesta, incluidos permisos/privacidad que cambiaron mientras se preparaba el archivo. No mantener locks de clientes/identidad durante una descarga de red, prometer retirar bytes ya recibidos o usar un check antiguo para transferencias futuras. Si se habilitan reintentos/rangos/cachés, cada solicitud debe respetar el mismo permiso/privacidad actuales; no se incorpora aquí soporte nuevo de rangos.

Entregar variante completa con MIME, nombre seguros, tamaño/huella/referencia y caché privada/no-store. Abrir un enlace o comenzar streaming no demuestra recepción completa del cliente. Una transferencia cortada no vuelve incompleta la copia canónica lista, pero tampoco se anuncia como descarga exitosa: una repetición autorizada reevalúa privacidad, sin recalcular fuentes.

Propuesta de disponibilidad de 24 horas del artefacto/copia conforme a cada plan, no retención de auditoría ni SLA. Captura expirada/irrecuperable: error y nueva solicitud/consulta explícita, sin números distintos bajo referencia vieja. Cleanup solo sobre tablas/copias/variantes técnicas y coordinado con su uso; no cascadas o permisos para borrar fuentes/auditoría indefinida. PX-04 conserva capacidad/cleanup/transferencia/fallos pendientes, sin prometer archivo infinito o continuidad ante toda caída.

No volver a cobrar, devolver, cancelar, completar o reenviar avisos por generar/recuperar un CSV/PDF. Logs/métricas se limitan a IDs/estados/conteos/duración y errores saneados, no filas, cifras sensibles innecesarias, contactos, filtros personales crudos o secretos.

## 8. Escenarios de aceptación técnica futuros

Todos **no ejecutados**, sin casillas adicionales.

| ID | Escenario | Resultado a verificar | Referencia |
|---|---|---|---|
| EX-01 | Cliente/admin revocado/ID de captura ajena | Sin consulta/archivo; permiso actual, no una firma JWT o URL como autorización suficiente | 010/RF-1/RF-2/RF-57/RF-58; 011/RF-1/RF-33. |
| EX-02 | Página válida vacía, filtro mal formado/invertido o texto vacío | Vacío/validación/omisión según tipo, sin salto automático o reinterpretación del inválido | 010/RF-49/RF-51/RF-52; 011/RF-8. |
| EX-03 | CSV solicitado después de navegar página previa y luego cambian fuentes | Captura al admitir exportación, no mezcla con la página vieja o valores de un worker posterior | 010/RF-42/RF-43; A-04. |
| EX-04 | PDF solicitado después de cambiar reservas/estado/precios | Resultado/filtros/referencia del reporte visto, sin recálculo o cifras del navegador | 011/RF-29–RF-32; Q-02. |
| EX-05 | Auditoría/cobro incorporado después con fecha original anterior | Captura anterior no lo incorpora silenciosamente; nueva captura puede mostrarlo | 010/RF-42; 011/RF-30; PX-01. |
| EX-06 | Fuentes por contextos distintos, commit desconocido o snapshot de origen cerrado | No captura coherente ficticia o nueva vista bajo referencia vieja; verificar/fallar explícitamente | 011/RF-31/RF-36; A-04/Q-02. |
| EX-07 | Cliente ya con baja al filtrar por nombre/correo | No coincidencia por dato oculto; resultados permitidos solo ID/estado/cantidad | 010/RF-44/RF-54; PX-03. |
| EX-08 | Baja después de captura o después de artefacto listo, antes de entrega | Fila/ID/cantidad del inicio conservados; variante completa restringida, sin servir primero la amplia | 010/RF-56; A-05/P-05. |
| EX-09 | Baja cambia durante regeneración o lector de privacidad falla | Revalidar/no entregar variante potencialmente reveladora; no cero de privacidad por error | 010/RF-44/RF-56; PX-03. |
| EX-10 | Aplicar helper de máscara de cliente a CSV de auditoría/PDF de reservas | Ámbitos separados: no reescribir auditoría ni quitar fechas/importes de reserva permitidos de 011 | 010/RF-18; 011/RF-28/RF-37. |
| EX-11 | Muchas filas, multipágina, vacío conocido y fuente necesaria caída | Todo el conjunto, vacío con formato correcto o indisponibilidad; no truncamiento/cero falso | 010/RF-32/RF-43/RF-55; 011/RF-26/RF-34–RF-36. |
| EX-12 | Reserva enero, cobro febrero y devolución de otro período | Tres poblaciones propias, reservas distintas y posible diferencia negativa sin inventar filas operativas | 011/RF-7/RF-10/RF-18/RF-22/RF-23. |
| EX-13 | Misma transacción por varios eventos, dos cobros reales e incidencias superpuestas | No contar callbacks como dinero, sí hechos reales distintos; incidencias no sumables y monedas separadas | 011/RF-18–RF-21; Q-01/Q-02. |
| EX-14 | Hotel parcial, contrato turístico/hotelero y `pending`/`cancelled` | No inferir huéspedes, doble total o contrato como efectivo; preservar valores históricos por estado | 011/RF-12–RF-17/RF-27. |
| EX-15 | CSV con fórmulas/controles/comillas/separadores/multilínea y reapertura | Integridad de campos y texto inerte probado en herramientas soportadas, sin modificar fuente | 010/RF-30/RF-31; PX-02. |
| EX-16 | PDF Unicode/multipágina, texto malicioso y metadata/recursos | Sin omisiones, PII, secretos o recursos remotos; cifras coinciden con resultado y runtime/licencia acreditados | 011/RF-25/RF-26/RF-28/RF-32; Q-04. |
| EX-17 | Fallo de renderizado/worker o mezcla de chunks/variantes | No prefijo parcial/otro tipo como listo; regeneración solo desde captura confirmada | 010/RF-32; 011/RF-34; PX-04. |
| EX-18 | Permiso retirado durante preparación, reintento de descarga y URL pública/cacheada | Denegación cuando corresponda antes de nueva entrega; no bypass por archivo listo o reuso de URL | 010/RF-57/RF-58; 011/RF-33; PX-03. |
| EX-19 | Expiración/cleanup concurrente y descarga cortada | No borrar fuentes/auditoría ni declarar parcial recibido como éxito; referencia no recuperable da error | 010/RF-35; 011/RF-3/RF-31/RF-34; PX-04. |
| EX-20 | Peticiones de exportación manipuladas/repetidas y fallo de proveedor ajeno | No mutar negocio, credenciales o pagos; IDs/selección no sustituyen datos oficiales ni exponen otra captura | 010/RF-7/RF-26/RF-29/RF-35; 011/RF-2/RF-3/RF-32. |

## 9. Precisiones pendientes y trazabilidad

| ID | Evidencia necesaria antes de ratificar/habilitar | Puertas existentes |
|---|---|---|
| PX-01 | Lectores/contexto común, datos/fechas oficiales, adquisición de vista y copia/manifiesto durable; captura inicial de 010 frente a resultado visto de 011, commit desconocido y cambios incorporados tarde | A-01/A-04; Q-01/Q-02; G-05 para hechos financieros. |
| PX-02 | Serializador/neutralización CSV en herramientas/versiones soportadas y PDF/versión/licencia/fuentes/runtime/Unicode/multipágina; columnas/metadata de lista positiva | A-05; Q-03/Q-04. |
| PX-03 | Estado de rol/familia y privacidad actuales, identidad/versionado de variante, punto previo a entrega con carreras/errores/caché/reintentos, sin mantener locks en red o prometer retirar bytes previos | I-05/P-05; A-05; Q-03. |
| PX-04 | Presión MVCC/volumen/captura/artefactos, almacenamiento privado/privilegios, completitud/transferencia, expiración/cleanup/recuperación sin borrar fuentes ni truncar | A-02/A-04/A-06; Q-05/Q-06; ACL-15/ACL-20. |

Trabajo ya previsto: [010 tasks](../specs/010-clientes-auditoria/tasks.md), T010-07–T010-21/T010-24/T010-27–T010-33; [011 tasks](../specs/011-reportes/tasks.md), T011-02–T011-20/T011-22–T011-27; [008 tasks](../specs/008-perfil/tasks.md), T008-16/T008-25, y [005 tasks](../specs/005-identidad/tasks.md) para autorización vigente. Son apoyos documentales, **no tareas completadas por redactar este contrato**.

Sin nuevas consultas externas: referencias PostgreSQL/CSV/OWASP/PDF mantienen fecha/alcance de [fuentes](../fuentes.md) y planes; no se acredita versión instalada, licencia adquirida o seguridad efectiva por citarlas. No se generó/descargó CSV/PDF o consultó una base con datos reales.

Inventario preservado: **659 criterios y 386 tareas pendientes**, cero ejecutadas. CX-01–CX-08 son contratos propuestos, DX-01–DX-03 tipos delimitados, EX-01–EX-20 escenarios futuros y PX-01–PX-04 evidencia pendiente. No ratifica contratos ni modifica specs/planes/tasks, análisis o propuestas anteriores.

### Comprobación documental de cierre

- 931 enlaces locales comprobados, ninguno roto; DX-01–DX-03, CX-01–CX-08, EX-01–EX-20 y PX-01–PX-04 consecutivos y únicos. Referencias explícitas RF/tareas contrastadas con documentos existentes.
- 47 documentos previos intactos por SHA-256: 43 Markdown protegidos de `specs/` salvo su índice, análisis DEC-200 y contratos DEC-201–DEC-203. Sus resultados históricos no se reescriben con el inventario nuevo.
- DEC-204 único, sin encabezados DEC duplicados; 386 casillas pendientes. Comprobar rutas/huellas no demuestra consultas coherentes, CSV inerte, PDF válido, licencia/runtime o entrega autorizada en una aplicación real.
