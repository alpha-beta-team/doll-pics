import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Booking, BookingStatus } from '../types';
import {
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  Plus,
  Pencil,
  XCircle,
  Ban,
} from 'lucide-react';

const SHOOT_TYPES = ['Wedding', 'Pre-Wedding', 'Portrait', 'Maternity', 'Commercial', 'Other'];
const STATUSES: BookingStatus[] = ['draft', 'confirmed', 'cancelled', 'completed'];

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBookings({
        status: (selectedStatus || undefined) as BookingStatus | undefined,
      });
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    try {
      const updated = await api.updateBooking(id, { status });
      setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
      if (selectedBooking?.id === id) {
        setSelectedBooking(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const updated = await api.confirmBooking(id);
      setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
      if (selectedBooking?.id === id) {
        setSelectedBooking(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
    }
  };

  const handleSave = async (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    shootDate?: string;
    location?: string;
    notes?: string;
    status?: BookingStatus;
  }) => {
    if (editingBooking) {
      const updated = await api.updateBooking(editingBooking.id, data);
      setBookings(prev => prev.map(b => (b.id === editingBooking.id ? updated : b)));
      if (selectedBooking?.id === editingBooking.id) {
        setSelectedBooking(updated);
      }
      setEditingBooking(null);
    } else {
      const created = await api.createBooking(data);
      setBookings(prev => [created, ...prev]);
      setIsCreating(false);
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
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">
            <X className="w-4 h-4" />
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
              showFilters || selectedStatus
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
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
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedStatus === ''
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({bookings.length})
            </button>
            {STATUSES.map(status => {
              const badge = getStatusBadge(status);
              const active = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    active
                      ? `${badge.bg} border-current ${badge.text}`
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {badge.label} ({statusCounts[status]})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="text-gray-500 mt-1">
            {selectedStatus
              ? 'Try selecting a different status filter'
              : 'Create a booking or convert an enquiry'}
          </p>
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
              {bookings.map(booking => {
                const status = getStatusBadge(booking.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
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
                          onClick={() => setEditingBooking(booking)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
          onConfirm={handleConfirm}
          onEdit={() => {
            setEditingBooking(selectedBooking);
            setSelectedBooking(null);
          }}
        />
      )}

      {(isCreating || editingBooking) && (
        <BookingEditModal
          booking={isCreating ? null : editingBooking}
          onClose={() => {
            setIsCreating(false);
            setEditingBooking(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface BookingDrawerProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onConfirm: (id: string) => void;
  onEdit: () => void;
}

function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
  onConfirm,
  onEdit,
}: BookingDrawerProps) {
  const formatDate = (dateStr: string) => {
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
  };

  const getStatusBadge = (status: string) => {
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
  };

  const badge = getStatusBadge(booking.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-medium text-gray-900">{booking.customerName}</h3>
              <span
                className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              {booking.status === 'draft' && (
                <button
                  onClick={() => onConfirm(booking.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <a
                href={`tel:${booking.customerPhone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {booking.customerPhone}
              </a>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              {booking.customerEmail ? (
                <a
                  href={`mailto:${booking.customerEmail}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {booking.customerEmail}
                </a>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shoot Type</label>
              <span className="text-sm text-gray-700">{booking.shootType || '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shoot Date</label>
              <span className="text-sm text-gray-700">{booking.shootDate || '—'}</span>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <span className="text-sm text-gray-700">{booking.location || '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
              <span className="text-sm text-gray-700">{formatDate(booking.createdAt)}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Confirmed At</label>
              <span className="text-sm text-gray-700">
                {booking.confirmedAt ? formatDate(booking.confirmedAt) : '—'}
              </span>
            </div>
            {booking.enquiryId && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Enquiry ID</label>
                <span className="text-sm text-gray-700 font-mono">{booking.enquiryId}</span>
              </div>
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

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2">Update Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(status => {
                const s = getStatusBadge(status);
                return (
                  <button
                    key={status}
                    onClick={() => onStatusChange(booking.id, status)}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                      booking.status === status
                        ? `${s.bg} border-current ${s.text}`
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BookingEditModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    shootDate?: string;
    location?: string;
    notes?: string;
    status?: BookingStatus;
  }) => Promise<void>;
}

function BookingEditModal({ booking, onClose, onSave }: BookingEditModalProps) {
  const [customerName, setCustomerName] = useState(booking?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(booking?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(booking?.customerEmail || '');
  const [shootType, setShootType] = useState(booking?.shootType || 'Wedding');
  const [shootDate, setShootDate] = useState(booking?.shootDate || '');
  const [location, setLocation] = useState(booking?.location || '');
  const [notes, setNotes] = useState(booking?.notes || '');
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
        shootDate: shootDate.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
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
            {booking ? 'Edit Booking' : 'Create Booking'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Shoot Date</label>
              <input
                type="text"
                value={shootDate}
                onChange={e => setShootDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2026-08-15"
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
              placeholder="Shoot location"
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
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
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
