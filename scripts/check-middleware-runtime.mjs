import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise emitted Node ESM, not tsx/Vite resolution, to catch middleware startup failures.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = mkdtempSync(join(tmpdir(), 'doll-middleware-runtime-'));
const originalFetch = globalThis.fetch;
try {
  const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
  const program = ts.createProgram([join(root, 'middleware.ts')], { ...parsed.options, noEmit: false, outDir: output });
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
  const emitted = program.emit();
  assert.equal(emitted.emitSkipped, false);
  writeFileSync(join(output, 'package.json'), '{"type":"module"}');
  const { default: middleware, config: runtime } = await import(pathToFileURL(join(output, 'middleware.js')).href);
  assert.equal(runtime.runtime, 'nodejs');
  let fetches = 0;
  let payload = { version: 1, paths: ['/custom-session'] };
  globalThis.fetch = async () => { fetches++; return Response.json(payload); };
  let checked = 0;
  for (const method of ['GET', 'HEAD']) {
    for (const [input, expected] of [
      ['/Gallery/?utm_source=qa', '/gallery?utm_source=qa'],
      ['/CUSTOM-SESSION/?a=1', '/custom-session?a=1'],
      ['/gallery', null], ['/Unknown', null], ['/Admin/Bookings', null],
      ['/employee/Dashboard', null], ['/quotation/TokenABC', null],
      ['/api/Photos', null], ['/custom%2FSession', null], ['//Gallery', null],
    ]) {
      const response = await middleware(new Request('https://example.test' + input, { method }));
      assert.equal(response?.status, expected ? 308 : undefined, input);
      if (expected) assert.equal(response.headers.get('location'), 'https://example.test' + expected);
      checked++;
    }
  }
  const count = fetches;
  assert.equal(await middleware(new Request('https://example.test/CUSTOM-SESSION', { method: 'POST' })), undefined);
  assert.equal(fetches, count);
  checked++;
  for (const value of [null, {}, { version: 2, paths: ['/custom-session'] }, { version: 1, paths: ['/admin'] }, { version: 1, paths: [42] }]) {
    payload = value;
    assert.equal(await middleware(new Request('https://example.test/CUSTOM-SESSION')), undefined);
    checked++;
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal(await middleware(new Request('https://example.test/CUSTOM-SESSION')), undefined);
  checked++;
  console.log(`Emitted middleware runtime passed: ${checked} redirect/exclusion/failure checks.`);
} finally {
  globalThis.fetch = originalFetch;
  rmSync(output, { recursive: true, force: true });
}
