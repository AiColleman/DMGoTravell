# Spec 011 - Indicadores y reportes administrativos

> **Estado:** aprobada v0.1; **APROBADA** el 2026-11-02 mediante DEC-196, con 38 criterios.  
> **Versión:** 0.1, 2026-11-02; 38 criterios.  
> **Requisitos de origen:** RF16; HU-19 (P3); RN-26, conservación de datos históricos y reglas de pagos/devoluciones ya aprobadas. No se renumeran requisitos originales.  
> **Fuentes:** F01 §2; F02 §7/§9; F03 RF16 y reglas de historial; F04 AC04/AC05/AC09/AC10/AC11; F05 RS03/RS07/RP03/RP08; F06 DA08; F12 §§2.8/5.6 como diseño propuesto; [inventario](../../fuentes.md); DEC-188–DEC-193.  
> **Dependencias:** 001, 002, 005, 006, 007, 008, 009 y 010 aprobadas; consultas de reportes no ejecutan acciones de esas funcionalidades. No se altera ninguna spec o plan existente ni se habilita código.

## Resumen para revisión

- Solo administradores consultan y exportan indicadores; las cifras oficiales se calculan sobre datos persistidos, no en el dispositivo del usuario.
- Operación: reservas creadas en el período, cantidades por estado y viajeros turísticos, con desglose por tour/paquete y alojamiento contratado.
- Contratos: componentes turístico y hotelero a sus importes históricos; no se reparten artificialmente cobros reales entre componentes.
- Dinero: cobros reales confirmados y devoluciones ejecutadas en sus propias fechas, aunque correspondan a reservas creadas en otro período; cada moneda va separada.
- Los cobros tardíos, excedentes y observados se incluyen si son reales y confirmados, identificados aparte y sin duplicar la misma transacción por sus eventos/intentos.
- PDF con resumen, desglose y lista de reservas del período: número, fechas, estado e importes contratados, sin datos personales de clientes.
- El PDF conserva los resultados, filtros y referencia temporal de la consulta vista; una actualización requiere una nueva consulta, no un recálculo silencioso al descargar.

Las seis respuestas DEC-188–DEC-193 fijaron el alcance; la aprobación expresa posterior de la spec completa se registra en DEC-196. La planificación posterior se registra por separado y no autoriza implementación.

## Contexto y objetivo

RF16/HU-19 exige indicadores administrativos oficiales calculados a partir de datos persistidos y un reporte PDF. F12 propone separar consultas/reportes de las operaciones del negocio, pero no aprueba por sí solo indicadores, fechas o fórmulas. Esta spec concreta esas decisiones con la entrevista y evita presentar reservas sin pagar como dinero cobrado, una devolución pendiente como ejecutada o un cobro conjunto como dos ingresos independientes.

El objetivo es dar una lectura operativa y financiera verificable, con criterios visibles, sin sustituir la conciliación de 002, la consulta de auditoría de 010 o una contabilidad fiscal no definida.

## Usuarios / actores

- **Administrador activo:** consulta indicadores, elige período/filtros y exporta el PDF de su consulta autorizada.
- **Cliente/visitante:** no accede al reporte administrativo.
- **001/006/007/009:** proporcionan reservas, referencias de oferta/hotel y valores/horarios contratados; no se recalculan con el catálogo actual.
- **002 Pagos:** aporta cobros/devoluciones confirmados y sus referencias, fechas, importes, monedas y clasificación de incidencias; 011 no los confirma ni ejecuta.
- **005 Identidad:** determina autorización vigente para consultar/descargar.
- **010 Auditoría/clientes:** conserva su alcance propio de historial y CSV; 011 no lo reemplaza ni agrega edición de clientes.

## Historias de usuario

Fuente: F02 §7. Se conserva prioridad e identificador original.

- **HU-19 (P3):** Como administrador, quiero consultar indicadores y exportar un reporte para analizar la operación.
  - Los indicadores oficiales son calculados por el backend a partir de datos persistidos.
  - La presentación únicamente muestra los resultados oficiales.
  - El reporte puede exportarse a PDF.

El PDF se conserva de la fuente original, no necesita elegirse otra vez ni puede descartarse porque el diseño propuesto dejase el formato pendiente. La inclusión de listado sin datos personales y la referencia fija proceden de DEC-192/DEC-193.

## Definiciones y reglas de cálculo

### Período, referencia y filtros

