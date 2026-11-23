# Spec 012 - Multimedia de catálogo, hoteles y movilidad

> **Estado:** aprobada v0.1; **APROBADA** el 2026-11-02 mediante DEC-197, con 32 criterios.  
> **Versión:** 0.1, 2026-11-02; 32 criterios.  
> **Requisitos de origen:** RF24; imágenes de RF02/RF17/RF20, HU-02/HU-14/HU-15/HU-21/HU-23; movilidad como ampliación ya aprobada de 013, no como HU oficial nueva.  
> **Fuentes:** F01 §6; F02 §§1/5/6; F03 RF24 y reglas de historial; F04 AC02/AC04/AC05/AC07/AC09/AC11; F05 RC16/RS03/RS10; F07 ADR-006; [inventario](../../fuentes.md); acuerdos vigentes de 006/007/013 y DEC-194/DEC-195.  
> **Dependencias:** 005 Identidad, 006 Catálogo v0.46, 007 Hoteles v0.2, 010 Auditoría v0.3 y 013 Movilidad v0.3 aprobadas. 011 se aprueba separadamente mediante DEC-196; los permisos de sus documentos no se derivan del acceso a imágenes del catálogo.

## Resumen para revisión

- Solo administradores gestionan imágenes y sus asociaciones válidas; Cloudflare R2 se conserva como restricción de RF24, no un proveedor nuevo elegido por 012.
- Se heredan JPG/PNG/WebP y máximo inclusivo de 5 MB por archivo de cada consumidor, sin modificar mínimos de publicación, cantidades o fallos ya aprobados.
- Fotos que nunca se publicaron: acceso administrativo autorizado. Foto ya publicada: su enlace conocido puede seguir permitiendo lectura al desactivar el servicio mientras el archivo se conserve.
- La lectura de una foto no vuelve a publicar la oferta/hotel/movilidad ni permite gestionar archivos de forma anónima.
- Para quitar la principal de una oferta u hotel activo, el administrador selecciona antes una sustituta válida en la misma operación; no hay elección automática arbitraria.
- No borrar físicamente archivos con asociaciones vigentes o referencias históricas protegidas; no tratar como «sin referencias» un origen que no pueda comprobarse.
- Una retirada de catálogo no es prueba de borrado físico; fallos de limpieza se conservan para recuperar sin romper otras imágenes/historia.

Las dos preguntas resolvieron acceso posterior a desactivación y sustitución de principal; lo ya aprobado no se vuelve a entrevistar. La aprobación expresa del documento completo se registra en DEC-197, antes de la planificación posterior.

## Contexto y objetivo

RF24/F01 §6 exige almacenar multimedia del catálogo fuera del backend, validar archivos y aplicar eliminación/reemplazo consistentes. 006, 007 y 013 ya fijaron formatos, tamaño, cantidades, publicación y respuesta a fallos para sus imágenes; 012 reúne su contrato compartido sin reabrir esas decisiones ni convertirlo en una biblioteca global o editor de imágenes no solicitados.

El objetivo es que la administración de fotos no deje contenido activo incompleto, imágenes inválidas expuestas, pérdidas por un reemplazo fallido o archivos eliminados que todavía necesita un consumidor. La limpieza recuperable no se confunde con desactivar productos, editar reservas o borrar auditoría.

## Usuarios / actores

- **Administrador activo:** carga, asocia, designa principal, reemplaza o retira fotos dentro de los permisos de 006/007/013.
- **Visitante:** consulta imágenes publicadas de solo lectura; conservar un enlace no le concede gestión ni información adicional del servicio.
- **005 Identidad:** determina autorización administrativa vigente.
- **006/007/013:** conservan reglas de contenido, activación, asociación y presentación de cada ámbito.
- **Cloudflare R2:** almacenamiento externo definido por RF24/RC16/ADR-006.
- **010 Auditoría:** registra operaciones críticas y resultados saneados; no es un almacén de credenciales o direcciones secretas de subida.

## Historias de usuario

Se conservan IDs y prioridades originales; no se inventa una HU oficial para 012.

