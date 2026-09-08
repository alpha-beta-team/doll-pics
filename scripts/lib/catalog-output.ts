import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePublicLandingPath } from '../../src/lib/publicRoutePath';

/** A fresh Vite build clears dist; standalone prerender also retires its own old pages. */
export function removeRetiredCatalogPages(distDir: string, currentPaths: string[]): string[] {
  const manifest = join(distDir, 'public-catalog.json');
  if (!existsSync(manifest)) return [];
  const previous: { paths?: unknown } = JSON.parse(readFileSync(manifest, 'utf8'));
  if (!Array.isArray(previous.paths)) throw new Error('Invalid previous public catalog paths');
  const current = new Set(currentPaths);
  const retired: string[] = [];
  for (const path of previous.paths) {
    if (typeof path !== 'string' || normalizePublicLandingPath(path) !== path || current.has(path)) continue;
    const file = join(distDir, path.slice(1), 'index.html');
    if (existsSync(file)) unlinkSync(file);
    retired.push(path);
  }
  return retired;
}
