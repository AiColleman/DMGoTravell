# Constitución de DMGoTravell

**Estado al 2026-11-11:** DEC-001-DEC-241 registradas; la base 001-013 y complementos 004/005 conservan sus aprobaciones y planificación no ejecutada. Inventario: **677 criterios aprobados y 402 tareas pendientes**. [Base técnica v0.1](diseno/base-tecnica.md), DEC-210; [modelo de datos v0.1](diseno/modelo-datos.md), DEC-211; y [contrato de API v0.1](diseno/contrato-api.md), DEC-212, son propuestas documentales: estructura/familias compatibles, registros/restricciones lógicos y operaciones/errores, sin ratificación/implementación, endpoints desplegados, esquema SQL, migraciones, paquetes instalados o licencia/configuración verificadas. Su [validación documental v0.1](diseno/validacion-contrato-api.md), DEC-213, revisa cobertura, estados y errores sin ratificar el contrato; el [plan de API-01](diseno/plan-api-01.md), DEC-214, fijó la fuente OpenAPI 3.1 y las pruebas de contrato, y DEC-215 creó el [borrador OpenAPI 3.1 no normativo](diseno/openapi/dmgo-api-v1.yaml), validado sintácticamente. DEC-216 añade la [matriz de cierre del diseño técnico](diseno/cierre-diseno-tecnico.md), que ordena puertas y evidencia sin declarar cerrado lo que exige runtime, proveedor o autorización. DEC-217 añade la [revisión del OpenAPI](diseno/revision-openapi.md): CT-01 documental 92/92, 8 ejemplos en 7 esquemas y hallazgos RO-01–RO-10, sin cerrar API-01 ni ejecutar CT-02–CT-12. DEC-218 añade la [matriz de operaciones](diseno/matriz-operaciones-openapi.md): 92 operaciones por sección, seguridad, idempotencia, `If-Match`, éxito y errores, con hallazgos MO-01–MO-10. DEC-219 fija la [política de versión/propiedad/deprecación](diseno/politica-versionado-api.md): SemVer, `/api/v1`, clasificación de cambios y ventana de 90 días, ratificada documentalmente por DEC-239 con PV-01–PV-06 pendientes. DEC-220 fija las [decisiones transversales](diseno/decisiones-transversales-api.md) de errores, idempotencia/concurrencia y paginación/tiempo/dinero, ratificadas documentalmente por DEC-239 con DT-01–DT-12 y pruebas pendientes. DEC-221 detalla el [plan de pruebas de contrato](diseno/plan-pruebas-contrato.md) para CT-02–CT-12, sin ejecutar pruebas ni crear harness. DEC-222 detalla el [plan de ratificación BT-01](diseno/plan-bt-01.md) para cuatro proyectos, dependencias y aislamiento, sin crear solución ni código. DEC-223 detalla el [plan MD-01/MD-08](diseno/plan-md-01-md-08.md) para nombres, tipos, identificadores y retención, sin SQL ni migraciones. DEC-224 reunió el [paquete de ratificación](diseno/paquete-ratificacion.md) de DEC-219–DEC-223, cuya ratificación documental registra DEC-239. DEC-225 añade el [lote A de ejemplos OpenAPI](diseno/ejemplos-lote-a.md) para identidad/perfil, DEC-226 el [lote B](diseno/ejemplos-lote-b.md) para catálogo, hoteles y movilidad y DEC-227 el [lote C](diseno/ejemplos-lote-c.md) para reservas y pagos y DEC-228 el [lote D](diseno/ejemplos-lote-d.md) para administración de reservas y devoluciones y DEC-229 el [lote E](diseno/ejemplos-lote-e.md) para webhooks y notificaciones, DEC-230 el [lote F](diseno/ejemplos-lote-f.md) para catálogo administrativo y hoteles, DEC-231 el [lote G](diseno/ejemplos-lote-g.md) para movilidad administrativa, DEC-232 el [lote H](diseno/ejemplos-lote-h.md) para salidas, precios e itinerarios, DEC-233 el [lote I](diseno/ejemplos-lote-i.md) para imágenes de catálogo, habitaciones e inventario, DEC-234 el [lote J](diseno/ejemplos-lote-j.md) para imágenes de hotel/habitación y propuestas de alojamiento, DEC-235 el [lote K](diseno/ejemplos-lote-k.md) para clientes, auditoría y exportaciones, DEC-236 el [lote L](diseno/ejemplos-lote-l.md) para reportes y media, DEC-237 el [lote M](diseno/ejemplos-lote-m.md) para autenticación y perfil y DEC-238 el [lote N](diseno/ejemplos-lote-n.md) para errores compartidos y DEC-240 el [lote O](diseno/ejemplos-lote-o.md) para errores específicos de identidad, perfil, reservas, pagos y autorización de devoluciones y DEC-241 el [lote P](diseno/ejemplos-lote-p.md) para catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada, sin handlers. DEC-239 ratifica documentalmente el paquete DEC-219–DEC-223 (política de versión, decisiones transversales, plan de pruebas, BT-01 y MD-01/MD-08 marco), sin autorizar implementación física, proveedores, harness ni pruebas de runtime. Specs, planes/tasks, análisis y contratos anteriores intactos; BT-01-BT-04, MD-01-MD-08, API-01-API-08 y puertas específicas abiertas. Carpeta `Desktop\DMGoTravelll`, sin código nuevo en `sdd/`, operaciones reales, configuración, commits o push; estados anteriores son antecedentes.

Fuentes y rutas: [inventario](fuentes.md). Cobertura de identificadores: [trazabilidad](trazabilidad.md). Conflictos y detalles pendientes: [aclaraciones](aclaraciones.md).

## 1. Alcance y autoridad de las fuentes

**DOCUMENTADO.** DMGoTravell es una aplicación web de agencia/operadora turística: catálogo y hoteles, identidad, reservas turísticas con alojamiento opcional, pagos, correo, administración, reportes y auditoría. Los actores de cuenta iniciales son `client` y `admin`; el visitante accede al contenido público sin ser otro rol. Fuentes: F01 §§1–2; F03 RF01–RF24; F15 §3.

**DOCUMENTADO.** Las decisiones arquitectónicas aceptadas no se cambian silenciosamente: los cambios importantes requieren una nueva ADR y revisión de documentos afectados. Fuentes: F05 §7; F07 «Regla de gobierno documental».

**INSTRUCCIÓN DEL USUARIO.** Esta actividad solo modifica `sdd/`, reutiliza requisitos, mantiene dudas visibles y exige aprobación individual antes de planificar. No autoriza código, cambios en fuentes originales, commits o push.

**AMPLIACIÓN EXPLÍCITA POSTERIOR DEL USUARIO.** Movilidad informativa no estaba definida en RF01–RF24/HU-01–HU-23; se incorpora por solicitud posterior, con fuente DEC-038–DEC-043. No constituye una funcionalidad inferida ni se le atribuye un RF/HU original inexistente. Tours/Paquetes mantienen RF02/HU-02 y reciben la precisión de presentación DEC-044. La nueva sección no cambia el contrato aprobado de reservas.

## 2. Principios de negocio obligatorios

La tabla conserva los principios de las fuentes originales. Las precisiones de entrevista se distinguen debajo; no se atribuyen retrospectivamente a las fuentes. Cantidades/fechas/noches hoteleras deben leerse en SDD con DEC-006–DEC-008 y DEC-018–DEC-023: una habitación de propuesta administrada por períodos completos de 24 horas, sin fechas libres ni tolerancia de salida.

| Principio documentado | Origen |
|---|---|
| El precio oficial se calcula en el backend; el cliente no puede imponer importes. Las reservas conservan precios históricos aunque cambie el catálogo. | F03 RF06, RF19, RN-02–RN-03 y §6; F05 RS06, RP03; ADR-011. |
| Una nueva reserva nace `pending`, requiere salida reservable, personas positivas y cupos suficientes; bloquea disponibilidad temporalmente. | F03 RF05, RN-04–RN-08; HU-06. |
| El alojamiento es opcional; exige salida posterior a entrada y disponibilidad por tipo de habitación y fecha/noche. | F03 RF18–RF19, RN-09–RN-11; HU-22. |
| La reserva compuesta valida y bloquea tour y alojamiento de forma atómica; cualquier fallo revierte el conjunto. Se debe impedir sobreventa concurrente. | F03 RN-07, RN-12–RN-13, §5; AC07; RP02. |
| `pending → confirmed` requiere un pago exitoso validado. Una acción administrativa no sustituye esa validación. | F03 RF08, RN-14, §4; HU-08, HU-17; ADR-007. |
| Los intentos y eventos de pago son trazables e idempotentes. Un evento repetido no duplica pago, confirmación o notificación. | F03 RF07, RN-15–RN-17; RS08–RS09. |
| Un cliente cancela directamente solo reservas propias `pending`. Cancelación y vencimiento liberan recursos una sola vez; el plazo de pago es configurable. | F03 RF11, RF21–RF22, RN-19–RN-22; HU-11, HU-20. |
| `completed` es terminal. El ciclo documentado también presenta `cancelled` sin reapertura; el vencimiento termina en `cancelled`, no en un estado `expired`. | F03 RN-23 y §4; F00 «Estados de reserva». |
| La cancelación después del pago se define en 009 v0.1 (borrador): solo `confirmed → cancelled` antes del inicio, motivo obligatorio, devolución total por 002 y aviso por 004. No se presume penalidad ni reembolso fuera de esa regla. | F03 RN-24 y §7; HU-17; ACL-02; DEC-149–DEC-154. |
| El correo posterior al pago es trazable; un fallo del proveedor de correo no revierte un pago confirmado. Deben evitarse notificaciones duplicadas. | F01 §5; F02 HU-09; AC02; ADR-008. |
| La baja de usuarios, ofertas y hoteles preserva historial mediante borrado lógico cuando corresponda. La baja del cliente conserva reservas, pagos y auditoría e invalida mecanismos de autenticación reutilizables. | F03 RN-30; F02 HU-13; RP04; ADR-010. |
| La auditoría registra actor, acción, entidad, identificador, fecha y cambios relevantes; no se edita ni elimina desde la aplicación. | F01 §2; F03 RF23, RN-28–RN-29; AC09. |

