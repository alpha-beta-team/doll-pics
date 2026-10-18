export const saleDate = (value: string) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });


import type { SaleOffer } from '../shared/types/sales';
import type { PublicPackage } from '../shared/types';

/** Only server-selected, currently live discounts may be promoted publicly. */
export function livePackageOffer(
  pkg: { pricing?: { activeOffer?: SaleOffer | null } },
  now = Date.now(),
): SaleOffer | null {
  const offer = pkg.pricing?.activeOffer;
  return offer && now >= Date.parse(offer.startsAt) && now < Date.parse(offer.endsAt)
    && offer.discountAmount > 0 && offer.salePrice < offer.basePrice ? offer : null;
}

export function categoryOfferCounts(packages: PublicPackage[], now = Date.now()): Map<string, number> {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const pkg of packages) {
    const slug = pkg.categorySlug?.trim().toLowerCase();
    if (!slug || !livePackageOffer(pkg, now)) continue;
    const key = pkg.id ? `${slug}:${pkg.id}` : null;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}
