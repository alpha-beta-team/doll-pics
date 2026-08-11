import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useSiteData } from '../contexts/SiteDataContext';
import { CustomCursor } from '../components/CustomCursor';
import { EnquiryModal } from '../components/EnquiryModal';
import {
  PhotoLightbox,
  type LightboxPhoto,
} from '../components/PhotoLightbox';
import { SmoothScroll, syncWindowScroll } from '../components/SmoothScroll';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { useInView } from '../hooks/useScroll';
import {
  trackPhoneClick,
  trackViewService,
  trackWhatsAppClick,
} from '../lib/analytics';
import { applyPageSeo, resolveServicePage } from '../lib/seo';
import { selectServiceImages, type ServiceImage } from '../lib/serviceImages';
import { getPhotoSources, publicApi } from '../lib/api';
import type { PublicPhoto } from '../shared/types';
import { enquiryWhatsAppUrl, whatsappDigits } from '../lib/pricing';
import {
  SHOOT_TYPE_OPTIONS,
  type ShootTypeOption,
} from '../lib/shootTypes';
import {
  getPublishedServiceNavLinks,
  normalizePathname,
} from '../lib/navigation';
import { NotFound } from './NotFound';
import { BUSINESS_NAME, OPENING_HOURS } from '../lib/businessIdentity';
import { STUDIO_ADDRESS, STUDIO_MAPS_URL } from '../lib/studioLocation';

const HERO_SIZES = '100vw';
const GRID_SIZES =
  '(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 48vw, 33vw';
const INLINE_SIZES = '(max-width: 1023px) calc(100vw - 2.5rem), 48vw';
const SERVICE_GALLERY_LIMIT = 30;
const INITIAL_SERVICE_GALLERY_COUNT = 6;
const EARLY_REVEAL_OPTIONS: IntersectionObserverInit = {
  threshold: 0.01,
  rootMargin: '0px 0px 12% 0px',
};

const SERVICE_SHOOT_TYPES: Record<string, ShootTypeOption> = {
  '/wedding-photography-erode': 'Wedding',
  '/newborn-baby-photography-erode': 'Newborn',
  '/maternity-photography-erode': 'Maternity',
  '/baby-milestone-photography-erode': 'Baby Milestone',
  '/cake-smash-photography-erode': 'Cake Smash',
  '/family-photography-erode': 'Family',
};

const API_ONLY_SERVICE_CATEGORIES: Record<string, string> = {
  '/wedding-photography-erode': 'wedding',
  '/newborn-baby-photography-erode': 'newborn',
  '/maternity-photography-erode': 'maternity',
  '/baby-milestone-photography-erode': 'baby-milestone',
  '/baby-shower-photography-erode': 'baby-shower',
  '/cake-smash-photography-erode': 'cake-smash',
  '/family-photography-erode': 'family',
};

function normalizeServiceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bphotography\b|\bin erode\b/g, '')
    .trim();
}

function resolveShootType(
  path: string,
  label: string,
  imageCategories: string[],
): ShootTypeOption {
  if (SERVICE_SHOOT_TYPES[path]) return SERVICE_SHOOT_TYPES[path];

  const candidates = [...imageCategories, label].map(normalizeServiceName);
  const match = SHOOT_TYPE_OPTIONS.find((option) => {
    if (option === 'Other') return false;
    const normalizedOption = normalizeServiceName(option);
    return candidates.some(
      (candidate) =>
        candidate === normalizedOption ||
        candidate.includes(normalizedOption) ||
        normalizedOption.includes(candidate),
    );
  });

  return match ?? 'Other';
}

function resolveApiServiceCategory(path: string, serviceLabel?: string): string | undefined {
  const configured = API_ONLY_SERVICE_CATEGORIES[path];
  if (configured) return configured;

  const normalizedLabel = normalizeServiceName(serviceLabel ?? '');
  return normalizedLabel
    ? normalizedLabel.replace(/\s+/g, '-')
    : undefined;
}

