export interface GeneratePhotoCaptionRequest {
  type: 'generate';
  requestId: string;
  image: Blob;
  preferWasm?: boolean;
}

export interface CancelPhotoCaptionRequest {
  type: 'cancel';
  requestId: string;
}

export type PhotoMetadataWorkerRequest = GeneratePhotoCaptionRequest | CancelPhotoCaptionRequest;

export type PhotoModelLoadStage = 'preparing_model' | 'downloading_model' | 'loading_model';

export type PhotoMetadataWorkerResponse =
  | {
      type: 'model-progress';
      stage: PhotoModelLoadStage;
      progress?: number;
      loadedBytes?: number;
      totalBytes?: number;
    }
  | { type: 'model-ready' }
  | { type: 'backend-fallback' }
  | { type: 'generating'; requestId: string }
  | { type: 'result'; requestId: string; caption: string }
  | { type: 'error'; requestId: string; error: string; fatal?: boolean };

export type PhotoCaptionProgress =
  | {
      stage: PhotoModelLoadStage;
      progress?: number;
      loadedBytes?: number;
      totalBytes?: number;
    }
  | { stage: 'queued'; progress: number }
  | { stage: 'generating'; progress: number };
