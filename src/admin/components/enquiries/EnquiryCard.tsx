import type { KeyboardEvent, MouseEvent } from 'react';
import { CalendarClock, ChevronRight, MessageCircle, Phone } from 'lucide-react';
import type { Enquiry } from '../../types';
import { whatsappUrl } from '../../contact';
import {
  enquirySourceLabel,
  enquiryStageClass,
  enquiryStageLabel,
  followUpUrgency,
  formatFollowUpAt,
  formatReceivedAt,
} from './enquiryList';

type EnquiryCardProps = {
  enquiry: Enquiry;
  canContact: boolean;
  canViewPhone: boolean;
  onOpen: () => void;
};

function stopCardNavigation(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
  event.stopPropagation();
}

function FollowUpLabel({ enquiry }: { enquiry: Enquiry }) {
  if (!enquiry.nextFollowUpAt) return null;
  const urgency = followUpUrgency(enquiry.nextFollowUpAt);
  const details = formatFollowUpAt(enquiry.nextFollowUpAt);
  const presentation = {
    overdue: { label: 'Overdue', className: 'font-semibold text-red-700' },
    due_today: { label: 'Due today', className: 'font-semibold text-amber-800' },
    upcoming: { label: 'Upcoming', className: 'text-slate-600' },
  }[urgency ?? 'upcoming'];
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${presentation.className}`}>
      <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{presentation.label} · {details}</span>
    </span>
  );
}

function EnquiryActions({
  enquiry,
  customer,
  canContact,
  canViewPhone,
  onOpen,
}: EnquiryCardProps & { customer: string }) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      {canContact && enquiry.phone && canViewPhone && (
        <>
          <a
            href={`tel:${enquiry.phone}`}
            onClick={stopCardNavigation}
            aria-label={`Call ${customer} at ${enquiry.phone}`}
            title={`Call ${customer}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-primary focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={whatsappUrl(enquiry.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={stopCardNavigation}
            aria-label={`Message ${customer} on WhatsApp`}
            title={`Message ${customer} on WhatsApp`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-700 outline-none transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </a>
        </>
      )}
      <button
        type="button"
        onClick={event => { stopCardNavigation(event); onOpen(); }}
        aria-label={`View enquiry from ${customer}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-admin-primary outline-none transition hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus"
      >
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function StatusBadge({ enquiry }: { enquiry: Enquiry }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${enquiryStageClass[enquiry.stage]}`}>
      {enquiryStageLabel(enquiry.stage)}
    </span>
  );
}

