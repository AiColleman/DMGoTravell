# Decisiones de la entrevista SDD

**Última actualización:** 2026-11-16; registros hasta DEC-250. Se conserva la consolidación anterior del 2026-10-21. Fuente: esta conversación. Las DEC distinguen reglas, aprobaciones, planificación, análisis y propuestas de diseño; no sustituyen RF/HU/RN ni son ADR aceptadas. DEC-208 aprueba 005-C, DEC-209 registra su planificación, DEC-210 la base técnica, DEC-211 el modelo de datos, DEC-212 el contrato de API, DEC-213 su validación documental, DEC-214 el plan de API-01, DEC-215 el borrador OpenAPI no normativo, DEC-216 la matriz de cierre del diseño técnico, DEC-217 la revisión del OpenAPI, DEC-218 la matriz de operaciones, DEC-219 la política de versión/propiedad/deprecación, DEC-220 las decisiones transversales de API, DEC-221 el plan de pruebas de contrato, DEC-222 el plan de ratificación BT-01, DEC-223 el plan de ratificación MD-01/MD-08, DEC-224 el paquete de ratificación, DEC-225 los ejemplos OpenAPI del lote A, DEC-226 los ejemplos del lote B y DEC-227 los ejemplos del lote C y DEC-228 los ejemplos del lote D y DEC-229 los ejemplos del lote E, DEC-230 los ejemplos del lote F, DEC-231 los ejemplos del lote G, DEC-232 los ejemplos del lote H, DEC-233 los ejemplos del lote I, DEC-234 los ejemplos del lote J, DEC-235 los ejemplos del lote K, DEC-236 los ejemplos del lote L, DEC-237 los ejemplos del lote M, DEC-238 los ejemplos de error del lote N, DEC-239 ratifica documentalmente el paquete DEC-219–DEC-223, DEC-240 añade los ejemplos de error específicos del lote O y DEC-241 los del lote P. DEC-242 registra la primera vertical slice implementada, DEC-243 sus resultados parciales de contrato, DEC-244 la idempotencia durable, DEC-245 la reemisión de verificación con recuperación de contraseña, DEC-246 la auditoría persistida de identidad, DEC-247 la consulta y el detalle administrativo de auditoría, DEC-248 la exportación CSV de auditoría, DEC-249 la consulta y el detalle administrativo de clientes y DEC-250 la exportación CSV de clientes. La ratificación documental de DEC-239 no autoriza implementación física, proveedores, harness ni pruebas de runtime; los ejemplos DEC-225–DEC-241 siguen siendo propuestas documentales no ratificadas. Bases/specs/planes/contratos anteriores intactos; registros previos conservan su estado histórico.

DEC-001 y DEC-002 conservan sus registros iniciales en [aclaraciones.md](aclaraciones.md), §4. Las decisiones proceden de la conversación; no se asigna fecha exacta de aprobación a mensajes sin fecha visible. Se conservan respuestas y versiones sustituidas. DEC-034–DEC-037 cerraron los pendientes de reservas y el usuario aprobó después 001 v0.13 con «si» a su solicitud explícita. No se infiere la aprobación de «HAZLO» ni de respuestas previas de aclaración.

## DEC-003 — Pago: 15 minutos más 2 minutos de tolerancia (versión sustituida)

**Estado:** regla temporal histórica, sustituida por DEC-020: 15 + 5 minutos, con inicio comprobable y cancelación al minuto 15 si no hay pago iniciado. Los puntos siguientes conservan el acuerdo anterior, no la regla vigente.

- **Aprobación:** «si» a la última precisión: pago iniciado antes de terminar los 15 minutos y validado antes de terminar el minuto 17; previamente «listo» a 15 + 2 minutos.
- **Regla histórica:** plazo inicial de pago de 15 minutos desde crear la reserva. Durante los 2 minutos adicionales se mantienen cupos y habitación para validar un pago iniciado a tiempo; no se admiten nuevos intentos. Si ese pago se valida a tiempo, se confirma; al concluir la tolerancia sin pago válido se cancela y libera disponibilidad. El plazo base es configurable según las fuentes.
- La aprobación de Culqi puede ocurrir durante la tolerancia: el ejemplo aprobado fue inicio en minuto 14 y aprobación/validación en minuto 16. Sustituye la propuesta previa de exigir que Culqi aceptara el pago dentro de los primeros 15 minutos y la recomendación no aprobada de 20 minutos.
- Un cobro validado después del límite no confirma la reserva, aunque el trabajo de cancelación todavía no se haya ejecutado; corresponde cancelación y tratamiento de devolución. Se conserva DEC-001 para cobros confirmados tras cancelar por vencimiento.
- **Resoluciones posteriores:** DEC-020 define inicio/cancelación sin intento, DEC-028 cierra igualdad, DEC-029 conserva plazos y DEC-034 fija demora operativa máxima de 60 segundos. No mantener abiertas esas definiciones resueltas.
- **Fuentes relacionadas:** RF05, RF08, RF21–RF22; RN-08, RN-14, RN-20–RN-22; HU-08, HU-20. **Specs:** 001–003.

## DEC-004 — Moneda, presentación y precio final

- **Aprobación:** «soles peruano»; «listo» a dos decimales; «listo» a importe final sin añadir impuestos, comisiones ni descuentos no definidos.
- **Regla:** moneda `PEN`; importes con dos decimales; el precio oficial mostrado y calculado es el importe final a pagar. No añadir cargos o descuentos no acordados. Esto no determina tratamiento tributario ni crea una exención fiscal.
- **No definido:** modo y momento de redondeo cuando un cálculo produzca fracciones de céntimo. Dos decimales no eligen por sí solos un algoritmo.
- **Fuentes:** RF06, RF19; RN-02–RN-03; HU-07. **Specs:** 001, 002, 006, 007, 011.

## DEC-005 — Una oferta turística por reserva y paquetes predefinidos

- **Aprobación:** «claro tiene que ser separado»; «si, el administrador creara el paquete y el clinte solo la elige»; «si» a controlar cupos turísticos e inventario hotelero por separado.
- **Regla:** una reserva incluye un tour o un paquete, con una salida. Varias ofertas requieren reservas separadas. El administrador configura el paquete con precio, duración, salida y cupos propios; el cliente lo selecciona, no lo compone como carrito. La disponibilidad turística cuenta personas; la hotelera cuenta habitaciones. Se validan conjuntamente cuando hay hotel.
- **Fuentes:** RF05, RF13, RF18; RN-05–RN-07, RN-12; HU-06, HU-14, HU-22. **Specs:** 001, 006, 007.

## DEC-006 — Alojamiento opcional: una habitación de un tipo y hotel

- **Aprobación:** «si debe agregarse como una reserva junto con el tour o paquete ... o puede ser opcional ... sin el hotel»; «solo un unico tipo»; «una sola opcion»; «si, el sistema reservara una sola habitacion del tipo elegido perteneciente a un hotel».
- **Regla:** el cliente puede reservar solo el tour/paquete o añadir alojamiento. Si lo añade, selecciona una opción del catálogo ofrecido y se reserva exactamente una habitación de un tipo en un hotel. No combina tipos, hoteles ni cantidades de habitaciones en esa reserva.
- Se permite una habitación de mayor capacidad que el grupo («claro» a ese caso). El administrador configura las cantidades disponibles por hotel y tipo («si» a configurar inventario y evitar sobreventa).
- **Precisión posterior DEC-021:** se permite alojar solo parte del grupo turístico; el sistema muestra capacidad de habitación y total de viajeros. No se exige que todos los viajeros quepan en esa única habitación. Esto no autoriza físicamente sobreocuparla.
- **Fuentes:** RF17–RF20; HU-22–HU-23; RN-09, RN-11–RN-13. **Specs:** 001, 007.
- **Cambio respecto a fuentes:** HU-22 y RF19 contemplan cantidades; SDD las restringe a una habitación por decisión explícita. Se conserva el texto original en la trazabilidad.

## DEC-007 — Propuestas de hotel y horarios administrados

- **Aprobación:** «el cliente no puede elegir la fecha y hora del alojamiento»; «el administrador podra administrar y editar todos lo horarios de cada hotel que se asocian»; «si» a conservar los horarios de reservas existentes; «si» a propuestas configuradas para cada salida. DEC-031 ratifica después el vínculo con una salida concreta, no solo con el nombre del tour/paquete.
- **Regla:** el administrador configura, para cada salida turística, propuestas de hotel con período de alojamiento y tipos disponibles. El cliente elige una propuesta, no modifica sus fechas ni horas. Cada hotel tiene sus horarios de entrada y salida administrables. Los cambios de horario afectan nuevas reservas, no las ya creadas.
- El hotel permite llegar a la ciudad, descansar y prepararse antes de salir al destino, según la explicación del usuario. **No** se aprobó exigir que cubra toda la duración del tour; el usuario respondió «NO» a esa propuesta.
- La imagen aportada muestra entrada 12:00 p. m. y salida 11:00 a. m. como ejemplo, **no** horarios obligatorios para todos los hoteles. Sus precios tampoco son valores globales del sistema.
- **Corrección posterior DEC-018:** las propuestas deben durar múltiplos completos de 24 horas. No publicar una estancia de 23 horas como si completara 24 por reproducir la imagen; el horario asignado debe respetar la duración aprobada. DEC-023 fija hora local de Perú.
- **Fuentes:** RF17, RF18, RF20; RN-02, RN-10–RN-12; HU-21–HU-23. **Specs:** 001, 007.

## DEC-008 — Tarifa hotelera fija (unidad temporal resuelta después)

- **Aprobación:** el usuario explica precios fijos por hotel, capacidad y tipo; «si» a que el precio no disminuya cuando se usa menos capacidad.
- **Regla:** la tarifa es fija para la opción de habitación del hotel; no se multiplica de nuevo por cada ocupante. Una habitación de mayor capacidad conserva su tarifa aunque viaje un grupo menor.
- **Correcciones temporales:** primero se respondió sí a tarifa por noche; después el usuario corrigió expresamente «la tarifa fija se cobra por 24 horas». Luego aportó horarios hoteleros fijos y aclaró que el cliente no elige fecha/hora.
- **Resolución posterior DEC-018:** tarifa por cada período completo de 24 horas; total hotelero igual a tarifa fija de la habitación multiplicada por el número de períodos asignados. El usuario rechazó la alternativa de jornadas inferiores a 24 horas. El administrador publica los períodos/horarios; no hay fechas libres del cliente.
- **Fuentes afectadas:** RF19, RN-11, HU-22; F12 §§2.4 y 5.3. **Specs:** 001, 007. Véase ACL-25.

## DEC-009 — Tolerancia de salida de 30 minutos (revocada)

**Estado:** sustituida por DEC-019, que elimina toda tolerancia de salida. Se conserva abajo el antecedente, no una condición vigente del alojamiento.

- **Aprobación:** «30 min», en lugar de las dos horas propuestas.
- **Regla histórica:** 30 minutos para retirarse sin costo adicional después de la salida asignada, sin generar otro cobro/período. Ya no aplica; no confundir salida hotelera con la tolerancia de pago vigente de 5 minutos.
- El margen de salida dejó de ser un bloqueo de inventario al revocarse. No se añaden limpieza, cobros por demora ni vigilancia de huéspedes como funcionalidades.
- **Specs:** 001 como información de condiciones; 007 como configuración de propuesta.

## DEC-010 — Retiro anticipado y extensiones fuera del sistema

- **Aprobación:** «si ya no habra devolucion» al retiro antes de salida asignada; «opcion 1» a extender directamente con el hotel.
- **Regla:** retirarse antes del check-out no genera devolución parcial. Las extensiones se acuerdan y pagan directamente con el hotel, fuera de DMGoTravell; no se añade una funcionalidad de extensión/cobro en V1.
- No elimina la devolución DEC-001 por cobro de reserva vencida ni define toda cancelación pagada (ACL-02).
- **Fuentes:** RF18–RF20, RN-24 y límites de alojamiento aclarados en entrevista. **Specs:** 001, 007; referencia en 002/009.

## DEC-011 — Indisponibilidad de la propuesta elegida

- **Aprobación:** «debe informarle al cliente la indisponibilidad y elegir otra propuesta, y si no hay mas propuestas continuar sin hotel».
- **Regla:** ante pérdida de disponibilidad de la habitación elegida, informar y ofrecer otra propuesta disponible. Si no quedan propuestas, ofrecer continuar solo con tour/paquete. No crear una reserva compuesta parcial ni quitar el hotel automáticamente.
- El alojamiento sigue siendo opcional desde el inicio. **No definido:** si, tras fallar la propuesta, el cliente puede omitir hotel aun existiendo alternativas; la respuesta aceptada condiciona esa continuación a que no queden propuestas.
- **Fuentes:** RF18, RN-09, RN-12–RN-13; HU-22. **Specs:** 001, 007.

## DEC-012 — Un pago conjunto y validación automática

- **Aprobación:** «si como pago unico»; «si» a validación automática de notificaciones oficiales de Culqi.
- **Regla:** el total de tour/paquete y hotel opcional se paga en una única operación por Culqi; no se separa un pago hotelero. La confirmación es automática tras verificar notificación oficial, autenticidad, reserva e importe; no la realiza manualmente un administrador ni basta la pantalla del navegador.
- «Un pago» no excluye intentos rechazados ni autoriza cobrar de nuevo al resultado desconocido. No se inventa firma, cabecera o mecanismo técnico del proveedor. Las fuentes también describen respuesta síncrona; deberá precisarse su relación con el aviso oficial en el diseño de la integración, sin confirmar por información no validada.
- **Fuentes:** RF07–RF08, RN-14–RN-18; HU-08; F01 §3. **Specs:** 001 y 002.

## DEC-013 — Pago rechazado o en verificación

- **Aprobación:** «si» a conservar pending y reintentar ante rechazo; «si» a mostrar «pago en verificación» y bloquear otro intento ante resultado desconocido.
- **Regla vigente:** rechazo antes de terminar la ventana inicial no cancela la reserva y permite otro intento mientras quede tiempo de los 15 minutos. Resultado desconocido muestra «pago en verificación» y bloquea otro intento. El vencimiento no habilita nuevos pagos. DEC-020 fija cinco minutos adicionales solo para intentos iniciados a tiempo; DEC-027 exige cancelar/liberar al recibir rechazo definitivo durante esa tolerancia, sin esperar a 20. DEC-024 mantiene bloqueo de cancelación voluntaria mientras se verifica.
- «Pago en verificación» describe el pago, **no** un quinto estado de reserva. Se registran los intentos; siguen aplicando idempotencia y trazabilidad.
- **Fuentes:** RF07–RF08, RF21; HU-08; F18 §3 A4. **Specs:** 002, 003; condición visible en 001.

## DEC-014 — Protección por propietario

- **Aprobación:** «si» a comprobar propiedad aunque se manipule URL/petición y evitar consultar/cancelar recursos ajenos.
- **Regla:** solo el propietario accede por el flujo de cliente a su reserva y puede cancelar la propia pending. No se confía en el identificador enviado por el navegador para autorizar.
- **Precisión posterior DEC-022:** el usuario aprobó rol + propiedad y no revelar reservas ajenas. La respuesta funcional es recurso no disponible para ese cliente; no mantener esa elección abierta. Su mapeo HTTP pertenece al contrato técnico.
- **Fuentes:** RF10–RF11, RN-19, RN-25; AC05, RS05. **Spec:** 001.

## DEC-015 — Operaciones auditadas

- **Aprobación:** «si» a creación/cancelación de reservas, vencimientos automáticos, pagos validados y cambios administrativos en horarios/propuestas hoteleras.
- **Regla:** esas operaciones forman parte de las acciones críticas auditadas con los datos ya requeridos por RN-28; auditoría no editable. La acción automática `reservation.auto_cancelled` conserva el nombre definido en HU-20. No se inventan nombres oficiales para otras acciones.
- **Fuentes:** RF23, RN-28–RN-29; HU-20. **Specs:** 001–003, 007 y 010. No elimina otras acciones críticas ya exigidas, como cambios de catálogo.

## DEC-016 — Historial y cancelación repetida

- **Aprobación:** sucesivos «si»/«listo» a informar ya cancelada, historial vacío, todos los estados, 10 por página y más recientes primero.
- **Regla:** cancelación repetida por el propietario informa que la reserva ya está cancelada, sin liberar otra vez. Historial propio incluye pending, confirmed, completed y cancelled, muestra 10 reservas por página y ordena de más reciente a más antigua. Si no hay reservas, se muestra vacío y no error.
- **Precisiones posteriores:** DEC-035 fija error de página inválida; DEC-036 fija página válida vacía sin error y sin cambio automático; DEC-037 ordena los empates de creación por número único de reserva descendente. Historial resuelto en ACL-15.
- **Fuentes:** RF10–RF11, RF22; HU-10–HU-11; RN-19, RN-21, RN-25. **Spec:** 001.

## DEC-017 — Devolución gestionada por administrador

- **Aprobación:** «listo»/«acepto» a revisión y gestión manual en V1; «listo» a iniciar el trámite en un máximo de un día hábil desde detectar el caso.
- **Regla:** para el supuesto DEC-001, el sistema registra el caso y avisa que necesita gestión. Un administrador revisa el cobro e inicia la devolución, sin automatizar su solicitud. Debe iniciar el trámite en un máximo de un día hábil desde detectar el caso; no es una promesa de abono en un día. El abono depende del proveedor y del medio de pago.
- **No definido:** calendario/zona para «día hábil», canales de aviso, evidencia que cierra la gestión y tratamiento de una devolución fallida. No equivale a aprobar una política general de cancelaciones pagadas ni exige una API de devolución automática.
- **Fuentes:** F03 §7 y RN-24 como política pendiente; DEC-001. **Specs:** 002, 009 y aviso relacionado con 004 si se acuerda ese canal.

## DEC-018 — Cobro y propuestas por períodos completos de 24 horas

- **Aprobación:** «deberia cobrarse por cada 24 horas, segun la necesidad de alojamiento del cliente»; «son 24 horas»; «si» a entrada y salida separadas por 24 horas; «si» a propuestas de 24, 48, 72 u otros múltiplos de 24 horas.
- **Regla vigente:** la tarifa fija del tipo de habitación de ese hotel corresponde a un período completo de 24 horas. Para varios períodos, multiplicar la tarifa por su cantidad. El administrador publica propuestas por múltiplos positivos de 24 horas y el cliente elige una sin modificar fechas/horas. La necesidad de duración se expresa eligiendo una propuesta, no contratando períodos libres fuera de ella.
- Ejemplo ilustrativo: tarifa S/ 100 por 24 horas; propuesta de 48 horas cuesta S/ 200 de alojamiento, independientemente de cuántos ocupantes dentro de la capacidad la utilicen. Una entrada a las 12:00 corresponde a salida a las 12:00 del día siguiente para 24 horas; no a las 11:00.
- **Sustituye:** unidad temporal pendiente en DEC-008/ACL-25 y propuesta no aprobada de cobrar por jornada hotelera inferior a 24 horas. Los horarios administrables de DEC-007 deben cumplir esta duración y las reservas históricas conservan lo contratado.
- **Fuentes:** RF19, HU-22, RN-10–RN-11; corrige lectura de noches en F03/F12 sin modificar esos documentos. **Specs:** 001/007.

## DEC-019 — Sin tolerancia para retirarse del hotel

- **Aprobación:** «no habra tolerancia para retirase», seguida de «si» a su confirmación.
- **Regla vigente:** no hay minutos adicionales de tolerancia después de la salida hotelera asignada. Se elimina el margen de 30 minutos de DEC-009. No se deduce un cargo automático, sanción ni extensión por incumplir la salida; extensiones siguen directamente con el hotel según DEC-010.
- **Specs:** 001/007; no altera la tolerancia independiente de validación de pago.

## DEC-020 — Pago iniciado a tiempo, 15 + 5 minutos y cancelación diferenciada

- **Aprobación:** «que sean 5 min de tolerancia para validar el pago en ves de 2minutos»; «listo}» a cancelar al minuto 15 sin intento; «si» al ejemplo donde abrir el checkout no cuenta y el pago debe ser recibido por DMGoTravell antes de 15.
- **Regla vigente:** desde creación hay 15 minutos para que DMGoTravell reciba la solicitud de procesamiento del pago. Abrir la pantalla de Culqi o pulsar un botón sin que esa solicitud llegue no amplía el plazo.
- Al minuto 15, si no existe un pago iniciado, cancelar y liberar cupos/habitación. Si existe un pago iniciado a tiempo que necesita validación, mantener los recursos hasta el límite total de 20 minutos; no admitir nuevos intentos durante esos 5 adicionales. Si se valida correctamente antes de terminar esa tolerancia, confirmar; si termina sin validación válida, cancelar/liberar. Cobro validado después no reactiva ni confirma y corresponde el tratamiento DEC-001/DEC-017.
- Ejemplo aprobado: reserva 10:00, solicitud recibida 10:14:59, validación hasta el límite de 10:20. El máximo de retención por esta regla es 20 minutos, no 20 minutos adicionales a los 15.
- **Sustituye:** DEC-003 (15 + 2 / límite 17) y la indefinición de «inicio». No permite empezar pagos después del minuto 15 ni liberar recursos al minuto 15 mientras se valida un intento iniciado a tiempo.
- **Precisiones posteriores:** DEC-027 define rechazo en tolerancia, DEC-028 cierra igualdad, DEC-029 conserva plazos ante cambios y DEC-034 exige completar cancelación/liberación por vencimiento en máximo 60 segundos. La frecuencia técnica se elige después para cumplir ese resultado; no es garantía de entrega de Culqi ni una prórroga de pago.
- **Fuentes:** RF05, RF08, RF21–RF22; HU-08, HU-20; RN-08, RN-14, RN-20–RN-22. **Specs:** 001–003.

## DEC-021 — Alojamiento de parte del grupo con capacidad visible

- **Aprobación:** «solo parte del grupo, es su decision del cliente tomar malas desiciones»; «si» a mostrar capacidad elegida y total de viajeros antes de confirmar.
- **Regla:** la única habitación puede alojar solo parte del grupo turístico; no se rechaza por el mero hecho de que el total de viajeros exceda su capacidad. El cliente decide si añade esa opción. Antes de confirmar la reserva se muestran la capacidad de la habitación y el total de viajeros.
- No equivale a permiso para sobreocupar la habitación; no se incorpora por suposición selección nominativa de huéspedes, nuevas habitaciones ni tarifa por persona. Se mantiene tarifa fija y cantidad de una habitación.
- **Fuentes:** RF18, HU-22 precisada; DEC-006. **Specs:** 001/007.

## DEC-022 — Rol más propiedad y no revelar reservas ajenas

- **Aprobación:** «tiene que tener separacion de roles para que no pase eso»; «si» tras explicar que dos clientes tienen el mismo rol y aprobar rol + propiedad y no revelar datos ajenos.
- **Regla:** separar funciones client/admin; en el flujo de cliente exigir además propiedad de la reserva. Una referencia a reserva ajena se muestra como recurso no disponible para ese cliente, sin revelar existencia/datos ni permitir cancelación. No afecta la consulta administrativa autorizada de todas las reservas.
- **Fuentes:** RF10–RF11, RF14; RN-25–RN-26; RS03/RS05, AC05. **Spec:** 001; políticas compartidas con 005/009. Completa la respuesta que quedaba abierta en DEC-014/ACL-16.

## DEC-023 — Hora local de Perú para alojamiento

- **Aprobación:** «si» a mostrar y aplicar horarios hoteleros en hora local de Perú.
- **Regla:** fechas/horas de las propuestas de alojamiento se interpretan y presentan según hora de Perú; períodos completos de 24 horas según DEC-018. La persistencia consistente en UTC de RP08 se conserva; no se cambia por usar hora local en presentación/reglas de negocio.
- No define el calendario de días hábiles de devoluciones ni horarios festivos por inferencia. **Specs:** 001/007; RP08 y ACL-25.

## DEC-024 — Cancelación bloqueada durante verificación y rechazo de intento

- **Aprobación:** «si» a no permitir cancelación mientras se verifica; después «1» a la aclaración de cancelar solo el intento rechazado, no toda la reserva.
- **Regla:** mientras hay pago en verificación no se admite cancelación voluntaria del cliente. Rechazo antes de terminar los primeros 15 minutos cierra solo el intento y conserva la reserva vigente para reintentar sin renovar ventana. No hay reintentos en tolerancia; DEC-027 precisa después que el rechazo definitivo en esos cinco adicionales cancela la reserva y libera sus recursos. La restricción de cancelación por verificación desaparece al conocer el rechazo, sin derogar otras reglas de estado/propiedad.
- La frase «que cancele y vuelva intentar» no autoriza cancelar toda la reserva: la aclaración «1» eligió la alternativa de solo el intento. El vencimiento automático sigue aplicando aunque el pago continúe desconocido al límite de 20.
- **Resuelto después por DEC-033:** gana la primera operación registrada por el sistema. Cancelación primero impide iniciar pago; inicio primero lleva a verificación y bloquea cancelación voluntaria. No se aplican ambos resultados ni se liberan dos veces recursos.
- **Fuentes:** RF07–RF08, RF11, RF21–RF22; HU-08, HU-11; RN-14, RN-19–RN-22; precisa DEC-013. **Specs:** 001–003.

## DEC-025 — No reducir capacidad por debajo de los compromisos existentes

- **Aprobación:** «si» después del ejemplo de un hotel con tres habitaciones dobles, dos reservadas y rechazo de reducir el total a una; la propuesta explicó que la misma protección se aplica a cupos de tours y paquetes. La pregunta original incluye reservas ya creadas y bloqueos de pendientes.
- **Regla:** el sistema rechaza una reducción administrativa de capacidad turística o inventario hotelero que deje menos recursos que los ya comprometidos por reservas y retenciones pendientes vigentes. Los cupos se comprueban para la salida afectada; habitaciones para el hotel, tipo y período afectados. No se suman ocupaciones de fechas incompatibles como si fueran simultáneas.
- Ejemplo: tres habitaciones totales y dos comprometidas permite reducir a dos, pero no a una. No se cancelan reservas ni se liberan bloqueos para forzar ese ajuste.
- **Límite:** esta decisión no determinaba desactivaciones; DEC-026 y DEC-032 las resuelven después. No autoriza nueva política de cancelación o devolución.
- **Fuentes:** RF13, RF20; RN-07, RN-11–RN-13; HU-14, HU-23; AC07. Ratifica la propuesta de F12 §§2.3–2.4 para preservar compromisos. **Specs:** 001 como invariante compartida, administración en 006/007.

## DEC-026 — Desactivar un hotel solo impide nuevas reservas

- **Aprobación:** «si» a que el hotel deje de aparecer para nuevas reservas, respetando las ya creadas incluidas las pendientes de pago.
- **Regla:** al desactivar un hotel, excluirlo de las opciones para nuevas reservas. Las reservas ya creadas que lo incluyen conservan alojamiento, condiciones y bloqueos; no se cancelan ni se libera su habitación por la desactivación. Una reserva pendiente conserva su posibilidad de pago y sus plazos normales, sin prórroga ni reapertura de una vencida.
- **Distinción:** la actividad del hotel se exige para crear una nueva reserva (RN-01), no para invalidar retroactivamente una ya creada. La desactivación no equivale a un cierre físico del hotel ni define una cancelación administrativa por indisponibilidad real.
- **Límite de la aprobación inicial:** se refería a hoteles. La aplicación a ofertas, salidas, tipos de habitación y propuestas se aprueba explícitamente después en DEC-032, no se deduce de DEC-026.
- **Fuentes:** RF17–RF20, HU-21–HU-23; RN-01, RN-08, RN-12–RN-13, RN-30. **Specs:** 001 como invariante de reservas existentes y 007 para administración/publicación.

## DEC-027 — Rechazo definitivo durante tolerancia cancela y libera

- **Aprobación:** «si» a cancelar la reserva y liberar recursos al recibir un rechazo de Culqi en el minuto 18, sin esperar al límite de 20 porque ya no se admite otro intento.
- **Regla:** si el intento iniciado a tiempo recibe un rechazo definitivo validado durante los cinco minutos de tolerancia, cancelar la reserva pendiente y liberar una sola vez sus cupos y habitación, si corresponde, en ese momento. No esperar al minuto 20 ni permitir otro intento de pago en esa reserva.
- **Distinción:** no se aplica a timeout, ausencia de respuesta o resultado desconocido; esos casos permanecen en verificación hasta resultado válido o vencimiento. El rechazo dentro de la ventana inicial conserva la reserva y permite reintento mientras queden minutos (DEC-013/DEC-024).
- **Precisión, no cancelación universal:** modifica la regla de «solo cerrar el intento» únicamente para rechazo conocido durante tolerancia. No autoriza confirmar manualmente, renovar plazos o tratar un aviso no auténtico como rechazo definitivo.
- **Fuentes:** RF07–RF08, RF21–RF22; HU-08, HU-20; RN-20–RN-22; completa DEC-020/DEC-024 y ACL-03. **Specs:** 001–003. Liberación y auditoría reutilizan las obligaciones existentes.

## DEC-028 — Los límites de 15 y 20 minutos son excluyentes

- **Aprobación:** «listo» a que al cumplirse exactamente 15 minutos ya no se admitan nuevos pagos y al cumplirse exactamente 20 ya no se confirme por un pago tardío.
- **Regla:** para ser iniciado a tiempo, DMGoTravell debe recibir la solicitud antes del instante de creación más 15 minutos. Una solicitud recibida exactamente en ese instante o después se rechaza. La validación de un pago iniciado a tiempo debe completarse antes del instante de creación más 20 minutos; exactamente al límite o después no confirma la reserva y aplica vencimiento/devolución según corresponda.
- En el corte de 15 no se cancela una reserva que conserva un pago iniciado a tiempo en verificación; esa retención sigue hasta validar o terminar tolerancia. El máximo total es 20 minutos, no una prórroga indefinida por tener un pago desconocido.
- **Distinción:** comparar recepción y validación de DMGoTravell, no la hora del navegador ni la supuesta hora de un clic. No se amplían plazos si el trabajo de vencimiento se ejecuta tarde.
- **Fuentes:** RF05, RF08, RF21–RF22; RN-08, RN-14, RN-20–RN-22; precisa DEC-020 y resuelve el borde de igualdad de ACL-03. **Specs:** 001–003.

## DEC-029 — Cambios de plazos solo para nuevas reservas

- **Aprobación:** «si» a aplicar cambios futuros de configuración de plazos únicamente a nuevas reservas y conservar los tiempos originales de las ya creadas.
- **Regla:** una reserva conserva la ventana inicial de pago y la tolerancia de validación que tenía al crearse. Cambiar cualquiera de esos valores en la configuración no modifica los límites de reservas existentes, no reinicia sus contadores ni reabre una cancelada. Los nuevos valores aplican solo a reservas creadas después del cambio.
- **Alcance:** política ante cambios de la configuración ya prevista; no añade una pantalla administrativa ni permite al cliente modificar su plazo. Los valores iniciales siguen siendo 15 + 5 y sus cortes excluyentes se conservan (DEC-020/DEC-028).
- **Fuentes:** RF05, RF21, RN-08/RN-20, HU-20; F01 §7 y F12 §2.10. **Specs:** 001–003; completa ACL-03.

## DEC-030 — La siguiente estancia puede comenzar al terminar la anterior

- **Aprobación:** «puede reservarse» a si una habitación con salida a las 12:00 puede reservarse para otro cliente desde esas mismas 12:00.
- **Regla:** una nueva estancia puede empezar exactamente cuando termina la anterior en esa habitación. DMGoTravell no añade tiempo de preparación ni tolerancia hotelera entre ambas. La ocupación hasta la salida no se superpone por ese único extremo a la que empieza en ese instante.
- No crea más habitaciones ni permite dos asignaciones solapadas; las demás restricciones de disponibilidad siguen aplicando. Se mantiene la tarifa/duración de 24 horas completas y el inventario compartido del hotel/tipo, no uno independiente por salida turística.
- **Fuentes:** RF18–RF20, RN-11–RN-13; DEC-018/DEC-019. **Specs:** 001/007. Cierra el punto residual de contigüidad de ACL-25.

## DEC-031 — Propuesta hotelera vinculada a una salida concreta

- **Aprobación:** «si» después de explicar dos salidas de un mismo tour en fechas distintas y recomendar vincular cada propuesta hotelera con la salida concreta.
- **Regla:** cada propuesta hotelera ofrecida durante la reserva corresponde a una salida específica del tour/paquete. Al reservar esa salida solo se muestran propuestas asociadas a ella; no basta que pertenezcan al mismo tour en otra fecha. El administrador puede asociar el mismo hotel a distintas salidas con las propuestas correspondientes, respetando su inventario real compartido.
- Ratifica DEC-007; no permite al cliente modificar el período ni exige una estancia mínima que cubra todo el tour. La asociación administrada resuelve la relación funcional solicitada; no se inventa una desigualdad adicional entre entrada al hotel y hora del tour que el usuario no aprobó.
- **Fuentes:** RF18–RF20; HU-22–HU-23; RN-05, RN-10–RN-13. **Specs:** 001/006/007; completa ACL-07.

## DEC-032 — Desactivaciones conservan las reservas ya creadas

- **Aprobación:** respuestas «si» a desactivar una salida de tour/paquete, un tipo de habitación y una propuesta hotelera; luego «si» a desactivar el tour/paquete completo conservando reservas creadas, incluidas pendientes con plazos normales.
- **Regla:** esas desactivaciones solo impiden nuevas reservas del elemento desactivado. Las existentes conservan cupos, alojamiento si corresponde, condiciones, precios y plazos normales. Las pending pueden completar su pago mientras sean cobrables; no se cancelan ni liberan sus recursos solo por desactivar el elemento.
- Extiende de forma explícita DEC-026, sin reabrir una reserva cancelada ni prorrogar vencimientos. Una desactivación no es una cancelación por imposibilidad real de prestar el servicio; el tratamiento de cancelaciones administrativas pagadas permanece en ACL-02.
- **Fuentes:** RF13, RF14, RF17–RF20; RN-01, RN-08, RN-12–RN-13, RN-30; HU-15/HU-23. **Specs:** 001/006/007, referencia operativa 009. Cierra ACL-08 para estos supuestos.

## DEC-033 — Primera operación registrada: cancelación o inicio de pago

- **Aprobación:** «si}» a que gane la primera operación que el sistema registre, después de explicar ambos órdenes posibles.
- **Regla:** si el sistema registra primero la cancelación válida, la reserva queda cancelled y no admite iniciar un pago después. Si registra primero el inicio válido del pago, la reserva entra en verificación del pago y se rechaza cancelación voluntaria hasta conocer resultado, según DEC-024. Se aplica un solo orden válido sobre la reserva; no dos resultados incompatibles por simultaneidad.
- «Registrada» es la operación aceptada por el sistema sobre esa reserva, no la hora del clic del navegador. Cómo garantizar ese orden con persistencia/concurrencia pertenece al plan; no se elige un algoritmo en esta decisión de comportamiento.
- Si después de una cancelación aceptada se confirma un cobro, conservar la reserva cancelada y tratar el dinero según la regla de devolución ya acordada (registro/aviso y gestión manual por admin; DEC-017). Esta aplicación a cancelación voluntaria es una precisión nueva aprobada, no una interpretación retroactiva de DEC-001, que se refería a vencimiento.
- **Fuentes:** RF07–RF08, RF11, RF22; HU-08, HU-11; RN-14–RN-15, RN-19, RN-21–RN-22. **Specs:** 001–003; completa ACL-01 para la carrera sin resolver una política general de cancelación pagada.

## DEC-034 — Cancelación y liberación por vencimiento en máximo 60 segundos

- **Aprobación:** «si» a completar cancelación automática y liberación de cupos/habitación en un máximo de 60 segundos después del vencimiento; ejemplo de límite 10:20 y recursos liberados como máximo a las 10:21.
- **Regla:** al vencer una reserva pendiente según el corte que le corresponda (15 minutos sin pago iniciado o 20 con intento por validar), completar cancelación automática y liberación única de los recursos bloqueados como máximo 60 segundos después de ese instante. Es demora operativa máxima, no tiempo adicional para pagar/confirmar.
- Desde el corte exacto no se acepta la operación de pago que ya quedó fuera de plazo (DEC-028), aunque la cancelación/liberación aún se esté completando. No se admite retener recursos indefinidamente por resultado desconocido.
- Cancelaciones voluntarias y rechazos definitivos siguen liberando al procesarse; no se les añade una espera de 60 segundos. No se elige aquí frecuencia del trabajo ni un mecanismo técnico.
- **Fuentes:** RF21–RF22; HU-20; RN-20–RN-22; AC07. **Specs:** 001/003 y condición de vigencia para 002. Cierra el pendiente de demora de ACL-03.

## DEC-035 — Página de historial inválida: error explícito, sin sustitución

