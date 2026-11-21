import { money, shortDate, timestamp } from '../../reports/ownerDashboardFormat';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { BookingDialog } from '../bookings/BookingDetailSections';
import { changeLabel, cumulativePoints, type OwnerQueue, type OwnerQueuePage } from '../../reports/ownerDashboard';
import type { OwnerOverviewReport } from '../../types';
export function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div className="od-section-title"><h2>{title}</h2><span>{detail}</span></div>;
}
export function Panel({ title, detail, children }: { title: string; detail?: ReactNode; children: ReactNode }) {
  return <section className="od-panel"><header><h3>{title}</h3>{detail && <span>{detail}</span>}</header>{children}</section>;
}
export function Metric({ label, value, detail, current, previous, mode, onClick, tone = '', previousFormat = String, higherIsBetter = true }: {
  label: string; value: ReactNode; detail: ReactNode; current?: number; previous?: number; mode?: 'percent' | 'count' | 'points'; onClick?: () => void; tone?: string; previousFormat?: (value: number) => string; higherIsBetter?: boolean;
}) {
  const content = <><div className="od-metric-label">{label}</div><div className={`od-metric-value ${tone}`}><span>{value}</span>{current !== undefined && previous !== undefined && <span className={`od-change ${(higherIsBetter ? current < previous : current > previous) ? 'od-down' : 'od-up'}`} tabIndex={onClick ? undefined : 0}>{changeLabel(current, previous, mode)}<span className="od-change-tooltip">Previous period: {previousFormat(previous)}</span></span>}</div><div className="od-metric-detail">{detail}</div></>;
  return onClick ? <button type="button" className="od-metric" onClick={onClick}>{content}</button> : <div className="od-metric">{content}</div>;
}
export function Bars({ rows, currency = false, total, footer, funnel = false }: { rows: Array<{ label: string; value: number; color?: string }>; currency?: boolean; total?: number; footer?: ReactNode; funnel?: boolean }) {
  const max = Math.max(...rows.map(row => row.value), 1);
  return <div className={`od-bars ${funnel ? 'od-funnel' : ''}`}>{rows.length ? rows.map(row => <div key={row.label} className="od-bar"><span title={row.label}>{row.label}</span><div aria-hidden="true"><i style={{ width: `${Math.max(0, row.value / max * 100)}%`, background: row.color }} /></div><b>{currency ? money(row.value) : row.value}{funnel && <small> {Math.round(row.value / max * 100)}%</small>}</b></div>) : <p className="od-empty">No records in this period.</p>}{total !== undefined && <div className="od-total"><span>Total</span><b>{currency ? money(total) : total}</b></div>}{footer && <p className="od-note">{footer}</p>}</div>;
}
function normalizedPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}
export function QueueTable({ data, payments, onPayment, compact = false, unpriced = false }: { data: OwnerQueuePage; payments?: boolean; onPayment?: (id: string) => void; compact?: boolean; unpriced?: boolean }) {
  return <div className="od-table-wrap">{data.rows.length ? <table className="od-table"><thead><tr><th>Customer</th><th>{compact ? 'Details' : 'Shoot / due date'}</th><th className="od-number">{payments ? 'Balance' : 'Details'}</th>{payments && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{data.rows.map((row, i) => <tr key={`${row.entity}-${row.id}-${row.taskId || i}`}><td><Link to={`/admin/${row.entity === 'booking' ? 'bookings' : 'enquiries'}/${row.id}`}>{row.customerName || 'Customer'}</Link>{row.title && <small>{row.title}</small>}</td><td>{row.shootType}{row.bookingDate && <small>{shortDate(row.bookingDate)}</small>}{row.paymentDueDate && <small>Due {shortDate(row.paymentDueDate)}{row.daysOverdue != null && row.daysOverdue > 0 && <span className="od-days-overdue"> · {row.daysOverdue} {row.daysOverdue === 1 ? 'day' : 'days'} overdue</span>}</small>}{row.dueAt && <small>{timestamp(row.dueAt)} IST</small>}</td><td className="od-number">{unpriced ? <Link className="od-set-price" to={`/admin/bookings/${row.id}`}>Set price</Link> : row.balanceDue != null ? <span className={payments ? 'od-red' : ''}>{money(row.balanceDue)}</span> : '—'}</td>{payments && <td><div className="od-row-actions">{row.customerPhone && <><a aria-label={`Call ${row.customerName}`} title="Call" href={`tel:+${normalizedPhone(row.customerPhone)}`}><Phone size={14} /></a><a aria-label={`WhatsApp reminder for ${row.customerName}`} title="Open WhatsApp reminder" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${normalizedPhone(row.customerPhone)}?text=${encodeURIComponent(`Hi ${row.customerName}, a reminder that ${money(row.balanceDue || 0)} is due for your booking with Doll Pictures. Please contact us if you have already paid.`)}`}><MessageCircle size={14} /></a></>}{onPayment && <button type="button" onClick={() => onPayment(row.id)}>Record payment</button>}</div></td>}</tr>)}</tbody></table> : <p className="od-empty">No matching records.</p>}</div>;
}
export function OwnerQueueDialog({ kind, title, from, to, onClose, onPayment, paymentMessage }: { kind: OwnerQueue; title: string; from: string; to: string; onClose: () => void; onPayment: (id: string) => void; paymentMessage?: string }) {
  const [page, setPage] = useState(1), [data, setData] = useState<OwnerQueuePage | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    void api.getOwnerQueue(kind, from, to, page, controller.signal).then(next => { if (!controller.signal.aborted) setData(next); }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load records.'); });
    return () => controller.abort();
  }, [kind, from, to, page, attempt]);
  const productionLink: Partial<Record<OwnerQueue, string>> = { setup: '/admin/post-shoot?tab=shoot', photos: '/admin/post-shoot?tab=selection&sub=photos', editing: '/admin/post-shoot?tab=editing&sub=editing&scope=overdue', handover: '/admin/post-shoot?tab=delivery&sub=handover' };
  const payments = ['outstanding', 'overdue', 'dueSoon'].includes(kind);
  return <BookingDialog title={title} onClose={onClose} compact className="admin-theme owner-dashboard od-queue-dialog"><div className="od-queue-body">{paymentMessage && <p role="status" className="od-note">{paymentMessage}</p>}{error ? <p role="alert">{error} <button onClick={() => setAttempt(attempt + 1)}>Try again</button></p> : data && data.page === page ? <><p className="od-note">{productionLink[kind] && <><Link to={productionLink[kind]!}>Open production queue{kind === 'setup' ? ' for bulk setup' : ''} →</Link><br /></>}{data.total} matching {kind.startsWith('followUps') ? 'follow-ups' : 'records'}</p><QueueTable data={data} unpriced={kind === 'unpriced'} payments={payments} onPayment={payments ? onPayment : undefined} /><div className="od-pagination"><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button><span>Page {page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button aria-label="Next page" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div></> : <p role="status" className="od-empty">Loading records…</p>}</div></BookingDialog>;
}
export function PaymentsChart({ report }: { report: OwnerOverviewReport }) {
  const previous = report.dashboard!.previous;
  const daily = report.finance.period.trendGroup === 'day';
  const currentPoints = cumulativePoints(report.finance.paymentTrend, report.period.dateFrom, report.period.dateTo, report.finance.period.trendGroup);
  const previousPoints = cumulativePoints(previous.paymentTrend, report.period.previousDateFrom, report.period.previousDateTo, report.finance.period.trendGroup);
  const max = Math.max(...currentPoints, ...previousPoints, 1);
  const coords = (values: number[]) => values.length ? values.map((value, index) => `${values.length === 1 ? 600 : index / (values.length - 1) * 600},${145 - value / max * 130}`).join(' ') : '0,145 600,145';
  return <div className="od-chart"><svg viewBox="0 0 600 160" role="img" aria-label={`Cumulative payments: ${money(report.finance.summary.paymentsReceived)} this period; ${money(previous.paymentsReceived)} previous period.`}><title>Cumulative payments received by paid date</title>{[15, 80, 145].map(y => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#E8EDED" />)}<polyline points={coords(previousPoints)} fill="none" stroke="#9AA5A4" strokeWidth="2" strokeDasharray="5 5" /><polyline points={coords(currentPoints)} fill="none" stroke="#0B5C60" strokeWidth="3" />{currentPoints.length === 1 && <circle cx="600" cy={145 - currentPoints[0] / max * 130} r="4" fill="#0B5C60" />}</svg><div className="od-chart-axis"><span>{shortDate(report.period.dateFrom)}</span><span>{shortDate(report.period.dateTo)}</span></div><div className="od-chart-legend"><span><i />Selected period · {money(report.finance.summary.paymentsReceived)}</span><span><i />Previous period · {money(previous.paymentsReceived)}</span></div><p className="od-note">{daily ? 'Cumulative daily collections, aligned by progress through each period.' : `Cumulative ${report.finance.period.trendGroup === 'week' ? 'weekly' : 'monthly'} collections, including periods with no payments.`}</p></div>;
}
export function TablePanel({ title, data, detail, onView, onPayment, unpriced }: { title: string; data: OwnerQueuePage; detail?: string; onView: () => void; onPayment?: (id: string) => void; unpriced?: boolean }) {
  return <Panel title={title} detail={<button className="od-link" onClick={onView}>View all {data.total} →</button>}><QueueTable data={data} unpriced={unpriced} payments={Boolean(onPayment)} onPayment={onPayment} />{detail && <p className="od-note od-padded">{detail}</p>}</Panel>;
}
export type OpenQueue = (kind: OwnerQueue, title: string) => void;
export function AttentionRow({ title, detail, value, onClick, tone = 'teal' }: { title: string; detail?: string; value: number; onClick: () => void; tone?: 'teal' | 'danger' | 'warning' | 'blue' }) {
  return <button className="od-attention-row" onClick={onClick}><span>{title}{detail && <small>{detail}</small>}</span><b className={`od-count od-count-${tone}`}>{value}</b><span className="od-link">Open →</span></button>;
}
