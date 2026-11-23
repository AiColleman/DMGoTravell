import { isValidProblemDetails, ProblemDetails } from './domainRules';

export class ApiProblemError extends Error {
  public readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(`${problem.status} ${problem.code}: ${problem.detail}`);
    this.name = 'ApiProblemError';
    this.problem = problem;
  }
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface CatalogPageResponse {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: Array<{
    id: string;
    type: string;
    name: string;
    price: string;
    currency: string;
  }>;
}

export interface ReservationResponse {
  id: string;
  reservationNumber: string;
  status: string;
  total: string;
  currency: string;
  version: number;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class DMGoTravelApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: FetchLike;

  constructor(baseUrl: string, fetcher: FetchLike = fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetcher = fetcher;
  }

  async health(): Promise<{ status: string; service: string }> {
    return this.requestJson('/health', { method: 'GET' });
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.requestJson('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  }

  async listCatalog(type: 'tours' | 'packages', page = 1, pageSize = 10): Promise<CatalogPageResponse> {
    return this.requestJson(`/api/v1/catalog/${type}?page=${page}&pageSize=${pageSize}`, {
      method: 'GET'
    });
  }

  async createReservation(
    accessToken: string,
    departureId: string,
    travelers: number,
    idempotencyKey: string
  ): Promise<ReservationResponse> {
    return this.requestJson('/api/v1/reservations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ departureId, travelers })
    });
  }

  async getReservation(accessToken: string, reservationId: string): Promise<ReservationResponse> {
    return this.requestJson(`/api/v1/reservations/${reservationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  async cancelReservation(
    accessToken: string,
    reservationId: string,
    idempotencyKey: string,
    version?: number
  ): Promise<ReservationResponse> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    };
    if (version !== undefined) {
      headers['If-Match'] = `W/"${version}"`;
    }

    return this.requestJson(`/api/v1/reservations/${reservationId}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify(version !== undefined ? { version } : {})
    });
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, init);
    const body = await response.json();
    if (!response.ok) {
      if (isValidProblemDetails(body)) {
        throw new ApiProblemError(body);
      }
      throw new Error(`HTTP ${response.status} sin formato ProblemDetails en ${path}`);
    }
    return body as T;
  }
}
