# Medición y evaluación de los atributos de calidad

## 1. Propósito

Este documento establece cómo se evaluará la calidad de DMGOTRAVEL durante el desarrollo, las pruebas y la preparación para producción. Su propósito es convertir los atributos definidos en el análisis del sistema en indicadores observables, procedimientos de medición y criterios de aceptación.

La evaluación considera la arquitectura documentada del proyecto:

- **Frontend:** React, TypeScript y Vite, publicado mediante Vercel.
- **Backend:** ASP.NET Core como una única aplicación desplegable, organizada como Monolito Modular y basada en Clean Architecture.
- **Persistencia:** PostgreSQL administrado mediante Supabase, Entity Framework Core y Npgsql.
- **Perímetro de la API:** Cloudflare Proxy/WAF.
- **Archivos:** Cloudflare R2.
- **Integraciones:** Culqi, Resend y Google OAuth 2.0 / OpenID Connect.
- **Procesos en segundo plano:** Hangfire.

La medición debe respetar esta distribución. Por ejemplo, el tiempo de respuesta de un endpoint se medirá en el backend para no mezclarlo con la latencia de Internet o de un proveedor externo; en cambio, la experiencia completa de una reserva también se evaluará desde el navegador.

## 2. Alcance y estado de las mediciones

Los atributos evaluados son los mismos que figuran en [04. Atributos de calidad](../01-analisis-de-sistema/04-atributos-de-calidad.md):

| ID | Atributo |
|---|---|
| AC01 | Rendimiento |
| AC02 | Disponibilidad |
| AC03 | Escalabilidad |
| AC04 | Seguridad |
| AC05 | Privacidad y aislamiento |
| AC06 | Mantenibilidad |
| AC07 | Integridad y concurrencia |
| AC08 | Interoperabilidad |
| AC09 | Trazabilidad |
| AC10 | Usabilidad |
| AC11 | Testabilidad |
| AC12 | Recuperabilidad |

**Importante:** este archivo define el plan de medición y los criterios que deberán comprobarse. No representa resultados de pruebas ya ejecutadas. Los valores obtenidos deberán registrarse después de implementar el sistema y realizar las pruebas en un entorno controlado.

El único objetivo cuantitativo de rendimiento que ya aparece en el análisis del proyecto es una respuesta aproximada inferior a 300 ms para consultas simples de lectura en el backend, bajo condiciones normales y excluyendo la red pública y los servicios de terceros. En este documento se propone evaluar ese objetivo mediante el percentil 95 (p95). Los demás umbrales que no estén definidos en los documentos del proyecto se identifican como pendientes de aprobación o como propuestas iniciales.

## 3. Método general de evaluación

Para que las mediciones puedan compararse, cada ejecución de pruebas deberá conservar las mismas condiciones o dejar constancia de las diferencias.

### 3.1. Entornos

Se utilizarán, según la etapa del proyecto, los siguientes entornos:

| Entorno | Uso de la medición |
|---|---|
| Desarrollo local | Pruebas unitarias, validación de reglas y diagnóstico inicial. |
| Integración o staging | Pruebas de API, base de datos, seguridad, concurrencia y rendimiento. |
| Producción | Seguimiento de disponibilidad, errores, latencia y comportamiento real, una vez autorizado el despliegue. |

Las pruebas de carga, concurrencia y recuperación deben realizarse preferentemente en staging. No se deben ejecutar pruebas destructivas contra datos reales de clientes.

### 3.2. Datos que deben registrarse

Cada ejecución deberá guardar, como mínimo:

1. Fecha y hora de inicio y fin, utilizando UTC.
2. Identificador del commit o versión evaluada.
3. Entorno y configuración de despliegue.
4. Versiones de .NET, PostgreSQL y herramientas utilizadas.
5. Volumen y características de los datos de prueba.
6. Cantidad de usuarios virtuales o solicitudes concurrentes, cuando corresponda.
7. Duración y número de repeticiones.
8. Resultado obtenido, evidencia y observaciones.
9. Incidencias encontradas y correcciones aplicadas.

Los datos personales deben sustituirse por información ficticia o anonimizada.

### 3.3. Reglas para interpretar los resultados

