import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Booking, BookingStatus, Enquiry } from '../types';
import {
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  CalendarRange,
  Plus,
  Pencil,
  XCircle,
  Ban,
  Database,
  MapPin,
} from 'lucide-react';

import { SHOOT_TYPE_OPTIONS } from '../../lib/shootTypes';

const SHOOT_TYPES = [...SHOOT_TYPE_OPTIONS];
const STATUSES: BookingStatus[] = ['draft', 'confirmed', 'cancelled', 'completed'];

type AvailableDataFilter =
  | 'all'
  | 'shoot-date'
  | 'location'
  | 'email'
  | 'gallery'
  | 'complete';

const AVAILABLE_DATA_OPTIONS: Array<{ value: AvailableDataFilter; label: string }> = [
  { value: 'all', label: 'Any available data' },
  { value: 'shoot-date', label: 'Has shoot date' },
  { value: 'location', label: 'Has location' },
  { value: 'email', label: 'Has email' },
  { value: 'gallery', label: 'Has gallery links' },
  { value: 'complete', label: 'Complete core details' },
];

export type ConvertEnquiryState = {
  convertFromEnquiry?: Enquiry;
};

export function BookingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedShootType, setSelectedShootType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [shootDateFrom, setShootDateFrom] = useState('');
  const [shootDateTo, setShootDateTo] = useState('');
  const [availableData, setAvailableData] = useState<AvailableDataFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [convertFromEnquiry, setConvertFromEnquiry] = useState<Enquiry | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Keep the complete list locally so every filter and count uses the same data set.
      setBookings(await api.getBookings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const state = location.state as ConvertEnquiryState | null;
    if (state?.convertFromEnquiry) {
      setConvertFromEnquiry(state.convertFromEnquiry);
      setIsCreating(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleSave = async (data: {
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
    enquiryId?: string;
  }) => {
    if (editingBooking) {
      const updated = await api.updateBooking(editingBooking.id, data);
      setBookings(prev => prev.map(b => (b.id === editingBooking.id ? updated : b)));
      setEditingBooking(null);
    } else {
      const created = await api.createBooking(data);
      setBookings(prev => [created, ...prev]);
      setIsCreating(false);
      setConvertFromEnquiry(null);
      navigate(`/admin/bookings/${created.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'Draft' };
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Confirmed' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: Ban, label: 'Cancelled' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Completed' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: status };
    }
  };

  const statusCounts = {
    draft: bookings.filter(b => b.status === 'draft').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const availableShootTypes = useMemo(
    () =>
      Array.from(new Set(bookings.map(booking => booking.shootType.trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [bookings],
  );

  const availableLocations = useMemo(
    () =>
      Array.from(new Set(bookings.map(booking => booking.location.trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (selectedStatus && booking.status !== selectedStatus) return false;
      if (selectedShootType && booking.shootType !== selectedShootType) return false;
      if (selectedLocation && booking.location !== selectedLocation) return false;

      // API values are stored as ISO or YYYY-MM-DD strings; the leading date is sortable.
      const shootDate = booking.shootDate.slice(0, 10);
      if (shootDateFrom && (!shootDate || shootDate < shootDateFrom)) return false;
      if (shootDateTo && (!shootDate || shootDate > shootDateTo)) return false;

      switch (availableData) {
        case 'shoot-date':
          return Boolean(booking.shootDate);
        case 'location':
          return Boolean(booking.location);
        case 'email':
          return Boolean(booking.customerEmail);
        case 'gallery':
          return Boolean(booking.driveGalleryUrl || booking.driveEditedUrl || booking.driveRawsUrl);
        case 'complete':
          return Boolean(
            booking.customerName &&
              booking.customerPhone &&
              booking.shootType &&
              booking.shootDate &&
              booking.location,
          );
        default:
          return true;
      }
    });
  }, [
    availableData,
    bookings,
    selectedLocation,
    selectedShootType,
    selectedStatus,
    shootDateFrom,
    shootDateTo,
  ]);

  const activeFilterCount = [
    selectedStatus,
    selectedShootType,
    selectedLocation,
    shootDateFrom,
    shootDateTo,
    availableData === 'all' ? '' : availableData,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedShootType('');
    setSelectedLocation('');
    setShootDateFrom('');
    setShootDateTo('');
    setAvailableData('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto hover:text-red-900">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">Manage shoot bookings and confirmations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            aria-expanded={showFilters}
            aria-controls="booking-filters"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        </div>
      </div>

      {showFilters && (
        <div id="booking-filters" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Filter bookings</h2>
              <p className="mt-1 text-xs text-gray-500">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </legend>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('')}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedStatus === ''
                      ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All ({bookings.length})
                </button>
                {STATUSES.map(status => {
                  const badge = getStatusBadge(status);
                  const active = selectedStatus === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? `${badge.bg} border-current font-medium ${badge.text}`
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {badge.label} ({statusCounts[status]})
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <CalendarRange className="h-3.5 w-3.5" /> Shoot date from
                </span>
                <input
                  type="date"
                  value={shootDateFrom}
                  max={shootDateTo || undefined}
                  onChange={event => setShootDateFrom(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <CalendarRange className="h-3.5 w-3.5" /> Shoot date to
                </span>
                <input
                  type="date"
                  value={shootDateTo}
                  min={shootDateFrom || undefined}
                  onChange={event => setShootDateTo(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">Shoot type</span>
                <select
                  value={selectedShootType}
                  onChange={event => setSelectedShootType(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All shoot types</option>
                  {availableShootTypes.map(shootType => (
                    <option key={shootType} value={shootType}>{shootType}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </span>
                <select
                  value={selectedLocation}
                  onChange={event => setSelectedLocation(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All locations</option>
                  {availableLocations.map(bookingLocation => (
                    <option key={bookingLocation} value={bookingLocation}>{bookingLocation}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <Database className="h-3.5 w-3.5" /> Available data
                </span>
                <select
                  value={availableData}
                  onChange={event => setAvailableData(event.target.value as AvailableDataFilter)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {AVAILABLE_DATA_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="text-gray-500 mt-1">
            {activeFilterCount > 0
              ? 'Try changing or clearing your filters'
              : 'Create a booking or convert an enquiry'}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shoot Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shoot Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map(booking => {
                const status = getStatusBadge(booking.status);
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {booking.customerName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${booking.customerPhone}`}
                        className="text-sm text-blue-600 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {booking.customerPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{booking.shootType || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{booking.shootDate || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 line-clamp-1 max-w-[140px]">
                        {booking.location || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{formatDate(booking.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingBooking(booking);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit booking"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/admin/bookings/${booking.id}`);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="View booking details"
                        >
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(isCreating || editingBooking) && (
        <BookingEditModal
          booking={isCreating ? null : editingBooking}
          convertFromEnquiry={isCreating ? convertFromEnquiry : null}
          onClose={() => {
            setIsCreating(false);
            setEditingBooking(null);
            setConvertFromEnquiry(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface BookingEditModalProps {
  booking: Booking | null;
  convertFromEnquiry?: Enquiry | null;
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
    enquiryId?: string;
  }) => Promise<void>;
}

function BookingEditModal({ booking, convertFromEnquiry, onClose, onSave }: BookingEditModalProps) {
  const from = convertFromEnquiry;
  const [customerName, setCustomerName] = useState(booking?.customerName || from?.name || '');
  const [customerPhone, setCustomerPhone] = useState(booking?.customerPhone || from?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(booking?.customerEmail || from?.email || '');
  const [shootType, setShootType] = useState(booking?.shootType || from?.shootType || 'Wedding');
  const [preferredEvent, setPreferredEvent] = useState(
    booking?.preferredEvent || from?.preferredEvent || '',
  );
  const [shootDate, setShootDate] = useState(booking?.shootDate || from?.shootDate || '');
  const [location, setLocation] = useState(booking?.location || from?.location || '');
  const [reminderDate, setReminderDate] = useState(
    booking?.reminderDate || from?.reminderDate || '',
  );
  const [notes, setNotes] = useState(() => {
    if (booking?.notes) return booking.notes;
    if (!from) return '';
    const parts = [from.message, from.notes].filter(Boolean);
    return parts.join('\n\n');
  });
  const [status, setStatus] = useState<BookingStatus>(booking?.status || 'draft');
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
        ...(from && !booking ? { enquiryId: from.id } : {}),
        ...(booking ? { status } : {}),
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {booking ? 'Edit Booking' : from ? 'Convert Enquiry to Booking' : 'Create Booking'}
          </h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone number"
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
              placeholder="customer@email.com"
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
                {SHOOT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
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
                placeholder="Wedding, anniversary…"
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
              placeholder="Additional notes..."
            />
          </div>

          {booking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BookingStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            {isSaving ? 'Saving...' : booking ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
