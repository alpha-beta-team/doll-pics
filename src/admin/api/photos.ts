import type { ImageTransform, Photo } from '../types';
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

  async updatePhotoTransform(
    id: string,
    transform: ImageTransform | null,
  ): Promise<Photo> {
    const doc = await request<Record<string, unknown>>(
      `/admin/photos/${id}/transform`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ imageTransform: transform }),
      },
    );
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
    uploads: {
      file: File;
      title: string;
      altText: string;
      categoryId: string;
      width: number;
      height: number;
    }[],
    onProgress?: (fileId: string, progress: number) => void,
  ): Promise<Photo[]> {
    const docs: Record<string, unknown>[] = [];
    for (const upload of uploads) {
      const signed = await request<{
        storageKey: string;
        uploadUrl: string;
        headers: { 'Content-Type': string };
      }>('/admin/photos/uploads/presign', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          originalFilename: upload.file.name,
          mimeType: upload.file.type,
          categoryId: upload.categoryId,
        }),
      });

      await putWithProgress(
        signed.uploadUrl,
        upload.file,
        signed.headers['Content-Type'],
        (progress) => onProgress?.(upload.file.name, progress),
      );

      const doc = await request<Record<string, unknown>>('/admin/photos/uploads/confirm', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          storageKey: signed.storageKey,
          originalFilename: upload.file.name,
          title: upload.title,
          altText: upload.altText,
          categoryId: upload.categoryId,
          mimeType: upload.file.type,
          size: upload.file.size,
          width: upload.width,
          height: upload.height,
        }),
      });
      docs.push(doc);
      onProgress?.(upload.file.name, 100);
    }
    return docs.map(mapPhoto);
  },
};

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Storage upload failed. Check the R2 CORS policy.'));
    xhr.send(file);
  });
}
