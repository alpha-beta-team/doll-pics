import { useSiteData, type FeaturedWorkItem } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { ResponsiveImage } from '../ResponsiveImage';

const EDITORIAL_COPY = [
  'We chase the soft edges of light — the glance before a smile, the hush before a vow.',
  'Every frame is composed with care: texture, color, and the quiet poetry of presence.',
  'From intimate mornings to grand celebrations, our lens stays close to what feels true.',
  'The result is imagery that feels whimsical yet refined — a keepsake of emotion, not just events.',
];

export function AboutGallery() {
  const { featuredWork } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();
  const works = featuredWork.slice(0, 4);

  return (
    <section className="relative bg-ink-900 px-6 py-28 lg:px-10">
      <div ref={ref} className={`mx-auto mb-16 max-w-7xl reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">Through Our Lens</div>
        <h2 className="max-w-3xl font-display text-4xl font-light leading-tight text-ink-50 md:text-6xl">
          A gallery of
          <span className="italic text-gradient-gold"> feeling.</span>
        </h2>
        <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          Selected moments from our work — visual whispers of the stories we love to tell.
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-20">
        {works.map((work, i) => (
          <GalleryRow
            key={`${work.title}-${i}`}
            work={work}
            copy={EDITORIAL_COPY[i % EDITORIAL_COPY.length]}
            reverse={i % 2 === 1}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

function GalleryRow({
  work,
  copy,
  reverse,
  index,
}: {
  work: FeaturedWorkItem;
  copy: string;
  reverse: boolean;
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`grid items-center gap-10 lg:grid-cols-2 reveal-blur ${inView ? 'in' : ''} ${
        reverse ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div data-cursor="view" className="group relative">
        <div className="absolute -left-2 -top-2 h-10 w-10 border-l border-t border-gold-400/40" />
        <div className="absolute -bottom-2 -right-2 h-10 w-10 border-b border-r border-gold-400/40" />
        <div className="overflow-hidden rounded-[2rem] rounded-tl-[3.5rem]">
          <ResponsiveImage
            src={work.image}
            alt={work.alt}
            avifSrcSet={work.avifSrcSet}
            webpSrcSet={work.webpSrcSet}
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>

      <div className={reverse ? 'lg:pr-8' : 'lg:pl-8'}>
        <div className="section-label mb-3">{work.category}</div>
        <h3 className="font-display text-3xl font-light text-ink-50 md:text-4xl">{work.title}</h3>
        {(work.location || work.year) && (
          <p className="mt-2 text-xs uppercase tracking-widest text-ink-200/40">
            {[work.location, work.year].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink-200/70">{copy}</p>
      </div>
    </div>
  );
}
