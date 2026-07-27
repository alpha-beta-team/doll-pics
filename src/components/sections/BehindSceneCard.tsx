import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import { useInView } from '../../hooks/useScroll';
import type { PublicBehindScene } from '../../shared/types';

interface BehindSceneCardProps {
  scene: PublicBehindScene;
  index: number;
}

const defaultMedia: Record<
  string,
  Required<Pick<PublicBehindScene, 'image' | 'video' | 'description'>>
> = {
  'camera setup': {
    image: '/videos/behind-scenes/camera-setup.jpg',
    video: '/videos/behind-scenes/camera-setup.mp4',
    description: 'The crew rigs, balances, and checks every frame before the shoot.',
  },
  'drone operation': {
    image: '/videos/behind-scenes/drone-operation.jpg',
    video: '/videos/behind-scenes/drone-operation.mp4',
    description: 'Pre-flight checks and our drone team at work in the field.',
  },
  lighting: {
    image: '/videos/behind-scenes/lighting.jpg',
    video: '/videos/behind-scenes/lighting.mp4',
    description: 'Shaping and checking the light until the scene feels just right.',
  },
  editing: {
    image: '/videos/behind-scenes/editing.jpg',
    video: '/videos/behind-scenes/editing.mp4',
    description: 'Inside the office as the team cuts and colours the final story.',
  },
};

export function BehindSceneCard({ scene, index }: BehindSceneCardProps) {
  const { ref, inView } = useInView<HTMLButtonElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const fallback = defaultMedia[scene.title.trim().toLowerCase()];
  const video = scene.video || fallback?.video;
  const poster = scene.video ? scene.image : (fallback?.image ?? scene.image);
  const description = scene.description || fallback?.description;

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !video) return;

    if (!inView || isPlayerOpen) {
      player.pause();
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (!prefersReducedMotion) {
      void player.play().catch(() => setIsPlaying(false));
    }
  }, [inView, isPlayerOpen, video]);

  useEffect(() => {
    if (!isPlayerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPlayerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isPlayerOpen]);

  return (
    <>
      <button
        type="button"
        ref={ref}
        onClick={() => video && setIsPlayerOpen(true)}
        disabled={!video}
        aria-label={`Open ${scene.title} behind-the-scenes video player`}
        data-cursor={video ? 'view' : undefined}
        className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl text-left reveal-blur ${video ? 'cursor-pointer' : 'cursor-default'} ${inView ? 'in' : ''}`}
        style={{ transitionDelay: `${index * 0.12}s` }}
      >
        {video ? (
          <video
            ref={videoRef}
            src={video}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={poster}
            alt={scene.title}
            width={600}
            height={800}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {video && (
          <div
            className={`absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white glass transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-400/20 ${
              isPlaying
                ? 'opacity-0 group-hover:opacity-100'
                : 'opacity-100'
            }`}
          >
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="mb-1 text-xs uppercase tracking-widest text-gold-300">
            {String(index + 1).padStart(2, '0')}
          </div>
          <h3 className="font-display text-xl font-light text-white">{scene.title}</h3>
          {description && (
            <p className="mt-1 hidden text-xs leading-relaxed text-white/65 md:block">
              {description}
            </p>
          )}
        </div>
      </button>

      {isPlayerOpen &&
        video &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${scene.title} video player`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setIsPlayerOpen(false);
            }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4 pt-20 backdrop-blur-md sm:p-8 sm:pt-24"
          >
            <button
              type="button"
              onClick={() => setIsPlayerOpen(false)}
              aria-label="Close video player"
              className="fixed right-4 top-4 z-10 flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white shadow-xl backdrop-blur-md transition-colors hover:border-gold-300/50 hover:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span>Close</span>
            </button>

            <div className="relative w-full max-w-6xl">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <video
                  src={video}
                  poster={poster}
                  autoPlay
                  controls
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4">
                <h3 className="font-display text-2xl font-light text-white">
                  {scene.title}
                </h3>
                {description && (
                  <p className="mt-1 text-sm text-white/60">{description}</p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