- **Aprobación:** «si» a mostrar «Número de página no válido» cuando se solicita página 0, negativa o texto, sin cambiar silenciosamente a otra página.
- **Regla:** una entrada de página inválida produce el mensaje acordado; no se sustituye automáticamente por la primera ni por otra página. No devolver reservas de una página distinta como si fueran las solicitadas. La validación no cambia propiedad ni los diez elementos máximos por página.
- **Límite de esta decisión:** no decidía página válida sin resultados ni desempate; quedaron resueltos después en DEC-036/DEC-037. No aplicar el error al historial vacío, que se muestra sin error (DEC-016).
- **Fuentes:** RF10, HU-10; criterios transversales de validación F02 §10; completa ACL-15 para la entrada inválida. **Spec:** 001; no extender a toda consulta paginada por inferencia.

## DEC-036 — Página válida sin resultados: vacía, sin error ni redirección

- **Registro:** 2026-10-22.
- **Aprobación:** «si» a la recomendación de lista vacía con «No hay reservas en esta página», sin error ni cambio automático a otra página, después del ejemplo de pedir la página tres cuando solo hay dos con resultados.
- **Regla:** un número de página válido pero sin reservas devuelve una lista vacía y muestra el mensaje acordado. No se trata como número inválido ni se sustituye la página solicitada por la última disponible o la primera. No cambia el aislamiento por propietario ni el máximo de diez reservas por página.
- **Fuentes:** RF10, HU-10; completa DEC-016/DEC-035 y ACL-15 para el historial. **Spec:** 001; no se extiende a consultas administrativas por inferencia.

## DEC-037 — Desempate por número único de reserva descendente

- **Registro:** 2026-10-22.
- **Aprobación:** «si» a ordenar reservas con el mismo instante de creación por su número único de reserva, de mayor a menor, para conservar un orden estable entre páginas.
- **Regla:** el criterio principal sigue siendo creación de más reciente a más antigua. Solo si coincide el instante de creación, ordenar por número único de reserva descendente. No sustituir ese número por un dato no acordado ni elegir un desempate aleatorio entre consultas con el mismo conjunto de reservas.
- **Límite:** no define formato, algoritmo de generación ni tecnología del número; pertenecen al diseño técnico. No exige que el número represente cronología cuando las fechas son distintas: el orden principal sigue siendo la creación. No promete congelar el historial si se crean nuevas reservas entre consultas.
- **Fuentes:** RF10, HU-10; completa DEC-016 y cierra los bordes del historial de ACL-15. **Spec:** 001.

## Lectura vigente de decisiones y propuestas descartadas

| Tema | Versión anterior | Versión vigente / pendiente |
|---|---|---|
| Plazo de pago | 20 minutos recomendados; luego 15 + 2 / límite 17. | DEC-020/DEC-028: recepción antes de 15 y validación antes de 20; igualdad ya fuera de ventana. Sin pago cancelar al 15; con pago por validar retener hasta 20, sin nuevos intentos en tolerancia. |
| Hoteles | Posible vista solo informativa. | Usuario corrigió: alojamiento reservable y opcional junto con tour/paquete. |
| Estancia | Cliente elige fechas/horas o alojamiento cubre obligatoriamente todo el tour. | DEC-007: propuestas asignadas por admin; el usuario rechazó la cobertura mínima obligatoria. |
| Tarifa temporal | Por noche; unidad pendiente ante imagen de 23 horas. | DEC-018: tarifa por cada 24 horas completas; propuestas de 24/48/72 u otros múltiplos publicados por admin. |
| Tolerancia hotelera | DEC-009: 30 minutos. | DEC-019 la elimina; no existe margen de salida. La tolerancia de pago es otra regla. |
| Habitaciones | Varias de un tipo. | DEC-006: exactamente una habitación del tipo y hotel elegidos. |
| Extensión | Funcionalidad para ampliar y pagar desde el sistema. | DEC-010: directamente con el hotel, fuera de V1. |
| Grupo turístico y habitación | Debían caber todos; después punto abierto. | DEC-021 permite alojar solo parte del grupo, mostrando capacidad y total de viajeros. |
| Recursos ajenos | Respuesta exacta pendiente. | DEC-022 aprueba rol + propiedad y recurso no disponible sin revelar datos ajenos. |
| Cancelación durante pago | Punto pendiente. | DEC-024 bloquea cancelación voluntaria en verificación; rechazo antes de 15 solo cierra intento. DEC-027 cancela/libera ante rechazo definitivo en tolerancia. |
| Devolución | Gestión/plazo pendientes. | DEC-017: administrador inicia en máximo un día hábil; calendario y comunicación pendientes. |
| Reducción de capacidad | Propuesta de diseño pendiente. | DEC-025 rechaza reducir bajo reservas/retenciones vigentes. |
| Desactivación de hotel | Efecto sobre compromisos pendiente. | DEC-026 excluye nuevas reservas y conserva las existentes, incluidas pending sin prorrogar sus plazos. |
| Cambios de plazos | Efecto sobre reservas creadas pendiente. | DEC-029 conserva sus tiempos originales; nueva configuración solo para nuevas reservas. |
| Contigüidad de estancias | Margen entre huéspedes pendiente. | DEC-030 permite entrada exactamente al terminar la estancia anterior; sin tiempo adicional configurado. |
| Relación hotel/turismo | Vínculo concreto pendiente de ratificar. | DEC-031: propuesta asociada a la salida específica; no mostrar la de otra fecha del mismo tour. |
| Desactivar oferta/salida/tipo/propuesta | Tratamiento de reservas existentes pendiente. | DEC-032 conserva reservas creadas y bloquea nuevas; pending conserva sus plazos. |
| Cancelación e inicio de pago concurrentes | Precedencia pendiente. | DEC-033: primera operación registrada gana; cobro después de cancelar no reactiva y corresponde devolución. |
| Demora de liberación por vencimiento | Umbral operativo pendiente. | DEC-034: cancelación/liberación completadas en máximo 60 segundos tras el corte, sin ampliar pago ni validación. |
| Página de historial inválida | Respuesta pendiente. | DEC-035: «Número de página no válido», sin cambiar automáticamente a otra página. |
| Página válida sin resultados | Respuesta pendiente. | DEC-036: lista vacía con «No hay reservas en esta página», sin error ni cambio automático. |
| Empate en creación del historial | Criterio secundario pendiente. | DEC-037: número único de reserva de mayor a menor, manteniendo creación descendente como criterio principal. |

Los ejemplos de precios/horarios no son catálogos de producción. La conversación sobre colas y Hangfire no aprobó introducir un broker ni sustituir las transacciones: se conserva la arquitectura existente. Los acuerdos no autorizan código, commits o push ni aprueban otras specs por inferencia.

## Aprobación documental — Spec 001 v0.13

- **Fecha:** 2026-10-22.
- **Pregunta:** «¿Apruebas explícitamente la especificación 001 — Reservas del cliente, versión 0.13?».
- **Respuesta literal del usuario:** «si».
- **Efecto:** aprobación de la versión completa presentada, incluidos 105 criterios locales y sus límites/dependencias. Se mantiene la versión 0.13; esta anotación no cambia comportamiento.
- **Ámbito:** permite pasar a plan/tareas de 001 respetando sus dependencias y los pendientes técnicos. No aprueba otras specs ni autoriza código, cambios en originales, commits o push. No se generan plan/tareas al registrar esta aprobación.
- **Registro principal:** [001-reservas/spec.md](specs/001-reservas/spec.md), sección «Aprobación de esta especificación».
- **Planificación posterior:** el usuario indicó «primero reservas» y, tras la aprobación, se crearon [plan.md](specs/001-reservas/plan.md) y [tasks.md](specs/001-reservas/tasks.md) como documentos no ejecutados. No autoriza código ni elimina puertas de dependencias.

## Nueva ronda — Movilidad informativa y presentación del catálogo

**Registro:** 2026-10-22. Solicitud nueva posterior a aprobar 001; no se altera la spec de reservas ni se presume aprobada una nueva spec. Movilidad no figura como funcionalidad en RF01–RF24/HU-01–HU-23: su fuente es la solicitud explícita del usuario, no un RF original reinterpretado. La elección de numeración 013 y la división documental son organización SDD, no nuevos requisitos del producto.

### DEC-038 — Movilidad pública exclusivamente informativa

- **Origen:** «quisiera agregar en mi parte de landing page una seccion llamado movilidad ... que solamente mostraria de informacion para el cliente ... tipos de vehiculos ... la empresa».
- **Aprobación de alcance:** «si» a sección pública sin reservas, precios, disponibilidad, alquiler ni solicitudes de contacto desde el sistema.
- **Regla:** presentar la movilidad ofrecida por la empresa como información independiente del catálogo reservable. No añadir vehículos como componentes de reserva, pagos, disponibilidad o cotización. La exclusión de precios se limita a Movilidad, no a tours, paquetes o hoteles.
- **Destino:** spec 013; ninguna HU/RF oficial original equivalente. No crear RF25 ni HU-24 por inferencia.

### DEC-039 — Información publicada de movilidad

- **Aprobación:** «lo que dijiste» a nombre o tipo, capacidad de pasajeros, imagen y características principales por vehículo.
- **Regla:** esos son los datos informativos de cada opción publicada. No añadir matrícula, conductor, ubicación en tiempo real, equipaje, tarifas o categorías de licencia no solicitadas.
- **Pendiente:** confirmar si una entrada representa un tipo/categoría de vehículo o una unidad concreta y los límites de los datos. No inventar un inventario de flota reservable.
- **Destino:** spec 013.

### DEC-040 — Administración de movilidad

- **Aprobación:** «si» a que el administrador pueda crear, editar, activar y desactivar los vehículos informativos.
- **Regla:** esas operaciones pertenecen al administrador. Se mantienen las restricciones documentadas de autorización administrativa; no se incorporan cuentas de conductores ni otro rol.
- **Límite:** no se aprueba eliminación física, importación masiva, orden manual, auditoría específica de nuevas acciones ni historial de versiones del contenido por inferencia. Las operaciones críticas de movilidad siguen por definir dentro de la política transversal de auditoría.
- **Destino:** spec 013; RN-26/RS03 son restricciones transversales, no requisitos originales de gestión de vehículos.

### DEC-041 — Solo movilidad activa en público, desactivados administrables

- **Aprobación:** «si» a mostrar solo activos y conservar los desactivados para administración e historial, ocultos al cliente.
- **Regla:** la consulta pública no muestra registros desactivados; el administrador puede seguir gestionándolos y volver a activarlos. Conservar el registro no equivale a una nueva funcionalidad de historial de versiones o portal de auditoría de flota.
- **Pendiente:** presentación de sección y enlace cuando no hay activos, sin ocultarlos ni mostrar ejemplos ficticios por suposición.
- **Destino:** spec 013.

### DEC-042 — Tarjetas de movilidad sin detalle individual

- **Aprobación:** «si» a tarjetas informativas dentro de la landing sin página individual de detalle en V1.
- **Regla:** los datos acordados de movilidad se presentan en las tarjetas de la sección. No se introduce una vista individual pública de cada vehículo. No define un carrusel, filtros, buscador o paginación.
- **Destino:** spec 013. No aplicar la ausencia de detalle a Tours/Paquetes, cuyo detalle sí existe.

### DEC-043 — Navegación pública a Movilidad

- **Aprobación:** «si» a opción pública «Movilidad» junto a Tours, Paquetes y Hoteles, que lleva a su sección de la landing.
- **Regla:** ofrecer esa opción de navegación hacia la sección correspondiente. No crear una página de alquiler ni otra vista de detalle; posición visual exacta, animación y dirección técnica se concretarán después sin convertirlas en nuevas capacidades.
- **Destino:** spec 013 y navegación compartida de la landing.

### DEC-044 — Resumen de Tours/Paquetes y detalle con información e itinerario

- **Origen:** el usuario pide asegurar información e itinerario de cada tour/paquete para conocer su contenido.
- **Aclaración:** ante dos opciones, el usuario eligió «2»: tarjeta de landing con resumen y, al seleccionar la oferta, detalle con información e itinerario completos. El «si» previo no seleccionaba una de las opciones y no se registra como tal.
- **Regla:** tanto tours como paquetes muestran un resumen en sus tarjetas; la información completa y el itinerario se consultan al abrir el detalle de la oferta elegida. No mostrar obligatoriamente el itinerario íntegro en la tarjeta ni aplicar la regla de Movilidad sin detalle.
- **Fuentes existentes:** RF01/RF02 y HU-01/HU-02, F02 §1 y F03 §1. Se preservan descripción, precio base, duración, itinerario, imágenes, disponibilidad consultable y 404 de oferta inexistente/no visible; no los sustituye un resumen vacío.
- **Destino:** acuerdos de spec 006 Catálogo, no modificación de 001. No prescribe URL, página frente a otra forma de detalle, estructura de días/paradas, mapa, descargas o campos de inclusiones/exclusiones todavía no definidos.

### DEC-045 — Ocultar Movilidad sin registros activos

- **Aprobación:** «si» a ocultar la sección Movilidad y su enlace de navegación cuando no haya vehículos activos.
- **Regla:** si no hay registros activos, no presentar la sección ni la opción pública «Movilidad». No mostrar registros inactivos, tarjetas ficticias ni un estado vacío al visitante. Cuando exista al menos uno activo, aplicar la sección/navegación de DEC-041/DEC-043.
- **Destino:** spec 013; cierra ACL-26. No cambia la navegación de Tours, Paquetes ni Hoteles.

### DEC-046 — Cada tarjeta representa una categoría de vehículo

- **Aprobación:** «si» a que cada tarjeta represente un tipo o categoría, no una unidad individual con placa.
- **Regla:** Movilidad publica categorías como miniván o bus según el contenido que el administrador mantenga. No crear matrículas, seguimiento de unidades ni inventario de flota reservable.
- **Destino:** spec 013; cierra la granularidad de ACL-27.

### DEC-047 — Registro nuevo inactivo y condiciones de activación

- **Aprobación:** «si» a crear el registro desactivado y permitir activarlo solo con nombre/tipo, capacidad válida, imagen y características principales.
- **Regla:** el administrador puede conservar un registro incompleto en estado desactivado para editarlo. Para activarlo debe tener los cuatro datos acordados y cumplir las validaciones específicas ya aprobadas. No se publica automáticamente al crear.
- **Destino:** spec 013; no fijar longitud de textos ni otros campos no acordados.

### DEC-048 — Una imagen principal de formato admitido

- **Aprobación:** «si» a una imagen principal por categoría, sin galería; «si» a formatos JPG, PNG o WebP; «si» a máximo 5 MB.
- **Regla:** cada categoría tiene una sola imagen principal. Para activar/publicar, su imagen debe estar en JPG, PNG o WebP y no exceder 5 MB. No se incorpora galería, vídeo, múltiples imágenes ni otros formatos por inferencia.
- **Destino:** spec 013; concreta RS10 para esta funcionalidad. La respuesta ante carga o reemplazo fallido sigue pendiente, no se inventa recuperación.

### DEC-049 — Capacidad positiva y nombre/tipo activo único

- **Aprobación:** «xi» interpretado como aceptación de capacidad entera mayor que cero; «si» a impedir duplicados activos de nombre/tipo ignorando mayúsculas y espacios exteriores.
- **Regla:** capacidad de pasajeros es un entero mayor que cero. No pueden coexistir dos registros activos cuyo nombre/tipo sea igual al comparar sin distinguir mayúsculas ni espacios exteriores. Los registros desactivados pueden conservar su contenido para administración; esta regla no aprueba eliminación física ni fusión automática de duplicados.
- **Destino:** spec 013; no define una capacidad máxima ni el tratamiento exacto de un duplicado al activar, que se expresa en los criterios de la spec.

### DEC-050 — Orden alfabético de tarjetas de Movilidad

- **Aprobación:** «si» a ordenar tarjetas alfabéticamente por nombre o tipo, sin orden manual adicional.
- **Regla:** las tarjetas públicas se ordenan alfabéticamente por el nombre/tipo de la categoría. No agregar prioridad manual, carrusel, filtro, buscador o paginación por esta decisión.
- **Destino:** spec 013; no define desempate de nombres iguales porque DEC-049 evita duplicados activos equivalentes.

### DEC-051 — Auditoría de cambios de Movilidad

- **Aprobación:** «si» a auditar creación, edición, activación y desactivación de registros de Movilidad.
- **Regla:** esas cuatro operaciones se consideran críticas y registran la información exigida por RN-28. Los registros de auditoría no se editan/eliminan desde la aplicación, conforme a RN-29. No se inventan nombres oficiales de acciones ni se extiende por esto una auditoría de vistas públicas.
- **Destino:** spec 013 y futura 010; completa el alcance de auditoría de ACL-27 para Movilidad.

### DEC-052 — Fallo de carga o reemplazo de imagen de Movilidad

- **Aprobación:** «si» a mostrar «No se pudo cargar la imagen», conservar la imagen anterior si existía y mantener desactivado el registro si no tenía imagen.
- **Regla:** ante fallo de carga o reemplazo, informar el mensaje acordado. Si el registro ya tenía imagen principal, conservarla sin sustituirla por un archivo fallido. Si no tenía imagen principal, mantener el registro desactivado; no activar/publicar con imagen ausente. Las demás ediciones no se descartan por inferencia: la decisión solo determina imagen y estado de publicación.
- **Límite:** no se introduce placeholder, archivo temporal visible, limpieza recuperable, reintento automático o mensaje alternativo. No define razones técnicas del fallo ni proveedor de almacenamiento.
- **Destino:** spec 013; cierra ACL-27. La aprobación de esta regla no aprueba la spec completa ni crea plan/tareas.

### Estado de Movilidad después de la tercera aclaración

Se resolvieron presencia sin activos, granularidad, activación, imagen, orden, auditoría y fallo de imagen. El último «si» autoriza registrar DEC-052 en `sdd/`, no aprobar la spec 013 ni crear plan/tareas. El borrador puede presentarse para aprobación explícita de su versión completa.

## Aprobación documental — Spec 013 v0.3

- **Fecha:** 2026-10-22.
- **Solicitud presentada:** «¿Apruebas explícitamente la especificación 013 — Movilidad informativa en landing, versión 0.3?».
- **Respuesta del usuario:** «ya te dije si».
- **Interpretación registrada:** confirmación explícita de la solicitud presentada inmediatamente antes, tras indicar que se había repetido la pregunta. Esta aprobación es distinta de los «si» anteriores a decisiones individuales.
- **Efecto:** aprobación de 013 v0.3, incluidos sus 32 criterios locales, límites y dependencias. No modifica criterios ni aprueba 006 u otras specs.
- **Ámbito:** habilita pasar a plan/tareas de 013, respetando exclusiones informativas y restricciones transversales. No crea archivos de plan/tareas aquí ni autoriza código, documentación original, commits o push.
- **Registro principal:** [013-movilidad-informativa/spec.md](specs/013-movilidad-informativa/spec.md), sección «Aprobación de esta especificación».
- **Planificación posterior, 2026-10-23:** tras crear plan/tareas de Reservas, el usuario respondió «si» a continuar con plan/tareas de Movilidad y luego «continua». Se crean [plan](specs/013-movilidad-informativa/plan.md) y [tasks](specs/013-movilidad-informativa/tasks.md) de 013 como diseño/backlog no ejecutado. No se modifica ninguna spec aprobada ni se añade aprobación funcional por una propuesta técnica.

## DEC-053 — Alta desactivada y contenido obligatorio para publicar Tours/Paquetes

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿Cada tour o paquete nuevo debe crearse desactivado y permitir al administrador publicarlo solo cuando tenga título, descripción, precio, duración, itinerario, al menos una imagen y condiciones completos?».
- **Respuesta:** «si».
- **Regla:** toda oferta nueva se crea desactivada. El administrador puede activarla cuando todos esos contenidos estén completos; si falta alguno, la activación se rechaza. Tenerlos completos al crearla no implica activación automática.
- **Límite:** no define límites de campos, estructura del itinerario, máximo/formato/tamaño de imágenes, necesidad de salidas reservables ni tratamiento de ediciones incompletas de ofertas ya activas. Estas dudas siguen visibles.
- **Fuentes/destino:** RF13, HU-14; [006 v0.2](specs/006-catalogo/spec.md), RF-13/RF-15/RF-33; cierre parcial de ACL-29. Primera respuesta de la ronda, no aprobación de la spec completa.

## DEC-054 — Campos del resumen en tarjetas de Tours/Paquetes

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El resumen de cada tarjeta debe mostrar imagen principal, título, descripción breve, duración y precio base?».
- **Respuesta:** «si».
- **Regla:** las tarjetas de tours y paquetes muestran esos cinco campos. Complementa DEC-044, que conserva información e itinerario completos en el detalle.
- **Límite:** no define extensión/origen de la descripción breve, selección de imagen principal ni máximo de imágenes del detalle. Tampoco acuerda estructura del itinerario.
- **Fuentes/destino:** RF01, HU-01; [006 v0.3](specs/006-catalogo/spec.md), RF-34; cierre parcial de ACL-28. Segunda respuesta de la ronda, no aprobación del documento completo.

## DEC-055 — Itinerario por días para Tours y Paquetes

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El itinerario debe organizarse por días, con actividades en orden y una descripción de cada actividad?».
- **Respuesta:** «si y tambien para los paquetes».
- **Regla:** el itinerario de cada tour y de cada paquete se organiza por días, con actividades ordenadas y descripción de cada actividad. El detalle muestra este itinerario completo conforme a DEC-044.
- **Límite:** no define horarios obligatorios, número máximo de días/actividades, longitudes, mapas ni descargas. No cambia la composición predefinida de los paquetes ni las reservas aprobadas.
- **Fuentes/destino:** RF02, HU-02; [006 v0.4](specs/006-catalogo/spec.md), RF-35. Resuelve la organización del itinerario de ACL-28. Tercera respuesta de la ronda; no aprobación de la spec completa.

## DEC-056 — Precio administrable por salida de Tour/Paquete

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El precio será el mismo para todas las salidas de un tour o paquete, o el administrador podrá definir un precio distinto por salida?».
- **Respuesta:** «el admin podra definir el precion por salida».
- **Regla:** el administrador puede definir un precio propio por salida, tanto de tours como de paquetes. Una nueva reserva usa la tarifa turística vigente de la salida seleccionada; se conserva el precio de reservas existentes, conforme a RN-02/001.
- **Límite:** no define cómo se obtiene el precio base de tarjeta/detalle, una tarifa de respaldo para salidas sin precio, descuentos ni cambios al alojamiento. PEN y dos decimales siguen vigentes.
- **Fuentes/destino:** RF06/RF13, HU-07/HU-14, RN-02/RN-03; [006 v0.5](specs/006-catalogo/spec.md), RF-28/RF-36; cierre parcial ACL-29. Cuarta respuesta de la ronda; no aprobación de la spec completa.

## DEC-057 — Precio base público independiente

- **Fecha:** 2026-10-24.
- **Opciones presentadas:** 1) «Desde S/…», usando la salida reservable más económica; 2) un precio base independiente definido por el administrador. Se explicó la opción 1 con un ejemplo a petición del usuario.
- **Respuesta:** «la opcion 2», seguida de la solicitud de descuentos registrada en DEC-058.
- **Regla:** el precio base público de tours/paquetes lo define el administrador de forma independiente de las tarifas por salida. No se calcula como el mínimo de salidas. Se conserva la tarifa de la salida seleccionada como referencia turística de la nueva reserva (DEC-056).
- **Límite:** no establece que el precio base supla una tarifa de salida ausente ni define cómo se muestran/aplican descuentos.
- **Fuentes/destino:** RF01/RF02/RF13; [006 v0.6](specs/006-catalogo/spec.md), RF-37; cierre parcial de ACL-29. Quinta respuesta de la ronda; no aprobación de 006 completa.

## DEC-058 — Descuentos administrados para Tours y Paquetes

- **Fecha:** 2026-10-24.
- **Solicitud:** «me olvide tambien de que el admin podra realizar descuentos ya sea para tours o paquetes».
- **Alcance incorporado:** el administrador podrá configurar descuentos para tours y paquetes. Se retiran de las exclusiones de 006; es ampliación explícita, no una funcionalidad atribuida a las fuentes originales.
- **Pendientes:** tipo de descuento, asignación por oferta/salida, precio afectado, vigencia, acumulación, límites, redondeo y presentación. Se registran en ACL-31; no se presume ninguna fórmula, aplicación retroactiva ni descuento de alojamiento.
- **Compatibilidad:** DEC-004 mantiene PEN/dos decimales e impide descuentos no definidos. Esta solicitud permite especificar descuentos, pero todavía no determina su cálculo ni modifica las specs aprobadas. La integración con el precio turístico de 001 necesita revisión al cerrar las reglas; los importes históricos se conservan.
- **Destino:** [006 v0.6](specs/006-catalogo/spec.md), RF-17/RF-38. Solicitud incluida en la quinta respuesta; no aprobación del documento completo ni del comportamiento aún sin definir.

## DEC-059 — Precio normal tachado y precio rebajado en soles en la landing

- **Fecha:** 2026-10-24.
- **Contexto:** al preguntar por porcentaje, monto fijo o ambos, el usuario pidió explicar el porcentaje. Esa consulta no se registra como aceptación. Después de la explicación y petición de confirmación, corrigió la interpretación.
- **Respuesta:** «no que sea por precio, osea que en el landing page inicial ya sea tour o paquetes se muestre un tachado del precio normal y luego se muestre el precio en descuento en soles».
- **Regla:** para tours y paquetes con descuento, la landing inicial muestra el precio normal tachado y después el precio rebajado en soles. Se conservan los dos decimales de DEC-004 y el precio normal/base independiente de DEC-057. Se registra descuento por precio; no se aprueba el cálculo porcentual propuesto por el asistente.
- **Límite:** la presentación no determina si el admin introduce el precio final rebajado o la cantidad de soles a restar. Tampoco cierra relación con tarifas por salida, vigencia, acumulación, límites o presentación en detalle. ACL-31 conserva esas preguntas sin inferir cambios de reservas existentes.
- **Destino:** [006 v0.7](specs/006-catalogo/spec.md), RF-39/RF-40. Cierra la primera ronda de seis preguntas con reglas pendientes visibles; no aprueba 006 completa ni habilita plan/tareas.

## DEC-060 — Descuentos opcionales a elección del administrador

- **Fecha:** 2026-10-24.
- **Precisión espontánea:** «si pero los descuentos van ser opcional, cuando el admin lo desee o si no no».
- **Regla:** los descuentos de tours y paquetes son opcionales. El administrador decide si aplica descuento; no es requisito de publicación. Con descuento se conserva la presentación de DEC-059; sin descuento la tarjeta muestra únicamente el precio normal sin tachado.
- **Límite:** no define programación automática, entrada del precio rebajado ni relación con tarifas por salida. Los pendientes de ACL-31 permanecen; no afecta importes de reservas existentes.
- **Destino:** [006 v0.8](specs/006-catalogo/spec.md), RF-41/RF-42. Precisión posterior a la ronda, no aprobación del documento completo.

## DEC-061 — Ingreso directo del precio final rebajado

- **Fecha:** 2026-10-24.
- **Pregunta:** tras «continua», elegir entre ingresar el precio final rebajado (opción 1) o la cantidad que se resta (opción 2).
- **Respuesta:** «la opcion 1, y que en el landing page inicio se calcule automaticamente a que porcentaje equivale el descuento y el descuento tachado».
- **Regla:** el admin ingresa directamente el precio final rebajado en soles para el tour/paquete. No ingresa un monto a restar ni un porcentaje para obtener ese precio. Se conserva el descuento opcional de DEC-060.
- **Pendientes:** límites de precios, aplicación a tarifas por salida, vigencia y demás reglas de ACL-31.
- **Destino:** [006 v0.9](specs/006-catalogo/spec.md), RF-43. Primera respuesta de la segunda ronda; no aprobación global.

## DEC-062 — Porcentaje equivalente automático en la landing

- **Fecha:** 2026-10-24.
- **Solicitud:** segunda parte de la respuesta registrada en DEC-061: cálculo automático del porcentaje equivalente en la landing y conservación del tachado.
- **Regla:** para tours y paquetes con descuento, calcular el porcentaje equivalente de rebaja respecto al precio normal: `(normal − rebajado) / normal × 100`, con normal positivo. Mostrarlo en la tarjeta junto al precio normal tachado y el precio final rebajado. Ejemplo ilustrativo: S/200.00 → S/180.00 equivale a 10 %.
- **Relación con DEC-059:** el porcentaje ahora se solicita expresamente como resultado informativo. No sustituye la entrada del precio final ni se usa para recalcularlo. El tachado se conserva sobre el precio normal, como ya se acordó.
- **Pendientes:** decimales/redondeo del porcentaje y validación de precios cero, iguales o invertidos. No se deduce precisión porcentual de los dos decimales monetarios.
- **Destino:** [006 v0.9](specs/006-catalogo/spec.md), RF-44/RF-45; ACL-31 parcialmente resuelta. Misma primera respuesta de la segunda ronda, no aprobación global ni autorización de código.

## DEC-063 — Precio rebajado positivo y menor que el normal

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El precio rebajado debe ser mayor que S/0 y menor que el precio normal?».
- **Respuesta:** «si».
- **Regla:** para descuentos de tours y paquetes, exigir `0 < precio final rebajado < precio normal`; rechazar guardar configuraciones que no lo cumplan. Excluye cero, negativos, igualdad y precio rebajado superior al normal. Implica precio normal positivo cuando existe descuento.
- **Límite:** no decide si existen ofertas gratuitas sin descuento, ni máximos monetarios, precisión del porcentaje o aplicación a salidas. Conserva PEN/dos decimales e importes históricos.
- **Destino:** [006 v0.10](specs/006-catalogo/spec.md), RF-46; cierre parcial de ACL-31. Segunda respuesta de la segunda ronda, no aprobación de la spec completa.

## DEC-064 — Presentación recomendada del porcentaje de descuento

- **Fecha:** 2026-10-24.
- **Pregunta previa:** mostrar porcentaje sin decimales redondeado al entero más cercano, con ejemplo 16,5 % → 17 %.
- **Respuesta:** «lo recomendable».
- **Autoridad:** elección delegada de la opción recomendada; no se registra como un «si» al redondeo al entero más cercano. Se adopta y comunica la recomendación siguiente en el borrador.
- **Regla recomendada adoptada:** mostrar el porcentaje sin decimales, redondeado hacia abajo cuando sea al menos 1 %. Si es positivo e inferior al 1 %, mostrar «Menos del 1 %». Ejemplos: 16,666… % → 16 %; 10 % → 10 %; 0,5 % → «Menos del 1 %».
- **Motivo:** el indicador no anuncia una rebaja mayor que la real y no muestra 0 % cuando sí existe descuento. Redondear aquí solo afecta la presentación, no el precio final ingresado ni su conservación histórica.
- **Destino:** [006 v0.11](specs/006-catalogo/spec.md), RF-47/RF-48; precisión porcentual de ACL-31 resuelta por recomendación delegada. Tercera respuesta de la segunda ronda; aprobación global de 006 pendiente.

## DEC-065 — Precio rebajado propio para cada salida

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El administrador también podrá definir un precio rebajado diferente para cada salida?».
- **Respuesta:** «si».
- **Regla:** admin puede configurar un precio final rebajado propio por salida de tour o paquete, independiente de otras salidas. Se conservan ingreso directo, carácter opcional, PEN/dos decimales y `0 < rebajado < normal`, comparando con la tarifa normal de esa misma salida.
- **Límite:** no implica que todas las salidas tengan descuento, herencia automática del descuento público ni acumulación de promociones. Prioridad entre rebaja de la tarjeta y de la salida al reservar, vigencia y detalle siguen pendientes ACL-31. No altera reservas existentes.
- **Destino:** [006 v0.12](specs/006-catalogo/spec.md), RF-49 y precisión RF-46. Cuarta respuesta de la segunda ronda; no aprobación global de 006.

## DEC-066 — Continuar con el precio efectivo de la salida, sin doble descuento

- **Fecha:** 2026-10-24.
- **Pregunta y aclaración:** usar solo el precio de la salida elegida, rebajado si tiene descuento o normal si no, sin aplicar además la promoción de tarjeta. Ante «no entiendo», se explicó con tarjeta S/200 → S/180 y salida del sábado S/250 → S/220: continuar con S/220, sin rebaja adicional. Son ejemplos, no tarifas fijadas.
- **Respuesta:** «claro, el cliente pague por el tour o paquete que tiene descuento sino no, entonces realiza de manera normal sin descuento si es que no hubiera, el precio descontado es con el que se continua».
- **Regla:** para el tour o paquete y salida elegidos, el precio efectivo con el que se continúa la reserva y el pago es el rebajado de esa salida si tiene descuento, o su normal si no lo tiene. No se acumula la rebaja pública de la tarjeta ni se aplica una segunda reducción al precio final ya rebajado.
- **Coherencia con 001:** usar ese precio turístico según las cantidades acordadas, conservando cálculo independiente de alojamiento e importes de reservas ya creadas. No modificar la spec aprobada ni recalcular reservas existentes por cambiar promociones.
- **Pendientes:** vigencia manual/automática y presentación detallada de las promociones; no reabrir selección de precio ni acumulación tarjeta/salida.
- **Destino:** [006 v0.13](specs/006-catalogo/spec.md), RF-28/RF-50; ACL-31 parcialmente resuelta. Quinta respuesta de la segunda ronda; no aprobación global.

## DEC-067 — Descuento vigente hasta cambio o retiro del administrador

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El descuento debe mantenerse hasta que el administrador lo cambie o quite, sin fecha automática de vencimiento?».
- **Respuesta:** «si,hasta que el administrador lo cambie o quite».
- **Regla:** descuentos de tours, paquetes y sus salidas permanecen vigentes hasta que el admin los cambie o retire; no vencen automáticamente por una fecha. Retirar un descuento devuelve el comportamiento sin descuento en ese ámbito, conforme a DEC-060/DEC-066.
- **Coherencia:** cambios/retiros no recalculan reservas ya creadas. Mantener un descuento no reactiva ofertas/salidas desactivadas ni amplía plazos de reserva o pago.
- **Destino:** [006 v0.14](specs/006-catalogo/spec.md), RF-51; vigencia de ACL-31 resuelta. Sexta respuesta: segunda ronda cerrada, sin aprobación global ni plan/tareas.

## DEC-068 — Bloquear reprogramación con reservas pendientes o confirmadas

- **Fecha:** 2026-10-24.
- **Pregunta:** «¿El sistema debe impedir cambiar la fecha o la hora de una salida cuando tenga reservas pendientes o confirmadas?».
- **Respuesta:** «si».
- **Regla:** rechazar cambios de fecha u hora de una salida de tour o paquete si tiene al menos una reserva pendiente o confirmada. Conservar los datos persistidos y las reservas; no moverlas ni cancelarlas como consecuencia del intento.
- **Límite:** no altera reglas de precio, capacidad ni desactivación. No define todas las validaciones para reprogramar cuando no existen reservas pendientes/confirmadas ni el ajuste de propuestas hoteleras asociadas.
- **Destino:** [006 v0.15](specs/006-catalogo/spec.md), RF-52; cierre parcial de ACL-29. Primera respuesta de la tercera ronda tras «continua»; no aprobación global.

## DEC-069 — Ocultar ofertas sin salidas disponibles

- **Fecha:** 2026-10-24.
- **Pregunta aclarada:** tras explicar que una salida es una fecha/hora programada y que puede no haber fechas futuras o estar todas completas, elegir entre mostrar la oferta con aviso u ocultarla hasta recuperar disponibilidad.
- **Respuesta:** «ocultarlo,».
- **Regla:** ocultar del catálogo público y de las tarjetas de landing el tour/paquete sin ninguna salida reservable. Vuelve a ser elegible cuando recupera disponibilidad, siempre que siga activo y no eliminado; se mantienen filtros/paginación. No basta que una salida esté agotada si otra continúa disponible.
- **Coherencia:** disponibilidad considera los compromisos vigentes de 001. Ocultar por disponibilidad no cambia el estado administrativo de la oferta ni cancela reservas. No se adopta el aviso «Sin salidas disponibles» en la tarjeta porque el usuario eligió ocultarla.
- **Límite:** acceso directo a detalle mediante un enlace guardado y comportamiento de una sección completamente vacía quedan pendientes ACL-30. No inferir actualización instantánea de páginas abiertas.
- **Destino:** [006 v0.16](specs/006-catalogo/spec.md), RF-53/RF-54. Segunda respuesta de la tercera ronda; no aprobación global.

## DEC-070 — Oferta no disponible al abrir un enlace directo

