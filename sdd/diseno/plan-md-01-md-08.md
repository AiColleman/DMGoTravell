# Plan de ratificación MD-01 y MD-08 — esquema físico y retención

> **Fecha:** 2026-11-05. **Versión:** 0.1. **Registro:** DEC-223.  
> **Objeto:** [modelo de datos v0.1](modelo-datos.md), DEC-211; [cierre del diseño técnico](cierre-diseno-tecnico.md), DEC-216; [plan BT-01](plan-bt-01.md), DEC-222.  
> **Estado:** **plan RATIFICADO DOCUMENTALMENTE por DEC-239** en MD-01 y en el marco de MD-08; MD-01-C01–C08, MD-08-W01–W07, MD-08-R01–R08 y MD-02–MD-07 siguen pendientes. No crea SQL, migraciones, tablas, índices, funciones, datos, código, pruebas ejecutables, configuración, commits o push.  
> **Puertas:** MD-01 queda ratificada documentalmente y MD-08 en su marco; MD-02–MD-07 y las comprobaciones de ventanas/retención no se cierran con este plan.

## 1. Resultado esperado

MD-01 exige fijar nombres, tipos, identificadores, precisión monetaria y enums. MD-08 exige fijar ventanas de retención, baja lógica y limpieza sin borrar historia financiera o de auditoría.

Este plan propone las convenciones de MD-01 y el marco verificable de MD-08. Cuando una duración no está aprobada, se deja como **PENDIENTE**; no se inventa un plazo.

## 2. Alcance y límites

- Solo documentación en `sdd/`; sin DDL, migraciones, seeds ni conexión a PostgreSQL.
- No se cambian reglas comerciales, estados aprobados, RF/HU/RN ni criterios.
- MD-01 se limita a convenciones físicas y tipos; MD-08 a tratamiento, no a nuevas reglas de negocio.
- La versión real de PostgreSQL, colación, funciones e índices se prueban en MD-02.
- Las ventanas exactas de MD-08 requieren decisión y prueba; este plan no las ratifica.

## 3. MD-01 — Convenciones propuestas

### 3.1 Nombres

| Elemento | Convención propuesta |
|---|---|
| Tablas | `snake_case`, singular, ASCII, sin prefijo de esquema en el nombre. |
| Columnas | `snake_case`, descriptivas, sin abreviaturas ambiguas. |
| Clave primaria | `id` para la clave técnica interna. |
| Clave pública | `public_id` cuando el agregado se expone. |
| Fechas | `created_at`, `updated_at`, `deleted_at`, `occurred_at`, `recorded_at`. |
| Versión | `row_version`. |
| Restricciones | `pk_`, `fk_`, `uq_`, `ck_`, `ix_` + tabla + columnas. |
| Longitud | Identificadores dentro del límite práctico de PostgreSQL; evitar nombres reservados. |

No se renombran tablas existentes porque no hay implementación. La convención se aplica desde la primera migración autorizada.

### 3.2 Identificadores

- Clave interna: `bigint generated always as identity`; no se expone en la API pública.
- Clave pública: `uuid` opaco en agregados expuestos.
- `reservationNumber`: texto único, legible y estable, separado del `uuid`; su formato exacto sigue pendiente.
- Las referencias externas de proveedor se guardan como identificadores opacos, no como claves primarias.
- No se usan datos personales para construir identificadores públicos.

La generación/versión UUID y las funciones disponibles se ratifican en MD-02; no se asume una función no verificada.

### 3.3 Tipos

| Dato | Tipo propuesto | Regla |
|---|---|---|
| Instantes | `timestamptz` | Normalizados a UTC; conversión en `America/Lima` en bordes. |
| Fechas comerciales | `date` | Noches/días; no usar `timestamp` para días. |
| Dinero | `numeric(14,2)` | Moneda `PEN`; `>= 0`; nunca `float`. |
| Texto | `text` | Sin límites arbitrarios no aprobados; validar en aplicación. |
| Booleanos | `boolean` | Sin enteros 0/1 como sustituto. |
| UUID | `uuid` | Solo identificadores públicos o referencias que lo requieran. |
| JSON | `jsonb` solo donde el modelo lo justifique | No para campos con reglas consultables o dinero. |
| Enums | Texto + `CHECK` o catálogo versionado | No enteros mágicos. |

