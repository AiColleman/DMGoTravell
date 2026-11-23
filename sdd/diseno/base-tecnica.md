# Base técnica propuesta: estructura, plataforma y dependencias

> **Versión:** 0.1, 2026-11-02. **Registro:** DEC-210.  
> **Estado:** recomendación técnica documentada, pendiente de ratificación y pruebas; **NO IMPLEMENTADA**.  
> **Ámbito:** ACL-18/ACL-19 y condiciones transversales de los planes; no nuevas funcionalidades o ADR aceptadas.  
> **Preservación:** 677 criterios aprobados, 402 tareas pendientes y todos los documentos anteriores intactos. No scaffolding, instalación/restauración de paquetes, build, migraciones, infraestructura o código.

## 1. Situación real y autoridad

La lectura del árbol raíz confirma documentación, `img/`, `sdd/`, `.git/` y README; no proyectos backend/frontend, solución, manifiestos de paquetes o pipelines implementados. No se deduce una implementación de los nombres de clases de los diagramas.

Fuentes: [constitución](../constitution.md), [aclaraciones](../aclaraciones.md), [README raíz: estructura prevista](../../README.md), [F12: módulos/estructura](../../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md), [restricciones originales](../../docs/01-analisis-de-sistema/05-restricciones.md), [análisis transversal](../analisis-consistencia.md) y [planes vigentes](../specs/README.md). La base integra recomendaciones sin modificar documentos aprobados o corregir la documentación original fuera de `sdd/`.

La organización propuesta precisa la variante de cuatro proyectos del README y conserva las responsabilidades de Presentation de F12. No exige al usuario elegir nombres/capas de procedimiento, pero tampoco convierte una recomendación en aprobación de arquitectura o autorización de código.

## 2. Organización física recomendada

Rutas **propuestas para implementación futura**, no carpetas/proyectos creados:

```text
src/
  DMGoTravel.Domain/
  DMGoTravel.Application/
  DMGoTravel.Infrastructure/
  DMGoTravel.Api/
tests/
  DMGoTravel.Domain.Tests/
  DMGoTravel.Application.Tests/
  DMGoTravel.IntegrationTests/
  DMGoTravel.ArchitectureTests/
frontend/
sdd/                         documentación existente, se conserva
docs/                        fuentes existentes, se conservan
```

- Convención uniforme de código/namespace: `DMGoTravel`, sin renombrar la carpeta confirmada `Desktop\DMGoTravelll`, marca comercial o documentos. No crear `.specify/` o `specs/` alternativos en raíz.
- `Api` contiene la capa Presentation: endpoints/DTO HTTP, middleware, autenticación HTTP, OpenAPI/ProblemDetails y composición del host. No quinto proyecto `Presentation` ni segundo ejecutable backend. Es una recomendación de organización, no una eliminación de la capa.
- Domain/Application/Infrastructure conservan módulos en áreas por funcionalidad, con contratos públicos en Application y adaptadores privados de cada origen. Identity/Perfil, Catalog, Hotels, Reservations/Administración, Payments, Notifications, Reports, Audit y el área informativa Mobility permanecen dentro del monolito.
- Multimedia es capacidad compartida/puertos y adaptador, no un nuevo despliegue o biblioteca comercial global. Background Jobs es ejecución técnica dentro del mismo host, no propietario de reglas duplicadas o otro servicio.
- Tests son proyectos de comprobación, no servicios productivos. `frontend/` conserva React/TypeScript/Vite como aplicación desplegada en Vercel, sin backend Node/BFF/SSR agregado por este documento.

## 3. Dependencias y comprobación entre capas