- La latencia promedio no debe utilizarse como único indicador; se deben revisar p50, p95 y p99.
- Una prueba aprobada no demuestra por sí sola que el sistema mantendrá el mismo comportamiento en producción.
- Las pruebas deben repetirse después de cambios relevantes en consultas, infraestructura, autenticación, reservas o pagos.
- Los resultados deben compararse bajo condiciones equivalentes.
- Una métrica sin evidencia o sin registro de las condiciones de prueba se considerará no verificada.

## 4. Matriz general de medición

| ID | Indicador principal | Forma de medición | Criterio inicial |
|---|---|---|---|
| AC01 | Latencia p95 y tasa de errores | Pruebas HTTP y medición de duración en el backend. | p95 de consultas simples de lectura ≤ 300 ms, bajo las condiciones indicadas en este documento. |
| AC02 | Disponibilidad y aislamiento de fallos | Health checks, monitoreo y pruebas de fallos controlados. | Las funciones no relacionadas deben continuar operando ante la caída simulada de una integración. El objetivo de disponibilidad mensual queda pendiente de definir. |
| AC03 | Capacidad y comportamiento al escalar | Pruebas de carga con una y más instancias, cuando el hosting lo permita. | El backend debe conservar el estado de negocio fuera de la memoria local y funcionar sin afinidad de sesión. |
| AC04 | Controles de seguridad aprobados y vulnerabilidades | Pruebas de autorización, análisis de dependencias y escaneo de la API. | Cero vulnerabilidades críticas o altas abiertas antes de producción. |
| AC05 | Acceso indebido entre clientes | Pruebas con cuentas y datos pertenecientes a usuarios distintos. | Cero accesos no autorizados o exposición de datos ajenos. |
| AC06 | Cumplimiento de dependencias y mantenibilidad del código | Pruebas de arquitectura y análisis estático. | Cero dependencias prohibidas respecto a las reglas de Clean Architecture. |
| AC07 | Sobreventa y efectos duplicados | Pruebas concurrentes de cupos, habitaciones y Webhooks. | Cero sobreventas, reservas parciales y efectos duplicados. |
| AC08 | Conformidad de contratos API | Pruebas de integración y validación contra OpenAPI. | Todos los escenarios de contrato definidos deben aprobarse. |
| AC09 | Cobertura de auditoría y correlación | Revisión de eventos y logs de operaciones críticas. | Todas las operaciones críticas deben poder relacionarse con su actor, entidad y CorrelationId. |
| AC10 | Éxito y duración de tareas del usuario | Pruebas de usabilidad con tareas representativas. | Registrar tasa de éxito, tiempo, errores y percepción del usuario; el umbral se fijará con usuarios representativos. |
| AC11 | Cobertura y aislamiento de pruebas | Ejecución de pruebas automatizadas con dependencias simuladas. | Los casos de uso críticos deben probarse sin requerir proveedores externos reales. |
| AC12 | RTO, RPO y restauración | Simulacros de respaldo y recuperación. | Los objetivos RTO y RPO deben aprobarse antes de producción y comprobarse mediante una restauración. |

## 5. Procedimiento de medición por atributo

### AC01 — Rendimiento

**Objetivo:** comprobar que las consultas y operaciones habituales responden dentro de tiempos adecuados sin generar una carga innecesaria sobre PostgreSQL.

**Indicadores:**

| Indicador | Cálculo o lectura | Unidad |
|---|---|---|
| Latencia p50 | Percentil 50 de los tiempos de respuesta. | ms |
| Latencia p95 | Percentil 95 de los tiempos de respuesta. | ms |
| Latencia p99 | Percentil 99 de los tiempos de respuesta. | ms |
| Tasa de errores HTTP 5xx | (Respuestas 5xx / solicitudes totales) × 100. | % |
| Throughput | Solicitudes completadas correctamente / tiempo de prueba. | solicitudes/s |
| Duración de consulta SQL | Tiempo empleado por PostgreSQL en consultas seleccionadas. | ms |

**Procedimiento:**

1. Seleccionar endpoints de lectura del catálogo y consultas habituales.
2. Preparar datos de prueba representativos, incluyendo registros suficientes para evaluar paginación e índices.
3. Ejecutar solicitudes con una carga definida y documentada.
4. Medir los tiempos en el servidor y, por separado, desde el cliente.
5. Identificar consultas lentas mediante el análisis de PostgreSQL.
6. Repetir la prueba después de optimizar consultas o índices.

