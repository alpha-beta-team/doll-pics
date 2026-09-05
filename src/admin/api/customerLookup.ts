import type { CustomerLookupResponse } from '../types';
import { request } from './http';

export const customerLookupApi = {
  lookupCustomer(phone: string, signal?: AbortSignal, forBooking = false): Promise<CustomerLookupResponse> {
    const params = new URLSearchParams({ phone: phone.trim() });
    if (forBooking) params.set('purpose', 'booking_creation');
    return request<CustomerLookupResponse>(`/admin/customer-lookup?${params}`, {
      auth: true,
      signal,
    });
  },
};
