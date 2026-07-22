import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Booking, BookingStatus } from '../types';
import { SHOOT_TYPE_OPTIONS } from '../../lib/shootTypes';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  Pencil,
  X,
  XCircle,
} from 'lucide-react';
import { deliveryWhatsAppUrl, whatsappDigits } from '../../lib/pricing';

const STATUSES: BookingStatus[] = ['draft', 'confirmed', 'cancelled', 'completed'];

function statusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' };
    case 'confirmed':
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
    case 'completed':
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDay(dateStr: string) {
  if (!dateStr) return '—';
  // Prefer plain YYYY-MM-DD display when already a date-only string
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(`${dateStr}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return formatDate(dateStr);
}

async function copyText(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore clipboard failures
  }
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Drive link draft state (save independently)
  const [driveGalleryUrl, setDriveGalleryUrl] = useState('');
  const [driveEditedUrl, setDriveEditedUrl] = useState('');
  const [driveRawsUrl, setDriveRawsUrl] = useState('');
  const [driveNotes, setDriveNotes] = useState('');
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveSaved, setDriveSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getBooking(id);
        if (cancelled) return;
        if (!data) {
          setError('Booking not found');
          setBooking(null);
          return;
        }
        setBooking(data);
        setDriveGalleryUrl(data.driveGalleryUrl);
        setDriveEditedUrl(data.driveEditedUrl);
        setDriveRawsUrl(data.driveRawsUrl);
        setDriveNotes(data.driveNotes);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load booking');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStatusChange = async (status: BookingStatus) => {
    if (!booking) return;
    try {
      const updated = await api.updateBooking(booking.id, { status });
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      const updated = await api.confirmBooking(booking.id);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
    }
  };

  const handleSaveDrive = async () => {
    if (!booking) return;
    setIsSavingDrive(true);
    setDriveSaved(false);
    setError(null);
    try {
      const updated = await api.updateBooking(booking.id, {
        driveGalleryUrl: driveGalleryUrl.trim(),
        driveEditedUrl: driveEditedUrl.trim(),
        driveRawsUrl: driveRawsUrl.trim(),
        driveNotes: driveNotes.trim(),
      });
      setBooking(updated);
      setDriveSaved(true);
      setTimeout(() => setDriveSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Drive links');
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    await copyText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const canShareDelivery =
    Boolean(booking && whatsappDigits(booking.customerPhone)) &&
    Boolean(driveGalleryUrl.trim() || driveEditedUrl.trim() || driveRawsUrl.trim());

  const handleShareWhatsApp = () => {
    if (!booking) return;
    const url = deliveryWhatsAppUrl(booking.customerPhone, {
      customerName: booking.customerName,
      shootType: booking.shootType,
      galleryUrl: driveGalleryUrl,
      editedUrl: driveEditedUrl,
      rawsUrl: driveRawsUrl,
      driveNotes,
    });
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditSave = async (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    preferredEvent?: string;
    shootDate?: string;
    location?: string;
    reminderDate?: string;
    notes?: string;
    status?: BookingStatus;
  }) => {
    if (!booking) return;
    const updated = await api.updateBooking(booking.id, data);
    setBooking(updated);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to bookings
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  const badge = statusBadge(booking.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="ml-auto hover:text-red-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/bookings')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to bookings
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900">{booking.customerName}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            {booking.shootType || 'Shoot'} · Created {formatDate(booking.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          {booking.status === 'draft' && (
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Contact & shoot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <a href={`tel:${booking.customerPhone}`} className="text-blue-600 hover:underline">
              {booking.customerPhone}
            </a>
          </Field>
          <Field label="Email">
            {booking.customerEmail ? (
              <a href={`mailto:${booking.customerEmail}`} className="text-blue-600 hover:underline">
                {booking.customerEmail}
              </a>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </Field>
          <Field label="Shoot type">{booking.shootType || '—'}</Field>
          <Field label="Preferred event">{booking.preferredEvent || '—'}</Field>
          <Field label="Shoot date">{formatDay(booking.shootDate)}</Field>
          <Field label="Reminder date">{formatDay(booking.reminderDate)}</Field>
          <Field label="Location" className="sm:col-span-2">
            {booking.location || '—'}
          </Field>
          <Field label="Confirmed at">
            {booking.confirmedAt ? formatDate(booking.confirmedAt) : '—'}
          </Field>
          {booking.enquiryId && (
            <Field label="Enquiry ID">
              <span className="font-mono text-xs">{booking.enquiryId}</span>
            </Field>
          )}
        </div>
        {booking.notes && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Notes</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Delivery / Google Drive
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Paste share links to store and send galleries to the client.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {driveSaved && (
              <span className="text-sm text-green-600 font-medium">Saved</span>
            )}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={!canShareDelivery}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              Send via WhatsApp
            </button>
          </div>
        </div>
        {!canShareDelivery && (
          <p className="text-xs text-gray-500">
            Add a phone number and at least one Drive link to share.
          </p>
        )}

        <DriveLinkField
          label="Gallery folder"
          value={driveGalleryUrl}
          onChange={setDriveGalleryUrl}
          copied={copiedKey === 'gallery'}
          onCopy={() => handleCopy('gallery', driveGalleryUrl)}
        />
        <DriveLinkField
          label="Edited photos"
          value={driveEditedUrl}
          onChange={setDriveEditedUrl}
          copied={copiedKey === 'edited'}
          onCopy={() => handleCopy('edited', driveEditedUrl)}
        />
        <DriveLinkField
          label="Raws / originals"
          value={driveRawsUrl}
          onChange={setDriveRawsUrl}
          copied={copiedKey === 'raws'}
          onCopy={() => handleCopy('raws', driveRawsUrl)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Drive notes</label>
          <textarea
            value={driveNotes}
            onChange={e => setDriveNotes(e.target.value)}
            rows={3}
            placeholder="Password, folder structure, what was delivered…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveDrive}
            disabled={isSavingDrive}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSavingDrive ? 'Saving…' : 'Save Drive links'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Update status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUSES.map(status => {
            const s = statusBadge(status);
            const Icon =
              status === 'draft'
                ? Clock
                : status === 'cancelled'
                  ? Ban
                  : CheckCircle;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className={`flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  booking.status === status
                    ? `${s.bg} border-current ${s.text}`
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <DetailEditModal
          booking={booking}
          onClose={() => setIsEditing(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}

function DriveLinkField({
  label,
  value,
  onChange,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onCopy}
          disabled={!value.trim()}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          aria-label={`Copy ${label}`}
          title={copied ? 'Copied' : 'Copy'}
        >
          <Copy className="w-4 h-4" />
        </button>
        {value.trim() ? (
          <a
            href={value.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            aria-label={`Open ${label}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <span className="px-3 py-2 border border-gray-200 rounded-lg text-gray-300">
            <ExternalLink className="w-4 h-4" />
          </span>
        )}
      </div>
      {copied && <p className="mt-1 text-xs text-green-600">Copied</p>}
    </div>
  );
}

function DetailEditModal({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    preferredEvent?: string;
    shootDate?: string;
    location?: string;
    reminderDate?: string;
    notes?: string;
    status?: BookingStatus;
  }) => Promise<void>;
}) {
  const [customerName, setCustomerName] = useState(booking.customerName);
  const [customerPhone, setCustomerPhone] = useState(booking.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(booking.customerEmail);
  const [shootType, setShootType] = useState(booking.shootType || 'Wedding');
  const [preferredEvent, setPreferredEvent] = useState(booking.preferredEvent);
  const [shootDate, setShootDate] = useState(booking.shootDate);
  const [location, setLocation] = useState(booking.location);
  const [reminderDate, setReminderDate] = useState(booking.reminderDate);
  const [notes, setNotes] = useState(booking.notes);
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError('Customer name is required (min 2 characters)');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setFormError('Phone is required (min 8 characters)');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        shootType: shootType || undefined,
        preferredEvent: preferredEvent.trim() || undefined,
        shootDate: shootDate.trim() || undefined,
        location: location.trim() || undefined,
        reminderDate: reminderDate.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Booking</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shoot Type</label>
              <select
                value={shootType}
                onChange={e => setShootType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SHOOT_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred event</label>
              <input
                type="text"
                value={preferredEvent}
                onChange={e => setPreferredEvent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shoot date</label>
              <input
                type="date"
                value={shootDate}
                onChange={e => setShootDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reminder date</label>
              <input
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pre-wedding venue / city"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as BookingStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
