import { request } from './http';
import type { Package } from '../types';
import { mapPackage } from './mappers';
import type { Sale, SaleDetail, SaleInput, SaleReport } from '../../shared/types/sales';
export const salesApi = {
  getSale: (id: string) => request<SaleDetail>(`/admin/sales/${encodeURIComponent(id)}`, { auth: true }),
  getSales: () => request<Sale[]>('/admin/sales', { auth: true }),
  createSale: (data: SaleInput) => request<Sale>('/admin/sales', { auth: true, method: 'POST', body: JSON.stringify(data) }),
  updateSale: (id: string, data: SaleInput) => request<Sale>(`/admin/sales/${id}`, { auth: true, method: 'PATCH', body: JSON.stringify(data) }),
  saleAction: (id: string, action: 'publish' | 'pause' | 'archive') => request(`/admin/sales/${id}/${action}`, { auth: true, method: 'POST' }),
  previewSale: (id: string) => request<{ allocations: { packageName: string; basePrice: number; discountAmount: number; salePrice: number }[]; overlaps: { name: string }[] }>(`/admin/sales/${id}/preview`, { auth: true, method: 'POST' }),
  getPricingPreview: async (id: string): Promise<Package> => mapPackage(await request<Record<string, unknown>>(`/admin/packages/${id}/pricing-preview`, { auth: true })),
  getSalesReport: (dateFrom: string, dateTo: string, campaignId?: string, filters: { packageId?: string; location?: string } = {}) => request<SaleReport>(`/admin/reports/sales?${new URLSearchParams({ dateFrom, dateTo, ...filters, ...(campaignId ? { campaignId } : {}) })}`, { auth: true }),
  getSaleBookings: (id: string, dateFrom: string, dateTo: string, page: number, filters: { packageId?: string; location?: string } = {}) => request<{ items: { _id: string; customerName: string; packageName: string; location: string; agreedTotal: number | null; status: string }[]; total: number }>(`/admin/reports/sales/${id}/bookings?${new URLSearchParams({ dateFrom, dateTo, page: String(page), ...filters })}`, { auth: true }),
};
