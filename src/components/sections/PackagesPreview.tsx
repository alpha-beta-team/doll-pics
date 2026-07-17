import { Link } from 'react-router-dom';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { PackagesGrid } from '../packages/PackagesGrid';

export function PackagesPreview() {
  const { packages, siteContent, packageNavLinks } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();
  const previewPackages = packages.slice(0, 3);

  return (
    <section id="packages" className="relative overflow-hidden bg-ink-950 py-28 px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 50% 0%, rgb(var(--gold-glow) / 0.1), transparent)',
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
          Choose a package that fits your celebration. Browse by category — wedding,
          maternity, newborn and more.
        </p>
        {packageNavLinks.length > 0 ? (
          <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {packageNavLinks.slice(0, 5).map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  data-cursor="hover"
                  className="text-sm text-ink-200/60 transition-colors hover:text-gold-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative mx-auto max-w-7xl">
        <PackagesGrid packages={previewPackages} whatsapp={siteContent.whatsapp} />

        <div className="mt-14 flex justify-center">
          <Link
            to="/packages"
            data-cursor="hover"
            className="group inline-flex items-center gap-3 border border-hairline/20 px-9 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-ink-50 transition-all duration-400 hover:border-gold-400/60 hover:text-gold-300"
          >
            Browse packages
            <span className="h-px w-6 bg-current transition-all duration-400 group-hover:w-10" />
          </Link>
        </div>
      </div>
    </section>
  );
}