- **Fecha:** 2026-10-24.
- **Pregunta aclarada:** ejemplo de enlace compartido por WhatsApp que se abre después de agotarse los cupos; «¿En ese caso mostramos “Oferta no disponible”, sin mostrar el detalle?».
- **Respuesta:** «si, pero no te preocupes , por ahora habra cupos disponibles para todos».
- **Regla:** el acceso directo a un tour/paquete oculto por no tener salidas disponibles muestra «Oferta no disponible», sin información de detalle ni reserva. Completa la visibilidad de DEC-069 y aplica el contrato de oferta no visible de RF02/HU-02, conservando estado administrativo y reservas.
- **Contexto inicial:** el usuario prevé cupos suficientes para todos; no se registra un número inventado ni capacidad ilimitada. La previsión no deroga los controles aprobados. Continuar la entrevista con presentación del catálogo, sin insistir en el agotamiento ya resuelto.
- **Destino:** [006 v0.17](specs/006-catalogo/spec.md), RF-55/RF-56. Tercera respuesta de la tercera ronda; no aprobación global.

## DEC-071 — Todo el catálogo en la sección correspondiente

- **Fecha:** 2026-10-24.
- **Contexto:** ante una propuesta de imagen principal/galería con máximo de cinco imágenes por oferta, el usuario pidió «todo el catalogo». Se aclaró que cinco imágenes no significaba cinco ofertas y se preguntó por inclusión y presentación del catálogo completo.
- **Respuesta:** «por separado en cada seccion perteneciente, tiene que mostrarse todo el catalogo pertenenciente a cada seccion como tour o paquetes turisticos».
- **Regla:** la página de inicio separa Tours y Paquetes turísticos; cada sección muestra todas sus ofertas públicamente visibles, sin mezcla de tipos ni paginación visible que limite lo mostrado a un subconjunto. No hay un máximo de cinco ofertas.
- **Fuentes:** RF01/HU-01 y DEC-044/DEC-054. La consulta paginada original de HU-01 se conserva; no se confunde su tamaño de respuesta con el contenido completo exigido en las secciones. Su coordinación se diseñará después de aprobar la spec.
- **Límite:** no aprueba cinco imágenes por oferta, su cantidad/galería sigue pendiente en esta decisión. Conserva publicación/disponibilidad de DEC-069/DEC-070 y no define orden de tarjetas, vacíos o nuevos tipos de oferta. La cantidad se resolvió después por DEC-107 (sin máximo comercial).
- **Destino:** [006 v0.18](specs/006-catalogo/spec.md), RF-57/RF-58 y precisión RF-9; ACL-30 parcialmente resuelta. Cuarta respuesta de la tercera ronda; no aprobación global.

## DEC-072 — Catálogo completo sin login en Tours, Paquetes, Hoteles y Vehículos

- **Fecha:** 2026-10-24.
- **Respuesta:** «todas las que manejara el sistema, para que los clientes tenga la facilidad de ver todos los servicios sin necesidad de loguearse, lo mismo para la seccion de hoteles y vehiculos».
- **Regla:** explorar todo el catálogo públicamente visible de cada sección sin iniciar sesión: Tours, Paquetes turísticos, Hoteles y Vehículos/Movilidad. Ratifica la presentación completa y separada de DEC-071 y la extiende expresamente a las otras dos secciones, sin limitar el contenido a una selección inicial.
- **Trazabilidad:** Tours/Paquetes ya tienen consulta anónima en RF01/HU-01 y 006/RF-7; Hoteles en RF17/HU-21 con precisión en [007 acuerdos](specs/007-hoteles/acuerdos.md); Vehículos mantiene 013/RF-1/RF-2/RF-11/RF-16, categorías activas informativas.
- **Límite:** la aclaración se centra en servicios visibles y acceso público, no fija un número de fotos ni aprueba imágenes ilimitadas. Se conservan las reglas de publicación y disponibilidad; no permite reservar sin autenticación, administrar sin permiso ni contratar vehículos. La spec aprobada 013 y su planificación permanecen intactas.
- **Destino:** [006 v0.19](specs/006-catalogo/spec.md), RF-7/RF-57/RF-58; 007/RF-1/RF-2 en acuerdos parciales; 013 sin cambios. Quinta respuesta de la tercera ronda, no aprobación global de 006/007.

## DEC-073 — Tours y Paquetes en orden alfabético

- **Fecha:** 2026-10-25.
- **Pregunta:** «Dentro de las secciones Tours y Paquetes, ¿prefieres orden alfabético por nombre o que el administrador elija cuáles aparecen primero?».
- **Respuesta:** «por orden alfabetico».
- **Regla:** ordenar las ofertas alfabéticamente por nombre, de A a Z, dentro de su propia sección: Tours por separado de Paquetes turísticos. No introduce posiciones prioritarias elegidas por admin ni limita el catálogo completo de DEC-071/DEC-072.
- **Límite:** no fija el orden de Hoteles ni cambia la spec aprobada de Movilidad, que ya contiene orden alfabético propio. No resuelve cantidad de fotografías ni otros pendientes.
- **Destino:** [006 v0.20](specs/006-catalogo/spec.md), RF-59; orden público de ACL-30 resuelto. Sexta respuesta: tercera ronda cerrada; no aprobación global de 006.

## DEC-074 — Rechazar ediciones que dejen incompleta una oferta publicada

- **Fecha:** 2026-10-25.
- **Pregunta:** «Si un tour o paquete ya está publicado, ¿el sistema debe rechazar una edición que lo deje sin datos obligatorios, como precio, itinerario o al menos una imagen?».
- **Respuesta:** «si, no debe dejarlo sin datos obligatorios».
- **Regla:** rechazar guardar una edición que deje un tour/paquete publicado sin alguno de los datos obligatorios de DEC-053, incluida la última imagen. Se conserva la información persistida anterior; no se desactiva automáticamente para aceptar contenido incompleto.
- **Límite:** conserva los requisitos de publicación existentes; no define nuevos límites de texto, cantidad máxima de imágenes ni validaciones de borradores inactivos. No cambia las specs aprobadas.
- **Destino:** [006 v0.21](specs/006-catalogo/spec.md), RF-60 y precisión RF-14; ACL-29 parcialmente resuelta. Primera respuesta de la cuarta ronda tras «continua»; no aprobación global.

## DEC-075 — Misma descripción en tarjeta y al reservar

- **Fecha:** 2026-10-25.
- **Pregunta:** «¿La descripción breve de la tarjeta la escribirá el administrador por separado de la descripción completa del tour o paquete?».
- **Respuesta:** «no, sera la misma descripcion que muestre al realizar la reserva», seguida de «continua».
- **Regla:** una misma descripción de la oferta alimenta tarjeta, detalle y presentación al realizar la reserva. No se administra una descripción breve independiente ni se genera un resumen alternativo por inferencia. Precisa el término «descripción breve» de DEC-054; conserva los otros campos de la tarjeta y el itinerario completo.
- **Límite:** no fija longitud máxima ni nuevo historial de versiones de descripciones. No modifica la spec aprobada de Reservas ni sus condiciones históricas.
- **Destino:** [006 v0.22](specs/006-catalogo/spec.md), RF-61 y precisión RF-34; ACL-28 parcialmente resuelta. Segunda respuesta de la cuarta ronda; no aprobación global.

## DEC-076 — Ocultar secciones de Tours/Paquetes vacías y sus enlaces

- **Fecha:** 2026-10-25.
- **Pregunta:** «Si una sección de Tours o Paquetes no tiene ninguna oferta visible, ¿ocultamos esa sección y su enlace del menú hasta que vuelva a tener contenido?».
- **Respuesta:** «SI».
- **Regla:** ocultar la sección de Tours o Paquetes turísticos que no tenga ofertas públicamente visibles y su enlace del menú. Mostrar ambos nuevamente cuando ese tipo vuelva a tener una oferta visible. Evaluar cada sección independientemente y conservar catálogo completo/orden alfabético.
- **Límite:** considera todas las ofertas publicables del tipo, no solo una página de consulta o filtro vacío. No cambia estado administrativo ni reservas. No fija la política de vacíos de Hoteles ni modifica la spec aprobada de Movilidad.
- **Destino:** [006 v0.23](specs/006-catalogo/spec.md), RF-62/RF-63; vacío de sección de ACL-30 resuelto. Tercera respuesta de la cuarta ronda; no aprobación global.

## DEC-077 — Salida sin precio propio no reservable

- **Fecha:** 2026-10-25.
- **Pregunta aclarada:** ante «no entindo», ejemplo de tarjeta a S/100 y salida del sábado todavía sin precio; «¿El sistema debe impedir reservar esa salida hasta que el administrador le ponga un precio?».
- **Respuesta:** «si».
- **Regla:** impedir reservar una salida de tour/paquete hasta que admin defina su precio normal propio. El precio base público no se usa como sustituto automático. La salida sigue sujeta a los demás requisitos de disponibilidad cuando se le asigna precio.
- **Límite:** no fija límites monetarios adicionales ni equipara precio ausente a cero. No exige descuento ni elimina la conservación histórica de reservas existentes. No prohíbe guardar salidas incompletas para administración por inferencia.
- **Destino:** [006 v0.24](specs/006-catalogo/spec.md), RF-64; precio ausente de ACL-29 resuelto. Cuarta respuesta de la cuarta ronda; no aprobación global.

## DEC-078 — Auditoría de todos los cambios administrativos de Catálogo

- **Fecha:** 2026-10-25.
- **Pregunta:** «¿Cada cambio del administrador en tours, paquetes, salidas, precios y descuentos debe quedar registrado indicando quién lo hizo, qué cambió y cuándo?».
- **Respuesta:** «si».
- **Regla:** auditar todos los cambios administrativos aplicados en esos ámbitos. Incluye sus operaciones de creación, edición, activación, desactivación y baja lógica donde correspondan, cambios de contenido/cupos/precios y configuración o retiro de descuentos. Conservar actor, acción, entidad, identificador, fecha y cambios relevantes de RN-28; los registros siguen siendo inmutables conforme a RN-29.
- **Límite:** no añade registro de vistas públicas ni presenta intentos rechazados como cambios aplicados. No fija nombres técnicos oficiales de eventos ni aprueba la spec transversal 010.
- **Destino:** [006 v0.25](specs/006-catalogo/spec.md), precisión de RF-19; alcance funcional de auditoría de 006 resuelto en ACL-14/ACL-29. Quinta respuesta de la cuarta ronda; no aprobación global.

## DEC-079 — Precios normales mayores que cero

- **Fecha:** 2026-10-25.
- **Pregunta:** «¿Los precios normales de tours, paquetes y sus salidas también deben ser mayores que S/0, sin permitir precios gratuitos o negativos?».
- **Respuesta:** «si».
- **Regla:** exigir precio normal mayor que cero para tours, paquetes y sus salidas, incluidos precios base públicos y tarifas normales de salida; rechazar valores cero o negativos, haya o no descuento. Conservar PEN/dos decimales y la condición de descuento 0 < rebajado < normal.
- **Límite:** no elimina borradores incompletos ni equipara precio ausente a cero; DEC-077 ya impide reservar sin precio propio. No modifica reglas hoteleras, Movilidad informativa ni importes históricos de reservas existentes.
- **Destino:** [006 v0.26](specs/006-catalogo/spec.md), RF-65; positividad de precios de ACL-29 resuelta. Sexta respuesta: cuarta ronda cerrada; no aprobación global.

## DEC-080 — Galería de fotos en detalle de Tours y Paquetes

- **Fecha:** 2026-10-25.
- **Pregunta:** «Al abrir el detalle de un tour o paquete, ¿quieres una galería con varias fotos, además de la imagen principal que aparece en su tarjeta?».
- **Respuesta:** «si».
- **Regla:** el detalle público de cada tour/paquete ofrece una galería con sus fotografías asociadas; la tarjeta conserva la imagen principal. Permite varias fotos sin convertirlas en requisito adicional de publicación: el mínimo de una imagen de DEC-053 se mantiene.
- **Límite:** no aprueba cantidad máxima, formatos, tamaño, controles de navegación ni política de fallos. No traslada galería a Movilidad ni modifica las specs aprobadas; la cantidad de ofertas mostradas sigue regida por DEC-071/DEC-072.
- **Destino:** [006 v0.27](specs/006-catalogo/spec.md), RF-66; ACL-13 parcialmente resuelta para 006. Primera respuesta de la quinta ronda; no aprobación global.

## DEC-081 — Duración configurable en horas o días

- **Fecha:** 2026-10-25.
- **Pregunta:** «¿El administrador podrá indicar la duración en horas o en días, según corresponda a cada tour o paquete?».
- **Respuesta:** «si».
- **Regla:** admin elige horas o días por cada tour/paquete; su duración pública conserva el valor y la unidad elegidos. No se impone una unidad única por tipo de oferta.
- **Límite:** no define decimales ni límites numéricos. Mantiene itinerario por días de DEC-055 y períodos hoteleros de 24 horas de 001; no deduce cambios de horario ni cálculo de alojamiento a partir de esta duración.
- **Destino:** [006 v0.28](specs/006-catalogo/spec.md), RF-67/RF-68; unidad de duración de ACL-29 resuelta. Tercera pregunta de la quinta ronda; la segunda, sobre cantidad de fotos, permanece pendiente. No aprobación global.

## DEC-082 — Duración únicamente en números enteros

- **Fecha:** 2026-10-25.
- **Pregunta:** «¿Permitimos duraciones con decimales, como 1,5 horas o 2,5 días, o únicamente números enteros?».
- **Respuesta:** «numeros enteros».
- **Regla:** duración de tours/paquetes en números enteros de la unidad elegida, horas o días. Rechazar valores con parte fraccionaria sin redondearlos para aceptarlos. No cambia precios monetarios ni porcentajes de descuento.
- **Límite:** no fija intervalo mínimo/máximo ni modifica itinerarios o períodos hoteleros aprobados. No confundir duración informativa de oferta con plazos de pago.
- **Destino:** [006 v0.29](specs/006-catalogo/spec.md), RF-69; decimales de duración de ACL-29 resueltos. Cuarta pregunta de la quinta ronda; no aprobación global.

## DEC-083 — Fotos JPG, PNG y WebP de hasta 5 MB

- **Fecha:** 2026-10-25.
- **Pregunta:** «Para subir las fotos de tours y paquetes, ¿aceptamos JPG, PNG y WebP, con un tamaño máximo de 5 MB por archivo?».
- **Respuesta:** «si».
- **Regla:** imágenes principales y de galería de Tours/Paquetes admiten JPG, PNG y WebP hasta 5 MB por archivo, inclusive. Rechazar otros formatos o archivos que excedan ese tamaño; mantener validaciones transversales RS10. Aplica a carga y reemplazo.
- **Límite:** 5 MB es tamaño por archivo, no cantidad de fotos ni límite de ofertas del catálogo. No aprueba el máximo anteriormente propuesto de cinco fotos, respuesta ante fallos ni la política de Hoteles; Movilidad conserva su spec aprobada. La cantidad se resolvió después por DEC-107.
- **Destino:** [006 v0.30](specs/006-catalogo/spec.md), RF-70/RF-71; formatos/tamaño de ACL-13 resueltos para 006. Quinta pregunta de la quinta ronda; no aprobación global.

## DEC-084 — Fallo de imagen: informar y conservar las anteriores

- **Fecha:** 2026-10-26.
- **Pregunta:** «Si falla la carga o el reemplazo de una foto, ¿mostramos “No se pudo cargar la imagen” y conservamos las imágenes anteriores?».
- **Respuesta:** «si», seguida de «continua».
- **Regla:** ante fallo de carga o reemplazo de foto de tour/paquete, mostrar «No se pudo cargar la imagen» y conservar las imágenes ya guardadas, tanto principal como galería. No sustituirlas por el archivo fallido. Si no había imagen, continúa faltando ese requisito de publicación.
- **Límite:** no define cantidad máxima, carga masiva, reintentos automáticos ni eliminación de otros cambios. Es decisión explícita para 006, no modificación de 013 ni de Hoteles.
- **Destino:** [006 v0.31](specs/006-catalogo/spec.md), RF-72/RF-73; respuesta ante fallos de ACL-13 resuelta para 006. Sexta pregunta: quinta ronda cerrada; no aprobación global. «Continua» permite seguir aclarando los otros pendientes.

## DEC-085 — Presentación del descuento en detalle y selección de salida

- **Fecha:** 2026-10-26.
- **Pregunta:** «En el detalle del tour o paquete y al elegir una salida, ¿mostramos también el precio normal tachado, el precio rebajado y el porcentaje de descuento cuando exista una rebaja?».
- **Respuesta:** «susi», interpretada como confirmación afirmativa de la pregunta inmediata.
- **Regla:** mostrar precio normal tachado, precio final rebajado en soles y porcentaje equivalente cuando exista descuento, también en detalle y selección de salida. En cada ámbito se usan sus precios correspondientes: oferta en detalle general, salida al elegirla. Mantener presentación porcentual DEC-064 y dos decimales monetarios DEC-004.
- **Límite:** no cambia precio efectivo ni acumula descuentos; salida sin descuento mantiene su normal conforme a DEC-066. No introduce nuevos descuentos ni modifica reservas existentes.
- **Destino:** [006 v0.32](specs/006-catalogo/spec.md), RF-74–RF-76 y precisión RF-47/RF-48; presentación pendiente de ACL-31 resuelta. Primera respuesta de la sexta ronda; no aprobación global.

## DEC-086 — Ajuste manual del alojamiento tras reprogramar una salida

- **Fecha:** 2026-10-26.
- **Pregunta:** «Si una salida todavía sin reservas se cambia del lunes al miércoles, ¿las fechas del hotel asociado deben moverse automáticamente esos dos días o las ajustará manualmente el administrador?».
- **Respuesta:** «ajustara manualmente».
- **Regla:** el administrador ajusta explícitamente las fechas de las propuestas de alojamiento asociadas a la salida reprogramada; cambiar la fecha turística no desplaza automáticamente las fechas hoteleras. Hasta esa edición se conservan las fechas guardadas.
- **Límite:** no autoriza reprogramar salidas con reservas pendientes/confirmadas, modificar reservas históricas ni alterar períodos/horarios hoteleros de 001. No define cómo se mantiene la coherencia de propuestas seleccionables durante el ajuste ni una desactivación automática.
- **Destino:** [006 v0.33](specs/006-catalogo/spec.md), RF-77, y [007 acuerdos](specs/007-hoteles/acuerdos.md), RF-3; ACL-29 parcialmente resuelta. Segunda respuesta de la sexta ronda; no aprobación global de 006/007.

## DEC-087 — Ocultar alojamiento pendiente de ajuste y permitir reserva turística

- **Fecha:** 2026-10-26.
- **Pregunta:** «Después de cambiar la fecha de una salida, ¿ocultamos sus opciones de hotel hasta que el administrador ajuste las fechas, permitiendo mientras tanto reservar solo el tour o paquete?».
- **Respuesta:** «si».
- **Regla:** propuestas de alojamiento afectadas por reprogramación permanecen ocultas para esa salida hasta que admin ajuste sus fechas. El tour/paquete puede reservarse sin hotel si cumple las demás condiciones. Tras ajustar una propuesta, vuelve a ser elegible conforme a estado y disponibilidad.
- **Límite:** no oculta ni desactiva el hotel del catálogo general, no altera otras salidas, inventario o reservas históricas. El admin conserva acceso a las propuestas. Se mantiene la prohibición de reprogramar con reservas pendientes/confirmadas de DEC-068.
- **Destino:** [006 v0.34](specs/006-catalogo/spec.md), RF-78/RF-79, y [007 acuerdos](specs/007-hoteles/acuerdos.md), RF-4; coherencia durante el ajuste de ACL-29 resuelta. Tercera respuesta de la sexta ronda; no aprobación global de 006/007.

## DEC-088 — Fechas futuras en hora de Perú y actualización de itinerario solicitada

- **Fecha:** 2026-10-27.
- **Pregunta:** «¿Al crear o reprogramar una salida, el administrador solo podrá elegir una fecha y hora futuras, usando la hora de Perú?».
- **Respuesta:** «claro podra actualizar las salidas talvez con un nuevo itinerario con una nueva fecha y hora».
- **Regla confirmada:** crear/reprogramar salidas con fecha/hora futura en hora de Perú. Guardar una fecha pasada o igual al momento actual se rechaza. Se conserva el bloqueo con reservas pendientes/confirmadas de DEC-068 y el ajuste hotelero manual de DEC-086/DEC-087.
- **Petición adicional:** actualizar salidas posiblemente con un nuevo itinerario. Queda pendiente si ese contenido es propio de la salida o si modifica el itinerario general del tour/paquete; no se inventa ese alcance ni se trasladan cambios a reservas existentes.
- **Destino:** [006 v0.35](specs/006-catalogo/spec.md), RF-80/RF-81; ACL-29 fechas resuelta y alcance de itinerario abierto en ACL-28/ACL-29. Cuarta respuesta de la sexta ronda; no aprobación global.

## DEC-089 — Cambio de itinerario para todas las salidas de la oferta

- **Fecha:** 2026-10-27.
- **Pregunta aclarada:** se explicó itinerario como programa de lugares/actividades por día; ejemplo de modificar una visita del sábado y elegir entre afectar solo el sábado o las demás salidas del mismo tour.
- **Respuesta:** «a las demas salidad».
- **Regla:** el itinerario pertenece al tour/paquete y se comparte entre sus salidas; un cambio guardado se aplica también a las demás salidas de esa misma oferta. No se introduce una variante independiente por salida.
- **Límite:** no determina si debe bloquearse esa edición cuando alguna salida tenga reservas pendientes/confirmadas. No autoriza cambios de fechas, alojamiento ni modificación de reservas históricas por inferencia. Se conserva estructura por días de DEC-055.
- **Destino:** [006 v0.36](specs/006-catalogo/spec.md), RF-82; alcance de itinerario de ACL-28/ACL-29 resuelto. Quinta respuesta de la sexta ronda; no aprobación global.

## DEC-090 — Proteger itinerario cuando existen reservas pendientes o confirmadas

- **Fecha:** 2026-10-27.
- **Pregunta:** «¿Debemos impedir cambiarlo si alguna de esas salidas tiene reservas pendientes o confirmadas, para respetar lo que los clientes reservaron?»; referida al itinerario compartido de DEC-089.
- **Respuesta:** «si».
- **Regla:** rechazar el cambio de itinerario de un tour/paquete si cualquiera de sus salidas tiene al menos una reserva pendiente o confirmada. Conservar el itinerario persistido y las reservas; el control abarca toda la oferta, no solo una salida elegida.
- **Límite:** no crea cancelación, traslado o versión alternativa para eludir la restricción. Conserva reglas de fechas, precios, alojamiento, completitud y auditoría; no modifica las specs aprobadas.
- **Destino:** [006 v0.37](specs/006-catalogo/spec.md), RF-83 y precisión RF-82; condición de edición de itinerario ACL-29 resuelta. Sexta respuesta: sexta ronda cerrada; no aprobación global.

## DEC-091 — Nombres únicos entre Tours publicados y entre Paquetes publicados

- **Fecha:** 2026-10-27.
- **Pregunta:** «¿Debemos impedir que haya dos tours publicados con el mismo nombre y, por separado, dos paquetes publicados con el mismo nombre?».
- **Respuesta:** «si».
- **Regla:** impedir nombres/títulos duplicados entre tours publicados y, de forma independiente, entre paquetes publicados. Aplicar tanto al activar como al editar una oferta publicada para conservar la regla. No imponer por esta decisión unicidad global entre tipos ni entre borradores inactivos.
- **Límite:** comparación de mayúsculas/espacios aún pendiente; no copiarla de 013 sin decisión. No fusiona ofertas, elimina registros ni afecta reservas por un intento rechazado.
- **Destino:** [006 v0.38](specs/006-catalogo/spec.md), RF-84; ACL-29 parcialmente resuelta. Primera respuesta de la séptima ronda tras «continua»; no aprobación global.

## DEC-092 — Comparación de nombres sin mayúsculas ni espacios exteriores

- **Fecha:** 2026-10-27.
- **Pregunta:** «¿Consideramos iguales “Tour Cusco” y “tour cusco”, ignorando también los espacios al principio o al final del nombre?».
- **Respuesta:** «si».
- **Regla:** en la unicidad de DEC-091, comparar nombres sin distinguir mayúsculas/minúsculas e ignorando espacios iniciales/finales. Aplicar en activación y edición; mantener separación entre Tours y Paquetes publicados.
- **Límite:** no obliga a mostrar nombres en minúsculas, quitar acentos o eliminar espacios interiores; no crea unicidad entre tipos ni entre borradores inactivos. No modifica 013 ni sus documentos aprobados.
- **Destino:** [006 v0.39](specs/006-catalogo/spec.md), precisión RF-84; comparación de nombres de ACL-29 resuelta. Segunda respuesta de la séptima ronda; no aprobación global.

## DEC-093 — Una unidad de duración por oferta, sin máximo fijo

- **Fecha:** 2026-10-28.
- **Pregunta:** «¿La duración podrá ser cualquier número entero mayor que cero, en horas o días, sin un máximo fijo?».
- **Respuesta:** «la duracion sera en horas y dias dependiendo como el admin configure un tour o paquete pero deberia de poder seleccionar una de las dos , sin un maximo fijo».
- **Regla precisada:** el admin configura la duración de cada tour/paquete eligiendo una sola unidad, horas o días, con valor entero según DEC-082 y sin máximo fijo de negocio. No exige dos valores simultáneos ni duración compuesta.
- **Límite:** la respuesta concreta unidad exclusiva y ausencia de máximo; no fija expresamente un mínimo. No altera itinerarios por días, períodos hoteleros ni fechas de salida. Los límites técnicos de representación no se presentan como límites comerciales aprobados.
- **Destino:** [006 v0.40](specs/006-catalogo/spec.md), RF-85 y precisión RF-67; unidad/máximo de ACL-29 resueltos. Tercera respuesta de la séptima ronda; no aprobación global.

## Consolidación de acuerdos recibidos durante modo de planificación

**Fecha de registro documental:** 2026-10-30. Los acuerdos siguientes se confirmaron en la conversación mientras las ediciones de archivos estaban restringidas; se incorporan al reanudarse el trabajo documental, incluida la última respuesta «rango». La fecha de registro no se atribuye como fecha exacta de cada respuesta anterior. Ninguna decisión equivale a aprobar la spec 006 completa ni autoriza implementación.

## DEC-094 — Descripción e itinerario sin máximo fijo de caracteres

- **Pregunta:** sin límite fijo o máximo de 5.000 caracteres para la descripción del tour/paquete.
- **Respuesta:** «SIN LIMITE Y TAMBIEN PARA EL ITINERARIO».
- **Regla:** descripción y texto del itinerario sin máximo fijo de caracteres como regla de negocio. Se conserva descripción compartida de DEC-075, contenido obligatorio y estructura del itinerario por días/actividades de DEC-055.
- **Límite:** no elimina validaciones de publicación ni protección de itinerario con reservas; no aprueba imágenes ilimitadas ni límites de otros campos. Las capacidades técnicas no se presentan como almacenamiento infinito.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-86/RF-87; longitud de descripción/itinerario en ACL-28 resuelta.

## DEC-095 — Duración decidida por admin sin mínimo fijo del sistema

- **Contexto:** se preguntó por mínimo de una hora/un día y rechazo de cero/negativos; el usuario respondió «QUE SEA CONFIGURABLE DEPENDIENDO LO QUE CONSIDERE EL ADMIN».
- **Aclaración presentada:** «¿Te refieres a que el administrador decida la duración de cada tour o paquete, sin un mínimo fijo impuesto por el sistema, manteniendo números enteros en horas o días?».
- **Respuesta:** «SI».
- **Regla:** el administrador decide la duración por oferta sin mínimo fijo de negocio impuesto por el sistema. Se conservan valor entero, elección de una sola unidad horas/días y ausencia de máximo fijo de DEC-081/DEC-082/DEC-093.
- **Límite:** no crea una pantalla de configuración global de mínimos ni aprobación separada de duraciones cero/negativas; tampoco se introduce silenciosamente el mínimo de una hora/un día que no fue elegido. No afecta períodos hoteleros, fechas o plazos de reserva.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-88; mínimo fijo pendiente de ACL-29 resuelto por la elección aclarada.

## DEC-096 — Filtros por precio, duración, fecha de salida y destino

- **Contexto:** frente a no añadir filtros adicionales el usuario respondió «AÑADE FILTROS». Se ofrecieron precio (rango), duración (horas/días), fecha de salida y destino.
- **Respuesta:** «TODAS».
- **Regla:** incorporar los cuatro filtros a las secciones Tours y Paquetes turísticos. Sin aplicarlos se conserva todo el catálogo publicable por sección y su orden alfabético; filtrar no modifica publicación ni disponibilidad.
- **Límite:** ampliación explícita del catálogo original, sin inventar RF/HU oficiales. No introduce filtros de Hoteles ni modifica Movilidad; cada detalle confirmado se registra en las decisiones siguientes.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-89; ACL-30 ampliada.

## DEC-097 — Filtrar por el precio visible de la tarjeta

- **Pregunta:** usar el precio de tarjeta, rebajado si tiene descuento o normal si no, para el filtro de precio.
- **Respuesta:** «SI».
- **Regla:** el rango de precio selecciona ofertas por el importe vigente visible en tarjeta. No se usa el mínimo de salidas ni otra tarifa no mostrada.
- **Límite:** no cambia el precio efectivo de reserva de DEC-066: la salida elegida conserva sus precios y rebaja propios. Límites inclusivos de rango y respuesta a entradas inválidas aún no definidos.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-90; base del filtro de precio en ACL-30 resuelta.

## DEC-098 — Filtros sin coincidencias y limpieza

- **Pregunta:** mostrar «No se encontraron resultados» y botón «Limpiar filtros» para volver al catálogo completo si ninguna oferta coincide.
- **Respuesta:** «si».
- **Regla:** mostrar el mensaje y el botón acordados. Limpiar restablece el catálogo públicamente visible de la sección sin sus filtros, manteniendo orden y reglas de publicación/disponibilidad.
- **Límite:** resultado vacío por filtro no equivale a sección sin ofertas publicables (DEC-076); no ocultar toda la sección ni reactivar contenido oculto por limpiar. No fija mensajes de error de intervalos inválidos ni de consultas paginadas.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-91–RF-93; vacío por filtros de ACL-30 resuelto.

## DEC-099 — Buscar automáticamente destinos en el catálogo existente

- **Contexto:** se propuso asignar varios destinos por oferta manualmente; el usuario corrigió: «que sea automatico son con buscar el nombre destino de los tours o paquetes que existan se muestran sino no».
- **Confirmación:** después de resumir que el cliente escribe el destino y se muestran automáticamente las ofertas existentes que coincidan, sin lista adicional de destinos, el usuario respondió «si».
- **Regla:** búsqueda por nombre de destino sobre los tours/paquetes existentes de la sección; solo mostrar coincidencias públicas. Sin coincidencias rige DEC-098. No exigir una lista adicional de destinos que el admin tenga que mantener o asignar manualmente.
- **Límite:** no define coincidencia parcial/exacta, acentos, fuente precisa del destino dentro del contenido existente ni introduce un extractor geográfico o proveedor externo. Esos detalles permanecen visibles, sin aprobar la propuesta descartada de asignación manual.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-94; búsqueda automática por destino de ACL-30 definida funcionalmente.

## DEC-100 — Rango de duración con selección de unidad

- **Pregunta:** indicar mínimo y máximo en el filtro de duración, eligiendo horas o días; ejemplo entre 2 y 5 días.
- **Respuesta:** «si».
- **Regla:** el visitante puede filtrar por una duración mínima y máxima con elección de horas/días. No impone un máximo o mínimo comercial a la duración configurada por admin: se trata de límites de búsqueda del visitante.
- **Límite:** comparación entre ofertas con distinta unidad y entradas de rango inválidas aún pendientes; no derivar automáticamente reglas hoteleras de 24 horas.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-95; presentación del filtro de duración de ACL-30 resuelta.

## DEC-101 — Fecha de salida filtrada por rango

- **Pregunta:** permitir día concreto o rango de fechas para el filtro de fecha de salida.
- **Respuesta:** «rango».
- **Regla:** el filtro de fecha de salida se selecciona mediante rango de fechas. No se añade una modalidad independiente de fecha única por la alternativa propuesta.
- **Límite:** no permite reservar un intervalo en lugar de una salida concreta. Inclusión de bordes, qué salidas satisfacen el rango y tratamiento de intervalos inválidos siguen pendientes; conservar hora de Perú, disponibilidad y demás reglas acordadas.
- **Destino:** [006 v0.41](specs/006-catalogo/spec.md), RF-96; modalidad de filtro de fecha en ACL-30 resuelta. Spec completa aún no aprobada.

## DEC-102 — Buscar destino en nombre o descripción de la oferta

- **Fecha:** 2026-10-30.
- **Pregunta:** «Para buscar por destino, ¿el sistema buscará el texto en el nombre y la descripción del tour o paquete? Por ejemplo, al escribir “Cusco”, mostrará las ofertas que mencionen Cusco en cualquiera de esos campos».
- **Respuesta:** «si».
- **Regla:** buscar presencia del texto de destino en el nombre o la descripción existentes de cada oferta pública de la sección. Basta coincidencia en cualquiera de ellos; no se exige coincidencia en ambos ni igualdad con el contenido completo de un campo.
- **Límite:** no añade lista manual de destinos, campos nuevos, extracción geográfica ni proveedores. No define por esa respuesta tratamiento de mayúsculas/acentos o equivalencias entre nombres geográficos. Mantener filtros, orden y publicación acordados.
- **Destino:** [006 v0.42](specs/006-catalogo/spec.md), precisión RF-94; fuente de búsqueda de destino de ACL-30 resuelta. Primera respuesta de la revisión posterior a consolidación; no aprobación global.

## DEC-103 — Un día equivale a 24 horas al filtrar duración

- **Fecha:** 2026-10-30.
- **Pregunta:** «Para el filtro de duración, ¿usamos 1 día = 24 horas al comparar ofertas? Por ejemplo, buscar entre 1 y 2 días también mostraría tours configurados entre 24 y 48 horas».
- **Respuesta:** «si», seguida de «continuar».
- **Regla:** comparar duraciones de ofertas en horas/días con equivalencia 1 día = 24 horas. El ejemplo incluye ofertas de 24 a 48 horas al buscar de 1 a 2 días; no se limita la búsqueda a ofertas cuya unidad guardada sea días.
- **Límite:** solo comparación de duración turística en filtros; conserva valor/unidad de oferta y no cambia itinerario, tarifa, inventario ni período hotelero. No resuelve otros filtros o errores de intervalos.
- **Destino:** [006 v0.43](specs/006-catalogo/spec.md), RF-97; equivalencia de duración de ACL-30 resuelta. Segunda respuesta de la revisión posterior a consolidación; no aprobación global.

## DEC-104 — Rango de fechas inclusivo con salida disponible

- **Fecha de registro:** 2026-10-30.
- **Pregunta aclarada:** ante «no entiendo», ejemplo del 10 al 15 de noviembre: salida disponible el 12 o el 15 aparece; oferta que solo sale el 20 no aparece. Se aclaró que ambos días del rango están incluidos.
- **Respuesta:** «si», confirmada durante modo de planificación; después el usuario pidió «guarda y continua» al salir de ese modo.
- **Regla:** para coincidir con el rango de fechas, la oferta debe tener al menos una salida disponible entre el día inicial y el final, incluidos ambos, usando fecha de salida en hora de Perú según DEC-088. Una salida no reservable dentro del rango no se compensa con disponibilidad fuera de él.
- **Límite:** filtrar no retiene cupos ni garantiza reserva futura; conserva estado, precio y demás reglas de reservabilidad. No resuelve rangos invertidos, combinación de filtros ni modifica fechas de las salidas.
- **Destino:** [006 v0.44](specs/006-catalogo/spec.md), RF-98; elegibilidad y bordes de fecha de ACL-30 resueltos. Tercera respuesta de la revisión posterior a consolidación; no aprobación global.

## DEC-105 — Rango invertido: error sin intercambio automático

- **Fecha de registro:** 2026-10-30.
- **Pregunta:** rango invertido con ejemplo de precio mínimo S/200 y máximo S/100; mostrar «El rango no es válido» y pedir corrección sin intercambiar los valores.
- **Respuesta:** «si , usa la logica ps no me preguntes estupideces o cosas obvias».
- **Regla confirmada:** rechazar aplicar un rango cuyo mínimo/inicio supera su máximo/final, mostrar «El rango no es válido» y conservar los extremos introducidos. La regla habitual se aplica a precio, duración y fechas; no se corrige silenciosamente la intención del visitante.
- **Límite:** no presentar entrada inválida como una búsqueda válida vacía ni añadir límites comerciales a los valores de las ofertas. No modifica reservas ni cupos.
- **Destino:** [006 v0.45](specs/006-catalogo/spec.md), RF-99–RF-101; intervalos invertidos de ACL-30 resueltos. Acuerdo recibido durante modo de planificación y guardado al reanudar trabajo documental; no aprobación global.

