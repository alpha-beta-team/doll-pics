import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Inbox, SearchX, X } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import type { Enquiry, EnquiryStage } from '../types';
import { AdminButton, AdminEmptyState } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { EnquiryToolbar } from '../components/enquiries/EnquiryToolbar';
import {
  EnquirySortControl,
} from '../components/enquiries/EnquiryStatusFilter';
import { EnquiryPrioritySummary } from '../components/enquiries/EnquiryPrioritySummary';
import { EnquiryListHeader } from '../components/enquiries/EnquiryListHeader';
import { EnquiryCard, EnquiryCardSkeleton } from '../components/enquiries/EnquiryCard';
import { SalesWorkspaceHeader } from '../components/sales/SalesWorkspaceHeader';
import {
  buildServiceCategoryOptions,
  normalizeServiceCategory,
  serviceCategoryMatches,
  serviceCategoryTabId,
} from '../components/sales/serviceCategories';
import {
  ENQUIRY_STAGES,
  enquiryMatchesPriority,
  enquiryMatchesSearch,
  enquiryStageLabel,
  followUpUrgency,
  sortEnquiries,
  type EnquiryPriorityFilter,
  type EnquirySort,
} from '../components/enquiries/enquiryList';

type OccasionContact = {
  id: string;
  customerName: string;
  phone: string;
};

