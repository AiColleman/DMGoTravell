# Spec 009 - Consulta y operación administrativa de reservas

> **Estado:** aprobada v0.2; **APROBADA** el 2026-11-01 mediante DEC-172, con 37 criterios.  
> **Versión:** 0.2, 2026-11-01; 37 criterios. Cierre por delegación en DEC-170 y [matriz de cierre](../../cierre-dependencias-002.md).  
> **Requisitos de origen:** RF14; HU-16 y HU-17; RN-23, RN-24, RN-26 y RN-28. Se conservan sus identificadores.  
> **Fuentes:** F01 §2; F02 §7; F03 §§1/3/4; F04 AC05/AC07/AC09/AC10/AC11; F05 RS03/RS05/RP01/RP08; F06 DA08; 001 Reservas v0.13; 002 Pagos v0.6; 003 Vencimiento v0.1; 004 Notificaciones v0.1; 005 Identidad v0.1; DEC-149–DEC-154.  
> **Dependencias:** 001 v0.13, 002 v0.7, 003 v0.1, base 004 v0.1 y su complemento v0.1, 005 v0.1, 007 v0.2 y 010 v0.3 aprobadas. Fuentes de la revisión: DEC-170 y matriz de cierre. Esta aprobación no habilita implementación ni cierra las comprobaciones técnicas.

## Resumen para revisión

- El administrador consulta todas las reservas con paginación y filtros por estado, fecha de creación, cliente, identificador y oferta.
- El detalle muestra reserva, cliente, oferta, fechas, viajeros, importes, estado, pago y devolución; no muestra datos sensibles de tarjeta.
- El administrador solo aplica dos transiciones: `confirmed → completed` y `confirmed → cancelled`.
- No puede confirmar ni cancelar una reserva `pending`; esa salida pertenece al pago, al cliente o al vencimiento.
- Una reserva `completed` o `cancelled` es terminal; no se reactiva.
- La cancelación administrativa solo procede antes del inicio del servicio, exige motivo y genera devolución total.
- La devolución usa el flujo de 002; no se ejecuta sin confirmación administrativa ni se duplica.
- El cliente recibe un aviso por 004 con el motivo y el estado de la devolución; si el envío falla, no se revierte la cancelación y 004 reintenta/alerta.
- Toda transición se audita con actor, estado anterior, estado nuevo, motivo, devolución y fecha; el registro es inmutable desde la aplicación.
- La cancelación conserva el historial y libera una sola vez los recursos comprometidos por esa reserva; no espera al abono de la devolución.

Este resumen no sustituye los criterios ni constituye aprobación. DEC-170 completa la liberación de recursos y la definición de inicio/finalización como reglas funcionales de 009, sin modificar 001/007. Solo los mecanismos y el tamaño de página quedan para el plan.

## Contexto y objetivo

HU-16 exige que el administrador consulte todas las reservas para organizar la operación. HU-17 exige gestionar el estado operativo de reservas confirmadas: `confirmed → completed` al finalizar el servicio y `confirmed → cancelled` con la política de devolución. La fuente prohíbe usar un cambio manual para sustituir la confirmación del pago.

La política de cancelación de una reserva confirmada estaba pendiente en 002/ACL-02. Esta spec la cierra para el caso administrativo: cancelación antes del inicio del servicio, con motivo obligatorio y devolución total. No define la validación del pago (002), el vencimiento automático (003), la entrega de correos (004), la identidad (005), la consulta de auditoría (010) ni los reportes (011).

**Contratos de cierre:** el [complemento separado de 004](../004-notificaciones/complemento-contratos.md) define el aviso de cancelación sin modificar su base aprobada. 009 define la liberación de recursos de una reserva confirmada cancelada como un alcance adicional, no como contenido atribuido retrospectivamente a 007. Ambas revisiones quedaron aprobadas mediante DEC-172/DEC-173. 010 v0.3 conserva su aprobación; quedan integración y pruebas.

El objetivo es que la operación administrativa sea acotada, segura, trazable y consistente con los estados aprobados de 001. El administrador no debe poder "arreglar" un pago pendiente cambiando el estado a mano.

