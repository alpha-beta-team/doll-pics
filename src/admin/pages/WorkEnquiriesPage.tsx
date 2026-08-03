import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarClock, MessageCircle, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import { EnquiryStageBadge } from '../components/EnquiryStageBadge';
import { whatsappUrl } from '../contact';
import type { Enquiry, EnquiryStage } from '../types';

const STAGES: Array<{ value: EnquiryStage | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed_lost', label: 'Not interested' },
];

export function WorkEnquiriesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [stage, setStage] = useState<EnquiryStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <header className="flex items-end justify-between gap-3">
        <div><p className="text-sm font-semibold text-blue-600">Customer enquiries</p><h1 className="text-2xl font-bold text-slate-900">Who needs a reply?</h1><p className="mt-1 text-sm text-slate-500">Every new customer starts here.</p></div>
        <button type="button" onClick={() => setParams({ new: '1' })} className="hidden h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white sm:flex"><Plus className="h-4 w-4" /> Add enquiry</button>
      </header>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error}<button className="ml-auto font-semibold" onClick={() => void load()}>Try again</button></div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="flex h-12 items-center gap-2 rounded-xl bg-slate-50 px-3"><Search className="h-5 w-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone" className="min-w-0 flex-1 bg-transparent text-base outline-none" /><button type="button" onClick={() => void load()} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button></label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {STAGES.map(option => <button key={option.value} type="button" onClick={() => setStage(option.value)} className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${stage === option.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{option.label}{option.value !== 'all' ? ` ${items.filter(item => item.stage === option.value).length}` : ''}</button>)}
        </div>
      </div>

      {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : (
        <section className="grid gap-3 sm:grid-cols-2">
          {visible.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link to={`/admin/enquiries/${item.id}`} className="block">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-900">{item.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{item.shootType || 'Service not decided'} · {sourceLabel(item.source)}</p></div><EnquiryStageBadge stage={item.stage} /></div>
              {item.nextFollowUpAt && <p className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${new Date(item.nextFollowUpAt) < new Date() ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}><CalendarClock className="h-4 w-4" />{new Date(item.nextFollowUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </Link>
            <div className="mt-4 grid grid-cols-3 gap-2"><a href={`tel:${item.phone}`} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"><Phone className="h-4 w-4" /> Call</a><a href={whatsappUrl(item.phone)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</a><button type="button" onClick={() => navigate(`/admin/enquiries/${item.id}`)} className="h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white">Open</button></div>
          </article>)}
          {!visible.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-800">No enquiries here</p><p className="mt-1 text-sm text-slate-500">Add the next caller or choose another stage.</p></div>}
        </section>
      )}

      {params.get('new') === '1' && <EnquiryFormModal onClose={closeForm} onSaved={item => { closeForm(); navigate(`/admin/enquiries/${item.id}`); }} />}
    </div>
  );
}

function sourceLabel(value: Enquiry['source']) { return ({ website: 'Website', phone: 'Phone', whatsapp: 'WhatsApp', walk_in: 'Walk-in', referral: 'Referral', diary_import: 'Diary' } as const)[value]; }
