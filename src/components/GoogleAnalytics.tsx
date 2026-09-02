import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PASSIVE_ANALYTICS_DELAY_MS = 20_000;
let analyticsActivated = false;
let latestPagePath = '/';

async function activateAnalytics(pagePath: string) {
  const { initializeAnalytics, trackPageView } = await import(
    '../lib/analytics'
  );
  initializeAnalytics();
  analyticsActivated = true;
  trackPageView(latestPagePath || pagePath);
}

/**
 * SPA route tracker — must render inside BrowserRouter.
 * Sends page_view on initial load and whenever path or query changes.
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const privateRoute = ['/admin', '/employee', '/kiosk', '/quotation']
      .some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
    if (privateRoute) return;

    const pagePath = `${location.pathname}${location.search}`;
    latestPagePath = pagePath;
    if (analyticsActivated) {
      void activateAnalytics(pagePath);
      return;
    }

    let cancelled = false;
    let timer = 0;
    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'wheel',
    ];

    const cleanup = () => {
      window.clearTimeout(timer);
      for (const eventName of events) {
        window.removeEventListener(eventName, start);
      }
    };

    const start = () => {
      if (cancelled) return;
      cleanup();
      void activateAnalytics(pagePath);
    };

    for (const eventName of events) {
      window.addEventListener(eventName, start, {
        once: true,
        passive: true,
      });
    }
    timer = window.setTimeout(start, PASSIVE_ANALYTICS_DELAY_MS);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [location.pathname, location.search]);

  return null;
}
