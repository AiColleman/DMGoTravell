# Tareas — Spec 011: Indicadores y reportes

> **Fecha:** 2026-11-02. **Base:** [spec v0.1 aprobada](spec.md), 38 criterios, DEC-196; [plan v0.1](plan.md).  
> **Estado:** **28 tareas pendientes, 0 ejecutadas**. Solo backlog documental en `DMGoTravelll/sdd`; sin código/datos/PDF reales.

Q-01–Q-06 requieren evidencia antes de habilitar; las decisiones de biblioteca no autorizan compras, publicación de código o cambios de stack.

## Fase 0 — Contratos, selección y modelo

- [ ] **T011-01 — Validar alcance y cobertura inicial.**
  - **Entregable:** matriz de 38 criterios y contratos de 001/002/005/006/007/008/009/010.
  - **Aceptación:** reporte solo lectura; sin costos/impuestos/ganancia, conversión o comandos de negocio; fuentes/propietarios de cada dato identificados.
  - **Dependencias:** autorización futura y specs aprobadas.
- [ ] **T011-02 — Resolver motor PDF, licencia y fuentes.**
  - **Entregable:** selección mantenida de biblioteca/versión, evaluación de licencia y fuentes/Unicode/Linux con evidencia oficial.
  - **Aceptación:** no asumir MIT por ejemplos de PDFsharp reciente ni usar fuentes de Windows como garantía portable; condiciones legales/económicas verificadas antes de instalar/habilitar.
  - **Dependencias:** T011-01; Q-04. [RF-26/RF-28/RF-34]
- [ ] **T011-03 — Definir lectores de hechos y fechas oficiales.**
  - **Entregable:** reserva histórica, transacción real única, ejecución de devolución, moneda/fecha/clasificación y relación de oferta/hotel.
  - **Aceptación:** no inventar fecha de ejecución, confundir callback/intento con otro pago o usar creación de reserva para todos los movimientos; dato necesario faltante no se descarta como cero.
  - **Dependencias:** T011-01. [RF-2/RF-4/RF-10–RF-25/RF-36]
- [ ] **T011-04 — Diseñar captura coherente de la consulta.**
  - **Entregable:** contexto común de lectura, tres poblaciones y punto de referencia real con resultado completo durable.
  - **Aceptación:** no timestamp-only/snapshot huérfano ni fuentes de instantes distintos; worker posterior usa copia confirmada, no otra consulta con referencia vieja.
  - **Dependencias:** T011-03. [RF-9/RF-29–RF-32/RF-36]
- [ ] **T011-05 — Modelar selección y resultado inmutable.**
  - **Entregable:** filtros normalizados, versión de definiciones, resultado/agregados/listado/manifest y metadata de generación separados de fuente.
  - **Aceptación:** período Perú inclusivo, oferta/hotel AND, ninguna PII de cliente o entidad completa serializada; escrituras solo técnicas propias.
  - **Dependencias:** T011-03/T011-04. [RF-3/RF-5–RF-9/RF-28/RF-29]
- [ ] **T011-06 — Integrar autorización y referencias privadas.**
  - **Entregable:** admin/estado/familia vigentes y acceso autorizado a consulta/resultado/archivo.
  - **Aceptación:** cliente, rol retirado o ID ajeno no obtienen cifras/PDF; firma o permiso inicial no bastan como autorización futura.
  - **Dependencias:** T011-01/T011-05 y 005. [RF-1/RF-33]

## Fase 1 — Cálculos y resultado oficial

- [ ] **T011-07 — Calcular reservas y cantidades turísticas.**
  - **Entregable:** IDs distintos creados, cuatro estados a referencia, viajeros históricos y filtro común de identidad.
  - **Aceptación:** estados suman total, eventos/noches no duplican y la fecha de reserva solo delimita ese conjunto.
  - **Dependencias:** T011-03–T011-06. [RF-10–RF-14/RF-37]
