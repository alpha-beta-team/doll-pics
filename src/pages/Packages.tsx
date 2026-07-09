import { SiteDataProvider, useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { PackagesGrid } from '../components/packages/PackagesGrid';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { useInView } from '../hooks/useScroll';
import { usePageSeo } from '../hooks/usePageSeo';
import { computeAggregateRating } from '../lib/seo';

function PackagesContent() {
  const { siteContent, packages, loading, testimonials } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
    aggregateRating: computeAggregateRating(testimonials),
  });

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,162,73,0.12), transparent)',
          }}
        />

        <section className="relative px-6 py-32 lg:px-10">
          <div
            ref={ref}
            className={`mx-auto mb-20 max-w-7xl reveal ${inView ? 'in' : ''}`}
          >
            <div className="section-label mb-4">Pricing</div>
            <h1 className="max-w-3xl font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
              Packages for every
              <span className="italic text-gradient-gold"> celebration.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
              Choose a package that fits your celebration. Every inclusion is curated
              for cinematic coverage and a lasting album of memories.
            </p>
          </div>

          <div className="relative mx-auto max-w-7xl">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
              </div>
            ) : (
              <PackagesGrid packages={packages} whatsapp={siteContent.whatsapp} />
            )}
          </div>
        </section>
      </main>

      <Footer />
      <ContactFabHost />
    </div>
  );
}

export function Packages() {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <PackagesContent />
      </SmoothScroll>
    </SiteDataProvider>
  );
}
