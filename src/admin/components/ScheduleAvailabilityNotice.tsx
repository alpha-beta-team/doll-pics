import { AlertCircle, Check, Info } from 'lucide-react';
import type { ScheduleAvailability } from '../hooks/useScheduleAvailability';
import { formatScheduleTime } from '../pages/schedule.utils';

export function ScheduleAvailabilityNotice({ availability }: { availability: ScheduleAvailability }) {
  if (availability.checking) return <p className="mt-3 text-sm font-medium text-slate-500" role="status">Checking schedule availability…</p>;
  if (availability.error) return <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert"><div className="flex gap-2"><AlertCircle className="h-5 w-5 shrink-0" /><span><strong>Availability check failed.</strong> {availability.error}</span></div><button type="button" onClick={availability.retry} className="mt-2 rounded-lg border border-red-300 px-3 py-2 font-semibold">Retry</button></div>;
  const conflicts = availability.conflicts;
  if (!conflicts) return null;
  if (conflicts.timedConflicts.length || conflicts.untimedConflicts.length) return <div className="mt-3 space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900" role="status"><p className="flex items-center gap-2 font-semibold"><Info className="h-5 w-5 shrink-0" />Existing bookings</p>{conflicts.timedConflicts.map(item => <p key={item.id}>{item.customerName} is booked {formatScheduleTime(item.startTime)}–{formatScheduleTime(item.endTime)}.</p>)}{conflicts.untimedConflicts.map(item => <p key={item.id}>{item.customerName} has a booking on this date with no time set.</p>)}<p>You can proceed after confirming, or choose another time.</p></div>;
  return <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status"><Check className="h-4 w-4" />This time is available.</p>;
}
