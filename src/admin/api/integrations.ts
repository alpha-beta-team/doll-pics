import type { GoogleCalendarIntegrationStatus, WeeklyOwnerReport } from '../types';
import { request } from './http';
import { mapBooking } from './mappers';

export const integrationsApi = {
  getGoogleCalendarStatus(): Promise<GoogleCalendarIntegrationStatus> {
    return request('/admin/integrations/google-calendar', { auth: true });
  },

  testGoogleCalendar(): Promise<{ connected: true; message: string }> {
    return request('/admin/integrations/google-calendar/test', { method: 'POST', auth: true });
  },

  async retryBookingCalendarSync(id: string) {
    const doc = await request<Record<string, unknown>>(`/admin/bookings/${id}/calendar-sync/retry`, {
      method: 'POST', auth: true,
    });
    return mapBooking(doc);
  },

  getWeeklyOwnerReport(weekStart?: string): Promise<WeeklyOwnerReport> {
    const qs = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
    return request(`/admin/reports/weekly${qs}`, { auth: true });
  },
};
