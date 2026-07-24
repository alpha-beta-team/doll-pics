import type {
  BehindScene,
  Booking,
  BookingStatus,
  Category,
  Enquiry,
  HeroSlide,
  ImageTransform,
  Package,
  PackageCategory,
  Photo,
  SiteContent,
  Stat,
  StoryScene,
  TeamMember,
  Testimonial,
} from '../types';
import { normalizeId } from './http';

/** Backend photo shape differs from frontend — map variants + categoryIds. */
export function mapPhoto(doc: Record<string, unknown>): Photo {
  const base = normalizeId(doc);
  const variants = (doc.variants ?? {}) as {
    webp?: { url: string; width: number }[];
    avif?: { url: string; width: number }[];
    original?: { url: string };
  };
  const webpVariants = variants.webp ?? [];
  const avifVariants = variants.avif ?? [];
  const webpUrl = webpVariants[webpVariants.length - 1]?.url ?? '';
  const avifUrl = avifVariants[avifVariants.length - 1]?.url ?? '';
  const sizes = webpVariants.map((v) => v.width);

  return {
    id: base.id,
    title: (doc.title as string) ?? '',
    altText: (doc.altText as string) ?? '',
    categories: ((doc.categoryIds as string[]) ?? []).map(String),
    variants: {
      webp: webpUrl,
      avif: avifUrl,
      original: variants.original?.url ?? '',
      sizes,
    },
    imageTransform: (doc.imageTransform as ImageTransform | null) ?? null,
    width: (doc.width as number) ?? 0,
    height: (doc.height as number) ?? 0,
    order: (doc.order as number) ?? 0,
    isFeatured: (doc.isFeatured as boolean) ?? false,
    isPublished: (doc.isPublished as boolean) ?? false,
    location: (doc.location as string) ?? '',
    year: (doc.year as string) ?? '',
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
  };
}

export function mapCategory(doc: Record<string, unknown>): Category {
  const base = normalizeId(doc);
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    slug: (doc.slug as string) ?? '',
    description: (doc.description as string) ?? '',
    seoTitle: (doc.seoTitle as string) ?? '',
    seoDescription: (doc.seoDescription as string) ?? '',
    coverPhotoId: doc.coverPhotoId ? String(doc.coverPhotoId) : null,
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  };
}

export function mapPackageCategory(doc: Record<string, unknown>): PackageCategory {
  const base = normalizeId(doc);
  const slug = (doc.slug as string) ?? '';
  const rawPath = (doc.path as string) ?? '';
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    slug,
    path: rawPath || (slug ? `/${slug}-packages-erode` : ''),
    description: (doc.description as string) ?? '',
    seoTitle: (doc.seoTitle as string) ?? '',
    seoDescription: (doc.seoDescription as string) ?? '',
    heading: (doc.heading as string) ?? '',
    lead: (doc.lead as string) ?? '',
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  };
}

export function mapPackage(doc: Record<string, unknown>): Package {
  const base = normalizeId(doc);
  const categoryId =
    doc.categoryId != null
      ? String(doc.categoryId)
      : typeof doc.category === 'object' &&
          doc.category &&
          '_id' in (doc.category as object)
        ? String((doc.category as { _id: unknown })._id)
        : '';
  const categoryName =
    (doc.categoryName as string) ||
    (typeof doc.category === 'object' &&
    doc.category &&
    'name' in (doc.category as object)
      ? String((doc.category as { name: unknown }).name)
      : '') ||
    (doc.shootType as string) ||
    '';
  const categorySlug =
    (doc.categorySlug as string) ||
    (typeof doc.category === 'object' &&
    doc.category &&
    'slug' in (doc.category as object)
      ? String((doc.category as { slug: unknown }).slug)
      : '') ||
    '';
  const locationType = (doc.locationType as Package['locationType']) ?? '';
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    categoryId,
    categoryName: categoryName || undefined,
    categorySlug: categorySlug || undefined,
    shootType: (doc.shootType as string) || categoryName || undefined,
    description: (doc.description as string) ?? '',
    inclusions: (doc.inclusions as string[]) ?? [],
    pricingMode: (doc.pricingMode as Package['pricingMode']) ?? 'enquire',
    price: doc.price != null ? (doc.price as number) : undefined,
    icon: (doc.icon as string) ?? '',
    imageUrl: (doc.imageUrl as string) ?? '',
    durationLabel: (doc.durationLabel as string) ?? '',
    advanceAmount: doc.advanceAmount != null ? (doc.advanceAmount as number) : null,
    notes: Array.isArray(doc.notes) ? (doc.notes as string[]) : [],
    slotTimings: Array.isArray(doc.slotTimings) ? (doc.slotTimings as string[]) : [],
    locationType:
      locationType === 'studio' ||
      locationType === 'home' ||
      locationType === 'outdoor'
        ? locationType
        : '',
    themeGuideUrl: (doc.themeGuideUrl as string) ?? '',
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  };
}

