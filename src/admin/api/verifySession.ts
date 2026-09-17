import { ApiError, ApiTimeoutError } from './http';

const STARTUP_DEADLINE_MS = 90_000;
const RETRY_DELAY_MS = 2_000;

/** Retry only read-only session checks; never retry login or other mutations. */
export async function verifySession<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new ApiTimeoutError()), STARTUP_DEADLINE_MS);
  try {
    for (;;) {
      controller.signal.throwIfAborted();
      try { return await operation(controller.signal); }
      catch (error) {
        controller.signal.throwIfAborted();
        const transient = error instanceof ApiTimeoutError || error instanceof TypeError ||
          (error instanceof ApiError && [502, 503, 504].includes(error.status));
        if (!transient || (typeof navigator !== 'undefined' && !navigator.onLine)) throw error;
        await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(delay); reject(controller.signal.reason); };
          const delay = setTimeout(() => {
            controller.signal.removeEventListener('abort', abort);
            resolve();
          }, RETRY_DELAY_MS);
          controller.signal.addEventListener('abort', abort, { once: true });
        });
      }
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