export function EnquiryCard({ enquiry, canContact, onOpen }: EnquiryCardProps) {
  const service = enquiry.shootType || enquiry.preferredEvent || 'Service not decided';
  const source = enquirySourceLabel(enquiry.source);
  const customer = enquiry.name || 'Unnamed customer';

  const openFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open enquiry from ${customer}`}
      onClick={onOpen}
      onKeyDown={openFromKeyboard}
      className="group min-h-[108px] cursor-pointer rounded-xl border border-admin-border bg-admin-surface text-left shadow-[0_2px_9px_rgba(62,56,46,0.025)] outline-none transition-[border-color,background-color,box-shadow,transform] hover:border-admin-primary/35 hover:bg-white hover:shadow-[0_4px_14px_rgba(62,56,46,0.055)] focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-canvas active:scale-[0.995] lg:min-h-0 lg:rounded-none lg:border-0 lg:border-b lg:shadow-none lg:last:border-b-0 lg:hover:bg-admin-muted/55 lg:hover:shadow-none lg:active:scale-100"
    >
      <div className="px-3 py-2.5 lg:hidden">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[15px] font-semibold leading-5 text-admin-text" title={customer}>{customer}</h3>
          <StatusBadge enquiry={enquiry} />
        </div>

        <p className="mt-0.5 min-w-0 truncate text-xs leading-4 text-admin-subtle" title={`${service} · ${source}`}>
          <span className="text-admin-secondary">{service}</span>
          <span aria-hidden="true" className="px-1.5 text-admin-border-strong">·</span>
          {source}
        </p>

        <div className="mt-0.5 flex min-h-11 min-w-0 items-center gap-1.5">
          <div className="min-w-0 flex-1 text-xs leading-4 text-admin-subtle">
            <p className="flex min-w-0 items-center gap-1.5">
              {enquiry.phone && <span className="min-w-0 truncate font-medium text-admin-secondary">{enquiry.phone}</span>}
              {enquiry.phone && <span aria-hidden="true" className="text-admin-border-strong">·</span>}
              <span className="shrink-0">{formatReceivedAt(enquiry.createdAt)}</span>
            </p>
            {enquiry.nextFollowUpAt && (
              <p className="mt-0.5 min-w-0"><FollowUpLabel enquiry={enquiry} /></p>
            )}
          </div>
          <EnquiryActions enquiry={enquiry} customer={customer} canContact={canContact} canViewPhone={canContact} onOpen={onOpen} />
        </div>
      </div>

      <div className="hidden min-h-[68px] grid-cols-[minmax(0,1.25fr)_minmax(9rem,0.85fr)_minmax(7.5rem,0.65fr)_minmax(11rem,1fr)_auto] items-center gap-x-5 px-5 py-3 lg:grid">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <h3 className="min-w-0 truncate text-[15px] font-semibold leading-5 text-admin-text" title={customer}>{customer}</h3>
            <StatusBadge enquiry={enquiry} />
          </div>
          {enquiry.phone && <p className="mt-1 truncate text-xs font-medium text-admin-secondary">{enquiry.phone}</p>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-admin-secondary" title={service}>{service}</p>
          <p className="mt-0.5 truncate text-xs text-admin-subtle">{source}</p>
        </div>
        <p className="truncate text-sm text-admin-secondary">{formatReceivedAt(enquiry.createdAt)}</p>
        <div className="min-w-0 text-xs"><FollowUpLabel enquiry={enquiry} /></div>
        <EnquiryActions enquiry={enquiry} customer={customer} canContact={canContact} canViewPhone={canContact} onOpen={onOpen} />
      </div>
    </article>
  );
}

export function EnquiryCardSkeleton() {
  return (
    <div className="min-h-[108px] animate-pulse rounded-xl border border-admin-border bg-admin-surface lg:min-h-0 lg:rounded-none lg:border-0 lg:border-b">
      <div className="px-3 py-2.5 lg:hidden">
        <div className="flex items-center justify-between gap-3"><div className="h-4 w-3/5 rounded bg-admin-muted" /><div className="h-5 w-14 rounded-full bg-admin-muted" /></div>
        <div className="mt-2 h-3 w-4/5 rounded bg-admin-muted" />
        <div className="mt-1 flex min-h-11 items-center justify-between gap-3"><div className="h-3 w-2/5 rounded bg-admin-muted" /><div className="flex gap-1"><div className="h-10 w-10 rounded-xl bg-admin-muted" /><div className="h-10 w-10 rounded-xl bg-admin-muted" /><div className="h-10 w-10 rounded-xl bg-admin-muted" /></div></div>
      </div>
      <div className="hidden min-h-[68px] grid-cols-[minmax(0,1.25fr)_minmax(9rem,0.85fr)_minmax(7.5rem,0.65fr)_minmax(11rem,1fr)_auto] items-center gap-x-5 px-5 py-3 lg:grid">
        <div><div className="h-4 w-3/5 rounded bg-admin-muted" /><div className="mt-2 h-3 w-2/5 rounded bg-admin-muted" /></div>
        <div><div className="h-4 w-28 rounded bg-admin-muted" /><div className="mt-2 h-3 w-16 rounded bg-admin-muted" /></div>
        <div className="h-4 w-24 rounded bg-admin-muted" />
        <div className="h-4 w-36 rounded bg-admin-muted" />
        <div className="flex gap-1"><div className="h-10 w-10 rounded-xl bg-admin-muted" /><div className="h-10 w-10 rounded-xl bg-admin-muted" /><div className="h-10 w-10 rounded-xl bg-admin-muted" /></div>
      </div>
    </div>
  );
}
