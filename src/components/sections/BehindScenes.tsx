import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { BehindSceneCard } from './BehindSceneCard';

export function BehindScenes() {
  const { behindScenes } = useSiteData();
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
          <BehindSceneCard key={i} scene={scene} index={i} />
        ))}
      </div>
    </section>
  );
}
