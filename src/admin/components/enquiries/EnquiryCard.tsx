import type { KeyboardEvent, MouseEvent } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Globe, Megaphone, Phone, Store, Users } from 'lucide-react';
import type { Enquiry } from '../../types';
import { WhatsAppIcon } from './WhatsAppIcon';
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
  if (!enquiry.nextFollowUpAt) {
    if (enquiry.stage === 'booked') return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Booking confirmed</span>;
    if (enquiry.stage !== 'follow_up') return <span className="text-xs text-admin-subtle">No follow-up scheduled</span>;
    return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">Follow-up required</span>;
  }
  const urgency = followUpUrgency(enquiry.nextFollowUpAt);
  const details = formatFollowUpAt(enquiry.nextFollowUpAt);
  const presentation = {
    overdue: { label: 'Overdue follow-up', className: 'border-rose-200 bg-rose-50 text-rose-600', icon: AlertTriangle },
    due_today: { label: `Follow-up: ${formatReceivedAt(enquiry.nextFollowUpAt)}`, className: 'border-amber-200 bg-amber-50 text-amber-800', icon: CalendarClock },
    upcoming: { label: `Follow-up: ${details}`, className: 'border-slate-200 bg-slate-50 text-slate-600', icon: CalendarClock },
  }[urgency ?? 'upcoming'];
  const Icon = presentation.icon;
  return (
    <span title={details} className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs leading-4 ${presentation.className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{presentation.label}</span>
    </span>
  );
}

function SourceLabel({ enquiry }: { enquiry: Enquiry }) {
  const source = enquiry.source;
  const Icon = source === 'whatsapp' ? WhatsAppIcon : source === 'phone' ? Phone : source === 'walk_in' ? Store : source === 'referral' ? Users : ['facebook', 'instagram', 'ads', 'google_business'].includes(source) ? Megaphone : Globe;
  const color = ['whatsapp', 'walk_in'].includes(source) ? 'text-emerald-700' : ['facebook', 'instagram', 'ads', 'google_business'].includes(source) ? 'enquiry-source-social' : 'text-admin-subtle';
  return <p className={`enquiry-source mt-1 flex items-center gap-1 text-xs ${color}`}><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><span className="enquiry-source-prefix">Source: </span>{enquirySourceLabel(source)}</span></p>;
}

const AVATAR_COLORS = ['bg-emerald-100 text-emerald-800 ring-emerald-200', 'bg-rose-100 text-rose-700 ring-rose-200', 'bg-purple-100 text-purple-700 ring-purple-200', 'bg-sky-100 text-sky-700 ring-sky-200', 'bg-amber-100 text-amber-700 ring-amber-200', 'bg-indigo-100 text-indigo-700 ring-indigo-200'];

function receivedDetail(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes >= 0 && minutes < 1) return 'Just now';
  if (minutes >= 1 && minutes < 60) return `${minutes} mins ago`;
  if (minutes >= 60 && minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
}

