import type { FinanceReport } from '../types';
import { request } from './http';

export const reportsApi = {
  getFinanceReport(dateFrom: string, dateTo: string, signal?: AbortSignal): Promise<FinanceReport> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return request(`/admin/reports/finance?${params}`, { auth: true, signal });
  },
};