El período es un rango de **días completos inclusivos en hora de Perú**. La referencia temporal indica hasta qué momento de información conocida se calculó la consulta; no es la fecha posterior en que se preparó o descargó el PDF.

Filtros de esta versión: período y, opcionalmente, oferta turística principal y hotel de la reserva. Sin oferta/hotel seleccionados se incluyen todas las referencias que cumplen el resto de criterios. Si se eligen ambos, deben cumplirse ambos sobre la reserva relacionada. No se añade filtrado por datos personales del cliente, búsqueda libre de auditoría o selección de estados que cambie la definición del resumen por estado.

Los filtros por oferta/hotel se aplican por igual a la identidad histórica de las reservas relacionadas con cada bloque; **el filtro de fecha se aplica a cada tipo de hecho según las reglas siguientes**, no como una restricción de creación de reserva que elimine cobros/devoluciones legítimos de otro período.

### Bloque operativo y contratado

- Conjunto operativo: reservas distintas **creadas dentro del período**, con los filtros de oferta/hotel elegidos.
- Estados: `pending`, `confirmed`, `completed`, `cancelled` conocidos a la referencia de consulta. No se reconstruye un estado al cierre histórico del período si la cuenta se consulta después; la referencia deja esa distinción visible.
- Reservas totales = número de IDs distintos del conjunto; reservas por estado = conteo de cada estado. La suma de estados coincide con el total del conjunto.
- Viajeros turísticos reservados = suma de la cantidad turística histórica una vez por reserva. No equivale a personas que efectivamente asistieron o viajaron.
- Cada reserva tiene una oferta turística principal; ese desglose no duplica la reserva por sus noches de hotel, cobros, eventos o intentos.
- Desglose de alojamiento: reservas del conjunto que incluyen el hotel contratado y su importe hotelero histórico. Es un subconjunto del operativo, no otras reservas independientes que se suman de nuevo al total.
- Importe turístico contratado = suma de subtotales turísticos guardados; importe de alojamiento contratado = suma de componentes hoteleros guardados; total contratado = suma de ambos componentes. Se conserva PEN y precisión oficial de 001, sin precios actuales ni prorrateo de cobros anómalos.
- Se incluyen los estados documentados con su desglose; los valores de `pending` o `cancelled` son importes **históricos registrados**, no derechos de cobro vigentes, ventas consumadas o entradas de dinero. Mostrar la distinción, no ocultarla bajo «ingresos».
- La capacidad del hotel o total turístico del grupo no acredita cuántos huéspedes se alojaron: 001 permite alojar solo parte del grupo. No imputar huéspedes/ocupación efectiva sin un dato explícito autorizado; la cantidad turística y el número de reservas con alojamiento siguen disponibles.

### Bloque de movimientos financieros

- Cobros: transacciones reales exitosas confirmadas y registradas por 002 cuya **fecha de operación confirmada** está en el período. No contar un intento, callback, token de pago o resultado desconocido como otra transacción real.
- Dos cobros distintos reales son dos movimientos, aunque uno sea excedente y deba devolverse. El mismo cobro recibido por varios canales se cuenta una vez por su identidad externa conservada.
- Los indicadores de incidencias tardío/excedente/observado usan la clasificación conservada por 002. Si una transacción tiene más de una marca, esas líneas son **no sumables entre sí**; no duplican el total financiero único ni se inventa una precedencia de clasificación.
- Devoluciones: operaciones distintas ejecutadas con confirmación del proveedor y registradas por 002 cuya **fecha de ejecución confirmada** está en el período. No confundir detección, autorización, resultado desconocido, intención pendiente o abono bancario con ejecución confirmada.
- Una devolución del período se resta aunque su cobro o reserva fueran anteriores. El listado operativo no tiene por qué contener esa reserva: selecciona por creación, no por fechas de movimiento.
- Por cada moneda: **diferencia de movimientos = cobros confirmados del período − devoluciones ejecutadas del período**. Puede ser negativa; no se limita artificialmente a cero.
- No sumar ni convertir monedas. PEN es la moneda contractual de reservas; una moneda distinta de un cobro observado se muestra separada, no como un nuevo medio o moneda de pago admitidos en el negocio.
- No restar comisiones/gastos/impuestos no definidos ni presentar la diferencia como utilidad, saldo bancario o dinero efectivamente abonado en el banco. Los importes contratados no se suman a los movimientos de dinero.

### PDF y detalle seleccionado

