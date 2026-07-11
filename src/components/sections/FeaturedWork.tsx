import { useEffect, useState } from 'react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import type { FeaturedWorkItem } from '../../contexts/SiteDataContext';
import { ResponsiveImage } from '../ResponsiveImage';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';

const FEATURED_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';

export function FeaturedWork() {
  const { featuredWork } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="work" className="relative py-32 px-6 lg:px-10 bg-ink-950">
      <div ref={ref} className={`max-w-7xl mx-auto mb-20 reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">Selected Work</div>
        <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 max-w-3xl leading-tight">
          Stories told through
          <span className="italic text-gradient-gold"> light.</span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredWork.map((work, i) => (
          <FeatureCard key={i} work={work} index={i} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ work, index }: { work: FeaturedWorkItem; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        ref={ref}
        data-cursor="view"
        onClick={() => setOpen(true)}
        className={`group relative aspect-[4/5] overflow-hidden rounded-2xl cursor-pointer reveal-blur ${inView ? 'in' : ''}`}
        style={{ transitionDelay: `${index * 0.1}s` }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <ResponsiveImage
            src={work.image}
            alt={work.alt}
            avifSrcSet={work.avifSrcSet}
            webpSrcSet={work.webpSrcSet}
            sizes={FEATURED_SIZES}
            width={800}
            height={1000}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
        <div className="absolute inset-0 rounded-2xl border border-white/0 group-hover:border-gold-400/40 transition-all duration-500" />

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="transform transition-all duration-500 group-hover:translate-y-0 translate-y-2">
            <div className="section-label mb-2 text-gold-300">{work.category}</div>
            <h3 className="font-display text-3xl font-light text-ink-50 mb-2">{work.title}</h3>
            <div className="flex items-center gap-4 text-xs text-ink-200/70 overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {work.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {work.year}</span>
            </div>
          </div>
        </div>

        <div className="absolute top-5 right-5 px-3 py-1.5 glass rounded-full text-[10px] tracking-widest uppercase text-gold-300 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      {open && (
        <Lightbox index={index} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function Lightbox({ index, onClose }: { index: number; onClose: () => void }) {
  const { featuredWork } = useSiteData();
  const [current, setCurrent] = useState(index);
  const work = featuredWork[current];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((p) => (p + 1) % featuredWork.length);
      if (e.key === 'ArrowLeft') setCurrent((p) => (p - 1 + featuredWork.length) % featuredWork.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, featuredWork.length]);

  const nav = (dir: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((p) => (p + dir + featuredWork.length) % featuredWork.length);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] bg-ink-950/95 backdrop-blur-2xl flex items-center justify-center p-6 fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        data-cursor="hover"
        aria-label="Close lightbox"
        className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center text-ink-50 hover:text-gold-400 transition-colors z-10"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(e) => nav(-1, e)}
        data-cursor="hover"
        aria-label="Previous image"
        className="absolute left-6 w-12 h-12 glass rounded-full flex items-center justify-center text-ink-50 hover:text-gold-400 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(e) => nav(1, e)}
        data-cursor="hover"
        aria-label="Next image"
        className="absolute right-6 w-12 h-12 glass rounded-full flex items-center justify-center text-ink-50 hover:text-gold-400 transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" aria-hidden="true" />
      </button>

      <div
        key={current}
        className="relative max-w-5xl w-full max-h-[80vh] fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <ResponsiveImage
          src={work.image}
          alt={work.alt}
          avifSrcSet={work.avifSrcSet}
          webpSrcSet={work.webpSrcSet}
          sizes="(max-width: 1280px) 100vw, 1024px"
          loading="eager"
          className="w-full h-full object-contain rounded-xl"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink-950 to-transparent rounded-b-xl">
          <div className="section-label mb-1 text-gold-300">{work.category}</div>
          <h3 className="font-display text-4xl font-light text-ink-50">{work.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-ink-200/70">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {work.location}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {work.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
