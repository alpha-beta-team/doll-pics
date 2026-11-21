import { useEffect, useRef, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { milestoneLabel, orderDate, type OrderMilestone, type OrderWorkflow } from '../../../shared/orderWorkflow';

const phases: { name: string; description: string; milestones: OrderMilestone[] }[] = [
  { name: 'Shoot', description: 'Your studio session', milestones: ['shoot_completed'] },
  { name: 'Photo Selection', description: 'Choose your favourite photos', milestones: ['awaiting_selection', 'editing', 'selection_completed'] },
  { name: 'Editing', description: 'Retouching and edited photo approval', milestones: ['photos_delivered', 'edited_selected'] },
  { name: 'Printing', description: 'From the printer to our studio', milestones: ['preparing_print', 'printing', 'printing_completed', 'in_transit', 'received'] },
  { name: 'Delivery', description: 'Handover and confirmed receipt', milestones: ['ready_dispatch', 'handed_over', 'shipped', 'delivered', 'collected'] },
];
const headlines: Record<OrderWorkflow['stage'], string> = {
  shoot_completed: 'Your shoot is complete', awaiting_selection: 'Waiting for your photo selection',
  editing: 'Your photos are being edited', photos_delivered: 'Your edited photos have been shared',
  edited_selected: 'Your photos are ready for printing', preparing_print: 'Preparing your photos for printing',
  printing: 'Sent for printing', in_transit: 'Your prints are on their way to the studio', received: 'Your prints are ready for handover',
  ready_dispatch: 'Your order is ready for dispatch', shipped: 'Your order is on its way',
  handed_over: 'Handed over · awaiting delivery confirmation', delivered: 'Delivered', collected: 'Collected',
};
export function OrderJourney({ order, actions }: { order: OrderWorkflow; actions: ReactNode }) {
  const trackRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    const current = track?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!track || !current || track.scrollWidth <= track.clientWidth) return;
    track.scrollLeft += current.getBoundingClientRect().left - track.getBoundingClientRect().left - (track.clientWidth - current.offsetWidth) / 2;
  }, [order.stage, order.state]);
  const digital = order.mode === 'digital';
  const complete = order.state === 'completed';
  const cancelled = order.state === 'cancelled';
  const current = ['shoot_completed', 'awaiting_selection'].includes(order.stage) ? 1
    : ['editing', 'photos_delivered', 'preparing_print'].includes(order.stage) ? 2
    : ['edited_selected', 'printing', 'in_transit'].includes(order.stage) ? 3 : 4;
  const deliveredAt = digital ? order.dates.photos_delivered : order.dates.delivered || order.dates.collected;
  const estimate = order.details.expectedDeliveryAt
    ? { label: 'Estimated delivery', at: order.details.expectedDeliveryAt }
    : current === 3 && (order.details.expectedStudioAt || order.details.expectedPrintAt)
      ? { label: order.details.expectedStudioAt ? 'Estimated studio arrival' : 'Estimated printing completion', at: order.details.expectedStudioAt || order.details.expectedPrintAt }
      : current === 4 && order.details.expectedDispatchAt ? { label: 'Estimated dispatch', at: order.details.expectedDispatchAt } : undefined;
  const due = !complete && !cancelled && order.stage === 'editing' ? order.editingDueAt : undefined;
  return <div className="order-journey">
    <div className="order-journey-hero">
      <div className="order-journey-summary">
        <div className="order-journey-heading"><h3>{cancelled ? 'Order cancelled' : complete ? digital ? 'Your digital photos are delivered' : headlines[order.stage] : headlines[order.stage]}</h3><span className="order-journey-eyebrow">{cancelled ? 'Cancelled' : complete ? 'Order complete' : 'In progress'} · {digital ? 'Digital only' : 'Photos & printed products'}</span></div>
      {complete ? <p>{deliveredAt ? `Delivered on ${orderDate(deliveredAt)} IST` : 'Completion date not recorded'} · {digital ? 'Edited photos shared with the customer.' : 'Customer receipt confirmed.'}</p>
        : !cancelled && <>{estimate && <p>{estimate.label} · {orderDate(estimate.at)} IST</p>}{due && <p className={new Date(due).getTime() < Date.now() ? 'order-journey-overdue' : ''}>{new Date(due).getTime() < Date.now() ? 'Editing overdue · due' : 'Editing due'} {orderDate(due)} IST</p>}{!estimate && !due && <p>Completion estimate not set</p>}</>}
      </div>
      <p className="order-journey-owner">Responsible: <strong>{order.assigneeName || 'Not assigned'}</strong></p>
    </div>
    <ol ref={trackRef} className="order-journey-track" aria-label="Order progress">
      {phases.filter(phase => !digital || phase.name !== 'Printing').map(phase => {
        const index = phases.indexOf(phase);
        const status = complete ? 'completed' : index < current ? 'completed' : index === current && !cancelled ? 'current' : 'upcoming';
        const milestones = digital && phase.name === 'Delivery' ? ['photos_delivered' as const] : digital && phase.name === 'Editing' ? [] : phase.milestones;
        const dates = milestones.map(key => ({ key, at: order.dates[key] })).filter(row => row.at);
        const last = dates[dates.length - 1];
        return <li key={phase.name} className={`order-journey-phase is-${status}`} aria-current={status === 'current' ? 'step' : undefined}>
          <details>
            <summary>
              <span className="order-journey-dot" aria-hidden="true">{status === 'completed' ? <Check size={17} strokeWidth={3} /> : <span />}</span>
              <span className="order-journey-phase-content"><strong>{phase.name}</strong><span className="order-journey-state">{status === 'completed' ? 'Completed' : status === 'current' ? 'Current phase' : cancelled ? 'Not completed' : 'Upcoming'}</span><span>{digital && phase.name === 'Delivery' ? 'Edited photos shared digitally' : phase.description}</span>{(last || status === 'current') && <span className="order-journey-date">{last ? orderDate(last.at) : `Stage updated ${orderDate(order.enteredAt)}`} IST</span>}<span className="order-journey-expand">Milestones <ChevronDown size={13} /></span></span>
            </summary>
            <ul className="order-journey-milestones">{milestones.length ? milestones.map(key => <li key={key}><strong>{milestoneLabel(key)}</strong><span>{order.dates[key] ? `${orderDate(order.dates[key])} IST` : 'Not recorded'}</span></li>) : <li>Editing completion is recorded when edited photos are shared in Delivery.</li>}</ul>
          </details>
          {status === 'current' && <div className="order-journey-actions">{actions}</div>}
        </li>;
      })}
    </ol>
    {order.state === 'active' && (order.details.nextAction || order.details.blocker) && <div className="order-journey-notes">{order.details.nextAction && <p><strong>Staff note:</strong> {order.details.nextAction}</p>}{order.details.blocker && <p><strong>Blocked by:</strong> {order.details.blocker}</p>}</div>}
  </div>;
}