## DEC-106 — Validaciones habituales por delegación; todos los filtros aplicados

- **Fecha de registro:** 2026-10-30.
- **Autoridad:** instrucción «usa la logica» y petición de no preguntar detalles obvios. El asistente anunció que combinar filtros exigiría cumplirlos todos y separaría validación de resultados vacíos; el usuario pidió «continua» y volvió a habilitar trabajo documental.
- **Criterio adoptado por delegación:** una oferta debe cumplir todos los filtros aplicados; los no aplicados no restringen. Mantener orden, visibilidad y disponibilidad; un resultado no puede eludir un filtro para mostrar más ofertas. Dentro del destino se mantiene coincidencia en nombre o descripción, no en ambos obligatoriamente.
- **Alcance de la delegación:** resolver comportamientos ordinarios coherentes con lo acordado sin entrevistar cada validación. No equivale a una nueva respuesta literal «si» para cada regla ni a aprobación de la spec completa. Estas elecciones se muestran en el resumen de revisión y siguen sujetas a revisión del documento.
- **Límite:** no inventar máximos de fotos, condiciones comerciales o políticas de otras specs. Se mantienen separación de errores y vacíos, precios por salida y protección de reservas. Los pendientes no definidos siguen identificados.
- **Destino:** [006 v0.45](specs/006-catalogo/spec.md), RF-102 y resumen de revisión; combinación de filtros de ACL-30 resuelta por criterio delegado. Sin código ni plan/tareas.

## DEC-107 — Fotos sin cantidad máxima comercial por oferta

- **Fecha de registro:** 2026-10-30.
- **Contexto:** el usuario no entendió la expresión «fotos sin máximo comercial» y pidió explicaciones en términos sencillos. Se aclaró que significa no limitar cuántas fotos puede subir el administrador a cada tour o paquete, manteniendo 5 MB por archivo y los formatos JPG/PNG/WebP.
- **Pregunta:** «¿Quieres que el administrador pueda subir todas las fotos que necesite para cada tour o paquete?».
- **Respuesta:** «si», seguida de «continua».
- **Regla:** cada tour o paquete puede tener todas las fotos que el administrador necesite, contando la principal y la galería, sin una cantidad máxima fija como regla de negocio. Se conserva el mínimo de una imagen para publicar y las validaciones por archivo de DEC-083: JPG/PNG/WebP y hasta 5 MB cada uno.
- **Límite:** no promete almacenamiento infinito ni autoriza archivos inválidos; la capacidad y condiciones técnicas se documentarán en el plan sin presentarse como límite comercial. No define por inferencia carga masiva, carrusel, zoom u orden manual. No modifica 007, 012 ni la spec aprobada de Movilidad.
- **Destino:** [006 v0.46](specs/006-catalogo/spec.md), RF-103; cantidad de fotos de ACL-13/ACL-29 resuelta. Respuesta explícita recibida al salir del modo de planificación; no aprobación global ni creación de plan/tareas.

## DEC-108 — Hoteles con tarjetas y página de detalle

- **Fecha:** 2026-10-30.
- **Pregunta:** «Cuando el visitante entra a la sección Hoteles, ¿qué debe poder ver?».
- **Respuesta:** selección «Tarjetas + página de detalle».
- **Regla:** el catálogo público muestra tarjetas de hotel y una página de detalle con descripción, servicios, fotos, tipos de habitación, capacidad y tarifa base. La disponibilidad concreta se consulta al elegir alojamiento para una salida, conforme a DEC-007/DEC-031.
- **Límite:** no autoriza reserva hotelera independiente, fechas libres del cliente, filtros hoteleros ni fotos por tipo de habitación. No aprueba la spec 007 completa.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-5/RF-6/RF-10; primera respuesta de la entrevista de Hoteles.

## DEC-109 — Hotel sin disponibilidad sigue visible

- **Fecha:** 2026-10-30.
- **Pregunta:** «Si un hotel activo no tiene habitaciones disponibles en este momento, ¿qué debe pasar en el catálogo público?».
- **Respuesta:** selección «Sigue visible, sin disponibilidad».
- **Regla:** un hotel activo y no eliminado permanece en el catálogo aunque ningún tipo de habitación tenga inventario futuro disponible. Su tarjeta y detalle indican «Sin disponibilidad». La visibilidad hotelera no depende de una salida concreta.
- **Límite:** no cambia la exclusión de hoteles inactivos o eliminados ni la ocultación de la sección sin hoteles visibles. No autoriza mostrar habitaciones sin cupo como reservables ni inventa un estado administrativo nuevo.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-9; segunda respuesta de la entrevista.

## DEC-110 — Fotos de hotel: principal y galería sin cantidad máxima

- **Fecha:** 2026-10-30.
- **Pregunta:** «¿Cuántas fotos puede tener cada hotel?».
- **Respuesta:** selección «Principal + galería sin límite».
- **Regla:** cada hotel admite una imagen principal y una galería en el detalle, con todas las fotos que el administrador necesite, sin cantidad máxima comercial. Se aplican JPG/PNG/WebP y hasta 5 MB por archivo. Ante fallo de carga o reemplazo se muestra «No se pudo cargar la imagen» y se conservan las imágenes anteriores.
- **Límite:** no copia automáticamente otras políticas de 006/012 ni promete almacenamiento infinito. La capacidad técnica se tratará en el plan. En su momento no autorizaba fotos por tipo de habitación; DEC-116 las incorpora después.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-45–RF-50; tercera respuesta de la entrevista.

## DEC-111 — Hotel creado desactivado y activado con datos completos

- **Fecha:** 2026-10-30.
- **Pregunta:** «¿Cómo debe funcionar el alta y la publicación de un hotel?».
- **Respuesta:** selección «Crear desactivado y activar completo».
- **Regla:** el hotel se crea desactivado. Para activarlo requiere nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo de habitación con capacidad y tarifa válidas. La activación incompleta se rechaza y el hotel permanece desactivado.
- **Límite:** no publica automáticamente al crear ni permite activar con datos mínimos. No define por inferencia topes de textos, cantidad de servicios o cantidad de tipos de habitación.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-13–RF-15; cuarta respuesta de la entrevista.

## DEC-112 — Propuesta de alojamiento por salida, hotel y período

- **Fecha:** 2026-10-30.
- **Pregunta:** «Para asociar alojamiento a una salida, ¿cómo se agrupan las opciones?».
- **Respuesta:** selección «Una propuesta por hotel y período».
- **Regla:** el administrador crea una propuesta para una salida, un hotel y un período de entrada/salida; dentro se ofrecen automáticamente todos los tipos de habitación activos del hotel, cada uno con su tarifa base y cupo. El cliente elige un tipo y reserva una sola habitación. El inventario se comparte por tipo y fecha/noche entre las propuestas que usen el mismo hotel.
- **Límite:** no crea una propuesta separada por tipo ni permite varios tipos en una misma reserva; tampoco permite excluir tipos activos de la propuesta. Conserva períodos múltiplos de 24 horas, fechas futuras en hora de Perú, asociación a una salida concreta y protección de reservas de 001/DEC-031/DEC-032. No aprueba la spec 007 completa.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-34–RF-43; quinta respuesta de la entrevista.

## DEC-113 — Validaciones habituales de Hoteles por delegación

- **Fecha:** 2026-10-30.
- **Autoridad:** instrucción previa «usa la logica ps no me preguntes estupideces o cosas obvias», ratificada en DEC-105/DEC-106.
- **Criterios adoptados:** orden alfabético por nombre; nombres de hoteles activos únicos ignorando mayúsculas/minúsculas y espacios exteriores; nombres de tipos de habitación únicos dentro del hotel con la misma comparación; capacidad entera positiva; tarifa positiva en soles con dos decimales; permisos de escritura solo para `admin`; auditoría de todo cambio administrativo de hoteles, tipos, tarifas, inventario y propuestas; cambios de fechas de propuesta que no alteran reservas creadas; borrado lógico con historial.
- **Alcance:** completa los comportamientos ordinarios no preguntados en la entrevista de 007, por coherencia con 001/006/013 y las reglas ya aprobadas. No equivale a respuestas literales nuevas ni a aprobación de la spec completa.
- **Límite:** no inventa máximos comerciales, filtros hoteleros, tarifas por temporada, políticas de cancelación ni otros alcances excluidos en 007. Las decisiones funcionales explícitas siguen siendo DEC-108–DEC-112 y DEC-114–DEC-116.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-7/RF-20/RF-21/RF-23/RF-25 y resumen de revisión.

## DEC-114 — Una sola tarifa por tipo de habitación

- **Fecha:** 2026-10-30.
- **Pregunta:** «¿La tarifa de una habitación debe ser la misma para todas las salidas, o quieres que el administrador pueda poner una tarifa distinta según la salida o la temporada?».
- **Respuesta:** selección «Una sola tarifa por tipo».
- **Regla:** cada tipo de habitación tiene una tarifa base única, usada por todas las salidas y propuestas. El importe hotelero se obtiene multiplicando esa tarifa por la cantidad de períodos completos de 24 horas; no se multiplica por ocupantes ni varía por salida o temporada.
- **Límite:** no autoriza tarifas por temporada, por fecha, por salida ni por ocupante. No cambia la conservación de importes históricos ni la fórmula de 001/DEC-008/DEC-018.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-32 y fuera de alcance; primera duda posterior a la entrevista.

## DEC-115 — Sin filtros ni buscador en Hoteles

- **Fecha:** 2026-10-30.
- **Pregunta:** «¿Quieres filtros o buscador en la sección Hoteles, o el catálogo solo debe mostrarse alfabéticamente?».
- **Respuesta:** «ya no».
- **Regla:** el catálogo público de Hoteles se muestra completo y en orden alfabético, sin filtros ni buscador propios. No se agregan precio, capacidad, servicios ni destino como filtros hoteleros.
- **Límite:** no elimina los filtros ya aprobados de Tours/Paquetes ni cambia la visibilidad de hoteles activos. No crea una búsqueda por nombre ni una lista de destinos hoteleros.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), fuera de alcance; segunda duda posterior a la entrevista.

## DEC-116 — Fotos por tipo de habitación, opcionales y sin máximo

- **Fecha:** 2026-10-30.
- **Pregunta 1:** «¿Las fotos deben ser solo del hotel, o también quieres que cada tipo de habitación tenga sus propias fotos?».
- **Respuesta 1:** selección «Fotos por tipo de habitación».
- **Pregunta 2:** «¿Cada tipo de habitación debe tener al menos una foto para poder activarse, o puede quedar sin foto?».
- **Respuesta 2:** selección «Foto opcional».
- **Pregunta 3:** «¿Cómo se organizan las fotos de cada tipo de habitación?».
- **Respuesta 3:** selección «Principal + galería sin límite».
- **Regla:** cada tipo de habitación puede tener una imagen principal y una galería en el detalle, con todas las fotos que el administrador necesite y sin cantidad máxima comercial. Las fotos del tipo son opcionales para activarlo. Se aplican JPG/PNG/WebP y hasta 5 MB por archivo; ante fallo se muestra «No se pudo cargar la imagen» y se conservan las imágenes anteriores. Si no hay fotos, el tipo se muestra sin imagen, sin placeholder.
- **Límite:** no copia políticas de otros ámbitos ni promete almacenamiento infinito. No crea fotos obligatorias para activar el tipo ni cambia el mínimo de una imagen del hotel para activar el hotel. La capacidad técnica se tratará en el plan.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-6/RF-45–RF-50/RF-55–RF-56; tercera duda posterior a la entrevista.

## DEC-117 — Todos los tipos activos entran en la propuesta

- **Fecha:** 2026-10-30.
- **Pregunta:** «Dentro de una propuesta de alojamiento, ¿se ofrecen automáticamente todos los tipos de habitación activos del hotel, o el administrador elige cuáles incluir?».
- **Respuesta:** selección «Todos los tipos activos».
- **Regla:** la propuesta de una salida, un hotel y un período ofrece automáticamente todos los tipos de habitación activos de ese hotel. El administrador no selecciona un subconjunto; el cliente elige uno de esos tipos y reserva una sola habitación. Los tipos inactivos no se ofrecen.
- **Límite:** no crea propuestas por tipo, no permite varios tipos en una misma reserva y no autoriza excluir un tipo activo de la propuesta. Conserva tarifa única por tipo, inventario compartido por tipo/fecha y protección de reservas.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-34/RF-36 y precisión de DEC-112; cuarta duda posterior a la entrevista.

## DEC-118 — Servicios del hotel como lista libre de textos

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Cómo debe registrar el administrador los servicios del hotel?».
- **Respuesta:** selección «Lista libre de textos».
- **Regla:** el administrador registra los servicios de cada hotel como una lista de textos libres, agregando o quitando los que necesite. No existe un catálogo fijo de servicios. El hotel requiere al menos un servicio para activarse y los servicios se muestran en la tarjeta y en el detalle.
- **Límite:** no crea categorías, iconos, filtros ni un catálogo administrable de servicios. No fija un máximo de servicios ni cambia las reglas de fotos, habitaciones o propuestas. No aprueba la spec 007 completa.
- **Destino:** [007 v0.2](specs/007-hoteles/spec.md), RF-5/RF-6/RF-14/RF-15/RF-58; quinta duda posterior a la entrevista.

## DEC-119 — Aprobación explícita de la spec 007 v0.2

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿La apruebas explícitamente con sus 58 criterios?».
- **Respuesta:** «si».
- **Efecto:** se aprueba el documento completo [007 — Hoteles y alojamiento v0.2](specs/007-hoteles/spec.md), con sus 58 criterios locales y sus límites. La aprobación no modifica los criterios ni las decisiones DEC-108–DEC-118.
- **Límite:** no aprueba 005, 006, 010 ni 012 por inferencia; no autoriza código, cambios fuera de `sdd/`, commits ni push. Habilita crear [plan](specs/007-hoteles/plan.md) y [tareas](specs/007-hoteles/tasks.md) como documentos no ejecutados.
- **Destino:** sección de aprobación de [007 v0.2](specs/007-hoteles/spec.md); [índice de specs](specs/README.md) y trazabilidad.

## DEC-120 — Dos pagos exitosos para una misma reserva

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si Culqi reporta dos pagos exitosos distintos para la misma reserva, ¿qué debe hacer el sistema?».
- **Respuesta:** selección «Confirmar una vez y devolver el segundo».
- **Regla:** el primer pago válido confirma la reserva una sola vez. El segundo pago exitoso se registra como duplicado/excedente, no cambia el estado de la reserva, no genera una segunda confirmación ni una segunda notificación y se devuelve por su importe completo.
- **Límite:** no define por sí solo el tratamiento de un pago con importe o moneda distintos; ese caso se resolvió después en DEC-126/ACL-33. No autoriza doble confirmación ni doble cargo lógico.
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-32–RF-35.

## DEC-121 — Calendario de un día hábil para devoluciones

- **Fecha:** 2026-10-31.
- **Pregunta:** «Para el plazo máximo de un día hábil destinado a iniciar la devolución manual, ¿qué calendario y zona horaria deben aplicarse?».
- **Respuesta:** selección «Lunes a viernes, hora Perú».
- **Regla:** el plazo de un día hábil se cuenta de lunes a viernes, en hora de Perú, excluyendo feriados nacionales. Se cuenta desde la detección del cobro que debe devolverse. No es promesa de abono en ese plazo.
- **Límite:** no define feriados locales o regionales distintos de los nacionales ni amplía el plazo por demora del proveedor.
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-37–RF-38; ACL-01.

## DEC-122 — Mensaje ante pago rechazado

- **Fecha:** 2026-10-31.
- **Pregunta:** «Cuando un intento de pago es rechazado, ¿qué mensaje debe mostrarse al cliente?».
- **Respuesta:** selección «Motivo si existe; si no, mensaje genérico».
- **Regla:** si Culqi informa un motivo comprensible, se muestra ese motivo; si no, se muestra literalmente «No se pudo procesar el pago». Nunca se muestran datos sensibles de la tarjeta.
- **Límite:** no obliga a exponer códigos internos ni mensajes técnicos del proveedor; no define el formato exacto de cada motivo.
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-20–RF-22.

## DEC-123 — Evidencia de la devolución

- **Fecha:** 2026-10-31.
- **Pregunta:** «Cuando el administrador inicia la devolución manual de un cobro, ¿qué evidencia mínima debe registrar el sistema?».
- **Respuesta:** selección «Registro con referencia y aviso».
- **Regla:** el sistema registra fecha de inicio, importe, referencia/ID de la operación y observación; avisa al cliente por correo. No exige adjuntar un comprobante bancario para cerrar el caso.
- **Límite:** no define el contenido exacto del correo (004) ni sustituye la referencia oficial de Culqi. La ejecución se rige por DEC-124.
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-41–RF-42; ACL-01.

## DEC-124 — Ejecución de devoluciones con Culqi

- **Fecha:** 2026-10-31.
- **Pregunta:** «Para los cobros que deben devolverse, ¿cómo se ejecuta la devolución?».
- **Respuesta:** selección «El sistema ejecuta con Culqi».
- **Regla:** el administrador confirma la devolución dentro de DMGoTravell; el sistema la ejecuta llamando a Culqi. No se ejecuta una devolución sin esa confirmación ni se limita a registrar una gestión externa.
- **Límite:** no autoriza devoluciones automáticas sin intervención del administrador ni define el contrato técnico de la API de Culqi; eso corresponde al plan. No cambia la política de cancelación de una reserva confirmada (ACL-02/009).
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-39–RF-40.

## DEC-125 — Fallo o resultado desconocido de una devolución

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si el sistema intenta ejecutar la devolución con Culqi y la operación falla, ¿qué debe ocurrir?».
- **Respuesta:** selección «Mantener abierto y permitir reintento».
- **Regla:** el caso permanece abierto, no se marca como devuelto, se avisa al administrador y se permite reintentar. El cliente mantiene el aviso de que la devolución está en gestión. Un resultado desconocido se trata igual que un fallo hasta confirmar el resultado.
- **Límite:** no fija un número máximo de reintentos ni autoriza devoluciones duplicadas; la idempotencia se exige en 002.
- **Destino:** [002 Pagos](specs/002-pagos/spec.md), RF-43–RF-44; ACL-01.

## DEC-126 — Pago exitoso con importe o moneda distintos

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué tratamiento recibe un pago exitoso cuyo importe o moneda no coincide con el total guardado?».
- **Respuesta:** selección «No confirmar, observar y devolver con el flujo normal».
- **Regla:** el pago no confirma la reserva; se registra como observado con el importe, la moneda y la referencia reportados; se avisa al administrador; se bloquea otro cobro para esa reserva mientras el caso siga abierto; el cliente ve que el pago está en revisión; y se devuelve el importe completo cobrado mediante la confirmación del administrador y la ejecución con Culqi.
- **Límite:** no define el texto exacto de la interfaz ni autoriza una devolución automática sin confirmación del administrador. No cambia la cancelación/vencimiento de 001/003 ni la política de 009.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-52–RF-56; ACL-33.

## DEC-127 — Reserva con pago observado antes del minuto 20

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si el pago observado ocurre antes de los 15 minutos y la reserva sigue `pending`, ¿qué debe pasar con la reserva?».
- **Respuesta:** selección «Mantener pending hasta el minuto 20».
- **Regla:** la reserva conserva su estado `pending` y su plazo de 001/003; no se libera inventario por la sola discrepancia; al cumplirse el minuto 20 sin pago válido se aplica la cancelación de 003 y se devuelve el cobro observado. El bloqueo de otro cobro se mantiene mientras el caso observado siga abierto.
- **Límite:** no autoriza confirmar el pago observado ni liberar recursos antes del plazo. No cambia la política de 009.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-57–RF-58.

## DEC-128 — Cancelación voluntaria con pago observado

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si el cliente tiene un pago observado y quiere cancelar voluntariamente antes del minuto 20, ¿qué debe hacer el sistema?».
- **Respuesta:** selección «No permitir hasta el minuto 20».
- **Regla:** mientras el pago observado siga abierto y la reserva siga `pending`, el sistema rechazará la cancelación voluntaria hasta el límite de veinte minutos. Al vencer sin pago válido se aplica la cancelación de 003 y la devolución del cobro observado.
- **Límite:** no cambia la cancelación administrativa de 009 ni la cancelación por vencimiento de 003; no autoriza liberar inventario antes del plazo.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-59.

## DEC-129 — Plazo visible para el cliente

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué plazo de pago debe ver el cliente?».
- **Respuesta:** selección «Solo los 15 minutos para iniciar el pago».
- **Regla:** el cliente ve el plazo de quince minutos para iniciar el pago. Los cinco minutos de tolerancia no se muestran como tiempo de pago disponible.
- **Límite:** no cambia los cortes internos de 001/003 ni autoriza iniciar un pago después del minuto 15.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-60/RF-64.

## DEC-130 — Formato del plazo visible

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Cómo debe mostrarse el plazo de 15 minutos al cliente?».
- **Respuesta:** selección «Contador y hora límite».
- **Regla:** se muestra un contador con el tiempo restante y la hora límite exacta para iniciar el pago.
- **Límite:** no define el diseño visual ni la frecuencia exacta de actualización; el contador se calcula con la hora del servidor.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-60/RF-61.

## DEC-131 — Ubicación del plazo visible

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Dónde debe mostrarse el contador y la hora límite?».
- **Respuesta:** selección «En la reserva y en la pantalla de pago».
- **Regla:** el contador y la hora límite se muestran en el detalle de la reserva y en la pantalla de pago del cliente propietario.
- **Límite:** no se exige mostrarlo en el listado de reservas ni en correos; el correo corresponde a 004.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-60.

## DEC-132 — Plazo vencido

- **Fecha:** 2026-10-31.
- **Pregunta:** «Cuando el contador llegue a 00:00, ¿qué debe ver el cliente?».
- **Respuesta:** selección «Plazo de pago vencido y pago deshabilitado».
- **Regla:** al llegar a cero se muestra literalmente «Plazo de pago vencido», se detiene el contador y se deshabilita el inicio de un nuevo pago. Si el cliente abre la reserva después del minuto 15, ve el mismo mensaje y no un contador activo.
- **Límite:** no cambia la tolerancia interna de cinco minutos ni la cancelación de 003; no autoriza nuevos intentos después del minuto 15.
- **Destino:** [002 v0.6](specs/002-pagos/spec.md), RF-62-RF-63.

## DEC-133 - Fallo persistente del vencimiento automático

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si el proceso automático de vencimiento falla o no logra cancelar/liberar en 60 segundos, ¿qué debe hacer el sistema?».
- **Respuesta:** selección «Reintentar y alertar al admin si persiste».
- **Regla:** si el proceso no completa la cancelación o la liberación en sesenta segundos, el sistema reintenta automáticamente y conserva evidencia del fallo. Si el fallo persiste, alerta al administrador, mantiene la reserva `pending` sin admitir nuevos pagos ni confirmación y no marca la liberación como completada.
- **Límite:** no fija un número máximo de reintentos ni el canal de la alerta; se concretan en el plan/004. No amplía el plazo de pago, no autoriza confirmar y no crea estados `expired` o `processing`.
- **Destino:** [003 v0.1](specs/003-vencimiento/spec.md), RF-11/RF-12/RF-14.

## DEC-134 - Aprobación de 003 Vencimiento v0.1

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Apruebas 003 Vencimiento v0.1 o sigo con la siguiente dependencia (004 Notificaciones)?».
- **Respuesta:** «Aprobar 003 v0.1».
- **Regla:** se aprueba explícitamente la [003 Vencimiento v0.1](specs/003-vencimiento/spec.md), con 20 criterios, los límites 15/20 de 001, liberación única, máximo de 60 segundos, reintento/alerta de DEC-133 y auditoría `reservation.auto_cancelled`.
- **Límite:** no crea plan/tareas, no autoriza código ni cambios fuera de `sdd/`. Las dependencias 004, 009 y 010 siguen pendientes.
- **Destino:** [003 v0.1](specs/003-vencimiento/spec.md); [README](README.md), [specs/README](specs/README.md), [trazabilidad](trazabilidad.md), [constitución](constitution.md) y [fuentes](fuentes.md).

## DEC-135 - Alcance de 004 Notificaciones

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿004 debe cubrir solo el comprobante al cliente o también los avisos operativos al administrador requeridos por 002/003?».
- **Respuesta:** selección «Comprobante al cliente y avisos al admin».
- **Regla:** 004 cubre el comprobante al cliente después de un pago confirmado y los avisos operativos al administrador por pago observado, fallo de devolución y fallo de vencimiento.
- **Límite:** no define la validación del pago, el vencimiento, la política de devolución ni los roles; esos temas corresponden a 002/003/005/009.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-1/RF-11–RF-14.

## DEC-136 - Contenido mínimo del comprobante

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué contenido mínimo debe incluir el comprobante que recibe el cliente?».
- **Respuesta:** selección «Reserva, viaje, importe y pago».
- **Regla:** el comprobante incluye identificador de reserva, cliente, tour o paquete, alojamiento cuando exista, fechas y viajeros, total y moneda, fecha y referencia del pago y estado `confirmed`.
- **Límite:** no fija plantilla, asunto, remitente, adjuntos ni formato PDF; se concretan en el plan.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-2.

## DEC-137 - Fallo de envío de notificaciones

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si Resend falla al enviar un comprobante o un aviso, ¿qué debe hacer el sistema?».
- **Respuesta:** selección «Reintentar y alertar al admin si persiste».
- **Regla:** si un envío falla, el sistema reintenta sin duplicar correos ya enviados; si el fallo persiste, alerta al administrador, conserva evidencia y no revierte la confirmación del pago.
- **Límite:** no fija un número máximo de reintentos ni la frecuencia; se concretan en el plan.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-6/RF-7/RF-22.

## DEC-138 - Reenvío manual de notificaciones

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿El administrador puede reenviar manualmente un comprobante o aviso fallido?».
- **Respuesta:** selección «Sí, con reenvío único y auditado».
- **Regla:** el administrador puede solicitar un único reenvío manual de una notificación fallida; el sistema lo audita y no duplica envíos por solicitudes repetidas. Si el reenvío falla, registra y alerta sin repetirlo automáticamente.
- **Límite:** no define el canal de solicitud ni la interfaz; se concretan en el plan.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-9/RF-10.

## DEC-139 - Correo inválido o rebote

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si el correo del cliente rebota o es inválido, ¿qué debe hacer el sistema?».
- **Respuesta:** selección «Registrar fallo y alertar al admin».
- **Regla:** si el correo del cliente rebota o es inválido, el sistema registra el fallo, alerta al administrador y no bloquea la reserva ni el pago.
- **Límite:** no define la corrección del correo ni el reenvío a otra dirección; la identidad y el cambio de correo corresponden a 005.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-8.

## DEC-140 - Contenido de los avisos operativos

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué debe incluir un aviso operativo al administrador?».
- **Respuesta:** selección «Reserva, motivo, fecha y acción requerida».
- **Regla:** cada aviso operativo al administrador identifica la reserva, el motivo, la fecha y la acción requerida.
- **Límite:** no define la plantilla ni los destinatarios exactos; se concretan en el plan o en 005.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md), RF-15.

## DEC-141 - Aprobación de 004 Notificaciones v0.1

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Apruebas 004 Notificaciones v0.1 o sigo con 005 Identidad?».
- **Respuesta:** «Aprobar 004 v0.1».
- **Regla:** se aprueba explícitamente la [004 Notificaciones v0.1](specs/004-notificaciones/spec.md), con 22 criterios, comprobante al cliente, avisos operativos al administrador, envío por Resend, idempotencia, reintento/alerta, rebote, reenvío auditado y contenido mínimo.
- **Límite:** no crea plan/tareas, no autoriza código ni cambios fuera de `sdd/`. Las dependencias 005, 009 y 010 siguen pendientes.
- **Destino:** [004 v0.1](specs/004-notificaciones/spec.md); [README](README.md), [specs/README](specs/README.md), [trazabilidad](trazabilidad.md), [constitución](constitution.md) y [fuentes](fuentes.md).

## DEC-142 - Estrategia de tokens de 005

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué estrategia de tokens debe usar 005 para las sesiones?».
- **Respuesta:** selección «Access JWT + refresh rotatorio».
- **Regla:** 005 emite access JWT de corta duración y refresh tokens rotatorios. El refresh se almacena de forma segura, rota en cada uso y la reutilización de un refresh ya rotado revoca la familia y exige un nuevo inicio de sesión.
- **Límite:** la vigencia exacta, el algoritmo y el almacenamiento concreto se definen en el plan.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-4/RF-9/RF-11–RF-13/RF-15.

## DEC-143 - Verificación de correo en 005

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Cuándo debe exigirse la verificación del correo electrónico?».
- **Respuesta:** selección «Antes de reservar o pagar».
- **Regla:** el cliente puede iniciar sesión con el correo sin verificar, pero no puede crear reservas ni iniciar pagos hasta verificarlo. La verificación usa un token de un solo uso enviado por Resend.
- **Límite:** la vigencia exacta del token y la plantilla del correo se concretan en el plan y en 004.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-6–RF-8.

## DEC-144 - Recuperación de contraseña en 005

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Cómo debe funcionar la recuperación de contraseña?».
- **Respuesta:** selección «Enlace único por Resend».
- **Regla:** la solicitud responde de forma genérica; si la cuenta existe, se envía un enlace único de restablecimiento. Al usarlo se establece una nueva contraseña y se revocan todas las sesiones.
- **Límite:** la vigencia exacta del enlace y la política de contraseña se concretan en el plan.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-22–RF-25.

## DEC-145 - Aprovisionamiento de administradores

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Cómo se aprovisionan las cuentas administrativas?».
- **Respuesta:** selección «Seed/migración controlada».
- **Regla:** el administrador inicial se crea por seed o migración controlada; no existe registro público de administradores ni alta administrativa desde pantalla en 005.
- **Límite:** el procedimiento y la protección de credenciales se concretan en el plan; los secretos no se almacenan en el repositorio.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-26–RF-28.

## DEC-146 - Google con correo ya registrado

- **Fecha:** 2026-10-31.
- **Pregunta:** «Si Google devuelve un correo ya registrado con contraseña, ¿qué debe hacer 005?».
- **Respuesta:** selección «Exigir contraseña y vincular después».
- **Regla:** si Google devuelve un correo que ya pertenece a una cuenta con contraseña, se rechaza el inicio con Google y se indica iniciar con contraseña. El cliente autenticado puede vincular Google después, solo si el correo verificado coincide y no está vinculado a otra cuenta.
- **Límite:** no se vincula automáticamente por coincidencia de correo ni se crea una cuenta duplicada.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-17–RF-21.

## DEC-147 - Alcance del cierre de sesión

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿El cierre de sesión debe revocar solo la sesión actual o todas las sesiones del usuario?».
- **Respuesta:** selección «Solo la sesión actual».
- **Regla:** el logout revoca el refresh de la sesión actual; las demás sesiones siguen activas. El restablecimiento de contraseña sí revoca todas las sesiones por DEC-144.
- **Límite:** no crea una acción de cierre global en 005; si se necesita, se define en otra decisión.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md), RF-14/RF-23.

## DEC-148 - Aprobación de 005 Identidad v0.1

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Apruebas 005 Identidad v0.1 o sigo con 009 Administración de reservas?».
- **Respuesta:** «Aprobar 005 v0.1».
- **Regla:** se aprueba explícitamente la [005 Identidad v0.1](specs/005-identidad/spec.md), con 30 criterios, registro `client`, verificación de correo, JWT + refresh rotatorio, logout de la sesión actual, Google OAuth, recuperación por Resend, roles y seed administrativo.
- **Límite:** no crea plan/tareas, no autoriza código ni cambios fuera de `sdd/`. Las dependencias 009 y 010 siguen pendientes.
- **Destino:** [005 v0.1](specs/005-identidad/spec.md); [README](README.md), [specs/README](specs/README.md), [trazabilidad](trazabilidad.md), [constitución](constitution.md) y [fuentes](fuentes.md).

## DEC-149 - Transiciones administrativas de reservas

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué transiciones puede aplicar el administrador en 009?».
- **Respuesta:** selección «Solo confirmed → completed/cancelled».
- **Regla:** el administrador solo aplica `confirmed → completed` y `confirmed → cancelled`; no confirma ni cancela reservas `pending` y no reactiva reservas `cancelled` ni modifica `completed`.
- **Límite:** la confirmación de pago, el vencimiento y la cancelación voluntaria conservan sus specs; 009 no los sustituye.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-7–RF-13/RF-24.

## DEC-150 - Devolución por cancelación administrativa

- **Fecha:** 2026-10-31.
- **Pregunta:** «Cuando el administrador cancela una reserva confirmada antes del inicio del servicio, ¿qué devolución corresponde?».
- **Respuesta:** selección «Devolución total».
- **Regla:** la cancelación administrativa antes del inicio del servicio genera devolución total del importe cobrado, sin penalidad, mediante el flujo de 002.
- **Límite:** no crea devoluciones parciales, penalidades ni cobros nuevos; el importe y la ejecución se rigen por 002.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-15–RF-17/RF-19.

## DEC-151 - Corte de la cancelación administrativa

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Hasta qué momento puede el administrador cancelar una reserva confirmada?».
- **Respuesta:** selección «Hasta el inicio del servicio».
- **Regla:** la cancelación administrativa solo procede antes del inicio del servicio; desde el inicio se rechaza y solo se permite marcar `completed` cuando corresponda.
- **Límite:** el instante de inicio se toma de la reserva y se interpreta en hora de Perú; no se añade tolerancia no definida.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-8/RF-11/RF-20.

## DEC-152 - Aviso al cliente por cancelación administrativa

- **Fecha:** 2026-10-31.
- **Pregunta:** «Cuando el administrador cancela una reserva confirmada, ¿se debe avisar al cliente?».
- **Respuesta:** selección «Sí, con motivo y devolución».
- **Regla:** el cliente recibe un aviso por 004 con el motivo de la cancelación y el estado de la devolución.
- **Límite:** la plantilla y el contenido exacto se concretan en 004/plan.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-18.

## DEC-153 - Motivo obligatorio de cancelación

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿La cancelación administrativa debe exigir un motivo?».
- **Respuesta:** selección «Sí, motivo obligatorio y auditado».
- **Regla:** el administrador debe registrar un motivo; se conserva con actor, fecha, reserva y estado, y se usa en el aviso al cliente.
- **Límite:** no se define un catálogo cerrado de motivos; el plan puede fijar validaciones de longitud.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-14/RF-22.

## DEC-154 - Filtros de la consulta administrativa

- **Fecha:** 2026-10-31.
- **Pregunta:** «¿Qué filtros debe ofrecer la consulta administrativa de reservas?».
- **Respuesta:** selección «Estado, fechas, cliente/ID y oferta».
- **Regla:** la consulta permite filtrar por estado, rango de fecha de creación, correo o identificador del cliente, identificador de reserva y tour o hotel.
- **Límite:** la semántica exacta del rango de fechas y el tamaño de página se concretan en el plan.
- **Destino:** [009 v0.1](specs/009-administracion-reservas/spec.md), RF-1–RF-4.

## DEC-155 - Alcance de operaciones críticas en 010

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «¿Qué operaciones críticas debe registrar y permitir consultar 010?».
- **Respuesta:** selección «Todas las críticas de 001–009».
- **Regla:** se incluyen las operaciones críticas de identidad, reservas, pagos/devoluciones, vencimiento, notificaciones, catálogo/hoteles y administración, con sus actores humanos o automáticos.
- **Límite:** no incluye toda lectura o visita pública por inferencia; mantiene las obligaciones ya aprobadas de 013 y no inventa operaciones para 008 pendiente.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), tabla de alcance y RF-9–RF-26.

## DEC-156 - Conservación indefinida de auditoría

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «¿Cuánto tiempo deben conservarse los registros de auditoría?».
- **Respuesta:** selección «Conservación indefinida».
- **Regla:** los registros de auditoría se conservan indefinidamente y no se editan ni eliminan desde la aplicación.
- **Límite:** no promete capacidad física ilimitada ni decide la conservación de todos los datos personales del perfil; archivo y almacenamiento corresponden al plan.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), RF-16–RF-18.

## DEC-157 - Filtros de clientes y auditoría

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «¿Qué filtros debe ofrecer 010 para auditoría y clientes?».
- **Respuesta:** selección «Auditoría completa + clientes».
- **Regla:** auditoría filtra por fecha, actor, acción, entidad, identificador, correlación y resultado; clientes por nombre, correo, identificador, estado y fecha de registro.
- **Límite:** no decide coincidencia textual, combinación de filtros ni límites inclusivos de fechas; esas precisiones siguen visibles sin copiar reglas de catálogo.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), RF-4/RF-23/RF-34.