- **HU-02 (P1):** consultar detalle de oferta con imágenes; la visibilidad del producto pertenece a 006.
- **HU-14/HU-15 (P2):** gestionar/retirar ofertas conservando reservas históricas y trazabilidad; imágenes no autorizan editar otra condición.
- **HU-21 (P1):** explorar hoteles, tipos de habitación y sus imágenes públicas autorizadas.
- **HU-23 (P2):** gestionar hoteles, tipos de habitación e inventario, conservando sus relaciones con RF24 y el historial.
- **Ampliación 013 aprobada:** categoría informativa de movilidad con una imagen, sin reserva/precio/disponibilidad de vehículos.

## Acuerdos heredados: no se modifican en 012

| Ámbito | Formato/tamaño/cantidad | Regla de publicación y fallo |
|---|---|---|
| Tours/paquetes, 006 | JPG/PNG/WebP, hasta 5 MB inclusivos por archivo, principal + galería sin máximo comercial de fotos | Publicado requiere imagen válida; edición que quita la última obligatoria se rechaza conservando lo anterior. Fallo de carga/reemplazo: «No se pudo cargar la imagen» y conservar fotos previas. |
| Hotel, 007 | Los mismos formatos/tamaño por decisión propia de 007, principal + galería sin máximo comercial | Activo requiere imagen; no desactivar automáticamente para aceptar edición incompleta. Mismo mensaje y conservación ante fallo acordados en 007. |
| Tipo de habitación, 007 | Principal + galería sin máximo comercial, fotos opcionales | Puede quedar sin fotos y mostrarse sin imagen, sin placeholder o ejemplo. 012 no vuelve obligatorias esas fotos. |
| Movilidad, 013 | Una imagen principal por categoría, JPG/PNG/WebP, hasta 5 MB | No añadir galería. Activación requiere imagen; fallo conserva la anterior o mantiene desactivado el registro sin imagen, según la spec aprobada. |

El límite por archivo no es un máximo de cinco fotos ni ofertas. La ausencia de cantidad máxima comercial no garantiza almacenamiento físico ilimitado. La traducción de 5 MB a bytes y los límites de procesamiento seguros se documentan en el plan sin reinterpretar la inclusión del límite o inventar un cupo comercial.

## Requisitos funcionales (criterios de aceptación en EARS)

### Autorización, destino y admisión

- **RF-1:** EL SISTEMA restringirá cargas, cambios, reemplazos y retiradas de imágenes a administradores autenticados y autorizados. (RN-26; RS03; 005/006/007/013)
- **RF-2:** CUANDO se asocia una imagen, EL SISTEMA comprobará que el elemento y el uso principal/galería solicitados existen y están permitidos por su consumidor. (RF24; 006/007/013; AC05)
- **RF-3:** EL SISTEMA almacenará las imágenes admitidas mediante el proveedor externo definido por RF24 sin usar almacenamiento local persistente del backend como destino del catálogo. (RC16; ADR-006; F01 §6)
- **RF-4:** EL SISTEMA validará extensión, tipo declarado, contenido real y tamaño antes de admitir el almacenamiento de una carga. (F01 §6; RS10)
- **RF-5:** SI un archivo no corresponde a JPG, PNG o WebP admitidos por el ámbito, ENTONCES EL SISTEMA rechazará su carga. (006/RF-70; 007/RF-46; 013/RF-22)
- **RF-6:** SI una imagen supera 5 MB, ENTONCES EL SISTEMA rechazará su carga sin rechazar por tamaño una imagen de exactamente 5 MB. (006/RF-71; 007/RF-47; 013/RF-23)
- **RF-7:** SI una carga es inválida, ENTONCES EL SISTEMA no la admitirá como archivo guardado o imagen válida del elemento. (RS10; 006/007/013)
- **RF-8:** MIENTRAS no se confirme el almacenamiento válido y su asociación aceptada, EL SISTEMA no presentará la imagen nueva como guardada/publicada. (RF24; respuesta de fallo de 006/007/013)

### Lectura, principal y reglas de cada ámbito

