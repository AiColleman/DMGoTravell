# Modelo de datos lógico — Volumen 1: identidad, catálogo/inventario y reservas

> **Versión:** 0.1, 2026-11-03. **Registro:** DEC-211.  
> **Estado:** propuesta documental **NO IMPLEMENTADA**; no es una migración, esquema SQL, modelo EF Core ni decisión de arquitectura ratificada.  
> **Ámbito:** registros lógicos necesarios para identidad/acceso, catálogo, hoteles/inventario, reservas y su cadena transaccional (pagos, vencimiento, auditoría). Incluye referencias mínimas a notificaciones, exportaciones, multimedia y movilidad porque enlazan con el núcleo.  
> **Preservación:** specs, planes, tareas, análisis y contratos anteriores intactos. **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada. Sin código, SQL, migraciones, datos reales, cuentas, proveedores, configuración, commits o push.

## 1. Autoridad y límites

Este documento traduce a registros y restricciones lo ya aprobado en [001](../specs/001-reservas/spec.md), [002](../specs/002-pagos/spec.md), [003](../specs/003-vencimiento/spec.md), [004](../specs/004-notificaciones/spec.md), [005](../specs/005-identidad/spec.md), [005-C](../specs/005-identidad/complemento-reemision-verificacion.md), [006](../specs/006-catalogo/spec.md), [007](../specs/007-hoteles/spec.md), [008](../specs/008-perfil/spec.md), [009](../specs/009-administracion-reservas/spec.md), [010](../specs/010-clientes-auditoria/spec.md), [011](../specs/011-reportes/spec.md), [012](../specs/012-multimedia/spec.md) y [013](../specs/013-movilidad-informativa/spec.md), junto con sus planes no ejecutados.

Reglas de lectura:

- Los nombres de registros y campos son **lógicos y provisionales**. La denominación física, tipos exactos, esquemas y convenciones se fijan en la migración autorizada; este texto no crea tablas.
- Un campo propuesto no añade una regla comercial. Si una spec no exige un dato, el campo solo se justifica para preservar una invariante, trazabilidad o consulta ya aprobada.
- Los valores de configuración (TTL, reintentos, tamaños de página, ventanas de retención) siguen siendo **propuestas técnicas** sujetas a las puertas de cada plan; no se convierten en políticas aprobadas por aparecer aquí.
- Este volumen no ratifica los [contratos propuestos](../contratos/) ni la [base técnica](base-tecnica.md). Los usa como referencias condicionadas.
- No se modelan datos que las specs no autorizan: viajeros nominales, asientos, habitaciones múltiples por reserva, pagos parciales, monedas distintas de `PEN`, facturación fiscal, cuentas corporativas o inventario hotelero por salida.

## 2. Convenciones comunes propuestas

| Tema | Propuesta | Condición |
|---|---|---|
| Identificador interno | `bigint generated always as identity` como clave primaria técnica. | No se expone en la API pública. |
| Identificador público | `uuid` opaco en agregados expuestos (cuenta, oferta, salida, hotel, tipo, propuesta, reserva, pago, caso, exportación, activo, movilidad). | Generación y versión UUID a fijar en MD-02; no depender de una función no verificada en la versión real de PostgreSQL. |
| Número de reserva | Texto único, legible y estable, separado del `uuid`. | Formato y longitud a ratificar; no se deriva de datos personales. |
| Fechas e instantes | `timestamptz` normalizado a UTC para instantes; `date` para noches/días comerciales. | Conversión y validación en `America/Lima` en los bordes; nunca usar la zona del host. |
| Dinero | `numeric(14,2)` con moneda `PEN` y comprobación `>= 0`; importes históricos inmutables. | Precisión exacta; nunca `float`. El límite superior es técnico, no un tope comercial. |
| Texto normalizado | Se conserva el valor visible y una clave normalizada calculada por la aplicación (recorte exterior y comparación sin distinguir mayúsculas; sin quitar tildes ni colapsar espacios internos). | Semántica exacta y colación a probar en PostgreSQL real (MD-02). |
| Concurrencia optimista | `row_version bigint` incrementada por la aplicación; se expone como token opaco/ETag. | No usar `xmin` como versión de negocio. |
| Baja lógica | `deleted_at timestamptz` nulo mientras el registro esté vigente; los índices únicos parciales excluyen eliminados. | No borrar filas con historia financiera o de auditoría. |
| Estados | Texto con `CHECK` explícito o catálogo versionado, no enteros mágicos. | Los estados comerciales solo son los aprobados; los estados técnicos se separan. |
| Idempotencia | Clave opaca + actor + acción + huella del payload normalizado + resultado mínimo. | La clave no contiene correo, motivo, token ni secretos. |
| Marcas de tiempo de auditoría | `occurred_at` (hecho) y `recorded_at` (incorporación) son columnas distintas. | Nunca retrofechar un hecho por el momento de registro. |

## 3. Propiedad de datos por módulo

| Módulo | Registros propios | No puede escribir |
|---|---|---|
| Identity | Cuenta, rol, identidad Google, familia/refresh, solicitud de enlace, flujo OIDC, perfil, cambio de correo, baja, idempotencia | Reservas, pagos, inventario, auditoría (solo anexa por puerto) |
| Catalog | Oferta, itinerario, salida, precios, imágenes de oferta | Hoteles, reservas, pagos |
| Hotels | Hotel, servicios, tipos, inventario por noche, propuestas, imágenes | Ofertas, reservas, pagos |
| Reservations | Reserva, snapshots, compromisos, historial, operaciones idempotentes | Pagos, inventario (consume por contrato), auditoría (anexa) |
| Payments | Intento, pago externo, recepción, caso/intento de devolución | Reserva (transiciona por contrato), inventario |
| Expiry | Intención de programación, ejecución, incidente | Reserva (transiciona por contrato), pagos |
| Notifications | Hecho, entrega, intento, evento, incidente | Reservas, pagos, identidad |
| Audit | Registro, catálogo de acciones, pendientes | Cualquier dato de negocio |
| Reports/Exports | Solicitud, captura, filas privadas, artefacto | Datos fuente |
| Multimedia | Activo, referencias, intención de limpieza | Condiciones comerciales de consumidores |
| Mobility | Categoría informativa | Catálogo, hoteles, reservas |