El PDF contiene los indicadores y definiciones anteriores más **todas las reservas del conjunto operativo**, con número de reserva, fechas de creación y servicios contratados disponibles, estado a la referencia e importes históricos por componente/total. No contiene nombres, correos, teléfonos, identificadores de cliente o datos sensibles de tarjeta, credenciales o tokens.

Resumen, detalle y PDF corresponden a la misma consulta oficial. El período, filtros, moneda, criterios de fecha/estado y referencia deben poder reconocerse. No se exige una lista nueva de todos los movimientos individuales o clientes, comparativas de otro período ni una exportación CSV/JSON de 011.

## Requisitos funcionales (criterios de aceptación en EARS)

### Acceso, fuente y selección

- **RF-1:** EL SISTEMA restringirá la consulta y exportación de 011 a administradores autenticados y autorizados. (RF16; HU-19; RN-26; 005)
- **RF-2:** EL SISTEMA calculará las cifras oficiales a partir de datos persistidos sin delegar su cálculo al dispositivo del usuario. (RF16; HU-19)
- **RF-3:** EL SISTEMA conservará sin modificaciones los datos fuente durante consulta y exportación de indicadores. (F12 §§2.8/5.6; RF16)
- **RF-4:** EL SISTEMA utilizará cantidades, referencias e importes históricos de las reservas en lugar de recalcularlos con el catálogo actual. (RN-02; RP03; DA08; 001)
- **RF-5:** CUANDO se selecciona un período, EL SISTEMA incluirá completos los días inicial y final en hora de Perú. (RP08; regla temporal del reporte)
- **RF-6:** EL SISTEMA permitirá filtrar el reporte por período y opcionalmente por oferta turística principal y hotel contratado. (DEC-188; desglose solicitado; precisión de selección de RF16)
- **RF-7:** CUANDO se combinan filtros, EL SISTEMA aplicará todos los elegidos a la reserva relacionada respetando la fecha propia de cada bloque de hechos. (DEC-190; definición del período)
- **RF-8:** SI el período o los filtros son inválidos, ENTONCES EL SISTEMA rechazará la consulta o exportación con un error de validación. (HU-19; F02 §10)
- **RF-9:** CUANDO se presenta una consulta de indicadores, EL SISTEMA mostrará su instante de referencia con zona horaria identificable. (DEC-193; AC09)

### Reservas, servicios e importes contratados

- **RF-10:** CUANDO se calcula el bloque operativo, EL SISTEMA contará una sola vez cada reserva creada dentro del período y de los filtros seleccionados. (DEC-188/DEC-190; 001)
- **RF-11:** EL SISTEMA desglosará esas reservas por su estado conocido a la referencia de consulta entre `pending`, `confirmed`, `completed` y `cancelled`. (DEC-188; estados de 001/009)
- **RF-12:** EL SISTEMA calculará viajeros turísticos reservados sumando una sola vez la cantidad turística histórica de cada reserva del bloque operativo. (DEC-188; 001/RF-19)
- **RF-13:** EL SISTEMA mostrará el desglose operativo por tour o paquete principal de las reservas seleccionadas. (DEC-188)
- **RF-14:** EL SISTEMA mostrará el subconjunto de reservas seleccionadas con alojamiento desglosado por hotel contratado. (DEC-188; 001)
- **RF-15:** EL SISTEMA presentará por separado las sumas históricas del componente turístico y del alojamiento del bloque operativo. (DEC-191; 001/RF-19–RF-23)
- **RF-16:** EL SISTEMA identificará esos importes contratados por estado como valores históricos de reservas, sin presentarlos como cobros reales. (DEC-191; definición del bloque contratado)
- **RF-17:** EL SISTEMA evitará inferir huéspedes u ocupación hotelera efectiva a partir del total de viajeros turísticos o capacidad de habitación. (001/RF-70–RF-72; límites del desglose solicitado)

### Cobros, devoluciones y diferencia

