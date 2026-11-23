# Plan técnico — Spec 011: Indicadores y reportes

> **Fecha:** 2026-11-02. **Versión del plan:** 0.1.  
> **Base:** [spec v0.1 aprobada](spec.md), 38 criterios, DEC-196; definiciones DEC-188–DEC-193.  
> **Estado:** propuesta técnica **NO EJECUTADA**. Autorización documental en DEC-198, no código, consultas o exportaciones reales.  
> **Directorio:** `Desktop\DMGoTravelll\sdd`. Specs y planes anteriores intactos; sin instalación, infraestructura, pagos, datos reales, commits ni push.

## 1. Objetivo y fuentes

Planificar cálculo oficial de indicadores y PDF de la misma consulta, separando reservas/contratos de movimientos monetarios. Preservar `011/RF-1–RF-38`, sin prorratear dinero por componentes, mezclar monedas, presentar utilidad o admitir cambios de negocio desde un reporte.

Fuentes: [constitución](../../constitution.md), [decisiones](../../decisiones.md), [trazabilidad](../../trazabilidad.md), [fuentes](../../fuentes.md), RF16/HU-19, RN-26, AC04/AC05/AC09/AC11 y contratos de 001/002/005/006/007/008/009/010. [010 plan](../010-clientes-auditoria/plan.md) sirve de referencia para copias/artefactos privados, no autoriza reutilizar su regla de máscara de clientes sobre los datos de reserva de 011.

## 2. Dependencias y contrato de cálculo

| Origen | Datos que aporta | Prohibición/puerta |
|---|---|---|
| 001/009 | IDs, creación, estado actual a referencia, cantidades y componentes/horarios/importes históricos | No recalcular con oferta actual, reconstruir estado al cierre del período sin mandato o duplicar reserva por noches/eventos. |
| 002 | Cobro real confirmado, ID externo estable, importe/moneda/fecha de operación confirmada; ejecución de devolución y sus fechas/referencias | No contar callbacks o intentos como dinero; no adivinar fecha de ejecución ni usar detección/autorización como devolución realizada. |
| 006/007 | Identidad histórica de oferta principal/hotel y contratos de lectura | No excluir historia porque se desactivó el recurso ni calcular huéspedes efectivos a partir de capacidad/grupo turístico. |
| 005/008 | Administrador vigente y contexto de cuenta/privacidad | No datos personales/ID de cliente en resultado/PDF ni permiso guardado como autorización perpetua de descarga. |
| 010 | Política de evidencia/historial y lectura sin mutaciones | Reportes no repara auditoría ni ejecuta sus operaciones de origen. |

Las fechas necesarias de Payments deben acreditarse con su contrato, no suponerse por el nombre de una columna. Si una fuente requerida no está disponible/incompleta, el reporte falla o indica indisponibilidad sin un total falso; distinguirlo de un conjunto conocido vacío.

## 3. Poblaciones independientes y agregación

Normalizar rango de días inclusivos `America/Lima` a un intervalo UTC de inicio inclusivo y comienzo del día siguiente al final exclusivo. Fines de semana/feriados son días incluidos: el calendario hábil de devolución de 002 no filtra estos movimientos. Validar formato/orden y filtros de oferta/hotel exactos, combinados mediante AND.

Definir un predicado común de identidad histórica de oferta/hotel y **tres conjuntos diferentes** bajo una misma vista de datos:

1. **Reservas:** IDs distintos creados en el período y del predicado común. Estado conocido a la referencia; los cuatro estados permitidos, viajeros turísticos una vez por reserva y componentes históricos separados.
2. **Cobros:** IDs de transacción real confirmada cuya fecha propia está en el período y cuya reserva relacionada cumple el predicado, aunque se creara antes. No unirlos solo al conjunto 1.
3. **Devoluciones:** ejecuciones confirmadas distintas cuya fecha propia está en el período y cuyo cobro/reserva cumplen el predicado, aunque esos hechos sean anteriores. No limitarlas a los cobros del conjunto 2.

Deduplicación de evento y de transacción no son equivalentes. Una respuesta y tres callbacks del mismo cobro suman una vez; dos cobros reales distintos suman dos, aunque uno sea excedente. Marcas tardío/excedente/observado pueden solaparse: sus subtotales se muestran no sumables y el total monetario usa transacciones distintas.

