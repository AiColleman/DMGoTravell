import { ApiProblemError, DMGoTravelApiClient, FetchLike } from '../src/apiClient';

function mockJsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe('Cliente REST API DMGOTRAVEL (AC04, AC05, AC08)', () => {
  it('consulta /health y catálogo público correctamente', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith('/health')) {
        return mockJsonResponse(200, { status: 'Healthy', service: 'DMGoTravel.Api' });
      }
      return mockJsonResponse(200, {
        page: 1,
        pageSize: 10,
        total: 1,
        hasNext: false,
        items: [{ id: '1', type: 'tour', name: 'Tour de ejemplo', price: '120.00', currency: 'PEN' }]
      });
    };

    const client = new DMGoTravelApiClient('http://localhost:5194/', fetcher);
    const health = await client.health();
    const catalog = await client.listCatalog('tours');

    expect(health.status).toBe('Healthy');
    expect(catalog.items).toHaveLength(1);
    expect(calls[0].url).toBe('http://localhost:5194/health');
    expect(calls[1].url).toBe('http://localhost:5194/api/v1/catalog/tours?page=1&pageSize=10');
  });

  it('envía Bearer JWT, Idempotency-Key e If-Match al crear, consultar y cancelar reserva', async () => {
    const captured: Array<{ url: string; headers: Record<string, string> }> = [];
    const fetcher: FetchLike = async (url, init) => {
      captured.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
      if (url.endsWith('/auth/login')) {
        return mockJsonResponse(200, {
          accessToken: 'jwt-demo',
          user: { id: 'u1', email: 'cliente@example.test', fullName: 'Cliente', role: 'client' }
        });
      }
      return mockJsonResponse(201, {
        id: 'res-1',
        reservationNumber: 'DMGO-2026-0001',
        status: 'pending',
        total: '240.00',
        currency: 'PEN',
        version: 1
      });
    };

    const client = new DMGoTravelApiClient('http://localhost:5194', fetcher);
    const login = await client.login('cliente@example.test', 'Clave-ficticia-123');
    const created = await client.createReservation(login.accessToken, 'dep-1', 2, 'idem-001');
    await client.getReservation(login.accessToken, created.id);
    await client.cancelReservation(login.accessToken, created.id, 'idem-002', 1);
    await client.cancelReservation(login.accessToken, created.id, 'idem-003');

    expect(captured[1].headers['Authorization']).toBe('Bearer jwt-demo');
    expect(captured[1].headers['Idempotency-Key']).toBe('idem-001');
    expect(captured[3].headers['If-Match']).toBe('W/"1"');
    expect(captured[4].headers['If-Match']).toBeUndefined();
  });

  it('traduce errores HTTP RFC 7807 (401/403/404/409) a ApiProblemError', async () => {
    const fetcher: FetchLike = async () =>
      mockJsonResponse(409, {
        type: 'https://dmgotravel.com/errors/insufficient_capacity',
        title: 'Conflicto',
        status: 409,
        code: 'insufficient_capacity',
        detail: 'No existen cupos suficientes.'
      });

    const client = new DMGoTravelApiClient('http://localhost:5194', fetcher);
    await expect(client.createReservation('tok', 'dep-1', 99, 'idem-9')).rejects.toBeInstanceOf(
      ApiProblemError
    );
  });

  it('falla explícitamente si el backend devolviera un error fuera del formato ProblemDetails', async () => {
    const fetcher: FetchLike = async () => mockJsonResponse(500, { raw: 'unexpected' });
    const client = new DMGoTravelApiClient('http://localhost:5194', fetcher);
    await expect(client.health()).rejects.toThrow('sin formato ProblemDetails');
  });
});
