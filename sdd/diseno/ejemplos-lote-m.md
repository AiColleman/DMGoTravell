# Ejemplos OpenAPI — lote M (autenticación, perfil y cierres 204/302) v0.1

> **Fecha:** 2026-11-09. **Versión:** 0.1. **Registro:** DEC-237.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [lote L](ejemplos-lote-l.md), [contrato de API](contrato-api.md) y [plan de pruebas CT-12](plan-pruebas-contrato.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, sesiones reales, tokens reales, correos, cuentas, cookies, proveedores, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios de autenticación y perfil, y documentar las respuestas sin cuerpo. No cierra CT-12 ni API-01.

## 1. Resultado

Se cubrieron quince operaciones del lote M:

| Operación | Método y ruta | Ejemplo de solicitud | Respuesta de éxito |
|---|---|---|---|
| `auth.refresh` | `POST /api/v1/auth/refresh` | `{}` | `200` |
| `auth.logout` | `POST /api/v1/auth/logout` | No aplica | `204` sin cuerpo |
| `auth.verifyEmail` | `POST /api/v1/auth/verify-email` | Sí | `200` |
| `auth.resendVerification` | `POST /api/v1/auth/verify-email/resend` | `{}` | `202` |
| `auth.forgotPassword` | `POST /api/v1/auth/password/forgot` | Sí | `202` |
| `auth.resetPassword` | `POST /api/v1/auth/password/reset` | Sí | `200` |
| `auth.googleStart` | `GET /api/v1/auth/google/start` | No aplica | `302` sin cuerpo |
| `auth.googleCallback` | `GET /api/v1/auth/google/callback` | No aplica | `302` sin cuerpo |
| `auth.googleLink` | `POST /api/v1/auth/google/link` | Sí | `200` |
| `profile.requestEmailChange` | `POST /api/v1/profile/email-change` | Sí | `202` |
| `profile.confirmEmailChange` | `POST /api/v1/profile/email-change/confirm` | Sí | `200` |
| `profile.requestClosure` | `POST /api/v1/profile/closure` | Sí | `200` |
| `admin.catalog.deleteImage` | `DELETE /api/v1/admin/catalog/{type}/{id}/images/{imageId}` | No aplica | `204` sin cuerpo |
| `admin.hotels.deleteImage` | `DELETE /api/v1/admin/hotels/{id}/images/{imageId}` | No aplica | `204` sin cuerpo |
| `admin.hotels.deleteRoomTypeImage` | `DELETE /api/v1/admin/hotels/{id}/room-types/{roomTypeId}/images/{imageId}` | No aplica | `204` sin cuerpo |

Son **18 bloques de cuerpo**: 9 de solicitud y 9 de respuesta. Cuatro operaciones usan `204` y dos usan `302`; no se inventaron cuerpos para ellas.

Con los lotes A–M, el OpenAPI acumula **139 bloques de ejemplo en 86 operaciones con ejemplos de cuerpo**. Las **6 operaciones restantes** no tienen cuerpo de ejemplo: 4 usan `204` y 2 usan `302`. **Las 92 operaciones tienen respuesta de éxito documentada**, con cuerpo de ejemplo o sin cuerpo.

## 2. Contenido de los ejemplos

- Sesión ficticia con `accessToken: fake-access-token-for-example-only`, `tokenType: Bearer`, `expiresIn: 900` y usuario ficticio.
- Tokens de verificación, recuperación y cambio de correo ficticios; no son válidos.
- Contraseña ficticia `ContraseñaFicticia123`; no es una credencial real ni una recomendación de política.
- Código y estado de Google ficticios; no se realizó ningún flujo OAuth.
- Solicitud de cambio de correo a `cliente.nuevo@example.test` y confirmación ficticia.
- Baja ficticia con `confirm: true`.
- Las eliminaciones se documentan como `204` sin cuerpo.
- Los inicios y callbacks de Google se documentan como `302` sin cuerpo; no se inventó un `Location` real.
- Fechas ISO 8601 citadas, UUID ficticios y datos sin PII real, tokens reales, contraseñas reales, cookies reales, cuentas reales ni correos enviados.
- Los ejemplos no demuestran que un servidor real renueve sesiones, verifique correos, recupere contraseñas, vincule Google, cambie correos o cierre cuentas.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| UUID de ejemplo con grupos 8-4-4-4-12 | Sí |
| Datos ficticios, sin PII/tokens/contraseñas reales | Sí |
| Operaciones del lote M cubiertas | 15 de 15 |
| Operaciones con bloque de cuerpo | 9 de 15 |
| Operaciones sin cuerpo documentadas | 6: 4 `204` y 2 `302` |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado tras DEC-237 |

La validación es estructural y de JSON Schema; no es una prueba de contrato, de autenticación, de sesión, de correo, de OAuth, de cambio de correo, de baja ni de eliminación real.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación, incluidos `400`, `401`, `403`, `404`, `409`, `410`, `413`, `415`, `429` y `503` según corresponda.
- Revisar que cada operación tenga ejemplos de error coherentes con su contrato; hoy no existen.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Lotes N, O y P completados; siguiente lote

El **lote N** (errores compartidos) se completó en [ejemplos-lote-n.md](ejemplos-lote-n.md), DEC-238, con 22 ejemplos en 11 componentes de respuesta, 319 referencias en 90 operaciones y 919 ejemplos efectivos en 92 operaciones.

El **lote O** (errores específicos de identidad, perfil, reservas, pagos y autorización de devoluciones) se completó en [ejemplos-lote-o.md](ejemplos-lote-o.md), DEC-240, con 17 ejemplos específicos en 13 componentes.

El **lote P** (catálogo, hoteles, movilidad, inventario, exportaciones, reportes y media) se completó en [ejemplos-lote-p.md](ejemplos-lote-p.md), DEC-241, con 19 ejemplos específicos en 14 componentes; el OpenAPI acumula 58 ejemplos de error en 38 componentes y 808 ejemplos efectivos en 92 operaciones.

El siguiente lote propuesto es el **lote Q — errores residuales de autenticación, perfil, notificaciones, media administrativa y operaciones de creación**, empezando por los códigos concretos de `400`, `404`, `409`, `410`, `413`, `415`, `429` y `503` que declara cada familia. No se añaden todavía handlers, respuestas reales, códigos de error definitivos, sesiones reales, correos, cuentas, imágenes reales ni cambios de estado.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, sesiones reales, tokens reales, contraseñas reales, cookies reales, correos, cuentas, imágenes reales, pagos, datos/proveedores reales, configuración, commits o push.
