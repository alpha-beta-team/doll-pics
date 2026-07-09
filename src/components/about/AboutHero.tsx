import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';

export function AboutHero() {
  const { siteContent, heroSlides } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();
  const heroImage = heroSlides[0]?.image;

  return (
    <section className="relative px-6 py-32 lg:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,162,73,0.12), transparent)',
        }}
      />

      <div
        ref={ref}
        className={`relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 reveal ${inView ? 'in' : ''}`}
      >
        <div>
          <div className="section-label mb-4">About Us</div>
          <h1 className="max-w-3xl font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
            Crafted with warmth,
            <span className="italic text-gradient-gold"> told with light.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
            {siteContent.aboutHeroSubtext || siteContent.tagline}
          </p>
        </div>

        {heroImage && (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-3 rounded-[2rem] border border-gold-400/20" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
              <img
                src={heroImage}
                alt={
                  heroSlides[0]?.label
                    ? `${heroSlides[0].label} photography by DOLL PICTURES`
                    : `${siteContent.brandName} studio photography`
                }
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="glass inline-flex rounded-full px-4 py-2 text-[10px] uppercase tracking-widest text-gold-300">
                  {heroSlides[0]?.label || siteContent.brandName}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
