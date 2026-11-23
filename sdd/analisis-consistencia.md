# Análisis transversal de consistencia y dependencias

> **Fecha:** 2026-11-02. **Versión:** 0.1. **Registro:** DEC-200.  
> **Alcance:** revisión documental posterior a las aprobaciones y planes de 001–013 y complemento 004.  
> **Estado:** análisis realizado sobre documentos; **ninguna tarea de implementación ejecutada**. No es una spec, ADR, cambio de plan o autorización de código/operaciones reales.

## 1. Resultado y límites de la revisión

La base tiene **13 specs aprobadas y un complemento aprobado**, con 13 planes/backlogs —004 comparte el suyo—, **659 criterios locales y 386 tareas pendientes**. Los 24 RF originales, 23 HU y 30 RN tienen entradas y destinos en [trazabilidad](trazabilidad.md). Esto acredita presencia documental, no equivalencia semántica exhaustiva, implementación, resultados de prueba o preparación productiva.

No se detectó un identificador original sin destino en esas tablas ni numeración local duplicada/saltada. Persisten condiciones técnicas explícitas y tensiones de lectura que requieren integrar contratos, no reabrir automáticamente las entrevistas funcionales. No se declara «cero contradicciones» por existir aprobaciones.

Se revisaron las specs, complementos, planes y tareas de [índice vigente](specs/README.md), [constitución](constitution.md), [aclaraciones](aclaraciones.md), [decisiones](decisiones.md), [matriz de Pagos](cierre-dependencias-002.md) y las fuentes originales de [RF/RN y HU→RF](../docs/01-analisis-de-sistema/03-requisitos-funcionales.md), [historias](../docs/01-analisis-de-sistema/02-historias-del-usuario.md) y [calidad](../docs/01-analisis-de-sistema/04-atributos-de-calidad.md). Procedencia completa en [fuentes](fuentes.md).

La revisión sigue cuatro bloques: ambigüedades, contradicciones/tensiones entre requisitos, casos límite sin evidencia y conflictos con restricciones. Se conserva lo aprobado; no se diseñan aquí nuevas soluciones, parámetros o políticas.

## 2. Inventario verificable

| Spec | Versión aprobada | Criterios locales | Tareas pendientes | Dependencias técnicas principales |
|---|---|---:|---:|---|
| [001 Reservas](specs/001-reservas/spec.md) | 0.13 | 105 | 40 | 005/006/007/002/003/010; concurrencia y datos históricos. |
| [002 Pagos](specs/002-pagos/spec.md) | 0.7 | 70 | 32 | 001/003/004/005/006/007/009/010; G-01–G-05. |
| [003 Vencimiento](specs/003-vencimiento/spec.md) | 0.1 | 20 | 24 | 001/002/004/006/007/010; V-01–V-05. |
| [004 Notificaciones](specs/004-notificaciones/spec.md) | 0.1 | 22 | 30 compartidas | Hechos de origen, 005/008/009/010; M-01–M-06. |
| [004-C Complemento](specs/004-notificaciones/complemento-contratos.md) | 0.1 | 16 | Incluidas en 004 | Contratos de identidad, cancelación y fallo de auditoría. |
| [005 Identidad](specs/005-identidad/spec.md) | 0.1 | 30 | 32 | 004/008/010, Google y navegador; I-01–I-06. |
| [006 Catálogo](specs/006-catalogo/spec.md) | 0.46 | 103 | 30 | 001/005/007/010/012; puertas del plan §10. |
| [007 Hoteles](specs/007-hoteles/spec.md) | 0.2 | 58 | 30 | 001/005/006/010/012; puertas del plan §10. |
| [008 Perfil](specs/008-perfil/spec.md) | 0.1 | 37 | 30 | 001/002/003/004/005/009/010; P-01–P-06. |
| [009 Administración](specs/009-administracion-reservas/spec.md) | 0.2 | 37 | 28 | 001/002/004/005/006/007/010; R-01–R-06. |
| [010 Clientes/auditoría](specs/010-clientes-auditoria/spec.md) | 0.3 | 59 | 34 | Orígenes críticos, 004/005/008/009; A-01–A-06. |
| [011 Reportes](specs/011-reportes/spec.md) | 0.1 | 38 | 28 | 001/002/005/006/007/008/009/010; Q-01–Q-06. |
| [012 Multimedia](specs/012-multimedia/spec.md) | 0.1 | 32 | 30 | 005/006/007/010/013, R2; U-01–U-06. |
| [013 Movilidad](specs/013-movilidad-informativa/spec.md) | 0.3 | 32 | 18 | 005/010/012; puertas del plan §8. |
| **Total sin duplicar 004** | | **659** | **386** | **0 tareas ejecutadas** |

