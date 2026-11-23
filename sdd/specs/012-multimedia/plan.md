# Plan técnico — Spec 012: Multimedia

> **Fecha:** 2026-11-02. **Versión del plan:** 0.1.  
> **Base:** [spec v0.1 aprobada](spec.md), 32 criterios; DEC-197, acuerdos DEC-194/DEC-195 y contratos aprobados de 006/007/013.  
> **Estado:** propuesta técnica **NO EJECUTADA**; planificación documental en DEC-199. Sin código, cargas/borrados reales, credenciales o configuración de R2.  
> **Preservación:** specs/planes/tareas anteriores intactos; no crear biblioteca global, galería de Movilidad o límites comerciales de fotos.

## 1. Alcance y fuentes

Capacidad compartida del monolito para admitir imágenes válidas, asociarlas mediante sus consumidores y limpiar objetos sin referencias comprobadas. No es un nuevo servicio desplegable ni propietario de condiciones comerciales.

Fuentes: [constitución](../../constitution.md), [inventario](../../fuentes.md), [decisiones](../../decisiones.md), RF24/RC16/ADR-006, RS10, AC02/AC04/AC05/AC07/AC09/AC11 y [006](../006-catalogo/spec.md), [007](../007-hoteles/spec.md), [013](../013-movilidad-informativa/spec.md). 005 aporta autorización; 010 auditoría. Las puertas ACL-13/ACL-17 de planes anteriores se concretan aquí; no se declaran superadas por esta redacción.

## 2. Responsabilidades y contratos

- **Application:** comando administrativo autorizado, identidad de operación, admisión y contratos de asociación/retirada/lectura. El consumidor conserva su invariante de principal, galería, mínimo y activación.
- **Infrastructure:** validación/decodificación acotada, SDK S3 compatible con R2, repositorio de metadata/operaciones, lectura privada de objetos y reconciliador de limpieza.
- **Presentation:** carga recibida por backend y lectura de imagen/preview según autorización; no recibir bucket, key o URL arbitrarios como destino.
- **Persistencia propuesta:** registro de activo con ID opaco, clave inmutable generada por servidor, formato/MIME/tamaño/huella confirmados, versión, estado de operación, publicación histórica y referencias protegidas identificables. PostgreSQL guarda gestión/referencias, no binarios como destino del catálogo.
- **Consumidores:** modificar relación de foto/principal y registro de referencias/estado de publicación bajo la misma transacción local y protocolo de bloqueo. Sin HTTP interno o acceso informal a repositorios ajenos: contrato de unidad de trabajo compartida explícito.

Un inventario de referencias alimentado solo después por eventos no basta para eliminar: entre una asociación real y su incorporación, un limpiador podría borrar un archivo necesario. Deben acreditarse todos los escritores de 006/007/013 y los consumidores históricos que realmente requieran bytes. Si no puede verificarse su participación, limpieza deshabilitada para ese objeto/origen.

## 3. Admisión antes de R2

Propuesta explícita de unidad: **5 MB = 5.000.000 bytes**, máximo inclusivo del contenido de cada archivo, no de todo el multipart. Mostrarlo en contrato/UI y verificar fronteras `4.999.999 / 5.000.000 / 5.000.001`. Es traducción técnica propuesta, no nuevo máximo comercial; revisar incompatibilidades con contratos existentes antes de implementar.

Autenticar/autorizar antes de procesar cuerpo costoso. Leer con contador real y límite; `Content-Length` del cliente no demuestra tamaño. No rechazar una imagen de exactamente 5 MB por contar cabeceras multipart como parte de sus bytes; el límite de petición debe contemplar ese overhead acotado. Proponer una imagen por operación, sin impedir subir tantas fotos como permite el consumidor ni inferir carga masiva.

Validar extensión normalizada, MIME declarado y formato real coherentes: `.jpg`/`.jpeg` son aliases de JPEG, MIME `image/jpeg`; PNG `image/png`; WebP `image/webp`. No confiar solo en magic bytes; comprobar estructura y decodificación completa mediante una biblioteca mantenida y licencia/runtime verificados. Rechazar vacío, corrupto, truncado o contenido no admitido sin escribirlo primero en R2. No usar extensión original como clave o nombre de respuesta.

