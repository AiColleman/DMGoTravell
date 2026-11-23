# Plan de ratificación BT-01 — estructura y aislamiento

> **Fecha:** 2026-11-05. **Versión:** 0.1. **Registro:** DEC-222.  
> **Objeto:** [base técnica v0.1](base-tecnica.md), DEC-210; [cierre del diseño técnico](cierre-diseno-tecnico.md), DEC-216; [plan API-01](plan-api-01.md), DEC-214.  
> **Estado:** **plan RATIFICADO DOCUMENTALMENTE por DEC-239**; BT-01-A01–A10, BT-02–BT-04 y la evidencia de arquitectura siguen pendientes. No crea solución, proyectos, carpetas, paquetes, código, pruebas ejecutables, pipelines, SQL, migraciones, configuración, commits o push.  
> **Puerta:** BT-01 mantiene abiertas las comprobaciones BT-01-A01–A10 sobre una solución autorizada y las puertas BT-02–BT-04.

## 1. Resultado esperado

BT-01 exige fijar la variante de cuatro proyectos, las referencias permitidas y la separación efectiva entre capas y módulos. La base técnica ya propone esa estructura; este plan define cómo ratificarla y qué evidencia la acredita.

La ratificación no demuestra que el código futuro cumpla: solo fija la estructura objetivo y las comprobaciones que deberán pasar cuando exista una solución autorizada.

## 2. Alcance y autoridad

| Elemento | Propuesta |
|---|---|
| Fuente de estructura | [Base técnica v0.1](base-tecnica.md), DEC-210. |
| Fuente de puertas | [Cierre del diseño técnico](cierre-diseno-tecnico.md), DEC-216. |
| Fuente funcional | Specs 001–013 y complementos 004/005, ya aprobados. |
| Alcance | Backend .NET, proyectos de prueba y frontera con `frontend/`. |
| Fuera de alcance | Paquetes/versiones exactas, PostgreSQL real, cookies/CSRF, proveedores, R2, PDF, jobs y despliegue. |
| Resultado | Decisión documental sobre proyectos, referencias, módulos y pruebas de arquitectura. |

No se añaden RF/HU/RN ni se cambian reglas comerciales.

