import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../../contexts/SiteDataContext';
import { BOOKING_ROUTE } from '../../lib/navigation';
import { ChevronDown } from 'lucide-react';

export function Hero() {
  const { heroSlides } = useSiteData();
  const ref = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Crossfade slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((p) => (p + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Scroll parallax
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (bgRef.current && scrolled < window.innerHeight) {
          bgRef.current.style.transform = `translateY(${scrolled * 0.4}px) scale(${1 + scrolled * 0.0004})`;
        }
        if (contentRef.current && scrolled < window.innerHeight) {
          contentRef.current.style.opacity = String(Math.max(0, 1 - scrolled / (window.innerHeight * 0.8)));
          contentRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden vignette">
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-all duration-[2000ms] ease-out"
            style={{
              opacity: i === active ? 1 : 0,
              transform: i === active ? 'scale(1.08)' : 'scale(1.15)',
            }}
          >
            <img
              src={slide.image}
              alt={slide.label}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/50 via-transparent to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-transparent to-ink-950/40" />
      </div>

      <div ref={contentRef} className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center will-change-transform">
        <div
          key={active}
          className="section-label mb-6"
          style={{ animation: 'fadeInUp 1s 0.3s ease-out both' }}
        >
          {heroSlides[active].label} Collection 2026
        </div>

        <h1
          className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-[0.95] text-ink-50 text-shadow-cinematic max-w-5xl"
          style={{ animation: 'fadeInUp 1.4s 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          We don't take
          <br />
          <span className="italic text-gradient-gold font-normal">photographs.</span>
        </h1>

        <p
          className="mt-8 max-w-xl text-lg md:text-xl text-ink-200/90 font-light leading-relaxed text-shadow-cinematic"
          style={{ animation: 'fadeInUp 1.2s 1s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          We preserve the emotions, the light, and the fleeting moments that
          deserve to live forever.
        </p>

        <div
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          style={{ animation: 'fadeInUp 1s 1.3s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <Link
            to="/work"
            data-cursor="hover"
            className="btn-primary group"
          >
            <span className="relative z-10">Explore Our Work</span>
            <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-300 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>
          <Link
            to={BOOKING_ROUTE.path}
            data-cursor="hover"
            className="btn-ghost"
          >
            Book a Consultation
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} data-cursor="hover" className="group">
            <div
              className={`h-px transition-all duration-500 ${
                i === active ? 'w-12 bg-gold-400' : 'w-6 bg-ink-300/40 group-hover:bg-ink-200/60'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 right-10 z-10 flex flex-col items-center gap-2 text-ink-300/60"
        style={{ animation: 'fadeIn 1s 2s ease-out both' }}
      >
        <span className="text-[10px] tracking-ultra-wide uppercase rotate-90 origin-center mb-6">Scroll</span>
        <div style={{ animation: 'float 2s ease-in-out infinite' }}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}
