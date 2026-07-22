import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Enquiry } from '../types';
import type { ConvertEnquiryState } from './BookingsPage';
import {
  Mail,
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  CheckCircle,
  Eye,
  Clock,
  CalendarPlus,
} from 'lucide-react';

export function EnquiriesPage() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const convertToBooking = (enquiry: Enquiry) => {
    const state: ConvertEnquiryState = { convertFromEnquiry: enquiry };
    navigate('/admin/bookings', { state });
  };

  useEffect(() => {
    fetchEnquiries();
  }, [selectedStatus]);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEnquiries({
        status: selectedStatus as 'new' | 'read' | 'responded' | undefined,
      });
      setEnquiries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'new' | 'read' | 'responded') => {
    try {
      await api.updateEnquiryStatus(id, status);
      setEnquiries(prev =>
        prev.map(e =>
          e.id === id ? { ...e, status } : e
        )
      );
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enquiry');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
      case 'new':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: Clock,
          label: 'New',
        };
      case 'read':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          icon: Eye,
          label: 'Read',
        };
      case 'responded':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: CheckCircle,
          label: 'Responded',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: Clock,
          label: status,
        };
    }
  };

  const statusCounts = {
    new: enquiries.filter(e => e.status === 'new').length,
    read: enquiries.filter(e => e.status === 'read').length,
    responded: enquiries.filter(e => e.status === 'responded').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
        <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto hover:text-red-900">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 mt-1">
            Manage contact form submissions from your website
          </p>
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
        </div>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedStatus === ''
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({enquiries.length})
            </button>
            <button
              onClick={() => setSelectedStatus('new')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedStatus === 'new'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              New ({statusCounts.new})
            </button>
            <button
              onClick={() => setSelectedStatus('read')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedStatus === 'read'
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Read ({statusCounts.read})
            </button>
            <button
              onClick={() => setSelectedStatus('responded')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedStatus === 'responded'
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Responded ({statusCounts.responded})
            </button>
          </div>
        </div>
      )}

      {enquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No enquiries found</h3>
          <p className="text-gray-500 mt-1">
            {selectedStatus
              ? 'Try selecting a different status filter'
              : 'New enquiries from your website will appear here'}
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shoot Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enquiries.map(enquiry => {
                const status = getStatusBadge(enquiry.status);
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={enquiry.id}
                    className="hover:bg-gray-50 transition-colors"
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
                        {enquiry.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {enquiry.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{enquiry.shootType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">
                        {enquiry.message}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(enquiry.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="View enquiry details"
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

      {selectedEnquiry && (
        <EnquiryDrawer
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onStatusChange={handleStatusChange}
          onConvert={() => convertToBooking(selectedEnquiry)}
        />
      )}
    </div>
  );
}

interface EnquiryDrawerProps {
  enquiry: Enquiry;
  onClose: () => void;
  onStatusChange: (id: string, status: 'new' | 'read' | 'responded') => void;
  onConvert: () => void;
}

function EnquiryDrawer({ enquiry, onClose, onStatusChange, onConvert }: EnquiryDrawerProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
      case 'new':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' };
      case 'read':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Read' };
      case 'responded':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Responded' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enquiry Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium text-gray-900">{enquiry.name}</h3>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getStatusBadge(enquiry.status).bg} ${getStatusBadge(enquiry.status).text}`}>
                {getStatusBadge(enquiry.status).label}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${enquiry.email}`}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 text-center"
              >
                Reply
              </a>
              <button
                type="button"
                onClick={onConvert}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                <CalendarPlus className="w-4 h-4" />
                Convert
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <a
                href={`mailto:${enquiry.email}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {enquiry.email}
              </a>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              {enquiry.phone ? (
                <a
                  href={`tel:${enquiry.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {enquiry.phone}
                </a>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shoot Type</label>
              <span className="text-sm text-gray-700">{enquiry.shootType || '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Preferred event</label>
              <span className="text-sm text-gray-700">{enquiry.preferredEvent || '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shoot date</label>
              <span className="text-sm text-gray-700">{enquiry.shootDate || '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reminder date</label>
              <span className="text-sm text-gray-700">{enquiry.reminderDate || '—'}</span>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <span className="text-sm text-gray-700">{enquiry.location || '—'}</span>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Submitted</label>
              <span className="text-sm text-gray-700">{formatDate(enquiry.createdAt)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Message</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {enquiry.message}
              </p>
            </div>
          </div>

          {enquiry.notes ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Notes</label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{enquiry.notes}</p>
              </div>
            </div>
          ) : null}

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Update Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(enquiry.id, 'new')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  enquiry.status === 'new'
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                New
              </button>
              <button
                onClick={() => onStatusChange(enquiry.id, 'read')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  enquiry.status === 'read'
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Read
              </button>
              <button
                onClick={() => onStatusChange(enquiry.id, 'responded')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  enquiry.status === 'responded'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Responded
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