| Área | Dependencias permitidas | Prohibición verificable |
|---|---|---|
| Domain | Tipos propios y primitivas/objetos de valor de dominio compartidos mínimos | No EF Core/Npgsql, Identity stores, ASP.NET/HTTP, MediatR, FluentValidation, hosting, SDK de Culqi/Resend/R2 o Hangfire. |
| Application | Domain; CQRS/MediatR, validadores y contratos de reloj/actor/transacción/lectura según stack | No implementar SQL/SDK/HTTP ni consumir repositorios concretos ajenos; no depender de Api/Infrastructure. |
| Infrastructure | Application/Domain; persistencia, Identity stores, proveedor/colas/archivos/criptografía | No reglas de reserva/pago inventadas en adaptadores, entidades de HTTP o dependencia de Api. |
| Api / Presentation | Application y tipos públicos necesarios | Endpoints no usan DbContext/repositorios/SDK o reglas propias de confirmación; autorización también en casos de uso. |
| Api / composición | Infrastructure y Application para registrar implementaciones y host | La referencia del ejecutable a Infrastructure no autoriza su uso desde endpoints. Pruebas por namespaces/tipos deben acreditar la frontera: cuatro proyectos no la imponen por sí solos. |

Los módulos dentro de una misma assembly no quedan aislados solo por carpetas. La comprobación de arquitectura debe detectar accesos a implementaciones/entidades ajenas y ciclos no autorizados; contratos de Application son la frontera. Evitar una carpeta `Common` convertida en repositorio global de entidades de todos los módulos.

Proponer un contexto/unidad transaccional local compartidos de Infrastructure para los participantes críticos, con configuración por origen y contratos de enlistamiento; no base independiente por módulo ni repositorios que confirmen efectos parciales. El contexto de captura de reportes/CSV debe acreditar su vista coherente sin heredar indiscriminadamente el aislamiento de los comandos financieros.

No mover reglas a triggers o callbacks genéricos para eludir autorización/pruebas. El protocolo real de locks/raíces, privilegios y recuperación sigue en sus planes y contratos; no queda probado por elegir nombres de proyectos.

## 4. Familias de plataforma recomendadas

La tabla fija **familias candidatas**, no un lockfile, SDK instalado o compatibilidad transitiva demostrada. Los parches exactos deben quedar fijados en la actividad futura autorizada tras resolver dependencias/licencias/vulnerabilidades; no usar versiones flotantes en una entrega reproducible.

| Componente | Recomendación | Límite de aceptación |
|---|---|---|
| Backend | .NET/ASP.NET Core 10 LTS, target `net10.0`, versión C# estable predeterminada del SDK elegido | No preview/RC como baseline inicial. SDK, runtime, imagen Linux y parches son identidades distintas; no deducir número de SDK de un parche del runtime. |
| ORM/driver | EF Core 10 y `Npgsql.EntityFrameworkCore.PostgreSQL` 10 compatibles, con driver Npgsql transitivo verificado | La release 10 del proveedor existe; la combinación exacta/restore/plugins/migraciones se prueba. No copiar `net8.0`/8.0.4 del ejemplo de inicio como versión recomendada. |
| Validación | FluentValidation 12 en Application y validación explícita de casos de uso | Documenta .NET 8+ incluido 10. Se elige la opción ya nombrada del stack, sin sustituir por equivalente o borrar la alternativa histórica de RC08. |
| CQRS | MediatR, versión estable compatible y condiciones de licencia verificadas | No fijar un major/paquete sin términos/versiones comprobados, elegir una versión obsoleta para evitar revisión o cambiar a otro mediator sin decisión correspondiente. |
| Frontend/build | Node.js 24 LTS como candidata estable; Vite 8 con template React/TypeScript compatibles | Node 24 consta LTS, no se lo llama «último»: Node 26 también figura LTS. Vite publica requisitos de Node y advierte que templates pueden exigir más. React/TypeScript/plugin/paquetes exactos se fijan conjuntamente, no se inventan versiones desde un badge. |
| Base de datos | PostgreSQL en Supabase, versión real y funciones admitidas por proyecto/entorno | No suponer PostgreSQL 18 por aparecer en ejemplos de Npgsql 10, habilitar extensiones o crear una cuenta/base. |
| Jobs | Hangfire compatible con runtime y almacenamiento PostgreSQL, dentro de Api | Selección de paquete/storage exactos, tablas/conexión/pooling y host siempre activo requieren evidencia. No SQL Server/Redis de ejemplos o job en contenedor dormido como garantía de 60 segundos. |
| PDF/imagen/SDK externos | Bibliotecas y adaptadores de los planes 011/012/004/002 | Licencia, seguridad, dependencias nativas, runtime/OS y contratos financieros/almacenamiento se validan por versión. No aprobación económica o cambio de proveedor implícitos. |