### Decisiones de negocio aprobadas durante SDD

**APROBADA POR EL USUARIO — DEC-001 (2026-10-19).** Si una reserva ya fue cancelada por vencimiento y después se confirma el cobro, permanece `cancelled` y corresponde devolver el dinero al cliente, incluso si el proveedor cobró antes del vencimiento. Se conserva el pago y se informa al cliente de que corresponde una devolución. No se reactiva automáticamente la reserva ni se recupera disponibilidad.

Fuente: [ACL-01 y registro DEC-001](aclaraciones.md), respuesta «queda tu propuesta anterior». La devolución es una definición aprobada durante SDD, no una política previamente cerrada en los documentos originales. DEC-017 añade revisión e inicio manual en máximo un día hábil; calendario, avisos y evidencia quedan pendientes. No es promesa de abono en un día. La cancelación administrativa de una reserva confirmada se define en [009 v0.1](specs/009-administracion-reservas/spec.md) (borrador): antes del inicio, con motivo y devolución total; la liberación de cupos queda para el plan/007.

**APROBADA POR EL USUARIO — DEC-002 (2026-10-19).** Los medios de pago de V1 serán tarjetas y Yape mediante Culqi. PagoEfectivo queda fuera del alcance inicial. Fuente: [ACL-04 y registro DEC-002](aclaraciones.md), respuesta «se aceptara pagos con tarjetas y yape , ya que culqi acepta esos». Concreta RF07/HU-08 y conserva RC14/ADR-007. El plazo vigente se define en DEC-020, no por una obligación de Culqi.

### Precisiones de la entrevista, consolidadas el 2026-10-21 y actualizadas el 2026-10-22

Registro y evidencia de cada aprobación: [decisiones.md](decisiones.md). Son reglas aprobadas, no propuestas técnicas ni aprobación global de specs.

| Decisión | Regla vigente |
|---|---|
| DEC-003 | Antecedente temporal 15 + 2, **sustituido** por DEC-020; no usarlo como regla vigente. |
| DEC-004 | PEN, dos decimales, importe final sin cargos/descuentos no acordados. Redondeo de fracciones de céntimo aún no definido. |
| DEC-005 | Una oferta (tour o paquete) y salida por reserva. Paquete predefinido por administrador con precio, duración, salida y cupos; no carrito ni composición libre. |
| DEC-006 | Hotel opcional; si se añade, exactamente una habitación de un tipo en un hotel. Permite capacidad mayor sin reducir precio; DEC-021 también permite alojar solo a parte del grupo turístico. |
| DEC-007 | Propuestas de alojamiento asignadas por admin a cada salida, con período/tipos disponibles. El cliente no elige fechas/horas. Cada hotel tiene horarios administrables; cambios solo para nuevas reservas. |
| DEC-008 | Tarifa fija hotel/tipo, sin multiplicar por ocupantes; unidad cerrada por DEC-018: cada 24 horas completas. |
| DEC-009 | Antecedente de 30 minutos de salida, **revocado** por DEC-019; no aplicarlo a nuevas condiciones. |
| DEC-010 | Retiro anterior al check-out sin devolución parcial. Extensiones directamente con el hotel, fuera de V1. |
| DEC-011 | Indisponibilidad se informa; ofrecer otra propuesta y, si no quedan, continuar sin hotel por elección del cliente. Nunca quitar hotel y crear reserva automáticamente. Opcionalidad inicial se conserva. |
| DEC-012 | Un pago del total de tour/paquete y hotel opcional; validación automática de aviso oficial de Culqi, no confirmación manual de administrador. |
| DEC-013 | Rechazo mantiene pending vigente y admite reintento en ventana inicial. Resultado desconocido muestra pago en verificación y bloquea otro intento; no nuevo estado de reserva. DEC-024 precisa cancelación. |
| DEC-014 | Protección por propietario incluso ante peticiones manipuladas; DEC-022 cierra respuesta como recurso no disponible sin revelar datos ajenos. |
| DEC-015 | Auditar creación/cancelación, vencimientos, pagos validados y cambios de horarios/propuestas, además de las obligaciones originales. |
| DEC-016 | Historial propio vacío sin error, todos los estados, 10 por página, más recientes primero. Cancelación repetida informa ya cancelada sin segunda liberación. |
| DEC-017 | Caso DEC-001 registrado y avisado; revisión e inicio manual por admin en máximo un día hábil desde detectar el caso. No es devolución automática ni plazo de abono. |
| DEC-018 | Tarifa por cada 24 horas completas. Admin publica períodos de 24/48/72 u otros múltiplos positivos; cliente elige propuesta sin cambiar fechas/horas. Total hotelero = tarifa × cantidad de períodos. |
| DEC-019 | Sin tolerancia de salida hotelera; sustituye DEC-009. No genera cobro automático ni extensión. |
| DEC-020 | Solicitud de pago recibida por DMGoTravell antes de 15 minutos; abrir checkout no cuenta. Sin pago iniciado, cancelar/liberar al 15. Con pago por validar iniciado a tiempo, retener hasta límite total de 20, sin nuevos intentos durante cinco adicionales. Validación a tiempo confirma; vencimiento sin pago válido cancela/libera. |
| DEC-021 | Puede alojarse solo parte del grupo en la única habitación; mostrar capacidad de habitación y total de viajeros antes de confirmar. No autoriza sobreocupación física. |
| DEC-022 | Aplicar rol + propiedad; reserva ajena no disponible sin revelar existencia/datos al cliente. Admin conserva consulta autorizada de todas las reservas. |
| DEC-023 | Interpretar y mostrar alojamiento en hora local de Perú, preservando persistencia coherente en UTC según RP08. |
| DEC-024 | No permitir cancelación voluntaria durante verificación. Rechazo antes de 15 cierra solo el intento y conserva reserva vigente, permitiendo reintento sin reiniciar plazo. Durante tolerancia aplica precisión DEC-027. |
| DEC-025 | Rechazar reducciones de capacidad de salida o inventario hotel/tipo/período por debajo de reservas y retenciones pendientes vigentes. No borrar compromisos ni liberar bloqueos para permitir el ajuste. |
| DEC-026 | Hotel desactivado fuera de nuevas reservas; conservar las ya creadas con alojamiento/bloqueos y condiciones. Pending mantiene sus plazos normales de pago/vencimiento, sin prórroga ni cancelación por la desactivación. |
| DEC-027 | Rechazo definitivo validado durante cinco minutos de tolerancia cancela/libera al recibirse, sin esperar a 20. No aplica a resultado desconocido o timeout ni habilita otro intento. |
| DEC-028 | Solicitud recibida estrictamente antes del corte de 15; exactamente al corte o después se rechaza. Validación estrictamente antes del corte de 20; exactamente al corte o después no confirma. Un pago iniciado a tiempo sigue protegido durante tolerancia. |
| DEC-029 | Cambio de configuración de plazos solo para nuevas reservas; las existentes conservan ventana y tolerancia originales. No reiniciar contadores ni reabrir canceladas. |
| DEC-030 | Permitir nueva estancia desde el instante de salida de la anterior; sin margen adicional de preparación ni tolerancia hotelera. No autoriza solapamiento de ocupaciones. |
| DEC-031 | Cada propuesta hotelera corresponde a una salida concreta; mostrar solo asociadas a la salida reservada. Mismo hotel puede participar en varias salidas respetando inventario compartido. |
| DEC-032 | Desactivar tour/paquete, salida, tipo de habitación o propuesta impide nuevas reservas y conserva las ya creadas, incluidas pending, con condiciones y plazos normales. Complementa DEC-026. |
| DEC-033 | Primera cancelación/inicio válido de pago registrada gana. Cancelación primero impide iniciar pago; inicio primero bloquea cancelación mientras verifica. Cobro posterior a cancelación no reactiva y corresponde devolución gestionada manualmente. |
| DEC-034 | Cancelación automática y liberación por vencimiento completadas en máximo 60 segundos tras el corte aplicable, sin ampliar admisión de pagos ni validación. No añadir esa espera a cancelación voluntaria o rechazo definitivo. |
| DEC-035 | Página de historial inválida muestra «Número de página no válido», sin sustituir automáticamente por otra página. No convertir historial vacío en error. |
| DEC-036 | Página válida sin resultados: lista vacía y «No hay reservas en esta página», sin error ni cambio automático. |
| DEC-037 | Historial por creación descendente; si hay igual instante, desempatar por número único de reserva de mayor a menor. Orden estable para el mismo conjunto de reservas, no historial congelado. |
| DEC-038 | Movilidad pública en landing, solo informativa; sin reservas, precios, disponibilidad, alquiler ni solicitudes de contacto desde esa sección. |
| DEC-039 | Mostrar nombre o tipo, capacidad de pasajeros, imagen y características principales de cada registro de movilidad. |
| DEC-040 | Admin crea, edita, activa y desactiva contenido de movilidad; no nuevo rol ni eliminación física/historial de versiones inferidos. |
| DEC-041 | Solo activos visibles al cliente; desactivados conservados para administración/historial del registro, sin publicación pública. |
| DEC-042 | Movilidad en tarjetas de landing sin página individual pública en V1; no aplica a tours/paquetes. |
| DEC-043 | Opción pública «Movilidad» junto a Tours, Paquetes y Hoteles, que lleva a su sección de landing. |
| DEC-044 | Tarjetas de Tours/Paquetes con resumen; selección abre detalle con información e itinerario completos, manteniendo RF02/HU-02. |
| DEC-045 | Sin movilidad activa, ocultar sección y enlace público; no estado vacío ni ejemplos ficticios. |
| DEC-046 | Cada tarjeta es un tipo/categoría de vehículo, no unidad individual ni matrícula. |
| DEC-047 | Crear movilidad desactivada; activar solo con nombre/tipo, capacidad válida, imagen y características. |
| DEC-048 | Una imagen principal JPG/PNG/WebP de máximo 5 MB, sin galería. |
| DEC-049 | Capacidad entera mayor que cero; no activar duplicado activo por nombre/tipo ignorando mayúsculas y espacios exteriores. |
| DEC-050 | Tarjetas activas de Movilidad ordenadas alfabéticamente por nombre/tipo, sin orden manual. |
| DEC-051 | Auditar creación, edición, activación y desactivación de Movilidad. |
| DEC-052 | Fallo de imagen: mostrar «No se pudo cargar la imagen», conservar imagen anterior si existe o mantener desactivado el registro sin imagen. Sin placeholder/reintento automático inferido. |

