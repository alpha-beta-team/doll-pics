import { SmoothScroll } from '../components/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/sections/Hero';
import { ScrollStorytelling } from '../components/sections/ScrollStorytelling';
import { FeaturedWork } from '../components/sections/FeaturedWork';
import { HorizontalGallery } from '../components/sections/HorizontalGallery';
import { BeforeAfter } from '../components/sections/BeforeAfter';
import { Services } from '../components/sections/Services';
import { Statistics } from '../components/sections/Statistics';
import { Testimonials } from '../components/sections/Testimonials';
import { BehindScenes } from '../components/sections/BehindScenes';
import { BookingCTA } from '../components/sections/BookingCTA';
import { Footer } from '../components/sections/Footer';
import { SiteDataProvider } from '../contexts/SiteDataContext';

export function Site() {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <div className="relative bg-ink-950">
          <CustomCursor />
          <div className="film-grain" />
          <Navbar />
          <main>
            <Hero />
            <ScrollStorytelling />
            <FeaturedWork />
            <HorizontalGallery />
            <BeforeAfter />
            <Services />
            <Statistics />
            <Testimonials />
            <BehindScenes />
            <BookingCTA />
          </main>
          <Footer />
        </div>
      </SmoothScroll>
    </SiteDataProvider>
  );
}
