import http from 'k6/http';
import { check } from 'k6';

// Escenario AC01 (línea base de operación normal: 50 VUs constantes)
// Verifica el objetivo cuantitativo p95 <= 300 ms definido en Sprint 1 (04-atributos-de-calidad.md).
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:5194';

export const options = {
  vus: 50,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate==0']
  }
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/catalog/tours?page=1&pageSize=10`);
  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'p95 objetivo < 300ms': (r) => r.timings.duration < 300
  });
}
