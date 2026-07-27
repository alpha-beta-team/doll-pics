import { ArrowDown, ArrowUpRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { SmoothScroll } from '../components/SmoothScroll';
import { Footer } from '../components/sections/Footer';
import { ClientReviews } from '../components/stories/ClientReviews';
import { useSiteData } from '../contexts/SiteDataContext';
import { usePageSeo } from '../hooks/usePageSeo';
import { BOOKING_ROUTE } from '../lib/navigation';

function StoriesContent() {
  const { siteContent, testimonials } = useSiteData();

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
  });

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-x-clip bg-ink-950 pt-20">
        <header className="relative flex min-h-[68svh] items-center px-6 py-20 lg:px-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 70% at 20% 45%, rgb(var(--gold-glow) / 0.13), transparent 60%)',
            }}
          />
          <Quote
            className="pointer-events-none absolute right-[8%] top-1/2 hidden h-64 w-64 -translate-y-1/2 text-gold-400/[0.035] lg:block"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hairline/15 to-transparent" />

          <div className="relative mx-auto w-full max-w-7xl">
            <p className="section-label mb-6">Client stories</p>
            <h1 className="max-w-5xl font-display text-6xl font-light leading-[0.94] text-ink-50 sm:text-7xl md:text-8xl lg:text-9xl">
              Kind words.
              <br />
              <span className="italic text-gradient-gold">
                Lasting memories.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-base font-light leading-relaxed text-ink-100/75 sm:text-lg md:text-xl">
              Honest reflections from couples and families who trusted us with
              the moments they never want to forget.
            </p>

            <div className="mt-12 flex items-center gap-4 text-ink-200/65">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline/15">
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em]">
                Read their stories
              </span>
            </div>
          </div>
        </header>

        <ClientReviews reviews={testimonials} />

        <section
          aria-labelledby="stories-cta-title"
          className="relative overflow-hidden px-6 py-28 sm:py-36 lg:px-10 lg:py-40"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 50% 100%, rgb(var(--gold-glow) / 0.12), transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="section-label mb-6">Your story starts here</p>
            <h2
              id="stories-cta-title"
              className="font-display text-5xl font-light leading-[0.98] text-ink-50 sm:text-6xl md:text-8xl"
            >
              Ready to create
              <span className="italic text-gradient-gold"> your own?</span>
            </h2>
            <Link
              to={BOOKING_ROUTE.path}
              data-cursor="hover"
              className="btn-primary group mt-10"
            >
              <span className="relative z-10">Book a consultation</span>
              <ArrowUpRight
                className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      </main>

      <ContactFabHost />
      <Footer />
    </div>
  );
}

export function Stories() {
  return (
    <SmoothScroll>
      <StoriesContent />
    </SmoothScroll>
  );
}
