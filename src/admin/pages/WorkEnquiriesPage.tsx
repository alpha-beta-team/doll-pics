import './enquiries.css';
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from '../components/leadSource';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Inbox, SearchX, X } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import type { Enquiry, EnquiryStage } from '../types';
import { AdminButton, AdminEmptyState } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { hasStaffPermission } from '../access/roles';
import { EnquiryMobileHeader } from '../components/enquiries/EnquiryMobileHeader';
import { EnquiryToolbar } from '../components/enquiries/EnquiryToolbar';
import {
  EnquirySortControl,
} from '../components/enquiries/EnquiryStatusFilter';
import { EnquiryPrioritySummary } from '../components/enquiries/EnquiryPrioritySummary';
import { EnquiryViewSelect } from '../components/enquiries/EnquiryListHeader';
import { EnquiryPagination } from '../components/enquiries/EnquiryPagination';
import { EnquiryCard, EnquiryCardSkeleton } from '../components/enquiries/EnquiryCard';
import { SalesWorkspaceHeader } from '../components/sales/SalesWorkspaceHeader';
import {
  buildServiceCategoryOptions,
  normalizeServiceCategory,
  serviceCategoryMatches,
} from '../components/sales/serviceCategories';
import {
  ENQUIRY_STAGES,
  enquiryMatchesScope,
  enquiryMatchesPriority,
  enquiryMatchesSearch,
  enquiryStageLabel,
  followUpUrgency,
  sortEnquiries,
  type EnquiryListScope,
  type EnquiryPriorityFilter,
  type EnquirySort,
} from '../components/enquiries/enquiryList';

const PAGE_SIZE = 7;

type OccasionContact = {
  id: string;
  customerName: string;
  phone: string;
};

