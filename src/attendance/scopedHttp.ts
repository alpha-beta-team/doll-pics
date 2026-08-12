const API_BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001/api';

export class ScopedApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ScopedApiError';
  }
}

function errorMessage(body: Record<string, unknown>, fallback: string) {
  const message = body.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

export async function scopedRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null; kioskToken?: string | null } = {},
): Promise<T> {
  const { token, kioskToken, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (rest.body && !headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (kioskToken) headers.set('x-kiosk-token', kioskToken);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  } catch {
    throw new ScopedApiError('No connection. Check the internet and try again.', 0, {});
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText })) as Record<string, unknown>;
    throw new ScopedApiError(errorMessage(body, `Request failed (${response.status})`), response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
