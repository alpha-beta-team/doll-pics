/**
 * Shared CMS domain types — single source for public site + admin.
 * Admin entities add id/order/isPublished where the API requires them.
 * Public API views are Pick/Omit aliases of the same shapes.
 */

export type PricingMode = 'price' | 'startingFrom' | 'enquire';

export type EnquiryStatus = 'new' | 'read' | 'responded';

export type BookingStatus = 'draft' | 'confirmed' | 'cancelled' | 'completed';

/** Ordered CMS row metadata (admin + published lists). */
export type CmsMeta = {
  id: string;
  order: number;
  isPublished: boolean;
};

// —— Navigation / site content ——————————————————————————————

export type ServiceNavLink = {
  id?: string;
  label: string;
  path: string;
  description: string;
  icon: string;
  imageUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order: number;
  isPublished: boolean;
};

/** Sparse API payload before normalizeServiceNavLinks. */
export type ServiceNavLinkInput = {
  _id?: string;
  id?: string;
  label: string;
  path: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order?: number;
  isPublished?: boolean;
};

export type SiteSocials = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
};

export type SiteContent = {
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
  socials: SiteSocials;
  serviceNavLinks: ServiceNavLink[];
};

/** Public `/site-content` response (optional story fields, loose socials). */
export type PublicSiteContent = {
  brandName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  ourStory?: string;
  mission?: string;
  aboutHeroSubtext?: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socials: Record<string, string>;
  serviceNavLinks?: ServiceNavLinkInput[];
};

// —— Packages ————————————————————————————————————————————————

export type PackageCategory = CmsMeta & {
  name: string;
  slug: string;
  /** Public SEO path, e.g. `/wedding-packages-erode`. */
  path: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heading: string;
  lead: string;
};

export type PublicPackageCategory = {
  name: string;
  slug: string;
  path?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order?: number;
};

export type LocationType = '' | 'studio' | 'home' | 'outdoor';

export type Package = CmsMeta & {
  name: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  /** @deprecated Prefer categoryId */
  shootType?: string;
  description: string;
  inclusions: string[];
  pricingMode: PricingMode;
  price?: number;
  icon: string;
  imageUrl: string;
  durationLabel: string;
  advanceAmount: number | null;
  notes: string[];
  slotTimings: string[];
  locationType: LocationType;
  themeGuideUrl: string;
};

export type PublicPackage = {
  name: string;
  /** @deprecated Prefer categoryName */
  shootType?: string;
  categorySlug?: string;
  categoryName?: string;
  description: string;
  inclusions: string[];
  icon?: string;
  imageUrl?: string;
  pricingMode: string;
  price?: number;
  durationLabel?: string;
  advanceAmount?: number | null;
  notes?: string[];
  slotTimings?: string[];
  locationType?: LocationType;
  themeGuideUrl?: string;
};

// —— Media ————————————————————————————————————————————————————

export type PhotoWidthVariant = { url: string; width: number };

export type ImageTransform = {
  crop: { x: number; y: number; width: number; height: number } | null;
  cropPercentages?: { x: number; y: number; width: number; height: number } | null;
  outputWidth: number;
  outputHeight: number;
};

export type PhotoVariants = {
  webp?: string | PhotoWidthVariant[];
  avif?: string | PhotoWidthVariant[];
  original?: { url: string };
};

/** Public gallery photo (variant arrays for srcset). */
export type PublicPhoto = {
  _id?: string;
  id?: string;
  title: string;
  altText?: string;
  location?: string;
  year?: string;
  isFeatured?: boolean;
  storageKey?: string;
  width?: number;
  height?: number;
  variants?: PhotoVariants;
  categoryIds?: Array<{ name: string; slug: string } | string>;
};

/** Admin list/edit photo (flattened URLs for the CMS UI). */
export type Photo = {
  id: string;
  title: string;
  altText: string;
  categories: string[];
  variants: {
    webp: string;
    avif: string;
    original: string;
    sizes: number[];
  };
  imageTransform: ImageTransform | null;
  width: number;
  height: number;
  order: number;
  isFeatured: boolean;
  isPublished: boolean;
  location: string;
  year: string;
  createdAt: string;
};

export type Category = CmsMeta & {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  coverPhotoId: string | null;
};

// —— Ordered homepage content ————————————————————————————————

export type HeroSlide = CmsMeta & {
  image: string;
  label: string;
};

export type StoryScene = CmsMeta & {
  text: string;
  image: string;
};

export type Stat = CmsMeta & {
  value: number;
  suffix: string;
  label: string;
};

export type Testimonial = CmsMeta & {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  reply: string;
};

export type BehindScene = CmsMeta & {
  title: string;
  image: string;
};

export type TeamMember = CmsMeta & {
  name: string;
  role: string;
  bio: string;
  photo: string;
  photoOriginal: string;
  photoStorageKey: string;
  imageTransform: ImageTransform | null;
};

/** Public list items omit admin meta (API may still send it). */
export type PublicHeroSlide = Pick<HeroSlide, 'image' | 'label'>;
export type PublicStoryScene = Pick<StoryScene, 'text' | 'image'>;
export type PublicStat = Pick<Stat, 'value' | 'suffix' | 'label'>;
export type PublicTestimonial = Pick<
  Testimonial,
  'name' | 'role' | 'avatar' | 'rating' | 'text' | 'likes' | 'reply'
>;
export type PublicBehindScene = Pick<BehindScene, 'title' | 'image'>;
export type PublicTeamMember = Pick<TeamMember, 'name' | 'role' | 'bio' | 'photo'>;

// —— Ops ——————————————————————————————————————————————————————

export type Enquiry = {
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
  status: EnquiryStatus;
  createdAt: string;
};

export type CreateEnquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  shootType: string;
  preferredEvent?: string;
  shootDate?: string;
  location?: string;
  reminderDate?: string;
  notes?: string;
  message: string;
};

export type Booking = {
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
};

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

export type User = {
  id: string;
  email: string;
  name: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
};
