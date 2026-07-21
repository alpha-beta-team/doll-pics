import { request } from './http';

/** Shared get/create/update/delete/reorder for ordered CMS resources. */
export function orderedCrud<T>(
  resource: string,
  mapper: (doc: Record<string, unknown>) => T,
) {
  return {
    getAll: async (): Promise<T[]> => {
      const docs = await request<Record<string, unknown>[]>(`/admin/${resource}`, {
        auth: true,
      });
      return docs
        .map(mapper)
        .sort(
          (a, b) => (a as { order: number }).order - (b as { order: number }).order,
        );
    },
    create: async (data: Record<string, unknown>): Promise<T> => {
      const doc = await request<Record<string, unknown>>(`/admin/${resource}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(data),
      });
      return mapper(doc);
    },
    update: async (id: string, data: Record<string, unknown>): Promise<T> => {
      const doc = await request<Record<string, unknown>>(
        `/admin/${resource}/${id}`,
        {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify(data),
        },
      );
      return mapper(doc);
    },
    delete: async (id: string): Promise<void> => {
      await request(`/admin/${resource}/${id}`, {
        method: 'DELETE',
        auth: true,
      });
    },
    reorder: async (ids: string[]): Promise<void> => {
      await request(`/admin/${resource}/reorder`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ ids }),
      });
    },
  };
}
