import type { Category } from '../types';
import { request } from './http';
import { mapCategory } from './mappers';

async function getCategories(): Promise<Category[]> {
  const docs = await request<Record<string, unknown>[]>('/admin/categories', {
    auth: true,
  });
  return docs.map(mapCategory).sort((a, b) => a.order - b.order);
}

async function getServiceCategories(): Promise<Category[]> {
  const docs = await request<Record<string, unknown>[]>('/admin/categories/services', {
    auth: true,
  });
  return docs.map(mapCategory).sort((a, b) => a.order - b.order);
}

export const categoriesApi = {
  getCategories,
  getServiceCategories,

  async getCategory(id: string): Promise<Category | null> {
    const categories = await getCategories();
    return categories.find((c) => c.id === id) ?? null;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const doc = await request<Record<string, unknown>>(
      `/admin/categories/${id}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(data),
      },
    );
    return mapCategory(doc);
  },

  async setCategoryCover(categoryId: string, photoId: string): Promise<void> {
    await request(`/admin/categories/${categoryId}/cover-photo`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ photoId }),
    });
  },

  async reorderCategories(categoryIds: string[]): Promise<void> {
    await request('/admin/categories/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: categoryIds }),
    });
  },
};