function serviceImagesFromApi(photos: PublicPhoto[]): ServiceImage[] {
  return photos
    .filter(
      (photo) =>
        !photo.storageKey?.startsWith('seed/') &&
        !photo.variants?.original?.url?.includes('picsum.photos'),
    )
    .flatMap<ServiceImage>((photo) => {
      const sources = getPhotoSources(photo);
      if (!sources) return [];
      const populatedCategory = photo.categoryIds?.find(
        (category): category is { name: string; slug: string } =>
          typeof category === 'object' && category !== null,
      );
      return [{
        src: sources.src,
        alt: sources.alt,
        avifSrcSet: sources.avifSrcSet,
        webpSrcSet: sources.webpSrcSet,
        title: photo.title,
        category: populatedCategory?.name,
      }];
    });
}

function ServicePageContent() {
  const { pathname } = useLocation();
  const path = normalizePathname(pathname);
  const { siteContent } = useSiteData();
  const serviceLinks = getPublishedServiceNavLinks(
    siteContent.serviceNavLinks,
  );
  const nav = serviceLinks.find((link) => link.path === path) ?? null;
  const page = resolveServicePage(path, nav);
  const viewTrackedPath = useRef<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [apiServiceMedia, setApiServiceMedia] = useState<{
    path: string;
    images: ServiceImage[];
  }>({ path: '', images: [] });
  const lightboxTrigger = useRef<HTMLElement | null>(null);
  const otherServiceLinks = serviceLinks.filter((link) => link.path !== path);
  const apiServiceCategory = resolveApiServiceCategory(path, nav?.label);

  useEffect(() => {
    let cancelled = false;
    if (!apiServiceCategory) {
      setApiServiceMedia({ path, images: [] });
      return () => {
        cancelled = true;
      };
    }

    setApiServiceMedia({ path, images: [] });
    void Promise.all([
      publicApi.getCategory(apiServiceCategory).catch(() => null),
      publicApi.getPhotos({
        category: apiServiceCategory,
        limit: SERVICE_GALLERY_LIMIT,
      }),
    ])
      .then(([category, photos]) => {
        if (!cancelled) {
          const cover = category?.coverPhotoId && typeof category.coverPhotoId === 'object'
            ? serviceImagesFromApi([category.coverPhotoId])
            : [];
          const categoryImages = serviceImagesFromApi(photos);
          const coverKey = cover[0]?.src.split('?')[0];
          setApiServiceMedia({
            path,
            images: [
              ...cover,
              ...categoryImages.filter(
                (image) => !coverKey || image.src.split('?')[0] !== coverKey,
              ),
            ],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setApiServiceMedia({ path, images: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [apiServiceCategory, path]);

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

  const categoryImages = (
    apiServiceMedia.path === path ? apiServiceMedia.images : []
  ).slice(0, SERVICE_GALLERY_LIMIT);
  const { hero } = selectServiceImages({
    imageCategories: page.imageCategories,
    sourceImages: categoryImages,
    // Service pages intentionally render category API media only.
    sourceOnly: true,
    inlineCount: page.sections.length,
    featuredWork: [],
    galleryImages: [],
  });
  const categoryGallery = categoryImages;
  const shootType = resolveShootType(
    path,
    page.label,
    page.imageCategories,
  );
  const hasWhatsApp = Boolean(whatsappDigits(siteContent.whatsapp));
  const whatsappUrl = enquiryWhatsAppUrl(siteContent.whatsapp, {
    shootType,
    preferredEvent: page.label,
  });
  const phoneHref = siteContent.phone
    ? `tel:${siteContent.phone.replace(/\s/g, '')}`
    : undefined;
  const lightboxPhotos = categoryGallery.map<LightboxPhoto>((image, index) => ({
    id: `${image.src}-${index}`,
    src: image.src,
    alt: image.alt,
    title: image.title || `${page.label} photograph ${index + 1}`,
    meta: image.category || 'Doll Pictures · Erode',
    width: 1600,
    height: 1200,
  }));
  const usefulLinks = page.related.filter(
    (link) => !serviceLinks.some((service) => service.path === link.path),
  );

  const openWhatsApp = () => {
    trackWhatsAppClick({
      cta_location: 'service_page',
      service_name: page.label,
      page_path: path,
    });
  };

  return (
    <div className="services-editorial relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-clip bg-ink-950 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <ServiceHero
          page={page}
          hero={hero}
          hasWhatsApp={hasWhatsApp}
          whatsappUrl={whatsappUrl}
          onBook={() => setShowBooking(true)}
          onWhatsApp={openWhatsApp}
        />

        <ServiceSectionNav
          hasGallery={categoryGallery.length > 0}
          hasExperience={page.sections.length > 0}
          hasFaq={page.faqs.length > 0}
        />

        {page.sections.length > 0 ? (
          <ServiceExperience sections={page.sections} images={categoryGallery} />
        ) : null}

        {categoryGallery.length > 0 ? (
          <ServiceCategoryGallery
            images={categoryGallery}
            label={page.label}
            onOpen={(index, trigger) => {
              lightboxTrigger.current = trigger;
              setLightboxIndex(index);
            }}
          />
        ) : null}

        <ServiceLocation
          phone={siteContent.phone}
          phoneHref={phoneHref}
          path={path}
        />

        {page.faqs.length > 0 ? (
          <ServiceFaq faqs={page.faqs} />
        ) : null}

        <ServiceClosingCta
          label={page.label}
          hasWhatsApp={hasWhatsApp}
          whatsappUrl={whatsappUrl}
          onBook={() => setShowBooking(true)}
          onWhatsApp={openWhatsApp}
        />

        <ServiceDiscovery
          services={otherServiceLinks}
          usefulLinks={usefulLinks}
        />
      </main>

      <Footer />

      <MobileServiceActions
        hasWhatsApp={hasWhatsApp}
        whatsappUrl={whatsappUrl}
        onBook={() => setShowBooking(true)}
        onWhatsApp={openWhatsApp}
      />

      {showBooking ? (
        <EnquiryModal
          prefill={{
            packageName: page.serviceName,
            shootType,
            preferredEvent: page.label,
            message: `I'm interested in a ${page.label.toLowerCase()} photography session.`,
          }}
          onClose={() => setShowBooking(false)}
        />
      ) : null}

      {lightboxIndex !== null && lightboxPhotos[lightboxIndex] ? (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          returnFocus={lightboxTrigger.current}
          onClose={() => setLightboxIndex(null)}
          label={`${page.label} portfolio`}
        />
      ) : null}
    </div>
  );
}

type ResolvedServicePage = NonNullable<
  ReturnType<typeof resolveServicePage>
>;

function ServiceHero({
  page,
  hero,
  hasWhatsApp,
  whatsappUrl,
  onBook,
  onWhatsApp,
}: {
  page: ResolvedServicePage;
  hero: ServiceImage | null;
  hasWhatsApp: boolean;
  whatsappUrl: string;
  onBook: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <header
      id="overview"
      className="service-scroll-target relative flex min-h-[100svh] items-end overflow-hidden bg-[#0b0908] pt-20 text-white"
    >
      {hero ? (
        <ResponsiveImage
          src={hero.src}
          alt={hero.alt}
          avifSrcSet={hero.avifSrcSet}
          webpSrcSet={hero.webpSrcSet}
          sizes={HERO_SIZES}
          width={1920}
          height={1280}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(207,166,90,.18),transparent_34%),linear-gradient(135deg,#17120f,#080706_70%)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,3,.68)_0%,rgba(5,4,3,.12)_35%,rgba(5,4,3,.9)_82%,#090706_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,3,3,.72),transparent_68%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1480px] px-5 pb-10 pt-28 sm:px-8 md:pb-14 lg:px-12 lg:pb-16">
        <nav
          aria-label="Breadcrumb"
          className="hero-enter mb-10 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55 md:mb-14"
        >
          <Link to="/" className="transition-colors hover:text-gold-200">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to="/services"
            className="transition-colors hover:text-gold-200"
          >
            Services
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white/85">{page.label}</span>
        </nav>

        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <p className="hero-enter hero-enter-delay-1 mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-200">
              <span className="h-px w-10 bg-gold-300/70" aria-hidden="true" />
              {page.label} · Doll Pictures
            </p>
            <h1 className="hero-enter hero-enter-delay-2 max-w-5xl font-display text-[clamp(3.35rem,8vw,8rem)] font-light leading-[0.84] tracking-[-0.045em] text-white">
              {page.heading}
            </h1>
          </div>

          <div className="hero-enter hero-enter-delay-3 lg:col-span-4 lg:pb-2">
            <p className="max-w-xl border-l border-white/25 pl-5 text-sm font-light leading-7 text-white/76 sm:text-base">
              {page.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button
                type="button"
                onClick={onBook}
                className="service-primary-action group inline-flex min-h-12 items-center justify-center gap-3 px-6 text-xs font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Book a consultation
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
              {hasWhatsApp ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onWhatsApp}
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/25 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-gold-200 hover:text-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <ul className="hero-enter hero-enter-delay-4 mt-12 grid grid-cols-1 border-y border-white/15 text-[10px] uppercase tracking-[0.2em] text-white/65 sm:grid-cols-3">
          <li className="flex min-h-12 items-center gap-3 border-b border-white/15 py-3 sm:border-b-0 sm:border-r sm:px-4">
            <MapPin className="h-4 w-4 text-gold-200" aria-hidden="true" />
            Erode studio
          </li>
          <li className="flex min-h-12 items-center gap-3 border-b border-white/15 py-3 sm:border-b-0 sm:border-r sm:px-4">
            <Camera className="h-4 w-4 text-gold-200" aria-hidden="true" />
            Tamil Nadu travel
          </li>
          <li className="flex min-h-12 items-center gap-3 py-3 sm:px-4">
            <Sparkles className="h-4 w-4 text-gold-200" aria-hidden="true" />
            Free first consultation
          </li>
        </ul>
      </div>
    </header>
  );
}

function ServiceSectionNav({
  hasGallery,
  hasExperience,
  hasFaq,
}: {
  hasGallery: boolean;
  hasExperience: boolean;
  hasFaq: boolean;
}) {
  const links = [
    hasExperience ? { label: 'Experience', href: '#experience' } : null,
    hasGallery ? { label: 'Gallery', href: '#service-gallery' } : null,
    { label: 'Studio', href: '#studio' },
    hasFaq ? { label: 'FAQ', href: '#faq' } : null,
    { label: 'Contact', href: '#contact' },
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  return (
    <nav
      aria-label="On this page"
      className="sticky top-20 z-40 border-b border-hairline/10 bg-ink-950/90 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-[1480px] snap-x snap-mandatory overflow-x-auto px-5 [scrollbar-width:none] sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden">
        {links.map((link, index) => (
          <li key={link.href} className="shrink-0 snap-start">
            <a
              href={link.href}
              className="flex min-h-14 items-center gap-3 border-r border-hairline/10 px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-300 transition-colors first:pl-0 hover:text-gold-300 focus-visible:outline-none focus-visible:text-gold-300"
            >
              <span className="text-gold-500">
                {String(index + 1).padStart(2, '0')}
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ServiceCategoryGallery({
  images,
  label,
  onOpen,
}: {
  images: ServiceImage[];
  label: string;
  onOpen: (index: number, trigger: HTMLElement) => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(EARLY_REVEAL_OPTIONS);
  const [expanded, setExpanded] = useState(false);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [galleryHeight, setGalleryHeight] = useState<number | null>(null);
  const galleryEndRef = useRef<HTMLDivElement>(null);
  const expandFrame = useRef<number | null>(null);
  const collapseAnchorFrame = useRef<number | null>(null);
  const collapseAnchorUntil = useRef(0);
  const expandedRef = useRef(expanded);
  const galleryImages = images.slice(0, SERVICE_GALLERY_LIMIT);
  const renderedImages = hasExpandedOnce
    ? galleryImages
    : galleryImages.slice(0, INITIAL_SERVICE_GALLERY_COUNT);
  const visibleCount = expanded
    ? galleryImages.length
    : Math.min(INITIAL_SERVICE_GALLERY_COUNT, galleryImages.length);
  expandedRef.current = expanded;

  useEffect(() => {
    if (inView) setHasRevealed(true);
  }, [inView]);

  useEffect(() => {
    setExpanded(false);
    setHasExpandedOnce(false);
    setHasRevealed(false);
    setGalleryHeight(null);
  }, [label]);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const measure = () => {
      const measuredVisibleCount = expandedRef.current
        ? galleryImages.length
        : Math.min(INITIAL_SERVICE_GALLERY_COUNT, galleryImages.length);
      const lastVisibleCard = grid.children[measuredVisibleCount - 1] as
        | HTMLElement
        | undefined;
      const nextHeight = expandedRef.current
        ? grid.scrollHeight
        : lastVisibleCard
          ? lastVisibleCard.offsetTop + lastVisibleCard.offsetHeight
          : 0;
      setGalleryHeight(nextHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [expanded, galleryImages.length, ref, renderedImages.length]);

  useEffect(
    () => () => {
      if (expandFrame.current !== null) {
        cancelAnimationFrame(expandFrame.current);
      }
      if (collapseAnchorFrame.current !== null) {
        cancelAnimationFrame(collapseAnchorFrame.current);
      }
    },
    [],
  );

  const keepGalleryEndAnchored = () => {
    if (performance.now() >= collapseAnchorUntil.current) {
      collapseAnchorFrame.current = null;
      return;
    }
    const galleryEnd = galleryEndRef.current;
    if (!galleryEnd) return;
    const targetBottom = window.innerHeight - 24;
    const difference = galleryEnd.getBoundingClientRect().bottom - targetBottom;
    if (Math.abs(difference) > 0.5) {
      syncWindowScroll(window.scrollY + difference);
    }
    collapseAnchorFrame.current = requestAnimationFrame(keepGalleryEndAnchored);
  };

  const stopGalleryEndAnchor = () => {
    if (collapseAnchorFrame.current !== null) {
      cancelAnimationFrame(collapseAnchorFrame.current);
      collapseAnchorFrame.current = null;
    }
  };

  const toggleGallery = () => {
    if (expanded) {
      setExpanded(false);
      stopGalleryEndAnchor();
      collapseAnchorUntil.current = performance.now() + 850;
      collapseAnchorFrame.current = requestAnimationFrame(keepGalleryEndAnchored);
      return;
    }

    setGalleryHeight(ref.current?.scrollHeight ?? null);
    setHasExpandedOnce(true);
    expandFrame.current = requestAnimationFrame(() => {
      setExpanded(true);
      expandFrame.current = null;
    });
  };

  return (
    <section
      id="service-gallery"
      aria-labelledby="service-gallery-heading"
      className="service-scroll-target relative px-6 py-20 lg:px-10"
    >
      <div className="mx-auto mb-12 max-w-7xl">
        <p className="section-label mb-4">The gallery</p>
        <h2
          id="service-gallery-heading"
          className="max-w-3xl font-display text-4xl font-light text-ink-50 md:text-5xl"
        >
          More {label.toLowerCase()}
          <span className="italic text-gradient-gold"> moments.</span>
        </h2>
      </div>

      <div
        id="service-gallery-grid"
        className="mx-auto max-w-7xl overflow-hidden transition-[max-height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={galleryHeight === null ? undefined : { maxHeight: galleryHeight }}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === 'max-height'
          ) {
            stopGalleryEndAnchor();
          }
        }}
      >
        <div
          ref={ref}
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            hasRevealed ? 'reveal in' : 'reveal'
          }`}
        >
          {renderedImages.map((image, index) => {
            const isVisible = expanded || index < INITIAL_SERVICE_GALLERY_COUNT;
            return (
              <button
                key={image.src}
                type="button"
                tabIndex={isVisible ? 0 : -1}
                aria-hidden={!isVisible}
                data-cursor="view"
                aria-label={`Open ${image.alt}`}
                onClick={(event) => onOpen(index, event.currentTarget)}
                className={`group relative aspect-[4/5] overflow-hidden rounded-2xl text-left outline-none reveal-blur focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950 ${
                  hasRevealed && isVisible ? 'in' : ''
                }`}
                style={{ transitionDelay: `${Math.min(index, 10) * 0.045}s` }}
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
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 group-focus-visible:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
              </button>
            );
          })}
        </div>
      </div>

      {images.length > INITIAL_SERVICE_GALLERY_COUNT ? (
        <div
          ref={galleryEndRef}
          className="mx-auto mt-10 flex max-w-7xl justify-center"
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="service-gallery-grid"
            onClick={toggleGallery}
            className="group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full border border-gold-300/50 bg-gold-300/[0.06] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-200 transition-all hover:border-gold-300 hover:bg-gold-300 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950"
          >
            {expanded
              ? 'Show less'
              : `Show more (${galleryImages.length - visibleCount})`}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ServiceExperience({
  sections,
  images,
}: {
  sections: ResolvedServicePage['sections'];
  images: ServiceImage[];
}) {
  return (
    <section
      id="experience"
      className="service-scroll-target border-y border-hairline/10 bg-ink-900/25 px-5 py-24 sm:px-8 md:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="section-label mb-5">The experience</p>
            <h2 className="font-display text-[clamp(3rem,6vw,6.5rem)] font-light leading-[0.9] tracking-[-0.04em] text-ink-50">
              Thoughtful from the
              <span className="block italic text-gold-300">first conversation.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-ink-300 lg:col-span-4">
            Calm guidance, intentional photographs, and room for your story to
            unfold naturally.
          </p>
        </div>

        <div className="space-y-20 md:space-y-28">
          {sections.map((section, index) => {
            const image = section.imageUrl
              ? {
                  src: section.imageUrl,
                  alt: section.imageAlt || section.heading,
                }
              : images.length
                ? images[index % images.length]
                : undefined;
            const imageFirst = index % 2 === 1;
            return (
              <article
                key={section.heading}
                className="grid items-center gap-10 border-t border-hairline/10 pt-10 lg:grid-cols-12 lg:gap-16"
              >
                <div
                  className={`lg:col-span-5 ${
                    imageFirst ? 'lg:col-start-8' : ''
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-400">
                    Chapter {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-5 font-display text-[clamp(2.35rem,4vw,4.4rem)] font-light leading-[0.95] tracking-[-0.025em] text-ink-50">
                    {section.heading}
                  </h3>
                  <div className="mt-7 space-y-5 text-[0.95rem] leading-7 text-ink-200/75">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {image ? (
                  <figure
                    className={`overflow-hidden bg-ink-800 lg:col-span-6 ${
                      imageFirst
                        ? 'lg:col-start-1 lg:row-start-1'
                        : 'lg:col-start-7'
                    }`}
                  >
                    <ResponsiveImage
                      src={image.src}
                      alt={image.alt}
                      avifSrcSet={image.avifSrcSet}
                      webpSrcSet={image.webpSrcSet}
                      sizes={INLINE_SIZES}
                      width={1200}
                      height={1400}
                      loading="lazy"
                      className="aspect-[5/6] w-full object-cover"
                    />
                  </figure>
                ) : (
                  <div
                    className={`hidden min-h-48 border border-hairline/10 bg-[radial-gradient(circle_at_center,rgb(var(--gold-glow)/.08),transparent_65%)] lg:col-span-6 lg:block ${
                      imageFirst
                        ? 'lg:col-start-1 lg:row-start-1'
                        : 'lg:col-start-7'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceLocation({
  phone,
  phoneHref,
  path,
}: {
  phone: string;
  phoneHref?: string;
  path: string;
}) {
  return (
    <section
      id="studio"
      className="service-scroll-target px-5 py-24 sm:px-8 md:py-32 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1480px] overflow-hidden border border-hairline/10 bg-ink-900/55 lg:grid-cols-12">
        <a
          href={STUDIO_MAPS_URL}
          target="_blank"
          rel="noreferrer"
          data-cursor="hover"
          aria-label="Get directions to Doll Pictures studio at URT TOWERS, Erode (opens in a new tab)"
          className="group relative min-h-72 overflow-hidden border-b border-hairline/10 p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300 sm:p-10 lg:col-span-5 lg:min-h-[30rem] lg:border-b-0 lg:border-r"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(var(--gold-glow)/.18),transparent_38%),linear-gradient(145deg,rgb(var(--ink-800)),rgb(var(--ink-950)))]" />
          <div className="relative flex h-full flex-col justify-between">
            <MapPin
              className="h-9 w-9 text-gold-300 transition-transform duration-300 group-hover:-translate-y-1"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            <img
              src="/logo-doll.png"
              alt=""
              width={112}
              height={112}
              className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full object-cover ring-1 ring-gold-300/30 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 lg:left-1/2 lg:right-auto lg:top-[36%] lg:h-28 lg:w-28 lg:-translate-x-1/2 lg:-translate-y-1/2"
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">
                Visit the studio
              </p>
              <p className="mt-4 font-display text-4xl font-light leading-tight text-ink-50 sm:text-5xl">
                At the heart of
                <span className="block italic text-gold-300">Erode.</span>
              </p>
              <span className="mt-6 inline-flex items-center gap-2 border-b border-gold-300/70 pb-1 text-sm font-medium text-ink-50 transition-colors group-hover:text-gold-300">
                Get directions
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </a>

        <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-7 lg:p-16">
          <h2 className="font-display text-3xl font-light text-ink-50 sm:text-4xl">
            {BUSINESS_NAME}
          </h2>
          <address className="mt-5 max-w-xl not-italic text-[0.95rem] leading-7 text-ink-200/75">
            {STUDIO_ADDRESS}.
          </address>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-7 text-ink-200/75">
            We photograph across Tamil Nadu, including Salem, Namakkal,
            Coimbatore and Chennai. Studio hours: {OPENING_HOURS[0].day}{' '}
            {OPENING_HOURS[0].hours}; Saturday {OPENING_HOURS[1].hours}; Sunday{' '}
            {OPENING_HOURS[2].hours}; Monday {OPENING_HOURS[3].hours}; Tuesday–Thursday{' '}
            {OPENING_HOURS[4].hours}. Please contact us before visiting; travel fees are
            confirmed during your free consultation.
          </p>
          {phoneHref && phone ? (
            <a
              href={phoneHref}
              onClick={() =>
                trackPhoneClick({
                  cta_location: 'service_page',
                  page_path: path,
                })
              }
              className="mt-8 inline-flex min-h-12 w-fit items-center gap-3 border-b border-gold-300 pb-1 text-sm font-medium text-ink-50 transition-colors hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              <Phone className="h-4 w-4 text-gold-300" aria-hidden="true" />
              Call {phone}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ServiceFaq({
  faqs,
}: {
  faqs: ResolvedServicePage['faqs'];
}) {
  return (
    <section
      id="faq"
      className="service-scroll-target border-y border-hairline/10 bg-ink-900/25 px-5 py-24 sm:px-8 md:py-32 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <p className="section-label mb-5">Questions, answered</p>
          <h2 className="font-display text-[clamp(3rem,5vw,5.6rem)] font-light leading-[0.9] tracking-[-0.035em] text-ink-50">
            A little clarity
            <span className="block italic text-gold-300">before we begin.</span>
          </h2>
        </div>

        <div className="border-t border-hairline/15 lg:col-span-7">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group border-b border-hairline/15"
            >
              <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start gap-4">
                  <span className="pt-1 text-[9px] font-semibold tracking-[0.2em] text-gold-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-xl text-ink-50 sm:text-2xl">
                    {faq.question}
                  </span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline/15 text-ink-200 transition-colors group-open:border-gold-300 group-open:text-gold-300">
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p className="max-w-2xl pb-7 pl-9 pr-14 text-[0.95rem] leading-7 text-ink-200/75">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceClosingCta({
  label,
  hasWhatsApp,
  whatsappUrl,
  onBook,
  onWhatsApp,
}: {
  label: string;
  hasWhatsApp: boolean;
  whatsappUrl: string;
  onBook: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <section
      id="contact"
      className="service-scroll-target relative overflow-hidden px-5 py-24 sm:px-8 md:py-36 lg:px-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_75%_at_50%_40%,rgb(var(--gold-glow)/.14),transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="section-label mb-6">Your story starts here</p>
        <h2 className="font-display text-[clamp(3.5rem,8vw,8.2rem)] font-light leading-[0.84] tracking-[-0.045em] text-ink-50">
          Let’s create something
          <span className="block italic text-gold-300">you can feel.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-ink-200/75 sm:text-base">
          Tell us what you are planning for your {label.toLowerCase()} session.
          We will reply with availability, thoughtful guidance, and the right
          experience for your story.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBook}
            className="service-primary-action group inline-flex min-h-14 w-full items-center justify-center gap-3 px-8 text-xs font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:w-auto"
          >
            Book a consultation
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
          {hasWhatsApp ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onWhatsApp}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 border border-hairline/20 px-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink-50 transition-colors hover:border-gold-300 hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ServiceDiscovery({
  services,
  usefulLinks,
}: {
  services: ReturnType<typeof getPublishedServiceNavLinks>;
  usefulLinks: ResolvedServicePage['related'];
}) {
  return (
    <section className="border-t border-hairline/10 px-5 pb-28 pt-20 sm:px-8 lg:px-12 lg:pb-36">
      <div className="mx-auto max-w-[1480px]">
        {services.length > 0 ? (
          <>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="section-label mb-4">Continue exploring</p>
                <h2 className="font-display text-4xl font-light text-ink-50 sm:text-5xl">
                  More ways to remember.
                </h2>
              </div>
              <Link
                to="/services"
                className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400 transition-colors hover:text-gold-300 sm:inline"
              >
                All services
              </Link>
            </div>

            <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
              {services.map((service, index) => (
                <Link
                  key={service.path}
                  to={service.path}
                  className="group relative aspect-[4/5] w-[82vw] max-w-sm shrink-0 snap-center overflow-hidden bg-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:w-[46vw] lg:w-auto lg:max-w-none"
                >
                  <img
                    src={service.imageUrl}
                    alt={`${service.label} photography`}
                    width={800}
                    height={1000}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 text-white">
                    <span>
                      <span className="text-[9px] uppercase tracking-[0.22em] text-gold-200">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-2 block font-display text-3xl font-light">
                        {service.label}
                      </span>
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 transition-colors group-hover:border-gold-200 group-hover:bg-gold-200 group-hover:text-black">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        {usefulLinks.length > 0 ? (
          <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-4 border-t border-hairline/10 pt-7">
            {usefulLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-300 transition-colors hover:text-gold-300"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function MobileServiceActions({
  hasWhatsApp,
  whatsappUrl,
  onBook,
  onWhatsApp,
}: {
  hasWhatsApp: boolean;
  whatsappUrl: string;
  onBook: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[900] border-t border-white/10 bg-[#0b0908]/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
      <div
        className={`mx-auto grid max-w-md gap-2 ${
          hasWhatsApp ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        <button
          type="button"
          onClick={onBook}
          className="service-primary-action inline-flex min-h-12 items-center justify-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
        >
          Book
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {hasWhatsApp ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onWhatsApp}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        ) : null}
      </div>
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
