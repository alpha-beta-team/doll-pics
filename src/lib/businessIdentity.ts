import identityJson from '../data/business-identity.json';
import type { SeoPagesData } from './seo-core';

type Identity = typeof identityJson;

export const BUSINESS_IDENTITY: Identity = identityJson;
export const BUSINESS_NAME = BUSINESS_IDENTITY.businessName;
export const DISPLAY_BRAND_NAME = BUSINESS_IDENTITY.displayBrandName;
export const BUSINESS_EMAIL = BUSINESS_IDENTITY.email;
export const BUSINESS_PHONE = BUSINESS_IDENTITY.phone.display;
export const BUSINESS_WHATSAPP = BUSINESS_IDENTITY.whatsapp.display;
export const BUSINESS_WEBSITE = BUSINESS_IDENTITY.website.replace(/\/$/, '');
export const BUSINESS_SOCIALS: Record<string, string> = {
  ...BUSINESS_IDENTITY.socials,
};
export const OPENING_HOURS = BUSINESS_IDENTITY.openingHoursDisplay;

/** Adds the canonical identity to route/content SEO data. */
export function withCanonicalBusinessIdentity(
  seoPages: Omit<
    SeoPagesData,
    | 'siteName'
    | 'brandByline'
    | 'businessName'
    | 'telephone'
    | 'email'
    | 'address'
    | 'geo'
    | 'openingHoursSpecification'
    | 'sameAs'
  >,
): SeoPagesData {
  const sameAs = BUSINESS_IDENTITY.officialProfileUrls.filter(
    (url) => url.replace(/\/$/, '') !== BUSINESS_WEBSITE,
  );

  return {
    ...seoPages,
    siteName: DISPLAY_BRAND_NAME,
    brandByline: BUSINESS_NAME,
    businessName: BUSINESS_NAME,
    telephone: BUSINESS_PHONE,
    email: BUSINESS_EMAIL,
    address: BUSINESS_IDENTITY.address,
    geo: BUSINESS_IDENTITY.geo,
    openingHoursSpecification: BUSINESS_IDENTITY.openingHours,
    sameAs,
  };
}
