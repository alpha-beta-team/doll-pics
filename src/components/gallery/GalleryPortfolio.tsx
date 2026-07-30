import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  ImageOff,
  RotateCcw,
} from 'lucide-react';
import {
  getPhotoLightboxUrl,
  getPhotoSources,
  publicApi,
  type PhotoSources,
} from '../../lib/api';
import type { PublicPhoto } from '../../shared/types';
import {
  PhotoLightbox,
  type LightboxPhoto,
} from '../PhotoLightbox';
import { ResponsiveImage } from '../ResponsiveImage';
import { BookingCTA } from '../sections/BookingCTA';

const PHOTO_LIMIT = 100;
const GRID_SIZES =
  '(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) 48vw, 72vw';

type PortfolioPhoto = {
  id: string;
  title: string;
  width: number;
  height: number;
  location: string;
  year: string;
  blurPlaceholder?: string;
  sources: PhotoSources;
  lightboxSrc: string;
};

function photoId(photo: PublicPhoto, index: number): string {
  return photo.id || photo._id || photo.storageKey || `${photo.title}-${index}`;
}

function normalizePhotos(photos: PublicPhoto[]): PortfolioPhoto[] {
  return photos
    .map<PortfolioPhoto | null>((photo, index) => {
      const sources = getPhotoSources(photo);
      const lightboxSrc = getPhotoLightboxUrl(photo);
      if (!sources || !lightboxSrc) return null;

      return {
        id: photoId(photo, index),
        title: photo.title?.trim() || sources.alt,
        width: photo.width && photo.width > 0 ? photo.width : 1200,
        height: photo.height && photo.height > 0 ? photo.height : 800,
        location: photo.location?.trim() || '',
        year: photo.year?.trim() || '',
        blurPlaceholder: photo.blurPlaceholder,
        sources,
        lightboxSrc,
      };
    })
    .filter((photo): photo is PortfolioPhoto => photo !== null);
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') return '';
  return error instanceof Error
    ? error.message
    : 'We could not load the gallery right now.';
}