La propiedad es lógica. En el monolito modular se implementa con contratos de Application y pruebas de arquitectura; una clave foránea no autoriza a un módulo a mutar datos de otro.

## 4. Identidad y acceso

### 4.1 Cuenta y roles

**`account`**

| Campo | Regla |
|---|---|
| `id`, `public_id` | Claves internas/públicas. |
| `email_display`, `email_normalized` | Correo vigente y su forma normalizada; `email_normalized` único **incluidas** cuentas con baja lógica. |
| `email_verified_at` | Nulo si no está verificado; no se deduce del registro ni del login. |
| `password_hash` | Nulo para cuentas solo Google; hash de Identity cuando exista. Nunca se expone ni se audita. |
| `status` | `active`, `disabled`, `closed` (baja lógica). No se confunde con verificación de correo. |
| `security_version` | Entero que invalida sesiones y pruebas al cambiar contraseña/reset/operaciones sensibles definidas. |
| `created_at`, `updated_at`, `row_version`, `deleted_at` | Convenciones comunes. |

Invariantes:

- Un correo normalizado pertenece a una sola cuenta, incluso si la cuenta fue dada de baja; no se reutiliza por conveniencia.
- `email_verified_at` no bloquea el login local, pero sí la reserva y el pago según 005.
- Cambiar nombre/teléfono no incrementa `security_version`; cambiar contraseña o reset sí.
- La baja no elimina filas financieras ni de auditoría.

**`account_role`**: `account_id`, `role` (`client`/`admin`), `granted_at`, `revoked_at`, `granted_by`. Un rol activo por cuenta y tipo; el seed administrativo se registra como operación auditada, no como dato de ejemplo en el esquema.

### 4.2 Identidad externa y sesiones

**`google_identity`**: `id`, `account_id`, `provider` (`google`), `issuer`, `subject`, `email_at_link`, `linked_at`, `last_login_at`. Único `(provider, issuer, subject)`; el correo es atributo de vinculación, nunca clave externa estable. Único `(account_id, provider)` si se decide una sola identidad Google por cuenta.

**`refresh_family`**: `id`, `public_id`, `account_id`, `created_at`, `absolute_expires_at`, `revoked_at`, `revoke_reason`, `security_version_at_issue`, `login_correlation`. Cada login crea una familia; el vencimiento absoluto no se extiende al rotar.

**`refresh_token`**: `id`, `family_id`, `digest` único, `issued_at`, `expires_at`, `consumed_at`, `replaced_by_id`, `revoked_at`. Solo se guarda el digest, nunca el secreto bruto. La reutilización de un digest consumido revoca la familia, no todas las sesiones.

**`oidc_flow`**: `id`, `state_digest`, `nonce_digest`, `purpose` (`login`/`link`), `expected_account_id`, `expected_family_id`, `return_path`, `created_at`, `expires_at`, `consumed_at`. `return_path` debe pertenecer a una lista permitida; no se acepta un destino arbitrario del cliente.

### 4.3 Solicitudes de enlace y pruebas

**`link_request`** (verificación y recuperación de contraseña de 005; el cambio de correo de 008 usa `email_change_request`)

| Campo | Regla |
|---|---|
| `id`, `account_id`, `purpose` | Propósito explícito de 005; no se reutiliza una prueba de verificación para reset ni se duplica aquí el cambio de correo de 008. |
| `target_email_normalized` | Destino autorizado; en verificación inicial coincide con el correo de la cuenta. |
| `verifier_digest` | Digest de la prueba; el secreto bruto solo existe en la carga protegida de entrega. |
| `created_at`, `expires_at`, `consumed_at`, `superseded_at` | Uso único y sustitución explícita. |
| `is_current` | Solo una solicitud vigente por cuenta/propósito; la sustitución la desmarca en el mismo commit. |
| `security_version_at_issue`, `generation` | Permiten rechazar pruebas emitidas antes de un cambio de seguridad o de una generación posterior. |
| `delivery_ref` | Referencia a la entrega de 004; no contiene el enlace. |

Reglas:

- **005-C:** una nueva admisión válida de verificación sustituye a las anteriores de la misma cuenta/propósito; solo la última es consumible. Una solicitud rechazada no sustituye; un fallo de entrega posterior no restaura las antiguas; un reintento de entrega no crea otra generación.
- La vigencia no se indexa con `expires_at > now()` porque `now()` no es inmutable. Se usa la bandera `is_current`, mantenida transaccionalmente, con índice parcial por `(account_id, purpose)`; la expiración se evalúa al consumir. La unicidad física se apoya además en `(account_id, purpose, generation)`.
- El consumo y la invalidación de las anteriores ocurren en el mismo commit; un enlace sustituido responde «usa el más reciente», no verifica.
- El TTL de verificación (24 h propuesto) no procede de la idempotencia de Resend ni de la ventana 15/20 de reservas.

**`idempotency_record`**: `owner_type`, `owner_id`, `action`, `key`, `payload_hash`, `result_code`, `result_ref`, `created_at`, `expires_at`. Único `(owner_type, owner_id, action, key)`. Se usa en registro, cambio de correo, baja y operaciones administrativas; un mismo key con payload distinto se rechaza.

### 4.4 Perfil, cambio de correo y baja

**`profile`**: `account_id` (PK), `full_name`, `phone`, `updated_at`, `row_version`. Solo los campos autorizados; no duplica correo ni verificación.

**`email_change_request`**: `id`, `account_id`, `from_email_normalized`, `to_email_normalized`, `created_at`, `expires_at`, `verifier_digest`, `security_version_at_issue`, `generation`, `is_current`, `consumed_at`, `superseded_at`, `status`. Es la autoridad del cambio de correo de 008 y usa su propia prueba; no se sustituye por una `link_request` de 005. Una solicitud pendiente **no reserva** el destino: otra cuenta puede ocuparlo; la primera confirmación válida gana la unicidad. El cambio efectivo actualiza `account.email_*`, incrementa la versión de seguridad resultante y conserva la evidencia anterior/nueva.

