# Cierre del diseño técnico — matriz de puertas

> **Fecha:** 2026-11-04 (actualizado 2026-11-11). **Versión:** 0.2. **Registro:** DEC-216 / DEC-239 / DEC-240 / DEC-241.  
> **Objeto:** [base técnica](base-tecnica.md), [modelo de datos](modelo-datos.md), [contrato de API](contrato-api.md), su [validación](validacion-contrato-api.md), el [plan API-01](plan-api-01.md), el [paquete de ratificación](paquete-ratificacion.md) y el [borrador OpenAPI](openapi/dmgo-api-v1.yaml).  
> **Estado:** diseño técnico **RATIFICADO DOCUMENTALMENTE MEDIANTE DEC-239**; no cierra por sí solo las puertas que exigen runtime, proveedor o autorización de implementación (BT-04/RV-05).  
> **Límite:** solo `sdd/`; sin código, SQL, migraciones, endpoints desplegados, cuentas, proveedores, configuración, commits o push.

## 1. Qué significa cerrar el diseño técnico

Cerrar el diseño técnico **no es implementar**. Significa dejar una base técnica revisable y ejecutable, con:

- decisiones documentadas, versionadas y con propietario;
- OpenAPI revisado, con inventario, ejemplos y criterios de contrato;
- modelo lógico ratificado y traducible a un esquema físico;
- contratos internos y de proveedor verificados o explícitamente bloqueados;
- cada puerta con estado, evidencia y condición de cierre;
- ninguna puerta marcada como cerrada sin la prueba que exige.

El cierre del diseño tampoco cierra las puertas de **runtime**, **proveedor** o **autorización**. Esas siguen abiertas hasta que exista evidencia real o una decisión expresa.

## 2. Estado de partida

- Specs 001–013 y complementos 004-C/005-C aprobadas; **677 criterios**.
- Planes y tareas creados; **402 tareas pendientes**, ninguna ejecutada.
- **Base técnica (BT-01), modelo de datos (MD-01 y MD-08 marco), política de versionado (DEC-219), decisiones transversales de API (DEC-220) y plan de pruebas de contrato (DEC-221) RATIFICADOS DOCUMENTALMENTE mediante DEC-239.**
- OpenAPI 3.1.0: borrador no normativo con **82 rutas**, **92 operaciones**, **88 esquemas** y **146 referencias únicas**.
- Validación del borrador: YAML/OpenAPI 3.1 correcto, referencias resueltas, `operationId` únicos y parámetros de ruta alineados.
- 8 ejemplos de esquema validados (DEC-217), 139 bloques de éxito en 86 operaciones, 22 ejemplos compartidos de error en 11 componentes (DEC-225/226/227/228/229/230/231/232/233/234/235/236/237/238) y 36 ejemplos específicos en 27 componentes (DEC-240 y DEC-241); 4 respuestas `204` y 2 `302` sin cuerpo, 92 operaciones con respuesta de éxito documentada y 90/92 con errores declarados cubiertos; 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos con 0 fallos; matriz de operaciones (DEC-218); CT-12 parcial, CT-02–CT-12 sin ejecutar y sin implementación física.

## 3. Puertas de API

| Puerta | Tema | Estado actual | Evidencia | Falta para cerrar | Bloqueo principal |
|---|---|---|---|---|---|
| API-01 | OpenAPI y versionado | Ratificada documentalmente (DEC-239) | `dmgo-api-v1.yaml` 0.1.0-draft; 82/92/88/146; CT-01 92/92; matriz DEC-218; política DEC-219 ratificada; decisiones DEC-220 ratificadas; plan DEC-221 ratificado; 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos | Cobertura específica residual de autenticación, perfil, notificaciones, media administrativa y operaciones de creación; CT-02–CT-12 en runtime | Pruebas |
| API-02 | Autenticación y transporte | Propuesta | Contrato y OpenAPI describen bearer, refresh cookie y CSRF | Topología real, `SameSite`, `__Host-`, CORS, revocación y pruebas de cookies | Runtime |
| API-03 | Errores | Ratificada documentalmente (DEC-239) | ProblemDetails, catálogo de códigos, `traceId` y decisiones DEC-220 ratificadas | Pruebas de errores, mensajes aprobados y ausencia de fugas (CT-04) | Pruebas |
| API-04 | Idempotencia y concurrencia | Ratificada documentalmente (DEC-239) | `Idempotency-Key`, `ETag`/`If-Match`, `409` y decisiones DEC-220 ratificadas | Pruebas de replay, respuesta perdida y escrituras concurrentes (CT-05/06) | Runtime |
| API-05 | Paginación, filtros, tiempo y dinero | Ratificada documentalmente (DEC-239) | Paginación 1-based, fechas UTC/Perú, decimales PEN y decisiones DEC-220 ratificadas | Pruebas de bordes, orden, zona horaria y precisión monetaria (CT-07) | Pruebas |
| API-06 | Proveedores | Bloqueada | Referencias públicas de Culqi/Resend y campos marcados `x-pending-provider-contract` | Contrato oficial verificado, firma, idempotencia, recuperación y pruebas | Proveedor |
| API-07 | Archivos y media | Propuesta | Multipart, 5 000 000 bytes, MIME/contenido y lectura publicada descritos | Pruebas de carga/reemplazo/fallo, R2 y lectura tras desactivar | Proveedor + runtime |
| API-08 | Exportaciones y PDF | Propuesta | Captura, estados, descarga y expiración descritos | Pruebas de caída, concurrencia, artefacto no listo y PDF completo | Runtime + licencia |

