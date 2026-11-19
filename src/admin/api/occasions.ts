import type { CustomerOccasion } from '../types';
import { normalizeId, request } from './http';

type OccasionInput = {
  type: 'birthday' | 'anniversary';
  occasionName: string;
  customerName: string;
  phone: string;
  email?: string;
  occasionDate: string;
  sourceType?: 'enquiry' | 'booking';
  sourceId?: string;
};

export function mapOccasion(raw: Record<string, unknown>): CustomerOccasion {
  const value = normalizeId(raw);
  return {
    ...value,
    id: value.id,
    type: value.type as CustomerOccasion['type'],
    occasionName: String(value.occasionName ?? ''),
    customerName: String(value.customerName ?? ''),
    phone: String(value.phone ?? ''),
    email: value.email ? String(value.email) : undefined,
    occasionDate: String(value.occasionDate ?? ''),
    nextOccurrenceDate: String(value.nextOccurrenceDate ?? ''),
    daysUntil: Number(value.daysUntil),
    active: value.active !== false,
    contactedForOccurrence: value.contactedForOccurrence === true,
    consentRecorded: value.consentRecorded === true,
    optedOut: value.optedOut === true,
  } as CustomerOccasion;
}

async function occasionRequest(path: string, options?: RequestInit) {
  return mapOccasion(await request<Record<string, unknown>>(path, { ...options, auth: true }));
}

export const occasionsApi = {
  async getOccasions(phone: string, includeInactive = false, signal?: AbortSignal) {
    const params = new URLSearchParams({ phone });
    if (includeInactive) params.set('includeInactive', 'true');
    const rows = await request<Record<string, unknown>[]>(`/admin/occasions?${params}`, { auth: true, signal });
    return rows.map(mapOccasion);
  },
  createOccasion(data: OccasionInput) { return occasionRequest('/admin/occasions', { method: 'POST', body: JSON.stringify(data) }); },
  updateOccasion(id: string, data: Partial<OccasionInput> & { active?: boolean }) {
    return occasionRequest(`/admin/occasions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
};
