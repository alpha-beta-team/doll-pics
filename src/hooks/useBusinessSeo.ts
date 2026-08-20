import { useEffect } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { getPublishedServiceNavLinks } from '../lib/navigation';
import { serviceCatalogFromLinks } from '../lib/seo-core';
import { applyBusinessSeo, getStaticServiceCatalog } from '../lib/seo';

/** Keeps the shared LocalBusiness entity synchronized with public CMS data. */
export function useBusinessSeo() {
  const { siteContent, loading, fromApi } = useSiteData();

  useEffect(() => {
    if (loading) return;

    const serviceCatalog = fromApi
      ? serviceCatalogFromLinks(
          getPublishedServiceNavLinks(siteContent.serviceNavLinks),
        )
      : getStaticServiceCatalog();

    applyBusinessSeo({
      contact: {
        phone: siteContent.phone,
        email: siteContent.contactEmail,
        socials: siteContent.socials,
      },
      services: serviceCatalog,
    });
  }, [fromApi, loading, siteContent]);
}
