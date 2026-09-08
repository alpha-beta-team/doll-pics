import { publicHtmlKind } from './lib/publicHtmlRoutes';
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

async function startApp() {
  if (import.meta.env.DEV) {
    const { clearDevelopmentServiceWorker } = await import('./lib/devServiceWorker');
    if (await clearDevelopmentServiceWorker()) {
      // Discard modules already delivered by the old worker before it was removed.
      window.location.reload();
      return;
    }
  }
  const rootElement = document.getElementById('root')!;
  const snapshot = readPublicSnapshot();
  if (snapshot && rootElement.hasChildNodes()) {
    const pageModule = snapshot.path === '/gallery' ? import('./pages/GalleryPage').then(module => module.GalleryPage) : snapshot.path === '/'
      ? import('./pages/Site').then(module => module.Site)
      : snapshot.path === '/services' ? import('./pages/ServicesHub').then(module => module.ServicesHub)
      : snapshot.path === '/packages' ? import('./pages/Packages').then(module => module.Packages)
      : publicHtmlKind(snapshot.path, snapshot.data.publicCatalog) === 'package' ? import('./pages/PackageCategoryPage').then(module => module.PackageCategoryPage)
      : import('./pages/ServicePage').then(module => module.ServicePage);
    void pageModule.then(PublicPage => {
      hydrateRoot(rootElement, <StrictMode><App snapshot={snapshot} PilotPage={PublicPage} /></StrictMode>);
    });
  } else {
    createRoot(rootElement).render(<StrictMode><App /></StrictMode>);
  }

}
void startApp();

if (import.meta.env.PROD && 'serviceWorker' in navigator && ['/admin', '/employee', '/kiosk'].some((prefix) => window.location.pathname.startsWith(prefix))) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/admin-sw.js');
  });
}
