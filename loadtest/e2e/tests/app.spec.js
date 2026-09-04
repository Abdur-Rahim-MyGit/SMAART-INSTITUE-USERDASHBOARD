// Real-browser E2E against the production-shaped local stack (http://nginx).
// Acts like a real student: loads the app, then drives the login flow.
//
// NOTE on login: the app sends an OTP to email on login. There is no SMTP
// locally, so the UI flow can be verified end-to-end UP TO the OTP step
// (which proves auth + API + DB all work through the load balancer). The
// seeded `e2e@loadtest.local` user has a real bcrypt password so the password
// stage actually passes.
const { test, expect } = require('@playwright/test');
const fs = require('fs');

const fixture = JSON.parse(fs.readFileSync('/loadtest/tokens.json', 'utf8'));
const E2E_EMAIL = fixture.e2eEmail;
const E2E_PASSWORD = fixture.e2ePassword;
const OUT = '/loadtest/e2e-results';

// Benign noise: hardcoded :5000 sockets, favicons, and the gitignored ONNX
// models/WASM that are never present in CI.
const IGNORE_RE = /:5000|socket|websocket|favicon|supabase|sitemap|robots|onnx-wasm|models\/onnx|ort\.min\.js|\.wasm/i;

function trackProblems(page) {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Chrome's "Failed to load resource: ... 404/500" console errors carry NO
    // URL, so they can't be attributed (and used to fail the run even for
    // ignorable resources). Every one of them is mirrored by a
    // 'response'/'requestfailed' event below that DOES carry the URL — track
    // those instead and skip the URL-less duplicate here.
    if (/Failed to load resource/i.test(m.text())) return;
    problems.push('console: ' + m.text());
  });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('reqfail: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
  page.on('response', (r) => {
    // Missing resources and server errors only — a 401/403 from an auth probe
    // on a public page is normal, not a broken page.
    if (r.status() === 404 || r.status() >= 500) problems.push(`badresponse: ${r.url()} ${r.status()}`);
  });
  return problems;
}

test('1. landing page loads and the SPA renders', async ({ page }) => {
  const problems = trackProblems(page);
  const resp = await page.goto('/', { waitUntil: 'networkidle' });
  expect(resp.status(), 'HTTP status of /').toBeLessThan(400);

  // DOM-agnostic: the SPA mounted real content (not a blank page).
  await page.waitForTimeout(2000);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length, 'rendered text length').toBeGreaterThan(50);

  await page.screenshot({ path: `${OUT}/01-landing.png`, fullPage: true });

  const fatal = problems.filter((p) => !IGNORE_RE.test(p));
  console.log(`[landing] problems=${problems.length} fatal=${fatal.length}`);
  if (problems.length) console.log(problems.slice(0, 8).join('\n'));
  expect(fatal, 'fatal browser errors').toHaveLength(0);
});

test('2. college search API (through the LB) returns the seeded college', async ({ page }) => {
  // The public college search still backs the institution pages; exercise it
  // through the load balancer via a browser-originated request.
  const res = await page.request.get('/api/colleges?search=Load%20Test&limit=20');
  expect(res.status(), 'colleges search HTTP status').toBe(200);
  const text = await res.text();
  console.log('[search] colleges response (truncated):', text.slice(0, 160));
  expect(/Load Test Institute/i.test(text),
    'seeded college present in search results').toBeTruthy();
});

test('4. UI login form works in-browser (validates same-origin /api)', async ({ page }) => {
  // Drives the real SPA login form on /login (the page no longer has a
  // college search box — the flow starts directly at email + password). A
  // successful submit means the SPA's own same-origin /api/auth/login call
  // went through Nginx and the backend answered with the OTP gate, whose
  // 6-digit modal then renders.
  await page.goto('/login', { waitUntil: 'networkidle' });

  const email = page.locator('#login-email');
  await expect(email, 'email input on /login').toBeVisible({ timeout: 20000 });
  await email.fill(E2E_EMAIL);
  await page.locator('#login-password').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').first().click();

  await expect(page.locator('input[aria-label*="OTP digit" i]').first(),
    'OTP entry appears after login submit').toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: `${OUT}/05-ui-login-otp.png`, fullPage: true });
  console.log('[ui-login] SPA same-origin /api/auth/login reached the OTP step');
});

test('3. login backend path (through the LB) reaches the OTP step', async ({ page }) => {
  // Browser-originated API call → Nginx → backend → Mongo. The seeded e2e user
  // has a real bcrypt password, so the password stage passes and the API
  // responds with "OTP required" (the email-OTP gate). This proves the whole
  // auth path works end-to-end through the production-shaped stack.
  const res = await page.request.post('/api/auth/login', {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
  });
  expect(res.status(), 'login HTTP status').toBe(200);
  const body = await res.json();
  console.log('[login] response:', JSON.stringify(body));
  expect(body.requireOtp === true || /otp/i.test(body.message || ''),
    'login should reach the OTP step').toBeTruthy();
});
