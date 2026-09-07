import type { PublicHtmlPath } from './lib/publicHtmlRoutes';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { createPrerenderSiteData } from './contexts/SiteDataContext';
import { ServicePage } from './pages/ServicePage';
import { serviceImagesFromApi } from './lib/serviceMedia';
import { type PublicSnapshot } from './lib/publicSnapshot';
import type { PublicSiteContent, PublicPackageCategory, PublicPhoto, PublicCategory } from './shared/types';

export async function renderPublicService(input: {
  path: PublicHtmlPath;
  siteContent?: PublicSiteContent;
  categories?: PublicPackageCategory[];
  cover?: PublicCategory;
  photos?: PublicPhoto[];
}) {
  const { data, loaded } = await createPrerenderSiteData(input.siteContent, input.categories);
  const categoryName = data.siteContent.serviceNavLinks?.find(link => link.path === input.path)?.label;
  data.serviceMedia = {
    path: input.path,
    cover: input.cover?.coverPhotoId && typeof input.cover.coverPhotoId === 'object'
      ? serviceImagesFromApi([input.cover.coverPhotoId], categoryName) : [],
    photos: input.photos ? serviceImagesFromApi(input.photos, categoryName) : [],
    loaded: [...(input.cover ? ['cover' as const] : []), ...(input.photos ? ['photos' as const] : [])],
  };
  const snapshot: PublicSnapshot = { version: 1, path: input.path, data, loaded };
  const html = renderToString(<StrictMode><StaticRouter location={snapshot.path}><AppRoutes snapshot={snapshot} PilotPage={ServicePage} /></StaticRouter></StrictMode>);
  return { html, snapshot };
}
