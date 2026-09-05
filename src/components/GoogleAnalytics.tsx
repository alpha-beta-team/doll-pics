import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';
import { captureAttribution } from '../lib/attribution';

/** Immediate manual SPA tracking; module dedupe covers Strict Mode effects. */
export function GoogleAnalytics() {
  const location = useLocation();
  useEffect(() => {
    captureAttribution();
    trackPageView(location.pathname);
  }, [location.pathname, location.search, location.hash]);
  return null;
}