**`account_closure`**: `account_id` (PK), `requested_at`, `effective_at`, `status`, `privacy_version`, `security_version`, `evidence_ref`. La baja es lógica; conserva correo canónico, historial y referencias. La barrera de elegibilidad por cuenta se implementa con bloqueo/actualización condicional compartida, no con un lock en memoria.

## 5. Catálogo

**`offer`**: `id`, `public_id`, `type` (`tour`/`package`), `name`, `normalized_key`, `description`, `duration_value`, `duration_unit` (`hours`/`days`), `price_normal`, `price_discounted` (nullable), `conditions`, `is_active`, `deleted_at`, `created_at`, `updated_at`, `row_version`.

- Único parcial `(type, normalized_key)` para ofertas publicadas/activas; dos borradores pueden coincidir y la activación resuelve la carrera.
- `price_normal > 0`; si hay descuento, `0 < price_discounted < price_normal`. No se guarda porcentaje como autoridad; el porcentaje es derivado. Los precios de oferta y salida son por persona; el subtotal turístico usa la cantidad de viajeros (RF-19).
- Una oferta activa exige nombre, descripción, precio, duración, itinerario, al menos una imagen y condiciones. El borrador inactivo puede estar incompleto.
- `deleted_at` preserva referencias históricas; no se borra una oferta con reservas.

**`offer_itinerary_day`**: `offer_id`, `day_number`, `title`, `activities`, `row_version`; único `(offer_id, day_number)`. El itinerario pertenece a la oferta, no a cada salida. Un cambio se rechaza si cualquier salida tiene reserva pendiente o confirmada.

**`offer_departure`**: `id`, `public_id`, `offer_id`, `starts_at`, `ends_at`, `capacity_total`, `capacity_committed`, `price_normal` (nullable), `price_discounted` (nullable), `is_active`, `deleted_at`, `row_version`.

- `starts_at` futura en hora Perú; `capacity_total >= 0`; `0 <= capacity_committed <= capacity_total`.
- Una salida sin `price_normal` propio no es reservable; no se hereda el precio normal ni el descuento de la tarjeta/oferta (RF-64/RF-50).
- El precio efectivo es el rebajado de la salida si existe; si no, su normal. La reserva congela el importe. La promoción de la tarjeta no se acumula.
- La reducción de `capacity_total` por debajo de `capacity_committed` se rechaza.
- `capacity_committed` es un contador protegido; los compromisos y liberaciones se registran además en el libro de reservas para detectar deriva.

**`offer_image`**: `id`, `offer_id`, `asset_id`, `role` (`main`/`gallery`), `position`, `created_at`, `removed_at`. Único parcial de una principal vigente por oferta. El orden es de presentación, no una regla comercial.

No se modela una tabla de descuentos independiente: los importes normal/rebajado viven en oferta/salida y la reserva conserva snapshots. Si en el futuro se requiere historial de cambios de precio, se resuelve con auditoría, no reescribiendo la reserva.

## 6. Hoteles e inventario

**`hotel`**: `id`, `public_id`, `name`, `normalized_key`, `description`, `is_active`, `deleted_at`, `created_at`, `updated_at`, `row_version`. Único parcial de nombre entre hoteles activos/no eliminados. Un hotel activo exige nombre, descripción, al menos un servicio, al menos una imagen y al menos un tipo válido.

**`hotel_service`**: `hotel_id`, `position`, `text`; único `(hotel_id, position)`. Lista libre, sin catálogo fijo ni máximo comercial.

**`room_type`**: `id`, `public_id`, `hotel_id`, `name`, `normalized_key`, `capacity`, `base_rate`, `is_active`, `deleted_at`, `row_version`.

- `capacity > 0`; `base_rate > 0`; una sola tarifa por tipo, usada en todas las salidas y propuestas.
- Único parcial `(hotel_id, normalized_key)` para tipos no eliminados.
- El importe hotelero es `base_rate × noches` (períodos completos de 24 h), con snapshot en la reserva.

**`room_inventory_night`**: `room_type_id`, `stay_date`, `quantity_total`, `quantity_committed`, `row_version`; PK `(room_type_id, stay_date)`.

- `quantity_total >= 0`; `0 <= quantity_committed <= quantity_total`.
- Una estancia exige cupo en **todas** las noches; no se bloquea parcialmente.
- Dos estancias que terminan y comienzan en el mismo instante no se solapan.
- La reducción por debajo de compromisos se rechaza bajo bloqueo de las filas afectadas.
- El inventario se comparte por tipo/fecha entre propuestas del mismo hotel; no hay inventario por salida.

**`lodging_proposal`**: `id`, `public_id`, `departure_id`, `hotel_id`, `check_in_date`, `check_out_date`, `is_active`, `row_version`, `created_at`, `updated_at`.

- `check_out_date > check_in_date`; el período es múltiplo positivo de 24 h y futuro en hora Perú.
- Ofrece automáticamente todos los tipos activos del hotel; no se guarda un subconjunto.
- Cambiar fechas no altera reservas existentes; una propuesta pendiente de ajuste se oculta al cliente y sigue visible al administrador.
- No se impone una unicidad `(departure, hotel, fechas)` no aprobada; se indexa para consulta y se valida duplicación como decisión pendiente si aparece.

**`hotel_image` / `room_type_image`**: mismas columnas que `offer_image`, con propietario `hotel_id` o `room_type_id`. Principal y galería; las fotos de tipo son opcionales.

## 7. Reservas

### 7.1 Raíz

**`reservation`**