## DEC-158 - Datos consultables de clientes

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «¿Qué datos de cada cliente puede ver el administrador en 010?».
- **Respuesta:** selección «Perfil básico y resumen de reservas».
- **Regla:** nombre, correo, teléfono disponible, fecha de registro, verificación, estado y cantidad de reservas; sin contraseñas, tokens ni datos sensibles de tarjeta.
- **Límite:** no crea campos obligatorios ausentes en la identidad ni habilita edición; el detalle operativo de las reservas corresponde a 009.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), RF-5/RF-6/RF-8.

## DEC-159 - Consulta de clientes estrictamente de solo lectura

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «En la vista de clientes de 010, ¿el administrador tiene solo lectura o puede ejecutar acciones?».
- **Respuesta:** selección «Estrictamente solo lectura».
- **Regla:** 010 no permite editar, desactivar ni reactivar clientes.
- **Límite:** identidad y perfil/baja siguen en sus specs; no se autoriza ninguna acción administrativa adicional sobre cuentas.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), RF-7/RF-35.

## DEC-160 - Exportación CSV de clientes y auditoría

- **Fecha de registro:** 2026-11-01.
- **Pregunta:** «Última decisión de 010: ¿incluimos exportación o solo consulta paginada en pantalla?».
- **Respuesta:** selección «Exportar CSV».
- **Regla:** el administrador puede exportar los resultados filtrados de clientes y auditoría a CSV, con los mismos permisos y exclusiones de datos sensibles de la consulta.
- **Límite:** es ampliación explícita respecto de RF15/HU-18; no sustituye el reporte PDF de 011/HU-19 ni incorpora JSON. Volumen, referencia temporal y comportamiento ante datos cambiantes permanecen pendientes.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), RF-27–RF-32/RF-35.

Las seis decisiones anteriores registran respuestas de entrevista, no la aprobación de 010. La aprobación posterior con pendientes se registra en DEC-161. 009 permanece en borrador por elección explícita del usuario; no se registra DEC de aprobación para 009.

## DEC-161 - Aprobación de 010 v0.1 con pendientes explícitos

- **Fecha:** 2026-11-01.
- **Pregunta:** «¿Apruebas 010 v0.1 con esos pendientes documentados?».
- **Respuesta:** «si , o aun hay dudas?».
- **Regla:** se registra la aprobación de 010 v0.1 con sus 35 criterios y los pendientes documentados; la pregunta adicional del usuario se responde confirmando que aún hay dudas funcionales.
- **Pendientes conservados:** fallo al guardar auditoría; volumen/referencia temporal de exportaciones y cambios concurrentes; consulta de clientes con baja lógica. Se mantienen también las precisiones de filtros y detalles del plan enumerados en la spec.
- **Límite:** esta aprobación no resuelve esos pendientes ni autoriza implementar las partes afectadas; no crea plan/tareas ni aprueba 002 o 009. Sin cambios fuera de `sdd/`, código, commits o push.
- **Destino:** [010 v0.1](specs/010-clientes-auditoria/spec.md), sección de aprobación; índices SDD, fuentes, aclaraciones y trazabilidad.

## DEC-162 - No aplicar un cambio sin guardar su auditoría

- **Fecha:** 2026-11-01.
- **Pregunta:** «La auditoría guarda quién hizo un cambio, qué cambió y cuándo. Si no se puede guardar ese registro antes de aplicar una acción —por ejemplo, editar una oferta—, ¿qué debe pasar?».
- **Respuesta:** selección «No aplicar el cambio».
- **Regla:** si falla guardar la auditoría de una acción que aún puede detenerse, no se aplica el cambio y se informa del error para intentar después.
- **Límite:** no deshace un cobro externo ya realizado; ese caso se concreta en DEC-166. No amplía plazos de reserva ni autoriza cambios fuera de `sdd/`.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), RF-36/RF-37.

## DEC-163 - Referencia temporal del CSV al inicio

- **Fecha:** 2026-11-01.
- **Pregunta:** «Mientras se prepara un CSV pueden aparecer registros nuevos o cambiar datos de clientes. ¿Qué información debe incluir el archivo?».
- **Respuesta:** selección «La del inicio».
- **Regla:** el CSV representa los datos y filtros al solicitar la exportación; los cambios posteriores requieren una nueva exportación.
- **Límite:** no selecciona un mecanismo técnico para obtener esa referencia temporal; corresponde al plan.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), RF-42.

## DEC-164 - Exportación completa sin recorte por volumen

- **Fecha:** 2026-11-01.
- **Pregunta:** «Si los filtros devuelven muchos resultados, ¿qué debe pasar con la exportación CSV?».
- **Respuesta:** selección «Exportar todos».
- **Regla:** exportar todos los resultados filtrados, aunque tarde más, sin truncamiento por volumen.
- **Límite:** no se promete tiempo máximo ni capacidad física ilimitada; un fallo se informa y no se presenta un archivo incompleto como éxito.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), RF-32/RF-43.

## DEC-165 - Consulta restringida de clientes con baja lógica

- **Fecha:** 2026-11-01.
- **Pregunta:** «Cuando un cliente elimina su cuenta, sus reservas y auditoría se conservan. ¿Cómo debe aparecer ese cliente en la consulta administrativa y en el CSV de clientes?».
- **Respuesta:** selección «Solo ID y resumen».
- **Regla:** mostrar solo identificador, estado de baja y cantidad de reservas en consulta y CSV de clientes; ocultar nombre, correo y teléfono.
- **Límite:** no borra ni modifica reservas o auditoría histórica ni define la ejecución de la baja de 008.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), precisión de RF-5 y RF-44.

## DEC-166 - Recuperación de auditoría de un cobro ya realizado

- **Fecha:** 2026-11-01.
- **Pregunta:** «Si Culqi ya cobró y luego falla el guardado de auditoría, ¿cómo debe tratarse ese caso? El fallo no puede deshacer un cobro ya realizado.».
- **Respuesta:** selección «Recuperar registro».
- **Regla:** conservar el resultado real del pago, reintentar guardar la evidencia y alertar al administrador si persiste el fallo; no repetir ni cancelar el cobro solo por ese fallo.
- **Límite:** no confirma una reserva por el mero cobro, no cambia los límites de 001/003 ni la política de devolución de 002. Recuperación, umbral y canal de alerta se concretan en el plan.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), RF-38–RF-41.

## DEC-167 - Combinación, coincidencia y fechas de filtros

- **Fecha:** 2026-11-01.
- **Pregunta:** «Última precisión: ¿los resultados deben cumplir todos los filtros elegidos, permitir buscar nombre/correo escribiendo solo una parte sin distinguir mayúsculas e incluir completos el primer y último día del rango de fechas, en hora de Perú?».
- **Respuesta:** selección «Sí, esas reglas».
- **Regla:** exigir todos los filtros elegidos; nombre/correo con coincidencia parcial sin distinguir mayúsculas; rango inclusivo de días completos en hora de Perú.
- **Límite:** no decide búsqueda sin tildes ni transforma identificadores o estados en búsquedas parciales por analogía.
- **Destino:** [010 v0.2](specs/010-clientes-auditoria/spec.md), RF-45–RF-47.

La segunda ronda de seis respuestas cierra las dudas funcionales anteriores de 010 y se incorpora a v0.2 como **borrador pendiente de aprobación**. DEC-161 conserva la aprobación histórica de v0.1, no de v0.2. No se crean plan/tareas ni se modifican documentos protegidos.

## DEC-168 - Cierre de detalles funcionales de 010 por delegación

- **Fecha:** 2026-11-01.
- **Solicitud literal:** «hay algun detalle que falta, hazlo de una vez».
- **Naturaleza:** autorización para completar detalles del borrador sin más preguntas; no es una respuesta individual a cada regla siguiente ni una aprobación del documento completo.
- **Criterios adoptados por delegación:** orden descendente de clientes por registro y de auditoría por operación, desempate por ID; página válida vacía sin salto; IDs/opciones exactos; fechas inválidas/invertidas rechazadas y extremos omitidos como rangos abiertos; espacios exteriores retirados de texto y filtros vacíos omitidos; cantidad de reservas sin duplicados incluyendo los cuatro estados; baja lógica no localizable por nombre/correo ocultos; CSV vacío con cabeceras; referencia temporal informada; comprobar permisos antes de entregar un archivo generado.
- **Resolución conservadora de concurrencia:** si el cliente se da de baja durante la preparación de un CSV de clientes, ocultar en su fila los datos restringidos antes de entregarlo; si el solicitante perdió la autorización, bloquear la descarga. Estas protecciones prevalecen sobre la copia temporal del inicio sin eliminar filas, añadir nuevos registros ni alterar valores ordinarios de esa copia.
- **Límite:** no añade búsqueda fonética o sin tildes, nuevos mensajes exactos, SLA, límites de exportación ni tecnologías. Detalles técnicos y recuperación verificable corresponden al plan posterior a aprobación; la integración de la nueva alerta debe formalizarse porque 004 v0.1 no la incluye. No se modifica 004 ni las specs protegidas.
- **Estado al registrar la delegación:** se incorpora a [010 v0.3](specs/010-clientes-auditoria/spec.md) como borrador con 59 criterios, sin aprobación automática. La aprobación posterior de v0.3 se registra en DEC-169; v0.1 permanece como antecedente aprobado en DEC-161 y v0.2 no tuvo aprobación explícita.
- **Destino:** 010/RF-48–RF-59, precisiones de concurrencia/filtros y puertas de integración; índices SDD, fuentes, aclaraciones y trazabilidad. Sin plan/tareas, código, commits ni push.

## DEC-169 - Aprobación explícita de 010 Clientes y auditoría v0.3

- **Fecha:** 2026-11-01.
- **Pregunta:** «¿Apruebas 010 v0.3?».
- **Respuesta:** «si».
- **Regla:** se aprueba expresamente [010 v0.3](specs/010-clientes-auditoria/spec.md) con sus 59 criterios, alcance, reglas de auditoría, consultas, exportación CSV y protección de datos.
- **Pendientes conservados:** detalles técnicos del futuro plan, recuperación verificable e integración de la alerta no incluida en 004 v0.1; las puertas documentadas deben cerrarse antes de ejecutar las partes afectadas.
- **Límite:** no aprueba 002 ni 009, no crea plan/tareas en esta actividad y no autoriza código, cambios en documentos protegidos, commits o push.
- **Destino:** sección de aprobación de 010, índices SDD, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-170 - Cierre transversal de dudas de la cadena de Pagos por delegación

- **Fecha:** 2026-11-01.
- **Solicitud literal:** «a que finalizar todas las dudas de una vez».
- **Naturaleza:** cierre documental de la cadena activa de 002 y sus dependencias, con precisiones adoptadas por delegación; no se inventan respuestas individuales ni aprobaciones.
- **Criterios adoptados para 002:** verificación oficial antes de repetir una devolución desconocida; no duplicar una devolución ejecutada ni superar el importe de un cobro; autorización administrativa de reintento; distinguir ejecución de abono bancario; vincular el caso de cancelación de 009.
- **Criterios adoptados para 009:** inicio por el primer componente contratado y fin después de todos; confirmación expresa del administrador para completar; liberación idempotente de recursos de cancelación confirmada, junto al estado/caso de devolución/auditoría locales; conservar cancelación y liberación si luego falla el reembolso externo. Semántica de filtros, fechas, orden y motivo sin espacios vacíos completada.
- **Contratos de 004:** complemento separado para aviso de cancelación/devolución, correos de identidad definidos por 005 y alerta de auditoría con evidencia recuperable, sin dependencia circular del guardado fallido ni recursión infinita. No se edita la base aprobada.
- **Límite:** el inicio por primer componente y la liberación de confirmadas son reglas adicionales de 009 propuestas por delegación, no contenido atribuido retrospectivamente a 001/007. No se prometen firmas, tiempos ni capacidades de Culqi sin verificación. La matriz de cierre separa dudas funcionales redactadas, aprobaciones y evidencia técnica requerida.
- **Documentos:** [002 v0.7](specs/002-pagos/spec.md), 70 criterios; [009 v0.2](specs/009-administracion-reservas/spec.md), 37 criterios; [complemento 004 v0.1](specs/004-notificaciones/complemento-contratos.md), 16 criterios locales. **Los tres quedan pendientes de aprobación explícita.**
- **Destino:** [cierre de dependencias de 002](cierre-dependencias-002.md), índices SDD, aclaraciones, constitución, fuentes y trazabilidad. No se crean plan/tareas; specs aprobadas, código y originales intactos; sin commits ni push.

## DEC-171 - Aprobación de 002 Pagos v0.7

- **Fecha:** 2026-11-01.
- **Pregunta conjunta explícita:** «¿Apruebas expresamente 002 v0.7, 009 v0.2 y el complemento de 004 v0.1?».
- **Respuesta:** «si».
- **Regla:** se aprueba 002 v0.7 con sus 70 criterios y contratos funcionales documentados.
- **Límite:** no crea plan/tareas ni autoriza implementación; se mantienen las comprobaciones técnicas de la matriz de cierre. Las aprobaciones de los otros documentos enumerados se registran separadamente en DEC-172/DEC-173.
- **Destino:** [002 v0.7](specs/002-pagos/spec.md), matriz e índices SDD.

## DEC-172 - Aprobación de 009 Administración de reservas v0.2

- **Fecha:** 2026-11-01.
- **Pregunta conjunta explícita:** «¿Apruebas expresamente 002 v0.7, 009 v0.2 y el complemento de 004 v0.1?».
- **Respuesta:** «si».
- **Regla:** se aprueba 009 v0.2 con sus 37 criterios, corte/fin por componentes, devolución total y liberación local idempotente.
- **Límite:** no modifica 001/007 ni sus planes/tareas; no autoriza código ni elimina las pruebas de integración requeridas. Sin plan/tareas nuevos, commits o push.
- **Destino:** [009 v0.2](specs/009-administracion-reservas/spec.md), matriz e índices SDD.

## DEC-173 - Aprobación del complemento de contratos de 004 v0.1

- **Fecha:** 2026-11-01.
- **Pregunta conjunta explícita:** «¿Apruebas expresamente 002 v0.7, 009 v0.2 y el complemento de 004 v0.1?».
- **Respuesta:** «si».
- **Regla:** se aprueba el complemento separado de 004 v0.1 con 16 criterios locales de avisos de cancelación/devolución, identidad y fallos de auditoría.
- **Límite:** los 22 criterios de la base 004 v0.1 y su archivo permanecen intactos; se mantienen las puertas técnicas de recuperación y entrega. No se crean plan/tareas ni se autoriza código, commits o push.
- **Destino:** [complemento 004 v0.1](specs/004-notificaciones/complemento-contratos.md), matriz e índices SDD.

## DEC-174 - Continuación con plan y tareas documentales de 002

- **Fecha:** 2026-11-01.
- **Solicitud:** «continua», posterior a las aprobaciones DEC-171–DEC-173.
- **Alcance comunicado:** continuar la planificación documental de 002 Pagos exclusivamente en `sdd/`, sin código ni modificación de planes existentes.
- **Resultado:** [plan 002 v0.1](specs/002-pagos/plan.md) y [T002-01–T002-32](specs/002-pagos/tasks.md), backlog no ejecutado con cobertura de los 70 criterios aprobados. Las elecciones técnicas son propuestas del plan, no ADR nuevas ni cambios de negocio.
- **Evidencia externa consultada:** documentación pública oficial de Checkout, Yape, Webhooks y devoluciones de Culqi el 2026-11-01; sin credenciales ni llamadas financieras. La página de Yape indica máximo S/ 2.000 y vigencia del código de hasta 2 minutos; la página de devoluciones describe condiciones de comisión que requieren verificar el cumplimiento de devolución total.
- **Límite:** estas lecturas no validan el contrato íntegro de API, autenticidad, idempotencia, recuperación ni importe neto del cliente; quedan G-01–G-05 y pruebas test antes de habilitar efectos reales. No se fraccionan pagos, descuentan comisiones al cliente ni alteran plazos por iniciativa técnica.
- **Preservación:** spec 002 v0.7 y todas las specs aprobadas intactas; planes/tareas 001/006/007/013 intactos; sin implementación, commits ni push.
- **Destino:** plan/tasks de 002, matriz de cierre, índices, fuentes, aclaraciones, constitución y trazabilidad.

## DEC-175 - Continuación con plan y tareas documentales de 003

- **Fecha:** 2026-11-01.
- **Solicitud:** «continua», posterior a la creación documental de plan/tasks de 002.
- **Alcance comunicado:** plan y backlog de 003 Vencimiento exclusivamente en `sdd/`, no ejecución.
- **Resultado:** [plan 003 v0.1](specs/003-vencimiento/plan.md) y [T003-01–T003-24](specs/003-vencimiento/tasks.md), todas pendientes, con cobertura de los 20 criterios aprobados.
- **Evidencia consultada:** guías oficiales de Hangfire de trabajos recurrentes, diferidos y excepciones, el 2026-11-01. Publican recurrencia basada en minutos, sondeo de diferidos predeterminado de 15 segundos configurable y 10 reintentos automáticos por defecto; no prueban el máximo de 60 segundos en el entorno del proyecto.
- **Propuesta técnica:** diferidos por reserva/cortes originales, intención durable, recuperación de huérfanas y presupuesto normal de diseño de 30 segundos antes del límite de 60. Sondeo propuesto de 5 segundos, ciclo rápido de 3 reintentos con esperas 5/10/20 y reevaluación degradada de 60 segundos; no son cifras medidas ni una prórroga comercial.
- **Límite:** mantener las ventanas 15/20, `pending` ante fallo persistente, liberación idempotente y `reservation.auto_cancelled`. No autorizar cancelación administrativa manual de `pending` ni nuevos estados. V-01–V-05 quedan como puertas técnicas/ejecución verificables.
- **Preservación:** spec 003, todas las demás aprobadas y planes/tareas anteriores —incluidos 002— permanecen intactos. Sin código, jobs ejecutados, commits ni push.
- **Destino:** plan/tasks de 003, matriz de cierre e índices SDD, fuentes, aclaraciones, constitución y trazabilidad.

## DEC-176 - Plan y tareas documentales de 004 y su complemento

- **Fecha:** 2026-11-01.
- **Solicitud:** «continua entonces» tras explicar que procedía planificar 004; «continua» durante la misma actividad confirma seguir con su cierre, no reemplaza el trabajo por otra spec.
- **Alcance comunicado:** planificación exclusiva en `sdd/`, base 004 v0.1 y complemento v0.1 aprobados, sin ejecución.
- **Resultado:** [plan 004 v0.1](specs/004-notificaciones/plan.md) y [T004-01–T004-30](specs/004-notificaciones/tasks.md), todas pendientes, con cobertura separada de 22 criterios de base y 16 del complemento.
- **Evidencia pública:** documentación oficial de Resend de claves de idempotencia, firma/eventos de Webhooks, dominio y cuotas, consultada el 2026-11-01. Publica conservación de claves durante 24 horas; aceptación API no equivale a entrega al servidor destinatario ni a lectura humana.
- **Propuestas técnicas:** outbox/inbox y unicidad local sin caducidad por la ventana del proveedor; payload/clave estables en retry automático; hasta 3 reintentos con esperas 30 segundos/2 minutos/10 minutos sujetos a contrato/cuota/TTL; reenvío manual único sin repetición automática tras su fallo. Plantillas HTML/texto plano, sin PDF/adjuntos por defecto.
- **Límite:** no enviar de nuevo a ciegas una entrega desconocida fuera del período seguro ni interpretar el reenvío como permiso para renovar enlaces de 005. M-01–M-06 conservan las verificaciones de cuenta/dominio, contrato real, firma, protección de enlaces, recuperación e autorización de ejecución.
- **Preservación:** bases/complementos y todas las specs aprobadas intactos; planes/tareas previos, incluidos 002 y 003, intactos. Sin código, envíos reales, cambios DNS, credenciales creadas, commits ni push.
- **Destino:** plan/tasks de 004, matriz de cierre, índices, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-177 - Directorio confirmado y planificación documental de 005

- **Fecha:** 2026-11-01.
- **Pregunta:** «¿Confirmas que continúe allí con 005 Identidad?», después de identificar `Desktop\DMGoTravelll` como la carpeta que contiene SDD.
- **Respuesta:** «si».
- **Alcance:** continuar exclusivamente en `C:\Users\Asus TUF\Desktop\DMGoTravelll\sdd`; no copiar/mover archivos ni trabajar en la carpeta homónima `DMGoTravell`.
- **Resultado:** [plan 005 v0.1](specs/005-identidad/plan.md) y [T005-01–T005-32](specs/005-identidad/tasks.md), todas pendientes, con cobertura de los 30 criterios aprobados.
- **Evidencia pública:** Microsoft Identity configuration/Identity API, Google OIDC y RFC 9700, consultadas el 2026-11-01. Los tokens incorporados de Identity API no son JWT estándar y una firma válida no demuestra revocación; `sub` es la clave externa estable de Google.
- **Propuestas del plan:** access JWT de 5 minutos, familia refresh absoluta de 14 días con rotación/reutilización estrictas, verificación de 24 horas y reset de 30 minutos; protección de cookies/CSRF, versión de seguridad y autorización vigente. Son parámetros técnicos propuestos, no cambios de negocio aprobados por la respuesta.
- **Límite:** la respuesta autoriza esta planificación, no implementación ni creación de cuentas, seed, claves o configuración Google/Resend. I-01–I-06 conservan la verificación técnica, seguridad y autorización de ejecución. No ampliar perfil/baja, usuarios administrativos ni reemisión de enlaces fuera de la spec.
- **Preservación:** todas las specs y planes/tareas anteriores intactos, incluidos 002/003/004; sin código, envíos, DNS, commits ni push.
- **Destino:** plan/tasks de 005, matriz de cierre e índices SDD, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-178 - Planificación profesional de 009 Administración de reservas

- **Fecha:** 2026-11-02.
- **Solicitud:** «continua de manera profesional», reiterada con «continua» durante el mismo trabajo.
- **Alcance comunicado:** plan/tasks de 009 exclusivamente en `Desktop\DMGoTravelll\sdd`, compatibilidad con contratos aprobados, sin ejecución ni cambios de planes previos.
- **Resultado:** [plan 009 v0.1](specs/009-administracion-reservas/plan.md) y [T009-01–T009-28](specs/009-administracion-reservas/tasks.md), todas pendientes, con cobertura de los 37 criterios de la spec v0.2 aprobada en DEC-172.
- **Evidencia técnica pública:** referencias oficiales PostgreSQL de fecha/hora, bloqueos e aislamiento consultadas el 2026-11-02. Timestamp de inicio de transacción no demuestra elegibilidad después de esperar un lock; reevaluar reloj/estado/versión bajo protección antes de aplicar.
- **Propuestas:** consultas con página 20 y máximo 100, motivo de 1–2.000 caracteres recortados, claves de operación/versión esperada, transacción local conjunta con inventario/caso/auditoría/intención y reembolso externo separado. Valores técnicos pendientes de validación, no políticas comerciales nuevas.
- **Límite:** no convertir cancelación en autorización financiera, modificar terminales/`pending` ni usar campos libres para editar historia; R-01–R-06 conservan contratos/pruebas/autorización antes de ejecución. 010 todavía no tiene plan propio.
- **Preservación:** todas las specs y planes/tasks anteriores, incluidos 002/003/004/005, intactos. Sin código, cambios reales de reserva/inventario/pago, envíos, configuración externa, commits ni push.
- **Destino:** plan/tasks de 009, matriz de cierre e índices, fuentes, aclaraciones, constitución y trazabilidad.

## DEC-179 - Planificación documental de 010 Clientes y auditoría

- **Fecha:** 2026-11-02.
- **Solicitud:** «continua» después de 009 y posterior instrucción de reanudar el trabajo interrumpido sin repetir lo ya completado.
- **Alcance comunicado:** plan/tasks de 010 en `Desktop\DMGoTravelll\sdd`, con historial inmutable, privacidad de bajas y CSV consistente, sin implementación o modificación de planes anteriores.
- **Resultado:** [plan 010 v0.1](specs/010-clientes-auditoria/plan.md) y [T010-01–T010-34](specs/010-clientes-auditoria/tasks.md), todas pendientes, con cobertura de los 59 criterios aprobados en DEC-169.
- **Evidencia pública:** documentación PostgreSQL de aislamiento/sincronización de snapshots, RFC 4180 y OWASP CSV Injection, consultada el 2026-11-02. Un snapshot exportado depende de su transacción viva; guardar fecha/ID no conserva datos para un worker futuro. Quoting RFC no basta para garantizar texto inerte en hojas de cálculo.
- **Propuestas técnicas:** captura materializada privada en admisión, generación completa con manifest y privacidad/autorización actuales antes de entrega; anexado transaccional/privilegios mínimos y retención indefinida separados de cleanup de copias temporales. Parámetros operativos son propuestas del plan, no máximos comerciales de filas.
- **Límite:** A-01–A-06 conservan pruebas de contratos, inmutabilidad, recuperación, snapshot/capacidad, CSV/privacidad y autorización. No se exportan datos, crean roles/infraestructura o ejecutan fuentes reales. 008/011/012 siguen fuera de esta ronda.
- **Preservación:** todas las specs y planes/tasks anteriores, incluidos 002/003/004/005/009, intactos; sin código, consultas de clientes reales, envíos, configuración externa, commits ni push.
- **Destino:** plan/tasks de 010, matriz de cierre, índices, fuentes, aclaraciones, constitución y trazabilidad. Queda planificada documentalmente la cadena aprobada de Pagos, no implementada ni habilitada para producción.

## DEC-180 - Datos editables del perfil de cliente

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿Qué datos podrá cambiar el cliente desde su perfil? La contraseña y la vinculación con Google seguirán gestionándose en 005 Identidad.».
- **Respuesta:** selección «También el correo».
- **Regla:** se permite actualizar nombre/teléfono y solicitar cambio de correo; el correo nuevo debe verificarse antes de utilizarse como identidad vigente para las funciones que exigen verificación.
- **Límite:** contraseña y Google conservan 005; no se añaden campos personales adicionales, edición de rol/estado ni cuentas ajenas.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-1–RF-12.

## DEC-181 - Cambio de correo efectivo después de verificar

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Cuando solicite cambiar su correo, ¿cuándo debe reemplazarse el correo actual?».
- **Respuesta:** selección «Tras verificar el nuevo».
- **Regla:** el correo vigente se conserva hasta confirmar el nuevo; durante la espera se mantienen acceso y funciones permitidas por el correo/verificación actuales. Al confirmar se aplica el cambio.
- **Límite:** no se invalida anticipadamente el correo actual ni se da por verificado el solicitado por enviarle una notificación. La unicidad de 005 se comprueba también al confirmar.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-10–RF-20.

## DEC-182 - Baja bloqueada por operaciones activas

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si el cliente tiene una reserva pendiente o confirmada, un pago en verificación o una devolución sin terminar, ¿puede dar de baja su cuenta?».
- **Respuesta:** selección «Esperar a resolverlo».
- **Regla:** rechazar baja mientras haya reservas `pending`/`confirmed`, pagos sin resolución o devoluciones abiertas, indicando al titular la operación propia pendiente.
- **Límite:** no cancelar, completar, liberar recursos ni devolver automáticamente para permitir la baja. Una cuenta administrativa sigue excluida conforme a HU-13; no se cambia 001/002/003/009.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-23–RF-33 y precisiones de concurrencia.

## DEC-183 - Cierre global de sesiones tras cambiar correo

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Una vez verificado y aplicado el nuevo correo, ¿qué debe pasar con las sesiones abiertas de esa cuenta?».
- **Respuesta:** selección «Cerrar todas».
- **Regla:** cerrar todas las sesiones, incluida la actual, al aplicar el correo verificado; el cliente debe entrar otra vez con el nuevo correo o su Google ya vinculado.
- **Límite:** no cambia el logout ordinario de 005, que revoca solo la sesión actual; no elimina vínculos Google ni duplica cuentas por un cambio de correo. Enlaces antiguos no permiten cambiar/recuperar después una identidad que ya cambió.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-16–RF-20.

## DEC-184 - Avisos de seguridad a ambas direcciones

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Cuando el cambio de correo se complete, ¿a quién debe enviarse un aviso de seguridad?».
- **Respuesta:** selección «A ambos correos».
- **Regla:** avisar al correo anterior y al nuevo de que el cambio terminó, sin contraseñas, tokens ni enlaces de acceso en esos avisos de finalización.
- **Límite:** la prueba de verificación previa es una entrega distinta destinada solo al correo solicitado. El contrato nuevo debe coordinarse con 004/005 sin modificar sus documentos aprobados ni interpretar una dirección histórica como destinatario válido para otros propósitos.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-11/RF-21/RF-22 y contrato de notificaciones.

## DEC-185 - Solo la última solicitud válida de correo

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si pide cambiar el correo otra vez antes de confirmar la solicitud anterior, ¿cuál debe quedar válida?».
- **Respuesta:** selección «Solo la última».
- **Regla:** una nueva solicitud válida admitida sustituye a la anterior e invalida su prueba; el correo actual permanece hasta confirmar la última vigente.
- **Límite:** datos inválidos no sustituyen una solicitud válida; repetir la misma operación no es una nueva intención. La baja invalida solicitudes pendientes y el correo vigente de la cuenta con baja lógica conserva la unicidad de 005.
- **Destino:** [008 v0.1](specs/008-perfil/spec.md), RF-13–RF-16/RF-29/RF-31/RF-36.

Las seis decisiones de Perfil se incorporan a 008 v0.1 como borrador con 37 criterios; **no equivalen a aprobación explícita del documento completo**. No se crean plan/tareas ni se altera ninguna spec o plan previo. 011 y 012 siguen pendientes de su propio proceso.

## DEC-186 - Aprobación explícita de 008 Perfil v0.1

- **Fecha:** 2026-11-02.
- **Pregunta:** «¿Apruebas 008 v0.1?».
- **Respuesta:** «si».
- **Regla:** se aprueba [008 v0.1](specs/008-perfil/spec.md) con sus 37 criterios, campos autorizados, correo diferido con verificación, cierre de sesiones/avisos y baja lógica bloqueada por operaciones activas.
- **Límite:** no cambia los criterios ni archivos aprobados de otras funcionalidades y no autoriza implementación, cuentas modificadas, correos reales, commits o push. La solicitud posterior de continuar se registra separadamente para planificación.
- **Destino:** sección de aprobación de 008 e índices, aclaraciones, fuentes, constitución y trazabilidad.

## DEC-187 - Continuación con plan y tareas documentales de 008

- **Fecha:** 2026-11-02.
- **Solicitud:** «continua», posterior a la respuesta «si» que aprobó 008 v0.1.
- **Alcance comunicado:** registrar aprobación y redactar plan/backlog exclusivamente en `Desktop\DMGoTravelll\sdd`, sin código, cuentas modificadas o envíos.
- **Resultado:** [plan 008 v0.1](specs/008-perfil/plan.md) y [T008-01–T008-30](specs/008-perfil/tasks.md), todas pendientes, con cobertura de los 37 criterios. La spec queda intacta después de registrar DEC-186.
- **Propuestas técnicas:** solicitud de correo de 30 minutos con prueba propia, identidad reciente, versiones de perfil/seguridad separadas, barrera por cuenta ante reserva/pago/baja y autorización por propósito de avisos a pendiente/anterior/nuevo. Parámetros y mecanismos pendientes de validación, no cambios de reglas comerciales.
- **Evidencia pública:** PostgreSQL de bloqueos/aislamiento y OWASP Authentication Cheat Sheet, consultadas el 2026-11-02. Una lectura vacía no protege de inserciones posteriores y los modos de lock tienen conflictos distintos; no copiar MFA/doble confirmación no aprobados de una recomendación externa.
- **Límite:** P-01–P-06 requieren contratos, consistencia, enlaces/avisos, estado financiero, privacidad/auditoría y autorización antes de ejecución. No se modifican planes existentes de 001/002/003/004/005/009/010 para aparentar compatibilidad.
- **Preservación:** criterios aprobados y todos los planes previos intactos; sin código, base modificada, cuentas/claves, configuración externa, correos reales, commits o push. 011/012 aún requieren specs.
- **Destino:** plan/tasks de 008, índices, matriz de cierre, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-188 - Alcance inicial de indicadores y desglose por oferta

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿Qué indicadores debe incluir 011 en esta primera versión?».
- **Respuesta:** selección «También por oferta».
- **Regla:** reservas por estado, importes cobrados, devoluciones ejecutadas y diferencia; añadir desglose por tour/paquete y alojamiento contratado y cantidad de viajeros reservados.
- **Límite:** no etiquetar diferencia como ganancia ni inventar asistencia/ocupación efectiva. 001 permite que solo parte del grupo se aloje, por lo que viajeros turísticos no equivalen automáticamente a huéspedes.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), definiciones y RF-10–RF-17/RF-23.

## DEC-189 - Todos los cobros reales, separados por moneda

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Para el importe cobrado, ¿contamos todo cobro real confirmado por el proveedor o solo el pago válido que confirmó una reserva?».
- **Respuesta:** selección «Todos los cobros reales».
- **Regla:** incluir transacciones reales confirmadas, también tardías/excedentes/observadas, cada una una sola vez e identificadas aparte; no mezclar ni convertir monedas.
- **Límite:** evento o intento repetido no es otro cobro; dos cobros distintos sí son dos movimientos. Marcas de incidencia superpuestas no se suman para duplicar el total. No habilita divisas/medios nuevos de pago.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), RF-18–RF-25 y bloque financiero.

## DEC-190 - Período por fechas propias de cada movimiento

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿Cómo debe interpretarse el período elegido para el reporte?».
- **Respuesta:** selección «Movimientos del período».
- **Regla:** reservas creadas en el período; cobros y devoluciones por sus propias fechas confirmadas, aunque pertenezcan a reservas de otro período.
- **Límite:** no filtrar los movimientos únicamente por creación de la reserva ni compensar una devolución de este período restándola de otro; la diferencia puede ser negativa. No se promete fecha de abono bancario.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), RF-5/RF-7/RF-10/RF-18/RF-22/RF-23 y ejemplos temporales.

## DEC-191 - Contratos por componente, dinero real separado

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «En el desglose de tour/paquete y alojamiento, ¿cómo quieres mostrar los importes? Recuerda que la reserva se paga en un solo cobro conjunto.».
- **Respuesta:** selección «Contrato por componente».
- **Regla:** mostrar precio histórico contratado del componente turístico y hotelero de reservas del período; cobros/devoluciones reales en resumen financiero aparte, sin repartirlos artificialmente entre componentes.
- **Límite:** no cobrar o contar el mismo total como ingreso de tour y hotel; datos de `pending`/`cancelled` son importes históricos, no entradas reales de dinero. No se recalcula con catálogo actual.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), RF-4/RF-15/RF-16/RF-27/RF-38.

## DEC-192 - PDF con resumen, desglose y listado de reservas

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿Qué nivel de detalle debe incluir el PDF del reporte?».
- **Respuesta:** selección «También listar reservas».
- **Regla:** conservar PDF de HU-19 con resumen/desglose y listado de reservas con número, fechas, estado e importe contratado; sin nombres, correos ni teléfonos de clientes.
- **Límite:** número de reserva permitido no autoriza ID/contactos de cliente, tarjeta/credenciales o una lista adicional de todos los movimientos individuales. PDF no se sustituye por el CSV de 010.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), RF-26/RF-28/RF-29 y detalle; ACL-23.

## DEC-193 - PDF de la consulta vista, sin recálculo silencioso

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si los datos cambian después de consultar los indicadores, ¿qué debe contener el PDF que descargue?».
- **Respuesta:** selección «Lo consultado».
- **Regla:** conservar resultados/filtros de esa consulta y su fecha de referencia; para incorporar cambios se necesita actualizar el reporte.
- **Límite:** no aceptar cifras del dispositivo como oficiales ni generar otra versión bajo la misma referencia si no se puede recuperar la original. Autorización actual sigue siendo requisito para entregar el documento.
- **Destino:** [011 v0.1](specs/011-reportes/spec.md), RF-9/RF-29–RF-34.

Las seis decisiones de Reportes se incorporan a 011 v0.1 como **borrador con 38 criterios**, pendiente de aprobación completa. Fechas Perú, selección por oferta/hotel, estados conocidos a referencia, categorías de incidencia no sumables y protección de datos son precisiones trazadas a las fuentes y al alcance elegido, no respuestas adicionales inventadas. No se crean plan/tareas; specs/planes previos intactos.