- **RF-9:** MIENTRAS una imagen no haya sido publicada, EL SISTEMA limitará su lectura de borrador o previsualización a administradores autorizados. (F01 §6, acceso controlado; catálogo activo de 006/007/013)
- **RF-10:** CUANDO una imagen ya publicada pertenezca a un servicio que se desactiva, EL SISTEMA permitirá su lectura mediante el enlace conocido mientras el archivo se conserve. (DEC-194)
- **RF-11:** EL SISTEMA evitará que el acceso a una imagen vuelva visible en el catálogo un servicio desactivado o revele sus datos administrativos. (DEC-194; 006/007/013)
- **RF-12:** CUANDO el administrador designa una principal, EL SISTEMA exigirá que sea una imagen válida asociada al elemento correspondiente. (006/007; 013; RF24)
- **RF-13:** CUANDO se solicita retirar la principal de una oferta u hotel activo, EL SISTEMA exigirá seleccionar una sustituta válida en la misma operación para aceptar esa retirada. (DEC-195; sin sustituta se conserva la principal vigente)
- **RF-14:** SI una modificación deja un elemento activo sin una imagen obligatoria válida, ENTONCES EL SISTEMA rechazará esa modificación conservando el contenido persistido anterior. (006/RF-60; 007/RF-54; 013/RF-19)
- **RF-15:** EL SISTEMA conservará la opcionalidad de fotos de tipos de habitación y su presentación sin imagen cuando no existan fotos. (007/RF-55/RF-56)
- **RF-16:** EL SISTEMA conservará una sola imagen de cada categoría de movilidad sin añadir galería. (013; DEC-048)
- **RF-17:** EL SISTEMA permitirá las cantidades de fotos ya aprobadas de ofertas/hoteles/tipos sin imponer un máximo comercial adicional desde 012. (DEC-107/DEC-110/DEC-116; 006/007)

### Fallo, reemplazo y conservación

- **RF-18:** SI falla la carga o el reemplazo de una imagen, ENTONCES EL SISTEMA mostrará «No se pudo cargar la imagen» en el ámbito correspondiente. (006/RF-72; 007/RF-49; 013/RF-30)
- **RF-19:** SI falla una carga o reemplazo, ENTONCES EL SISTEMA conservará las imágenes anteriores válidas del elemento. (006/RF-73; 007/RF-50; 013/RF-31/RF-32)
- **RF-20:** CUANDO se reemplaza una imagen, EL SISTEMA retirará su asociación anterior únicamente después de admitir la sustitución válida. (F01 §6; conservación de 006/007/013)
- **RF-21:** MIENTRAS un archivo tenga una asociación vigente o referencia histórica protegida, EL SISTEMA impedirá su eliminación física. (F01 §6; RN-30; preservación histórica de 001/006/007)
- **RF-22:** SI no puede comprobarse que un archivo carece de referencias protegidas, ENTONCES EL SISTEMA no lo tratará como huérfano eliminable. (AC07/AC09; conservación de RF-21)
- **RF-23:** CUANDO una imagen admitida queda sin asociación ni referencia protegida, EL SISTEMA permitirá su limpieza recuperable sin afectar archivos todavía referenciados. (F01 §6; RF24; limpieza como mecanismo posterior)
- **RF-24:** SI falla o queda desconocido el resultado de una eliminación física, ENTONCES EL SISTEMA conservará evidencia pendiente sin presentarla como una eliminación completada. (RF24; AC09/AC11)

### Repetición, auditoría y límites de fallo

- **RF-25:** CUANDO se repite una misma operación multimedia, EL SISTEMA impedirá duplicar sus asociaciones o aplicar la eliminación a otro archivo. (AC07; idempotencia/identidad del archivo)
- **RF-26:** CUANDO compiten cambios de fotos o una limpieza con otra asociación, EL SISTEMA conservará las referencias vigentes y los requisitos de contenido válido del elemento. (AC07; 006/007/013)
- **RF-27:** EL SISTEMA auditará cambios multimedia aplicados con actor, elemento, imagen/uso, fecha y resultado, sin credenciales o enlaces secretos. (RN-28/RN-29; DEC-078; 007/RF-21; 013/RF-26–RF-29; 010)
- **RF-28:** SI falla la auditoría requerida antes de aplicar un cambio controlable de asociación, ENTONCES EL SISTEMA conservará la asociación anterior sin aplicar ese cambio. (010/RF-36/RF-37)
- **RF-29:** SI falla el servicio multimedia, ENTONCES EL SISTEMA mantendrá independientes las peticiones de negocio no relacionadas. (AC02)
- **RF-30:** SI falla la lectura de una foto, ENTONCES EL SISTEMA conservará su asociación y estado real sin borrarla, inventar una foto guardada o desactivar el servicio automáticamente por ese fallo temporal. (AC02; límites de 006/007/013)
- **RF-31:** EL SISTEMA excluirá credenciales y rutas locales/administrativas sensibles de las referencias o respuestas públicas de imágenes. (AC04/AC05; F01 §6)
- **RF-32:** EL SISTEMA mantendrá separado el acceso a fotos publicitarias del acceso privado a documentos y enlaces de otras funcionalidades. (AC04/AC05; límites de 004/005/008/010/011)