Por moneda, sumar importes exactos de cobros/devoluciones y restar ejecuciones, sin clamp de negativos, conversión, comisiones o gastos inventados. Conservar unidad/precisión del contrato de origen; no `float`, parseo de texto localizado o redondeo por fila que altere el total. Una moneda anómala se separa de PEN, no se convierte en otra moneda comercial admitida.

En reservas: total por estados reconcilia con total de IDs; oferta principal particiona esas reservas, hotel es subconjunto y no se añade como otra reserva global. Subtotal turístico + hotelero reconcilia con total contratado de cada reserva; no volver a sumar ese total en ambos componentes. Mantener por estado la etiqueta de importe histórico, incluido `pending`/`cancelled`, no efectivo cobrado. No calcular ocupación/huéspedes si la fuente no lo captura.

## 4. Resultado oficial consultado y PDF de referencia

Proponer un **resultado de reporte inmutable** con ID, propietario autorizado, filtro normalizado, versión de definiciones, referencia, agregados por estado/servicio/moneda y todas las filas permitidas de reservas. Separar metadata operativa de datos presentables; no serializar entidades completas o callbacks.

Capturar/calcular bajo un contexto coherente PostgreSQL, propuesta `REPEATABLE READ` para los lectores de los tres conjuntos. Persistir agregados/filas/manifest y marca de resultado completo antes de presentar la consulta como lista para exportar. El punto de referencia corresponde a esa vista, no al arranque posterior de un worker o a un timestamp del cliente.

No basta `createdAt <= referenceAt`: una actualización de estado o un resultado financiero incorporado después con fecha anterior puede cambiar la respuesta. El PDF usa el resultado confirmado, no reconsulta los orígenes. Si una captura falla, no crear otra vista con la misma referencia; si se pierde la respuesta del commit, verificar por operación idempotente antes de repetir.

La interfaz puede paginar el listado para visualizarlo, propuesta 25 filas/máximo 100 por petición; **el PDF incluye todas las filas** capturadas. Cambiar filtros o actualizar crea una referencia nueva. Una referencia expirada/no recuperable produce error y actualización explícita, nunca recalcula con información nueva bajo el identificador antiguo.

Proponer disponibilidad temporal de resultado/artefacto de 24 horas desde completo, limpieza solo de metadata/copias/archivos de reportes. No borra fuentes o auditoría ni establece una conservación contable del PDF no solicitada. Validar carga/MVCC/capacidad antes de habilitar; ningún límite técnico produce truncamiento silencioso o un resultado parcial presentado como completo.

## 5. Motor PDF, licencias y fuentes

Lectura pública el **2026-11-02**, sin instalar paquetes:

| Referencia | Evidencia | Consecuencia |
|---|---|---|
| [Licencia PDFsharp/MigraDoc](https://docs.pdfsharp.net/General/License/License.html) | La página declara AGPL/comercial desde 6.5.0 y 7.0.0 Preview 2; MIT de otros proyectos/ejemplos no equivale a licencia de la biblioteca. | Familia candidata, **no elección libre de obligaciones**. Verificar versión/licencia/compatibilidad y aprobación legal/económica si aplica; no publicar código, comprar licencia o fijar una versión vieja solo para eludir el análisis. |
| [Font resolving](https://docs.pdfsharp.net/PDFsharp/Topics/Fonts/Font-Resolving.html) | Core requiere resolver fuentes de forma portable; Windows/GDI/WPF no garantiza funcionamiento en Linux/Docker. | Proveer fuentes redistribuibles verificadas y resolverlas explícitamente, no descargar fuentes remotas o depender de las del PC del desarrollador. |

Propuesta: adaptador de generación PDF local en Infrastructure, con biblioteca mantenida y licencia verificadas antes de ejecución. PDFsharp/MigraDoc Core es una candidata evaluable; la selección final no se da por cerrada si sus condiciones no son compatibles. No sustituir el PDF por CSV ni introducir un servicio SaaS pagado sin autorización.

Formato propuesto: resumen de período/filtros/referencia/definiciones, tablas operativas/contratadas, bloque financiero separado por moneda e incidencias, seguido del listado completo de reservas. A4, detalle apaisado si hace falta, cabeceras repetidas y pies de página, sin omitir columnas o filas por falta de espacio. Unicode/tildes, fechas con zona y precisión monetaria preservados. No nombres/contactos/ID de cliente, tarjetas, credenciales, scripts, enlaces de acceso o imágenes remotas no solicitadas.

Renderizar desde modelos tipados/texto escapado, no HTML o cifras proporcionados por el navegador. Un nombre de oferta/hotel largo es dato, no instrucciones para descargar recursos o ejecutar marcado. Validar extracción de texto, páginas/listado y consistencia de sumas del PDF respecto del resultado persistido; no basta que exista un archivo con extensión `.pdf`.

## 6. Generación, almacenamiento y entrega

Mantener monolito/Capas/CQRS documentados. Lectores y cálculos en Application, generador/almacenamiento en Infrastructure y consultas/descargas administrativas en Presentation. No HTTP interno entre módulos, acceso a repositorios ajenos, disco local durable, broker ni un servicio nuevo.

Proponer una captura concurrente y dos workers de PDF, lotes de 1.000 filas, a medir como parámetros técnicos y no máximos comerciales. Generación diferida solo después de poseer la copia completa; saturación no se oculta aceptando un trabajo que después calcule una vista distinta. Proponer artefactos privados en bloques PostgreSQL, compatibles con la estrategia temporal de 010 pero con identidad/modelo/permiso de Reportes propios.

Crear el documento completo y su manifest —resultado, versión de plantilla/definiciones, cantidad de reservas, bytes/huella— antes de marcarlo listo. Fallo/cancelación de proceso no publica el prefijo como archivo final. Reintentar renderizado desde el mismo resultado, no repetir movimientos financieros o recalcular con otra fuente. No mantener la transacción de captura abierta durante renderizado/descarga.

Validar administrador/familia/rol actuales y autorización de la referencia antes de entregar. Ni el ID de reporte ni una URL pública/firmada sustituyen ese control posterior. `application/pdf`, nombre seguro, tamaño conocido, caché privada/no-store y referencia visibles; no declarar que el usuario recibió un archivo completo por iniciar la transferencia.

Una baja de cliente posterior no elimina reservas históricas del reporte ni obliga a aplicar la máscara de cliente de 010 a su listado: **011 ya excluye identidad/contactos del cliente**. No reutilizar un helper genérico que borre fechas/importes permitidos por confundir el tipo de exportación. El permiso del administrador sí debe ser actual.

## 7. API, observabilidad y pruebas

Proponer consulta/creación de resultado oficial, lectura paginada de detalle, solicitud/estado de PDF y descarga. OpenAPI/ProblemDetails distingue selección inválida, fuente indisponible, referencia no recuperable/expirada, archivo no listo/fallido y acceso denegado. El cuerpo del cliente contiene selección/referencia, no agregados, tipos de cambio o estado objetivo de reserva.

La UI presenta cero solo para conjuntos conocidos vacíos; fuente fallida no es cero. Mostrar que un movimiento puede proceder de reserva de otro período, que incidencias se solapan, que estado es a referencia y que contrato no es efectivo. No añadir acciones de conciliación/reparación o mutación desde el reporte.

Pruebas futuras: reserva enero/cobro febrero; devolución febrero/cobro enero con diferencia negativa; dos transacciones distintas frente a callbacks duplicados; moneda observada separada; hotel parcial sin imputar huéspedes; estado/catálogo/cuenta cambiados después; evidencia financiera tardía con fecha anterior; fuente requerida ausente; Unicode/multipágina/PDF completo; referencia vencida y rol retirado.

Medir duración de captura/cálculo/renderizado, presión MVCC/almacenamiento y colas sin PII en logs. No prometer un SLA o archivo infinito sin capacidad verificada. Ninguna prueba de implementación se ejecuta con estos documentos.

## 8. Puertas y entregables

[tasks.md](tasks.md): **T011-01–T011-28**, todas pendientes, con matriz RF-1–RF-38.

1. **Q-01 Datos/definiciones:** contratos de fechas/estados/importes y unicidades por origen, sin conjeturas o cohortes mezcladas.
2. **Q-02 Captura/cálculo:** referencia coherente, tres poblaciones correctas, precisión/reconciliación y no cambio de resultado durante PDF.
3. **Q-03 Privacidad/entrega:** sin datos de cliente o cifras de dispositivo, permiso actual y archivo íntegro/privado.
4. **Q-04 Motor/legal/runtime:** biblioteca/versión/licencia y fuentes redistribuibles, Linux/Docker, seguridad y multipágina verificados. Lectura pública no equivale a elección o autorización económica.
5. **Q-05 Capacidad/recuperación:** copia/artefacto completo, fallo/expiración sin recálculo oculto ni truncamiento.
6. **Q-06 Autorización:** actividad posterior explícita para código/datos/proveedores; no consultas, PDF real o producción por aprobar spec/plan.
