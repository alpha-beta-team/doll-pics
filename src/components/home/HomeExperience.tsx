import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  useSiteData,
  type FeaturedWorkItem,
  type ServiceItem,
} from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { BOOKING_ROUTE } from '../../lib/navigation';
import {
  HERO_QUALITY,
  mediaSrcSet,
  mediaUrl,
} from '../../lib/images';
import { ResponsiveImage } from '../ResponsiveImage';

const HERO_INTERVAL_MS = 6500;

function dismissBuildTimeHero() {
  document.getElementById('home-hero-poster')?.remove();
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.08,
    rootMargin: '0px 0px -5% 0px',
  });

  return (
    <div
      ref={ref}
      className={`home-reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-gold-400">
      <span className="h-px w-8 bg-gold-400/70" />
      {children}
    </div>
  );
}

export function HomeExperience() {
  return (
    <>
      <EditorialHero />
      <TrustStrip />
      <StudioManifesto />
      <SelectedStories />
      <ServiceJournal />
      <ClosingInvitation />
    </>
  );
}

function EditorialHero() {
  const { heroSlides, siteContent } = useSiteData();
  const [active, setActive] = useState(0);
  const [carouselReady, setCarouselReady] = useState(false);
  const slides = heroSlides.slice(0, 5);

  useEffect(() => {
    if (slides.length < 2 || carouselReady) return;
    const enableCarousel = () => {
      // The poster is rendered directly in the initial HTML so the hero can
      // paint before React. Keep it until interaction finalizes LCP, then hand
      // off to the already-loaded React carousel.
      dismissBuildTimeHero();
      setCarouselReady(true);
    };
    window.addEventListener('pointerdown', enableCarousel, { once: true });
    window.addEventListener('keydown', enableCarousel, { once: true });
    window.addEventListener('scroll', enableCarousel, {
      once: true,
      passive: true,
    });
    return () => {
      window.removeEventListener('pointerdown', enableCarousel);
      window.removeEventListener('keydown', enableCarousel);
      window.removeEventListener('scroll', enableCarousel);
    };
  }, [carouselReady, slides.length]);

  useEffect(() => {
    if (!carouselReady || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      HERO_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, [carouselReady, slides.length]);

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  const heading =
    siteContent.heroHeading ||
    'Cinematic photographs for the stories you never want to forget.';
  const subtext =
    siteContent.heroSubtext ||
    'Honest emotion, beautiful light, and a calm experience from first hello to final frame.';

  return (
    <section className="home-hero relative min-h-[760px] overflow-hidden bg-[#090908] text-white">
      <div className="absolute inset-0">
        {(carouselReady ? slides : slides.slice(0, 1)).map((slide, index) => (
          <div
            key={`${slide.image}-${index}`}
            aria-hidden={index !== active}
            className={`absolute inset-0 transition-[opacity,transform] duration-[1800ms] ease-out ${
              index === active
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-[1.035] opacity-0'
            }`}
          >
            <ResponsiveImage
              src={mediaUrl(slide.image, 750, 'webp', HERO_QUALITY)}
              alt={index === active ? slide.label : ''}
              webpSrcSet={mediaSrcSet(
                slide.image,
                [480, 750, 1100, 1600],
                'webp',
                HERO_QUALITY,
              )}
              sizes="100vw"
              width={1920}
              height={1080}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,5,.92)_0%,rgba(6,6,5,.66)_42%,rgba(6,6,5,.18)_72%,rgba(6,6,5,.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.5)_0%,transparent_34%,rgba(0,0,0,.15)_62%,rgba(0,0,0,.82)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-[1480px] flex-col justify-end px-5 pb-9 pt-32 sm:px-8 lg:min-h-screen lg:px-12 lg:pb-12 xl:px-16">
        <div className="mb-auto flex items-start justify-between pt-4">
          <div className="flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.32em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_0_5px_rgba(212,162,73,.13)]" />
            Erode · Tamil Nadu
          </div>
          <div className="hidden items-center gap-3 text-[0.62rem] uppercase tracking-[0.28em] text-white/60 md:flex">
            Available across South India
            <MapPin className="h-3.5 w-3.5 text-gold-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0 max-w-5xl">
            <div className="hero-copy-enter mb-6 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-gold-300">
              <Sparkles className="h-4 w-4" />
              Wedding · Baby · Family
            </div>
            <h1 className="hero-copy-enter hero-copy-delay max-w-full font-display text-[3.05rem] font-light leading-[0.88] tracking-[-0.04em] text-white [text-wrap:balance] sm:text-[clamp(3.8rem,8.1vw,8.6rem)] sm:leading-[0.83] sm:tracking-[-0.045em]">
              {heading}
            </h1>
            <div className="hero-copy-enter hero-copy-delay-2 mt-8 flex min-w-0 flex-col gap-7 border-l border-white/20 pl-5 sm:flex-row sm:items-end sm:justify-between sm:pl-7">
              <p className="max-w-xl text-sm font-normal leading-7 text-white/72 sm:text-base">
                {subtext}
              </p>
              <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap">
                <Link
                  to={BOOKING_ROUTE.path}
                  className="group inline-flex min-h-12 w-full items-center justify-center gap-3 bg-gold-300 px-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#11100d] transition-colors duration-300 hover:bg-white sm:w-auto sm:px-6"
                >
                  Plan your session
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a
                  href="#selected-stories"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-3 border border-white/25 px-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:border-white hover:bg-white/10 sm:w-auto sm:px-6"
                >
                  View stories
                </a>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-white/20 pt-5 lg:block">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[0.62rem] uppercase tracking-[0.28em] text-white/55">
                Featured frame
              </span>
              <span className="font-display text-3xl text-white">
                {String(active + 1).padStart(2, '0')}
                <span className="text-lg text-white/35">
                  /{String(slides.length).padStart(2, '0')}
                </span>
              </span>
            </div>
            <p className="font-display text-2xl italic text-white">
              {slides[active]?.label || 'A story worth keeping'}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous hero image"
                disabled={!slides.length}
                onClick={() => {
                  if (!slides.length) return;
                  dismissBuildTimeHero();
                  setCarouselReady(true);
                  setActive((current) =>
                    (current - 1 + slides.length) % slides.length,
                  );
                }}
                className="grid h-10 w-10 place-items-center border border-white/20 text-white transition-colors hover:border-gold-300 hover:text-gold-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next hero image"
                disabled={!slides.length}
                onClick={() => {
                  if (!slides.length) return;
                  dismissBuildTimeHero();
                  setCarouselReady(true);
                  setActive((current) => (current + 1) % slides.length);
                }}
                className="grid h-10 w-10 place-items-center border border-white/20 text-white transition-colors hover:border-gold-300 hover:text-gold-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="ml-2 h-px flex-1 bg-white/15">
                <div
                  className="h-full bg-gold-300 transition-[width] duration-700"
                  style={{ width: `${((active + 1) / slides.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <a
          href="#studio-intro"
          aria-label="Scroll to studio introduction"
          className="mt-10 inline-flex w-fit items-center gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white lg:mt-12"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20">
            <ArrowDown className="h-3.5 w-3.5" />
          </span>
          Discover our approach
        </a>
      </div>
    </section>
  );
}

function TrustStrip() {
  const { stats } = useSiteData();
  const trust = stats.slice(0, 4);

  return (
    <section
      aria-label="Studio highlights"
      className="border-b border-hairline/10 bg-ink-950 px-5 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid min-h-[217px] max-w-[1480px] grid-cols-2 divide-x divide-hairline/10 lg:min-h-[129px] lg:grid-cols-4">
        {trust.map((stat, index) => (
          <div
            key={`${stat.label}-${index}`}
            className="px-4 py-7 first:pl-0 sm:px-8 lg:py-9"
          >
            <div className="font-display text-3xl font-light text-ink-50 sm:text-4xl">
              {stat.value}
              <span className="text-gold-400">{stat.suffix}</span>
            </div>
            <div className="mt-1 text-[0.6rem] uppercase tracking-[0.24em] text-ink-300">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudioManifesto() {
  const { galleryImages, siteContent } = useSiteData();
  const primary = galleryImages[0];
  const secondary = galleryImages[3] || galleryImages[1];

  return (
    <section
      id="studio-intro"
      className="relative overflow-hidden bg-ink-950 px-5 py-24 sm:px-8 md:py-32 lg:px-12 lg:py-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-10 font-display text-[24vw] leading-none text-hairline/[0.025]"
      >
        01
      </div>
      <div className="relative mx-auto grid max-w-[1480px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-24">
        <Reveal className="relative mx-auto w-full max-w-[650px] pb-14 pr-10 sm:pb-20 sm:pr-20">
          <div className="aspect-[4/5] overflow-hidden bg-ink-900">
            {primary ? (
              <ResponsiveImage
                src={primary.src}
                alt={primary.alt}
                avifSrcSet={primary.avifSrcSet}
                webpSrcSet={primary.webpSrcSet}
                sizes="(max-width: 640px) calc(100vw - 80px), (max-width: 1024px) calc(100vw - 120px), 42vw"
                width={900}
                height={1125}
                className="h-full w-full object-cover transition-transform duration-[1400ms] hover:scale-[1.025]"
              />
            ) : null}
          </div>
          {secondary ? (
            <div className="absolute bottom-0 right-0 w-[44%] border-[7px] border-ink-950 bg-ink-900 shadow-2xl sm:border-[10px]">
              <ResponsiveImage
                src={secondary.src}
                alt={secondary.alt}
                avifSrcSet={secondary.avifSrcSet}
                webpSrcSet={secondary.webpSrcSet}
                sizes="(max-width: 1024px) 38vw, 18vw"
                width={500}
                height={625}
                className="aspect-[4/5] h-full w-full object-cover"
              />
            </div>
          ) : null}
          <div className="absolute -left-2 bottom-2 hidden -rotate-90 text-[0.58rem] uppercase tracking-[0.3em] text-ink-300 md:block">
            Honest moments · artfully preserved
          </div>
        </Reveal>

        <Reveal delay={120}>
          <SectionEyebrow>More than photographs</SectionEyebrow>
          <h2 className="max-w-3xl font-display text-[clamp(3.1rem,6.2vw,6.7rem)] font-light leading-[0.9] tracking-[-0.035em] text-ink-50">
            Your day as it
            <span className="block italic text-gold-300">truly felt.</span>
          </h2>
          <div className="mt-9 grid gap-8 border-t border-hairline/10 pt-8 sm:grid-cols-[1fr_1fr]">
            <p className="text-base leading-8 text-ink-100/78">
              {siteContent.about ||
                'We photograph the in-between moments—the quiet breath before the ceremony, the laughter that arrives unplanned, and the people who make it all matter.'}
            </p>
            <div>
              <p className="text-sm leading-7 text-ink-300">
                Our approach is calm, thoughtful, and deeply personal. You get
                gentle direction when you need it, space when you do not, and
                imagery that still feels like you years from now.
              </p>
              <Link
                to="/about"
                className="group mt-7 inline-flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-50"
              >
                Meet the studio
                <span className="grid h-9 w-9 place-items-center rounded-full border border-hairline/20 transition-all group-hover:border-gold-400 group-hover:text-gold-400">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SelectedStories() {
  const { featuredWork, services } = useSiteData();
  const items = featuredWork.slice(0, 5);

  return (
    <section
      id="selected-stories"
      className="bg-ink-900 px-5 py-24 sm:px-8 md:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto max-w-[1480px]">
        <Reveal className="mb-14 flex flex-col justify-between gap-8 border-b border-hairline/10 pb-10 md:mb-20 md:flex-row md:items-end">
          <div>
            <SectionEyebrow>Selected stories</SectionEyebrow>
            <h2 className="max-w-4xl font-display text-[clamp(3.1rem,6vw,6.4rem)] font-light leading-[0.9] tracking-[-0.035em] text-ink-50">
              Frames that feel
              <span className="italic text-gold-300"> alive.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {items.map((work, index) => (
            <StoryTile
              key={`${work.title}-${index}`}
              work={work}
              index={index}
              path={storyServicePath(work.category, services)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryTile({
  work,
  index,
  path,
}: {
  work: FeaturedWorkItem;
  index: number;
  path: string;
}) {
  const layouts = [
    'md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-[7/8]',
    'md:col-span-5 aspect-[4/3]',
    'md:col-span-5 aspect-[4/3]',
    'md:col-span-5 aspect-[4/5]',
    'md:col-span-7 aspect-[4/3]',
  ];

  return (
    <Reveal
      className={`group relative overflow-hidden bg-ink-800 focus-within:ring-2 focus-within:ring-gold-300 focus-within:ring-offset-4 focus-within:ring-offset-ink-900 ${layouts[index] || 'md:col-span-6 aspect-[4/3]'}`}
      delay={(index % 3) * 80}
    >
      <Link
        to={path}
        aria-label={`View ${work.category} photography services: ${work.title}`}
        className="relative block h-full w-full outline-none"
      >
        <ResponsiveImage
          src={work.image}
          alt={work.alt}
          avifSrcSet={work.avifSrcSet}
          webpSrcSet={work.webpSrcSet}
          sizes="(max-width: 768px) 100vw, 58vw"
          width={1200}
          height={1400}
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-gold-300">
              {work.category}
            </p>
            <h3 className="font-display text-3xl font-light text-white sm:text-4xl">
              {work.title}
            </h3>
            {(work.location || work.year) && (
              <p className="mt-2 text-xs tracking-wide text-white/60">
                {[work.location, work.year].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 text-white transition-all duration-300 group-hover:border-gold-300 group-hover:bg-gold-300 group-hover:text-black">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <span className="absolute right-5 top-5 text-[0.6rem] uppercase tracking-[0.25em] text-white/55">
          {String(index + 1).padStart(2, '0')}
        </span>
      </Link>
    </Reveal>
  );
}

function storyServicePath(category: string, services: ServiceItem[]): string {
  const normalizedCategory = category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const targets = normalizedCategory.includes('newborn')
    ? ['newborn']
    : normalizedCategory.includes('maternity') ||
        normalizedCategory.includes('pregnancy')
      ? ['maternity']
      : normalizedCategory.includes('cake') ||
          normalizedCategory.includes('birthday')
        ? ['cake smash', 'baby milestone']
        : normalizedCategory.includes('family')
          ? ['family']
          : normalizedCategory.includes('wedding') ||
              normalizedCategory.includes('engagement') ||
              normalizedCategory.includes('couple')
            ? ['wedding']
            : [normalizedCategory];

  const service = services.find((item) => {
    const title = item.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    return targets.some(
      (target) => title === target || title.includes(target) || target.includes(title),
    );
  });

  return service?.path || '/services';
}

function ServiceJournal() {
  const { services } = useSiteData();
  const items = services.slice(0, 6);
  const [active, setActive] = useState(0);
  const activeService = items[active] || items[0];

  if (!items.length) return null;

  return (
    <section
      id="services"
      className="relative overflow-hidden bg-ink-950 px-5 py-24 sm:px-8 md:py-32 lg:px-12 lg:py-40"
    >
      <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <SectionEyebrow>Ways to remember</SectionEyebrow>
          <h2 className="font-display text-[clamp(3.1rem,5.6vw,6rem)] font-light leading-[0.9] tracking-[-0.035em] text-ink-50">
            Every season
            <span className="block italic text-gold-300">deserves a story.</span>
          </h2>
          <p className="mt-7 max-w-lg text-sm leading-7 text-ink-300 sm:text-base">
            From wedding rituals to the tiny details of a newborn session,
            each experience is shaped around your people, your pace, and your
            memories.
          </p>

          {activeService ? (
            <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden bg-ink-900 lg:block">
              {items.map((service, index) => (
                <img
                  key={`${service.title}-${index}`}
                  src={service.image}
                  alt={index === active ? service.title : ''}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ${
                    index === active
                      ? 'scale-100 opacity-100'
                      : 'scale-[1.03] opacity-0'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute bottom-5 left-5 text-[0.6rem] uppercase tracking-[0.25em] text-white/70">
                Doll Pictures · Erode
              </span>
            </div>
          ) : null}
        </Reveal>

        <div className="border-t border-hairline/15">
          {items.map((service, index) => (
            <ServiceRow
              key={`${service.title}-${index}`}
              service={service}
              index={index}
              active={active === index}
              onActivate={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  service,
  index,
  active,
  onActivate,
}: {
  service: ServiceItem;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <Reveal delay={(index % 3) * 60}>
      <Link
        to={service.path || '/services'}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        className="group grid grid-cols-[42px_1fr_auto] items-start gap-4 border-b border-hairline/15 py-7 transition-colors hover:text-gold-300 sm:grid-cols-[60px_1fr_auto] sm:gap-6 sm:py-9"
      >
        <span className="pt-2 text-[0.6rem] font-semibold tracking-[0.22em] text-ink-400">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h3
            className={`font-display text-3xl font-light transition-colors sm:text-5xl ${
              active ? 'text-gold-300' : 'text-ink-50'
            }`}
          >
            {service.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-300">
            {service.desc}
          </p>
          <div className="mt-5 aspect-[16/10] overflow-hidden bg-ink-900 lg:hidden">
            <img
              src={service.image}
              alt={service.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
            />
          </div>
        </div>
        <span className="mt-1 grid h-11 w-11 place-items-center rounded-full border border-hairline/15 text-ink-200 transition-all group-hover:border-gold-300 group-hover:bg-gold-300 group-hover:text-black">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </Reveal>
  );
}

function ClosingInvitation() {
  const { galleryImages, siteContent } = useSiteData();
  const image = galleryImages[6] || galleryImages[2] || galleryImages[0];

  return (
    <section id="booking" className="relative min-h-[720px] overflow-hidden">
      {image ? (
        <ResponsiveImage
          src={image.src}
          alt={image.alt}
          avifSrcSet={image.avifSrcSet}
          webpSrcSet={image.webpSrcSet}
          sizes="100vw"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,5,.9),rgba(6,6,5,.48)_58%,rgba(6,6,5,.62))]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />

      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1480px] items-end px-5 py-16 sm:px-8 md:py-24 lg:px-12">
        <Reveal className="max-w-5xl text-white">
          <p className="mb-6 text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-gold-300">
            Now booking 2026–2027
          </p>
          <h2 className="font-display text-[clamp(3.6rem,8vw,8.4rem)] font-light leading-[0.84] tracking-[-0.045em]">
            Let’s make something
            <span className="block italic text-gold-300">you can feel.</span>
          </h2>
          <div className="mt-9 flex flex-col gap-7 border-l border-white/25 pl-5 sm:flex-row sm:items-center sm:justify-between sm:pl-7">
            <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              Tell us what you are celebrating. We will reply with availability,
              thoughtful guidance, and the right experience for your story.
            </p>
            <Link
              to={BOOKING_ROUTE.path}
              className="group inline-flex min-h-14 w-fit shrink-0 items-center gap-4 bg-white px-7 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:bg-gold-300"
            >
              Start a conversation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {siteContent.phone ? (
            <a
              href={`tel:${siteContent.phone.replace(/\s/g, '')}`}
              className="mt-8 inline-flex items-center gap-3 text-xs tracking-[0.16em] text-white/65 transition-colors hover:text-white"
            >
              <Camera className="h-4 w-4 text-gold-300" />
              Prefer to talk? {siteContent.phone}
            </a>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
