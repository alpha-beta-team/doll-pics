import type { TodayWork } from '../types';

export type EndOfDayCheck = { label: string; count: number; href: string };

export function endOfDayChecks(work: TodayWork): EndOfDayCheck[] {
  const tomorrowIncomplete = work.tomorrowShoots.filter(item => !item.startTime || !item.location).length;
  return [
    { label: 'Follow-ups resolved', count: work.followUps.length, href: '#today-followups' },
    { label: 'New enquiries contacted', count: work.newEnquiries.length, href: '#today-new-enquiries' },
    { label: 'Today’s shoots completed', count: work.todayShoots.length, href: '#today-shoots' },
    { label: 'Due payments handled', count: work.paymentsDue.length, href: '#today-payments' },
    { label: 'Tomorrow’s shoots prepared', count: tomorrowIncomplete, href: '#today-tomorrow' },
  ];
}
