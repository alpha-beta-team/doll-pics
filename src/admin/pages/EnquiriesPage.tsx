import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Enquiry } from '../types';
import type { ConvertEnquiryState } from './BookingsPage';
import {
  AlertCircle,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Inbox,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

type EnquiryStatus = Enquiry['status'];
type StatusFilter = EnquiryStatus | 'all';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All enquiries' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'responded', label: 'Responded' },
];

const STATUS_STYLES: Record<
  EnquiryStatus,
  { label: string; badge: string; dot: string; icon: typeof Clock3 }
> = {
  new: {
    label: 'New',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    icon: Clock3,
  },
  read: {
    label: 'Read',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    icon: Eye,
  },
  responded: {
    label: 'Responded',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
};

function formatDate(dateString: string, long = false) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString || '—';

  return new Intl.DateTimeFormat('en-IN',
    long
      ? {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }
      : {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
  ).format(date);
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString || '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

function StatusBadge({ status }: { status: EnquiryStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function EnquiriesPage() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedShootType, setSelectedShootType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const fetchEnquiries = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      // Fetch the complete inbox once so dashboard totals remain accurate while filtering.
      setEnquiries(await api.getEnquiries());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enquiries');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnquiries();
  }, [fetchEnquiries]);

  const statusCounts = useMemo(
    () => ({
      all: enquiries.length,
      new: enquiries.filter((enquiry) => enquiry.status === 'new').length,
      read: enquiries.filter((enquiry) => enquiry.status === 'read').length,
      responded: enquiries.filter((enquiry) => enquiry.status === 'responded').length,
    }),
    [enquiries],
  );

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return enquiries.filter((enquiry) => new Date(enquiry.createdAt).getTime() >= weekAgo).length;
  }, [enquiries]);

  const responseRate = enquiries.length
    ? Math.round((statusCounts.responded / enquiries.length) * 100)
    : 0;

  const shootTypes = useMemo(
    () =>
      Array.from(new Set(enquiries.map((enquiry) => enquiry.shootType).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [enquiries],
  );

  const filteredEnquiries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      if (selectedStatus !== 'all' && enquiry.status !== selectedStatus) return false;
      if (selectedShootType !== 'all' && enquiry.shootType !== selectedShootType) return false;
      if (!normalizedQuery) return true;

      return [
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.shootType,
        enquiry.preferredEvent,
        enquiry.location,
        enquiry.message,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [enquiries, searchQuery, selectedShootType, selectedStatus]);

  const hasActiveFilters =
    selectedStatus !== 'all' || selectedShootType !== 'all' || searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedShootType('all');
    setSearchQuery('');
  };

  const handleStatusChange = async (id: string, status: EnquiryStatus) => {
    const previous = enquiries.find((enquiry) => enquiry.id === id)?.status;
    setError(null);
    setEnquiries((current) =>
      current.map((enquiry) => (enquiry.id === id ? { ...enquiry, status } : enquiry)),
    );
    setSelectedEnquiry((current) =>
      current?.id === id ? { ...current, status } : current,
    );

    try {
      await api.updateEnquiryStatus(id, status);
    } catch (err) {
      if (previous) {
        setEnquiries((current) =>
          current.map((enquiry) =>
            enquiry.id === id ? { ...enquiry, status: previous } : enquiry,
          ),
        );
        setSelectedEnquiry((current) =>
          current?.id === id ? { ...current, status: previous } : current,
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to update enquiry');
    }
  };

  const convertToBooking = (enquiry: Enquiry) => {
    const state: ConvertEnquiryState = { convertFromEnquiry: enquiry };
    navigate('/admin/bookings', { state });
  };

  const openEnquiry = (enquiry: Enquiry) => setSelectedEnquiry(enquiry);

  const metrics = [
    {
      label: 'Total enquiries',
      value: statusCounts.all,
      detail: `${thisWeekCount} received this week`,
      icon: Inbox,
      iconClass: 'bg-slate-100 text-slate-700',
      filter: 'all' as const,
    },
    {
      label: 'New leads',
      value: statusCounts.new,
      detail: statusCounts.new ? 'Waiting for review' : 'Inbox is up to date',
      icon: Sparkles,
      iconClass: 'bg-blue-50 text-blue-600',
      filter: 'new' as const,
    },
    {
      label: 'Follow-ups',
      value: statusCounts.read,
      detail: statusCounts.read ? 'Opened, awaiting response' : 'Nothing pending',
      icon: MessageSquareText,
      iconClass: 'bg-amber-50 text-amber-600',
      filter: 'read' as const,
    },
    {
      label: 'Response rate',
      value: `${responseRate}%`,
      detail: `${statusCounts.responded} marked responded`,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
      filter: 'responded' as const,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Lead management
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Enquiries dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Review new leads, follow up with clients, and turn enquiries into bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchEnquiries(true)}
          disabled={isRefreshing}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="ml-auto rounded-md p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Enquiry overview">
        {metrics.map(({ label, value, detail, icon: Icon, iconClass, filter }) => (
          <button
            type="button"
            key={label}
            onClick={() => setSelectedStatus(filter)}
            className={`group rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5 ${
              selectedStatus === filter ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{detail}</p>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Enquiry inbox</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {isLoading
                  ? 'Loading enquiries…'
                  : `${filteredEnquiries.length} of ${enquiries.length} ${enquiries.length === 1 ? 'enquiry' : 'enquiries'}`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:min-w-64">
                <span className="sr-only">Search enquiries</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, email, phone…"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="relative block">
                <span className="sr-only">Filter by shoot type</span>
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedShootType}
                  onChange={(event) => setSelectedShootType(event.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
                >
                  <option value="all">All shoot types</option>
                  {shootTypes.map((shootType) => (
                    <option key={shootType} value={shootType}>
                      {shootType}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatus === option.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {option.label}
                <span className={`ml-1.5 ${selectedStatus === option.value ? 'text-slate-300' : 'text-slate-400'}`}>
                  {statusCounts[option.value]}
                </span>
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto whitespace-nowrap px-2 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <EnquiryTableSkeleton />
        ) : filteredEnquiries.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Mail className="h-6 w-6 text-slate-400" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters ? 'No matching enquiries' : 'Your inbox is empty'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? 'Try changing your search or filters to find what you need.'
                : 'New contact form submissions will appear here.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Shoot</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Message</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Received</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      onClick={() => openEnquiry(enquiry)}
                      className="cursor-pointer transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {enquiry.name.trim().charAt(0).toUpperCase() || '?'}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-semibold text-slate-900">{enquiry.name || 'Unnamed lead'}</p>
                            <p className="max-w-48 truncate text-xs text-slate-500">{enquiry.email || enquiry.phone || 'No contact details'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-44 truncate text-sm font-medium text-slate-700">{enquiry.shootType || 'Not specified'}</p>
                        {enquiry.location && (
                          <p className="mt-1 flex max-w-44 items-center gap-1 truncate text-xs text-slate-400">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {enquiry.location}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-xs truncate text-sm text-slate-600">{enquiry.message || 'No message provided'}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatShortDate(enquiry.createdAt)}</td>
                      <td className="px-5 py-4"><StatusBadge status={enquiry.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEnquiry(enquiry);
                          }}
                          aria-label={`View enquiry from ${enquiry.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-blue-600 hover:shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredEnquiries.map((enquiry) => (
                <button
                  type="button"
                  key={enquiry.id}
                  onClick={() => openEnquiry(enquiry)}
                  className="block w-full p-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {enquiry.name.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{enquiry.name || 'Unnamed lead'}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{enquiry.shootType || 'Shoot type not specified'}</p>
                      </div>
                    </div>
                    <StatusBadge status={enquiry.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{enquiry.message || 'No message provided'}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{formatShortDate(enquiry.createdAt)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                      View details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

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

function EnquiryTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-label="Loading enquiries" role="status">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-full bg-slate-100" />
          <div className="w-40 space-y-2">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-2.5 w-36 rounded bg-slate-100" />
          </div>
          <div className="ml-auto hidden h-3 w-32 rounded bg-slate-100 sm:block" />
          <div className="hidden h-3 w-52 rounded bg-slate-100 lg:block" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
      ))}
      <span className="sr-only">Loading enquiries…</span>
    </div>
  );
}

interface EnquiryDrawerProps {
  enquiry: Enquiry;
  onClose: () => void;
  onStatusChange: (id: string, status: EnquiryStatus) => void;
  onConvert: () => void;
}

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-slate-700">{children || '—'}</div>
      </div>
    </div>
  );
}

function EnquiryDrawer({ enquiry, onClose, onStatusChange, onConvert }: EnquiryDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const replyHref = `mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: Your ${enquiry.shootType || 'photography'} enquiry`)}`;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="enquiry-drawer-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close enquiry details"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Enquiry details</p>
            <h2 id="enquiry-drawer-title" className="mt-1 text-lg font-semibold text-slate-900">
              {enquiry.name || 'Unnamed lead'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={enquiry.status} />
              <p className="text-xs text-slate-500">Received {formatDate(enquiry.createdAt)}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <a
                href={replyHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" /> Reply
              </a>
              {enquiry.phone ? (
                <a
                  href={`tel:${enquiry.phone}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-400"
                >
                  <Phone className="h-4 w-4" /> No phone
                </button>
              )}
              <button
                type="button"
                onClick={onConvert}
                className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:col-span-1"
              >
                <CalendarPlus className="h-4 w-4" /> Convert
              </button>
            </div>
          </div>

          <div className="space-y-7 px-5 py-6 sm:px-6">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact & shoot</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <DetailItem icon={Mail} label="Email">
                  {enquiry.email ? (
                    <a href={`mailto:${enquiry.email}`} className="text-blue-600 hover:underline">{enquiry.email}</a>
                  ) : '—'}
                </DetailItem>
                <DetailItem icon={Phone} label="Phone">
                  {enquiry.phone ? (
                    <a href={`tel:${enquiry.phone}`} className="text-blue-600 hover:underline">{enquiry.phone}</a>
                  ) : '—'}
                </DetailItem>
                <DetailItem icon={Sparkles} label="Shoot type">{enquiry.shootType || '—'}</DetailItem>
                <DetailItem icon={UserRound} label="Preferred event">{enquiry.preferredEvent || '—'}</DetailItem>
                <DetailItem icon={CalendarPlus} label="Preferred booking date">{enquiry.bookingDate ? formatShortDate(enquiry.bookingDate) : '—'}</DetailItem>
                <DetailItem icon={MapPin} label="Location">{enquiry.location || '—'}</DetailItem>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client message</h3>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{enquiry.message || 'No message provided.'}</p>
              </div>
            </section>

            {enquiry.notes && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Internal notes</h3>
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{enquiry.notes}</p>
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lead status</h3>
                <span className="text-xs text-slate-400">Update as you follow up</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1.5">
                {(['new', 'read', 'responded'] as EnquiryStatus[]).map((status) => {
                  const style = STATUS_STYLES[status];
                  const StatusIcon = style.icon;
                  const active = enquiry.status === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => void onStatusChange(enquiry.id, status)}
                      aria-pressed={active}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                      }`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}
