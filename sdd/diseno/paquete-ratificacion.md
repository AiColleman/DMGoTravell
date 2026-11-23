# Paquete de ratificación documental v0.1

> **Fecha:** 2026-11-05 (actualizado 2026-11-10). **Versión:** 0.1. **Registro:** DEC-224 / DEC-239.  
> **Objeto:** propuestas DEC-219, DEC-220, DEC-221, DEC-222 y DEC-223; [cierre del diseño técnico](cierre-diseno-tecnico.md), DEC-216.  
> **Estado:** **paquete documental RATIFICADO mediante DEC-239**. Fija las referencias normativas documentales; no autoriza implementación física sin autorización de construcción (BT-04/RV-05).  
> **Límite:** solo `sdd/`; sin código, SQL, migraciones, endpoints, handlers, harness, proveedores, datos reales, configuración, commits o push.

## 1. Para qué sirve

Las propuestas técnicas quedaron ratificadas documentalmente mediante DEC-239. Este paquete reúne, en un solo lugar, **qué se aprobó**, **qué queda fuera** de cada aprobación y **qué evidencia falta**. No sustituye los documentos originales ni convierte una propuesta en implementación.

La ratificación es una decisión explícita del usuario o del rol autorizado. No se infiere de «continua», de una validación documental, de un enlace correcto ni de que el documento exista.

## 2. Propuestas incluidas

| Registro | Documento | Se solicita ratificar | No incluye | Si no se ratifica |
|---|---|---|---|---|
| DEC-219 | [Política de versión](politica-versionado-api.md) | Propietario/revisores por rol, SemVer, `/api/v1`, clasificación de cambios y ventana de deprecación de 90 días. | PV-01–PV-06, fechas de `1.0.0`, ejecución de CT-02–CT-12. | No hay política de cambio/publicación; API-01 sigue abierta. |
| DEC-220 | [Decisiones transversales](decisiones-transversales-api.md) | `ProblemDetails`, recurso ajeno 404, `stale_version` 409, `Idempotency-Key`, `ETag`/`If-Match`, paginación 1-based, UTC/Perú y dinero PEN decimal. | DT-06, DT-09, DT-12 y pruebas CT-04–CT-07. | La API no tiene tratamiento uniforme ratificado de errores, idempotencia y paginación. |
| DEC-221 | [Plan de pruebas de contrato](plan-pruebas-contrato.md) | Casos, evidencia, estados PASS/FAIL/BLOCKED/NOT RUN, fases A–D y criterio de cierre. | PT-01–PT-06, harness, ejecución de CT-02–CT-12 y resultados. | No hay plan ratificado para acreditar API-01. |
| DEC-222 | [Plan BT-01](plan-bt-01.md) | Cuatro proyectos, un solo host backend, referencias permitidas, fronteras de módulos y comprobaciones BT-01-A01–A10. | BT-01-A01–A10 ejecutadas, BT-02–BT-04, paquetes y runtime. | La estructura queda ratificada documentalmente; BT-01-A01–A10 y BT-02–BT-04 siguen abiertas. |
| DEC-223 | [Plan MD-01/MD-08](plan-md-01-md-08.md) | Convenciones de nombres/tipos/identificadores/dinero y marco de retención/baja. | MD-08-W01–W07 (ventanas), MD-01-C01–C08 y MD-08-R01–R08 ejecutadas, MD-02–MD-07. | El esquema físico y los plazos de retención siguen sin decisión. |

## 3. Ratificación parcial posible

No es necesario aprobar todo como un bloque. Se puede ratificar por separado:

1. **API transversal — DEC-220.** Desbloquea la interpretación uniforme del contrato, pero deja DT-06/09/12 pendientes.
2. **Política de API — DEC-219.** Desbloquea el proceso de versión/deprecación, pero deja PV-01–PV-06 pendientes.
3. **Estructura — DEC-222.** Desbloquea la estructura objetivo, pero no acredita BT-01 sin las pruebas A01–A10.
4. **Datos — DEC-223, parte MD-01.** Desbloquea nombres/tipos/identificadores/dinero; no fija las ventanas de MD-08.
5. **Retención — DEC-223, parte MD-08.** Solo puede ratificarse el marco y los invariantes; las ventanas W01–W07 requieren decisión aparte.
6. **Pruebas — DEC-221.** Ratifica el plan, no los resultados ni el harness.

