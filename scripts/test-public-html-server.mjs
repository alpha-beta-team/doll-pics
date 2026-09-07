// Isolated production build: only public fixture APIs are available, no credentials or writes.
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, existsSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { spawn } from 'node:child_process';

const output = mkdtempSync(join(tmpdir(), 'doll-public-html-'));
const photo = { id: 'fixture-photo', title: 'Newborn portrait from CMS', variants: { original: { url: 'http://127.0.0.1:4180/og-share.jpg' } } };
const responses = {
  '/api/site-content': { serviceNavLinks: [
    { label: 'Newborn', path: '/newborn-baby-photography-erode', heading: 'Newborn sessions from the build', description: 'A gentle studio session.', sections: [{ heading: 'A calm newborn session', body: 'We make time for feeding, cuddles and gentle portraits.' }], lead: 'Safe text </script><script>window.snapshotInjected=true</script>', isPublished: true },
    { label: 'PRIVATE_DRAFT_SENTINEL', path: '/private-draft', isPublished: false },
  ], internalSecret: 'PRIVATE_FIELD_SENTINEL' },
  '/api/package-categories': [],
  '/api/hero-slides': [],
  '/api/categories/newborn': { name: 'Newborn', slug: 'newborn', coverPhotoId: photo },
  '/api/photos?category=newborn&limit=30': [photo],
};
const api = createServer((req, res) => {
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(responses[req.url] ?? []));
});
await new Promise(resolve => api.listen(4191, '127.0.0.1', resolve));
const env = { ...process.env, VITE_API_URL: 'http://127.0.0.1:4191/api', API_URL: '', SEO_REQUIRE_CMS: 'false', PRERENDER_DIST_DIR: output, VITE_GA_MEASUREMENT_ID: '', VITE_META_PIXEL_ID: '' };
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
  frontend = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    let file = resolve(output, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(output + '/') && file !== output) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      const privateRoute = /^\/(admin|employee|kiosk|quotation)(\/|$)/.test(pathname);
      file = join(output, privateRoute ? 'index.html' : '404.html');
      res.statusCode = privateRoute ? 200 : 404;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
  frontend.listen(4180, '127.0.0.1');
} catch (error) { cleanup(); throw error; }
