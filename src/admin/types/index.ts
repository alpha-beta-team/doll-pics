export interface Photo {
  id: string;
  title: string;
  altText: string;
  categories: string[];
  variants: {
    webp: string;
    avif: string;
    sizes: number[];
  };
  width: number;
  height: number;
  order: number;
  isFeatured: boolean;
  isPublished: boolean;
  location: string;
  year: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  coverPhotoId: string | null;
  order: number;
  isPublished: boolean;
}

export interface PackageCategory {
  id: string;
  name: string;
  slug: string;
  /** Public SEO path, e.g. `/wedding-packages-erode`. */
  path: string;
  description: string;
  order: number;
  isPublished: boolean;
}

export interface Package {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  /** @deprecated Prefer categoryId; kept for API backwards compatibility */
  shootType?: string;
  description: string;
  inclusions: string[];
  pricingMode: 'price' | 'startingFrom' | 'enquire';
  price?: number;
  icon: string;
  imageUrl: string;
  order: number;
  isPublished: boolean;
}

export interface ServiceNavLink {
  id?: string;
  label: string;
  path: string;
  description: string;
  icon: string;
  imageUrl: string;
  order: number;
  isPublished: boolean;
}

export interface SiteContent {
  brandName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  ourStory: string;
  mission: string;
  aboutHeroSubtext: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socials: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  beforeAfter: {
    before: string;
    after: string;
  };
  serviceNavLinks: ServiceNavLink[];
}

export interface HeroSlide {
  id: string;
  image: string;
  label: string;
  order: number;
  isPublished: boolean;
}

export interface StoryScene {
  id: string;
  text: string;
  image: string;
  order: number;
  isPublished: boolean;
}

export interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
  order: number;
  isPublished: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  reply: string;
  order: number;
  isPublished: boolean;
}

export interface BehindScene {
  id: string;
  title: string;
  image: string;
  order: number;
  isPublished: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  order: number;
  isPublished: boolean;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  preferredEvent: string;
  shootDate: string;
  location: string;
  reminderDate: string;
  notes: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
}

export type BookingStatus = 'draft' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shootType: string;
  preferredEvent: string;
  shootDate: string;
  location: string;
  reminderDate: string;
  notes: string;
  driveGalleryUrl: string;
  driveEditedUrl: string;
  driveRawsUrl: string;
  driveNotes: string;
  status: BookingStatus;
  confirmedAt?: string;
  enquiryId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingWritePayload = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shootType?: string;
  preferredEvent?: string;
  shootDate?: string;
  location?: string;
  reminderDate?: string;
  notes?: string;
  driveGalleryUrl?: string;
  driveEditedUrl?: string;
  driveRawsUrl?: string;
  driveNotes?: string;
  status?: BookingStatus;
  enquiryId?: string;
};

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