export function WorkEnquiriesPage() {
  const { canManage, isReadOnly } = useFeatureAccess('enquiries');
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const serviceParam = params.get('service') || '';
  const requestedServiceCategory = serviceParam ? normalizeServiceCategory(serviceParam) : '';
  const [items, setItems] = useState<Enquiry[]>([]);
  const [stage, setStage] = useState<EnquiryStage | 'all'>('all');
  const [priority, setPriority] = useState<EnquiryPriorityFilter>('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<EnquirySort>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [occasionContact] = useState<OccasionContact | undefined>(
    () => (location.state as { occasionContact?: OccasionContact } | null)?.occasionContact,
  );

  useEffect(() => {
    if (occasionContact) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.pathname, location.search, navigate, occasionContact]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setItems(await api.getEnquiryListRows({ inbox: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load enquiries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const serviceCategory = requestedServiceCategory
    && items.some(item => serviceCategoryMatches(item, requestedServiceCategory))
    ? requestedServiceCategory
    : '';
  const itemsForSelectedService = useMemo(
    () => items.filter(item => serviceCategoryMatches(item, serviceCategory)),
    [items, serviceCategory],
  );

  const counts = useMemo(() => Object.fromEntries(
    ENQUIRY_STAGES.map(option => [
      option.value,
      itemsForSelectedService.filter(item => item.stage === option.value).length,
    ]),
  ) as Record<EnquiryStage, number>, [itemsForSelectedService]);

  const priorityCounts = useMemo(() => {
    const now = new Date();
    let dueToday = 0;
    let overdue = 0;
    itemsForSelectedService.forEach(item => {
      if (!item.nextFollowUpAt) return;
      const urgency = followUpUrgency(item.nextFollowUpAt, now);
      if (urgency === 'due_today') dueToday += 1;
      if (urgency === 'overdue') overdue += 1;
    });
    return { dueToday, overdue };
  }, [itemsForSelectedService]);

  const matching = useMemo(() => {
    const now = new Date();
    return items.filter(item => {
      if (stage !== 'all' && item.stage !== stage) return false;
      if (!enquiryMatchesPriority(item, priority, now)) return false;
      return enquiryMatchesSearch(item, query);
    });
  }, [items, priority, query, stage]);

  const serviceCategories = useMemo(
    () => buildServiceCategoryOptions(items, matching),
    [items, matching],
  );
  const visible = useMemo(
    () => sortEnquiries(matching.filter(item => serviceCategoryMatches(item, serviceCategory)), sort),
    [matching, serviceCategory, sort],
  );

  const activeFilterCount = Number(stage !== 'all') + Number(Boolean(priority));
  const hasStatusOrPriorityFilter = stage !== 'all' || Boolean(priority);
  const hasAnyFilter = hasStatusOrPriorityFilter || Boolean(query.trim()) || Boolean(serviceCategory);
  const selectedServiceLabel = serviceCategories.find(option => option.value === serviceCategory)?.label;
  const selectedListNameBase = priority === 'overdue'
    ? 'Overdue follow-ups'
    : priority === 'due_today'
      ? 'Follow-ups due today'
      : stage === 'all'
        ? 'All enquiries'
        : `${enquiryStageLabel(stage)} enquiries`;
  const selectedListName = serviceCategory && selectedServiceLabel
    ? stage === 'all' && !priority
      ? `${selectedServiceLabel} enquiries`
      : `${selectedServiceLabel} · ${selectedListNameBase}`
    : selectedListNameBase;

  const selectServiceCategory = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('service', value);
    else next.delete('service');
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setStage('all');
    setPriority('');
    setQuery('');
    selectServiceCategory('');
  };

  const openForm = () => {
    const next = new URLSearchParams(params);
    next.set('new', '1');
    setParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-3 pb-2 sm:space-y-4">
      <SalesWorkspaceHeader
        title="Enquiries"
        serviceCategories={serviceCategories}
        serviceCategory={serviceCategory}
        onServiceCategoryChange={selectServiceCategory}
        panelId="enquiry-list-panel"
        readOnlyNotice={isReadOnly ? <ReadOnlyNotice /> : undefined}
        listControls={<EnquirySortControl value={sort} onChange={setSort} />}
        actions={(
          <EnquiryToolbar
            query={query}
            onQueryChange={setQuery}
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            activeFilterCount={activeFilterCount}
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            canManage={canManage}
            onAdd={openForm}
          />
        )}
      />

      {filtersOpen && (
        <section id="enquiry-advanced-filters" aria-label="Enquiry filters" className="space-y-2">
          <div className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface p-2 shadow-sm sm:flex-row sm:items-center">
            <label className="block min-w-0 flex-1 sm:max-w-xs">
              <span className="sr-only">Enquiry status</span>
              <select value={stage} onChange={event => setStage(event.target.value as EnquiryStage | 'all')} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
                <option value="all">All statuses ({itemsForSelectedService.length})</option>
                {ENQUIRY_STAGES.map(item => <option key={item.value} value={item.value}>{item.label} ({counts[item.value]})</option>)}
              </select>
            </label>
            <button type="button" disabled={stage === 'all' && !priority} onClick={() => { setStage('all'); setPriority(''); }} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:text-admin-subtle disabled:opacity-60">Clear status filters</button>
          </div>
          <EnquiryPrioritySummary
            newCount={counts.new}
            dueTodayCount={priorityCounts.dueToday}
            overdueCount={priorityCounts.overdue}
            newSelected={stage === 'new' && !priority}
            priority={priority}
            onNew={() => {
              setPriority('');
              setStage(current => current === 'new' ? 'all' : 'new');
            }}
            onPriorityChange={nextPriority => {
              setStage('all');
              setPriority(nextPriority);
            }}
          />
        </section>
      )}

      {error && items.length > 0 && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => void load(true)} className="min-h-10 rounded-lg px-2 font-semibold outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500">Retry</button>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="flex h-10 w-10 items-center justify-center rounded-lg outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <EnquiryListHeader title={selectedListName} count={visible.length} />

      <section id="enquiry-list-panel" role="tabpanel" aria-labelledby={serviceCategoryTabId(serviceCategory)} className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-admin-border lg:bg-admin-surface lg:shadow-[0_4px_18px_rgba(62,56,46,0.04)]">
        <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(9rem,0.85fr)_minmax(7.5rem,0.65fr)_minmax(11rem,1fr)_auto] gap-x-5 border-b border-admin-border bg-admin-muted/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-admin-subtle lg:grid">
          <span>Customer</span><span>Enquiry</span><span>Received</span><span>Follow-up</span><span className="pr-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 lg:space-y-0" aria-label="Loading enquiries" role="status">
            {Array.from({ length: 5 }, (_, index) => <EnquiryCardSkeleton key={index} />)}
            <span className="sr-only">Loading enquiries…</span>
          </div>
        ) : error && items.length === 0 ? (
          <AdminEmptyState
            icon={AlertCircle}
            title="Enquiries could not be loaded"
            description={error}
            action={<AdminButton onClick={() => void load()}>Try again</AdminButton>}
          />
        ) : visible.length > 0 ? (
          <div className="space-y-2 lg:space-y-0">
            {visible.map(item => (
              <EnquiryCard
                key={item.id}
                enquiry={item}
                canContact={canManage}
                onOpen={() => navigate(
                  item.stage === 'booked' && item.convertedBookingId
                    ? `/admin/bookings/${item.convertedBookingId}`
                    : `/admin/enquiries/${item.id}`,
                )}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title="No enquiries yet"
            description="New website submissions and enquiries added by the studio will appear here."
            action={canManage ? <AdminButton onClick={openForm}>Add enquiry</AdminButton> : undefined}
          />
        ) : query.trim() ? (
          <AdminEmptyState
            icon={SearchX}
            title="No matching enquiries"
            description="Try a different customer name, phone number, service, or enquiry source."
            action={<AdminButton variant="secondary" onClick={clearFilters}>Clear search and filters</AdminButton>}
          />
        ) : hasStatusOrPriorityFilter ? (
          <AdminEmptyState
            icon={Inbox}
            title="No enquiries in this view"
            description="Choose another status or reset the active priority filter."
            action={<AdminButton variant="secondary" onClick={clearFilters}>Reset filters</AdminButton>}
          />
        ) : null}
      </section>

      {refreshing && <p className="sr-only" role="status">Refreshing enquiries…</p>}

      {hasAnyFilter && visible.length > 0 && (
        <div className="flex justify-center md:hidden">
          <button type="button" onClick={clearFilters} className="min-h-10 rounded-xl px-3 text-xs font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">Clear all filters</button>
        </div>
      )}

      {canManage && params.get('new') === '1' && (
        <EnquiryFormModal
          initialContact={occasionContact}
          draftKey={occasionContact ? `doll_admin_enquiry_draft:occasion:${occasionContact.id}` : undefined}
          onClose={closeForm}
          onSaved={item => {
            closeForm();
            navigate(`/admin/enquiries/${item.id}`);
          }}
        />
      )}
    </div>
  );
}
