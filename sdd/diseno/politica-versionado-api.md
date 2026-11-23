# Política de versión, propiedad y deprecación de la API v0.1

> **Fecha:** 2026-11-04. **Versión:** 0.1. **Registro:** DEC-219.  
> **Objeto:** [contrato de API](contrato-api.md), [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [plan API-01](plan-api-01.md) y [matriz de operaciones](matriz-operaciones-openapi.md).  
> **Estado:** **política RATIFICADA DOCUMENTALMENTE por DEC-239**; PV-01–PV-06 y las pruebas CT-02–CT-12 siguen pendientes. No cambia el contrato, no cierra API-01 y no autoriza handlers, código, SQL, migraciones, endpoints, proveedores, configuración, commits o push.  
> **Límite:** solo `sdd/`; sin operaciones reales ni datos de clientes.

## 1. Objetivo

Fijar una propuesta verificable para saber quién posee la API, cómo se versiona, qué cambios son compatibles y cómo se retira una operación sin romper clientes. La política se aplica al contrato textual y al OpenAPI; no sustituye las specs funcionales ni las pruebas de contrato.

## 2. Propiedad y fuente de verdad

| Elemento | Propuesta |
|---|---|
| Propietario | Rol **Responsable técnico de la API**, no una persona nombrada en este documento. |
| Revisores | Arquitectura, seguridad, producto y operación; confirman impacto y evidencia. |
| Fuente de diseño | `sdd/diseno/contrato-api.md` mientras el OpenAPI no esté ratificado. |
| Fuente técnica | `sdd/diseno/openapi/dmgo-api-v1.yaml`, una vez ratificado. |
| Cambios | Se proponen en `sdd/`, se revisan y se ratifican antes de publicar. |
| Aprobación | No se infiere de «continua», de un borrador ni de una validación documental. |

La política no nombra personas reales, cuentas, correos ni credenciales. El propietario y los revisores son roles organizativos pendientes de confirmación.

## 3. Versionado

### 3.1 Esquema

- La ruta pública conserva el prefijo mayor `/api/v1`.
- `info.version` usa SemVer `MAJOR.MINOR.PATCH`.
- El borrador actual es `0.1.0-draft` y **no ofrece garantía de compatibilidad**.
- La ratificación de API-01 propone publicar `1.0.0`; la fecha queda pendiente.
- Un cambio incompatible exige una ruta mayor nueva, por ejemplo `/api/v2`; no se oculta dentro de `/api/v1`.

### 3.2 Clasificación de cambios

| Cambio | Clasificación propuesta |
|---|---|
| Corregir descripción, ejemplo o errata sin cambiar forma | Parche |
| Añadir operación, campo opcional de respuesta o campo opcional de solicitud | Menor |
| Añadir valor a un enum cerrado que el cliente deba interpretar | Mayor, salvo que el contrato declare el enum abierto |
| Eliminar o renombrar campo, ruta, operación o código | Mayor |
| Cambiar tipo, formato, obligatoriedad, semántica o unidad | Mayor |
| Cambiar autenticación, CSRF, cookies o permisos | Mayor |
| Cambiar paginación, orden por defecto, límites o zona horaria | Mayor |
| Cambiar el significado de un estado o de un error | Mayor |
| Añadir cabecera opcional que el cliente pueda ignorar | Menor |

Los campos de respuesta nuevos deben ser tolerados por clientes que no los conozcan. Los clientes no deben enviar campos no declarados: las solicitudes usan `additionalProperties: false` cuando el contrato lo fija.

## 4. Deprecación

### 4.1 Señales

Cuando una operación, campo o valor se retire:

1. Se marca `deprecated: true` en el OpenAPI.
2. Se documenta en el contrato, el changelog y la guía de migración.
3. Se usan las cabeceras `Sunset` (RFC 8594) y `Deprecation` cuando se confirme su versión aplicable.
4. Se indica la operación sustituta y el cambio requerido.
5. Se conserva la operación durante la ventana acordada, salvo retirada urgente por seguridad.

### 4.2 Ventana propuesta

- **90 días naturales** para la API pública, contados desde el aviso verificable.
- Una corrección de seguridad puede acortar la ventana; debe documentarse el motivo y el riesgo.
- No se elimina una operación antes de la fecha `Sunset` anunciada.
- La ventana no se reinicia por un cambio de documentación ni por un despliegue interno.

La ventana de 90 días es una **propuesta técnica pendiente de ratificación**; no se aplica retroactivamente ni se presenta como regla ya aprobada.

## 5. Proceso de cambio

1. **Propuesta:** describir el cambio, su motivo, los clientes afectados y la clasificación.
2. **Revisión:** comprobar contrato, OpenAPI, ejemplos, seguridad, errores, idempotencia y paginación.
3. **Actualización:** modificar contrato/YAML/ejemplos y registrar el cambio.
4. **Validación:** ejecutar las comprobaciones documentales y, cuando exista, el harness de CT-02–CT-12.
5. **Ratificación:** el propietario y los revisores aprueban la versión.
6. **Publicación:** se publica el artefacto ratificado y el changelog; no antes.
7. **Seguimiento:** se observa el uso de la operación deprecada y se retira al vencer la ventana.

Ningún paso autoriza por sí solo handlers, endpoints desplegados, migraciones o proveedores reales.

## 6. Compatibilidad y pruebas

- Las pruebas de contrato CT-02–CT-12 son la evidencia de compatibilidad; la revisión documental no las sustituye.
- Todo cambio de esquema debe compararse con la versión anterior y validar ejemplos.
- Los cambios mayores requieren una ruta nueva y un plan de migración de clientes.
- Los cambios menores requieren ejemplos y pruebas de que un cliente anterior sigue funcionando.
- Los parches no pueden alterar la forma observable de la respuesta.
- La matriz de operaciones y el OpenAPI deben actualizarse en el mismo cambio.

## 7. Decisiones pendientes

| ID | Pendiente | Estado |
|---|---|---|
| PV-01 | Confirmar el rol propietario y los revisores. | Pendiente |
| PV-02 | Ratificar la ventana de 90 días o fijar otra. | Pendiente |
| PV-03 | Confirmar el canal de publicación y el changelog. | Pendiente |
| PV-04 | Fijar la fecha y el contenido de `1.0.0`. | Pendiente |
| PV-05 | Confirmar el uso de `Sunset`/`Deprecation` y su versión aplicable. | Pendiente |
| PV-06 | Ejecutar CT-02–CT-12 con implementación o harness autorizado; el [plan de pruebas](plan-pruebas-contrato.md) DEC-221 detalla los casos. | Pendiente |

## 8. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin código, SQL, migraciones, endpoints, datos/cuentas/proveedores reales, configuración, commits o push.
