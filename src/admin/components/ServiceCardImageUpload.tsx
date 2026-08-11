import { useRef, useState, type DragEvent } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { api } from '../api/client';
import { ImageCropUpload } from './ImageCropUpload';

const SERVICE_CARD_ASPECT_RATIO = 4 / 3;
const SUPPORTED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
const MAX_UPLOAD_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? '25');
const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function ServiceCardImageUpload({
  value,
  disabled = false,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file: File) => {
    if (!SUPPORTED_UPLOAD_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setError(`Maximum upload size is ${MAX_UPLOAD_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
    setCropSource(file);
    setError(null);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-admin-secondary">
        Card image
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl border border-dashed border-admin-control bg-admin-muted px-3 text-left outline-none transition hover:border-admin-primary/50 hover:bg-admin-surface focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-canvas disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-admin-surface text-admin-primary shadow-sm">
          {value ? (
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-admin-text">
            {value ? 'Replace image' : 'Upload image'}
          </span>
          <span className="block truncate text-xs font-normal text-admin-subtle">
            Click or drop a file
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) selectFile(file);
          event.target.value = '';
        }}
      />
      <p className="mt-1.5 text-xs leading-5 text-admin-subtle">
        JPEG, PNG, WebP or AVIF · up to {MAX_UPLOAD_SIZE_MB} MB
      </p>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {cropSource ? (
        <ImageCropUpload
          source={cropSource}
          aspect={SERVICE_CARD_ASPECT_RATIO}
          onCancel={() => {
            setCropSource(null);
            setSelectedFile(null);
          }}
          onApply={async ({ transform }) => {
            if (!selectedFile) return;
            try {
              const result = await api.uploadServiceCardImage(
                selectedFile,
                transform,
              );
              onChange(result.url);
              setCropSource(null);
              setSelectedFile(null);
              setError(null);
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : 'Failed to upload the service image.',
              );
              throw caught;
            }
          }}
        />
      ) : null}
    </div>
  );
}
