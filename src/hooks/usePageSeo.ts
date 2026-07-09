import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  applyPageSeo,
  getPageSeo,
  type AggregateRatingInput,
} from '../lib/seo';

type ContactSeo = {
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
};

type PageSeoOptions = ContactSeo & {
  aggregateRating?: AggregateRatingInput;
};

/** Updates document title, meta, canonical, OG, and JSON-LD for the current route. */
export function usePageSeo(options?: PageSeoOptions) {
  const { pathname } = useLocation();
  const phone = options?.phone;
  const email = options?.email;
  const ratingValue = options?.aggregateRating?.ratingValue;
  const reviewCount = options?.aggregateRating?.reviewCount;
  const socialsKey = options?.socials
    ? Object.entries(options.socials)
        .filter(([, v]) => v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|')
    : '';

  useEffect(() => {
    applyPageSeo(getPageSeo(pathname), {
      contact: {
        phone,
        email,
        socials: options?.socials,
      },
      aggregateRating:
        ratingValue != null && reviewCount != null
          ? { ratingValue, reviewCount }
          : undefined,
    });
  }, [pathname, phone, email, socialsKey, ratingValue, reviewCount]);
}
