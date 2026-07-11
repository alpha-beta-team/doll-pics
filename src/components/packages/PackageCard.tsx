import { Check } from 'lucide-react';
import type { PublicPackage } from '../../lib/api';
import { trackWhatsAppClick, type WhatsAppCtaLocation } from '../../lib/analytics';
import { formatPackagePrice, packageWhatsAppUrl } from '../../lib/pricing';

interface PackageCardProps {
  pkg: PublicPackage;
  whatsapp: string;
  index?: number;
  /** Where this card appears; package WhatsApp CTAs map to booking intent. */
  ctaLocation?: WhatsAppCtaLocation;
}

export function PackageCard({
  pkg,
  whatsapp,
  index = 0,
  ctaLocation = 'booking_page',
}: PackageCardProps) {
  const priceLabel = formatPackagePrice(pkg.pricingMode, pkg.price);
  const bookHref = packageWhatsAppUrl(whatsapp, pkg.name);
  const isExternal = bookHref.startsWith('http');
  const inclusions = pkg.inclusions ?? [];

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-900/40 px-8 py-10 backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold-400/30 hover:shadow-2xl hover:shadow-black/40"
      style={{
        animation: `fadeInUp 0.7s ${index * 0.08}s ease-out both`,
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(135deg, rgba(212,162,73,0.12), transparent 45%, transparent 55%, rgba(212,162,73,0.06))',
        }}
      />

      <div className="relative flex h-full flex-col">
        <h3 className="text-center font-display text-2xl font-light tracking-wide text-ink-50 transition-colors duration-300 group-hover:text-gold-300">
          {pkg.name}
        </h3>

        <p className="mt-4 text-center font-display text-4xl font-light leading-none tracking-tight text-gradient-gold md:text-5xl">
          {priceLabel}
        </p>

        <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent opacity-70 transition-all duration-500 group-hover:w-20 group-hover:opacity-100" />

        <ul className="mt-8 flex-1">
          {inclusions.map((item, i) => (
            <li
              key={`${pkg.name}-${i}`}
              className={`flex items-start gap-3 py-3.5 text-[0.925rem] leading-snug text-ink-200/70 transition-colors duration-300 group-hover:text-ink-100 ${
                i < inclusions.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400 transition-colors duration-300 group-hover:border-gold-400/50 group-hover:bg-gold-400/20">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex justify-center">
          <a
            href={bookHref}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
            data-cursor="hover"
            onClick={() => {
              if (isExternal) {
                trackWhatsAppClick({
                  cta_location: ctaLocation,
                  service_name: pkg.name,
                });
              }
            }}
            className="group/btn relative inline-flex items-center justify-center overflow-hidden border border-white/20 px-9 py-3 text-[0.7rem] font-medium tracking-[0.22em] text-ink-50 transition-all duration-400 hover:border-gold-400/60 hover:text-gold-300"
          >
            <span className="relative z-10">BOOK NOW</span>
            <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-gold-400/20 to-gold-500/10 transition-transform duration-400 group-hover/btn:scale-x-100" />
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5 transition-colors duration-500 group-hover:border-gold-400/20" />
    </article>
  );
}
