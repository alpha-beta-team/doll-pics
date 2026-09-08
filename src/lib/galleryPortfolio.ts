import { photoLabels } from './photoLabels';
import { getPhotoLightboxUrl, getPhotoSources, type PhotoSources } from './api';
import type { PublicPhoto } from '../shared/types';

export type PortfolioPhoto = {
  id: string;
  title: string;
  width: number;
  height: number;
  location: string;
  year: string;
  blurPlaceholder?: string;
  sources: PhotoSources;
  lightboxSrc: string;
};

function photoId(photo: PublicPhoto, index: number): string {
  return photo.id || photo._id || photo.storageKey || `${photo.title}-${index}`;
}

export function normalizePhotos(photos: PublicPhoto[]): PortfolioPhoto[] {
  return photos
    .map<PortfolioPhoto | null>((photo, index) => {
      const sources = getPhotoSources(photo);
      const lightboxSrc = getPhotoLightboxUrl(photo);
      if (!sources || !lightboxSrc) return null;

      return {
        id: photoId(photo, index),
        title: photoLabels(photo).title,
        width: photo.width && photo.width > 0 ? photo.width : 1200,
        height: photo.height && photo.height > 0 ? photo.height : 800,
        location: photo.location?.trim() || '',
        year: photo.year?.trim() || '',
        blurPlaceholder: photo.blurPlaceholder,
        sources,
        lightboxSrc,
      };
    })
    .filter((photo): photo is PortfolioPhoto => photo !== null);
}