## DEC-194 - Lectura por enlace de foto ya publicada tras desactivación

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si una foto ya fue publicada y después se desactiva la oferta, hotel o categoría de movilidad, ¿puede seguir viéndola quien conserve su enlace?».
- **Respuesta:** selección «Sí, conserva acceso».
- **Regla:** una foto publicitaria ya publicada puede seguir siendo leída por su enlace conocido al desactivar el servicio mientras se conserve el archivo.
- **Límite:** no republica el servicio en el catálogo, habilita gestión anónima o expone borradores/documentos privados. No promete disponibilidad eterna, conservar archivos ya sin referencias por siempre ni borrar copias descargadas por terceros.
- **Destino:** [012 v0.1](specs/012-multimedia/spec.md), RF-9–RF-11/RF-29–RF-32 y precisiones de acceso/ciclo.

## DEC-195 - Principal elegida antes de quitar la actual

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si el administrador quiere quitar la imagen principal de una oferta u hotel activo y quedan otras fotos, ¿cómo debe elegirse la principal que la sustituya?».
- **Respuesta:** selección «Elegir antes de quitar».
- **Regla:** seleccionar otra foto válida como principal en la misma operación; si no se elige sustituta, conservar la principal actual. No asignar arbitrariamente otra foto.
- **Límite:** se conservan mínimo de imagen de activos, opcionalidad de fotos de habitación, única imagen de Movilidad, cantidades/formatos/5 MB y fallos ya aprobados. No se añade orden manual, galería de Movilidad o nueva facultad de desactivación automática.
- **Destino:** [012 v0.1](specs/012-multimedia/spec.md), RF-12–RF-20 y tabla de acuerdos heredados.

012 se redacta con 32 criterios tras dos preguntas relevantes; no se repiten decisiones de imágenes ya cerradas. Validación, control de borradores/referencias/auditoría y recuperación son precisiones trazadas a las fuentes, no respuestas nuevas inventadas. 011 v0.1 y 012 v0.1 **siguen pendientes de aprobación expresa**, sin plan/tareas. La indicación genérica de continuar no se registra como aprobación de 011.

## DEC-196 - Aprobación expresa de 011 Reportes v0.1

- **Fecha:** 2026-11-02.
- **Pregunta conjunta explícita:** «¿Apruebas expresamente ambas versiones para continuar con sus planes y tareas documentales?», después de enumerar 011 v0.1 (38 criterios) y 012 v0.1 (32).
- **Respuesta:** «si».
- **Regla:** se aprueba [011 v0.1](specs/011-reportes/spec.md) con sus 38 criterios, definiciones y PDF de la consulta vista.
- **Límite:** no cambia criterios de la spec ni autoriza consultas/exportaciones reales o implementación. La aprobación de 012 se registra por separado en DEC-197; la planificación posterior, en DEC-198.
- **Destino:** aprobación de 011, índices, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-197 - Aprobación expresa de 012 Multimedia v0.1

- **Fecha:** 2026-11-02.
- **Pregunta conjunta explícita:** «¿Apruebas expresamente ambas versiones para continuar con sus planes y tareas documentales?», después de enumerar 011 v0.1 (38 criterios) y 012 v0.1 (32).
- **Respuesta:** «si».
- **Regla:** se aprueba [012 v0.1](specs/012-multimedia/spec.md) con sus 32 criterios, acuerdos heredados, acceso posterior a desactivación y principal elegida antes de retirada.
- **Límite:** 006/007/013 y todos los planes previos permanecen intactos. No habilita R2, cargas/borrados reales, código, configuración o nuevas cuotas comerciales. Planificación posterior en DEC-199.
- **Destino:** aprobación de 012, índices, constitución, fuentes, aclaraciones y trazabilidad.

## DEC-198 - Planificación documental posterior de 011 Reportes

- **Fecha:** 2026-11-02.
- **Autorización:** misma respuesta «si» a aprobar 011 v0.1 y 012 v0.1 «para continuar con sus planes y tareas documentales»; aprobación de 011 registrada antes en DEC-196.
- **Entregables:** [plan 011 v0.1](specs/011-reportes/plan.md) y [T011-01–T011-28](specs/011-reportes/tasks.md), **28 tareas pendientes, ninguna ejecutada**, cobertura de 38 criterios.
- **Propuesta técnica:** copia consistente/durable de las tres poblaciones, fechas/importes oficiales, PDF desde el resultado visto y privado, integridad/multipágina y permisos actuales; disponibilidad temporal de 24 horas, paginación/concurrencia/lotes como parámetros a validar, no reglas comerciales.
- **Lectura pública:** PDFsharp/MigraDoc publica AGPL/comercial en versiones recientes; MIT de ejemplos no acredita la licencia de la biblioteca. Font resolver/fuentes redistribuibles y Linux deben verificarse. No se elige/instala una biblioteca ni se autoriza compra/publicación por esta lectura.
- **Puertas:** Q-01–Q-06 de contratos, captura/cálculo, privacidad, licencia/runtime, capacidad/recuperación y autorización siguen sin evidencia de ejecución.
- **Límite:** no modificar fuentes, 38 criterios o planes previos; sin consultas, PDF real, datos de clientes, código, infraestructura, commits ni push.

## DEC-199 - Planificación documental posterior de 012 Multimedia

- **Fecha:** 2026-11-02.
- **Autorización:** misma respuesta «si» a aprobar 011 v0.1 y 012 v0.1 «para continuar con sus planes y tareas documentales»; aprobación de 012 registrada antes en DEC-197.
- **Entregables:** [plan 012 v0.1](specs/012-multimedia/plan.md) y [T012-01–T012-30](specs/012-multimedia/tasks.md), **30 tareas pendientes, ninguna ejecutada**, cobertura de 32 criterios.
- **Propuesta técnica:** validación backend antes de R2, 5 MB propuestos como 5.000.000 bytes inclusivos por archivo, bucket privado/lectura backend con publicación histórica, asociación/auditoría local, claves inmutables, protocolo de referencias/fence y limpieza recuperable. Intervalo de 15 minutos y edad candidata de 24 horas son parámetros técnicos, no SLA de borrado ni cuotas comerciales.
- **Lectura pública:** consistencia/API/buckets de R2; un 404 de HEAD/GET no concluye una escritura en vuelo. No declarar eliminación final ni permitir otra asociación mientras permanezca incertidumbre sobre un PUT/DELETE anterior; la caducidad del lease no demuestra su resolución.
- **Puertas:** U-01–U-06 de admisión/runtime, acceso/proveedor, referencias/consistencia de consumidores, limpieza/recuperación, capacidad/seguridad y autorización siguen sin evidencia de ejecución.
- **Límite:** no cambia los 32 criterios o acuerdos/planes de 006/007/013, no añade retry de carga en UI de Movilidad o correo nuevo por inferencia. Sin cargas/borrados reales, credenciales/configuración, código, commits ni push.

## DEC-200 - Análisis documental transversal posterior a la planificación

- **Fecha:** 2026-11-02.
- **Continuidad:** «continua» después de entregar las aprobaciones/planes de 011/012. Se mantiene el alcance documental exclusivo de `sdd/`; no se interpreta como autorización de implementación o aprobación de nuevas reglas.
- **Entregable:** [análisis de consistencia v0.1](analisis-consistencia.md), inventario de 001–013 y 004-C y relaciones de bloqueo de sus planes.
- **Comprobación estructural:** 24 RF, 23 HU y 30 RN con entrada/destino en trazabilidad; 643 criterios locales de specs más 16 del complemento = 659; 386 tareas pendientes, cero ejecutadas. Antecedentes de acuerdos no se cuentan otra vez; 004 comparte backlog y 001 conserva 40 tareas con sus IDs originales.
- **Hallazgos:** AT-01–AT-13 en cuatro bloques: ambigüedades técnicas, contradicciones/tensiones textuales y de alcance, casos sin evidencia de integración y conflictos potenciales con restricciones/autorización. Se distinguen delimitaciones ya existentes de pruebas todavía pendientes; no se declara ausencia absoluta de contradicciones o equivalencia semántica por contar IDs.
- **Preservación:** specs, complementos, planes, tasks, acuerdos y plantilla intactos; la huella agregada se registra en el análisis y se coteja al cierre. No se cierra ninguna tarea/puerta por redacción ni se añade un backlog duplicado.
- **Límite:** análisis de documentos locales, no investigación nueva de proveedores, ejecución de tests, migraciones, seed, datos/clientes, correos, PDFs, cargas/borrados R2, infraestructura, commits o push. Las condiciones G/V/M/I/P/R/A/Q/U y las puertas de los planes iniciales siguen vigentes.

## DEC-201 - Propuesta documental de coordinación transaccional

- **Fecha:** 2026-11-02.
- **Continuidad:** «continua» después del análisis DEC-200 mantiene la preparación documental en `sdd/`; no ratifica nuevas decisiones técnicas o políticas ni autoriza código/operaciones.
- **Entregable:** [contrato de coordinación transaccional v0.1](contratos/coordinacion-transaccional.md), **propuesto, no ratificado ni implementado**. Ocho contratos lógicos CT-01–CT-08, 22 escenarios futuros ET-01–ET-22 y cuatro precisiones PT-01–PT-04.
- **Procedencia:** planes existentes 001/002/003/004/005/006/007/008/009/010 y hallazgos AT-07/AT-08; cuenta antes de familia/reserva/pago/recursos, barrera compartida/exclusiva, commit local, identidad de operación y recuperación. No se renumeran RF/HU/RN o tareas.
- **Límites funcionales preservados:** baja impide nuevas operaciones cliente, no el registro de un hecho externo posterior; recepción antes de 15 y validación antes de 20 siguen siendo hechos distintos de esperar un lock/cola. Una frontera de admisión/despacho no demostrada queda visible en PT-02, no se resuelve modificando el corte o dando prioridad por timestamp.
- **Evidencia pendiente:** esquema/participación real de todos los escritores, unicidades/orden/raíces de recursos, tiempos de recepción/decisión, APIs financieras y recuperación de base/cola. Ninguna puerta G/V/M/I/P/R/A se cierra por este contrato.
- **Reconsulta externa:** se intentó reconsultar documentación oficial PostgreSQL de bloqueos/aislamiento/reloj; la petición falló por DNS `ENOTFOUND`. No se obtuvo evidencia nueva ni se consultó una base o validó una versión/SDK. Referencias anteriores conservan su fecha/alcance.
- **Preservación:** 659 criterios, 386 tareas pendientes, specs/planes/tasks y análisis DEC-200 intactos. Sin SQL, migraciones, seed, tests de aplicación, dinero, correos, PDFs, imágenes, credenciales/configuración, commits ni push.

## DEC-202 - Propuesta de identidad, destinatarios y notificaciones

- **Fecha:** 2026-11-02.
- **Continuidad:** «continuemos con lo que sigue» después del contrato DEC-201 mantiene el alcance documental exclusivo de `sdd/`; no ratifica los contratos o autoriza implementación/envíos.
- **Entregable:** [identidad, destinatarios y notificaciones v0.1](contratos/identidad-destinatarios-notificaciones.md), **propuesto, no ratificado ni implementado**. DM-01–DM-05: cinco propósitos; CM-01–CM-08: ocho fronteras lógicas; EM-01–EM-20: escenarios no ejecutados; PM-01–PM-04: evidencia pendiente.
- **Procedencia:** AT-04/AT-05 del análisis; specs/planes 004/004-C/005/008/010 y coordinación propuesta DEC-201. La dirección autorizada depende de solicitud/hecho/propósito; los avisos históricos al anterior/nuevo de 008 no requieren que la dirección siga vigente ni crean un alias de acceso.
- **Límites de seguridad:** excepción de enlace solo al destinatario previsto, no token bruto/secretos en respuesta pública/jobs/logs/auditoría/admin; carga temporal protegida distinta de verificador y evidencia. Retry conserva contenido/clave, no renueva prueba; reenvío manual único conserva 004 y no admite otro envío automático de esa generación.
- **Concurrencia pendiente:** invalidación anterior a admisión impide enviar como vigente; un correo ya en vuelo/aceptado no se retira con rollback local. Consumo vuelve a validar y PM-03 conserva la precisión de admisión/despacho/invalidation/leases sin prometer atomicidad con SMTP.
- **Evidencia:** uso de documentos/fuentes previamente registrados, sin nuevas consultas externas. Runtime/criptografía, claves/retención/restauración, cliente de correo, SDK/Resend y recuperación real siguen sin verificar; M/I/P/A no se cierran por redacción.
- **Preservación:** 659 criterios, 386 tareas pendientes; specs/planes/tasks, análisis DEC-200 y contrato DEC-201 intactos. No nuevas tareas o reglas, código/SQL, cuentas/enlaces/correos reales, cambios DNS/credenciales/configuración, commits o push.

## DEC-203 - Propuesta de multimedia, publicación y referencias

- **Fecha:** 2026-11-02.
- **Continuidad:** «continua» durante el cierre documental de DEC-202 mantiene el alcance de `sdd/`; no se interpreta como ratificación de contratos o autorización de código/R2.
- **Entregable:** [multimedia, publicación y referencias v0.1](contratos/multimedia-publicacion-referencias.md), **propuesto, no ratificado ni implementado**. CA-01–CA-08: ocho contratos; RA-01–RA-03: tres clases de referencia; EA-01–EA-18: escenarios no ejecutados; PA-01–PA-04: evidencia pendiente.
- **Procedencia:** AT-06/AT-10 y planes/specs de 005/006/007/010/012/013. CA-04 conserva la visibilidad real de cada consumidor: activar no acredita por sí solo primera exposición de una oferta sin salidas reservables; no copiar esa condición a hotel sin disponibilidad que debe seguir visible.
- **Límites preservados:** borrador privado, enlace de foto publicada conservado mientras exista sin republicar metadata; principal elegida antes de retirada, opcionalidad de habitación, Movilidad una foto y cantidades sin nuevos topes. Registro de referencias vigente/histórico protege bytes; mención de auditoría no impone por sí sola retención eterna ni su limpieza borra auditoría.
- **Recuperación pendiente:** fence bloquea nuevas asociaciones, no demuestra borrado físico o privatiza una foto publicada conservada. PUT/DELETE desconocidos, lector no comprobable y 404 con escritura en vuelo no son evidencia de huérfano/borrado final. PA-01–PA-04 conservan pruebas de esquema, primera publicación, SDK/proveedor, runtime/seguridad/capacidad/autorización.
- **Evidencia:** fuentes locales y referencias R2 previamente registradas, sin nueva investigación externa o peticiones a objetos. U-01–U-06/ACL-13/ACL-17 siguen sin evidencia de cierre.
- **Preservación:** 659 criterios y 386 tareas pendientes; specs/planes/tasks y documentos DEC-200–DEC-202 intactos. Sin nuevas tareas/reglas/ADR, código/SQL, archivos reales cargados/borrados/consultados en R2, credenciales/configuración, commits o push.

## DEC-204 - Propuesta de consultas, exportación y privacidad

- **Fecha:** 2026-11-02.
- **Continuidad:** «continua» tras DEC-203 mantiene el alcance de documentación en `sdd/`; no ratifica contratos ni autoriza consultas/exportaciones reales o código.
- **Entregable:** [consultas, exportación y privacidad v0.1](contratos/consultas-exportacion-privacidad.md), **propuesto, no ratificado ni implementado**. DX-01–DX-03: tipos; CX-01–CX-08: ocho contratos; EX-01–EX-20: escenarios futuros; PX-01–PX-04: evidencia pendiente.
- **Procedencia:** AT-02/AT-09, specs/planes 010/011 con 005/008 y lectores históricos. CSV de clientes aplica baja actual conservando fila/ID/cantidad inicial; CSV de auditoría no se convierte en cliente o elimina historia; PDF conserva la consulta original sin identidad/contactos de cliente desde su proyección.
- **Consistencia:** captura CSV al admitir exportación frente a resultado oficial visto de 011; timestamp o snapshot huérfano no son copia durable. Referencia no recuperable falla sin otra vista bajo ID antiguo; información financiera usa fechas propias/monedas/identidades reales sin mezclar cohortes.
- **Seguridad/entrega:** lista positiva, CSV con texto inerte, PDF completo/multipágina y sin fuentes/recursos/metadata sensibles; permiso actual y variantes privadas antes de entrega. No URL pública/firmada como sustituto de autorización, filas truncadas como archivo completo o retiro de bytes ya entregados como garantía ficticia.
- **Evidencia pendiente:** PX-01–PX-04 y A/Q/I/P de lectores/snapshot, serializador/herramientas, licencia/runtime PDF, privacidad/rol actual, capacidad/recuperación/cleanup. Sin consultas externas nuevas o dependencia elegida/instalada; evidencias públicas previas conservan su alcance.
- **Preservación:** 659 criterios y 386 tareas pendientes; specs/planes/tasks y documentos DEC-200–DEC-203 intactos. Sin nuevas reglas/tareas/ADR, código/SQL, consultas de clientes/reservas/pagos reales, archivos CSV/PDF generados/descargados, credenciales/configuración, commits o push.

## DEC-205 - El titular puede solicitar otro enlace al vencer

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Si vence el enlace de verificación de correo, ¿qué podrá hacer el cliente?», con opciones solicitar otro desde su cuenta o contactar soporte sin autogestión.
- **Respuesta:** «solicita otro, dame opciones para solo clickear».
- **Regla:** añadir la acción del titular activo de una cuenta con correo no verificado de solicitar otro enlace desde su propia cuenta después del vencimiento.
- **Límite:** no verifica por pedirlo, cambia destinatario, desbloquea reserva/pago o crea una herramienta administrativa. Se conserva la preferencia de preguntas con opciones clicables, de una en una.
- **Destino:** [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md), RF-1/RF-3–RF-5/RF-12 y alcance. Es ampliación funcional, no aprobación de la spec completa.

## DEC-206 - Solicitar otro enlace también antes de vencer

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿El cliente podrá solicitar otro enlace de verificación aunque el anterior todavía no haya vencido?».
- **Respuesta:** selección «También antes».
- **Regla:** no exigir esperar al vencimiento; puede solicitar otro si no recibió/no encuentra el correo, sujeto a los controles vigentes de identidad/abuso.
- **Límite:** no fija duración, frecuencia, máximos, esperas o mensajes exactos; no son decisiones nuevas del usuario por inferencia.
- **Destino:** [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md), RF-2 y casos límite. Segunda respuesta, no aprobación completa.

## DEC-207 - Solo el último enlace de verificación admitido

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «Cuando el cliente solicite un enlace nuevo, ¿qué debe pasar con los enlaces de verificación anteriores?».
- **Respuesta:** selección «Solo el último».
- **Regla:** una solicitud nueva válida admitida sustituye/invalida sus enlaces de verificación anteriores; al abrir uno sustituido, indicar que use el más reciente.
- **Límite:** solicitud rechazada no sustituye y retry de entrega no crea otra intención. La entrega fallida posterior no restaura enlaces antiguos; no se promete retirar mensajes ya en vuelo ni trasladar «solo último» a todos los resets o a otro propósito. 008 mantiene su propio contrato.
- **Destino:** [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md), RF-6–RF-11 y precisiones/carreras. Tercera respuesta, no aprobación completa.

Entrevista cerrada con tres preguntas relevantes, sin agotar el máximo de seis ni preguntar de nuevo políticas aprobadas. 005-C v0.1 queda en **borrador con 18 criterios**, pendiente de aprobación expresa. Base 005 y todos los planes/tasks previos intactos; sin planificación nueva, código, cuentas/enlaces/correos reales, commits o push.

## DEC-208 - Aprobación expresa del complemento 005-C v0.1

- **Fecha de registro:** 2026-11-02.
- **Pregunta:** «¿Apruebas el complemento 005-C v0.1 completo, con sus 18 criterios para solicitar otro enlace de verificación?».
- **Respuesta:** selección «Aprobar complemento»; la opción explicita aprobación del documento completo, sin código/envíos reales y dejando planificación para después.
- **Regla:** aprobar [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md) con los 18 criterios presentados, sin modificaciones funcionales posteriores a la aprobación.
- **Límite:** no se deriva aprobación de las tres respuestas previas, no se editan base 005 o planes/tasks existentes, no se ratifican por referencia contratos técnicos propuestos ni se crean plan/tareas de la ampliación en este registro.
- **Inventario:** 659 criterios antes aprobados más 18 del complemento = **677 criterios aprobados**; 386 tareas pendientes, ninguna ejecutada. La ampliación requiere planificación posterior propia, sin declararla incluida en las 32 tareas originales de 005.
- **Destino:** registro de aprobación del complemento, índices, constitución, fuentes, aclaraciones y trazabilidad. Sin código, cuentas/enlaces/correos reales, configuración, commits o push.

## DEC-209 - Planificación documental propia de 005-C

- **Fecha de registro:** 2026-11-02.
- **Continuidad autorizada:** «continua ... ya no me preguntes que es lo que tienes que hacer» después de aprobar 005-C. Se continúa el proceso documental sin preguntar al usuario decisiones de procedimiento; no se interpreta como autorización de código/operaciones o aprobación automática de futuras reglas/specs.
- **Entregables:** [plan-reemision-verificacion.md v0.1](specs/005-identidad/plan-reemision-verificacion.md) y [T005V-01–T005V-16](specs/005-identidad/tasks-reemision-verificacion.md), todas pendientes. Planificación separada de la base 005 para conservar sus archivos aprobados/32 tareas.
- **Diseño propuesto:** generación de verificación compartida con emisor inicial/consumidores, cuenta y correo vigentes, uso único/TTL, operación idempotente, sustitución/intención/custodia/auditoría locales, transporte posterior y consumo que rechaza generaciones antiguas. Un replay anterior no vuelve a hacer actual su enlace ni una emisión fallida restaura anteriores.
- **Parámetros técnicos:** 24 horas de verificación como el plan base, prueba opaca de 32 bytes y límites iniciales de 3 nuevas admisiones por cuenta/hora y 10 por IP/hora, todos sujetos a verificación/calibración. No son políticas comerciales nuevas o cifras aprobadas individualmente por el usuario; TTL no procede de idempotencia Resend.
- **Puertas:** RV-01–RV-05 de compatibilidad inicial/consumidores, PostgreSQL/concurrencia, entrega/secretos/recuperación, calidad/abuso y autorización, pendientes de evidencia. Referencias públicas conservan su alcance previo; sin investigación externa nueva o prueba de cuenta/runtime/proveedor.
- **Inventario:** **677 criterios aprobados, 402 tareas pendientes**, ninguna ejecutada: las 386 anteriores más 16 propias. Criterios, base 005, todos los planes/tasks anteriores, análisis y propuestas intactos; las menciones «sin plan» al aprobar son antecedentes anteriores a este registro.
- **Límite:** solo `sdd/`, sin código/SQL, migraciones, cuentas/enlaces/correos reales, credenciales/configuración, commits o push. No se cierra tarea/puerta por redactar ni se ratifican contratos técnicos por referencia.

## DEC-210 - Recomendación de base técnica y estructura

- **Fecha de registro:** 2026-11-02.
- **Continuidad:** «continua» tras planificación de 005-C mantiene el proceso documental directo, sin pedir decisiones de procedimiento o inferir autorización de código/proveedores.
- **Entregable:** [base técnica v0.1](diseno/base-tecnica.md), **recomendación no ratificada ni implementada**, para ACL-18/ACL-19 y condiciones transversales existentes. No nueva spec/ADR aceptada, plan duplicado o backlog adicional.
- **Estructura propuesta:** cuatro proyectos `DMGoTravel.Domain/Application/Infrastructure/Api`; Presentation dentro de Api y composición aislada por reglas/pruebas de arquitectura. Módulos/capacidades en el mismo monolito, sin bases/despliegues nuevos, repositorios ajenos o HTTP interno.
- **Plataforma candidata:** .NET/ASP.NET Core 10 LTS, EF Core/Npgsql provider 10, FluentValidation 12; Node 24 LTS/Vite 8 para frontend React/TypeScript con versiones exactas compatibles por fijar. No preview como baseline, paquetes flotantes o copia del ejemplo antiguo `net8.0` de Npgsql.
- **Evidencia pública:** política Microsoft confirma fin .NET 10 el 2028-11-14 y .NET 8/9 el 2026-11-10; notas Npgsql 10 publicadas y FV12 compatible .NET 10. Node 24 y 26 constan LTS; Vite documenta sus mínimos/template. MediatR README documenta clave/gestión de licencia, sin acreditar términos completos/eligibilidad de una versión concreta. No instalar/comprar/silenciar avisos como cumplimiento.
- **Errores y recuperación de lectura:** primera petición a Npgsql 10 y guía FV12 fallaron por transporte; luego se obtuvieron notas Npgsql y página principal FluentValidation. No se da por leída la guía fallida, ni por ejecutados ejemplos/restores/builds.
- **Puertas:** BT-01–BT-04 de estructura/arquitectura, compatibilidad/licencias, persistencia/host/configuración y autorización/evidencia. ACL-18 tiene recomendación concreta, no cierre; conservar FluentValidation evita una sustitución no autorizada de ACL-19 sin borrar la alternativa original.
- **Preservación:** 677 criterios aprobados y 402 tareas pendientes, ninguna ejecutada. Todos los documentos de specs/planes/tasks, análisis y contratos anteriores intactos; sin scaffolding, paquetes, código, migraciones, cuentas/DNS/secretos, operaciones reales, commits o push.

## DEC-211 - Modelo de datos lógico del núcleo transaccional

- **Fecha de registro:** 2026-11-03.
- **Continuidad:** «listo, continuemos» y «continua» tras la base técnica mantienen el proceso documental directo; no se interpretan como autorización de código, DDL, migraciones o proveedores.
- **Entregable:** [modelo de datos v0.1](diseno/modelo-datos.md), **propuesta no ratificada ni implementada**, que traduce las specs aprobadas a registros lógicos, restricciones, relaciones, estados, índices, orden de bloqueo y retención. No nueva spec, criterio, tarea, ADR o contrato ratificado.
- **Cobertura:** identidad/acceso (cuenta, roles, Google, familias/refresh, solicitudes y 005-C, perfil, cambio de correo, baja, idempotencia), catálogo (oferta, itinerario, salida, precios, imágenes), hoteles (hotel, servicios, tipos, inventario por noche, propuestas), reservas (raíz, snapshots, compromisos, liberaciones, historial, operaciones), pagos/devoluciones, vencimiento, auditoría y referencias mínimas de notificaciones, exportaciones, multimedia y movilidad.
- **Decisiones técnicas propuestas:** clave interna `bigint` más identificador público `uuid`; `timestamptz` UTC y `date` para noches; `numeric(14,2)` PEN; `row_version`; índices únicos parciales; contadores de capacidad más libro de compromisos; snapshots inmutables; unicidad de intento activo, pago externo y caso de devolución; deduplicación de hechos/entregas/auditoría; captura materializada de exportaciones; activo/referencias de multimedia.
- **Estados:** reserva solo `pending`/`confirmed`/`completed`/`cancelled`; no se añaden `expired` o `processing`. Los estados de pago, devolución, entrega, cambio de correo y exportación son técnicos y no alteran los comerciales.
- **Concurrencia:** orden propuesto cuenta/elegibilidad → familia/solicitud → reserva → pago/caso → compromisos → auditoría → intención de notificación; `READ COMMITTED` con bloqueos/actualizaciones condicionales y `REPEATABLE READ` para capturas. Debe probarse en PostgreSQL real; no se declara cerrado.
- **Puertas:** MD-01–MD-08 de nombres/tipos, PostgreSQL real, concurrencia, inventario, pagos/devoluciones, auditoría, exportaciones y retención/baja. Se suman a BT-01–BT-04, RV-01–RV-05 y las puertas específicas; no se cierran por redactar.
- **Preservación:** 677 criterios aprobados y 402 tareas pendientes, ninguna ejecutada. Specs, planes/tasks, análisis y contratos anteriores intactos; sin código, SQL, migraciones, datos/cuentas/proveedores reales, configuración, commits o push.

## DEC-212 - Contrato de API propuesto

- **Fecha de registro:** 2026-11-03.
- **Continuidad:** «continua» tras el modelo de datos mantiene el proceso documental directo; no se interpreta como autorización de código, endpoints desplegados, OpenAPI generado o proveedores.
- **Entregable:** [contrato de API v0.1](diseno/contrato-api.md), **propuesta no ratificada ni implementada**, derivada de rutas/condiciones ya propuestas en los planes y del modelo de datos. No nueva spec, criterio, tarea, ADR o contrato de proveedor verificado.
- **Cobertura:** identidad/acceso y perfil (005/005-C/008), catálogo/hoteles/movilidad públicos y administrativos (006/007/013), reservas propias (001), pagos/webhooks/devoluciones (002), vencimiento (003), notificaciones (004), administración de reservas/clientes/auditoría/reportes (009/010/011) y lectura de multimedia (012).
- **Convenciones propuestas:** `/api/v1`, HTTPS, JSON UTF-8 y ProblemDetails; access JWT en memoria, refresh en cookie `HttpOnly`/`Secure`/host-only con CSRF; roles `anonymous`/`client`/`admin`; `uuid` público; dinero como cadena decimal PEN; fechas Perú/UTC; paginación 1-based con máximos por módulo; `Idempotency-Key`, `ETag`/`If-Match` y `409 stale_version`; recurso ajeno = `404`; archivos JPG/PNG/WebP de 5 MB; `429` con `Retry-After`.
- **Errores:** catálogo estable de códigos y estados HTTP, con mensajes aprobados conservados; sin tokens, PAN/CVV, enlaces, SQL, stack traces ni datos de otras cuentas. Un webhook Culqi/Resend no usa JWT de cliente y solo acusa éxito tras recepción durable.
- **Frontera:** confirmar pago, cancelar por vencimiento, liberar inventario, auditar y crear intención de notificación son puertos internos, no rutas públicas. El vencimiento no expone una ruta administrativa dedicada; su evidencia se consulta mediante 010/004. No se expone una transición libre `pending → confirmed` ni edición de estado/importe/propietario.
- **Puertas:** API-01-API-08 de OpenAPI/versionado, autenticación/transporte, errores, idempotencia/concurrencia, paginación/tiempo/dinero, proveedores, archivos/media y exportaciones/PDF. Se suman a BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las puertas específicas; no se cierran por redactar.
- **Preservación:** 677 criterios aprobados y 402 tareas pendientes, ninguna ejecutada. Specs, planes/tasks, análisis y contratos anteriores intactos; sin código, OpenAPI generado, endpoints desplegados, datos/cuentas/proveedores reales, configuración, commits o push.

## DEC-213 - Validación documental del contrato de API

- **Fecha de registro:** 2026-11-03.
- **Continuidad:** «que sigue? continua» después de DEC-212 mantiene el proceso documental; se revisa el contrato antes de proponer OpenAPI o implementación. No se interpreta como autorización de código, endpoints, OpenAPI, migraciones o proveedores.
- **Entregable:** [validación del contrato de API v0.1](diseno/validacion-contrato-api.md), **análisis documental no ratificado**, que contrasta operaciones, permisos, estados, errores, paginación, idempotencia y transiciones con 001–013/004-C/005-C, sus planes, el modelo de datos y los contratos propuestos. No nueva spec, criterio, tarea, ADR o contrato de proveedor verificado.
- **Resultado:** no se encontró una capacidad pública o administrativa aprobada sin ruta o puerto interno identificado. Confirmar pago, vencer/liberar inventario, auditar y crear intención de notificación siguen siendo puertos internos; 003 no recibe una ruta administrativa dedicada.
- **Hallazgos corregidos en DEC-212:** VA-01 ruta de vencimiento eliminada; VA-02 `verifying` retirado como estado técnico; VA-03 `Idempotency-Key` en cabecera; VA-04 duplicados de nombre solo al activar; VA-05 última imagen protegida; VA-06 lectura de media publicada tras desactivar; VA-07 `410` solo para artefactos; VA-08 reglas 005-C/008; VA-09 reglas 002; VA-10 taxonomía 006 aclarada. VA-11/VA-12 confirman que no se añadieron superficies, criterios ni tareas.
- **Puertas:** API-01–API-08 siguen abiertas (OpenAPI/versionado, transporte/CSRF/CORS, errores, concurrencia, paginación/tiempo/dinero, proveedores, archivos/media y exportaciones/PDF), junto con BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las puertas específicas. La revisión no cierra ninguna.
- **Preservación:** **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada; 63 archivos Markdown, 1.074 enlaces locales y 0 rotos, 213 registros DEC únicos y 0 tablas inconsistentes. Specs, planes/tasks, análisis y contratos anteriores intactos; sin código, OpenAPI generado, endpoints desplegados, datos/cuentas/proveedores reales, configuración, commits o push.

## DEC-214 - Plan de ratificación API-01

- **Fecha de registro:** 2026-11-03.
- **Continuidad:** «CONTINUAR» después de responder que la API REST está especificada pero no implementada; se avanza con el plan de API-01, no con la implementación. No se interpreta como autorización de código, endpoints, OpenAPI generado, migraciones o proveedores.
- **Entregable:** [plan-api-01.md v0.1](diseno/plan-api-01.md), **plan documental no ejecutado**, que fija fuente/versión OpenAPI 3.1, ubicación candidata, convenciones de autoría, inventario de operaciones, matriz CT-01–CT-12 y evidencia necesaria para cerrar API-01.
- **Decisiones propuestas:** OpenAPI 3.1.0; archivo `sdd/diseno/openapi/dmgo-api-v1.yaml`; versión `0.1.0-draft` hasta ratificar; `/api/v1` como versión mayor; `operationId` `modulo.accion`; seguridad bearer/refresh/cookie/CSRF; ProblemDetails; dinero decimal PEN; fechas UTC/peruanas según contrato; ejemplos ficticios.
- **Frontera:** el plan no crea OpenAPI, YAML, handlers, pruebas ejecutables o endpoints. El contrato textual sigue siendo la referencia de diseño; API-01 permanece abierta hasta OpenAPI revisado y CT-02–CT-12 ejecutadas con evidencia.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. La creación del borrador OpenAPI requiere autorización explícita por ser la fuente normativa candidata.
- **Preservación:** **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada; 64 archivos Markdown, 1.091 enlaces locales y 0 rotos, 214 registros DEC únicos y 0 tablas inconsistentes. Specs, planes/tasks, análisis y contratos anteriores intactos; sin código, OpenAPI generado, endpoints desplegados, datos/cuentas/proveedores reales, configuración, commits o push.

## DEC-215 - Borrador OpenAPI 3.1 no normativo

- **Fecha de registro:** 2026-11-03.
- **Continuidad:** «continua» después de DEC-214 se interpreta como autorización limitada a crear el borrador documental OpenAPI; no autoriza código, handlers, endpoints desplegados, migraciones, proveedores ni operaciones reales. La autorización explícita exigida por DEC-214 se agota en este artefacto no normativo.
- **Entregable:** [dmgo-api-v1.yaml v0.1.0-draft](diseno/openapi/dmgo-api-v1.yaml), OpenAPI 3.1.0 con 82 rutas, 92 operaciones, 88 esquemas y 120 referencias únicas; `info.x-status: draft-not-normative` y `info.x-dec: DEC-215`.
- **Cobertura:** autenticación/perfil, catálogo/hoteles/movilidad públicos y administrativos, reservas propias y administrativas, pagos/devoluciones, clientes/auditoría/exportaciones, reportes, notificaciones y media. No incluye rutas de vencimiento, confirmación de pago, liberación de inventario, auditoría o intención de notificación: siguen siendo puertos internos.
- **Validación documental:** YAML parseado sin claves duplicadas; 120 referencias resueltas y 0 rotas; 92 `operationId` únicos; parámetros de ruta alineados; etiquetas y esquemas de seguridad conocidos; validación OpenAPI 3.1 con `openapi-spec-validator` superada. No se ejecutaron CT-02–CT-12, no hay ejemplos ficticios validados y no se probó ningún endpoint.
- **Pendientes visibles:** cookie/CSRF y topología (API-02); errores, concurrencia, paginación, tiempo y dinero (API-03–API-05); firma y campos Culqi/Resend (API-06); archivos/media (API-07); exportaciones/PDF (API-08). Los campos de proveedor no confirmados quedan marcados `x-pending-provider-contract`; el contrato textual sigue siendo la referencia de diseño.
- **Frontera:** no se generaron handlers, controladores, código, migraciones, configuración, datos/cuentas/proveedores reales, commits o push. API-01 no se cierra por tener YAML; requiere revisión, ejemplos y CT-02–CT-12 con evidencia.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. 677 criterios aprobados y 402 tareas pendientes, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 64 archivos Markdown, 1 OpenAPI YAML, 1.104 enlaces locales y 0 rotos, 215 registros DEC únicos y 0 tablas inconsistentes.

## DEC-216 - Matriz de cierre del diseño técnico

