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

const TARGET_COUNT = 9;

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

  // Prefer category matches, then fallbacks (service-specific), then general gallery fill.
  const pooled = dedupe([...fromFeatured, ...fromFallback, ...fromGallery]);
  const selected = pooled.slice(0, TARGET_COUNT);

  if (!selected.length) {
    return { hero: null, gallery: [], inline: [] };
  }

  const [hero, ...rest] = selected;
  const gallery = rest.slice(0, 8);
  const inline = rest.slice(0, 2);

  return { hero, gallery, inline };
}
