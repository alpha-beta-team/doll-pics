import { photoLabels } from './photoLabels';
import { isPublishedPortfolioPhoto } from './publicPhoto';
import { getPhotoSources } from './api';
import type { PublicPhoto } from '../shared/types';
import type { ServiceImage } from './serviceImages';

export interface ServiceMediaSnapshot {
  path: string;
  cover: ServiceImage[];
  photos: ServiceImage[];
  loaded: ('cover' | 'photos')[];
}

export function serviceImagesFromApi(photos: PublicPhoto[], categoryName?: string): ServiceImage[] {
  return photos
    .filter(isPublishedPortfolioPhoto)
    .flatMap<ServiceImage>((photo) => {
      const sources = getPhotoSources(photo, categoryName);
      if (!sources) return [];
      const populatedCategory = photo.categoryIds?.find(
        (category): category is { name: string; slug: string } =>
          typeof category === 'object' && category !== null,
      );
      return [{
        src: sources.src,
        alt: sources.alt,
        avifSrcSet: sources.avifSrcSet,
        webpSrcSet: sources.webpSrcSet,
        title: photoLabels(photo, categoryName).title,
        category: populatedCategory?.name,
      }];
    });
}
