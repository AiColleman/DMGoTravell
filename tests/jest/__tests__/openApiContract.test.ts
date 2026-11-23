import path from 'node:path';
import { listOperationIds, loadOpenApiDocument } from '../src/openApiContractValidator';

describe('Validación del contrato OpenAPI 3.1 (ADR-015 / AC08)', () => {
  const openApiPath = path.resolve(__dirname, '../../../sdd/diseno/openapi/dmgo-api-v1.yaml');
  const doc = loadOpenApiDocument(openApiPath);

  it('cumple versión OpenAPI 3.1 y esquemas de seguridad JWT + Refresh Cookie', () => {
    expect(doc.openapi).toMatch(/^3\.1\./);
    expect(doc.components?.securitySchemes).toHaveProperty('bearerAuth');
    expect(doc.components?.securitySchemes).toHaveProperty('refreshCookie');
    expect(doc.components?.schemas).toHaveProperty('ProblemDetails');
  });

  it('expone todas las rutas críticas de los módulos del monolito modular', () => {
    const requiredPaths = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/catalog/{type}',
      '/api/v1/hotels',
      '/api/v1/mobility',
      '/api/v1/reservations',
      '/api/v1/reservations/{id}/payments',
      '/api/v1/profile',
      '/api/v1/admin/reservations',
      '/api/v1/admin/refund-cases',
      '/api/v1/admin/notification-incidents',
      '/api/v1/admin/reports',
      '/api/v1/admin/audit',
      '/api/v1/webhooks/culqi',
      '/api/v1/webhooks/resend',
      '/api/v1/media/{assetId}'
    ];

    for (const route of requiredPaths) {
      expect(doc.paths).toHaveProperty(route);
    }
  });

  it('contiene operationIds estables sin duplicados', () => {
    const opIds = listOperationIds(doc);
    expect(opIds.length).toBeGreaterThanOrEqual(55);
    expect(new Set(opIds).size).toBe(opIds.length);
  });

  it('lanza error si se carga un documento YAML vacío o inválido', () => {
    expect(() => loadOpenApiDocument(path.resolve(__dirname, '../tsconfig.json'))).toThrow();
  });
});
