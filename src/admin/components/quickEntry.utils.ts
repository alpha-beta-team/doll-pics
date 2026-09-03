import type {
  AdminEnquiryWritePayload,
  BookingWritePayload,
  Enquiry,
  EnquirySource,
  PaymentMethod,
} from '../types';
import { kolkataLocalToIso } from './followUp.utils';

export type EnquiryFormValues = {
  name: string;
  phone: string;
  source: EnquirySource;
  shootType: string;
  nextFollowUpAt: string;
  followUpNote: string;
  email: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  whatsappOptIn: boolean;
  whatsappNotificationsEnabled: boolean;
};

export type QuickConversionValues = {
  bookingDate: string;
  startTime: string;
  endTime: string;
  shootType: string;
  preferredEvent: string;
  location: string;
  packageId: string;
  agreedTotal: string;
  assignedStaffAccountId: string;
  advanceAmount: string;
  advanceMethod: PaymentMethod;
  paymentDueDate: string;
  notes: string;
};

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function phoneNumberError(value: string): string | null {
  const digits = phoneDigits(value);
  const valid = digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  return valid && value.trim().length <= 20
    ? null
    : 'Enter a 10-digit Indian phone number; +91, spaces and hyphens are accepted.';
}

export function localDateValue(daysFromToday: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateTimeValue(
  daysFromToday: number,
  hour: number,
  minute = 0,
  now = new Date(),
): string {
  const date = new Date(now);
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function hasRestorableEnquiryDraft(draft: Partial<AdminEnquiryWritePayload> | null): boolean {
  if (!draft) return false;
  return Boolean(
    draft.name || draft.phone || draft.shootType || draft.nextFollowUpAt || draft.followUpNote ||
    draft.email || draft.bookingDate || draft.startTime || draft.endTime || draft.location ||
    draft.notes || draft.whatsappOptIn || draft.whatsappNotificationsEnabled ||
    (draft.source && draft.source !== 'phone'),
  );
}

export function buildEnquiryPayload(
  values: EnquiryFormValues,
  editing: boolean,
): AdminEnquiryWritePayload {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    source: values.source,
    shootType: values.shootType || undefined,
    nextFollowUpAt: values.nextFollowUpAt
      ? kolkataLocalToIso(values.nextFollowUpAt)
      : undefined,
    followUpNote: values.nextFollowUpAt ? values.followUpNote.trim() || undefined : undefined,
    email: values.email.trim() || undefined,
    bookingDate: editing ? values.bookingDate : values.bookingDate || undefined,
    startTime: editing ? values.startTime : values.startTime || undefined,
    endTime: editing ? values.endTime : values.endTime || undefined,
    location: values.location.trim() || undefined,
    notes: values.notes.trim() || undefined,
    whatsappOptIn: values.whatsappOptIn,
    whatsappNotificationsEnabled:
      values.whatsappOptIn && values.whatsappNotificationsEnabled,
    preferredLanguage: 'en',
  };
}

export function buildQuickConversionPayload(
  enquiry: Enquiry,
  values: QuickConversionValues,
): BookingWritePayload {
  const advance = Number(values.advanceAmount);
  return {
    customerName: enquiry.name.trim(),
    customerPhone: enquiry.phone.trim(),
    customerEmail: enquiry.email.trim() || undefined,
    bookingDate: values.bookingDate,
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    shootType: values.shootType || undefined,
    preferredEvent: values.preferredEvent.trim() || undefined,
    location: values.location.trim() || undefined,
    packageId: values.packageId || undefined,
    agreedTotal: values.agreedTotal === '' ? undefined : Number(values.agreedTotal),
    assignedStaffAccountId: values.assignedStaffAccountId || undefined,
    advanceAmount: Number.isFinite(advance) && advance > 0 ? advance : undefined,
    advanceMethod:
      Number.isFinite(advance) && advance > 0 ? values.advanceMethod : undefined,
    paymentDueDate: values.paymentDueDate || undefined,
    notes: values.notes.trim() || undefined,
    enquiryId: enquiry.id,
    preferredLanguage: 'en',
  };
}
