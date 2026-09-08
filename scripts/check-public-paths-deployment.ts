import { fileURLToPath } from 'node:url';
import { parseArguments, validateReleaseCatalog } from './check-public-html-deployment';

/** Direct HTTP verification; run after deploying the canonical-path middleware. */
export async function checkPublicPaths(baseUrl: string, fetchImpl = fetch) {
  const response = await fetchImpl(new URL('/public-catalog.json', baseUrl));
  if (!response.ok) throw new Error(`public catalog HTTP ${response.status}`);
  const catalog: unknown = await response.json();
  validateReleaseCatalog(catalog);
  const query = '?utm_source=CaseTest&opaque=AbC%2FDeF%2B12&tag=A&tag=b';
  const failures: string[] = [];
  let checked = 0;
  for (const path of catalog.paths.filter(path => path !== '/')) {
    for (const variant of [path.toUpperCase(), `${path}/`, `${path.toUpperCase()}/`]) {
      checked++;
      const result = await fetchImpl(new URL(variant + query, baseUrl), { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
      const location = result.headers.get('location');
      if (result.status !== 308 || !location || new URL(location, baseUrl).href !== new URL(path + query, baseUrl).href) {
        failures.push(`${variant}: expected 308 to ${path} with unchanged query, got HTTP ${result.status} / ${location}`);
      }
    }
  }
  for (const path of ['/F08-Unknown-Route/', '/quotation/F08_AbC-xY9/', '/admin/F08_AbC-xY9/', '/employee/F08_AbC-xY9/', '/kiosk/F08_AbC-xY9/']) {
    checked++;
    const result = await fetchImpl(new URL(path + query, baseUrl), { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    if (result.headers.has('location') || (path.startsWith('/F08-') && result.status !== 404)) {
      failures.push(`${path}: unknown/private path was redirected or unknown URL lost its 404`);
    }
  }
  return { checked, failures };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void (async () => {
    const { baseUrl } = parseArguments(process.argv.slice(2));
    const { checked, failures } = await checkPublicPaths(baseUrl);
    if (failures.length) throw new Error(`Public path smoke failed:\n- ${failures.join('\n- ')}`);
    console.log(`Public path smoke passed: ${checked} case/slash/query and unknown/private checks.`);
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