## 3. Estructura objetivo propuesta

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
```

Reglas:

- Exactamente **cuatro proyectos de producción** en `src/`; `Api` es Presentation y el único ejecutable backend.
- `Domain` no depende de ningún otro proyecto.
- `Application` depende de `Domain`.
- `Infrastructure` depende de `Application` y `Domain`.
- `Api` referencia `Application` e `Infrastructure` para composición; los endpoints no usan implementaciones de Infrastructure.
- Los proyectos de `tests/` no son servicios productivos ni se despliegan.
- `frontend/` conserva React/TypeScript/Vite; no se agrega backend Node/BFF/SSR.
- No se crea un quinto proyecto `Presentation`, un segundo host backend ni una base independiente por módulo.

## 4. Matriz de dependencias

| Área | Puede depender de | No puede depender de | Comprobación |
|---|---|---|---|
| Domain | Tipos propios y valores de dominio compartidos mínimos | Application, Infrastructure, Api, EF Core, Npgsql, ASP.NET, MediatR, FluentValidation, Hangfire, SDK de proveedores | Referencias de proyecto y namespaces |
| Application | Domain; contratos de reloj/actor/transacción/lectura | Api, Infrastructure, SQL, HTTP, SDK de proveedores, repositorios concretos ajenos | Referencias y tipos prohibidos |
| Infrastructure | Application, Domain; persistencia, Identity stores, archivos, criptografía, proveedores | Api; reglas de reserva/pago inventadas; entidades HTTP | Referencias y namespaces |
| Api / endpoints | Application y tipos públicos | DbContext, repositorios concretos, SDK, reglas de confirmación propias | Análisis de tipos y endpoints |
| Api / composición | Infrastructure y Application para registrar implementaciones | Uso de Infrastructure desde endpoints | Prueba de composición separada del endpoint |
| Tests | Proyectos bajo prueba y utilidades de prueba | Dependencias que oculten la frontera o conviertan tests en producción | Referencias de test |

La referencia del ejecutable a Infrastructure es necesaria para composición, pero no autoriza su uso desde endpoints. Esa distinción debe probarse; los cuatro proyectos no imponen el aislamiento por sí solos.

## 5. Módulos y fronteras internas

Módulos previstos dentro del monolito:

- Identity/Perfil
- Catalog
- Hotels
- Reservations/Administración
- Payments
- Notifications
- Reports
- Audit
- Mobility informativa
- Multimedia como capacidad compartida/puertos
- Background Jobs como ejecución técnica del mismo host

Reglas:

- Los contratos públicos viven en Application; los adaptadores concretos viven en Infrastructure.
- Un módulo no accede a entidades, repositorios o implementaciones internas de otro módulo.
- La comunicación entre módulos usa contratos de Application o puertos explícitos, no una carpeta `Common` global de entidades.
- No se crean ciclos no autorizados entre módulos.
- Las reglas de reserva, pago, vencimiento, liberación y auditoría no se mueven a triggers o callbacks genéricos para eludir autorización o pruebas.
- El contexto transaccional compartido de Infrastructure se configura por origen; no confirma efectos parciales ni sustituye las pruebas de concurrencia.

## 6. Comprobaciones BT-01-A01 a BT-01-A10

Estas comprobaciones se ejecutarán cuando exista una solución autorizada. No se ejecutan ahora.

| ID | Comprobación | Evidencia mínima |
|---|---|---|
| BT-01-A01 | Existen exactamente cuatro proyectos de producción y un solo ejecutable backend. | Archivos de solución/proyecto y referencias. |
| BT-01-A02 | `Domain` no referencia Application, Infrastructure, Api ni paquetes prohibidos. | Referencias de proyecto y análisis de namespaces. |
| BT-01-A03 | `Application` no referencia Api/Infrastructure ni implementa SQL/HTTP/SDK. | Referencias y tipos prohibidos. |
| BT-01-A04 | `Infrastructure` no referencia Api ni contiene reglas de negocio inventadas. | Referencias, namespaces y revisión de adaptadores. |
| BT-01-A05 | Los endpoints no usan DbContext, repositorios concretos, SDK o reglas de confirmación propias. | Análisis de tipos y revisión de endpoints. |
| BT-01-A06 | La composición del host registra implementaciones sin filtrarlas a endpoints. | Prueba de composición y revisión de middleware. |
| BT-01-A07 | No hay ciclos no autorizados entre módulos. | Grafo de dependencias y prueba de arquitectura. |
| BT-01-A08 | Ningún módulo accede a entidades/repositorios internos de otro. | Análisis de namespaces/tipos y revisión de contratos. |
| BT-01-A09 | `frontend/` no incorpora backend Node/BFF/SSR ni depende de infraestructura interna. | Estructura y manifiestos del frontend. |
| BT-01-A10 | Los tests no se despliegan como servicios ni ocultan dependencias prohibidas. | Proyectos, referencias y pipeline futuro. |

## 7. Evidencia para ratificar BT-01

BT-01 no se cierra por describir carpetas. Requiere:

- Decisión registrada sobre los cuatro proyectos, sus referencias y el único host backend.
- Matriz de dependencias aprobada, con la excepción controlada de composición en Api.
- Reglas de módulos y contratos de Application aprobadas.
- BT-01-A01–BT-01-A10 ejecutadas con resultados registrados.
- Evidencia de que `frontend/` no introduce un backend adicional.
- Confirmación de que no se creó código, solución, paquete o pipeline antes de la autorización.
- BT-02–BT-04 y las puertas de persistencia, proveedores, entrega y autorización siguen abiertas.

Mientras falte cualquiera de estos puntos, BT-01 permanece abierta.

## 8. Dependencias y bloqueos

| Puerta | Relación |
|---|---|
| BT-02 | Versiones, licencias, vulnerabilidades y restore/build no comprobados. |
| BT-03 | PostgreSQL real, contexto/transacción/privilegios, jobs, cookies/orígenes, secretos y backup. |
| BT-04 | Autorización para crear solución, paquetes, pipelines o entorno. |
| MD-01–MD-08 | Nombres/tipos/identificadores y persistencia real. |
| RV-01–RV-05 | Entrega, permisos y runtime de verificación. |
| API-01–API-08 | Contrato, seguridad, proveedores, archivos y exportaciones. |

## 9. Próximo artefacto

Si se ratifica BT-01, el siguiente artefacto será una **matriz de evidencia de arquitectura** con los comandos/resultados de BT-01-A01–A10, ejecutada solo cuando exista una solución autorizada. No se crea ahora.

## 10. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin solución, proyectos, código, paquetes, pruebas ejecutables, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
