import { Link } from 'react-router-dom';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { PackagesGrid } from '../packages/PackagesGrid';
import { ContactFabs } from '../packages/ContactFabs';

export function PackagesPreview() {
  const { packages, siteContent } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="packages" className="relative overflow-hidden bg-ink-950 py-28 px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(212,162,73,0.1), transparent)',
        }}
      />

      <div
        ref={ref}
        className={`relative mx-auto mb-16 max-w-7xl text-center reveal ${inView ? 'in' : ''}`}
      >
        <div className="section-label mb-4">Pricing</div>
        <h2 className="font-display text-4xl font-light tracking-tight text-ink-50 md:text-6xl">
          Our <span className="italic text-gradient-gold">Packages</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          Choose a package that fits your celebration. Every inclusion is curated
          for cinematic coverage and a lasting album of memories.
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <PackagesGrid packages={packages} whatsapp={siteContent.whatsapp} />

        <div className="mt-14 flex justify-center">
          <Link
            to="/packages"
            data-cursor="hover"
            className="group inline-flex items-center gap-3 border border-white/20 px-9 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-ink-50 transition-all duration-400 hover:border-gold-400/60 hover:text-gold-300"
          >
            View all packages
            <span className="h-px w-6 bg-current transition-all duration-400 group-hover:w-10" />
          </Link>
        </div>
      </div>

      <ContactFabs phone={siteContent.phone} whatsapp={siteContent.whatsapp} />
    </section>
  );
}
