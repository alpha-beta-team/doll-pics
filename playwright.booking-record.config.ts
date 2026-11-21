import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/booking-record-browser', outputDir: '/tmp/doll-booking-record-tests', workers: 2,
  use: { baseURL: 'http://127.0.0.1:4198', browserName: 'chromium', serviceWorkers: 'block' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4198 --strictPort', url: 'http://127.0.0.1:4198', reuseExistingServer: false, env: { VITE_API_URL: '/api', DOLL_VITE_CACHE_DIR: 'node_modules/.vite-booking-record' } },
});
