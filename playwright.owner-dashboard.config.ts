import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/owner-dashboard-browser',
  use: { baseURL: 'http://127.0.0.1:4196', browserName: 'chromium', serviceWorkers: 'block' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4196 --strictPort', url: 'http://127.0.0.1:4196', reuseExistingServer: false, env: { VITE_API_URL: '/api' } },
});
