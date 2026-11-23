# Tareas — Spec 004 y complemento: Notificaciones

> **Fecha:** 2026-11-01.  
> **Base:** [004 v0.1](spec.md), 22 criterios, y [004-C v0.1](complemento-contratos.md), 16 criterios, ambos aprobados; [plan v0.1](plan.md).  
> **Estado:** backlog documental, **30 tareas pendientes, 0 ejecutadas**.  
> **Regla:** solo ejecución futura autorizada; no envíos, DNS, credenciales, código ni cambios en specs/planes existentes en esta actividad.

`004/RF-n` y `004-C/RF-n` son espacios independientes. M-01–M-06 corresponden a las puertas del plan. Cada tarea exige su evidencia antes de cerrarse; cobertura documental no es cumplimiento de la spec.

## Fase 0 — Contratos y garantías

- [ ] **T004-01 — Validar alcance y contratos internos.**
  - **Entregable:** matriz de los 38 criterios y contratos de hechos, destinatarios, enlaces vigentes, reloj, transacción, auditoría, entrega e incidentes.
  - **Aceptación:** origen y autoridad de cada campo definidos; sin nuevas facultades de pago/cancelación/edición de cuenta ni tokens en contratos de auditoría.
  - **Dependencias:** autorización futura y specs 001/002/003/004+004-C/005/009/010; validar plataforma/versiones.

- [ ] **T004-02 — Verificar cuenta, dominio y entorno de test.**
  - **Entregable:** dominio/remitente propios, política de credenciales, configuración DNS del proveedor y límites reales de cuenta verificados en entorno autorizado.
  - **Aceptación:** no direcciones de ejemplo en producción ni ampliación de cuota/compra/cambio DNS sin autorización; pruebas futuras solo a destinatarios de test permitidos.
  - **Dependencias:** T004-01; acceso futuro autorizado, M-01/M-06. [004/RF-3/RF-16]

- [ ] **T004-03 — Verificar contrato Resend y resolución de desconocidos.**
  - **Entregable:** contrato de envío/consulta, clave de 24 horas, firma/eventos, errores y cuotas, con evidencia oficial y pruebas controladas.
  - **Aceptación:** distinguir aceptación, entrega y lectura; no consulta por clave inventada ni repetición ciega fuera de plazo; librería/versión .NET verificada sin extrapolar ejemplos de otro SDK.
  - **Dependencias:** T004-01/T004-02; M-02/M-03. [004/RF-3–RF-8; 004-C/RF-10]

- [ ] **T004-04 — Diseñar persistencia y exclusión de entregas.**
  - **Entregable:** notificación/entrega/intento, outbox/inbox, claves únicas y generación manual única por entrega original.
  - **Aceptación:** diferencia entre hecho, fase, destinatario e intento; protección de varios workers y de doble solicitud manual; no estados nuevos de reserva ni payload secreto en tablas generales.
  - **Dependencias:** T004-01/T004-03. [004/RF-4–RF-6/RF-9/RF-19/RF-20; 004-C/RF-10]

- [ ] **T004-05 — Diseñar recuperación e incidente independiente de auditoría fallida.**
  - **Entregable:** protocolo de evidencia y consulta operativa en fallos simples/simultáneos, con persistencia compatible con la plataforma.
  - **Aceptación:** no depender solo del destino que está caído ni de logs volátiles; preservar fecha/resultado y no generar recursión de alertas. M-05 no se cierra por escribir un diseño.
  - **Dependencias:** T004-01/T004-04 y 010/complemento 004. [004/RF-7/RF-19; 004-C/RF-5–RF-9/RF-16]

## Fase 1 — Contenido, destinatarios y hechos

- [ ] **T004-06 — Preparar plantillas versionadas y escapadas.**
  - **Entregable:** HTML/texto plano de comprobante, devolución, cancelación, alerta, verificación y recuperación; sin adjuntos/PDF por defecto.
  - **Aceptación:** campos mínimos aprobados, hecho fechado y fases reales; ninguna promesa de abono, factura fiscal, HTML inyectado o secreto en asuntos. La configuración de remitente no usa ejemplos reales inventados.
  - **Dependencias:** T004-01/T004-02/T004-04. [004/RF-2/RF-11/RF-15/RF-17; 004-C/RF-2–RF-4/RF-6/RF-12/RF-13/RF-15]