**Reservas 001:** v0.13 aprobada explícitamente el 2026-10-22 por «si» a la solicitud de aprobación de esa versión; no se deduce de «HAZLO». **NECESITA ACLARACIÓN en sus specs correspondientes:** avisos/calendario/evidencia de devolución, políticas de cancelación pagada, comprobantes, identidad y métricas que no están definidas. El plan de 001 deberá respetar esos límites y tratar diseño técnico; la aprobación no se extiende a otras specs ni autoriza cambios fuera de `sdd/`.

**Movilidad 013 / Catálogo 006:** la sección hereda autorización admin y RS10; exclusiones de precios/disponibilidad/reservas solo afectan Movilidad. **Movilidad:** reglas DEC-038–DEC-052 y v0.3 aprobadas explícitamente el 2026-10-22; el plan posterior debe respetar sus exclusiones. **Catálogo:** detalles de resumen/itinerario siguen en ACL-28; 006 no está aprobada. No se aprueba organización técnica por agregar la sección.

**Catálogo 006 v0.2 — DEC-053:** alta desactivada de tours/paquetes y activación por administrador solo con título, descripción, precio, duración, itinerario, al menos una imagen y condiciones completos, aprobadas mediante «si». No se trasladan otras políticas de Movilidad/Reservas por analogía. El documento completo de 006 sigue pendiente de aprobación independiente.

**Catálogo 006 v0.3 — DEC-054:** tarjetas con imagen principal, título, descripción breve, duración y precio base, aprobadas mediante «si». El detalle conserva información e itinerario completos. Estructura del itinerario y límites de la descripción breve aún pendientes; no aprobación global de 006.

**Catálogo 006 v0.4 — DEC-055:** estructura del itinerario resuelta: por días, con actividades en orden y una descripción de cada actividad. El usuario confirma «si y tambien para los paquetes»; aplica a tours y paquetes. Los límites de la descripción breve y demás pendientes siguen abiertos; no aprobación global de 006.

**Catálogo 006 v0.5 — DEC-056:** el administrador puede definir un precio propio por salida de tour/paquete. Las nuevas reservas usan la tarifa vigente de la salida seleccionada; precios históricos, PEN/dos decimales y alojamiento conservan sus reglas. La obtención del precio base público sigue pendiente; no aprobación global de 006.

**Catálogo 006 v0.6 — DEC-057/DEC-058:** precio base público independiente definido por admin, no mínimo de salidas. Descuentos administrados para tours/paquetes incorporados como alcance solicitado; tipo, cálculo, vigencia y otras reglas siguen pendientes. DEC-004 mantiene PEN/dos decimales y prohíbe inferir descuentos no definidos; revisar integración con el subtotal turístico de 001 al cerrar ACL-31, conservando importes históricos y specs aprobadas. No aprobación global de 006.

**Catálogo 006 v0.7 — DEC-059:** para tours y paquetes con descuento, la landing muestra precio normal tachado seguido de precio rebajado en soles, conservando dos decimales. El usuario corrige la interpretación de porcentaje. La presentación no determina si el admin ingresa el precio final o un importe a restar; siguen pendientes esa entrada y la aplicación a salidas/reservas. Primera ronda cerrada, sin aprobación global de 006.

**Catálogo 006 v0.8 — DEC-060:** descuentos opcionales para tours y paquetes, a elección del administrador; publicar no exige rebaja. Sin descuento se muestra únicamente el precio normal sin tachado. Con descuento rige DEC-059. No se infiere programación automática ni se cierran los demás pendientes de ACL-31.

**Catálogo 006 v0.9 — DEC-061/DEC-062:** el admin ingresa directamente el precio final rebajado. La landing muestra el porcentaje equivalente calculado respecto del precio normal junto a ese precio tachado y el rebajado en soles. El porcentaje es informativo y no recalcula el precio ingresado; precisión porcentual y límites de precios siguen pendientes. Conserva descuentos opcionales y documentos aprobados.

**Catálogo 006 v0.10 — DEC-063:** descuentos con `0 < precio rebajado < precio normal`; configuraciones inválidas rechazadas. Esta condición implica precio normal positivo cuando hay rebaja, sin decidir gratuidad de ofertas sin descuento. Precisión del porcentaje y aplicación a salidas siguen pendientes.

**Catálogo 006 v0.11 — DEC-064:** ante «lo recomendable», se adopta porcentaje entero redondeado hacia abajo, o «Menos del 1 %» para rebajas positivas inferiores al 1 %. Es una elección delegada de presentación; no modifica precios monetarios ni equivale a aprobación global de 006.

**Catálogo 006 v0.12 — DEC-065:** admin puede definir precio final rebajado diferente por salida de tour/paquete. Conserva opcionalidad y límites respecto del precio normal de esa misma salida; no implica heredar ni acumular la promoción pública. La prioridad al reservar sigue pendiente ACL-31.

**Catálogo 006 v0.13 — DEC-066:** reserva/pago continúan con el precio rebajado de la salida elegida si tiene descuento, o con su precio normal si no. No se acumula la promoción de tarjeta ni una segunda rebaja al precio final. Conservar cantidades, alojamiento independiente e importes históricos de 001; vigencia y presentación detallada de promociones pendientes.

**Catálogo 006 v0.14 — DEC-067:** descuentos vigentes hasta cambio/retiro por admin, sin vencimiento automático. Retirarlos devuelve el comportamiento sin descuento del ámbito afectado para nuevas consultas/reservas; los importes de reservas ya creadas permanecen. No prolonga plazos ni reactiva ofertas o salidas. Segunda ronda cerrada; 006 aún no aprobada.

**Catálogo 006 v0.15 — DEC-068:** rechazar cambios de fecha u hora de una salida con reservas pendientes o confirmadas. No traslada ni cancela reservas como consecuencia del intento; conserva reglas de precio/capacidad/desactivación. Validaciones de reprogramación sin esas reservas siguen pendientes.

**Catálogo 006 v0.16 — DEC-069:** tours/paquetes sin ninguna salida reservable se ocultan del listado y tarjetas públicas hasta recuperar disponibilidad, siempre que sigan activos. No se desactivan automáticamente ni se alteran reservas por esta ocultación. El acceso directo a su detalle y las secciones vacías siguen pendientes ACL-30.

**Catálogo 006 v0.17 — DEC-070:** enlaces directos de tours/paquetes sin salidas disponibles muestran «Oferta no disponible», sin detalle ni reserva. El usuario prevé cupos suficientes al inicio; esto no define capacidad ilimitada ni modifica controles o reservas existentes. No reabrir este caso en la entrevista.

**Catálogo 006 v0.18 — DEC-071:** inicio con secciones separadas de Tours y Paquetes turísticos, cada una con todo su catálogo públicamente visible y sin paginación visible. Conservar la consulta paginada de HU-01 sin convertirla en un límite de ofertas presentadas. No modifica reglas de publicación/disponibilidad ni aprueba el límite propuesto de cinco imágenes por oferta.

**Catálogo público transversal — DEC-072:** explorar sin iniciar sesión todos los registros públicamente visibles de Tours, Paquetes turísticos, Hoteles y Vehículos, cada uno en su sección. Hoteles se registra en la spec 007 v0.2, aprobada posteriormente el 2026-10-31 (DEC-119); Vehículos conserva las categorías activas informativas de 013, sin modificar su spec aprobada. Acceso público no elimina autenticación para reservar ni permisos admin. No se interpreta «todos los servicios» como cantidad ilimitada de fotos.

