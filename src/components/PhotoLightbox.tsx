import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type LightboxPhoto = {
  id: string;
  src: string;
  fallbackSrc?: string;
  alt: string;
  title?: string;
  meta?: string;
  width?: number;
  height?: number;
};

type PhotoLightboxProps = {
  photos: LightboxPhoto[];
  initialIndex: number;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  label?: string;
};

export function PhotoLightbox({
  photos,
  initialIndex,
  returnFocus,
  onClose,
  label = 'Photography gallery',
}: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  const showPrevious = useCallback(() => {
    setIndex((current) => (current - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const showNext = useCallback(() => {
    setIndex((current) => (current + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      returnFocus?.focus();
    };
  }, [returnFocus]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' && hasMultiple) {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight' && hasMultiple) {
        event.preventDefault();
        showNext();
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiple, onClose, showNext, showPrevious]);

  useEffect(() => {
    setUseFallback(false);
  }, [photo.id]);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!touchStart.current || !hasMultiple) return;
    const touch = event.changedTouches[0];
    const xDistance = touch.clientX - touchStart.current.x;
    const yDistance = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (
      Math.abs(xDistance) < 48 ||
      Math.abs(xDistance) <= Math.abs(yDistance)
    ) {
      return;
    }
    if (xDistance > 0) showPrevious();
    else showNext();
  };

  if (!photo) return null;

  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-lightbox-title"
      data-smooth-scroll-ignore
      tabIndex={-1}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[2100] touch-pan-y bg-black/95 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 pb-24 pt-16 md:px-20 md:pb-16">
        <img
          key={photo.id}
          src={
            useFallback && photo.fallbackSrc ? photo.fallbackSrc : photo.src
          }
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="pointer-events-auto max-h-full max-w-full object-contain"
          decoding="async"
          onError={() => {
            if (
              !useFallback &&
              photo.fallbackSrc &&
              photo.fallbackSrc !== photo.src
            ) {
              setUseFallback(true);
            }
          }}
        />
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs tracking-widest text-white/80 backdrop-blur-md md:left-6 md:top-6">
        {index + 1} / {photos.length}
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        aria-label={`Close ${label}`}
        onClick={onClose}
        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white outline-none backdrop-blur-md transition-colors hover:border-gold-300 hover:text-gold-200 focus-visible:ring-2 focus-visible:ring-gold-300 md:right-6 md:top-6"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {hasMultiple ? (
        <>
          <button
            type="button"
            aria-label="Previous photograph"
            onClick={showPrevious}
            className="absolute bottom-5 left-[calc(50%-4rem)] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white outline-none backdrop-blur-md transition-colors hover:border-gold-300 hover:text-gold-200 focus-visible:ring-2 focus-visible:ring-gold-300 md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next photograph"
            onClick={showNext}
            className="absolute bottom-5 right-[calc(50%-4rem)] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white outline-none backdrop-blur-md transition-colors hover:border-gold-300 hover:text-gold-200 focus-visible:ring-2 focus-visible:ring-gold-300 md:bottom-auto md:right-5 md:top-1/2 md:-translate-y-1/2"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      ) : null}

      <h2 id="photo-lightbox-title" className="sr-only">
        {photo.title || photo.alt}
      </h2>

      <div className="pointer-events-none absolute inset-x-20 bottom-20 hidden text-center md:bottom-6 md:block">
        <p className="font-display text-xl text-white">
          {photo.title || photo.alt}
        </p>
        {photo.meta ? (
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-gold-200">
            {photo.meta}
          </p>
        ) : null}
      </div>

      <div className="sr-only" aria-live="polite">
        Photograph {index + 1} of {photos.length}: {photo.title || photo.alt}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
