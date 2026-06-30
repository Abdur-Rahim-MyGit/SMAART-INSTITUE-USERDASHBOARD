/**
 * steady.js  —  Pin the per-task ceiling with STEADY load at fixed levels.
 * ----------------------------------------------------------------------------
 * Runs four back-to-back steady stages (100, 150, 200, 300 concurrent
 * students), each held ~75s so p95 settles. Per-stage results are tagged with
 * `level` so the summary shows p95 at each level — that reveals where latency
 * crosses the 800ms healthy line, i.e. the per-task ceiling N.
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

const HOLD = '75s';
function stage(vus, startTime, level) {
  return {
    executor: 'constant-vus',
    vus,
    duration: HOLD,
    startTime,
    tags: { level: String(level) }, // tags every metric from this stage
    gracefulStop: '10s',
  };
}

export const options = {
  scenarios: {
    s100: stage(100, '0s', 100),
    s150: stage(150, '90s', 150),
    s200: stage(200, '180s', 200),
    s300: stage(300, '270s', 300),
  },
  // High bounds so these never abort — they just force per-level p95 to print.
  thresholds: {
    'http_req_duration{level:100}': ['p(95)<800'],
    'http_req_duration{level:150}': ['p(95)<800'],
    'http_req_duration{level:200}': ['p(95)<800'],
    'http_req_duration{level:300}': ['p(95)<800'],
    'http_req_failed{level:100}': ['rate<0.05'],
    'http_req_failed{level:150}': ['rate<0.05'],
    'http_req_failed{level:200}': ['rate<0.05'],
    'http_req_failed{level:300}': ['rate<0.05'],
  },
};

function clientIp() {
  return `10.${Math.floor(__VU / 256) % 256}.${__VU % 256}.10`;
}

export default function () {
  const token = TOKENS[(__VU - 1) % TOKENS.length];
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Forwarded-For': clientIp(),
      'Content-Type': 'application/json',
    },
  };

  let r = http.get(`${BASE_URL}/api/auth/me`, params);
  check(r, { ok: (res) => res.status === 200 });

  r = http.get(`${BASE_URL}/api/courses`, params);
  check(r, { ok: (res) => res.status === 200 });

  sleep(Math.random() * 2 + 1);

  r = http.get(`${BASE_URL}/api/assessments`, params);
  check(r, { ok: (res) => res.status === 200 });

  if (Math.random() < 0.25) {
    http.get(`${BASE_URL}/api/results/assessment/${ASSESSMENT_ID}/start`, params);
  }

  sleep(Math.random() * 2 + 1);
}
