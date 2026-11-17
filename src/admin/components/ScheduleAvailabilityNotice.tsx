import { AdminAlert } from './ui/AdminUi';
import { formatCustomerName } from '../../shared/formatCustomerName';

import type { ScheduleAvailability } from '../hooks/useScheduleAvailability';
import { formatScheduleTime } from '../pages/schedule.utils';

export function ScheduleAvailabilityNotice({ availability }: { availability: ScheduleAvailability }) {
  if (availability.checking) return <p className="mt-3 text-sm font-medium text-slate-500" role="status">Checking schedule availability…</p>;
  if (availability.error) return <AdminAlert className="mt-3"><div className="flex gap-2"><span><strong>Availability check failed.</strong> {availability.error}</span></div><button type="button" onClick={availability.retry} className="mt-2 rounded-lg border border-red-300 px-3 py-2 font-semibold">Retry</button></AdminAlert>;
  const conflicts = availability.conflicts;
  if (!conflicts) return null;
  if (conflicts.timedConflicts.length || conflicts.untimedConflicts.length) return <AdminAlert tone="info" className="mt-3" contentClassName="space-y-2"><p className="flex items-center gap-2 font-semibold">Existing bookings</p>{conflicts.timedConflicts.map(item => <p key={item.id}>{formatCustomerName(item.customerName)} is booked {formatScheduleTime(item.startTime)}–{formatScheduleTime(item.endTime)}.</p>)}{conflicts.untimedConflicts.map(item => <p key={item.id}>{formatCustomerName(item.customerName)} has a booking on this date with no time set.</p>)}<p>You can proceed after confirming, or choose another time.</p></AdminAlert>;
  return <AdminAlert tone="success" as="span" className="mt-3" contentClassName="items-center gap-1.5">This time is available.</AdminAlert>;
}
