# DMGOTRAVEL · Viajes Perú Premium (Frontend Oficial SPA)

Aplicación web cliente y administrativa de **DMGOTRAVEL** alineada íntegramente con la arquitectura, decisiones (`ADR-001`–`ADR-017`), restricciones (`RC01`–`RC23`, `RS01`–`RS12`), Modelo C4 y atributos de calidad (`AC01`–`AC12`) definidos en [`../docs/`](../docs/).

## Trazabilidad Tecnológica con `docs/`

| Dimensión en `docs/` | Decisión / Restricción | Implementación en `frontend-peru-premium` |
|---|---|---|
| **SPA & Build** | `RC01`, `RC02`, `ADR-012` | **React 19 + TypeScript 5.8 + Vite 6** (`tsconfig` estricto, cero JS sin tipado). |
| **Hosting & Edge/CDN** | `RC18`, `RC20`, `ADR-014`, `AC01` | **Vercel** ([`vercel.json`](./vercel.json)) con `Cache-Control: immutable` en `/assets/*`, cabeceras de seguridad HTTP y reescritura SPA sin proxy Cloudflare duplicado delante de Vercel. |
| **Comunicación API** | `RC06`, `RP07`, `ADR-015`, `ADR-016`, `AC08` | Cliente REST/JSON tipado ([`src/api/httpClient.ts`](./src/api/httpClient.ts)) contra **ASP.NET Core 10** (`/api/v1/*`), manejo nativo de RFC 7807 `ProblemDetails`, `ETag / If-Match`, `Idempotency-Key` y contrato OpenAPI 3.1 (`/openapi/v1.yaml`). Sin acceso directo a PostgreSQL/Supabase. |
| **Identidad, JWT & OAuth** | `RC12`, `RC13`, `ADR-009`, `AC04` | `accessToken` JWT **exclusivamente en memoria** ([`src/context/AuthContext.tsx`](./src/context/AuthContext.tsx), jamás en `localStorage`/`sessionStorage`), renovación automática vía cookie `dmgo_refresh` (`HttpOnly`, `SameSite=Strict`) + `X-CSRF-Token` (`dmgo_csrf`) e inicio/callback/vinculación **Google OAuth 2.0 / OIDC** (`/api/v1/auth/google/start`). |
| **Pagos Culqi** | `RC14`, `RS06`, `RS07`, `ADR-007`, `ADR-011`, `AC11` | Patrón **Adapter** ([`src/integrations/culqiCheckout.ts`](./src/integrations/culqiCheckout.ts)): carga dinámica de **Culqi Checkout v4** (`https://checkout.culqi.com/js/v4` con `VITE_CULQI_PUBLIC_KEY`) + tokenizador sandbox local para pruebas sin credenciales reales (`AC11`). Cero captura de PAN/CVV en el DOM de React; importe oficial en `PEN` calculado y congelado por el backend. |
| **Multimedia R2** | `RC16`, `ADR-006`, `Spec 012` | Carga administrativa validada (`≤ 5 MB`, JPEG/PNG/WebP) hacia **Cloudflare R2** y lectura pública desde `/api/v1/media/{guid}` con respaldo fotográfico editorial local. |
| **Trazabilidad** | `AC09` | Generación y propagación de `X-Correlation-Id` en cada petición HTTP y visualización de `traceId` en alertas de error `ProblemDetails`. |

## Comandos

```bash
cd frontend-peru-premium
npm install
npm run dev        # Desarrollo local en http://localhost:5174 (proxy -> http://localhost:5194)
npm run typecheck  # Verificación estricta TypeScript
npm test           # Suite automatizada de regresión, seguridad y contratos
npm run build      # Empaquetado de producción Vite para Vercel Edge/CDN
```
