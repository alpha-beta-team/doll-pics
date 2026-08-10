import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  Booking,
  BookingPayment,
  BookingStatus,
  BookingWritePayload,
  Package,
  PaymentMethod,
  TeamMember,
  WhatsAppMessageSummary,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import {
  deliveryWhatsAppMessage,
  deliveryWhatsAppUrl,
  whatsappDigits,
} from '../../lib/pricing';
import { bookingDurationLabel, formatTimeWindow } from '../../shared/bookingTime';
import { FollowUpShortcuts } from '../components/FollowUpShortcuts';
import { dateTimeLocalInKolkata, followUpDateError, kolkataLocalToIso } from '../components/followUp.utils';
import { CustomerLookupPanel } from '../components/CustomerLookupPanel';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import { VoiceNotesPanel } from '../components/VoiceNotesPanel';
import { ApiError } from '../api/http';
import type { WhatsAppTemplateId } from '../components/whatsappTemplates';
import { ImportantDatesPanel } from '../components/ImportantDatesPanel';

const statusStyles: Record<BookingStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  shoot_completed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
};

const calendarStatusStyles = {
  not_applicable: 'bg-slate-100 text-slate-600',
  pending: 'bg-blue-100 text-blue-700',
  synced: 'bg-emerald-100 text-emerald-700',
  dry_run: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-700',
} as const;

const calendarStatusLabels = {
  not_applicable: 'Not required',
  pending: 'Waiting to sync',
  synced: 'Synced',
  dry_run: 'Dry run checked',
  failed: 'Needs attention',
} as const;

