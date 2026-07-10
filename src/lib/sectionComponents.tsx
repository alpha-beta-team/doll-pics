import { lazy, type ComponentType } from 'react';

function lazySection(
  loader: () => Promise<Record<string, ComponentType>>,
  exportName: string,
) {
  return lazy(() =>
    loader().then((m) => ({ default: m[exportName] as ComponentType })),
  );
}

export const SECTION_COMPONENTS: Record<string, ComponentType> = {
  work: lazySection(
    () => import('../components/sections/FeaturedWork'),
    'FeaturedWork',
  ),
  gallery: lazySection(
    () => import('../components/sections/HorizontalGallery'),
    'HorizontalGallery',
  ),
  services: lazySection(
    () => import('../components/sections/Services'),
    'Services',
  ),
  behind: lazySection(
    () => import('../components/sections/BehindScenes'),
    'BehindScenes',
  ),
  testimonials: lazySection(
    () => import('../components/sections/Testimonials'),
    'Testimonials',
  ),
  booking: lazySection(
    () => import('../components/sections/BookingCTA'),
    'BookingCTA',
  ),
};
