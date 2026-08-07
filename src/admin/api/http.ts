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

export async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  if (rest.body && !headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Request failed (${res.status})`);
    throw new ApiError(message, res.status, err as Record<string, unknown>);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
