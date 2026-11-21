import { useEffect, useId, useRef, useState } from 'react';
import { Check, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import type { Booking } from '../../types';
import type { BookingWorkflow } from '../../../shared/bookingWorkflow';
import { bookingWorkflowApi } from '../../api/bookingWorkflow';
import './booking-workflow.css';
function workflowDue(dueAt: string, now: number) {
  const diff = new Date(dueAt).getTime() - now;
  if (!Number.isFinite(diff)) return null;
  const days = Math.ceil(Math.abs(diff) / 86400000);
  return { overdue: diff < 0, label: diff < 0 ? `Overdue by ${days} ${days === 1 ? 'day' : 'days'}` : `${days} ${days === 1 ? 'day' : 'days'} left` };
}
const date = (at: string, full = false) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', ...(full ? { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true } as const : {}) }).format(new Date(at));
export function WorkflowTrackerSkeleton() { return <div role="status" aria-label="Loading workflow" className="booking-workflow booking-workflow-skeleton"><span /></div>; }
export function WorkflowTracker({ booking, canManage, onSaved }: { booking: Booking; canManage: boolean; onSaved: (booking: Booking) => void }) {
  const [optimistic, setOptimistic] = useState<BookingWorkflow | null>(null);
  const [busy, setBusy] = useState(false), [open, setOpen] = useState(false), [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now);
  const lock = useRef(false), popover = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const checklistId = useId();
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''), 6000); return () => window.clearTimeout(timer); }, [message]);
  useEffect(() => {
    if (!open) return;
    popover.current?.querySelector<HTMLInputElement>('input')?.focus();
    const outside = (event: MouseEvent) => { if (!popover.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const workflow = optimistic || booking.workflow;
  if (!workflow) return <div className="booking-workflow" role="status">Workflow unavailable. Reload the booking to retry.</div>;
  const cancelled = booking.status === 'cancelled' || !!workflow.cancelledAt;
  const current = cancelled ? undefined : workflow.steps.find(step => step.status === 'current');
  const pending = current?.milestones.find(m => !m.done);
  const due = current?.dueAt ? workflowDue(current.dueAt, now) : null;
  const save = async (key?: string, done = true) => {
    if (lock.current || !canManage || !current || !workflow || booking.status === 'draft') return;
    lock.current = true; setBusy(true); setMessage('');
    const next = structuredClone(workflow);
    const step = next.steps.find(s => s.key === current.key)!;
    if (key) { const milestone = step.milestones.find(m => m.key === key)!; milestone.done = done; }
    else { step.status = 'done'; step.completedAt = new Date().toISOString(); const upcoming = next.steps.find(s => s.status === 'upcoming'); if (upcoming) upcoming.status = 'current'; setOpen(false); }
    setOptimistic(next);
    try { const saved = key ? await bookingWorkflowApi.milestone(booking.id, key, done) : await bookingWorkflowApi.advance(booking.id); onSaved(saved); setMessage(key ? 'Milestone updated' : `${current.label} completed`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save workflow. Please try again.'); }
    finally { setOptimistic(null); setBusy(false); lock.current = false; }
  };
  return <section className="booking-workflow" aria-label="Booking workflow" aria-busy={busy}>
    <ol aria-label={`Workflow progress: ${cancelled ? 'Cancelled' : current ? `${current.label} in progress` : 'Complete'}`} style={{ gridTemplateColumns: `repeat(${workflow.steps.filter(s => s.status !== 'skipped').length}, minmax(0, 1fr))` }}>
      {workflow.steps.filter(step => step.status !== 'skipped').map(step => <li key={step.key} className={`workflow-step is-${cancelled ? 'cancelled' : step.status}`} aria-current={!cancelled && step.status === 'current' ? 'step' : undefined}>
        <span className="workflow-bar" /><strong>{step.label}{!cancelled && step.status === 'done' && <Check size={14} aria-label="Completed" role="img" />}</strong>
        {!cancelled && step.status === 'done' && <small>{step.completedAt ? date(step.completedAt) : 'Completed'}</small>}
        {!cancelled && step.status === 'current' && <small>In progress</small>}
      </li>)}
    </ol>
    {cancelled ? <p className="workflow-cancelled">{workflow.cancelledAt ? `Cancelled on ${date(workflow.cancelledAt)}` : 'Cancelled'}</p> : current ? <div className="workflow-actions">
      <div className="workflow-checklist-anchor" ref={popover}><button ref={trigger} type="button" className="workflow-milestones" aria-expanded={open} aria-controls={checklistId} aria-label={`${current.label} milestones, ${current.milestones.filter(m => m.done).length} of ${current.milestones.length} done`} title={`${current.label} milestones`} onClick={() => setOpen(!open)}><ListChecks size={18} /><span>{current.milestones.filter(m => m.done).length}/{current.milestones.length}</span></button>
        {open && <div className="workflow-checklist" id={checklistId}><strong>{current.label} milestones</strong>{current.milestones.length ? current.milestones.map(m => <label key={m.key}><input type="checkbox" checked={m.done} disabled={busy || !canManage || booking.status === 'draft'} onChange={event => void save(m.key, event.target.checked)} />{m.label}</label>) : <p>Digital delivery is recorded when edited photos are shared.</p>}</div>}
      </div>
      <div className={`workflow-due ${due?.overdue ? 'is-overdue' : ''}`}>{due && <strong><Clock3 size={16} />{due.label}</strong>}<small>{due && current.dueAt ? `Due ${date(current.dueAt, true)} IST` : 'Due date not set'}</small></div>
      {canManage && <button type="button" className="workflow-primary" disabled={busy || booking.status === 'draft'} aria-label={pending ? `Mark done: ${pending.label.toLowerCase()}` : `Complete ${current.label}`} onClick={() => void save(pending?.key)}><CheckCircle2 size={16} />{pending ? 'Mark done' : `Complete ${current.label}`}</button>}
    </div> : <p className="workflow-complete"><CheckCircle2 size={18} />Workflow complete</p>}
    {message && <div className="workflow-toast" role="status">{message}</div>}
  </section>;
}