export function WorkEnquiriesPage() {
  const { canManage, isReadOnly } = useFeatureAccess('enquiries');
  const { user } = useAuth();
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const source = params.get('source') || '';
  const dateFrom = params.get('dateFrom') || '';
  const dateTo = params.get('dateTo') || '';
  const reportMode = Boolean(source || dateFrom || dateTo);
  const requestVersion = useRef(0);
  const serviceParam = params.get('service') || '';
  const requestedServiceCategory = serviceParam ? normalizeServiceCategory(serviceParam) : '';
  const [items, setItems] = useState<Enquiry[]>([]);
  const [scope, setScope] = useState<EnquiryListScope>(reportMode ? 'all' : 'active');
  const [stage, setStage] = useState<EnquiryStage | 'all'>('all');
  const [priority, setPriority] = useState<EnquiryPriorityFilter>('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<EnquirySort>('newest');
  const [page, setPage] = useState(1);
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
    const version = ++requestVersion.current;
    try {
      const rows = await api.getEnquiryListRows({ inbox: !reportMode, source, dateFrom, dateTo });
      if (version === requestVersion.current) setItems(rows);
    } catch (err) {
      if (version === requestVersion.current) { setItems([]); setError(err instanceof Error ? err.message : 'Could not load enquiries.'); }
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, [source, dateFrom, dateTo, reportMode]);

  useEffect(() => { setScope(reportMode ? 'all' : 'active'); setStage('all'); setPriority(''); setQuery(''); }, [source, dateFrom, dateTo, reportMode]);
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
      if (!enquiryMatchesScope(item, scope)) return false;
      if (stage !== 'all' && item.stage !== stage) return false;
      if (!enquiryMatchesPriority(item, priority, now)) return false;
      return enquiryMatchesSearch(item, query);
    });
  }, [items, priority, query, scope, stage]);

  const serviceCategories = useMemo(
    () => buildServiceCategoryOptions(items, matching),
    [items, matching],
  );
  const visible = useMemo(
    () => sortEnquiries(matching.filter(item => serviceCategoryMatches(item, serviceCategory)), sort),
    [matching, serviceCategory, sort],
  );

  useEffect(() => { setPage(1); }, [scope, stage, priority, query, sort, serviceCategory, source, dateFrom, dateTo]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeEnquiryCount = useMemo(
    () => items.filter(item => enquiryMatchesScope(item, 'active')).length,
    [items],
  );

  const mobileCounts = useMemo(() => {
    const now = new Date();
    return {
      newCount: items.filter(item => item.stage === 'new').length,
      newTodayCount: items.filter(item => item.stage === 'new' && new Date(item.createdAt).toDateString() === now.toDateString()).length,
      dueTodayCount: items.filter(item => item.nextFollowUpAt && followUpUrgency(item.nextFollowUpAt, now) === 'due_today').length,
    };
  }, [items]);

  const activeFilterCount = Number(stage !== 'all') + Number(Boolean(priority)) + Number(Boolean(source)) + Number(Boolean(dateFrom || dateTo));
  const hasStatusOrPriorityFilter = stage !== 'all' || Boolean(priority);
  const hasAnyFilter = reportMode || hasStatusOrPriorityFilter || Boolean(query.trim()) || Boolean(serviceCategory);
  const selectedServiceLabel = serviceCategories.find(option => option.value === serviceCategory)?.label;
  const selectedListNameBase = priority === 'overdue'
    ? 'Overdue follow-ups'
    : priority === 'due_today'
      ? 'Follow-ups due today'
      : stage === 'all'
        ? scope === 'active' ? 'Active enquiries' : 'All enquiries'
        : `${enquiryStageLabel(stage)} enquiries`;
  const selectedListName = serviceCategory && selectedServiceLabel
    ? `${selectedServiceLabel} · ${selectedListNameBase}`
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
    const next = new URLSearchParams(params);
    for (const key of ['source', 'dateFrom', 'dateTo', 'service']) next.delete(key);
    setParams(next);
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
    <div className="enquiries-workspace">
      <EnquiryMobileHeader
        total={items.length}
        activeCount={activeEnquiryCount}
        {...mobileCounts}
        view={priority === 'due_today' ? 'due_today' : !priority && stage === 'new' ? 'new' : !priority && stage === 'all' ? scope : ''}
        onViewChange={view => {
          setScope(view === 'all' ? 'all' : 'active');
          setStage(view === 'new' ? 'new' : 'all');
          setPriority(view === 'due_today' ? 'due_today' : '');
        }}
        query={query}
        onQueryChange={setQuery}
        filtersOpen={filtersOpen}
        activeFilterCount={activeFilterCount}
        onToggleFilters={() => setFiltersOpen(open => !open)}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        canManage={canManage}
        onAdd={openForm}
        services={serviceCategories}
        service={serviceCategory}
        onServiceChange={selectServiceCategory}
        sort={sort}
        onSortChange={setSort}
      />
      {isReadOnly && <div className="px-4 pt-3 sm:hidden"><ReadOnlyNotice /></div>}
      <div className="hidden sm:block">
      <SalesWorkspaceHeader
        title="Enquiries"
        studioBadge
        subtitle={<>{selectedListName}<span className="mx-1.5 text-slate-300">•</span><span className="font-medium text-admin-secondary">{loading ? 'Loading enquiries…' : `${visible.length} ${visible.length === 1 ? 'lead' : 'leads'} in pipeline`}</span></>}
        viewControls={(
          <EnquiryViewSelect
            scope={scope}
            activeCount={activeEnquiryCount}
            totalCount={items.length}
            onScopeChange={nextScope => {
              setScope(nextScope);
              if (nextScope === 'active' && stage === 'closed_lost') setStage('all');
            }}
          />
        )}
        serviceCategories={serviceCategories}
        serviceCategory={serviceCategory}
        onServiceCategoryChange={selectServiceCategory}
        panelId="enquiry-list-panel"
        readOnlyNotice={isReadOnly ? <ReadOnlyNotice /> : undefined}
        listControls={<div className="flex items-center gap-3"><span className="hidden whitespace-nowrap text-xs text-admin-subtle sm:inline">Sort by:</span><EnquirySortControl value={sort} onChange={setSort} /></div>}
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

      </div>
      <div className="enquiry-list-content space-y-5">
      {(reportMode || filtersOpen) && <section aria-label="Source reporting filters" className="rounded-xl border border-admin-border bg-admin-surface p-3">
        <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-admin-subtle">Source<select aria-label="Enquiry source" value={source} onChange={event => { const next = new URLSearchParams(params); if (event.target.value) next.set('source', event.target.value); else next.delete('source'); setParams(next); }} className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-2 text-sm text-admin-text"><option value="">All sources</option>{LEAD_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}<option value="not_recorded">Not recorded</option></select></label>{(['dateFrom', 'dateTo'] as const).map(key => <label key={key} className="text-xs font-semibold text-admin-subtle">{key === 'dateFrom' ? 'Created from' : 'Created through'}<input aria-label={key === 'dateFrom' ? 'Created from' : 'Created through'} type="date" value={key === 'dateFrom' ? dateFrom : dateTo} onChange={event => { const next = new URLSearchParams(params); if (event.target.value) next.set(key, event.target.value); else next.delete(key); setParams(next); }} className="mt-1 block min-h-11 max-w-full rounded-lg border border-admin-border bg-admin-surface px-2 text-sm text-admin-text" /></label>)}{reportMode && <button className="min-h-11 text-sm font-semibold text-admin-primary underline" onClick={clearFilters}>Clear filters</button>}</div>
        {reportMode && <p className="mt-2 text-xs text-admin-subtle">{source === 'not_recorded' ? 'Not recorded' : source ? leadSourceLabel(source as Enquiry['source']) : 'All sources'} · Creation dates in India time. All stages included unless narrowed below.</p>}
      </section>}

      {filtersOpen && (
        <section id="enquiry-advanced-filters" aria-label="Enquiry filters" className="space-y-2">
          <div className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface p-2 shadow-sm sm:flex-row sm:items-center">
            <label className="block min-w-0 flex-1 sm:max-w-xs">
              <span className="sr-only">Enquiry status</span>
              <select aria-label="Enquiry status" value={stage} onChange={event => {
                const nextStage = event.target.value as EnquiryStage | 'all';
                setStage(nextStage);
                if (nextStage === 'closed_lost') setScope('all');
              }} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
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

      <section id="enquiry-list-panel" aria-labelledby="enquiry-list-panel-title" className="enquiry-list overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-[0_4px_20px_rgba(15,23,42,0.04)]" aria-busy={loading || refreshing}>
        <div className="enquiry-table-heading text-[11px] font-semibold uppercase tracking-wide text-admin-subtle" aria-hidden="true">
          <span>Customer</span><span>Enquiry / Service</span><span>Received</span><span>Follow-up</span><span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="enquiry-rows" aria-label="Loading enquiries" role="status">
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
          <div className="enquiry-rows">
            {pageItems.map(item => (
          <EnquiryCard
                key={item.id}
                enquiry={item}
                canContact={canManage}
                canViewPhone={canViewPhone}
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
            title={reportMode ? "No enquiries match these filters" : "No enquiries yet"}
            description={reportMode ? "Choose another source or creation-date range." : "New website submissions and enquiries added by the studio will appear here."}
            action={canManage ? <AdminButton onClick={openForm}>Add enquiry</AdminButton> : undefined}
          />
        ) : query.trim() ? (
          <AdminEmptyState
            icon={SearchX}
            title="No matching enquiries"
            description="Try a different customer name, phone number, service, or enquiry source."
            action={<AdminButton variant="secondary" onClick={clearFilters}>Clear search and filters</AdminButton>}
          />
        ) : hasStatusOrPriorityFilter || serviceCategory ? (
          <AdminEmptyState
            icon={Inbox}
            title="No enquiries in this view"
            description="Choose another service or status, or reset the active filters."
            action={<AdminButton variant="secondary" onClick={clearFilters}>Reset filters</AdminButton>}
          />
        ) : scope === 'active' ? (
          <AdminEmptyState
            icon={Inbox}
            title="No active enquiries"
            description="Not interested enquiries remain available in the complete list."
            action={<AdminButton variant="secondary" onClick={() => setScope('all')}>View all enquiries</AdminButton>}
          />
        ) : null}
        {!loading && !error && visible.length > 0 && <EnquiryPagination page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />}
      </section>

      {refreshing && <p className="sr-only" role="status">Refreshing enquiries…</p>}

      {hasAnyFilter && visible.length > 0 && (
        <div className="flex justify-center md:hidden">
          <button type="button" onClick={clearFilters} className="min-h-10 rounded-xl px-3 text-xs font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">Clear all filters</button>
        </div>
      )}

      </div>

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
