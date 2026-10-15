# Patrones de diseño

## Objetivo

Documentar los patrones de diseño seleccionados para el backend de DMGOTRAVEL, indicando dónde se usan, qué problema resuelven y con qué tecnología se implementan, para mantener una organización uniforme en todos los módulos del monolito.

El alcance comprende Identity, Catalog, Hotels, Reservations, Payments, Notifications, Reports y Audit, además de la ejecución de tareas con Hangfire y el almacenamiento multimedia en Cloudflare R2. Cubre las responsabilidades descritas en RF01–RF24 y RN-01–RN-30; no se limita al módulo de reservas.

## Contexto

- **Estilo:** monolito modular con ASP.NET Core y C#.
- **Enfoque interno:** Clean Architecture, con Domain, Application, Infrastructure y Presentation.
- **Persistencia:** PostgreSQL y Entity Framework Core; los casos de uso acceden mediante contratos de Application.
- **Casos de uso:** Commands, Queries y Handlers con MediatR; validación de entrada con FluentValidation.
- **Identidad e integraciones:** autenticación local administrada por DMGOTRAVEL, Google OAuth/OIDC, tokens propios, Culqi, Resend y Cloudflare R2.
- **Procesamiento diferido:** Hangfire ejecuta vencimientos y trabajos recuperables dentro del backend; las reglas permanecen en Application y Domain.

Adapter y Mediator son patrones GoF.
Repository y Unit of Work son patrones de persistencia.
CQRS, Transactional Outbox e Idempotent Consumer pertenecen a otras categorías de diseño. La inyección de dependencias es una técnica de composición. Se incluyen por su función en el sistema sin considerarlos a todos patrones GoF.

## Patrones aplicados

