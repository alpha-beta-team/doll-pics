import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Booking, BookingWritePayload, Enquiry, EnquirySource, Package, PaymentMethod, ScheduleConflictResponse, ServiceNavLink, StaffAccountOption } from '../types';
import {
  BOOKING_WIZARD_FIELD_LABELS,
  BOOKING_WIZARD_STEPS,
  NEW_BOOKING_DEFAULTS,
  canOpenBookingWizardStep,
  discardBookingFormDraft,
  initialHighestCompletedStep,
  invalidateBookingWizardProgress,
  packageMatchesShootType,
  packagePrefill,
  packagesForShootType,
  photographyServiceOptions,
  validateBookingWizardStep,
  type BookingWizardFieldErrors,
} from './bookingForm.utils';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';
import { CustomerLookupPanel } from './CustomerLookupPanel';
import type { CustomerLookupResponse } from '../types';
import { ApiError } from '../api/http';
import { api } from '../api/client';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { endTimeFor, formatScheduleTime, minutesToTime, timeToMinutes } from '../pages/schedule.utils';
import { useAuth } from '../contexts/AuthContext';
import { canViewBookingPricing } from '../access/roles';
import { LeadSourceSelect } from './LeadSourceSelect';

type Props = {
  booking?: Booking | null;
  enquiry?: Enquiry | null;
  packages: Package[];
  services: ServiceNavLink[];
  staffAccounts: StaffAccountOption[];
  onClose: () => void;
  onSave: (payload: BookingWritePayload) => Promise<void>;
  initialSchedule?: { bookingDate: string; startTime: string; endTime: string };
};

type BookingDraft = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  source: EnquirySource | '';
  shootType: string;
  preferredEvent: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  packageId: string;
  agreedTotal: string;
  assignedStaffAccountId: string;
  advanceAmount: string;
  advanceMethod: PaymentMethod;
  paymentDueDate: string;
  nextFollowUpAt: string;
  followUpNote: string;
  notes: string;
  whatsappOptIn: boolean;
  whatsappNotificationsEnabled: boolean;
  step: number;
};

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

type ScheduleAvailability = {
  conflicts: ScheduleConflictResponse | null;
  checking: boolean;
  error: string;
};

