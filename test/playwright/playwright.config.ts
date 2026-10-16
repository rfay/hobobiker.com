import { defineConfig, devices } from '@playwright/test';

// Migration tests for hobobiker.com. Run inside the web container:
//
//   ddev exec -d /var/www/html/test/playwright 'npx playwright test --grep "semantic:"'
//
// TEST_BASE_URL points the same suite at a migration target. Set it INSIDE the container; a host-side
// variable is not forwarded, and the run would silently test the original again.
// MIGRATION_TARGET (static | drupal11) selects which expected differences apply.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : 8,
  reporter: [['list', { printSteps: false }], ['html', { open: 'never' }]],
  timeout: 60_000,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'https://hobobiker-copy.ddev.site',
    ignoreHTTPSErrors: true,
    trace: 'off',
  },
  // HTTP tiers use the request fixture (no browser); one project is enough.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-dev-shm-usage'] } } }],
});
