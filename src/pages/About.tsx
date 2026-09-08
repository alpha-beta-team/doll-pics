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
  usePageSeo();

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="relative overflow-hidden bg-ink-950 pt-20">
        <header className="px-6 pt-16 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <h1 className="max-w-3xl font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
              About Doll Pictures and our Erode studio
            </h1>
          </div>
        </header>
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
    <SmoothScroll>
      <AboutContent />
    </SmoothScroll>
  );
}