| Campo | Regla |
|---|---|
| `id`, `public_id`, `reservation_number` | `reservation_number` único; desempate estable del historial. |
| `account_id` | Propietario autenticado; no se acepta del cuerpo. |
| `departure_id`, `offer_id` | Una oferta y una salida; `offer_id` se conserva para consulta y reconciliación. |
| `status` | Solo `pending`, `confirmed`, `completed`, `cancelled`. No existen `expired` ni `processing` como estados comerciales. |
| `created_at`, `payment_deadline_at`, `validation_deadline_at` | Cortes originales de 15/20 minutos; inmutables tras crear la reserva. |
| `confirmed_at`, `completed_at`, `cancelled_at` | Nulos hasta la transición correspondiente. |
| `cancellation_origin` | `client`, `admin`, `expiry`, `payment_reject`; nulo si no está cancelada. |
| `cancellation_reason` | Motivo administrativo cuando aplique; no se inventa para cancelación automática. |
| `currency` | `PEN`. |
| `tourist_subtotal`, `lodging_subtotal`, `total` | Snapshots exactos; `tourist_subtotal + lodging_subtotal = total`. |
| `row_version` | Protección de transiciones. |

Invariantes:

- Una reserva tiene exactamente un componente turístico y cero o un componente hotelero (un hotel, un tipo, un período, una habitación).
- El total no se recalcula con precios, horarios o contenido actuales.
- `pending` puede pasar a `confirmed` o `cancelled`; `confirmed` a `completed` o `cancelled`; `completed`/`cancelled` son terminales para las operaciones normales.
- La cancelación y la liberación son únicas; un replay no repite efectos.
- La reserva conserva `payment_deadline_at` y `validation_deadline_at` aunque la configuración cambie después.

### 7.2 Snapshots

**`reservation_offer_snapshot`** (1:1 con reserva): `reservation_id`, `offer_type`, `offer_name`, `departure_starts_at`, `departure_ends_at`, `duration_value`, `duration_unit`, `travelers`, `price_per_person`, `subtotal`, `currency`. `travelers` es una cantidad, no una lista nominal; `subtotal = price_per_person × travelers` con el precio efectivo de la salida, sin redondeo intermedio.

**`reservation_lodging_snapshot`** (0:1): `reservation_id`, `proposal_id`, `hotel_name`, `room_type_name`, `capacity`, `check_in_date`, `check_out_date`, `nights`, `nightly_rate`, `subtotal`, `currency`.

Los snapshots son inmutables. No se enriquecen con el nombre actual de la oferta/hotel ni con tarifas vigentes. Los horarios históricos permiten a 009 decidir cancelación/finalización sin leer el catálogo actual.

### 7.3 Compromisos y liberaciones

**`reservation_hold`**: `id`, `reservation_id`, `resource_type` (`departure`/`room_night`), `resource_id`, `period_date` (nulo para cupo turístico global), `quantity`, `state` (`held`/`released`), `created_at`, `released_at`.

- Unicidad por `(reservation_id, resource_type, resource_id, COALESCE(period_date, DATE '0001-01-01'))` o `NULLS NOT DISTINCT` si la versión real lo admite, para impedir compromisos duplicados sin depender de que PostgreSQL trate los `NULL` como iguales.
- Para hotel se propone una fila por noche; para turismo, una fila por reserva/salida.
- `quantity` es personas para turismo y habitaciones (1) para hotel.
- `state` es una marca de lectura; la autoridad de la liberación es `inventory_release` (una fila por `hold_id`).

**`inventory_release`**: `id`, `hold_id` único, `reservation_id`, `resource_type`, `resource_id`, `period_date`, `released_at`, `origin` (`client_cancel`, `admin_cancel`, `expiry`, `payment_reject`), `operation_id`.

- La marca única por `hold_id` es la garantía de liberación idempotente.
- Liberar no aumenta `quantity_total` ni crea inventario ficticio; solo reduce `quantity_committed`.
- Si una marca existe, un reintento detecta el efecto aplicado y no vuelve a descontar.

**`reservation_status_history`**: `id`, `reservation_id`, `from_status`, `to_status`, `origin`, `actor_type`, `actor_id`, `occurred_at`, `operation_id` único, `reason`. Es historia de negocio consultable; no sustituye la auditoría inmutable.

**`reservation_operation`**: `id`, `reservation_id`, `actor_type`, `actor_id`, `action` (`create`/`cancel`/`complete`), `key`, `payload_hash`, `result_code`, `created_at`; único `(actor_type, actor_id, action, key)`. Especializa la idempotencia de comandos con raíz de reserva; `idempotency_record` cubre identidad y operaciones sin esa raíz. Un replay con el mismo payload devuelve el resultado; con payload distinto se rechaza.

### 7.4 Búsqueda e historial

Índices propuestos, a validar con planes reales:

- `(account_id, created_at DESC, id DESC)` para historial propio de diez elementos.
- `(status, created_at DESC, id DESC)` para administración.
- `(departure_id)`, `(offer_id)`, `(created_at)` para filtros y reportes.
- `(reservation_number)` único.
- `(payment_deadline_at)` y `(validation_deadline_at)` parciales sobre `status = 'pending'` para vencimiento.

No se indexa correo de cliente en reservas: el correo pertenece a Identity y 009/010 lo obtienen por contrato autorizado.

## 8. Pagos y devoluciones

**`payment_attempt`**: `id`, `public_id`, `reservation_id`, `account_id`, `method` (`card`/`yape`), `received_at`, `deadline_at`, `amount`, `currency`, `status` técnico (`created`, `sent`, `unknown`, `approved`, `rejected`), `provider_request_ref`, `row_version`. Un intento rechazado queda cerrado para ese intento; no se reabre.

- Único parcial: un solo intento **no resuelto activo** por reserva (`status IN ('created','sent','unknown')`). Un `created` que no llegó a enviarse se reconcilia/cierra por el mismo caso antes de admitir otro; no se reabre. No es un estado comercial de la reserva.
- `amount`/`currency` son los históricos de la reserva; no se aceptan del navegador.
- Un intento iniciado después del corte no se crea; la comprobación temporal ocurre bajo protección de la reserva.

