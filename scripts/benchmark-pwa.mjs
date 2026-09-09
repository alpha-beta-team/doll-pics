// Controlled local login benchmark. Worker behavior is tested separately so all
// requests in this comparison obey the same CDP network throttling.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const directories = process.argv.slice(2);
if (!directories.length) throw new Error('Usage: node scripts/benchmark-pwa.mjs BASELINE_DIST CANDIDATE_DIST');
const browser = await chromium.launch();
const report = [];
try {
  for (const directory of directories) {
    const root = resolve(directory), encoded = new Map();
    const server = createServer((request, response) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const file = /^\/admin(\/|$)/.test(pathname) ? resolve(root, 'app-shell.html') : resolve(root, '.' + pathname);
      if (!file.startsWith(root + '/') || !existsSync(file)) { response.writeHead(404).end(); return; }
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }[extname(file)] || 'application/octet-stream';
      if (!encoded.has(file)) encoded.set(file, gzipSync(readFileSync(file)));
      response.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Cache-Control': extname(file) === '.html' ? 'no-store' : 'public, max-age=31536000, immutable' });
      response.end(encoded.get(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/admin/today`;
    const runs = [];
    try {
      for (let iteration = 0; iteration < 5; iteration++) {
        const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
        const page = await context.newPage(); const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        for (const cache of ['cold', 'warm']) {
          const started = Date.now(); await page.goto(url);
          await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
          const readyMs = Date.now() - started;
          await page.waitForLoadState('networkidle');
          const metrics = await page.evaluate(() => ({
            scripts: performance.getEntriesByType('resource').filter(item => item.initiatorType === 'script').map(item => ({ url: item.name, encoded: item.encodedBodySize, transferred: item.transferSize })),
            authMs: null, todayMs: null,
          }));
          runs.push({ iteration: iteration + 1, cache, readyMs, ...metrics });
        }
        await context.close();
      }
    } finally { await new Promise(resolve => server.close(resolve)); }
    const median = numbers => numbers.sort((a, b) => a - b)[Math.floor(numbers.length / 2)];
    const summary = { directory, coldMedianMs: median(runs.filter(r => r.cache === 'cold').map(r => r.readyMs)), warmMedianMs: median(runs.filter(r => r.cache === 'warm').map(r => r.readyMs)), coldJavascriptGzipBytes: median(runs.filter(r => r.cache === 'cold').map(r => r.scripts.reduce((sum, item) => sum + item.encoded, 0))) };
    report.push({ ...summary, runs });
    console.error(JSON.stringify(summary));
  }
  console.log(JSON.stringify({ profile: '1.6 Mbps, 150 ms latency, 4x CPU; service workers blocked; login only; auth/Today timings not measured', results: report }, null, 2));
} finally { await browser.close(); }
