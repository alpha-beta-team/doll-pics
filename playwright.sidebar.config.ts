import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/sidebar-browser',
  use: { baseURL: 'http://127.0.0.1:4193', browserName: 'chromium', serviceWorkers: 'block' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4193 --strictPort', url: 'http://127.0.0.1:4193', reuseExistingServer: false, env: { VITE_API_URL: '/api' } },
});