**Catálogo 006 v0.20 — DEC-073 (2026-10-25):** Tours y Paquetes turísticos en orden alfabético ascendente por nombre, cada uno dentro de su sección completa. No orden manual ni cambio del orden pendiente de Hoteles o del ya aprobado de Movilidad. Tercera ronda cerrada, sin aprobación global de 006.

**Catálogo 006 v0.21 — DEC-074 (2026-10-25):** rechazar ediciones que dejen ofertas publicadas sin datos obligatorios de DEC-053, incluida la última imagen. Conservar el contenido anterior; no desactivación automática para aceptar datos incompletos. No altera el tratamiento de borradores ni aprueba 006 completa.

**Catálogo 006 v0.22 — DEC-075 (2026-10-25):** la tarjeta usa la misma descripción de oferta presentada al reservar, compartida con el detalle. No texto breve administrado por separado. La longitud máxima sigue pendiente; no cambia las condiciones históricas ni la spec aprobada de Reservas.

**Catálogo 006 v0.23 — DEC-076 (2026-10-25):** ocultar sección y enlace de Tours o Paquetes cuando ese tipo no tenga ofertas públicamente visibles; mostrarlos al recuperar contenido. Se evalúa cada sección por separado, conservando catálogo completo y orden alfabético. No resuelve vacíos de Hoteles ni filtros sin resultados.

**Catálogo 006 v0.24 — DEC-077 (2026-10-25):** impedir reservar una salida hasta que tenga precio normal propio definido por admin; el precio de tarjeta no se usa como sustituto. No equivale a prohibir borradores sin precio ni a definir los demás límites monetarios. Conserva reservas existentes.

**Catálogo 006 v0.25 — DEC-078 (2026-10-25):** auditar todos los cambios administrativos aplicados en tours, paquetes, salidas, precios y descuentos: actor, acción, entidad, identificador, fecha y cambios relevantes, conservando RN-28/RN-29. No aprueba 010 ni inventa nombres técnicos de eventos.

**Catálogo 006 v0.26 — DEC-079 (2026-10-25):** precios normales de tours, paquetes y salidas mayores que cero, incluso sin descuento. Rechazar valores cero/negativos; conservar PEN/dos decimales y 0 < rebajado < normal. No modifica políticas de Hoteles/Movilidad ni importes históricos; cuarta ronda cerrada sin aprobación global de 006.

**Catálogo 006 v0.27 — DEC-080 (2026-10-25):** detalle de cada tour/paquete con galería de fotos asociadas; tarjeta con imagen principal. Se mantiene el mínimo de una imagen para publicar; cantidad máxima, formatos, tamaño y fallos siguen pendientes. No modifica la imagen única aprobada de Movilidad.

**Catálogo 006 v0.28 — DEC-081 (2026-10-25):** admin puede elegir horas o días como unidad de duración por cada tour/paquete; mostrar valor y unidad en tarjeta/detalle. No fija decimales ni modifica itinerario por días, horarios de salida o períodos hoteleros de 24 horas.

**Catálogo 006 v0.29 — DEC-082 (2026-10-25):** duración turística únicamente en números enteros de horas o días; rechazar fracciones sin redondeo automático. No modifica decimales de precios, porcentaje de descuento ni períodos hoteleros. Intervalo mínimo/máximo aún pendiente.

**Catálogo 006 v0.30 — DEC-083 (2026-10-25):** JPG/PNG/WebP hasta 5 MB por archivo para principal y galería de Tours/Paquetes; rechazar otros formatos o exceso de tamaño. Límite inclusivo; no fija cantidad de fotos ni modifica políticas de Hoteles/Movilidad.

**Catálogo 006 v0.31 — DEC-084 (2026-10-26):** fallo de carga/reemplazo de foto muestra «No se pudo cargar la imagen» y conserva imágenes anteriores de la oferta, principal y galería. Sin imágenes previas sigue faltando el requisito de publicación. No añade reintentos automáticos ni modifica specs aprobadas.

**Catálogo 006 v0.32 — DEC-085 (2026-10-26):** precio normal tachado, rebajado en soles y porcentaje equivalente también en detalle y selección de salida, cuando exista descuento. Cada ámbito usa sus propios precios; conservar formato porcentual y no acumulación. ACL-31 funcional resuelta; no aprobación global de 006.

**Catálogo 006 v0.33 / acuerdos 007 — DEC-086 (2026-10-26):** reprogramar una salida sin reservas no desplaza fechas hoteleras; admin ajusta explícitamente las propuestas asociadas. Conservar bloqueo de salidas con reservas pendientes/confirmadas, períodos hoteleros y condiciones históricas. Coherencia durante el ajuste aún pendiente.

**Catálogo 006 v0.34 / acuerdos 007 — DEC-087 (2026-10-26):** ocultar opciones hoteleras de la salida reprogramada hasta ajustar sus fechas; permitir reservar solo el tour/paquete si cumple sus condiciones. Propuestas ajustadas vuelven a ser elegibles según estado/disponibilidad. No oculta el hotel general ni afecta otras salidas o reservas.

**Catálogo 006 v0.35 — DEC-088 (2026-10-27):** crear/reprogramar salidas a fecha y hora futura, usando hora de Perú; no permite eludir el bloqueo con reservas ni desplazar fechas hoteleras automáticamente. Usuario solicita actualizar itinerario al modificar salidas; alcance por salida o por oferta pendiente de aclaración.

**Catálogo 006 v0.36 — DEC-089 (2026-10-27):** itinerario compartido del tour/paquete; su cambio se aplica a las demás salidas de esa misma oferta, sin variantes por salida. La regla para permitir editarlo cuando existan reservas pendientes/confirmadas sigue abierta; no modifica las specs aprobadas.

**Catálogo 006 v0.37 — DEC-090 (2026-10-27):** rechazar cambios de itinerario si cualquier salida de la oferta tiene reservas pendientes o confirmadas. Conservar itinerario previo y reservas; no inventar traslado/cancelación para aceptar la edición. Sexta ronda cerrada; aprobación global de 006 aún pendiente.

**Catálogo 006 v0.38 — DEC-091 (2026-10-27):** impedir dos tours publicados con el mismo nombre y, por separado, dos paquetes publicados con el mismo nombre. Aplicar en activación y edición; no unicidad global entre tipos ni entre borradores. Comparación de mayúsculas/espacios aún pendiente.

**Catálogo 006 v0.39 — DEC-092 (2026-10-27):** comparar nombres sin distinguir mayúsculas/minúsculas e ignorando espacios al inicio/final para la unicidad por tipo. No obliga a alterar la presentación del nombre ni cambia las specs aprobadas.

**Catálogo 006 v0.40 — DEC-093 (2026-10-28):** admin selecciona una sola unidad de duración por oferta, horas o días, con valor entero y sin máximo comercial fijo. No modifica itinerarios ni períodos hoteleros; el mínimo no queda concretado por esta respuesta. Las limitaciones técnicas no se presentan como topes comerciales aprobados.

**Catálogo 006 v0.41 — DEC-094–DEC-101 (registro 2026-10-30):** descripción y texto de itinerario sin máximo fijo de caracteres, manteniendo estructura y obligatoriedad. Admin decide duración entera en horas o días sin mínimo/máximo comercial fijo. Filtros turísticos por precio visible de tarjeta (rebajado si existe), duración mínima/máxima y unidad, rango de fechas de salida y destino automático sobre catálogo existente. Sin coincidencias: «No se encontraron resultados» y «Limpiar filtros» para recuperar catálogo publicable. No se crea lista administrativa adicional de destinos ni se modifican filtros de Hoteles/Movilidad. Detalles aún no definidos permanecen visibles; no aprobación global de 006.

**Catálogo 006 v0.42 — DEC-102 (2026-10-30):** buscar destino como texto contenido en nombre o descripción del tour/paquete; basta cualquiera de esos campos. No introduce lista adicional ni extracción geográfica. Mantener publicación, tipo de sección y orden acordados; no aprobación global de 006.

**Catálogo 006 v0.43 — DEC-103 (2026-10-30):** comparar duración con 1 día = 24 horas. Buscar de 1 a 2 días incluye ofertas configuradas de 24 a 48 horas, sin cambiar su unidad/valor original ni las reglas hoteleras. No aprobación global de 006.

**Catálogo 006 v0.44 — DEC-104 (registro 2026-10-30):** rango de fechas incluye día inicial y final en hora de Perú; una oferta coincide si tiene al menos una salida disponible dentro de él. No retiene cupos ni cambia reservabilidad. Confirmado durante modo de planificación y guardado tras «guarda y continua»; no aprobación global.

**Catálogo 006 v0.45 — DEC-105/DEC-106 (registro 2026-10-30):** rangos invertidos rechazados con «El rango no es válido», sin intercambio de extremos; combinar filtros exige todos los aplicados. La primera regla fue confirmada y la segunda se adopta bajo delegación de lógica habitual, sin atribuir una nueva respuesta literal al usuario. No oculta pendientes comerciales, modifica specs aprobadas ni reemplaza aprobación global.

**Catálogo 006 v0.46 — DEC-107 (2026-10-30):** el administrador asocia a cada tour o paquete todas las fotos que necesite, contando principal y galería, sin cantidad máxima comercial. Se conserva el mínimo de una imagen para publicar y JPG/PNG/WebP de hasta 5 MB por archivo. La capacidad técnica se trata en el plan, no como límite comercial.

