# 04. Atributos de calidad

## Criterios de evaluación y escenarios

A continuación, se definen los atributos de calidad del sistema mediante escenarios esperados, orientados a un despliegue monolítico.

| ID | Atributo de calidad | Escenario de calidad |
| :--- | :--- | :--- |
| **AC01** | Rendimiento | Las consultas del catálogo y el flujo de reserva deben responder rápidamente (API < 300 ms) aprovechando la baja latencia de la comunicación interna del monolito. |
| **AC02** | Disponibilidad | El sistema debe permanecer disponible durante picos operativos, asegurando que las tareas en segundo plano (vencimiento de reservas) no bloqueen el hilo principal que atiende las peticiones HTTP de los clientes. |
| **AC03** | Escalabilidad | La aplicación debe soportar el incremento de tráfico mediante el escalado vertical (más recursos de hardware) o el escalado horizontal del monolito completo (múltiples instancias detrás de un balanceador de carga) sin afectar su funcionamiento. |
| **AC04** | Seguridad | Los datos, credenciales y operaciones de pago deben estar protegidos frente a accesos no autorizados mediante JWT centralizado y control estricto basado en roles (RBAC). |
| **AC05** | Privacidad y Aislamiento | El sistema debe garantizar que las consultas y mutaciones de datos filtren estrictamente por el identificador del usuario autenticado, impidiendo el acceso a reservas ajenas. |
| **AC06** | Mantenibilidad | El sistema debe organizarse como un **monolito modular**, utilizando una arquitectura en capas limpias (Controladores, Servicios de Dominio, Acceso a Datos) dentro de la misma solución para aislar responsabilidades sin fragmentar la infraestructura. |
| **AC07** | Integridad y Concurrencia | El sistema debe gestionar el acceso concurrente a los cupos de tours y hoteles mediante transacciones y bloqueos de fila a nivel de base de datos, previniendo la sobreventa. |
| **AC08** | Interoperabilidad | El monolito debe exponer contratos JSON consistentes (DTOs) hacia la aplicación frontend en React y procesar correctamente los Webhooks externos (Culqi) en endpoints dedicados. |
| **AC09** | Trazabilidad y Auditoría | Cada operación crítica que mute el estado del sistema debe registrar inmutablemente el actor, la acción, la entidad y la fecha en un log centralizado en la base de datos. |
| **AC10** | Usabilidad | El sistema debe proveer al cliente información precisa e inmediata sobre el estado de sus pagos tras el checkout, despachando el comprobante por correo electrónico. |

## Mecanismos técnicos implementados

Para dar cumplimiento a los escenarios descritos en una arquitectura monolítica con **ASP.NET Core**, se contemplan los siguientes mecanismos:

* **Estructura Monolítica y Mantenibilidad (AC03, AC06):** Toda la lógica de negocio, APIs y procesos residen en un único proyecto o solución desplegable, dividida lógicamente en capas de abstracción. Esto simplifica el CI/CD y permite escalar la instancia completa sin gestionar sistemas distribuidos complejos.
* **Procesos en Segundo Plano Integrados (AC02):** La cancelación automática de reservas vencidas operará mediante un `IHostedService` o `BackgroundService` nativo de ASP.NET Core. Al correr dentro del mismo proceso del monolito, comparte el contenedor de inyección de dependencias (DI) y el contexto de base de datos, optimizando recursos.
* **Transacciones en Base de Datos (AC07):** El control de concurrencia para evitar la sobreventa se delega a **SQL Server** mediante **Entity Framework Core**, utilizando niveles de aislamiento (`IsolationLevel`) y transacciones explícitas (`IDbContextTransaction`) para asegurar la consistencia ACID de las reservas sin necesidad de bloqueos distribuidos.
* **Caché en Memoria (AC01):** Al ser un monolito, se utilizará `IMemoryCache` de .NET para almacenar el catálogo público directamente en la memoria del servidor de la aplicación, eliminando latencias de red hacia un servidor de caché externo hasta que el escalado horizontal lo exija.
* **Control de Acceso Centralizado (AC04, AC05):** Autenticación y autorización gestionadas internamente con ASP.NET Core Identity y tokens JWT, protegiendo todos los módulos del sistema bajo un mismo esquema de seguridad.
* **Manejo de Excepciones y Contratos (AC08, AC10):** Un middleware global dentro del pipeline del monolito captura cualquier excepción no controlada, asegurando que el cliente de React siempre reciba una respuesta JSON estandarizada y segura.

## Consideraciones para el pase a producción

Para validar la robustez de este monolito en un entorno real, se deben evaluar las siguientes métricas:
1. **Consumo de recursos compartidos:** Monitorear el uso de CPU y memoria (mediante Application Insights o herramientas similares) para asegurar que la ejecución periódica del `BackgroundService` no degrade el rendimiento de los controladores API bajo estrés.
2. **Concurrencia en base de datos:** Realizar pruebas de carga sobre el proceso de *checkout* compuesto (tour + hotel) para certificar que SQL Server maneja correctamente los bloqueos de fila simultáneos sin generar *deadlocks* que paralicen la aplicación.
3. **Persistencia lógica centralizada:** Comprobar que los *Global Query Filters* de EF Core actúan eficientemente en todo el monolito para simular el borrado lógico (`SoftDeletes`) sin impactar el rendimiento de consultas masivas (ej. reportes del administrador).