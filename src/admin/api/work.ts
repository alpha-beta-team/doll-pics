import type { TodayWork, TodayWorkspace } from '../types';
import { request } from './http';

export const workApi = {
  getTodayWorkspace(date?: string, signal?: AbortSignal): Promise<TodayWorkspace> {
    const query = new URLSearchParams({ view: 'workspace' });
    if (date) query.set('date', date);
    return request<TodayWorkspace>(`/admin/work/today?${query}`, { auth: true, signal, timeoutMs: 15_000 });
  },
  getTodayWork(date?: string): Promise<TodayWork> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<TodayWork>(`/admin/work/today${qs}`, { auth: true });
  },
};
