import type {
  FeaturedWorkItem,
  GalleryImageItem,
} from '../contexts/SiteDataContext';

export type ServiceImage = {
  src: string;
  alt: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
  title?: string;
  category?: string;
};

const MAX_GALLERY_COUNT = 6;

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function dedupe(images: ServiceImage[]): ServiceImage[] {
  const seen = new Set<string>();
  const out: ServiceImage[] = [];
  for (const image of images) {
    const key = image.src.split('?')[0];
    if (!image.src || seen.has(key)) continue;
    seen.add(key);
    out.push(image);
  }
  return out;
}

export function selectServiceImages(options: {
  imageCategories?: string[];
  fallbackImages?: Array<{ src: string; alt: string }>;
  sourceImages?: ServiceImage[];
  sourceOnly?: boolean;
  inlineCount?: number;
  featuredWork: FeaturedWorkItem[];
  galleryImages: GalleryImageItem[];
}): { hero: ServiceImage | null; gallery: ServiceImage[]; inline: ServiceImage[] } {
  const categories = new Set(
    (options.imageCategories ?? []).map(normalizeKey),
  );

  const fromFeatured = options.featuredWork
    .filter((work) => categories.has(normalizeKey(work.category)))
    .map((work) => ({
      src: work.image,
      alt: work.alt || work.title,
      avifSrcSet: work.avifSrcSet,
      webpSrcSet: work.webpSrcSet,
      title: work.title,
      category: work.category,
    }));

  const fromGallery = options.galleryImages.map((item) => ({
    src: item.src,
    alt: item.alt,
    avifSrcSet: item.avifSrcSet,
    webpSrcSet: item.webpSrcSet,
  }));

  const fromFallback = (options.fallbackImages ?? []).map((item) => ({
    src: item.src,
    alt: item.alt,
  }));

  // API-only service pages must never fall back to static/seed imagery.
  const pooled = options.sourceOnly
    ? dedupe(options.sourceImages ?? [])
    : dedupe([
        ...(options.sourceImages ?? []),
        ...fromFeatured,
        ...fromFallback,
        ...fromGallery,
      ]);
  const requestedInlineCount = Math.max(0, options.inlineCount ?? 2);
  const selected = pooled.slice(
    0,
    1 + MAX_GALLERY_COUNT + requestedInlineCount,
  );

  if (!selected.length) {
    return { hero: null, gallery: [], inline: [] };
  }

  const [hero, ...rest] = selected;
  // Keep each visual role unique: portfolio images should not repeat in the
  // editorial story sections further down the page. Reserve one inline image
  // per chapter before giving the remaining slots to the portfolio.
  const inlineCount = Math.min(requestedInlineCount, rest.length);
  const galleryCount = Math.min(
    MAX_GALLERY_COUNT,
    rest.length - inlineCount,
  );
  const gallery = rest.slice(0, galleryCount);
  const inline = rest.slice(galleryCount, galleryCount + inlineCount);

  return { hero, gallery, inline };
}
