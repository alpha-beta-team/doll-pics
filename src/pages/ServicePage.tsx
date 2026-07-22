import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { useInView } from '../hooks/useScroll';
import { trackPhoneClick, trackViewService } from '../lib/analytics';
import { applyPageSeo, resolveServicePage } from '../lib/seo';
import { selectServiceImages, type ServiceImage } from '../lib/serviceImages';
import {
  getPublishedServiceNavLinks,
  normalizePathname,
} from '../lib/navigation';
import { NotFound } from './NotFound';

const HERO_SIZES = '100vw';
const GRID_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
const INLINE_SIZES = '(max-width: 1024px) 100vw, 70vw';

function ServicePageContent() {
  const { pathname } = useLocation();
  const path = normalizePathname(pathname);
  const { siteContent, featuredWork, galleryImages } = useSiteData();
  const serviceLinks = getPublishedServiceNavLinks(siteContent.serviceNavLinks);
  const nav = serviceLinks.find((link) => link.path === path) ?? null;
  const page = resolveServicePage(path, nav);
  const viewTrackedPath = useRef<string | null>(null);
  const otherServiceLinks = serviceLinks.filter((link) => link.path !== path);

  useEffect(() => {
    if (!page) return;
    applyPageSeo(
      {
        path,
        title: page.title,
        description: page.description,
        heading: page.heading,
        body: page.body,
      },
      {
        contact: {
          phone: siteContent.phone,
          email: siteContent.contactEmail,
          socials: siteContent.socials,
        },
        servicePage: page,
        faqs: page.faqs.length ? page.faqs : undefined,
      },
    );
  }, [
    page,
    path,
    siteContent.phone,
    siteContent.contactEmail,
    siteContent.socials,
  ]);

  useEffect(() => {
    if (!page) return;
    if (viewTrackedPath.current === path) return;
    viewTrackedPath.current = path;
    trackViewService({
      service_name: page.label,
      page_path: path,
    });
  }, [page, path]);

  if (!page) return <NotFound />;

  const { hero, gallery, inline } = selectServiceImages({
    imageCategories: page.imageCategories,
    fallbackImages: page.fallbackImages,
    featuredWork,
    galleryImages,
  });

  const phoneHref = siteContent.phone
    ? `tel:${siteContent.phone.replace(/\s/g, '')}`
    : undefined;

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <header className="relative px-6 pb-10 pt-16 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="section-label mb-4">{page.label}</p>
            <h1 className="max-w-4xl font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
              {page.heading}
            </h1>
            <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed text-ink-200/70">
              {page.lead}
            </p>
            <nav
              aria-label="Breadcrumb"
              className="mt-8 flex flex-wrap items-center gap-2 text-xs tracking-wide text-ink-300/50"
            >
              <Link to="/" className="transition-colors hover:text-gold-400">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/services" className="transition-colors hover:text-gold-400">
                Services
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink-200/70">{page.label}</span>
            </nav>
          </div>
        </header>

        {hero ? (
          <div className="relative w-full">
            <div className="relative min-h-[50vh] w-full overflow-hidden md:min-h-[62vh]">
              <ResponsiveImage
                src={hero.src}
                alt={hero.alt}
                avifSrcSet={hero.avifSrcSet}
                webpSrcSet={hero.webpSrcSet}
                sizes={HERO_SIZES}
                width={1600}
                height={1000}
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <section className="relative px-6 py-20 lg:px-10">
            <div className="mx-auto mb-12 max-w-7xl">
              <p className="section-label mb-4">Selected work</p>
              <h2 className="max-w-3xl font-display text-4xl font-light text-ink-50 md:text-5xl">
                Frames from this
                <span className="italic text-gradient-gold"> craft.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
                A look at the mood and moments we create — explore more in our{' '}
                <Link to="/work" className="text-gold-400 transition-colors hover:text-gold-300">
                  featured work
                </Link>{' '}
                and{' '}
                <Link to="/gallery" className="text-gold-400 transition-colors hover:text-gold-300">
                  gallery
                </Link>
                .
              </p>
            </div>
            <ServiceWorkGrid images={gallery} />
          </section>
        ) : null}

        <article className="relative px-6 pb-24 lg:px-10">
          <div className="mx-auto max-w-3xl space-y-16">
            {page.sections.map((section, index) => (
              <div key={section.heading} className="space-y-10">
                <section>
                  <h2 className="font-display text-3xl font-light text-ink-50 md:text-4xl">
                    {section.heading}
                  </h2>
                  <div className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-ink-200/70">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                </section>
                {inline[index] ? (
                  <figure className="overflow-hidden rounded-2xl">
                    <ResponsiveImage
                      src={inline[index].src}
                      alt={inline[index].alt}
                      avifSrcSet={inline[index].avifSrcSet}
                      webpSrcSet={inline[index].webpSrcSet}
                      sizes={INLINE_SIZES}
                      width={1200}
                      height={800}
                      loading="lazy"
                      className="aspect-[3/2] w-full object-cover"
                    />
                  </figure>
                ) : null}
              </div>
            ))}

            <section>
              <h2 className="font-display text-3xl font-light text-ink-50 md:text-4xl">
                Studio location
              </h2>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-200/70">
                Doll Pictures by Ramya Vignesh — URT TOWERS, 139/4-D, Perundurai Rd,
                Teachers Colony, Palayapalayam, Erode, Tamil Nadu 638011.
                {siteContent.phone ? (
                  <>
                    {' '}
                    Call{' '}
                    <a
                      href={phoneHref}
                      className="text-gold-400 transition-colors hover:text-gold-300"
                      onClick={() =>
                        trackPhoneClick({
                          cta_location: 'service_page',
                          page_path: path,
                        })
                      }
                    >
                      {siteContent.phone}
                    </a>
                    .
                  </>
                ) : null}
              </p>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-200/70">
                We photograph across Tamil Nadu, including Salem, Namakkal, Coimbatore
                and Chennai. Opening hours and travel fees are confirmed during your
                free consultation.
              </p>
            </section>

            {page.faqs.length > 0 ? (
              <section>
                <h2 className="font-display text-3xl font-light text-ink-50 md:text-4xl">
                  Frequently asked questions
                </h2>
                <div className="mt-8 space-y-8">
                  {page.faqs.map((faq) => (
                    <div key={faq.question}>
                      <h3 className="text-base font-medium text-ink-50">{faq.question}</h3>
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-200/70">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border-t border-hairline/5 pt-14">
              <h2 className="font-display text-3xl font-light text-ink-50 md:text-4xl">
                Ready to plan your session?
              </h2>
              <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
                Share your date and shoot type — we will confirm availability and schedule
                a free consultation. Package details are confirmed when you book.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-sm bg-gold-500 px-6 py-3 text-sm font-medium tracking-wide text-on-gold transition-colors hover:bg-gold-400"
                >
                  Book a session
                </Link>
                <Link
                  to="/packages"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-sm border border-hairline/15 px-6 py-3 text-sm tracking-wide text-ink-50 transition-colors hover:border-gold-400/50 hover:text-gold-400"
                >
                  View packages
                </Link>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs uppercase tracking-widest text-gold-400">
                Explore more
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {page.related.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      data-cursor="hover"
                      className="text-sm text-ink-200/60 transition-colors hover:text-ink-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-hairline/5 pt-6">
                {otherServiceLinks.map((route) => (
                  <li key={route.path}>
                    <Link
                      to={route.path}
                      data-cursor="hover"
                      className="text-sm text-ink-200/50 transition-colors hover:text-gold-400"
                    >
                      {route.label} Photography
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </main>

      <Footer />
      <ContactFabHost />
    </div>
  );
}

function ServiceWorkGrid({ images }: { images: ServiceImage[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
        inView ? 'reveal in' : 'reveal'
      }`}
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          data-cursor="view"
          className={`group relative aspect-[4/5] overflow-hidden rounded-2xl reveal-blur ${
            inView ? 'in' : ''
          }`}
          style={{ transitionDelay: `${index * 0.06}s` }}
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            avifSrcSet={image.avifSrcSet}
            webpSrcSet={image.webpSrcSet}
            sizes={GRID_SIZES}
            width={800}
            height={1000}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          {image.category || image.title ? (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {image.category ? (
                <p className="section-label mb-1 text-gold-300">{image.category}</p>
              ) : null}
              {image.title ? (
                <p className="font-display text-xl font-light text-white">{image.title}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ServicePage() {
  return (
    <SmoothScroll>
      <ServicePageContent />
    </SmoothScroll>
  );
}