- [ ] **T004-07 — Resolver y revalidar destinatarios autorizados.**
  - **Entregable:** entrega propia por destinatario, administración activa y controles de correo/rol cambiados.
  - **Aceptación:** sin datos ajenos, direcciones arbitrarias o CC de administradores; si no hay destinatario válido, conservar incidente sin cambiar la operación ni inventar un fallback.
  - **Dependencias:** T004-01/T004-04 y 005. [004/RF-1/RF-8/RF-16/RF-20; 004-C/RF-1/RF-5/RF-9/RF-12/RF-13]

- [ ] **T004-08 — Integrar comprobante de confirmación.**
  - **Entregable:** intención local deduplicada originada por confirmación válida persistida de 002.
  - **Aceptación:** no comprobante de reserva `pending` ni token de checkout tratado como pago; repetición del hecho recupera la misma entrega; ningún HTTP externo dentro del commit de pago.
  - **Dependencias:** T004-04/T004-06/T004-07 y contratos 001/002. [004/RF-1–RF-5/RF-18/RF-20–RF-22]

- [ ] **T004-09 — Integrar avisos de devolución y cancelación.**
  - **Entregable:** avisos por hechos/fases de 002 y cancelación aplicada de 009.
  - **Aceptación:** no aviso de cancelación rechazada ni falso «abonado»; fase distinta no se elimina como duplicado y repetición de la misma fase no duplica entrega.
  - **Dependencias:** T004-04/T004-06/T004-07 y 002/009. [004/RF-11/RF-18/RF-20; 004-C/RF-1–RF-4/RF-10/RF-11]

- [ ] **T004-10 — Integrar alertas e incidentes primarios.**
  - **Entregable:** alertas por pago observado, devolución/vencimiento fallidos y persistencia fallida de auditoría, con consulta operativa autorizada.
  - **Aceptación:** referencias/cause/fecha/acción saneadas; sin inventar reserva, usuario administrador o nuevo incidente por cada fallo del mismo aviso; no reversión de efectos del origen.
  - **Dependencias:** T004-05/T004-06/T004-07 y 002/003/010. [004/RF-7/RF-8/RF-12–RF-16; 004-C/RF-5–RF-9]

- [ ] **T004-11 — Integrar enlaces de identidad con transporte protegido.**
  - **Entregable:** flujo autorizado por 005 y protección temporal de la carga de entrega, separados de auditoría y argumentos de jobs.
  - **Aceptación:** comprobar vigencia/destinatario antes de enviar o repetir; no token bruto, contraseña o enlace en logs/admin/CSV; no generar/renovar enlaces desde 004 ni entregar uno invalidado como vigente.
  - **Dependencias:** T004-04/T004-06/T004-07 y contrato técnico de 005; M-04. [004/RF-17/RF-20; 004-C/RF-12–RF-15]

## Fase 2 — Despacho, proveedor, reintentos y reenvío

- [ ] **T004-12 — Implementar despacho durable y control de presión.**
  - **Entregable:** procesamiento de outbox con arrendamiento/marca persistida y capacidad por cuota/rate del equipo Resend.
  - **Aceptación:** no locks de proceso como garantía, dos workers no generan dos copias, reinicio recuperable y ningún worker de correo bloquea la confirmación de negocio o ocupa sin control la cola crítica de 003.
  - **Dependencias:** T004-02/T004-03/T004-04/T004-08–T004-11. [004/RF-4–RF-6/RF-18/RF-22; 004-C/RF-10/RF-11]

- [ ] **T004-13 — Implementar adaptador de envío con clave/payload estables.**
  - **Entregable:** adaptador Resend de test, respuesta/ID externo y clasificación de resultados sin retry implícito adicional.
  - **Aceptación:** misma entrega automática conserva clave/destinatario/plantilla/cuerpo; conflicto no rota la clave para enviar otra copia; aceptación no se presenta como entrega.
  - **Dependencias:** T004-03/T004-04/T004-12. [004/RF-3–RF-6/RF-17; 004-C/RF-10]

