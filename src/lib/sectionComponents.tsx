import type { ComponentType } from 'react';
import { FeaturedWork } from '../components/sections/FeaturedWork';
import { HorizontalGallery } from '../components/sections/HorizontalGallery';
import { Services } from '../components/sections/Services';
import { BehindScenes } from '../components/sections/BehindScenes';
import { Testimonials } from '../components/sections/Testimonials';
import { BookingCTA } from '../components/sections/BookingCTA';

export const SECTION_COMPONENTS: Record<string, ComponentType> = {
  work: FeaturedWork,
  gallery: HorizontalGallery,
  services: Services,
  behind: BehindScenes,
  testimonials: Testimonials,
  booking: BookingCTA,
};
