import { isPrivatePath, publicPath, campaignValue } from './attribution';
/**
 * Meta Pixel helpers for the Doll Pictures SPA.
 * Never send names, emails, phones, or enquiry message text.
 */

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim();
const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://dollpictures.in'
).replace(/\/$/, '');

let scriptRequested = false;
let lastPagePath: string | null = null;
let suspendedByRoute = false;

type FbqCommand = 'init' | 'track' | 'trackCustom' | 'consent';

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isAdminPath(pathname?: string): boolean {
  const path = pathname ?? (canUseDom() ? window.location.pathname : '');
  return isPrivatePath(path);
}

function isAllowedOrigin(): boolean {
  if (!canUseDom()) return false;
  const origin = window.location.origin.replace(/\/$/, '');
  if (origin === SITE_URL) return true;
  return (
    import.meta.env.DEV &&
    (origin.includes('localhost') || origin.includes('127.0.0.1'))
  );
}

// The SDK reads document URLs itself. Do not activate it on URLs carrying
// arbitrary parameters, fragments, or private referrers; GA uses explicit safe URLs.
function hasSafeSdkContext(): boolean {
  return [window.location.href, document.referrer].every(value => {
    if (!value) return true;
    try {
      const url = new URL(value);
      if (isPrivatePath(url.pathname) || publicPath(url.pathname) !== url.pathname || url.hash) return false;
      return [...url.searchParams].every(([key, value]) =>
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].includes(key) && Boolean(campaignValue(value)));
    } catch { return false; }
  });
}

function isReady(): boolean {
  return Boolean(PIXEL_ID) && canUseDom() && !isAdminPath() && isAllowedOrigin() && hasSafeSdkContext();
}

function ensureFbqStub(): FbqFunction | null {
  if (!canUseDom()) return null;
  if (typeof window.fbq === 'function') return window.fbq;

  const n: FbqFunction = function (...args: unknown[]) {
    if (n.callMethod) {
      n.callMethod(...args);
    } else {
      (n.queue = n.queue || []).push(args);
    }
  };
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  window.fbq = n;
  return n;
}

function safeFbq(command: FbqCommand | string, ...args: unknown[]): void {
  try {
    if (!isReady()) return;
    const fbq = ensureFbqStub();
    if (!fbq) return;
    fbq(command, ...args);
  } catch {
    // Analytics must never break the site.
  }
}

/** Load fbevents.js once and init the pixel. No-ops when ID is missing. */
export function initializeMetaPixel(): void {
  if (!isReady() || scriptRequested) return;

  try {
    ensureFbqStub();
    safeFbq('set', 'autoConfig', false, PIXEL_ID);
    safeFbq('init', PIXEL_ID);

    if (!document.getElementById('meta-pixel')) {
      const script = document.createElement('script');
      script.id = 'meta-pixel';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }

    scriptRequested = true;
  } catch {
    // Fail silently.
  }
}

export function trackMetaPageView(pagePath?: string): void {
  const path = publicPath(pagePath ?? (canUseDom() ? window.location.pathname : ''));
  if (!isReady() || !path) {
    if (scriptRequested) { window.fbq?.('consent', 'revoke'); suspendedByRoute = true; }
    if (!path || (canUseDom() && isPrivatePath(window.location.pathname))) lastPagePath = null;
    return;
  }
  if (suspendedByRoute) { window.fbq?.('consent', 'grant'); suspendedByRoute = false; }
  if (path === lastPagePath) return;
  lastPagePath = path;

  initializeMetaPixel();
  safeFbq('track', 'PageView');
}

export function trackMetaLead(): void {
  if (!isReady()) return;
  initializeMetaPixel();
  safeFbq('track', 'Lead');
}

export function trackMetaViewContent(contentName: string): void {
  if (!isReady()) return;
  initializeMetaPixel();
  safeFbq('track', 'ViewContent', {
    content_name: campaignValue(contentName) || '',
  });
}

export function trackMetaContact(): void {
  if (!isReady()) return;
  initializeMetaPixel();
  safeFbq('track', 'Contact');
}

/** Test-only: reset module dedupe state. */
export function __resetMetaPixelForTests(): void {
  scriptRequested = false;
  suspendedByRoute = false;
  lastPagePath = null;
}
