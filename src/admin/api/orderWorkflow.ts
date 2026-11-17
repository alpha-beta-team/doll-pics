import { request } from './http';
import type { OrderInput, OrderWorkflow } from '../../shared/orderWorkflow';
type Response = { orderWorkflow: OrderWorkflow | null };
export const orderWorkflowApi = {
  get: (id: string) => request<Response>(`/admin/bookings/${id}/order-workflow`, { auth: true }),
  update: (id: string, input: OrderInput) => request<Response>(`/admin/bookings/${id}/order-workflow`, { method: 'PATCH', auth: true, body: JSON.stringify(input) }),
};
