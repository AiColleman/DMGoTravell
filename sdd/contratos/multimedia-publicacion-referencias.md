# Contrato técnico propuesto: multimedia, publicación y referencias

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-203.  
> **Estado:** propuesta documental pendiente de ratificación/verificación; **NO IMPLEMENTADA**.  
> **Ámbito:** 012 con 005/006/007/010/013; AT-06/AT-10 del análisis transversal.  
> **Preservación:** specs, planes, tareas y documentos DEC-200–DEC-202 intactos. No configuración, carga, lectura de objetos reales, borrado o código.

## 1. Autoridad, procedencia y exclusiones

Bases: [012 aprobada](../specs/012-multimedia/spec.md), [006](../specs/006-catalogo/spec.md), [007](../specs/007-hoteles/spec.md), [013](../specs/013-movilidad-informativa/spec.md), [005](../specs/005-identidad/spec.md), [010](../specs/010-clientes-auditoria/spec.md) y [constitución](../constitution.md). Mecanismos derivados de [012 plan §§2–9](../specs/012-multimedia/plan.md), planes de [006](../specs/006-catalogo/plan.md)/[007](../specs/007-hoteles/plan.md)/[013](../specs/013-movilidad-informativa/plan.md) y [análisis DEC-200](../analisis-consistencia.md).

La [coordinación propuesta DEC-201](coordinacion-transaccional.md) conserva protección de cuenta, participación local y límites con efectos externos. Este contrato concreta referencias/publicación, no la ratifica ni cambia su orden financiero. [DEC-202](identidad-destinatarios-notificaciones.md) mantiene privados los enlaces/documentos de identidad: la lectura publicitaria de una foto no les concede acceso público.

CA/RA/EA/PA son referencias técnicas locales, no RF/HU nuevos, estados comerciales de reserva o tareas adicionales. Fuera de alcance: biblioteca global, reutilización administrable entre servicios, videos/SVG/PDF, editor/transformaciones de fotos, carga masiva, nuevas cuotas comerciales, galerías de Movilidad, copia automática de imágenes a cada reserva, papelera/restauración comercial, permanencia eterna de enlaces, proveedor distinto, rutas/SQL/SDK finales, configuración R2/Cloudflare o correo nuevo de alerta por inferencia.

## 2. Contratos y responsabilidad

| ID | Responsable | Entrada confiable | Resultado propuesto |
|---|---|---|---|
| CA-01 — Admitir carga | 012 con autorización de 005 | Actor admin actual, consumidor/uso admitidos y bytes recibidos por backend | Extensión/MIME/contenido/tamaño completamente validados antes de R2; operación/ID/clave nueva propios o rechazo sin almacenar inválidos. |
| CA-02 — Confirmar objeto | 012, adaptador R2 | Operación/clave inmutables y datos de integridad de bytes admitidos | Almacenamiento confirmado y coherente, fallo verificable o resultado desconocido; no «foto guardada» solo por enviar PUT. |
| CA-03 — Asociar/reemplazar/principal | 006/007/013 con 012/010 | IDs/versiones de elemento y activos, acción/admin/operación, sustituta explícita cuando aplique | Asociación/principal, registro de referencias y auditoría en el mismo commit; anteriores conservadas si falla. |
| CA-04 — Acreditar publicación real | Consumidor con 012 | Imagen válida asociada, decisión de visibilidad real y referencia/versiones del consumidor | Marca histórica de publicación confirmada antes de exponer por primera vez la lectura pública; activar o subir por sí solos no prueban visibilidad en todos los consumidores. |
| CA-05 — Leer imagen/preview | 012 y políticas de consumidor/005 | ID opaco de activo y contexto público o administrativo | Imagen ya publicada legible mientras se conserve; borrador solo admin; sin metadata administrativa/credenciales o efectos de negocio por fallo de lectura. |
| CA-06 — Retirar referencia/proteger historia | Consumidor con 012/010 | Referencia exacta/uso/versiones y obligación histórica acreditable | Retirada válida o rechazo; conservación de referencias que todavía requieren bytes. No borrar el archivo como parte previa de un reemplazo. |
| CA-07 — Preparar y ejecutar limpieza | 012 con todos los consumidores | Activo/clave/generación, referencias verificadas, operaciones pendientes y fence durable | Intención local de borrado que impide nuevas asociaciones; DELETE externo posterior y resultado verificable, fallido o desconocido. |
| CA-08 — Reconciliar/evidenciar | 012 con 010 | Identidad de operación, hechos confirmados/desconocidos e IDs saneados | Resultado recuperado por clave exacta, incidente/tombstone donde falte prueba; auditoría preservada, nunca cierre físico ficticio o eliminación amplia. |