## Usuarios / actores

- **Administrador (`admin`):** consulta reservas, aplica transiciones válidas, registra motivo y confirma devoluciones según 002.
- **Cliente propietario:** no accede a la consulta administrativa; recibe el aviso de cancelación y devolución.
- **Sistema:** valida estado, corte, concurrencia, motivo, devolución y auditoría.
- **Pago (002):** confirma pagos y ejecuta devoluciones; no se sustituye desde 009.
- **Vencimiento (003):** cancela reservas `pending` por plazo; no se sustituye desde 009.
- **Notificaciones (004):** entrega el aviso al cliente.
- **Auditoría (010):** consulta los registros generados por 009.

## Historias de usuario

Fuente: F02 §7. Se conservan identificadores y prioridades originales.

- **HU-16:** Como administrador, quiero consultar todas las reservas para organizar la operación. (P2)
  - La API devuelve datos paginados.
  - Permite filtrar por estado y otros criterios definidos.
  - Requiere rol `admin`.
- **HU-17:** Como administrador, quiero gestionar el estado operativo de las reservas confirmadas. (P2)
  - Una reserva `confirmed` puede pasar a `completed` cuando el servicio finaliza.
  - Una cancelación posterior al pago sigue la política de devolución definida.
  - No se permite `pending → confirmed` manualmente sin pago validado.

## Requisitos funcionales (criterios de aceptación en EARS)

### Consulta administrativa

- **RF-1:** CUANDO un administrador autenticado consulta reservas, EL SISTEMA devolverá todas las reservas en páginas ordenadas por fecha de creación descendente. (RF14; HU-16; 001/DEC-035–DEC-037)
- **RF-2:** EL SISTEMA permitirá filtrar por estado, rango de fecha de creación, correo o identificador del cliente, identificador de reserva y tour o hotel. (RF14; HU-16; DEC-154)
- **RF-3:** SI la página solicitada es inválida, ENTONCES EL SISTEMA devolverá un error explícito; si no hay resultados, devolverá una página vacía sin error. (HU-16; 001/DEC-035–DEC-037)
- **RF-4:** CUANDO el administrador consulta el detalle de una reserva, EL SISTEMA mostrará reserva, cliente, oferta, fechas, viajeros, importes históricos, estado, pago y devolución. (RF14; HU-16; 001)
- **RF-5:** EL SISTEMA exigirá rol `admin` para la lista, el detalle y las transiciones; un cliente no accederá a la consulta administrativa. (RN-26; RS03; 005)
- **RF-6:** EL SISTEMA no mostrará datos sensibles de tarjeta en la lista ni en el detalle. (RN-18; RS07)

### Transiciones válidas

- **RF-7:** CUANDO una reserva está `confirmed` y el servicio finalizó, EL SISTEMA permitirá al administrador cambiarla a `completed`. (RF14; HU-17; RN-23)
- **RF-8:** CUANDO una reserva está `confirmed` y aún no inició el servicio, EL SISTEMA permitirá al administrador cambiarla a `cancelled` con motivo. (RF14; HU-17; RN-24; DEC-149/DEC-151/DEC-153)
- **RF-9:** EL SISTEMA no permitirá que el administrador confirme ni cancele manualmente una reserva `pending`; esa salida pertenece a 001, 002 o 003. (RF14; HU-17; F03 §4; DEC-149)
- **RF-10:** EL SISTEMA no permitirá reactivar una reserva `cancelled` ni modificar una reserva `completed`; ambos estados son terminales. (RN-23; 001; DEC-149)
- **RF-11:** SI el servicio ya inició, ENTONCES EL SISTEMA rechazará la cancelación administrativa y solo permitirá marcarlo como `completed` cuando corresponda. (HU-17; DEC-151)
- **RF-12:** SI la reserva cambió de estado antes de aplicar la transición, ENTONCES EL SISTEMA rechazará la operación sin efectos parciales. (AC07; 001)
- **RF-13:** CUANDO se repite una transición ya aplicada, EL SISTEMA no duplicará la devolución, el aviso ni la auditoría. (AC07; 002; DEC-149)

