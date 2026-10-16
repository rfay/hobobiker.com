import { defineConfig, devices } from '@playwright/test';

/**
 * Migration tests for hobobiker.com. Strategy: kit/docs/how-it-works.md.
 *
 * The base URL defaults to the original Drupal 6 copy. Point the same suite at a migration target by
 * setting TEST_BASE_URL *inside the container* (a host-side variable is not forwarded):
 *   ddev exec -d /var/www/html/test/playwright 'TEST_BASE_URL=https://hobobiker-static.ddev.site MIGRATION_TARGET=static npx playwright test'
 * MIGRATION_TARGET (static | drupal11) selects which expected-differences entries apply, and turns
 * the stored-content tier into failing tests for drupal11.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'https://hobobiker-copy.ddev.site',
    trace: 'off',
  },
  // One project: most tiers use the HTTP request fixture, so other browsers would only repeat them.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