### Precisiones de ciclo de vida

- Cambiar/retirar una asociación en un elemento y limpiar el objeto externo son resultados distintos. Retirada válida puede quedar aplicada mientras la limpieza de un archivo ya no referenciado queda pendiente; no anunciar que el archivo físico desapareció si no se comprobó.
- La conservación de una foto publicada mediante enlace no garantiza permanencia eterna, disponibilidad durante una caída ni borrado de copias que terceros ya descargaron. Desactivar no es borrar físicamente; la limpieza solo opera con comprobación de referencias y según la política técnica posterior.
- La nueva foto puede quedar almacenada pero no asociada si falla el registro local; no eliminar por compensación una imagen anterior todavía vigente. Identificar la nueva como candidata a limpieza solo cuando se compruebe que no tiene referencias.
- Nunca eliminar primero la principal antigua para después intentar cargar la nueva. Una operación rechazada por imagen obligatoria no desactiva automáticamente el elemento para poder aceptarla.
- Fotos opcionales de tipos de habitación pueden retirarse hasta quedar sin fotos según 007. No se obliga a mantener una foto opcional ni se impone un placeholder desde 012.
- Movilidad activa conserva la imagen requerida de 013; sustituirla válidamente no equivale a añadir una galería. Sin imagen previa, una carga fallida no permite activar el registro.
- El historial protegido se determina por referencias reales y obligaciones del consumidor. 012 no añade por inferencia una copia de fotos a todas las reservas ni presume que referencias externas de terceros son relaciones internas verificables.
- Una mención de ID de imagen en auditoría no exige por sí sola conservar sus bytes indefinidamente; el consumidor debe acreditar cuándo su referencia requiere el archivo legible. La evidencia de auditoría nunca se borra por limpiar el archivo y, si esa obligación no puede comprobarse, RF-22 impide eliminarlo.
- Si un objeto sirve a varias referencias autorizadas, ninguna retirada aislada puede romper las demás. No se deduce de ello una biblioteca compartida o reutilización administrable entre servicios.
- Archivos de borrador/previsualización se controlan por autorización, no solo por «nadie conoce el enlace». Una foto publicada permanece de solo lectura pública mientras se conserve, aunque deje de estar enlazada desde el catálogo; los comandos administrativos siguen protegidos.
- URLs/referencias externas no predecibles no reemplazan permisos. Nombres, tipos y rutas enviados por el cliente no acreditan que el archivo pertenezca al elemento elegido ni que su contenido sea válido.

## Requisitos no funcionales

- **Validación/seguridad:** archivos engañosos, corruptos o con contenido no admitido no se guardan como válidos por coincidir su extensión. La comprobación precede al almacenamiento de la carga, no solo a su publicación; no se presume que cargar directamente y comprobar después ya cumpla RS10. Límites de procesamiento y verificación real se concretan en el plan. (F01 §6; RS10; AC04)
- **Disponibilidad:** una caída de imágenes no modifica automáticamente reservas, precios, disponibilidad o estado comercial. (AC02)
- **Consistencia:** ninguna carrera de principal/galería/limpieza rompe referencias protegidas o deja un activo incompleto; debe probarse antes de implementación real. (AC07/AC11)
- **Historial/auditoría:** evidencias y referencias necesarias preservadas; no editar auditoría desde multimedia ni guardar secretos de almacenamiento. (RN-28/RN-29/RN-30)
- **Restricciones heredadas:** Cloudflare R2 de RF24/RC16/ADR-006 y referencias/datos de gestión necesarios de F01, no imágenes binarias como destino de la base de negocio; archivos del catálogo fuera del filesystem local persistente del backend. No se seleccionan aquí nombres de archivos, librerías, endpoints o mecanismos.
- **Capacidad:** no convertir cuotas técnicas en nuevos máximos comerciales de fotos ni prometer almacenamiento infinito; no declarar SLA sin carga/entorno medidos.