**`external_payment`**: `id`, `provider` (`culqi`), `provider_transaction_id`, `attempt_id`, `reservation_id`, `amount`, `currency`, `status`, `occurred_at`, `validated_at`; único `(provider, provider_transaction_id)`. Dos transacciones externas realmente distintas se conservan; la excedente genera devolución.

**`payment_result_receipt`**: `id`, `source` (`sync`/`webhook`/`query`), `external_event_id` (nullable), `attempt_id`, `payment_id`, `correlation_id`, `received_at`, `validated_at`, `integrity_hash`, `result_code`, `reported_amount`, `reported_currency`. Único parcial `(source, external_event_id)` cuando el ID exista. No se guarda el payload completo con secretos.

**`refund_case`**: `id`, `public_id`, `payment_id`, `reservation_id`, `reason_code` (`late`, `duplicate`, `excess`, `observed`, `admin_cancel`), `detected_at`, `due_at`, `amount`, `currency`, `status` (`open`, `authorized`, `in_progress`, `executed`, `rejected`, `unknown`), `authorized_by`, `authorized_at`, `row_version`; único `(payment_id, reason_code)`.

**`refund_attempt`**: `id`, `case_id`, `operation_ref` único, `authorized_by`, `requested_at`, `amount`, `status`, `provider_refund_id`, `verified_at`, `result_code`; índice parcial para un intento en curso/desconocido por caso. La suma ejecutada **más** los importes reservados en intentos en curso/desconocidos no puede exceder el cobro; se comprueba bajo bloqueo del caso/cobro.

No se modelan PAN, CVV, código Yape, tokens de checkout, credenciales ni cuerpos que los contengan. Los IDs externos no sensibles se separan de secretos.

## 9. Vencimiento y programación

**`expiry_schedule`**: `id`, `reservation_id`, `cut_type` (`15`/`20`), `due_at`, `state` (`pending`, `dispatched`, `consumed`, `cancelled`), `dispatch_ref`, `created_at`; único `(reservation_id, cut_type)`. Se registran ambos cortes al crear la reserva, no solo el de 20 cuando cambia el intento.

**`expiry_execution`**: `id`, `schedule_id`, `reservation_id`, `origin` (`job`/`recovery`/`validated_rejection`), `applicable_cut`, `started_at`, `finished_at`, `result`, `correlation_id`, `attempt_no`; único `(schedule_id, attempt_no)`. Cada reintento real deja evidencia; no finge una segunda cancelación exitosa.

**`operational_incident`**: `id`, `public_id`, `type`, `reservation_id` (nullable), `first_seen_at`, `last_seen_at`, `due_at`, `attempts`, `status`, `alert_delivery_id`, `resolved_at`, `resolution_note`. Separado del estado comercial; un incidente no crea `expired`/`processing`.

El estado de Hangfire no es el estado de negocio. Los argumentos de jobs contienen IDs/referencias no sensibles, no entidades serializadas ni secretos.

## 10. Notificaciones

**`notification_fact`**: `id`, `origin_module`, `fact_type`, `fact_id`, `phase`, `reservation_id`, `payment_id`, `account_id`, `incident_id`, `created_at`; único `(origin_module, fact_type, fact_id, phase)`. Una devolución en fase distinta no se descarta como duplicado.

**`notification_delivery`**: `id`, `public_id`, `fact_id`, `recipient_kind` (`client`/`admin`), `recipient_account_id`, `recipient_email_normalized`, `generation_type` (`automatic`/`manual`), `generation_no`, `manual_of_delivery_id`, `template_key`, `template_version`, `payload_digest`, `status`, `created_at`; único `(fact_id, recipient_kind, recipient_account_id, generation_no)` y único parcial `manual_of_delivery_id` para una sola generación manual por entrega original.

**`notification_attempt`**: `id`, `delivery_id`, `attempted_at`, `idempotency_key`, `provider_message_id`, `result` (`accepted`/`unknown`/`rejected`), `error_code`, `error_sanitized`. La clave es opaca y no contiene correo, token ni datos personales.

**`notification_event`**: `id`, `provider_event_id` único, `provider_message_id`, `type`, `provider_at`, `received_at`, `verified_at`, `payload_digest`. Un evento posterior no borra un rebote o una entrega conocida.

Estados técnicos separados: intención pendiente, emisión iniciada, aceptación del proveedor, resultado desconocido, entrega al servidor destinatario y rechazo/rebote. «Aceptado» no es «entregado»; «entregado» no es «leído».

## 11. Auditoría

**`audit_record`**: `id`, `origin`, `operation_id`, `fact_id`, `step`, `attempt`, `actor_type` (`human`/`system`/`unidentified`), `actor_id`, `action`, `entity_type`, `entity_id`, `occurred_at`, `recorded_at`, `correlation_id`, `result`, `changes`, `schema_version`, `dedup_key` único.

- `changes` solo contiene campos de una lista positiva versionada; no snapshots completos, payloads HTTP ni objetos serializados.
- Prohibidos password, JWT, refresh, tokens/enlaces/códigos, PAN/CVV y credenciales, incluso anidados.
- `occurred_at` es la fecha del hecho; `recorded_at` la incorporación real. Un resultado externo recuperado no se retrofecha.
- Las referencias históricas se conservan tras baja lógica; no hay FK en cascada que borre auditoría.
- El catálogo incluye exactamente `reservation.auto_cancelled`; no se inventan acciones como si estuvieran aprobadas.

**`audit_action_catalog`**: `module`, `action`, `schema_version`, `allowed_fields`, `is_active`; único `(module, action, schema_version)`.

**`audit_pending`**: `id`, `origin`, `operation_id`, `fact_id`, `payload_sanitized`, `first_seen_at`, `last_attempt_at`, `attempts`, `status`. Recuperación de evidencia pendiente; no sustituye la transacción original ni crea un éxito inventado.

La inmutabilidad es **desde la aplicación**: rol de runtime sin `UPDATE`/`DELETE`/`TRUNCATE`/`DROP` sobre auditoría; no se promete inmunidad frente a superusuario, operador de almacenamiento o restauración de respaldos.