**Criterio inicial:** para endpoints simples de lectura, la latencia p95 del backend deberá mantenerse en 300 ms o menos bajo condiciones normales de operación. La medición excluirá la latencia de Internet y el tiempo consumido por servicios externos. El valor es una operacionalización del objetivo aproximado ya establecido en el análisis de calidad; no debe aplicarse automáticamente a reportes complejos, cargas de archivos o procesos que dependan de terceros.

**Herramienta sugerida:** k6 para generar carga HTTP; métricas y logs del backend para separar el tiempo de aplicación del tiempo de red; PostgreSQL EXPLAIN ANALYZE para investigar consultas.

### AC02 — Disponibilidad

**Objetivo:** verificar que el sistema y sus funciones principales permanezcan accesibles y que un fallo externo no interrumpa operaciones que no dependen de ese servicio.

**Indicadores:**

- Disponibilidad observada: (comprobaciones satisfactorias / comprobaciones válidas) × 100.
- Tasa de errores 5xx: (respuestas 5xx / solicitudes totales) × 100.
- Tiempo de recuperación: hora de restablecimiento menos hora de inicio de la interrupción.
- Trabajos pendientes o fallidos en Hangfire: cantidad y antigüedad de ejecuciones no completadas.

**Procedimiento:**

1. Comprobar periódicamente los health checks de la API y la conexión con PostgreSQL.
2. Simular la indisponibilidad de Resend y verificar que una reserva o un pago ya confirmado no se revierta por un fallo de correo.
3. Simular un fallo de R2 en una operación que no requiera consultar archivos y comprobar que las funciones independientes sigan disponibles.
4. Interrumpir temporalmente un proceso de Hangfire y verificar que las solicitudes HTTP no relacionadas puedan continuar.
5. Registrar errores, tiempos de recuperación y trabajos que requieran reintento.

**Criterio inicial:** las funciones independientes deben seguir operando cuando falle una integración que no sea necesaria para esas funciones. El porcentaje de disponibilidad mensual objetivo se definirá cuando se conozcan el plan contratado, sus garantías y el horario de servicio esperado. No se asigna aquí un porcentaje que la infraestructura actual todavía no haya comprometido.

### AC03 — Escalabilidad

**Objetivo:** comprobar que el backend pueda atender un incremento de solicitudes y, cuando la infraestructura lo permita, ejecutarse en más de una instancia sin depender del estado local del proceso.

**Indicadores:**

| Indicador | Medición |
|---|---|
| Solicitudes por segundo | Solicitudes procesadas correctamente durante un intervalo. |
| Latencia bajo carga | p50, p95 y p99 para cada nivel de carga. |
| Uso de CPU y memoria | Consumo por instancia durante la prueba. |
| Éxito entre instancias | Porcentaje de solicitudes autenticadas que funcionan al pasar de una instancia a otra. |
| Estado local persistente | Número de dependencias de negocio que necesitan memoria o disco local. El resultado esperado es cero para estado que deba sobrevivir a reinicios o cambios de instancia. |

**Procedimiento:**

1. Ejecutar una carga de referencia con una instancia.
2. Registrar throughput, latencia y consumo de recursos.
3. Si el plan de hosting permite más instancias, repetir el escenario con dos o más.
4. Enviar solicitudes autenticadas a instancias distintas utilizando el mismo JWT.
5. Reiniciar una instancia y verificar que las reservas, pagos y sesiones de usuario no dependan de su memoria local.
6. Comparar el comportamiento y documentar los límites observados.

**Criterio inicial:** el backend debe mantener el estado del negocio en PostgreSQL y utilizar mecanismos de autenticación que no dependan de una sesión en memoria del servidor. La mejora de throughput al agregar instancias se medirá cuando el despliegue permita escalado horizontal; no se presupone una mejora lineal ni se fija un número de usuarios sin un perfil de demanda aprobado.

### AC04 — Seguridad

**Objetivo:** comprobar que la autenticación, autorización, exposición de secretos, validación de entradas y protección de endpoints sean correctas.

**Indicadores:**

