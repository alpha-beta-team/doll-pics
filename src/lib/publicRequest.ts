export const PUBLIC_GET_TIMEOUT_MS = 8000;
export const PUBLIC_GET_RETRY_DELAY_MS = 300;

export class ApiError extends Error {
  constructor(public status: number, public messages: string[]) {
    super(messages.join(', ') || `API error ${status}`);
    this.name = 'ApiError';
  }
}

export type PublicFailureKind = 'timeout' | 'network' | 'cancelled' | 'http' | 'invalid_response';

export class PublicRequestError extends Error {
  constructor(public kind: Exclude<PublicFailureKind, 'http'>) {
    super(`Public request ${kind}`);
    this.name = kind === 'cancelled' ? 'AbortError' : 'PublicRequestError';
  }
}

/** Log categories only. Never include response bodies, URLs, queries, or customer data. */
export function publicFailure(error: unknown): { kind: PublicFailureKind; status?: number } {
  if (error instanceof ApiError) return { kind: 'http', status: error.status };
  if (error instanceof PublicRequestError) return { kind: error.kind };
  return { kind: 'invalid_response' };
}

function retryable(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 408 || error.status === 429 || error.status >= 500;
  return error instanceof PublicRequestError && (error.kind === 'network' || error.kind === 'timeout');
}

function pause(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new PublicRequestError('cancelled')); return; }
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      reject(new PublicRequestError('cancelled'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

async function readResponse<T>(fetcher: typeof fetch, url: string, init?: RequestInit): Promise<T> {
  const res = await fetcher(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
    const raw = body?.message;
    throw new ApiError(res.status, Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [`API error ${res.status}`]);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Factory keeps request state local and permits transport/deadline tests without real network calls. */
export function createPublicFetch(baseUrl: string, options: {
  fetcher?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
} = {}) {
  const inflight = new Map<string, Promise<unknown>>();
  const fetcher = options.fetcher ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const timeoutMs = options.timeoutMs ?? PUBLIC_GET_TIMEOUT_MS;
  const retryDelayMs = options.retryDelayMs ?? PUBLIC_GET_RETRY_DELAY_MS;

  async function attempt<T>(path: string, init?: RequestInit): Promise<T> {
    if (init?.signal?.aborted) throw new PublicRequestError('cancelled');
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    init?.signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    let rejectAbort: () => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new PublicRequestError(timedOut ? 'timeout' : 'cancelled'));
      controller.signal.addEventListener('abort', rejectAbort, { once: true });
    });
    try {
      // The deadline covers response-body consumption too, not just headers.
      return await Promise.race([
        readResponse<T>(fetcher, `${baseUrl}${path}`, { ...init, signal: controller.signal }),
        aborted,
      ]);
    } catch (error) {
      if (controller.signal.aborted) throw new PublicRequestError(timedOut ? 'timeout' : 'cancelled');
      if (error instanceof ApiError) throw error;
      throw new PublicRequestError(error instanceof SyntaxError ? 'invalid_response' : 'network');
    } finally {
      clearTimeout(timer);
      init?.signal?.removeEventListener('abort', cancel);
      controller.signal.removeEventListener('abort', rejectAbort);
    }
  }

  async function get<T>(path: string, init?: RequestInit): Promise<T> {
    try { return await attempt<T>(path, init); }
    catch (error) {
      if (!retryable(error) || init?.signal?.aborted) throw error;
      await pause(retryDelayMs, init?.signal);
      return attempt<T>(path, init);
    }
  }

  return function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
    // Never retry a write: a failed response may follow a successfully saved enquiry.
    if ((init?.method ?? 'GET').toUpperCase() !== 'GET') return readResponse<T>(fetcher, `${baseUrl}${path}`, init);
    // Signal-bearing/custom requests retain independent cancellation and headers.
    if (init !== undefined) return get<T>(path, init);
    const existing = inflight.get(path);
    if (existing) return existing as Promise<T>;
    const request = get<T>(path);
    inflight.set(path, request);
    const release = () => { if (inflight.get(path) === request) inflight.delete(path); };
    request.then(release, release);
    return request;
  };
}