- [ ] **T004-14 — Verificar y procesar Webhooks de correo.**
  - **Entregable:** verificación de cuerpo original y encabezados oficiales, recepción deduplicada y proyección de eventos por fechas.
  - **Aceptación:** firma falsa/replay se rechaza según contrato; no secretos en payload persistido; `sent` atrasado no borra evidencia de entrega/rebote ni un correo modifica pago/reserva.
  - **Dependencias:** T004-03/T004-04/T004-13. [004/RF-4/RF-5/RF-8/RF-19/RF-20; 004-C/RF-10/RF-11]

- [ ] **T004-15 — Aplicar retry automático y desconocidos sin duplicar.**
  - **Entregable:** hasta 3 reintentos originales con esperas 30 segundos/2 minutos/10 minutos, respetando `retry-after`, período seguro y TTL del enlace.
  - **Aceptación:** una política única sin sumar defaults de SDK/Hangfire; desconocido fuera de 24 horas no produce nuevo envío ciego; agotamiento deja incidente/alerta y no éxito ficticio.
  - **Dependencias:** T004-03/T004-11/T004-13/T004-14. [004/RF-5–RF-7/RF-18/RF-22; 004-C/RF-8/RF-10/RF-11/RF-14]

- [ ] **T004-16 — Tratar rebote, inválido, supresión y error permanente.**
  - **Entregable:** clasificación de fallo definitivo y evidencia/alerta sin copias repetidas a destinatario inválido.
  - **Aceptación:** no llamar entregado a un rechazo ni corregir un perfil desde 004; pago/reserva conservan el resultado; no enviar alertas a una dirección no autorizada por intentar recuperarse.
  - **Dependencias:** T004-07/T004-10/T004-14/T004-15. [004/RF-7/RF-8/RF-16/RF-18/RF-22; 004-C/RF-9/RF-11]

- [ ] **T004-17 — Implementar reenvío manual único.**
  - **Entregable:** comando administrativo y restricción única de generación manual para una entrega original con fallo comprobado.
  - **Aceptación:** solicitudes simultáneas/repetidas conservan una operación; no reenvío ciego de aceptación desconocida ni entregada; fallo/desconocido manual no se reenvía automáticamente; sin facultad para emitir/renovar enlaces de 005.
  - **Dependencias:** T004-04/T004-07/T004-15/T004-16 y 005. [004/RF-9/RF-10/RF-19; 004-C/RF-10/RF-14]

- [ ] **T004-18 — Integrar auditoría y recuperación de evidencia.**
  - **Entregable:** registro de generación/intento/retry/manual/alerta y recuperación de hechos con fecha original y resultado real.
  - **Aceptación:** aceptación externa no se repite por fallo local; auditoría caída no impide conservar el incidente por el mecanismo validado; sin recursión ni enlaces secretos en evidencia.
  - **Dependencias:** T004-05/T004-10/T004-14–T004-17 y 010; M-05. [004/RF-4/RF-7/RF-19; 004-C/RF-6–RF-9/RF-15/RF-16]

## Fase 3 — Consulta operativa y configuración

- [ ] **T004-19 — Exponer consulta operativa y acción manual protegidas.**
  - **Entregable:** contratos/API/presentación de incidentes y seguimiento, con única acción manual aprobada y errores consistentes.
  - **Aceptación:** solo admin activo, sin tokens/cuerpos secretos ni edición de auditoría/perfiles/finanzas; fallo de correo no deja invisible el incidente cuando el mecanismo operativo esté disponible.
  - **Dependencias:** T004-07/T004-10/T004-17/T004-18 y 005/010. [004/RF-7–RF-10/RF-16/RF-19; 004-C/RF-9/RF-15]