**Aprobación de Catálogo 006 (2026-10-30):** la spec v0.46 fue aprobada explícitamente con «aprobado» tras cerrar DEC-107. Sus 103 criterios y límites quedan aprobados; las dependencias 005/007/010/012 conservan sus pendientes. Se habilitó la creación de [plan](specs/006-catalogo/plan.md) y [tareas](specs/006-catalogo/tasks.md) como documentos no ejecutados, sin autorizar código.

**Hoteles 007 v0.2 — DEC-108 (2026-10-30):** catálogo público con tarjetas y página de detalle; el detalle muestra descripción, servicios, galería, tipos de habitación, capacidad y tarifa base. La disponibilidad concreta se consulta al elegir alojamiento para una salida, sin fechas libres del cliente. No autoriza reserva hotelera independiente.

**Hoteles 007 v0.2 — DEC-109 (2026-10-30):** un hotel activo sin inventario futuro sigue visible en el catálogo; tarjeta y detalle indican «Sin disponibilidad». Los hoteles inactivos o eliminados se excluyen. No se crea un estado administrativo nuevo.

**Hoteles 007 v0.2 — DEC-110 (2026-10-30):** cada hotel admite una imagen principal y una galería sin cantidad máxima comercial, con JPG/PNG/WebP de hasta 5 MB por archivo. Ante fallo se muestra «No se pudo cargar la imagen» y se conservan las imágenes anteriores. No se deduce de 006; las fotos por tipo de habitación se incorporan después con DEC-116.

**Hoteles 007 v0.2 — DEC-111 (2026-10-30):** el hotel se crea desactivado y se activa solo con nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo de habitación con capacidad y tarifa válidas. La activación incompleta se rechaza.

**Hoteles 007 v0.2 — DEC-112 (2026-10-30):** una propuesta por salida, hotel y período; dentro se ofrecen todos los tipos de habitación activos con su tarifa base y cupo. El cliente reserva una habitación de un tipo; el inventario se comparte por tipo y fecha/noche entre propuestas del mismo hotel. Se conservan períodos de 24 horas, asociación a salida y protección de reservas.

**Hoteles 007 v0.2 — DEC-113 (2026-10-30):** por delegación de lógica habitual, orden alfabético, unicidad de nombres activos, capacidad entera positiva, tarifa positiva, permisos `admin`, auditoría y borrado lógico. No son respuestas literales nuevas ni aprobación de la spec completa. En esa fecha la [spec 007](specs/007-hoteles/spec.md) quedó pendiente de aprobación explícita y sin plan/tareas; fue aprobada después por DEC-119 y su plan/tareas son backlog no ejecutado.

**Hoteles 007 v0.2 — DEC-114 (2026-10-30):** una sola tarifa base por tipo de habitación, usada por todas las salidas y propuestas; no varía por salida, temporada, fecha ni ocupante. El total sigue siendo tarifa × períodos completos de 24 horas.

**Hoteles 007 v0.2 — DEC-115 (2026-10-30):** el catálogo de Hoteles no tiene filtros ni buscador propios; se muestra completo y en orden alfabético. No elimina los filtros ya aprobados de Tours/Paquetes.

**Hoteles 007 v0.2 — DEC-116 (2026-10-30):** cada tipo de habitación puede tener una imagen principal y una galería sin cantidad máxima comercial; las fotos son opcionales para activarlo. Se aplican JPG/PNG/WebP, 5 MB por archivo, «No se pudo cargar la imagen» y conservación de imágenes anteriores; sin fotos se muestra sin imagen ni placeholder.

**Hoteles 007 v0.2 — DEC-117 (2026-10-30):** la propuesta ofrece automáticamente todos los tipos de habitación activos del hotel; el administrador no elige un subconjunto. El cliente elige uno y reserva una sola habitación; los tipos inactivos no se ofrecen. Se conservan tarifa única por tipo, inventario compartido y protección de reservas.

**Hoteles 007 v0.2 — DEC-118 (2026-10-31):** los servicios del hotel se registran como una lista libre de textos, sin catálogo fijo. El hotel requiere al menos un servicio para activarse y los servicios se muestran en la tarjeta y el detalle. No crea categorías, iconos, filtros ni un catálogo administrable de servicios.

**Aprobación de Hoteles 007 (2026-10-31) - DEC-119:** la spec v0.2 fue aprobada explícitamente con «si» a la solicitud de aprobar sus 58 criterios. Se habilita la creación de [plan](specs/007-hoteles/plan.md) y [tareas](specs/007-hoteles/tasks.md) como documentos no ejecutados, sin autorizar código ni cambios fuera de `sdd/`. No aprueba 005/006/010/012 por inferencia.

**Pagos 002 v0.6 - DEC-120 (2026-10-31):** si Culqi reporta dos pagos exitosos distintos para una misma reserva, el primero confirma una sola vez y el segundo se registra como duplicado/excedente para devolución. No hay doble confirmación, doble notificación ni doble cargo lógico.

**Pagos 002 v0.6 - DEC-121 (2026-10-31):** el plazo máximo de un día hábil para confirmar una devolución se cuenta de lunes a viernes, en hora de Perú, excluyendo feriados nacionales. No es promesa de abono en ese plazo.

**Pagos 002 v0.6 - DEC-122 (2026-10-31):** ante un pago rechazado se muestra el motivo de Culqi cuando sea comprensible; si no, se muestra «No se pudo procesar el pago». No se muestran datos sensibles de tarjeta.

**Pagos 002 v0.6 - DEC-123 (2026-10-31):** la devolución registra fecha, importe, referencia/ID y observación, y avisa al cliente por correo; no exige comprobante adjunto. El contenido del correo corresponde a 004.

**Pagos 002 v0.6 - DEC-124 (2026-10-31):** el administrador confirma la devolución dentro de DMGoTravell y el sistema la ejecuta con Culqi. No hay devolución automática sin esa confirmación.

**Pagos 002 v0.6 - DEC-125 (2026-10-31):** si la devolución falla o queda con resultado desconocido, el caso permanece abierto, no se marca como devuelto, se avisa al administrador y se permite reintentar. El cliente ve la devolución en gestión. No se fija un máximo de reintentos en esta versión.

**Pagos 002 v0.6 - DEC-126 (2026-10-31):** un pago exitoso con importe o moneda distintos no confirma la reserva. Se registra como observado con el importe, la moneda y la referencia reportados; se avisa al administrador; se bloquea otro cobro para esa reserva mientras el caso siga abierto; el cliente ve que el pago está en revisión; y se devuelve el importe completo cobrado mediante confirmación del administrador y ejecución con Culqi.

**Pagos 002 v0.6 - DEC-127 (2026-10-31):** si el pago observado ocurre antes de los quince minutos y la reserva sigue `pending`, la reserva permanece `pending` hasta el minuto 20. No se libera inventario por la sola discrepancia; al vencer sin pago válido se cancela y se devuelve el cobro observado. El bloqueo de otro cobro se mantiene mientras el caso siga abierto.

**Pagos 002 v0.6 - DEC-128 (2026-10-31):** mientras el pago observado siga abierto y la reserva siga `pending`, la cancelación voluntaria se rechaza hasta el límite de veinte minutos. Al vencer sin pago válido se aplica la cancelación de 003 y la devolución del cobro observado.

**Pagos 002 v0.6 - DEC-129 (2026-10-31):** el cliente ve el plazo de quince minutos para iniciar el pago; los cinco minutos de tolerancia no se muestran como tiempo de pago disponible.

**Pagos 002 v0.6 - DEC-130 (2026-10-31):** el plazo visible se muestra con contador de tiempo restante y hora límite exacta.

**Pagos 002 v0.6 - DEC-131 (2026-10-31):** el contador y la hora límite se muestran en el detalle de la reserva y en la pantalla de pago del cliente propietario.

**Pagos 002 v0.6 - DEC-132 (2026-10-31):** al llegar a cero se muestra literalmente «Plazo de pago vencido», se detiene el contador y se deshabilita el inicio de un nuevo pago. Si la reserva se abre después del minuto 15, se muestra el mismo mensaje y no un contador activo.

**Vencimiento 003 v0.1 - DEC-133 (2026-10-31):** si el proceso automático no completa la cancelación o liberación en sesenta segundos, reintenta automáticamente y conserva evidencia. Si el fallo persiste, alerta al administrador, mantiene la reserva `pending` sin admitir nuevos pagos ni confirmación y no marca la liberación como completada. No se fija un máximo de reintentos ni el canal de alerta; se concretan en el plan/004.

**Vencimiento 003 v0.1 - DEC-134 (2026-10-31):** la spec fue **aprobada explícitamente** con 20 criterios. Conserva los límites 15/20 de 001, la liberación única, el máximo de 60 segundos, el reintento/alerta de DEC-133 y la auditoría `reservation.auto_cancelled`. No tiene plan/tareas; 004 fue aprobada después por DEC-141, y 009 y 010 siguen pendientes.

**Notificaciones 004 v0.1 - DEC-135–DEC-140 (2026-10-31):** 004 cubre el comprobante al cliente después de un pago confirmado y los avisos operativos al administrador por pago observado, fallo de devolución y fallo de vencimiento. El comprobante incluye reserva, viaje, importe y pago; los avisos incluyen reserva, motivo, fecha y acción requerida. Resend envía; los intentos se registran; un fallo no revierte la confirmación; se reintenta y, si persiste, se alerta. Un rebote o correo inválido se registra y alerta sin bloquear. El administrador puede solicitar un único reenvío auditado. La spec tiene 22 criterios y fue aprobada por DEC-141.