El consumidor conserva sus reglas de contenido/visibilidad. 012 no activa/desactiva una oferta/hotel/categoría para aceptar una modificación incompleta, no elige principal arbitraria y no corrige inventario/reservas al gestionar archivos.

## 3. Identidad de activo, referencias y estado

Proponer ID interno opaco, clave R2 única generada por servidor, versión/generación inmutable de objeto, operación de carga, formato/MIME/tamaño/huella confirmados y evidencia de publicación. No aceptar bucket/key/ruta/URL arbitrarios desde el cuerpo. ETag no se considera universalmente SHA-256/MD5 sin comprobar soporte/semántica del SDK/proveedor.

Separar **tres ejes**, no un booleano «activo» que mezcle todo:

- **Operación física:** carga pendiente/confirmada/desconocida, intención de borrado/fallo/resultado comprobado. Un timeout no demuestra ausencia de objeto.
- **Asociación/protección:** usos vigentes, referencias históricas que requieren bytes, fence que cierra nuevas asociaciones. El fence no demuestra que el objeto ya desapareció.
- **Publicación histórica:** nunca publicado/publicado alguna vez. Desactivar un servicio o retirar su enlace no convierte una foto pública conservada en borrador privado.

| ID/clase de referencia | Qué protege | Qué no permite deducir |
|---|---|---|
| RA-01 — Asociación vigente | Imagen asociada a elemento/uso válido, incluso si el consumidor está desactivado | Inactividad comercial no equivale a cero referencias o autorización de borrado. |
| RA-02 — Referencia histórica con obligación de lectura | Bytes que un consumidor necesita preservar por su contrato, con origen/identidad de referencia comprobables | No añadir copia/snapshot de fotos a todas las reservas por inferencia ni borrar historia para hacer huérfano al objeto. |
| RA-03 — Mención de auditoría o enlace externo | Evidencia/ID histórico se conserva en auditoría; enlaces de terceros no son asociaciones internas administradas | Una mención de ID no exige por sí sola bytes eternos; un enlace conocido no crea una retención interna perpetua. Si la obligación es desconocida, no eliminar por suposición. |

Los propietarios que crean/retiran RA-01/RA-02 participan en un registro verificable actualizado conjuntamente con sus asociaciones. Un contador derivado por eventos posteriores no acredita por sí solo ausencia segura de referencias. Si un origen no está registrado/comprobable, no se habilita limpieza para ese alcance.

## 4. Admisión, asociación y principal

JPG/JPEG, PNG y WebP conforme a cada consumidor; máximo inclusivo de 5 MB por archivo. El plan 012 propone 5.000.000 bytes, no el tamaño total de multipart; PA-04 conserva ratificación/compatibilidad y prueba de límites. Contar bytes reales, no confiar solo en `Content-Length` o magic bytes. Contenido corrupto/engañado no se sube primero para validarlo después.

La decodificación requiere presupuestos comprobados de memoria/píxeles/frames/CPU/concurrencia: 5 MB comprimidos no demuestran consumo seguro. No introducir una exclusión comercial de formatos/clases de imagen válidos para ocultar un límite técnico; cualquier incompatibilidad se eleva antes de habilitar. Sin filesystem local persistente o binarios de imágenes como destino de la base de negocio.

Persistir operación/clave nueva, enviar bytes válidos y confirmar integridad antes de asociar. Bajo las protecciones de consumidor/activos en orden común, revalidar admin/versiones/destino/uso/fence y aplicar referencias/principal/auditoría. Si cambió el conjunto protegido, abortar la fase local en vez de adquirir locks en orden inverso. PA-01 requiere comprobar todos los escritores, incluidos comandos de activación/publicación, contra la coordinación compartida; esta descripción no prueba ausencia de deadlock.

Reglas preservadas:

- Oferta/hotel activo: retirar principal exige sustituta válida elegida en la misma operación; si no existe/no se elige, conservar la anterior. No asignar automáticamente otra o desactivar para aceptar.
- Hotel/oferta mantienen imagen obligatoria; tipos de habitación conservan fotos opcionales, sin placeholder. Movilidad tiene una sola imagen, sin galería.
- Al reemplazar, la nueva asociación válida precede a retirar la anterior dentro del commit local; nunca borrar primero la antigua. Cantidad de fotos sin máximo comercial donde ya está aprobada.
- Fallo de carga/reemplazo/asociación muestra «No se pudo cargar la imagen» y conserva anteriores; sin anterior Movilidad sigue desactivada. No nuevo retry automático de carga en UI de 013.
- PUT confirmado y commit de asociación fallido no publican una foto ficticia: nuevo objeto queda pendiente de revisión/limpieza si es realmente huérfano; el anterior no se elimina por compensación.

## 5. Publicación, visibilidad y lectura

La propuesta de 012 es bucket privado y lectura por backend, sin acceso directo público `r2.dev`/dominio de bucket o URL de carga que eluda admisión. Administrar requiere autorización actual; un ID impredecible o URL conocida no reemplazan esos controles. No se configura ningún bucket con este documento.

### Primera publicación

CA-04 consulta la política real del consumidor: 006 oculta ofertas sin salidas futuras reservables/cupos; 007 conserva hotel activo sin disponibilidad con su mensaje; 013 publica categorías activas. No copiar la condición de disponibilidad turística a Hoteles o Movilidad. Fotos de habitación solo se publican por la consulta pública permitida del consumidor, no por estar cargadas en un borrador.

Proponer confirmar la evidencia/marca histórica bajo coordinación de elemento/activos **antes de exponer por primera vez el enlace público**, sin cambiar precios, reservas o estados comerciales desde el lector. No dar acceso a un borrador porque el elemento tenga un flag `active`, ni depender de un evento eventual que aún no confirmó publicación. PA-02 conserva el mecanismo concreto de esa primera exposición y de los cambios de visibilidad por cupos, nuevas salidas, tiempo o desactivación: no se finge resuelto por enganchar solo el botón «Activar».

Una vez acreditada publicación, la marca histórica no se elimina al desactivar u ocultar el servicio. Lectura por enlace conocido mientras se conserve el archivo, sin republicar metadata del consumidor. No promete disponibilidad durante una caída ni permanencia eterna de un objeto realmente limpiable.

### Público frente a previsualización

Borrador nunca publicado: preview por backend con admin vigente, caché privada/no-store, sin URL pública firmada que autorice por mero conocimiento. Foto publicada: MIME canónico/nombre seguro/`nosniff`, sin rutas locales/keys administrativas; el plan propone no-store inicial para no depender de purgas. PA-04 requiere comprobar también cachés/perímetro/errores y acceso que eluda el backend.

El fence de limpieza impide **nuevas asociaciones**, no obliga a declarar borrado ni privatizar una foto publicada que aún existe. Mientras pueda leerse el objeto conservado, la política de lectura pública sigue su marca histórica. Lectura externa y DELETE pueden competir: no prometer que un stream iniciado sobreviva a todo borrado/red caída ni marcar entrega completa por abrir la respuesta.

Una lectura fallida conserva asociación/estado comercial; no borrar/desactivar por 404, timeout o fallo de renderizado de navegador. Consultar una imagen no agrega una referencia protegida eterna. La autorización publicitaria no se reutiliza para PDF/CSV/enlaces de 004/005/008/010/011.

## 6. Retirada, fence y limpieza recuperable

1. Retirar únicamente la referencia/uso autorizado, respetando principal y mínimos del consumidor. Confirmar resultado local y auditoría juntos; no anunciar que el archivo físico desapareció por ese commit.
2. Identificar candidato solo cuando RA-01/RA-02 están realmente ausentes, obligaciones comprobadas y operaciones de escritura resueltas. Edad de 24 horas y revisión cada 15 minutos son propuestas del plan, no SLA, prueba de ausencia o nueva retención comercial.
3. Con protección del activo y contratos participantes, verificar referencias/versión y cerrar nuevas asociaciones mediante fence durable antes de la petición externa. Origen caído/consulta incompleta bloquea, no devuelve cero confiable.
4. Confirmar intención/fence y soltar transacción antes de DELETE por clave/generación exactas. Una asociación ganó antes y evita limpiar, o llega después y se rechaza; nunca aceptar una durante borrado pendiente/desconocido.
5. Registrar resultado externo comprobado o desconocido y verificar origen autenticado sin CDN según soporte real. No regla global de bucket por edad/prefijo, borrado recursivo, reutilización de key o cierre solo por lease vencido.

