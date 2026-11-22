import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookingRecordIcon as Icon } from './BookingRecordIcon';
import { BookingCancellationDialog } from './BookingCancellationDialog';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { leadSourceLabel } from '../leadSource';
import type { Booking, BookingStatus } from '../../types';
const labels: Record<BookingStatus, string> = { draft: 'Draft', confirmed: 'Confirmed', shoot_completed: 'In progress', delivered: 'Delivered', cancelled: 'Cancelled' };
export function BookingHeader({ booking, canViewPhone, canManage, canEdit, saving, onEdit, onMessage, onCancel, notify, children }: {
  booking: Booking; canViewPhone: boolean; canManage: boolean; canEdit: boolean; saving: boolean;
  onEdit: () => void; onMessage?: () => void; onCancel: (reason: string) => Promise<boolean | undefined>; notify: (text: string) => void; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false), [cancel, setCancel] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = header.current;
    const record = element?.closest<HTMLElement>('.booking-detail');
    if (!element || !record) return;
    // Keep sticky tabs below the header even when customer details wrap.
    const measure = () => record.style.setProperty('--bd-header-height', `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); record.style.removeProperty('--bd-header-height'); };
  }, []);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const outside = (event: MouseEvent) => { if (!menu.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const name = formatCustomerName(booking.customerName);
  const phone = booking.customerPhone.replace(/\D/g, '');
  const whatsapp = phone.length === 10 ? `91${phone}` : phone;
  return <header ref={header} className="bd-header bd-reference-header"><div className="bd-header-row">
    <div className="bd-customer-heading">
      <Link to="/admin/bookings" aria-label="Back to bookings" title="Back to bookings" className="bd-back"><Icon name="Back" /></Link>
      <span aria-hidden="true" className="bd-customer-avatar">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>
      <div className="min-w-0"><div className="bd-name-row"><h1 className="bd-title">{name}</h1><span className={`bd-record-status is-${booking.status}`}><span aria-hidden="true" />{labels[booking.status]}</span></div>
        <div className="bd-header-metadata">{booking.customerCode ? <span className="booking-header-code">{booking.customerCode}<button className="bd-copy-code" type="button" title="Copy customer code" aria-label={`Copy customer ID ${booking.customerCode}`} onClick={() => { void navigator.clipboard.writeText(booking.customerCode!).then(() => notify('Copied'), () => notify('Unable to copy customer code')); }}><Icon name="Copy" /></button></span> : <span>Customer ID not assigned</span>}
          <span aria-hidden="true">·</span>{canViewPhone && phone ? <a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a> : <span>{booking.customerPhone || 'Phone not recorded'}</span>}
          <span aria-hidden="true">·</span><span>{booking.packageName || booking.shootType || 'Photography session'}</span><span aria-hidden="true">·</span><span>{leadSourceLabel(booking.source)}</span>
        </div>
      </div>
    </div>
    <div className="bd-header-actions bd-reference-actions">
      {canViewPhone && phone && <><a href={`tel:${booking.customerPhone}`} className="bd-header-icon" aria-label="Call customer" title="Call"><Icon name="Call" /></a>{onMessage ? <button type="button" onClick={onMessage} className="bd-header-icon" aria-label="Message customer on WhatsApp" title="WhatsApp"><Icon name="WhatsApp" /></button> : <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="bd-header-icon" aria-label="Message customer on WhatsApp" title="WhatsApp"><Icon name="WhatsApp" /></a>}</>}
      {canManage && <><button type="button" className="bd-header-icon" aria-label="Edit booking" title="Edit booking" disabled={!canEdit} onClick={onEdit}><Icon name="Edit" /></button>
        <div ref={menu} className="relative"><button ref={trigger} type="button" className="bd-header-icon" aria-label="More booking actions" title="More" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}><Icon name="More" /></button>
        {open && <div role="menu" aria-label="Booking actions" className="bd-header-menu" onClick={() => { setOpen(false); trigger.current?.focus(); }} onKeyDown={event => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault(); const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
          const index = items.indexOf(document.activeElement as HTMLButtonElement);
          items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }}>
          {['draft', 'confirmed'].includes(booking.status) && <button type="button" role="menuitem" disabled={!canEdit} onClick={onEdit}>Reschedule</button>}
          {children}
          {booking.status !== 'cancelled' && <button type="button" role="menuitem" disabled={saving} className="is-destructive" onClick={() => { setCancel(true); }}>Cancel booking</button>}
        </div>}</div></>}
    </div>
  </div>{cancel && <BookingCancellationDialog customerName={booking.customerName} onClose={() => setCancel(false)} onConfirm={onCancel} />}</header>;
}
