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
  return path.startsWith('/admin');
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

function isReady(): boolean {
  return Boolean(PIXEL_ID) && canUseDom() && !isAdminPath() && isAllowedOrigin();
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
  if (!isReady()) return;
  const path =
    pagePath ??
    (canUseDom() ? `${window.location.pathname}${window.location.search}` : '');
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
    content_name: contentName,
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
  lastPagePath = null;
}
