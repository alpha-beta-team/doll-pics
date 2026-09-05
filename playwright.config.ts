import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: { VITE_API_URL: '/api', VITE_GA_MEASUREMENT_ID: '', VITE_META_PIXEL_ID: '' },
  },
});
