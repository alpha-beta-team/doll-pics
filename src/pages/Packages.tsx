import { Link } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { useInView } from '../hooks/useScroll';
import { usePageSeo } from '../hooks/usePageSeo';

function PackagesContent() {
  const { siteContent, packageNavLinks, loading } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
  });

  return (
    <div className="packages-editorial relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <div className="packages-editorial-glow pointer-events-none absolute inset-x-0 top-0 h-[34rem]" />

        <section className="relative px-6 py-24 lg:px-10 lg:py-28">
          <div
            ref={ref}
            className={`mx-auto mb-14 max-w-7xl reveal ${inView ? 'in' : ''}`}
          >
            <div className="section-label mb-4">Pricing</div>
            <h1 className="max-w-4xl font-display text-5xl font-light leading-[1.02] text-ink-50 md:text-7xl">
              Packages for every
              <span className="italic text-gold-300"> celebration.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-100/75">
              Choose a category to compare inclusions and pricing — wedding, maternity,
              newborn and more, each with packages curated for cinematic coverage.
            </p>
          </div>

          <div className="relative mx-auto max-w-7xl">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
              </div>
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packageNavLinks.map((link, index) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      data-cursor="hover"
                      className="group block rounded-2xl border border-hairline/10 bg-ink-900/70 p-7 transition-all duration-400 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-ink-800/75 hover:shadow-xl hover:shadow-black/20 sm:p-8"
                      style={{
                        animation: `fadeInUp 0.7s ${index * 0.06}s ease-out both`,
                      }}
                    >
                      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold-400">
                        {link.label}
                      </p>
                      <h2 className="font-display text-[1.75rem] font-light leading-tight text-ink-50 transition-colors group-hover:text-gold-300">
                        {link.label} packages
                      </h2>
                      <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-100/75">
                        {link.description}
                      </p>
                      <span className="mt-7 inline-flex min-h-11 items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-300">
                        Compare packages
                        <span className="h-px w-7 bg-current transition-all duration-400 group-hover:w-11" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <ContactFabHost presentation="editorial" />
    </div>
  );
}

export function Packages() {
  return (
    <SmoothScroll>
      <PackagesContent />
    </SmoothScroll>
  );
}
