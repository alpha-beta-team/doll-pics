import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Load KEY=VALUE from .env files into process.env (do not override existing). */
export function loadEnvFiles(files = ['.env.local', '.env']) {
  for (const file of files) {
    const full = join(root, file);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

export function getSiteUrl() {
  return (process.env.VITE_SITE_URL || 'https://dollpictures.in').replace(
    /\/$/,
    '',
  );
}

export function getApiBase() {
  return (process.env.VITE_API_URL || process.env.API_URL || '').replace(
    /\/$/,
    '',
  );
}

export function normalizePath(path) {
  if (!path || typeof path !== 'string') return '';
  let next = path.trim();
  if (!next) return '';
  if (!next.startsWith('/')) next = `/${next}`;
  if (next.length > 1 && next.endsWith('/')) next = next.slice(0, -1);
  return next;
}

export function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

export async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

export { root };
