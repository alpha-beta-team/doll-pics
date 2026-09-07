import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/public-html',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: 'http://127.0.0.1:4180', browserName: 'chromium', serviceWorkers: 'block', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/test-public-html-server.mjs',
    url: 'http://127.0.0.1:4180',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
