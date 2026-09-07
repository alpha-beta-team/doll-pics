import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  projects: [
    { name: 'cms', testDir: './tests/browser' },
    { name: 'public-html', testDir: './tests/public-html', use: { baseURL: 'http://127.0.0.1:4180' } },
  ],
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: [{
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: { DOLL_VITE_CACHE_DIR: 'node_modules/.vite-browser-tests', VITE_API_URL: '/api', VITE_GA_MEASUREMENT_ID: 'G-LOCALTEST', VITE_META_PIXEL_ID: '1234567890' },
  }, {
    command: 'node scripts/test-public-html-server.mjs',
    url: 'http://127.0.0.1:4180',
    timeout: 120000,
    reuseExistingServer: false,
  }],
});
