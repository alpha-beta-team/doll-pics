import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  MapPin,
  UserRound,
  MoreHorizontal,
  Pencil,
  Phone,
  RefreshCw,
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
  ServiceNavLink,
  StaffAccountOption,
  WhatsAppMessageSummary,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { hasStaffPermission } from '../access/roles';
import {
  deliveryWhatsAppMessage,
  deliveryWhatsAppUrl,
  whatsappDigits,
} from '../../lib/pricing';
import { bookingDurationLabel, formatTimeWindow } from '../../shared/bookingTime';
import { dateTimeLocalInKolkata, followUpDateError, kolkataLocalToIso } from '../components/followUp.utils';
import { FollowUpPanel } from '../components/FollowUpPanel';
import { CustomerLookupPanel } from '../components/CustomerLookupPanel';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import { VoiceNotesPanel } from '../components/VoiceNotesPanel';
import { ApiError } from '../api/http';
import type { WhatsAppTemplateId } from '../components/whatsappTemplates';
import { ImportantDatesPanel } from '../components/ImportantDatesPanel';
import { AdminTabs } from '../components/AdminTabs';
import { BookingDialog, BookingSection, BookingTabPanel, BookingPaymentSummary, BookingCustomerDetails, BookingPaymentDetails } from '../components/bookings/BookingDetailSections';
import { kolkataToday } from '../reports/reportingPeriod';

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
  if (!value) return 'Not set';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+05:30` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
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

const Card = BookingSection;

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <BookingDetailWorkspace key={id} />;
}

function BookingDetailWorkspace() {
  const { canManage: canManageBooking, isReadOnly } = useFeatureAccess('bookings');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { canManage: canManageIntegrations } = useFeatureAccess('integrations');
  const { user } = useAuth();
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
  const confirmDialog = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabs = [{ id: 'overview', label: 'Overview' }, ...(canViewPayments ? [{ id: 'payments', label: 'Payments' }] : []), ...(canManageBooking ? [{ id: 'delivery', label: 'Delivery' }] : []), { id: 'customer', label: 'Customer' }, { id: 'activity', label: 'Activity' }];
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab')! : 'overview';
  const selectTab = (value: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', value); return next; });
  const [visited, setVisited] = useState<Set<string>>(() => new Set([tab]));
  useEffect(() => { setVisited(previous => new Set([...previous, tab])); }, [tab]);
  const [editor, setEditor] = useState<'followup' | 'delivery' | 'assignment' | null>(null);
  const [assignee, setAssignee] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!success) return; const timer = window.setTimeout(() => setSuccess(''), 5000); return () => window.clearTimeout(timer); }, [success]);
  const [editorError, setEditorError] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [resourcesError, setResourcesError] = useState('');
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookingServices, setBookingServices] = useState<ServiceNavLink[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountOption[]>([]);
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
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Server responses update the record only. Editor drafts are initialized on open.
  const sync = useCallback((value: Booking) => { setBooking(value); }, []);

  const loadMessages = useCallback(async () => {
    if (!id || !canManageBooking) return;
    setMessagesLoading(true); setMessagesError('');
    try { setMessages(await api.getBookingWhatsAppMessages(id)); }
    catch (err) { setMessagesError(err instanceof Error ? err.message : 'Could not load messages'); }
    finally { setMessagesLoading(false); }
  }, [id, canManageBooking]);

  const loadResources = useCallback(async () => {
    if (!canManageBooking) return;
    setResourcesLoading(true); setResourcesError('');
    const results = await Promise.allSettled([api.getPackages(), api.getSiteContent(), api.getAssignableStaffAccounts(), api.getReviewConfig()]);
    if (results[0].status === 'fulfilled') setPackages(results[0].value);
    if (results[1].status === 'fulfilled') setBookingServices(results[1].value.serviceNavLinks ?? []);
    if (results[2].status === 'fulfilled') setStaffAccounts(results[2].value);
    if (results[3].status === 'fulfilled') setReviewUrl(results[3].value.googleReviewUrl);
    if (results.some(result => result.status === 'rejected')) setResourcesError('Some editing options could not be loaded. Retry before editing.');
    setResourcesLoading(false);
  }, [canManageBooking]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const row = await api.getBooking(id);
      if (!row) throw new Error('Booking not found');
      sync(row);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load booking'); }
    finally { setLoading(false); }
  }, [id, sync]);

  useEffect(() => { void loadResources(); }, [loadResources]);
  const activityVisited = visited.has('activity');
  useEffect(() => { if (activityVisited) void loadMessages(); }, [activityVisited, loadMessages]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!actionMenuOpen) return undefined;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !actionMenuRef.current?.contains(event.target)) {
        setActionMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActionMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [actionMenuOpen]);

  const run = async (operation: () => Promise<Booking>, message = 'Booking updated') => {
    setSaving(true);
    setError('');
    try { sync(await operation()); setSuccess(message); return true; }
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
      sync(updated); setSuccess('Booking status updated');
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
      { label: 'Cancel booking', status: 'cancelled' as const },
    ];
    if (booking.status === 'confirmed') return [
      { label: 'Complete shoot', status: 'shoot_completed' as const, primary: true },
      { label: 'Revert to draft', status: 'draft' as const },
      { label: 'Cancel booking', status: 'cancelled' as const },
    ];
    if (booking.status === 'shoot_completed') return [
      { label: 'Revert to confirmed', status: 'confirmed' as const },
    ];
    if (booking.status === 'delivered') return [
      { label: 'Revert to shoot completed', status: 'shoot_completed' as const },
    ];
    return [{ label: `Restore to ${(booking.statusBeforeCancellation || 'draft').replace('_', ' ')}`, status: booking.statusBeforeCancellation || 'draft', primary: true }];
  }, [booking]);

  const saveEdit = async (payload: BookingWritePayload) => {
    if (!booking) return;
    const scheduleChanged = payload.bookingDate !== booking.bookingDate
      || payload.startTime !== booking.startTime || payload.endTime !== booking.endTime;
    sync(await api.updateBooking(booking.id, payload));
    setEditing(false); setSuccess('Booking details saved');
    if (scheduleChanged) setMessageOpen('booking_rescheduled');
  };

  const openEditor = (kind: 'followup' | 'delivery' | 'assignment') => {
    if (!booking) return;
    setEditorError('');
    setAssignee(booking.assignedStaffAccountId || '');
    setFollowUpAt(booking.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(booking.nextFollowUpAt)) : '');
    setFollowUpNote(booking.followUpNote);
    setDriveGalleryUrl(booking.driveGalleryUrl); setDriveEditedUrl(booking.driveEditedUrl);
    setDriveRawsUrl(booking.driveRawsUrl); setDriveNotes(booking.driveNotes);
    setEditor(kind);
  };
  const closeEditor = async () => {
    if (saving || !booking) return;
    const dirty = editor === 'assignment' ? assignee !== (booking.assignedStaffAccountId || '') : editor === 'delivery'
      ? driveGalleryUrl !== booking.driveGalleryUrl || driveEditedUrl !== booking.driveEditedUrl || driveRawsUrl !== booking.driveRawsUrl || driveNotes !== booking.driveNotes
      : followUpAt !== (booking.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(booking.nextFollowUpAt)) : '') || followUpNote !== booking.followUpNote;
    if (dirty && !await confirmDialog({ title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setEditor(null);
  };
  const saveEditor = async () => {
    if (!booking) return;
    if (editor === 'followup') {
      const validationError = !followUpAt ? 'Choose a follow-up date and time.' : followUpDateError(followUpAt);
      if (validationError) { setEditorError(validationError); return; }
    }
    setSaving(true); setEditorError('');
    try {
      const updated = editor === 'assignment'
        ? await api.updateBooking(booking.id, { assignedStaffAccountId: assignee || null })
        : editor === 'followup'
        ? await api.scheduleBookingFollowUp(booking.id, kolkataLocalToIso(followUpAt), followUpNote)
        : await api.updateBooking(booking.id, { driveGalleryUrl, driveEditedUrl, driveRawsUrl, driveNotes });
      sync(updated); setSuccess(editor === 'assignment' ? 'Staff assignment saved' : editor === 'followup' ? 'Follow-up scheduled' : 'Delivery links saved'); setEditor(null);
    } catch (err) { setEditorError(err instanceof Error ? err.message : 'Could not save changes.'); }
    finally { setSaving(false); }
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

  const hasDeliveryLink = Boolean(booking.driveGalleryUrl || booking.driveEditedUrl || booking.driveRawsUrl);
  const deliveryContext = {
    customerName: booking.customerName,
    shootType: booking.shootType,
    galleryUrl: booking.driveGalleryUrl,
    editedUrl: booking.driveEditedUrl,
    rawsUrl: booking.driveRawsUrl,
    driveNotes: booking.driveNotes,
  };
  const followUpOverdue = booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now();
  const calendarStatus = booking.calendarSyncStatus || 'not_applicable';
  const primaryAction = actions.find(action => 'primary' in action && action.primary);
  const overflowActions = actions.filter(action => !('primary' in action && action.primary));

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <button onClick={() => navigate('/admin/bookings')} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to bookings</button>
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error}<button className="ml-auto" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}

      {success && <div role="status" aria-live="polite" className="fixed right-3 top-20 z-[80] flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 shadow-lg"><CheckCircle className="h-4 w-4 shrink-0" />{success}<button onClick={() => setSuccess('')} aria-label="Dismiss confirmation" className="flex h-8 w-8 items-center justify-center"><X className="h-4 w-4" /></button></div>}
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="min-w-0 break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{booking.customerName}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[booking.status]}`}>{booking.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-700">{booking.shootType.trim().toLowerCase() === 'other' && booking.preferredEvent ? booking.preferredEvent : booking.packageName || booking.shootType || 'Photography session'}</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500 sm:text-sm lg:flex lg:flex-wrap lg:gap-x-4 lg:gap-y-1 lg:space-y-0">
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {canViewPhone && booking.customerPhone ? (
                  <a href={`tel:${booking.customerPhone}`} className="min-w-0 break-words rounded text-admin-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">{booking.customerPhone}</a>
                ) : <span>{booking.customerPhone || 'Not recorded'}</span>}
              </div>
              <div className="flex items-start gap-2"><CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div className="flex flex-wrap gap-x-2 gap-y-0.5"><span>{formatDay(booking.bookingDate)}</span>{booking.startTime && booking.endTime && <span>{[booking.startTime, booking.endTime].map(time => new Date(`2000-01-01T${time}:00+05:30`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })).join(' – ')}</span>}</div></div>
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{booking.location || 'Location not set'}</span></div>
              <div className="flex items-start gap-2"><UserRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{booking.assignedStaffAccountName || 'No staff assigned'}</span>{canManageBooking && <button disabled={resourcesLoading || Boolean(resourcesError)} onClick={() => openEditor('assignment')} className="min-h-6 shrink-0 font-semibold text-admin-primary underline disabled:opacity-50">{booking.assignedStaffAccountId ? 'Change' : 'Assign'}</button>}</div>
            </div>
          </div>

          {canManageBooking ? (
            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 border-t border-slate-100 pt-3 lg:flex lg:w-auto lg:border-0 lg:pt-0">
              {booking.status === 'shoot_completed' && <button type="button" onClick={() => selectTab('delivery')} className="col-span-3 min-h-11 rounded-lg bg-admin-primary px-4 text-sm font-semibold text-white lg:flex-none">Prepare delivery</button>}
              {primaryAction && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void transition(primaryAction.status)}
                  className="col-span-3 inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold leading-5 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 sm:px-4 sm:text-sm lg:flex-none"
                >
                  <CheckCircle className="h-4 w-4 shrink-0" />{primaryAction.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Message customer on WhatsApp"
                title="WhatsApp"
                onClick={() => setMessageOpen('booking_confirmation')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 px-3 text-sm bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <MessageCircle className="h-4 w-4 shrink-0" /><span>WhatsApp</span>
              </button>
              <button
                type="button"
                aria-label="Edit booking"
                title="Edit booking"
                disabled={resourcesLoading || Boolean(resourcesError)}
                onClick={() => setEditing(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Pencil className="h-4 w-4 shrink-0" /><span>Edit</span>
              </button>
              {overflowActions.length > 0 && (
                <div ref={actionMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="More booking actions"
                    aria-expanded={actionMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setActionMenuOpen(open => !open)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {actionMenuOpen && (
                    <div role="menu" className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      {overflowActions.map(action => (
                        <button
                          key={action.label}
                          type="button"
                          role="menuitem"
                          disabled={saving}
                          onClick={() => {
                            setActionMenuOpen(false);
                            void transition(action.status);
                          }}
                          className={`flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:opacity-50 ${action.status === 'cancelled' ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isReadOnly ? <ReadOnlyNotice /> : null}
        </div>
      </header>

      {resourcesLoading && <p role="status" className="text-sm text-admin-subtle">Loading editing and assignment options…</p>}
      {resourcesError && <p role="alert" className="text-sm text-amber-800">{resourcesError} <button className="underline" onClick={() => void loadResources()}>Retry</button></p>}
      <div className="sticky top-16 z-10 rounded-xl border border-admin-border bg-admin-surface shadow-sm">
        <AdminTabs tabs={tabs} value={tab} onChange={selectTab} label="Booking details" wrap compact />
      </div>
      {((canManageBooking && followUpOverdue) || calendarStatus === 'failed' || (booking.status === 'confirmed' && booking.bookingDate && booking.bookingDate < kolkataToday())) && <div role="status" className="flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {canManageBooking && followUpOverdue && <button className="underline" onClick={() => openEditor('followup')}>Follow-up overdue</button>}
        {calendarStatus === 'failed' && <button className="underline" onClick={() => selectTab('activity')}>Calendar needs attention</button>}
        {booking.status === 'confirmed' && booking.bookingDate && booking.bookingDate < kolkataToday() && <span>Shoot date has passed. Completed? {canManageBooking && <button disabled={saving} onClick={() => void transition('shoot_completed')} className="min-h-11 font-semibold underline disabled:opacity-50">Complete shoot</button>}</span>}
      </div>}
      <BookingTabPanel id="overview" active={tab === 'overview'}>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card title="Shoot details"><div className="grid grid-cols-2 gap-3"><Field label="Service">{booking.shootType || 'Not set'}</Field><Field label="Event">{booking.preferredEvent || 'Not set'}</Field><Field label="Package">{booking.packageName || 'No package'}</Field><Field label="Duration">{bookingDurationLabel(booking.startTime, booking.endTime) || 'Not set'}</Field></div>{booking.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{booking.notes}</p>}</Card>
          {canManageBooking && <Card title="Next follow-up" action={<button className="text-sm font-semibold text-admin-primary" onClick={() => openEditor('followup')}>{booking.nextFollowUpAt ? 'Edit follow-up' : 'Schedule follow-up'}</button>}><p className="text-sm">{booking.nextFollowUpAt ? formatDateTime(booking.nextFollowUpAt) : 'Follow-up not scheduled'}</p>{booking.followUpNote && <p className="mt-2 whitespace-pre-wrap text-sm text-admin-subtle">{booking.followUpNote}</p>}{booking.nextFollowUpAt && <button disabled={saving} className="mt-2 min-h-11 text-sm font-semibold text-admin-primary" onClick={() => void run(() => api.completeBookingFollowUp(booking.id), 'Follow-up completed')}>Mark complete</button>}</Card>}
          {canViewPayments && <Card title="Payment summary" action={<button className="text-sm font-semibold text-admin-primary" onClick={() => setPaymentModal('new')}>Add payment</button>}><BookingPaymentSummary booking={booking} /><button className="mt-3 min-h-11 text-sm text-admin-primary underline" onClick={() => selectTab('payments')}>View payments</button></Card>}
          {canManageBooking && <Card title="Delivery" action={<button className="text-sm font-semibold text-admin-primary" onClick={() => selectTab('delivery')}>Prepare delivery</button>}><p className="text-sm">{booking.deliverySentAt ? `Delivered ${formatDateTime(booking.deliverySentAt)}` : hasDeliveryLink ? 'Links saved · Not marked delivered' : 'Delivery links not set'}</p></Card>}
        </div>
      </BookingTabPanel>
      {canViewPayments && <BookingTabPanel id="payments" active={tab === 'payments'}><BookingPaymentDetails booking={booking} onAdd={() => setPaymentModal('new')} onEdit={setPaymentModal} onDelete={payment => void deletePayment(payment)} /></BookingTabPanel>}
      {canManageBooking && <BookingTabPanel id="delivery" active={tab === 'delivery'}>      {canManageBooking && <Card title="Delivery / Google Drive" action={<button onClick={() => openEditor('delivery')} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Edit links</button>}>
        <div className="space-y-3">{[['Gallery folder', booking.driveGalleryUrl], ['Edited photos', booking.driveEditedUrl], ['RAW files', booking.driveRawsUrl]].map(([label, url]) => <div key={label}><p className="text-xs text-admin-subtle">{label}</p>{url ? <a className="break-all text-sm text-admin-primary underline" href={/^https?:\/\//i.test(url) ? url : undefined} target="_blank" rel="noopener noreferrer">{url}</a> : <p className="text-sm text-admin-subtle">Not set</p>}</div>)}</div>
        {booking.driveNotes && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{booking.driveNotes}</p>}
        {!hasDeliveryLink && <p className="mt-3 text-sm text-admin-subtle">Add and save a delivery link before sharing or marking this booking delivered.</p>}
        {hasDeliveryLink && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp message preview</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{deliveryWhatsAppMessage(deliveryContext)}</p></div>}
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={openDelivery} disabled={!hasDeliveryLink || !whatsappDigits(booking.customerPhone)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><MessageCircle className="h-4 w-4" />Review and open WhatsApp</button>{booking.status === 'shoot_completed' && <button onClick={() => void markDelivered()} disabled={!hasDeliveryLink || saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><CalendarCheck className="h-4 w-4" />Mark delivered</button>}{booking.deliverySentAt && <span className="inline-flex items-center gap-1.5 text-sm text-violet-700"><CheckCircle className="h-4 w-4" />Delivered {formatDateTime(booking.deliverySentAt)}</span>}</div>
      </Card>}

</BookingTabPanel>}
      <BookingTabPanel id="customer" active={tab === 'customer'}>        <BookingCustomerDetails booking={booking} canViewPhone={canViewPhone} />

{(visited.has('customer') || tab === 'customer') && <>      {canManageBooking && canViewPhone && <CustomerLookupPanel phone={booking.customerPhone} current={{ type: 'booking', id: booking.id }} />}
      {canManageBooking && canViewPhone && <ImportantDatesPanel compact phone={booking.customerPhone} customerName={booking.customerName} email={booking.customerEmail} source={{ type: 'booking', id: booking.id }} />}
</>}</BookingTabPanel>
      <BookingTabPanel id="activity" active={tab === 'activity'}>
        {booking.separateShootDecision && <Card title="Different shoot confirmed"><p className="whitespace-pre-wrap break-words text-sm">{booking.separateShootDecision.reason}</p><p className="mt-2 text-xs text-admin-subtle">Staff: {booking.separateShootDecision.actorId} · {formatDateTime(booking.separateShootDecision.decidedAt)}</p><p className="mt-1 text-xs text-admin-subtle">{booking.separateShootDecision.reviewedRecordIds.length} matching records reviewed</p></Card>}        {canManageBooking && <Card title="WhatsApp automation" action={<button onClick={() => void loadMessages()} className="text-slate-400" aria-label="Refresh messages"><RefreshCw className="h-4 w-4" /></button>}>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Consent">{booking.whatsappOptIn ? `Recorded ${formatDateTime(booking.whatsappOptInAt)}` : 'Not recorded'}</Field><Field label="Source">{booking.whatsappOptInSource || '—'}</Field><Field label="Opt-out">{booking.whatsappOptOutAt ? formatDateTime(booking.whatsappOptOutAt) : 'No'}</Field><Field label="Language">English</Field></div>
          <button onClick={toggleNotifications} disabled={!booking.whatsappOptIn || Boolean(booking.whatsappOptOutAt) || saving} className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${booking.whatsappNotificationsEnabled ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-700'} disabled:opacity-50`}>{booking.whatsappNotificationsEnabled ? 'Automated updates enabled' : 'Enable automated updates'}</button>
          {messagesLoading && <p role="status">Loading messages…</p>}{messagesError && <p role="alert" className="mt-3 text-sm text-red-700">{messagesError} <button onClick={() => void loadMessages()}>Retry</button></p>}
          <div className="mt-5 divide-y divide-slate-100">{messages.slice(0, 8).map(message => <div key={message.id} className="flex items-center gap-3 py-3"><MessageCircle className="h-4 w-4 text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{message.eventType.replace(/_/g, ' ')}</p><p className="text-xs text-slate-500">{formatDateTime(message.scheduledAt)} · {message.status}</p>{message.failureReason && <p className="mt-1 text-xs text-red-600">{message.failureReason}</p>}</div>{message.status === 'failed' && <button onClick={() => void retryMessage(message.id)} className="text-xs font-medium text-blue-600">Retry</button>}</div>)}{!messagesLoading && !messagesError && !messages.length && <p className="py-4 text-center text-sm text-slate-500">No automated messages yet.</p>}</div>
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
       <Card title="Schedule history">
        <div className="divide-y divide-slate-100">
          {booking.scheduleHistory.map(entry => <div key={entry.id || entry.changedAt} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.action === 'cancelled' ? 'bg-red-100 text-red-700' : entry.action === 'restored' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{entry.action}</span><span className="text-xs text-slate-500">{formatDateTime(entry.changedAt)} · {entry.changedBy.name}</span></div><div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-[1fr_auto_1fr]"><span>{formatDay(entry.previous.bookingDate)} · {formatTimeWindow(entry.previous.startTime, entry.previous.endTime)} · {entry.previous.status.replace('_', ' ')}</span><span aria-hidden="true">→</span><span>{formatDay(entry.next.bookingDate)} · {formatTimeWindow(entry.next.startTime, entry.next.endTime)} · {entry.next.status.replace('_', ' ')}</span></div></div>)}
          {!booking.scheduleHistory.length && <p className="py-4 text-center text-sm text-slate-500">No schedule changes yet.</p>}
        </div>
      </Card>

</BookingTabPanel>
      {canManageBooking && (visited.has('activity') || tab === 'activity') && <VoiceNotesPanel compact recordType="booking" recordId={booking.id} hidden={tab !== 'activity'} />}
      {editor && <BookingDialog title={editor === 'assignment' ? 'Assign staff' : editor === 'followup' ? 'Schedule follow-up' : 'Edit delivery links'} onClose={() => void closeEditor()}>
        {editorError && <p role="alert" className="mb-3 text-sm text-red-700">{editorError}</p>}
        {editor === 'assignment' ? <><label className="block text-sm">Assigned staff<select value={assignee} onChange={event => setAssignee(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3"><option value="">No staff assigned</option>{booking.assignedStaffAccountId && !staffAccounts.some(staff => staff.id === booking.assignedStaffAccountId) && <option value={booking.assignedStaffAccountId}>{booking.assignedStaffAccountName || 'Current assignee'}</option>}{staffAccounts.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></label>{!staffAccounts.length && <p className="mt-2 text-sm text-admin-subtle">No assignable staff available.</p>}<button disabled={saving} onClick={() => void saveEditor()} className="mt-4 min-h-11 rounded-lg bg-admin-primary px-4 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save assignment'}</button></> : editor === 'followup' ? <>        {canManageBooking && <FollowUpPanel
          className="lg:col-span-2"
          value={followUpAt}
          note={followUpNote}
          onChange={setFollowUpAt}
          onNoteChange={setFollowUpNote}
          onSubmit={() => void saveEditor()}
          disabled={saving}
          submitLabel={booking.nextFollowUpAt ? 'Reschedule follow-up' : 'Save follow-up'}
          notePlaceholder="What should we discuss?"
          current={booking.nextFollowUpAt ? {
            dateLabel: formatDateTime(booking.nextFollowUpAt),
            note: booking.followUpNote,
            overdue: Boolean(followUpOverdue),
          } : undefined}

        />}

</> : <><div>        <div className="grid gap-3 sm:grid-cols-3">{[['Gallery folder', driveGalleryUrl, setDriveGalleryUrl], ['Edited photos', driveEditedUrl, setDriveEditedUrl], ['RAW files', driveRawsUrl, setDriveRawsUrl]].map(([label, value, setter]) => <label key={label as string} className="text-sm text-slate-700">{label as string}<div className="mt-1 flex gap-2"><input value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />{value && <a aria-label={`Open ${label as string}`} href={/^https?:\/\//i.test(value as string) ? value as string : undefined} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 p-2"><ExternalLink className="h-4 w-4" /></a>}</div></label>)}</div>
        <label className="mt-3 block text-sm">Delivery note<textarea value={driveNotes} onChange={e => setDriveNotes(e.target.value)} placeholder="Delivery note" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} /></label>
</div><button disabled={saving} onClick={() => void saveEditor()} className="mt-4 min-h-11 rounded-lg bg-admin-primary px-4 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save links'}</button></>}
        <button disabled={saving} onClick={() => void closeEditor()} className="mt-3 min-h-11 px-3 text-sm">Cancel</button>
      </BookingDialog>}
      {canManageBooking && editing && <BookingFormModal booking={booking} packages={packages} services={bookingServices} staffAccounts={staffAccounts} onClose={() => setEditing(false)} onSave={saveEdit} />}
      {canManageBooking && messageOpen && <WhatsAppComposer initialTemplate={messageOpen} context={{ customerName: booking.customerName, phone: booking.customerPhone, service: booking.shootType || booking.packageName, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime, location: booking.location, balanceDue: canViewPayments ? booking.paymentSummary.balanceDue : undefined, paymentDueDate: canViewPayments ? booking.paymentDueDate : undefined, reviewUrl, consentRecorded: booking.whatsappOptIn, optedOut: Boolean(booking.whatsappOptOutAt) }} onOpened={messageOpen === 'review_request' ? () => updateReview('requested') : undefined} onClose={() => setMessageOpen(null)} />}
      {canViewPayments && paymentModal && <PaymentModal payment={paymentModal === 'new' ? null : paymentModal} onClose={() => setPaymentModal(null)} onSave={async data => { const updated = paymentModal === 'new' ? await api.addBookingPayment(booking.id, data) : await api.updateBookingPayment(booking.id, paymentModal.id, data); sync(updated); setSuccess('Payment saved'); setPaymentModal(null); }} />}
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
  return <BookingDialog title={payment ? 'Edit payment' : 'Record payment'} onClose={() => { if (!saving) onClose(); }}>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Amount (₹)<input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm">Payment date<input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm">Method<select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{['cash', 'upi', 'bank_transfer', 'card', 'other'].map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label><label className="text-sm">Reference<input value={reference} onChange={e => setReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm sm:col-span-2">Note<input value={note} onChange={e => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button><button onClick={() => void submit()} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Save payment</button></div></BookingDialog>;
}
