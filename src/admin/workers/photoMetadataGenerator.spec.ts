import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  PhotoMetadataWorkerRequest,
  PhotoMetadataWorkerResponse,
} from './photoMetadata.protocol';

test('caption generator maps worker progress and results by request id', async () => {
  const originalWorker = globalThis.Worker;

  class MockWorker {
    onmessage: ((event: MessageEvent<PhotoMetadataWorkerResponse>) => void) | null = null;
    onerror: OnErrorEventHandler = null;

    postMessage(request: PhotoMetadataWorkerRequest) {
      if (request.type !== 'generate') return;
      queueMicrotask(() => {
        this.onmessage?.({
          data: {
            type: 'model-progress',
            stage: 'downloading_model',
            progress: 45,
            loadedBytes: 110_000_000,
            totalBytes: 250_000_000,
          },
        } as MessageEvent<PhotoMetadataWorkerResponse>);
        this.onmessage?.({
          data: { type: 'model-ready' },
        } as MessageEvent<PhotoMetadataWorkerResponse>);
        this.onmessage?.({
          data: { type: 'generating', requestId: request.requestId },
        } as MessageEvent<PhotoMetadataWorkerResponse>);
        this.onmessage?.({
          data: { type: 'result', requestId: request.requestId, caption: 'a parent holding a baby' },
        } as MessageEvent<PhotoMetadataWorkerResponse>);
      });
    }

    terminate() {}
  }

  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    writable: true,
    value: MockWorker as unknown as typeof Worker,
  });

  try {
    const { generatePhotoCaption, resetPhotoCaptionWorker } = await import('./photoMetadataGenerator');
    const progress: string[] = [];
    const caption = await generatePhotoCaption('photo-1', new Blob(['image']), update => {
      progress.push(`${update.stage}:${update.progress}`);
    });
    assert.equal(caption, 'a parent holding a baby');
    assert.deepEqual(progress, ['downloading_model:45', 'queued:100', 'generating:100']);
    resetPhotoCaptionWorker();
  } finally {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: originalWorker,
    });
  }
});

test('cancelling a caption stops an otherwise idle worker', async () => {
  const originalWorker = globalThis.Worker;
  const requests: PhotoMetadataWorkerRequest[] = [];
  let terminated = false;

  class MockWorker {
    onmessage: ((event: MessageEvent<PhotoMetadataWorkerResponse>) => void) | null = null;
    onerror: OnErrorEventHandler = null;

    postMessage(request: PhotoMetadataWorkerRequest) {
      requests.push(request);
    }

    terminate() {
      terminated = true;
    }
  }

  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    writable: true,
    value: MockWorker as unknown as typeof Worker,
  });

  try {
    const { cancelPhotoCaption, generatePhotoCaption } = await import('./photoMetadataGenerator');
    const caption = generatePhotoCaption('photo-cancel', new Blob(['image']));
    cancelPhotoCaption('photo-cancel');
    await assert.rejects(caption, /cancelled/);
    assert.deepEqual(requests.map(request => request.type), ['generate', 'cancel']);
    assert.equal(terminated, true);
  } finally {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: originalWorker,
    });
  }
});

test('a fatal model load failure stops retries for every queued photo', async () => {
  const originalWorker = globalThis.Worker;
  let firstRequestId = '';
  let generateCount = 0;
  let terminated = false;

  class MockWorker {
    onmessage: ((event: MessageEvent<PhotoMetadataWorkerResponse>) => void) | null = null;
    onerror: OnErrorEventHandler = null;

    postMessage(request: PhotoMetadataWorkerRequest) {
      if (request.type !== 'generate') return;
      generateCount += 1;
      firstRequestId ||= request.requestId;
      if (generateCount === 2) {
        queueMicrotask(() => this.onmessage?.({
          data: {
            type: 'error',
            requestId: firstRequestId,
            error: 'Model download failed',
            fatal: true,
          },
        } as MessageEvent<PhotoMetadataWorkerResponse>));
      }
    }

    terminate() {
      terminated = true;
    }
  }

  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    writable: true,
    value: MockWorker as unknown as typeof Worker,
  });

  try {
    const { generatePhotoCaption } = await import('./photoMetadataGenerator');
    const first = generatePhotoCaption('photo-fatal-1', new Blob(['image']));
    const second = generatePhotoCaption('photo-fatal-2', new Blob(['image']));
    await Promise.all([
      assert.rejects(first, /Model download failed/),
      assert.rejects(second, /Model download failed/),
    ]);
    assert.equal(terminated, true);
  } finally {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: originalWorker,
    });
  }
});