## 12. Exportaciones y reportes

**`export_request`**: `id`, `public_id`, `requester_account_id`, `kind` (`clients_csv`/`audit_csv`/`report_pdf`), `filters_normalized`, `columns_version`, `requested_at`, `status` (`admitted`/`captured`/`rendering`/`ready`/`failed`), `idempotency_key`; único `(requester_account_id, idempotency_key)`.

**`export_capture`**: `id`, `request_id` único, `reference_at`, `isolation_level`, `row_count`, `manifest_digest`, `completed_at`. Se materializa una copia privada bajo un snapshot adquirido en la admisión; no basta guardar un ID de `pg_export_snapshot()` tras cerrar la transacción.

**`export_row`**: `capture_id`, `ordinal`, `entity_type`, `entity_id`, `values` (solo columnas autorizadas). Copia temporal privada; no se lee como vista actual al renderizar.

**`export_artifact`**: `id`, `request_id`, `format`, `storage_key`, `byte_size`, `digest`, `created_at`, `expires_at`. El PDF de 011 incluye todas las filas capturadas; la paginación visual no recorta el artefacto.

Una repetición con la misma clave consulta el estado/resultado de esa solicitud; no crea otra captura con datos nuevos etiquetados como antiguos.

## 13. Multimedia

**`media_asset`**: `id`, `public_id`, `storage_key` único, `mime`, `format`, `byte_size`, `width`, `height`, `content_hash`, `status` (`uploaded`/`validated`/`referenced`/`published`/`cleanup_pending`/`deleted`), `first_published_at`, `deleted_at`, `row_version`, `created_at`.

- La clave la genera el servidor y es inmutable; cada carga usa una clave nueva.
- La marca `first_published_at` se establece en la primera publicación real del consumidor o al asociar una foto válida a un elemento ya público; no por subir a un borrador.
- Desactivar el servicio o retirar el enlace no revoca esa marca histórica mientras el archivo se conserve.

**`media_reference`**: `id`, `asset_id`, `consumer_type` (`offer`/`hotel`/`room_type`/`mobility`), `consumer_id`, `role` (`main`/`gallery`), `position`, `created_at`, `removed_at`; único parcial de principal vigente por consumidor. La asociación y el registro de referencia se confirman en la misma transacción local del consumidor.

**`media_cleanup_intent`**: `asset_id` único, `fence_at`, `state`, `attempts`, `last_error`. Antes de eliminar se bloquea el activo, se comprueban referencias vigentes/históricas y se cierra la creación de nuevas asociaciones; si un lector no está disponible, la limpieza se bloquea, no se asume cero referencias.

## 14. Movilidad

**`mobility_category`**: `id`, `public_id`, `name`, `normalized_key`, `capacity`, `features`, `is_active`, `image_asset_id`, `row_version`, `created_at`, `updated_at`.

- Único parcial de `normalized_key` entre activos; dos borradores pueden coincidir.
- Un activo exige nombre no vacío, características no vacías, capacidad entera positiva e imagen válida.
- Una sola imagen principal; sin galería, filtros, buscador o paginación añadidos.
- `image_asset_id` es la referencia vigente denormalizada para lectura; la asociación se registra también en `media_reference` para que la limpieza de 012 no dependa de un puntero aislado.

## 15. Relaciones y cardinalidades

| Relación | Cardinalidad | Regla |
|---|---|---|
| Cuenta → familia refresh | 1:N | Cada login crea una familia; logout revoca solo la actual. |
| Cuenta → solicitud de enlace | 1:N | Solo una vigente por propósito (005-C para verificación). |
| Cuenta → perfil | 1:1 | Datos básicos autorizados. |
| Oferta → salida | 1:N | Cada salida pertenece a una oferta. |
| Oferta → día de itinerario | 1:N | Itinerario compartido por todas las salidas. |
| Hotel → tipo de habitación | 1:N | Tipo con tarifa única. |
| Tipo → inventario por noche | 1:N | Una fila por fecha/noche. |
| Salida → propuesta de alojamiento | 1:N | Propuesta asociada a una salida/hotel/período. |
| Reserva → snapshot turístico | 1:1 | Obligatorio. |
| Reserva → snapshot hotelero | 1:0..1 | Solo si se eligió alojamiento. |
| Reserva → compromiso | 1:N | Cupo turístico y noches hoteleras. |
| Reserva → intento de pago | 1:N | Un solo intento no resuelto activo. |
| Pago externo → caso de devolución | 1:N | Un caso por cobro/motivo. |
| Reserva → programación de vencimiento | 1:2 | Cortes 15 y 20. |
| Hecho → entrega | 1:N | Una entrega por destinatario/generación. |
| Activo multimedia → referencia | 1:N | Referencias de consumidores. |

No se crean relaciones muchos-a-muchos entre reserva y ofertas/hoteles: la spec prohíbe varias ofertas u hoteles por reserva.

## 16. Máquinas de estado

### 16.1 Reserva (comercial)

```text
pending ──confirmación válida──> confirmed ──fin contratado + acción admin──> completed
   │                                  │
   └──cancelación cliente/expiry──────┴──cancelación admin (antes del inicio)──> cancelled
```

- `pending → confirmed` solo con pago validado dentro del corte y reserva cobrable.
- `pending → cancelled` por cliente o vencimiento; un rechazo definitivo durante tolerancia también cancela.
- `confirmed → cancelled` solo por administración y estrictamente antes del primer inicio contratado, con motivo.
- `confirmed → completed` solo con confirmación expresa del administrador y todos los períodos terminados.
- No hay reactivación, `expired` ni `processing`.

### 16.2 Intento de pago (técnico)

```text
created → sent → approved
                ├→ rejected
                └→ unknown → approved | rejected (por consulta oficial)
```

`unknown` no es rechazo y bloquea otro intento/cancelación voluntaria. Un intento `approved` no se reutiliza para otro cobro.

### 16.3 Caso de devolución (técnico)

