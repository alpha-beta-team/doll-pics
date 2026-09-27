import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/schedule-browser',
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4187', browserName: 'chromium', serviceWorkers: 'block', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4187 --strictPort',
    url: 'http://127.0.0.1:4187', reuseExistingServer: false,
    env: { VITE_API_URL: '/api', DOLL_VITE_CACHE_DIR: 'node_modules/.vite-schedule-tests' },
  },
});