## 4. Puertas de base técnica

| Puerta | Tema | Estado actual | Evidencia | Falta para cerrar | Bloqueo principal |
|---|---|---|---|---|---|
| BT-01 | Estructura y arquitectura | Ratificada documentalmente (DEC-239) | Cuatro proyectos `DMGoTravel.*`, Presentation dentro de `Api`; plan DEC-222 ratificado | Comprobaciones BT-01-A01–A10 ejecutadas sobre solución autorizada | Pruebas de arquitectura |
| BT-02 | Compatibilidad y licencias | Bloqueada | Familias .NET 10/EF–Npgsql 10/FV12 y frontend candidato | Versiones exactas, lockfiles, licencias, vulnerabilidades, restore/build | Externo |
| BT-03 | Persistencia, host y configuración | Bloqueada | Contrato de monolito y jobs persistentes | PostgreSQL real, host, secretos, cookies/orígenes, backup/restore | Runtime |
| BT-04 | Autorización y evidencia | Abierta | No hay código, paquetes, pipelines, migraciones o entorno | Autorización explícita para implementar y evidencia de ejecución | Autorización |

## 5. Puertas de modelo de datos

| Puerta | Tema | Estado actual | Evidencia | Falta para cerrar | Bloqueo principal |
|---|---|---|---|---|---|
| MD-01 | Nombres, tipos e identificadores | Ratificada documentalmente (DEC-239) | `uuid` público, `bigint` interno, `numeric(14,2)` PEN y `timestamptz`; plan DEC-223 ratificado | Comprobaciones MD-01-C01–C08 sobre DDL/migraciones autorizadas | Pruebas DDL |
| MD-02 | PostgreSQL real | Bloqueada | Modelo lógico y tipos propuestos | Versión, colación, índices parciales, funciones y pruebas en PostgreSQL real | Runtime |
| MD-03 | Concurrencia | Bloqueada | Orden de bloqueo y aislamiento propuestos | Pruebas de deadlocks, última unidad, doble liberación y carreras | Runtime |
| MD-04 | Inventario | Bloqueada | Contadores más libro de compromisos | Reconciliación, reducciones, estancias limítrofes y deriva cero | Runtime |
| MD-05 | Pagos y devoluciones | Bloqueada | Unicidad externa, intento activo y casos de devolución | Contrato real, suma ejecutada/en curso y resultados desconocidos | Proveedor + runtime |
| MD-06 | Auditoría | Bloqueada | Inmutabilidad desde aplicación y deduplicación | Roles, permisos, fallo simultáneo y recuperación | Runtime |
| MD-07 | Exportaciones | Bloqueada | Captura materializada y manifiesto | Pruebas de concurrencia, caída antes/después del commit y renderizado | Runtime |
| MD-08 | Retención y baja | Ratificada documentalmente en marco (DEC-239) | Invariantes de baja, snapshots y auditoría ratificadas; plan DEC-223 | Definición exacta de ventanas MD-08-W01–W07 y pruebas MD-08-R01–R08 | Runtime |

## 6. Puertas de reemisión de verificación

| Puerta | Tema | Estado actual | Evidencia | Falta para cerrar | Bloqueo principal |
|---|---|---|---|---|---|
| RV-01 | Contratos y compatibilidad | Bloqueada | Plan 005-C y consumidores identificados | Emisor inicial, reemisión y consumidores validando la misma generación/contexto | Implementación |
| RV-02 | Consistencia | Bloqueada | Modelo de generación/consumo/replay | Pruebas PostgreSQL de dos solicitudes, consumo, cambio de correo, baja y replay | Runtime |
| RV-03 | Transporte, secretos y recuperación | Bloqueada | Entrega protegida y revalidación al despachar | SMTP, claves, leases, ventanas, desconocidos y mensajes tardíos | Runtime + proveedor |
| RV-04 | Calidad, abuso e interfaz | Bloqueada | TTL/límites propuestos y bloqueo de reserva/pago | Pruebas de bordes, NAT, carga, CSRF y ausencia de secretos | Runtime |
| RV-05 | Autorización | Abierta | Planificación sin ejecución | Autorización explícita para código, migraciones, cuentas y pruebas reales | Autorización |