- Porcentaje de controles de seguridad aprobados: (controles aprobados / controles ejecutados) × 100.
- Número de vulnerabilidades críticas, altas, medias y bajas.
- Número de endpoints administrativos accesibles sin autorización adecuada.
- Número de secretos expuestos en código, configuración o logs.
- Número de Webhooks aceptados sin validación correcta.

**Procedimiento:**

1. Probar acceso a endpoints protegidos sin token, con token inválido y con token expirado.
2. Probar endpoints administrativos con una cuenta que no tenga el rol requerido.
3. Revisar CORS, rate limiting, HTTPS y configuración de Cloudflare para la API.
4. Comprobar que los secretos se obtengan de configuración segura y no estén almacenados en Git.
5. Verificar autenticidad e idempotencia de los Webhooks de Culqi.
6. Ejecutar análisis de dependencias y escaneo dinámico de la API.
7. Revisar que los mensajes y logs no expongan contraseñas, tokens, claves privadas ni datos de tarjeta.

**Criterio inicial:** no debe quedar ninguna vulnerabilidad crítica o alta abierta ni ningún secreto real expuesto antes de producción. Los controles de autorización y validación de Webhooks definidos para los casos críticos deben aprobarse todos. Las vulnerabilidades medias y bajas deberán documentarse y priorizarse según su impacto.

**Herramientas sugeridas:** OWASP ZAP para análisis dinámico; un escáner de dependencias y un análisis estático integrado al flujo de GitHub. Estas herramientas son propuestas de evaluación y no implican que ya estén configuradas en el repositorio.

### AC05 — Privacidad y aislamiento

**Objetivo:** confirmar que cada cliente solo pueda consultar y modificar los recursos sobre los que tiene autorización.

**Indicadores:**

- Intentos de acceso cruzado ejecutados.
- Accesos cruzados rechazados.
- Registros o datos ajenos expuestos.
- Porcentaje de pruebas de aislamiento aprobadas: (pruebas aprobadas / pruebas ejecutadas) × 100.

**Procedimiento:**

1. Crear dos cuentas de prueba distintas, A y B.
2. Crear reservas y recursos privados asociados a cada cuenta.
3. Autenticarse como A e intentar consultar, modificar o cancelar recursos de B.
4. Repetir las pruebas en sentido inverso.
5. Ejecutar las pruebas en endpoints de reservas, perfil e información privada.
6. Revisar que el backend obtenga el identificador del usuario desde el contexto autenticado y no confíe en un userId enviado libremente por React.

**Criterio de aceptación:** ningún usuario debe obtener o modificar información privada de otro cliente. El resultado esperado para los intentos no autorizados es cero datos expuestos y cero modificaciones realizadas. El código HTTP concreto (403, 404 u otro definido por la política de la API) debe ser consistente con el diseño de autorización.

### AC06 — Mantenibilidad

**Objetivo:** evaluar si la organización del código permite corregir y ampliar funcionalidades sin introducir dependencias indebidas entre capas o módulos.

**Indicadores:**

| Indicador | Forma de evaluación |
|---|---|
| Violaciones de dependencias | Número de dependencias que incumplen la regla de Clean Architecture. |
| Complejidad ciclomática | Complejidad por método o componente, registrada para identificar puntos difíciles de mantener. |
| Duplicación | Porcentaje de código duplicado detectado por análisis estático. |
| Deuda técnica | Incidencias de mantenibilidad abiertas y su evolución entre versiones. |
| Impacto de cambios | Archivos y módulos afectados por una modificación delimitada. |

**Procedimiento:**

1. Ejecutar pruebas de arquitectura que verifiquen la dirección de dependencias.
2. Revisar que Domain no dependa de ASP.NET Core, EF Core ni proveedores externos.
3. Analizar el código con una herramienta de calidad estática.
4. Registrar complejidad y duplicación como línea base.
5. Seleccionar cambios representativos, como una modificación del cálculo de reservas, y observar cuántas capas o módulos deben modificarse.
6. Comparar los indicadores entre versiones.

**Criterio inicial:** las reglas de dependencia definidas para Clean Architecture deben cumplirse, sin violaciones. La complejidad y duplicación se registrarán para detectar tendencias y deberán corregirse cuando dificulten una modificación o eleven el riesgo de defectos. No se utilizará un índice aislado como prueba suficiente de mantenibilidad.

