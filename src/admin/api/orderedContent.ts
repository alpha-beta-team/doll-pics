import type {
  BehindScene,
  HeroSlide,
  ImageTransform,
  Stat,
  StoryScene,
  StaffProfile,
  Testimonial,
} from '../types';
import {
  mapBehindScene,
  mapHeroSlide,
  mapStat,
  mapStoryScene,
  mapStaffProfile,
  mapTestimonial,
} from './mappers';
import { orderedCrud } from './orderedCrud';
import { request } from './http';

type StaffProfileImageResult = {
  url: string;
  originalUrl: string;
  storageKey: string;
  imageTransform: ImageTransform | null;
};

type HeroSlideImageResult = {
  url: string;
  originalUrl: string;
  storageKey: string;
  imageTransform: ImageTransform | null;
};

const heroSlides = orderedCrud('hero-slides', mapHeroSlide);
const storyScenes = orderedCrud('story-scenes', mapStoryScene);
const stats = orderedCrud('stats', mapStat);
const testimonials = orderedCrud('testimonials', mapTestimonial);
const behindScenes = orderedCrud('behind-scenes', mapBehindScene);
const staffProfiles = orderedCrud('staff-accounts/profiles', mapStaffProfile);

export const orderedContentApi = {
  getHeroSlides: () => heroSlides.getAll(),
  createHeroSlide: (data: Omit<HeroSlide, 'id'>) => heroSlides.create(data),
  updateHeroSlide: (id: string, data: Partial<HeroSlide>) =>
    heroSlides.update(id, data),
  deleteHeroSlide: (id: string) => heroSlides.delete(id),
  reorderHeroSlides: (ids: string[]) => heroSlides.reorder(ids),

  uploadHeroSlideImage: (
    file: File,
    transform: ImageTransform | null = null,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imageTransform', JSON.stringify(transform));
    return request<HeroSlideImageResult>('/admin/media/hero-slide', {
      method: 'POST',
      auth: true,
      body: formData,
    });
  },

  updateHeroSlideImage: (
    id: string,
    transform: ImageTransform | null,
  ) =>
    request<HeroSlideImageResult>(`/admin/hero-slides/${id}/image`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ imageTransform: transform }),
    }),

  getStoryScenes: () => storyScenes.getAll(),
  createStoryScene: (data: Omit<StoryScene, 'id'>) => storyScenes.create(data),
  updateStoryScene: (id: string, data: Partial<StoryScene>) =>
    storyScenes.update(id, data),
  deleteStoryScene: (id: string) => storyScenes.delete(id),
  reorderStoryScenes: (ids: string[]) => storyScenes.reorder(ids),

  getStats: () => stats.getAll(),
  createStat: (data: Omit<Stat, 'id'>) => stats.create(data),
  updateStat: (id: string, data: Partial<Stat>) => stats.update(id, data),
  deleteStat: (id: string) => stats.delete(id),
  reorderStats: (ids: string[]) => stats.reorder(ids),

  getTestimonials: () => testimonials.getAll(),
  createTestimonial: (data: Omit<Testimonial, 'id'>) =>
    testimonials.create(data),
  updateTestimonial: (id: string, data: Partial<Testimonial>) =>
    testimonials.update(id, data),
  deleteTestimonial: (id: string) => testimonials.delete(id),
  reorderTestimonials: (ids: string[]) => testimonials.reorder(ids),

  getBehindScenes: () => behindScenes.getAll(),
  createBehindScene: (data: Omit<BehindScene, 'id'>) =>
    behindScenes.create(data),
  updateBehindScene: (id: string, data: Partial<BehindScene>) =>
    behindScenes.update(id, data),
  deleteBehindScene: (id: string) => behindScenes.delete(id),
  reorderBehindScenes: (ids: string[]) => behindScenes.reorder(ids),

  getStaffProfiles: () => staffProfiles.getAll(),
  createStaffProfile: (data: Omit<StaffProfile, 'id'>) => staffProfiles.create(data),
  updateStaffProfile: (id: string, data: Partial<StaffProfile>) => staffProfiles.update(id, data),
  deleteStaffProfile: (id: string) => staffProfiles.delete(id),
  reorderStaffProfiles: (ids: string[]) => staffProfiles.reorder(ids),

  uploadStaffProfileImage: (
    file: File,
    transform: ImageTransform | null = null,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imageTransform', JSON.stringify(transform));
    return request<StaffProfileImageResult>('/admin/media/staff-profile', {
      method: 'POST',
      auth: true,
      body: formData,
    });
  },

  updateStaffProfileImage: (
    id: string,
    transform: ImageTransform | null,
  ) =>
    request<StaffProfileImageResult>(`/admin/staff-accounts/profiles/${id}/image`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ imageTransform: transform }),
    }),
};
