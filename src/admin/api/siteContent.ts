import type { ImageTransform, SiteContent } from '../types';
import { request } from './http';
import { mapSiteContent } from './mappers';

type ServiceImageResult = {
  url: string;
  originalUrl: string;
  storageKey: string;
  imageTransform: ImageTransform | null;
};

async function getSiteContent(): Promise<SiteContent> {
  const doc = await request<Record<string, unknown>>('/admin/site-content', {
    auth: true,
  });
  return mapSiteContent(doc);
}

export const siteContentApi = {
  getSiteContent,

  uploadServiceCardImage(
    file: File,
    transform: ImageTransform | null = null,
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imageTransform', JSON.stringify(transform));
    return request<ServiceImageResult>('/admin/media/service-card', {
      method: 'POST',
      auth: true,
      body: formData,
    });
  },

  async updateSiteContent(data: Partial<SiteContent>): Promise<SiteContent> {
    const current = await getSiteContent();
    const merged = { ...current, ...data };
    // Strip empty ids so Mongo can create new subdocs
    const payload = {
      ...merged,
      serviceNavLinks: (merged.serviceNavLinks ?? []).map(({ id, sections, ...rest }) => ({
        ...(id ? { _id: id } : {}),
        ...rest,
        sections: sections.map(({ id: sectionId, ...section }) => ({
          ...(sectionId ? { _id: sectionId } : {}),
          ...section,
          imageUrl: section.imageUrl.trim() || null,
        })),
      })),
    };
    await request('/admin/site-content', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
    return getSiteContent();
  },

  uploadServiceSectionImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<ServiceImageResult>('/admin/media/service-section', {
      method: 'POST',
      auth: true,
      body: formData,
    });
  },
};
