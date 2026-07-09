import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageSeo, getPageSeo } from '../lib/seo';

type ContactSeo = {
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
};

/** Updates document title, meta, canonical, OG, and JSON-LD for the current route. */
export function usePageSeo(contact?: ContactSeo) {
  const { pathname } = useLocation();
  const phone = contact?.phone;
  const email = contact?.email;
  const socialsKey = contact?.socials
    ? Object.entries(contact.socials)
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
        socials: contact?.socials,
      },
    });
  }, [pathname, phone, email, socialsKey]);
}