## Casos límite

| Caso | Resultado esperado | Criterios |
|---|---|---|
| Visitante/cliente intenta cargar, cambiar o eliminar | Gestión denegada | RF-1 |
| Destino inexistente o uso no permitido | No asociación inválida ni exposición ajena | RF-2/RF-8 |
| Extensión permitida, contenido distinto/corrupto | Rechazo antes de admitir almacenamiento | RF-4/RF-5/RF-7 |
| Tamaño inferior/igual/superior a 5 MB | Aceptar los dos primeros por tamaño, rechazar el superior | RF-6 |
| Foto nunca publicada de un borrador | Previsualización solo administrativa autorizada | RF-9 |
| Foto publicada, servicio luego desactivado | Enlace conocido puede seguir funcionando sin republicar el servicio | RF-10/RF-11 |
| Principal retirada de activo sin sustituta seleccionada | Conservar principal actual, no elegir arbitrariamente otra | RF-13 |
| Intento de quitar la última obligatoria del activo | Rechazo sin desactivación automática | RF-14 |
| Tipo de habitación queda sin fotos | Permitido, sin placeholder de ejemplo | RF-15 |
| Categoría movilidad recibe intento de galería | No ampliar la única imagen permitida | RF-16 |
| Muchas fotos válidas en oferta/hotel | Sin rechazo por máximo comercial adicional | RF-17 |
| Reemplazo/carga fallidos | Mensaje acordado y fotos anteriores preservadas | RF-18–RF-20 |
| Foto reemplazada aún utilizada por otra referencia | No eliminarla físicamente | RF-21 |
| Fuente de referencias indisponible | No declarar huérfano seguro | RF-22 |
| Objeto nuevo admitido, asociación local falla | No foto publicada ficticia ni borrado de anterior | RF-8/RF-19/RF-23 |
| Limpieza remota falla o resultado desconocido | Pendiente con evidencia, no falsa eliminación | RF-24 |
| Replay/cambios concurrentes | Sin doble asociación, referencia rota o imagen de otro elemento | RF-25/RF-26 |
| Auditoría falla antes del cambio local | Asociación previa conservada | RF-28 |
| Caída de lectura R2 | Sin borrado/desactivación automáticos ni bloqueo de negocio no relacionado | RF-29/RF-30 |
| Enlace conocido de foto pública usado para pedir CSV/PDF/token | No heredar ese acceso público a otro flujo privado | RF-32 |

## Fuera de alcance

- Cambiar formatos, 5 MB, cantidades, mínimos de publicación, opcionalidad de fotos de habitación o imagen única de 013.
- Archivos personales de clientes, perfiles con fotos, credenciales, pruebas de identidad, adjuntos de correo, CSV o reportes PDF como contenido público del catálogo.
- Videos, audio, SVG, documentos descargables de ofertas o formatos distintos de los aprobados.
- Editor de fotos, recorte, marcas de agua, biblioteca global, reutilización administrable entre servicios, carga masiva, orden manual nuevo, carrusel o zoom no solicitados.
- Papelera/recuperación manual de fotos eliminadas, permanencia eterna de enlaces o revocación de copias ya descargadas.
- Borrar físicamente archivos que conserven referencias protegidas o modificar reservas/historial para que queden sin referencias.
- Proveedor distinto de R2, arquitectura de entrega, credenciales, bytes exactos de 5 MB, nomenclatura de objetos, firmas/URLs temporales, reintentos, intervalo de limpieza o librerías: se concretan en el plan posterior según las restricciones.
- Aprobar 011 por referencia, editar specs/planes previos, crear plan/tareas antes de aprobación, ejecutar operaciones o escribir código.

## Criterios de finalización

### Documento

- Conservar RF24/HU de origen y RF-1–RF-32 locales con fuentes.
- Mantener acuerdos de 006/007/013 y diferenciar DEC-194/DEC-195 de esas aprobaciones previas.
- No tratar eliminación física/publicación como si toda operación externa y local fuese indivisible.
- Pedir aprobación explícita del documento completo antes de plan/tareas.

