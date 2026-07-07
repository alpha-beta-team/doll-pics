import { behindScenes } from '../../data/content';
import { useInView } from '../../hooks/useScroll';
import { Play } from 'lucide-react';

export function BehindScenes() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="behind" className="relative py-32 px-6 lg:px-10 bg-ink-900">
      <div ref={ref} className={`max-w-7xl mx-auto mb-20 reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">The Process</div>
        <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 max-w-3xl leading-tight">
          Behind the
          <span className="italic text-gradient-gold"> lens.</span>
        </h2>
        <p className="mt-6 text-ink-200/70 max-w-xl">
          Every great image begins with preparation, precision, and a team obsessed with the details.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        {behindScenes.map((scene, i) => (
          <BehindCard key={i} scene={scene} index={i} />
        ))}
      </div>
    </section>
  );
}

function BehindCard({ scene, index }: { scene: typeof behindScenes[0]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-cursor="view"
      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer reveal-blur ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <img
        src={scene.image}
        alt={scene.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-ink-50 group-hover:scale-110 group-hover:bg-gold-400/20 transition-all duration-500">
        <Play className="w-6 h-6 fill-current" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-xs tracking-widest uppercase text-gold-300 mb-1">
          {String(index + 1).padStart(2, '0')}
        </div>
        <h3 className="font-display text-xl font-light text-ink-50">{scene.title}</h3>
      </div>
    </div>
  );
}