La aprobación de una parte no aprueba las demás. Cada ratificación debe registrar qué documento, versión y alcance se aprobó.

## 4. Orden recomendado

| Orden | Bloque | Motivo | Dependencia |
|---:|---|---|---|
| 1 | DEC-220 | Fija el comportamiento transversal que el contrato ya describe. | Ninguna para ratificar; CT-04–CT-07 para acreditar. |
| 2 | DEC-219 | Fija cómo se cambia y retira la API. | DEC-220 para coherencia. |
| 3 | DEC-222 | Fija la estructura que recibirá la implementación. | BT-02–BT-04 para ejecutar. |
| 4 | DEC-223 (MD-01) | Fija el esquema físico antes de migraciones. | MD-02 para PostgreSQL real. |
| 5 | DEC-223 (MD-08) | Fija invariantes; las ventanas necesitan decisión. | MD-08-W01–W07. |
| 6 | DEC-221 | Ordena la evidencia de contrato. | PT-01–PT-06. |

Este orden es una recomendación documental, no una autorización de implementación.

## 5. Registro de ratificación

Cuando exista una decisión, se registrará en una nueva DEC con:

- documento y versión ratificados;
- alcance exacto (por ejemplo, «DEC-223, solo MD-01»);
- decisiones pendientes que siguen abiertas;
- fecha y rol que ratifica;
- cambios solicitados, si los hay;
- confirmación de que no se autoriza código, SQL, migraciones, endpoints, proveedores, datos reales, configuración, commits o push.

| Registro | Fecha | Rol | Documentos y alcance | Pendientes abiertos |
|---|---|---|---|---|
| [DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico) | 2026-11-10 | Usuario / Responsable de proyecto | Paquete completo: [DEC-219](politica-versionado-api.md) v0.1, [DEC-220](decisiones-transversales-api.md) v0.1, [DEC-221](plan-pruebas-contrato.md) v0.1, [DEC-222](plan-bt-01.md) v0.1 y [DEC-223](plan-md-01-md-08.md) v0.1 (MD-01 y MD-08 marco) | PV-01–PV-06, DT-06/09/12, BT-01-A01–A10, MD-01-C01–C08, MD-08-W01–W07, PT-01–PT-06; sin código ni proveedores reales. |

## 6. Qué no autoriza la ratificación

Aunque se ratifiquen las cinco propuestas:

- No se crea solución, proyectos, código, handlers, endpoints, SQL, migraciones, harness o pipelines.
- No se instalan paquetes ni se restauran dependencias.
- No se conecta PostgreSQL, Culqi, Resend, R2, correo o almacenamiento real.
- No se crean cuentas, datos de clientes, pagos, imágenes o exportaciones reales.
- No se cierran API-01, BT-01–BT-04, MD-01–MD-08, RV-01–RV-05 ni CT-02–CT-12.
- No se sustituyen las pruebas de contrato, las pruebas de arquitectura ni la evidencia de runtime.

La ratificación solo convierte una propuesta documental en referencia aprobada; la implementación y las pruebas requieren autorización separada.

## 7. Estado actual

| Elemento | Estado |
|---|---|
| DEC-219 | **Ratificada** ([DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico)); PV-01–PV-06 pendientes. |
| DEC-220 | **Ratificada** ([DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico)); DT-06/09/12 pendientes. |
| DEC-221 | **Ratificada** ([DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico)); PT-01–PT-06 pendientes. |
| DEC-222 | **Ratificada** ([DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico)); BT-01-A01–A10 pendientes. |
| DEC-223 | **Ratificada** ([DEC-239](../decisiones.md#dec-239---ratificación-del-paquete-documental-de-diseño-técnico)); MD-01 ratificado, MD-08 marco ratificado, MD-08-W01–W07 pendientes. |
| Ratificaciones registradas | **DEC-239 (2026-11-10)**. |
| Implementación | No autorizada. |

## 8. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, SQL, migraciones, endpoints, handlers, harness, datos/cuentas/proveedores reales, configuración, commits o push.