Procesamiento temporal en memoria acotada, sin filesystem local persistente o tablas de blobs como almacenamiento de imágenes. Dimensionar presupuestos de dimensiones/píxeles/frames/memoria/CPU y concurrencia contra el host antes de habilitar: 5 MB comprimidos no acotan el consumo decodificado. Si para seguridad hace falta excluir una clase de JPG/PNG/WebP que cumple el contrato, documentar el conflicto y pedir decisión; no ocultarlo como un formato comercial nuevo o como rechazo por tamaño.

Seleccionar decodificador/versiones y dependencias nativas con evidencia de seguridad/licencia Linux; no introducir editor, optimización, watermark o transformación con pérdida. Mantener los bytes admitidos para su huella y verificación. Las credenciales solo del servidor y con mínimo alcance; CSRF/cookies y límites de abuso siguen 005/seguridad, no la impredecibilidad del ID.

## 4. Carga y asociación sin falsa atomicidad externa

1. Validar actor, destino/uso y versión actual del consumidor; validar íntegramente bytes antes de enviarlos a R2.
2. Crear registro durable de operación y clave única nueva, nunca sobrescribir la clave anterior. Describir estado de subida pendiente sin anunciar imagen guardada/publicada.
3. Enviar el archivo admitido, MIME canónico y metadata de integridad según soporte oficial verificado. No asumir ETag = SHA-256 o MD5 universal; contrastar bytes/huella con lectura del origen si se requiere, antes de asociación.
4. Con almacenamiento confirmado, bloquear activo y consumidor en orden fijo, revalidar permiso/estado/versión/destino y aplicar asociación, principal/publicación y auditoría requerida en la misma transacción local.
5. Después del commit confirmar resultado. Si el commit es desconocido, consultar por identidad de operación antes de repetir; no compensar borrando el objeto que el commit podría haber asociado.

Fallo de carga/asociación/reemplazo conserva referencias y fotos anteriores, con «No se pudo cargar la imagen». Un objeto nuevo almacenado pero no asociado queda recuperable; no borrar otra foto en una compensación. Un timeout remoto no se etiqueta como rechazo definitivo ni provoca otra subida automática de cara al usuario; verificar la operación pendiente. Se respeta 013: no añadir reintento automático de carga desde la tarjeta o UI.

Idempotencia de comando propuesta: actor/operación/destino/uso + huella de payload; misma identidad con otro contenido produce conflicto, no otra asociación. El replay devuelve resultado confirmado o pendiente verificable. No asumir que el API S3 ofrece idempotencia de negocio; la identidad local y clave fija de esa operación conservan trazabilidad.

## 5. Publicación y acceso

**Propuesta:** bucket R2 privado, sin acceso público `r2.dev` o dominio público directo; lectura mediante backend. El navegador no recibe credenciales, claves privadas de SDK o URL de subida que eluda validación previa. No se solicita habilitar esta configuración ahora.

El endpoint público identifica el activo opaco y solo lee si existe marca durable **publicada alguna vez** y objeto disponible. Esa marca se establece en la primera publicación real del consumidor —o al asociar foto válida a un elemento ya público—, no por subir un archivo a un borrador. Activar/desactivar debe coordinarse con el mismo contrato de referencias/publicación: una foto que nunca fue publicada no se vuelve pública por adivinar un enlace.

La marca histórica de publicación no se revoca por desactivar el servicio o retirar su enlace del catálogo. Mientras el archivo se conserve, el enlace conocido de esa foto sigue permitiendo lectura; no responde con metadata del propietario ni vuelve a listar su oferta/hotel/movilidad. Si otra referencia legítima ya hizo pública la misma imagen, esos bytes no son un borrador secreto; ello no habilita reutilización administrable entre servicios.

