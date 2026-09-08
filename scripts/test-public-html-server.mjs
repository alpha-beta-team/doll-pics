// Isolated production build: only public fixture APIs are available, no credentials or writes.
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, existsSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { spawn } from 'node:child_process';

const hosting = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const hostingHeaders = hosting.headers;
// Vercel cleanUrls rewrites target the served URL, not the on-disk HTML filename.
if (hosting.cleanUrls && hosting.rewrites.some(rule => /\.html(?:$|[?#])/.test(rule.destination))) {
  throw new Error('cleanUrls requires extensionless rewrite destinations');
}
const matchesRoute = (source, pathname) => pathname === source ||
  (source.endsWith('/:path*') && pathname.startsWith(source.replace('/:path*', '') + '/'));
const output = mkdtempSync(join(tmpdir(), 'doll-public-html-'));
// An optional temporary fixture supports controlled CMS-edit/rebuild acceptance
// without editing tracked fixtures or writing to a live CMS.
const responses = JSON.parse(readFileSync(process.env.PUBLIC_HTML_FIXTURE_FILE
  || new URL('../tests/public-html/fixtures.json', import.meta.url), 'utf8'));
const api = createServer((req, res) => {
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(responses[req.url] ?? []));
});
await new Promise(resolve => api.listen(4191, '127.0.0.1', resolve));
const env = { ...process.env, VITE_API_URL: 'http://127.0.0.1:4191/api', API_URL: '', SEO_REQUIRE_CMS: 'false', PRERENDER_DIST_DIR: output, VITE_GA_MEASUREMENT_ID: 'G-LOCALTEST', VITE_META_PIXEL_ID: '' };
let child;
let frontend;
function cleanup() {
  child?.kill('SIGTERM');
  api.close();
  frontend?.close();
  rmSync(output, { recursive: true, force: true });
}
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('SIGINT', () => { cleanup(); process.exit(0); });
async function run(args) {
  await new Promise((resolve, reject) => {
    child = spawn('npx', args, { env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`)));
  });
}
try {
  await run(['vite', 'build', '--outDir', output, '--emptyOutDir']);
  await run(['tsx', 'scripts/prerender.ts']);
  // Match directory-index hosting for clean URLs; Vite preview otherwise serves
  // the SPA home shell for an extensionless path without a trailing slash.
  frontend = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    // Fixture adapter for declared headers; actual hosting acceptance is separate.
    for (const rule of hostingHeaders) {
      const prefix = rule.source.replace('/:path*', '');
      if (pathname === rule.source || (rule.source.endsWith('/:path*') && pathname.startsWith(prefix + '/'))) {
        for (const header of rule.headers) res.setHeader(header.key, header.value);
      }
    }
    let file = pathname.startsWith('/fixture-media/') ? join(output, 'og-share.jpg') : resolve(output, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(output + '/') && file !== output) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      const rewrite = hosting.rewrites.find(rule => matchesRoute(rule.source, pathname));
      const destination = rewrite?.destination;
      const target = destination && resolve(output, '.' + destination + (hosting.cleanUrls ? '.html' : ''));
      if (target && target.startsWith(output + '/') && existsSync(target)) {
        file = target;
      } else {
        file = join(output, '404.html');
        res.statusCode = 404;
      }
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    let body = readFileSync(file);
    // A client-only baseline using the same bundle and fixtures for visual comparisons.
    if (extname(file) === '.html' && new URL(req.url, 'http://localhost').searchParams.has('client-only')) {
      const { JSDOM } = await import('jsdom');
      const document = new JSDOM(body.toString()).window.document;
      document.querySelector('#root')?.replaceChildren();
      document.querySelector('#root')?.removeAttribute('data-public-html');
      document.querySelector('#public-page-snapshot')?.remove();
      body = Buffer.from(document.documentElement.outerHTML);
    }
    res.end(body);
  });
  frontend.listen(4180, '127.0.0.1');
} catch (error) { cleanup(); throw error; }