Los 643 criterios de las 13 specs y los 16 de 004-C se cuentan separadamente. Los antecedentes `acuerdos.md` de 006/007 no se añaden de nuevo. `RF-n` es local a cada spec; no son 659 RF originales. 013, descuentos/filtros y CSV mantienen su procedencia como ampliaciones, sin inventar RF25/HU-24.

Reservas conserva IDs de tarea `T001`–`T040`; los demás usan `T002-01`, etc. Una referencia debe incluir su documento/spec para no confundir, por ejemplo, `001/tasks.md:T002` con una tarea de Pagos. No se renumeran backlogs por esa diferencia histórica.

## 3. Hallazgos en cuatro bloques

### 3.1. Ambigüedades técnicas aún abiertas

1. **AT-01 — Baseline de solución/versiones y configuración sin cerrar.** ACL-18 conserva diferencias de nombres/capas entre F00 y F12; ACL-20 conserva orígenes, secretos, privilegios y recuperación. Tener planes no acredita versiones compatibles de runtime, ORM, jobs y SDK, ni una configuración real. **Estado:** pendiente técnico, no duda funcional nueva. **Evidencia:** [001 plan §9](specs/001-reservas/plan.md), [013 plan §8](specs/013-movilidad-informativa/plan.md), I-01/I-03 y V-01.

2. **AT-02 — Fechas e identidad de hechos financieros requieren contrato de origen.** 011 distingue creación de reserva, operación confirmada de cobro y ejecución confirmada de devolución; la fecha de recepción/recuperación no las sustituye. No se ha probado que los lectores/columnas/proveedor aporten todos esos datos de forma verificable. **Estado:** Q-01/Q-02 y G-01/G-05 abiertas. **Evidencia:** 011/RF-7/RF-18/RF-22/RF-36; [011 plan §§2–4](specs/011-reportes/plan.md), [002 plan §§3/7](specs/002-pagos/plan.md).

3. **AT-03 — Métricas y parámetros no son aceptación medida.** AC01 contiene un objetivo aproximado, no un p95/SLA cerrado; ACL-15 no fija conjunto/carga y AC12/ACL-20 no demuestran recuperación. TTL, paginación, lotes, retries, 5 MB propuestos como 5.000.000 bytes y presupuestos de decodificación son propuestas trazadas en planes, no respuestas nuevas del usuario o mediciones. **Estado:** pendientes del entorno/capacidad correspondiente. **Evidencia:** [constitución §5](constitution.md), puertas de 006/007, Q-05 y U-01/U-05.

### 3.2. Contradicciones literales y tensiones de alcance

4. **AT-04 — Tokens en correo: lectura literal aislada incompatible.** 005/RF-25 excluye tokens de correos, mientras 005/RF-6/RF-22 requiere verificación/restablecimiento por correo. La entrega del enlace autorizado al destinatario previsto ya está acotada en 004-C/RF-12–RF-15 y sus precisiones; [004 plan §2](specs/004-notificaciones/plan.md) explicita esa lectura conjunta. **Estado:** tensión textual ya delimitada por contrato aprobado, sin reescribir 005; M-04/I-04 requieren evidencia de que no se filtra token bruto, enlace secreto en auditoría o credenciales a administradores. No es autorización general de enviar secretos por correo.

5. **AT-05 — Destinatario vigente genérico frente a los propósitos de 008.** [004 plan §6](specs/004-notificaciones/plan.md) retiene el envío si cambió el correo; 008 exige verificar el solicitado y avisar al anterior y al nuevo después de aplicar. Aplicar la regla genérica sin distinguir propósito suprimiría avisos requeridos. [008 plan §8](specs/008-perfil/plan.md) ya identifica la compatibilidad pendiente y la autoridad del hecho/solicitud para esos destinos. **Estado:** contrato de integración pendiente P-03/M-04, no una elección funcional por repetir ni permiso de destinatario libre. Planes previos intactos.

6. **AT-06 — Limpieza de 012 frente al alcance restringido de 013.** `013/tasks.md:T013-06` dice no añadir job de limpieza/retry automático; 012/RF-23 y su plan describen limpieza compartida recuperable. La exclusión de 013 no autoriza implementar un job propio en Movilidad ni elimina el alcance aprobado de 012. **Estado:** ámbitos documentales distinguibles; integración U-03/U-04 pendiente, sin cambio a carga/reemplazo, galería o retry en UI de 013. **Evidencia:** [013 tasks](specs/013-movilidad-informativa/tasks.md), [012 plan §§4/7](specs/012-multimedia/plan.md).