Previsualización de activo nunca publicado: administrador vigente por backend, caché `private, no-store`, sin URL pública temporal que dé acceso por mero conocimiento. Fotos publicadas: MIME canónico, `nosniff`, nombre seguro e integridad/longitud verificada; proponer caché `no-store` inicial para no introducir dependencia de purga/revocación. No aplicar esta ruta/política a PDF/CSV/tokens/correos/documentos privados de 004/005/008/010/011.

Una lectura fallida no desasocia, desactiva o borra. La respuesta administrativa distingue fallo temporal de datos ya confirmados; la UI conserva el mensaje de fallo de carga donde corresponde y no inventa placeholder guardado. Separar timeouts/recursos de imagen de peticiones de reservas/pagos; no sondear R2 sincrónicamente en cada operación de negocio no relacionada.

## 6. Principal y concurrencia con consumidores

- Oferta/hotel activo: retirar principal exige sustituta válida seleccionada en la misma operación. Revalidar su asociación al elemento bajo bloqueo/versionado; sin elección o si ya no es válida, conservar principal anterior. No elegir «la primera» de forma automática.
- Nunca aceptar una edición que deje activo sin foto obligatoria ni desactivar automáticamente para aceptarla. Tipos de habitación conservan fotos opcionales y sin foto de ejemplo; Movilidad exactamente una, sin galería.
- La nueva asociación se aplica antes de retirar la anterior dentro del commit local; el borrado físico no participa en ese commit. No eliminar primero la foto anterior.
- Orden estable de locks por IDs de activos/elemento; participación de todos los comandos de edición/activación/asociación/limpieza. Clave y generación inmutables evitan que un retry borre un reemplazo distinto.
- La capacidad comercial de fotos no se limita a un número: quotas técnicas/backpressure se tratan como indisponibilidad o trabajo posterior explícito, no «máximo de cinco fotos» inventado.

## 7. Referencias, limpieza y resultado desconocido

Proponer candidatos a limpieza desde 24 horas después de quedar realmente sin referencias, comprobados cada 15 minutos mediante trabajo durable/lease. Son parámetros operativos ajustables, no plazo de borrado garantizado, retención eterna o posibilidad de restauración comercial. Nunca activar una regla general del bucket que borre por edad/prefijo sin verificar referencias.

Antes de enviar `DeleteObject`, adquirir bloqueo local del activo, comprobar referencias vigentes/históricas protegidas y escrituras pendientes, y cerrar nuevas asociaciones mediante estado/fence durable. Revalidar contratos de todos los consumidores; un lector/registro indisponible bloquea esa limpieza, no acredita cero referencias. No sostener una transacción PostgreSQL abierta esperando red: persistir intención y fence primero, eliminar fuera y registrar resultado después.

Una asociación concurrente gana antes del fence y evita borrado, o queda rechazada por el fence; jamás se acepta durante un borrado pendiente/desconocido. No reutilizar una clave eliminada ni levantar el fence simplemente porque expiró un lease del worker. Para nuevas cargas usar otro activo/clave, no resucitar un activo que otro worker aún podría borrar.

Retirada local válida puede estar aplicada aunque la limpieza física falle. Conservar ID/clave/huella/operación/estado de verificación, backoff acotado y alerta/diagnóstico saneado; la misma limpieza solo afecta esa clave y su generación. No agregar un correo no contemplado por 004: un canal nuevo requiere su propio contrato.

**Escrituras desconocidas:** `HeadObject/GetObject` con ausencia no demuestra que una subida anterior haya finalizado. Mantener estado pendiente y fence de no asociación mientras existan escrituras potencialmente en vuelo. Deshabilitar/revisar retries automáticos del SDK que puedan escribir después de limpiar y no crear otra operación sobre la misma clave.

Para dar una eliminación por confirmada, resolver primero las escrituras pendientes y comprobar el origen autenticado sin CDN; un HTTP 403/timeout no es ausencia. Si el proveedor/SDK no permite probar que una escritura desconocida ya no puede materializarse, conservar incidente/tombstone y reconciliar posteriores apariciones, sin declarar cierre físico definitivo por un único 404 o por esperar 24 horas. TTL de espera y cancelación del cliente no son pruebas de cancelación remota.