export function mapEnquiry(doc: Record<string, unknown>): Enquiry {
  const base = normalizeId(doc);
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    email: (doc.email as string) ?? '',
    phone: (doc.phone as string) ?? '',
    shootType: (doc.shootType as string) ?? '',
    preferredEvent: (doc.preferredEvent as string) ?? '',
    shootDate: (doc.shootDate as string) ?? '',
    location: (doc.location as string) ?? '',
    reminderDate: (doc.reminderDate as string) ?? '',
    notes: (doc.notes as string) ?? '',
    message: (doc.message as string) ?? '',
    status: (doc.status as Enquiry['status']) ?? 'new',
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
  };
}

export function mapBooking(doc: Record<string, unknown>): Booking {
  const base = normalizeId(doc);
  return {
    id: base.id,
    customerName: (doc.customerName as string) ?? '',
    customerPhone: (doc.customerPhone as string) ?? '',
    customerEmail: (doc.customerEmail as string) ?? '',
    shootType: (doc.shootType as string) ?? '',
    preferredEvent: (doc.preferredEvent as string) ?? '',
    shootDate: (doc.shootDate as string) ?? '',
    location: (doc.location as string) ?? '',
    reminderDate: (doc.reminderDate as string) ?? '',
    notes: (doc.notes as string) ?? '',
    driveGalleryUrl: (doc.driveGalleryUrl as string) ?? '',
    driveEditedUrl: (doc.driveEditedUrl as string) ?? '',
    driveRawsUrl: (doc.driveRawsUrl as string) ?? '',
    driveNotes: (doc.driveNotes as string) ?? '',
    status: (doc.status as BookingStatus) ?? 'draft',
    confirmedAt: doc.confirmedAt ? String(doc.confirmedAt) : undefined,
    enquiryId: doc.enquiryId ? String(doc.enquiryId) : undefined,
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
  };
}

function mapOrderedItem<T extends { id: string; order: number; isPublished: boolean }>(
  doc: Record<string, unknown>,
  fields: (base: { id: string; order: number; isPublished: boolean }) => T,
): T {
  const base = normalizeId(doc);
  return fields({
    id: base.id,
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  });
}

export function mapHeroSlide(doc: Record<string, unknown>): HeroSlide {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    image: (doc.image as string) ?? '',
    label: (doc.label as string) ?? '',
  }));
}

export function mapStoryScene(doc: Record<string, unknown>): StoryScene {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    text: (doc.text as string) ?? '',
    image: (doc.image as string) ?? '',
  }));
}

export function mapStat(doc: Record<string, unknown>): Stat {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    value: (doc.value as number) ?? 0,
    suffix: (doc.suffix as string) ?? '',
    label: (doc.label as string) ?? '',
  }));
}

export function mapTestimonial(doc: Record<string, unknown>): Testimonial {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    name: (doc.name as string) ?? '',
    role: (doc.role as string) ?? '',
    avatar: (doc.avatar as string) ?? '',
    rating: (doc.rating as number) ?? 5,
    text: (doc.text as string) ?? '',
    likes: (doc.likes as number) ?? 0,
    reply: (doc.reply as string) ?? '',
  }));
}

export function mapBehindScene(doc: Record<string, unknown>): BehindScene {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    title: (doc.title as string) ?? '',
    image: (doc.image as string) ?? '',
  }));
}

export function mapTeamMember(doc: Record<string, unknown>): TeamMember {
  return mapOrderedItem(doc, (base) => ({
    ...base,
    name: (doc.name as string) ?? '',
    role: (doc.role as string) ?? '',
    bio: (doc.bio as string) ?? '',
    photo: (doc.photo as string) ?? '',
  }));
}

export function mapSiteContent(doc: Record<string, unknown>): SiteContent {
  const links = Array.isArray(doc.serviceNavLinks) ? doc.serviceNavLinks : [];
  return {
    brandName: (doc.brandName as string) ?? '',
    tagline: (doc.tagline as string) ?? '',
    heroHeading: (doc.heroHeading as string) ?? '',
    heroSubtext: (doc.heroSubtext as string) ?? '',
    about: (doc.about as string) ?? '',
    ourStory: (doc.ourStory as string) ?? '',
    mission: (doc.mission as string) ?? '',
    aboutHeroSubtext: (doc.aboutHeroSubtext as string) ?? '',
    contactEmail: (doc.contactEmail as string) ?? '',
    whatsapp: (doc.whatsapp as string) ?? '',
    phone: (doc.phone as string) ?? '',
    socials: (doc.socials as SiteContent['socials']) ?? {},
    serviceNavLinks: links.map((raw, index) => {
      const link = raw as Record<string, unknown>;
      return {
        id: String(link._id ?? link.id ?? ''),
        label: String(link.label ?? ''),
        path: String(link.path ?? ''),
        description: String(link.description ?? ''),
        icon: String(link.icon ?? 'Camera'),
        imageUrl: String(link.imageUrl ?? ''),
        seoTitle: String(link.seoTitle ?? ''),
        seoDescription: String(link.seoDescription ?? ''),
        heading: String(link.heading ?? ''),
        lead: String(link.lead ?? ''),
        order: typeof link.order === 'number' ? link.order : index,
        isPublished: link.isPublished !== false,
      };
    }),
  };
}
