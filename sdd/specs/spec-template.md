# Spec NNN — Nombre de la funcionalidad

> Plantilla adaptada de `spec-generator`; no es una especificación de producto.
> Ruta al usarla: `sdd/specs/NNN-nombre-en-kebab-case/spec.md`.
> Estado: Borrador / En aclaración / Pendiente de aprobación / Aprobada.
> Versión: por asignar. Aprobación explícita: pendiente.
> Fuentes: documentos y secciones; RF/HU/RN originales. Dudas: ACL correspondientes.

## Contexto y objetivo

Describir qué problema documentado resuelve y por qué. Delimitar alcance y dependencias funcionales sin incluir soluciones técnicas.

## Usuarios / actores

Identificar los actores existentes que participan y sus permisos documentados.

## Historias de usuario

Reutilizar `HU-xx`, prioridad y texto de origen; no sustituirlos por identificadores nuevos. Si la fuente no define una historia, referenciar el requisito existente sin inventar una HU oficial.

## Requisitos funcionales (criterios de aceptación en EARS)

Numerar criterios locales `RF-1`, `RF-2`, etc. Cada uno contiene un comportamiento verificable y cita el ID original; no renumerar RF01–RF24. Formas EARS permitidas:

- EL SISTEMA <comportamiento permanente>.
- CUANDO <evento>, EL SISTEMA <respuesta observable>.
- MIENTRAS <estado>, EL SISTEMA <comportamiento>.
- DONDE <característica opcional>, EL SISTEMA <comportamiento>.
- SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.

Los patrones anteriores son instrucciones, no requisitos. Un valor o comportamiento desconocido se marca `[NECESITA ACLARACIÓN: pregunta concreta]`; no se convierte una propuesta en criterio obligatorio.

## Requisitos no funcionales

Incluir solo atributos documentados aplicables, conservando IDs y condiciones de medida. Señalar umbrales no definidos. Consultar las restricciones técnicas de la constitución; su concreción pertenece al plan.

## Casos límite

Registrar escenarios, resultado documentado y criterio local relacionado. Si el resultado es desconocido, enlazar la ACL y marcar NECESITA ACLARACIÓN.

## Fuera de alcance

Indicar límites explícitos de esta funcionalidad y capacidades asignadas a otras specs. Una exclusión local no elimina un requisito global existente. No excluir un caso obligatorio solo porque necesita aclaración.

## Criterios de finalización

Distinguir cierre/aprobación documental de verificación de la implementación futura. Conservar evidencia trazable a criterios; no prescribir pruebas irrelevantes ni declarar verificaciones aún no realizadas.

## Dudas abiertas

- [NECESITA ACLARACIÓN: pregunta concreta vinculada a su ACL y fuente.]

## Aprobación de esta especificación

Versión revisada, respuesta explícita, fecha y alcance: pendientes. Solicitar aprobación individual al terminar; una aclaración aislada no autoriza el plan ni las tareas.