- [ ] **T011-08 — Calcular contratos por componentes.**
  - **Entregable:** subtotales turísticos/hoteleros históricos por servicio/estado y total reconciliado.
  - **Aceptación:** hotel es subconjunto, no otra reserva o ingreso; no catálogo actual, huésped inferido o `pending`/`cancelled` presentados como efectivo.
  - **Dependencias:** T011-07. [RF-4/RF-12–RF-17/RF-27/RF-37/RF-38]
- [ ] **T011-09 — Calcular cobros reales e incidencias.**
  - **Entregable:** transacciones confirmadas distintas por fecha propia/moneda, con marcas de incidencias conservadas.
  - **Aceptación:** callbacks no duplican, dos cobros reales sí cuentan, desconocido/rechazado no suma y marcas superpuestas no se añaden para formar el total.
  - **Dependencias:** T011-03/T011-04/T011-06 y 002. [RF-7/RF-18–RF-21]
- [ ] **T011-10 — Calcular devoluciones por fecha propia.**
  - **Entregable:** ejecuciones confirmadas distintas del período, aunque su reserva/cobro sean anteriores.
  - **Aceptación:** no limitar a reservas/cobros creados en ese rango ni incluir autorización/resultado desconocido como devolución realizada; no exigir banco/abono.
  - **Dependencias:** T011-03/T011-04/T011-06/T011-09 y 002. [RF-7/RF-22/RF-24]
- [ ] **T011-11 — Reconciliar precisión y diferencia por moneda.**
  - **Entregable:** sumas exactas, diferencia firmada y controles de igualdad de poblaciones/contratos.
  - **Aceptación:** negativos no se fuerzan a cero; no conversiones/comisiones, doble ingreso o redondeo por intento; etiquetas sin ganancia/saldo bancario.
  - **Dependencias:** T011-07–T011-10. [RF-15/RF-16/RF-21–RF-25/RF-27/RF-38]
- [ ] **T011-12 — Diferenciar vacío de fuente fallida.**
  - **Entregable:** validación de campos necesarios, estados de disponibilidad y resultados vacíos conocidos.
  - **Aceptación:** cero solo por conjunto vacío conocido; dato necesario inválido/ausente o lector caído no se convierte en un total exacto parcial.
  - **Dependencias:** T011-07–T011-11. [RF-8/RF-17/RF-35/RF-36]
- [ ] **T011-13 — Confirmar captura y listado completo sin PII.**
  - **Entregable:** resultado persistido, referencias/fechas/estado/importes permitidos de todas las reservas operativas y manifest completo.
  - **Aceptación:** no cifras ni campos personales del navegador, nombres/contactos/ID de cliente, ni resultado publicado antes de commit; nueva actualización obtiene otra referencia.
  - **Dependencias:** T011-04–T011-12. [RF-2–RF-4/RF-9/RF-26/RF-28–RF-32]

## Fase 2 — PDF, consulta y entrega

- [ ] **T011-14 — Diseñar y renderizar plantilla PDF completa.**
  - **Entregable:** resumen/desglose/finanzas/listado, filtros/referencia/definiciones, Unicode y multipágina con biblioteca/fuentes aprobadas técnicamente.
  - **Aceptación:** todos los registros, no solo una página de UI; no recursos remotos, contactos o cifras de otro resultado; no omitir columnas/filas por layout.
  - **Dependencias:** T011-02/T011-08/T011-11–T011-13. [RF-26–RF-30/RF-34/RF-38]
- [ ] **T011-15 — Integrar generación recuperable y almacenamiento privado.**
  - **Entregable:** job/artefacto/manifest con tamaño/huella y versión, a partir del resultado confirmado.
  - **Aceptación:** listo solo al completar/verificar PDF; fallo no publica prefijo ni reconsulta fuentes; sin disco local durable/URL pública o heredar acceso publicitario de 012.
  - **Dependencias:** T011-05/T011-13/T011-14. [RF-3/RF-26/RF-28–RF-32/RF-34]
