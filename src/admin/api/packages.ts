import type { Package, PackageCategory } from '../types';
import { request } from './http';
import { mapPackage, mapPackageCategory } from './mappers';

async function getPackages(): Promise<Package[]> {
  const docs = await request<Record<string, unknown>[]>('/admin/packages', {
    auth: true,
  });
  return docs.map(mapPackage).sort((a, b) => a.order - b.order);
}

export const packagesApi = {
  getPackages,

  async getPackage(id: string): Promise<Package | null> {
    const packages = await getPackages();
    return packages.find((p) => p.id === id) ?? null;
  },

  async createPackage(data: Omit<Package, 'id'>): Promise<Package> {
    const doc = await request<Record<string, unknown>>('/admin/packages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapPackage(doc);
  },

  async updatePackage(id: string, data: Partial<Package>): Promise<Package> {
    const doc = await request<Record<string, unknown>>(`/admin/packages/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapPackage(doc);
  },

  async deletePackage(id: string): Promise<void> {
    await request(`/admin/packages/${id}`, { method: 'DELETE', auth: true });
  },

  async reorderPackages(packageIds: string[]): Promise<void> {
    await request('/admin/packages/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: packageIds }),
    });
  },

  async getPackageCategories(): Promise<PackageCategory[]> {
    const docs = await request<Record<string, unknown>[]>(
      '/admin/package-categories',
      { auth: true },
    );
    return docs.map(mapPackageCategory).sort((a, b) => a.order - b.order);
  },

  async createPackageCategory(
    data: Omit<PackageCategory, 'id'>,
  ): Promise<PackageCategory> {
    const doc = await request<Record<string, unknown>>(
      '/admin/package-categories',
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify(data),
      },
    );
    return mapPackageCategory(doc);
  },

  async updatePackageCategory(
    id: string,
    data: Partial<PackageCategory>,
  ): Promise<PackageCategory> {
    const doc = await request<Record<string, unknown>>(
      `/admin/package-categories/${id}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(data),
      },
    );
    return mapPackageCategory(doc);
  },

  async deletePackageCategory(id: string): Promise<void> {
    await request(`/admin/package-categories/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async reorderPackageCategories(categoryIds: string[]): Promise<void> {
    await request('/admin/package-categories/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: categoryIds }),
    });
  },
};
