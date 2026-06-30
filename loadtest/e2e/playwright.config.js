// Playwright config — points at the production-shaped stack via the LB (Nginx).
// Run inside the official Playwright Docker image on the compose network so it
// reaches http://nginx directly. See loadtest/e2e/README.md.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 20000 },
  retries: 0,
  reporter: [['list']],
  outputDir: '/loadtest/e2e-results/artifacts',
  use: {
    baseURL: process.env.BASE_URL || 'http://nginx',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
