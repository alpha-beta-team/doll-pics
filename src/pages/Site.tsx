import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SmoothScroll } from '../components/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { SectionPageIntro } from '../components/SectionPageIntro';
import { Hero } from '../components/sections/Hero';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { useSiteData } from '../contexts/SiteDataContext';
import { PATH_TO_SECTION } from '../lib/navigation';
import { SECTION_COMPONENTS } from '../lib/sectionComponents';
import { getPageSeo } from '../lib/seo';
import { usePageSeo } from '../hooks/usePageSeo';

const ScrollStorytelling = lazy(() =>
  import('../components/sections/ScrollStorytelling').then((m) => ({
    default: m.ScrollStorytelling,
  })),
);
const FeaturedWork = lazy(() =>
  import('../components/sections/FeaturedWork').then((m) => ({
    default: m.FeaturedWork,
  })),
);
const HorizontalGallery = lazy(() =>
  import('../components/sections/HorizontalGallery').then((m) => ({
    default: m.HorizontalGallery,
  })),
);
const Services = lazy(() =>
  import('../components/sections/Services').then((m) => ({
    default: m.Services,
  })),
);
const Statistics = lazy(() =>
  import('../components/sections/Statistics').then((m) => ({
    default: m.Statistics,
  })),
);
const Testimonials = lazy(() =>
  import('../components/sections/Testimonials').then((m) => ({
    default: m.Testimonials,
  })),
);
const BehindScenes = lazy(() =>
  import('../components/sections/BehindScenes').then((m) => ({
    default: m.BehindScenes,
  })),
);
const BookingCTA = lazy(() =>
  import('../components/sections/BookingCTA').then((m) => ({
    default: m.BookingCTA,
  })),
);
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
      <main className="relative pt-20">
        {seo.heading && seo.body ? (
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

function accessibleName(el: Element): string {
  const aria = el.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  const title = el.getAttribute('title')?.trim();
  if (title) return title;
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text) return text;
  const img = el.querySelector('img[alt]');
  if (img?.getAttribute('alt')?.trim()) return img.getAttribute('alt')!.trim();
  return '';
}

function HomeView() {
  // #region agent log
  useEffect(() => {
    const runId = 'psi-audit-pre';
    const send = (hypothesisId: string, message: string, data: Record<string, unknown>) => {
      fetch('http://127.0.0.1:7518/ingest/2fea5244-aa31-43a6-95ab-4cf29183c86e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5a4a21' },
        body: JSON.stringify({
          sessionId: '5a4a21',
          runId,
          hypothesisId,
          location: 'Site.tsx:HomeView',
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    };

    const audit = () => {
      const namelessButtons = Array.from(document.querySelectorAll('button')).
        filter((b) => !accessibleName(b)).
        map((b) => ({
          className: b.className.slice(0, 120),
          html: b.outerHTML.slice(0, 200),
        }));
      send('A', 'buttons without accessible name', {
        count: namelessButtons.length,
        samples: namelessButtons.slice(0, 12),
      });

      const namelessLinks = Array.from(document.querySelectorAll('a[href]')).
        filter((a) => !accessibleName(a)).
        map((a) => ({
          href: (a as HTMLAnchorElement).href,
          className: a.className.slice(0, 120),
          html: a.outerHTML.slice(0, 220),
        }));
      send('B', 'links without discernible name', {
        count: namelessLinks.length,
        samples: namelessLinks.slice(0, 8),
      });

      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => ({
        tag: h.tagName.toLowerCase(),
        text: (h.textContent ?? '').trim().slice(0, 40),
      }));
      const skips: Array<{ from: string; to: string; text: string }> = [];
      let prev = 0;
      for (const h of headings) {
        const level = Number(h.tag.slice(1));
        if (prev && level > prev + 1) {
          skips.push({ from: `h${prev}`, to: h.tag, text: h.text });
        }
        prev = level;
      }
      send('C', 'heading order audit', { headings, skips });

      const stylesheets = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]'),
      ).map((l) => ({
        href: (l as HTMLLinkElement).href,
        media: (l as HTMLLinkElement).media || 'all',
        disabled: (l as HTMLLinkElement).disabled,
      }));
      send('D', 'render-blocking stylesheets', {
        count: stylesheets.length,
        stylesheets,
      });

      const menuBtn = document.querySelector('nav button.lg\\:hidden, button.lg\\:hidden');
      send('A', 'navbar menu button name check', {
        found: !!menuBtn,
        name: menuBtn ? accessibleName(menuBtn) : null,
        html: menuBtn?.outerHTML.slice(0, 180) ?? null,
      });

      const socialLinks = Array.from(
        document.querySelectorAll('footer a[href*="instagram"], footer a[href*="facebook"], footer a[href*="youtube"]'),
      ).map((a) => ({
        href: (a as HTMLAnchorElement).href,
        name: accessibleName(a),
      }));
      send('B', 'footer social link names', { socialLinks });

      const footerH4 = Array.from(document.querySelectorAll('footer h4')).map((h) =>
        (h.textContent ?? '').trim(),
      );
      send('C', 'footer h4 titles', { footerH4 });
    };

    // Wait for lazy sections (Testimonials etc.) to mount
    const t1 = window.setTimeout(audit, 1500);
    const t2 = window.setTimeout(audit, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  // #endregion

  return (
    <SiteShell>
      <main>
        <Hero />
        <Suspense fallback={null}>
          <ScrollStorytelling />
          <FeaturedWork />
          <HorizontalGallery />
          <Services />
          <Statistics />
          <Testimonials />
          <BehindScenes />
          <BookingCTA />
        </Suspense>
      </main>
    </SiteShell>
  );
}

function SiteContent() {
  const { pathname } = useLocation();
  const { siteContent } = useSiteData();
  const sectionId = PATH_TO_SECTION[pathname];

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
  });

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
