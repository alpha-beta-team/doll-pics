import type { CustomerLookupResponse } from '../types';
import { request } from './http';

export const customerLookupApi = {
  lookupCustomer(phone: string, signal?: AbortSignal): Promise<CustomerLookupResponse> {
    const params = new URLSearchParams({ phone: phone.trim() });
    return request<CustomerLookupResponse>(`/admin/customer-lookup?${params}`, {
      auth: true,
      signal,
    });
  },
};