Las menciones históricas «dependencia sin spec», «borrador» o «sin plan/tareas» en documentos protegidos no representan el estado vigente. [Índice](specs/README.md) y DEC posteriores acreditan las aprobaciones actuales, **pero no sustituyen la validación técnica** que esas frases también exigían. No se editaron archivos aprobados para actualizar su historia.

### 3.3. Casos límite sin evidencia de integración

Los resultados funcionales siguientes están descritos; «sin cubrir» aquí significa **sin prueba de implementación**, no un hueco que permita inventar comportamiento.

7. **AT-07 — Cuenta, reservas y finanzas concurrentes.** La barrera por cuenta de 008 precede al orden reserva→pago→recursos de 002, pero todos los escritores deben participar. Deben distinguirse nueva operación cliente y registro de un hecho financiero ya ocurrido después de baja; no puede perderse este último por cuenta inactiva. **Estado:** P-02/P-04, I-05 y R-02 pendientes. **Evidencia:** [008 plan §6/§9](specs/008-perfil/plan.md), [002 plan §6](specs/002-pagos/plan.md). No declarar validada ausencia de bloqueos por un `NOT EXISTS` aislado.

8. **AT-08 — Cortes temporales, reembolso y fallos simultáneos.** Igualdad a 15/20, espera de locks, rechazo definitivo en tolerancia, liberación única, límite de 60 segundos y reembolso desconocido requieren pruebas conjuntas; correo o auditoría caídos no revierten hechos externos ni permiten repetir dinero. La evidencia de incidente no aparece en una base totalmente caída solo por tener outbox. **Estado:** G-05/V-02–V-04/M-05/A-03/R-02–R-04 pendientes. **Evidencia:** [matriz de Pagos](cierre-dependencias-002.md), planes 002/003/004/009/010. Las restricciones Culqi sobre total devuelto/Yape siguen sin validación de cuenta/proveedor.

9. **AT-09 — Capturas de exportación y privacidad no intercambiables.** 010/RF-56–RF-59 exige máscara actual de baja y permiso actual para CSV; 011/RF-28–RF-33 excluye identidad de cliente desde el origen y conserva el resultado consultado en PDF. Reutilizar un helper genérico podría filtrar PII o cambiar filas/importes históricos permitidos. **Estado:** A-04/A-05, P-05 y Q-02/Q-03/Q-05 pendientes. **Evidencia:** [010 plan §§5/6](specs/010-clientes-auditoria/plan.md), [011 plan §§4/6](specs/011-reportes/plan.md). Un timestamp no conserva un resultado durable para un worker posterior.

10. **AT-10 — Publicación, referencias y escrituras multimedia inciertas.** Borrador no es foto publicada; desactivar no revoca lectura de foto ya publicada; ausencia de referencias no se infiere de un origen caído. PUT en vuelo tras un 404, fence/lease y asociación concurrente pueden invalidar una limpieza aparente. **Estado:** U-02–U-04 y contratos de 006/007/013 pendientes. **Evidencia:** 012/RF-9–RF-11/RF-21–RF-26; [012 plan §§5–8](specs/012-multimedia/plan.md). Ninguna petición real a R2 fue ejecutada en esta revisión.

### 3.4. Conflictos con la constitución y límites de autorización

11. **AT-11 — Alternativa de validación no ratificada.** ACL-19 conserva la diferencia entre «FluentValidation o equivalente» de RC08 y el stack obligatorio. Los planes que nombran FluentValidation no acreditan autorización para sustituirlo o eliminar de la fuente su alternativa. **Estado:** pendiente si se propone sustitución; no se identificó aquí una modificación de stack o una implementación que incumpla. **Evidencia:** [constitución §§4/7](constitution.md), ACL-19.

12. **AT-12 — Licencias/runtime y servicios externos no se aprueban por referencia.** Q-04 exige biblioteca PDF/versión/fuentes compatibles; U-01 exige decodificador seguro/mantenido/compatible. La lectura pública anterior sobre PDFsharp no autoriza AGPL, compra de licencia, publicación de código o elección de dependencia obsoleta; tampoco aprobar el plan de R2 configura un bucket seguro. **Estado:** Q-04/U-01/U-02 pendientes. **Evidencia:** [011 plan §5](specs/011-reportes/plan.md), [012 plan §§3/8](specs/012-multimedia/plan.md), [fuentes](fuentes.md). No se repitió investigación externa o instaló paquetes en esta revisión.

