import { createRoot } from 'react-dom/client';
import { OrderWorkflowPanel } from '../../../src/admin/components/bookings/OrderWorkflowPanel';
import { orderWorkflowApi } from '../../../src/admin/api/orderWorkflow';
import { mapBooking } from '../../../src/admin/api/mappers';
import { nextOrderStages, type OrderWorkflow } from '../../../src/shared/orderWorkflow';
import '../../../src/index.css';
import '../../../src/admin/pages/booking-detail.css';
let order: OrderWorkflow = { stage: 'shoot_completed', state: 'active', mode: 'physical', enteredAt: new Date().toISOString(), dates: {}, revision: 1, history: [], assigneeId: 'staff', assigneeName: 'Anitha', details: { nextAction: 'Confirm customer photo selection' } };
const scenario = new URLSearchParams(location.search).get('scenario');
if (scenario) {
  order.stage = scenario === 'digital' ? 'photos_delivered' : 'editing';
  order.mode = scenario === 'digital' ? 'digital' : 'physical';
  order.state = scenario === 'digital' ? 'completed' : 'active';
  order.dates = { shoot_completed: '2026-11-10T04:30:00Z', editing: '2026-11-11T04:30:00Z', ...(scenario === 'digital' ? { photos_delivered: '2026-11-14T04:30:00Z' } : {}) };
  order.details = { expectedDeliveryAt: '2026-11-20T04:30:00Z' };
  order.history = [{ id: 'history', action: 'reopen', actor: { id: 'staff', name: 'Anitha' }, occurredAt: '2026-11-15T04:30:00Z', recordedAt: '2026-11-15T05:30:00Z', reason: 'Customer requested a correction', note: '', previous: { ...order, stage: 'delivered', state: 'completed', dates: { delivered: '2026-11-14T04:30:00Z' } }, next: { ...order } }];
}
orderWorkflowApi.get = async () => ({ orderWorkflow: structuredClone(order) });
orderWorkflowApi.update = async (_id, input) => {
  if (input.revision !== order.revision) throw new Error('Reload before saving');
  if (input.action === 'advance') {
    if (!nextOrderStages(order).includes(input.stage!)) throw new Error('Invalid next stage');
    order = { ...order, stage: input.stage!, enteredAt: new Date().toISOString(), revision: order.revision + 1 };
    order.dates[order.stage] = order.enteredAt;
    if (order.stage === 'delivered') order.state = 'completed';
    if (order.stage === 'editing') order.editingDueAt = new Date(Date.now() + 5 * 86400000).toISOString();
  }
  return { orderWorkflow: structuredClone(order) };
};
const readOnly = new URLSearchParams(location.search).has('readonly');
createRoot(document.getElementById('root')!).render(<main className="admin-theme booking-detail min-h-screen bg-admin-bg p-4 text-admin-text"><div className="mx-auto max-w-4xl"><h1 className="mb-5 text-xl font-semibold">Booking · Studio session</h1><OrderWorkflowPanel booking={mapBooking({ _id: 'booking', status: 'shoot_completed', customerName: 'Customer' })} canManage={!readOnly} staff={[{ id: 'staff', name: 'Anitha', jobTitle: 'Studio staff' }]} onSaved={() => {}} /></div></main>);
