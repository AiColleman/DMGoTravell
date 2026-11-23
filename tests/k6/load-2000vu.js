import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Escenario AC01 + AC03: Rampa progresiva hasta 2,000 usuarios virtuales concurrentes
// Evaluando latencia p50/p95/p99, throughput y tasa de errores 5xx sobre lecturas públicas.
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:5194';

export const serverErrors = new Rate('http_5xx_errors');
export const catalogDuration = new Trend('catalog_read_ms', true);

export const options = {
  stages: [
    { duration: '10s', target: 100 },   // Calentamiento: 100 VUs
    { duration: '10s', target: 500 },   // Carga media: 500 VUs
    { duration: '15s', target: 1000 },  // Carga alta: 1,000 VUs
    { duration: '15s', target: 2000 },  // Pico máximo solicitado: 2,000 VUs concurrentes
    { duration: '10s', target: 2000 },  // Sostener 2,000 VUs concurrentes
    { duration: '10s', target: 0 }      // Descenso ordenado
  ],
  thresholds: {
    http_5xx_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05']
  }
};

export default function () {
  const endpointIndex = __ITER % 3;
  const path =
    endpointIndex === 0
      ? '/api/v1/catalog/tours?page=1&pageSize=10'
      : endpointIndex === 1
      ? '/api/v1/catalog/packages?page=1&pageSize=10'
      : '/api/v1/mobility';

  const res = http.get(`${BASE_URL}${path}`, {
    tags: { endpoint: path }
  });

  catalogDuration.add(res.timings.duration);
  serverErrors.add(res.status >= 500);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'sin error 5xx': (r) => r.status < 500
  });

  sleep(0.5);
}
