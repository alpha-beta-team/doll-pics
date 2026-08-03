import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, Check, IndianRupee, MessageCircle, Phone, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { api } from '../api/client';
import { InstallAppButton } from '../components/InstallAppButton';
import { whatsappUrl } from '../contact';
import type { TodayFollowUp, TodaySummaryItem, TodayWork } from '../types';

export function TodayPage() {
  const navigate = useNavigate();
  const [work, setWork] = useState<TodayWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setWork(await api.getTodayWork()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load today’s work.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const complete = async (item: TodayFollowUp) => {
    try {
      if (item.entityType === 'enquiry') await api.completeEnquiryFollowUp(item.id);
      else await api.completeBookingFollowUp(item.id);
      setSuccess(`${item.name}'s follow-up is done.`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the follow-up.'); }
  };
  const tomorrow = async (item: TodayFollowUp) => {
    const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(10, 0, 0, 0);
    try {
      if (item.entityType === 'enquiry') await api.scheduleEnquiryFollowUp(item.id, date.toISOString(), item.note || undefined);
      else await api.scheduleBookingFollowUp(item.id, date.toISOString(), item.note || undefined);
      setSuccess(`${item.name}'s follow-up moved to tomorrow.`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not move the follow-up.'); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  return <div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-blue-600">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p><h1 className="text-3xl font-bold text-slate-900">Today’s work</h1><p className="mt-1 text-sm text-slate-500">Start at the top and finish one item at a time.</p></div><div className="flex gap-2"><InstallAppButton /><button type="button" onClick={() => void load()} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={() => navigate('/admin/enquiries?new=1')} className="hidden h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white sm:flex"><Plus className="h-4 w-4" /> Add enquiry</button></div></header>
    {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}<button className="ml-auto font-semibold" onClick={() => void load()}>Try again</button></div>}
    {success && <div className="flex rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}<button className="ml-auto" onClick={() => setSuccess('')}>Dismiss</button></div>}
    {work && <>
      <WorkSection title="Follow-ups" count={work.followUps.length} urgent={work.followUps.some(item => item.overdue)} empty="No follow-ups due. You are up to date.">
        {work.followUps.map(item => <article key={`${item.entityType}-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.shootType || 'Service not decided'}{item.note ? ` · ${item.note}` : ''}</p><p className={`mt-2 text-xs font-semibold ${item.overdue ? 'text-red-600' : 'text-amber-700'}`}>{item.overdue ? 'Overdue · ' : ''}{item.dueAt ? new Date(item.dueAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Due today'}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.entityType === 'enquiry' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{item.entityType}</span></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5"><a href={`tel:${item.phone}`} className="action"><Phone className="h-4 w-4" /> Call</a><a href={whatsappUrl(item.phone)} target="_blank" rel="noreferrer" className="action text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</a><button onClick={() => void complete(item)} className="action bg-emerald-600 text-white"><Check className="h-4 w-4" /> Done</button><button onClick={() => void tomorrow(item)} className="action"><RotateCcw className="h-4 w-4" /> Tomorrow</button><Link to={`/admin/${item.entityType === 'enquiry' ? 'enquiries' : 'bookings'}/${item.id}`} className="action bg-slate-900 text-white">Open</Link></div></article>)}
      </WorkSection>
      <WorkSection title="New enquiries" count={work.newEnquiries.length} empty="No new enquiries waiting.">{work.newEnquiries.map(item => <SimpleTask key={item.id} item={item} to={`/admin/enquiries/${item.id}`} />)}</WorkSection>
      <WorkSection title="Today’s shoots" count={work.todayShoots.length} empty="No confirmed shoots today.">{work.todayShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar />)}</WorkSection>
      <WorkSection title="Payments due" count={work.paymentsDue.length} empty="No payments are due today.">{work.paymentsDue.map(item => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><IndianRupee className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="text-sm text-slate-500">Balance {money(item.balanceDue)} · due {item.paymentDueDate}</p></div><Link to={`/admin/bookings/${item.id}`} className="flex h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Record</Link></article>)}</WorkSection>
      <WorkSection title="Tomorrow’s shoots" count={work.tomorrowShoots.length} empty="No confirmed shoots tomorrow.">{work.tomorrowShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar />)}</WorkSection>
    </>}
  </div>;
}

function WorkSection({ title, count, empty, urgent, children }: { title: string; count: number; empty: string; urgent?: boolean; children: React.ReactNode }) { return <section className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${urgent ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50/60'}`}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${urgent ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600'}`}>{count}</span></div><div className="space-y-3">{count ? children : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">{empty}</div>}</div></section>; }
function SimpleTask({ item, to, calendar }: { item: TodaySummaryItem; to: string; calendar?: boolean }) { return <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{calendar ? <CalendarDays className="h-5 w-5" /> : item.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="truncate text-sm text-slate-500">{item.shootType || 'Service not decided'}{item.location ? ` · ${item.location}` : ''}</p></div><Link to={to} className="flex h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Open</Link></article>; }
function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
