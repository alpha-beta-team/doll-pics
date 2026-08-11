import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageSeo, getPageSeo } from '../lib/seo';

/** Updates document title, meta, canonical, OG, and JSON-LD for the current route. */
export function usePageSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyPageSeo(getPageSeo(pathname));
  }, [pathname]);
}
