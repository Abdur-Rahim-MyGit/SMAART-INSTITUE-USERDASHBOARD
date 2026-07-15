/**
 * courses-bench.js  —  Focused A/B benchmark of GET /api/courses.
 * Hammers only the courses endpoint (each request still goes through auth) at
 * 100 then 200 concurrent, so before/after p95 reflects the courses-handler
 * optimization (removed redundant College.findById + .lean()).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://backend:5000';
const fixture = new SharedArray('fixture', function () {
  return [JSON.parse(open('/loadtest/tokens.json'))];
})[0];
const TOKENS = fixture.tokens;

function stage(vus, startTime, level) {
  return { executor: 'constant-vus', vus, duration: '45s', startTime, tags: { level: String(level) }, gracefulStop: '10s' };
}
export const options = {
  scenarios: {
    c100: stage(100, '0s', 100),
    c200: stage(200, '55s', 200),
  },
  thresholds: {
    'http_req_duration{level:100}': ['p(95)<800'],
    'http_req_duration{level:200}': ['p(95)<800'],
  },
};

export default function () {
  const token = TOKENS[(__VU - 1) % TOKENS.length];
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Forwarded-For': `10.${Math.floor(__VU / 256) % 256}.${__VU % 256}.10`,
    },
  };
  const r = http.get(`${BASE_URL}/api/courses`, params);
  check(r, { 'courses 200': (res) => res.status === 200 });
  sleep(0.2);
}
