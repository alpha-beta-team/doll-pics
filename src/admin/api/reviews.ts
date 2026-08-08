import type { Booking } from '../types';
import { request } from './http';
import { mapBooking } from './mappers';

export const reviewsApi = {
  getReviewConfig(signal?: AbortSignal): Promise<{ googleReviewUrl: string }> {
    return request('/admin/reviews/config', { auth: true, signal });
  },
  async updateBookingReview(id: string, action: 'requested' | 'received' | 'skipped' | 'reopened'): Promise<Booking> {
    const row = await request<Record<string, unknown>>(`/admin/bookings/${id}/review`, {
      method: 'PATCH', auth: true, body: JSON.stringify({ action }),
    });
    return mapBooking(row);
  },
};