function EnquiryActions({
  enquiry,
  customer,
  canContact,
  canViewPhone,
  onOpen,
}: EnquiryCardProps & { customer: string }) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      {canContact && enquiry.phone && canViewPhone && (
        <>
          <a
            href={`tel:${enquiry.phone}`}
            onClick={stopCardNavigation}
            aria-label={`Call ${customer} at ${enquiry.phone}`}
            title={`Call ${customer}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 outline-none transition hover:bg-admin-muted hover:text-admin-primary focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {enquiry.stage === 'booked' && <span className="enquiry-contact-label">Call</span>}
          </a>
          <a
            href={whatsappUrl(enquiry.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={stopCardNavigation}
            aria-label={`Message ${customer} on WhatsApp`}
            title={`Message ${customer} on WhatsApp`}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 outline-none transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {enquiry.stage === 'booked' && <span className="enquiry-contact-label">Chat</span>}
          </a>
        </>
      )}
      <button
        type="button"
        onClick={event => { stopCardNavigation(event); onOpen(); }}
        aria-label={`View enquiry from ${customer}`}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 outline-none transition hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus"
      >
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function StatusBadge({ enquiry }: { enquiry: Enquiry }) {
  return (
    <span className={`enquiry-status-badge inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${enquiryStageClass[enquiry.stage]}`}>
      {enquiryStageLabel(enquiry.stage)}
    </span>
  );
}

export function EnquiryCard({ enquiry, canContact, canViewPhone, onOpen }: EnquiryCardProps) {
  const service = enquiry.shootType || enquiry.preferredEvent || 'Service not decided';
  const customer = enquiry.name || 'Unnamed customer';
  const avatarColor = AVATAR_COLORS[Array.from(customer).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const openFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); }
  };

  return (
    <article role="link" tabIndex={0} aria-label={`Open enquiry from ${customer}`} onClick={onOpen} onKeyDown={openFromKeyboard}
      className={`enquiry-row group cursor-pointer outline-none transition-colors hover:bg-emerald-50/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus ${enquiry.stage === 'booked' ? 'enquiry-row-confirmed' : ''}`}>
      <div className="enquiry-customer flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={`enquiry-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${avatarColor}`}><span className="enquiry-avatar-desktop">{customer.charAt(0).toUpperCase()}</span><span className="enquiry-avatar-mobile hidden">{customer.trim().split(/\s+/).length > 1 ? customer.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() : customer.slice(0, 2).toUpperCase()}</span></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="break-words text-sm font-semibold leading-5 text-admin-text">{customer}</h3>
            <StatusBadge enquiry={enquiry} />
          </div>
          {enquiry.phone && <p className="mt-1 break-all text-xs text-admin-subtle">{canViewPhone ? enquiry.phone : 'Phone hidden'}</p>}
        </div>
      </div>
      <div className="enquiry-service min-w-0">
        <p className={`enquiry-service-name text-xs font-medium leading-5 ${enquiry.shootType || enquiry.preferredEvent ? 'text-admin-secondary' : 'italic text-admin-subtle'}`}>{service}</p>
        <SourceLabel enquiry={enquiry} />
      </div>
      <div className="enquiry-received min-w-0">
        <time className="enquiry-received-mobile hidden" dateTime={enquiry.createdAt} title={formatReceivedAt(enquiry.createdAt)}>{formatReceivedAt(enquiry.createdAt).replace(/^Today, /, '').replace(/^Yesterday, .*/, 'Yesterday')}</time>
        <div className="enquiry-received-desktop">
        <p className="text-xs leading-5 text-admin-secondary">{formatReceivedAt(enquiry.createdAt)}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{receivedDetail(enquiry.createdAt)}</p>
      </div>
      </div>
      <div className={`enquiry-follow-up min-w-0 ${!enquiry.nextFollowUpAt && enquiry.stage !== 'follow_up' ? 'enquiry-follow-up-empty' : ''}`}><FollowUpLabel enquiry={enquiry} /></div>
      <div className="enquiry-actions"><EnquiryActions enquiry={enquiry} customer={customer} canContact={canContact} canViewPhone={canViewPhone} onOpen={onOpen} /></div>
    </article>
  );
}

export function EnquiryCardSkeleton() {
  return <div className="enquiry-row animate-pulse" aria-hidden="true">
    <div className="enquiry-customer flex items-center gap-3"><div className="h-10 w-10 shrink-0 rounded-full bg-admin-muted" /><div className="w-full space-y-2"><div className="h-4 w-3/4 rounded bg-admin-muted" /><div className="h-3 w-1/2 rounded bg-admin-muted" /></div></div>
    <div className="enquiry-service h-4 w-3/4 rounded bg-admin-muted" />
    <div className="enquiry-received h-4 w-3/4 rounded bg-admin-muted" />
    <div className="enquiry-follow-up h-7 w-3/4 rounded-full bg-admin-muted" />
    <div className="enquiry-actions h-9 w-28 rounded bg-admin-muted" />
  </div>;
}