### Cancelación y devolución

- **RF-14:** EL SISTEMA exigirá un motivo para cancelar una reserva confirmada y lo conservará con actor, fecha y reserva. (HU-17; DEC-153)
- **RF-15:** CUANDO el administrador cancela una reserva confirmada antes del inicio del servicio, EL SISTEMA generará una devolución total del importe confirmado, sin penalidad; si existe discrepancia de importe o moneda, prevalece el tratamiento de 002. (RN-24; DEC-150)
- **RF-16:** CUANDO se abre el caso de devolución por cancelación administrativa, EL SISTEMA exigirá revisión, confirmación e inicio administrativo mediante 002 en máximo un día hábil desde la detección del caso, sin prometer el abono en ese plazo. (RN-24; DEC-017/DEC-121; 002/RF-37–RF-47; precisión de DEC-170)
- **RF-17:** EL SISTEMA no reactivará la reserva, no generará un nuevo cobro y conservará la reserva, el pago y la auditoría como historial. (RN-24; 002; DEC-150)
- **RF-18:** CUANDO se cancela administrativamente una reserva confirmada, EL SISTEMA enviará al cliente un aviso por 004 con el motivo y el estado de la devolución; si el envío falla, no revertirá la cancelación y 004 reintentará o alertará según su contrato. (DEC-152; 004)
- **RF-19:** SI la devolución falla o queda con resultado desconocido, ENTONCES EL SISTEMA mantendrá el caso abierto y alertará al administrador según 002. (RN-24; 002/RF-43)
- **RF-20:** EL SISTEMA rechazará la cancelación administrativa por 009 desde el inicio del servicio. (DEC-151; no impide devoluciones por cobros tardíos, duplicados u observados de 002)

### Finalización, auditoría y límites

- **RF-21:** CUANDO el administrador marca una reserva como `completed`, EL SISTEMA no generará devolución ni alterará el pago confirmado. (HU-17; RN-23)
- **RF-22:** EL SISTEMA auditará cada transición con actor, reserva, estado anterior, estado nuevo, motivo, devolución, fecha y resultado; el registro será inmutable desde la aplicación. (RN-28/RN-29; AC09)
- **RF-23:** EL SISTEMA no permitirá editar importes, fechas, viajeros, oferta ni datos históricos desde 009. (RN-02; 001)
- **RF-24:** EL SISTEMA no permitirá que un administrador use una transición para sustituir la validación de pago, el vencimiento o una devolución de 002/003. (F03 §4; RN-14; 002/RF-15)

### Cierre de inicio, finalización, recursos y consultas

- **RF-25:** CUANDO una reserva incluye más de un componente, EL SISTEMA considerará inicio del servicio el instante contratado más temprano entre la actividad turística y el alojamiento. (DEC-151; precisión adoptada por delegación DEC-170)
- **RF-26:** MIENTRAS no hayan terminado los períodos contratados de todos los componentes de la reserva, EL SISTEMA impedirá marcarla como `completed`. (HU-17; DEC-170)
- **RF-27:** CUANDO el administrador marca una reserva como `completed`, EL SISTEMA exigirá su confirmación expresa de que todos los servicios finalizaron. (HU-17; RN-28; DEC-170)
- **RF-28:** CUANDO se aplica una cancelación administrativa válida, EL SISTEMA liberará los cupos turísticos comprometidos por esa reserva. (RN-07/RN-24; ampliación de 009 por DEC-170)
- **RF-29:** CUANDO se aplica una cancelación administrativa válida con alojamiento, EL SISTEMA liberará el inventario hotelero comprometido por esa reserva durante su período contratado. (RN-11/RN-24; ampliación de 009 por DEC-170)
- **RF-30:** CUANDO se repite una cancelación administrativa ya aplicada, EL SISTEMA impedirá una segunda liberación de recursos. (RF-13; DEC-170)
- **RF-31:** SI no puede completarse el conjunto local de cancelación, liberación, apertura del caso de devolución y auditoría, ENTONCES EL SISTEMA no aplicará cambios parciales a la reserva. (AC07; 010/RF-36; DEC-170)
- **RF-32:** SI la devolución externa falla después de una cancelación aplicada, ENTONCES EL SISTEMA conservará la reserva cancelada con sus recursos liberados y el caso de devolución abierto. (002/RF-43; DEC-170)
- **RF-33:** CUANDO el administrador aplica varios filtros a reservas, EL SISTEMA devolverá únicamente coincidencias que cumplan todos los filtros elegidos. (DEC-154; precisión de DEC-170)
- **RF-34:** CUANDO se filtra por fecha de creación, EL SISTEMA incluirá los días extremos completos del rango en hora de Perú. (DEC-154; precisión de DEC-170)
- **RF-35:** CUANDO se filtra por correo del cliente, EL SISTEMA admitirá coincidencia parcial sin distinguir mayúsculas después de retirar espacios exteriores. (DEC-154; precisión de DEC-170)
- **RF-36:** CUANDO dos reservas tienen la misma fecha de creación, EL SISTEMA las ordenará por identificador único descendente como desempate. (RF-1; criterio propio de 009 adoptado en DEC-170)
- **RF-37:** SI el motivo de cancelación queda vacío al retirar espacios exteriores, ENTONCES EL SISTEMA rechazará la cancelación. (DEC-153; precisión de DEC-170)

