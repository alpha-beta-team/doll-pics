import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { BehindSceneCard } from '../sections/BehindSceneCard';

export function BehindScenesPreview() {
  const { behindScenes } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="relative bg-ink-900 px-6 py-20 lg:px-10">
      <div ref={ref} className={`mx-auto mb-12 max-w-7xl reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">The Process</div>
        <h2 className="max-w-3xl font-display text-4xl font-light leading-tight text-ink-50 md:text-5xl">
          Behind the
          <span className="italic text-gradient-gold"> scenes.</span>
        </h2>
        <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          A glimpse into the craft — preparation, light, and the quiet work that shapes every gallery.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
        {behindScenes.slice(0, 4).map((scene, i) => (
          <BehindSceneCard key={i} scene={scene} index={i} showPlay={false} />
        ))}
      </div>
    </section>
  );
}
