import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SmoothScroll } from '../components/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { SectionPageIntro } from '../components/SectionPageIntro';
import { HomeExperience } from '../components/home/HomeExperience';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { PATH_TO_SECTION } from '../lib/navigation';
import { SECTION_COMPONENTS } from '../lib/sectionComponents';
import { getPageSeo } from '../lib/seo';
import { usePageSeo } from '../hooks/usePageSeo';

const BookingFaq = lazy(() =>
  import('../components/sections/BookingFaq').then((m) => ({
    default: m.BookingFaq,
  })),
);

function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />
      {children}
      <ContactFabHost />
      <Footer />
    </div>
  );
}

function SectionOnlyView({
  sectionId,
  pathname,
}: {
  sectionId: string;
  pathname: string;
}) {
  const Section = SECTION_COMPONENTS[sectionId];
  const seo = getPageSeo(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectionId]);

  if (!Section) return null;

  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="relative pt-20">
        {pathname !== '/gallery' &&
        pathname !== '/services' &&
        seo.heading &&
        seo.body ? (
          <SectionPageIntro heading={seo.heading} body={seo.body} />
        ) : null}
        <Suspense fallback={null}>
          <Section />
          {pathname === '/booking' ? <BookingFaq /> : null}
        </Suspense>
      </main>
    </SiteShell>
  );
}

function HomeView() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1}>
        <HomeExperience />
      </main>
    </SiteShell>
  );
}

function SiteContent() {
  const { pathname } = useLocation();
  const sectionId = PATH_TO_SECTION[pathname];

  usePageSeo();

  if (sectionId) {
    return <SectionOnlyView sectionId={sectionId} pathname={pathname} />;
  }

  return <HomeView />;
}

export function Site() {
  return (
    <SmoothScroll>
      <SiteContent />
    </SmoothScroll>
  );
}
