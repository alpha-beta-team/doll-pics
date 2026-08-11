import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Baby,
  Briefcase,
  Camera,
  Gift,
  Heart,
  Plane,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useSiteData, type ServiceItem } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { ResponsiveImage } from '../ResponsiveImage';

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Camera,
  Gift,
  Baby,
  Sparkles,
  Briefcase,
  Plane,
};

const CARD_LAYOUTS = [
  'lg:col-span-7',
  'lg:col-span-5 lg:mt-24',
  'lg:col-span-5',
  'lg:col-span-7 lg:mt-20',
  'lg:col-span-7',
  'lg:col-span-5 lg:mt-24',
] as const;

const EARLY_REVEAL_OPTIONS: IntersectionObserverInit = {
  threshold: 0.01,
  rootMargin: '0px 0px 12% 0px',
};

export function Services() {
  const { services } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>(EARLY_REVEAL_OPTIONS);

  return (
    <section
      id="services"
      className="services-editorial relative overflow-hidden bg-ink-950 px-5 pb-28 pt-16 sm:px-8 md:pb-36 md:pt-24 lg:px-12 lg:pb-44"
    >
      <div
        className="services-editorial-glow pointer-events-none absolute inset-x-0 top-0 h-[42rem]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1480px]">
        <header className="border-b border-hairline/10 pb-14 md:pb-20">
          <div className="flex items-center justify-between border-b border-hairline/10 pb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-ink-400">
            <span>Doll Pictures · Erode</span>
            <span className="hidden sm:inline">Tamil Nadu · Available to travel</span>
          </div>

          <div className="grid gap-10 pt-12 md:pt-16 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-9">
              <p className="section-label mb-6 flex items-center gap-4">
                <span>Photography services</span>
                <span className="h-px w-16 bg-gold-400/60" aria-hidden="true" />
              </p>
              <h1 className="max-w-6xl font-display text-[clamp(3.5rem,8vw,8.4rem)] font-light leading-[0.84] tracking-[-0.045em] text-ink-50">
                Wedding, Baby &amp; Family
                <span className="block italic text-gold-300">
                  Photography Services in Erode
                </span>
              </h1>
            </div>

            <div className="lg:col-span-3 lg:pb-2">
              <p className="max-w-md border-l border-hairline/15 pl-5 text-sm leading-7 text-ink-200/75 sm:text-base">
                From weddings and maternity journeys to newborn milestones,
                toddler portraits, cake smashes, birthdays and family
                celebrations, Doll Pictures creates warm, natural photography
                from our Erode studio, with travel available across Tamil Nadu.
              </p>
              <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                Choose your experience
              </p>
            </div>
          </div>
        </header>

        {services.length > 0 ? (
          <div
            ref={ref}
            className="mt-14 grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 md:mt-20 md:gap-y-20 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-28"
          >
            {services.map((service, index) => (
              <ServiceCard
                key={`${service.title}-${service.path ?? index}`}
                service={service}
                index={index}
                inView={inView}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Camera
              className="mx-auto h-9 w-9 text-gold-400"
              aria-hidden="true"
            />
            <h2 className="mt-5 font-display text-3xl text-ink-50">
              New experiences are on their way
            </h2>
            <p className="mt-3 text-sm text-ink-300">
              Contact the studio and we will help plan the right session.
            </p>
          </div>
        )}

        <div className="mt-28 border-y border-hairline/10 py-12 md:mt-40 md:py-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <p className="section-label mb-4">Not sure where to begin?</p>
              <h2 className="font-display text-4xl font-light leading-tight text-ink-50 sm:text-5xl md:text-6xl">
                Tell us what you are celebrating.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <Link
                to="/booking"
                className="service-primary-action group inline-flex min-h-14 w-full items-center justify-center gap-4 px-8 text-xs font-semibold uppercase tracking-[0.2em] sm:w-auto"
              >
                Start a conversation
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  inView,
}: {
  service: ServiceItem;
  index: number;
  inView: boolean;
}) {
  const Icon = iconMap[service.icon] || Camera;
  const href = service.path || '/services';
  const portrait = index % 4 === 1 || index % 4 === 2;

  return (
    <article
      className={`self-start reveal-blur ${
        CARD_LAYOUTS[index % CARD_LAYOUTS.length]
      } ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${(index % 6) * 70}ms` }}
    >
      <Link
        to={href}
        data-cursor="hover"
        className="group block outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950"
      >
        <div
          className={`relative overflow-hidden bg-ink-900 ${
            portrait ? 'aspect-[4/5]' : 'aspect-[16/11]'
          }`}
        >
          <ResponsiveImage
            src={service.image}
            alt={`${service.title} photography`}
            sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 48vw, 58vw"
            width={1200}
            height={portrait ? 1500 : 825}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035] group-focus-visible:scale-[1.035]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/15" />
          <span className="absolute left-5 top-5 grid h-12 w-12 place-items-center border border-white/25 bg-black/20 text-gold-100 backdrop-blur-sm sm:left-6 sm:top-6">
            <Icon className="h-5 w-5" strokeWidth={1.35} aria-hidden="true" />
          </span>
          <span className="absolute right-5 top-6 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/65 sm:right-6">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-5 border-b border-hairline/15 pb-6 pt-5">
          <div>
            <h2 className="font-display text-3xl font-light text-ink-50 transition-colors group-hover:text-gold-300 sm:text-4xl">
              {service.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-300">
              {service.desc}
            </p>
            <span className="mt-5 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">
              Explore the service
              <span className="h-px w-8 bg-gold-400" aria-hidden="true" />
            </span>
          </div>
          <span className="mt-1 grid h-11 w-11 place-items-center rounded-full border border-hairline/15 text-ink-200 transition-all group-hover:border-gold-300 group-hover:bg-gold-300 group-hover:text-black">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