- **RF-18:** CUANDO se calcula el bloque financiero, EL SISTEMA sumará el importe de cada cobro real confirmado una sola vez según su fecha de operación confirmada en el período. (DEC-189/DEC-190; 002)
- **RF-19:** EL SISTEMA excluirá intentos rechazados o resultados no confirmados del total de cobros reales. (DEC-189; 002/RF-23–RF-27)
- **RF-20:** EL SISTEMA identificará aparte los cobros tardíos, excedentes u observados sin duplicar la transacción en el total financiero. (DEC-189; 002/RF-31–RF-35/RF-52–RF-59)
- **RF-21:** EL SISTEMA presentará los importes de cada moneda por separado sin sumarlos o convertirlos entre monedas. (DEC-189; límites de 002)
- **RF-22:** CUANDO se calculan devoluciones del período, EL SISTEMA sumará una sola vez cada ejecución confirmada por su propia fecha aunque corresponda a un cobro o reserva anterior. (DEC-190; 002/RF-41/RF-70)
- **RF-23:** EL SISTEMA calculará por moneda la diferencia entre los cobros confirmados y las devoluciones ejecutadas del período conservando un resultado negativo cuando corresponda. (DEC-188/DEC-189/DEC-190)
- **RF-24:** EL SISTEMA excluirá devoluciones pendientes, comisiones, gastos e impuestos no definidos de esa diferencia de movimientos. (DEC-188/DEC-189; 002; sin política de rentabilidad nueva)
- **RF-25:** EL SISTEMA conservará la precisión monetaria oficial de los importes registrados en los cálculos y su presentación. (001/002; RP03)

### PDF consistente, detalle y errores

- **RF-26:** CUANDO se solicita el PDF, EL SISTEMA incluirá resumen, desglose y todas las reservas del bloque operativo con número, fechas, estado e importes históricos contratados. (HU-19; DEC-192)
- **RF-27:** EL SISTEMA evitará sumar otra vez el mismo total conjunto como ingreso independiente de tour y hotel en el reporte. (DEC-191; pago único de 001/002)
- **RF-28:** EL SISTEMA excluirá nombres, contactos e identificadores de cliente, datos sensibles de tarjeta, credenciales y tokens de los indicadores, detalle y PDF de 011. (DEC-192; AC04/AC05; RN-18; número de reserva permitido por RF-26)
- **RF-29:** CUANDO se exporta una consulta, EL SISTEMA conservará en el PDF sus resultados, filtros, definiciones e instante de referencia oficiales. (DEC-193; HU-19)
- **RF-30:** SI aparecen datos nuevos o cambian después de la consulta, ENTONCES EL SISTEMA no los incorporará silenciosamente al PDF de esa consulta. (DEC-193)
- **RF-31:** SI no puede recuperarse el resultado consultado, ENTONCES EL SISTEMA informará del problema sin sustituirlo silenciosamente por otro cálculo. (DEC-193)
- **RF-32:** EL SISTEMA impedirá que cifras o importes manipulados en el dispositivo del usuario sustituyan los resultados oficiales del PDF. (RF16; HU-19)
- **RF-33:** CUANDO se solicita descargar el PDF, EL SISTEMA comprobará la autorización administrativa vigente antes de entregarlo. (RN-26; 005; AC04/AC05)
- **RF-34:** SI falla la generación del PDF, ENTONCES EL SISTEMA informará del fallo sin presentar un documento parcial como reporte completo. (HU-19; AC11)
- **RF-35:** SI un bloque no contiene registros conocidos que cumplan sus criterios, ENTONCES EL SISTEMA presentará sus indicadores en cero y su detalle vacío sin inventar registros. (RF16; definición de conjuntos y ausencia de datos)
- **RF-36:** SI no puede obtenerse un dato fuente necesario para calcular una cifra oficial, ENTONCES EL SISTEMA informará de su indisponibilidad sin sustituirlo por cero o descartar silenciosamente el registro. (RF16; AC09/AC11)
- **RF-37:** EL SISTEMA conservará la inclusión del historial seleccionado aunque su oferta, hotel o cliente hayan recibido baja lógica o desactivación. (RN-30; 001/006/007/008; DA08)
- **RF-38:** EL SISTEMA mostrará las bases temporales y definiciones del reporte sin etiquetar la diferencia de movimientos como ganancia o saldo bancario. (DEC-188/DEC-190/DEC-191; F12 §2.8)

## Requisitos no funcionales

