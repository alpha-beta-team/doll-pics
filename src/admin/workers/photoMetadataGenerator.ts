import type {
  PhotoCaptionProgress,
  PhotoMetadataWorkerRequest,
  PhotoMetadataWorkerResponse,
} from './photoMetadata.protocol';

interface PendingCaption {
  resolve: (caption: string) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: PhotoCaptionProgress) => void;
  inactivityTimer?: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let preferWasm = false;
const pendingCaptions = new Map<string, PendingCaption>();
const MODEL_INACTIVITY_TIMEOUT_MS = 120_000;

function clearInactivityTimer(pending: PendingCaption) {
  if (pending.inactivityTimer) clearTimeout(pending.inactivityTimer);
  pending.inactivityTimer = undefined;
}

function resetInactivityTimer(requestId: string) {
  const pending = pendingCaptions.get(requestId);
  if (!pending) return;
  clearInactivityTimer(pending);
  pending.inactivityTimer = setTimeout(() => {
    resetPhotoCaptionWorker('The local model stopped responding. Safe photo details were added instead.');
  }, MODEL_INACTIVITY_TIMEOUT_MS);
}

function rejectAll(message: string) {
  pendingCaptions.forEach(pending => {
    clearInactivityTimer(pending);
    pending.reject(new Error(message));
  });
  pendingCaptions.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./photoMetadata.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<PhotoMetadataWorkerResponse>) => {
    const message = event.data;
    if (message.type === 'model-progress') {
      pendingCaptions.forEach((pending, requestId) => {
        pending.onProgress?.({
          stage: message.stage,
          progress: message.progress,
          loadedBytes: message.loadedBytes,
          totalBytes: message.totalBytes,
        });
        resetInactivityTimer(requestId);
      });
      return;
    }
    if (message.type === 'model-ready') {
      pendingCaptions.forEach(pending => {
        clearInactivityTimer(pending);
        pending.onProgress?.({ stage: 'queued', progress: 100 });
      });
      return;
    }
    if (message.type === 'backend-fallback') {
      preferWasm = true;
      return;
    }
    const pending = pendingCaptions.get(message.requestId);
    if (!pending) return;
    if (message.type === 'generating') {
      resetInactivityTimer(message.requestId);
      pending.onProgress?.({ stage: 'generating', progress: 100 });
      return;
    }
    if (message.type === 'error' && message.fatal) {
      resetPhotoCaptionWorker(message.error);
      return;
    }
    pendingCaptions.delete(message.requestId);
    clearInactivityTimer(pending);
    if (message.type === 'result') pending.resolve(message.caption);
    else pending.reject(new Error(message.error));
  };
  worker.onerror = () => {
    rejectAll('The local photo description worker could not start');
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export function generatePhotoCaption(
  requestId: string,
  image: Blob,
  onProgress?: (progress: PhotoCaptionProgress) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingCaptions.set(requestId, { resolve, reject, onProgress });
    const request: PhotoMetadataWorkerRequest = {
      type: 'generate',
      requestId,
      image,
      preferWasm,
    };
    try {
      getWorker().postMessage(request);
    } catch (error) {
      pendingCaptions.delete(requestId);
      reject(error instanceof Error ? error : new Error('Could not start local description generation'));
    }
  });
}

export function cancelPhotoCaption(requestId: string) {
  const pending = pendingCaptions.get(requestId);
  if (!pending) return;
  pendingCaptions.delete(requestId);
  clearInactivityTimer(pending);
  pending.reject(new Error('Local photo detail generation was cancelled'));
  worker?.postMessage({ type: 'cancel', requestId } satisfies PhotoMetadataWorkerRequest);
  if (pendingCaptions.size === 0) {
    worker?.terminate();
    worker = null;
  }
}

export function resetPhotoCaptionWorker(message = 'Local photo detail generation was stopped') {
  worker?.terminate();
  worker = null;
  rejectAll(message);
}