```text
open → authorized → in_progress → executed
                              ├→ rejected (definitivo verificado)
                              └→ unknown → executed | rejected (consulta oficial)
```

Un caso vencido sigue abierto; no se autoautoriza ni se cierra por tiempo. Un resultado desconocido conserva su importe reservado hasta evidencia oficial.

### 16.4 Entrega de notificación (técnico)

```text
pending → emitting → accepted → delivered
                  ├→ unknown → accepted | rejected
                  └→ rejected
accepted/delivered → bounced | complained
```

Son estados de entrega, no de reserva. Un HTTP exitoso no es «entregado»; `email.delivered` no es «leído».

### 16.5 Cambio de correo

```text
pending → verified/applied
    ├→ expired
    └→ superseded
```

Una solicitud rechazada no sustituye la anterior; una nueva admisión válida sí.

### 16.6 Exportación

```text
admitted → captured → rendering → ready
                            └→ failed
```

Solo una captura confirmada pasa a renderizado; un snapshot huérfano no es copia durable.

## 17. Unicidad, integridad e índices propuestos

| Registro | Restricción | Propósito |
|---|---|---|
| `account` | único `email_normalized` (incluye baja) | No duplicar identidad ni reutilizar correo. |
| `google_identity` | único `(provider, issuer, subject)` | Identidad externa estable. |
| `refresh_token` | único `digest` | Detectar reutilización. |
| `link_request` | único `(account_id, purpose, generation)` + parcial de vigente | Solo la última prueba válida. |
| `offer` | único parcial `(type, normalized_key)` en publicadas | Nombres únicos por tipo. |
| `offer_departure` | check `0 <= capacity_committed <= capacity_total` | No sobrevender. |
| `hotel` | único parcial `normalized_key` en activos | Nombres únicos. |
| `room_type` | único parcial `(hotel_id, normalized_key)` | Nombres únicos por hotel. |
| `room_inventory_night` | PK `(room_type_id, stay_date)` + checks | Una fila por noche; no negativo. |
| `reservation` | único `reservation_number`; check suma de subtotales | Identidad y reconciliación. |
| `reservation_hold` | único con `COALESCE(period_date, DATE '0001-01-01')` o `NULLS NOT DISTINCT` | No duplicar compromisos. |
| `inventory_release` | único `hold_id` | Liberación idempotente. |
| `payment_attempt` | parcial único de intento activo por reserva | Un solo intento no resuelto. |
| `external_payment` | único `(provider, provider_transaction_id)` | Un evento repetido no es otro pago. |
| `refund_case` | único `(payment_id, reason_code)` | Un caso por cobro/motivo. |
| `refund_attempt` | único `operation_ref`; parcial de intento en curso | No duplicar devoluciones. |
| `expiry_schedule` | único `(reservation_id, cut_type)` | Un trabajo por corte. |
| `notification_fact` | único `(origin_module, fact_type, fact_id, phase)` | Deduplicar el mismo hecho. |
| `notification_delivery` | único `(fact_id, recipient_kind, recipient_account_id, generation_no)` | Una entrega por destinatario/generación. |
| `audit_record` | único `dedup_key` | Reintento no duplica el asiento. |
| `export_request` | único `(requester_account_id, idempotency_key)` | Repetición devuelve el mismo resultado. |
| `media_asset` | único `storage_key` | Clave inmutable por carga. |
| `media_reference` | parcial único de principal vigente | Una principal por consumidor. |
| `mobility_category` | único parcial `normalized_key` en activos | Nombres únicos. |

Los índices parciales que dependen de estado se validan contra PostgreSQL real. La colación y la comparación normalizada deben coincidir entre aplicación, base y pruebas; no se asume que cualquier configuración regional ordene igual.

## 18. Transacciones, bloqueo y orden

### 18.1 Fronteras locales

| Operación | Unidad atómica |
|---|---|
| Crear reserva | Reserva + snapshots + compromisos + contadores + auditoría + programación de vencimiento. |
| Confirmar pago | Reserva `confirmed` + pago externo + recepción + auditoría + intención de notificación. |
| Cancelar (cliente/admin/expiry) | Reserva `cancelled` + liberaciones + contadores + auditoría + intención de aviso; en admin, obligación de devolución. |
| Completar | Reserva `completed` + historial + auditoría. |
| Consumir enlace | Solicitud consumida + efecto de cuenta/contraseña + versión de seguridad + revocaciones + auditoría + intención de aviso. |
| Exportar | Solicitud + captura + filas privadas + manifiesto, antes de renderizar. |

Una llamada a Culqi, Resend o R2 **no** forma parte del commit local. El outbox/inbox no garantiza «exactamente una vez» del proveedor; la evidencia y la consulta oficial son obligatorias.

### 18.2 Orden de bloqueo

Propuesta a verificar con PostgreSQL real:

```text
cuenta/elegibilidad
  → familia/solicitud de enlace
  → reserva
  → intento/pago/caso de devolución
  → compromisos de inventario (tipo, id, fecha, orden estable)
  → auditoría (anexado)
  → intención de notificación
```

- Todos los escritores deben adherirse; un adaptador que no lo haga deja la puerta correspondiente abierta.
- `READ COMMITTED` con bloqueos de fila/actualizaciones condicionales para comandos; `REPEATABLE READ` para capturas de exportación/reportes.
- No mantener transacciones durante HTTP, interacción de usuario o renderizado.
- Reintentos acotados solo para deadlock/conflicto transitorio, con nueva lectura, tiempo y autorización; nunca para conflicto de negocio, versión o corte vencido.
- Un fallo de auditoría antes de un efecto local aborta el cambio; un efecto externo ya ocurrido se recupera sin volver a cobrar ni inventar confirmación.

### 18.3 Derivación y reconciliación

- `capacity_committed` y `quantity_committed` son contadores de rendimiento; el libro `reservation_hold`/`inventory_release` es la evidencia. Una vista de reconciliación detecta deriva; no se corrige silenciosamente desde un job.
- El estado de la reserva no se deriva de contadores ni de jobs; es la fuente comercial.
- La cantidad de reservas de un cliente para 010/011 se cuenta por IDs distintos, no por noches/eventos.
- Los importes de reportes se leen de snapshots, no del catálogo actual.

