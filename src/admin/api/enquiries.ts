import type {
  AdminEnquiryWritePayload,
  Booking,
  ConvertEnquiryPayload,
  Enquiry,
  EnquiryStage,
} from '../types';
import { request } from './http';
import { mapBooking, mapEnquiry } from './mappers';

export const enquiriesApi = {
  async getEnquiryListRows(filters?: { inbox?: boolean }): Promise<Enquiry[]> {
    const params = new URLSearchParams();
    if (filters?.inbox) params.set('inbox', 'true');
    const qs = params.size ? `?${params}` : '';
    const docs = await request<Record<string, unknown>[]>(
      `/admin/lists/enquiries${qs}`,
      { auth: true },
    );
    return docs.map(mapEnquiry);
  },

  async getEnquiries(filters?: {
    status?: 'new' | 'read' | 'responded';
    stage?: EnquiryStage;
    inbox?: boolean;
  }): Promise<Enquiry[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.inbox) params.set('inbox', 'true');
    const qs = params.size ? `?${params}` : '';
    const docs = await request<Record<string, unknown>[]>(
      `/admin/enquiries${qs}`,
      { auth: true },
    );
    return docs
      .map(mapEnquiry)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  async createAdminEnquiry(data: AdminEnquiryWritePayload): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>('/admin/enquiries', {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
    return mapEnquiry(doc);
  },

  async updateEnquiry(id: string, data: Partial<AdminEnquiryWritePayload>): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}`, {
      method: 'PATCH', auth: true, body: JSON.stringify(data),
    });
    return mapEnquiry(doc);
  },

  async updateEnquiryStage(id: string, stage: EnquiryStage): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}/stage`, {
      method: 'PATCH', auth: true, body: JSON.stringify({ stage }),
    });
    return mapEnquiry(doc);
  },

  async scheduleEnquiryFollowUp(id: string, scheduledAt: string, note?: string): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}/follow-up`, {
      method: 'PATCH', auth: true, body: JSON.stringify({ scheduledAt, note }),
    });
    return mapEnquiry(doc);
  },

  async completeEnquiryFollowUp(id: string): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}/follow-up/complete`, {
      method: 'POST', auth: true,
    });
    return mapEnquiry(doc);
  },

  async convertEnquiry(id: string, data: ConvertEnquiryPayload): Promise<Booking> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}/convert`, {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
    return mapBooking(doc);
  },

  async getEnquiry(id: string): Promise<Enquiry | null> {
    const doc = await request<Record<string, unknown>>(
      `/admin/enquiries/${id}`,
      { auth: true },
    );
    return mapEnquiry(doc);
  },

  async updateEnquiryStatus(
    id: string,
    status: 'new' | 'read' | 'responded',
  ): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(
      `/admin/enquiries/${id}/status`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      },
    );
    return mapEnquiry(doc);
  },
};