### AC07 — Integridad y concurrencia

**Objetivo:** garantizar que las operaciones simultáneas de reserva no generen sobreventa, inventario negativo, registros parciales ni efectos duplicados.

Este atributo es especialmente importante porque una reserva puede incluir un tour y, de forma opcional, alojamiento.

**Indicadores:**

- Sobreventas: cantidad de reservas confirmadas por encima de la capacidad disponible.
- Inventario negativo: cantidad de saldos de cupos o habitaciones inferiores a cero.
- Reservas parciales: reservas compuestas en las que solo se persiste uno de sus componentes.
- Efectos duplicados: confirmaciones, pagos o liberaciones de disponibilidad ejecutados más de una vez.
- Conflictos de concurrencia: operaciones rechazadas por una condición de disponibilidad o conflicto transaccional.

**Pruebas obligatorias:**

| Escenario | Ejecución | Resultado esperado |
|---|---|---|
| Último cupo turístico | Enviar varias solicitudes simultáneas para una capacidad disponible de una unidad. | Solo una reserva obtiene el cupo; las demás se rechazan de forma controlada. |
| Última habitación | Solicitar simultáneamente la misma habitación para fechas coincidentes. | No se asigna la habitación a más de una reserva incompatible. |
| Reserva tour + hotel | Forzar un fallo después de validar uno de los componentes. | La transacción no deja una reserva parcial ni inventario bloqueado indebidamente. |
| Webhook duplicado | Enviar varias veces el mismo evento de pago. | El estado y los efectos de negocio se aplican una sola vez. |
| Trabajo Hangfire repetido | Ejecutar más de una vez el vencimiento de una misma reserva. | La cancelación y liberación de disponibilidad no producen efectos duplicados. |

**Procedimiento:**

1. Preparar registros de prueba con capacidad conocida.
2. Sincronizar las solicitudes para que compitan por el mismo recurso.
3. Ejecutar el escenario varias veces.
4. Consultar PostgreSQL al finalizar y contrastar reservas, pagos e inventario.
5. Revisar transacciones, bloqueos, restricciones e idempotencia.
6. Guardar logs y resultados de cada ejecución.

**Criterio de aceptación:** cero sobreventas, cero inventario negativo, cero reservas parciales y cero efectos de negocio duplicados en los escenarios críticos. Un conflicto correctamente rechazado no se considera un defecto; sí lo sería permitir que dos operaciones incompatibles consuman la misma disponibilidad.

### AC08 — Interoperabilidad

**Objetivo:** comprobar que React y los servicios externos puedan intercambiar información con el backend mediante contratos claros y respuestas consistentes.

**Indicadores:**

- Porcentaje de escenarios de contrato aprobados.
- Endpoints documentados frente al total de endpoints publicados.
- Respuestas que cumplen los esquemas OpenAPI.
- Respuestas de error que cumplen el formato ProblemDetails.
- Webhooks procesados con el contrato esperado.

**Procedimiento:**

1. Mantener OpenAPI como referencia de los endpoints públicos.
2. Probar métodos, rutas, parámetros, DTOs y códigos HTTP.
3. Verificar que las respuestas JSON coincidan con los esquemas documentados.
4. Probar errores de validación, autenticación, autorización, conflicto y fallos internos.
5. Verificar los contratos de entrada de Webhooks de Culqi.
6. Comprobar la integración del frontend con la API sin acceder directamente a PostgreSQL.

**Criterio inicial:** todos los escenarios de contrato definidos para las operaciones críticas deben aprobarse. Los errores de la API deben mantener el formato acordado basado en ProblemDetails, y el contrato OpenAPI debe reflejar el comportamiento implementado.

### AC09 — Trazabilidad

**Objetivo:** poder reconstruir las operaciones importantes del sistema desde su solicitud inicial hasta el resultado de negocio.

**Operaciones que deben tener trazabilidad:**

- creación, modificación y cancelación de reservas;
- intentos y confirmaciones de pago;
- recepción y procesamiento de Webhooks;
- vencimiento automático de reservas;
- modificaciones administrativas;
- liberación de cupos e inventario.

**Indicadores:**