La sola mención de ID en auditoría no exige bytes eternos, pero la auditoría nunca se elimina al limpiar. Referencias históricas con obligación de lectura del archivo sí lo protegen; contrato desconocido impide borrar. No introducir copias de fotos a reservas por inferencia o borrar referencias para «liberar» el objeto.

## 8. Evidencia pública consultada y puertas de proveedor

Lectura pública el **2026-11-02**, sin cuenta, configuración o peticiones a objetos reales:

| Fuente oficial | Hallazgo | Verificación posterior |
|---|---|---|
| [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/) | Consistencia fuerte por objeto no convierte PostgreSQL + R2 en una transacción; lectura negativa no concluye una escritura en vuelo. Cachear puede alterar lo observado por la ruta pública. | PUT/HEAD/GET/DELETE, timeout y escrituración tardía con SDK/versiones y origen real autorizado. |
| [S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/) | R2 documenta soporte por operación y diferencias con S3. | No deducir soporte de todos los headers/checksums/condiciones/idempotencia de AWS; verificar los utilizados. |
| [Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/) | Publicación directa es una configuración distinta del almacenamiento privado. | Acreditar que borradores no son accesibles por `r2.dev`, dominio directo, caché o credenciales filtradas. |

No se garantiza una cuenta/bucket configurados correctamente por estas páginas. SDK/decoder deben fijarse y revisarse por versión antes de implementar; no instalar paquetes o inventar semántica no documentada.

## 9. Auditoría, API y recuperación

Auditar carga/asociación/principal/reemplazo/retirada efectivamente aplicados, con actor, entidad, ID/uso de foto, correlación, fecha y resultado. El consumidor y 012 evitan dos eventos idénticos por reintento. Si falla la auditoría requerida antes del cambio controlable, abortar transacción local; no deshacer una escritura remota desconocida por suposición. La evidencia de operación sirve para reconciliar sin perder el resultado real.

Contratos de API/OpenAPI: comandos de foto ligados a consumidor/uso, claves idempotentes, versiones, preview administrativo y lectura publicada. DTOs limitados a referencias públicas/resultado saneado; ProblemDetails y mensaje acordado no incluyen bucket/keys administrativas/rutas temporales/cabeceras firmadas. Si falta foto obligatoria, error no cambia estado comercial ni inventa una sustituta.

Métricas propuestas: validación, memoria/tiempo de procesamiento, operaciones pendientes/desconocidas, objetos sin referencia, limpieza bloqueada por origen, fallos de lectura y recuperaciones. Logs sin bytes, secretos, enlaces firmados o datos del cliente; pruebas de fallos no se confunden con éxito de integración.

## 10. Puertas y entregables

[tasks.md](tasks.md): **T012-01–T012-30**, todas pendientes; cobertura RF-1–RF-32.

1. **U-01 Admisión/runtime:** unidad inclusiva, decodificador/licencia/patches/Linux, límites de recursos y validación antes de R2 sin restringir comercialmente formatos por suposición.
2. **U-02 Acceso/proveedor:** credenciales y bucket privados, API/SDK real, publicación histórica/preview, errores/consistencia y cero enlaces secretos públicos.
3. **U-03 Consistencia de consumidores:** asociación/principal/activación/auditoría bajo contrato transaccional, todos los escritores y referencias históricas registrados; foto anterior conservada.
4. **U-04 Limpieza/recuperación:** fence durable, referencias verificables, concurrencia/leases/retries y PUT tardío tras lectura negativa; no cierre ficticio o borrado de referencia vigente.
5. **U-05 Calidad/capacidad:** pruebas RF completas, carga/seguridad/aislamiento, sin límite comercial inventado o SLA no medido.
6. **U-06 Autorización:** código, instalación, cuenta/configuración y sandbox con objetos reales requieren actividad posterior explícita. Este documento no las autoriza.