- **Fecha de registro:** 2026-11-04.
- **Continuidad:** «continuemos con el cierre del diseño tecnico» se interpreta como autorización para continuar la documentación de cierre técnico, no para implementar. No autoriza código, SQL, migraciones, endpoints desplegados, cuentas, correos, pagos, imágenes, exportaciones, proveedores, configuración, commits ni push.
- **Entregable:** [cierre-diseno-tecnico.md v0.1](diseno/cierre-diseno-tecnico.md), matriz documental que ordena el cierre del diseño técnico y clasifica cada puerta por evidencia, bloqueo y próximo artefacto.
- **Contenido:** criterio de cierre; estado de partida; matrices API-01–API-08, BT-01–BT-04, MD-01–MD-08 y RV-01–RV-05; puertas específicas PT/PM/PA/PX/G/A/Q/U; actividades cerrables documentalmente; límites que exigen runtime, proveedor o autorización; decisiones que no se deben inventar; ruta de cierre y criterio de salida.
- **Resultado:** no se declara cerrada ninguna puerta que exija prueba real. API-01 sigue parcial (OpenAPI validado, sin revisión, ejemplos ni CT-02–CT-12); API-03/04/05 tienen diseño propuesto y pruebas pendientes; BT-01/MD-01/MD-08 requieren ratificación o decisión; API-02/06/07/08, BT-02/BT-03, MD-02–MD-07 y RV-01–RV-04 dependen de runtime, proveedor o entorno.
- **Frontera:** la matriz no crea handlers, código, SQL, migraciones, configuración, datos o proveedores; no ratifica la base técnica, el modelo de datos, el contrato de API ni el OpenAPI. El contrato textual sigue siendo la referencia de diseño.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 65 archivos Markdown, 1 OpenAPI YAML, 1.126 enlaces locales y 0 rotos, 216 registros DEC únicos y 0 tablas inconsistentes.

## DEC-217 - Revisión del borrador OpenAPI

- **Fecha de registro:** 2026-11-04.
- **Continuidad:** «continua» después de DEC-216 se interpreta como autorización para continuar la revisión documental del OpenAPI y añadir ejemplos ficticios; no autoriza código, handlers, endpoints, SQL, migraciones, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [revision-openapi.md v0.1](diseno/revision-openapi.md), revisión documental del borrador OpenAPI contra el contrato, con inventario, seguridad, errores, idempotencia, concurrencia, paginación, tiempo, dinero y ejemplos.
- **CT-01:** superado documentalmente. El contrato aporta 86 pares método/ruta (incluida la expansión activar/desactivar de hoteles) y 6 operaciones de imágenes de hotel/tipo; el YAML contiene 82 rutas y 92 operaciones, sin faltantes ni sobrantes. Los 92 `operationId` son únicos y los parámetros de ruta están alineados tras resolver `$ref`.
- **Ejemplos:** se añadieron 8 ejemplos ficticios en 7 esquemas (`ProblemDetails` ×2, `PageMeta`, `AuthSession`, `Reservation`, `PaymentAttempt`, `WebhookAccepted`, `ImageAsset`). La validación JSON Schema 2020-12 dio 0 fallos. Se incorporaron los ejemplos del contrato §16. CT-12 sigue parcial: faltan ejemplos por operación y validación contra harness/implementación.
- **Estructura:** YAML parseado sin claves duplicadas; 88 esquemas, 120 referencias únicas y 0 rotas; 92 operaciones; 17 operaciones públicas; 22 con `Idempotency-Key`; 21 con `If-Match`; 15 respuestas con `ETag`. La validación OpenAPI 3.1 previa de DEC-215 se conserva; en esta pasada no se ejecutó un cliente externo.
- **Hallazgos:** RO-01/RO-02 superados documentalmente; RO-03 parcial; RO-04–RO-10 abiertos por API-02–API-08 y por la política de versión/propietario/deprecación.
- **Frontera:** API-01 sigue abierta. No se ejecutaron CT-02–CT-12, no se probó ningún endpoint y no se ratificó el OpenAPI. El contrato textual sigue siendo la referencia de diseño.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 66 archivos Markdown, 1 OpenAPI YAML, 1.142 enlaces locales y 0 rotos, 217 registros DEC únicos y 0 tablas inconsistentes.

## DEC-218 - Matriz de operaciones del OpenAPI

- **Fecha de registro:** 2026-11-04.
- **Continuidad:** «continua» después de DEC-217 se interpreta como autorización para continuar la revisión documental operación por operación; no autoriza código, handlers, endpoints, SQL, migraciones, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [matriz-operaciones-openapi.md v0.1](diseno/matriz-operaciones-openapi.md), con las 92 operaciones agrupadas por sección del contrato y columnas de tag, método/ruta, seguridad, `Idempotency-Key`, `If-Match`, códigos de éxito y errores.
- **Cobertura:** 92 operaciones; 17 públicas o de firma; 22 con `Idempotency-Key`; 21 con `If-Match`; 92 con éxito `2xx`/`3xx`; 90 con errores `4xx`/`5xx` declarados. Las 92 tienen `operationId`, tag y sección.
- **Hallazgos:** MO-01–MO-03 superados documentalmente; MO-04 parcial; MO-05–MO-10 abiertos por CT-12, API-02–API-08 y las pruebas de contrato.
- **Frontera:** la matriz no ejecuta peticiones, no valida respuestas reales, no añade ejemplos por operación y no ratifica el OpenAPI. API-01 sigue abierta; CT-02–CT-12 no se ejecutaron.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 67 archivos Markdown, 1 OpenAPI YAML, 1.160 enlaces locales y 0 rotos, 218 registros DEC únicos y 0 tablas inconsistentes.

## DEC-219 - Política de versión, propiedad y deprecación

- **Fecha de registro:** 2026-11-04.
- **Continuidad:** «continua» después de DEC-218 se interpreta como autorización para proponer la política documental de versión, propiedad y deprecación; no autoriza código, handlers, endpoints, SQL, migraciones, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [politica-versionado-api.md v0.1](diseno/politica-versionado-api.md), propuesta no ratificada con propietario/revisores por rol, SemVer, prefijo `/api/v1`, clasificación de cambios, ventana de deprecación, proceso de cambio y pruebas de compatibilidad.
- **Versión:** el borrador sigue en `0.1.0-draft`; la ratificación de API-01 propone `1.0.0`, sin fecha. Un cambio incompatible exige `/api/v2`.
- **Deprecación:** se propone una ventana de **90 días naturales** para la API pública, con excepción documentada por seguridad. La ventana no está ratificada y no se aplica retroactivamente.
- **Pendientes:** PV-01 propietario/revisores, PV-02 ventana, PV-03 canal/changelog, PV-04 fecha de `1.0.0`, PV-05 cabeceras `Sunset`/`Deprecation` y PV-06 CT-02–CT-12.
- **Frontera:** no cambia el contrato, no ratifica el OpenAPI, no cierra API-01 y no crea código o endpoints.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 68 archivos Markdown, 1 OpenAPI YAML, 1.177 enlaces locales y 0 rotos, 219 registros DEC únicos y 0 tablas inconsistentes.

## DEC-220 - Decisiones transversales de API

- **Fecha de registro:** 2026-11-04.
- **Continuidad:** «continua» después de DEC-219 se interpreta como autorización para proponer decisiones documentales de errores, idempotencia/concurrencia y paginación/tiempo/dinero; no autoriza código, handlers, endpoints, SQL, migraciones, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [decisiones-transversales-api.md v0.1](diseno/decisiones-transversales-api.md), propuesta no ratificada para API-03/API-04/API-05.
- **API-03:** `ProblemDetails` único, `code` estable, recurso ajeno = `404`, `stale_version` = `409`, sin 412/422 nuevos y sin fugas. `traceId` queda parcial.
- **API-04:** `Idempotency-Key` opaca, replay y `409 idempotency_conflict`; `ETag`/`If-Match` para ediciones/transiciones y `409 stale_version`. Formato, retención, concurrencia y `If-Match: *` siguen pendientes.
- **API-05:** paginación 1-based, máximos por módulo, página vacía `200`, fechas UTC/Perú y dinero decimal PEN. Default de `pageSize`, error de `pageSize`, orden estable y redondeo siguen pendientes.
- **Frontera:** no cambia el contrato, no ratifica el OpenAPI, no cierra API-03/API-04/API-05 y no ejecuta CT-02–CT-12.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 69 archivos Markdown, 1 OpenAPI YAML, 1.194 enlaces locales y 0 rotos, 220 registros DEC únicos y 0 tablas inconsistentes.

## DEC-221 - Plan de pruebas de contrato CT-02 a CT-12

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-220 se interpreta como autorización para detallar el plan documental de pruebas de contrato; no autoriza crear harness, código, handlers, endpoints, SQL, migraciones, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [plan-pruebas-contrato.md v0.1](diseno/plan-pruebas-contrato.md), propuesta no ratificada para CT-02–CT-12.
- **Cobertura:** CT-02 seguridad, CT-03 éxito, CT-04 errores, CT-05 idempotencia, CT-06 concurrencia, CT-07 paginación/filtros/tiempo/dinero, CT-08 archivos, CT-09 webhooks, CT-10 exportaciones/PDF, CT-11 privacidad y CT-12 ejemplos.
- **Método:** casos mínimos, evidencia saneada, estados PASS/FAIL/BLOCKED/NOT RUN y fases A–D. La ausencia de evidencia no equivale a aprobación.
- **Pendientes:** PT-01 entorno/propietario, PT-02 identidades/datos, PT-03 stubs/sandbox, PT-04 evidencia, PT-05 excepciones y PT-06 automatización.
- **Frontera:** no ejecuta pruebas, no crea harness y no cierra API-01. CT-02–CT-12 siguen sin ejecutar; CT-12 sigue parcial.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 70 archivos Markdown, 1 OpenAPI YAML, 1.216 enlaces locales y 0 rotos, 221 registros DEC únicos y 0 tablas inconsistentes.

## DEC-222 - Plan de ratificación BT-01

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-221 se interpreta como autorización para detallar el plan documental de BT-01; no autoriza crear solución, proyectos, carpetas, paquetes, código, pruebas ejecutables, pipelines, SQL, migraciones, configuración, commits ni push.
- **Entregable:** [plan-bt-01.md v0.1](diseno/plan-bt-01.md), propuesta no ratificada para estructura y aislamiento.
- **Estructura:** cuatro proyectos de producción (`Domain`, `Application`, `Infrastructure`, `Api`), un solo host backend, tests separados y `frontend/` sin backend Node/BFF/SSR.
- **Dependencias:** `Domain` sin dependencias; `Application` → `Domain`; `Infrastructure` → `Application`/`Domain`; `Api` → `Application`/`Infrastructure` solo para composición; endpoints sin DbContext/repositorios/SDK.
- **Comprobaciones:** BT-01-A01–BT-01-A10 con evidencia de referencias, namespaces, ciclos, frontera de endpoints, módulos y frontend.
- **Frontera:** no crea código, solución o pruebas; BT-01 sigue abierta y BT-02–BT-04, MD/RV/API siguen abiertas.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 71 archivos Markdown, 1 OpenAPI YAML, 1.232 enlaces locales y 0 rotos, 222 registros DEC únicos y 0 tablas inconsistentes.

## DEC-223 - Plan de ratificación MD-01 y MD-08

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-222 se interpreta como autorización para detallar el plan documental de MD-01/MD-08; no autoriza SQL, migraciones, tablas, índices, funciones, datos, código, pruebas ejecutables, configuración, commits ni push.
- **Entregable:** [plan-md-01-md-08.md v0.1](diseno/plan-md-01-md-08.md), propuesta no ratificada para esquema físico y retención.
- **MD-01:** convención `snake_case` singular, PK `bigint identity`, `public_id` uuid, `reservationNumber` separado, `timestamptz`/`date`, `numeric(14,2)` PEN, enums aprobados, `row_version` y baja lógica. Comprobaciones MD-01-C01–C08.
- **MD-08:** baja lógica, snapshots inmutables, auditoría/finanzas conservadas, artefactos vencidos no reutilizados, limpieza multimedia tras cero referencias. Ventanas MD-08-W01–W07 pendientes; comprobaciones MD-08-R01–R08.
- **Frontera:** no crea SQL/migraciones ni cierra MD-01/MD-08; MD-02–MD-07 y el resto de puertas siguen abiertas.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 72 archivos Markdown, 1 OpenAPI YAML, 1.247 enlaces locales y 0 rotos, 223 registros DEC únicos y 0 tablas inconsistentes.

## DEC-224 - Paquete de ratificación documental

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-223 se interpreta como autorización para preparar el paquete documental de ratificación; no ratifica ninguna propuesta y no autoriza código, SQL, migraciones, endpoints, handlers, harness, proveedores, datos reales, configuración, commits ni push.
- **Entregable:** [paquete-ratificacion.md v0.1](diseno/paquete-ratificacion.md), que reúne DEC-219–DEC-223.
- **Alcance:** qué se solicita ratificar, qué queda fuera, orden recomendado, registro futuro y límites de una ratificación.
- **Ratificación parcial:** permite aprobar por separado API transversal, política de API, estructura, MD-01, MD-08 y plan de pruebas; una aprobación no arrastra las demás.
- **Estado:** ninguna propuesta ratificada; PV-01–PV-06, DT-06/09/12, PT-01–PT-06, BT-01-A01–A10 y MD-08-W01–W07 siguen pendientes.
- **Frontera:** no cierra API-01, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 ni CT-02–CT-12; no crea solución, código, pruebas ejecutables o entorno.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 73 archivos Markdown, 1 OpenAPI YAML, 1.263 enlaces locales y 0 rotos, 224 registros DEC únicos y 0 tablas inconsistentes.

## DEC-225 - Ejemplos OpenAPI del lote A

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-224 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-a.md v0.1](diseno/ejemplos-lote-a.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `auth.register`, `auth.login`, `profile.get` y `profile.update`; 7 bloques de ejemplo (3 solicitud, 4 respuesta) en 4 operaciones.
- **Validación:** YAML parseado, ejemplos de solicitud/respuesta contra JSON Schema con 0 fallos, datos ficticios sin PII/tokens reales.
- **Frontera:** no añade ejemplos de error por operación ni cubre las 88 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 74 archivos Markdown, 1 OpenAPI YAML, 1.280 enlaces locales y 0 rotos, 225 registros DEC únicos y 0 tablas inconsistentes.

## DEC-226 - Ejemplos OpenAPI del lote B

- **Fecha de registro:** 2026-11-05.
- **Continuidad:** «continua» después de DEC-225 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-b.md v0.1](diseno/ejemplos-lote-b.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `catalog.list`, `catalog.get`, `hotels.list`, `hotels.get`, `hotels.lodgingByDeparture` y `mobility.list`; 6 bloques de respuesta.
- **Acumulado:** 13 bloques de ejemplo en 10 operaciones (lotes A y B).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, fechas ISO 8601 citadas y datos ficticios.
- **Frontera:** no añade errores por operación ni cubre las 82 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 75 archivos Markdown, 1 OpenAPI YAML, 1.299 enlaces locales y 0 rotos, 226 registros DEC únicos y 0 tablas inconsistentes.

## DEC-227 - Ejemplos OpenAPI del lote C

- **Fecha de registro:** 2026-11-06.
- **Continuidad:** «continua» después de DEC-226 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-c.md v0.1](diseno/ejemplos-lote-c.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `reservations.create`, `reservations.list`, `reservations.get`, `reservations.cancel`, `payments.start` y `payments.get`; 9 bloques (3 solicitud, 6 respuesta).
- **Acumulado:** 22 bloques de ejemplo en 16 operaciones (lotes A, B y C).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, fechas ISO 8601 citadas, datos ficticios y `providerData` sin PAN/CVV/tokens.
- **Frontera:** no añade errores por operación ni cubre las 76 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 76 archivos Markdown, 1 OpenAPI YAML, 1.319 enlaces locales y 0 rotos, 227 registros DEC únicos y 0 tablas inconsistentes.


## DEC-228 - Ejemplos OpenAPI del lote D

- **Fecha de registro:** 2026-11-06.
- **Continuidad:** «continua» después de DEC-227 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, devoluciones, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-d.md v0.1](diseno/ejemplos-lote-d.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.reservations.list`, `admin.reservations.get`, `admin.reservations.cancel`, `admin.reservations.complete`, `admin.refundCases.list`, `admin.refundCases.get`, `admin.refundCases.authorize` y `admin.refundCases.retry`; 11 bloques (3 solicitud, 8 respuesta).
- **Acumulado:** 33 bloques de ejemplo en 24 operaciones (lotes A, B, C y D).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12, estados de devolución alineados con el modelo de datos y datos sin PII/tokens reales.
- **Frontera:** no añade errores por operación ni cubre las 68 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 77 archivos Markdown, 1 OpenAPI YAML, 1.340 enlaces locales y 0 rotos, 228 registros DEC únicos y 0 tablas inconsistentes.


## DEC-229 - Ejemplos OpenAPI del lote E

- **Fecha de registro:** 2026-11-06.
- **Continuidad:** «continua» después de DEC-228 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, webhooks reales, correos, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-e.md v0.1](diseno/ejemplos-lote-e.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `webhooks.culqi`, `webhooks.resend`, `admin.notifications.listIncidents`, `admin.notifications.getIncident` y `admin.notifications.resend`; 10 bloques (3 solicitud, 7 respuesta).
- **Acumulado:** 43 bloques de ejemplo en 29 operaciones (lotes A, B, C, D y E).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12, cuerpos de webhook ilustrativos y datos sin PII/tokens/firmas reales.
- **Frontera:** la forma exacta de los proveedores sigue pendiente de API-06/API-07; no añade errores por operación ni ejemplos de evento duplicado/no autenticado, ni cubre las 63 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 78 archivos Markdown, 1 OpenAPI YAML, 1.362 enlaces locales y 0 rotos, 229 registros DEC únicos y 0 tablas inconsistentes.


## DEC-230 - Ejemplos OpenAPI del lote F

- **Fecha de registro:** 2026-11-07.
- **Continuidad:** «continuar» después de DEC-229 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, ofertas/hoteles reales, imágenes, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-f.md v0.1](diseno/ejemplos-lote-f.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.catalog.list`, `admin.catalog.create`, `admin.catalog.update`, `admin.catalog.activate`, `admin.catalog.deactivate`, `admin.hotels.list`, `admin.hotels.create`, `admin.hotels.update`, `admin.hotels.activate` y `admin.hotels.deactivate`; 14 bloques (4 solicitud, 10 respuesta).
- **Acumulado:** 57 bloques de ejemplo en 39 operaciones (lotes A, B, C, D, E y F).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales.
- **Frontera:** la movilidad administrativa se separa al lote G; no añade errores por operación ni cubre las 53 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 79 archivos Markdown, 1 OpenAPI YAML, 1.384 enlaces locales y 0 rotos, 230 registros DEC únicos y 0 tablas inconsistentes.


## DEC-231 - Ejemplos OpenAPI del lote G

- **Fecha de registro:** 2026-11-07.
- **Continuidad:** «continuar» después de DEC-230 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, movilidad/imágenes reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-g.md v0.1](diseno/ejemplos-lote-g.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.mobility.list`, `admin.mobility.create`, `admin.mobility.get`, `admin.mobility.update`, `admin.mobility.replaceImage`, `admin.mobility.activate` y `admin.mobility.deactivate`; 10 bloques (3 solicitud, 7 respuesta).
- **Acumulado:** 67 bloques de ejemplo en 46 operaciones (lotes A, B, C, D, E, F y G).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. La solicitud de imagen es ilustrativa y no sube ningún binario.
- **Frontera:** no añade errores por operación ni cubre las 46 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 80 archivos Markdown, 1 OpenAPI YAML; enlaces y tablas verificados en la validación final de esta actualización.


## DEC-232 - Ejemplos OpenAPI del lote H

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-231 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, salidas/precios reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-h.md v0.1](diseno/ejemplos-lote-h.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.catalog.createDeparture`, `admin.catalog.updateDeparture`, `admin.catalog.updatePricing`, `admin.catalog.updateDeparturePricing` y `admin.catalog.updateItinerary`; 10 bloques (5 solicitud, 5 respuesta).
- **Acumulado:** 77 bloques de ejemplo en 51 operaciones (lotes A, B, C, D, E, F, G y H).
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. Las fechas, precios, capacidades y disponibilidad son ficticios.
- **Frontera:** no añade errores por operación ni cubre las 41 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 81 archivos Markdown, 1 OpenAPI YAML, 1.431 enlaces locales y 0 rotos, 232 registros DEC únicos y 0 tablas inconsistentes.


## DEC-233 - Ejemplos OpenAPI del lote I

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-232 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, imágenes/habitaciones/inventario reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-i.md v0.1](diseno/ejemplos-lote-i.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.catalog.uploadImage`, `admin.catalog.replaceImage`, `admin.catalog.deleteImage`, `admin.hotels.createRoomType`, `admin.hotels.updateRoomType` y `admin.hotels.updateInventory`; 10 bloques (5 solicitud, 5 respuesta) y `deleteImage` con `204` sin cuerpo.
- **Acumulado:** 87 bloques de ejemplo en 56 operaciones con ejemplos; 36 operaciones sin ejemplo.
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. Las imágenes, habitaciones e inventario son ficticios y no se cargó ningún binario.
- **Frontera:** no añade errores por operación ni cubre las 36 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 82 archivos Markdown, 1 OpenAPI YAML, 1.456 enlaces locales y 0 rotos, 233 registros DEC únicos y 0 tablas inconsistentes.


## DEC-234 - Ejemplos OpenAPI del lote J

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-233 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, imágenes/hoteles/habitaciones/propuestas reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-j.md v0.1](diseno/ejemplos-lote-j.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.hotels.createLodgingProposal`, `admin.hotels.updateLodgingProposal`, `admin.hotels.uploadImage`, `admin.hotels.replaceImage`, `admin.hotels.deleteImage`, `admin.hotels.uploadRoomTypeImage`, `admin.hotels.replaceRoomTypeImage` y `admin.hotels.deleteRoomTypeImage`; 12 bloques (6 solicitud, 6 respuesta) y dos eliminaciones con `204` sin cuerpo.
- **Acumulado:** 99 bloques de ejemplo en 62 operaciones con ejemplos; 30 operaciones sin ejemplo, de las cuales 4 usan `204` y 26 no tienen ejemplo de éxito.
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. Las imágenes, hoteles, habitaciones y propuestas son ficticios y no se cargó ningún binario.
- **Frontera:** no añade errores por operación ni cubre las 30 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 83 archivos Markdown, 1 OpenAPI YAML, 1.475 enlaces locales y 0 rotos, 234 registros DEC únicos y 0 tablas inconsistentes.


## DEC-235 - Ejemplos OpenAPI del lote K

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-234 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, clientes reales, auditoría real, exportaciones reales, CSV reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-k.md v0.1](diseno/ejemplos-lote-k.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.clients.list`, `admin.clients.get`, `admin.audit.list`, `admin.audit.get`, `admin.exports.createClients`, `admin.exports.createAudit`, `admin.exports.get` y `admin.exports.download`; 10 bloques (2 solicitud, 8 respuesta), incluido un CSV ficticio en `text/csv`.
- **Acumulado:** 109 bloques de ejemplo en 70 operaciones con ejemplos; 22 operaciones sin ejemplo, de las cuales 4 usan `204` y 18 no tienen ejemplo de éxito.
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. Los clientes, la auditoría y las exportaciones son ficticios y no se generó ningún CSV real.
- **Frontera:** no añade errores por operación ni cubre las 22 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 84 archivos Markdown, 1 OpenAPI YAML, 1.494 enlaces locales y 0 rotos, 235 registros DEC únicos y 0 tablas inconsistentes.


## DEC-236 - Ejemplos OpenAPI del lote L

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-235 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, reportes reales, PDF reales, imágenes publicadas reales, archivos reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-l.md v0.1](diseno/ejemplos-lote-l.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `admin.reports.create`, `admin.reports.get`, `admin.reports.rows`, `admin.reports.requestPdf`, `admin.reports.downloadPdf`, `media.getPublished` y `media.adminPreview`; 12 bloques (1 solicitud, 11 respuesta), con marcadores ficticios para PDF y JPEG/PNG/WebP.
- **Acumulado:** 121 bloques de ejemplo en 77 operaciones con ejemplos; 15 operaciones sin ejemplo, de las cuales 4 usan `204` y 11 no tienen ejemplo de éxito.
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens reales. Los reportes, PDF e imágenes son ficticios y no se generó ningún archivo real.
- **Frontera:** no añade errores por operación ni cubre las 15 operaciones restantes; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 85 archivos Markdown, 1 OpenAPI YAML, 1.513 enlaces locales y 0 rotos, 236 registros DEC únicos y 0 tablas inconsistentes.


## DEC-237 - Ejemplos OpenAPI del lote M

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-236 se interpreta como autorización para ampliar ejemplos documentales del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, sesiones reales, tokens reales, contraseñas reales, cookies reales, correos, cuentas, imágenes reales, pagos, datos reales, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-m.md v0.1](diseno/ejemplos-lote-m.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** `auth.refresh`, `auth.logout`, `auth.verifyEmail`, `auth.resendVerification`, `auth.forgotPassword`, `auth.resetPassword`, `auth.googleStart`, `auth.googleCallback`, `auth.googleLink`, `profile.requestEmailChange`, `profile.confirmEmailChange`, `profile.requestClosure`, `admin.catalog.deleteImage`, `admin.hotels.deleteImage` y `admin.hotels.deleteRoomTypeImage`; 18 bloques de cuerpo (9 solicitud, 9 respuesta), 4 respuestas `204` y 2 respuestas `302` sin cuerpo.
- **Acumulado:** 139 bloques de ejemplo en 86 operaciones con ejemplos de cuerpo; 6 operaciones sin cuerpo de ejemplo (4 `204`, 2 `302`). Las 92 operaciones tienen respuesta de éxito documentada.
- **Validación:** YAML parseado, ejemplos contra JSON Schema con 0 fallos, UUID ficticios con grupos 8-4-4-4-12 y datos sin PII/tokens/contraseñas reales. Las sesiones, tokens, correos, cuentas y cookies son ficticios y no se envió ningún correo ni se ejecutó OAuth.
- **Frontera:** no añade errores por operación; CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 86 archivos Markdown, 1 OpenAPI YAML, 1.542 enlaces locales y 0 rotos, 237 registros DEC únicos y 0 tablas inconsistentes.



## DEC-238 - Ejemplos OpenAPI de error del lote N

- **Fecha de registro:** 2026-11-09.
- **Continuidad:** «continuar» después de DEC-237 se interpreta como autorización para ampliar ejemplos documentales de error del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-n.md v0.1](diseno/ejemplos-lote-n.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** 22 ejemplos ficticios en 11 componentes de respuesta: `BadRequest` (2), `Unauthorized` (2), `Forbidden` (2), `NotFound` (2), `Conflict` (6), `Gone` (2), `PayloadTooLarge` (1), `UnsupportedMediaType` (1), `TooManyRequests` (1), `ServiceUnavailable` (2) e `InternalError` (1). Los diez componentes referenciados acumulan 319 referencias de error en 90 operaciones; `InternalError` no está referenciado.
- **Acumulado:** 139 bloques de éxito en 86 operaciones con ejemplos de cuerpo y 22 ejemplos compartidos de error; 919 ejemplos efectivos en 92 operaciones al resolver componentes, 0 fallos; 92/92 operaciones con al menos un ejemplo y 90/92 con errores declarados cubiertos. `hotels.list` y `mobility.list` no declaran errores.
- **Validación:** YAML parseado, 22/22 ejemplos de componente válidos contra `ProblemDetails`, 919 ejemplos efectivos con 0 fallos, códigos del enum `ProblemCode`, `traceId` y datos ficticios, sin PII/tokens reales.
- **Frontera:** los ejemplos son compartidos y no específicos por operación; no se añadieron códigos, respuestas inline, handlers ni cambios de estado. CT-12 sigue parcial y API-01 abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas siguen abiertas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. 87 archivos Markdown, 1 OpenAPI YAML, 1.573 enlaces locales y 0 rotos, 238 registros DEC únicos y 0 tablas inconsistentes.


## DEC-239 - Ratificación del paquete documental de diseño técnico

- **Fecha de registro:** 2026-11-10.
- **Autoridad y decisión:** Aprobación explícita del usuario/responsable del proyecto a la propuesta de ratificación del paquete completo presentada en [paquete-ratificacion.md](diseno/paquete-ratificacion.md).
- **Documentos y versiones ratificados:**
  1. [politica-versionado-api.md v0.1](diseno/politica-versionado-api.md) (DEC-219): Propietario/revisores por rol, SemVer, prefijo `/api/v1`, clasificación de cambios mayores/menores/parche y ventana de deprecación de 90 días. Pendientes abiertos: PV-01–PV-06 (fecha y contenido de `1.0.0`, canal de changelog, ejecución de CT-02–CT-12).
  2. [decisiones-transversales-api.md v0.1](diseno/decisiones-transversales-api.md) (DEC-220): `ProblemDetails` como forma única de error, recurso ajeno tratado como `404`, `409 stale_version`, cabeceras `Idempotency-Key` y `ETag`/`If-Match`, paginación en base 1 con máximos por módulo, instantes en UTC con filtros comerciales en `America/Lima`, y dinero como cadena decimal en `PEN` con 2 decimales. Pendientes abiertos: DT-06 (formato/retención/concurrencia de la clave de idempotencia), DT-09 (valor por defecto de `pageSize` y orden estable), DT-12 (regla de redondeo de centavos) y pruebas CT-04–CT-07.
  3. [plan-bt-01.md v0.1](diseno/plan-bt-01.md) (DEC-222): Arquitectura en exactamente cuatro proyectos de producción en `src/` (`Domain`, `Application`, `Infrastructure`, `Api` con Presentation integrada), un único host ejecutable backend, separación estricta con `frontend/` (React/Vite/TS), matriz de dependencias permitidas y reglas de aislamiento modular. Pendientes abiertos: comprobaciones BT-01-A01–A10 ejecutables sobre solución autorizada, y puertas BT-02–BT-04.
  4. [plan-md-01-md-08.md v0.1](diseno/plan-md-01-md-08.md) (DEC-223, parte MD-01 y parte MD-08 marco):
     - **MD-01 (Esquema físico):** Tablas y columnas en `snake_case` singular, clave técnica interna `bigint generated always as identity`, identificador público `uuid`, `reservationNumber` único y separado, instantes `timestamptz`, fechas comerciales `date`, importes `numeric(14,2)` PEN `>= 0`, enums restringidos por `CHECK`/catálogo, control de concurrencia `row_version` y baja lógica con `deleted_at`. Pendientes abiertos: MD-01-C01–C08 sobre DDL/migraciones autorizadas, y puertas MD-02–MD-07.
     - **MD-08 (Marco de retención):** Invariantes de baja lógica (sin borrado físico de registros financieros o de auditoría), unicidad inalterable de correo canónico, inmutabilidad de snapshots y auditoría desde la aplicación, y limpieza de multimedia tras comprobar cero referencias. Pendientes abiertos: definición de ventanas exactas MD-08-W01–W07 y comprobaciones MD-08-R01–R08.
  5. [plan-pruebas-contrato.md v0.1](diseno/plan-pruebas-contrato.md) (DEC-221): Metodología de pruebas de contrato para CT-02–CT-12, estados de caso PASS/FAIL/BLOCKED/NOT RUN, fases A–D y criterios de cierre. Pendientes abiertos: PT-01–PT-06, construcción del test harness y ejecución sobre runtime.
- **Frontera y límites estrictos:** La ratificación convierte las propuestas documentales en referencias aprobadas dentro de `sdd/`. No autoriza por sí misma creación de solución `.sln`, proyectos, código, handlers, endpoints, SQL, migraciones, harness, conexión a PostgreSQL real, cuentas, proveedores (Culqi, Resend, R2), datos de clientes, configuración, commits ni push.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 87 archivos Markdown, 1 OpenAPI YAML, 239 registros DEC únicos y 0 tablas inconsistentes.

## DEC-240 - Ejemplos OpenAPI de error específicos del lote O

- **Fecha de registro:** 2026-11-10.
- **Continuidad:** «continuar» después de DEC-239 se interpreta como autorización para ampliar ejemplos documentales de error del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-o.md v0.1](diseno/ejemplos-lote-o.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** 17 ejemplos ficticios en 13 componentes de respuesta específicos: `InvalidCredentials` (1), `InvalidToken` (1), `AlreadyVerified` (1), `VerificationResendConflict` (2), `EmailAlreadyRegistered` (1), `EmailChangeConfirmConflict` (2), `StaleVersion` (1), `AccountClosureBlocked` (1), `EmailNotVerified` (1), `ReservationUnavailable` (1), `ReservationCancelConflict` (2), `PaymentNotPayable` (1) y `RefundAuthorizationConflict` (2). Se sustituyeron 17 referencias genéricas en 14 operaciones; el total de referencias de error sigue siendo 319 en 90 operaciones.
- **Acumulado:** 139 bloques de éxito en 86 operaciones con ejemplos de cuerpo y 39 ejemplos de error en 24 componentes (22 compartidos del lote N y 17 específicos del lote O); 860 ejemplos efectivos en 92 operaciones al resolver componentes, 0 fallos; 92/92 operaciones con al menos un ejemplo y 90/92 con errores declarados cubiertos. `hotels.list` y `mobility.list` no declaran errores.
- **Validación:** YAML parseado, 17/17 ejemplos específicos válidos contra `ProblemDetails`, 39/39 ejemplos de error totales válidos, 133 referencias únicas sin faltantes, 860 ejemplos efectivos con 0 fallos, códigos del enum `ProblemCode`, `traceId` y datos ficticios, sin PII/tokens reales.
- **Frontera:** la cobertura específica se limita a identidad, perfil, reservas, pagos y autorización de devoluciones; no alcanza catálogo, hoteles, movilidad, inventario, exportaciones, reportes ni media. No se añadieron códigos, respuestas inline, handlers ni cambios de estado. CT-12 sigue parcial y API-01 abierta en sus pruebas de runtime.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 88 archivos Markdown, 1 OpenAPI YAML, 240 identificadores DEC (238 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`) y 0 tablas inconsistentes.

## DEC-241 - Ejemplos OpenAPI de error específicos del lote P

- **Fecha de registro:** 2026-11-11.
- **Continuidad:** «continuar» después de DEC-240 se interpreta como autorización para ampliar ejemplos documentales de error del OpenAPI; no autoriza handlers, código, endpoints, SQL, migraciones, harness, respuestas reales, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits ni push.
- **Entregable:** [ejemplos-lote-p.md v0.1](diseno/ejemplos-lote-p.md) y ejemplos en [dmgo-api-v1.yaml](diseno/openapi/dmgo-api-v1.yaml).
- **Cobertura:** 19 ejemplos ficticios en 14 componentes de respuesta específicos: `CatalogUpdateConflict` (2), `CatalogActivationConflict` (2), `HotelUpdateConflict` (2), `HotelActivationConflict` (2), `RoomTypeCreateConflict` (1), `InventoryConflict` (1), `ExportNotReady` (1), `ExportExpired` (1), `ReportExpired` (1), `ReportNotReady` (1), `MediaNotPublished` (1), `CaptureCapacityExceeded` (1), `MobilityUpdateConflict` (1) y `MobilityActivationConflict` (2). Se sustituyeron 17 referencias genéricas en 15 operaciones; el total de referencias de error sigue siendo 319 en 90 operaciones.
- **Acumulado:** 139 bloques de éxito en 86 operaciones con ejemplos de cuerpo y 58 ejemplos de error en 38 componentes (22 compartidos del lote N y 36 específicos de los lotes O y P); 808 ejemplos efectivos en 92 operaciones al resolver componentes, 0 fallos; 92/92 operaciones con al menos un ejemplo y 90/92 con errores declarados cubiertos. `hotels.list` y `mobility.list` no declaran errores.
- **Validación:** YAML parseado, 19/19 ejemplos específicos válidos contra `ProblemDetails`, 58/58 ejemplos de error totales válidos, 146 referencias únicas sin faltantes, 808 ejemplos efectivos con 0 fallos, códigos del enum `ProblemCode`, `traceId` y datos ficticios, sin PII/tokens reales. El componente genérico `Gone` queda sin referencias tras el lote P, pero se conserva definido.
- **Frontera:** la cobertura específica se limita a catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada; no alcanza todas las operaciones administrativas, autenticación, perfil ni notificaciones. No se añadieron códigos, respuestas inline, handlers ni cambios de estado. CT-12 sigue parcial y API-01 abierta en sus pruebas de runtime.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 89 archivos Markdown, 1 OpenAPI YAML, 241 identificadores DEC (239 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`) y 0 tablas inconsistentes.

## DEC-242 - Primera vertical slice implementada

- **Fecha de registro:** 2026-11-12.
- **Continuidad:** «continuar» después de DEC-241 se interpreta como autorización para implementar la primera vertical slice del recorrido identidad → catálogo público → borrador de reserva → pago simulado, dentro de las baselines aprobadas. No autoriza proveedores reales, pagos reales, correos reales, imágenes publicadas, exportaciones, reportes, PDF, panel administrativo, migraciones adicionales, commits ni push.
- **Entregable:** código en `src/`, pruebas en `tests/` (incluido el proyecto `DMGoTravel.Api.IntegrationTests`), migración `20261111202423_InitialCreate` y [primera-vertical-slice.md v0.1](diseno/primera-vertical-slice.md).
- **Alcance implementado:** registro, verificación de correo, login, refresh rotatorio con familia y detección de reutilización, logout y perfil; catálogo público de `tours` y `packages` con filtros y detalle; creación, listado, consulta y cancelación idempotente de reservas de tour con retención y liberación de cupos; pago simulado autoaprobado con `card` y `yape`; consulta de pago. El alojamiento se rechaza explícitamente en esta entrega.
- **Seguridad:** JWT RS256 con clave RSA de desarrollo en `App_Data/dev-jwt-key.pem`; refresh token opaco almacenado como hash; cookies `HttpOnly`, `SameSite=Strict` y `Secure` fuera de desarrollo; prueba CSRF de doble envío; respuestas de autenticación en `application/problem+json`; claves de protección de datos en `App_Data/keys`; ambas rutas fuera de Git.
- **Persistencia:** PostgreSQL 16 en `dmgotravel-postgres`, base `dmgotravel_dev`, migración inicial aplicada, datos ficticios de desarrollo y `UseQuerySplittingBehavior(SplitQuery)` para evitar consultas cartesianas.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 5 de integración aprobadas con el runner in-process de xUnit v3; harness `DMGoTravel.Api.IntegrationTests` con `WebApplicationFactory<Program>` y PostgreSQL dedicado `dmgotravel_it`, recreado al inicio de cada ejecución; smoke test completo de salud, registro, verificación, login, rotación y reutilización de refresh, perfil, catálogo, reserva, pago simulado, consulta, cancelación y rechazo de paquetes y alojamiento; sin advertencias de tipos owned compartidos ni de múltiples colecciones incluidas; `System.Security.Cryptography.Pkcs` actualizado a 10.0.15.
- **Frontera:** no se integraron Culqi, Resend ni R2; no hay envío real de correos, imágenes publicadas, exportaciones, reportes, PDF, alojamiento, hoteles, movilidad, inventario administrativo ni panel administrativo. Tampoco se implementaron reenvío de verificación, recuperación de contraseña, cambio de correo, cierre de cuenta, idempotencia durable mediante `Idempotency-Key`, rate limiting ni limpieza programada de refresh tokens. El OpenAPI sigue sin ratificación formal y CT-12 sigue parcial; el harness de integración ya existe y cubre la slice, pero CT-02–CT-12 no se ejecutaron.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 90 archivos Markdown, 1 OpenAPI YAML, 242 identificadores DEC (240 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`) y 0 tablas inconsistentes. No se realizó commit ni push.


