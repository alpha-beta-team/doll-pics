import type { OwnerOverviewReport } from '../types';
import { request } from './http';

export const reportsApi = {
  getOwnerOverview(dateFrom: string, dateTo: string, signal?: AbortSignal): Promise<OwnerOverviewReport> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return request(`/admin/reports/owner-overview?${params}`, { auth: true, signal });
  },
};