| Patrón | Dónde se usa | Problema que resuelve | Se implementa con | Archivos en el código |
|---|---|---|---|---|
| Adapter | Identity → autenticación local y Google; emisión de tokens propios. RF03, RF04, RF12. | Evita acoplar los casos de uso a las APIs del framework de identidad, del proveedor externo y de tokens. | Contratos de Application, ASP.NET Core Identity, integración OAuth/OIDC y servicio de tokens en Infrastructure. | `IIdentityService.cs`, `AspNetIdentityService.cs`, `IExternalIdentityProvider.cs`, `GoogleIdentityProvider.cs`, `ITokenService.cs`, `JwtTokenService.cs` |
| Adapter | Payments → Culqi. RF07–RF08. | Traduce el modelo interno de pago a la API del proveedor y normaliza su resultado. | `IPaymentGateway` y adaptador de la API oficial de Culqi. | `IPaymentGateway.cs`, `CulqiPaymentGateway.cs`, `PaymentGatewayResult.cs` |
| Adapter | Notifications → Resend. RF09. | Separa la generación de confirmaciones del mecanismo concreto de envío de correo. | `IEmailService` y adaptador Resend. | `IEmailService.cs`, `ResendEmailService.cs`, `EmailMessage.cs` |
| Adapter | Catalog y Hotels → Cloudflare R2. RF24. | Evita que las reglas de ofertas y hoteles conozcan buckets, credenciales o protocolos de almacenamiento. | `IObjectStorage` e implementación R2 compartida. | `IObjectStorage.cs`, `R2ObjectStorage.cs`, `StoredObjectDto.cs` |
| Repository | Identity → perfiles y estado de cuenta. RF12, RF15. | Separa la actualización autorizada del perfil y la baja lógica de su persistencia. | Contrato específico de usuario y EF Core; las credenciales permanecen bajo ASP.NET Core Identity. | `IUserRepository.cs`, `EfUserRepository.cs`, `UserConfiguration.cs` |
| Repository | Catalog → ofertas, salidas y retenciones turísticas. RF01–RF02, RF06, RF13. | Evita SQL en los casos de uso y concentra el acceso a los agregados del catálogo. | Repositorios específicos con EF Core/Npgsql; proyecciones separadas para consultas públicas. | `IOfferRepository.cs`, `EfOfferRepository.cs`, `ITourDepartureRepository.cs`, `EfTourDepartureRepository.cs` |
| Repository | Hotels → hoteles, tipos de habitación e inventario. RF17–RF20. | Separa las reglas de alojamiento de la persistencia por tipo y noche. | Repositorios específicos con EF Core y protección transaccional del inventario. | `IHotelRepository.cs`, `EfHotelRepository.cs`, `IRoomInventoryRepository.cs`, `EfRoomInventoryRepository.cs` |
| Repository | Reservations → reservas y componentes históricos. RF05–RF06, RF10–RF11, RF14, RF18–RF22. | Conserva el agregado y sus snapshots sin introducir EF Core en Application o Domain. | `IReservationRepository` y mapeos EF Core; el repositorio no confirma transacciones por separado. | `IReservationRepository.cs`, `EfReservationRepository.cs`, `ReservationConfiguration.cs`, `ReservationItemConfiguration.cs` |
| Repository | Payments → pagos e intentos; Notifications → intenciones y entregas. RF07–RF09. | Conserva trazabilidad y estado recuperable independiente de los proveedores. | Repositorios específicos EF Core y restricciones de unicidad. | `IPaymentRepository.cs`, `EfPaymentRepository.cs`, `INotificationRepository.cs`, `EfNotificationRepository.cs` |
| Unit of Work | Reservations + Catalog + Hotels + Audit. RF05, RF18–RF19, RF21–RF23. | Evita reservas compuestas, cancelaciones o liberaciones parcialmente persistidas. | `IUnitOfWork`, contexto scoped y una transacción PostgreSQL compartida entre adaptadores participantes. | `IUnitOfWork.cs`, `EfUnitOfWork.cs`, `AppDbContext.cs` |
| Unit of Work | Payments + Reservations + Notifications + Audit. RF08–RF09, RF23. | Evita confirmar localmente un pago sin registrar la transición de reserva, la intención de correo y su auditoría. | Transacción local después de verificar la evidencia externa; llamadas a Culqi y Resend fuera de la transacción. | `ProcessPaymentResultHandler.cs`, `IReservationPaymentPort.cs`, `INotificationPort.cs`, `EfUnitOfWork.cs` |
| Mediator | Todos los módulos: Controllers y jobs → casos de uso. RF01–RF24. | Separa las entradas HTTP o programadas de la resolución de sus Handlers. | `ISender`, Commands/Queries y Handlers de MediatR; comportamiento de validación con FluentValidation. | `RegisterClientHandler.cs`, `CreateOfferHandler.cs`, `AdjustRoomInventoryHandler.cs`, `CreateReservationHandler.cs`, `ProcessPaymentResultHandler.cs`, `SendPendingNotificationsHandler.cs`, `GetManagementIndicatorsHandler.cs`, `SearchAuditLogsHandler.cs` |
| CQRS | Identity, Catalog, Hotels, Reservations, Payments, Reports y Audit. | Separa operaciones que modifican estado de consultas, filtros y proyecciones; permite reportes sin cargar agregados completos. | Commands para cambios y Queries con DTOs y puertos de lectura; la misma base PostgreSQL. | `GetMyProfileQuery.cs`, `ICatalogReadStore.cs`, `IHotelReadStore.cs`, `IReservationReadStore.cs`, `IReportsReadStore.cs`, `IAuditReadStore.cs` |
| Transactional Outbox — propuesta de persistencia de notificaciones | Payments → Notifications → Hangfire → Resend. RF09; RN-16. | Evita perder la intención de correo si el proceso cae entre confirmar el pago y programar el envío. | Intención persistida en PostgreSQL en el mismo commit de confirmación y despachador recuperable con Hangfire. No requiere broker externo. | `Notification.cs`, `NotificationConfiguration.cs`, `QueuePaymentConfirmationHandler.cs`, `DispatchNotificationsJob.cs`, `SendPendingNotificationsHandler.cs` |
| Idempotent Consumer — propuesta de procesamiento | Payments → resultados/Webhooks; Reservations → vencimiento; Notifications → trabajos repetidos. RF08–RF09, RF21–RF22. | Impide repetir efectos locales ante eventos o ejecuciones duplicadas. | Identificadores de evento únicos, estado persistido y transiciones atómicas; liberaciones e intenciones deduplicadas. | `PaymentEventReceipt.cs`, `ProcessCulqiWebhookHandler.cs`, `ExpirePendingReservationsHandler.cs`, `ExpireReservationsJob.cs`, `NotificationConfiguration.cs` |
| Escritura de solo anexado — restricción de persistencia | Audit → operaciones críticas y consulta administrativa. RF15, RF23; RN-28–RN-29. | Evita modificar el historial desde la aplicación y concentra el registro de actor, acción, entidad, fecha y cambios relevantes. | Puerto de escritura sin métodos de actualización/eliminación y puerto de lectura separado. No implica Event Sourcing. | `AuditLog.cs`, `IAuditWriter.cs`, `EfAuditWriter.cs`, `IAuditReadStore.cs`, `EfAuditReadStore.cs` |