### 3.4 Dinero

- Solo `PEN`; no se modelan otras monedas sin decisión.
- `numeric(14,2)`, precisión exacta y comprobación `>= 0`.
- Importes históricos inmutables; snapshots en reserva/pago.
- El límite superior es técnico, no un tope comercial.
- La regla de redondeo sigue pendiente de decisión; no se fija aquí.

### 3.5 Estados y enums

- Solo los estados comerciales aprobados por las specs.
- Los estados técnicos se separan de los comerciales.
- `CHECK` explícito o catálogo versionado; no enteros mágicos.
- Un estado nuevo requiere spec/decisión; no se añade por conveniencia técnica.

### 3.6 Concurrencia y baja lógica

- `row_version bigint` incrementada por la aplicación; se expone como token opaco/ETag.
- No usar `xmin` como versión de negocio.
- `deleted_at` nulo mientras el registro esté vigente.
- Los índices únicos parciales excluyen eliminados cuando la regla lo permita.
- No se borran filas con historia financiera o de auditoría.

### 3.7 Comprobaciones MD-01-C01 a MD-01-C08

| ID | Comprobación | Evidencia |
|---|---|---|
| MD-01-C01 | Nombres de tablas/columnas siguen `snake_case` singular. | Revisión del esquema/migración. |
| MD-01-C02 | PK interna `bigint identity`; `public_id` uuid donde aplica. | DDL revisado y mapa de agregados. |
| MD-01-C03 | `reservationNumber` es único y separado del uuid. | Restricción y revisión de API. |
| MD-01-C04 | Instantes `timestamptz`; fechas comerciales `date`. | DDL y pruebas de zona horaria en MD-02. |
| MD-01-C05 | Dinero `numeric(14,2)` PEN, `>= 0`, sin `float`. | DDL y revisión de tipos. |
| MD-01-C06 | Enums comerciales solo aprobados; sin enteros mágicos. | Catálogo/CHECK y trazabilidad. |
| MD-01-C07 | `row_version` y `deleted_at` según convención. | DDL y pruebas de concurrencia/baja. |
| MD-01-C08 | Índices únicos parciales no bloquean la baja lógica cuando corresponde. | DDL y pruebas en PostgreSQL real. |

## 4. MD-08 — Marco de retención y baja

### 4.1 Invariantes

- La baja de cuenta es lógica; no elimina filas financieras o de auditoría.
- El correo canónico y la unicidad se conservan; no se reutiliza el correo.
- Los snapshots de reserva/pago son inmutables.
- La auditoría es inmutable desde la aplicación y se conserva según 010.
- Un artefacto vencido no se reutiliza ni se sirve como si estuviera vigente.
- La limpieza de multimedia solo ocurre tras comprobar cero referencias.
- La minimización no autoriza borrar historia financiera o de auditoría.
- Un borrado debe ser verificable y no dejar estado parcial.

### 4.2 Categorías y tratamiento

| Categoría | Tratamiento | Ventana |
|---|---|---|
| Cuenta con baja | Lógica; correo e historial conservados; unicidad mantenida | Sin borrado físico; plazo de conservación pendiente |
| Perfil | Nombre/teléfono vigentes; baja oculta datos en 010 salvo ID, estado y cantidad | Según 010 |
| Refresh/solicitudes | Digests y evidencia; secretos brutos no persistidos | **PENDIENTE MD-08-W01** |
| Reservas/pagos/devoluciones | Conservación histórica; snapshots inmutables | Sin borrado por baja; plazo pendiente |
| Auditoría | Conservación indefinida aprobada por 010 | Indefinida |
| Notificaciones | Hecho/entrega/intento/evento sin secretos | **PENDIENTE MD-08-W02** |
| Exportaciones | Copia privada y artefacto con vencimiento; borrado verificable | **PENDIENTE MD-08-W03** |
| Multimedia | Objeto/metadatos; limpieza tras cero referencias | Candidato desde 24 h sin referencias; **PENDIENTE MD-08-W04** |
| Idempotencia | Clave opaca + resultado mínimo | **PENDIENTE MD-08-W05** |
| Backups/restauración | Política de retención y prueba de restauración | **PENDIENTE MD-08-W06** |
| Evidencia de pruebas | Datos sintéticos y saneados | **PENDIENTE MD-08-W07** |

