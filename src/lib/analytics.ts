import { publicPath, referrerOrigin, isPrivatePath, campaignValue, captureAttribution } from './attribution';
/**
 * GA4 helpers for the Doll Pictures SPA.
 * Never send names, emails, phones, or enquiry message text.
 */

import {
  initializeMetaPixel,
  trackMetaContact,
  trackMetaLead,
  trackMetaPageView,
  trackMetaViewContent,
} from './metaPixel';

export type WhatsAppCtaLocation =
  | 'homepage_hero'
  | 'header'
  | 'footer'
  | 'service_page'
  | 'contact_page'
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

function isPrivateRoute(pathname?: string): boolean {
  const path = pathname ?? (canUseDom() ? window.location.pathname : '');
  return isPrivatePath(path);
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
    !isPrivateRoute() &&
    (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] !== true &&
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

/** Public pathname only; queries and private tokens never enter event payloads. */
export function getPagePath(): string {
  if (!canUseDom()) return '';
  return publicPath(window.location.pathname);
}

function pageContext() {
  const attribution = captureAttribution();
  return {
    ...(attribution?.utm_source ? { campaign_source: attribution.utm_source } : {}),
    ...(attribution?.utm_medium ? { campaign_medium: attribution.utm_medium } : {}),
    ...(attribution?.utm_campaign ? { campaign_name: attribution.utm_campaign } : {}),
    ...(attribution?.utm_content ? { campaign_content: attribution.utm_content } : {}),
    ...(attribution?.utm_term ? { campaign_term: attribution.utm_term } : {}),
    page_title: 'Doll Pictures',
    page_location: `${window.location.origin}${getPagePath()}`,
    page_referrer: referrerOrigin(document.referrer) || '',
  };
}

/** The SDK checks this property before sending, including automatic events.
 * A getter blocks private routes immediately, before React's route effect runs,
 * while retaining an opt-out value set by another integration.
 */
function installPrivateRouteGuard() {
  const key = `ga-disable-${MEASUREMENT_ID}`;
  const state = window as unknown as Record<string, unknown>;
  let optedOut = state[key] === true;
  Object.defineProperty(window, key, {
    configurable: true,
    get: () => optedOut || isPrivateRoute(),
    set: (value: unknown) => { optedOut = value === true; },
  });
}

/**
 * Load gtag.js once and configure GA4 with automatic page views disabled.
 * No-ops when the measurement ID is missing (e.g. with local .env unset).
 */
export function initializeAnalytics(): void {
  if (!isReady() || scriptRequested) return;

  try {
    installPrivateRouteGuard();
    window.dataLayer = window.dataLayer || [];

    // Must push `arguments` (not a rest-args array) for gtag.js to process the queue.
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }

    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false, ...pageContext() });

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

  initializeMetaPixel();
}

/**
 * Manual SPA page_view. Dedupes identical public pathnames (covers React Strict Mode).
 */
export function trackPageView(pagePath?: string): void {
  const path = publicPath(pagePath ?? getPagePath());
  if (!path || isPrivateRoute()) {
    trackMetaPageView(pagePath);
    lastPagePath = null; lastViewServicePath = null;
    return;
  }

  // Meta PageView uses its own dedupe; always attempt when path changes.
  trackMetaPageView(path);

  if (!isReady()) return;

  if (path === lastPagePath) return;
  // Allow view_service again after navigating away and returning.
  if (lastViewServicePath && path !== lastViewServicePath) {
    lastViewServicePath = null;
  }
  lastPagePath = path;

  initializeAnalytics();

  safeGtag('event', 'page_view', {
    ...pageContext(),
    page_path: path,
  });
}

export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (!isReady() || !eventName) return;
  initializeAnalytics();
  safeGtag('event', eventName, {
    ...params,
    ...(params.service_name !== undefined ? { service_name: campaignValue(params.service_name) || '' } : {}),
    ...pageContext(),
    page_path: publicPath(String(params.page_path ?? getPagePath())),
  });
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
  trackMetaContact();
}

export function trackPhoneClick(params: {
  cta_location: string;
  page_path?: string;
}): void {
  trackEvent('phone_click', {
    cta_location: params.cta_location,
    page_path: params.page_path ?? getPagePath(),
  });
  trackMetaContact();
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
  trackMetaLead();
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
  trackMetaViewContent(params.service_name);
}

export function trackEmailCapture(params: {
  method: LeadMethod;
  service_name: string;
  page_path?: string;
}): void {
  trackEvent('email_capture', {
    method: params.method,
    service_name: params.service_name,
    page_path: params.page_path ?? getPagePath(),
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
