import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackPageView } from '../lib/analytics';

/**
 * SPA route tracker — must render inside BrowserRouter.
 * Sends page_view on initial load and whenever path or query changes.
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    initializeAnalytics();
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}
