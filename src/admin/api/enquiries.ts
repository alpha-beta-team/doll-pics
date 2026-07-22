import type { Enquiry } from '../types';
import { request } from './http';
import { mapEnquiry } from './mappers';

export const enquiriesApi = {
  async getEnquiries(filters?: {
    status?: 'new' | 'read' | 'responded';
  }): Promise<Enquiry[]> {
    const qs = filters?.status ? `?status=${filters.status}` : '';
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
