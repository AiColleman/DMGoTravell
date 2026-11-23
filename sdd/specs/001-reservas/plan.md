# Plan técnico — Spec 001: Reservas del cliente

> **Base:** [spec aprobada v0.13](spec.md), 2026-10-22.  
> **Estado:** plan de diseño para implementación futura; no es código ni evidencia de cumplimiento.  
> **Alcance de archivos:** este plan solo se registra en `sdd/`.

## 1. Objetivo de implementación

Implementar el ciclo de reserva del cliente: tour o paquete para una salida, alojamiento opcional de una propuesta asignada, cálculo histórico del total, consulta propia paginada y cancelación `pending` con liberación única de recursos.

El resultado debe preservar los 105 criterios de la spec aprobada. En especial, debe impedir sobreventa y reservas parciales bajo concurrencia; ninguna interfaz de cliente será fuente de precios, propiedad, capacidad o estado.

## 2. Límites y dependencias

| Dependencia | Estado | Condición para integrar |
|---|---|---|
| 005 Identidad | Aún no especificada | Cliente autenticado, rol `client` y contexto de propietario. |
| 006 Catálogo | Acuerdos parciales | Oferta/salida, cupos, precio turístico y retenciones disponibles para reservas. |
| 007 Hoteles | Aún no especificada | Propuestas por salida, una habitación por categoría, períodos de 24 horas e inventario compartido. |
| 002 Pagos | Aún no especificada | Inicio, validación, rechazo y resultado desconocido mediante una frontera interna segura. |
| 003 Vencimiento | Aún no especificada | Proceso automático de vencimiento dentro de 60 segundos y liberación reutilizable. |
| 010 Auditoría | Aún no especificada | Escritura solo anexada de las acciones críticas ya acordadas. |

La implementación puede preparar contratos y pruebas locales de reservas, pero no debe inventar semántica de dependencias que sus specs aún no han aprobado. Antes de integrar cada dependencia, comprobar su contrato aprobado contra `001/RF-*`.

## 3. Arquitectura y límites internos

Aplicar las restricciones existentes:

- Un único backend ASP.NET Core / C# en monolito modular (ADR-001).
- Clean Architecture: Presentation → Application → Domain; Infrastructure implementa dependencias externas y persistencia (ADR-002).
- CQRS con MediatR para comandos y consultas (ADR-003).
- PostgreSQL / EF Core / Npgsql, migraciones versionadas y persistencia como fuente de verdad (ADR-004, RP01–RP08).
- REST/HTTPS/JSON, OpenAPI y ProblemDetails (RC06, ADR-015, ADR-016).

### Responsabilidades por módulo

| Módulo | Responsabilidad en este flujo |
|---|---|
| Reservations | Propietario, componentes históricos, estado, total, vencimiento y transiciones de reserva. |
| Catalog | Valida salida/oferta y reserva, confirma o libera cupos turísticos. |
| Hotels | Valida propuesta asociada a la salida y reserva, confirma o libera una habitación compatible. |
| Identity | Entrega actor autenticado y rol; nunca aceptar propietario desde el cuerpo de la solicitud. |
| Payments | Valida evidencia de Culqi y solicita transición de pago ya validado. |
| Background Jobs | Invoca el mismo caso de uso de vencimiento; no replica reglas de negocio. |
| Audit | Registra las operaciones críticas acordadas en una escritura no editable. |

Los módulos colaboran mediante contratos de Application y una unidad transaccional local; no mediante HTTP interno ni modificación directa de datos ajenos.

## 4. Modelo funcional y de persistencia a diseñar

### Reserva y componentes históricos

La reserva debe conservar como mínimo:

- propietario autenticado;
- oferta/salida y cantidad turística;
- alojamiento opcional: hotel, tipo, período asignado y una habitación retenida;
- estado `pending`, `confirmed`, `completed` o `cancelled`;
- instante de creación, vencimiento y datos de estado relevantes;
- snapshots de precio, importe por componente, total final y moneda `PEN` con dos decimales;
- referencias de retenciones turísticas y hoteleras necesarias para confirmar/liberar una única vez;
- número único de reserva para desempatar el historial.