- **Autorización/confidencialidad:** rol y estado actuales de 005; sin nombres, contactos, IDs de cliente o secretos en PDF, aunque una reserva pertenezca a una cuenta con baja lógica. Se permiten los números de reserva seleccionados por DEC-192. (RN-26; AC04/AC05)
- **Integridad histórica:** no recalcular precios, cambiar estados o escribir resultados financieros desde el reporte. (RP03; RN-30; 001/002)
- **Coherencia:** pantalla, resumen, desglose y detalle se calculan sobre una misma referencia conocida; el PDF la conserva. No implica que otra consulta posterior del mismo período arroje cifras iguales cuando apareció evidencia nueva. (DEC-193; AC09)
- **Fechas:** persistencia/conversión compatible con RP08, días completos Perú y criterio de fecha visible por bloque; nunca asumir la zona del navegador como autoridad.
- **Moneda:** presentar PEN contractual y cada moneda financiera identificable por separado. Una moneda anómala observada no autoriza nuevos pagos o conversión de divisas.
- **Ausencia de datos:** cero solo significa conjunto vacío conocido; fuente fallida o dato requerido faltante significa indisponibilidad, no cero. Un dato no exigido —por ejemplo huéspedes efectivos— no se inventa.
- **Comprobación:** fórmulas, duplicados, fechas y preservación del PDF deben contar con pruebas; no se afirma un SLA de generación o volumen ilimitado sin condiciones de medición. (AC09/AC11; ACL-15)

## Casos límite

| Caso | Resultado esperado | Criterios |
|---|---|---|
| Cliente intenta consultar/descargar | Acceso denegado | RF-1/RF-33 |
| Reserva con hotel, varios eventos y noches | Una reserva turística, un subconjunto hotelero; sin duplicar cantidades/dinero | RF-10–RF-15/RF-27 |
| Hotel aloja parte del grupo | No presentar el grupo completo como huéspedes efectivos | RF-17 |
| Reserva creada en enero, cobrada en febrero | En febrero entra el cobro; no inventar esa reserva en el listado de creadas de febrero | RF-7/RF-10/RF-18 |
| Cobro de enero devuelto en febrero | Devolución de febrero, posible diferencia negativa | RF-22/RF-23 |
| Mismo cobro por respuesta y varios eventos | Un movimiento confirmado | RF-18 |
| Dos cobros distintos, uno excedente | Dos movimientos reales; excedente marcado, devolución al ejecutarse | RF-18/RF-20/RF-22 |
| Cobro observado y tardío a la vez | Un total único; marcas de incidencia no sumables | RF-20 |
| Pago no confirmado o devolución desconocida | No sumar como hecho financiero confirmado | RF-19/RF-22/RF-24 |
| Monedas diferentes | Totales independientes, sin conversión | RF-21 |
| Reserva pendiente/cancelada con importe guardado | Importe histórico por estado, no ingreso | RF-11/RF-15/RF-16 |
| Cambio de catálogo o baja de cliente | Historial y cifras contratadas seleccionadas preservados, sin contactos personales | RF-4/RF-28/RF-37 |
| Filtro por hotel y oferta | Ambos sobre reserva relacionada, sin restringir movimientos a su fecha de creación | RF-6/RF-7 |
| Rango invertido o dato de filtro inválido | Validación, no reinterpretación silenciosa | RF-8 |
| Datos nuevos después de ver la consulta | PDF original sin cambio; actualizar reporte para otra referencia | RF-29/RF-30 |
| Referencia de consulta no recuperable | Error y nueva consulta explícita, sin cambio de cifras oculto | RF-31 |
| Pérdida de rol antes de descargar | Descarga denegada | RF-33 |
| PDF falla o fuente necesaria está indisponible | No documento parcial/cifra falsa como éxito | RF-34/RF-36 |
| Cero reservas, pero devoluciones de reservas anteriores | Bloque operativo vacío, financiero con sus movimientos reales | RF-10/RF-22/RF-35 |
| Ningún registro del período | Ceros, tablas/listado vacíos y PDF con período/filtros/definiciones | RF-26/RF-29/RF-35 |

## Fuera de alcance

- Ganancia, costos, impuestos, facturación fiscal, contabilidad bancaria o conciliación operativa que cambie resultados de 002.
- Pagos/devoluciones/cancelaciones, edición de reservas/clientes o reparación de auditoría desde indicadores.
- Inferir asistencia, huéspedes u ocupación real sin dato explícito; reserva hotelera independiente o reasignación de cupos.
- Prorratear cobros reales por componentes, convertir monedas o deducir comisiones al cliente.
- Datos personales/contactos de clientes o listado nuevo de todos los movimientos individuales en el PDF.
- Comparativas, tendencias, metas, previsiones o métricas distintas de las seleccionadas para esta versión.
- CSV/JSON de reportes, envío automático por correo, publicación pública o formatos adicionales. 010 conserva su CSV de clientes/auditoría.
- Mecanismos de persistencia/captura/generación, librería PDF, diseño exacto, paginación visual, índices, límites técnicos y caducidad de referencia: se definen en el plan posterior.
- Plan/tareas antes de aprobar esta spec, cambios en documentos previos, implementación, datos reales, commits o push.

