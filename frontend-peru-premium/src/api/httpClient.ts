import {
  createIdempotencyKey,
  formatIfMatchHeader,
  getCookieValue,
  parseEtagVersion,
} from '../lib/format';
import type { AuthSessionDto, ProblemDetails } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const CSRF_COOKIE_NAME = 'dmgo_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
export const CORRELATION_HEADER_NAME = 'X-Correlation-Id';

export class ProblemDetailsError extends Error {
  public readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || `Error HTTP ${problem.status}`);
    this.name = 'ProblemDetailsError';
    this.problem = problem;
  }
}

export function isProblemDetails(payload: unknown): payload is ProblemDetails {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.detail === 'string'
  );
}

export interface HttpResult<T> {
  data: T;
  etagVersion?: number;
  correlationId: string;
  headers: Headers;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  idempotent?: boolean;
  idempotencyKey?: string;
  correlationId?: string;
  ifMatchVersion?: number | null;
  signal?: AbortSignal;
  includeCsrf?: boolean;
}

type TokenGetter = () => string | null;
type SessionUpdater = (session: AuthSessionDto | null) => void;

let getAccessToken: TokenGetter = () => null;
let onSessionUpdated: SessionUpdater = () => {};
let refreshInFlight: Promise<string | null> | null = null;

export function configureAuthInterceptors(getter: TokenGetter, updater: SessionUpdater): void {
  getAccessToken = getter;
  onSessionUpdated = updater;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const csrf = getCookieValue(CSRF_COOKIE_NAME);
      const headers: Record<string, string> = {
        Accept: 'application/json, application/problem+json',
        [CORRELATION_HEADER_NAME]: createIdempotencyKey(),
      };
      if (csrf) {
        headers[CSRF_HEADER_NAME] = csrf;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        onSessionUpdated(null);
        return null;
      }

      const session = (await response.json()) as AuthSessionDto;
      onSessionUpdated(session);
      return session.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
  allowRetry = true
): Promise<HttpResult<T>> {
  const method = options.method ?? 'GET';
  const correlationId = options.correlationId ?? createIdempotencyKey();

  const headers = new Headers({
    Accept: 'application/json, application/problem+json',
    [CORRELATION_HEADER_NAME]: correlationId,
  });

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (options.includeCsrf) {
    const csrf = getCookieValue(CSRF_COOKIE_NAME);
    if (csrf) {
      headers.set(CSRF_HEADER_NAME, csrf);
    }
  }

  if (options.idempotent) {
    headers.set('Idempotency-Key', options.idempotencyKey ?? createIdempotencyKey());
  }

  const ifMatch = formatIfMatchHeader(options.ifMatchVersion);
  if (ifMatch) {
    headers.set('If-Match', ifMatch);
  }

  let bodyPayload: BodyInit | undefined;
  if (options.formData) {
    bodyPayload = options.formData;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    bodyPayload = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: bodyPayload,
    credentials: 'include',
    signal: options.signal,
  });

  if (response.status === 401 && options.auth && allowRetry) {
    const refreshedToken = await tryRefreshAccessToken();
    if (refreshedToken) {
      return requestWithMeta<T>(path, { ...options, correlationId }, false);
    }
  }

  const resolvedCorrelationId =
    response.headers.get(CORRELATION_HEADER_NAME) ??
    response.headers.get('x-trace-id') ??
    correlationId;

  if (!response.ok) {
    let parsedBody: unknown = null;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }

    if (isProblemDetails(parsedBody)) {
      throw new ProblemDetailsError({
        ...parsedBody,
        traceId: parsedBody.traceId || resolvedCorrelationId,
      });
    }

    throw new ProblemDetailsError({
      type: 'https://dmgotravel.com/errors/http_error',
      title: `Error HTTP ${response.status}`,
      status: response.status,
      code: `http_${response.status}`,
      traceId: resolvedCorrelationId,
      detail: `La solicitud a ${path} devolvió estado ${response.status}.`,
    });
  }

  const etagVersion = parseEtagVersion(response.headers.get('ETag'));

  if (response.status === 204) {
    return {
      data: undefined as T,
      etagVersion,
      correlationId: resolvedCorrelationId,
      headers: response.headers,
    };
  }

  const data = (await response.json()) as T;
  return {
    data,
    etagVersion,
    correlationId: resolvedCorrelationId,
    headers: response.headers,
  };
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await requestWithMeta<T>(path, options);
  return result.data;
}

export async function downloadAuthenticatedBlob(
  path: string,
  allowRetry = true
): Promise<{ blob: Blob; fileName: string; referenceAt?: string | null; correlationId: string }> {
  const correlationId = createIdempotencyKey();
  const token = getAccessToken();
  const headers = new Headers({
    [CORRELATION_HEADER_NAME]: correlationId,
  });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && allowRetry) {
    const refreshedToken = await tryRefreshAccessToken();
    if (refreshedToken) {
      return downloadAuthenticatedBlob(path, false);
    }
  }

  const resolvedCorrelationId =
    response.headers.get(CORRELATION_HEADER_NAME) ??
    response.headers.get('x-trace-id') ??
    correlationId;

  if (!response.ok) {
    let parsedBody: unknown = null;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }
    if (isProblemDetails(parsedBody)) {
      throw new ProblemDetailsError({
        ...parsedBody,
        traceId: parsedBody.traceId || resolvedCorrelationId,
      });
    }
    throw new Error(`No se pudo descargar el archivo (${response.status}).`);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match?.[1] ?? 'documento-dmgotravel';
  const referenceAt =
    response.headers.get('X-Report-Reference-At') ??
    response.headers.get('X-Export-Reference-At');

  const blob = await response.blob();
  return { blob, fileName, referenceAt, correlationId: resolvedCorrelationId };
}
