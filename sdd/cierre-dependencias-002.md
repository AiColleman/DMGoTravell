# Cierre funcional de dependencias de 002 Pagos

> **Registro:** 2026-11-01, DEC-170.  
> **Alcance:** 002, 003, 004, 005, 009 y 010 como dependencias de Pagos; contratos con 001/006/007 preservados. No se declara cerrado todo el producto ni se crean specs de 008/011/012 por inferencia.  
> **Estado:** cierre funcional aprobado mediante DEC-171–DEC-173 el 2026-11-01; planificación posterior de 002 en DEC-174, no ejecutada. Quedan comprobaciones técnicas previas a ejecución; no autoriza implementación.

## Autoridad y fuentes

El usuario indica «a que finalizar todas las dudas de una vez», tras aprobar 010 v0.3. Se completa el cierre documental de la cadena activa sin volver a preguntar reglas ya respondidas. Las precisiones nuevas se identifican como decisiones adoptadas por delegación en DEC-170, no como respuestas individuales ni aprobaciones.

Fuentes originales: [RF y RN](../docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [HU](../docs/01-analisis-de-sistema/02-historias-del-usuario.md), [calidad](../docs/01-analisis-de-sistema/04-atributos-de-calidad.md), [restricciones](../docs/01-analisis-de-sistema/05-restricciones.md). Se conservan RF07/RF08/RF09/RF14/RF15/RF23, HU-08/HU-09/HU-16/HU-17/HU-18 y RN-14–RN-18/RN-23/RN-24/RN-28/RN-29.

## Revisión de inconsistencias

1. **Ambigüedades:** inicio/fin de una reserva compuesta, liberación al cancelar una confirmada, conteo de plazos de devolución y alcance de avisos entre specs.
2. **Contradicciones:** tratar un reembolso externo como efecto local atómico; reintentar un resultado desconocido sin verificar; dependencias marcadas pendientes aunque 004/005/010 ya estaban aprobadas.
3. **Casos límite:** alojamiento que empieza antes del tour, finalización antes del último componente, doble liberación, doble devolución y caída simultánea de auditoría y correo.
4. **Constitución y aprobaciones:** no se modifican 001/003/004/005/006/007/010/013 aprobadas ni planes/tareas protegidos; lo nuevo se redacta en borradores o complemento separado. No se convierte una instrucción de cierre en aprobación automática.

## Matriz de cierre funcional

| Pendiente real | Regla de cierre | Destino | Estado |
|---|---|---|---|
| Política de cancelación pagada | Antes del inicio del servicio, motivo obligatorio y devolución total, sin confirmar `pending` manualmente. | DEC-149–DEC-153; [009 v0.2](specs/009-administracion-reservas/spec.md) | Aprobada mediante DEC-172. |
| Inicio y fin con hotel | Inicio más temprano y fin más tardío de componentes contratados; no cancelar desde el inicio ni completar antes de terminar todo. | 009/RF-25–RF-27; DEC-170 | Precisión delegada, no regla atribuida retrospectivamente a 001/007. |
| Servicio realmente finalizado | Administrador lo confirma expresamente después de los períodos contratados; actor y fecha auditados; tiempo transcurrido no completa por sí solo. | 009/RF-26/RF-27/RF-22 | Criterio verificable redactado. |
| Recursos de cancelación confirmada | Liberación única de cupos e inventario de esa reserva, conjunta con cancelación local, caso de devolución y auditoría. | 009/RF-28–RF-31 | Ampliación funcional de 009, no cambio de capacidad en 007. |
| Fallo de devolución posterior | Mantener `cancelled`, recursos liberados y caso abierto; no reactivar ni retener recursos hasta un abono externo. | 009/RF-32; 002 | Definido. |
| Devolución desconocida | Verificar el resultado oficial antes de otro envío; si ya se devolvió, registrar sin repetir; reintento autorizado solo cuando no exista devolución ejecutada/en curso. | [002 v0.7](specs/002-pagos/spec.md), RF-66–RF-69 | Definido; comprobación del proveedor pendiente del plan. |
| Plazo de un día hábil | Revisión/confirmación e inicio administrativo desde detectar el caso; lunes–viernes en Perú sin feriados nacionales; no promesa de abono. | DEC-017/DEC-121; 002/RF-37; 009/RF-16 | Regla previa precisada, sin nuevo plazo. |
| Aviso de cancelación y devolución | Reserva, motivo, cancelación aplicada y estado real de devolución; no prometer abono. | [Complemento 004 v0.1](specs/004-notificaciones/complemento-contratos.md), RF-1–RF-4 | Aprobado mediante DEC-173; base preservada. |
| Fallo persistente de auditoría | Alerta administrativa y evidencia recuperable aunque ese guardado falle; si correo también falla, incidente consultable y sin recursión infinita. | Complemento 004/RF-5–RF-11/RF-16; 010/RF-38–RF-41 | Contrato redactado; prueba técnica previa a ejecución. |
| Correos de verificación/recuperación | Enlace y destinatario definidos por 005, sin secretos en logs/auditoría y sin alterar su política. | Complemento 004/RF-12–RF-15 | Contrato redactado, sin editar 005. |
| Identidad y auditoría marcadas pendientes | 005 v0.1 y 010 v0.3 ya están aprobadas; quedan integración y pruebas, no redefinir su alcance. | DEC-148/DEC-169 | No son preguntas nuevas. |
| Consulta administrativa | Filtros por creación con días completos Perú, todos combinados, correo parcial, IDs exactos, orden estable y vacíos/errores explícitos. | 009/RF-33–RF-37 y precisiones | Definido por delegación, sin copiar mensajes exactos. |

## Referencias obsoletas que no reabren decisiones

- La verificación de correo ya está decidida por DEC-143/005; no debe repetirse la pregunta de ACL-09.
- Google con correo local existente ya está resuelto por DEC-146; no se permite vinculación automática por esa coincidencia.
- Contenido mínimo del comprobante ya está en DEC-136/004; diseño, asunto y adjuntos son detalles del plan.
- Auditoría consultable ya está en 010 aprobada. Las referencias históricas que la llaman pendiente no anulan DEC-169.
- 005 contiene una referencia a administración de usuarios en 009; no se interpreta como autorización: 009 gestiona reservas y 010 clientes de solo lectura. Aprovisionamiento/roles siguen sujetos a 005; perfil/baja pertenece a 008.
- Los textos históricos de 001/006/007/013 y sus planes no se editan para sincronizar estados: este registro y los índices vigentes reflejan las aprobaciones actuales sin alterar archivos protegidos.

## Puertas técnicas: no se cierran con suposiciones

**Base de plataforma posterior — DEC-210 (2026-11-02):** [recomendación técnica v0.1](diseno/base-tecnica.md) propone estructura/familias compatibles con stack, sin modificar contratos de Pagos o planes existentes. BT-01–BT-04 exigen versiones/licencias/arquitectura y configuración reales; la lectura de soporte .NET/Npgsql/FV/Node/Vite/MediatR no demuestra un proveedor financiero, un host siempre activo o el plazo de 60 segundos. Sin scaffold, paquetes instalados o código.

**Modelo de datos posterior — DEC-211 (2026-11-03):** [volumen 1 v0.1](diseno/modelo-datos.md) propone intento activo único, pago externo único, casos/intentos de devolución, snapshots y orden de bloqueo compatibles con los contratos de 002. No demuestra el contrato real de Culqi, la suma ejecutada/en curso ni la recuperación de resultados desconocidos: MD-05 y G-05 siguen abiertas. Sin DDL, migraciones, operaciones financieras o código.

**Identidad/entrega propuesta posterior — DEC-202 (2026-11-02):** [contrato v0.1](contratos/identidad-destinatarios-notificaciones.md) concreta autoridad de destinatarios y pruebas de 004/005/008: propósito de solicitud frente a aviso histórico, carga protegida, idempotencia y admisión frente a invalidación. No publica secretos, renueva pruebas o cambia los avisos financieros de esta cadena. PM-01–PM-04 y M/I/P/A permanecen sin evidencia de cierre; no se ejecutó ningún envío o cambio de identidad.

**Coordinación propuesta posterior — DEC-201 (2026-11-02):** [contrato v0.1](contratos/coordinacion-transaccional.md) concreta cuentas/reservas/finanzas/recursos y commit local frente a efecto externo; CT-01–CT-08, 22 escenarios futuros y PT-01–PT-04 pendientes. No modifica cancelación/devolución, aprobación o planes anteriores. G/V/M/I/P/R/A conservan la exigencia de evidencia; la reconsulta oficial PostgreSQL falló por DNS, no se presenta como una validación exitosa o una puerta cerrada.

**Revisión global posterior — DEC-200 (2026-11-02):** el [análisis transversal v0.1](analisis-consistencia.md) complementa esta matriz con las 13 specs/004-C, 659 criterios locales y 386 tareas pendientes. AT-07–AT-10 detallan compatibilidad de cuenta/finanzas, cortes temporales/recuperación, exportación/privacidad y referencias multimedia; no alteran esta política, planes existentes o estados de tarea, ni declaran resueltas sus puertas técnicas.

Esta matriz no es un plan de implementación. Identifica la evidencia que un plan posterior debe aportar antes de ejecutar cada integración.

**Planificación posterior disponible — DEC-174:** [plan 002 v0.1](specs/002-pagos/plan.md) y [32 tareas pendientes](specs/002-pagos/tasks.md). Sus G-01–G-05 detallan las puertas T-01/T-03 y evidencias de proveedor todavía no cumplidas. La documentación pública consultada identifica límite Yape y condiciones de comisión en devoluciones; no demuestra compatibilidad completa con la devolución total. No se da por superada ninguna puerta por redactar el plan.

**Planificación posterior de Vencimiento — DEC-175:** [plan 003 v0.1](specs/003-vencimiento/plan.md) y [24 tareas pendientes](specs/003-vencimiento/tasks.md). V-01–V-05 concretan validación de Hangfire/PostgreSQL, consistencia, medición de 60 segundos, recuperación y autorización. Las guías oficiales de Hangfire justifican no usar un cron por minuto como única garantía. Todo sigue no ejecutado y los planes anteriores permanecen intactos.

**Planificación posterior de Notificaciones — DEC-176:** [plan 004 v0.1](specs/004-notificaciones/plan.md) y [30 tareas pendientes](specs/004-notificaciones/tasks.md), compartidos por base 22 + complemento 16. M-01–M-06 detallan cuenta/dominio, contrato de 24 horas de idempotencia, eventos verificados, enlaces protegidos e incidentes recuperables; no se cierran con lectura pública. Aceptación del API no equivale a entrega humana y no se habilita un segundo reenvío manual.

**Planificación posterior de Identidad — DEC-177:** [plan 005 v0.1](specs/005-identidad/plan.md) y [32 tareas pendientes](specs/005-identidad/tasks.md), con cobertura de los 30 criterios. I-01–I-06 exigen pruebas de JWT estándar, rotación/revocación, Google, cookies/CSRF y enlaces protegidos; no se crean cuentas, claves o configuración de proveedores. La carpeta de continuidad `Desktop\DMGoTravelll` queda confirmada por el usuario.

**Planificación posterior de Administración — DEC-178 (2026-11-02):** [plan 009 v0.1](specs/009-administracion-reservas/plan.md) y [28 tareas pendientes](specs/009-administracion-reservas/tasks.md), cubren los 37 criterios. R-01–R-06 exigen contratos/horarios históricos, consistencia local, reembolso separado, identidad/avisos/auditoría, pruebas de calidad y autorización. Un timestamp anterior a esperar locks no autoriza una cancelación cuyo inicio ya pasó; tampoco cancelar autoriza por sí solo un envío de dinero. 010 aún requiere su propio plan.

**Planificación posterior de Clientes/auditoría — DEC-179 (2026-11-02):** [plan 010 v0.1](specs/010-clientes-auditoria/plan.md) y [34 tareas pendientes](specs/010-clientes-auditoria/tasks.md), cubren los 59 criterios. A-01–A-06 requieren escritura inmutable, retención/consulta, recuperación externa, captura consistente inicial, capacidad y protección CSV/privacidad/autorización. Las copias temporales no son el historial canónico y sus limpiezas no pueden borrarlo. Quedan planes documentales para toda la cadena aprobada, no pruebas ejecutadas ni autorización de implementación.

| Puerta | Evidencia requerida | Qué no debe suponerse |
|---|---|---|
| T-01 Culqi | Contrato oficial vigente de autenticidad, resultados, consultas, reembolsos, repetición de solicitudes y pruebas de respuestas desconocidas/concurrentes. | Firmas, acuses, soporte de idempotencia o garantía temporal inventados. |
| T-02 Consistencia local | Pruebas de cambio de estado, inventario, caso de devolución y auditoría sin efectos parciales ni sobreventa bajo concurrencia. | Que cancelar localmente revierta un reembolso externo. |
| T-03 Recuperación y avisos | Pruebas de evidencia recuperable tras fallo de auditoría y correo, conservación de resultado real, notificación sin duplicados y consulta administrativa sin recursión. | Que pueda guardarse la alerta solo en el mismo destino que falla. |
| T-04 Parámetros operativos | Reintentos, umbrales/canales, calendarios, remitentes, plantillas, vigencias y configuración segura establecidos en los planes de cada origen. | Máximos o TTL nuevos como si fueran decisiones funcionales aprobadas. |
| T-05 Validación de contratos | Aprobaciones funcionales cumplidas mediante DEC-171–DEC-173; resta validar los contratos técnicos, incluidos 006/007, antes de ejecución. | Que aprobar las specs demuestre la viabilidad de una integración sin pruebas. |

Los contratos comerciales propios de Catálogo/Hoteles no se alteran. Sus contratos técnicos todavía deben validarse para implementar. No se genera código ni se declara un pase a producción.

## Alcance ajeno a esta cadena

**Reemisión planificada posteriormente — DEC-209 (2026-11-02):** [005-C plan propio](specs/005-identidad/plan-reemision-verificacion.md)/[16 tareas pendientes](specs/005-identidad/tasks-reemision-verificacion.md) mantienen verificar correo antes de reserva/pago. Compatibilidad con emisión inicial, generación/consumo/replay, entrega/secretos y carreras requieren RV-01–RV-05; no altera Pagos, las 32 tareas base de 005 o ningún documento aprobado/plan anterior. Sin operaciones reales o código; registros «sin plan» siguientes son antecedentes de la aprobación.

**Reemisión aprobada posteriormente — DEC-208 (2026-11-02):** [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md) aprobado con 18 criterios, sin planificación nueva todavía. No cambia verificar correo antes de reservar/pagar ni amplía la cadena de Pagos a operaciones/código reales. Bases/planes/tasks preservados; integración específica de identidad/entrega conserva su evidencia pendiente. El registro de borrador DEC-205–DEC-207 siguiente es antecedente de esta aprobación.

**Reemisión de verificación posterior — DEC-205–DEC-207 (2026-11-02):** [005-C v0.1](specs/005-identidad/complemento-reemision-verificacion.md), borrador de 18 criterios sin aprobar/planificar, permite pedir otro enlace propio antes/después de vencer con solo último válido. No altera la obligación vigente de verificar correo antes de reservar/pagar, la política de Pagos, las bases 004/005 o sus planes/tasks. No se da por cubierto en los backlogs existentes o contratos propuestos; integración y aprobación propias pendientes.

**Consulta/exportación propuesta posterior — DEC-204 (2026-11-02):** [contrato v0.1](contratos/consultas-exportacion-privacidad.md) concreta captura privada coherente, fechas propias de hechos y privacidad/entrega por CSV de clientes/auditoría o PDF de 011. No modifica Pagos ni ejecuta conciliación/reparación ni recalcula hechos para completar cifras. PX-01–PX-04 y A/Q/I/P mantienen evidencia pendiente de lectores/snapshot/serialización/licencia/privacidad/capacidad; sin datos consultados/exportados o archivo real generado.

**Contrato multimedia posterior — DEC-203 (2026-11-02):** [propuesta v0.1](contratos/multimedia-publicacion-referencias.md) concreta primera publicación, referencias protegidas y limpieza recuperable de 012/consumidores. No modifica la cadena de Pagos ni convierte fotos en documentos privados de otros flujos ni autoriza acceso a datos/objetos reales. Ocho contratos y 18 escenarios futuros con PA-01–PA-04 pendientes, sin ratificación/implementación ni cierre de U/ACL-13/ACL-17.

**Estado posterior de Multimedia — 2026-11-02, DEC-197/DEC-199:** [012 v0.1](specs/012-multimedia/spec.md) aprobada con 32 criterios; [plan v0.1](specs/012-multimedia/plan.md)/[30 tareas pendientes](specs/012-multimedia/tasks.md). Conserva acuerdos de 006/007/013 y concreta acceso de foto publicada/principal elegida. U-01–U-06 requieren admisión/runtime, R2 privado/lectura backend, referencias transaccionales/fence, limpieza/recuperación, seguridad/capacidad y autorización; 404 no concluye PUT en vuelo. El acceso publicitario no publica documentos privados de otros flujos; ningún archivo real operado.

**Estado posterior de Reportes — 2026-11-02, DEC-196/DEC-198:** [011 v0.1](specs/011-reportes/spec.md) aprobada con 38 criterios; [plan v0.1](specs/011-reportes/plan.md)/[28 tareas pendientes](specs/011-reportes/tasks.md). Q-01–Q-06 requieren fechas/datos oficiales de Pagos y reservas, tres poblaciones distintas bajo copia coherente durable, licencia/fuentes/runtime PDF, entrega completa/privada y capacidad/autorización. PDFsharp reciente no se presume MIT por sus ejemplos. No modifica operaciones/reglas de Pagos ni ejecuta consultas/exportaciones reales.

**Estado posterior de Perfil — 2026-11-02, DEC-186/DEC-187:** [008 v0.1](specs/008-perfil/spec.md) aprobada con 37 criterios y posterior [plan v0.1](specs/008-perfil/plan.md)/[30 tareas pendientes](specs/008-perfil/tasks.md). Correo y baja conservan las reglas aprobadas de Pagos sin modificar sus documentos/planes; P-01–P-06 requieren demostrar barrera por cuenta, propósitos de aviso, revocación/privacidad y compatibilidad antes de implementar.

008 Perfil/baja, 011 Indicadores/reportes y 012 Multimedia tienen sus propias specs aprobadas y planificación no ejecutada; no se aprobaron por inferencia de la orden de cierre de Pagos. El «si» posterior a enumerar expresamente 011 v0.1 y 012 v0.1 se registra por separado en DEC-196/DEC-197; sus planes en DEC-198/DEC-199. Las dependencias técnicas siguen abiertas. Los pendientes condicionados a futuras funcionalidades —por ejemplo, fracciones de céntimo— tampoco bloquean el alcance de pagos ya definido.

## Aprobaciones registradas: ronda funcional cerrada

1. **002 Pagos v0.7:** 70 criterios; aprobada el 2026-11-01, DEC-171.
2. **009 Administración de reservas v0.2:** 37 criterios; aprobada el 2026-11-01, DEC-172.
3. **Complemento de 004 v0.1:** 16 criterios propios; aprobado el 2026-11-01, DEC-173. La base 004 v0.1 sigue aprobada e intacta.

La instrucción de finalizar dudas permitió redactar los cierres; el «si» posterior a la pregunta que enumeró los tres documentos constituye su aprobación expresa. Las aprobaciones previas de 003/005/010 siguen vigentes. La ronda funcional se cerró sin implementación; después se crearon plan/tasks de 002/003/004+complemento/005/009/010 mediante DEC-174–DEC-179, todos no ejecutados. Las puertas técnicas y el alcance ajeno de 008/011/012 permanecen visibles; tener planificación completa no habilita producción o código por sí solo.

**Contrato de API posterior - 2026-11-03, DEC-212:** [contrato v0.1](diseno/contrato-api.md) propone la superficie HTTP de pagos, reservas, devoluciones, clientes, auditoría y reportes sin alterar los cierres funcionales. Los webhooks Culqi/Resend, la idempotencia, el `404` para recursos ajenos y las descargas privadas siguen sujetos a API-01-API-08 y a los contratos reales de proveedor. No se declara ningún endpoint desplegado ni se cierra G-01-G-05, A-01-A-06, Q-01-Q-06 o las puertas previas.

**Validación del contrato posterior - 2026-11-03, DEC-213:** [revisión documental v0.1](diseno/validacion-contrato-api.md) confirma que la superficie de pagos, reservas, devoluciones, clientes, auditoría y reportes no omite una capacidad aprobada y mantiene la confirmación de pago, el vencimiento y la liberación como puertos internos. No cierra G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 o las puertas previas; no se ejecutaron pagos, webhooks, exportaciones o consultas reales.

**Plan de API-01 posterior - 2026-11-03, DEC-214:** [plan v0.1](diseno/plan-api-01.md) fija la fuente OpenAPI 3.1 y la matriz CT-01-CT-12 para la superficie de pagos, reservas, devoluciones, clientes, auditoría y reportes. No creó YAML, código o pruebas ejecutables; no cierra G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 o las puertas previas.

**Borrador OpenAPI posterior - 2026-11-03, DEC-215:** [dmgo-api-v1.yaml v0.1.0-draft](diseno/openapi/dmgo-api-v1.yaml) documenta la superficie de pagos, reservas, devoluciones, clientes, auditoría, exportaciones y reportes en un OpenAPI 3.1 no normativo. La validación sintáctica no ejecuta webhooks, pagos, exportaciones o consultas reales ni cierra G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 o las puertas previas.

**Matriz de cierre técnico posterior - 2026-11-04, DEC-216:** [cierre-diseno-tecnico.md v0.1](diseno/cierre-diseno-tecnico.md) clasifica las puertas API/BT/MD/RV y las específicas por evidencia, bloqueo y próximo artefacto. Mantiene abiertas G-01-G-05, A-01-A-06, Q-01-Q-06 y las puertas de pagos, exportaciones y reportes; no ejecuta webhooks, pagos, consultas o exportaciones reales ni declara cerrado lo que exige runtime o proveedor.

**Revisión OpenAPI posterior - 2026-11-04, DEC-217:** [revision-openapi.md v0.1](diseno/revision-openapi.md) confirma CT-01 documental para las 92 operaciones y añade ejemplos ficticios de reserva, pago y error. No ejecuta pagos, webhooks, exportaciones o consultas reales; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Matriz de operaciones posterior - 2026-11-04, DEC-218:** [matriz-operaciones-openapi.md v0.1](diseno/matriz-operaciones-openapi.md) recorre las 92 operaciones por sección, con seguridad, idempotencia, `If-Match`, éxito y errores declarados. No ejecuta pagos, webhooks, exportaciones o consultas reales; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Política de versión/propiedad/deprecación posterior - 2026-11-04, DEC-219:** [politica-versionado-api.md v0.1](diseno/politica-versionado-api.md) propone SemVer, `/api/v1`, clasificación de cambios y ventana de deprecación de 90 días. No ejecuta pagos, webhooks, exportaciones o consultas reales; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote N - 2026-11-09, DEC-238:** [ejemplos-lote-n.md v0.1](diseno/ejemplos-lote-n.md) añade 22 ejemplos de error en 11 componentes, con 319 referencias en 90 operaciones y 919 ejemplos efectivos en 92 operaciones. No crea handlers, respuestas reales, códigos nuevos ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote O - 2026-11-10, DEC-240:** [ejemplos-lote-o.md v0.1](diseno/ejemplos-lote-o.md) añade 17 ejemplos de error específicos en 13 componentes, sustituye 17 referencias genéricas en 14 operaciones y acumula 39 ejemplos de error en 24 componentes y 860 ejemplos efectivos en 92 operaciones. No crea handlers, respuestas reales, códigos nuevos ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote P - 2026-11-11, DEC-241:** [ejemplos-lote-p.md v0.1](diseno/ejemplos-lote-p.md) añade 19 ejemplos de error específicos en 14 componentes, sustituye 17 referencias genéricas en 15 operaciones y acumula 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos en 92 operaciones. No crea handlers, respuestas reales, códigos nuevos ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote M - 2026-11-09, DEC-237:** [ejemplos-lote-m.md v0.1](diseno/ejemplos-lote-m.md) añade 18 bloques para autenticación y perfil, con 4 respuestas `204` y 2 `302` sin cuerpo. Acumula 139 bloques en 86 operaciones con ejemplos de cuerpo y las 92 operaciones con respuesta de éxito documentada; no crea handlers, sesiones, tokens, correos, cuentas ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote L - 2026-11-09, DEC-236:** [ejemplos-lote-l.md v0.1](diseno/ejemplos-lote-l.md) añade 12 bloques para reportes y media. Acumula 121 bloques en 77 operaciones con ejemplos; no crea handlers, reportes, PDF ni imágenes reales, ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote K - 2026-11-09, DEC-235:** [ejemplos-lote-k.md v0.1](diseno/ejemplos-lote-k.md) añade 10 bloques para clientes, auditoría y exportaciones. Acumula 109 bloques en 70 operaciones con ejemplos; no crea handlers, clientes, auditoría ni exportaciones reales, ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote J - 2026-11-09, DEC-234:** [ejemplos-lote-j.md v0.1](diseno/ejemplos-lote-j.md) añade 12 bloques para imágenes de hotel/habitación y propuestas de alojamiento. Acumula 99 bloques en 62 operaciones con ejemplos; no crea handlers, imágenes/hoteles/habitaciones/propuestas ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote I - 2026-11-09, DEC-233:** [ejemplos-lote-i.md v0.1](diseno/ejemplos-lote-i.md) añade 10 bloques para imágenes de catálogo, habitaciones e inventario. Acumula 87 bloques en 56 operaciones con ejemplos; no crea handlers, imágenes/habitaciones/inventario ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote H - 2026-11-09, DEC-232:** [ejemplos-lote-h.md v0.1](diseno/ejemplos-lote-h.md) añade 10 bloques para salidas, precios e itinerarios. Acumula 77 bloques en 51 operaciones; no crea handlers, salidas/precios ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote G - 2026-11-07, DEC-231:** [ejemplos-lote-g.md v0.1](diseno/ejemplos-lote-g.md) añade 10 bloques para movilidad administrativa. Acumula 67 bloques en 46 operaciones; no crea handlers, movilidad/imágenes ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote F - 2026-11-07, DEC-230:** [ejemplos-lote-f.md v0.1](diseno/ejemplos-lote-f.md) añade 14 bloques para catálogo administrativo y hoteles. Acumula 57 bloques en 39 operaciones; no crea handlers, ofertas/hoteles ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote E - 2026-11-06, DEC-229:** [ejemplos-lote-e.md v0.1](diseno/ejemplos-lote-e.md) añade 10 bloques para webhooks y notificaciones. Acumula 43 bloques en 29 operaciones; no crea handlers, webhooks ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote D - 2026-11-06, DEC-228:** [ejemplos-lote-d.md v0.1](diseno/ejemplos-lote-d.md) añade 11 bloques para administración de reservas y devoluciones. Acumula 33 bloques en 24 operaciones; no crea handlers, devoluciones ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote C - 2026-11-06, DEC-227:** [ejemplos-lote-c.md v0.1](diseno/ejemplos-lote-c.md) añade 9 bloques para reservas y pagos. Acumula 22 bloques en 16 operaciones; no crea handlers, pagos ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote B - 2026-11-05, DEC-226:** [ejemplos-lote-b.md v0.1](diseno/ejemplos-lote-b.md) añade 6 bloques de respuesta para catálogo, hoteles y movilidad. Acumula 13 bloques en 10 operaciones; no crea handlers ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Ejemplos OpenAPI lote A - 2026-11-05, DEC-225:** [ejemplos-lote-a.md v0.1](diseno/ejemplos-lote-a.md) añade 7 bloques de ejemplo en 4 operaciones de identidad/perfil. No crea handlers ni pruebas; CT-12 sigue parcial; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Paquete de ratificación posterior - 2026-11-05, DEC-224:** [paquete-ratificacion.md v0.1](diseno/paquete-ratificacion.md) reúne DEC-219–DEC-223 y explicita qué falta aprobar. No ratifica propuestas ni crea código, SQL, migraciones o pruebas; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Plan MD-01/MD-08 posterior - 2026-11-05, DEC-223:** [plan-md-01-md-08.md v0.1](diseno/plan-md-01-md-08.md) detalla convenciones físicas, tipos, identificadores y retención. No crea SQL, migraciones o pruebas; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Plan BT-01 posterior - 2026-11-05, DEC-222:** [plan-bt-01.md v0.1](diseno/plan-bt-01.md) detalla cuatro proyectos, dependencias y BT-01-A01–A10. No crea solución, código o pruebas; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Plan de pruebas posterior - 2026-11-05, DEC-221:** [plan-pruebas-contrato.md v0.1](diseno/plan-pruebas-contrato.md) detalla CT-02–CT-12 con casos, evidencia y PT-01–PT-06. No ejecuta pruebas, pagos, webhooks, exportaciones o consultas reales; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.

**Decisiones transversales posteriores - 2026-11-04, DEC-220:** [decisiones-transversales-api.md v0.1](diseno/decisiones-transversales-api.md) propone errores, idempotencia/concurrencia y paginación/tiempo/dinero uniformes. No ejecuta pagos, webhooks, exportaciones o consultas reales; G-01-G-05, A-01-A-06, Q-01-Q-06, API-01-API-08 y las puertas previas siguen abiertas.
