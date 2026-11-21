import { ServiceFilterChips } from '../sales/ServiceFilterChips';
import { useState, type ReactNode } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Filter, ListFilter } from 'lucide-react';
import type { BookingStatus, PaymentState, StaffAccountOption } from '../../types';
import type { ServiceCategoryOption } from '../sales/serviceCategories';
import { BOOKING_SORT_OPTIONS, BOOKING_STATUSES, type BookingSort } from './bookingList';

type Filters = { status: BookingStatus | ''; assignee: string; payment: PaymentState | ''; overdueOnly: boolean };
const emptyFilters: Filters = { status: '', assignee: '', payment: '', overdueOnly: false };
type FilterProps = {
  filters: Filters;
  onApply: (value: Filters) => void;
  staff: Pick<StaffAccountOption, 'id' | 'name'>[];
  staffFailed: boolean;
  counts: Record<BookingStatus, number>;
  canViewPayments: boolean;
  overdueCount: number;
};

function FilterEditor({
  filters,
  onApply,
  staff,
  staffFailed,
  counts,
  canViewPayments,
  overdueCount,
  close,
}: FilterProps & { close: () => void }) {
  const [draft, setDraft] = useState(filters);
  const chip = <K extends 'status' | 'assignee' | 'payment'>(
    key: K,
    value: Filters[K],
    label: string,
    count?: number,
  ) => (
    <button
      className="bl-chip"
      key={value}
      aria-pressed={draft[key] === value}
      onClick={() => setDraft({ ...draft, [key]: value })}
    >
      {value &&
        (key === 'assignee' ? (
          <span className="bl-initial" aria-hidden>
            {value === 'unassigned' ? '–' : label[0]}
          </span>
        ) : (
          <span className="bl-dot" aria-hidden data-value={value} />
        ))}
      {label}
      {count != null && <small>{count}</small>}
    </button>
  );
  return (
    <>
      <header>
        <strong>Filters</strong>
        <button onClick={() => setDraft(emptyFilters)}>Clear all</button>
      </header>
      <div className="bl-filter-body">
        <fieldset>
          <legend>Booking status</legend>
          {chip(
            'status',
            '',
            'All statuses',
            Object.values(counts).reduce((a, b) => a + b, 0),
          )}
          {BOOKING_STATUSES.map((s) => chip('status', s.value, s.label, counts[s.value]))}
        </fieldset>
        <fieldset>
          <legend>Assigned to</legend>
          {chip('assignee', '', 'Anyone')}
          {staff.map((s) => chip('assignee', s.id, s.name))}
          {chip('assignee', 'unassigned', 'Unassigned')}
          {staffFailed && <p>Staff options unavailable</p>}
        </fieldset>
        {canViewPayments && (
          <fieldset>
            <legend>Payment</legend>
            {chip('payment', '', 'Any')}
            {(['unpriced', 'unpaid', 'partial', 'paid', 'overpaid'] as const).map((p) =>
              chip('payment', p, p[0].toUpperCase() + p.slice(1)),
            )}
          </fieldset>
        )}
        <label className="bl-overdue">
          <span>
            <strong>Only overdue follow-ups</strong>
            <small>Bookings whose follow-up date has passed · {overdueCount} right now</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={draft.overdueOnly}
            onChange={(e) => setDraft({ ...draft, overdueOnly: e.target.checked })}
          />
        </label>
      </div>
      <footer>
        <button className="bl-chip" onClick={close}>
          Cancel
        </button>
        <button
          className="bl-primary"
          onClick={() => {
            onApply(draft);
            close();
          }}
        >
          Show bookings
        </button>
      </footer>
    </>
  );
}

type Props = FilterProps & {
  views: ReactNode;
  sort: BookingSort;
  onSort: (v: BookingSort) => void;
  services: ServiceCategoryOption[];
  service: string;
  onService: (v: string) => void;
};
export function BookingListControls(props: Props) {
  const { filters, onApply, views, sort, onSort, services, service, onService, staff } = props;
  const active = [
    filters.status && 'Status: ' + BOOKING_STATUSES.find((s) => s.value === filters.status)?.label,
    filters.assignee &&
      'Assigned: ' +
        (filters.assignee === 'unassigned'
          ? 'Unassigned'
          : staff.find((s) => s.id === filters.assignee)?.name || 'Selected staff'),
    filters.payment && 'Payment: ' + filters.payment,
    filters.overdueOnly && 'Overdue follow-ups',
  ].filter(Boolean);
  return (
    <div className="bl-controls hidden sm:block">
      <div className="bl-tools">
        {views}
        <Popover className="bl-anchor">
          <PopoverButton className="bl-chip" aria-label="Filter bookings" title="Filters" aria-haspopup="dialog">
            <Filter size={15} />
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: 'bottom start', gap: 8, padding: 12 }}
            focus
            role="dialog"
            aria-label="Filter bookings"
            className="bl-popover bl-dialog"
          >
            {({ close }) => <FilterEditor {...props} close={close} />}
          </PopoverPanel>
        </Popover>
        <label className="bl-sort">
          <ListFilter size={16} />
          <select aria-label="Sort bookings" value={sort} onChange={(e) => onSort(e.target.value as BookingSort)}>
            {BOOKING_SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {active.length > 0 && (
        <div className="bl-active">
          Filtered by{' '}
          {active.map((label) => (
            <strong key={String(label)}>{label}</strong>
          ))}
          <button onClick={() => onApply(emptyFilters)}>Clear all</button>
        </div>
      )}
      <ServiceFilterChips className="bl-services" services={services} service={service} onService={onService} limit={8}/>
    </div>
  );
}