Los contratos se ubican en `DMGoTravel.Application/Modules/{Modulo}/Contracts/`; sus implementaciones, en `DMGoTravel.Infrastructure/Modules/{Modulo}/`. Las entidades pertenecen a `DMGoTravel.Domain/Modules/{Modulo}/`. `IUnitOfWork` e interfaces compartidas se ubican en `Application/Common`; el contexto, en `Infrastructure/Persistence`. Cada Command o Query se organiza junto a su Handler. La raíz de composición registra las implementaciones.

Reports utiliza proyecciones de lectura; no necesita un repositorio de escritura artificial. Audit expone escritura restringida, no un CRUD genérico. Background Jobs invoca casos de uso, no duplica las reglas del negocio. EF Core ya proporciona seguimiento de cambios y comportamiento de unidad de trabajo; el contrato `IUnitOfWork` delimita su uso desde Application sin duplicar ese mecanismo.

## Cómo funciona cada patrón

| Patrón | En pocas palabras |
|---|---|
| Adapter | Identity solicita autenticar mediante su contrato; Payments solicita procesar un pago; Notifications solicita enviar correo; Catalog y Hotels solicitan almacenar un archivo. Cada adaptador traduce la petición a su tecnología y devuelve un resultado propio de Application. |
| Repository | El caso de uso obtiene o guarda usuarios, ofertas, salidas, hoteles, inventario, reservas, pagos o notificaciones mediante interfaces específicas. El adaptador realiza la persistencia. Domain no recibe `DbContext`, SQL ni objetos de los SDK. |
| Unit of Work | Crear una reserva retiene cupos y, opcionalmente, habitaciones de todas las noches; guarda snapshots, reserva `pending` y auditoría. Confirma todo o revierte todo. Cancelar o vencer una reserva pendiente libera sus retenciones una sola vez dentro de otra transacción completa. |
| Mediator | Un Controller o job envía un Command/Query mediante `ISender.Send`; MediatR lo dirige a su Handler. La validación de entrada puede ejecutarse en el pipeline; el Handler mantiene autorización y coordinación del negocio. MediatR no es una cola durable. |
| CQRS | `CreateOffer`, `AdjustRoomInventory`, `CreateReservation` y `CancelMyPendingReservation` modifican estado; `SearchOffers`, `GetStayAvailability`, `GetMyReservations`, `GetManagementIndicators` y `SearchAuditLogs` devuelven DTOs. Lecturas y escrituras pueden compartir PostgreSQL. |
| Transactional Outbox | Al confirmar un pago se registra también una intención única de correo. Un job recupera intenciones pendientes y llama a Resend. Si falla, conserva el trabajo para recuperarlo; el pago y la reserva no se revierten por un fallo del correo. |
| Idempotent Consumer | Un evento de pago ya procesado no vuelve a confirmar ni a crear otra notificación. Un vencimiento repetido no devuelve cupos dos veces. La deduplicación se basa en datos persistidos y operaciones atómicas, no únicamente en consultar antes de insertar. |
| Escritura de solo anexado | Los casos de uso agregan registros de auditoría mediante `IAuditWriter`. La administración consulta mediante `IAuditReadStore`. No existen operaciones de negocio para editar o eliminar los registros. |

**Aplicación de las reglas del proyecto:** Catalog y Hotels comprueban oferta, hotel y tipo activos; tarifas oficiales y disponibilidad real. Reservations conserva precios históricos, calcula el total en backend y coordina los puertos `ITourReservationPort` e `IHotelReservationPort`. La disponibilidad se protege con bloqueos o actualizaciones condicionales; usar Repository o Unit of Work sin control de concurrencia no impide sobreventa.