PUT/DELETE inciertos se mantienen identificables. `HeadObject/GetObject` con 404 no demuestra que un PUT anterior en vuelo no pueda materializarse después; 403/timeout tampoco es ausencia. Retirar el cliente su conexión, esperar 24 horas o vencer un lease no prueba cancelación remota. Revisar los retries implícitos del SDK que puedan escribir después de limpiar.

Si no puede acreditarse que toda escritura pendiente ya no puede crear el objeto, mantener tombstone/incidente y reconciliar apariciones tardías sin dar cierre físico definitivo. Un nuevo intento usa otra operación/activo/clave conforme al caso autorizado; no «resucita» un activo cercado que otro worker aún podría borrar. PA-03 exige demostrar esa recuperación con proveedor/SDK reales autorizados.

Un fallo de limpieza conserva retirada local válida y estado físico real; no restaura arbitrariamente una principal, reabre asociaciones o borra auditoría. El incidente/diagnóstico es saneado; no se añade un correo de alerta nuevo o herramienta de reparación por inferencia. 013 consume el contrato compartido de 012, no incorpora un job propio de limpieza o retry de carga prohibido por su alcance.

## 7. Escenarios de aceptación técnica futuros

Todos **no ejecutados**; se apoyan en tareas existentes, sin nuevas casillas.

| ID | Escenario | Resultado a verificar | Referencia |
|---|---|---|---|
| EA-01 | MIME/extensión permitida con contenido falso/corrupto, cuerpo incompleto o tamaño engañoso | Rechazo antes de R2, no imagen guardada/publicada | 012/RF-4–RF-8; U-01. |
| EA-02 | Límite exacto/inferior/superior con overhead multipart y presión de decodificación | Inclusión del límite por archivo, consumo seguro sin nuevo cupo comercial o exclusión silenciosa | 012/RF-6/RF-17; PA-04. |
| EA-03 | ID de borrador adivinado o acceso directo a bucket/caché | No lectura pública ni gestión; preview solo admin vigente | 012/RF-1/RF-9/RF-31; U-02. |
| EA-04 | Oferta activa sin salidas reservables frente a hotel activo sin inventario | Primera publicación acredita política propia, no flag activo/disponibilidad copiados | 006/RF-53; 007/RF-9; PA-02. |
| EA-05 | Primer enlace público frente a cupos/tiempo/activación concurrentes | Evidencia de primera exposición consistente sin publicación eventual ficticia de borrador | 012/RF-9–RF-11; PA-01/PA-02. |
| EA-06 | Foto publicada y servicio luego desactivado/oculto | Enlace conserva lectura mientras archivo exista, sin metadata administrativa/republicación | 012/RF-10/RF-11; DEC-194. |
| EA-07 | Retirar principal sin sustituta o sustituta ya retirada por otro comando | Conservar principal/versión anterior; no elección automática/desactivación para aceptar | 012/RF-12–RF-14; U-03. |
| EA-08 | Tipo sin fotos, Movilidad con intento de galería y oferta con muchas fotos | Opcionalidad/sin placeholder, Movilidad una imagen y sin máximo comercial nuevo | 012/RF-15–RF-17; 013/RF-19. |
| EA-09 | PUT válido seguido de fallo de commit/auditoría/replay con otro contenido | Anterior conservada; nueva no anunciada asociada; conflicto de identidad distinto de repetir efectos | 012/RF-8/RF-18–RF-20/RF-25/RF-28. |
| EA-10 | Archivo compartido por referencias vigentes/inactivas o históricas protegidas | No borrarlo al retirar una sola; auditoría no se elimina y obligación desconocida bloquea | 012/RF-21/RF-22; RA-01–RA-03. |
| EA-11 | Registro de referencias retrasado, escritor no participante o lector caído | No declarar huérfano seguro ni habilitar limpieza de ese alcance | 012/RF-22/RF-26; PA-01. |
| EA-12 | Nueva asociación compite con preparación del borrado | Gana antes del fence y evita borrar, o se rechaza después; nunca referencia aceptada sobre activo cercado | 012/RF-21–RF-26; U-04. |
| EA-13 | Fence/retirada aplicados pero DELETE aún no hecho/fallido | No falso borrado físico ni privatización por fence de la foto publicada todavía conservada | 012/RF-10/RF-23/RF-24; PA-03. |
| EA-14 | HEAD 404 y PUT anterior termina después; lease vencido/SDK reintenta | Mantener incertidumbre/fence/tombstone; no reutilizar key o declarar eliminación final por lectura negativa/TTL | 012/RF-24–RF-26; U-04. |
| EA-15 | DELETE aceptado y respuesta perdida, o 403/timeout de verificación | Resultado comprobado o desconocido con evidencia; no borrar otra generación ni asumir ausencia | 012/RF-24/RF-25; PA-03. |
| EA-16 | Caída de lectura multimedia durante peticiones de reserva/pago | No desactivar/borrar ni bloquear negocio no relacionado; conservar referencias/estado real | 012/RF-29/RF-30; AC02. |
| EA-17 | Ruta de foto pública usada para solicitar PDF/CSV/token o metadata del propietario | Permisos separados y ningún secreto/ruta administrativa en respuesta/log | 012/RF-11/RF-31/RF-32; U-02. |
| EA-18 | Dos reemplazos, limpieza repetida/reinicio y fallo de auditoría | Identidades/versiones/raíces coherentes, sin doble asociación/limpieza errónea o cambio controlable sin auditoría | 012/RF-25–RF-28; PA-01/PA-03. |

