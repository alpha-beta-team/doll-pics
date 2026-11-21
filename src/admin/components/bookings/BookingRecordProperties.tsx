import { useEffect, useState, type ReactNode } from 'react';
import { BookingAssigneePicker } from './BookingAssigneePicker';
import type { Booking, StaffAccountOption } from '../../types';
import { api } from '../../api/client';
import { canonicalIndianPhone } from '../customerLookup.utils';
import { leadSourceLabel } from '../leadSource';
import { BookingRecordIcon as Icon } from './BookingRecordIcon';

const money = (value: number | null) => value == null ? 'Not set' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
const date = (value: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+05:30` : value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const languageName = (value: string) => {
  if (!value) return 'Not recorded';
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(value) || value; } catch { return value; }
};
const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

type Props = {
  booking: Booking; canViewPayments: boolean; canManage: boolean; canEdit: boolean; canViewPhone: boolean;
  followUpReady: boolean; onPayment: () => void; onPaymentHistory: () => void; onDueDate: () => void; staff: StaffAccountOption[]; onAssignment: (id: string) => Promise<void>; onReturning: () => void;
  onFollowUp: () => void; onEdit: () => void; onNavigate: (tab: string) => void; activity: ReactNode; onActivity: () => void;
};

export function BookingRecordProperties({ booking, canViewPayments, canManage, canEdit, canViewPhone, followUpReady, onPayment, onPaymentHistory, onDueDate, staff, onAssignment, onReturning, onFollowUp, onEdit, onNavigate, activity, onActivity }: Props) {
  const [returning, setReturning] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState(false);
  useEffect(() => {
    let active = true;
    setReturning(null); setLookupError(false);
    if (!canManage || !canViewPhone || !canonicalIndianPhone(booking.customerPhone)) return;
    api.lookupCustomer(booking.customerPhone).then(result => {
      if (!active) return;
      const records = new Set([...result.active, ...result.history].filter(row => !(row.type === 'booking' && row.id === booking.id)).map(row => `${row.type}:${row.id}`));
      setReturning(records.size);
    }).catch(() => { if (active) setLookupError(true); });
    return () => { active = false; };
  }, [booking.id, booking.customerPhone, canManage, canViewPhone]);
  const balance = booking.paymentSummary.balanceDue;
  const priced = booking.agreedTotal != null;
  const owing = priced && balance != null && balance > 0;
  const paid = priced && balance != null && balance <= 0;
  const progress = priced && booking.agreedTotal! > 0 ? Math.min(100, Math.max(0, booking.paymentSummary.amountPaid / booking.agreedTotal! * 100)) : paid ? 100 : 0;
  const status = !priced ? 'Price not set' : balance == null ? 'Not recorded' : balance < 0 ? 'Overpaid' : balance === 0 ? 'Paid' : booking.paymentSummary.amountPaid > 0 ? 'Part paid' : 'Unpaid';
  return <aside className="bd-record-properties bd-reference-properties" aria-label="Payment and contact">
    {canViewPayments && <section aria-labelledby="bd-payment-heading">
      <div className="bd-property-heading"><h2 id="bd-payment-heading">Payment</h2><button type="button" className="bd-small-action" onClick={onPayment}><Icon name="Payment" />Record payment</button></div>
      <p className={`bd-record-balance ${owing ? 'is-due' : paid ? 'is-paid' : ''}`}>
        {priced && balance != null ? <><span className="bd-currency">{money(Math.abs(balance))}</span> <span>{balance < 0 ? 'overpaid' : balance === 0 ? 'paid in full' : 'due'}</span></> : status}
      </p>
      <div className="bd-received-track" role="img" aria-label={priced ? `${money(booking.paymentSummary.amountPaid)} of ${money(booking.agreedTotal!)} received` : 'Payment progress unavailable'}><span style={{ width: `${progress}%` }} /></div>
      <dl className="bd-property-fields">
        <div><dt>Agreed</dt><dd className="bd-currency">{priced ? money(booking.agreedTotal!) : 'Not set'}</dd></div>
        <div><dt>Status</dt><dd><span className={`bd-record-badge ${owing ? 'is-due' : paid ? 'is-paid' : ''}`}><span />{status}</span></dd></div>
        <div><dt>Received</dt><dd className="bd-currency">{money(booking.paymentSummary.amountPaid)}</dd></div>
        <div><dt>Due date</dt><dd>{booking.paymentDueDate && <span>{date(booking.paymentDueDate)} </span>}{canEdit ? <button type="button" className="bd-small-action" aria-label={booking.paymentDueDate ? 'Edit payment due date' : 'Set payment due date'} onClick={onDueDate}><Icon name="SetDate" />{booking.paymentDueDate ? 'Edit date' : 'Set date'}</button> : !booking.paymentDueDate && 'Not set'}</dd></div>
      </dl>
      {(booking.bookingDiscountAmount ?? 0) > 0 && <p className="bd-property-discount">{money(booking.bookingDiscountAmount!)} discount applied</p>}
      {booking.pricingSnapshot?.campaignId && <details className="bd-property-campaign"><summary>{booking.pricingSnapshot.campaignName}</summary><p>Original: {money(booking.pricingSnapshot.basePrice)} · Sale: {money(booking.pricingSnapshot.salePrice)} · Campaign saving: {money(booking.pricingSnapshot.discountAmount)}</p>{booking.pricingSnapshot.adjustmentAmount !== 0 && <p>Final price adjustment: {money(booking.pricingSnapshot.adjustmentAmount)} · {booking.pricingSnapshot.overrideReason}</p>}</details>}
      <div className="bd-property-payment-history">
        <div className="bd-property-heading"><h3>Payment history</h3><span className="bd-muted">{booking.payments.length} payment{booking.payments.length === 1 ? '' : 's'}</span></div>
        {booking.payments.length ? <><ul>{[...booking.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 3).map(payment => <li key={payment.id}><div><span className="bd-currency">{money(payment.amount)}</span><span className="bd-muted">{date(payment.paidAt)} · {payment.method.replace(/_/g, ' ')}</span></div></li>)}</ul><button type="button" className="bd-record-link" onClick={onPaymentHistory}>View all payments<Icon name="Arrow" /></button></> : <div className="bd-payment-empty"><Icon name="Payment" /><p>No payments recorded yet. Each payment will appear here with its date, amount and method.</p></div>}
      </div>
    </section>}
    <section aria-labelledby="bd-assigned-heading">
      <h2 id="bd-assigned-heading">Assigned &amp; follow-up</h2>
      <dl className="bd-property-fields">
        <div><dt>Assigned to</dt><dd className="bd-assigned-value"><span className="bd-person"><span aria-hidden="true" className="bd-mini-avatar">{booking.assignedStaffAccountName ? initials(booking.assignedStaffAccountName) : '—'}</span>{booking.assignedStaffAccountName || 'Unassigned'}</span>{canManage && <BookingAssigneePicker disabled={!canEdit} currentId={booking.assignedStaffAccountId} currentName={booking.assignedStaffAccountName} staff={staff} onSave={onAssignment} />}</dd></div>
        <div><dt>Follow-up</dt><dd>{booking.nextFollowUpAt ? <><button type="button" className="bd-record-link" onClick={() => onNavigate('notes')}>{new Date(booking.nextFollowUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</button>{booking.followUpNote && <p className="bd-muted">{booking.followUpNote}</p>}</> : canManage ? <button type="button" className="bd-small-action" disabled={!followUpReady} aria-label="Schedule a follow-up" onClick={onFollowUp}><Icon name="Schedule" />Schedule</button> : 'No follow-up scheduled'}</dd></div>
      </dl>
    </section>
    <section aria-labelledby="bd-customer-heading">
      <h2 id="bd-customer-heading">Customer</h2>
      <dl className="bd-property-fields">
        <div><dt>Email</dt><dd>{booking.customerEmail ? <a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a> : canManage ? <button type="button" className="bd-small-action" disabled={!canEdit} onClick={onEdit} aria-label="Add customer email"><Icon name="AddEmail" />Add email</button> : 'Not recorded'}</dd></div>
        <div><dt>Source</dt><dd>{leadSourceLabel(booking.source)}</dd></div>
        <div><dt>WhatsApp</dt><dd>{booking.whatsappOptOutAt ? 'Opted out' : booking.whatsappOptIn && booking.whatsappNotificationsEnabled ? 'Updates on' : 'Updates off'}</dd></div>
        <div><dt>Language</dt><dd>{languageName(booking.preferredLanguage)}</dd></div>
        {canManage && canViewPhone && <div><dt>Returning</dt><dd>{returning == null ? <span className="bd-muted">{lookupError ? 'Unavailable' : canonicalIndianPhone(booking.customerPhone) ? 'Checking…' : 'Not available'}</span> : <button type="button" className="bd-record-link" aria-label={`Returning customer: view ${returning} earlier records`} onClick={onReturning}>{returning} record{returning === 1 ? '' : 's'}<Icon name="Arrow" /></button>}</dd></div>}
      </dl>
    </section>
    <section aria-labelledby="bd-activity-heading"><div className="bd-property-heading"><h2 id="bd-activity-heading">Recent activity</h2><button type="button" className="bd-record-link" onClick={onActivity}>View all<Icon name="Arrow" /></button></div>{activity}</section>
  </aside>;
}