- Cobertura de auditoría: (operaciones críticas con evento de auditoría completo / operaciones críticas ejecutadas) × 100.
- Cobertura de correlación: (solicitudes críticas con CorrelationId / solicitudes críticas totales) × 100.
- Eventos incompletos: cantidad de registros sin actor, acción, entidad o fecha UTC cuando esos campos correspondan.
- Datos sensibles en logs: cantidad de exposiciones detectadas.

**Procedimiento:**

1. Ejecutar operaciones críticas con cuentas de prueba.
2. Buscar sus eventos de auditoría y logs asociados.
3. Comprobar actor, acción, entidad, identificador y fecha UTC.
4. Verificar que el CorrelationId permita relacionar la petición con el proceso de reserva, pago, Webhook o notificación, cuando corresponda.
5. Revisar que los logs no almacenen contraseñas, tokens ni datos sensibles.

**Criterio inicial:** todas las operaciones críticas identificadas deben producir los registros de auditoría definidos y permitir relacionar los eventos técnicos mediante CorrelationId. Los logs técnicos no sustituyen el historial de auditoría del negocio.

### AC10 — Usabilidad

**Objetivo:** evaluar si los clientes y administradores pueden completar sus tareas sin confusión y comprender los estados de las operaciones.

**Tareas representativas:**

- buscar un tour;
- revisar la información de un hotel;
- iniciar una reserva;
- completar o consultar el estado de un pago;
- revisar el historial de reservas;
- realizar una acción administrativa autorizada.

**Indicadores:**

| Indicador | Cálculo o registro |
|---|---|
| Tasa de éxito | (Tareas completadas sin ayuda / tareas intentadas) × 100. |
| Tiempo de tarea | Tiempo desde el inicio hasta la finalización de la tarea. |
| Tasa de error | (Errores de interacción / tareas intentadas) × 100. |
| Abandono | Tareas iniciadas que no llegan a completarse. |
| Satisfacción percibida | Cuestionario posterior a la prueba; puede utilizarse SUS como instrumento complementario. |

**Procedimiento:**

1. Preparar tareas basadas en historias de usuario.
2. Invitar a participantes representativos de los perfiles cliente y administrador.
3. Entregar las mismas instrucciones a los participantes.
4. Observar si completan cada tarea, cuánto tardan y dónde encuentran dificultades.
5. Recopilar comentarios y aplicar un cuestionario de percepción.
6. Corregir los puntos de fricción y repetir las tareas afectadas.

**Criterio inicial:** se debe registrar la tasa de éxito, el tiempo, los errores y la percepción de los participantes. El umbral numérico de aceptación se establecerá después de una primera evaluación con usuarios representativos; no se debe presentar una puntuación de usabilidad sin haber aplicado el instrumento.

La interfaz debe comunicar de forma diferenciada los estados pending, confirmed, completed y cancelled, y no debe mostrar una operación como confirmada antes de que el backend valide su estado.

### AC11 — Testabilidad

**Objetivo:** comprobar que las reglas de negocio y los casos de uso puedan validarse de forma automatizada sin depender de servicios externos reales.

**Indicadores:**

- Cobertura de pruebas de Domain y Application.
- Porcentaje de casos de uso críticos con pruebas automatizadas.
- Tasa de pruebas aprobadas: (pruebas aprobadas / pruebas ejecutadas) × 100.
- Pruebas que requieren credenciales o conexión a proveedores externos reales.
- Tiempo de ejecución de la suite automatizada.

**Procedimiento:**

1. Ejecutar pruebas unitarias del dominio y de los casos de uso.
2. Sustituir Culqi, Resend, R2, el reloj y el usuario actual mediante dobles de prueba o implementaciones de prueba.
3. Ejecutar pruebas de integración con PostgreSQL en un entorno controlado.
4. Ejecutar pruebas de arquitectura y verificar sus reglas.
5. Revisar cobertura sin considerar que un porcentaje alto garantiza por sí solo la calidad.
6. Comprobar que la suite pueda ejecutarse desde un entorno limpio siguiendo instrucciones documentadas.

**Criterio inicial:** todos los casos de uso críticos deben tener pruebas automatizadas y poder ejecutarse sin credenciales ni llamadas reales a Culqi, Resend o R2. Las pruebas de integración con PostgreSQL se mantendrán separadas de las pruebas unitarias.