export function GalleryPortfolio() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    void publicApi
      .getPhotos(
        { limit: PHOTO_LIMIT },
        { signal: controller.signal },
      )
      .then((photoData) => {
        setPhotos(normalizePhotos(photoData));
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        const message = errorMessage(loadError);
        if (!message) return;
        setError(message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setAttempt((current) => current + 1);
  };

  const openLightbox = (index: number, trigger: HTMLElement) => {
    lightboxTrigger.current = trigger;
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  return (
    <>
      <section id="gallery" className="relative overflow-hidden px-6 pb-28 pt-12 lg:px-10 lg:pb-40">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 50% 0%, rgb(var(--gold-glow) / 0.12), transparent 72%)',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[96rem]">
          <GalleryIntroduction photoCount={loading || error ? 0 : photos.length} />

          <div className="mt-16 min-h-[24rem] md:mt-24" aria-busy={loading}>
            <div className="sr-only" role="status">
              {loading
                ? 'Loading photographs'
                : error
                  ? ''
                  : `${photos.length} photograph${photos.length === 1 ? '' : 's'} shown`}
            </div>
            {loading ? (
              <GallerySkeleton />
            ) : error ? (
              <GalleryError message={error} onRetry={retry} />
            ) : photos.length === 0 ? (
              <GalleryEmpty />
            ) : (
              <GalleryGrid photos={photos} onOpen={openLightbox} />
            )}
          </div>
        </div>
      </section>

      <BookingCTA />

      {lightboxIndex !== null && photos[lightboxIndex] ? (
        <PhotoLightbox
          photos={photos.map<LightboxPhoto>((photo) => ({
            id: photo.id,
            src: photo.lightboxSrc,
            fallbackSrc: photo.sources.src,
            alt: photo.sources.alt,
            title: photo.title,
            meta: [photo.location, photo.year].filter(Boolean).join(' · '),
            width: photo.width,
            height: photo.height,
          }))}
          initialIndex={lightboxIndex}
          returnFocus={lightboxTrigger.current}
          onClose={closeLightbox}
          label="gallery"
        />
      ) : null}
    </>
  );
}

function GalleryIntroduction({ photoCount }: { photoCount: number }) {
  return (
    <header className="pt-10 md:pt-20">
      <div className="flex items-center justify-between border-b border-hairline/10 pb-4 text-[10px] font-medium uppercase tracking-[0.28em] text-ink-300">
        <span>Doll Pictures · Selected Work</span>
        <span className="hidden sm:inline">Erode · Tamil Nadu</span>
      </div>

      <div className="grid gap-10 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-9">
          <div className="section-label mb-6 flex items-center gap-4">
            <span>A Visual Journal</span>
            <span className="h-px w-16 bg-gold-400/60" aria-hidden="true" />
          </div>
          <h1 className="max-w-6xl font-display text-[3.45rem] font-light leading-[0.88] tracking-[-0.035em] text-ink-50 sm:text-7xl md:text-8xl lg:text-[7.8rem]">
            Every frame,
            <span className="block italic text-gold-300">a feeling held.</span>
          </h1>
        </div>

        <div className="flex flex-col justify-end lg:col-span-3 lg:pb-3">
          <p className="max-w-md text-sm font-light leading-7 text-ink-200/70 md:text-base">
            An unfolding journal of celebrations, connections, and the quiet
            in-between moments that define our work.
          </p>
          <div className="mt-8 flex items-center justify-between border-t border-hairline/10 pt-4 text-[10px] uppercase tracking-[0.24em] text-ink-400">
            <span>{photoCount > 0 ? `${photoCount} photographs` : 'Portfolio archive'}</span>
            <span className="text-gold-400">Scroll to explore</span>
          </div>
        </div>
      </div>
    </header>
  );
}

type GalleryGridProps = {
  photos: PortfolioPhoto[];
  onOpen: (index: number, trigger: HTMLElement) => void;
};

const EDITORIAL_LAYOUTS = [
  'sm:col-span-2 lg:col-span-8 lg:col-start-1',
  'lg:col-span-3 lg:col-start-10 lg:mt-36',
  'lg:col-span-4 lg:col-start-2',
  'sm:col-span-2 lg:col-span-7 lg:col-start-6',
  'lg:col-span-5 lg:col-start-1 lg:mt-20',
  'lg:col-span-6 lg:col-start-7',
] as const;

function GalleryGrid({ photos, onOpen }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 md:gap-y-20 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-28">
      {photos.map((photo, index) => (
        <GalleryTile
          key={photo.id}
          photo={photo}
          index={index}
          layout={EDITORIAL_LAYOUTS[index % EDITORIAL_LAYOUTS.length]}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

type GalleryTileProps = {
  photo: PortfolioPhoto;
  index: number;
  layout: string;
  onOpen: (index: number, trigger: HTMLElement) => void;
};

function GalleryTile({ photo, index, layout, onOpen }: GalleryTileProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const priority = index < 4;

  return (
    <figure className={`min-w-0 self-start ${layout}`}>
      <button
        type="button"
        data-cursor="view"
        aria-label={`Open ${photo.sources.alt}`}
        onClick={(event) => onOpen(index, event.currentTarget)}
        className="group relative block w-full overflow-hidden bg-ink-900 text-left outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950"
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        <div
          className={`absolute inset-0 bg-ink-800 transition-opacity duration-700 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={
            photo.blurPlaceholder
              ? {
                  backgroundImage: `url("${photo.blurPlaceholder}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : undefined
          }
          aria-hidden="true"
        />

        {failed ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-300">
            <ImageOff className="h-7 w-7" aria-hidden="true" />
            <span className="text-xs uppercase tracking-widest">Image unavailable</span>
          </span>
        ) : (
          <ResponsiveImage
            src={photo.sources.src}
            alt={photo.sources.alt}
            avifSrcSet={photo.sources.avifSrcSet}
            webpSrcSet={photo.sources.webpSrcSet}
            sizes={GRID_SIZES}
            width={photo.width}
            height={photo.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-contain transition-[opacity,transform] duration-700 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-[1.018] group-focus-visible:scale-[1.018]`}
          />
        )}

        {!failed ? (
          <span className="pointer-events-none absolute right-4 top-4 translate-y-2 border border-white/20 bg-black/45 px-3 py-2 text-[9px] uppercase tracking-[0.24em] text-white opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            View frame
          </span>
        ) : null}

        <span
          className="pointer-events-none absolute inset-0 border border-white/0 transition-colors duration-500 group-hover:border-white/20 group-focus-visible:border-gold-300/60"
          aria-hidden="true"
        />
      </button>

      <figcaption className="mt-4 flex items-start justify-between gap-6 border-t border-hairline/10 pt-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-gold-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="truncate font-display text-lg italic text-ink-100/85">
            {photo.title}
          </span>
        </div>
        {photo.location || photo.year ? (
          <span className="shrink-0 pt-1 text-[9px] uppercase tracking-[0.2em] text-ink-400">
            {[photo.location, photo.year].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function GallerySkeleton() {
  const ratios = ['4/3', '3/4', '1/1', '16/10', '4/5', '3/2'];

  return (
    <div
      className="grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 md:gap-y-20 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-28"
      aria-label="Loading photographs"
    >
      {ratios.map((ratio, index) => (
        <div
          key={`${ratio}-${index}`}
          className={`self-start ${EDITORIAL_LAYOUTS[index % EDITORIAL_LAYOUTS.length]}`}
        >
          <div
            className="overflow-hidden bg-ink-900"
            style={{ aspectRatio: ratio }}
          >
            <div className="h-full w-full animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.05),transparent)] bg-[length:200%_100%]" />
          </div>
          <div className="mt-4 h-px bg-hairline/10" />
        </div>
      ))}
    </div>
  );
}

function GalleryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center border border-hairline/10 bg-ink-900/30 px-6 py-16 text-center"
      role="alert"
    >
      <ImageOff className="h-9 w-9 text-gold-400" aria-hidden="true" />
      <h2 className="mt-5 font-display text-3xl text-ink-50">
        The gallery needs a moment
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-200/70">
        {message || 'We could not load the photographs right now.'}
      </p>
      <button type="button" className="btn-ghost mt-7" onClick={onRetry}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

function GalleryEmpty() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
      <Camera className="h-9 w-9 text-gold-400" aria-hidden="true" />
      <h2 className="mt-5 font-display text-3xl text-ink-50">
        New stories are on their way
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-200/70">
        There are no published photographs in the gallery yet.
      </p>
    </div>
  );
}
