import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteDataProvider, useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { usePageSeo } from '../hooks/usePageSeo';
import { getPageSeo } from '../lib/seo';

type LegalPageProps = {
  path: '/privacy' | '/terms';
  children: ReactNode;
};

function LegalPageContent({ path, children }: LegalPageProps) {
  const { siteContent } = useSiteData();
  const seo = getPageSeo(path);

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
  });

  return (
    <div className="relative min-h-screen bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,162,73,0.1), transparent)',
          }}
        />

        <article className="relative mx-auto max-w-3xl px-6 py-24 lg:px-10">
          <p className="section-label mb-4">Legal</p>
          <h1 className="font-display text-5xl font-light leading-tight text-ink-50 md:text-6xl">
            {seo.heading}
          </h1>
          <p className="mt-4 text-sm text-ink-200/50">
            Last updated: 9 July 2026
          </p>
          <div className="prose-legal mt-12 space-y-8 text-[0.95rem] leading-relaxed text-ink-200/75">
            {children}
          </div>
          <p className="mt-16 text-sm text-ink-200/50">
            Questions?{' '}
            <Link to="/booking" className="text-gold-400 hover:text-gold-300">
              Contact us
            </Link>
            {siteContent.contactEmail ? (
              <>
                {' '}
                or email{' '}
                <a
                  href={`mailto:${siteContent.contactEmail}`}
                  className="text-gold-400 hover:text-gold-300"
                >
                  {siteContent.contactEmail}
                </a>
              </>
            ) : null}
            .
          </p>
        </article>
      </main>

      <Footer />
      <ContactFabHost />
    </div>
  );
}

export function LegalPage(props: LegalPageProps) {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <LegalPageContent {...props} />
      </SmoothScroll>
    </SiteDataProvider>
  );
}
