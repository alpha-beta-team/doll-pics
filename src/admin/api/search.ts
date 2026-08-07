import type { AdminSearchResponse } from '../types';
import { request } from './http';

export const searchApi = {
  searchAdmin(query: string, signal?: AbortSignal): Promise<AdminSearchResponse> {
    const params = new URLSearchParams({ q: query.trim() });
    return request<AdminSearchResponse>(`/admin/search?${params}`, {
      auth: true,
      signal,
    });
  },
};
