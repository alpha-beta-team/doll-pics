import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../../contexts/SiteDataContext';
import { BOOKING_ROUTE } from '../../lib/navigation';
import {
  HERO_DEFAULT_WIDTH,
  HERO_SIZES,
  HERO_WIDTHS,
  mediaSrcSet,
  mediaUrl,
} from '../../lib/images';
import { ChevronDown } from 'lucide-react';
import type { PublicHeroSlide } from '../../lib/api';

/** Hold the first painted slide until after the LCP observation window. */
const LCP_LOCK_MS = 4000;
/** Delay carousel until after typical LCP observation window. */
const CAROUSEL_START_MS = 8000;
const CAROUSEL_INTERVAL_MS = 5000;

function preloadHeroImage(href: string) {
  if (!href) return;
  const existing = document.head.querySelectorAll('link[data-hero-preload]');
  for (const el of existing) {
    if ((el as HTMLLinkElement).href === href || el.getAttribute('href') === href) {
      return;
    }
  }
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.setAttribute('fetchpriority', 'high');
  link.setAttribute('imagesizes', HERO_SIZES);
  const webpSet = mediaSrcSet(href, [...HERO_WIDTHS], 'webp');
  if (webpSet) link.setAttribute('imagesrcset', webpSet);
  link.dataset.heroPreload = '1';
  document.head.appendChild(link);
}

function withStableFirstSlide(
  incoming: PublicHeroSlide[],
  lockedImage: string,
  locked: boolean,
): PublicHeroSlide[] {
  if (!incoming.length) return incoming;
  if (!locked || !lockedImage) return incoming;
  return incoming.map((slide, i) =>
    i === 0 ? { ...slide, image: lockedImage } : slide,
  );
}

function HeroPicture({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const widths = [...HERO_WIDTHS];
  const webpSet = mediaSrcSet(src, widths, 'webp');
  const jpegSet = mediaSrcSet(src, widths, 'jpeg');
  const fallback = mediaUrl(src, HERO_DEFAULT_WIDTH);

  return (
    <picture>
      {webpSet ? (
        <source type="image/webp" srcSet={webpSet} sizes={HERO_SIZES} />
      ) : null}
      {jpegSet ? (
        <source type="image/jpeg" srcSet={jpegSet} sizes={HERO_SIZES} />
      ) : null}
      <img
        src={fallback}
        alt={alt}
        width={1100}
        height={619}
        sizes={HERO_SIZES}
        decoding={priority ? 'async' : 'async'}
        className="w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
      />
    </picture>
  );
}

export function Hero() {
  const { heroSlides } = useSiteData();
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lockedFirstImage = useRef(heroSlides[0]?.image ?? '');
  const [lcpLocked, setLcpLocked] = useState(true);
  const [carouselReady, setCarouselReady] = useState(false);
  const [active, setActive] = useState(0);

  const slides = withStableFirstSlide(
    heroSlides,
    lockedFirstImage.current,
    lcpLocked,
  );

  useEffect(() => {
    const href = mediaUrl(
      lockedFirstImage.current || slides[0]?.image || '',
      HERO_DEFAULT_WIDTH,
      'webp',
    );
    if (href) preloadHeroImage(lockedFirstImage.current || slides[0]?.image || '');
  }, [slides]);

  useEffect(() => {
    const t = setTimeout(() => setLcpLocked(false), LCP_LOCK_MS);
    return () => clearTimeout(t);
  }, []);

  // Crossfade slides — start only after LCP window; mount extra slides then
  useEffect(() => {
    if (slides.length < 2) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setCarouselReady(true);
      interval = setInterval(() => {
        setActive((p) => (p + 1) % slides.length);
      }, CAROUSEL_INTERVAL_MS);
    }, CAROUSEL_START_MS);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [slides.length]);

  // Scroll parallax — skip on coarse pointers (mobile PSI) to cut main-thread work
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse), (max-width: 768px)').matches) {
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (bgRef.current && scrolled < window.innerHeight) {
          bgRef.current.style.transform = `translateY(${scrolled * 0.4}px) scale(${1 + scrolled * 0.0004})`;
        }
        if (contentRef.current && scrolled < window.innerHeight) {
          contentRef.current.style.opacity = String(
            Math.max(0.001, 1 - scrolled / (window.innerHeight * 0.8)),
          );
          contentRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!slides.length) return null;

  // Only mount the active slide until carousel unlocks — avoids multi-MB eager downloads
  const mountedIndexes = carouselReady
    ? slides.map((_, i) => i)
    : [0];

  return (
    <section className="relative h-screen w-full overflow-hidden vignette">
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        {mountedIndexes.map((i) => {
          const slide = slides[i];
          return (
            <div
              key={`${slide.image}-${i}`}
              className="absolute inset-0 transition-opacity duration-[2000ms] ease-out"
              style={{
                opacity: i === active ? 1 : 0.001,
                visibility: i === active ? 'visible' : 'hidden',
                pointerEvents: i === active ? 'auto' : 'none',
              }}
              aria-hidden={i !== active}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: i === active ? 'scale(1.04)' : 'scale(1.08)',
                  transition: 'transform 2s ease-out',
                }}
              >
                <HeroPicture
                  src={slide.image}
                  alt={slide.label}
                  priority={i === 0}
                />
              </div>
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/50 via-transparent to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-transparent to-ink-950/40" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center will-change-transform"
      >
        <div key={active} className="section-label mb-6 hero-enter hero-enter-delay-1">
          {slides[active].label} Collection 2026
        </div>

        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-[0.95] text-ink-50 text-shadow-cinematic max-w-5xl hero-enter hero-enter-delay-2">
          We don't take
          <br />
          <span className="italic text-gradient-gold font-normal">photographs.</span>
        </h1>

        <p className="mt-8 max-w-xl text-lg md:text-xl text-ink-200/90 font-light leading-relaxed text-shadow-cinematic hero-enter hero-enter-delay-3">
          We preserve the emotions, the light, and the fleeting moments that
          deserve to live forever.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 hero-enter hero-enter-delay-4">
          <Link to="/work" data-cursor="hover" className="btn-primary group">
            <span className="relative z-10">Explore Our Work</span>
            <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-300 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>
          <Link to={BOOKING_ROUTE.path} data-cursor="hover" className="btn-ghost">
            Book a Consultation
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setCarouselReady(true);
              setActive(i);
            }}
            data-cursor="hover"
            className="group"
            aria-label={`Show slide ${i + 1} of ${slides.length}`}
            aria-current={i === active ? 'true' : undefined}
          >
            <div
              className={`h-px transition-all duration-500 ${
                i === active ? 'w-12 bg-gold-400' : 'w-6 bg-ink-300/40 group-hover:bg-ink-200/60'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="absolute bottom-10 right-10 z-10 flex flex-col items-center gap-2 text-ink-300/60 hero-enter hero-enter-delay-5">
        <span className="text-[10px] tracking-ultra-wide uppercase rotate-90 origin-center mb-6">
          Scroll
        </span>
        <div style={{ animation: 'float 2s ease-in-out infinite' }}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}
