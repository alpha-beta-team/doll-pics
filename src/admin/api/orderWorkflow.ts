import type { TrackingFilters, TrackingResult } from '../components/postShootTracking';
import { request } from './http';
import type { OrderInput, OrderWorkflow } from '../../shared/orderWorkflow';
type Response = { orderWorkflow: OrderWorkflow | null };
export const orderWorkflowApi = {
  list: (filters: TrackingFilters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
    return request<TrackingResult>(`/admin/bookings/order-tracking?${query.toString()}`, { auth: true, cache: 'no-store' });
  },
  get: (id: string) => request<Response>(`/admin/bookings/${id}/order-workflow`, { auth: true }),
  update: (id: string, input: OrderInput) => request<Response>(`/admin/bookings/${id}/order-workflow`, { method: 'PATCH', auth: true, body: JSON.stringify(input) }),
};
