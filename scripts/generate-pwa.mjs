import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dist = resolve(process.env.PRERENDER_DIST_DIR || 'dist');
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));
const html = readFileSync(join(dist, 'app-shell.html'), 'utf8');
const worker = readFileSync(new URL('../public/admin-sw.js', import.meta.url), 'utf8');
const files = new Set();
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing startup chunk: ${key}`);
  visited.add(key);
  files.add('/' + chunk.file);
  for (const css of chunk.css || []) files.add('/' + css);
  for (const asset of chunk.assets || []) {
    if (/inter-latin-.*\.woff2$/.test(asset)) files.add('/' + asset);
  }
  for (const dependency of chunk.imports || []) visit(dependency);
}
visit('index.html');
for (const name of ['AdminApp', 'EmployeeApp', 'KioskApp']) {
  const key = Object.keys(manifest).find(key => manifest[key].name === name);
  if (!key) throw new Error(`Missing ${name} startup entry`);
  visit(key);
}
// Prerender emits this CSS after Vite, so it is not part of Vite's manifest.
for (const match of html.matchAll(/\/assets\/admin-theme-[\w-]+\.css/g)) files.add(match[0]);
for (const file of ['/manifest.webmanifest', '/employee.webmanifest', '/kiosk.webmanifest']) {
  files.add(file);
  const webmanifest = JSON.parse(readFileSync(join(dist, file), 'utf8'));
  for (const icon of webmanifest.icons || []) files.add(new URL(icon.src, 'https://local.invalid').pathname);
}
for (const icon of ['/logo-doll.png', '/apple-touch-icon.png', '/favicon-32x32.png', '/favicon-16x16.png']) files.add(icon);
const hash = createHash('sha256').update(html).update(worker);
for (const file of [...files].sort()) hash.update(file).update(readFileSync(join(dist, file)));
const revision = hash.digest('hex').slice(0, 16);
const shell = `/assets/work-shell-${revision}.html`;
mkdirSync(join(dist, 'assets'), { recursive: true });
writeFileSync(join(dist, shell), html);
files.add(shell);
const build = { version: `${Date.now()}-${revision}`, shell, precache: [...files].sort() };
if (!worker.includes('/*__PWA_BUILD__*/ null')) throw new Error('Worker build marker missing');
writeFileSync(join(dist, 'admin-sw.js'), worker.replace('/*__PWA_BUILD__*/ null', JSON.stringify(build)));
writeFileSync(join(dist, 'pwa-build.json'), JSON.stringify(build, null, 2) + '\n');
console.log(`PWA ${build.version}: ${files.size} essential assets; deferred pages excluded.`);
