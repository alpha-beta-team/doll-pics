import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatINR } from '../../lib/pricing';
import type { SaleReport } from '../../shared/types/sales';
export function SalesSummary({ dateFrom, dateTo, refreshing = false }: { dateFrom?: string; dateTo?: string; refreshing?: boolean }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const from = dateFrom ?? `${today.slice(0, 7)}-01`;
  const to = dateTo ?? today;
  const [report, setReport] = useState<SaleReport | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role !== 'owner' || refreshing) return;
    let cancelled = false; setReport(null); setError('');
    void api.getSalesReport(from, to).then(result => { if (!cancelled) setReport(result); }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Sale report unavailable'); });
    return () => { cancelled = true; };
  }, [from, to, user?.role, refreshing]);
  if (user?.role !== 'owner') return null;
  return <section className="rounded-xl border border-admin-border bg-admin-surface p-4"><div className="flex justify-between"><h2 className="font-semibold text-admin-text">Seasonal sales</h2><Link to="/admin/sales" className="text-sm font-medium text-blue-700 underline">Manage & view results</Link></div><p className="mt-1 text-xs text-admin-subtle">Bookings using an offer · confirmed {from} to {to}</p>{error ? <p role="status" className="mt-3 text-sm text-amber-700">{error}</p> : report ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Bookings', report.summary.bookings ?? 0], ['Booked revenue', formatINR(report.summary.bookedRevenue ?? 0)], ['Campaign discounts', formatINR(report.summary.campaignDiscount ?? 0)], ['Lifetime collections', formatINR(report.summary.lifetimeCollections ?? 0)]].map(([label, value]) => <div key={label}><p className="text-xs text-admin-subtle">{label}</p><p className="mt-1 font-semibold text-admin-text">{value}</p></div>)}</div> : <p className="mt-3 text-sm text-admin-subtle">Loading sale performance…</p>}</section>;
}
