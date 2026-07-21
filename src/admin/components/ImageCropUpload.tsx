import { useEffect, useState, type SyntheticEvent } from 'react';
import EasyCrop, { type Area } from 'react-easy-crop';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-easy-crop/react-easy-crop.css';
import { X } from 'lucide-react';
import type { ImageTransform } from '../types';

export interface ImageCropResult {
  file: File;
  transform: ImageTransform;
}

interface ImageCropUploadProps {
  source: File | string;
  initialCrop?: PixelCrop | null;
  initialCropPercentages?: { x: number; y: number; width: number; height: number } | null;
  outputWidth?: number;
  outputHeight?: number;
  maxOutputWidth?: number;
  maxOutputHeight?: number;
  showOutputSize?: boolean;
  shape?: 'rect' | 'circle';
  onApply: (result: ImageCropResult) => Promise<void> | void;
  onCancel: () => void;
}

export function ImageCropUpload({
  source,
  initialCrop,
  initialCropPercentages,
  outputWidth: initialOutputWidth,
  outputHeight: initialOutputHeight,
  maxOutputWidth,
  maxOutputHeight,
  showOutputSize = false,
  shape = 'rect',
  onApply,
  onCancel,
}: ImageCropUploadProps) {
  const [sourceFile, setSourceFile] = useState<File | null>(source instanceof File ? source : null);
  const [previewUrl, setPreviewUrl] = useState(source instanceof File ? URL.createObjectURL(source) : source);
  const [crop, setCrop] = useState<Crop>({ unit: 'px', x: 0, y: 0, width: 0, height: 0 });
  const [easyCropPosition, setEasyCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [outputWidth, setOutputWidth] = useState(initialOutputWidth ?? 0);
  const [outputHeight, setOutputHeight] = useState(initialOutputHeight ?? 0);
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [cropPercentages, setCropPercentages] = useState<{ x: number; y: number; width: number; height: number } | null>(initialCropPercentages ?? null);
  const [isLoading, setIsLoading] = useState(!(source instanceof File));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadSource = async () => {
      try {
        const file = source instanceof File
          ? source
          : new File([await (await fetch(source)).blob()], 'image.jpg', { type: 'image/jpeg' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setSourceFile(file);
        setPreviewUrl(objectUrl);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load image');
          setIsLoading(false);
        }
      }
    };

    loadSource();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const renderedWidth = image.getBoundingClientRect().width || image.width;
    const renderedHeight = image.getBoundingClientRect().height || image.height;
    if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return;

    const cropWidth = Math.min(naturalWidth, Math.max(1, Math.round(initialCrop?.width ?? naturalWidth)));
    const cropHeight = Math.min(naturalHeight, Math.max(1, Math.round(initialCrop?.height ?? naturalHeight)));
    const sourceCrop: PixelCrop = {
      unit: 'px',
      x: Math.max(0, Math.min(naturalWidth - cropWidth, Math.round(initialCrop?.x ?? 0))),
      y: Math.max(0, Math.min(naturalHeight - cropHeight, Math.round(initialCrop?.y ?? 0))),
      width: cropWidth,
      height: cropHeight,
    };

    setSourceSize({ width: naturalWidth, height: naturalHeight });
    setDisplaySize({ width: renderedWidth, height: renderedHeight });
    setOutputWidth(Math.min(initialOutputWidth ?? naturalWidth, maxOutputWidth ?? naturalWidth));
    setOutputHeight(Math.min(initialOutputHeight ?? naturalHeight, maxOutputHeight ?? naturalHeight));
    setPixelCrop(sourceCrop);
    setCrop({
      unit: 'px',
      x: sourceCrop.x * renderedWidth / naturalWidth,
      y: sourceCrop.y * renderedHeight / naturalHeight,
      width: sourceCrop.width * renderedWidth / naturalWidth,
      height: sourceCrop.height * renderedHeight / naturalHeight,
    });
    setIsLoading(false);
  };

  const handleCropComplete = (displayCrop: PixelCrop) => {
    if (!sourceSize.width || !sourceSize.height || !displaySize.width || !displaySize.height) return;
    const width = Math.max(1, Math.min(sourceSize.width, Math.round(displayCrop.width * sourceSize.width / displaySize.width)));
    const height = Math.max(1, Math.min(sourceSize.height, Math.round(displayCrop.height * sourceSize.height / displaySize.height)));
    const normalized: PixelCrop = {
      unit: 'px',
      x: Math.max(0, Math.min(sourceSize.width - width, Math.round(displayCrop.x * sourceSize.width / displaySize.width))),
      y: Math.max(0, Math.min(sourceSize.height - height, Math.round(displayCrop.y * sourceSize.height / displaySize.height))),
      width,
      height,
    };
    setPixelCrop(normalized);
  };

  const handleCircleCropComplete = (areaPercentages: Area, areaPixels: Area) => {
    const normalized: PixelCrop = {
      unit: 'px',
      x: Math.round(areaPixels.x),
      y: Math.round(areaPixels.y),
      width: Math.round(areaPixels.width),
      height: Math.round(areaPixels.height),
    };
    setPixelCrop(normalized);
    setCropPercentages({
      x: areaPercentages.x,
      y: areaPercentages.y,
      width: areaPercentages.width,
      height: areaPercentages.height,
    });
  };

  const handleApply = async () => {
    if (!sourceFile || !pixelCrop) return;
    setIsSaving(true);
    setError(null);
    try {
      const file = await createCroppedImage(
        sourceFile,
        pixelCrop,
        showOutputSize ? outputWidth : pixelCrop.width,
        showOutputSize ? outputHeight : pixelCrop.height,
      );
      await onApply({
        file,
        transform: {
          crop: pixelCrop,
          cropPercentages: shape === 'circle' ? cropPercentages : undefined,
          outputWidth: showOutputSize ? outputWidth : pixelCrop.width,
          outputHeight: showOutputSize ? outputHeight : pixelCrop.height,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Crop image</h2>
          <button type="button" onClick={onCancel} disabled={isSaving} className="p-1 hover:bg-gray-100 rounded" aria-label="Close crop editor">
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <div className={`relative min-h-[min(60vh,420px)] bg-gray-900 flex items-center justify-center ${shape === 'circle' ? 'h-[min(60vh,420px)]' : ''}`}>
          {isLoading ? <div className="text-white">Loading image...</div> : (
            shape === 'circle' ? (
              <div className="relative w-full h-full">
                <EasyCrop
                  image={previewUrl}
                  crop={easyCropPosition}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid
                  objectFit="contain"
                  onCropChange={setEasyCropPosition}
                  onZoomChange={setZoom}
                  onCropComplete={(areaPercentages, areaPixels) => handleCircleCropComplete(areaPercentages, areaPixels)}
                  initialCroppedAreaPercentages={initialCropPercentages ?? undefined}
                  initialCroppedAreaPixels={initialCropPercentages ? undefined : (initialCrop ?? undefined)}
                />
              </div>
            ) : (
              <ReactCrop crop={crop} onChange={setCrop} onComplete={handleCropComplete} keepSelection ruleOfThirds>
                <img src={previewUrl} alt="Crop preview" onLoad={handleImageLoad} className="max-h-[420px] max-w-full object-contain" />
              </ReactCrop>
            )
          )}
        </div>
        {shape === 'circle' && !isLoading && (
          <div className="px-4 pt-4">
            <label className="block text-sm text-gray-700">Zoom
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={event => setZoom(Number(event.target.value))} className="w-full mt-2 accent-blue-600" />
            </label>
          </div>
        )}
        {showOutputSize && (
          <div className="grid grid-cols-2 gap-3 p-4">
            <label className="text-sm text-gray-700">Output width
              <input type="number" min={1} max={maxOutputWidth} value={outputWidth} onChange={e => setOutputWidth(Math.min(maxOutputWidth ?? Number.MAX_SAFE_INTEGER, Math.max(1, Number(e.target.value))))} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
            <label className="text-sm text-gray-700">Output height
              <input type="number" min={1} max={maxOutputHeight} value={outputHeight} onChange={e => setOutputHeight(Math.min(maxOutputHeight ?? Number.MAX_SAFE_INTEGER, Math.max(1, Number(e.target.value))))} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
          </div>
        )}
        {error && <p className="px-4 text-sm text-red-600">{error}</p>}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isSaving} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button type="button" onClick={handleApply} disabled={isLoading || isSaving || !pixelCrop} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">{isSaving ? 'Processing...' : 'Apply crop'}</button>
        </div>
      </div>
    </div>
  );
}

async function createCroppedImage(file: File, crop: PixelCrop, outputWidth: number, outputHeight: number): Promise<File> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read image'));
      image.src = imageUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare image crop');
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to create cropped image')), file.type || 'image/jpeg', 0.92));
    return new File([blob], file.name, { type: file.type || 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
