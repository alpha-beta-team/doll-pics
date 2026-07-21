import type { Booking, BookingStatus } from '../types';
import { request } from './http';
import { mapBooking } from './mappers';

export const bookingsApi = {
  async getBookings(filters?: { status?: BookingStatus }): Promise<Booking[]> {
    const qs = filters?.status ? `?status=${filters.status}` : '';
    const docs = await request<Record<string, unknown>[]>(
      `/admin/bookings${qs}`,
      { auth: true },
    );
    return docs
      .map(mapBooking)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  async getBooking(id: string): Promise<Booking | null> {
    const doc = await request<Record<string, unknown>>(`/admin/bookings/${id}`, {
      auth: true,
    });
    return mapBooking(doc);
  },

  async createBooking(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    preferredEvent?: string;
    shootDate?: string;
    location?: string;
    reminderDate?: string;
    notes?: string;
    driveGalleryUrl?: string;
    driveEditedUrl?: string;
    driveRawsUrl?: string;
    driveNotes?: string;
    enquiryId?: string;
  }): Promise<Booking> {
    const doc = await request<Record<string, unknown>>('/admin/bookings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapBooking(doc);
  },

  async updateBooking(
    id: string,
    data: Partial<{
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      shootType: string;
      preferredEvent: string;
      shootDate: string;
      location: string;
      reminderDate: string;
      notes: string;
      driveGalleryUrl: string;
      driveEditedUrl: string;
      driveRawsUrl: string;
      driveNotes: string;
      status: BookingStatus;
      enquiryId: string;
    }>,
  ): Promise<Booking> {
    const doc = await request<Record<string, unknown>>(
      `/admin/bookings/${id}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(data),
      },
    );
    return mapBooking(doc);
  },

  async confirmBooking(id: string): Promise<Booking> {
    const doc = await request<Record<string, unknown>>(
      `/admin/bookings/${id}/confirm`,
      {
        method: 'PATCH',
        auth: true,
      },
    );
    return mapBooking(doc);
  },
};