## 7. Puertas específicas

| Grupo | Alcance | Estado | Evidencia actual | Falta |
|---|---|---|---|---|
| PT-01–PT-04 | Coordinación transaccional, admisión/despacho, locks y recuperación | Abiertas | [Contrato propuesto](../contratos/coordinacion-transaccional.md) | Esquema físico, pruebas concurrentes y recuperación |
| PM-01–PM-04 | Identidad, destinatarios y entrega de notificaciones | Abiertas | [Contrato propuesto](../contratos/identidad-destinatarios-notificaciones.md) | Proveedor, claves, admisión/despacho y pruebas |
| PA-01–PA-04 | Multimedia, publicación, referencias y limpieza | Abiertas | [Contrato propuesto](../contratos/multimedia-publicacion-referencias.md) | R2, SDK, primera publicación, fence y pruebas |
| PX-01–PX-04 | Consultas, exportación y privacidad | Abiertas | [Contrato propuesto](../contratos/consultas-exportacion-privacidad.md) | Captura durable, serializador, licencia PDF y privacidad |
| G-01–G-05 | Pagos, devoluciones y recuperación | Abiertas | Plan 002 y [matriz de cierre](../cierre-dependencias-002.md) | Contrato Culqi, conciliación, importes y recuperación |
| A-01–A-06 | Auditoría, retención, CSV y capacidad | Abiertas | Plan 010 | Inmutabilidad, snapshot, capacidad y privacidad |
| Q-01–Q-06 | Reportes, cálculo, PDF y capacidad | Abiertas | Plan 011 | Fuentes oficiales, licencia/runtime PDF y entrega privada |
| U-01–U-06 | Multimedia, R2, referencias y seguridad | Abiertas | Plan 012 | Proveedor, permisos, limpieza, capacidad y autorización |

## 8. Qué puede cerrarse documentalmente ahora

Estas actividades no requieren implementar, pero sí una revisión y una decisión registrada:

1. **API-01 parcial:** CT-01 ya está superado documentalmente, la política DEC-219 y las decisiones DEC-220 están propuestas, y el plan de pruebas DEC-221 ya detalla CT-02–CT-12; faltan revisión de cuerpos, ejemplos por operación, ejecución de pruebas y ratificación de propietario/versión/deprecación.
2. **API-03/04/05:** ratificar el diseño de errores, idempotencia/concurrencia y paginación/tiempo/dinero ya propuesto en DEC-220, dejando las pruebas como evidencia pendiente.
3. **BT-01:** ratificar o corregir la estructura de cuatro proyectos y las reglas de aislamiento; el plan DEC-222 ya fija dependencias y comprobaciones BT-01-A01–A10.
4. **MD-01:** ratificar nombres, tipos, identificadores y precisión monetaria; el plan DEC-223 ya fija MD-01-C01–C08.
5. **MD-08:** decidir las ventanas MD-08-W01–W07 y validar MD-08-R01–R08, distinguiendo auditoría/finanzas de artefactos temporales.
6. **Matriz de decisiones:** fijar qué se difiere a runtime, qué a proveedor y qué a autorización.

## 9. Qué no puede cerrarse sin evidencia real

- **API-02:** cookies, CSRF, CORS y revocación dependen de la topología real.
- **API-06:** Culqi/Resend no tienen contrato verificado ni firma comprobada.
- **API-07/PA/U:** R2, permisos, límites y limpieza requieren proveedor y runtime.
- **API-08/PX/Q:** exportaciones y PDF requieren captura, licencia, runtime y privacidad.
- **MD-02–MD-07:** PostgreSQL, concurrencia, inventario, pagos, auditoría y exportaciones requieren pruebas reales.
- **RV-01–RV-04:** reemisión y entrega requieren implementación, SMTP y pruebas.
- **BT-02/BT-03:** versiones, licencias, host, secretos y backup requieren entorno real.

## 10. Decisiones que no se deben inventar

| Decisión | Por qué no se cierra por redacción | Evidencia necesaria |
|---|---|---|
| Cookie `SameSite`/`__Host-`, CSRF y CORS | Depende de si frontend y API son same-site o cross-site | Topología real y pruebas de navegador |
| Contrato Culqi/Resend | La documentación pública no acredita firma, campos ni idempotencia del comercio | Contrato oficial y pruebas sandbox |
| Versión PostgreSQL y colación | La versión real de Supabase/PostgreSQL condiciona tipos, índices y funciones | Entorno real y migración de prueba |
| SDK/R2 y checksums | PUT/HEAD/GET/DELETE, retries y errores dependen del proveedor | Pruebas con bucket de test |
| Biblioteca PDF y licencia | Los ejemplos públicos no acreditan licencia del binario | Revisión legal/técnica de la versión exacta |
| Ventanas de retención | Es una política de negocio y privacidad, no una inferencia técnica | Decisión registrada y pruebas de borrado |
| Límites de tasa y capacidad | Dependen de tráfico, infraestructura y abuso esperado | Pruebas de carga y decisión operativa |
| Versiones exactas/lockfiles | Un rango de familia no acredita compatibilidad ni licencia | Restore/build y auditoría de dependencias |

