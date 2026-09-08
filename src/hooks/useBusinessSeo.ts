import { useEffect } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { serviceCatalogFromLinks } from '../lib/seo-core';
import { applyBusinessSeo } from '../lib/seo';

/** Keeps the shared LocalBusiness entity synchronized with public CMS data. */
export function useBusinessSeo() {
  const { siteContent, loading, publicCatalog } = useSiteData();

  useEffect(() => {
    if (loading) return;

    const serviceCatalog = serviceCatalogFromLinks(publicCatalog.serviceLinks);

    applyBusinessSeo({
      contact: {
        phone: siteContent.phone,
        email: siteContent.contactEmail,
        socials: siteContent.socials,
      },
      services: serviceCatalog,
    });
  }, [publicCatalog, loading, siteContent]);
}
