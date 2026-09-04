import type { Enquiry, EnquirySource, EnquiryStage } from '../../types';
import { leadSourceLabel } from '../leadSource';

export type EnquirySort = 'newest' | 'oldest' | 'follow_up' | 'updated' | 'customer';
export type EnquiryPriorityFilter = '' | 'due_today' | 'overdue';
export type FollowUpUrgency = 'overdue' | 'due_today' | 'upcoming';
export type EnquiryListScope = 'active' | 'all';

export const ENQUIRY_STAGES: ReadonlyArray<{ value: EnquiryStage; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'booked', label: 'Converted' },
  { value: 'closed_lost', label: 'Not interested' },
];

export const ENQUIRY_SORT_OPTIONS: ReadonlyArray<{ value: EnquirySort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'follow_up', label: 'Follow-up date' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'customer', label: 'Customer name' },
];

export const enquiryStageClass: Record<EnquiryStage, string> = {
  new: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  contacted: 'bg-blue-50 text-blue-800 ring-blue-200',
  follow_up: 'bg-amber-50 text-amber-900 ring-amber-200',
  booked: 'bg-emerald-100 text-emerald-950 ring-emerald-300',
  closed_lost: 'bg-stone-100 text-stone-700 ring-stone-300',
};

export const enquiryStageDotClass: Record<EnquiryStage, string> = {
  new: 'bg-emerald-500',
  contacted: 'bg-blue-500',
  follow_up: 'bg-amber-500',
  booked: 'bg-emerald-700',
  closed_lost: 'bg-stone-500',
};

export function enquiryStageLabel(stage: EnquiryStage) {
  return ENQUIRY_STAGES.find(item => item.value === stage)?.label
    ?? stage.replace(/_/g, ' ');
}

export function enquiryMatchesScope(enquiry: Enquiry, scope: EnquiryListScope) {
  return scope === 'all' || enquiry.stage !== 'closed_lost';
}

export function enquirySourceLabel(source: EnquirySource) {
  return leadSourceLabel(source);
}

export function enquiryMatchesSearch(enquiry: Enquiry, query: string) {
  const normalized = query.trim().toLocaleLowerCase('en-IN');
  if (!normalized) return true;
  return [
    enquiry.name,
    enquiry.phone,
    enquiry.shootType,
    enquiry.preferredEvent,
    enquirySourceLabel(enquiry.source),
    enquiry.source,
  ].some(value => value.toLocaleLowerCase('en-IN').includes(normalized));
}

function parsedDate(value?: string, fallback: number = Number.NEGATIVE_INFINITY) {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function sortEnquiries(enquiries: Enquiry[], sort: EnquirySort) {
  return [...enquiries].sort((a, b) => {
    if (sort === 'customer') {
      return a.name.localeCompare(b.name, 'en-IN', { sensitivity: 'base' });
    }
    if (sort === 'follow_up') {
      return parsedDate(a.nextFollowUpAt, Number.POSITIVE_INFINITY)
        - parsedDate(b.nextFollowUpAt, Number.POSITIVE_INFINITY);
    }
    if (sort === 'oldest') {
      return parsedDate(a.createdAt, Number.POSITIVE_INFINITY)
        - parsedDate(b.createdAt, Number.POSITIVE_INFINITY);
    }
    if (sort === 'updated') {
      return parsedDate(b.updatedAt || b.createdAt) - parsedDate(a.updatedAt || a.createdAt);
    }
    return parsedDate(b.createdAt) - parsedDate(a.createdAt);
  });
}

function isSameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function followUpUrgency(value: string, now = new Date()): FollowUpUrgency | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() < now.getTime()) return 'overdue';
  return isSameLocalDay(date, now) ? 'due_today' : 'upcoming';
}

export function enquiryMatchesPriority(
  enquiry: Enquiry,
  priority: EnquiryPriorityFilter,
  now = new Date(),
) {
  if (!priority) return true;
  if (!enquiry.nextFollowUpAt) return false;
  return followUpUrgency(enquiry.nextFollowUpAt, now) === priority;
}

export function formatReceivedAt(value: string, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Date unavailable';

  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  if (isSameLocalDay(date, now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(date, yesterday)) return `Yesterday, ${time}`;

  const elapsedDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (elapsedDays > 1 && elapsedDays < 7) return `${elapsedDays} days ago`;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function formatFollowUpAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
