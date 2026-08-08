import type {
  PublicWeddingQuotation, QuotationAssets, QuotationDraft, QuotationSettings, WeddingQuotation,
  WeddingQuotationStatus,
} from '../types';
import { normalizeId, request } from './http';

function mapQuotation(raw: Record<string, unknown>): WeddingQuotation {
  return normalizeId(raw) as unknown as WeddingQuotation;
}

async function quotationRequest(path: string, options?: RequestInit) {
  return mapQuotation(await request<Record<string, unknown>>(path, { ...options, auth: true }));
}

export const quotationsApi = {
  async getQuotations(filters?: { enquiryId?: string; status?: WeddingQuotationStatus; q?: string }, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (filters?.enquiryId) params.set('enquiryId', filters.enquiryId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.q) params.set('q', filters.q);
    const rows = await request<Record<string, unknown>[]>(`/admin/quotations${params.size ? `?${params}` : ''}`, { auth: true, signal });
    return rows.map(mapQuotation);
  },
  getQuotation(id: string, signal?: AbortSignal) {
    return quotationRequest(`/admin/quotations/${id}`, { signal });
  },
  createQuotation(enquiryId: string, signal?: AbortSignal) {
    return quotationRequest('/admin/quotations', { method: 'POST', body: JSON.stringify({ enquiryId }), signal });
  },
  updateQuotation(id: string, draft: QuotationDraft, signal?: AbortSignal) {
    return quotationRequest(`/admin/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ draft }), signal });
  },
  publishQuotation(id: string, signal?: AbortSignal) {
    return quotationRequest(`/admin/quotations/${id}/publish`, { method: 'POST', signal });
  },
  archiveQuotation(id: string, signal?: AbortSignal) {
    return quotationRequest(`/admin/quotations/${id}/archive`, { method: 'POST', signal });
  },
  getQuotationAssets(signal?: AbortSignal): Promise<QuotationAssets> {
    return request('/admin/quotations/assets', { auth: true, signal });
  },
  getQuotationSettings(signal?: AbortSignal): Promise<QuotationSettings> {
    return request('/admin/quotation-settings', { auth: true, signal });
  },
  updateQuotationSettings(settings: QuotationSettings, signal?: AbortSignal): Promise<QuotationSettings> {
    return request('/admin/quotation-settings', { method: 'PUT', auth: true, body: JSON.stringify({ settings }), signal });
  },
  getPublicQuotation(token: string, signal?: AbortSignal): Promise<PublicWeddingQuotation> {
    return request(`/quotations/${encodeURIComponent(token)}`, { signal });
  },
  trackQuotationView(token: string, signal?: AbortSignal): Promise<{ recorded: true }> {
    return request(`/quotations/${encodeURIComponent(token)}/viewed`, { method: 'POST', signal });
  },
  trackQuotationDownload(token: string, signal?: AbortSignal): Promise<{ recorded: true }> {
    return request(`/quotations/${encodeURIComponent(token)}/downloaded`, { method: 'POST', signal });
  },
};
