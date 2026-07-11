import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '';
const SITE_URL = (
  import.meta.env.VITE_SITE_URL as string | undefined
)?.replace(/\/$/, '') || 'https://dollpictures.in';

function isTrackingAllowed(pathname: string): boolean {
  if (!MEASUREMENT_ID) return false;
  if (import.meta.env.DEV) return false;
  if (pathname.startsWith('/admin')) return false;

  const origin = window.location.origin.replace(/\/$/, '');
  if (origin !== SITE_URL) return false;

  return true;
}

function ensureGtagLoaded(id: string): void {
  window.dataLayer = window.dataLayer || [];

  // Must push `arguments` (not a rest-args array) for gtag.js to process the queue.
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  if (document.getElementById('ga4-gtag')) return;

  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });

  const script = document.createElement('script');
  script.id = 'ga4-gtag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

function sendPageView(pathname: string, search: string): void {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: `${pathname}${search}`,
  });
}

export function GoogleAnalytics() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isTrackingAllowed(location.pathname)) return;

    if (!initialized.current) {
      ensureGtagLoaded(MEASUREMENT_ID);
      initialized.current = true;
    }

    sendPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}
