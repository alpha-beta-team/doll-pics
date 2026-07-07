import { useState } from 'react';
import { testimonials } from '../../data/content';
import { useInView } from '../../hooks/useScroll';
import { Star, ChevronLeft, ChevronRight, ThumbsUp, Quote } from 'lucide-react';

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const { ref, inView } = useInView<HTMLDivElement>();

  const go = (d: number) => {
    setDir(d);
    setIndex((p) => (p + d + testimonials.length) % testimonials.length);
  };

  const t = testimonials[index];

  return (
    <section id="testimonials" className="relative py-32 px-6 lg:px-10 bg-ink-950 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto ${inView ? 'fade-in' : ''}`} style={{ opacity: inView ? 1 : 0 }}>
        <div className={`text-center mb-16 reveal ${inView ? 'in' : ''}`}>
          <div className="section-label mb-4">Client Stories</div>
          <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 leading-tight">
            Loved by
            <span className="italic text-gradient-gold"> couples.</span>
          </h2>
        </div>

        <div className="relative">
          <div
            key={index}
            className={`glass-strong rounded-3xl p-8 md:p-12 perspective-1000 ${dir > 0 ? 'slide-in-right' : dir < 0 ? 'slide-in-left' : 'fade-in'}`}
          >
            <Quote className="w-10 h-10 text-gold-400/40 mb-6" />

            <div className="flex gap-1 mb-6">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
              ))}
            </div>

            <p className="font-display text-2xl md:text-3xl font-light text-ink-50 leading-relaxed mb-8 italic">
              "{t.text}"
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gold-400/30"
                />
                <div>
                  <div className="font-medium text-ink-50">{t.name}</div>
                  <div className="text-xs tracking-widest uppercase text-ink-200/50">{t.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-ink-200/60">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{t.likes}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-xs tracking-widest uppercase text-gold-400 mb-2">Photographer's Reply</div>
              <p className="text-sm text-ink-200/70 italic">{t.reply}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => go(-1)}
              data-cursor="hover"
              className="w-12 h-12 glass rounded-full flex items-center justify-center text-ink-50 hover:text-gold-400 hover:scale-110 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
                  data-cursor="hover"
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === index ? 'w-10 bg-gold-400' : 'w-4 bg-ink-300/30 hover:bg-ink-300/50'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              data-cursor="hover"
              className="w-12 h-12 glass rounded-full flex items-center justify-center text-ink-50 hover:text-gold-400 hover:scale-110 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
