import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CalendarClock, MessageCircle, Phone, Plus, RefreshCw, Search, X } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import { EnquiryStageBadge } from '../components/EnquiryStageBadge';
import { whatsappUrl } from '../contact';
import type { Enquiry, EnquiryStage } from '../types';
import { AdminButton, AdminPageHeader } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';

const STAGES: Array<{ value: EnquiryStage | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed_lost', label: 'Not interested' },
];

export function WorkEnquiriesPage() {
  const { canManage, isReadOnly } = useFeatureAccess('enquiries');
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [stage, setStage] = useState<EnquiryStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occasionContact] = useState(() => (location.state as { occasionContact?: { id: string; customerName: string; phone: string } } | null)?.occasionContact);
  useEffect(() => {
    if (occasionContact) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, navigate, occasionContact]);

  const load = useCallback(async () => {
    setError('');
    try { setItems(await api.getEnquiries()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load enquiries.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      if (stage !== 'all' && item.stage !== stage) return false;
      if (!query) return true;
      return [item.name, item.phone, item.shootType, item.location].some(value => value.toLowerCase().includes(query));
    });
  }, [items, search, stage]);

  const closeForm = () => {
    params.delete('new');
    setParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminPageHeader eyebrow="Studio Operations" title="Who needs a reply?" description="Every new customer starts here." actions={canManage ? <AdminButton onClick={() => setParams({ new: '1' })} className="hidden sm:inline-flex"><Plus className="h-4 w-4" />Add enquiry</AdminButton> : <ReadOnlyNotice />} />

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error}<button className="ml-auto font-semibold" onClick={() => void load()}>Try again</button></div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-admin-border bg-admin-surface px-3.5 transition focus-within:border-admin-focus focus-within:ring-2 focus-within:ring-admin-focus/20">
            <Search className="h-5 w-5 shrink-0 text-admin-subtle" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by name or phone"
              aria-label="Search enquiries by name or phone"
              className="min-w-0 flex-1 appearance-none !border-0 !bg-transparent p-0 text-sm text-admin-text outline-none placeholder:text-admin-subtle focus:ring-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-admin-subtle transition hover:bg-admin-muted hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-admin-border bg-admin-surface text-admin-subtle transition hover:border-admin-control hover:bg-admin-muted hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
            aria-label="Refresh enquiries"
            title="Refresh enquiries"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {STAGES.map(option => <button key={option.value} type="button" onClick={() => setStage(option.value)} className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${stage === option.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{option.label}{option.value !== 'all' ? ` ${items.filter(item => item.stage === option.value).length}` : ''}</button>)}
        </div>
      </div>

      {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : (
        <section className="grid gap-3 sm:grid-cols-2">
          {visible.map(item => <article key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-admin-control hover:shadow-lg">
            <Link to={`/admin/enquiries/${item.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-bold text-blue-600">
                  {item.name.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate pt-0.5 text-base font-semibold text-slate-900">{item.name || 'Unnamed customer'}</h2>
                    <EnquiryStageBadge stage={item.stage} />
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {item.shootType || 'Service not decided'} <span aria-hidden="true">·</span> via {sourceLabel(item.source)}
                  </p>
                </div>
              </div>
              {item.nextFollowUpAt && <p className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${new Date(item.nextFollowUpAt) < new Date() ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}><CalendarClock className="h-4 w-4 shrink-0" />{new Date(item.nextFollowUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </Link>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              {!isReadOnly && <>
              <a
                href={`tel:${item.phone}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
                aria-label={`Call ${item.name || 'customer'}`}
                title={`Call ${item.name || 'customer'}`}
              >
                <Phone className="h-5 w-5" />
              </a>
              <a
                href={whatsappUrl(item.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={`Message ${item.name || 'customer'} on WhatsApp`}
                title={`Message ${item.name || 'customer'} on WhatsApp`}
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              </>}
              <button
                type="button"
                onClick={() => navigate(`/admin/enquiries/${item.id}`)}
                className="ml-auto flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2"
              >
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </article>)}
          {!visible.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-800">No enquiries here</p><p className="mt-1 text-sm text-slate-500">Add the next caller or choose another stage.</p></div>}
        </section>
      )}

      {canManage && params.get('new') === '1' && <EnquiryFormModal initialContact={occasionContact} draftKey={occasionContact ? `doll_admin_enquiry_draft:occasion:${occasionContact.id}` : undefined} onClose={closeForm} onSaved={item => { closeForm(); navigate(`/admin/enquiries/${item.id}`); }} />}
    </div>
  );
}

function sourceLabel(value: Enquiry['source']) { return ({ website: 'Website', phone: 'Phone', whatsapp: 'WhatsApp', walk_in: 'Walk-in', referral: 'Referral', diary_import: 'Diary' } as const)[value]; }
