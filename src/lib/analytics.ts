/**
 * GA4 helpers for the Doll Pictures SPA.
 * Never send names, emails, phones, or enquiry message text.
 */

export type WhatsAppCtaLocation =
  | 'homepage_hero'
  | 'header'
  | 'footer'
  | 'service_page'
  | 'booking_page'
  | 'floating_button';

export type LeadMethod = 'booking_form' | 'contact_form';

type EventParams = Record<string, string | number | boolean | undefined>;

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://dollpictures.in'
).replace(/\/$/, '');

let scriptRequested = false;
let lastPagePath: string | null = null;
let lastViewServicePath: string | null = null;
let lastBookingStartKey: string | null = null;
let lastBookingStartAt = 0;

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isAdminPath(pathname?: string): boolean {
  const path = pathname ?? (canUseDom() ? window.location.pathname : '');
  return path.startsWith('/admin');
}

function isAllowedOrigin(): boolean {
  if (!canUseDom()) return false;
  const origin = window.location.origin.replace(/\/$/, '');
  if (origin === SITE_URL) return true;
  // Allow localhost when an ID is configured (GA4 DebugView / local checks).
  return (
    import.meta.env.DEV &&
    (origin.includes('localhost') || origin.includes('127.0.0.1'))
  );
}

function isReady(): boolean {
  return (
    Boolean(MEASUREMENT_ID) &&
    canUseDom() &&
    !isAdminPath() &&
    isAllowedOrigin()
  );
}

function safeGtag(...args: unknown[]): void {
  try {
    if (!isReady() || typeof window.gtag !== 'function') return;
    window.gtag(...args);
  } catch {
    // Analytics must never break the site.
  }
}

/** Current path + query for event payloads. */
export function getPagePath(): string {
  if (!canUseDom()) return '';
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Load gtag.js once and configure GA4 with automatic page views disabled.
 * No-ops when the measurement ID is missing (e. with local .env unset).
 */
export function initializeAnalytics(): void {
  if (!isReady() || scriptRequested) return;

  try {
    window.dataLayer = window.dataLayer || [];

    // Must push `arguments` (not a rest-args array) for gtag.js to process the queue.
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }

    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

    if (!document.getElementById('ga4-gtag')) {
      const script = document.createElement('script');
      script.id = 'ga4-gtag';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
      document.head.appendChild(script);
    }

    scriptRequested = true;
  } catch {
    // Fail silently.
  }
}

/**
 * Manual SPA page_view. Dedupes identical path+search (covers React Strict Mode).
 */
export function trackPageView(pagePath?: string): void {
  if (!isReady()) return;

  const path = pagePath ?? getPagePath();
  if (path === lastPagePath) return;
  // Allow view_service again after navigating away and returning.
  if (lastViewServicePath && path !== lastViewServicePath) {
    lastViewServicePath = null;
  }
  lastPagePath = path;

  initializeAnalytics();

  safeGtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: path,
  });
}

export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (!isReady() || !eventName) return;
  initializeAnalytics();
  safeGtag('event', eventName, params);
}

export function trackWhatsAppClick(params: {
  cta_location: WhatsAppCtaLocation;
  service_name?: string;
  page_path?: string;
}): void {
  trackEvent('whatsapp_click', {
    cta_location: params.cta_location,
    service_name: params.service_name ?? '',
    page_path: params.page_path ?? getPagePath(),
  });
}

export function trackPhoneClick(params: {
  cta_location: string;
  page_path?: string;
}): void {
  trackEvent('phone_click', {
    cta_location: params.cta_location,
    page_path: params.page_path ?? getPagePath(),
  });
}

export function trackBookingStart(params: {
  service_name: string;
  page_path?: string;
}): void {
  const page_path = params.page_path ?? getPagePath();
  // Dedupe Strict Mode double-effects within a short window.
  const key = `${params.service_name}|${page_path}`;
  const now = Date.now();
  if (key === lastBookingStartKey && now - lastBookingStartAt < 2000) return;
  lastBookingStartKey = key;
  lastBookingStartAt = now;

  trackEvent('booking_start', {
    service_name: params.service_name,
    page_path,
  });
}

export function trackGenerateLead(params: {
  method: LeadMethod;
  service_name: string;
  page_path?: string;
}): void {
  trackEvent('generate_lead', {
    method: params.method,
    service_name: params.service_name,
    page_path: params.page_path ?? getPagePath(),
  });
}

export function trackViewService(params: {
  service_name: string;
  page_path?: string;
}): void {
  const page_path = params.page_path ?? getPagePath();
  // Dedupe Strict Mode double-mount; allow a later revisit of the same service.
  if (page_path === lastViewServicePath) return;
  lastViewServicePath = page_path;

  trackEvent('view_service', {
    service_name: params.service_name,
    page_path,
  });
}

/** Test-only: reset module dedupe state. */
export function __resetAnalyticsForTests(): void {
  scriptRequested = false;
  lastPagePath = null;
  lastViewServicePath = null;
  lastBookingStartKey = null;
  lastBookingStartAt = 0;
}
