import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/order-workflow-browser',
  use: { baseURL: 'http://127.0.0.1:4176', browserName: 'chromium', serviceWorkers: 'block' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176', reuseExistingServer: false, env: { VITE_API_URL: '/api' } },
});
