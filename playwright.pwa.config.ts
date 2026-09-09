import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pwa-browser',
  fullyParallel: true,
  workers: 3,
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:4180', browserName: 'chromium', serviceWorkers: 'block', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node scripts/test-public-html-server.mjs', url: 'http://127.0.0.1:4180', timeout: 120_000, reuseExistingServer: false, env: { PWA_TEST_CONTROLS: 'true' } },
    { command: 'npm run dev -- --host 127.0.0.1 --port 4179 --strictPort', url: 'http://127.0.0.1:4179', reuseExistingServer: false, env: { VITE_API_URL: '/api', DOLL_VITE_CACHE_DIR: 'node_modules/.vite-pwa-tests' } },
  ],
});