Payments valida autenticidad, importe, moneda y referencia antes de solicitar `pending → confirmed`. El resultado síncrono y el Webhook convergen en el mismo procesamiento idempotente. Si el pago llega después del vencimiento o cancelación, se conserva para conciliación y no se reactiva automáticamente una reserva sin recursos. El administrador no sustituye el pago mediante un cambio manual de estado. La devolución de pagos confirmados sigue pendiente de política detallada.

Identity impide registrar públicamente administradores y aplica propiedad y baja lógica. Las Queries del cliente filtran por su identidad validada; las operaciones administrativas exigen `admin`. Reports calcula indicadores en backend evitando contar múltiples intentos como pagos distintos del mismo hecho. Audit conserva cambios relevantes sin contraseñas, tokens ni datos de tarjeta. Estos controles se implementan explícitamente; no los garantiza el nombre del patrón.

Las llamadas a Culqi, Resend y R2 quedan fuera de las transacciones de inventario. Una transacción PostgreSQL no revierte efectos externos. La entrega de correo exactamente una vez no se presume: si el proveedor acepta el envío y se pierde la respuesta, se requiere deduplicación compatible con su contrato o conciliación. Para R2 se propone limpieza recuperable de objetos huérfanos si falla el registro de metadatos.

## Beneficio

- **Identity:** permite probar autenticación, perfil, roles y baja lógica mediante contratos sin acoplar los casos de uso a Google o al framework de identidad.
- **Catalog y Hotels:** mantienen reglas de oferta, tarifas e inventario dentro de sus módulos; facilitan sustituir detalles de persistencia y almacenamiento multimedia.
- **Reservations:** coordina reservas simples y compuestas con precios históricos, transiciones válidas y liberación consistente de recursos.
- **Payments:** concentra la integración Culqi y el procesamiento idempotente; conserva cada intento y su evidencia sin almacenar datos sensibles de tarjeta.
- **Notifications:** conserva la intención de confirmación y permite recuperar fallos de envío sin deshacer el pago.
- **Reports:** obtiene indicadores y exportaciones mediante consultas específicas, sin introducir reglas de escritura en los reportes.
- **Audit:** conserva trazabilidad de operaciones críticas con acceso administrativo y escritura de solo anexado.
- **Background Jobs:** reutiliza los casos de uso para vencimientos y reintentos, evitando una segunda implementación de las reglas.
- **Sistema completo:** permite pruebas aisladas de Domain y Application. Las garantías de transacción, idempotencia y concurrencia se verifican con pruebas de integración sobre PostgreSQL. Cambiar un proveedor concentra cambios en su adaptador, aunque diferencias en capacidades pueden requerir revisar los contratos.

## Patrones previstos para siguientes iteraciones

| Patrón | Dónde se aplicaría | Cuándo |
|---|---|---|
| Decorator | Queries de contenido descriptivo público de Catalog y Hotels. | Si mediciones justifican envolver un puerto de lectura con caché. La disponibilidad, inventario, reservas y pagos continúan validándose en PostgreSQL. No se incorpora Redis únicamente por aparecer en la referencia. |
| Observer | Hechos de negocio de Reservations y Payments con varios consumidores internos. | Cuando se necesite desacoplar nuevas reacciones. Las notificaciones en memoria no sustituyen la intención persistente de correo ni garantizan entrega durable. |
| Factory | Creación de reservas y componentes turísticos/hoteleros. | Si las variantes de construcción justifican una fábrica dedicada. Un método estático `CreatePending` no constituye por sí solo el patrón GoF Factory Method. |
| Facade | API interna de Catalog, Hotels, Reservations o Payments. | Cuando un conjunto de operaciones requiera una puerta de entrada simplificada. Los puertos actuales no se consideran automáticamente Facade por ser interfaces. |
| Strategy | Cálculo de tarifas o políticas de cancelación/devolución. | Cuando existan algoritmos alternativos aprobados por el negocio. No se inventan descuentos, penalidades ni devoluciones no especificadas. |

La adopción depende de una necesidad concreta y debe respetar el monolito modular. Los requisitos pendientes sobre tokens, integración detallada de Culqi, devoluciones y formato del comprobante deben resolverse antes de presentar esos comportamientos como implementados.
