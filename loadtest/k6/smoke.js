/**
 * smoke.js  —  Tiny validation run (10 VUs, 20s) before the full ramp.
 * Confirms tokens work and endpoints return 200 under trivial load.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://backend:5000';
const fixture = new SharedArray('fixture', function () {
  return [JSON.parse(open('/loadtest/tokens.json'))];
})[0];
const TOKENS = fixture.tokens;
const ASSESSMENT_ID = fixture.assessmentId;

export const options = {
  vus: 10,
  duration: '20s',
  thresholds: { http_req_failed: ['rate<0.05'] },
};

export default function () {
  const token = TOKENS[(__VU - 1) % TOKENS.length];
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Forwarded-For': `10.0.${__VU % 256}.10`,
      'Content-Type': 'application/json',
    },
  };
  let r = http.get(`${BASE_URL}/api/auth/me`, params);
  check(r, { 'me 200': (res) => res.status === 200 });
  r = http.get(`${BASE_URL}/api/courses`, params);
  check(r, { 'courses 200': (res) => res.status === 200 });
  r = http.get(`${BASE_URL}/api/results/assessment/${ASSESSMENT_ID}/start`, params);
  check(r, { 'start ok': (res) => res.status === 200 || res.status === 201 });
  sleep(1);
}
