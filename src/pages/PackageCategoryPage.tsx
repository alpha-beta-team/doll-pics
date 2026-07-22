import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { SmoothScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ContactFabHost } from '../components/packages/ContactFabs';
import { PackagesGrid } from '../components/packages/PackagesGrid';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { useInView } from '../hooks/useScroll';
import { trackPhoneClick, trackViewService } from '../lib/analytics';
import {
  applyPageSeo,
  resolvePackagePage,
} from '../lib/seo';
import { selectServiceImages, type ServiceImage } from '../lib/serviceImages';
import { normalizePathname } from '../lib/navigation';
import { NotFound } from './NotFound';

const GRID_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
const INLINE_SIZES = '(max-width: 1024px) 100vw, 70vw';

function packageMatchesCategory(
  pkg: { categorySlug?: string; shootType?: string; categoryName?: string },
  categorySlug: string,
  label: string,
): boolean {
  if (pkg.categorySlug?.toLowerCase() === categorySlug) return true;
  const name = (pkg.categoryName || pkg.shootType || '').trim().toLowerCase();
  return name === label.toLowerCase() || name === categorySlug.replace(/-/g, ' ');
}

function PackageCategoryPageContent() {
  const { pathname } = useLocation();
  const path = normalizePathname(pathname);
  const {
    siteContent,
    featuredWork,
    galleryImages,
    packages,
    packageNavLinks,
    loading,
  } = useSiteData();
  const nav = packageNavLinks.find((link) => link.path === path) ?? null;
  const page = resolvePackagePage(path, nav);
  const viewTrackedPath = useRef<string | null>(null);

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
        packagePage: page,
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
      service_name: `${page.label} Packages`,
      page_path: path,
    });
  }, [page, path]);

  if (!page) return <NotFound />;

  const categoryPackages = packages.filter((pkg) =>
    packageMatchesCategory(pkg, page.categorySlug, page.label),
  );

  const { gallery, inline } = selectServiceImages({
    imageCategories: page.imageCategories,
    fallbackImages: page.fallbackImages,
    featuredWork,
    galleryImages,
  });

  const otherPackageLinks = packageNavLinks.filter((link) => link.path !== path);

  const phoneHref = siteContent.phone
    ? `tel:${siteContent.phone.replace(/\s/g, '')}`
    : undefined;

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <section id="packages" className="relative px-6 pb-16 pt-12 lg:px-10">
          <div className="mx-auto mb-10 max-w-7xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-2 text-xs tracking-wide text-ink-300/50"
            >
              <Link to="/" className="transition-colors hover:text-gold-400">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/packages" className="transition-colors hover:text-gold-400">
                Packages
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink-200/70">{page.label}</span>
            </nav>
            <h1 className="max-w-3xl font-display text-4xl font-light leading-tight text-ink-50 md:text-5xl">
              {page.heading}
            </h1>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
              {page.lead}
            </p>
          </div>
          <div className="relative mx-auto max-w-7xl">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
              </div>
            ) : (
              <PackagesGrid
                packages={categoryPackages}
                whatsapp={siteContent.whatsapp}
              />
            )}
          </div>
        </section>

        {gallery.length > 0 ? (
          <section className="relative px-6 py-20 lg:px-10">
            <div className="mx-auto mb-12 max-w-7xl">
              <p className="section-label mb-4">Selected work</p>
              <h2 className="max-w-3xl font-display text-4xl font-light text-ink-50 md:text-5xl">
                Frames from this
                <span className="italic text-gradient-gold"> craft.</span>
              </h2>
            </div>
            <PackageWorkGrid images={gallery} />
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
                Ready to choose a package?
              </h2>
              <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
                Enquire on a package above or book a free consultation — we will confirm
                inclusions and availability for your date.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-sm bg-gold-500 px-6 py-3 text-sm font-medium tracking-wide text-on-gold transition-colors hover:bg-gold-400"
                >
                  Book a consultation
                </Link>
                <a
                  href="#packages"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-sm border border-hairline/15 px-6 py-3 text-sm tracking-wide text-ink-50 transition-colors hover:border-gold-400/50 hover:text-gold-400"
                >
                  View packages
                </a>
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
                {otherPackageLinks.map((route) => (
                  <li key={route.path}>
                    <Link
                      to={route.path}
                      data-cursor="hover"
                      className="text-sm text-ink-200/50 transition-colors hover:text-gold-400"
                    >
                      {route.label} Packages
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

function PackageWorkGrid({ images }: { images: ServiceImage[] }) {
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
        </div>
      ))}
    </div>
  );
}

export function PackageCategoryPage() {
  return (
    <SmoothScroll>
      <PackageCategoryPageContent />
    </SmoothScroll>
  );
}
