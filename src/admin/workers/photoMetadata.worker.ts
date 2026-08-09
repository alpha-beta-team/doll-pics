/// <reference lib="webworker" />

import type {
  PhotoMetadataWorkerRequest,
  PhotoMetadataWorkerResponse,
} from './photoMetadata.protocol';

const workerScope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
const MODEL_ID = 'Xenova/vit-gpt2-image-captioning';
const TRANSFORMERS_RUNTIME_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1';

interface CaptionOutput {
  generated_text: string;
}

interface ImageCaptioner {
  (image: Blob, options: {
    max_new_tokens: number;
    num_beams: number;
    do_sample: boolean;
    repetition_penalty: number;
  }): Promise<CaptionOutput[]>;
  dispose: () => Promise<void>;
}

const CAPTION_OPTIONS = {
  max_new_tokens: 40,
  num_beams: 3,
  do_sample: false,
  repetition_penalty: 1.1,
} as const;

interface ProgressInformation {
  status: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

interface TransformersRuntime {
  env: {
    useBrowserCache: boolean;
    useWasmCache: boolean;
  };
  pipeline: (
    task: 'image-to-text',
    model: string,
    options: {
      device: 'webgpu' | 'wasm';
      dtype: 'q8';
      progress_callback: (information: ProgressInformation) => void;
    },
  ) => Promise<ImageCaptioner>;
}

let runtimePromise: Promise<TransformersRuntime> | null = null;

async function loadRuntime(): Promise<TransformersRuntime> {
  if (!runtimePromise) {
    runtimePromise = import(/* @vite-ignore */ TRANSFORMERS_RUNTIME_URL) as Promise<TransformersRuntime>;
  }
  const runtime = await runtimePromise;
  runtime.env.useBrowserCache = true;
  runtime.env.useWasmCache = true;
  return runtime;
}

let captionerPromise: Promise<ImageCaptioner> | null = null;
let forceWasm = false;
let highestModelProgress = 0;
const cancelledRequests = new Set<string>();

function post(message: PhotoMetadataWorkerResponse) {
  workerScope.postMessage(message);
}

function reportModelProgress(information: ProgressInformation) {
  // Transformers also emits a `progress` event for each individual model file.
  // Using that value as the overall percentage makes the UI jump backwards, so
  // it only refreshes download activity while aggregate progress stays intact.
  if (information.status === 'progress') {
    post({
      type: 'model-progress',
      stage: 'downloading_model',
      progress: highestModelProgress || undefined,
    });
    return;
  }
  // Only the aggregate `progress_total` event is used for determinate progress.
  if (information.status !== 'progress_total') return;
  const nextProgress = typeof information.progress === 'number'
    ? Math.max(highestModelProgress, Math.min(99, Math.round(information.progress)))
    : undefined;
  if (nextProgress !== undefined) highestModelProgress = nextProgress;
  post({
    type: 'model-progress',
    stage: 'downloading_model',
    progress: nextProgress,
    loadedBytes: typeof information.loaded === 'number' ? information.loaded : undefined,
    totalBytes: typeof information.total === 'number' ? information.total : undefined,
  });
}

function loadCaptioner(): Promise<ImageCaptioner> {
  if (!captionerPromise) {
    const hasWebGpu = 'gpu' in navigator && Boolean(navigator.gpu);
    const device = !forceWasm && hasWebGpu ? 'webgpu' : 'wasm';
    post({ type: 'model-progress', stage: 'preparing_model' });
    captionerPromise = loadRuntime().then(runtime => runtime.pipeline('image-to-text', MODEL_ID, {
      device,
      dtype: 'q8',
      progress_callback: reportModelProgress,
    })).catch(async webGpuError => {
      if (device !== 'webgpu') throw webGpuError;
      forceWasm = true;
      post({ type: 'backend-fallback' });
      post({ type: 'model-progress', stage: 'loading_model', progress: highestModelProgress || undefined });
      const runtime = await loadRuntime();
      return runtime.pipeline('image-to-text', MODEL_ID, {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: reportModelProgress,
      });
    }).then(captioner => {
      highestModelProgress = 100;
      post({ type: 'model-ready' });
      return captioner;
    });
  }
  return captionerPromise;
}

async function generateCaption(request: Extract<PhotoMetadataWorkerRequest, { type: 'generate' }>) {
  if (cancelledRequests.delete(request.requestId)) return;
  if (request.preferWasm) forceWasm = true;
  try {
    let captioner: ImageCaptioner;
    try {
      captioner = await loadCaptioner();
    } catch (loadError) {
      captionerPromise = null;
      highestModelProgress = 0;
      post({
        type: 'error',
        requestId: request.requestId,
        error: loadError instanceof Error ? loadError.message : 'The local caption model could not be loaded',
        fatal: true,
      });
      return;
    }
    if (cancelledRequests.delete(request.requestId)) return;
    post({ type: 'generating', requestId: request.requestId });
    let output;
    try {
      output = await captioner(request.image, CAPTION_OPTIONS);
    } catch (webGpuError) {
      if (forceWasm || !('gpu' in navigator) || !navigator.gpu) throw webGpuError;
      forceWasm = true;
      post({ type: 'backend-fallback' });
      await captioner.dispose();
      captionerPromise = null;
      highestModelProgress = 0;
      captioner = await loadCaptioner();
      output = await captioner(request.image, CAPTION_OPTIONS);
    }
    if (cancelledRequests.delete(request.requestId)) return;
    const caption = output[0]?.generated_text?.trim();
    if (!caption) throw new Error('The local model did not return a description');
    post({ type: 'result', requestId: request.requestId, caption });
  } catch (error) {
    post({
      type: 'error',
      requestId: request.requestId,
      error: error instanceof Error ? error.message : 'Local description generation failed',
      fatal: false,
    });
  }
}

let generationQueue = Promise.resolve();

workerScope.onmessage = (event: MessageEvent<PhotoMetadataWorkerRequest>) => {
  const request = event.data;
  if (request.type === 'cancel') {
    cancelledRequests.add(request.requestId);
    return;
  }
  generationQueue = generationQueue.then(() => generateCaption(request));
};