## 19. Retención, baja lógica y minimización

| Dato | Tratamiento propuesto | Límite |
|---|---|---|
| Cuenta con baja | Lógica; correo canónico e historial conservados; unicidad mantenida | No elimina filas financieras/auditoría; no permite reutilizar el correo. |
| Perfil | Nombre/teléfono vigentes; sin duplicar correo | Baja oculta datos en 010 salvo ID, estado y cantidad. |
| Refresh/solicitudes | Digests y evidencia mientras la familia/prueba sea relevante; secretos brutos no persistidos | Ventana exacta a ratificar en MD-08. |
| Reservas/pagos/devoluciones | Conservación histórica; snapshots inmutables | Sin borrado físico por baja del cliente. |
| Auditoría | Conservación indefinida aprobada por 010 | Inmutable desde la aplicación. |
| Notificaciones | Hecho/entrega/intento/evento sin secretos; digests y estados | Retención exacta a ratificar. |
| Exportaciones | Copia privada y artefacto con vencimiento; borrado verificable | No reutilizar una referencia vencida. |
| Multimedia | Objeto y metadatos; limpieza solo tras comprobar cero referencias | Candidato desde 24 h sin referencias (propuesta operativa). |

La minimización no autoriza borrar historia financiera o de auditoría. La baja lógica no es un alias de acceso permanente al correo anterior.

## 20. Orden de migración propuesto

1. Convenciones, auditoría y catálogo de acciones (sin FK de negocio) para que los módulos puedan anexar desde su primer commit.
2. Identidad/acceso: cuenta, roles, identidad Google, familias/refresh, solicitudes, perfil, cambio de correo, baja, idempotencia.
3. Catálogo: oferta, itinerario, salidas, precios, imágenes.
4. Hoteles: hotel, servicios, tipos, inventario por noche, propuestas, imágenes.
5. Reservas: raíz, snapshots, compromisos, liberaciones, historial, operaciones.
6. Pagos/devoluciones y vencimiento: intentos, pagos externos, recepciones, casos, programación, ejecución, incidentes.
7. Notificaciones: hechos, entregas, intentos, eventos.
8. Exportaciones/reportes, multimedia y movilidad.

Cada paso debe poder revertirse sin borrar datos de un paso anterior. Las migraciones no se ejecutan al arrancar producción sin autorización; identidad/privilegios de migración se separan del runtime.

## 21. Puertas del modelo de datos

| ID | Condición pendiente | Evidencia requerida |
|---|---|---|
| MD-01 — Nombres, tipos e identificadores | Esquema físico, convención de nombres, UUID, precisión monetaria y enums | Ratificación y migración revisada; sin cambios de reglas comerciales. [Plan DEC-223](plan-md-01-md-08.md). |
| MD-02 — PostgreSQL real | Versión, colación, `timestamptz`, índices parciales, `numeric`, funciones disponibles | Pruebas en la versión real de Supabase/PostgreSQL; no sustituir por proveedor en memoria. |
| MD-03 — Concurrencia | Orden de bloqueo, deadlocks, aislamiento, reintentos y tiempos | Pruebas de última unidad, doble liberación, cancelación/pago/vencimiento concurrentes. |
| MD-04 — Inventario | Contadores vs libro, reconciliación, reducciones y estancias limítrofes | Pruebas de última habitación/cupo, rollback y deriva cero en escenarios representativos. |
| MD-05 — Pagos/devoluciones | Unicidad externa, intento activo, suma ejecutada/en curso, resultados desconocidos | Contratos y pruebas con el proveedor; sin operaciones live en esta actividad. |
| MD-06 — Auditoría | Inmutabilidad desde la aplicación, permisos, deduplicación y recuperación | Pruebas de roles y fallo simultáneo; no prometer inmunidad de superusuario. |
| MD-07 — Exportaciones | Captura materializada, manifiesto, artefacto y referencias vencidas | Pruebas de concurrencia, caída antes/después del commit y renderizado sin relectura. |
| MD-08 — Retención y baja | Ventanas de digests, artefactos, notificaciones y limpieza multimedia | Ratificación de plazos y pruebas de borrado/restauración; auditoría y finanzas conservadas. [Plan DEC-223](plan-md-01-md-08.md). |

Estas puertas no se cierran por redactar el modelo. Se suman a BT-01–BT-04, RV-01–RV-05, G/V/M/I/P/R/A/Q/U y a las puertas específicas de cada plan.

## 22. Trazabilidad y conteos

| Fuente | Aporte al modelo |
|---|---|
| 001 | Reserva, snapshots, estados, compromisos, ventanas 15/20, historial. |
| 002 | Intento, pago externo, recepción, devolución, idempotencia. |
| 003 | Programación, ejecución, liberación única, incidente, 60 s. |
| 004 | Hecho, entrega, intento, evento, deduplicación. |
| 005/005-C | Cuenta, roles, Google, refresh, solicitudes, última prueba válida. |
| 006 | Oferta, itinerario, salida, precios, unicidad, imágenes. |
| 007 | Hotel, servicios, tipos, inventario por noche, propuestas. |
| 008 | Perfil, cambio de correo, baja, versiones, idempotencia. |
| 009 | Historial, operaciones administrativas, transiciones, motivo. |
| 010 | Auditoría, catálogo de acciones, exportación de clientes/auditoría. |
| 011 | Resultado de reporte, captura, PDF completo. |
| 012 | Activo, referencias, publicación histórica, limpieza. |
| 013 | Categoría informativa, unicidad, imagen principal. |

No se añaden RF, HU, RN, criterios ni tareas. El inventario permanece en **677 criterios aprobados y 402 tareas pendientes**, cero ejecutadas. Este documento es una propuesta de diseño; no ratifica la base técnica, los contratos propuestos ni la arquitectura, y no autoriza implementación.