### 4.3 Comprobaciones MD-08-R01 a MD-08-R08

| ID | Comprobación | Evidencia |
|---|---|---|
| MD-08-R01 | Baja de cuenta no borra finanzas/auditoría. | Prueba de baja y consulta histórica. |
| MD-08-R02 | Correo canónico no se reutiliza tras baja. | Restricción única y prueba. |
| MD-08-R03 | Snapshots históricos no cambian. | Prueba de actualización y lectura histórica. |
| MD-08-R04 | Artefacto vencido no se sirve ni reutiliza. | Prueba de expiración/descarga. |
| MD-08-R05 | Multimedia sin referencias se limpia; con referencias no. | Prueba de referencias y limpieza. |
| MD-08-R06 | Borrado verificable sin estado parcial. | Prueba de fallo antes/después del commit. |
| MD-08-R07 | Auditoría inmutable desde la aplicación. | Prueba de roles/actualización. |
| MD-08-R08 | Restauración no resucita artefactos/enlaces vencidos. | Prueba de backup/restore. |

## 5. Ventanas pendientes

| ID | Ventana | Fuente | Estado |
|---|---|---|---|
| MD-08-W01 | Refresh/solicitudes de enlace | 005/005-C | Pendiente de ratificación |
| MD-08-W02 | Notificaciones | 002/planes | Pendiente de ratificación |
| MD-08-W03 | Exportaciones/PDF | 010/011/012 | Pendiente de ratificación |
| MD-08-W04 | Multimedia sin referencias | Modelo §19 | 24 h propuesto, no ratificado |
| MD-08-W05 | Idempotencia | API-04 | Pendiente de ratificación |
| MD-08-W06 | Backups/restauración | Operación | Pendiente de ratificación |
| MD-08-W07 | Evidencia de pruebas | PT-04 | Pendiente de ratificación |

No se fija una duración distinta de la ya aprobada. Si una spec no fija plazo, se mantiene pendiente y no se usa como si estuviera decidido.

## 6. Evidencia para ratificar

MD-01 requiere:

- Convención de nombres y tipos aprobada.
- Mapa de agregados con PK interna, `public_id` y `reservationNumber`.
- Revisión de dinero, fechas, enums y baja lógica.
- MD-01-C01–C08 ejecutadas cuando exista esquema/migración autorizada.

MD-08 requiere:

- Ratificación de MD-08-W01–W07.
- Invariantes de baja, snapshots, auditoría y artefactos aprobadas.
- MD-08-R01–R08 ejecutadas con PostgreSQL real y datos sintéticos.
- Confirmación de que no se borra historia financiera o de auditoría.

## 7. Dependencias y bloqueos

| Puerta | Relación |
|---|---|
| MD-02 | PostgreSQL real, colación, funciones, `timestamptz`, índices parciales y `numeric`. |
| MD-03 | Concurrencia, bloqueos y reintentos. |
| MD-04 | Inventario y reconciliación. |
| MD-05 | Pagos/devoluciones y proveedor. |
| MD-06 | Auditoría e inmutabilidad. |
| MD-07 | Exportaciones y artefactos. |
| BT-01–BT-04 | Estructura, plataforma, persistencia y autorización. |
| RV-01–RV-05 | Entrega, permisos y runtime. |

## 8. Próximo artefacto

Si se ratifican las convenciones, el siguiente artefacto será una **matriz de evidencia MD-01/MD-08** con el DDL revisado y los resultados de MD-01-C01–C08 y MD-08-R01–R08. No se crea ahora.

## 9. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin SQL, migraciones, tablas, índices, funciones, datos, código, pruebas ejecutables, configuración, commits o push.