function useScheduleAvailability(
  bookingDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): ScheduleAvailability {
  const [conflicts, setConflicts] = useState<ScheduleConflictResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const invalidWindow = !bookingDate || !startTime || !endTime
      || Boolean(bookingTimeWindowError(bookingDate, startTime, endTime));
    if (invalidWindow) {
      setConflicts(null);
      setChecking(false);
      setError('');
      return;
    }

    const controller = new AbortController();
    setChecking(true);
    setConflicts(null);
    setError('');
    const timer = window.setTimeout(() => {
      void api.checkScheduleConflicts({
        bookingDate,
        startTime,
        endTime,
        excludeBookingId,
      }, controller.signal)
        .then(setConflicts)
        .catch(err => {
          if ((err as Error).name !== 'AbortError') {
            setError(err instanceof Error ? err.message : 'Could not check schedule availability.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setChecking(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bookingDate, endTime, excludeBookingId, startTime]);

  return { conflicts, checking, error };
}

export function BookingFormModal(props: Props) {
  const [existingBookingId, setExistingBookingId] = useState('');
  const request = useRef<{ payload: string; id: string }>();
  const save = async (payload: BookingWritePayload) => {
    if (props.booking) {
      const editable = { ...payload };
      delete editable.enquiryId;
      return props.onSave(editable);
    }
    const fingerprint = JSON.stringify(payload);
    if (request.current?.payload !== fingerprint) request.current = { payload: fingerprint, id: crypto.randomUUID() };
    try {
      await props.onSave({ ...payload, creationRequestId: request.current.id });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ENQUIRY_ALREADY_CONVERTED' && typeof error.body.bookingId === 'string') setExistingBookingId(error.body.bookingId);
      throw error;
    }
  };
  return <>
    {existingBookingId && <div role="alert" className="fixed left-4 top-4 z-[100] rounded-lg bg-amber-50 p-4"><a className="font-semibold underline" href={`/admin/bookings/${existingBookingId}`}>This enquiry is already converted. Open booking</a></div>}
    <BookingWizard {...props} onSave={save} />
  </>;
}

function BookingWizard({
  booking,
  enquiry: initialEnquiry,
  packages,
  services,
  staffAccounts,
  onClose,
  onSave,
  initialSchedule,
}: Props) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(initialEnquiry || null);
  const [selectingEnquiry, setSelectingEnquiry] = useState(false);
  const selectionVersion = useRef(0);
  const confirm = useConfirmDialog();
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { user } = useAuth();
  const canEditBookingPricing = canViewBookingPricing(user?.role);
  const scheduleDraftSuffix = initialSchedule
    ? `${initialSchedule.bookingDate}:${initialSchedule.startTime}`
    : 'new';
  const draftKey = `doll_admin_booking_draft:${booking?.id || initialEnquiry?.id || scheduleDraftSuffix}`;
  const stored = readBookingDraft(draftKey);
  const restoredStep = stored?.step && stored.step >= 0 && stored.step <= 3 ? stored.step : 0;
  const [customerName, setCustomerName] = useState(stored?.customerName ?? booking?.customerName ?? enquiry?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(stored?.customerPhone ?? booking?.customerPhone ?? enquiry?.phone ?? '');
  const [customerEmail, setCustomerEmail] = useState(stored?.customerEmail ?? booking?.customerEmail ?? enquiry?.email ?? '');
  const [source, setSource] = useState<EnquirySource | ''>(stored?.source ?? booking?.source ?? enquiry?.source ?? 'website');
  const [shootType, setShootType] = useState(
    stored?.shootType || booking?.shootType || enquiry?.shootType || photographyServiceOptions(services)[0] || '',
  );
  const [preferredEvent, setPreferredEvent] = useState(stored?.preferredEvent ?? booking?.preferredEvent ?? enquiry?.preferredEvent ?? '');
  const [bookingDate, setBookingDate] = useState(stored?.bookingDate ?? booking?.bookingDate ?? enquiry?.bookingDate ?? initialSchedule?.bookingDate ?? '');
  const [startTime, setStartTime] = useState(stored?.startTime ?? booking?.startTime ?? enquiry?.startTime ?? initialSchedule?.startTime ?? '');
  const [endTime, setEndTime] = useState(stored?.endTime ?? booking?.endTime ?? enquiry?.endTime ?? initialSchedule?.endTime ?? '');
  const [location, setLocation] = useState(
    stored?.location ?? booking?.location ?? enquiry?.location ?? NEW_BOOKING_DEFAULTS.location,
  );
  const [packageId, setPackageId] = useState(stored?.packageId ?? booking?.packageId ?? '');
  const [agreedTotal, setAgreedTotal] = useState(
    canEditBookingPricing
      ? stored?.agreedTotal ?? (booking?.agreedTotal == null ? '' : String(booking.agreedTotal))
      : '',
  );
  const [assignedStaffAccountId, setAssignedStaffAccountId] = useState(
    stored?.assignedStaffAccountId ?? booking?.assignedStaffAccountId ?? '',
  );
  const [advanceAmount, setAdvanceAmount] = useState(stored?.advanceAmount ?? '');
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>(stored?.advanceMethod ?? 'upi');
  const [paymentDueDate, setPaymentDueDate] = useState(stored?.paymentDueDate ?? booking?.paymentDueDate ?? '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState(stored?.nextFollowUpAt ?? localDateTime(booking?.nextFollowUpAt));
  const [followUpNote, setFollowUpNote] = useState(stored?.followUpNote ?? booking?.followUpNote ?? '');
  const [notes, setNotes] = useState(() => {
    if (stored) return stored.notes || '';
    if (booking?.notes) return booking.notes;
    return enquiry ? [enquiry.message, enquiry.notes].filter(Boolean).join('\n\n') : '';
  });
  const [whatsappOptIn, setWhatsappOptIn] = useState(
    stored?.whatsappOptIn ?? booking?.whatsappOptIn ?? enquiry?.whatsappOptIn ?? NEW_BOOKING_DEFAULTS.whatsappOptIn,
  );
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(
    stored?.whatsappNotificationsEnabled ?? booking?.whatsappNotificationsEnabled ?? enquiry?.whatsappNotificationsEnabled ?? NEW_BOOKING_DEFAULTS.whatsappNotificationsEnabled,
  );
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<BookingWizardFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [acknowledgeUntimedConflict, setAcknowledgeUntimedConflict] = useState(false);
  useEffect(() => setAcknowledgeUntimedConflict(false), [bookingDate, startTime, endTime]);
  const [step, setStep] = useState(restoredStep);
  const [highestCompletedStep, setHighestCompletedStep] = useState(
    initialHighestCompletedStep(restoredStep),
  );
  const [customerLookup, setCustomerLookup] = useState<CustomerLookupResponse | null>(null);
  const [newShootConfirmed, setNewShootConfirmed] = useState(false);
  const [separateShootReason, setSeparateShootReason] = useState('');
  const [lookupRefresh, setLookupRefresh] = useState(0);
  const [reviewedRecordIds, setReviewedRecordIds] = useState<string[]>([]);
  const [customerLookupChecking, setCustomerLookupChecking] = useState(false);
  const scheduleAvailability = useScheduleAvailability(
    bookingDate,
    startTime,
    endTime,
    booking?.id,
  );
  const selectEnquiry = async (id: string) => {
    const version = ++selectionVersion.current;
    setSelectingEnquiry(true);
    setError('');
    try {
      const row = await api.getEnquiry(id);
      if (version !== selectionVersion.current) return;
      if (!row) throw new Error('Enquiry could not be loaded.');
      setEnquiry(row);
      setCustomerName(row.name);
      setCustomerEmail(row.email);
      setSource(row.source);
      // Keep the entered phone; lookup can return a masked number for this staff member.
      const nextService = row.shootType || shootType;
      setShootType(nextService);
      const selectedPackage = packages.find(item => item.id === packageId);
      if (selectedPackage && !packageMatchesShootType(selectedPackage, nextService)) {
        setPackageId('');
        if (selectedPackage.price != null && agreedTotal === String(selectedPackage.price)) setAgreedTotal('');
      }
      setPreferredEvent(current => current || row.preferredEvent);
      setBookingDate(current => current || row.bookingDate);
      setStartTime(current => current || row.startTime || '');
      setEndTime(current => current || row.endTime || '');
      setLocation(current => current || row.location);
      setNotes(current => current || [row.message, row.notes].filter(Boolean).join('\n\n'));
      setWhatsappOptIn(row.whatsappOptIn);
      setWhatsappNotificationsEnabled(row.whatsappNotificationsEnabled);
      setNewShootConfirmed(false);
      setSeparateShootReason('');
      setReviewedRecordIds([]);
      setFieldErrors({});
      setHighestCompletedStep(0);
      setStep(1);
    } catch (error) {
      if (version === selectionVersion.current) setError(error instanceof Error ? error.message : 'Could not load enquiry.');
    } finally { if (version === selectionVersion.current) setSelectingEnquiry(false); }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeAndDiscardDraft = useCallback(() => {
    discardBookingFormDraft(localStorage, draftKey);
    onClose();
  }, [draftKey, onClose]);

  useEffect(() => {
    onCloseRef.current = closeAndDiscardDraft;
  }, [closeAndDiscardDraft]);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      const initialField = dialogRef.current?.querySelector<HTMLElement>('[data-wizard-autofocus]');
      const closeButton = dialogRef.current?.querySelector<HTMLElement>('[aria-label="Close"]');
      (initialField || closeButton)?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const draft: BookingDraft = {
      customerName, customerPhone, customerEmail, source, shootType, preferredEvent,
      bookingDate, startTime, endTime, location, packageId, agreedTotal, assignedStaffAccountId,
      advanceAmount, advanceMethod, paymentDueDate, nextFollowUpAt, followUpNote, notes, whatsappOptIn,
      whatsappNotificationsEnabled, step,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [advanceAmount, advanceMethod, agreedTotal, assignedStaffAccountId, bookingDate, customerEmail, customerName, customerPhone, draftKey, endTime, followUpNote, location, nextFollowUpAt, notes, packageId, paymentDueDate, preferredEvent, shootType, source, startTime, step, whatsappNotificationsEnabled, whatsappOptIn]);

  const handlePackage = (id: string) => {
    setPackageId(id);
    const prefill = packagePrefill(packages, id, shootType);
    if (canEditBookingPricing && prefill.agreedTotal !== undefined) setAgreedTotal(prefill.agreedTotal);
    setShootType(prefill.shootType);
  };

  const handleShootType = (nextShootType: string) => {
    setShootType(nextShootType);
    const selectedPackage = packages.find(item => item.id === packageId);
    if (selectedPackage && !packageMatchesShootType(selectedPackage, nextShootType)) {
      setPackageId('');
      if (selectedPackage.price != null && agreedTotal === String(selectedPackage.price)) setAgreedTotal('');
    }
  };

  const validationValues = () => ({
    customerName,
    customerPhone,
    bookingDate,
    startTime,
    endTime,
  });

  const focusFirstFieldError = (invalidStep: number, errors: BookingWizardFieldErrors) => {
    let id = '';
    if (invalidStep === 0) {
      id = errors.customerName ? 'booking-customer-name' : 'booking-customer-phone';
    } else if (invalidStep === 1 && errors.time) {
      id = !bookingDate ? 'booking-date' : !startTime ? 'booking-start-time' : !endTime ? 'booking-duration-1' : 'booking-end-time';
    }
    if (id) window.setTimeout(() => document.getElementById(id)?.focus(), 0);
  };

  const openCompletedStep = (targetStep: number) => {
    if (!canOpenBookingWizardStep(targetStep, step, highestCompletedStep)) return;
    setError('');
    setFieldErrors({});
    setStep(targetStep);
  };

  const invalidateStep = (editedStep: number) => {
    setHighestCompletedStep(current => invalidateBookingWizardProgress(current, editedStep));
  };

  const submit = async () => {
    if (saving || selectingEnquiry) return;
    const customerErrors = validateBookingWizardStep(0, validationValues());
    if (enquiry && customerPhone === enquiry.phone) delete customerErrors.customerPhone;
    if (Object.keys(customerErrors).length) {
      setError('');
      setFieldErrors(customerErrors);
      setHighestCompletedStep(-1);
      setStep(0);
      focusFirstFieldError(0, customerErrors);
      return;
    }
    if (!booking && !enquiry && customerLookup?.active.length && (!newShootConfirmed || separateShootReason.trim().length < 10)) return setError('Open the active record or confirm this is a separate shoot.');
    if (!booking && !enquiry && (customerLookupChecking || !customerLookup)) {
      setStep(0);
      return setError('Review the customer records before saving.');
    }
    const shootErrors = validateBookingWizardStep(1, validationValues());
    if (Object.keys(shootErrors).length) {
      setError('');
      setFieldErrors(shootErrors);
      setHighestCompletedStep(current => Math.min(current, 0));
      setStep(1);
      focusFirstFieldError(1, shootErrors);
      return;
    }
    if (scheduleAvailability.checking) {
      setStep(1);
      return setError('Wait while schedule availability is checked.');
    }
    if (scheduleAvailability.error) {
      setStep(1);
      return setError('Schedule availability could not be verified. Change the time or try again.');
    }
    if (scheduleAvailability.conflicts?.blocked) {
      setStep(1);
      return setError('This time overlaps another active booking. Choose another time.');
    }
    setSaving(true);
    setError('');
    setFieldErrors({});
    const payload: BookingWritePayload = {
      acknowledgeUntimedConflict: acknowledgeUntimedConflict || undefined,
      ...(!booking && !enquiry && newShootConfirmed ? { separateShootReason: separateShootReason.trim(), reviewedRecordIds } : {}),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      source: source || undefined,
      shootType: shootType || undefined,
      preferredEvent: preferredEvent.trim(),
      bookingDate,
      startTime,
      endTime,
      location: location.trim(),
      packageId: packageId || null,
      agreedTotal: canEditBookingPricing ? (agreedTotal === '' ? null : Number(agreedTotal)) : undefined,
      assignedStaffAccountId: assignedStaffAccountId || null,
      advanceAmount: canViewPayments && enquiry && Number(advanceAmount) > 0 ? Number(advanceAmount) : undefined,
      advanceMethod: canViewPayments && enquiry && Number(advanceAmount) > 0 ? advanceMethod : undefined,
      paymentDueDate: canViewPayments ? paymentDueDate : undefined,
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
      followUpNote: followUpNote.trim() || undefined,
      notes: notes.trim(),
      enquiryId: !booking && enquiry ? enquiry.id : booking?.enquiryId,
      whatsappOptIn,
      whatsappNotificationsEnabled: whatsappOptIn && whatsappNotificationsEnabled,
      preferredLanguage: 'en',
    };
    try {
      await onSave(payload);
      localStorage.removeItem(draftKey);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CUSTOMER_RECORD_RESOLUTION_REQUIRED') {
        setStep(0);
        setNewShootConfirmed(false);
        setCustomerLookup(null);
        setLookupRefresh(value => value + 1);
      }
      if (err instanceof ApiError && err.code === 'UNTIMED_CONFIRMATION_REQUIRED') {
        const accepted = await confirm({
          title: 'Another booking has no time',
          description: 'There is an active booking on this date without a time. Continue only after checking it will not clash.',
          confirmLabel: 'Continue booking',
        });
        if (accepted) {
          setAcknowledgeUntimedConflict(true);
          try {
            await onSave({ ...payload, acknowledgeUntimedConflict: true });
            localStorage.removeItem(draftKey);
            return;
          } catch (retryError) {
            if (retryError instanceof ApiError && retryError.code === 'CUSTOMER_RECORD_RESOLUTION_REQUIRED') {
              setStep(0); setNewShootConfirmed(false); setCustomerLookup(null); setLookupRefresh(value => value + 1);
            }
            setError(retryError instanceof Error ? retryError.message : 'Failed to save booking');
            return;
          }
        }
      }
      setError(err instanceof Error ? err.message : 'Failed to save booking');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (selectingEnquiry) return;
    const nextErrors = validateBookingWizardStep(step, validationValues());
    if (step === 0 && enquiry && customerPhone === enquiry.phone) delete nextErrors.customerPhone;
    if (Object.keys(nextErrors).length) {
      setError('');
      setFieldErrors(nextErrors);
      focusFirstFieldError(step, nextErrors);
      return;
    }
    if (step === 0 && !booking && !enquiry && customerLookup?.active.length && (!newShootConfirmed || separateShootReason.trim().length < 10)) {
      return setError('Open the active record or confirm this is a separate shoot.');
    }
    if (step === 0 && !booking && !enquiry && (customerLookupChecking || !customerLookup)) return setError('Wait a moment while customer history is checked.');
    if (step === 1 && scheduleAvailability.checking) return setError('Wait while schedule availability is checked.');
    if (step === 1 && scheduleAvailability.error) return setError('Schedule availability could not be verified. Change the time or try again.');
    if (step === 1 && scheduleAvailability.conflicts?.blocked) return setError('This time overlaps another active booking. Choose another time.');
    setError('');
    setFieldErrors({});
    setHighestCompletedStep(current => Math.max(current, step));
    setStep(value => value + 1);
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const matchingPackages = packagesForShootType(packages, shootType);
  const serviceOptions = useMemo(
    () => photographyServiceOptions(services, shootType),
    [services, shootType],
  );
  useEffect(() => {
    if (!shootType && serviceOptions[0]) setShootType(serviceOptions[0]);
  }, [serviceOptions, shootType]);
  const selectedPackageOutsideFilter = packages.find(
    item => item.id === packageId && !packageMatchesShootType(item, shootType),
  );
  const wizardSteps = canEditBookingPricing
    ? BOOKING_WIZARD_STEPS
    : BOOKING_WIZARD_STEPS.map((wizardStep, index) => index === 2 ? {
        label: 'Package & team',
        description: 'Choose a package and assign the booking now, or update them later.',
      } : wizardStep);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="booking-wizard-title" className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-2xl">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <div><h2 id="booking-wizard-title" className="text-lg font-semibold text-slate-900">{booking ? 'Edit booking' : 'Create booking'}</h2><p className="mt-0.5 text-xs font-medium text-slate-500">Step {step + 1} of {wizardSteps.length}</p></div>
            <button type="button" onClick={closeAndDiscardDraft} className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Close">
            <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-4" aria-label="Booking progress">
            <ol className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {wizardSteps.map((wizardStep, index) => {
                const current = index === step;
                const completed = !current && index <= highestCompletedStep;
                const accessible = canOpenBookingWizardStep(index, step, highestCompletedStep);
                return (
                  <li key={wizardStep.label} className="min-w-0">
                    <button
                      type="button"
                      disabled={!accessible}
                      onClick={() => openCompletedStep(index)}
                      aria-current={current ? 'step' : undefined}
                      aria-label={`${wizardStep.label}${current ? ', current step' : completed ? ', completed' : ', not yet available'}`}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${accessible ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${completed ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                        {completed ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                      </span>
                      <span className={`text-[10px] font-semibold leading-tight sm:text-xs ${current ? 'text-blue-700' : completed ? 'text-emerald-700' : 'text-slate-400'}`}>{wizardStep.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
        <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">{wizardSteps[step].description}</p>
            <p className="mt-1 text-xs text-slate-500">Fields marked * are required. Other details can be added later.</p>
          </div>
          {error && (
            <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {step === 0 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.customerName} <span className="font-semibold text-red-600" aria-hidden="true">*</span><span className="sr-only"> required</span><input id="booking-customer-name" data-wizard-autofocus required className={`${input} mt-1 ${fieldErrors.customerName ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`} value={customerName} aria-invalid={Boolean(fieldErrors.customerName)} aria-describedby={fieldErrors.customerName ? 'booking-customer-name-error' : undefined} onChange={e => { setCustomerName(e.target.value); setFieldErrors(current => ({ ...current, customerName: undefined })); invalidateStep(0); }} />{fieldErrors.customerName && <span id="booking-customer-name-error" className="mt-1 block text-xs font-medium text-red-600">{fieldErrors.customerName}</span>}</label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.customerPhone} <span className="font-semibold text-red-600" aria-hidden="true">*</span><span className="sr-only"> required</span><input id="booking-customer-phone" required type="tel" inputMode="tel" maxLength={20} className={`${input} mt-1 ${fieldErrors.customerPhone ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`} value={customerPhone} aria-invalid={Boolean(fieldErrors.customerPhone)} aria-describedby={fieldErrors.customerPhone ? 'booking-customer-phone-error' : undefined} onChange={e => { setCustomerPhone(e.target.value); setEnquiry(null); selectionVersion.current += 1; setSelectingEnquiry(false); setCustomerLookup(null); setNewShootConfirmed(false); setSeparateShootReason(''); setFieldErrors(current => ({ ...current, customerPhone: undefined })); invalidateStep(0); }} />{fieldErrors.customerPhone && <span id="booking-customer-phone-error" className="mt-1 block text-xs font-medium text-red-600">{fieldErrors.customerPhone}</span>}</label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.customerEmail}<input type="email" className={`${input} mt-1`} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></label>
              <LeadSourceSelect value={source} onChange={setSource} allowUnrecorded={source === ''} labelClassName="font-normal" />
            </div>
            {enquiry && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Selected enquiry: {enquiry.name}</strong><p className="mt-1">This booking will be linked to the enquiry when you save.</p><button type="button" onClick={() => { setEnquiry(null); setCustomerLookup(null); setLookupRefresh(value => value + 1); }} className="mt-1 min-h-10 font-semibold underline">Change enquiry</button></div>}
            {selectingEnquiry && <p role="status" className="text-sm text-admin-subtle">Loading enquiry…</p>}
            {!booking && !enquiry && <CustomerLookupPanel phone={customerPhone} refreshKey={lookupRefresh} onBookEnquiry={id => { if (!selectingEnquiry) void selectEnquiry(id); }} separateShootReason={separateShootReason} onReasonChange={value => { setSeparateShootReason(value); setNewShootConfirmed(false); }} allowNewShoot newShootConfirmed={newShootConfirmed} onConfirmNewShoot={() => { setNewShootConfirmed(true); setReviewedRecordIds(customerLookup?.active.map(row => `${row.type}:${row.id}`) || []); setError(''); }} onUseContact={contact => { setCustomerName(contact.customerName); setCustomerEmail(contact.email); setFieldErrors(current => ({ ...current, customerName: undefined })); invalidateStep(0); }} onResult={setCustomerLookup} onChecking={setCustomerLookupChecking} />}
          </section>}

          {step === 1 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shoot details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.shootType} <span className="font-semibold text-red-600" aria-hidden="true">*</span><span className="sr-only"> required</span><select id="booking-shoot-type" data-wizard-autofocus required className={`${input} mt-1`} value={shootType} onChange={e => handleShootType(e.target.value)}>{serviceOptions.map(type => <option key={type}>{type}</option>)}</select></label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.preferredEvent}<input className={`${input} mt-1`} value={preferredEvent} onChange={e => setPreferredEvent(e.target.value)} /></label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.bookingDate}<input id="booking-date" type="date" className={`${input} mt-1 ${fieldErrors.time && !bookingDate ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`} value={bookingDate} aria-invalid={Boolean(fieldErrors.time && !bookingDate)} aria-describedby={fieldErrors.time ? 'booking-time-error booking-time-hint' : 'booking-time-hint'} onChange={e => { setBookingDate(e.target.value); setError(''); setFieldErrors(current => ({ ...current, time: undefined })); invalidateStep(1); }} /></label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.location}<input className={`${input} mt-1`} value={location} onChange={e => setLocation(e.target.value)} /></label>
              <div className="sm:col-span-2">
                <ShootDurationSelector
                  bookingDate={bookingDate}
                  startTime={startTime}
                  endTime={endTime}
                  error={fieldErrors.time}
                  availability={scheduleAvailability}
                  onStartTimeChange={value => { setStartTime(value); setEndTime(''); setError(''); setFieldErrors(current => ({ ...current, time: undefined })); invalidateStep(1); }}
                  onEndTimeChange={value => { setEndTime(value); setError(''); setFieldErrors(current => ({ ...current, time: undefined })); invalidateStep(1); }}
                  onClear={() => { setStartTime(''); setEndTime(''); setError(''); setFieldErrors(current => ({ ...current, time: undefined })); invalidateStep(1); }}
                />
              </div>
            </div>
          </section>}

          {step === 2 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Package and ownership</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.package}<select id="booking-package" data-wizard-autofocus className={`${input} mt-1`} value={packageId} onChange={e => handlePackage(e.target.value)}><option value="">No package</option>{selectedPackageOutsideFilter && <option value={selectedPackageOutsideFilter.id}>{selectedPackageOutsideFilter.name} (current · other service)</option>}{matchingPackages.map(item => <option key={item.id} value={item.id}>{item.name}{item.isPublished ? '' : ' (unpublished)'}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Showing {shootType} packages only.</span></label>
              {canEditBookingPricing && <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.agreedTotal}<input id="booking-agreed-total" type="number" min="0" className={`${input} mt-1`} value={agreedTotal} onChange={e => setAgreedTotal(e.target.value)} placeholder="Not decided" /></label>}
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.assignedStaffAccount}<select className={`${input} mt-1`} value={assignedStaffAccountId} onChange={e => setAssignedStaffAccountId(e.target.value)}><option value="">Unassigned</option>{booking?.assignedStaffAccountId && !staffAccounts.some(account => account.id === booking.assignedStaffAccountId) && <option value={booking.assignedStaffAccountId}>{booking.assignedStaffAccountName || 'Previous assignee'} (current)</option>}{staffAccounts.map(account => <option key={account.id} value={account.id}>{account.name}{account.jobTitle ? ` · ${account.jobTitle}` : ''}</option>)}</select></label>
              {canViewPayments && <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.paymentDueDate}<input type="date" className={`${input} mt-1`} value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} /></label>}
              {canViewPayments && enquiry && <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.advanceAmount}<input type="number" min="0" className={`${input} mt-1`} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} /></label>}
              {canViewPayments && enquiry && Number(advanceAmount) > 0 && <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.advanceMethod}<select className={`${input} mt-1`} value={advanceMethod} onChange={e => setAdvanceMethod(e.target.value as PaymentMethod)}><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></label>}
            </div>
          </section>}

          {step === 3 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next action</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.followUpAt}<input data-wizard-autofocus type="datetime-local" className={`${input} mt-1`} value={nextFollowUpAt} onChange={e => setNextFollowUpAt(e.target.value)} /></label>
              <label className="text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.followUpNote}<input className={`${input} mt-1`} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} /></label>
            </div>
            <label className="block text-sm text-slate-700">{BOOKING_WIZARD_FIELD_LABELS.notes}<textarea rows={3} className={`${input} mt-1 resize-y`} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          </section>}

          {step === 3 && <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">{BOOKING_WIZARD_FIELD_LABELS.whatsapp}</h3>
            <label className="flex items-start gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1" checked={whatsappOptIn} onChange={e => { setWhatsappOptIn(e.target.checked); if (!e.target.checked) setWhatsappNotificationsEnabled(false); }} /><span>Customer has explicitly agreed to receive booking and photoshoot updates through WhatsApp.</span></label>
            <label className="flex items-start gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1" checked={whatsappNotificationsEnabled} disabled={!whatsappOptIn} onChange={e => setWhatsappNotificationsEnabled(e.target.checked)} /><span>Enable automated booking notifications (English).</span></label>
          </section>}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <button type="button" onClick={step === 0 ? closeAndDiscardDraft : () => { setError(''); setFieldErrors({}); setStep(value => value - 1); }} className="h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500">{step === 0 ? 'Cancel' : 'Back'}</button>
          {step < 3 ? <button type="button" onClick={nextStep} disabled={step === 1 && (scheduleAvailability.checking || Boolean(scheduleAvailability.error) || Boolean(scheduleAvailability.conflicts?.blocked))} className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white outline-none hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{step === 1 && scheduleAvailability.checking ? 'Checking…' : 'Next'}</button> : <button type="button" onClick={() => void submit()} disabled={saving || scheduleAvailability.checking || Boolean(scheduleAvailability.error) || Boolean(scheduleAvailability.conflicts?.blocked)} className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white outline-none hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save booking'}</button>}
        </div>
      </div>
    </div>
  );
}

type PresetDuration = 1 | 2 | 3;

function ShootDurationSelector({
  bookingDate,
  startTime,
  endTime,
  error,
  availability,
  onStartTimeChange,
  onEndTimeChange,
  onClear,
}: {
  bookingDate: string;
  startTime: string;
  endTime: string;
  error?: string;
  availability: ScheduleAvailability;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onClear: () => void;
}) {
  const durationMinutes = startTime && endTime
    ? timeToMinutes(endTime) - timeToMinutes(startTime)
    : 0;
  const selectedPreset = ([1, 2, 3] as const).find(hours => durationMinutes === hours * 60);
  const [customOpen, setCustomOpen] = useState(Boolean(durationMinutes && !selectedPreset));
  const [customEndTime, setCustomEndTime] = useState(endTime);
  const [customError, setCustomError] = useState('');
  const canChooseDuration = Boolean(bookingDate && startTime);
  const earlyMorningStart = startTime && timeToMinutes(startTime) < 6 * 60;
  const afternoonEquivalent = earlyMorningStart
    ? minutesToTime(timeToMinutes(startTime) + 12 * 60)
    : '';

  const choosePreset = (hours: PresetDuration) => {
    if (!canChooseDuration) return;
    onEndTimeChange(endTimeFor(startTime, hours));
    setCustomOpen(false);
    setCustomError('');
  };

  const openCustom = () => {
    if (!canChooseDuration) return;
    const existingCustomEnd = durationMinutes > 0 && !selectedPreset ? endTime : '';
    setCustomEndTime(existingCustomEnd || endTimeFor(startTime, 1));
    setCustomError('');
    setCustomOpen(true);
  };

  const applyCustom = () => {
    if (!customEndTime || timeToMinutes(customEndTime) <= timeToMinutes(startTime)) {
      setCustomError('End time must be later than the shoot start.');
      return;
    }
    onEndTimeChange(customEndTime);
    setCustomError('');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4" aria-labelledby="shoot-duration-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 id="shoot-duration-title" className="text-sm font-semibold text-slate-800">Choose shoot duration</h4>
          <p className="mt-0.5 text-xs text-slate-500">Choose when the shoot starts, then select its duration.</p>
        </div>
        {(startTime || endTime) && <button type="button" onClick={() => { setCustomOpen(false); setCustomError(''); onClear(); }} className="shrink-0 text-xs font-semibold text-slate-600 underline-offset-2 hover:underline">Clear time</button>}
      </div>

      <label className="mt-3 block text-sm text-slate-700">Shoot start
        <input
          id="booking-start-time"
          type="time"
          disabled={!bookingDate}
          className={`mt-1 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'} disabled:bg-slate-100 disabled:text-slate-400`}
          value={startTime}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'booking-time-error booking-time-hint' : 'booking-time-hint'}
          onChange={event => { setCustomOpen(false); setCustomError(''); onStartTimeChange(event.target.value); }}
        />
      </label>
      <p id="booking-time-hint" className="mt-1 text-xs text-slate-500">{bookingDate ? 'Leave the shoot time blank if it is not decided yet.' : 'Choose a booking date before setting the shoot time.'}</p>
      {earlyMorningStart && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><strong className="block">You selected {formatScheduleTime(startTime)} — after midnight.</strong><span className="mt-0.5 block text-xs">If you meant afternoon, use {formatScheduleTime(afternoonEquivalent)}.</span><button type="button" onClick={() => onStartTimeChange(afternoonEquivalent)} className="mt-2 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900">Change to {formatScheduleTime(afternoonEquivalent)}</button></div></div>}

      <div className="mt-3 grid gap-2">
        {([1, 2, 3] as const).map(hours => {
          const crossesMidnight = startTime ? timeToMinutes(startTime) + hours * 60 >= 24 * 60 : false;
          const disabled = !canChooseDuration || crossesMidnight;
          const selected = selectedPreset === hours && !customOpen;
          const selectedBlocked = selected && Boolean(availability.conflicts?.blocked);
          const calculatedEndTime = startTime && !crossesMidnight ? endTimeFor(startTime, hours) : '';
          return (
            <button
              id={hours === 1 ? 'booking-duration-1' : undefined}
              key={hours}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => choosePreset(hours)}
              className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedBlocked ? 'border-red-500 bg-red-50 text-red-800' : selected ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-800 hover:border-blue-400'} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <span><strong className="block text-sm">{hours} hour{hours === 1 ? '' : 's'}</strong><span className="mt-0.5 block text-xs">{calculatedEndTime ? `${formatScheduleTime(startTime)}–${formatScheduleTime(calculatedEndTime)}` : crossesMidnight ? 'Ends after midnight' : 'Select a start time first'}</span></span>
              {selectedBlocked ? <span className="text-xs font-semibold">Unavailable</span> : selected ? <Check className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <ChevronRight className="h-5 w-5" aria-hidden="true" />}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!canChooseDuration}
          aria-expanded={customOpen}
          onClick={openCustom}
          className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${customOpen ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-800 hover:border-blue-400'} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
        >
          <span><strong className="block text-sm">Custom duration</strong><span className="mt-0.5 block text-xs">Choose an exact end time</span></span>
          <ChevronRight className={`h-5 w-5 transition ${customOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {customOpen && <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3"><label className="text-sm text-slate-700">Shoot ends at<input id="booking-end-time" autoFocus type="time" min={startTime || undefined} value={customEndTime} onChange={event => { setCustomEndTime(event.target.value); setCustomError(''); }} className={`mt-1 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${customError || error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`} /></label>{customError && <p className="mt-1 text-xs font-medium text-red-600">{customError}</p>}<button type="button" onClick={applyCustom} className="mt-3 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">Apply custom duration</button></div>}

      {error && <p id="booking-time-error" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      {!error && startTime && endTime && !availability.conflicts?.blocked && <p className="mt-2 text-xs font-medium text-emerald-700">Selected: {formatScheduleTime(startTime)}–{formatScheduleTime(endTime)} · {bookingDurationLabel(startTime, endTime)}</p>}
      <ScheduleAvailabilityNotice availability={availability} />
    </section>
  );
}

function ScheduleAvailabilityNotice({ availability }: { availability: ScheduleAvailability }) {
  if (availability.checking) {
    return <p className="mt-3 text-sm font-medium text-slate-500" role="status">Checking schedule availability…</p>;
  }
  if (availability.error) {
    return <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert"><AlertCircle className="h-5 w-5 shrink-0" /><span><strong>Availability check failed.</strong> {availability.error}</span></div>;
  }
  if (availability.conflicts?.timedConflicts.length) {
    return <div className="mt-3 space-y-2" aria-live="polite">{availability.conflicts.timedConflicts.map(conflict => <div key={conflict.id} className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><span><strong>Time unavailable.</strong> {conflict.customerName} is booked {formatScheduleTime(conflict.startTime)}–{formatScheduleTime(conflict.endTime)}.</span></div>)}</div>;
  }
  if (availability.conflicts?.requiresUntimedConfirmation) {
    const count = availability.conflicts.untimedConflicts.length;
    return <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status"><AlertTriangle className="h-5 w-5 shrink-0" /><span>{count} active booking{count === 1 ? '' : 's'} on this date {count === 1 ? 'has' : 'have'} no time. Confirmation will be required before saving.</span></div>;
  }
  if (availability.conflicts) {
    return <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status"><Check className="h-4 w-4" />This time is available.</p>;
  }
  return null;
}

function readBookingDraft(key: string): BookingDraft | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as BookingDraft | null; }
  catch { return null; }
}
