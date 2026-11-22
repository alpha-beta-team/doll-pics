import { BookingNoteComposer } from '../components/bookings/BookingNoteComposer';
import { useBookingRecordLoader } from './bookingRecordContext';
import { BookingHeader } from '../components/bookings/BookingHeader';
import { WorkflowTracker, WorkflowTrackerSkeleton } from '../components/bookings/WorkflowTracker';
import '@fontsource/dm-mono/latin-500.css';
import { BookingRecordIcon as RecordIcon } from '../components/bookings/BookingRecordIcon';
import { BookingRecordProperties } from '../components/bookings/BookingRecordProperties';
import type { BookingWorkspace } from '../../shared/bookingWorkspace';
import { ORDER_STAGE_LABELS, type OrderWorkflow } from '../../shared/orderWorkflow';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-500.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
import { FormInput, FormTextarea } from '../components/ui/FormControls';
import { AdminAlert } from '../components/ui/AdminUi';
import { OrderWorkflowPanel, type OrderWorkflowHandle } from '../components/bookings/OrderWorkflowPanel';
import { BookingNotesFollowUps, type BookingNotesHandle } from '../components/bookings/BookingNotesFollowUps';
import { BookingPaymentDialog } from '../components/bookings/BookingPaymentDialog';
import { BookingDueDateDialog } from '../components/bookings/BookingDueDateDialog';
import { BookingCrewDialog } from '../components/bookings/BookingCrewDialog';
import { CREW_SERVICE_LABELS } from '../../shared/crew';
import { deliverableExtraTotal } from '../../shared/deliverables';
import { BookingDeliverablesPanel } from '../components/BookingDeliverablesPanel';
import { formatCustomerName } from '../../shared/formatCustomerName';
import './booking-detail.css';
import { CustomerBookingPanel } from '../components/CustomerBookingPanel';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle,
  ExternalLink,
  MessageCircle,
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
  ServiceNavLink,
  StaffAccountOption,
  WhatsAppMessageSummary,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { hasStaffPermission, canViewBookingPricing } from '../access/roles';
import { bookingWorkflowApi } from '../api/bookingWorkflow';
import { BookingDeliveryPanel } from '../components/bookings/BookingDeliveryPanel';
import { deliveryLinkFields, deliveryUrlWarning, eligibleDeliveryUrl, normalizeDeliveryUrl, validDeliveryUrl, type DeliveryLinkKey } from '../components/bookings/deliverySharing';
import { bookingDurationLabel, formatTimeWindow } from '../../shared/bookingTime';
import { CustomerLookupPanel } from '../components/CustomerLookupPanel';
import { BookingWhatsAppComposer } from '../components/bookings/BookingWhatsAppComposer';
import { bookingMessageLabel, type BookingWhatsAppTemplateId } from '../components/bookings/bookingWhatsApp';
import { bookingWorkspaceApi } from '../api/bookingWorkspace';
import { VoiceNotesPanel } from '../components/VoiceNotesPanel';
import { conflictRequirements, saveWithScheduleConfirmation, scheduleConfirmationOptions } from '../components/scheduleConfirmation';
import { ImportantDatesPanel } from '../components/ImportantDatesPanel';
import { AdminTabs } from '../components/AdminTabs';
import { BookingDialog, BookingSection, BookingTabPanel, BookingCustomerDetails, BookingPaymentDetails } from '../components/bookings/BookingDetailSections';
import { kolkataToday } from '../reports/reportingPeriod';

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

