import { queueFor, isOverdue, type TrackingRow, type TrackingFilters, type TrackingResult, type Queue } from '../../../src/admin/components/postShootTracking';
import type { OrderStage } from '../../../src/shared/orderWorkflow';

// Isolated browser-test responses, never loaded by the admin application.
export const createTrackingFixtureRows = (): TrackingRow[] => Array.from({ length: 30 }, (_, index) => ({
  id: `order-${index}`, customerName: ['Aadhira Kumar', 'Arjun Ravi', 'Nila Suresh', 'Vihaan Raj'][index % 4] + ` ${index + 1}`, customerPhone: '9876543210', customerCode: `DP-${100 + index}`, reference: `BK-2026-${100 + index}`, shootType: index === 29 ? '' : ['Maternity', 'Newborn', 'Family Portrait'][index % 3], bookingDate: '2026-11-12', status: 'delivered',
  order: { stage: index < 26 ? 'printing' : index === 26 ? 'received' : index === 27 ? 'editing' : 'photos_delivered', state: index === 29 ? 'completed' : 'active', mode: index === 29 ? 'digital' : 'physical', revision: 1, enteredAt: '2026-11-12T04:30:00Z', editingDueAt: '2026-11-14T04:30:00Z', dates: { shoot_completed: '2026-11-10T04:30:00Z' }, assigneeId: index % 2 ? 'staff' : 'editor', assigneeName: index % 2 ? 'Anitha' : 'Priya', details: {} },
}));

export function createStageFixtureRows(): TrackingRow[] {
  const stages: Array<OrderStage | null> = ['shoot_completed', 'awaiting_selection', 'editing', 'photos_delivered', 'edited_selected', 'printing', 'received', 'handed_over', 'shipped', null, 'editing'];
  const base = createTrackingFixtureRows()[0];
  return stages.map((stage, index) => ({
    ...structuredClone(base), id: `stage-order-${index}`, customerName: `Stage customer ${index + 1}`, customerCode: `STAGE-${100 + index}`,
    order: stage ? { ...structuredClone(base.order!), stage, editingDueAt: index === 10 ? '2099-11-14T04:30:00Z' : '2026-11-14T04:30:00Z' } : null,
  }));
}

export function trackingFixtureResult(rows: TrackingRow[], filters: TrackingFilters, now = Date.now()): TrackingResult {
  const searched = rows.filter(row =>
    (!filters.search || [row.customerName, row.customerPhone, row.customerCode, row.reference].join(' ').toLowerCase().includes(filters.search.toLowerCase()))
    && (!filters.from || row.bookingDate >= filters.from) && (!filters.to || row.bookingDate <= filters.to));
  const stages: Partial<Record<Queue, number>> = {};
  searched.forEach(row => { const key = queueFor(row); stages[key] = (stages[key] || 0) + 1; });
  stages.edited = stages.editing || 0;
  const stageRows = searched.filter(row => !filters.stage || queueFor(row) === (filters.stage === 'edited' ? 'editing' : filters.stage));
  return {
    rows: filters.scope === 'overdue' ? stageRows.filter(row => isOverdue(row, now)) : stageRows,
    counts: { all: searched.length, stages, stage: stageRows.length, overdue: stageRows.filter(row => isOverdue(row, now)).length },
  };
}