El diseño de tablas, claves, índices, enumeraciones y precisión monetaria se define en la fase de modelo de datos. Debe preservar estados y snapshots sin recalcular con precios, horarios o contenido actuales.

### Reglas de alojamiento

- Una reserva puede no tener alojamiento o tener una única categoría de habitación en un hotel.
- La propuesta de alojamiento debe pertenecer a la salida turística elegida.
- El período ya está asignado por la propuesta, es un múltiplo positivo de 24 horas y se interpreta en hora Perú; persistencia usa UTC según RP08.
- La misma habitación puede terminar y comenzar una nueva estancia en el mismo instante; períodos con más solapamiento compiten por inventario.
- La capacidad de la categoría se muestra junto al total de viajeros, pero puede alojar solo una parte del grupo.

## 5. Flujos de aplicación

### Crear reserva

1. Obtener cliente autenticado y validar formato de solicitud, sin precio, propietario ni estado confiables desde el cliente.
2. Abrir una transacción PostgreSQL local.
3. Validar salida/oferta activa y protegida; retener cupos y obtener cotización turística oficial.
4. Si se solicitó alojamiento, validar propuesta asociada a la salida, hotel/tipo activos, período e inventario; retener una habitación y obtener cotización oficial.
5. Crear reserva `pending` con snapshots, total, moneda y plazos aprobados.
6. Persistir reserva, retenciones y auditoría de creación en el mismo commit.
7. Ante cualquier fallo local, revertir todo; no persistir reserva ni retención parcial.

### Consultar historial propio

- Filtrar siempre por propietario autenticado.
- Incluir todos los estados, oferta, alojamiento opcional, cantidades e importes.
- Paginación de diez resultados; orden principal por creación descendente y desempate por número único de reserva descendente.
- Página cero, negativa o texto: mensaje `Número de página no válido` sin sustitución automática.
- Página válida sin resultados: lista vacía y `No hay reservas en esta página` sin error ni cambio de página.
- Reserva ajena: recurso no disponible al cliente; no revelar su existencia.

### Cancelar reserva propia `pending`

1. Cargar y proteger la reserva bajo la misma estrategia de concurrencia.
2. Comprobar propietario y estado; durante pago en verificación, rechazar la cancelación voluntaria.
3. Si ya está cancelada, informar el estado previo sin liberar otra vez.
4. Cambiar a `cancelled`, liberar cupos y alojamiento opcional una sola vez y registrar auditoría en el mismo commit.
5. Si la cancelación se registra antes de un inicio de pago concurrente, impedir iniciar ese pago; si el inicio válido gana, aplicar el flujo de verificación.

### Límites compartidos con pagos y vencimiento

- La reserva conserva los plazos vigentes al crearla: 15 minutos para recibir inicio de pago y hasta 20 solo para validar un pago iniciado a tiempo.
- Los cortes son excluyentes: llegada exacta a 15 no inicia pago; validación exacta a 20 no confirma.
- Sin pago iniciado al minuto 15, cancelar/liberar; con pago por validar, mantener hasta el límite de 20.
- Un rechazo definitivo durante tolerancia cancela/libera de inmediato; timeout/resultado desconocido no se trata como rechazo.
- La cancelación y liberación automáticas por vencimiento deben completarse en máximo 60 segundos; este umbral no amplía pago o validación.

Los comandos finales de pagos/vencimiento pertenecen a 002/003, pero Reservations debe proteger invariantes y proporcionar los puertos necesarios para esos flujos.

## 6. Concurrencia y consistencia

Antes de implementar, seleccionar y documentar una estrategia concreta en PostgreSQL que cumpla AC07/RN-07/RP02. Debe ser verificable con PostgreSQL real, no solo con repositorios en memoria.

La estrategia elegida debe garantizar:

- competencia por último cupo turístico: solo una retención exitosa;
- competencia por última habitación/tipo/período: solo una retención exitosa;
- reserva compuesta atómica, sin cupo o habitación parcialmente retenidos;
- cancelación, vencimiento y pago serializados sobre el estado de la misma reserva;
- primera operación aceptada entre cancelación e inicio de pago como orden único;
- liberación idempotente y no doble;
- ajustes administrativos que no reduzcan cupos/inventario bajo compromisos;
- desactivaciones que impiden nuevas reservas, pero preservan existentes y sus plazos.

El plan técnico debe definir índices, restricciones de unicidad y protección de filas/actualizaciones condicionales que demuestren estas propiedades. Cualquier transacción local no revierte efectos de proveedores externos.

## 7. API y presentación a diseñar

Definir contrato OpenAPI versionado para:

- crear reserva propia;
- listar historial propio paginado;
- consultar detalle propio de reserva;
- cancelar reserva propia `pending`;
- superficies internas o protegidas requeridas por pago y vencimiento, sin exponer una transición libre de estado.

El contrato debe expresar datos devueltos, errores ProblemDetails y resultados acordados de propiedad, validación, indisponibilidad, página inválida, página vacía y estados. No definir rutas, cuerpos ni códigos HTTP finales fuera de OpenAPI/ProblemDetails sin validarlos con Presentation y las specs de identidad/pagos.

La presentación debe mostrar estados, total oficial, vencimiento y capacidad de alojamiento frente al total de viajeros. No debe mostrar la reserva como confirmada antes de la decisión de backend ni permitir modificar precio, propietario, fechas asignadas, estado o retenciones.

## 8. Estrategia de pruebas

| Área | Evidencia requerida |
|---|---|
| Dominio | Estados válidos, snapshots, total, estado terminal y reglas locales de cancelación. |
| Application | Propiedad, validaciones, flujos sin hotel/con hotel, historial y mensajes de borde. |
| Integración PostgreSQL | Último cupo, última habitación, reserva compuesta, rollback, bloqueos y liberación única. |
| Integración entre módulos | Contratos Catalog/Hotels/Identity/Audit sin acceso directo a datos ajenos. |
| HTTP/contrato | Autorización, propiedad, ProblemDetails, paginación y OpenAPI. |
| Concurrencia | Cancelación/inicio de pago, pago/vencimiento, cancelación repetida, vencimiento máximo de 60 segundos. |
| Arquitectura | Dependencias Clean Architecture y límites de módulos. |

No declarar las pruebas aprobadas hasta ejecutarlas contra la implementación. Las pruebas de servicios externos deben usar dobles en Application y pruebas contractuales separadas de la integración real.

## 9. Riesgos y puertas antes de implementar

1. Completar o validar los contratos aprobados de 005, 006, 007, 002, 003 y 010 antes de integrar sus operaciones reales.
2. Resolver decisiones técnicas de ACL-17/ACL-18/ACL-19 que afecten estructura, concurrencia y validación; no cambiar tecnologías obligatorias sin ADR.
3. Diseñar los datos históricos y retenciones antes de exponer un endpoint de creación.
4. Confirmar el contrato oficial de Culqi en 002 antes de habilitar cobros reales; 001 solo conserva las invariantes de reserva.
5. Documentar cómo se aplica la liberación en máximo 60 segundos y demostrarlo con pruebas de integración.

## 10. Entregables del plan

- Modelo de dominio, datos, migraciones e índices de Reservations y sus integraciones.
- Contratos de Application entre Reservations, Catalog, Hotels, Payments, Identity y Audit.
- Contrato OpenAPI y mapeos ProblemDetails.
- Estrategia de concurrencia demostrable en PostgreSQL.
- Matriz de pruebas trazada a `001/RF-1`–`001/RF-105`.
- Decisiones técnicas nuevas solo si no contradicen la constitución o si una ADR las aprueba.

Este plan no autoriza implementación fuera de las tareas aprobadas, no crea módulos separados ni cambia tecnologías/políticas aún pendientes de otras specs.
