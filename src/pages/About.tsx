import { SiteDataProvider, useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabs } from '../components/packages/ContactFabs';
import { AboutHero } from '../components/about/AboutHero';
import { AboutGallery } from '../components/about/AboutGallery';
import { OurStory } from '../components/about/OurStory';
import { BehindScenesPreview } from '../components/about/BehindScenesPreview';
import { MeetTheTeam } from '../components/about/MeetTheTeam';

function AboutContent() {
  const { siteContent } = useSiteData();

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <AboutHero />
        <AboutGallery />
        <OurStory />
        <BehindScenesPreview />
        <MeetTheTeam />
      </main>

      <Footer />
      <ContactFabs phone={siteContent.phone} whatsapp={siteContent.whatsapp} />
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
