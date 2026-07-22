import type { Photo } from '../types';
import { request } from './http';
import { mapPhoto } from './mappers';

async function getPhotos(filters?: {
  category?: string;
  published?: boolean;
  search?: string;
}): Promise<Photo[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.published !== undefined) {
    params.set('published', String(filters.published));
  }
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const docs = await request<Record<string, unknown>[]>(
    `/admin/photos${qs ? `?${qs}` : ''}`,
    { auth: true },
  );
  return docs.map(mapPhoto).sort((a, b) => a.order - b.order);
}

export const photosApi = {
  getPhotos,

  async getPhoto(id: string): Promise<Photo | null> {
    const photos = await getPhotos();
    return photos.find((p) => p.id === id) ?? null;
  },

  async createPhoto(data: Omit<Photo, 'id' | 'createdAt'>): Promise<Photo> {
    const doc = await request<Record<string, unknown>>('/admin/photos', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        title: data.title,
        altText: data.altText,
        categoryIds: data.categories,
        order: data.order,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      }),
    });
    return mapPhoto(doc);
  },

  async updatePhoto(id: string, data: Partial<Photo>): Promise<Photo> {
    const patch: Record<string, unknown> = { ...data };
    if (data.categories) {
      patch.categoryIds = data.categories;
      delete patch.categories;
    }
    const doc = await request<Record<string, unknown>>(`/admin/photos/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(patch),
    });
    return mapPhoto(doc);
  },

  async deletePhoto(id: string): Promise<void> {
    await request(`/admin/photos/${id}`, { method: 'DELETE', auth: true });
  },

  async bulkUpdatePhotos(ids: string[], data: Partial<Photo>): Promise<void> {
    const action =
      data.isPublished === true
        ? 'publish'
        : data.isPublished === false
          ? 'unpublish'
          : undefined;
    if (!action) throw new Error('Bulk update only supports publish/unpublish');
    await request('/admin/photos/bulk', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ action, ids }),
    });
  },

  async bulkDeletePhotos(ids: string[]): Promise<void> {
    await request('/admin/photos/bulk', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ action: 'delete', ids }),
    });
  },

  async reorderPhotos(photoIds: string[]): Promise<void> {
    await request('/admin/photos/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: photoIds }),
    });
  },

  async uploadFiles(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void,
  ): Promise<Photo[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const token = sessionStorage.getItem('auth_token');
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/admin/photos/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Upload failed');
    }

    const docs = (await res.json()) as Record<string, unknown>[];
    docs.forEach((doc, i) => onProgress?.(String(doc._id ?? i), 100));
    return docs.map(mapPhoto);
  },
};
