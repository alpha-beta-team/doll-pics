import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { createPrerenderSiteData } from './contexts/SiteDataContext';
import { ServicePage } from './pages/ServicePage';
import { serviceImagesFromApi } from './lib/serviceMedia';
import { PUBLIC_HTML_PILOT_PATH, type PublicSnapshot } from './lib/publicSnapshot';
import type { PublicSiteContent, PublicPackageCategory, PublicPhoto, PublicCategory } from './shared/types';

export async function renderPublicPilot(input: {
  siteContent?: PublicSiteContent;
  categories?: PublicPackageCategory[];
  cover?: PublicCategory;
  photos?: PublicPhoto[];
}) {
  const { data, loaded } = await createPrerenderSiteData(input.siteContent, input.categories);
  data.serviceMedia = {
    path: PUBLIC_HTML_PILOT_PATH,
    cover: input.cover?.coverPhotoId && typeof input.cover.coverPhotoId === 'object'
      ? serviceImagesFromApi([input.cover.coverPhotoId]) : [],
    photos: input.photos ? serviceImagesFromApi(input.photos) : [],
    loaded: [...(input.cover ? ['cover' as const] : []), ...(input.photos ? ['photos' as const] : [])],
  };
  const snapshot: PublicSnapshot = { version: 1, path: PUBLIC_HTML_PILOT_PATH, data, loaded };
  const html = renderToString(<StrictMode><StaticRouter location={snapshot.path}><AppRoutes snapshot={snapshot} PilotPage={ServicePage} /></StaticRouter></StrictMode>);
  return { html, snapshot };
}