## DEC-243 - Resultados parciales de contrato de la primera vertical slice

- **Fecha de registro:** 2026-11-12.
- **Continuidad:** «continuar» después de DEC-242 se interpreta como autorización para ejecutar el subconjunto de CT-02–CT-12 aplicable a la slice y corregir desviaciones de contrato dentro de las operaciones ya implementadas. No autoriza proveedores reales, pagos reales, correos reales, imágenes, exportaciones, reportes, PDF, panel administrativo, idempotencia durable, migraciones adicionales, rate limiting, commits ni push.
- **Entregable:** [resultados-pruebas-contrato.md v0.1](diseno/resultados-pruebas-contrato.md), [primera-vertical-slice.md v0.2](diseno/primera-vertical-slice.md), `ContractSliceTests.cs` y la corrección `invalid_page` en los listados de catálogo y reservas.
- **Resultado:** CT-02, CT-03, CT-04, CT-06, CT-07 y CT-11 pasan en el subconjunto implementado; CT-05, CT-08, CT-09 y CT-10 quedan bloqueadas; CT-12 sigue parcial. El rechazo de `pageSize` superior al máximo queda pendiente de DT-09 y la idempotencia durable de DT-06/API-04.
- **Evidencia:** build con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 12 de integración aprobadas (26 total) con el runner in-process de xUnit v3; base `dmgotravel_it` recreada por ejecución; CT-02 seguridad y aislamiento, CT-03 `Location`, CT-04 `problem+json`, CT-06 `stale_version`, CT-07 paginación y dinero, CT-11 no fugas.
- **Frontera:** no se integraron Culqi, Resend ni R2; no hay idempotencia durable, `ETag`/`If-Match`, rate limiting, reenvío de verificación, recuperación de contraseña, exportaciones, reportes, PDF, panel administrativo ni migraciones adicionales. API-01 sigue abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 243 identificadores DEC (241 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`) y 0 tablas inconsistentes. 1.651 enlaces locales y 0 rotos. No se realizó commit ni push.

## DEC-244 - Idempotencia durable de la primera vertical slice

- **Fecha de registro:** 2026-11-13.
- **Continuidad:** «continuar» después de DEC-243 y la elección explícita de «Idempotencia durable» se interpretan como autorización para implementar `Idempotency-Key` durable en creación de reserva, cancelación y pago, incluida una migración nueva. No autoriza proveedores reales, pagos reales, correos, imágenes, exportaciones, reportes, PDF, rate limiting, reenvío de verificación, recuperación de contraseña, `ETag`/`If-Match`, commits ni push.
- **Entregable:** migración `20261113004006_AddIdempotencyRecords`, tabla `idempotency_record`, `IIdempotencyStore`, `IdempotencyBehavior`, comandos y endpoints con `Idempotency-Key`, `IdempotencySliceTests.cs`, [primera-vertical-slice.md v0.3](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.2](diseno/resultados-pruebas-contrato.md).
- **Contrato aplicado:** la cabecera `Idempotency-Key` es obligatoria, de 1 a 128 caracteres, y se interpreta por cuenta y operación (`reservations.create`, `reservations.cancel`, `payments.start`). La huella es SHA-256 de los campos de negocio, sin incluir la clave. La misma clave con el mismo cuerpo devuelve la respuesta original; la misma clave con otro cuerpo devuelve `409 idempotency_conflict`. La operación y el registro se confirman en la misma transacción; un fallo revierte ambos. La retención es de 48 horas y un servicio en segundo plano elimina los registros expirados cada 6 horas.
- **Concurrencia:** el índice único `(user_id, scope, key)` y `INSERT ... ON CONFLICT DO NOTHING` arbitran dos peticiones simultáneas; la segunda espera a la primera y reproduce su respuesta o inserta si la primera revierte. No se crean reservas, pagos ni liberaciones de cupos duplicadas.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 19 de integración aprobadas (33 total) con el runner in-process de xUnit v3; `IdempotencySliceTests` cubre replay de creación, conflicto por cuerpo distinto, cabecera ausente, longitud máxima, replay de pago tras confirmación, conflicto por método distinto, replay y conflicto de cancelación y dos creaciones concurrentes con una sola reserva. Migración aplicada sobre `dmgotravel_dev`. OpenAPI parseado con Python 3.14 y PyYAML 6.0.3: 82 rutas, 92 operaciones y 0 errores en los tres ejemplos `idempotencyConflict`; `info.version` permanece `0.1.0-draft` porque el contrato no se ratifica.
- **Frontera:** no se implementaron proveedores reales, pagos reales, correos, imágenes, exportaciones, reportes, PDF, rate limiting, reenvío de verificación, recuperación de contraseña, cambio de correo, cierre de cuenta, `ETag`/`If-Match`, limpieza programada de refresh tokens ni ratificación formal del OpenAPI. CT-08, CT-09, CT-10 y CT-12 siguen pendientes; API-01 sigue abierta.
- **Puertas:** API-01–API-08, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 244 identificadores DEC (242 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.654 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.
## DEC-245 - Reemisión de verificación y recuperación de contraseña

- **Fecha de registro:** 2026-11-13.
- **Continuidad:** «continuar» después de DEC-244 y la elección explícita de «Reenvío de verificación + recuperación de contraseña» se interpretan como autorización para implementar esos flujos dentro de 005/RF-6-RF-8, 005/RF-22-RF-25 y 005-C. No autoriza Resend real, rate limiting, auditoría persistida, Google OAuth, cambio de correo, cierre de cuenta, `ETag`/`If-Match`, commits ni push.
- **Entregable:** `POST /api/v1/auth/verify-email/resend`, `POST /api/v1/auth/password/forgot` y `POST /api/v1/auth/password/reset`; comandos `ResendVerificationCommand`, `ForgotPasswordCommand` y `ResetPasswordCommand`; campos `PasswordResetTokenHash` y `PasswordResetExpiresAtUtc` en `user_account`; migración `20261113021233_AddPasswordResetToken`; `IRefreshTokenRepository.RevokeAllForUserAsync`; `AuthTokenPolicy`; `RecoverySliceTests.cs`; [primera-vertical-slice.md v0.4](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.3](diseno/resultados-pruebas-contrato.md).
- **Contrato aplicado:** el reenvío exige titular autenticado e `Idempotency-Key` (ámbito `auth.resend_verification`), responde `202 accepted` con `id`, `status`, `referenceAt` y `expiresAt`, y devuelve `409 already_verified` si la cuenta ya está verificada. Cada solicitud admitida sustituye el enlace anterior; el enlace dura 24 horas y solo el último digest es localizable. La recuperación responde `202` genérico exista o no la cuenta, sin correo libre ni secreto en la respuesta. El restablecimiento consume un enlace de 30 minutos y un solo uso, valida la política de contraseña de 12 a 128 caracteres, incrementa `SecurityVersion`, revoca todas las familias de refresh y devuelve `200 completed`; una prueba inválida, vencida o reutilizada devuelve `400 invalid_token`.
- **Persistencia y concurrencia:** los enlaces se guardan solo como digest SHA-256; el `RowVersion` de la cuenta arbitra consumos simultáneos y el consumo, el cambio de contraseña y la revocación de familias se confirman en el mismo `SaveChanges`. Una solicitud rechazada no toca el enlace vigente.
- **Corrección del harness:** se detectó que `WebApplicationFactory` aplicaba la configuración de pruebas después de que `Program` leyera la cadena de conexión, por lo que la suite escribía en `dmgotravel_dev` (90 cuentas de prueba y cupos agotados). `ApiFactory` fija `ConnectionStrings__DefaultConnection` en un inicializador de módulo, antes de cargar la API; la base `dmgotravel_it` vuelve a recrearse y la suite queda aislada. Se limpiaron los datos ficticios de prueba acumulados en `dmgotravel_dev` y se repuso `CapacityCommitted`.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 25 de integración aprobadas (39 total) con el runner in-process de xUnit v3. `RecoverySliceTests` cubre autenticación y cabecera obligatoria, sustitución del enlace, replay, `already_verified`, respuesta genérica para cuenta inexistente, restablecimiento, uso único, prueba inválida, contraseña corta y revocación de la sesión previa. Migración aplicada sobre `dmgotravel_dev`; `dmgotravel_it` aislada y recreada por ejecución. El OpenAPI no requirió cambios: las tres operaciones, `EmptyRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `OperationAccepted` y `OperationResult` ya estaban declarados, y la implementación se ajusta a ellos.
- **Frontera:** no se integró Resend ni hay envío real de correos; ambos tokens se recuperan por endpoints de desarrollo. No hay rate limiting ni respuestas `429`, bloqueo por intentos fallidos, auditoría persistida de identidad, cambio de correo, cierre de cuenta ni UI. El access token emitido antes del restablecimiento sigue siendo válido hasta su vencimiento de 5 minutos; la revocación global aplica a los refresh. Las 16 tareas de 005-C y las tareas base de 005 permanecen sin marcar.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 245 identificadores DEC (243 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.659 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.

## DEC-246 - Auditoría persistida de identidad

- **Fecha de registro:** 2026-11-13.
- **Continuidad:** «continuar» después de DEC-245 y la elección explícita de «Auditoría persistida de identidad» se interpretan como autorización para registrar en `audit_record` las operaciones de identidad ya implementadas, dentro de 005/RF-30 y 010/RF-9-RF-15/RF-36-RF-37. No autoriza consultas/exportaciones administrativas de 010, cambios de esquema adicionales, rate limiting, Resend real, `ETag`/`If-Match`, commits ni push.
- **Entregable:** `IAuditWriter`/`AuditEntry`/`AuditActions`, `ICorrelationContext`, `AuditWriter` y `HttpCorrelationContext`; integración en registro, verificación, reenvío, login, refresh, logout, recuperación y restablecimiento; `AuditSliceTests.cs`; [primera-vertical-slice.md v0.5](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.4](diseno/resultados-pruebas-contrato.md). No se creó migración: `audit_record` ya existía desde `20261111202423_InitialCreate`.
- **Contrato aplicado:** cada operación controlable añade su registro al mismo `ApplicationDbContext` y se confirma en el mismo `SaveChanges`; si el guardado falla, la operación tampoco se aplica (010/RF-36/RF-37). El registro conserva origen `api`, `operationId` y acción iguales al identificador estable del OpenAPI (`auth.register`, `auth.login`, `auth.verifyEmail`, `auth.resendVerification`, `auth.refresh`, `auth.logout`, `auth.forgotPassword`, `auth.resetPassword`), actor `human`/`unidentified`, identificador interno del actor cuando existe, entidad `user_account` con su identificador público, fecha UTC, correlación de la petición, resultado `success`/`failure` y cambios mínimos en JSON.
- **Cobertura:** éxito de registro, verificación, reenvío, login, rotación de refresh, logout, solicitud de recuperación para cuenta activa y restablecimiento; fallo de login con credenciales inválidas, cuenta inactiva o inexistente; y detección de reutilización de refresh. El replay de una `Idempotency-Key` de reenvío no ejecuta el handler y no duplica el registro de éxito (010/RF-20). No se auditan lecturas públicas, intentos de verificación/restablecimiento con prueba inválida ni solicitudes de recuperación de cuentas inexistentes para no crear filas con datos de entrada ni inflar el registro sin rate limiting.
- **Saneamiento:** no se almacenan correo, contraseñas, tokens brutos, digests, cookies ni secretos; los cambios se limitan a booleanos, fechas de vigencia, versión de seguridad e identificador de familia. El actor de un registro fallido sin cuenta se marca `unidentified` y la entidad queda en `unknown`.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 28 de integración aprobadas (42 total) con el runner in-process de xUnit v3. `AuditSliceTests` cubre registro/verificación/login sin secretos, reenvío con replay sin duplicado, recuperación y restablecimiento auditados, login fallido y reutilización de refresh como fallo, con `EntityId` público y correlación no vacía.
- **Frontera:** no se implementaron consulta, filtros, exportación ni pantalla administrativa de auditoría (010); no hay triggers de inmutabilidad, retención programada, deduplicación por `dedup_key`, evidencia de pasos/intentos (`fact_id`/`step`/`attempt`) ni catálogo oficial versionado de acciones. Las acciones de identidad usan el `operationId` del OpenAPI como identificador técnico provisional; el catálogo de 010 sigue pendiente. Tampoco se auditaron reservas, pagos, catálogo, hoteles, movilidad, notificaciones ni tareas automáticas. No hay rate limiting, Resend real ni `ETag`/`If-Match`.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos según la matriz de cierre. RF-30 queda cubierto solo para las operaciones de identidad implementadas; 005-C/RF-16 y 005-C/RF-17 quedan cubiertos en el camino admitido, no en la consulta/exportación de 010; la consulta y el detalle posteriores se registran en DEC-247.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 246 identificadores DEC (244 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.662 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.

## DEC-247 - Consulta y detalle administrativo de auditoría

- **Fecha de registro:** 2026-11-13.
- **Continuidad:** la instrucción de continuar con la consulta y el detalle de auditoría después de DEC-246 se interpreta como autorización para implementar las lecturas administrativas de 010 sobre `audit_record`, dentro de RF-22-RF-25 y RF-48-RF-52. No autoriza exportaciones CSV, pantalla administrativa, proveedores reales, cambios de esquema, auditoría de nuevos módulos, commits ni push.
- **Entregable:** `GET /api/v1/admin/audit` (`admin.audit.list`) y `GET /api/v1/admin/audit/{id}` (`admin.audit.get`); `ListAuditQuery`/`GetAuditQuery`, `AuditProjection`, `AuditEntryDto`/`AuditPageDto`, `AuditEndpoints`, `AuditQueryParameters`, `IAdminAccessGuard`; extensión de `IAuditRepository`/`AuditRepository`; pruebas `AdminAuditTests.cs`; [primera-vertical-slice.md v0.6](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.5](diseno/resultados-pruebas-contrato.md). No se creó migración ni índice nuevo; `audit_record` conserva sus índices existentes (`PublicId` único, `EntityType`/`EntityId` y `OccurredAtUtc`).
- **Autorización:** ambos endpoints exigen `bearerAuth`; además del token, `IAdminAccessGuard` relee en base que la cuenta siga activa, no esté dada de baja, conserve el rol `admin`, tenga la misma `SecurityVersion` y mantenga activa la familia de refresh de la sesión. Si no puede verificarse, la consulta falla cerrada con `401`/`403` y no devuelve filas.
- **Contrato aplicado:** `page` entero positivo; `pageSize` de 1 a 100, por defecto 25; `from`/`to` son fechas `YYYY-MM-DD` de `America/Lima`, inclusivas y convertidas a un intervalo UTC semiabierto; `actor` acepta el UUID público de la cuenta o `human`/`system`/`unidentified`; `entity` filtra por `EntityId` y `type` por `EntityType`; `correlationId`, `action` y `result` exigen coincidencia exacta. Los textos se recortan y un valor vacío no aplica filtro. Un rango invertido o una fecha inválida devuelve `400 invalid_range`; un `pageSize` o filtro no admitido devuelve `400 invalid_filter`; un `page` inválido conserva `400 invalid_page`.
- **Orden y detalle:** la lista se ordena por `OccurredAtUtc` descendente y desempata por el identificador interno descendente; la consulta se pagina después de ordenar. El detalle busca por `PublicId` y devuelve `404 not_found` si no existe. La respuesta no expone el `Id` interno ni `Sequence`; `id` es el UUID público.
- **Proyección:** `actor` humano se muestra como UUID público estable, `system`/`unidentified` como etiqueta; `summary` se deriva de una allowlist de claves y valores seguros de `ChangesJson` y no vuelca el JSON. Correo, tokens, digests, cookies, `familyId` y otros valores no enumerados quedan excluidos. El campo `action` usa el `operationId` técnico provisional del OpenAPI y el resumen usa una etiqueta legible para las acciones conocidas; el catálogo oficial sigue pendiente.
- **Cobertura:** los registros de identidad ya persistidos pueden listarse, filtrarse, paginarse y consultarse por detalle. `AdminAuditTests` cubre `401` anónimo, `403` para cliente, `200` para administrador, cambio de rol y revocación de familia con el token anterior, coincidencia exacta por entidad, actor, resultado, acción y correlación, rango inclusivo, página vacía, orden estable y detalle con `404`; el resumen saneado no contiene correo, token ni `familyId`.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 33 de integración aprobadas (47 total) con el runner in-process de xUnit v3. La corrección del `500` consistió en aplicar el orden sobre la entidad antes de la proyección con join, porque EF Core no traducía el `OrderBy` sobre el registro proyectado.
- **Frontera:** no se implementaron exportación CSV, pantalla administrativa, inmutabilidad por triggers, retención programada, deduplicación, catálogo oficial versionado de acciones ni auditoría de reservas, pagos, notificaciones, catálogo, hoteles, movilidad o tareas automáticas. RF-25 no queda cubierto: todavía no existen en esta entrega filas de auditoría de reserva, pago, evento o notificación que permitan reconocer sus relaciones; la consulta solo opera sobre los registros de identidad existentes. No se integran Culqi, Resend ni R2; el OpenAPI sigue sin ratificación.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos. RF-22-RF-24 y RF-48-RF-52 quedan cubiertos solo para la auditoría de identidad disponible; RF-25 sigue pendiente.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 247 identificadores DEC (245 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.665 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.

## DEC-248 - Exportación CSV de auditoría

- **Fecha de registro:** 2026-11-14.
- **Continuidad:** «continuar» después de DEC-247 y la dirección de exportación CSV de auditoría se interpreta como autorización para implementar esa porción de 010 sobre `audit_record`, dentro de RF-28-RF-31, RF-42-RF-43, RF-45, RF-47-RF-48, RF-55 y RF-57-RF-59. No autoriza exportación CSV de clientes, pantalla administrativa, PDF, proveedores reales, cambios al OpenAPI, snapshot PostgreSQL exportado, worker asíncrono, auditoría de nuevos módulos, commits ni push.
- **Entregable:** `POST /api/v1/admin/exports/audit` (`admin.exports.createAudit`), `GET /api/v1/admin/exports/{id}` (`admin.exports.get`) y `GET /api/v1/admin/exports/{id}/download`; `CreateAuditExportCommand`, `GetAuditExportQuery`, `DownloadAuditExportQuery`, `AuditCsvWriter`, `IExportRepository`/`ExportRepository`, `ExportJob`, migración `20261115005813_AddExportJobs`, `ExportCleanupService`, `AdminExportEndpoints`, `AdminAuditExportTests.cs`, [primera-vertical-slice.md v0.7](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.6](diseno/resultados-pruebas-contrato.md).
- **Contrato aplicado:** el cuerpo es opcional y admite `filters` con las mismas claves de la consulta (`from`, `to`, `actor`, `entity`, `correlationId`, `action`, `type`, `result`). Los filtros se combinan con AND y coincidencia exacta; `from`/`to` son días comerciales inclusivos de `America/Lima`. Un filtro desconocido o un valor de tipo inválido devuelve `400 invalid_filter`; un rango invertido o una fecha inválida devuelve `400 invalid_range`. La solicitud exige `Idempotency-Key`, responde `202` con `id`, `status: accepted`, `referenceAt` y `expiresAt`, y conserva la misma respuesta ante replay; otro cuerpo con la misma clave devuelve `409 idempotency_conflict`.
- **Captura y CSV:** la consulta materializa todas las filas que cumplen el filtro en una sola operación dentro de la transacción de idempotencia, sin paginar, truncar ni usar la página visible. El CSV tiene cabeceras estables, RFC 4180, orden por `OccurredAtUtc` descendente y desempate estable; un conjunto vacío entrega solo la cabecera. No contiene correo, tokens, digests, cookies, `familyId` ni el JSON almacenado. Los valores con prefijo de fórmula soportado (`=`, `+`, `-`, `@`, tabulación/CR/LF iniciales, incluso tras espacios) se neutralizan como texto; la matriz completa de hojas de cálculo sigue pendiente y RF-31 no se declara cerrado.
- **Artefacto y autorización:** `export_job` es una copia temporal privada con solicitante, referencia UTC, expiración, filtros normalizados, recuento, huella SHA-256 y CSV ya renderizado. La retención es de 24 horas y un servicio en segundo plano elimina los vencidos cada 6 horas. Estado y descarga releen la autorización administrativa vigente y exigen que el UUID del job pertenezca al solicitante; otro administrador recibe `404 not_found`, un job vencido se informa como `expired` y su descarga devuelve `410 export_expired`. `createdAt` coincide con `referenceAt` en esta implementación síncrona y el nombre del archivo incluye la referencia UTC.
- **Cobertura:** `AdminAuditExportTests` cubre `401` anónimo, `403` de cliente, cabecera `Idempotency-Key` obligatoria, cuerpo opcional, captura completa de cinco filas, cabeceras y orden CSV, neutralización de fórmula, ausencia de correo/tokens/`familyId`, filtros exactos con AND, rango inclusivo de Perú, CSV vacío solo con cabecera, replay idempotente, conflicto por cuerpo distinto, aislamiento entre administradores, expiración con `410 export_expired` y descarga `text/csv` con `Content-Disposition` y sin caché. No se cubren exportación de clientes, descarga concurrente, snapshot exportado ni capacidad.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 39 de integración aprobadas (53 total) con el runner in-process de xUnit v3. Migración `20261115005813_AddExportJobs` aplicada sin errores sobre `dmgotravel_dev`; `dmgotravel_it` se recrea por ejecución. El OpenAPI no requirió cambios de esquema: las rutas, `ExportRequest`, `OperationAccepted` y `ExportJob` ya estaban declarados y la implementación se ajusta a ellos.
- **Frontera:** no se implementaron exportación CSV de clientes, pantalla administrativa, PDF, reportes, enlaces públicos, chunks, snapshot PostgreSQL exportado, worker asíncrono ni respuesta `503` por capacidad de captura. La captura es una consulta materializada síncrona dentro de la transacción de idempotencia, no una copia compartida entre procesos; A-04 sigue pendiente. Tampoco hay triggers de inmutabilidad, retención programada de auditoría, deduplicación, catálogo oficial de acciones ni auditoría de reservas, pagos, notificaciones, catálogo, hoteles, movilidad o tareas automáticas. RF-25 sigue pendiente. No se integraron Culqi, Resend ni R2; el OpenAPI sigue sin ratificación.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos. RF-28-RF-30, RF-42-RF-43, RF-45, RF-47-RF-48, RF-55 y RF-57-RF-59 quedan cubiertos solo para la auditoría disponible; RF-29 queda cubierto únicamente para las columnas de auditoría; RF-31 sigue parcial.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 248 identificadores DEC (246 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.668 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.

## DEC-249 - Consulta y detalle administrativo de clientes

- **Fecha de registro:** 2026-11-14.
- **Continuidad:** «continuar» después de DEC-248 y la preparación del bloque de clientes se interpreta como autorización para implementar la consulta y el detalle de solo lectura de 010 sobre las cuentas y reservas existentes, dentro de RF-3-RF-8 y RF-44-RF-54. No autoriza exportación CSV de clientes, pantalla administrativa, edición/desactivación/reactivación, proveedores reales, migraciones nuevas, auditoría de nuevos módulos, commits ni push.
- **Entregable:** `GET /api/v1/admin/clients` (`admin.clients.list`) y `GET /api/v1/admin/clients/{id}` (`admin.clients.get`); `ListClientsQuery`/`GetClientQuery`, `ClientProjection`, `ClientSummaryDto`/`ClientPageDto`, `AdminClientEndpoints`, `ClientQueryParameters`, `IAdminClientRepository`/`AdminClientRepository`; `AdminClientTests.cs`; corrección del esquema `ClientSummary` en el OpenAPI; [primera-vertical-slice.md v0.8](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.7](diseno/resultados-pruebas-contrato.md). No se creó migración ni se modificó el modelo de datos.
- **Autorización:** ambos endpoints exigen `bearerAuth`; además del token, `IAdminAccessGuard` relee en base que la cuenta siga activa, no esté dada de baja, conserve el rol `admin`, tenga la misma `SecurityVersion` y mantenga activa la familia de refresh de la sesión. Si no puede verificarse, la consulta falla cerrada con `401`/`403` y no devuelve datos.
- **Contrato aplicado:** `page` es un entero positivo; `pageSize` se limita a 1-100, con 25 por defecto. `name` y `email` admiten coincidencia parcial sin distinguir mayúsculas; `id` y `status` exigen coincidencia exacta; `registeredFrom`/`registeredTo` son días comerciales `America/Lima` inclusivos convertidos a un intervalo UTC semiabierto. Los filtros se combinan con AND; un texto vacío no aplica filtro; un `page` inválido devuelve `400 invalid_page`, un `pageSize`, `id` o `status` no admitido devuelve `400 invalid_filter`, y un rango invertido o una fecha inválida devuelve `400 invalid_range`. Los estados expuestos son `active`, `suspended` y `closed`; `closed` identifica la baja lógica.
- **Proyección y privacidad:** la lista ordena por fecha de registro descendente y desempata por el identificador interno descendente; la página válida sin resultados queda vacía. La cantidad cuenta una sola vez cada reserva en `pending`, `confirmed`, `completed` o `cancelled`, mediante una subconsulta correlacionada dentro de la misma consulta, sin N+1. Un cliente con baja lógica solo expone `id`, `status` y `reservationCount`; `fullName`, `email`, `phone`, `emailVerified` y `registeredAt` se omiten, y las búsquedas nuevas por nombre o correo ocultos no lo encuentran. Un cliente sin baja expone nombre, correo, teléfono disponible, fecha de registro, verificación de correo, estado y cantidad; no se exponen credenciales, tokens ni atributos internos.
- **Corrección de contrato:** el `ClientSummary` del OpenAPI exigía `fullName` y `email` incluso para bajas, lo que contradecía RF-44. Se redujo `required` a `id`, `status` y `reservationCount`, y los campos personales pasaron a ser opcionales y omitibles. Se añadieron `phone` y `emailVerified`, ya previstos por RF-5 y el plan; no se crearon rutas, acciones ni campos ajenos al alcance. El ejemplo de estado `inactive` se sustituyó por `suspended`, alineado con el valor persistido.
- **Cobertura:** `AdminClientTests` cubre `401` anónimo, `403` de cliente, `200` de administrador, filtros parciales de nombre/correo sin distinguir mayúsculas, `id` y `status` exactos, rango de registro inclusivo en hora de Perú, combinación AND, paginación con página vacía, orden y desempate, conteo único de reservas en los cuatro estados, detalle por UUID público, `404` para inexistente o cuenta no cliente, estados `active`/`suspended`/`closed` y baja lógica con solo identificador, estado y cantidad. No se cubren exportación CSV de clientes ni pantalla administrativa.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 43 de integración aprobadas (57 total) con el runner in-process de xUnit v3. `dmgotravel_it` se recrea por ejecución; no se creó migración. OpenAPI parseado con Python 3.14, PyYAML 6.0.3 y `jsonschema` 4.25.1: 82 rutas, 92 operaciones, 92 ejemplos y 0 errores de validación.
- **Frontera:** no se implementaron exportación CSV de clientes, pantalla administrativa, edición, desactivación, reactivación, cambio de roles, pagos o cancelaciones desde clientes, migraciones, triggers de inmutabilidad, retención programada de auditoría, catálogo oficial de acciones ni auditoría de nuevos módulos. RF-5 queda cubierto para los campos disponibles en el contrato corregido; la exportación CSV de clientes mantiene pendientes RF-44 en su parte CSV, RF-55/RF-56 y la matriz de fórmulas. RF-25 sigue pendiente porque no existen filas de auditoría de reservas, pagos, eventos o notificaciones que permitan reconocer relaciones. No se integraron Culqi, Resend ni R2; el OpenAPI sigue sin ratificación.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos. RF-3-RF-8 y RF-44-RF-54 quedan cubiertos en el camino implementado; la exportación CSV de clientes, la pantalla administrativa y RF-25 siguen pendientes.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 249 identificadores DEC (247 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.671 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.

## DEC-250 - Exportación CSV de clientes

- **Fecha de registro:** 2026-11-16.
- **Continuidad:** «continua» después de DEC-249 y la preparación del bloque de exportación se interpreta como autorización para implementar la exportación CSV administrativa de clientes de 010, dentro de RF-27, RF-29-RF-31, RF-42-RF-45, RF-47 y RF-53-RF-59. No autoriza pantalla administrativa, edición/desactivación/reactivación, proveedores reales, catálogo oficial de acciones, auditoría de nuevos módulos, commits ni push.
- **Entregable:** `POST /api/v1/admin/exports/clients` (`admin.exports.clients`) y reutilización de `GET /api/v1/admin/exports/{id}`/`GET /api/v1/admin/exports/{id}/download` (`admin.exports.get`/`admin.exports.download`); `CreateClientsExportCommand`, `ExportClientsRequest`/mapper, `ClientCsvWriter`, `ClientExportRow`/`ClientExportSnapshot`, `CreateClientsAsync`/`GetDownloadAsync` en `IExportRepository`/`ExportRepository`, `CaptureAsync`/`GetCurrentDeletionStatesAsync` en `IAdminClientRepository`/`AdminClientRepository`, `ExportJob.KindClients`/`SnapshotContent`, `GetExportQuery`, `DownloadExportQuery`, `AdminExportEndpoints`; migración `20261116051941_AddExportSnapshot`; `AdminClientExportTests.cs`; corrección del ejemplo de descarga y cabecera `X-Export-Reference-At` en el OpenAPI; [primera-vertical-slice.md v0.9](diseno/primera-vertical-slice.md) y [resultados-pruebas-contrato.md v0.8](diseno/resultados-pruebas-contrato.md).
- **Contrato aplicado:** mismo cuerpo opcional `{ "filters": { ... } }` y `Idempotency-Key` obligatoria; claves `name`, `email`, `id`, `status`, `registeredFrom` y `registeredTo`, con la semántica de la consulta y sin paginación. La captura completa se materializa en una consulta antes de insertar `export_job` y confirmar la transacción de idempotencia; no se recorta por volumen. Un filtro desconocido o de tipo inválido devuelve `400 invalid_filter`; una fecha inválida o un rango invertido devuelve `400 invalid_range`; la solicitud aceptada devuelve `202 accepted` con `referenceAt` y `expiresAt`.
- **CSV y privacidad:** cabecera estable `id,fullName,email,phone,registeredAt,emailVerified,status,reservationCount`, RFC 4180, UTF-8 y neutralización de prefijos de fórmula soportados. Las filas se ordenan por fecha de registro descendente con desempate estable, conservan la cantidad de reservas de la captura y no añaden clientes posteriores. Un cliente con baja lógica solo entrega `id`, `status=closed` y `reservationCount`; `fullName`, `email`, `phone`, `registeredAt` y `emailVerified` quedan vacíos. Si la baja ocurre después de solicitar el CSV, la descarga relee la baja actual y vuelve a renderizar desde una copia estructurada privada para enmascarar la fila antes de entregarla, sin eliminar filas, añadir registros ni refrescar cantidades ordinarias; si el cliente ya no puede verificarse, se enmascara igual. La descarga informa el instante de referencia con `X-Export-Reference-At` en ISO 8601 UTC, conforme a RF-59. La copia estructurada no se expone por la API; el artefacto privado dura 24 horas y solo lo consulta o descarga su solicitante.
- **Cobertura:** `AdminClientExportTests` cubre `401` anónimo, `403` de cliente, `202` de administrador, `GET` de estado, descarga `200 text/csv` con nombre `clientes-*`, cabecera exacta, captura completa con filtros de rango, orden descendente y desempate, fila de baja con solo tres valores, ausencia de PII de la baja, valores con comas, comillas, saltos de línea o prefijos de fórmula, neutralización, CSV vacío con cabecera, cuerpo opcional, idempotencia con replay y conflicto, filtros parciales de nombre/correo sin distinguir mayúsculas, `id`/`status` exactos, rango inclusivo en Perú, `400 invalid_filter`/`invalid_range`, `404` de otro administrador, `410 export_expired`, `403` tras perder la autorización y `X-Export-Reference-At` en la descarga. No cubre la pantalla administrativa ni una matriz completa de fórmulas/hojas de cálculo.
- **Evidencia:** `dotnet build DMGoTravel.slnx --nologo` con 0 errores y 0 advertencias; 11 pruebas de dominio, 3 de arquitectura y 47 de integración aprobadas (61 total) con el runner in-process de xUnit v3. `dmgotravel_it` se recrea por ejecución y aplica la migración; `dmgotravel_dev` recibió `AddExportSnapshot`. OpenAPI parseado con Python 3.14, PyYAML 6.0.3 y `jsonschema` 4.25.1: 82 rutas, 92 operaciones, 92 ejemplos y 0 errores de validación.
- **Frontera:** no se implementaron pantalla administrativa, edición, desactivación, reactivación, cambios de roles, exportación PDF, snapshot PostgreSQL exportado, chunks, worker asíncrono, cuota de capacidad con `503`, enlaces públicos, triggers de inmutabilidad, retención programada de auditoría, catálogo oficial de acciones ni auditoría de nuevos módulos. RF-31 mantiene pendiente la validación contra todas las hojas de cálculo objetivo; RF-25 sigue pendiente porque no existen filas de auditoría de reservas, pagos, eventos o notificaciones que permitan reconocer relaciones. No se integraron Culqi, Resend ni R2; el OpenAPI sigue sin ratificación.
- **Puertas:** API-01-API-08, BT-01-BT-04, MD-01-MD-08, RV-01-RV-05 y las específicas mantienen sus requisitos de prueba, runtime o proveedor abiertos. RF-27, RF-29-RF-31, RF-42-RF-45, RF-47 y RF-53-RF-59 quedan cubiertos en el camino implementado, salvo la matriz completa de fórmulas de RF-31; RF-59 se informa en la aceptación, el estado y la cabecera de descarga. La pantalla administrativa y RF-25 siguen pendientes.
- **Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; sin cambios a RF/HU/RN, criterios o tareas. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. 91 archivos Markdown, 1 OpenAPI YAML, 250 identificadores DEC (248 encabezados en `decisiones.md`; DEC-001/002 en `aclaraciones.md`), 1.674 enlaces locales y 0 rotos, y 0 tablas inconsistentes. No se realizó commit ni push.
