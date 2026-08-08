export type WhatsAppTemplateId = 'enquiry_follow_up' | 'booking_confirmation' | 'shoot_reminder' | 'payment_reminder' | 'booking_rescheduled' | 'booking_cancelled' | 'birthday' | 'anniversary' | 'review_request' | 'wedding_quotation' | 'custom';

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
  occasionName?: string;
  reviewUrl?: string;
  quotationUrl?: string;
};

export const manualWhatsAppTemplates: Array<{ id: WhatsAppTemplateId; label: string }> = [
  { id: 'enquiry_follow_up', label: 'Enquiry follow-up' },
  { id: 'booking_confirmation', label: 'Booking confirmation' },
  { id: 'shoot_reminder', label: 'Shoot reminder' },
  { id: 'payment_reminder', label: 'Payment reminder' },
  { id: 'booking_rescheduled', label: 'Reschedule update' },
  { id: 'booking_cancelled', label: 'Cancellation' },
  { id: 'birthday', label: 'Birthday wish' },
  { id: 'anniversary', label: 'Anniversary wish' },
  { id: 'review_request', label: 'Review request' },
  { id: 'wedding_quotation', label: 'Wedding quotation' },
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
  if (id === 'booking_rescheduled') return `Hi ${name}, your photography booking has been rescheduled${bookingDetails ? ` to ${bookingDetails}` : ''}. Please confirm that the updated schedule works for you.`;
  if (id === 'booking_cancelled') return `Hi ${name}, your photography booking${bookingDetails ? ` for ${bookingDetails}` : ''} has been cancelled. Please contact Doll Pictures if you would like to arrange another date.`;
  if (id === 'birthday') return `Hi ${name}, warm birthday wishes${context.occasionName ? ` to ${context.occasionName}` : ''} from everyone at Doll Pictures! We hope the day is full of wonderful moments.`;
  if (id === 'anniversary') return `Hi ${name}, happy anniversary${context.occasionName ? ` to ${context.occasionName}` : ''} from Doll Pictures! Wishing you many more beautiful years together.`;
  if (id === 'review_request') return `Hi ${name}, thank you for choosing Doll Pictures${context.service ? ` for your ${context.service} shoot` : ''}. We’d be grateful if you shared your experience: ${context.reviewUrl || ''}`.trim();
  if (id === 'wedding_quotation') return `Hi ${name}, thank you for considering Doll Pictures for your wedding. Your personalized photography quotation is ready to view and download here: ${context.quotationUrl || ''}`.trim();
  const balance = context.balanceDue == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.balanceDue);
  const due = day(context.paymentDueDate);
  const paymentDetails = [balance && `balance ${balance}`, due && `due ${due}`].filter(Boolean).join(', ');
  return `Hi ${name}, this is a friendly payment reminder from Doll Pictures${paymentDetails ? ` for the ${paymentDetails}` : ''}. Please let us know once it is completed.`;
}
