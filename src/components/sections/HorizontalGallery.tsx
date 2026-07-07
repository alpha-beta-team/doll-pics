import { useEffect, useRef, useState } from 'react';
import { galleryImages } from '../../data/content';

const categories = ['Wedding', 'Portrait', 'Fashion', 'Drone', 'Maternity', 'Editorial'];
const heights = ['h-[60vh]', 'h-[55vh]', 'h-[65vh]', 'h-[58vh]'];

export function HorizontalGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        setProgress(Math.max(0, Math.min(1, scrolled / total)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const images = [...galleryImages, ...galleryImages];
  const xPercent = -50 * progress;

  return (
    <section id="gallery" ref={ref} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute top-20 left-6 lg:left-10 z-10">
          <div className="section-label mb-3">The Gallery</div>
          <h2 className="font-display text-5xl md:text-6xl font-light text-ink-50">
            A lifetime of
            <span className="italic text-gradient-gold"> moments.</span>
          </h2>
        </div>

        <div
          ref={trackRef}
          className="flex gap-6 px-6 lg:px-10 will-change-transform"
          style={{ transform: `translateX(${xPercent}%)` }}
        >
          {images.map((img, i) => (
            <GalleryItem key={i} src={img} index={i} />
          ))}
        </div>

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3 flex-wrap justify-center max-w-2xl px-6">
          {categories.map((cat) => (
            <span key={cat} className="px-4 py-2 glass rounded-full text-xs tracking-widest uppercase text-ink-200/80">
              {cat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryItem({ src, index }: { src: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  const h = heights[index % heights.length];
  const cat = categories[index % categories.length];

  return (
    <div
      data-cursor="view"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative ${h} w-[28vw] min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl group cursor-pointer`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-600"
        style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />

      <div
        className="absolute bottom-5 left-5 transition-all duration-400"
        style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(20px)' }}
      >
        <span className="px-3 py-1.5 glass rounded-full text-[10px] tracking-widest uppercase text-gold-300">
          {cat}
        </span>
      </div>

      <div className="absolute inset-0 rounded-2xl border border-gold-400/0 group-hover:border-gold-400/30 transition-all duration-500" />
    </div>
  );
}