function formatShootDay(value: string) {
  if (!value) return 'Not set';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+05:30` : value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function formatOverviewTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

function formatShootTime(startTime?: string, endTime?: string) {
  const [start, end] = formatTimeWindow(startTime, endTime, '12h').toLowerCase().split('–');
  if (!end) return formatTimeWindow(startTime, endTime);
  const suffix = end.match(/ (am|pm)$/)?.[0];
  return `${suffix && start.endsWith(suffix) ? start.slice(0, -suffix.length) : start} – ${end}`;
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
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm text-slate-800">{children}</dd></div>;
}

const Card = BookingSection;

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <BookingDetailWorkspace key={id} />;
}

function BookingDetailWorkspace() {
  const { canManage: canManageBooking, isReadOnly } = useFeatureAccess('bookings');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { user } = useAuth();
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
  const confirmDialog = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const loaderData = useBookingRecordLoader();
  const [booking, setBooking] = useState<Booking | null>(loaderData?.booking || null);
  const notesActions = useRef<BookingNotesHandle>(null);
  const [addingOverviewNote, setAddingOverviewNote] = useState(false);
  const [workspace, setWorkspace] = useState<BookingWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState('');
  const [orderSnapshot, setOrderSnapshot] = useState<OrderWorkflow | null>(null);
  const [hasOrderWorkflow, setHasOrderWorkflow] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderReady, setOrderReady] = useState(false);
  const [orderActionLabel, setOrderActionLabel] = useState('Loading order…');
  const orderActions = useRef<OrderWorkflowHandle>(null);
  const tabs = [{ id: 'overview', label: 'Overview' }, ...(canManageBooking ? [{ id: 'delivery', label: 'Delivery', badge: `${booking ? deliveryLinkFields.filter(field => eligibleDeliveryUrl(booking[field.key])).length : 0}/3 links` }] : []), { id: 'customer', label: user?.role === 'owner' ? 'Customer page' : 'Customer' }, { id: 'notes', label: 'Notes & follow-ups', badge: workspace ? String(workspace.notes.length) : undefined }];
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab')! : 'overview';
  const selectTab = (value: string) => {
    if (value === tab) return;
    setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', value); return next; }, { preventScrollReset: true });
  };
  const deliveryReview = useRef<HTMLDivElement>(null);
  const orderTracking = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([tab]));
  useEffect(() => { setVisited(previous => new Set([...previous, tab])); }, [tab]);
  const [editor, setEditor] = useState<'delivery' | null>(null);
  const [toolsPanel, setToolsPanel] = useState<'voice' | 'customer' | null>(null);
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!success) return; const timer = window.setTimeout(() => setSuccess(''), 5000); return () => window.clearTimeout(timer); }, [success]);
  const [editorError, setEditorError] = useState('');
  const [visibleMessages, setVisibleMessages] = useState(8);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [resourcesError, setResourcesError] = useState('');
  const [staffOptionsError, setStaffOptionsError] = useState('');
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookingServices, setBookingServices] = useState<ServiceNavLink[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountOption[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessageSummary[]>([]);
  const [loading, setLoading] = useState(!loaderData);
  const tabBar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tabBar.current?.querySelector<HTMLElement>('[role="tablist"]');
    if (!list) return;
    const reveal = () => {
      const selected = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!selected) return;
      const bounds = list.getBoundingClientRect(), button = selected.getBoundingClientRect();
      if (button.left < bounds.left || button.right > bounds.right) list.scrollLeft += button.left - bounds.left - (bounds.width - button.width) / 2;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    return () => observer.disconnect();
  }, [tab, loading]);
  const [error, setError] = useState(loaderData?.error || '');
  const [editing, setEditing] = useState(false);
  const [editingCrew, setEditingCrew] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [showAllCrew, setShowAllCrew] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<BookingPayment | 'new' | null>(null);
  const [driveGalleryUrl, setDriveGalleryUrl] = useState('');
  const [driveEditedUrl, setDriveEditedUrl] = useState('');
  const [driveRawsUrl, setDriveRawsUrl] = useState('');
  const [driveNotes, setDriveNotes] = useState('');
  const [deliveryFocus, setDeliveryFocus] = useState<DeliveryLinkKey>('driveGalleryUrl');
  const deliveryField = useRef<HTMLInputElement>(null);
  const editorBaseline = useRef<Booking | null>(null);
  const deliveryConfirmLock = useRef(false);
  const editorSaveLock = useRef(false);
  useEffect(() => {
    if (editor !== 'delivery') return;
    const frame = requestAnimationFrame(() => deliveryField.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [editor, deliveryFocus]);
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState<BookingWhatsAppTemplateId | 'suggested' | null>(null);
  const [reviewUrl, setReviewUrl] = useState('');

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
    setResourcesLoading(true); setResourcesError(''); setStaffOptionsError('');
    const results = await Promise.allSettled([api.getPackages(), api.getPhotographyServices(), api.getAssignableStaffAccounts(), api.getReviewConfig()]);
    if (results[0].status === 'fulfilled') setPackages(results[0].value);
    if (results[1].status === 'fulfilled') setBookingServices(results[1].value);
    if (results[2].status === 'fulfilled') setStaffAccounts(results[2].value);
    else setStaffOptionsError('Staff options could not be loaded.');
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
  useEffect(() => { if (activityOpen) void loadMessages(); }, [activityOpen, loadMessages]);
  useEffect(() => { if (!loaderData) void load(); }, [load, loaderData]);


  const run = async (operation: () => Promise<Booking>, message = 'Booking updated') => {
    setSaving(true);
    setError('');
    try { sync(await operation()); setSuccess(message); return true; }
    catch (err) { setError(err instanceof Error ? err.message : 'Operation failed'); }
    finally { setSaving(false); }
  };

  const transition = async (status: BookingStatus) => {
    if (!booking || saving) return;
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
        description: `The booking for ${formatCustomerName(booking.customerName)} will be cancelled. You can restore it later if needed.`,
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
      let pricing: { expectedPricingToken?: string; agreedTotal?: number } | undefined;
      if (status === 'confirmed' && booking.status === 'draft' && !booking.pricingSnapshot && booking.packageId) {
        const preview = await api.getPricingPreview(booking.packageId);
        const effective = preview.pricing?.effectivePrice;
        const amount = preview.pricingMode === 'price' ? effective == null ? null : effective - (booking.bookingDiscountAmount || 0) + deliverableExtraTotal(booking.deliverables) : booking.agreedTotal;
        if (amount == null) throw new Error('Enter the final agreed total before confirming.');
        if (!await confirmDialog({ title: 'Confirm booking price', description: `Final agreed total: ${money(amount)}${preview.pricing?.activeOffer ? ` · ${preview.pricing.activeOffer.name}` : ''}. This price will be saved to the booking.`, confirmLabel: 'Confirm price & booking' })) return;
        pricing = { expectedPricingToken: preview.pricing?.token, agreedTotal: amount };
      }
      const result = await saveWithScheduleConfirmation(
        flags => api.transitionBooking(booking.id, status, flags.acknowledgeUntimedConflict, flags.acknowledgeTimedConflict, pricing),
        async conflicts => restoring && await confirmDialog(scheduleConfirmationOptions(conflicts, true)) ? conflictRequirements(conflicts) : null,
      );
      if (!result.saved) return;
      sync(result.value); setSuccess('Booking status updated');
      if (status === 'cancelled') setMessageOpen('booking_cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
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
    if (hasOrderWorkflow && ['shoot_completed', 'delivered'].includes(booking.status)) return [{ label: 'Cancel booking', status: 'cancelled' as const }];
    if (booking.status === 'shoot_completed') return [
      { label: 'Revert to confirmed', status: 'confirmed' as const },
    ];
    if (booking.status === 'delivered') return [
      { label: 'Revert to shoot completed', status: 'shoot_completed' as const },
    ];
    if (hasOrderWorkflow && booking.status === 'cancelled') return [];
    return [{ label: `Restore to ${(booking.statusBeforeCancellation || 'draft').replace('_', ' ')}`, status: booking.statusBeforeCancellation || 'draft', primary: true }];
  }, [booking, hasOrderWorkflow]);

  const saveEdit = async (payload: BookingWritePayload) => {
    if (!booking) return;
    const scheduleChanged = payload.bookingDate !== booking.bookingDate
      || payload.startTime !== booking.startTime || payload.endTime !== booking.endTime;
    sync(await api.updateBooking(booking.id, payload));
    setEditing(false); setSuccess('Booking details saved');
    if (scheduleChanged) setMessageOpen('booking_rescheduled');
  };

  const openEditor = (kind: 'delivery', field?: DeliveryLinkKey) => {
    if (!booking) return;
    editorBaseline.current = booking;
    setDeliveryFocus(field || deliveryLinkFields.find(item => !booking[item.key])?.key || 'driveGalleryUrl');
    setEditorError('');
    setDriveGalleryUrl(booking.driveGalleryUrl); setDriveEditedUrl(booking.driveEditedUrl);
    setDriveRawsUrl(booking.driveRawsUrl); setDriveNotes(booking.driveNotes);
    setEditor(kind);
  };
  const closeEditor = async () => {
    if (saving || !booking) return;
    const dirty = driveGalleryUrl !== booking.driveGalleryUrl || driveEditedUrl !== booking.driveEditedUrl || driveRawsUrl !== booking.driveRawsUrl || driveNotes !== booking.driveNotes;
    if (dirty && !await confirmDialog({ title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setEditor(null);
  };
  const saveEditor = async () => {
    if (!booking || editorSaveLock.current) return;
    if (editor === 'delivery' && [driveGalleryUrl, driveEditedUrl, driveRawsUrl].some(url => url.trim() && !validDeliveryUrl(normalizeDeliveryUrl(url)))) {
      setEditorError('Enter a valid http:// or https:// link for each resource, or leave it empty.'); return;
    }
    editorSaveLock.current = true;
    setSaving(true); setEditorError('');
    const baseline = editorBaseline.current || booking;
    const deliveryValues = { driveGalleryUrl: normalizeDeliveryUrl(driveGalleryUrl), driveEditedUrl: normalizeDeliveryUrl(driveEditedUrl), driveRawsUrl: normalizeDeliveryUrl(driveRawsUrl), driveNotes };
    const deliveryPatch = Object.fromEntries(Object.entries(deliveryValues).filter(([key, value]) => value !== baseline[key as keyof typeof deliveryValues]));
    try {
      if (editor === 'delivery' && !Object.keys(deliveryPatch).length) { setEditor(null); return; }
      const updated = await api.updateBooking(booking.id, { ...deliveryPatch, expectedUpdatedAt: baseline.updatedAt });
      sync(updated); setSuccess('Delivery links saved'); setEditor(null);
    } catch (err) { setEditorError(err instanceof Error ? err.message : 'Could not save changes.'); }
    finally { setSaving(false); editorSaveLock.current = false; }
  };
  const markDelivered = async () => {
    if (!booking || saving || deliveryConfirmLock.current || !deliveryLinkFields.some(field => eligibleDeliveryUrl(booking[field.key]))) return;
    deliveryConfirmLock.current = true;
    try {
      const confirmed = await confirmDialog({
        title: 'Mark gallery as delivered?',
        description: 'Confirm that the gallery was sent to the customer. The booking will move to delivered status.',
        confirmLabel: 'Mark delivered',
      });
      if (!confirmed) return;
      await run(() => api.completeBookingDelivery(booking.id));
    } finally { deliveryConfirmLock.current = false; }
  };
  const confirmPhotoSharing = async () => {
    if (!booking || saving || deliveryConfirmLock.current || !eligibleDeliveryUrl(booking.driveEditedUrl)) return;
    const editingStep = booking.workflow?.steps.find(step => step.key === 'editing');
    if (booking.status === 'cancelled' || booking.workflow?.cancelledAt || editingStep?.status !== 'current' || !editingStep.milestones.some(m => m.key === 'photos_delivered' && !m.done)) return;
    deliveryConfirmLock.current = true;
    try {
      const confirmed = await confirmDialog({ title: 'Confirm edited photos shared?', description: 'Confirm that you sent the edited photos to the customer. This records the sharing milestone; other workflow steps remain separate.', confirmLabel: 'Confirm edited photos shared' });
      if (confirmed) await run(() => bookingWorkflowApi.milestone(booking.id, 'photos_delivered', true), 'Edited photos sharing confirmed');
    } finally { deliveryConfirmLock.current = false; }
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

  if (loading) return <WorkflowTrackerSkeleton />;
  if (!booking) return <div className="space-y-4"><Link to="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" />Back to bookings</Link><AdminAlert>{error || 'Booking not found'}</AdminAlert></div>;

  const hasDeliveryLink = deliveryLinkFields.some(field => eligibleDeliveryUrl(booking[field.key]));
  const editingStep = booking.workflow?.steps.find(step => step.key === 'editing');
  const photoSharing = editingStep?.milestones.find(m => m.key === 'photos_delivered');
  const sharingRecorded = !!photoSharing?.done || (!booking.workflow && !!booking.deliverySentAt);
  const sharingAt = photoSharing?.doneAt || (sharingRecorded ? booking.deliverySentAt : undefined);
  const canConfirmPhotoSharing = !!booking.workflow && editingStep?.status === 'current' && !!photoSharing && !photoSharing.done && booking.status !== 'draft' && booking.status !== 'cancelled' && !booking.workflow.cancelledAt;
  const legacyDelivery = !booking.workflow && !hasOrderWorkflow && orderReady;

  const followUpOverdue = booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now();
  const calendarStatus = booking.calendarSyncStatus || 'not_applicable';
  const primaryAction = actions.find(action => 'primary' in action && action.primary);
  const overflowActions = actions.filter(action => !('primary' in action && action.primary));
  const canRequestReview = booking.status === 'delivered' && !['received', 'skipped'].includes(booking.reviewStatus)
    && Boolean(reviewUrl) && !booking.whatsappOptOutAt;
  const canEdit = canManageBooking && !resourcesLoading && !resourcesError;
  return (
    <div className="booking-detail bd-reference-record max-w-6xl">

      {error && <AdminAlert onDismiss={() => setError('')}>{error}</AdminAlert>}

      {success && <AdminAlert tone="success" className="fixed right-3 top-20 z-[80] max-w-[calc(100vw-1.5rem)] shadow-lg" contentClassName="flex items-center gap-3" aria-live="polite">{success}<button onClick={() => setSuccess('')} aria-label="Dismiss confirmation" className="flex h-8 w-8 items-center justify-center"><X className="h-4 w-4" /></button></AdminAlert>}
      <BookingHeader booking={booking} canViewPhone={canViewPhone} canManage={canManageBooking} canEdit={canEdit} saving={saving} onEdit={() => setEditing(true)} onMessage={canManageBooking ? () => setMessageOpen('suggested') : undefined} notify={setSuccess} onCancel={async reason => { const saved = await run(() => api.transitionBooking(booking.id, 'cancelled', undefined, undefined, { reason }), 'Booking cancelled'); if (saved) setMessageOpen('booking_cancelled'); return saved; }}>
        <button type="button" role="menuitem" onClick={() => setToolsPanel('voice')}>Voice notes</button>
        <button type="button" role="menuitem" onClick={() => setToolsPanel('customer')}>Customer details and records</button>
                  {canRequestReview && <button type="button" role="menuitem" disabled={saving} onClick={() => { setMessageOpen('review_request'); }}>Request review</button>}
                  {['shoot_completed', 'delivered'].includes(booking.status) && <button type="button" role="menuitem" disabled={!orderReady || saving} onClick={() => { orderActions.current?.openStatus(); }}>{orderCompleted ? 'Reopen order' : orderActionLabel}</button>}
                  {hasOrderWorkflow && booking.status !== 'cancelled' && <><button type="button" role="menuitem" disabled={!orderReady || saving} onClick={() => orderActions.current?.openDetails()}>Edit order details</button><button type="button" role="menuitem" disabled={!orderReady || saving} onClick={() => orderActions.current?.openCorrection()}>Correct stage or date</button></>}
                  {[...(primaryAction ? [primaryAction] : []), ...overflowActions].filter(action => action.status !== 'cancelled').map(action => <button key={action.label} type="button" role="menuitem" disabled={saving}  onClick={() => { void transition(action.status); }}>{action.status === 'shoot_completed' ? 'Mark shoot complete' : action.label}</button>)}
      </BookingHeader>
      {isReadOnly && <ReadOnlyNotice />}
      <div ref={orderTracking} tabIndex={-1} aria-label="Booking workflow" className="rounded-xl focus-visible:outline-admin-focus"><WorkflowTracker booking={booking} canManage={canManageBooking} onSaved={sync} /></div>

        {['shoot_completed', 'delivered', 'cancelled'].includes(booking.status) && <OrderWorkflowPanel dialogsOnly ref={orderActions} onOrderChange={setOrderSnapshot} onReadyChange={setOrderReady} onCompletedChange={setOrderCompleted} onActionLabelChange={setOrderActionLabel} onBookingSaved={sync} booking={booking} canManage={canManageBooking} staff={staffAccounts} onLoaded={setHasOrderWorkflow} onSaved={() => { void api.getBooking(booking.id).then(updated => { if (updated) sync(updated); }).catch(() => setError('Order saved. Reload the booking to refresh its details.')); }} />}

      {resourcesLoading && <p role="status" className="text-sm text-admin-subtle">Loading editing and assignment options…</p>}
      {resourcesError && <AdminAlert tone="warning" as="span">{resourcesError} <button className="underline" onClick={() => void loadResources()}>Retry</button></AdminAlert>}
      <div ref={tabBar} className="bd-tabs sticky top-16 z-10 rounded-xl border border-admin-border bg-admin-surface shadow-sm">
        <AdminTabs tabs={tabs} value={tab} onChange={selectTab} label="Booking details" />
      </div>
      {((canManageBooking && followUpOverdue) || calendarStatus === 'failed' || (booking.status === 'confirmed' && booking.bookingDate && booking.bookingDate < kolkataToday())) && <AdminAlert tone="warning" contentClassName="flex flex-wrap gap-2">
        {canManageBooking && followUpOverdue && <button className="underline" onClick={() => selectTab('notes')}>Follow-up overdue</button>}
        {calendarStatus === 'failed' && <button className="underline" onClick={() => setActivityOpen(true)}>Calendar needs attention</button>}
        {booking.status === 'confirmed' && booking.bookingDate && booking.bookingDate < kolkataToday() && <span><strong>Shoot status needs updating.</strong> Scheduled for {formatDay(booking.bookingDate)}.{canManageBooking && ' Use More booking actions to mark complete if the session took place.'}</span>}
      </AdminAlert>}
      <div className="bd-record-body bd-overview-body">
      <div className="bd-record-main">
      <BookingTabPanel id="overview" active={tab === 'overview'}>

        <div className="bd-overview-main bd-reference-overview">
            <Card title="Shoot details"><dl className="bd-shoot-grid">
              <div><span className="bd-field-icon"><RecordIcon name="Calendar" /></span><div><dt>Shoot date &amp; time</dt><dd>{formatShootDay(booking.bookingDate)}</dd><dd className="bd-field-secondary">{formatShootTime(booking.startTime, booking.endTime)}{bookingDurationLabel(booking.startTime, booking.endTime) && ` · ${bookingDurationLabel(booking.startTime, booking.endTime).replace(/\bhrs\b/, 'hours').replace(/\bhr\b/, 'hour')}`}</dd></div></div>
              <div><span className="bd-field-icon"><RecordIcon name="Location" /></span><div><dt>Location</dt><dd>{booking.location || 'Location not set'}</dd></div></div>
              <div><span className="bd-field-icon"><RecordIcon name="Camera" /></span><div><dt>Service &amp; package</dt><dd>{booking.shootType.trim().toLowerCase() === 'other' ? booking.preferredEvent || booking.shootType : booking.shootType || 'Not set'}</dd><dd className="bd-field-secondary">{booking.packageName || 'No package selected'}</dd></div></div>
              <div><span className="bd-field-icon"><RecordIcon name="Package" /></span><div><dt>Order type</dt><dd>{orderSnapshot ? orderSnapshot.mode === 'physical' ? 'Physical order' : 'Digital order' : orderReady ? 'Not set' : 'Loading order…'}</dd>{orderSnapshot && <dd className="bd-field-secondary">{orderSnapshot.mode === 'physical' ? 'Edited photos + printed products' : 'Edited photos'}</dd>}</div></div>
            </dl></Card>
        <div className="bd-promises">
          <BookingDeliverablesPanel confirm={confirmDialog} booking={booking} canManage={canManageBooking} canPrice={canViewBookingPricing(user?.role)} onSaved={updated => { sync(updated); setSuccess('Deliverables saved'); }} presentation="record" />
          <section className="bd-record-section min-w-0" aria-label="Crew List">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <h2 className="font-semibold">Crew <span className="ml-1 text-sm font-normal text-admin-subtle">· {booking.crewList?.length || 0}</span></h2>
              {canManageBooking && <button type="button" className="bd-small-action bd-crew-action" onClick={() => setEditingCrew(true)}><RecordIcon name="Crew" />Assign crew</button>}
            </div>
            {booking.crewList?.length ? <>
              <ul className="bd-crew-grid">{(showAllCrew ? booking.crewList : booking.crewList.slice(0, 3)).map((row, index) => <li key={`${row.staffAccountId}:${row.serviceType}:${index}`}><span aria-hidden="true" className={`bd-crew-avatar${index ? ' is-secondary' : ''}`}>{formatCustomerName(row.memberName).split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><p>{formatCustomerName(row.memberName)}</p><span>{CREW_SERVICE_LABELS[row.serviceType] || row.serviceType}</span></div></li>)}</ul>
              {booking.crewList.length > 3 && <button type="button" aria-expanded={showAllCrew} onClick={() => setShowAllCrew(value => !value)} className="min-h-11 text-sm font-semibold text-admin-primary">{showAllCrew ? 'Show less' : `View all ${booking.crewList.length} crew members`}</button>}
            </> : <p className="py-2 text-sm text-admin-subtle">No crew assigned</p>}
          </section>
        </div>

          <section className="bd-overview-notes" aria-labelledby="bd-notes-heading">
            <div className="bd-overview-section-heading"><h2 id="bd-notes-heading">Notes <span>· staff only</span></h2>{canManageBooking && <button type="button" className="bd-small-action" disabled={workspaceLoading || !!workspaceError || !workspace} onClick={() => setAddingOverviewNote(true)} aria-expanded={addingOverviewNote}><RecordIcon name="Note" />Add note</button>}</div>
            {addingOverviewNote && canManageBooking && <BookingNoteComposer key={booking.id} overview bookingId={booking.id} onSaved={state => { notesActions.current?.receive(state); setAddingOverviewNote(false); setSuccess('Note saved'); }} onFollowUp={note => notesActions.current?.openFollowUp(note)} onCancel={async dirty => { if (!dirty || await confirmDialog({ title: 'Discard unsaved changes?', description: 'Your note has not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) setAddingOverviewNote(false); }} />}
            {!addingOverviewNote && (workspaceLoading ? <p role="status" className="bd-muted">Loading notes…</p> : workspaceError ? <AdminAlert>{workspaceError} <button type="button" className="underline" onClick={() => notesActions.current?.retry()}>Retry</button></AdminAlert> : <>
              {workspace?.notes.length ? <ul className="bd-overview-note-list">{[...workspace.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 2).map(note => <li key={note.id}>{note.pinned && <RecordIcon name="Pin" />}<div><p>{note.body}</p><span>{note.createdBy.name} · {formatOverviewTimestamp(note.createdAt)}</span></div></li>)}</ul> : <p className="bd-muted">No internal notes yet.</p>}
              <button type="button" className="bd-record-link" onClick={() => selectTab('notes')}>All {workspace?.notes.length || 0} notes · {workspace?.pendingFollowUpCount ? `${workspace.pendingFollowUpCount} pending follow-up${workspace.pendingFollowUpCount === 1 ? '' : 's'}` : 'no pending follow-ups'}<RecordIcon name="Next" /></button>
            </>)}
            {booking.notes && <div className="bd-legacy-shoot-notes"><h3>Original shoot notes</h3><p>{booking.notes}</p></div>}
          </section>

        </div>
      </BookingTabPanel>
      <BookingTabPanel id="notes" active={tab === 'notes'}>
        {<BookingNotesFollowUps key={booking.id} ref={notesActions} onLoadingChange={setWorkspaceLoading} onErrorChange={setWorkspaceError} booking={booking} canManage={canManageBooking} staff={staffAccounts} staffLoading={resourcesLoading} staffError={staffOptionsError} retryStaff={() => void loadResources()} onSummary={(state, changed) => { setWorkspace(state); setBooking(current => current ? { ...current, pendingFollowUpCount: state.pendingFollowUpCount, nextFollowUpId: state.nextFollowUpId, nextFollowUpAt: state.nextFollowUpAt || undefined, followUpNote: state.followUpNote, lastFollowUpCompletedAt: state.lastFollowUpCompletedAt } : current); if (changed) void api.getBooking(booking.id).then(updated => { if (updated) sync(updated); }).catch(() => setSuccess('Changes saved. Reload the booking to refresh its other details.')); }} />}
      </BookingTabPanel>
      {canManageBooking && <BookingTabPanel id="delivery" active={tab === 'delivery'}>
        <div ref={deliveryReview} tabIndex={-1} aria-label="Delivery review" className="scroll-mt-24 rounded-xl focus-visible:outline-admin-focus"><BookingDeliveryPanel key={booking.id} booking={booking} sharingRecorded={sharingRecorded} saving={saving} onEdit={key => openEditor('delivery', key)} confirmation={<>
          {sharingRecorded ? <p className="bd-delivery-recorded"><CheckCircle size={16} />Photos shared{sharingAt ? ` · ${formatDateTime(sharingAt)} IST` : ''}</p> : booking.status === 'cancelled' || booking.workflow?.cancelledAt ? <p className="bd-helper">Cancelled bookings cannot confirm photo sharing.</p> : !['shoot_completed', 'delivered'].includes(booking.status) ? <p className="bd-helper">The shoot must be marked complete before confirming delivery.</p> : booking.workflow ? <>
            {canConfirmPhotoSharing ? <><button type="button" disabled={saving || !eligibleDeliveryUrl(booking.driveEditedUrl)} onClick={() => void confirmPhotoSharing()} className="bd-button bd-confirm-sharing"><RecordIcon name="Confirm" />Confirm edited photos shared</button>{!eligibleDeliveryUrl(booking.driveEditedUrl) && <p className="bd-helper">Save a customer-accessible edited photos link before confirming sharing.</p>}</> : <p className="bd-helper">Complete the preceding workflow steps before confirming edited photos shared.</p>}
          </> : legacyDelivery ? <>
            {booking.status === 'shoot_completed' ? <button type="button" onClick={() => void markDelivered()} disabled={!hasDeliveryLink || saving} className="bd-button bd-confirm-sharing"><RecordIcon name="Confirm" />Confirm delivered</button> : booking.status === 'delivered' ? <p className="bd-delivery-recorded">Photos shared</p> : <p className="bd-helper">The shoot must be marked complete before confirming delivery.</p>}
            {!hasDeliveryLink && <p className="bd-helper">Save at least one customer-accessible delivery link before confirming delivery.</p>}
          </> : <p className="bd-helper">{!orderReady ? 'Delivery confirmation is unavailable until the workflow loads. Reload the booking if it does not appear.' : 'Workflow unavailable. Reload the booking before confirming sharing.'}</p>}
        </>} /></div>
      </BookingTabPanel>}
      <BookingTabPanel id="customer" active={tab === 'customer'}>
        {user?.role === 'owner'
          ? (visited.has('customer') || tab === 'customer') && <CustomerBookingPanel booking={booking} record />
          : <BookingCustomerDetails booking={booking} canViewPhone={canViewPhone} />}
      </BookingTabPanel>
      {canManageBooking && toolsPanel && <BookingDialog className="bd-tools-dialog" title={toolsPanel === 'voice' ? 'Booking voice notes' : 'Customer details and records'} onClose={() => setToolsPanel(null)}>
        {toolsPanel === 'voice' ? <VoiceNotesPanel compact recordType="booking" recordId={booking.id} /> : <>
          <BookingCustomerDetails booking={booking} canViewPhone={canViewPhone} />
          {canViewPhone && <><CustomerLookupPanel phone={booking.customerPhone} current={{ type: 'booking', id: booking.id }} />
          <ImportantDatesPanel compact phone={booking.customerPhone} customerName={booking.customerName} email={booking.customerEmail} source={{ type: 'booking', id: booking.id }} /></>}
        </>}
      </BookingDialog>}
      <>{activityOpen && <BookingDialog title="Booking activity" className="booking-detail booking-detail-dialog" onClose={() => setActivityOpen(false)}><div className="space-y-4">
        <Card title="Workflow activity"><ol className="space-y-3">{[...(booking.workflowActivity || [])].reverse().map((event, index) => <li key={`${event.when}:${index}`}><p>{event.what}</p><small>{event.who.name} · {formatDateTime(event.when)} IST</small></li>)}{!booking.workflowActivity?.length && <li>No workflow activity recorded.</li>}</ol></Card>
        {orderSnapshot?.history.length ? <Card title="Order history"><ul>{[...orderSnapshot.history].reverse().map(entry => <li key={entry.id}>{ORDER_STAGE_LABELS[entry.next.stage]} · {formatDateTime(entry.recordedAt)} IST</li>)}</ul></Card> : null}
        <Card title="Schedule history"><ScheduleHistory booking={booking} /></Card>
        {canManageBooking && <Card title="Message history" action={<button onClick={() => void loadMessages()} className="bd-button" aria-label="Refresh messages"><RefreshCw className="h-4 w-4" />Refresh</button>}>
          {messagesLoading && <p role="status" className="bd-helper">Loading messages…</p>}
          {messagesError && <AdminAlert as="span">{messagesError} <button className="bd-link" onClick={() => void loadMessages()}>Retry</button></AdminAlert>}
          <div className="divide-y divide-admin-border">{messages.slice(0, visibleMessages).map(message => <div key={message.id} className="bd-message-row"><MessageCircle className="h-4 w-4 shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{message.eventType.replace(/_/g, ' ')}</p><p className="bd-helper">{formatDateTime(message.scheduledAt)} · {message.status}</p>{message.failureReason && <p className="text-xs text-red-700">{message.failureReason}</p>}</div>{message.status === 'failed' && <button disabled={saving} onClick={() => void retryMessage(message.id)} className="bd-link">Retry</button>}</div>)}</div>
          {!messagesLoading && !messagesError && !messages.length && <p className="bd-helper">No automated messages recorded.</p>}
          {messages.length > visibleMessages && <button className="bd-link" onClick={() => setVisibleMessages(count => count + 8)}>Show more messages ({messages.length - visibleMessages} remaining)</button>}
        </Card>}


        {booking.separateShootDecision && <Card title="Different shoot confirmed"><p className="whitespace-pre-wrap break-words text-sm">{booking.separateShootDecision.reason}</p><p className="mt-2 text-xs text-admin-subtle">Staff: {booking.separateShootDecision.actorId} · {formatDateTime(booking.separateShootDecision.decidedAt)}</p><p className="mt-1 text-xs text-admin-subtle">{booking.separateShootDecision.reviewedRecordIds.length} matching records reviewed</p></Card>}        {canManageBooking && <Card title="Communication settings">
          <div className="bd-switch-row"><div><p className="font-semibold text-sm">Automated WhatsApp updates</p><p className="bd-helper">{booking.whatsappNotificationsEnabled ? 'Enabled' : 'Disabled'} · Requires customer consent</p></div><button type="button" role="switch" aria-label="Automated WhatsApp updates" aria-checked={booking.whatsappNotificationsEnabled} onClick={toggleNotifications} disabled={!booking.whatsappOptIn || Boolean(booking.whatsappOptOutAt) || saving} className="bd-switch"><span /></button></div>
          <dl className="bd-details-grid mt-4"><Field label="Consent">{booking.whatsappOptIn ? `Recorded ${formatDateTime(booking.whatsappOptInAt)}` : 'Not recorded'}</Field><Field label="Source">{booking.whatsappOptInSource || '—'}</Field><Field label="Opt-out">{booking.whatsappOptOutAt ? formatDateTime(booking.whatsappOptOutAt) : 'No'}</Field><Field label="Language">English</Field></dl>
          {booking.whatsappOptOutAt && <p className="bd-helper">This customer opted out of automated WhatsApp updates.</p>}
        </Card>}

        <Card
          title="Google Calendar"
          action={(user?.role === 'owner') ? (
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
                  {booking.calendarSyncedAt ? `Last synced ${formatDateTime(booking.calendarSyncedAt)}` : 'No completed sync yet'}
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
            <AdminAlert as="span" className="mt-4">
              Calendar could not be updated. {(user?.role === 'owner') ? 'Ask the owner to check the calendar configuration, then use Retry.' : 'Please tell the owner.'}
              {booking.calendarSyncErrorCode ? ` Code: ${booking.calendarSyncErrorCode}` : ''}
            </AdminAlert>
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

</div></BookingDialog>}</>
      </div>
          <BookingRecordProperties booking={booking} canViewPayments={canViewPayments} canManage={canManageBooking} canEdit={canEdit} canViewPhone={canViewPhone} followUpReady={!workspaceLoading && !workspaceError && !!workspace} onPayment={() => setPaymentModal('new')} onPaymentHistory={() => setPaymentHistoryOpen(true)} onDueDate={() => setEditingDueDate(true)} staff={staffAccounts} onReturning={() => setToolsPanel('customer')} onAssignment={async staffId => { sync(await api.updateBooking(booking.id, { assignedStaffAccountId: staffId || null })); setSuccess('Staff assignment saved'); }} onFollowUp={() => notesActions.current?.openFollowUp()} onEdit={() => setEditing(true)} onNavigate={selectTab} onActivity={() => setActivityOpen(true)} activity={<RecentBookingActivity booking={booking} order={orderSnapshot} />} />
      </div>
      {editor && <BookingDialog className="booking-detail booking-detail-dialog" title="Edit delivery links" onClose={() => void closeEditor()}>
        {editorError && <AdminAlert as="span" className="mb-3">{editorError}</AdminAlert>}
        <div><div className="grid gap-4">{deliveryLinkFields.map(({ key, label }) => {
          const value = key === 'driveGalleryUrl' ? driveGalleryUrl : key === 'driveEditedUrl' ? driveEditedUrl : driveRawsUrl;
          const setter = key === 'driveGalleryUrl' ? setDriveGalleryUrl : key === 'driveEditedUrl' ? setDriveEditedUrl : setDriveRawsUrl;
          const normalized = normalizeDeliveryUrl(value);
          const warning = deliveryUrlWarning(normalized);
          return <div key={key}><label htmlFor={`edit-${key}`} className="text-sm text-slate-700">{label}</label><div className="mt-1 flex gap-2"><FormInput id={`edit-${key}`} ref={key === deliveryFocus ? deliveryField : undefined} type="text" inputMode="url" maxLength={500} disabled={saving} placeholder="https://drive.google.com/…" value={value} aria-describedby={warning ? `warning-${key}` : undefined} onChange={event => setter(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />{eligibleDeliveryUrl(normalized) && <a aria-label={`Open ${label}`} href={normalized} target="_blank" rel="noreferrer" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 p-2"><ExternalLink className="h-4 w-4" /></a>}</div>{warning && <p id={`warning-${key}`} className="bd-resource-warning">{warning} This link cannot be included in a customer message.</p>}</div>;
        })}</div>
        <label className="mt-3 block text-sm">Delivery note<FormTextarea disabled={saving} value={driveNotes} onChange={e => setDriveNotes(e.target.value)} placeholder="Delivery note" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} /></label>
</div><button disabled={saving} onClick={() => void saveEditor()} className="mt-4 min-h-11 rounded-lg bg-admin-primary px-4 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save links'}</button>
        <button disabled={saving} onClick={() => void closeEditor()} className="mt-3 min-h-11 px-3 text-sm">Cancel</button>
      </BookingDialog>}
      {canViewPayments && paymentHistoryOpen && <BookingDialog title="Payment history" className="booking-detail booking-detail-dialog" onClose={() => setPaymentHistoryOpen(false)}><BookingPaymentDetails booking={booking} onAdd={() => setPaymentModal('new')} onEdit={setPaymentModal} onDelete={payment => void deletePayment(payment)} onEditDueDate={canEdit ? () => setEditingDueDate(true) : undefined} /></BookingDialog>}
      {canEdit && canViewPayments && editingDueDate && <BookingDueDateDialog key={booking.id} booking={booking} onClose={() => setEditingDueDate(false)} onSaved={updated => { sync(updated); setEditingDueDate(false); setSuccess('Payment due date saved'); }} />}
      {canManageBooking && editingCrew && <BookingCrewDialog key={booking.id} booking={booking} onClose={() => setEditingCrew(false)} onSaved={updated => { sync(updated); setEditingCrew(false); setSuccess('Crew saved'); }} />}
      {canManageBooking && editing && <BookingFormModal booking={booking} packages={packages} services={bookingServices} staffAccounts={staffAccounts} onClose={() => setEditing(false)} onSave={saveEdit} />}
      {canManageBooking && messageOpen && <BookingWhatsAppComposer booking={booking} order={orderSnapshot} canViewPayments={canViewPayments} reviewUrl={reviewUrl} messages={messages} initialTemplate={messageOpen} onClose={() => setMessageOpen(null)} onLog={async (template, message, requestId) => {
        const state = await bookingWorkspaceApi.createNote(booking.id, `WhatsApp · ${bookingMessageLabel(template)} sent (staff confirmed)\n\n${message}`, requestId);
        setWorkspace(state);
        notesActions.current?.receive(state);
        if (template === 'review_request') await updateReview('requested');
        setSuccess('WhatsApp message logged in Notes & follow-ups');
      }} />}
      {canViewPayments && paymentModal && <BookingPaymentDialog booking={booking} payment={paymentModal === 'new' ? null : paymentModal} onClose={() => setPaymentModal(null)} onSave={async data => { const updated = paymentModal === 'new' ? await api.addBookingPayment(booking.id, data) : await api.updateBookingPayment(booking.id, paymentModal.id, data); sync(updated); setSuccess('Payment saved'); setPaymentModal(null); }} />}
    </div>
  );
}

function ScheduleHistory({ booking, limit }: { booking: Booking; limit?: number }) {
  const sorted = [...booking.scheduleHistory].sort((a, b) => (Date.parse(b.changedAt) || 0) - (Date.parse(a.changedAt) || 0));
  const history = limit ? sorted.slice(0, limit) : sorted;
  return <div className="bd-history">{history.map(entry => <div key={entry.id || entry.changedAt} className="bd-history-event"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold capitalize">{entry.action}</span><span className="bd-helper">{formatDateTime(entry.changedAt)} · {entry.changedBy.name}</span></div>{entry.reason && <p className="mt-2 text-sm">{entry.reason}</p>}<div className="mt-2 grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr]"><span>{formatDay(entry.previous.bookingDate)} · {formatTimeWindow(entry.previous.startTime, entry.previous.endTime)} · {entry.previous.status.replace(/_/g, ' ')}</span><span aria-hidden="true">→</span><span>{formatDay(entry.next.bookingDate)} · {formatTimeWindow(entry.next.startTime, entry.next.endTime)} · {entry.next.status.replace(/_/g, ' ')}</span></div></div>)}{!history.length && <p className="bd-helper">No schedule changes recorded.</p>}</div>;
}

function RecentBookingActivity({ booking, order }: { booking: Booking; order: OrderWorkflow | null }) {
  const events = [
    ...(booking.workflowActivity || []).map((entry, index) => ({ id: `workflow:${index}`, title: `${entry.what} · ${entry.who.name}`, at: entry.when })),
    ...booking.scheduleHistory.map(entry => ({ id: `schedule:${entry.id || entry.changedAt}`, title: entry.action.replace(/_/g, ' '), at: entry.changedAt })),
    ...(order?.history || []).map(entry => ({ id: `order:${entry.id}`, title: `${ORDER_STAGE_LABELS[entry.next.stage]}${entry.action === 'correct' ? ' (corrected)' : entry.action === 'reopen' ? ' (reopened)' : ''}`, at: entry.recordedAt })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  return events.length ? <ul className="bd-recent-activity">{events.map(event => <li key={event.id}><p>{event.title}</p><span>{formatOverviewTimestamp(event.at)}</span></li>)}</ul> : <p className="bd-muted">No activity recorded.</p>;
}
