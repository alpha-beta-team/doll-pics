import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { Star, ThumbsUp, Quote } from 'lucide-react';

export function Testimonials() {
  const { testimonials } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  if (!testimonials.length) return null;

  return (
    <section id="testimonials" className="relative py-20 md:py-28 px-6 lg:px-10 bg-ink-950 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`relative z-10 max-w-3xl mx-auto ${inView ? 'fade-in' : ''}`}
        style={{ opacity: inView ? 1 : 0 }}
      >
        <div className={`text-center mb-12 md:mb-14 reveal ${inView ? 'in' : ''}`}>
          <h2 className="font-display text-4xl md:text-6xl font-light text-ink-50 leading-tight">
            Loved by
            <span className="italic text-gradient-gold"> couples.</span>
          </h2>
        </div>

        <ul className="space-y-6 md:space-y-8 list-none p-0 m-0">
          {testimonials.map((t, i) => (
            <li
              key={`${t.name}-${i}`}
              className={`rounded-2xl bg-ink-900/80 backdrop-blur-2xl border border-white/20 p-6 md:p-8 reveal ${inView ? 'in' : ''}`}
              style={{ transitionDelay: inView ? `${i * 80}ms` : undefined }}
            >
              <Quote className="w-7 h-7 text-gold-400/50 mb-4" aria-hidden="true" />

              <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: t.rating }).map((_, starIdx) => (
                  <Star key={starIdx} className="w-4 h-4 fill-gold-400 text-gold-400" aria-hidden="true" />
                ))}
              </div>

              <p className="font-sans text-lg md:text-xl font-normal text-ink-50 leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gold-400/30"
                  />
                  <div>
                    <div className="font-medium text-ink-50">{t.name}</div>
                    <div className="text-xs tracking-widest uppercase text-ink-300">{t.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-ink-200">
                  <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">{t.likes}</span>
                </div>
              </div>

              {t.reply ? (
                <div className="mt-5 pt-5 border-t border-white/15">
                  <div className="text-xs tracking-widest uppercase text-gold-400 mb-2">
                    Photographer&apos;s Reply
                  </div>
                  <p className="text-sm text-ink-100 leading-relaxed">{t.reply}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