- [ ] **T004-20 — Validar configuración y aislamiento de secretos.**
  - **Entregable:** configuración por ambiente, remitente verificado, claves separadas, HTTPS, control de URL y protección temporal de enlaces.
  - **Aceptación:** no credenciales en repositorio/frontend/jobs; sin remitente de ejemplo, tracking comercial ni destino de correo arbitrario; dominio/DNS reales requieren autorización propia.
  - **Dependencias:** T004-02/T004-03/T004-11/T004-12/T004-19. [004/RF-3/RF-16/RF-17/RF-20; 004-C/RF-12–RF-15]

## Fase 4 — Pruebas y cierre, pendientes

- [ ] **T004-21 — Pruebas unitarias y de renderizado.**
  - **Entregable:** suite determinista de contenido, destinatarios, fases, deduplicación/retry/manual e identidad.
  - **Aceptación:** 22 criterios base y 16 de complemento trazados sin mezclarlos; motivos/nombres escapados, texto plano, sin falsas promesas de abono ni pruebas con dobles presentadas como entrega real.
  - **Dependencias:** T004-06–T004-19. [004/RF-1–RF-22; 004-C/RF-1–RF-16]

- [ ] **T004-22 — Pruebas PostgreSQL de concurrencia y rollback.**
  - **Entregable:** hechos repetidos, varios workers, arrendamientos vencidos y solicitudes manuales concurrentes.
  - **Aceptación:** una intención por hecho/destinatario/fase, una generación manual y sin pérdida de estado de aceptación por conflicto o reinicio; no revertir el origen por correo.
  - **Dependencias:** T004-04/T004-08–T004-18. [004/RF-4–RF-10/RF-18–RF-22; 004-C/RF-8–RF-11]

- [ ] **T004-23 — Pruebas contractuales de Resend en entorno autorizado.**
  - **Entregable:** evidencia saneada de idempotencia, conflicto de payload, ventana de 24 horas, firmas, eventos, consultas y rate/cuotas.
  - **Aceptación:** aceptación/entrega diferenciadas, firma real validada y sin mensajes a clientes/destinatarios no autorizados. No cerrar M-01–M-03 con lectura pública únicamente.
  - **Dependencias:** T004-02/T004-03/T004-13–T004-17; entorno de test autorizado. [004/RF-3–RF-10; 004-C/RF-10]

- [ ] **T004-24 — Pruebas de caída, respuesta perdida y recuperación.**
  - **Entregable:** fallos antes/después del envío/commit y durante 24 horas/expiración de enlace; auditoría y correo caídos a la vez.
  - **Aceptación:** sin doble copia, retry manual automático, éxito inventado ni incidente perdido; recuperar fechas/resultados sin asumir que el mismo destino caído puede almacenar la alerta.
  - **Dependencias:** T004-05/T004-15–T004-18/T004-22/T004-23. [004/RF-5–RF-10/RF-18/RF-19/RF-22; 004-C/RF-7–RF-11/RF-14/RF-16]

- [ ] **T004-25 — Pruebas de privacidad, enlaces y autorización.**
  - **Entregable:** inspección de logs/tablas/artefactos y pruebas de correo/rol cambiados, redirección manipulada, enlaces expirados y HTML/headers maliciosos.
  - **Aceptación:** ningún secreto fuera de la carga protegida y enlace al destinatario de 005; un cliente no consulta incidentes ni reenvía; ningún mensaje revela reserva/cuenta ajena.
  - **Dependencias:** T004-07/T004-11/T004-14/T004-17–T004-20. [004/RF-16/RF-17/RF-20; 004-C/RF-12–RF-15]

- [ ] **T004-26 — Pruebas de contenido y flujos E2E.**
  - **Entregable:** comprobante y avisos de fases/cancelación/alerta/identidad más consulta y reenvío de la interfaz integrada.
  - **Aceptación:** el aviso corresponde al hecho propio aplicado y no a una transición falsa; no PDF/factura añadido ni nueva gestión financiera; respuesta de recuperación pública sigue siendo genérica según 005.
  - **Dependencias:** T004-08–T004-19/T004-21 y módulos integrados. [004/RF-1/RF-2/RF-9–RF-22; 004-C/RF-1–RF-6/RF-9/RF-11–RF-15]

