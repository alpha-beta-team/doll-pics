import type { OwnerOverviewReport, WeeklyOwnerReport } from '../types';
import { request } from './http';

export const reportsApi = {
  getWeeklyOwnerReport(weekStart?: string): Promise<WeeklyOwnerReport> {
    const qs = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
    return request(`/admin/reports/weekly${qs}`, { auth: true });
  },
  getOwnerOverview(dateFrom: string, dateTo: string, signal?: AbortSignal): Promise<OwnerOverviewReport> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return request(`/admin/reports/owner-overview?${params}`, { auth: true, signal });
  },
};
