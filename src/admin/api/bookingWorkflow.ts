import { request } from './http';
import { mapBooking } from './mappers';
export const bookingWorkflowApi = {
  milestone: async (id: string, key: string, done: boolean) => mapBooking(await request<Record<string, unknown>>(`/admin/bookings/${id}/milestones/${encodeURIComponent(key)}`, { method: 'PATCH', auth: true, body: JSON.stringify({ done }) })),
  advance: async (id: string) => mapBooking(await request<Record<string, unknown>>(`/admin/bookings/${id}/workflow/advance`, { method: 'POST', auth: true })),
};
