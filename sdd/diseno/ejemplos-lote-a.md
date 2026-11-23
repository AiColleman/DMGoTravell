# Ejemplos OpenAPI — lote A (identidad y perfil) v0.1

> **Fecha:** 2026-11-05. **Versión:** 0.1. **Registro:** DEC-225.  
> **Objeto:** [borrador OpenAPI](openapi/dmgo-api-v1.yaml), [plan de pruebas CT-12](plan-pruebas-contrato.md) y [paquete de ratificación](paquete-ratificacion.md).  
> **Estado:** **propuesta documental NO RATIFICADA**. No crea handlers, código, endpoints, SQL, migraciones, harness, datos reales, configuración, commits o push.  
> **Alcance:** ampliar ejemplos ficticios por operación; no cierra CT-12 ni API-01.

## 1. Resultado

Se añadieron ejemplos de solicitud y respuesta para cuatro operaciones del lote A:

| Operación | Método y ruta | Ejemplo de solicitud | Ejemplo de éxito |
|---|---|---|---|
| `auth.register` | `POST /api/v1/auth/register` | Sí | `201` |
| `auth.login` | `POST /api/v1/auth/login` | Sí | `200` |
| `profile.get` | `GET /api/v1/profile` | No aplica | `200` |
| `profile.update` | `PUT /api/v1/profile` | Sí | `200` |

Son **7 bloques de ejemplo** (3 de solicitud y 4 de respuesta) en 4 operaciones. Los ejemplos de error siguen cubiertos por el esquema compartido `ProblemDetails`; no se añadió un ejemplo de error por operación.

## 2. Contenido de los ejemplos

- Correo ficticio `cliente@example.com`; no corresponde a una cuenta real.
- Contraseña ficticia `Clave-ficticia-123`; no es una credencial válida.
- Token ficticio `fake-access-token-for-example-only`; no es un JWT real.
- UUID ficticio `11111111-1111-1111-1111-111111111111`.
- Teléfonos ficticios `+51999999999` y `+51988888888`.
- `auth.register` devuelve `emailVerified: false`.
- `auth.login` devuelve `emailVerified: true`.
- `profile.get` y `profile.update` no incluyen secretos, enlaces ni datos de otras cuentas.
- `profile.update` conserva el `ETag` declarado; el ejemplo no fija el valor del token.

Los ejemplos no sustituyen las pruebas de contrato ni demuestran que un servidor real los produzca.

## 3. Validación documental

| Comprobación | Resultado |
|---|---|
| YAML carga sin errores de sintaxis | Sí |
| Ejemplos de solicitud validan contra su esquema | 0 fallos |
| Ejemplos de respuesta validan contra su esquema | 0 fallos |
| Datos ficticios, sin PII/tokens reales | Sí |
| Operaciones con ejemplo de solicitud | 3 de 4 (la lectura no tiene cuerpo) |
| Operaciones con ejemplo de éxito | 4 de 4 |
| Ejemplos de error por operación | Pendientes |
| OpenAPI completo validado con validador externo | No ejecutado |

La validación es estructural y de JSON Schema; no es una prueba de contrato ni una ejecución de endpoints.

## 4. Qué falta para CT-12

- Añadir ejemplos de error por operación para los códigos declarados.
- Cubrir las 88 operaciones restantes.
- Revisar cuerpos y parámetros contra el contrato textual.
- Validar el OpenAPI con un validador completo cuando se autorice la herramienta.
- Ejecutar CT-12 con harness o implementación; hoy no existe.

CT-12 sigue **parcial** y API-01 sigue **abierta**.

## 5. Siguiente lote

El **lote B** (catálogo, hoteles y movilidad pública) se completó en [ejemplos-lote-b.md](ejemplos-lote-b.md), DEC-226. El siguiente lote propuesto es el **lote C — reservas y pagos**:

- `reservations.create`
- `reservations.list`
- `reservations.get`
- `reservations.cancel`
- `payments.start`
- `payments.get`

Este lote requiere ejemplos de solicitud, éxito y errores de estado/conflicto; no se añaden todavía handlers ni pruebas de pago.

## 6. Preservación

- No se añadieron RF/HU/RN, criterios o tareas.
- **677 criterios aprobados y 402 tareas pendientes**, ninguna ejecutada.
- Specs, planes/tasks, análisis y contratos anteriores intactos.
- Sin handlers, código, endpoints, SQL, migraciones, harness, datos/cuentas/proveedores reales, configuración, commits o push.