**Notificaciones 004 v0.1 - DEC-141 (2026-10-31):** la spec fue **aprobada explícitamente** con 22 criterios. No tiene plan/tareas; las dependencias 005, 009 y 010 siguen pendientes.

**Identidad 005 v0.1 - DEC-142–DEC-147 (2026-10-31):** 005 usa access JWT + refresh rotatorio; el logout revoca solo la sesión actual. El correo debe verificarse antes de reservar o pagar. La recuperación usa un enlace único por Resend y revoca todas las sesiones. Los administradores se aprovisionan por seed/migración, sin registro público. Si Google devuelve un correo ya registrado con contraseña, se exige login con contraseña y vinculación posterior. La spec tiene 30 criterios y fue aprobada por DEC-148.

**Identidad 005 v0.1 - DEC-148 (2026-10-31):** la spec fue **aprobada explícitamente** con 30 criterios. No tiene plan/tareas; las dependencias 009 y 010 siguen pendientes.

## 3. Seguridad y privacidad

**Reemisión de verificación aprobada y planificada — DEC-205–DEC-209 (2026-11-02):** 005-C v0.1 conserva 18 criterios aprobados: otro enlace antes/después de vencer, solo último admitido válido, petición rechazada no sustituye, fallo posterior no restaura anteriores y retry no renueva. Plan propio/16 tareas no ejecutados proponen generación del mismo propósito compartida con registro inicial, commit local/replay/consumo/auditoría y entrega protegida. TTL de 24 horas/límites son propuestas técnicas a probar; RV-01–RV-05 pendientes. No cambia correo/sesiones por solicitar, recuperación/008 o bloqueo de reserva/pago sin verificar; documentos previos intactos y sin implementación autorizada.

**Multimedia 012 v0.1 — DEC-194/DEC-195/DEC-197/DEC-199 (2026-11-02):** aprobada con 32 criterios, conserva acuerdos por consumidor. Lectura de foto ya publicada continúa tras desactivar mientras se conserve, sin metadata del servicio o borradores; principal elegida antes de retirar. Plan v0.1/30 tareas pendientes proponen validación antes de R2, bucket privado/backend con marca histórica, asociación/auditoría local y limpieza con referencias/fence. U-01–U-06 exigen evidencia real de recursos/licencias/runtime, proveedor, permisos y resultados desconocidos; un 404 no concluye PUT en vuelo y un lease vencido no reabre asociaciones. Sin cuotas comerciales nuevas o permiso publicitario sobre documentos privados.

**Reportes 011 v0.1 — DEC-188–DEC-193/DEC-196/DEC-198 (2026-11-02):** aprobada con 38 criterios; contratos por componentes separados de cobros/devoluciones reales por fecha propia/moneda, no utilidad o saldo bancario. Cada transacción real una vez, incluso anómala; eventos repetidos no son cobros. PDF conserva consulta/filtros/referencia y listado completo sin nombres/contactos/ID de cliente. Plan v0.1/28 tareas pendientes proponen copia consistente durable y entrega privada con permiso actual; Q-01–Q-06 exigen datos/cálculo/privacidad/licencia/runtime/capacidad/autorización. No asumir MIT de ejemplos sobre PDFsharp reciente ni adoptar dependencia pagada por inferencia.

**Aprobación y planificación de Perfil — DEC-186/DEC-187 (2026-11-02):** respuesta «si» aprueba 008 v0.1; «continua» posterior autoriza solo plan/backlog. Se proponen versiones de perfil/seguridad separadas, solicitud de correo propia y coordinación por cuenta para no eludir bloqueos con reservas/pagos concurrentes. Avisos de seguridad al anterior/nuevo tienen propósito limitado sin enlaces de acceso; no son alias o destinatarios generales. P-01–P-06 requieren pruebas reales antes de ejecutar, sin modificar planes existentes ni ampliar facultades administrativas o flujos financieros.

**Perfil 008 v0.1 — DEC-180–DEC-185 (2026-11-02):** cliente puede editar nombre/teléfono y solicitar correo nuevo; el actual sigue vigente hasta verificar el solicitado. Aplicar cambio cierra todas las sesiones y avisa a ambas direcciones sin credenciales; solo la última solicitud válida permanece utilizable. Baja rechazada por reservas `pending`/`confirmed`, pagos sin resolución o devoluciones abiertas; sin cancelación/liberación/reembolso automáticos. Es precisión de entrevista incorporada a un borrador, no aprobación de 008 ni cambio de las specs previas. Conservar historial, unicidad de cuenta de baja y protección de 010; los propósitos nuevos de correo requieren compatibilidad explícita con 004/005.

**Planificación documental de Clientes/auditoría — DEC-179 (2026-11-02):** 34 tareas cubren los 59 criterios aprobados; consulta de clientes solo lectura, auditoría anexada con privilegios mínimos y conservación indefinida. CSV completo desde una copia consistente capturada al admitir la solicitud, no un timestamp o snapshot huérfano; privacidad de baja y permisos actuales antes de entregar. Copias temporales y cleanup no autorizan borrar auditoría. A-01–A-06 requieren prueba de contratos, recuperación, capacidad, inercia de fórmulas y autorización antes de ejecución. Specs/planes anteriores intactos.

**Planificación documental de Administración de reservas — DEC-178 (2026-11-02):** 28 tareas cubren los 37 criterios aprobados. Proponer autorización vigente, reloj/estado/versión reevaluados tras esperas, claves de operación y transacción local conjunta; reembolso y correo externos posteriores. Cancelar no es autorizar dinero ni editar historia; completar no es liberar otra vez. R-01–R-06 requieren contratos/pruebas/autorización antes de cualquier efecto real. Ninguna spec o plan anterior se modifica para aparentar compatibilidad.

**Planificación documental de Identidad — DEC-177 (2026-11-01):** plan/tasks de 005 proponen parámetros y controles verificables, no ejecución. JWT estándar propio, refresh de uso único con revocación de familia al reutilizar, logout de familia actual y reset de todas las familias; no asumir que una firma válida equivale a autorización vigente. Google se vincula por issuer/`sub` con contexto autenticado, nunca automáticamente por correo. I-01–I-06 conservan las pruebas de plataforma, proveedor, navegador, enlaces, revocación y autorización; no se amplía perfil/baja o administración de cuentas fuera de alcance.

**Planificación documental de Notificaciones — DEC-176 (2026-11-01):** un plan y 30 tareas cubren 22 criterios base y 16 del complemento sin mezclarlos ni modificar sus archivos aprobados. La deduplicación local no caduca con las claves de Resend de 24 horas; no reenviar a ciegas fuera de su garantía ni repetir automáticamente el reenvío manual fallido. Entrega al usuario solo del enlace autorizado por 005, sin token bruto, contraseñas o enlaces en auditoría/admin/logs; M-04/M-05 exigen protección y recuperación probadas, no meras declaraciones. Sin implementación o envíos autorizados.

**Planificación documental de Vencimiento — DEC-175 (2026-11-01):** plan/tasks de 003 proponen programación diferida persistida, recuperación y parámetros verificables; no demuestran funcionamiento ni amplían pago. Mantener 15/20, máximo de 60 segundos en el caso normal, `pending` si el fallo persiste y no cancelación manual administrativa de `pending`. La documentación de Hangfire no autoriza storages/infraestructura excluidos ni una promesa de latencia sin prueba real.

**Planificación documental de Pagos — DEC-174 (2026-11-01):** plan/tasks de 002 son propuestas técnicas, no una ADR ni evidencia de funcionamiento. La documentación pública de Culqi indica límites de Yape y condiciones de comisión en devoluciones; verificar el cumplimiento del total, autenticidad, idempotencia y recuperación antes de efectos financieros reales. No introducir descuentos al cliente, pagos divididos ni ventanas nuevas para adaptar el negocio a un proveedor. Sin autorización de código.

**Cierre funcional aprobado — DEC-171–DEC-173 (2026-11-01):** la respuesta «si» a la pregunta que enumeró expresamente 002 v0.7, 009 v0.2 y complemento 004 v0.1 aprueba cada documento. No se deriva la aprobación de la delegación anterior. Quedan comprobaciones técnicas, no nuevas dudas funcionales propias de estos contratos. 008/011/012 permanecen fuera de la ronda; no se autoriza implementación ni se crean plan/tareas.

**Cierre transversal de la cadena de Pagos — DEC-170 (2026-11-01):** se precisan reintentos de devolución desconocida, corte/fin de reserva compuesta, liberación local idempotente y contratos de correo/alertas. Son propuestas funcionales delegadas en 002/009/complemento 004, pendientes de aprobación. El complemento evita modificar una base aprobada. Los mecanismos y verificación de proveedores siguen como evidencia técnica requerida; 008/011/012 no se declaran cerradas.

**Aprobación vigente de 010 v0.3 — DEC-169 (2026-11-01):** el usuario responde «si» a la petición explícita de aprobar v0.3. Se aprueban sus 59 criterios sin crear plan/tareas ni autorizar implementación. La recuperación verificable y el contrato de la alerta no incluida en 004 v0.1 siguen como puertas previas a ejecución; 002/009 no quedan aprobadas por referencia.

