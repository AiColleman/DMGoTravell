export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const endpoints = {
  auth: '/api/v1/auth',
  profile: '/api/v1/profile',
  catalog: '/api/v1/catalog',
  hotels: '/api/v1/hotels',
  reservations: '/api/v1/reservations',
  payments: '/api/v1/payments',
  admin: '/api/v1/admin',
  reports: '/api/v1/admin/reports',
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiError('La API oficial aún no está configurada.', 0, 'API_NOT_CONFIGURED');
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    let message = `No se pudo completar la solicitud (${response.status}).`;
    let code: string | undefined;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string; code?: string };
      message = problem.detail ?? problem.title ?? message;
      code = problem.code;
    } catch {}
    throw new ApiError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