function formatDay(value?: string) {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function money(value: number | null | undefined) {
  if (value == null) return 'Not decided';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 text-sm text-slate-800">{children}</div></div>;
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</h2>{action}</div>{children}</section>;
}

export function BookingDetailPage() {
  const { canManage: canManageBooking, isReadOnly } = useFeatureAccess('bookings');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { canManage: canManageIntegrations } = useFeatureAccess('integrations');
  const confirmDialog = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [paymentModal, setPaymentModal] = useState<BookingPayment | 'new' | null>(null);
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [driveGalleryUrl, setDriveGalleryUrl] = useState('');
  const [driveEditedUrl, setDriveEditedUrl] = useState('');
  const [driveRawsUrl, setDriveRawsUrl] = useState('');
  const [driveNotes, setDriveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState<WhatsAppTemplateId | null>(null);
  const [reviewUrl, setReviewUrl] = useState('');

  const sync = useCallback((value: Booking) => {
    setBooking(value);
    setDriveGalleryUrl(value.driveGalleryUrl);
    setDriveEditedUrl(value.driveEditedUrl);
    setDriveRawsUrl(value.driveRawsUrl);
    setDriveNotes(value.driveNotes);
    setFollowUpAt(value.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(value.nextFollowUpAt)) : '');
    setFollowUpNote(value.followUpNote);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [row, packageRows, memberRows, messageRows, reviewConfig] = await Promise.all([
        api.getBooking(id),
        canManageBooking ? api.getPackages() : Promise.resolve<Package[]>([]),
        canManageBooking ? api.getTeamMembers() : Promise.resolve<TeamMember[]>([]),
        canManageBooking ? api.getBookingWhatsAppMessages(id).catch(() => []) : Promise.resolve<WhatsAppMessageSummary[]>([]),
        canManageBooking ? api.getReviewConfig().catch(() => ({ googleReviewUrl: '' })) : Promise.resolve({ googleReviewUrl: '' }),
      ]);
      if (!row) throw new Error('Booking not found');
      sync(row);
      setPackages(packageRows);
      setTeamMembers(memberRows);
      setMessages(messageRows);
      setReviewUrl(reviewConfig.googleReviewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [canManageBooking, id, sync]);

  useEffect(() => { void load(); }, [load]);

  const run = async (operation: () => Promise<Booking>) => {
    setSaving(true);
    setError('');
    try { sync(await operation()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Operation failed'); }
    finally { setSaving(false); }
  };

  const transition = async (status: BookingStatus) => {
    if (!booking) return;
    const restoring = booking.status === 'cancelled';
    const copy: Record<BookingStatus, { title: string; description: string; confirmLabel: string }> = {
      draft: {
        title: 'Move booking back to draft?',
        description: 'The booking will no longer be treated as confirmed.',
        confirmLabel: 'Move to draft',
      },
      confirmed: {
        title: restoring ? 'Restore booking?' : 'Confirm this booking?',
        description: restoring
          ? 'The booking will be restored to confirmed status.'
          : 'The booking will be marked as confirmed and ready for the shoot.',
        confirmLabel: restoring ? 'Restore booking' : 'Confirm booking',
      },
      shoot_completed: {
        title: restoring ? 'Restore booking?' : 'Mark shoot as completed?',
        description: restoring
          ? 'The booking will be restored to shoot completed status.'
          : 'This confirms the photography session has been completed.',
        confirmLabel: restoring ? 'Restore booking' : 'Mark completed',
      },
      delivered: {
        title: 'Mark booking as delivered?',
        description: 'This confirms the completed gallery was delivered to the customer.',
        confirmLabel: 'Mark delivered',
      },
      cancelled: {
        title: 'Cancel this booking?',
        description: `The booking for ${booking.customerName} will be cancelled. You can restore it later if needed.`,
        confirmLabel: 'Cancel booking',
      },
    };
    const confirmed = await confirmDialog({
      ...copy[status],
      variant: status === 'cancelled' ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.transitionBooking(booking.id, status);
      sync(updated);
      if (status === 'cancelled') setMessageOpen('booking_cancelled');
    } catch (err) {
      if (restoring && err instanceof ApiError && err.code === 'UNTIMED_CONFIRMATION_REQUIRED') {
        const accepted = await confirmDialog({
          title: 'Another booking has no time',
          description: 'There is an active booking on this date without a time. Restore only after checking it will not clash.',
          confirmLabel: 'Restore booking',
        });
        if (accepted) {
          try { sync(await api.transitionBooking(booking.id, status, true)); }
          catch (retryError) { setError(retryError instanceof Error ? retryError.message : 'Restore failed'); }
        }
      } else {
        setError(err instanceof Error ? err.message : 'Operation failed');
      }
    } finally { setSaving(false); }
  };

  const actions = useMemo(() => {
    if (!booking) return [];
    if (booking.status === 'draft') return [
      { label: 'Confirm booking', status: 'confirmed' as const, primary: true },
      { label: 'Cancel', status: 'cancelled' as const },
    ];
    if (booking.status === 'confirmed') return [
      { label: 'Mark shoot completed', status: 'shoot_completed' as const, primary: true },
      { label: 'Correct to draft', status: 'draft' as const },
      { label: 'Cancel', status: 'cancelled' as const },
    ];
    if (booking.status === 'shoot_completed') return [
      { label: 'Correct to confirmed', status: 'confirmed' as const },
    ];
    if (booking.status === 'delivered') return [
      { label: 'Correct to shoot completed', status: 'shoot_completed' as const },
    ];
    return [{ label: `Restore to ${(booking.statusBeforeCancellation || 'draft').replace('_', ' ')}`, status: booking.statusBeforeCancellation || 'draft', primary: true }];
  }, [booking]);

  const saveEdit = async (payload: BookingWritePayload) => {
    if (!booking) return;
    const scheduleChanged = payload.bookingDate !== booking.bookingDate
      || payload.startTime !== booking.startTime || payload.endTime !== booking.endTime;
    sync(await api.updateBooking(booking.id, payload));
    setEditing(false);
    if (scheduleChanged) setMessageOpen('booking_rescheduled');
  };

  const saveFollowUp = () => {
    if (!booking || !followUpAt) return setError('Choose a follow-up date and time.');
    const validationError = followUpDateError(followUpAt);
    if (validationError) return setError(validationError);
    void run(() => api.scheduleBookingFollowUp(booking.id, kolkataLocalToIso(followUpAt), followUpNote));
  };

  const saveDrive = () => {
    if (!booking) return;
    void run(() => api.updateBooking(booking.id, { driveGalleryUrl, driveEditedUrl, driveRawsUrl, driveNotes }));
  };

  const openDelivery = () => {
    if (!booking) return;
    const url = deliveryWhatsAppUrl(booking.customerPhone, deliveryContext);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const markDelivered = async () => {
    if (!booking) return;
    const confirmed = await confirmDialog({
      title: 'Mark gallery as delivered?',
      description: 'Confirm that the gallery was sent to the customer. The booking will move to delivered status.',
      confirmLabel: 'Mark delivered',
    });
    if (!confirmed) return;
    void run(() => api.completeBookingDelivery(booking.id));
  };

  const toggleNotifications = () => {
    if (!booking) return;
    if (!booking.whatsappOptIn) return setError('Record explicit WhatsApp consent before enabling notifications.');
    void run(() => api.updateBooking(booking.id, {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      whatsappNotificationsEnabled: !booking.whatsappNotificationsEnabled,
    }));
  };

  const retryMessage = async (messageId: string) => {
    if (!booking) return;
    const confirmed = await confirmDialog({
      title: 'Retry WhatsApp notification?',
      description: 'The failed notification will be queued to send again.',
      confirmLabel: 'Retry notification',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await api.retryBookingWhatsAppMessage(booking.id, messageId);
      setMessages(await api.getBookingWhatsAppMessages(booking.id));
    } catch (err) { setError(err instanceof Error ? err.message : 'Retry failed'); }
    finally { setSaving(false); }
  };

  const retryCalendarSync = async () => {
    if (!booking) return;
    const confirmed = await confirmDialog({
      title: 'Retry Google Calendar sync?',
      description: 'The latest booking details will be queued for the shared studio calendar.',
      confirmLabel: 'Retry sync',
    });
    if (!confirmed) return;
    void run(() => api.retryBookingCalendarSync(booking.id));
  };

  const deletePayment = async (payment: BookingPayment) => {
    if (!booking) return;
    const confirmed = await confirmDialog({
      title: 'Delete payment?',
      description: `${money(payment.amount)} will be removed from this booking's payment history. This action cannot be undone.`,
      confirmLabel: 'Delete payment',
      variant: 'danger',
    });
    if (!confirmed) return;
    void run(() => api.removeBookingPayment(booking.id, payment.id));
  };

  const updateReview = async (action: 'requested' | 'received' | 'skipped' | 'reopened') => {
    if (!booking) return;
    if (action === 'skipped' || action === 'reopened') {
      const accepted = await confirmDialog({
        title: action === 'skipped' ? 'Skip this review request?' : 'Reopen review follow-up?',
        description: action === 'skipped' ? 'The review task will be closed without requesting a review.' : 'The review task will become active again.',
        confirmLabel: action === 'skipped' ? 'Skip review' : 'Reopen',
        variant: action === 'skipped' ? 'danger' : 'primary',
      });
      if (!accepted) return;
    }
    setSaving(true); setError('');
    try { sync(await api.updateBookingReview(booking.id, action)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update review status.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  if (!booking) return <div className="space-y-4"><Link to="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" />Back to bookings</Link><div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error || 'Booking not found'}</div></div>;

  const hasDeliveryLink = Boolean(driveGalleryUrl || driveEditedUrl || driveRawsUrl);
  const deliveryContext = {
    customerName: booking.customerName,
    shootType: booking.shootType,
    galleryUrl: driveGalleryUrl,
    editedUrl: driveEditedUrl,
    rawsUrl: driveRawsUrl,
    driveNotes,
  };
  const deliveryDirty = driveGalleryUrl !== booking.driveGalleryUrl
    || driveEditedUrl !== booking.driveEditedUrl
    || driveRawsUrl !== booking.driveRawsUrl
    || driveNotes !== booking.driveNotes;
  const followUpOverdue = booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now();
  const calendarStatus = booking.calendarSyncStatus || 'not_applicable';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={() => navigate('/admin/bookings')} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to bookings</button>
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error}<button className="ml-auto" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}

      <header className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start">
        <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold text-slate-900">{booking.customerName}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[booking.status]}`}>{booking.status.replace('_', ' ')}</span></div><p className="mt-2 text-sm text-slate-500">{booking.packageName || booking.shootType || 'Photography session'} · {formatDay(booking.bookingDate)}{booking.startTime && booking.endTime ? ` · ${formatTimeWindow(booking.startTime, booking.endTime)}` : ''}</p></div>
        {canManageBooking ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMessageOpen('booking_confirmation')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</button><button onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><Pencil className="h-4 w-4" />Edit</button>{actions.map(action => <button key={action.label} disabled={saving} onClick={() => void transition(action.status)} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium ${'primary' in action && action.primary ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700'}`}>{action.label}</button>)}</div> : isReadOnly ? <ReadOnlyNotice /> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Customer and booking">
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Phone"><a className="text-blue-600" href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a></Field><Field label="Email">{booking.customerEmail ? <a className="text-blue-600" href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a> : '—'}</Field><Field label="Photography service">{booking.shootType || '—'}</Field><Field label="Preferred event">{booking.preferredEvent || '—'}</Field><Field label="Booking date">{formatDay(booking.bookingDate)}</Field><Field label="Time window">{formatTimeWindow(booking.startTime, booking.endTime)}{bookingDurationLabel(booking.startTime, booking.endTime) ? ` · ${bookingDurationLabel(booking.startTime, booking.endTime)}` : ''}</Field><Field label="Location">{booking.location || '—'}</Field><Field label="Package">{booking.packageName || 'No package'}</Field><Field label="Assigned to">{booking.assignedTeamMemberName || 'Unassigned'}</Field></div>
          {booking.notes && <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm whitespace-pre-wrap text-slate-700">{booking.notes}</div>}
        </Card>

        {canViewPayments && <Card title="Payment" action={<button onClick={() => setPaymentModal('new')} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600"><Plus className="h-4 w-4" />Add payment</button>}>
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center"><div><p className="text-xs text-slate-500">Agreed</p><p className="mt-1 font-semibold text-slate-900">{money(booking.agreedTotal)}</p></div><div><p className="text-xs text-slate-500">Paid</p><p className="mt-1 font-semibold text-emerald-700">{money(booking.paymentSummary.amountPaid)}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className="mt-1 font-semibold text-slate-900">{money(booking.paymentSummary.balanceDue)}</p></div></div>
          <div className="mt-4 flex items-center justify-between text-sm"><span className="capitalize text-slate-600">{booking.paymentSummary.status}</span><span className="text-slate-500">Due {formatDay(booking.paymentDueDate)}</span></div>
          <div className="mt-4 divide-y divide-slate-100">{booking.payments.map(payment => <div key={payment.id} className="flex items-center gap-3 py-3"><CircleDollarSign className="h-5 w-5 text-emerald-600" /><div className="min-w-0 flex-1"><p className="font-medium text-slate-800">{money(payment.amount)}</p><p className="text-xs capitalize text-slate-500">{formatDay(payment.paidAt)} · {payment.method.replace('_', ' ')}{payment.note ? ` · ${payment.note}` : ''}</p></div><><button onClick={() => setPaymentModal(payment)} className="p-2 text-slate-500" aria-label="Edit payment"><Pencil className="h-4 w-4" /></button><button onClick={() => void deletePayment(payment)} className="p-2 text-red-500" aria-label="Delete payment"><Trash2 className="h-4 w-4" /></button></></div>)}{!booking.payments.length && <p className="py-5 text-center text-sm text-slate-500">No payments recorded.</p>}</div>
        </Card>}

        {canManageBooking && <Card title="Next follow-up" action={booking.nextFollowUpAt ? <button onClick={() => void run(() => api.completeBookingFollowUp(booking.id))} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" />Complete</button> : undefined}>
          {booking.nextFollowUpAt && <div className={`mb-4 rounded-lg p-3 text-sm ${followUpOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}><Clock3 className="mr-2 inline h-4 w-4" />{formatDateTime(booking.nextFollowUpAt)}{followUpOverdue ? ' · Overdue' : ''}</div>}
          <FollowUpShortcuts value={followUpAt} onChange={setFollowUpAt} disabled={saving} /><input value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="What needs to happen?" className="mt-3 h-12 w-full rounded-xl border border-slate-300 px-3 text-sm" /><button onClick={saveFollowUp} disabled={saving || !followUpAt} className="mt-3 min-h-11 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{booking.nextFollowUpAt ? 'Reschedule follow-up' : 'Schedule follow-up'}</button>
        </Card>}

        {canManageBooking && <Card title="WhatsApp automation" action={<button onClick={() => void load()} className="text-slate-400" aria-label="Refresh messages"><RefreshCw className="h-4 w-4" /></button>}>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Consent">{booking.whatsappOptIn ? `Recorded ${formatDateTime(booking.whatsappOptInAt)}` : 'Not recorded'}</Field><Field label="Source">{booking.whatsappOptInSource || '—'}</Field><Field label="Opt-out">{booking.whatsappOptOutAt ? formatDateTime(booking.whatsappOptOutAt) : 'No'}</Field><Field label="Language">English</Field></div>
          <button onClick={toggleNotifications} disabled={!booking.whatsappOptIn || Boolean(booking.whatsappOptOutAt) || saving} className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${booking.whatsappNotificationsEnabled ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-700'} disabled:opacity-50`}>{booking.whatsappNotificationsEnabled ? 'Automated updates enabled' : 'Enable automated updates'}</button>
          <div className="mt-5 divide-y divide-slate-100">{messages.slice(0, 8).map(message => <div key={message.id} className="flex items-center gap-3 py-3"><MessageCircle className="h-4 w-4 text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{message.eventType.replace(/_/g, ' ')}</p><p className="text-xs text-slate-500">{formatDateTime(message.scheduledAt)} · {message.status}</p>{message.failureReason && <p className="mt-1 text-xs text-red-600">{message.failureReason}</p>}</div>{message.status === 'failed' && <button onClick={() => void retryMessage(message.id)} className="text-xs font-medium text-blue-600">Retry</button>}</div>)}{!messages.length && <p className="py-4 text-center text-sm text-slate-500">No automated messages yet.</p>}</div>
        </Card>}

        <Card
          title="Google Calendar"
          action={canManageIntegrations ? (
            <button
              type="button"
              onClick={() => void retryCalendarSync()}
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />Retry
            </button>
          ) : undefined}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${calendarStatusStyles[calendarStatus]}`}>
                  {calendarStatusLabels[calendarStatus]}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {booking.calendarSyncedAt ? `Last checked ${formatDateTime(booking.calendarSyncedAt)}` : 'No completed sync yet'}
                </p>
              </div>
            </div>
            {booking.googleCalendarHtmlLink && (
              <a
                href={booking.googleCalendarHtmlLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Open in Google Calendar <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {calendarStatus === 'failed' && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Calendar could not be updated. {canManageIntegrations ? 'Use Retry after checking the integration.' : 'Please tell the owner.'}
              {booking.calendarSyncErrorCode ? ` Code: ${booking.calendarSyncErrorCode}` : ''}
            </p>
          )}
          {calendarStatus === 'not_applicable' && (
            <p className="mt-4 text-sm text-slate-500">Calendar events are created for confirmed bookings. Completed and delivered shoots remain as history.</p>
          )}
        </Card>

        {canManageBooking && booking.status === 'delivered' && <Card title="Review request">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${booking.reviewStatus === 'received' ? 'bg-emerald-100 text-emerald-700' : booking.reviewStatus === 'skipped' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>{booking.reviewStatus.replace('_', ' ')}</span><p className="mt-2 text-sm text-slate-500">Requested {booking.reviewRequestCount} time{booking.reviewRequestCount === 1 ? '' : 's'}{booking.reviewLastRequestedAt ? ` · last ${formatDateTime(booking.reviewLastRequestedAt)}` : ''}</p></div></div>
          <div className="mt-4 flex flex-wrap gap-2">{!['received', 'skipped'].includes(booking.reviewStatus) && <><button type="button" disabled={saving || !reviewUrl || Boolean(booking.whatsappOptOutAt)} onClick={() => setMessageOpen('review_request')} className="min-h-11 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-50">{booking.reviewRequestCount ? 'Request again' : 'Request review'}</button><button type="button" disabled={saving} onClick={() => void updateReview('received')} className="min-h-11 rounded-lg border border-emerald-300 px-3 text-sm font-semibold text-emerald-700">Mark received</button><button type="button" disabled={saving} onClick={() => void updateReview('skipped')} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600">Skip</button></>}{['received', 'skipped'].includes(booking.reviewStatus) && <button type="button" disabled={saving} onClick={() => void updateReview('reopened')} className="min-h-11 rounded-lg border border-blue-300 px-3 text-sm font-semibold text-blue-700">Reopen</button>}</div>
          {booking.whatsappOptOutAt && !['received', 'skipped'].includes(booking.reviewStatus) && <p className="mt-3 text-sm text-amber-700">Review template is disabled because this customer opted out of WhatsApp.</p>}
          {!!booking.reviewHistory.length && <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{booking.reviewHistory.slice(0, 5).map(entry => <p key={entry.id || entry.changedAt} className="py-2 text-xs text-slate-500"><span className="capitalize">{entry.action}</span> · {formatDateTime(entry.changedAt)} · {entry.changedBy.name}</p>)}</div>}
        </Card>}
      </div>

      <CustomerLookupPanel phone={booking.customerPhone} current={{ type: 'booking', id: booking.id }} />
      {canManageBooking && <ImportantDatesPanel phone={booking.customerPhone} customerName={booking.customerName} email={booking.customerEmail} source={{ type: 'booking', id: booking.id }} />}
      {canManageBooking && <VoiceNotesPanel recordType="booking" recordId={booking.id} />}

      <Card title="Schedule history">
        <div className="divide-y divide-slate-100">
          {booking.scheduleHistory.map(entry => <div key={entry.id || entry.changedAt} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.action === 'cancelled' ? 'bg-red-100 text-red-700' : entry.action === 'restored' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{entry.action}</span><span className="text-xs text-slate-500">{formatDateTime(entry.changedAt)} · {entry.changedBy.name}</span></div><div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-[1fr_auto_1fr]"><span>{formatDay(entry.previous.bookingDate)} · {formatTimeWindow(entry.previous.startTime, entry.previous.endTime)} · {entry.previous.status.replace('_', ' ')}</span><span aria-hidden="true">→</span><span>{formatDay(entry.next.bookingDate)} · {formatTimeWindow(entry.next.startTime, entry.next.endTime)} · {entry.next.status.replace('_', ' ')}</span></div></div>)}
          {!booking.scheduleHistory.length && <p className="py-4 text-center text-sm text-slate-500">No schedule changes yet.</p>}
        </div>
      </Card>

      {canManageBooking && <Card title="Delivery / Google Drive" action={<button onClick={saveDrive} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save links</button>}>
        <div className="grid gap-3 sm:grid-cols-3">{[['Gallery folder', driveGalleryUrl, setDriveGalleryUrl], ['Edited photos', driveEditedUrl, setDriveEditedUrl], ['RAW files', driveRawsUrl, setDriveRawsUrl]].map(([label, value, setter]) => <label key={label as string} className="text-sm text-slate-700">{label as string}<div className="mt-1 flex gap-2"><input value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />{value && <a href={value as string} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 p-2"><ExternalLink className="h-4 w-4" /></a>}</div></label>)}</div>
        <textarea value={driveNotes} onChange={e => setDriveNotes(e.target.value)} placeholder="Delivery note" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
        {hasDeliveryLink && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp message preview</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{deliveryWhatsAppMessage(deliveryContext)}</p></div>}
        {deliveryDirty && <p className="mt-3 text-sm text-amber-700">Save the delivery links before sharing or marking this booking delivered.</p>}
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={openDelivery} disabled={!hasDeliveryLink || deliveryDirty || !whatsappDigits(booking.customerPhone)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><MessageCircle className="h-4 w-4" />Review and open WhatsApp</button>{booking.status === 'shoot_completed' && <button onClick={() => void markDelivered()} disabled={!hasDeliveryLink || deliveryDirty || saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><CalendarCheck className="h-4 w-4" />Mark delivered</button>}{booking.deliverySentAt && <span className="inline-flex items-center gap-1.5 text-sm text-violet-700"><CheckCircle className="h-4 w-4" />Delivered {formatDateTime(booking.deliverySentAt)}</span>}</div>
      </Card>}

      {canManageBooking && editing && <BookingFormModal booking={booking} packages={packages} teamMembers={teamMembers} onClose={() => setEditing(false)} onSave={saveEdit} />}
      {canManageBooking && messageOpen && <WhatsAppComposer initialTemplate={messageOpen} context={{ customerName: booking.customerName, phone: booking.customerPhone, service: booking.shootType || booking.packageName, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime, location: booking.location, balanceDue: canViewPayments ? booking.paymentSummary.balanceDue : undefined, paymentDueDate: canViewPayments ? booking.paymentDueDate : undefined, reviewUrl, consentRecorded: booking.whatsappOptIn, optedOut: Boolean(booking.whatsappOptOutAt) }} onOpened={messageOpen === 'review_request' ? () => updateReview('requested') : undefined} onClose={() => setMessageOpen(null)} />}
      {canViewPayments && paymentModal && <PaymentModal payment={paymentModal === 'new' ? null : paymentModal} onClose={() => setPaymentModal(null)} onSave={async data => { const updated = paymentModal === 'new' ? await api.addBookingPayment(booking.id, data) : await api.updateBookingPayment(booking.id, paymentModal.id, data); sync(updated); setPaymentModal(null); }} />}
    </div>
  );
}

function PaymentModal({ payment, onClose, onSave }: { payment: BookingPayment | null; onClose: () => void; onSave: (data: { amount: number; paidAt: string; method: PaymentMethod; reference?: string; note?: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(payment ? String(payment.amount) : '');
  const [paidAt, setPaidAt] = useState(payment?.paidAt?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'upi');
  const [reference, setReference] = useState(payment?.reference || '');
  const [note, setNote] = useState(payment?.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!Number(amount) || Number(amount) <= 0) return setError('Enter a positive payment amount.');
    setSaving(true); setError('');
    try { await onSave({ amount: Number(amount), paidAt: new Date(`${paidAt}T12:00:00`).toISOString(), method, reference, note }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to save payment'); setSaving(false); }
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{payment ? 'Edit payment' : 'Record payment'}</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Amount (₹)<input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm">Payment date<input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm">Method<select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{['cash', 'upi', 'bank_transfer', 'card', 'other'].map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label><label className="text-sm">Reference<input value={reference} onChange={e => setReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm sm:col-span-2">Note<input value={note} onChange={e => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button><button onClick={() => void submit()} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Save payment</button></div></div></div>;
}
