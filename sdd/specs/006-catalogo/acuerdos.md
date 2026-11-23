# Acuerdos de presentación — Catálogo de Tours y Paquetes

**Estado:** antecedente de acuerdos registrado el 2026-10-22; **no es una spec completa ni está aprobada como tal**. El 2026-10-24 se incorporó a la spec 006, preservando los seis criterios locales; esa spec fue aprobada como v0.46 el 2026-10-30. No se modifica la spec 001 de reservas.

## Fuentes y alcance

- **RF01 / HU-01:** catálogo público de ofertas activas. Fuente: F03 §1 y F02 §1; rutas en [fuentes](../../fuentes.md).
- **RF02 / HU-02:** detalle de oferta activa con descripción, precio base, duración, itinerario, imágenes e información de disponibilidad; 404 de inexistente/no visible. Se mantienen íntegros esos requisitos.
- **DEC-044:** el usuario pide información/itinerario de cada tour y paquete y elige la opción «2»: resumen en tarjeta y contenido completo al abrir el detalle. Evidencia en [decisiones](../../decisiones.md).

La precisión diferencia el catálogo de la nueva sección Movilidad: Tours y Paquetes **sí tienen detalle**, Movilidad solo tarjetas informativas. No se traslada a las ofertas turísticas la exclusión de precios/reservas de Movilidad.

## Criterios de presentación incorporados a la spec 006

Se reservan estos criterios locales sin renumerar `RF01`/`RF02`. Son un fragmento de aceptación, no la totalidad de catálogo/administración:

- **RF-1:** CUANDO el visitante consulta una tarjeta de tour en la landing, EL SISTEMA mostrará un resumen de esa oferta. (RF01, HU-01; DEC-044)
- **RF-2:** CUANDO el visitante consulta una tarjeta de paquete en la landing, EL SISTEMA mostrará un resumen de esa oferta. (RF01, HU-01; DEC-044)
- **RF-3:** CUANDO el visitante selecciona un tour activo para consultar su detalle, EL SISTEMA mostrará la información completa documentada de ese tour. (RF02, HU-02; DEC-044)
- **RF-4:** CUANDO el visitante selecciona un paquete activo para consultar su detalle, EL SISTEMA mostrará la información completa documentada de ese paquete. (RF02, HU-02; DEC-044)
- **RF-5:** CUANDO el visitante consulta el detalle de un tour activo, EL SISTEMA mostrará su itinerario completo. (RF02, HU-02; DEC-044)
- **RF-6:** CUANDO el visitante consulta el detalle de un paquete activo, EL SISTEMA mostrará su itinerario completo. (RF02, HU-02; DEC-044)

«Información completa documentada» conserva los campos de RF02/HU-02, no inventa una lista ilimitada de datos. No se obliga a mostrar el itinerario íntegro en cada tarjeta. La ubicación exacta de detalle, rutas técnicas y diseño visual pertenecen al diseño posterior.

## Pendientes de la spec completa

- **Resuelto por DEC-054, 2026-10-24:** imagen principal, título, descripción breve, duración y precio base. Incorporado como RF-34 del borrador de [spec](spec.md); conserva los seis criterios anteriores.
- **Resuelto por DEC-055, 2026-10-24:** itinerario por días, con actividades en orden y descripción de cada actividad, tanto para tours como para paquetes. Incorporado como RF-35 de la [spec](spec.md). No inferir mapas, descargas, horarios ni duración de cada parada.
- Siguen abiertos los demás pendientes propios de catálogo: publicación/validaciones, datos administrativos y criterios cuantitativos aplicables, según ACL-05/ACL-15. Este registro no los sustituye ni añade preguntas al usuario en bloque.
- El [borrador spec.md](spec.md) conserva estas referencias y la plantilla completa; sus pendientes siguen visibles y necesita aprobación independiente antes de plan/tareas. Este registro permanece como evidencia del acuerdo de presentación, no un contrato alternativo.
