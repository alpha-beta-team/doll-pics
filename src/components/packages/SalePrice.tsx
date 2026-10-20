import * as React from 'react';
import type { PublicPackage } from '../../shared/types';
import { formatINR, formatPackagePrice } from '../../lib/pricing';
import { useSaleClock } from '../../hooks/useSaleClock';
import { livePackageOffer, saleDate } from '../../lib/sales';
export function SalePrice({ pkg }: { pkg: PublicPackage }) {
  const now = useSaleClock(Boolean(pkg.pricing?.activeOffer));
  const live = livePackageOffer(pkg, now);
  return <div className="mt-5 space-y-2" aria-live="polite">
    {live && <p className="text-sm font-semibold text-gold-300">{live.name} · {live.discountType === 'percentage' ? `${live.discountValue}% off` : `${formatINR(live.discountAmount)} off`}</p>}
    {live && <p className="text-sm text-ink-200"><span className="sr-only">Original price </span><del>{formatPackagePrice(pkg.pricingMode, live.basePrice)}</del></p>}
    <p className="font-display text-4xl text-gold-300">{formatPackagePrice(pkg.pricingMode, live?.salePrice ?? pkg.price)}</p>
    {live && <React.Fragment><p className="text-sm text-emerald-300">Save {formatINR(live.discountAmount)}</p><p className="text-xs text-ink-200">{saleDate(live.startsAt)} – {saleDate(live.endsAt)} IST (ends at this time)</p>{live.terms && <p className="text-xs text-ink-200">{live.terms}</p>}</React.Fragment>}
  </div>;
}
