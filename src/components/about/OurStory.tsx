import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';

export function OurStory() {
  const { siteContent } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();
  const paragraphs = (siteContent.ourStory || siteContent.about)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="relative bg-ink-950 px-6 py-32 lg:px-10">
      <div
        ref={ref}
        className={`mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-20 reveal ${inView ? 'in' : ''}`}
      >
        <div>
          <div className="section-label mb-4">Our Story</div>
          <h2 className="font-display text-4xl font-light leading-tight text-ink-50 md:text-6xl">
            Where every frame
            <span className="italic text-gradient-gold"> begins.</span>
          </h2>
          <div className="mt-10 space-y-5">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-[0.95rem] leading-relaxed text-ink-200/70">
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <blockquote className="border-l-2 border-gold-400/50 pl-8 md:pl-10">
            <div className="section-label mb-4">Our Mission</div>
            <p className="font-display text-2xl font-light italic leading-relaxed text-ink-50 md:text-3xl">
              &ldquo;{siteContent.mission || siteContent.tagline}&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
