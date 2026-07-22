import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { ApiError, parseApiFieldErrors, publicApi } from '../lib/api';

const ENQUIRY_FIELDS = [
  'name',
  'email',
  'phone',
  'shootType',
  'preferredEvent',
  'shootDate',
  'location',
  'reminderDate',
  'notes',
  'message',
] as const;

type EnquiryField = (typeof ENQUIRY_FIELDS)[number];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-400">{message}</p>;
}
import {
  trackBookingStart,
  trackEmailCapture,
  trackGenerateLead,
  trackWhatsAppClick,
} from '../lib/analytics';
import {
  DEFAULT_SHOOT_TYPE,
  SHOOT_TYPE_OPTIONS,
  type ShootTypeOption,
} from '../lib/shootTypes';
import { enquiryWhatsAppUrl } from '../lib/pricing';
import { useSiteData } from '../contexts/SiteDataContext';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export interface EnquiryPrefill {
  packageName?: string;
  shootType?: ShootTypeOption;
  preferredEvent?: string;
  message?: string;
}

export function EnquiryModal({
  onClose,
  prefill,
}: {
  onClose: () => void;
  prefill?: EnquiryPrefill;
}) {
  const { siteContent } = useSiteData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shootType, setShootType] = useState<ShootTypeOption>(
    prefill?.shootType ?? DEFAULT_SHOOT_TYPE,
  );
  const [preferredEvent, setPreferredEvent] = useState(prefill?.preferredEvent ?? '');
  const [shootDate, setShootDate] = useState('');
  const [location, setLocation] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(prefill?.message ?? '');
  const [tipsOptIn, setTipsOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EnquiryField, string>>>({});
  const [submittedTipsOptIn, setSubmittedTipsOptIn] = useState(false);
  // One booking_start per modal open (not per field change).
  const bookingStartSent = useRef(false);
  const leadSent = useRef(false);
  const emailCaptureSent = useRef(false);

  const whatsappCtx = {
    name,
    shootType,
    preferredEvent,
    shootDate,
    location,
  };
  const whatsappUrl = enquiryWhatsAppUrl(siteContent.whatsapp, whatsappCtx);

  useEffect(() => {
    if (bookingStartSent.current) return;
    bookingStartSent.current = true;
    trackBookingStart({
      service_name: prefill?.packageName || shootType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on open
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleWhatsApp = () => {
    trackWhatsAppClick({
      cta_location: 'booking_page',
      service_name: prefill?.packageName || shootType,
    });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const clearFieldError = (field: EnquiryField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    setFieldErrors({});
    const messageWithOptIn = tipsOptIn
      ? `${message.trim()}\n\n[Tips email: yes]`
      : message;
    try {
      await publicApi.createEnquiry({
        name,
        email,
        phone: phone.trim() || undefined,
        shootType,
        preferredEvent: preferredEvent.trim() || undefined,
        shootDate: shootDate.trim() || undefined,
        location: location.trim() || undefined,
        reminderDate: reminderDate.trim() || undefined,
        notes: notes.trim() || undefined,
        message: messageWithOptIn,
      });
      setSubmittedTipsOptIn(tipsOptIn);
      setStatus('success');
      if (!leadSent.current) {
        leadSent.current = true;
        trackGenerateLead({
          method: 'booking_form',
          service_name: prefill?.packageName || shootType,
        });
      }
      if (tipsOptIn && !emailCaptureSent.current) {
        emailCaptureSent.current = true;
        trackEmailCapture({
          method: 'booking_form',
          service_name: shootType,
        });
      }
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        const next = parseApiFieldErrors(err.messages, ENQUIRY_FIELDS);
        setFieldErrors(next);
        const unmapped = err.messages.filter(
          (msg) => !ENQUIRY_FIELDS.some((f) => msg === f || msg.startsWith(`${f} `)),
        );
        setErrorMsg(
          Object.keys(next).length === 0
            ? err.message || 'Failed to send enquiry'
            : unmapped.join(', '),
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to send enquiry');
      }
    }
  };

  const fieldClass = (hasError?: boolean) =>
    `w-full px-4 py-3 bg-ink-950 border rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400 ${
      hasError ? 'border-red-400/60' : 'border-hairline/10'
    }`;

  const nextSteps = [
    'We review your enquiry',
    'We confirm details on WhatsApp or email',
    'You get a free consultation before booking',
  ];

  const modal = (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      data-smooth-scroll-ignore
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex h-[min(90vh,900px)] max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-hairline/10 bg-ink-900"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking form"
          className="absolute right-4 top-4 z-10 text-ink-200 hover:text-ink-50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {status === 'success' ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 py-8 text-left">
              <h3
                id="enquiry-modal-title"
                className="mb-2 text-center font-display text-2xl text-ink-50"
              >
                Thank you!
              </h3>
              <p className="text-center text-ink-200/70">
                We&apos;ll reply within 24 hours.
              </p>
              <ol className="mt-6 space-y-2.5">
                {nextSteps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-ink-200/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-400/40 text-xs text-gold-300">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              {submittedTipsOptIn ? (
                <p className="mt-4 text-center text-sm text-ink-200/60">
                  Shoot-prep tips will also go to your email.
                </p>
              ) : null}
            </div>
            <div className="shrink-0 border-t border-hairline/10 bg-ink-900 px-6 py-4">
              <button
                type="button"
                onClick={handleWhatsApp}
                aria-label="Continue on WhatsApp"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-gold-400/40 text-gold-300 transition-colors hover:border-gold-400/70"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Continue on WhatsApp
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-6 pr-12">
              <h3
                id="enquiry-modal-title"
                className="font-display text-2xl text-ink-50"
              >
                Book a Consultation
              </h3>
              {prefill?.packageName ? (
                <p className="text-sm text-gold-300/80">
                  Package: {prefill.packageName}
                </p>
              ) : null}
              <div>
                <input
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                  placeholder="Your name"
                  aria-label="Your name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={fieldClass(Boolean(fieldErrors.name))}
                />
                <FieldError message={fieldErrors.name} />
              </div>
              <div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  placeholder="Email"
                  aria-label="Email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={fieldClass(Boolean(fieldErrors.email))}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <input
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  placeholder="Phone (optional)"
                  aria-label="Phone (optional)"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className={fieldClass(Boolean(fieldErrors.phone))}
                />
                <FieldError message={fieldErrors.phone} />
              </div>
              <div>
                <select
                  value={shootType}
                  onChange={e => {
                    setShootType(e.target.value as ShootTypeOption);
                    clearFieldError('shootType');
                  }}
                  aria-label="Shoot type"
                  aria-invalid={Boolean(fieldErrors.shootType)}
                  className={fieldClass(Boolean(fieldErrors.shootType))}
                >
                  {SHOOT_TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.shootType} />
              </div>
              <div>
                <input
                  value={preferredEvent}
                  onChange={e => {
                    setPreferredEvent(e.target.value);
                    clearFieldError('preferredEvent');
                  }}
                  placeholder="Preferred event (e.g. Wedding, Anniversary)"
                  aria-label="Preferred event"
                  aria-invalid={Boolean(fieldErrors.preferredEvent)}
                  className={fieldClass(Boolean(fieldErrors.preferredEvent))}
                />
                <FieldError message={fieldErrors.preferredEvent} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-ink-200/50">Shoot date</label>
                  <input
                    type="date"
                    value={shootDate}
                    onChange={e => {
                      setShootDate(e.target.value);
                      clearFieldError('shootDate');
                    }}
                    aria-label="Shoot date"
                    aria-invalid={Boolean(fieldErrors.shootDate)}
                    className={fieldClass(Boolean(fieldErrors.shootDate))}
                  />
                  <FieldError message={fieldErrors.shootDate} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-ink-200/50">Reminder date (optional)</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={e => {
                      setReminderDate(e.target.value);
                      clearFieldError('reminderDate');
                    }}
                    aria-label="Reminder date (optional)"
                    aria-invalid={Boolean(fieldErrors.reminderDate)}
                    className={fieldClass(Boolean(fieldErrors.reminderDate))}
                  />
                  <FieldError message={fieldErrors.reminderDate} />
                </div>
              </div>
              <div>
                <input
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    clearFieldError('location');
                  }}
                  placeholder="Shoot location (e.g. pre-wedding venue / city)"
                  aria-label="Shoot location"
                  aria-invalid={Boolean(fieldErrors.location)}
                  className={fieldClass(Boolean(fieldErrors.location))}
                />
                <FieldError message={fieldErrors.location} />
              </div>
              <div>
                <textarea
                  required
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    clearFieldError('message');
                  }}
                  placeholder="Tell us about your event..."
                  aria-label="Tell us about your event"
                  aria-invalid={Boolean(fieldErrors.message)}
                  rows={3}
                  className={`${fieldClass(Boolean(fieldErrors.message))} resize-none`}
                />
                <FieldError message={fieldErrors.message} />
              </div>
              <div>
                <textarea
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value);
                    clearFieldError('notes');
                  }}
                  placeholder="Additional notes (optional)"
                  aria-label="Additional notes"
                  aria-invalid={Boolean(fieldErrors.notes)}
                  rows={2}
                  className={`${fieldClass(Boolean(fieldErrors.notes))} resize-none`}
                />
                <FieldError message={fieldErrors.notes} />
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-ink-200/70">
                <input
                  type="checkbox"
                  checked={tipsOptIn}
                  onChange={e => setTipsOptIn(e.target.checked)}
                  className="mt-1 rounded border-hairline/20 bg-ink-950 text-gold-400 focus:ring-gold-400"
                />
                <span>
                  Email me shoot-prep tips for Erode / Tamil Nadu sessions
                </span>
              </label>
              {status === 'error' && errorMsg ? (
                <p className="text-sm text-red-400">{errorMsg}</p>
              ) : null}
              <p className="text-xs leading-relaxed text-ink-200/50">
                By submitting, you agree to our{' '}
                <Link
                  to="/terms"
                  className="text-gold-400/80 underline-offset-2 hover:text-gold-300 hover:underline"
                  onClick={onClose}
                >
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link
                  to="/privacy"
                  className="text-gold-400/80 underline-offset-2 hover:text-gold-300 hover:underline"
                  onClick={onClose}
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="shrink-0 border-t border-hairline/10 bg-ink-900 px-6 py-4">
              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="rounded-lg bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2 text-xs font-medium tracking-wide text-on-gold transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Enquiry'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  aria-label="Chat on WhatsApp"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline/20 text-[#25D366] transition-colors hover:border-[#25D366]/50 hover:bg-[#25D366]/10"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
