import { useCallback, useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { WeddingQuotation } from '../types';

export function QuotationEnquiryPanel({ enquiryId, compact = false }: { enquiryId: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<WeddingQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await api.getQuotations({ enquiryId })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load quotations.'); } finally { setLoading(false); } }, [enquiryId]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => { setCreating(true); setError(''); try { const quote = await api.createQuotation(enquiryId); navigate(`/admin/quotations/${quote.id}`); } catch (err) { setError(err instanceof Error ? err.message : 'Could not create quotation.'); setCreating(false); } };
  return <section className={`rounded-2xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'} shadow-sm`}><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Wedding quotations</h2><p className="mt-1 text-sm text-slate-500">Proposals linked to this enquiry.</p></div><button type="button" disabled={creating} onClick={() => void create()} className="flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Create</button></div>{error && <p className="mt-3 text-sm text-red-600">{error} <button onClick={() => void load()} className="underline">Retry loading</button></p>}{loading && <p role="status" className="mt-3 text-sm text-admin-subtle">Loading quotations…</p>}<div className="mt-4 space-y-2">{items.map(item => <Link key={item.id} to={`/admin/quotations/${item.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className="h-5 w-5 text-amber-600" /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{item.draft.coupleNames || 'Wedding quotation'}</p><p className="text-xs text-slate-500">{item.quotationNumber || 'Draft'} · {item.expired ? 'expired' : item.status}</p></div><span className="text-sm font-semibold text-blue-600">Open</span></Link>)}{!loading && !error && !items.length && <p className={compact ? 'text-sm text-slate-500' : 'rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500'}>No wedding quotation yet.</p>}</div></section>;
}