La cancelación solo se admite estrictamente antes del inicio; en el instante exacto ya se rechaza. Para una reserva simple, inicio y fin son los de la actividad turística contratada; para una compuesta, se utiliza el inicio más temprano y el fin más tardío de sus componentes históricos, no los horarios actuales del catálogo. La confirmación del administrador para `completed` se conserva con actor y fecha conforme a RF-22; el paso del tiempo por sí solo no completa la reserva. Si faltan datos históricos para comprobar el inicio/fin, se rechaza la transición sin inventar fechas ni modificar esos datos desde 009.

La liberación afecta únicamente al compromiso de la reserva cancelada, no aumenta la capacidad total del catálogo ni duplica inventario por salida. Cancelación, liberación y apertura del caso son efectos locales conjuntos; el abono por el proveedor es posterior y no forma parte de esa garantía local. No se envía una devolución por una cancelación local que no se aplicó. Estas reglas no reabren la cancelación de `pending` por el administrador ni modifican 003.

Los identificadores y opciones de estado/tour/hotel se comparan exactamente; filtros textuales vacíos se omiten y fechas inválidas o invertidas se rechazan. Extremos de fecha omitidos expresan rangos abiertos. Una página válida vacía no se sustituye por otra. No se habilita búsqueda de clientes de baja por su correo oculto: se conserva el acceso a sus reservas por identificador conforme a la protección de 010, sin borrar datos históricos.

## Requisitos no funcionales

- **AC05/RS05:** el cliente no accede a la lista ni al detalle administrativo; el administrador ve datos de clientes solo para la operación. (F04 AC05; F05 RS05)
- **AC07:** los efectos locales de RF-31 no dejan cambios parciales; la devolución externa conserva su resultado y su caso independiente según RF-32. La concurrencia se verifica con pruebas de integración, no solo con dobles. (F04 AC07; DEC-170)
- **AC09/RN-28:** la auditoría permite reconstruir la transición, el motivo, la devolución y el aviso; los logs técnicos no sustituyen la auditoría. (F04 AC09; RN-28)
- **AC10:** la lista y el detalle muestran `pending`, `confirmed`, `completed` y `cancelled` sin ambigüedad; no se crean estados nuevos. (F04 AC10; 001)
- **AC11:** las reglas de transición y corte se prueban sin depender de servicios externos; la devolución se prueba con el contrato de 002. (F04 AC11)
- **RP01/RP08:** reservas, transiciones y auditoría se persisten en PostgreSQL; las fechas se almacenan en UTC y el corte de servicio se interpreta en hora de Perú. (F05 RP01/RP08)
- **RS03:** todos los endpoints administrativos exigen rol `admin`. (F05 RS03; 005)
- **Rendimiento:** no se fija una latencia sin volumen y condiciones de medición; tamaño de página, medición e índices se concretan en el plan. (AC01; ACL-15)

