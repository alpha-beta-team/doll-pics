import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarHeart, Check, MessageCircle, Phone, RefreshCw, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import type { CustomerOccasion } from '../types';
import { occasionMessageContext, occasionUrgency } from '../components/occasionPresentation';
import { AdminIconButton, AdminPageHeader } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';

export function OccasionsPage() {
  const { canManage, isReadOnly } = useFeatureAccess('occasions');
  const navigate = useNavigate();
  const [items, setItems] = useState<CustomerOccasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'pending' | 'contacted' | 'archived'>('active');
  const [message, setMessage] = useState<{ item: CustomerOccasion; context: ManualWhatsAppContext; template: WhatsAppTemplateId } | null>(null);
  const load = useCallback(async () => {
    setError('');
    try { setItems(await api.getUpcomingOccasions(undefined, 30, true)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load occasions.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (filter === 'active' && !item.active) return false;
      if (filter === 'archived' && item.active) return false;
      if (filter === 'pending' && (!item.active || item.contactedForOccurrence)) return false;
      if (filter === 'contacted' && (!item.active || !item.contactedForOccurrence)) return false;
      return !q || [item.customerName, item.occasionName, item.phone].some(value => value.toLowerCase().includes(q));
    });
  }, [filter, items, search]);
  const groups = useMemo(() => visible.reduce((map, item) => {
    map.set(item.nextOccurrenceDate, [...(map.get(item.nextOccurrenceDate) || []), item]);
    return map;
  }, new Map<string, CustomerOccasion[]>()), [visible]);
  const contacted = async (item: CustomerOccasion) => {
    try { await api.markOccasionContacted(item.id, item.nextOccurrenceDate); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not mark this reminder contacted.'); }
  };

  return <div className="mx-auto max-w-5xl space-y-5"><AdminPageHeader eyebrow="Studio Operations" title="Upcoming important dates" description="Birthdays and anniversaries in the next 30 days." actions={<>{isReadOnly && <ReadOnlyNotice />}<AdminIconButton label="Refresh occasions" onClick={() => void load()}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></AdminIconButton></>} />
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><label className="flex h-12 items-center gap-2 rounded-xl bg-slate-50 px-3"><Search className="h-5 w-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone" className="min-w-0 flex-1 bg-transparent text-base outline-none" /></label><div className="mt-3 flex gap-2 overflow-x-auto">{(['active', 'pending', 'contacted', 'archived'] as const).map(value => <button key={value} type="button" onClick={() => setFilter(value)} className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold capitalize ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value}</button>)}</div></section>
    {loading ? <div className="flex h-48 items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-blue-600" /></div> : <div className="space-y-5">{Array.from(groups.entries()).map(([date, rows]) => <section key={date}><h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{formatDate(date)}</h2><div className="space-y-3">{rows.map(item => <article key={item.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${item.contactedForOccurrence ? 'border-emerald-200' : 'border-slate-200'}`}><div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${item.type === 'birthday' ? 'bg-pink-50' : 'bg-violet-50'}`}>{item.type === 'birthday' ? '🎂' : '💍'}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.occasionName}</h3>{item.contactedForOccurrence && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Contacted</span>}{!item.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Archived</span>}</div><p className="mt-1 text-sm text-slate-500">Contact: {item.customerName} · {item.phone}</p><p className="mt-1 text-xs font-semibold text-pink-600">{occasionUrgency(item.daysUntil)}</p></div></div>{item.active && <div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-border pt-4 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]"><a href={`tel:${item.phone}`} className="action"><Phone className="h-4 w-4" />Call</a>{canManage && <button type="button" onClick={() => setMessage({ item, context: occasionMessageContext(item), template: item.type })} className="action text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</button>}{canManage && <button type="button" disabled={item.contactedForOccurrence} onClick={() => void contacted(item)} className="action bg-emerald-600 text-white disabled:opacity-50"><Check className="h-4 w-4" />Contacted</button>}{item.source && <Link to={`/admin/${item.source.type === 'enquiry' ? 'enquiries' : 'bookings'}/${item.source.id}`} className="action">Source</Link>}{canManage && <button type="button" onClick={() => navigate('/admin/enquiries?new=1', { state: { occasionContact: { id: item.id, customerName: item.customerName, phone: item.phone } } })} className="action bg-blue-600 text-white">Create enquiry</button>}</div>}</article>)}</div></section>)}{!visible.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><CalendarHeart className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 font-semibold text-slate-800">No occasions in this view</p></div>}</div>}
    {canManage && message && <WhatsAppComposer context={message.context} initialTemplate={message.template} onClose={() => setMessage(null)} />}
  </div>;
}

function formatDate(value: string) { return new Date(`${value}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }); }
