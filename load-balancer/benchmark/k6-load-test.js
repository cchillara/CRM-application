import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  
    { duration: '30s', target: 50 },  
    { duration: '10s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], 
    http_req_failed: ['rate<0.01'],    
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