**Cierre por delegación de 010 v0.3 — DEC-168 (2026-11-01):** la instrucción de completar detalles no equivale a aprobación. Se añaden bordes verificables de consulta y exportación, incluida protección contra localizar clientes de baja por datos ocultos, privacidad ante baja concurrente y autorización vigente antes de descarga. Estas protecciones prevalecen sobre la copia temporal del CSV sin cambiar los resultados ordinarios. v0.3 tiene 59 criterios y sigue en borrador; recuperación verificable e integración de la nueva alerta requieren formalización antes de ejecutar, sin cambios silenciosos a 004 o a documentos protegidos.

**Revisión de 010 v0.2 — DEC-162–DEC-167 (2026-11-01):** se cierran las dudas funcionales entrevistadas: una acción controlable no se aplica sin auditoría; un cobro externo ya realizado conserva su resultado y se recupera su evidencia con alerta si persiste el fallo, sin repetirlo/cancelarlo solo por ese fallo; CSV completo referido al inicio; cliente de baja solo con ID/estado/cantidad de reservas; todos los filtros, nombre/correo parcial sin distinguir mayúsculas y rango inclusivo de días completos en hora de Perú. v0.2 tiene 47 criterios y espera aprobación; no hereda la aprobación de v0.1 ni cambia los límites de pago o specs protegidas.

**Aprobación de 010 — DEC-161 (2026-11-01):** el usuario aprueba v0.1 con pendientes documentados y pregunta si aún hay dudas. Sí persisten las dudas funcionales de su sección «Dudas abiertas»; no quedan resueltas por la aprobación ni se habilita ejecutar las partes afectadas. No se crean plan/tareas ni se aprueban 002/009.

**Clientes y auditoría 010 v0.1 — DEC-155–DEC-160 (registro 2026-11-01):** alcance crítico de 001–009 sin omitir obligaciones previas de 013; auditoría inmutable con conservación indefinida; consultas administrativas paginadas con filtros; perfil básico del cliente y cantidad de reservas, sin modificación de cuentas ni secretos. El administrador puede exportar resultados filtrados a CSV. Es ampliación explícita que no sustituye el PDF de 011. Las respuestas no aprueban 010; permanecen dudas sobre persistencia fallida de auditoría, exportaciones grandes/datos cambiantes y clientes con baja lógica.

**DOCUMENTADO** (F05 §2, RS01–RS12; F03 RN-18 y RN-25–RN-27; F04 AC04–AC05):

- HTTPS para tráfico público; secretos fuera del repositorio, gestionados mediante configuración segura.
- Administración restringida a `admin`, sin registro público de administradores. F01 §2 exige aprovisionamiento interno controlado.
- Propiedad de recursos obtenida de la identidad autenticada; no confiar en un identificador de usuario suministrado por el cliente para autorizar acceso.
- No almacenar datos sensibles de tarjeta; el texto RN-18 es más amplio que la expresión «datos sensibles completos» de RS07 y no se relaja en SDD.
- Validar autenticidad de Webhooks conforme al mecanismo oficial de Culqi; aplicar idempotencia en pagos.
- Validar extensión, MIME, contenido real y tamaño de multimedia antes de almacenarla (F01 §6; RS10; 012 aprobada). JPG/PNG/WebP de hasta 5 MB por consumidor; bytes/límites/procesamiento se proponen en plan 012 con U-01 pendiente, no cuota de fotos.
- CORS restringido a orígenes autorizados en producción y rate limiting donde corresponda.
- Proteger el panel de Hangfire y excluir datos sensibles de logs (AC04; ADR-005).

Los detalles de sesiones, vinculación de cuentas y controles cuantitativos siguen pendientes; véanse ACL-09, ACL-10 y ACL-20.

## 4. Arquitectura y tecnologías

**Recomendación técnica posterior — DEC-210 (2026-11-02):** [base v0.1](diseno/base-tecnica.md), no ADR aceptada o arquitectura implementada, conserva monolito/stack y precisa variante de cuatro proyectos con Presentation dentro de `Api`, familias .NET 10/EF–Npgsql 10/FluentValidation 12 y toolchain frontend compatible. Referencias concretas/licencias/restore/arquitectura/configuración se validan en BT-01–BT-04 antes de habilitar. Se conserva FluentValidation sin sustituir por equivalente o borrar RC08; MediatR no se considera libre de condiciones por su mención en el stack. La lectura pública no cambia restricciones o garantiza la plataforma real.

**Modelo de datos posterior — DEC-211 (2026-11-03):** [volumen 1 v0.1](diseno/modelo-datos.md), no esquema físico o migración, organiza registros lógicos y restricciones para identidad/acceso, catálogo/inventario, reservas, pagos/devoluciones, vencimiento y auditoría. Conserva estados comerciales aprobados, snapshots inmutables, liberación única, unicidades parciales, deduplicación y orden de bloqueo; no crea RF/HU/RN ni autoriza DDL. MD-01–MD-08 exigen PostgreSQL real, concurrencia, inventario, pagos, auditoría, exportaciones y retención antes de implementar. Los nombres de campos son provisionales y no ratifican los contratos propuestos.

**Contrato de API posterior — DEC-212 (2026-11-03):** [contrato v0.1](diseno/contrato-api.md), no OpenAPI generado, controlador o endpoint desplegado, propone operaciones/permisos, ProblemDetails, paginación 1-based, idempotencia, `ETag`/`If-Match`, archivos y errores para 001–013/004-C/005-C. Deriva de rutas ya propuestas en los planes; no añade reglas comerciales ni ratifica Culqi/Resend. Recursos ajenos se ocultan con `404`; confirmar pago, vencer, liberar inventario y auditar siguen siendo puertos internos. API-01–API-08 exigen contrato real, transporte/CSRF/CORS, errores, concurrencia, paginación, proveedores, archivos y exportaciones antes de implementar.

**Validación del contrato posterior — DEC-213 (2026-11-03):** [revisión documental v0.1](diseno/validacion-contrato-api.md), no OpenAPI o prueba de integración, contrasta la superficie y las reglas del contrato con 001–013/004-C/005-C, sus planes, el modelo de datos y los contratos propuestos. No encontró una capacidad aprobada sin ruta o puerto interno; registra VA-01–VA-12, incluidas las correcciones de vencimiento, estados de pago, idempotencia, duplicados, última imagen, media publicada y `410`. No crea RF/HU/RN, criterios o tareas y no ratifica el contrato; API-01–API-08, BT-01–BT-04, MD-01–MD-08 y RV-01–RV-05 siguen abiertas.

**Plan de API-01 posterior — DEC-214 (2026-11-03):** [plan v0.1](diseno/plan-api-01.md) fija fuente/versión 3.1, ubicación candidata, `operationId`, seguridad, errores, inventario y matriz CT-01–CT-12. No creó YAML, handlers, pruebas ejecutables o endpoints; el contrato textual sigue siendo la referencia de diseño y API-01 permanece abierta hasta OpenAPI revisado y evidencia de contrato. No añade RF/HU/RN, criterios o tareas; 677/402 intactos.

**Borrador OpenAPI posterior — DEC-215 (2026-11-03):** [dmgo-api-v1.yaml v0.1.0-draft](diseno/openapi/dmgo-api-v1.yaml), **borrador no normativo** OpenAPI 3.1.0 con 82 rutas, 92 operaciones, 88 esquemas y 120 referencias únicas; cubre autenticación/perfil, catálogo/hoteles/movilidad, reservas, pagos/devoluciones, administración, clientes/auditoría/exportaciones, reportes, notificaciones y media. Validado como YAML/OpenAPI 3.1, sin `$ref` rotos, `operationId` duplicados ni parámetros de ruta desalineados. No ratifica el contrato, no ejecuta CT-02–CT-12, no añade ejemplos y no genera handlers, código, migraciones o endpoints. API-01–API-08, BT-01–BT-04, MD-01–MD-08 y RV-01–RV-05 siguen abiertas; 677/402 intactos.

**Cierre del diseño técnico — DEC-216 (2026-11-04):** [matriz v0.1](diseno/cierre-diseno-tecnico.md), no implementación o ratificación, clasifica API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y puertas específicas por evidencia, bloqueo y próximo artefacto. Distingue lo cerrable documentalmente de lo que exige runtime, proveedor o autorización; no declara cerrada una puerta sin prueba. API-01 sigue parcial; API-03/04/05 tienen diseño propuesto y pruebas pendientes; BT-01/MD-01/MD-08 requieren ratificación/decisión; el resto depende de PostgreSQL, proveedores o entorno. No crea código, SQL, migraciones, endpoints o datos reales; 677/402 intactos.

**Revisión del OpenAPI — DEC-217 (2026-11-04):** [revisión v0.1](diseno/revision-openapi.md) contrasta el borrador con el contrato y supera documentalmente CT-01: 92/92 operaciones, 0 faltantes/sobrantes, 92 `operationId` únicos, parámetros alineados y 0 referencias rotas. Añade 8 ejemplos ficticios en 7 esquemas con 0 fallos JSON Schema e incorpora los ejemplos del contrato §16. CT-12 sigue parcial y CT-02–CT-12 no se ejecutaron; API-01 permanece abierta. No crea código, handlers, SQL, migraciones o datos reales; 677/402 intactos.