## 8. Precisiones pendientes y trazabilidad

| ID | Evidencia necesaria antes de ratificar/habilitar | Puertas existentes |
|---|---|---|
| PA-01 | Esquema físico y participación transaccional de todos los escritores de asociación/principal/activación/referencia histórica; raíces, modos/orden/índices/FK y versiones probadas con PostgreSQL real. Registro eventual no basta para borrar. | U-03/U-04; ACL-13/ACL-17; PT-01 de DEC-201. |
| PA-02 | Punto de primera publicación real y cambios de visibilidad por cupos/salidas/tiempo frente a exposición de enlace; política propia de 006/007/013, sin confundir activo con visible o marcar borrador como publicado. | U-02/U-03; puertas de consumidores. |
| PA-03 | SDK/R2 y condiciones reales de PUT/HEAD/GET/DELETE, checksums, retries, errores, escrituras en vuelo y fence/tombstone/lease; recuperación por clave exacta sin cierre ficticio o reuso. | U-02/U-04; ACL-17. |
| PA-04 | Decoder/licencia/runtime y presupuestos seguros, bytes inclusivos, permisos privados/caché/perímetro, carga/aislamiento, observabilidad saneada y evidencia autorizada de entorno/objetos de test. | U-01/U-02/U-05/U-06 y ACL-18/ACL-20. |

Trabajo existente: [012 tasks](../specs/012-multimedia/tasks.md), T012-02–T012-21/T012-23–T012-29; [006 tasks](../specs/006-catalogo/tasks.md)/[007 tasks](../specs/007-hoteles/tasks.md), integración de imágenes y puertas ACL-13/ACL-17; [013 tasks](../specs/013-movilidad-informativa/tasks.md), T013-01/T013-02/T013-05/T013-06/T013-08/T013-14/T013-17; [010 tasks](../specs/010-clientes-auditoria/tasks.md), anexado y recuperación. Son apoyos documentales, **no tareas/puertas cerradas al redactar este contrato**.

Sin nuevas consultas externas; evidencia pública R2 conserva fecha/alcance registrados por [plan 012](../specs/012-multimedia/plan.md) y [fuentes](../fuentes.md). No se acredita cuenta/SDK/bucket real o prueba de escritura/borrado por esa documentación. No se usaron credenciales, archivos de clientes, objetos de test o APIs de almacenamiento en esta actividad.

Inventario preservado: **659 criterios y 386 tareas pendientes**, cero ejecutadas. CA-01–CA-08 son propuestas; RA-01–RA-03, clases lógicas; EA-01–EA-18, pruebas futuras; PA-01–PA-04, evidencia pendiente. No se añaden políticas/ADR, funcionalidades, autorizaciones o compromisos de almacenamiento por esta redacción.

### Comprobación documental de cierre

- 906 enlaces locales comprobados, ninguno roto; CA-01–CA-08, RA-01–RA-03, EA-01–EA-18 y PA-01–PA-04 consecutivos y únicos. Referencias explícitas RF/tareas contrastadas con documentos existentes.
- 46 documentos previos intactos por SHA-256: 43 Markdown protegidos de `specs/` salvo su índice, análisis DEC-200 y contratos DEC-201/DEC-202. No se actualizan sus cifras históricas de validación como si correspondieran al inventario posterior.
- DEC-203 único, sin encabezados DEC duplicados; 386 casillas aún pendientes. Comprobar archivos no prueba publicación, permisos efectivos, locks, contenido de R2, SDK, eliminación física o escenarios EA.
