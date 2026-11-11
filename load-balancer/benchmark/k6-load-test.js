import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp up to 20 users
    { duration: '30s', target: 50 },  // Steady state at 50 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must complete below 100ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // Test health endpoint through load balancer
  const healthRes = http.get(`${BASE_URL}/health`, {
    headers: {
      'Accept': 'application/json',
      'X-Request-ID': '11111111-2222-4333-8444-555555555555',
    },
  });

  check(healthRes, {
    'status is 200': (r) => r.status === 200,
    'has requestId': (r) => r.json('requestId') !== undefined,
    'backend replied': (r) => r.json('success') === true,
  });

  sleep(0.1);
}

