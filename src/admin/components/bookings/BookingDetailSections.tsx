import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Trash2 } from 'lucide-react';
import { leadSourceLabel } from '../leadSource';
import type { Booking, BookingPayment } from '../../types';

export function BookingSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-admin-text">{title}</h2>{action}</div>{children}</section>;
}

export function BookingTabPanel({ id, active, children, namespace = 'booking-details' }: { id: string; active: boolean; children: ReactNode; namespace?: string }) {
  return <div hidden={!active} role="tabpanel" id={`${namespace}-${id}-panel`} aria-labelledby={`${namespace}-${id}-tab`} tabIndex={0} className="space-y-4 focus-visible:outline-admin-focus">{children}</div>;
}

export function BookingPaymentSummary({ booking }: { booking: Booking }) {
  const money = (value: number | null | undefined) => value == null ? 'Not set' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const balance = booking.paymentSummary.balanceDue;
  const balanceLabel = booking.agreedTotal == null ? 'Price not set' : balance == null ? 'Balance not recorded' : balance < 0 ? `${money(Math.abs(balance))} overpaid` : balance === 0 ? 'Paid in full' : `${money(balance)} remaining`;
  return <><p className="break-words text-xl font-semibold text-admin-text">{balanceLabel}</p><dl className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-admin-muted p-3"><div><dt className="text-xs text-admin-subtle">Agreed</dt><dd className="mt-1 text-sm font-semibold">{money(booking.agreedTotal)}</dd></div><div><dt className="text-xs text-admin-subtle">Received</dt><dd className="mt-1 text-sm font-semibold">{money(booking.paymentSummary.amountPaid)}</dd></div></dl><p className="mt-2 text-xs text-admin-subtle">{booking.paymentDueDate ? `Payment due ${new Date(`${booking.paymentDueDate}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}` : 'Payment due date not set'}</p></>;

}

export function BookingDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('[role="alertdialog"]')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') ?? []);
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"><div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl bg-admin-surface p-4 text-admin-text shadow-xl"><div className="mb-3 flex items-center justify-between gap-3"><h2 id={titleId} className="font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 items-center justify-center"><X className="h-5 w-5" /></button></div>{children}</div></div>, document.body);
}

export function BookingCustomerDetails({ booking, canViewPhone }: { booking: Booking; canViewPhone: boolean }) {
  return <BookingSection title="Customer"><dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-admin-subtle">Phone</dt><dd>{canViewPhone ? <a className="text-admin-primary" href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a> : booking.customerPhone}</dd></div><div><dt className="text-xs text-admin-subtle">Email</dt><dd>{booking.customerEmail ? <a className="break-all text-admin-primary" href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a> : 'Not recorded'}</dd></div><div><dt className="text-xs text-admin-subtle">Source</dt><dd>{leadSourceLabel(booking.source)}</dd></div></dl></BookingSection>;
}

export function BookingPaymentDetails({ booking, onAdd, onEdit, onDelete }: { booking: Booking; onAdd: () => void; onEdit: (payment: BookingPayment) => void; onDelete: (payment: BookingPayment) => void }) {
  return <BookingSection title="Payments" action={<button className="min-h-11 text-sm font-semibold text-admin-primary" onClick={onAdd}>Add payment</button>}><BookingPaymentSummary booking={booking} /><p className="mt-2 text-sm capitalize text-admin-subtle">{booking.paymentSummary.status}</p><div className="mt-3 divide-y divide-admin-border">{booking.payments.map(payment => <div key={payment.id} className="flex items-center gap-2 py-3"><div className="min-w-0 flex-1"><p className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment.amount)}</p><p className="break-words text-xs text-admin-subtle">{new Date(payment.paidAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · {payment.method.replace(/_/g, ' ')}{payment.note ? ` · ${payment.note}` : ''}</p></div><button className="flex h-11 w-11 items-center justify-center" aria-label="Edit payment" onClick={() => onEdit(payment)}><Pencil className="h-4 w-4" /></button><button className="flex h-11 w-11 items-center justify-center text-red-600" aria-label="Delete payment" onClick={() => onDelete(payment)}><Trash2 className="h-4 w-4" /></button></div>)}{!booking.payments.length && <p className="py-2 text-sm text-admin-subtle">No payments recorded.</p>}</div></BookingSection>;
}