### Implementación futura

- Verificar actor/destino/uso, contenido y tamaño antes de admisión, sin carga inválida presentada como guardada.
- Verificar publicación/preview y enlace de foto ya publicada tras desactivación, sin acceso administrativo o a documentos privados.
- Verificar principal seleccionada antes de retirar, mínimos por ámbito, tipo de habitación opcional y movilidad sin galería.
- Verificar fallos de carga/reemplazo, conservación de la foto anterior y mensaje acordado.
- Verificar referencias compartidas/históricas, origen indisponible, limpieza repetida/desconocida y carreras con nuevas asociaciones.
- Verificar auditoría saneada, fallos controlables sin cambio y disponibilidad aislada.

## Contraste con docs/01-analisis-de-sistema/

| Fuente | Cobertura y límite |
|---|---|
| F01 §6 | Validación de extensión/MIME/tamaño, acceso controlado, referencias necesarias y reemplazo/eliminación consistentes; referencias no predecibles no son autorización. |
| F02 HU-02/HU-14/HU-15/HU-21/HU-23 | Imágenes para oferta/hotel y gestión administrativa preservando contexto/historial. Movilidad se incorpora por la ampliación 013, sin inventar una HU original. |
| F03 RF24 | Cloudflare R2 se conserva; 012 no selecciona un módulo desplegable o proveedor nuevo. |
| F04 AC02/AC04/AC05/AC07/AC09/AC11 | Aislamiento de fallos, validación, permisos, consistencia, auditoría y evidencia futura de pruebas; nada se presenta como implementado. |
| F05 RS10/RC16; F07 ADR-006 | Validar antes de admitir almacenamiento y archivos fuera del backend persistente; no debilitarlo a «validar después de exponer». |
| 006/007/013 y entrevista | Formatos, 5 MB, cantidades y fallos provienen de specs aprobadas; acceso después de desactivar y elección de sustituta proceden de dos respuestas nuevas. |

No se detecta contradicción con el alcance original. El acceso de fotos ya publicadas no permite mostrar metadata de servicios desactivados ni difunde borradores; la eliminación física depende de referencias, no del mero estado activo del servicio.

## Dudas abiertas

- **RESUELTO POR ENTREVISTA:** foto ya publicada mantiene lectura por enlace conocido mientras se conserve; principal de oferta/hotel activo requiere elección previa de sustituta en la misma operación, no asignación automática.
- **ACUERDOS HEREDADOS:** no reabrir formatos, 5 MB inclusivos, cantidades ni respuesta de fallos de 006/007/013.
- **PRECISIONES TRAZADAS:** control de borradores, validación real, conservación de referencias, diferencia entre retirada y borrado físico, repetición/auditoría y errores no destructivos se derivan de F01/RS10/AC02/AC07 y reglas de consumidores; no se atribuyen como respuestas nuevas del usuario.
- **PENDIENTE DEL PLAN:** bytes del límite, procesamiento seguro, arquitectura de acceso/preview, asociación/almacenamiento y recuperación, referencias verificables por propietario, limpieza/reintentos y pruebas de permisos/carga. No se adivina el contrato de R2 ni una cuota comercial de fotos.
- **APROBACIONES REGISTRADAS:** documento v0.1 con 32 criterios mediante DEC-197 y 011 v0.1 separadamente mediante DEC-196. Las comprobaciones técnicas no se dan por realizadas por esas aprobaciones.

## Aprobación de esta especificación

- **Versión aprobada:** 0.1, con 32 criterios.
- **Aprobación explícita del documento completo:** sí; respuesta «si» a la pregunta que enumeró expresamente 011 v0.1 y 012 v0.1 para continuar con sus planes y tareas documentales.
- **Fecha de aprobación:** 2026-11-02; DEC-197.
- **Decisiones de entrevista:** DEC-194/DEC-195, registradas el 2026-11-02; no equivalen a aprobar el documento completo.
- **Preservación:** criterios y planes previos intactos; 011 tiene su propio registro de aprobación.
- **Plan/tareas al registrar aprobación:** no creados; continuación posterior registrada separadamente. Sin archivos reales cargados/eliminados, código, cambios de proveedores, commits ni push.