**Herramientas sugeridas:** xUnit para pruebas .NET, WebApplicationFactory para pruebas de la API y Testcontainers para levantar PostgreSQL durante pruebas de integración. La selección definitiva debe alinearse con la solución implementada.

### AC12 — Recuperabilidad

**Objetivo:** comprobar que el sistema pueda recuperar sus datos y volver a operar después de una pérdida de disponibilidad o un incidente que afecte a la persistencia.

**Indicadores:**

| Indicador | Definición | Unidad |
|---|---|---|
| RTO | Tiempo desde el inicio de la interrupción hasta que el servicio recupera la operación acordada. | minutos u horas |
| RPO | Antigüedad del último dato recuperable respecto al último dato confirmado antes del incidente. | minutos u horas |
| Éxito de restauración | (Restauraciones verificadas / restauraciones intentadas) × 100. | % |
| Integridad posterior | Diferencias o inconsistencias detectadas después de restaurar. | cantidad |
| Tiempo de recuperación de archivos | Tiempo necesario para recuperar los objetos requeridos desde el almacenamiento. | minutos u horas |

**Procedimiento:**

1. Documentar la política de respaldo disponible para PostgreSQL en el plan contratado de Supabase.
2. Definir por separado cómo se protegerán y recuperarán los objetos de Cloudflare R2.
3. Crear un respaldo o punto de recuperación de prueba.
4. Restaurar en un entorno aislado, sin sobrescribir datos productivos.
5. Verificar la existencia e integridad de usuarios, reservas, pagos y relaciones relevantes.
6. Comprobar las referencias a archivos y la disponibilidad de los objetos necesarios.
7. Medir el tiempo de restauración y la pérdida máxima de datos observada.
8. Documentar los pasos y repetir el simulacro después de cambios relevantes en la infraestructura.

**Criterio inicial:** antes de producción deben aprobarse valores de RTO y RPO compatibles con el servicio y el plan contratado. La restauración debe ejecutarse y verificarse; la existencia de una opción de backup en el proveedor no constituye por sí sola evidencia de recuperabilidad.

La base de datos y los archivos de R2 deben evaluarse por separado. Un respaldo de PostgreSQL no demuestra que las imágenes y demás objetos multimedia puedan recuperarse.

## 6. Herramientas de apoyo

La siguiente tabla presenta herramientas que pueden utilizarse para ejecutar el plan. Son recomendaciones de medición, no decisiones arquitectónicas adicionales ni componentes que se afirme que ya están instalados.

| Herramienta | Uso propuesto |
|---|---|
| k6 | Pruebas de carga, latencia, throughput y concurrencia HTTP. |
| xUnit | Pruebas unitarias de Domain y Application. |
| WebApplicationFactory | Pruebas de integración de ASP.NET Core. |
| Testcontainers | Entorno PostgreSQL reproducible para pruebas. |
| PostgreSQL EXPLAIN ANALYZE | Diagnóstico de consultas y planes de ejecución. |
| OWASP ZAP | Análisis dinámico de seguridad de la API. |
| Playwright | Automatización de flujos del frontend y comprobación de tareas. |
| SonarQube o herramienta equivalente | Análisis estático, complejidad y duplicación. |
| OpenTelemetry y un sistema de métricas compatible | Instrumentación y observabilidad de solicitudes y dependencias. |

La instrumentación debe evitar registrar secretos, credenciales, datos de tarjetas o información personal innecesaria.

## 7. Priorización de las pruebas

Por el impacto de los procesos de reserva y pago, se recomienda ejecutar las mediciones en este orden:

| Prioridad | Atributos | Motivo |
|---|---|---|
| Crítica | AC07 Integridad y concurrencia; AC04 Seguridad; AC05 Privacidad y aislamiento | Un defecto puede provocar sobreventa, operaciones indebidas o exposición de datos. |
| Alta | AC01 Rendimiento; AC02 Disponibilidad; AC09 Trazabilidad; AC12 Recuperabilidad | Afectan la continuidad del servicio y la capacidad de investigar o recuperar operaciones. |
| Alta | AC08 Interoperabilidad; AC11 Testabilidad | Permiten verificar integraciones y detectar defectos antes de producción. |
| Media | AC03 Escalabilidad; AC06 Mantenibilidad; AC10 Usabilidad | Deben evaluarse durante la evolución y antes de ampliar el uso del sistema. |

