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

function trackProblems(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('reqfail: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
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

  // Ignore benign third-party / websocket noise (sockets hardcode :5000).
  const fatal = problems.filter((p) => !/:5000|socket|websocket|favicon|supabase|sitemap|robots/i.test(p));
  console.log(`[landing] problems=${problems.length} fatal=${fatal.length}`);
  if (problems.length) console.log(problems.slice(0, 8).join('\n'));
  expect(fatal, 'fatal browser errors').toHaveLength(0);
});

test('2. college search API (through the LB) returns the seeded college', async ({ page }) => {
  // The login funnel begins with a public college search (GET /api/colleges).
  // We exercise it through the load balancer via a browser-originated request.
  // (The SPA's own search box currently builds the API URL as host:5000 for
  //  non-localhost hosts — a frontend quirk flagged separately — so we hit the
  //  API path directly here, which is what the search ultimately relies on.)
  const res = await page.request.get('/api/colleges?search=Load%20Test&limit=20');
  expect(res.status(), 'colleges search HTTP status').toBe(200);
  const text = await res.text();
  console.log('[search] colleges response (truncated):', text.slice(0, 160));
  expect(/Load Test Institute/i.test(text),
    'seeded college present in search results').toBeTruthy();
});

test('4. UI college search works in-browser (validates same-origin /api fix)', async ({ page }) => {
  // Drives the real SPA search box. Before the api.js fix this failed with
  // "Failed to fetch" (SPA called host:5000). After the fix it calls /api
  // same-origin through Nginx, so the seeded college now appears in the UI.
  await page.goto('/login', { waitUntil: 'networkidle' });
  const search = page.locator('input[placeholder*="college" i]').first();
  await expect(search, 'college search box on /login').toBeVisible({ timeout: 20000 });
  await search.fill('Load Test');
  await expect(page.getByText(/Load Test Institute/i).first(),
    'seeded college appears in the UI search results').toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: `${OUT}/05-ui-search.png`, fullPage: true });
  console.log('[ui-search] SPA same-origin API call works');
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
