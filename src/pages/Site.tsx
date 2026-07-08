import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SmoothScroll } from '../components/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/sections/Hero';
import { ScrollStorytelling } from '../components/sections/ScrollStorytelling';
import { FeaturedWork } from '../components/sections/FeaturedWork';
import { HorizontalGallery } from '../components/sections/HorizontalGallery';
import { BeforeAfter } from '../components/sections/BeforeAfter';
import { Services } from '../components/sections/Services';
import { PackagesPreview } from '../components/sections/PackagesPreview';
import { Statistics } from '../components/sections/Statistics';
import { Testimonials } from '../components/sections/Testimonials';
import { BehindScenes } from '../components/sections/BehindScenes';
import { BookingCTA } from '../components/sections/BookingCTA';
import { Footer } from '../components/sections/Footer';
import { SiteDataProvider } from '../contexts/SiteDataContext';
import { PATH_TO_SECTION } from '../lib/navigation';
import { SECTION_COMPONENTS } from '../lib/sectionComponents';

function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

function SectionOnlyView({ sectionId }: { sectionId: string }) {
  const Section = SECTION_COMPONENTS[sectionId];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectionId]);

  if (!Section) return null;

  return (
    <SiteShell>
      <main className="relative pt-20">
        <Section />
      </main>
    </SiteShell>
  );
}

function HomeView() {
  return (
    <SiteShell>
      <main>
        <Hero />
        <ScrollStorytelling />
        <FeaturedWork />
        <HorizontalGallery />
        <BeforeAfter />
        <Services />
        <PackagesPreview />
        <Statistics />
        <Testimonials />
        <BehindScenes />
        <BookingCTA />
      </main>
    </SiteShell>
  );
}

function SiteContent() {
  const { pathname } = useLocation();
  const sectionId = PATH_TO_SECTION[pathname];

  if (sectionId) {
    return <SectionOnlyView sectionId={sectionId} />;
  }

  return <HomeView />;
}

export function Site() {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <SiteContent />
      </SmoothScroll>
    </SiteDataProvider>
  );
}
