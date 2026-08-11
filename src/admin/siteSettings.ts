import type { SiteContent } from './types';

export type SiteSettings = Omit<SiteContent, 'serviceNavLinks'>;
export type SettingsTab = 'brand' | 'about' | 'contact';

export const defaultSiteSettings: SiteSettings = {
  brandName: '',
  tagline: '',
  heroHeading: '',
  heroSubtext: '',
  about: '',
  ourStory: '',
  mission: '',
  aboutHeroSubtext: '',
  contactEmail: '',
  whatsapp: '',
  phone: '',
  socials: {},
};

export function normalizeSettingsTab(value: string | null): SettingsTab {
  return value === 'about' || value === 'contact' ? value : 'brand';
}

export function pickSiteSettings(content: SiteContent): SiteSettings {
  return {
    brandName: content.brandName ?? '',
    tagline: content.tagline ?? '',
    heroHeading: content.heroHeading ?? '',
    heroSubtext: content.heroSubtext ?? '',
    about: content.about ?? '',
    ourStory: content.ourStory ?? '',
    mission: content.mission ?? '',
    aboutHeroSubtext: content.aboutHeroSubtext ?? '',
    contactEmail: content.contactEmail ?? '',
    whatsapp: content.whatsapp ?? '',
    phone: content.phone ?? '',
    socials: content.socials ?? {},
  };
}