## Casos límite

| Caso | Resultado | Criterio |
|---|---|---|
| Admin consulta todas las reservas | Lista paginada y ordenada | RF-1 |
| Filtro sin resultados | Página vacía, sin error | RF-3 |
| Página inválida | Error explícito | RF-3 |
| Cliente intenta acceder a la lista admin | Se rechaza | RF-5 |
| Reserva `confirmed` con servicio finalizado | Puede pasar a `completed` | RF-7 |
| Reserva `confirmed` antes del inicio | Puede cancelarse con motivo y devolución total | RF-8/RF-14/RF-15 |
| Reserva `pending` | No se confirma ni cancela manualmente | RF-9 |
| Reserva `completed` | No se cancela ni reactiva | RF-10/RF-20 |
| Reserva `cancelled` | No se reactiva | RF-10 |
| Servicio ya iniciado | No se cancela; solo se completa cuando corresponda | RF-11 |
| Cambio concurrente de estado | Se rechaza sin efectos parciales | RF-12 |
| Transición repetida | No duplica devolución, aviso ni auditoría | RF-13 |
| Cancelación sin motivo | Se rechaza | RF-14 |
| Devolución fallida | Caso abierto y alerta al admin | RF-19 |
| Admin intenta editar importes o fechas | Se rechaza | RF-23 |
| Admin intenta confirmar un pago pendiente | Se rechaza | RF-24 |
| Alojamiento inicia antes del tour | Ese inicio marca el corte de cancelación de toda la reserva | RF-25 |
| Tour terminó pero el alojamiento sigue vigente | No se admite `completed` todavía | RF-26 |
| Períodos contratados terminados sin confirmación del admin | No se completa automáticamente | RF-27 |
| Fallo local durante cancelación/liberación/caso/auditoría | Sin cambios parciales ni devolución por cancelación no aplicada | RF-31 |
| Fallo externo de devolución después de cancelar | Reserva cancelada, recursos liberados y caso abierto | RF-32 |
| Motivo con solo espacios | Cancelación rechazada | RF-37 |

## Fuera de alcance

- Validación y confirmación de pagos: corresponden a 002.
- Vencimiento automático y liberación de reservas `pending`: corresponden a 003.
- Entrega de correos: corresponde a 004.
- Identidad, roles y seed administrativo: corresponden a 005.
- Consulta, filtros y exportación de auditoría: corresponden a 010.
- Indicadores y reportes: corresponden a 011.
- Edición de importes, fechas, viajeros, oferta o datos históricos.
- Confirmación manual de reservas `pending`.
- Reactivación de reservas canceladas o modificación de completadas.
- Nuevos estados, pagos parciales o penalidades no aprobadas.
- Modificar capacidades totales o políticas aprobadas de inventario de 007; 009 solo libera el compromiso de su cancelación válida conforme a RF-28–RF-31.
- Ampliación de 004 para el aviso de cancelación administrativa: 009 lo exige, pero 004 v0.1 no lo define.

## Criterios de finalización

### Documento

- Mantener RF-1–RF-37 numerados y trazados a RF/HU/RN/DEC o specs dependientes.
- Conservar la diferencia entre operación administrativa (009), pago (002), vencimiento (003), notificación (004), identidad (005) y auditoría consultable (010).
- No convertir el tamaño de página, los índices ni la plantilla de aviso en criterios funcionales.
- Presentar la spec completa y registrar aprobación explícita antes de crear plan/tareas.

### Implementación futura

- Verificar lista, paginación, filtros, orden y detalle.
- Verificar acceso solo `admin` y ausencia de datos sensibles.
- Verificar `confirmed → completed` y `confirmed → cancelled` antes del inicio.
- Verificar rechazo de `pending → confirmed/cancelled`, de reactivación y de cancelación tras el inicio.
- Verificar concurrencia, idempotencia y ausencia de efectos parciales.
- Verificar motivo obligatorio, devolución total, flujo de 002 y aviso de 004.
- Verificar que un fallo de devolución mantenga el caso abierto y alerta.
- Verificar auditoría de transición, motivo, devolución y aviso.
- Verificar que no se editen importes, fechas, viajeros, oferta ni datos históricos.
- Verificar el corte por primer componente y la finalización por todos los componentes, incluida la confirmación expresa del administrador.
- Verificar liberación local conjunta e idempotente, sin esperar el abono ni reactivar por un fallo externo.
- Verificar filtros, orden/desempate, páginas vacías y motivo no vacío sin copiar mensajes ajenos.

