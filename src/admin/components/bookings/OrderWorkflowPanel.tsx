import { AdminAlert } from '../ui/AdminUi';
import { OrderJourney } from './OrderJourney';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { OrderDeliveryPreparation, type DeliveryPreparationHandle } from './OrderDeliveryPreparation';
import type { Booking, StaffAccountOption } from '../../types';
import { BookingDialog, BookingSection } from './BookingDetailSections';
import { orderWorkflowApi } from '../../api/orderWorkflow';
import { ORDER_STAGES, ORDER_STAGE_LABELS, milestoneLabel, nextOrderStages, orderHeaderAction, orderEventDateLabel, orderActionLabel, orderDate, orderLocalInput, type OrderInput, type OrderWorkflow, type OrderDetails, type OrderMilestone } from '../../../shared/orderWorkflow';

const detailLabels: Record<keyof OrderDetails, string> = {
  nextAction: 'Next action', blocker: 'Internal blocker', printingHouse: 'Printing house', printingReference: 'Printing reference',
  expectedPrintAt: 'Expected printing completion', printingCompletedAt: 'Actual printing completion',
  printerCourier: 'Printer → studio courier', printerTracking: 'Printer → studio tracking number', printerTrackingUrl: 'Printer → studio tracking link', expectedStudioAt: 'Expected studio arrival',
  expectedDispatchAt: 'Expected customer dispatch', customerCourier: 'Studio → customer courier', customerTracking: 'Studio → customer tracking number', customerTrackingUrl: 'Studio → customer tracking link', expectedDeliveryAt: 'Expected customer delivery',
};
export interface OrderWorkflowHandle { openStatus: () => void }
export const OrderWorkflowPanel = forwardRef<OrderWorkflowHandle, {
  booking: Booking; canManage: boolean; staff: StaffAccountOption[]; onSaved: () => void; onLoaded?: (hasWorkflow: boolean) => void;
  onBookingSaved?: (booking: Booking) => void; onReadyChange?: (ready: boolean) => void; onCompletedChange?: (completed: boolean) => void; onActionLabelChange?: (label: string) => void;
}>(function OrderWorkflowPanel({ booking, canManage, staff, onSaved, onLoaded, onBookingSaved, onReadyChange, onActionLabelChange, onCompletedChange }, ref) {
  const [order, setOrder] = useState<OrderWorkflow | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [draft, setDraft] = useState<OrderInput | null>(null);
  const [date, setDate] = useState('');
  const submitting = useRef(false);
  const preparation = useRef<DeliveryPreparationHandle>(null);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => { onCompletedChange?.(order?.state === 'completed'); }, [order?.state, onCompletedChange]);
  useEffect(() => { onActionLabelChange?.(loading ? 'Loading order…' : orderHeaderAction(order)); }, [order, loading, onActionLabelChange]);
  useEffect(() => {
    let active = true; setLoading(true); onReadyChange?.(false);
    orderWorkflowApi.get(booking.id).then(result => { if (active) { setOrder(result.orderWorkflow); setError(''); onLoaded?.(Boolean(result.orderWorkflow)); onReadyChange?.(true); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load order'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [booking.id, booking.updatedAt, reload, onLoaded, onReadyChange]);
  const open = (input: Partial<OrderInput> & Pick<OrderInput, 'action'>) => {
    setError(''); setDate('');
    setDraft({ revision: order?.revision || 0, requestId: crypto.randomUUID(), ...input });
  };
  const editable = canManage && booking.status !== 'cancelled' && order?.state !== 'cancelled';
  const availableStages = draft?.stage && !ORDER_STAGES.includes(draft.stage) ? [...ORDER_STAGES, draft.stage] : ORDER_STAGES;
  const choices = availableStages.filter(stage => (draft?.mode || order?.mode) !== 'digital' || ORDER_STAGES.indexOf(stage) <= ORDER_STAGES.indexOf('photos_delivered'))
    .filter(stage => draft?.action !== 'reopen' || !['delivered', 'collected', ...((order?.mode === 'digital') ? ['photos_delivered'] : [])].includes(stage));
  useImperativeHandle(ref, () => ({ openStatus: () => {
    if (loading || busy || !editable) return;
    if (!order) open({ action: 'initialize', stage: 'shoot_completed', mode: !booking.deliverables?.length || booking.deliverables.some(row => row.kind === 'physical') ? 'physical' : 'digital', assigneeId: booking.assignedStaffAccountId || '' });
    else if (order.state === 'completed') open({ action: 'reopen', stage: 'editing' });
    else { const stage = nextOrderStages(order)[0]; if (stage) open({ action: 'advance', stage }); }
  } }));
  const save = async () => {
    if (!draft || submitting.current || sharingBusy) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      await preparation.current?.saveLinks();
      const input = { ...draft, ...(date ? { occurredAt: new Date(`${date}:00+05:30`).toISOString() } : {}) };
      const result = await orderWorkflowApi.update(booking.id, input);
      setOrder(result.orderWorkflow); onLoaded?.(Boolean(result.orderWorkflow)); setDraft(null); onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save order'); }
    finally { submitting.current = false; setBusy(false); }
  };
  const delivering = draft?.action === 'advance' && draft.stage === 'photos_delivered';
  return <BookingSection title="Order tracking" action={<button className="bd-button" disabled={loading || busy || Boolean(draft)} onClick={() => setReload(value => value + 1)}>Refresh order</button>}>
    {loading ? <p role="status">Loading order…</p> : <>
      {error && !draft && <AdminAlert as="span">{error}</AdminAlert>}
      {!order ? <div className="space-y-3"><p className="bd-helper">No order workflow recorded. Existing booking dates remain unchanged.</p>{editable && ['shoot_completed', 'delivered'].includes(booking.status) && <button className="bd-button bd-button-primary" onClick={() => open({ action: 'initialize', stage: 'shoot_completed', mode: !booking.deliverables?.length || booking.deliverables.some(row => row.kind === 'physical') ? 'physical' : 'digital', assigneeId: booking.assignedStaffAccountId || '' })}>Start order tracking</button>}</div> : <div className="space-y-4">
        <OrderJourney order={order} actions={editable && nextOrderStages(order).map(stage => <button key={stage} className="bd-button bd-button-primary" onClick={() => open({ action: 'advance', stage })}>{stage === 'photos_delivered' ? 'Share edited photos' : stage === 'received' ? 'Mark printing received' : orderActionLabel(stage)}</button>)} />
        {['shoot_completed', 'awaiting_selection'].includes(order.stage) && !booking.deliverables?.length && <p className="bd-helper">No deliverables recorded. Review the order type in Edit order details before starting editing; the default includes physical products.</p>}
        <div className="flex flex-wrap gap-2">{editable && <>
          <button className="bd-button" onClick={() => open({ action: 'details', ...(['shoot_completed', 'awaiting_selection'].includes(order.stage) ? { mode: order.mode } : {}), assigneeId: order.assigneeId, details: { ...order.details } })}>Edit order details</button>
          <button className="bd-button" onClick={() => open({ action: 'correct', stage: order.stage })}>Correct stage or date</button>
        </>}</div>
        <details><summary className="min-h-11 cursor-pointer py-2 font-medium">Order & shipping details</summary><dl className="grid gap-3 text-sm sm:grid-cols-2">{Object.entries(order.details).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-admin-subtle">{detailLabels[key as keyof OrderDetails]}</dt><dd className="break-words whitespace-pre-wrap">{key.endsWith('At') ? `${orderDate(value)} IST` : value}</dd></div>)}</dl></details>

        <details><summary className="min-h-11 cursor-pointer py-2 font-medium">View activity history</summary><ol className="space-y-3">{[...order.history].reverse().map(event => <li key={event.id} className="rounded-lg bg-admin-muted p-3 text-sm"><p className="font-medium">{event.action} · {ORDER_STAGE_LABELS[event.next.stage]}</p><p>{event.actor.name} · recorded {orderDate(event.recordedAt)} IST</p><p>Event time: {orderDate(event.occurredAt)} IST</p>{event.reason && <p className="break-words">Reason: {event.reason}</p>}{event.note && <p className="break-words">{event.note}</p>}<details><summary className="cursor-pointer py-2">Previous and saved values</summary><div className="space-y-2"><p>Stage: {event.previous ? ORDER_STAGE_LABELS[event.previous.stage] : "Not started"} → {ORDER_STAGE_LABELS[event.next.stage]}</p><p>State: {event.previous?.state || "Not started"} → {event.next.state}</p><p>Order type: {event.previous?.mode || "Not set"} → {event.next.mode}</p><p>Editing deadline: {orderDate(event.previous?.editingDueAt)} → {orderDate(event.next.editingDueAt)} IST</p><p>Responsible: {event.previous?.assigneeName || "Not assigned"} → {event.next.assigneeName || "Not assigned"}</p>{Object.entries(event.next.dates).map(([key, value]) => <p key={key}>{milestoneLabel(key)}: {orderDate(event.previous?.dates[key as OrderMilestone])} → {orderDate(value)} IST</p>)}{Object.keys(event.previous?.dates || {}).filter(key => !event.next.dates[key as OrderMilestone]).map(key => <p key={key}>{milestoneLabel(key)}: {orderDate(event.previous?.dates[key as OrderMilestone])} → cleared for this cycle</p>)}{Object.entries(event.next.details).filter(([key, value]) => event.previous?.details[key as keyof OrderDetails] !== value).map(([key, value]) => <p className="break-words" key={key}>{detailLabels[key as keyof OrderDetails]}: {event.previous?.details[key as keyof OrderDetails] || "Not set"} → {value || "Cleared"}</p>)}</div></details></li>)}</ol></details>
      </div>}
    </>}
    {draft && <BookingDialog compact={delivering} subtitle={delivering ? [booking.customerName, booking.customerCode].filter(Boolean).join(" · ") : undefined} className="admin-theme booking-detail" title={draft.action === 'advance' ? orderActionLabel(draft.stage!) : draft.action === 'initialize' ? 'Start order tracking' : draft.action === 'reopen' ? 'Reopen order' : draft.action === 'correct' ? 'Correct stage or date' : 'Edit order details'} onClose={() => { if (!busy && !sharingBusy) setDraft(null); }}>
      <form className={delivering ? "delivery-dialog-form" : "space-y-4"} onSubmit={event => { event.preventDefault(); void save(); }}>
        <div className={delivering ? 'delivery-dialog-body space-y-4' : 'space-y-4'}><fieldset disabled={busy || sharingBusy} className="min-w-0 space-y-4">
        {draft.action === 'advance' && ['awaiting_selection', 'photos_delivered'].includes(draft.stage || '') && <OrderDeliveryPreparation ref={preparation} booking={booking} selection={draft.stage === 'awaiting_selection'} disabled={busy} onSaved={onBookingSaved} onBusyChange={setSharingBusy} />}
        {draft.action === 'advance' && order && nextOrderStages(order).length > 1 && <label className="block text-sm">Delivery method<select className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3" value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value as OrderInput['stage'] })}>{nextOrderStages(order).map(stage => <option key={stage} value={stage}>{ORDER_STAGE_LABELS[stage]}</option>)}</select></label>}
        {draft.action === 'advance' && draft.stage === 'awaiting_selection' && <p className="bd-helper">Confirm the selection photos have been shared. The order will wait for the customer's choices; the editing deadline has not started.</p>}
        {error && <AdminAlert as="span">{error} <button type="button" className="underline" disabled={busy} onClick={() => { setDraft(null); setReload(value => value + 1); }}>Reload latest order</button></AdminAlert>}
        {(draft.action === 'initialize' || (draft.action === 'details' && order && ['shoot_completed', 'awaiting_selection'].includes(order.stage))) && <><p className="bd-helper">Select the actual current stage. Earlier dates will not be filled in.</p><label className="block text-sm">Order type<select className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={draft.mode} onChange={e => setDraft({ ...draft, mode: e.target.value as 'digital' | 'physical', ...(draft.action === 'initialize' ? { stage: 'shoot_completed' as const } : {}) })}><option value="digital">Digital only</option><option value="physical">Includes physical products</option></select></label></>}
        {draft.action === 'correct' && <label className="block text-sm">What needs correcting?<select className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={draft.milestone || 'stage'} onChange={e => { const milestone = e.target.value === 'stage' ? undefined : e.target.value as OrderMilestone; setDraft({ ...draft, milestone, stage: milestone ? undefined : order!.stage }); setDate(milestone ? orderLocalInput(order!.dates[milestone]!) : ''); }}><option value="stage">Current stage</option>{Object.keys(order?.dates || {}).map(key => <option key={key} value={key}>{milestoneLabel(key)} date</option>)}</select></label>}
        {['initialize', 'reopen', 'correct'].includes(draft.action) && !draft.milestone && <label className="block text-sm">Stage<select className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value as OrderInput['stage'] })}>{choices.map(stage => <option key={stage} value={stage}>{ORDER_STAGE_LABELS[stage]}</option>)}</select></label>}
        {draft.action === 'advance' && draft.stage === 'photos_delivered' && <p className="bd-helper">Confirm that the customer has received access to the edited photos. This stops the editing deadline.</p>}
        {draft.action === 'advance' && draft.stage === 'editing' && <p className="bd-helper">Confirm the customer has selected photos for editing. This starts the five-calendar-day editing deadline.</p>}
        {draft.action === 'advance' && draft.stage === 'edited_selected' && <p className="bd-helper">Confirm the customer has selected the edited photos to print.</p>}
        {draft.action === 'advance' && draft.stage === 'printing' && <p className="bd-helper">Confirm the customer's selected edited photos have been shared with the printing house.</p>}
        {draft.action === 'advance' && draft.stage === 'received' && <p className="bd-helper">Confirm the printed products have been received at the studio.</p>}
        {draft.action === 'advance' && ['handed_over', 'shipped'].includes(draft.stage || '') && <p className="bd-helper">Record handover or courier dispatch. The order stays open until you confirm final delivery.</p>}
        {draft.action === 'advance' && draft.stage === 'delivered' && <p className="bd-helper">Confirm the customer has received everything. This completes the order.</p>}
        {draft.action === 'reopen' ? <p className="bd-helper">Reopening into Customer photos selected starts a fresh five-calendar-day deadline from now. Previous dates remain in history.</p> : draft.action !== 'details' && <label className="block text-sm">{delivering ? 'Delivery date & time · IST' : orderEventDateLabel(draft.milestone || draft.stage)}<input aria-label={orderEventDateLabel(draft.milestone || draft.stage)} type="datetime-local" className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={date} required={Boolean(draft.milestone)} onChange={e => setDate(e.target.value)} /><span className="bd-helper">{(draft.milestone || draft.stage) === 'editing' ? 'When editing actually started. The five-calendar-day deadline starts from this time. ' : 'When this step actually happened. '}Leave blank to use the time you save.</span></label>}
        {['initialize', 'details'].includes(draft.action) && <label className="block text-sm">Responsible staff<select className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" required value={draft.assigneeId || ''} onChange={e => setDraft({ ...draft, assigneeId: e.target.value })}><option value="">Choose staff</option>{order?.assigneeId && !staff.some(person => person.id === order.assigneeId) && <option value={order.assigneeId}>{order.assigneeName}</option>}{staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select>{!staff.length && <span className="bd-helper">Staff choices unavailable. Reload the booking to retry.</span>}</label>}
        {draft.action === 'details' && Object.entries(detailLabels).map(([key, label]) => <label className="block text-sm" key={key}>{label}<input type={key.endsWith('At') ? 'datetime-local' : key.endsWith('Url') ? 'url' : 'text'} className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" disabled={key === 'printingCompletedAt' && (order?.stage !== 'printing' || Boolean(order?.dates.printing_completed))} maxLength={key === 'blocker' || key.endsWith('Url') ? 1000 : key === 'nextAction' ? 500 : 200} value={key.endsWith('At') && draft.details?.[key as keyof OrderDetails] ? orderLocalInput(draft.details[key as keyof OrderDetails]!) : draft.details?.[key as keyof OrderDetails] || ''} onChange={e => setDraft({ ...draft, details: { ...draft.details, [key]: key.endsWith('At') && e.target.value ? new Date(`${e.target.value}:00+05:30`).toISOString() : e.target.value } })} />{key.endsWith('At') && <span className="bd-helper">India time{key.startsWith('expected') ? ' · Reference only, not a deadline' : ''}</span>}</label>)}
        {['correct', 'reopen'].includes(draft.action) && <label className="block text-sm">Reason (required)<textarea required maxLength={1000} className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={draft.reason || ''} onChange={e => setDraft({ ...draft, reason: e.target.value })} /></label>}
        <label className="block text-sm">Internal note (optional)<textarea maxLength={1000} className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2" value={draft.note || ''} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label>
        </fieldset></div>
        <div className={delivering ? "delivery-dialog-footer flex flex-row-reverse gap-3 border-t border-admin-border px-5 py-3" : "flex gap-3"}><button type="submit" className="bd-button bd-button-primary" disabled={busy || sharingBusy}>{busy ? 'Saving…' : delivering ? 'Confirm edited photos shared' : draft.action === 'advance' && draft.stage === 'awaiting_selection' ? 'Confirm photos shared' : draft.action === 'advance' ? orderActionLabel(draft.stage!) : 'Save update'}</button><button type="button" className="bd-button" disabled={busy || sharingBusy} onClick={() => setDraft(null)}>Cancel</button></div>
      </form>
    </BookingDialog>}
  </BookingSection>;
});
