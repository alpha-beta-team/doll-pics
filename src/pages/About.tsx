import { SiteDataProvider, useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { OurStory } from '../components/about/OurStory';
import { BehindScenesPreview } from '../components/about/BehindScenesPreview';
import { MeetTheTeam } from '../components/about/MeetTheTeam';
import { usePageSeo } from '../hooks/usePageSeo';

function AboutContent() {
  const { siteContent } = useSiteData();

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

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <OurStory />
        <BehindScenesPreview />
        <MeetTheTeam />
      </main>

      <Footer />
      <ContactFabHost />
    </div>
  );
}

export function About() {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <AboutContent />
      </SmoothScroll>
    </SiteDataProvider>
  );
}
