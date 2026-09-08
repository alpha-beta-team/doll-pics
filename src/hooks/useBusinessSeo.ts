import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { serviceCatalogFromLinks } from '../lib/seo-core';
import { applyBusinessSeo } from '../lib/seo';

/** Keeps the shared LocalBusiness entity synchronized with public CMS data. */
export function useBusinessSeo() {
  const { pathname } = useLocation();
  const { siteContent, loading, publicCatalog } = useSiteData();

  useEffect(() => {
    if (loading || !publicCatalog.paths.includes(pathname)) return;

    const serviceCatalog = serviceCatalogFromLinks(publicCatalog.serviceLinks);

    applyBusinessSeo({
      contact: {
        phone: siteContent.phone,
        email: siteContent.contactEmail,
        socials: siteContent.socials,
      },
      services: serviceCatalog,
    });
  }, [publicCatalog, loading, siteContent, pathname]);
}