13. **AT-13 — Planificación completa no habilita ejecución.** Los planes presuponen monolito, PostgreSQL, proveedores acordados, secretos fuera del repo y no archivos locales durables. Un «continua» no autoriza código, migraciones, seed, configuración, pruebas contra datos/cuentas reales, DNS o producción. **Estado:** barrera de autorización vigente en todas las familias de puertas; no se detectó cambio fuera de `sdd/`. **Evidencia:** [README: alcance autorizado](README.md), constitución §§1/6 y últimas puertas de planes. No hay conflicto arquitectónico implementado que pueda verificarse sin implementación.

## 4. Relaciones de bloqueo existentes

Esta tabla consolida dependencias de planes; **no fija orden de entrega, fechas, una nueva arquitectura o un backlog adicional**. Los ciclos entre módulos son contratos que necesitan validación conjunta, no motivo para declarar lista una integración con dobles.

| Frontera existente | Participantes | Evidencia requerida antes de habilitarla | Ubicación de trabajo pendiente |
|---|---|---|---|
| Base técnica/seguridad | Todos | Compatibilidad de versiones, estructura, permisos, orígenes, secretos, respaldo/restauración | ACL-17–ACL-20; fases de contratos de los backlogs. |
| Identidad, correo y auditoría | 004/005/008/010 | Propósitos/destinos, enlaces protegidos, revocación actual, evidencia recuperable | M-04/M-05, I-03–I-05, P-01/P-03/P-05, A-02/A-03. |
| Imagen y publicación | 005/006/007/010/012/013 | Admisión antes de R2, principal/activación, preview privado, referencias y limpieza | U-01–U-05, puertas ACL-13/ACL-17 de consumidores. |
| Reserva e inventario | 001/005/006/007/008/010 | Último cupo/habitación, snapshot histórico, barrera de cuenta, rollback sin reserva parcial | 001/T003–T005/T032, P-02, puertas de 006/007. |
| Pago, vencimiento y cancelación | 001/002/003/004/008/009/010 | 15/20 excluyentes, 60 segundos, liberación única, reembolso total y verificación antes de retry | G/V/R, P-04, M-05, A-03. |
| Consultas/exportación | 005/008/010/011 y lectores históricos | Captura coherente/durable, privacidad por tipo, archivo completo y permiso vigente | A-04/A-05, Q-01–Q-05 y matrices de sus tareas. |

No se da por cerrado un punto mediante los números de esta tabla; debe enlazarse evidencia real en su backlog cuando haya actividad autorizada. Las tareas existentes conservan sus IDs, dependencias, casillas y aceptación.

## 5. Comprobaciones documentales y preservación

- Se comprobó presencia de `spec.md`, `plan.md` y `tasks.md` en las 13 carpetas y del complemento 004; no se crearon nuevas funcionalidades.
- Los 13 rangos RF locales son consecutivos y únicos; 004-C conserva su propio RF-1–RF-16. La comprobación de prefijos EARS no sustituye revisión de significado o prueba de cada criterio.
- Se contaron casillas de tarea con y sin formato en negrita; 001 conserva 40, no cero por tener otro formato de ID. El total es 386 pendientes y ninguna marcada ejecutada.
- Se cotejaron las tablas RF/HU/RN con los identificadores originales, sin renumerarlos o cambiar las fuentes. HU-20 se define como encabezado y sección propia en F02, no como fila de tabla: se incluyó al comprobar las 23 historias.
- Huella agregada de preservación al comenzar: `CC61D4E68C3738DEAFB42CC6AF13945B9F40AD1C77FA72A9CF50BC019FEF9981`. Algoritmo: SHA-256 de las rutas relativas ordenadas y sus bytes, separados por NUL, de todos los Markdown de `sdd/specs/` **excepto su README**. Permite comprobar que esta actividad no cambia specs, planes, tareas, antecedentes o plantilla; no es firma digital o prueba de estado productivo.
- **Resultado de cierre:** 813 enlaces locales comprobados, ninguno roto; DEC-200 única y ningún encabezado DEC duplicado. La huella de los 43 archivos protegidos coincide con la inicial; las 386 casillas siguen pendientes. Estas son verificaciones documentales, no tests de la aplicación.
- No se consultaron clientes, reservas, base de datos o proveedores, no se generaron PDFs ni se cargaron/borraron imágenes reales.

## 6. Conclusión

**La organización funcional y sus planes/backlogs están documentados; la habilitación técnica sigue pendiente.** Esta revisión identifica los puntos de compatibilidad y la evidencia faltante sin invalidar aprobaciones, cerrar puertas por redacción o ampliar el alcance. Para continuar con cambios técnicos hace falta su autorización específica; las decisiones de negocio ya respondidas no se vuelven a entrevistar por tener integraciones pendientes.
