import type { OwnerQueue, OwnerQueuePage } from '../reports/ownerDashboard';
import type { OwnerOverviewReport } from '../types';
import { request } from './http';

export const reportsApi = {
  getOwnerQueue(kind: OwnerQueue, dateFrom: string, dateTo: string, page = 1, signal?: AbortSignal): Promise<OwnerQueuePage> {
    const params = new URLSearchParams({ kind, dateFrom, dateTo, page: String(page) });
    return request(`/admin/reports/owner-overview/records?${params}`, { auth: true, signal });
  },
  getOwnerOverview(dateFrom: string, dateTo: string, signal?: AbortSignal, options?: { dashboard?: boolean; comparisonMode?: 'preceding' | 'previous_month' }): Promise<OwnerOverviewReport> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    if (options?.dashboard) params.set('dashboard', 'true');
    if (options?.comparisonMode) params.set('comparisonMode', options.comparisonMode);
    return request(`/admin/reports/owner-overview?${params}`, { auth: true, signal });
  },
};