## Criterios de finalización

### Documento

- Conservar RF16/HU-19 y RF-1–RF-38 locales con fuentes identificadas.
- Mantener explícitas las bases temporales diferentes y la separación de contrato/dinero/monedas.
- Registrar seis decisiones, contraste de fuentes y aprobación explícita antes de crear plan/tasks.

### Implementación futura

- Verificar estados, conteos distintos, viajeros turísticos y subtotales históricos sin doble conteo de alojamiento.
- Verificar todos los cobros confirmados, incidencias superpuestas, devoluciones de otro período y diferencias negativas por moneda.
- Verificar filtros compartidos sin convertir el bloque financiero en cohorte de reservas creadas en el período.
- Verificar listado completo sin datos personales, PDF de la consulta original, fuente autoritativa y permiso actual.
- Verificar vacíos, fuente fallida, datos requeridos faltantes y documentos incompletos sin éxito ficticio.

## Contraste con docs/01-analisis-de-sistema/

| Fuente | Cobertura y distinción |
|---|---|
| F01 §2 | Indicadores operativos/ventas y exportación exclusivos de administración. No se define una contabilidad fiscal por analogía. |
| F02 HU-19, §9 | Cálculo oficial en backend con datos persistidos, presentación de resultados y PDF. Cliente no accede al endpoint administrativo. P3 preservada. |
| F03 RF16; historial; RN-26 | Indicadores y exportación autorizados, sin datos financieros impuestos por la UI ni cambios en las fuentes. |
| F04 AC04/AC05/AC09/AC11 | Confidencialidad, definiciones/referencia visibles y resultados verificables, sin afirmar una medición ejecutada. |
| F05/F06/F07 | Historial, fechas y restricciones existentes respetados; no se selecciona stack, arquitectura o proveedor nuevo. |
| F12 §§2.8/5.6 | Su propuesta de separar reservas de pagos y evitar sumar intentos se mantiene. Cobros distintos anómalos sí cuentan como movimientos reales por elección explícita DEC-189; no se confunden con eventos repetidos. |
| Entrevista DEC-188–DEC-193 | Indicadores/desglose, base de dinero, período por movimientos, componentes contratados, listado sin contactos y PDF de la consulta son decisiones del usuario, no requisitos previamente cerrados en la fuente. |

No se detecta contradicción con el alcance original. PDF proviene de HU-19 y no se deroga por una propuesta de diseño; las definiciones concretas añadidas se aprueban con este documento mediante DEC-196.

## Dudas abiertas

- **RESUELTO POR ENTREVISTA:** alcance con oferta/alojamiento/viajeros, todos los cobros reales por moneda, fechas propias por movimiento, contrato separado por componente, listado sin contactos y PDF idéntico a la consulta de referencia.
- **PRECISIONES TRAZADAS:** días completos Perú, filtros de oferta/hotel combinados, estados conocidos a referencia, cero frente a indisponibilidad, no inferencia de huéspedes y categorías de incidencia no sumables evitan ambigüedades de los indicadores elegidos; no se presentan como preguntas adicionales contestadas.
- **PENDIENTE DEL PLAN:** lectores de datos/fechas de operación confirmadas de 002, coherencia de captura/pantalla/PDF, método de generación, librería, presentación/paginación, retención de referencia y pruebas de volumen. No se adivinan fechas o cantidades que una fuente no pueda acreditar.
- **LÍMITE:** 011 no cambia reglas, estados, pagos/devoluciones, precios o privacidad de las specs aprobadas ni usa un dato no capturado para prometer ocupación real.
- **APROBACIÓN REGISTRADA:** documento v0.1 con 38 criterios mediante DEC-196; conserva las comprobaciones técnicas y no autoriza implementación.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1, con 38 criterios.
- **Aprobación explícita del documento completo:** sí; respuesta «si» a la pregunta que enumeró expresamente 011 v0.1 y 012 v0.1 para continuar con sus planes y tareas documentales.
- **Fecha de aprobación:** 2026-11-02; DEC-196.
- **Decisiones de entrevista:** DEC-188–DEC-193, registradas el 2026-11-02; no equivalen a aprobar la spec completa.
- **Preservación:** todas las specs y planes previos intactos; no se modifican fuentes originales.
- **Plan/tareas al registrar aprobación:** no creados; continuación posterior registrada separadamente. Sin consultas/exportaciones reales, código, infraestructura, commits ni push.
