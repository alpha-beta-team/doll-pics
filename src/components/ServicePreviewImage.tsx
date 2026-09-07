import { useState } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { selectServicePreview, SERVICE_CATEGORY_SLUGS } from '../lib/serviceDiscovery';
import { ResponsiveImage, type ResponsiveImageProps } from './ResponsiveImage';

export type ServicePreviewImageProps = ResponsiveImageProps & { servicePath?: string; label: string };

/** Public, category-associated media only; no per-card requests or stock fallbacks. */
export function ServicePreviewImage({ servicePath = '', label, ...props }: ServicePreviewImageProps) {
  const { featuredWork, galleryImages, serviceMedia } = useSiteData();
  const candidates = [
    ...(serviceMedia?.path === servicePath ? [...serviceMedia.cover, ...serviceMedia.photos].map(photo => ({ ...photo, categorySlugs: [SERVICE_CATEGORY_SLUGS[servicePath]] })) : []),
    ...featuredWork.filter(photo => photo.categorySlugs?.length).map(photo => ({ ...photo, src: photo.image })),
    ...galleryImages.filter(photo => photo.categorySlugs?.length),
  ];
  const image = selectServicePreview(servicePath, props.src, label, candidates);
  const resolved = { ...props, ...image, alt: props.alt === '' ? '' : image?.alt || props.alt };
  return <Preview key={`${image?.src}|${image?.webpSrcSet}|${image?.avifSrcSet}`} {...resolved} src={image?.src || ''} label={label} />;
}

function Preview({ label, ...props }: ResponsiveImageProps & { label: string }) {
  const [failed, setFailed] = useState(false);
  if (!props.src || failed) {
    return <span data-service-image-fallback="" aria-hidden="true" className={`${props.className || ''} flex items-center justify-center bg-ink-900 p-8 text-center font-display text-3xl text-gold-300`} style={props.style}>{label}</span>;
  }
  return <ResponsiveImage {...props} onError={event => { setFailed(true); props.onError?.(event); }} />;
}
