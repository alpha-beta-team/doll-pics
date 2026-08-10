import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { api } from '../api/client';
import type { HeroSlide } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';
import { ImageCropUpload } from '../components/ImageCropUpload';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { adminFieldClass } from '../components/ui';

const HERO_ASPECT_RATIO = 16 / 9;
const SUPPORTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_UPLOAD_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? '25');
const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function HeroSlidesPage() {
  const { isReadOnly } = useFeatureAccess('hero_slides');
  return (
    <SimpleOrderedPage<HeroSlide>
      title="Hero Slides"
      readOnly={isReadOnly}
      description="Manage homepage hero carousel slides"
      fetchItems={api.getHeroSlides}
      createItem={(data) => api.createHeroSlide(data as Omit<HeroSlide, 'id'>)}
      updateItem={api.updateHeroSlide}
      deleteItem={api.deleteHeroSlide}
      getEmptyItem={() => ({
        image: '',
        imageOriginal: '',
        imageStorageKey: '',
        imageTransform: null,
        label: '',
        order: 0,
        isPublished: true,
      })}
      renderPreview={item => (
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {item.image ? (
            <img src={item.image} alt={item.label} className="h-14 w-24 rounded-lg object-cover" />
          ) : (
            <div className="grid h-14 w-24 place-items-center rounded-lg bg-gray-100 text-gray-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{item.label || 'Untitled slide'}</p>
            <p className="max-w-md truncate text-xs text-gray-500">{item.image || 'No image uploaded'}</p>
          </div>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Label" value={(item.label as string) ?? ''} onChange={v => onChange('label', v)} />
          <HeroSlideImageField
            id={(item.id as string) ?? ''}
            value={(item.image as string) ?? ''}
            originalValue={(item.imageOriginal as string) ?? ''}
            transform={(item.imageTransform as HeroSlide['imageTransform']) ?? null}
            onChange={(field, value) => onChange(field, value)}
          />
        </>
      )}
    />
  );
}

function HeroSlideImageField({
  id,
  value,
  originalValue,
  transform,
  onChange,
}: {
  id: string;
  value: string;
  originalValue: string;
  transform: HeroSlide['imageTransform'];
  onChange: (
    field: 'image' | 'imageOriginal' | 'imageStorageKey' | 'imageTransform',
    value: unknown,
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file: File) => {
    if (!SUPPORTED_UPLOAD_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, WebP and AVIF images are supported.');
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

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Hero image</label>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="aspect-video w-full bg-gray-100">
          {value ? (
            <img src={value} alt="Hero slide preview" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-gray-400">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">No hero image selected</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-gray-200 bg-white p-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <Upload className="h-4 w-4" />
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {id && originalValue ? (
            <button
              type="button"
              onClick={() => {
                setCropSource(originalValue);
                setSelectedFile(null);
                setError(null);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reposition image
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) selectFile(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Use a landscape image. The crop is locked to 16:9 for the homepage hero.
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-gray-500">Use an image URL instead</summary>
        <div className="mt-2">
          <input
            type="url"
            value={value}
            placeholder="https://..."
            className={adminFieldClass}
            onChange={event => {
              onChange('image', event.target.value);
              onChange('imageOriginal', '');
              onChange('imageStorageKey', '');
              onChange('imageTransform', null);
            }}
          />
        </div>
      </details>

      {cropSource ? (
        <ImageCropUpload
          source={cropSource}
          aspect={HERO_ASPECT_RATIO}
          initialCrop={transform?.crop ? { ...transform.crop, unit: 'px' } : null}
          onCancel={() => {
            setCropSource(null);
            setSelectedFile(null);
          }}
          onApply={async ({ file, transform: nextTransform }) => {
            try {
              const result = id && !selectedFile
                ? await api.updateHeroSlideImage(id, nextTransform)
                : await api.uploadHeroSlideImage(selectedFile ?? file, nextTransform);
              onChange('image', result.url);
              onChange('imageOriginal', result.originalUrl);
              onChange('imageStorageKey', result.storageKey);
              onChange('imageTransform', result.imageTransform);
              setCropSource(null);
              setSelectedFile(null);
              setError(null);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : 'Failed to upload hero image');
              throw caught;
            }
          }}
        />
      ) : null}
    </div>
  );
}
