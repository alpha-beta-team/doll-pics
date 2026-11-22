import type { Booking } from '../../types';
import { manualWhatsAppMessage, type WhatsAppTemplateId } from '../whatsappTemplates';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { ORDER_STAGE_LABELS, type OrderWorkflow } from '../../../shared/orderWorkflow';

export type BookingWhatsAppTemplateId = WhatsAppTemplateId | 'payment_receipt' | 'photos_selection' | 'edited_photos' | 'prints_ready' | 'courier_tracking';
export const bookingMessageGroups: Array<{ label: string; templates: Array<[BookingWhatsAppTemplateId, string]> }> = [
  { label: 'Booking', templates: [['booking_confirmation', 'Booking confirmation'], ['shoot_reminder', 'Shoot reminder'], ['booking_rescheduled', 'Reschedule update'], ['booking_cancelled', 'Cancellation']] },
  { label: 'Payment', templates: [['payment_reminder', 'Payment reminder'], ['payment_receipt', 'Payment receipt']] },
  { label: 'Post-shoot', templates: [['photos_selection', 'Photos ready for selection'], ['edited_photos', 'Edited photos ready'], ['prints_ready', 'Prints ready to collect'], ['courier_tracking', 'Courier tracking']] },
  { label: 'Relationship', templates: [['birthday', 'Birthday wish'], ['anniversary', 'Anniversary wish'], ['review_request', 'Review request']] },
  { label: 'Other', templates: [['enquiry_follow_up', 'Enquiry follow-up'], ['custom', 'Blank / custom']] },
];
export const bookingMessageLabel = (id: BookingWhatsAppTemplateId) => bookingMessageGroups.flatMap(group => group.templates).find(([key]) => key === id)![1];
export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
export function bookingMessageSuggestions(booking: Booking, order: OrderWorkflow | null, canViewPayments: boolean): Array<{ id: BookingWhatsAppTemplateId; reason: string }> {
  const stage = order?.stage;
  const primary: BookingWhatsAppTemplateId = booking.status === 'cancelled' ? 'booking_cancelled' : stage === 'shipped' ? 'courier_tracking' : ['received', 'ready_dispatch'].includes(stage || '') ? 'prints_ready' : ['editing', 'photos_delivered', 'edited_selected', 'printing'].includes(stage || '') ? 'edited_photos' : stage === 'awaiting_selection' || booking.status === 'shoot_completed' ? 'photos_selection' : booking.status === 'delivered' ? 'review_request' : 'booking_confirmation';
  const suggestions: Array<{ id: BookingWhatsAppTemplateId; reason: string }> = [{ id: primary, reason: stage ? ORDER_STAGE_LABELS[stage] : booking.status === 'cancelled' ? 'Booking cancelled' : 'For this booking' }];
  if (canViewPayments && (booking.paymentSummary.balanceDue ?? 0) > 0) suggestions.push({ id: 'payment_reminder', reason: `${money(booking.paymentSummary.balanceDue!)} balance due` });
  if (booking.driveGalleryUrl && primary !== 'photos_selection') suggestions.push({ id: 'photos_selection', reason: 'Resend selection link' });
  return suggestions.slice(0, 3);
}
export function bookingMessageDraft(id: BookingWhatsAppTemplateId, booking: Booking, order: OrderWorkflow | null, reviewUrl: string, canViewPayments: boolean, noDate: boolean) {
  const context = { customerName: booking.customerName, customerCode: booking.customerCode, phone: booking.customerPhone, service: booking.shootType || booking.packageName, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime, location: booking.location, balanceDue: canViewPayments ? booking.paymentSummary.balanceDue : undefined, paymentDueDate: canViewPayments ? booking.paymentDueDate : undefined, reviewUrl };
  const name = formatCustomerName(booking.customerName) || 'there';
  let fields: Array<{ label: string; type?: string; value?: string }> = [];
  let body: string;
  if (id === 'booking_rescheduled') {
    body = noDate ? `Hi ${name}, we need to move your ${context.service || 'photography'} shoot. Please reply with a few dates and times that suit you, and we’ll confirm the new slot.` : `Hi ${name}, your ${context.service || 'photography'} shoot has been moved to [New date & time]${booking.location ? ` at ${booking.location}` : ''}. Reply here if this doesn’t work for you.`;
    if (!noDate) fields = [{ label: 'New date & time', type: 'datetime-local', value: booking.bookingDate && booking.startTime ? `${booking.bookingDate}T${booking.startTime}` : '' }];
  } else if (id === 'payment_reminder') {
    body = `Hi ${name}, a gentle payment reminder from Doll Pictures${canViewPayments && booking.paymentSummary.balanceDue != null ? `: ${money(booking.paymentSummary.balanceDue)} is pending on your booking` : ''}. You can pay by UPI to [Studio UPI ID] or at the studio.`;
    fields = [{ label: 'Studio UPI ID' }];
  } else if (id === 'payment_receipt') {
    const payment = canViewPayments ? [...booking.payments].sort((a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt))[0] : undefined;
    body = `Hi ${name}, we’ve received ${payment ? money(payment.amount) : '[Payment amount]'} on ${payment ? new Date(payment.paidAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : '[Payment date]'} for your booking.${canViewPayments ? `\nTotal paid: ${money(booking.paymentSummary.amountPaid)}${booking.paymentSummary.balanceDue != null ? ` · Balance: ${money(booking.paymentSummary.balanceDue)}` : ''}` : ''}\nThank you!`;
    if (!payment) fields = [{ label: 'Payment amount' }, { label: 'Payment date', type: 'date' }];
  } else if (id === 'photos_selection' || id === 'edited_photos') {
    const edited = id === 'edited_photos';
    const label = edited ? 'Edited photos link' : 'Gallery link';
    body = edited ? `Hi ${name}, your edited photos are ready ✨\nView them here: [${label}]\nPlease reply here if you have any questions.` : `Hi ${name}, your photos from the ${context.service || 'photography'} shoot are ready for you to choose from 📸\nGallery: [${label}]\nPlease pick your favourites and reply here once you’re done.`;
    fields = [{ label, type: 'url', value: edited ? booking.driveEditedUrl : booking.driveGalleryUrl }];
  } else if (id === 'prints_ready') {
    body = `Hi ${name}, your printed products are ready! Reply here to fix a time to collect them from the studio.${canViewPayments && (booking.paymentSummary.balanceDue ?? 0) > 0 ? `\nBalance due: ${money(booking.paymentSummary.balanceDue!)}` : ''}`;
  } else if (id === 'courier_tracking') {
    body = `Hi ${name}, your order is on its way 🚚\nCourier: [Courier]\nTracking number: [AWB number]`;
    fields = [{ label: 'Courier', value: order?.details.customerCourier }, { label: 'AWB number', value: order?.details.customerTracking }];
  } else if (id === 'birthday') {
    body = `Hi ${name}, wishing [Name] a very happy birthday 🎂 With love from all of us at Doll Pictures.`;
    fields = [{ label: 'Name' }];
  } else if (id === 'review_request') {
    body = `Hi ${name}, thank you for choosing Doll Pictures! If you enjoyed your experience, please leave us a quick review: [Google review link]`;
    fields = [{ label: 'Google review link', type: 'url', value: reviewUrl }];
  } else {
    return { body: manualWhatsAppMessage(id, context), fields };
  }
  return { body: `${body}${booking.customerCode ? `\n\nCustomer code: ${booking.customerCode}` : ''}`, fields };
}
