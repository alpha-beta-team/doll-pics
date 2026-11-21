import { useId, useRef, useState, type FormEvent } from 'react';
import type { Booking, BookingPayment, PaymentMethod } from '../../types';
import type { PaymentInput } from '../../api/bookings';
import { kolkataToday } from '../../reports/reportingPeriod';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { FormInput, FormTextarea } from '../ui/FormControls';
import { BookingDialog } from './BookingDetailSections';
import './booking-payment-dialog.css';

const money = (value: number | null) => value == null ? 'Not set' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
const methods: [PaymentMethod, string][] = [['upi', 'UPI'], ['cash', 'Cash'], ['card', 'Card'], ['bank_transfer', 'Bank transfer']];
function paymentDay(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

export function BookingPaymentDialog({ booking, payment, onClose, onSave }: {
  booking: Booking; payment: BookingPayment | null; onClose: () => void; onSave: (data: PaymentInput) => Promise<void>;
}) {
  const id = useId();
  const [amount, setAmount] = useState(payment ? String(payment.amount) : '');
  const [paidAt, setPaidAt] = useState(payment?.paidAt ? paymentDay(payment.paidAt) : kolkataToday());
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'upi');
  const [reference, setReference] = useState(payment?.reference || '');
  const [note, setNote] = useState(payment?.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const balance = booking.paymentSummary.balanceDue;
  // Replacing an existing payment must include its amount in the available balance.
  const fullBalance = balance == null ? null : Math.round((balance + (payment?.amount || 0)) * 100) / 100;
  const close = () => { if (!inFlight.current) onClose(); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0.01 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError('Enter a positive payment amount with up to two decimal places.'); return;
    }
    const date = new Date(`${paidAt}T12:00:00+05:30`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || !Number.isFinite(date.getTime()) || paymentDay(date.toISOString()) !== paidAt) {
      setError('Enter a valid payment date.'); return;
    }
    inFlight.current = true; setSaving(true); setError('');
    try {
      await onSave({ amount: value, paidAt: payment && paidAt === paymentDay(payment.paidAt) ? payment.paidAt : date.toISOString(), method, reference: reference.trim(), note: note.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment');
    } finally { inFlight.current = false; setSaving(false); }
  };

  return <BookingDialog dismissOnBackdrop className="booking-detail booking-detail-dialog bd-payment-dialog" title={payment ? 'Edit payment' : 'Record payment'} subtitle={[formatCustomerName(booking.customerName), booking.customerCode].filter(Boolean).join(' · ')} onClose={close}>
    <form onSubmit={event => void submit(event)}>
      <div className="bd-payment-body">
        <dl className="bd-payment-totals">
          <div><dt>Agreed</dt><dd>{money(booking.agreedTotal)}</dd></div>
          <div><dt>Received</dt><dd>{money(booking.paymentSummary.amountPaid)}</dd></div>
          <div><dt>{balance != null && balance < 0 ? 'Overpaid' : 'Due'}</dt><dd className={balance != null && balance > 0 ? 'bd-payment-due' : ''}>{money(balance == null ? null : Math.abs(balance))}</dd></div>
        </dl>
        {error && <p role="alert" className="bd-payment-error" id={`${id}-error`}>{error}</p>}
        <fieldset disabled={saving} className="bd-payment-fields">
          <div className="bd-payment-row">
            <div><label htmlFor={`${id}-amount`}>Amount</label><div className="bd-payment-amount"><span aria-hidden="true">₹</span><FormInput id={`${id}-amount`} aria-label="Amount (₹)" aria-describedby={error ? `${id}-error` : undefined} inputMode="decimal" required placeholder="0" value={amount} onChange={event => setAmount(event.target.value)} /></div>
              {fullBalance != null && fullBalance > 0 && <button type="button" className="bd-payment-full" onClick={() => setAmount(String(fullBalance))}>Full balance {money(fullBalance)}</button>}
            </div>
            <div><label htmlFor={`${id}-date`}>Payment date</label><FormInput id={`${id}-date`} type="date" required value={paidAt} onChange={event => setPaidAt(event.target.value)} /></div>
          </div>
          <fieldset className="bd-payment-methods"><legend>Method</legend><div>{(payment?.method === 'other' ? [...methods, ['other', 'Other'] as [PaymentMethod, string]] : methods).map(([value, label]) => <label key={value}><input type="radio" name={`${id}-method`} value={value} checked={method === value} onChange={() => setMethod(value)} /><span>{label}</span></label>)}</div></fieldset>
          <div><label htmlFor={`${id}-reference`}>Reference <span>(UPI / transaction ID, optional)</span></label><FormInput id={`${id}-reference`} placeholder="e.g. 431829104455" maxLength={120} value={reference} onChange={event => setReference(event.target.value)} /></div>
          <div><label htmlFor={`${id}-note`}>Note <span>(optional)</span></label><FormTextarea id={`${id}-note`} rows={2} placeholder="e.g. Advance paid at the studio" maxLength={500} value={note} onChange={event => setNote(event.target.value)} /></div>
        </fieldset>
      </div>
      <footer className="bd-payment-footer"><p>Shows in payment history.</p><div><button type="button" className="bd-payment-cancel" disabled={saving} onClick={close}>Cancel</button><button type="submit" className="bd-payment-save" disabled={saving}>{saving ? 'Saving…' : 'Save payment'}</button></div></footer>
    </form>
  </BookingDialog>;
}