## Contraste con docs/01-analisis-de-sistema/

| Fuente | Resultado de revisión |
|---|---|
| F01 §2; F02 HU-16/HU-17 | Se conservan acceso `admin`, consulta paginada y únicamente transiciones válidas de reservas confirmadas. |
| F03 RF14, RN-14/RN-23/RN-24 y §4 | No hay confirmación manual de `pending`, reapertura de estados terminales ni cancelación del cliente de una confirmada. |
| F03 RF22; RN-07/RN-11–RN-13 | RF22 original exige liberar reservas pendientes; la liberación de confirmadas de esta revisión es ampliación de 009 por delegación, no una obligación original atribuida falsamente a RF22 o a 007. |
| F04 AC07/AC09 | Consistencia del conjunto local y auditoría, sin prometer atomicidad sobre el reembolso externo. |
| F05/F06/F07 | Se conservan autorización, historial, fechas y ADR; mecanismos y pruebas pertenecen al plan posterior. |

Las precisiones de inicio/fin compuesto, liberación y filtros se adoptaron por DEC-170 y se aprobaron con esta versión mediante DEC-172. No se modifica otra spec aprobada ni se reduce la política de devolución total ya elegida.

## Dudas abiertas

- **LÍMITE:** DEC-150 fija devolución total antes del inicio; el importe se toma del pago confirmado y el flujo concreto es el de 002.
- **RESUELTO POR DELEGACIÓN — DEC-170:** inicio por el primer componente, finalización después de todos y confirmación expresa del administrador; corte exacto sin tolerancia.
- **RESUELTO POR DELEGACIÓN — DEC-170:** liberación idempotente y conjunta con la cancelación local; un fallo de devolución no retiene recursos ni reactiva. No se atribuye esta ampliación de 009 a una regla previamente aprobada de 007.
- **RESUELTO POR DELEGACIÓN — DEC-170:** filtros por creación, días completos inclusivos en hora de Perú, combinación de todos, correo parcial y desempate estable. El tamaño de página queda en el plan.
- **CONTRATO FUNCIONAL APROBADO:** [complemento 004 v0.1](../004-notificaciones/complemento-contratos.md), DEC-173, define el aviso de cancelación y devolución sin modificar la base 004 v0.1.
- **CONTRATO FUNCIONAL APROBADO:** 002 v0.7, DEC-171, define el flujo de devolución y el plazo de inicio de un día hábil; su aprobación es expresa, no inferida por referencia.
- **CONTRATO FUNCIONAL APROBADO:** 010 v0.3 define consulta/exportación y auditoría; quedan integración y pruebas, no una entrevista nueva sobre ese alcance.
- **PENDIENTE TÉCNICO:** demostrar atomicidad local, concurrencia, integración de inventario, ejecución/conciliación del reembolso y entrega recuperable de avisos antes de implementar; véase la [matriz de cierre](../../cierre-dependencias-002.md).

## Aprobación de esta especificación

- **Versión aprobada:** 0.2, con 37 criterios.
- **Aprobación explícita del documento completo:** sí; respuesta «si» a la solicitud que enumeró expresamente 002 v0.7, 009 v0.2 y complemento de 004 v0.1.
- **Fecha de aprobación:** 2026-11-01; DEC-172.
- **Reglas previas:** se reutilizan 001, 002, 003, 004 y 005; no se reabren.
- **Decisiones parciales:** DEC-149–DEC-154 registran las respuestas de entrevista; DEC-170 registra el cierre delegado y sus reglas adicionales. No equivalen a aprobar esta spec completa.
- **Plan/tareas:** no creados. No se autoriza código ni cambios fuera de `sdd/`.
