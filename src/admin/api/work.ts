import type { TodayWork } from '../types';
import { request } from './http';

export const workApi = {
  getTodayWork(date?: string): Promise<TodayWork> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<TodayWork>(`/admin/work/today${qs}`, { auth: true });
  },
};
