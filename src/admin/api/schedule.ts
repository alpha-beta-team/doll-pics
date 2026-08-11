import type {
  ScheduleBookingItem,
  ScheduleConflictResponse,
  ScheduleResponse,
} from '../types';
import { request } from './http';

function mapItem(value: Record<string, unknown>): ScheduleBookingItem {
  return {
    id: String(value.id ?? value._id ?? ''),
    customerName: String(value.customerName ?? ''),
    customerPhone: String(value.customerPhone ?? ''),
    service: String(value.service ?? ''),
    bookingDate: String(value.bookingDate ?? ''),
    startTime: String(value.startTime ?? ''),
    endTime: String(value.endTime ?? ''),
    status: value.status as ScheduleBookingItem['status'],
    location: String(value.location ?? ''),
    assignedStaffAccountName: String(value.assignedStaffAccountName ?? ''),
    whatsappOptIn: value.whatsappOptIn === true,
    whatsappOptOutAt: value.whatsappOptOutAt ? String(value.whatsappOptOutAt) : undefined,
  };
}

export const scheduleApi = {
  async getSchedule(
    dateFrom: string,
    dateTo: string,
    includeCancelled = false,
    signal?: AbortSignal,
  ): Promise<ScheduleResponse> {
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      includeCancelled: String(includeCancelled),
    });
    const response = await request<Omit<ScheduleResponse, 'bookings'> & {
      bookings: Record<string, unknown>[];
    }>(`/admin/schedule?${params}`, { auth: true, signal });
    return { ...response, bookings: response.bookings.map(mapItem) };
  },

  async checkScheduleConflicts(
    input: {
      bookingDate: string;
      startTime: string;
      endTime: string;
      excludeBookingId?: string;
    },
    signal?: AbortSignal,
  ): Promise<ScheduleConflictResponse> {
    const response = await request<Omit<ScheduleConflictResponse, 'timedConflicts' | 'untimedConflicts'> & {
      timedConflicts: Record<string, unknown>[];
      untimedConflicts: Record<string, unknown>[];
    }>('/admin/schedule/conflicts', {
      method: 'POST', auth: true, signal, body: JSON.stringify(input),
    });
    return {
      ...response,
      timedConflicts: response.timedConflicts.map(mapItem),
      untimedConflicts: response.untimedConflicts.map(mapItem),
    };
  },
};
