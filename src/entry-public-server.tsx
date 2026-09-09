import { About } from './pages/About';
import { Stories } from './pages/Stories';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { WorkPage } from './pages/WorkPage';
import { GalleryPage } from './pages/GalleryPage';
import { normalizePhotos } from './lib/galleryPortfolio';
import { normalizePackageCategorySlug } from './lib/packageCategory';
import type { PublicRouteCatalog } from './lib/publicCatalog';
import { publicHtmlKind, type PublicHtmlPath } from './lib/publicHtmlRoutes';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { createPrerenderSiteData } from './contexts/SiteDataContext';
import { ServicesHub } from './pages/ServicesHub';
import { PackageCategoryPage } from './pages/PackageCategoryPage';
import { Packages } from './pages/Packages';
import { Site } from './pages/Site';
import { ServicePage } from './pages/ServicePage';
import { serviceImagesFromApi } from './lib/serviceMedia';
import { type PublicSnapshot } from './lib/publicSnapshot';
import type { PublicSiteContent, PublicPackageCategory, PublicPhoto, PublicCategory, PublicHeroSlide, PublicPackage, PublicStaffProfile, PublicBehindScene, PublicTestimonial } from './shared/types';

const corePages = { home: Site, about: About, work: WorkPage, gallery: GalleryPage,
  services: ServicesHub, packages: Packages, stories: Stories, contact: Contact, privacy: Privacy, terms: Terms };

export async function renderPublicPage(input: {
  path: PublicHtmlPath;
  siteContent?: PublicSiteContent;
  publicCatalog?: PublicRouteCatalog;
  categories?: PublicPackageCategory[];
  cover?: PublicCategory;
  photos?: PublicPhoto[];
  offers?: PublicPackage[];
  portfolio?: PublicPhoto[];
  about?: { staff?: PublicStaffProfile[]; scenes?: PublicBehindScene[] };
  stories?: { reviews?: PublicTestimonial[] };
  home?: { hero?: PublicHeroSlide[]; featured?: PublicPhoto[]; gallery?: PublicPhoto[] };
}) {
  const { data, loaded } = await createPrerenderSiteData(input.siteContent, input.categories, input.home, input.offers, input.about, input.stories);
  if (input.publicCatalog) data.publicCatalog = input.publicCatalog;
  const kind = publicHtmlKind(input.path, data.publicCatalog);
  if (!kind) throw new Error(`Unpublished or unsupported public HTML route: ${input.path}`);
  if (kind === 'gallery') data.galleryPortfolio = { photos: normalizePhotos(input.portfolio ?? []), loaded: Array.isArray(input.portfolio) };
  if ((kind === 'work' || kind === 'contact') && !loaded.includes('featuredPhotos')) data.featuredWork = [];
  if (kind === 'stories' && !loaded.includes('testimonials')) data.testimonials = [];
  const packagePage = kind === 'package';
  const categorySlug = packagePage ? data.packageNavLinks.find(link => link.path === input.path)?.categorySlug : undefined;
  const photos = packagePage ? input.photos?.filter(photo => {
    const slugs = (photo.categoryIds ?? []).flatMap(category => typeof category === 'object' && category?.slug ? [category.slug] : []);
    return !slugs.length || slugs.some(slug => normalizePackageCategorySlug(slug) === normalizePackageCategorySlug(categorySlug || ''));
  }) : input.photos;
  const categoryName = (packagePage ? data.packageNavLinks.find(link => link.path === input.path)?.label : undefined) ?? data.siteContent.serviceNavLinks?.find(link => link.path === input.path)?.label;
  if (kind === 'service' || packagePage) data.serviceMedia = {
    path: input.path,
    cover: input.cover?.coverPhotoId && typeof input.cover.coverPhotoId === 'object'
      ? serviceImagesFromApi([input.cover.coverPhotoId], categoryName) : [],
    photos: photos ? serviceImagesFromApi(photos, categoryName) : [],
    loaded: [...(input.cover ? ['cover' as const] : []), ...(input.photos ? ['photos' as const] : [])],
  };
  const snapshot: PublicSnapshot = { version: 1, path: input.path, data, loaded };
  const Page = kind === 'service' ? ServicePage : kind === 'package' ? PackageCategoryPage : corePages[kind];
  const html = renderToString(<StrictMode><StaticRouter location={snapshot.path}><AppRoutes snapshot={snapshot} PilotPage={Page} /></StaticRouter></StrictMode>);
  return { html, snapshot };
}
