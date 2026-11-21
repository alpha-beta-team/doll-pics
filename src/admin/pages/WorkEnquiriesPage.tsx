import { AdminAlert } from '../components/ui/AdminUi';
import './enquiries.css';
import { LEAD_SOURCE_OPTIONS } from '../components/leadSource';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Inbox, Plus, RefreshCw, X, Search, Filter, ListFilter } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import type { Enquiry } from '../types';
import { AdminButton, AdminEmptyState } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { ServiceFilterChips } from '../components/sales/ServiceFilterChips';
import { EnquiryPagination } from '../components/enquiries/EnquiryPagination';
import { EnquiryCard, EnquiryCardSkeleton } from '../components/enquiries/EnquiryCard';
import { canonicalIndianPhone } from '../components/customerLookup.utils';
import { EnquiryFollowUpDialog } from '../components/enquiries/EnquiryFollowUpDialog';
import {
  buildServiceCategoryOptions,
  normalizeServiceCategory,
  serviceCategoryMatches,
} from '../components/sales/serviceCategories';
import {
  ENQUIRY_STAGES,
  ENQUIRY_SORT_OPTIONS, enquiryViews, matchesEnquiryView, receivedGroup, indiaDay,
  enquiryMatchesSearch, sortEnquiries, type EnquiryView,
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
  const { canView: canViewBooking } = useFeatureAccess('bookings');
  const { user } = useAuth();
  const canViewPhone = Boolean(user && (user.role === 'owner' || !user.permissions?.includes('mask_phone_number')));
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
  const rawView = params.get('view') || '';
  const view: EnquiryView = Object.prototype.hasOwnProperty.call(enquiryViews, rawView) ? rawView as EnquiryView : reportMode ? 'all' : 'active';
  const stage = params.get('stage') || '';
  const query = params.get('q') || '';
  const sort = (ENQUIRY_SORT_OPTIONS.find(option => option.value === params.get('sort'))?.value || 'newest') as EnquirySort;
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const filters = { stage, source, dateFrom, dateTo };
  const [draft, setDraft] = useState<typeof filters | null>(null);
  const updateParams = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [followUp, setFollowUp] = useState<Enquiry | null>(null);
  const [followUpSuccess, setFollowUpSuccess] = useState('');
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
      const rows = await api.getEnquiryListRows({ source, dateFrom, dateTo });
      if (version === requestVersion.current) setItems(rows);
    } catch (err) {
      if (version === requestVersion.current) { setItems([]); setError(err instanceof Error ? err.message : 'Could not load enquiries.'); }
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, [source, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  const serviceCategory = requestedServiceCategory;
  const duplicatePhones = useMemo(() => {
    const counts = new Map<string, number>();
    if (canViewPhone) items.filter(item => !['booked', 'closed_lost'].includes(item.stage)).forEach(item => {
      const phone = canonicalIndianPhone(item.phone);
      if (phone) counts.set(phone, (counts.get(phone) || 0) + 1);
    });
    return counts;
  }, [items, canViewPhone]);
  const applySavedEnquiry = (updated: Enquiry) => {
    requestVersion.current += 1;
    setRefreshing(false); setLoading(false); setError('');
    setItems(previous => previous.map(item => item.id === updated.id ? { ...item, ...updated } : item));
  };
  const activeFilterLabels = [
    ENQUIRY_STAGES.find(option => option.value === stage)?.label,
    LEAD_SOURCE_OPTIONS.find(option => option.value === source)?.label || (source === 'not_recorded' ? 'Not recorded' : source),
    dateFrom && 'From ' + dateFrom, dateTo && 'Through ' + dateTo,
  ].filter(Boolean);
  const today = indiaDay(new Date());
  const pipelineCount = items.filter(item => matchesEnquiryView(item, 'active', today)).length;
  const filtered = items.filter(item => (!stage || stage === item.stage) && enquiryMatchesSearch(item, query));
  const matching = filtered.filter(item => matchesEnquiryView(item, view, today));
  const scoped = filtered.filter(item => serviceCategoryMatches(item, serviceCategory));
  const serviceCategories = buildServiceCategoryOptions(items, matching);
  const visible = sortEnquiries(matching.filter(item => serviceCategoryMatches(item, serviceCategory)), sort);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const clearFilters = () => updateParams({ stage: '', source: '', dateFrom: '', dateTo: '', service: '', q: '', view: '' });
  const chronological = sort === 'newest' || sort === 'oldest';
  const groups = pageItems.map(item => receivedGroup(item.createdAt, today));
  const groupCounts = new Map<string, number>();
  groups.forEach(group => groupCounts.set(group, (groupCounts.get(group) || 0) + 1));


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
      <div className="lead-workbench">
        <header className="lead-title"><div><h1>Enquiries</h1><p>{pipelineCount} {pipelineCount === 1 ? 'lead' : 'leads'} in the pipeline · {items.filter(item => indiaDay(item.createdAt) === today).length} new today</p></div>
          <label className="lead-search"><Search size={15}/><input type="search" aria-label="Search enquiries" placeholder="Name or phone" value={query} onChange={e => updateParams({ q: e.target.value })}/></label>
          <button aria-label="Refresh enquiries" disabled={refreshing} onClick={() => void load(true)}><RefreshCw size={16}/></button>
          {canManage && <button className="lead-primary" onClick={openForm}><Plus size={16}/> Add enquiry</button>}</header>
        {isReadOnly && <ReadOnlyNotice />}
        <div className="lead-list-surface"><div className="lead-controls">
        <div className="lead-chips lead-views" role="group" aria-label="Enquiry views">{(Object.keys(enquiryViews) as EnquiryView[]).map(key =>
          <button key={key} aria-pressed={view === key} onClick={() => updateParams({ view: key })}>{enquiryViews[key]} <b>{scoped.filter(item => matchesEnquiryView(item,key,today)).length}</b></button>)}</div>
          <button className="lead-filter-toggle" aria-label="Filter enquiries" title="Filters" aria-expanded={Boolean(draft)} onClick={() => setDraft(draft ? null : filters)}><Filter size={14}/></button>
          <label className="lead-sort"><ListFilter size={15}/><select aria-label="Sort enquiries" value={sort} onChange={e => updateParams({ sort: e.target.value })}>{ENQUIRY_SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {draft && <form className="lead-filters" aria-label="Filter enquiries" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setDraft(null); } }} onSubmit={e => {
            e.preventDefault();
            updateParams({ ...draft, view: ['closed_lost', 'booked'].includes(draft.stage) ? 'all' : view });
            setDraft(null);
          }}>
            <div className="lead-title"><h2>Filters</h2><button type="button" onClick={() => setDraft({ stage:'', source:'', dateFrom:'', dateTo:'' })}>Clear all</button></div>
            <fieldset className="lead-filter-options"><legend>Stage</legend>
              {[{value: '', label: 'Any stage'}, ...ENQUIRY_STAGES].map(option =>
                <button type="button" key={option.value} aria-pressed={draft.stage === option.value} onClick={() => setDraft({ ...draft, stage: option.value })}>{option.label}</button>)}
            </fieldset>
            <fieldset className="lead-filter-options"><legend>Source</legend>
              {[{value: '', label: 'Any source'}, ...LEAD_SOURCE_OPTIONS, {value: 'not_recorded', label: 'Not recorded'}].map(option =>
                <button type="button" key={option.value} aria-pressed={draft.source === option.value} onClick={() => setDraft({ ...draft, source: option.value })}>{option.label}</button>)}
            </fieldset>
            <label>Received from<input type="date" max={draft.dateTo} value={draft.dateFrom} onChange={e => setDraft({ ...draft, dateFrom:e.target.value })}/></label>
            <label>Received through<input type="date" min={draft.dateFrom} value={draft.dateTo} onChange={e => setDraft({ ...draft, dateTo:e.target.value })}/></label>
            <footer><button type="button" onClick={() => setDraft(null)}>Cancel</button><button className="lead-primary">Show enquiries</button></footer>
          </form>}
        </div>
        {activeFilterLabels.length > 0 && <div className="lead-applied"><span>Filtered by</span>
          {activeFilterLabels.map(label => <strong key={label}>{label}</strong>)}
          <button onClick={() => updateParams({stage:'',source:'',dateFrom:'',dateTo:'',view})}>Clear filters</button>
        </div>}
        <ServiceFilterChips className="lead-chips lead-services" services={serviceCategories} service={serviceCategory}
          onService={service => updateParams({ service })} limit={7}/>
        {followUpSuccess && <AdminAlert tone="success">{followUpSuccess}</AdminAlert>}

      {error && items.length > 0 && (
        <AdminAlert contentClassName="flex items-center gap-2">

          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => void load(true)} className="min-h-10 rounded-lg px-2 font-semibold outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500">Retry</button>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="flex h-10 w-10 items-center justify-center rounded-lg outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </AdminAlert>
      )}

      <section id="enquiry-list-panel" aria-label="Enquiry list" className="enquiry-list overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-[0_4px_20px_rgba(15,23,42,0.04)]" aria-busy={loading || refreshing}>
        <div className="enquiry-table-scroll" key={location.search} role="region" aria-label="Enquiry rows" tabIndex={0}>
          <div className="enquiry-table-heading text-[11px] font-semibold uppercase tracking-wide text-admin-subtle">
            <span>Customer</span><span>Service · source</span><button className="text-left uppercase" aria-label="Sort by received date" onClick={() => updateParams({ sort: sort === 'newest' ? 'oldest' : 'newest' })}>Received {sort === 'oldest' ? '↑' : sort === 'newest' ? '↓' : '↕'}</button><span>Follow-up</span><span className="sr-only">Actions</span>
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
              {pageItems.map((item, index) => (<Fragment key={item.id}>
                {chronological && groups[index] !== groups[index-1] && <h2 className="lead-group">{groups[index]} <small>{groupCounts.get(groups[index])} {groupCounts.get(groups[index]) === 1 ? 'enquiry' : 'enquiries'}</small></h2>}
            <EnquiryCard
                  key={item.id}
                  enquiry={item}
                  bookingLink={canViewBooking && item.stage === 'booked' && item.convertedBookingId ? '/admin/bookings/' + item.convertedBookingId : undefined}
                  canContact={canManage}
                  canViewPhone={canViewPhone}
                  onFollowUp={canManage ? () => { setFollowUpSuccess(''); setFollowUp(item); } : undefined}
                  duplicateCount={!['booked', 'closed_lost'].includes(item.stage) ? duplicatePhones.get(canonicalIndianPhone(item.phone)) || 0 : 0}
                  onOpen={() => navigate('/admin/enquiries/' + item.id, { state: { listSearch: location.search } })}
                />
              </Fragment>))}
            </div>
          ) : items.length === 0 ? (
            <AdminEmptyState
              icon={Inbox}
              title={reportMode ? "No enquiries match these filters" : "No enquiries yet"}
              description={reportMode ? "Choose another source or creation-date range." : "New website submissions and enquiries added by the studio will appear here."}
              action={canManage ? <AdminButton onClick={openForm}>Add enquiry</AdminButton> : undefined}
            />
          ) : <AdminEmptyState icon={Inbox} title="No matching enquiries" description="Choose another view or adjust your filters." action={<AdminButton onClick={clearFilters}>Reset filters</AdminButton>} />}
        </div>
        {!loading && !error && visible.length > 0 && <EnquiryPagination page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={visible.length} onChange={value => updateParams({ page:String(value) })} />}
      </section></div>

      {refreshing && <p className="sr-only" role="status">Refreshing enquiries…</p>}

      </div>
      {followUp && canManage && !['booked', 'closed_lost'].includes(followUp.stage) && <EnquiryFollowUpDialog
        key={followUp.id}
        enquiry={followUp}
        onClose={() => setFollowUp(null)}
        onSaved={(updated, action) => {
          applySavedEnquiry(updated);
          setFollowUp(null);
          setFollowUpSuccess(`${updated.name || 'Customer'}: follow-up ${action === 'completed' ? 'completed' : 'saved'}.`);
        }}
      />}

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
