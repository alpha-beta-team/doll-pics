import test from 'node:test';
import assert from 'node:assert/strict';
import { request, ApiTimeoutError } from '../../src/admin/api/http';

function hangingFetch(_url: unknown, options?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    if (options?.signal?.aborted) reject(options.signal.reason);
    else options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
  });
}

test('startup request times out without retrying', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = ((url, options) => { calls++; return hangingFetch(url, options); }) as typeof fetch;
  try { await assert.rejects(request('/test', { timeoutMs: 20 }), ApiTimeoutError); assert.equal(calls, 1); }
  finally { globalThis.fetch = original; }
});

test('caller cancellation and an already aborted signal preserve their reason', async () => {
  const original = globalThis.fetch; globalThis.fetch = hangingFetch as typeof fetch;
  try {
    for (const early of [true, false]) {
      const controller = new AbortController(); const reason = new Error('Caller cancelled');
      if (early) controller.abort(reason);
      const pending = request('/test', { signal: controller.signal, timeoutMs: 1000 });
      if (!early) controller.abort(reason);
      await assert.rejects(pending, error => error === reason);
    }
  } finally { globalThis.fetch = original; }
});

test('deadline includes body decoding and is cleared after success', async () => {
  const original = globalThis.fetch; let signal: AbortSignal | null | undefined;
  globalThis.fetch = (async (_url, options) => {
    signal = options?.signal;
    return { ok: true, status: 200, json: () => hangingFetch('', options) } as unknown as Response;
  }) as typeof fetch;
  try {
    await assert.rejects(request('/test', { timeoutMs: 20 }), ApiTimeoutError);
    globalThis.fetch = (async (_url, options) => { signal = options?.signal; return Response.json({ ok: true }); }) as typeof fetch;
    assert.deepEqual(await request('/test', { timeoutMs: 20 }), { ok: true });
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal(signal?.aborted, false);
  } finally { globalThis.fetch = original; }
});
