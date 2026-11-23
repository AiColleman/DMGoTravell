import fs from 'node:fs';
import yaml from 'js-yaml';

export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, Record<string, { operationId?: string }>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
}

export function loadOpenApiDocument(filePath: string): OpenApiDocument {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw) as OpenApiDocument;
  if (!parsed || typeof parsed !== 'object' || !parsed.paths) {
    throw new Error('Documento OpenAPI inválido o sin rutas.');
  }
  return parsed;
}

export function listOperationIds(doc: OpenApiDocument): string[] {
  const ops: string[] = [];
  for (const methods of Object.values(doc.paths)) {
    for (const op of Object.values(methods)) {
      if (op && typeof op === 'object' && typeof op.operationId === 'string') {
        ops.push(op.operationId);
      }
    }
  }
  return ops;
}