- [ ] **T004-27 — Verificar entregabilidad y capacidad operativa.**
  - **Entregable:** dominio/credencial verificados, límites de cuenta, colas, métricas de aceptación/entrega/rebote y pruebas de saturación/reinicio.
  - **Aceptación:** respetar rate/cuotas reales, sin bucles de `429`, prometer lectura humana ni ampliar planes comerciales automáticamente; no impacto indebido en la cola de vencimiento de 003.
  - **Dependencias:** T004-02/T004-20/T004-23/T004-24. [004/RF-3/RF-6–RF-8/RF-18; AC02]

- [ ] **T004-28 — Verificar contratos reales entre módulos.**
  - **Entregable:** pruebas de integración de 002/003/005/009/010 con base/complemento 004.
  - **Aceptación:** hechos persistidos, auditoría recuperable y destinatarios/enlaces validados sin acceso a repositorios ajenos; no considerar un contrato implementado por tener spec aprobada.
  - **Dependencias:** T004-21–T004-27 y disponibilidad real de módulos. [004/RF-1–RF-22; 004-C/RF-1–RF-16]

- [ ] **T004-29 — Cerrar matriz de criterios y evidencia.**
  - **Entregable:** RF→implementación→prueba→resultado para base y complemento, con referencias independientes.
  - **Aceptación:** 22+16 criterios sin huecos; no declarar una tarea cumplida por redactarla ni por un doble si exige PostgreSQL/Resend real.
  - **Dependencias:** T004-01–T004-28. [004/RF-1–RF-22; 004-C/RF-1–RF-16]

- [ ] **T004-30 — Revisar puertas antes de habilitación real.**
  - **Entregable:** revisión verificable M-01–M-06, capacidad/recuperación, secretos y autorizaciones pendientes.
  - **Aceptación:** specs y planes anteriores intactos; sin autorización automática de DNS, cuenta live o envíos a clientes por terminar tareas; producción requiere revisión/autorización propia.
  - **Dependencias:** T004-01–T004-29. [004/RF-1–RF-22; 004-C/RF-1–RF-16]

## Matriz de cobertura funcional

### Base 004 — 22 criterios

| Criterios de base | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-3 | T004-02/T004-06–T004-08/T004-12/T004-13 | T004-21/T004-23/T004-26/T004-27 |
| RF-4–RF-6 | T004-03/T004-04/T004-08/T004-12–T004-15/T004-18 | T004-21–T004-24 |
| RF-7–RF-8 | T004-05/T004-07/T004-10/T004-15/T004-16/T004-18/T004-19 | T004-21/T004-23/T004-24/T004-27 |
| RF-9–RF-10 | T004-04/T004-17/T004-18/T004-19 | T004-21–T004-26 |
| RF-11–RF-15 | T004-06/T004-09/T004-10 | T004-21/T004-26/T004-28 |
| RF-16–RF-17 | T004-07/T004-11/T004-19/T004-20 | T004-21/T004-25/T004-28 |
| RF-18–RF-22 | T004-08–T004-10/T004-12/T004-16/T004-18 | T004-21/T004-22/T004-24/T004-26/T004-28 |

### Complemento 004-C — 16 criterios

| Criterios locales del complemento | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-4 | T004-06/T004-07/T004-09 | T004-21/T004-26/T004-28 |
| RF-5–RF-9 | T004-05/T004-07/T004-10/T004-18/T004-19 | T004-21/T004-24/T004-26/T004-28 |
| RF-10–RF-11 | T004-09/T004-12–T004-17 | T004-21–T004-24/T004-26/T004-28 |
| RF-12–RF-15 | T004-06/T004-07/T004-11/T004-20 | T004-21/T004-25/T004-26/T004-28 |
| RF-16 | T004-05/T004-18 | T004-21/T004-24/T004-28 |

**Ninguna tarea está ejecutada.** Un correo técnicamente aceptado no demuestra entrega humana ni cumplimiento de la operación de negocio que originó el aviso.
