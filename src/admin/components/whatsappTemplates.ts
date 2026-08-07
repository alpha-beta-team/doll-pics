export type WhatsAppTemplateId = 'enquiry_follow_up' | 'booking_confirmation' | 'shoot_reminder' | 'payment_reminder' | 'custom';

export type ManualWhatsAppContext = {
  customerName: string;
  phone: string;
  service?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  balanceDue?: number | null;
  paymentDueDate?: string;
  optedOut?: boolean;
  consentRecorded?: boolean;
};

export const manualWhatsAppTemplates: Array<{ id: WhatsAppTemplateId; label: string }> = [
  { id: 'enquiry_follow_up', label: 'Enquiry follow-up' },
  { id: 'booking_confirmation', label: 'Booking confirmation' },
  { id: 'shoot_reminder', label: 'Shoot reminder' },
  { id: 'payment_reminder', label: 'Payment reminder' },
  { id: 'custom', label: 'Blank / custom' },
];

function day(value?: string) {
  if (!value) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+05:30` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

function timeWindow(start?: string, end?: string) {
  if (!start) return '';
  const format = (value: string) => new Date(`2000-01-01T${value}:00+05:30`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  return end ? `${format(start)}–${format(end)}` : format(start);
}

function details(context: ManualWhatsAppContext) {
  return [
    context.service,
    day(context.bookingDate),
    timeWindow(context.startTime, context.endTime),
    context.location,
  ].filter(Boolean).join(' · ');
}

export function manualWhatsAppMessage(id: WhatsAppTemplateId, context: ManualWhatsAppContext): string {
  const name = context.customerName.trim() || 'there';
  const bookingDetails = details(context);
  if (id === 'custom') return '';
  if (id === 'enquiry_follow_up') return `Hi ${name}, this is Doll Pictures. I’m following up about your${context.service ? ` ${context.service}` : ''} enquiry. How can I help?`;
  if (id === 'booking_confirmation') return `Hi ${name}, your photography booking is confirmed${bookingDetails ? `: ${bookingDetails}` : ''}. Please let us know if you have any questions.`;
  if (id === 'shoot_reminder') return `Hi ${name}, a quick reminder about your upcoming photography session${bookingDetails ? `: ${bookingDetails}` : ''}. We look forward to seeing you!`;
  const balance = context.balanceDue == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.balanceDue);
  const due = day(context.paymentDueDate);
  const paymentDetails = [balance && `balance ${balance}`, due && `due ${due}`].filter(Boolean).join(', ');
  return `Hi ${name}, this is a friendly payment reminder from Doll Pictures${paymentDetails ? ` for the ${paymentDetails}` : ''}. Please let us know once it is completed.`;
}
