import { Clock3, Phone, UserRoundPlus } from 'lucide-react';
import type { Booking } from '../../types';
import { formatTimeWindow } from '../../../shared/bookingTime';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { whatsappUrl } from '../../contact';
import { CustomerCode } from '../CustomerCode';
import { WhatsAppIcon } from '../enquiries/WhatsAppIcon';
import { leadSourceLabel } from '../leadSource';
import {
  bookingPriceDisplay,
  bookingStatusClass,
  bookingStatusLabel,
  formatBookingCreatedDay,
  formatBookingDay,
  type BookingSort,
} from './bookingList';

type Props = {
  rows: Booking[];
  sort: BookingSort;
  onSort: (sort: BookingSort) => void;
  showPricing: boolean;
  canViewPayments: boolean;
  canViewPhone: boolean;
  onOpen: (id: string) => void;
  onAssign?: (booking: Booking) => void;
};
function shootDay(value: string) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : 'Shoot date not set';
}
export function BookingDesktopTable({
  rows,
  sort,
  onSort,
  showPricing,
  canViewPayments,
  canViewPhone,
  onOpen,
  onAssign,
}: Props) {
  const grouped = sort === 'shoot_date' || sort === 'shoot_date_desc';
  const groups = new Map<string, Booking[]>();
  for (const booking of rows) {
    const day = grouped ? shootDay(booking.bookingDate) : '';
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(booking);
  }
  return (
    <div className="hidden sm:block">
      <table className="bl-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th aria-sort={grouped ? (sort === 'shoot_date' ? 'ascending' : 'descending') : 'none'}>
              <button
                aria-label="Sort by shoot date"
                onClick={() => onSort(sort === 'shoot_date' ? 'shoot_date_desc' : 'shoot_date')}
              >
                Shoot {grouped ? (sort === 'shoot_date' ? '↑' : '↓') : '↕'}
              </button>
            </th>
            {showPricing && <th className="bl-balance">{canViewPayments ? 'Balance' : 'Price'}</th>}
            <th>Assigned</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        {[...groups].map(([day, bookings]) => (
          <tbody key={day}>
            {day && (
              <tr className="bl-day">
                <th scope="rowgroup" colSpan={showPricing ? 6 : 5}>
                  <div>
                    {day}
                    <small>
                      {bookings.length} {bookings.length === 1 ? 'shoot' : 'shoots'}
                    </small>
                  </div>
                </th>
              </tr>
            )}
            {bookings.map((b) => {
              const name = formatCustomerName(b.customerName) || 'Unnamed customer';
              const paid = b.paymentSummary;
              const price = bookingPriceDisplay(b, canViewPayments);
              return (
                <tr key={b.id} className="bl-row" onClick={() => onOpen(b.id)}>
                  <td>
                    <div className="bl-identity">
                      <span className="bl-avatar" aria-hidden>
                        {name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}
                      </span>
                      <div>
                        <div className="bl-line">
                          <a
                            href={'/admin/bookings/' + b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                                e.preventDefault();
                                onOpen(b.id);
                              }
                            }}
                          >
                            {name}
                          </a>
                          <span className={'bl-status ' + bookingStatusClass[b.status]}>
                            {bookingStatusLabel(b.status)}
                          </span>
                        </div>
                        <div className="bl-meta">
                          <CustomerCode code={b.customerCode} />
                          {b.customerPhone && (
                            <span>
                              {b.customerCode && '· '}
                              {canViewPhone ? b.customerPhone : 'Phone hidden'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td title={[b.packageName || b.shootType, b.source ? leadSourceLabel(b.source) : 'Source not recorded'].filter(Boolean).join(' · ')}>
                    <strong className="bl-service-name">{b.packageName || b.shootType || 'Service not set'}</strong>
                  </td>
                  <td title={'Created ' + formatBookingCreatedDay(b.createdAt)}>
                    {!grouped && <strong>{shootDay(b.bookingDate)}</strong>}
                    {b.startTime && b.endTime ? formatTimeWindow(b.startTime, b.endTime, '12h') : 'Time not set'}
                  </td>
                  {showPricing && (
                    <td className="bl-balance">
                      <strong className="bl-money" data-state={price.caption}>
                        {price.amount}
                      </strong>
                      {price.caption && <small>{price.caption}</small>}
                    </td>
                  )}
                  <td>
                    <span className="bl-staff">
                      {b.assignedStaffAccountName && <i aria-hidden>{b.assignedStaffAccountName[0]}</i>}
                      {b.assignedStaffAccountName || 'Unassigned'}
                    </span>
                    {b.nextFollowUpAt && (
                      <small title={b.followUpNote}>
                        <Clock3 size={13} />
                        {Date.parse(b.nextFollowUpAt) <= Date.now() ? 'Overdue' : 'Follow-up'} ·{' '}
                        {formatBookingDay(b.nextFollowUpAt)}
                      </small>
                    )}
                    {canViewPayments && showPricing && (paid.balanceDue ?? 0) > 0 && b.paymentDueDate && (
                      <small>Payment due · {formatBookingDay(b.paymentDueDate)}</small>
                    )}
                  </td>
                  <td>
                    <div className="bl-actions" onClick={(e) => e.stopPropagation()}>
                      {canViewPhone && b.customerPhone && (
                        <>
                          <a href={'tel:' + b.customerPhone} aria-label={'Call ' + name}>
                            <Phone size={16} />
                          </a>
                          <a
                            href={whatsappUrl(b.customerPhone)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={'WhatsApp ' + name}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      {onAssign && (
                        <button aria-label={'Assign staff for ' + name} onClick={() => onAssign(b)}>
                          <UserRoundPlus size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