- [ ] **T011-16 — Gestionar referencia, actualización y expiración.**
  - **Entregable:** lectura del resultado original, página visual y referencia nueva solo por actualización explícita.
  - **Aceptación:** referencia ausente/expirada no recalcula silenciosamente; tamaño de página no limita PDF, filtros de un resultado no cambian por manipulación posterior.
  - **Dependencias:** T011-06/T011-13/T011-15. [RF-6–RF-9/RF-26/RF-29–RF-32]
- [ ] **T011-17 — Entregar PDF con permiso actual e integridad.**
  - **Entregable:** descarga por backend de archivo completo, headers/nombre seguros, tamaño/huella/referencia y caché privada.
  - **Aceptación:** rol revocado bloquea incluso archivo listo; abrir enlace/respuesta no demuestra descarga completa; no token/URL pública para eludir revisión.
  - **Dependencias:** T011-06/T011-15/T011-16 y 005. [RF-1/RF-28/RF-29/RF-33/RF-34]
- [ ] **T011-18 — Verificar privacidad y límites de baja lógica.**
  - **Entregable:** proyecciones que conservan reserva histórica sin contactos/ID de cliente, y compatibilidad con políticas de 008/010.
  - **Aceptación:** baja posterior no borra filas/valores permitidos del resultado ni aplica por error la máscara de un CSV de clientes a un PDF de reservas.
  - **Dependencias:** T011-05/T011-13/T011-14/T011-17 y 008/010. [RF-4/RF-28–RF-30/RF-37]
- [ ] **T011-19 — Publicar OpenAPI/UI sin cálculo financiero cliente.**
  - **Entregable:** consulta/filtros/referencia, detalle paginado, generación/estado/descarga y errores uniformes.
  - **Aceptación:** presentación no sustituye cifras oficiales; fechas propias/estado a referencia/monedas y contrato frente a dinero claros; sin acciones de negocio desde reporte.
  - **Dependencias:** T011-06–T011-18. [RF-1–RF-9/RF-26–RF-38]
- [ ] **T011-20 — Integrar cleanup técnico sin borrar fuentes.**
  - **Entregable:** disponibilidad temporal propuesta de 24 horas desde completo y limpieza de resultados/artefactos técnicos.
  - **Aceptación:** no modificar reservas/pagos/auditoría ni reemitir otro cálculo bajo la referencia expirada; sin éxito parcial al abortar/limpiar un job.
  - **Dependencias:** T011-15–T011-18. [RF-3/RF-29–RF-31/RF-34/RF-37]

## Fase 3 — Evidencia y cierre, pendientes

- [ ] **T011-21 — Pruebas unitarias de los 38 criterios.**
  - **Entregable:** fixtures deterministas de poblaciones/filtros/duplicados/monedas/estados y documento de referencia.
  - **Aceptación:** fuente vacía y caída distintas, negativos correctos y ninguna regla contable nueva; dobles no validan snapshot PostgreSQL o PDF real.
  - **Dependencias:** T011-07–T011-20. [RF-1–RF-38]
- [ ] **T011-22 — Pruebas PostgreSQL de captura y concurrencia.**
  - **Entregable:** cambios de estado/precio/cuenta y evidencia financiera incorporada después con fecha anterior.
  - **Aceptación:** misma referencia conserva las tres poblaciones y listado, no timestamp-only ni inclusión futura; consultas/exportación no mutan fuentes.
  - **Dependencias:** T011-04/T011-07–T011-13/T011-16/T011-20 y módulos reales. [RF-2–RF-25/RF-29–RF-32/RF-35–RF-38]
