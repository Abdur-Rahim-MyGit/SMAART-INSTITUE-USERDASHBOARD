/**
 * ramp.js  —  Progressive load ramp against the LOCAL SMAART backend.
 * ----------------------------------------------------------------------------
 * Goal: find the per-task ceiling — how many concurrent students ONE backend
 * container serves before p95 latency / error rate degrade. From that number
 * you size how many AWS Fargate tasks 10k students needs.
 *
 * Each virtual user (VU) = one student: carries a minted JWT and a UNIQUE
 * X-Forwarded-For so the per-IP rate limiter treats it as a distinct client
 * (realistic, and avoids the single-source-IP artifact of local testing).
 *
 * RUN (via Docker, on the compose network — nothing to install):
 *   see loadtest/README.md
 *
 * Reads loadtest/tokens.json (produced by back-end/scripts/seed-loadtest.js).
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://backend:5000';

// Load fixtures once, shared across all VUs (memory-efficient).
const fixture = new SharedArray('fixture', function () {
  const data = JSON.parse(open('/loadtest/tokens.json'));
  return [data]; // wrap so SharedArray holds a single element
})[0];

const TOKENS = fixture.tokens;
const ASSESSMENT_ID = fixture.assessmentId;

export const options = {
  // Progressive ramp: climb concurrency, holding at each step to read a stable
  // p95. Watch the per-stage summary to see where latency/errors break.
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // warm up
        { duration: '1m',  target: 50 },
        { duration: '30s', target: 200 },
        { duration: '1m',  target: 200 },
        { duration: '30s', target: 500 },
        { duration: '1m',  target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '2m',  target: 1000 }, // the real stress hold
        { duration: '30s', target: 0 },    // ramp down (recovery)
      ],
      gracefulRampDown: '20s',
    },
  },
  // Pass/fail bars. These do NOT abort the run — they color the final summary.
  thresholds: {
    http_req_failed: ['rate<0.05'],                       // < 5% errors
    http_req_duration: ['p(95)<800', 'p(99)<2000'],       // p95 < 800ms
    'http_req_duration{name:courses}': ['p(95)<800'],
    'http_req_duration{name:start_assessment}': ['p(95)<1500'],
  },
};

// Stable, unique client IP per VU so each gets its own rate-limit bucket.
function clientIp() {
  const a = Math.floor(__VU / 256) % 256;
  const b = __VU % 256;
  return `10.${a}.${b}.10`;
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

  group('student session', function () {
    // 1. Session / profile check
    let r = http.get(`${BASE_URL}/api/auth/me`, Object.assign({ tags: { name: 'me' } }, params));
    check(r, { 'me 200': (res) => res.status === 200 });

    // 2. Browse courses
    r = http.get(`${BASE_URL}/api/courses`, Object.assign({ tags: { name: 'courses' } }, params));
    check(r, { 'courses 200': (res) => res.status === 200 });

    sleep(Math.random() * 2 + 1); // think time 1-3s

    // 3. Browse assessments
    r = http.get(`${BASE_URL}/api/assessments`, Object.assign({ tags: { name: 'assessments' } }, params));
    check(r, { 'assessments 200': (res) => res.status === 200 });

    // 4. Notifications poll
    r = http.get(`${BASE_URL}/api/notifications`, Object.assign({ tags: { name: 'notifications' } }, params));
    check(r, { 'notifications ok': (res) => res.status === 200 || res.status === 404 });

    sleep(Math.random() * 2 + 1);

    // 5. Start an assessment (heavy: real DB write + question logic) — 1 in 4
    if (Math.random() < 0.25) {
      r = http.get(
        `${BASE_URL}/api/results/assessment/${ASSESSMENT_ID}/start`,
        Object.assign({ tags: { name: 'start_assessment' } }, params)
      );
      check(r, { 'start ok': (res) => res.status === 200 || res.status === 201 });
    }

    sleep(Math.random() * 3 + 1);
  });
}
