import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { PublicPackage } from '../../lib/api';
import { trackWhatsAppClick, type WhatsAppCtaLocation } from '../../lib/analytics';
import {
  formatINR,
  formatPackagePrice,
  packageEnquirePath,
  packageWhatsAppUrl,
} from '../../lib/pricing';

interface PackageCardProps {
  pkg: PublicPackage;
  whatsapp: string;
  index?: number;
  /** Where this card appears; package WhatsApp CTAs map to booking intent. */
  ctaLocation?: WhatsAppCtaLocation;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function locationBadgeLabel(locationType?: string): string | null {
  if (locationType === 'home') return 'At your location';
  if (locationType === 'studio') return 'Studio';
  return null;
}

export function PackageCard({
  pkg,
  whatsapp,
  index = 0,
  ctaLocation = 'booking_page',
}: PackageCardProps) {
  const priceLabel = formatPackagePrice(pkg.pricingMode, pkg.price);
  const enquireHref = packageEnquirePath(pkg);
  const whatsappHref = packageWhatsAppUrl(whatsapp, pkg.name);
  const whatsappAvailable = whatsappHref.startsWith('http');
  const inclusions = pkg.inclusions ?? [];
  const durationLabel = pkg.durationLabel?.trim() ?? '';
  const slotTimings = pkg.slotTimings ?? [];
  const notes = pkg.notes ?? [];
  const themeGuideUrl = pkg.themeGuideUrl?.trim() ?? '';
  const locationLabel = locationBadgeLabel(pkg.locationType);
  const advanceAmount = pkg.advanceAmount;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline/5 bg-ink-900/40 px-8 py-10 backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold-400/30 hover:shadow-2xl hover:shadow-black/40"
      style={{
        animation: `fadeInUp 0.7s ${index * 0.08}s ease-out both`,
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--gold-glow) / 0.12), transparent 45%, transparent 55%, rgb(var(--gold-glow) / 0.06))',
        }}
      />

      <div className="relative flex h-full flex-col">
        <h3 className="text-center font-display text-2xl font-light tracking-wide text-ink-50 transition-colors duration-300 group-hover:text-gold-300">
          {pkg.name}
        </h3>

        {durationLabel ? (
          <p className="mt-2 text-center text-[0.7rem] font-medium tracking-[0.18em] text-ink-200/55">
            {durationLabel}
          </p>
        ) : null}

        {locationLabel ? (
          <p
            className={`mt-3 text-center text-[0.65rem] font-medium tracking-[0.16em] ${
              pkg.locationType === 'home'
                ? 'text-gold-300/90'
                : 'text-ink-200/45'
            }`}
          >
            {locationLabel}
          </p>
        ) : null}

        <p className="mt-4 text-center font-display text-4xl font-light leading-none tracking-tight text-gradient-gold md:text-5xl">
          {priceLabel}
        </p>

        {advanceAmount != null ? (
          <p className="mt-3 text-center text-[0.7rem] tracking-[0.12em] text-ink-200/55">
            Advance: {formatINR(advanceAmount)}
          </p>
        ) : null}

        <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent opacity-70 transition-all duration-500 group-hover:w-20 group-hover:opacity-100" />

        <ul className="mt-8 flex-1">
          {inclusions.map((item, i) => (
            <li
              key={`${pkg.name}-inclusion-${i}`}
              className={`flex items-start gap-3 py-3.5 text-[0.925rem] leading-snug text-ink-200/70 transition-colors duration-300 group-hover:text-ink-100 ${
                i < inclusions.length - 1 ? 'border-b border-hairline/5' : ''
              }`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400 transition-colors duration-300 group-hover:border-gold-400/50 group-hover:bg-gold-400/20">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {slotTimings.length > 0 ? (
          <div className="mt-6">
            <p className="text-center text-[0.65rem] font-medium tracking-[0.18em] text-ink-200/45">
              Slots
            </p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {slotTimings.map((slot, i) => (
                <li
                  key={`${pkg.name}-slot-${i}`}
                  className="border border-hairline/10 px-3 py-1.5 text-[0.7rem] tracking-wide text-ink-200/65"
                >
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {notes.length > 0 ? (
          <ul className="mt-6 space-y-1.5">
            {notes.map((note, i) => (
              <li
                key={`${pkg.name}-note-${i}`}
                className="text-center text-[0.7rem] leading-relaxed text-ink-200/40"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        {themeGuideUrl ? (
          <a
            href={themeGuideUrl}
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
            className="mt-5 text-center text-[0.65rem] font-medium tracking-[0.18em] text-gold-300/80 transition-colors hover:text-gold-300"
          >
            Theme guide
          </a>
        ) : null}

        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            to={enquireHref}
            data-cursor="hover"
            className="group/btn relative inline-flex items-center justify-center overflow-hidden border border-hairline/20 px-9 py-3 text-[0.7rem] font-medium tracking-[0.22em] text-ink-50 transition-all duration-400 hover:border-gold-400/60 hover:text-gold-300"
          >
            <span className="relative z-10">ENQUIRE</span>
            <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-gold-400/20 to-gold-500/10 transition-transform duration-400 group-hover/btn:scale-x-100" />
          </Link>
          {whatsappAvailable ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              data-cursor="hover"
              aria-label="WhatsApp"
              onClick={() => {
                trackWhatsAppClick({
                  cta_location: ctaLocation,
                  service_name: pkg.name,
                });
              }}
              className="inline-flex h-11 w-11 items-center justify-center text-ink-200/55 transition-colors hover:text-gold-300"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-hairline/5 transition-colors duration-500 group-hover:border-gold-400/20" />
    </article>
  );
}
