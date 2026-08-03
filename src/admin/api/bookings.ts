import type {
  Booking,
  BookingStatus,
  BookingWritePayload,
  PaymentMethod,
  WhatsAppMessageSummary,
} from '../types';
import { request, normalizeId } from './http';
import { mapBooking } from './mappers';

export type PaymentInput = {
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
};

function mapWhatsAppMessage(doc: Record<string, unknown>): WhatsAppMessageSummary {
  const normalized = normalizeId(doc);
  return {
    id: normalized.id,
    eventType: String(doc.eventType ?? ''),
    templateName: String(doc.templateName ?? ''),
    templateLanguage: String(doc.templateLanguage ?? 'en'),
    redactedRecipient: String(doc.redactedRecipient ?? ''),
    scheduledAt: String(doc.scheduledAt ?? ''),
    status: doc.status as WhatsAppMessageSummary['status'],
    attemptCount: Number(doc.attemptCount) || 0,
    failureCode: doc.failureCode ? String(doc.failureCode) : undefined,
    failureReason: doc.failureReason ? String(doc.failureReason) : undefined,
    sentAt: doc.sentAt ? String(doc.sentAt) : undefined,
    deliveredAt: doc.deliveredAt ? String(doc.deliveredAt) : undefined,
    readAt: doc.readAt ? String(doc.readAt) : undefined,
    createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
  };
}

async function bookingRequest(path: string, options?: RequestInit & { auth?: boolean }) {
  const doc = await request<Record<string, unknown>>(path, options);
  return mapBooking(doc);
}

export const bookingsApi = {
  async getBookings(filters?: {
    status?: BookingStatus;
    dateFrom?: string;
    dateTo?: string;
    outstanding?: boolean;
    paymentDueBefore?: string;
    followUpDueBefore?: string;
  }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.outstanding) params.set('outstanding', 'true');
    if (filters?.paymentDueBefore) params.set('paymentDueBefore', filters.paymentDueBefore);
    if (filters?.followUpDueBefore) params.set('followUpDueBefore', filters.followUpDueBefore);
    const qs = params.size ? `?${params}` : '';
    const docs = await request<Record<string, unknown>[]>(`/admin/bookings${qs}`, { auth: true });
    return docs.map(mapBooking).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getBooking(id: string): Promise<Booking | null> {
    return bookingRequest(`/admin/bookings/${id}`, { auth: true });
  },

  createBooking(data: BookingWritePayload): Promise<Booking> {
    return bookingRequest('/admin/bookings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    });
  },

  updateBooking(id: string, data: Partial<BookingWritePayload>): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    });
  },

  transitionBooking(id: string, status: BookingStatus): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    });
  },

  confirmBooking(id: string): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/confirm`, { method: 'PATCH', auth: true });
  },

  addBookingPayment(id: string, data: PaymentInput): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/payments`, {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
  },

  updateBookingPayment(id: string, paymentId: string, data: PaymentInput): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/payments/${paymentId}`, {
      method: 'PATCH', auth: true, body: JSON.stringify(data),
    });
  },

  removeBookingPayment(id: string, paymentId: string): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/payments/${paymentId}`, {
      method: 'DELETE', auth: true,
    });
  },

  scheduleBookingFollowUp(id: string, scheduledAt: string, note?: string): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/follow-up`, {
      method: 'PATCH', auth: true, body: JSON.stringify({ scheduledAt, note }),
    });
  },

  completeBookingFollowUp(id: string): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/follow-up/complete`, {
      method: 'POST', auth: true,
    });
  },

  completeBookingDelivery(id: string): Promise<Booking> {
    return bookingRequest(`/admin/bookings/${id}/delivery/complete`, {
      method: 'POST', auth: true,
    });
  },

  async getBookingWhatsAppMessages(id: string): Promise<WhatsAppMessageSummary[]> {
    const docs = await request<Record<string, unknown>[]>(
      `/admin/bookings/${id}/whatsapp-messages`,
      { auth: true },
    );
    return docs.map(mapWhatsAppMessage);
  },

  async retryBookingWhatsAppMessage(id: string, messageId: string): Promise<void> {
    await request(`/admin/bookings/${id}/whatsapp-messages/${messageId}/retry`, {
      method: 'POST', auth: true, body: JSON.stringify({ confirmed: true }),
    });
  },
};
