import test from 'node:test';
import assert from 'node:assert/strict';
import { queueFor, exclusion, bulkInput, isOverdue, type TrackingRow } from '../src/admin/components/postShootTracking';
const row = (stage = 'printing', state = 'active', mode = 'physical'): TrackingRow => ({ id: 'order', customerName: 'Customer', customerPhone: '', customerCode: '', reference: 'ref', bookingDate: '2026-11-17', status: 'delivered', order: { stage, state, mode, revision: 3, enteredAt: '', dates: {}, details: { printingReference: 'keep', customerTracking: 'keep' }, assigneeId: 'staff', assigneeName: 'Staff' } } as TrackingRow);
test('queues respect completion, digital, reopened and legacy state rather than booking delivered', () => {
  assert.equal(queueFor(row('photos_delivered')), 'print_selection');
  assert.equal(queueFor(row('photos_delivered', 'completed', 'digital')), 'delivered');
  assert.equal(queueFor(row('editing')), 'editing');
  assert.equal(queueFor(row('handed_over')), 'receipt');
  assert.equal(queueFor(row('shipped')), 'receipt');
  assert.equal(queueFor(row('collected', 'completed')), 'delivered');
  assert.equal(queueFor(row('preparing_print')), 'print_selection');
  assert.equal(queueFor(row('in_transit')), 'prints');
  assert.equal(queueFor(row('ready_dispatch')), 'handover');
  assert.equal(queueFor({ ...row(), order: null }), 'setup');
});
test('incompatible batches exclude earlier stages, completed, cancelled and uninitialized orders', () => {
  assert.equal(exclusion(row(), 'received'), '');
  assert.match(exclusion(row('received'), 'received'), /not the next step/);
  assert.match(exclusion(row('photos_delivered', 'completed', 'digital'), 'printing'), /complete/);
  assert.match(exclusion(row('printing', 'cancelled'), 'assign'), /cancelled/);
  assert.match(exclusion({ ...row(), order: null }, 'assign'), /Initialize/);
  assert.equal(exclusion(row('delivered', 'completed'), 'assign'), '');
});
test('updates preserve unrelated order details and assignment; timestamps explicitly use IST', () => {
  const input = bulkInput(row(), 'received', 'request', { assigneeId: 'new-staff', date: '2026-11-17T10:00', note: 'Received' });
  assert.deepEqual(input, { requestId: 'request', revision: 3, action: 'advance', stage: 'received', occurredAt: '2026-11-17T04:30:00.000Z', note: 'Received' });
  assert.deepEqual(bulkInput(row(), 'assign', 'request', { assigneeId: 'new-staff', date: '', note: '' }), { requestId: 'request', revision: 3, action: 'details', assigneeId: 'new-staff' });
});
test('only active editing has an overdue deadline, including reopened cycles', () => {
  const current = row('editing'); current.order!.editingDueAt = '2026-11-16T04:30:00Z';
  assert.equal(isOverdue(current, Date.parse('2026-11-17T04:30:00Z')), true);
  current.order!.stage = 'photos_delivered'; assert.equal(isOverdue(current), false);
  current.order!.stage = 'editing'; current.order!.state = 'completed'; assert.equal(isOverdue(current), false);
});

test('row actions follow valid workflow transitions, including courier, legacy and closed orders', async () => {
  const { trackingActions } = await import('../src/admin/components/postShootTracking');
  const { nextOrderStages, ORDER_STAGES } = await import('../src/shared/orderWorkflow');
  for (const stage of [...ORDER_STAGES, 'preparing_print', 'in_transit', 'ready_dispatch'] as const) {
    const current = row(stage);
    assert.deepEqual(trackingActions(current).map(action => action.stage), nextOrderStages(current.order!));
  }
  assert.deepEqual(trackingActions(row('received')).map(action => action.stage), ['handed_over', 'shipped']);
  assert.deepEqual(trackingActions(row('photos_delivered', 'completed', 'digital')), []);
  assert.deepEqual(trackingActions(row('printing', 'cancelled')), []);
  assert.deepEqual(trackingActions({ ...row(), status: 'cancelled', order: null }), []);
  assert.deepEqual(trackingActions({ ...row(), order: null }), [{ label: 'Start tracking' }]);
});

test('printing completion remains a milestone and dates use the IST calendar boundary', async () => {
  const { subForRow, tabForQueue, shootAge } = await import('../src/admin/components/trackingStages');
  const printing = row('printing');
  printing.order!.dates.printing_completed = '2026-11-18T04:30:00Z';
  assert.equal(subForRow(printing), 'printer_finished');
  assert.equal(tabForQueue(queueFor(printing)).label, 'Printing');
  printing.order!.stage = 'received';
  assert.equal(subForRow(printing), 'handover');
  assert.equal(shootAge('2026-11-20', Date.parse('2026-11-19T18:29:59Z')).label, 'In 1 day');
  assert.equal(shootAge('2026-11-20', Date.parse('2026-11-19T18:30:00Z')).label, 'Shot today');
});