**Matriz de operaciones — DEC-218 (2026-11-04):** [matriz v0.1](diseno/matriz-operaciones-openapi.md) recorre las 92 operaciones por sección del contrato: 17 públicas o de firma, 22 con `Idempotency-Key`, 21 con `If-Match`, 92 con éxito y 90 con errores declarados. Hallazgos MO-01–MO-10; no ejecuta CT-02–CT-12, no añade ejemplos por operación y no cierra API-01. No crea código, handlers, SQL, migraciones o datos reales; 677/402 intactos.

**Política de versión/propiedad/deprecación — DEC-219 (2026-11-04):** [política v0.1](diseno/politica-versionado-api.md) propone propietario/revisores por rol, SemVer, prefijo `/api/v1`, clasificación de cambios y ventana de deprecación de 90 días. PV-01–PV-06 pendientes; no ratifica el OpenAPI ni cierra API-01. No crea código, handlers, SQL, migraciones o datos reales; 677/402 intactos.

**Decisiones transversales — DEC-220 (2026-11-04):** [decisiones v0.1](diseno/decisiones-transversales-api.md) propone `ProblemDetails`, `Idempotency-Key`, `ETag`/`If-Match`, paginación 1-based, fechas UTC/Perú y dinero decimal PEN. DT-01–DT-12 y pendientes; no ejecuta CT-02–CT-12 ni cierra API-03/04/05. No crea código, handlers, SQL, migraciones o datos reales; 677/402 intactos.

**DOCUMENTADO.** Restricciones de V1 en F05 RC01–RC23 y ADR-001–ADR-016:

| Área | Restricción |
|---|---|
| Aplicación | Web en navegador; frontend React + TypeScript + Vite. |
| Backend | ASP.NET Core / C#, un monolito modular y un único backend desplegable. |
| Organización | Clean Architecture; Presentation → Application → Domain; Infrastructure → Application/Domain. Domain no depende de ORM, web, SDK ni hosting. |
| Casos de uso | CQRS con MediatR; validación consistente. FluentValidation está en el stack obligatorio, pero RC08 permite equivalentes: ACL-19 conserva esa diferencia. |
| API | REST, HTTPS y JSON; versionado, OpenAPI/Swagger y errores ProblemDetails. |
| Identidad | ASP.NET Core Identity + JWT y Google OAuth 2.0 / OpenID Connect; RBAC. Las sesiones de servidor no son el mecanismo principal de la API. |
| Persistencia | PostgreSQL inicialmente en Supabase; acceso principal mediante EF Core + Npgsql; migraciones versionadas. |
| Proveedores | Culqi para pagos, Resend para correo y Cloudflare R2 para multimedia. |
| Automatización | Hangfire dentro del backend, trabajos persistentes e idempotentes; almacenamiento compatible con PostgreSQL según ADR-005. El proveedor/esquema concreto sigue pendiente. |
| Despliegue | Frontend en Vercel; backend Docker en Render. Cloudflare DNS para frontend sin proxy adicional delante de Vercel; Proxy/WAF para la API. |
| Versionamiento | Git y GitHub; esta actividad no autoriza commits ni push. |

Fuentes complementarias: F08 §§3–8; F09 §§2–6; F10 §8; F11 §§2–9. La API conserva autenticación, autorización y reglas de negocio; Cloudflare no asume esas responsabilidades.

## 5. Persistencia, calidad y comprobación

**DOCUMENTADO.** F05 RP01–RP08; F04 AC01–AC12:

- Reservas, pagos y auditoría se conservan en PostgreSQL, fuente de verdad de estado y disponibilidad. La caché local o perimetral no es autoridad para inventario, reservas o pagos.
- El frontend accede al negocio mediante la API, nunca directamente a PostgreSQL/Supabase.
- Operaciones críticas transaccionales, control explícito de concurrencia, restricciones e índices, idempotencia y rollback.
- Fechas persistidas por el backend coherentes en UTC (RP08). DEC-023 fija hora local de Perú para interpretar y presentar períodos hoteleros; eso no sustituye UTC en persistencia. La representación/conversión concreta corresponde al diseño técnico.
- Backend stateless, sin sesiones de usuario en memoria como dependencia de escalado ni archivos persistentes de negocio en el disco local del contenedor.
- Dependencias externas desacopladas y reglas de dominio/casos de uso comprobables con dobles de prueba.
- Pruebas de concurrencia obligatorias en flujos críticos: último cupo, última habitación, reserva compuesta, Webhook duplicado y job repetido. F04 AC07 exige estos casos; AC11 incluye integración con PostgreSQL, contratos, arquitectura e idempotencia.
- Trazabilidad mediante logs y auditoría, con fecha UTC y correlación cuando corresponda; son registros con propósitos distintos.
- Mensajes que distinguen indisponibilidad, validación, pago rechazado/pendiente, vencimiento y fallos de terceros. La interfaz no confirma antes que el backend.
- Migraciones versionadas, respaldos según el plan del proveedor y procedimientos de restauración documentados; reconstrucción independiente del disco local.

**OBJETIVO DOCUMENTADO, NO UMBRAL CERRADO:** AC01 fija aproximadamente `< 300 ms` para lecturas simples en backend, excluyendo terceros y red pública. No especifica carga, conjunto de endpoints ni vincula inequívocamente ese objetivo a p95. AC10 tampoco fija una medida de «mensajes claros». ACL-15 conserva estos pendientes sin inventar SLA.

Los controles de pase a producción se encuentran en F04 §4. Se trasladarán a planes y verificaciones según su ámbito, sin presentarlos como pruebas ya ejecutadas.

## 6. Límites explícitos de V1

**DOCUMENTADO.** F05 §5; F08 §9; F00 «Evolución arquitectónica»; ADR-017:

- Sin microservicios, API Gateway independiente, service mesh, event bus distribuido ni bases independientes por módulo en la arquitectura inicial.
- No incorporar Redis, RabbitMQ, Kafka o Kubernetes sin necesidad documentada y decisión arquitectónica correspondiente.
- No sustituir las tecnologías acordadas por SQL Server, Laravel o mecanismos Laravel/PHP enumerados en F05.
- Sin almacenamiento persistente de imágenes en disco local, cálculo financiero oficial en frontend ni acceso directo de frontend a datos de negocio.
- F15 §§3 y 6 delimita visitantes/clientes/administradores: no se añaden portales de vendedores u hoteles, ERP, courier, SMS o WhatsApp. El comprobante tributario electrónico no está definido (F12 §2.7; F15 «Pendientes»).

## 7. Propuestas existentes, pendientes de ratificación

Los comportamientos ya exigidos por RF/RN conservan su obligatoriedad; los mecanismos o políticas siguientes **no se aprueban por aparecer aquí**.

| Propuesta documentada | Fuente | Tratamiento SDD |
|---|---|---|
| Estructura física de proyectos/carpetas, nombres de clases, contratos, contexto compartido y Unit of Work concreto. | F00 «Estructura prevista»; F12 §§2–3 y §6; F18 §2. | Propuesta de diseño para planes; ACL-18. |
| Aplicación detallada de SOLID, repositorios específicos, puertos entre módulos y proyecciones de Reports. | F12 §2.11; F13 «Patrones aplicados»; F14 «SOLID en los módulos». | Principios y diseño documentados; no certifican código ni obligan a copiar nombres de archivos. |
| Transactional Outbox/intención persistida de correo e Idempotent Consumer concreto. | F13 «Patrones aplicados»; F12 §5.4; F17 §6, regla 10. | La entrega recuperable/idempotencia debe cumplir RF/RN; mecanismo propuesto para el plan, ACL-17. |
| Tratamiento de pagos en otros supuestos y job de conciliación. | F12 §§2.6, 2.10, 5.4-5.5; F18 §3, A2. | Reglas de vencimiento, tolerancia, revisión manual y carrera cancelación/inicio resueltas por decisiones de entrevista hasta DEC-033. No aprueban un job automático de conciliación. Pagos excedentes y devoluciones quedan precisados en [002 v0.6](specs/002-pagos/spec.md) por DEC-120–DEC-132; el contrato técnico de Culqi sigue en ACL-04 y ACL-33 quedó resuelta. |
| Tarifas por noche, intervalo civil `[checkIn, checkOut)` y tratamiento de tarifas ausentes. | F12 §§2.4, 4.2 y 5.3. | Tarifa por noche sustituida por DEC-018: períodos completos de 24 horas, sin tolerancia (DEC-019). Contigüidad ya permitida por DEC-030; su representación técnica corresponde al plan, no sigue como pregunta de negocio. |
| Limpieza recuperable de objetos multimedia sin referencias. | F12 §5.2; F13 «Cómo funciona cada patrón». | Propuesta de consistencia de multimedia; ACL-13 y ACL-17. |
| Agregaciones de indicadores y operaciones críticas adicionales. | F12 §§2.8 y 5.6. | DEC-015 ya aprueba acciones de reservas/pagos/horarios/propuestas; otras acciones e indicadores siguen pendientes en ACL-14. |
| Decorator, Observer, Factory, Facade y Strategy en iteraciones posteriores. | F13 «Patrones previstos para siguientes iteraciones». | Condicionados a una necesidad; no son requisitos de V1. |

## 8. Propuestas de proceso SDD

**PROPUESTA SDD:** la división en funcionalidades, orden inicial y estados editoriales se describen en [README](README.md) y [índice de specs](specs/README.md). No sustituyen las prioridades de las HU ni aprueban un alcance de entrega.

La aprobación explícita por spec y las preguntas de una en una son instrucciones del usuario, no propuestas. Toda política desconocida se mantiene como **NECESITA ACLARACIÓN**.
