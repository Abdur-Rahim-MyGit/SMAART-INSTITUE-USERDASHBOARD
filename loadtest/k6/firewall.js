/**
 * firewall.js  —  Prove the Nginx WAF/rate-limit (firewall) works.
 * Fires 300 req/s from one client for 8s at /api/health. The edge limit is
 * 20 req/s + burst, so most requests should be rejected with HTTP 429.
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://nginx';
export const options = {
  scenarios: {
    burst: {
      executor: 'constant-arrival-rate',
      rate: 300, timeUnit: '1s', duration: '8s',
      preAllocatedVUs: 150, maxVUs: 400,
    },
  },
};
export default function () {
  const r = http.get(`${BASE}/api/health`);
  check(r, {
    'allowed (200)': (x) => x.status === 200,
    'blocked by firewall (429)': (x) => x.status === 429,
  });
}