- [ ] **T011-23 — Pruebas PDF real, licencia y Linux.**
  - **Entregable:** revisión de dependencias/licencias/fuentes y validación de texto/páginas/listado/sumas en runtime objetivo.
  - **Aceptación:** sin Windows-only accidental, filas omitidas o archivo corrupto como éxito; condiciones legales/económicas revisadas sin instalar/comprar en esta actividad.
  - **Dependencias:** T011-02/T011-14/T011-15/T011-17/T011-20; Q-04. [RF-25–RF-30/RF-34/RF-38]
- [ ] **T011-24 — Pruebas de seguridad y manipulación.**
  - **Entregable:** cliente/admin revocado, referencia ajena, montos/HTML/headers/URLs manipulados y escaneo de datos/logs/artefactos.
  - **Aceptación:** no cifras del cliente o PII/secreto en PDF; destino privado y permiso actual, sin SSRF/recursos remotos por texto de oferta.
  - **Dependencias:** T011-06/T011-17–T011-19/T011-23. [RF-1/RF-3/RF-8/RF-28–RF-34]
- [ ] **T011-25 — Pruebas de falla/recuperación/transferencia.**
  - **Entregable:** fallos de fuente/captura/commit/renderizado y respuesta de descarga perdida.
  - **Aceptación:** mismo resultado o error explícito, nunca otra captura/prefijo parcial bajo referencia anterior o cero falso; no operación financiera por recuperar reporte.
  - **Dependencias:** T011-13–T011-20/T011-22/T011-23. [RF-3/RF-26/RF-29–RF-36]
- [ ] **T011-26 — Pruebas E2E e integración con los orígenes.**
  - **Entregable:** escenario enero/febrero, incidencias/monedas y consulta/PDF de listado completo.
  - **Aceptación:** devolución de otro período puede volver negativo el total; no confundir componente hotelero con otro cobro o huéspedes del grupo; sin datos/exportaciones live.
  - **Dependencias:** T011-19/T011-21/T011-23–T011-25 y lectores reales. [RF-1–RF-38]
- [ ] **T011-27 — Validar capacidad y observabilidad.**
  - **Entregable:** costos de captura/renderizado/almacenamiento, cuotas de concurrencia, Unicode/listados grandes y métricas saneadas.
  - **Aceptación:** no máximo comercial de filas, truncamiento silencioso, SLA sin medición o presión indebida sobre operaciones críticas.
  - **Dependencias:** T011-20–T011-26. [RF-3/RF-26/RF-28–RF-38; AC09/AC11]
- [ ] **T011-28 — Cerrar cobertura y revisar Q-01–Q-06.**
  - **Entregable:** RF→implementación→prueba→resultado y evidencia técnica/legal/de autorización.
  - **Aceptación:** 38 criterios sin huecos y documentos previos intactos; ninguna tarea cerrada por redacción ni producción/exportación real por tener plan.
  - **Dependencias:** T011-01–T011-27. [RF-1–RF-38]

## Matriz de cobertura funcional

| Criterios 011 | Tareas principales | Verificación futura |
|---|---|---|
| RF-1–RF-9 | T011-01/T011-03–T011-06/T011-13/T011-19 | T011-21/T011-22/T011-24/T011-26 |
| RF-10–RF-17 | T011-03/T011-07/T011-08/T011-11/T011-12 | T011-21/T011-22/T011-26 |
| RF-18–RF-25 | T011-03/T011-09–T011-12 | T011-21/T011-22/T011-26 |
| RF-26–RF-28 | T011-02/T011-08/T011-13–T011-15/T011-18 | T011-21/T011-23/T011-24/T011-26/T011-27 |
| RF-29–RF-34 | T011-04/T011-13–T011-20 | T011-21–T011-26 |
| RF-35–RF-38 | T011-07/T011-08/T011-11/T011-12/T011-18/T011-19 | T011-21/T011-22/T011-25–T011-27 |

**28 tareas pendientes; ninguna ejecutada.** Validación documental no demuestra cifras, PDF, licencia adquirida o infraestructura real.
