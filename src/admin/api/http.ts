import { authStorage } from './authStorage';

const API_BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001/api';

type MongoDoc = Record<string, unknown> & { _id?: string; id?: string };

/** Map MongoDB `_id` → frontend `id` on a single document. */
export function normalizeId<T extends MongoDoc>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, id, ...rest } = doc;
  return { ...rest, id: (id ?? _id ?? '') as string } as Omit<T, '_id'> & { id: string };
}

export function normalizeIds<T extends MongoDoc>(docs: T[]) {
  return docs.map(normalizeId);
}

function getToken(): string | null {
  return authStorage.getToken();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get code() { return typeof this.body.code === 'string' ? this.body.code : undefined; }
}

export class ApiTimeoutError extends Error {
  constructor() { super('The request took too long. Check your connection and try again.'); this.name = 'ApiTimeoutError'; }
}

async function withTimeout<T>(signal: AbortSignal | null | undefined, timeoutMs: number | undefined, operation: (signal?: AbortSignal | null) => Promise<T>): Promise<T> {
  if (timeoutMs === undefined) return operation(signal);
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new ApiTimeoutError()), timeoutMs);
  try { return await operation(controller.signal); }
  catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const { auth = false, headers: customHeaders, timeoutMs, signal, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (rest.body && !headers.has('Content-Type') && !(rest.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  // Keep the deadline active through response-body decoding, not just headers.
  return withTimeout(signal, timeoutMs, async requestSignal => {
    const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, signal: requestSignal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      if (requestSignal?.aborted) throw requestSignal.reason;
      const message = Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? `Request failed (${res.status})`);
      throw new ApiError(message, res.status, err as Record<string, unknown>);
    }
    if (res.status === 204) return undefined as T;
    return await res.json() as T;
  });
}

export async function requestBlob(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<Blob> {
  const { auth = false, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? `Request failed (${res.status})`);
    throw new ApiError(message, res.status, err as Record<string, unknown>);
  }
  return res.blob();
}
