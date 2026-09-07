import { readPublicSnapshot } from './lib/publicSnapshot';
import { captureAttribution } from './lib/attribution';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

/* Critical self-hosted WOFF2 only (latin subset, font-display: swap).
   Dropped unused weights to cut render-blocking CSS. */
import '@fontsource/cormorant-garamond/latin-300.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';

import App from './App.tsx';
import './index.css';
import { dismissBuildTimeHero } from './lib/buildTimeHero';

// Private and deep-link routes can be rewritten to the prerendered home shell.
// Remove its static LCP poster before mounting anything except the home route.
if (window.location.pathname !== '/') {
  dismissBuildTimeHero();
}

captureAttribution();

const rootElement = document.getElementById('root')!;
const snapshot = readPublicSnapshot();
if (snapshot && rootElement.hasChildNodes()) {
  void import('./pages/ServicePage').then(({ ServicePage }) => {
    hydrateRoot(rootElement, <StrictMode><App snapshot={snapshot} PilotPage={ServicePage} /></StrictMode>);
  });
} else {
  createRoot(rootElement).render(<StrictMode><App /></StrictMode>);
}

if ('serviceWorker' in navigator && ['/admin', '/employee', '/kiosk'].some((prefix) => window.location.pathname.startsWith(prefix))) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/admin-sw.js');
  });
}
