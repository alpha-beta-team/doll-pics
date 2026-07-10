import { useCallback, useEffect, useRef, useState } from 'react';
import { useSiteData } from '../../contexts/SiteDataContext';
import {
  SECTION_DEFAULT_WIDTH,
  SECTION_WIDTHS,
  mediaSrcSet,
  mediaUrl,
} from '../../lib/images';

/**
 * Sticky scroll story — DOM updates via refs (no React re-render per frame).
 * Only mounts nearby scene images to keep network + decode cost down.
 */
export function ScrollStorytelling() {
  const { storyScenes } = useSiteData();
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadedRef = useRef<Set<number>>(new Set([0]));
  const [loadedVersion, setLoadedVersion] = useState(0);

  const markLoaded = useCallback((indexes: number[]) => {
    let changed = false;
    for (const i of indexes) {
      if (!loadedRef.current.has(i)) {
        loadedRef.current.add(i);
        changed = true;
      }
    }
    if (changed) setLoadedVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let raf = 0;
    const scenes = storyScenes.length;

    const paint = () => {
      const el = sectionRef.current;
      if (!el || scenes === 0) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.max(0, Math.min(1, total > 0 ? scrolled / total : 0));

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      let active = 0;
      for (let i = 0; i < scenes; i++) {
        const start = i / scenes;
        const end = (i + 1) / scenes;
        let opacity = 0;
        let scale = 1.1;
        let textY = 80;
        let textOpacity = 0;

        if (progress >= start && progress <= end) {
          active = i;
          const local = (progress - start) / (end - start);
          if (local < 0.5) {
            const t = local / 0.5;
            opacity = t;
            scale = 1.1 - t * 0.1;
            textY = 80 - t * 80;
            textOpacity = t;
          } else {
            const t = (local - 0.5) / 0.5;
            opacity = 1 - t;
            scale = 1 + t * 0.06;
            textY = -t * 80;
            textOpacity = 1 - t;
          }
        }

        const layer = layerRefs.current[i];
        if (layer) {
          layer.style.opacity = String(opacity);
          layer.style.transform = `scale(${scale})`;
        }

        const text = textRefs.current[i];
        if (text) {
          text.style.opacity = String(textOpacity);
          text.style.transform = `translateY(${textY}px)`;
        }
      }

      markLoaded(
        [active - 1, active, active + 1].filter((i) => i >= 0 && i < scenes),
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [storyScenes.length, markLoaded]);

  const widths = [...SECTION_WIDTHS];
  // loadedVersion forces re-render when new scene images should mount
  void loadedVersion;

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${storyScenes.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {storyScenes.map((scene, i) => {
          const loaded = loadedRef.current.has(i);
          const src = mediaUrl(scene.image, SECTION_DEFAULT_WIDTH);
          const webpSet = mediaSrcSet(scene.image, widths, 'webp');
          const jpegSet = mediaSrcSet(scene.image, widths, 'jpeg');

          return (
            <div key={i} className="absolute inset-0">
              <div
                ref={(el) => {
                  layerRefs.current[i] = el;
                }}
                className="absolute inset-0"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  willChange: 'opacity, transform',
                }}
              >
                {loaded ? (
                  <picture>
                    {webpSet ? (
                      <source type="image/webp" srcSet={webpSet} sizes="100vw" />
                    ) : null}
                    {jpegSet ? (
                      <source type="image/jpeg" srcSet={jpegSet} sizes="100vw" />
                    ) : null}
                    <img
                      src={src}
                      alt={
                        scene.text.replace(/\u2026/g, '…').replace(/\.\.\./g, '') ||
                        'Story scene'
                      }
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </picture>
                ) : (
                  <div className="w-full h-full bg-ink-950" />
                )}
                <div className="absolute inset-0 bg-ink-950/50" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/60" />
              </div>

              <div
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className="relative z-10 h-full flex items-center justify-center px-6"
                style={{ opacity: 0, willChange: 'opacity, transform' }}
              >
                <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-center text-ink-50 text-shadow-cinematic max-w-4xl leading-tight">
                  {scene.text}
                </h2>
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-0 left-0 right-0 h-px bg-ink-300/10">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-gold-300 to-gold-500 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </section>
  );
}
