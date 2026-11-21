import { queueFor, type Queue, type TrackingRow } from './postShootTracking';

export const trackingTabs = [
  { key: 'all', label: 'All orders', queues: [] },
  { key: 'shoot', label: 'Shoot', queues: ['setup'] },
  { key: 'selection', label: 'Photo Selection', queues: ['photos', 'selection'] },
  { key: 'editing', label: 'Editing', queues: ['editing', 'print_selection'] },
  { key: 'printing', label: 'Printing', queues: ['print', 'prints'] },
  { key: 'delivery', label: 'Delivery', queues: ['handover', 'receipt'] },
  { key: 'completed', label: 'Completed', queues: ['delivered'] },
  { key: 'cancelled', label: 'Cancelled', queues: ['cancelled'] },
] as const;

export const subLabels: Partial<Record<Queue | 'printer_finished', string>> = {
  photos: 'To share',
  selection: 'Waiting for customer',
  editing: 'In editing',
  print_selection: 'Waiting for print choices',
  print: 'To send to printer',
  prints: 'At the printer',
  printer_finished: 'Printer finished',
  handover: 'At the studio',
  receipt: 'Awaiting receipt',
};

export function tabForQueue(queue: string) {
  return trackingTabs.find((tab) => (tab.queues as readonly string[]).includes(queue)) ?? trackingTabs[0];
}

export function subForRow(row: TrackingRow) {
  const queue = queueFor(row);
  return queue === 'prints' && (row.order?.dates.printing_completed || row.order?.details.printingCompletedAt)
    ? 'printer_finished'
    : queue;
}

export function shootAge(date: string, now: number) {
  const today = new Date(now + 330 * 60000).toISOString().slice(0, 10);
  const days = (Date.parse(today) - Date.parse(date)) / 86400000;
  if (!Number.isFinite(days)) return { label: 'Date unavailable', group: 'Date unavailable', days };
  const formatted = new Date(date + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
  if (days < 0)
    return { label: `In ${-days} ${days === -1 ? 'day' : 'days'}`, group: 'Upcoming shoot · ' + formatted, days };
  if (days === 0) return { label: 'Shot today', group: 'Shot today · ' + formatted, days };
  if (days === 1) return { label: '1 day', group: 'Yesterday · ' + formatted, days };
  return { label: days + ' days', group: formatted, days };
}