Se recomienda .NET 10 porque la política consultada da soporte hasta **2028-11-14**, mientras .NET 8/9 terminan el **2026-11-10**, cercano a la fecha de este registro. La recomendación no acredita que una imagen/SDK estén instalados, parcheados o soportados en cualquier sistema operativo.

## 5. Evidencia pública consultada el 2026-11-02

| Fuente oficial | Evidencia obtenida | Lo que no acredita |
|---|---|---|
| [.NET Support Policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) | Incluye runtime/SDK/ASP.NET Core/EF Core; .NET 10 LTS activo con fin 2028-11-14 y .NET 8/9 con fin 2026-11-10; exige mantenerse en parches soportados | Instalación local, número exacto de SDK elegido, imagen Docker o compatibilidad de todos los paquetes de terceros. |
| [Npgsql 10 release notes](https://www.npgsql.org/efcore/release-notes/10.0.html) | La versión 10 del proveedor está publicada y describe soporte EF 10/breaking changes | Todas las funciones de PostgreSQL 18 disponibles en Supabase; ejemplos no son autorización de DDL o elección de esquema. |
| [Npgsql EF provider](https://www.npgsql.org/efcore/) | Identifica `Npgsql.EntityFrameworkCore.PostgreSQL`, su relación con driver Npgsql y opciones dependientes de versión | El ejemplo de proyecto `net8.0`/8.0.4 como recomendación actual; restore o configuración real. |
| [FluentValidation](https://docs.fluentvalidation.net/en/latest/) | FluentValidation 12 soporta .NET 8 y posteriores, incluido .NET 10 | Validadores/middleware instalados o reglas del proyecto implementadas. |
| [Node.js Releases](https://nodejs.org/en/about/previous-releases) | Node 24 y 26 figuran LTS; la página recomienda LTS para producción | Engine de Vercel configurado o compatibilidad de cada template/plugin; Node de build no es un backend nuevo del negocio. |
| [Vite Getting Started](https://vite.dev/guide/) | Página de la familia 8, template `react-ts`, Node 20.19+/22.12+ y advertencia de templates con requisitos mayores | Instalar por `latest`, usar Node 20 fuera de soporte por cumplir un mínimo de Vite o dar por satisfechas todas las dependencias. |
| [MediatR README del mantenedor](https://raw.githubusercontent.com/LuckyPennySoftware/MediatR/master/README.md) | Documenta configuración de clave de licencia, su registro y renovación | Texto completo de licencia, elegibilidad gratuita, precio, versión NuGet seleccionada o permiso para usar sin revisar condiciones. Un README de rama no sustituye términos de la versión instalada. |

Las primeras peticiones a las notas Npgsql 10 y guía de actualización FluentValidation 12 devolvieron error de transporte; posteriormente se obtuvieron las notas Npgsql y la página principal oficial FluentValidation. No se presenta como leído el contenido de una guía que falló. No se instalaron paquetes, ejecutaron los comandos de ejemplo o usaron cuentas/credenciales.

## 6. Licencias, reproducibilidad y configuración segura

- MediatR sigue siendo restricción del stack; revisar licencia de la versión exacta y su aplicabilidad al proyecto antes de usarla. No pedir al usuario que decida un paquete por comodidad, comprar licencia, registrar datos comerciales o silenciar un aviso como prueba de cumplimiento.
- PDFsharp/MigraDoc y decodificador de imágenes conservan Q-04/U-01. No asumir que la licencia de ejemplos/README corresponde al binario, sus fuentes o dependencias transitivas; no congelar una versión vieja sin revisión de mantenimiento/vulnerabilidades.
- Propuesta futura de fijación: SDK en `global.json`, versiones NuGet centralizadas y lockfile/restore reproducible, un gestor de paquetes frontend con su lockfile e imágenes identificables. Esos archivos **no se crean ahora** y esos nombres no constituyen herramientas instaladas o una versión elegida por el usuario.
- No secretos en archivos versionados ni en variables públicas del build. Lo prefijado para exposición frontend no almacena credenciales de Culqi/Resend/R2, JWT signing, claves de protección o conexión PostgreSQL. Esquemas de configuración con nombres y valores de ejemplo no son un inventario de secretos reales.
- Supabase se usa como PostgreSQL, no autenticación social/negocio directa del navegador. Identity/JWT propios y políticas de estado/familia se conservan; bearer incorporado de una plantilla no se considera JWT estándar ni revocación suficiente.
- CORS/orígenes, cookie/CSRF, claves compartidas, proxy de API frente a DNS Only del frontend, Dashboard protegido, TLS/pooling, backups y restauración de ACL-20 requieren configuración/pruebas de entorno. No se copian dominios de los diagramas como propiedad/configuración verificada.
- Migraciones con identidad/privilegios separados de runtime; no migrar automáticamente producción al arrancar el host, borrar datos en rollback o otorgar al lector/cleanup permiso para modificar auditoría. La política concreta de despliegue es trabajo posterior, no operación realizada aquí.

## 7. Orden técnico de validación existente

Este orden consolida condiciones de los backlogs; no añade tareas, fechas de entrega, prioridades HU o permiso de ejecutar:

1. Verificar licencias/versiones/compatibilidad de la matriz y ratificar estructura/namespace; ninguna solución real se crea sin actividad autorizada.
2. Acreditar compilación/restauración y dependencias de capas en entorno limpio autorizado, sin Domain dependiente de ORM/HTTP o endpoints usando Infrastructure fuera de composición.
3. Verificar PostgreSQL/EF/Npgsql con identidad, unicidades, transacciones/locks y vista de captura; no sustituir la base real por un proveedor en memoria para probar carreras.
4. Integrar por contratos de origen identidad/auditoría/entrega, catálogo/hoteles/multimedia y reserva/pago/vencimiento; no esperar al final para añadir auditoría o controles de acceso omitidos.
5. Probar proveedor/colas/runtime/Linux/fuentes/claves y carga, sin operaciones live implícitas. Cumplir puertas específicas antes de habilitar cada efecto externo.

## 8. Puertas y trazabilidad

| ID | Estado/evidencia pendiente | Destino existente |
|---|---|---|
| BT-01 — Estructura y arquitectura | Variante de cuatro proyectos/namespace propuesta; referencias y aislamiento por tipo/namespace deben ratificarse y probarse. [Plan de ratificación](plan-bt-01.md), DEC-222. | ACL-18; 001/T003/T036, T013-01/T013-16 y pruebas de arquitectura de los backlogs. |
| BT-02 — Compatibilidad y licencias | Familias recomendadas con evidencia pública; versiones exactas, términos/eligibilidad, vulnerabilidades, restore/build/imagen no comprobados | ACL-18/ACL-19; I-01/V-01/Q-04/U-01/RV-03 y tareas de plataforma respectivas. |
| BT-03 — Persistencia/host/configuración | Versión PostgreSQL real, contexto/transacción/privilegios, jobs siempre activos, cookies/orígenes, secretos/backup/restore pendientes | ACL-17/ACL-20; G/V/M/I/P/R/A/Q/U/RV de planes vigentes. |
| BT-04 — Autorización y evidencia | No código, paquetes, pipelines, migraciones o entorno configurados en esta actividad; una recomendación/lectura pública no habilita producción | [Índice de planes/tasks](../specs/README.md); última puerta de autorización de cada plan. |

ACL-18 queda con **recomendación técnica concreta**, no aprobación/implementación; ACL-19 no requiere inventar otra librería: usar FluentValidation evita la sustitución no autorizada, sin borrar el texto alternativo original. ACL-17/ACL-20 no se cierran por elegir un runtime. Se conserva toda puerta específica de proveedores, tiempo, concurrencia y recuperación.

La base no modifica specs/planes/tasks anteriores, [análisis](../analisis-consistencia.md) o contratos propuestos, ni añade backlog/criterios de negocio. Se mantienen **677 criterios aprobados y 402 tareas pendientes**, cero ejecutadas.