## 11. Ruta de cierre

1. **Fase 0 — Línea base:** congelar esta matriz y el estado de las puertas.
2. **Fase 1 — OpenAPI:** revisión contra el contrato, ejemplos, CT-01–CT-12 y política de versión.
3. **Fase 2 — Decisiones documentales:** API-03/04/05, BT-01, MD-01 y MD-08.
4. **Fase 3 — Runtime local:** PostgreSQL, migraciones, concurrencia, inventario, auditoría y exportaciones.
5. **Fase 4 — Proveedores:** Culqi, Resend, R2 y PDF con entornos de prueba autorizados.
6. **Fase 5 — Autorización:** implementación, cuentas, claves, migraciones y despliegue.

## 12. Criterio de salida del diseño técnico

El diseño técnico puede considerarse cerrado cuando:

- CT-01 está superado y el OpenAPI está revisado, con ejemplos por operación y CT-02–CT-12 definidas y ejecutadas cuando exista implementación o harness autorizado;
- API-01–API-05 tienen diseño ratificado y pruebas planificadas;
- BT-01, MD-01 y MD-08 tienen decisión registrada;
- las puertas de proveedor/runtime están explícitamente abiertas o bloqueadas, sin falsos cierres;
- cada puerta tiene propietario, evidencia y próximo paso;
- la implementación sigue requiriendo autorización separada.

## 13. Próximo artefacto

CT-01 ya está superado documentalmente, la [matriz de operaciones](matriz-operaciones-openapi.md) (DEC-218) deja el recorrido preparado y hay 8 ejemplos de esquema. Los lotes O (DEC-240) y P (DEC-241) ya añadieron ejemplos específicos para identidad, perfil, reservas, pagos, autorización de devoluciones, catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada; el siguiente paso es el lote Q para autenticación residual, perfil, notificaciones, media administrativa y operaciones de creación, sin generar handlers. El [plan de pruebas](plan-pruebas-contrato.md) (DEC-221) ya detalla CT-02–CT-12, el [plan BT-01](plan-bt-01.md) (DEC-222) fija estructura y aislamiento, el [plan MD-01/MD-08](plan-md-01-md-08.md) (DEC-223) fija convenciones y retención, el [paquete de ratificación](paquete-ratificacion.md) (DEC-224) reunió las decisiones ratificadas por DEC-239, el [lote A de ejemplos](ejemplos-lote-a.md) (DEC-225) cubre identidad/perfil, el [lote B](ejemplos-lote-b.md) (DEC-226) cubre catálogo/hoteles/movilidad, el [lote C](ejemplos-lote-c.md) (DEC-227) cubre reservas/pagos, el [lote D](ejemplos-lote-d.md) (DEC-228) cubre administración de reservas y devoluciones, el [lote E](ejemplos-lote-e.md) (DEC-229) cubre webhooks y notificaciones, el [lote F](ejemplos-lote-f.md) (DEC-230) cubre catálogo administrativo y hoteles, el [lote G](ejemplos-lote-g.md) (DEC-231) cubre movilidad administrativa, el [lote H](ejemplos-lote-h.md) (DEC-232) cubre salidas, precios e itinerarios, el [lote I](ejemplos-lote-i.md) (DEC-233) cubre imágenes de catálogo, habitaciones e inventario, el [lote J](ejemplos-lote-j.md) (DEC-234) cubre imágenes de hotel/habitación y propuestas de alojamiento, el [lote K](ejemplos-lote-k.md) (DEC-235) cubre clientes, auditoría y exportaciones, el [lote L](ejemplos-lote-l.md) (DEC-236) cubre reportes y media, el [lote M](ejemplos-lote-m.md) (DEC-237) cubre autenticación, perfil y cierres `204`/`302`, el [lote N](ejemplos-lote-n.md) (DEC-238) cubre errores compartidos, el [lote O](ejemplos-lote-o.md) (DEC-240) cubre errores específicos de identidad, perfil, reservas y pagos y el [lote P](ejemplos-lote-p.md) (DEC-241) cubre catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media publicada; DEC-239 ya ratificó la política DEC-219, las decisiones transversales DEC-220, BT-01 y MD-01/MD-08 marco.

**Preservación:** specs, planes/tasks, análisis y contratos anteriores intactos; **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. Sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
