import type {
  BehindScene,
  HeroSlide,
  Stat,
  StoryScene,
  TeamMember,
  Testimonial,
} from '../types';
import {
  mapBehindScene,
  mapHeroSlide,
  mapStat,
  mapStoryScene,
  mapTeamMember,
  mapTestimonial,
} from './mappers';
import { orderedCrud } from './orderedCrud';

const heroSlides = orderedCrud('hero-slides', mapHeroSlide);
const storyScenes = orderedCrud('story-scenes', mapStoryScene);
const stats = orderedCrud('stats', mapStat);
const testimonials = orderedCrud('testimonials', mapTestimonial);
const behindScenes = orderedCrud('behind-scenes', mapBehindScene);
const teamMembers = orderedCrud('team-members', mapTeamMember);

export const orderedContentApi = {
  getHeroSlides: () => heroSlides.getAll(),
  createHeroSlide: (data: Omit<HeroSlide, 'id'>) => heroSlides.create(data),
  updateHeroSlide: (id: string, data: Partial<HeroSlide>) =>
    heroSlides.update(id, data),
  deleteHeroSlide: (id: string) => heroSlides.delete(id),
  reorderHeroSlides: (ids: string[]) => heroSlides.reorder(ids),

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

  getTeamMembers: () => teamMembers.getAll(),
  createTeamMember: (data: Omit<TeamMember, 'id'>) => teamMembers.create(data),
  updateTeamMember: (id: string, data: Partial<TeamMember>) =>
    teamMembers.update(id, data),
  deleteTeamMember: (id: string) => teamMembers.delete(id),
  reorderTeamMembers: (ids: string[]) => teamMembers.reorder(ids),
};