La prioridad no significa que los atributos de nivel medio puedan omitirse. Todos deben tener evidencia de evaluación antes de considerar terminada la validación de calidad.

## 8. Registro de resultados

Cada campaña de pruebas deberá completar una ficha como la siguiente. Los campos se dejan vacíos hasta contar con mediciones reales.

| Campo | Registro |
|---|---|
| ID del atributo | AC__ |
| Atributo evaluado | |
| Escenario | |
| Fecha de ejecución (UTC) | |
| Commit o versión | |
| Entorno | |
| Herramienta y versión | |
| Datos y carga utilizados | |
| Indicador | |
| Resultado obtenido | |
| Criterio de aceptación | |
| Estado | Pendiente / Aprobado / No aprobado |
| Evidencia (reporte, log o captura) | |
| Observaciones e incidencias | |
| Responsable de la ejecución | |

### Resumen de evaluación

| Atributo | Estado | Evidencia | Acción pendiente |
|---|---|---|---|
| AC01 — Rendimiento | Pendiente | | |
| AC02 — Disponibilidad | Pendiente | | |
| AC03 — Escalabilidad | Pendiente | | |
| AC04 — Seguridad | Pendiente | | |
| AC05 — Privacidad y aislamiento | Pendiente | | |
| AC06 — Mantenibilidad | Pendiente | | |
| AC07 — Integridad y concurrencia | Pendiente | | |
| AC08 — Interoperabilidad | Pendiente | | |
| AC09 — Trazabilidad | Pendiente | | |
| AC10 — Usabilidad | Pendiente | | |
| AC11 — Testabilidad | Pendiente | | |
| AC12 — Recuperabilidad | Pendiente | | |

## 9. Condiciones para considerar la calidad validada

La evaluación de calidad de DMGOTRAVEL podrá considerarse completa para una versión cuando:

1. Los escenarios críticos de reserva y pago hayan superado las pruebas de integridad, concurrencia e idempotencia.
2. Las pruebas de autenticación, autorización y aislamiento no detecten accesos indebidos.
3. El rendimiento de los endpoints principales se haya medido con una carga documentada.
4. Los fallos simulados de servicios externos no interrumpan operaciones que no dependan de ellos.
5. Los contratos de la API estén comprobados frente a OpenAPI y ProblemDetails.
6. Las operaciones críticas cuenten con registros de auditoría y correlación.
7. Las pruebas automatizadas de los casos de uso críticos puedan ejecutarse sin servicios externos reales.
8. Exista evidencia de restauración de PostgreSQL y un procedimiento definido para recuperar los archivos almacenados en R2.
9. Los resultados, desviaciones y acciones correctivas estén registrados para la versión evaluada.

Una prueba pendiente no debe marcarse como aprobada. Cuando un criterio no pueda medirse por limitaciones del entorno o del plan contratado, se registrará la limitación y su impacto en lugar de asumir que el atributo se cumple.

## 10. Relación con la documentación arquitectónica

Este plan complementa los documentos existentes y no reemplaza la definición de requisitos ni las decisiones arquitectónicas:

- [Atributos de calidad](../01-analisis-de-sistema/04-atributos-de-calidad.md): escenarios y mecanismos de calidad definidos.
- [Drivers arquitectónicos](../01-analisis-de-sistema/06-driver-arquitectonicas.md): prioridades y tensiones que influyen en la arquitectura.
- [Decisiones arquitectónicas](../01-analisis-de-sistema/07-desiciones-arquitectonicas.md): decisiones que deben mantenerse coherentes con los resultados.
- [Estilo arquitectónico](../02-arquitectura/estilo-arquitectonico.md): organización Cliente-Servidor, Monolito Modular, Clean Architecture y CQRS.
- [Arquitectura de despliegue](../02-arquitectura/arquitectura-de-despliegue.md): infraestructura sobre la que se efectuarán las pruebas de despliegue y operación.

Cuando una medición demuestre que una decisión arquitectónica no satisface un atributo, se deberá analizar la causa y documentar cualquier cambio relevante mediante una nueva decisión arquitectónica (ADR).
