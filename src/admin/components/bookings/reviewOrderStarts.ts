import {
  defaultOrderMode,
  supportsOrderStage,
  type OrderInput,
  type OrderStage,
} from '../../../shared/orderWorkflow';
import { api } from '../../api/client';
import { orderWorkflowApi } from '../../api/orderWorkflow';
import type { TrackingRow } from '../postShootTracking';

export interface StartReview {
  reason?: string;
  ownerName?: string;
  input?: OrderInput;
}

export async function reviewOrderStarts(
  rows: TrackingRow[],
  fields: {
    mode: '' | 'digital' | 'physical';
    stage: OrderStage;
    assigneeId: string;
    date: string;
    note: string;
  },
) {
  const reviews = new Map<string, StartReview>();
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  async function review(row: TrackingRow): Promise<StartReview> {
    if (row.order) return { reason: 'Tracking already started.' };
    if (row.bookingDate > today) return { reason: 'Shoot is in the future.' };
    try {
      const [booking, workflow] = await Promise.all([api.getBooking(row.id), orderWorkflowApi.get(row.id)]);
      if (!booking) return { reason: 'Booking unavailable.' };
      if (workflow.orderWorkflow) return { reason: 'Tracking already started.' };
      if (booking.bookingDate > today) return { reason: 'Shoot is in the future.' };
      if (!['shoot_completed', 'delivered'].includes(booking.status)) return { reason: 'Shoot is not completed.' };
      const mode = fields.mode || defaultOrderMode(booking.deliverables);
      if (!supportsOrderStage(mode, fields.stage))
        return { reason: 'Digital orders finish at edited-photo delivery.' };
      const assigneeId = fields.assigneeId || booking.assignedStaffAccountId;
      if (!assigneeId) return { reason: 'Choose responsible staff for this booking.' };
      return {
        ownerName: booking.assignedStaffAccountName,
        input: {
          action: 'initialize',
          revision: 0,
          requestId: crypto.randomUUID(),
          stage: fields.stage,
          mode,
          assigneeId,
          ...(fields.date && { occurredAt: new Date(fields.date + ':00+05:30').toISOString() }),
          ...(fields.note && { note: fields.note }),
        },
      };
    } catch (error) {
      return { reason: error instanceof Error ? error.message : 'Could not load booking details.' };
    }
  }
  for (let offset = 0; offset < rows.length; offset += 4) {
    await Promise.all(rows.slice(offset, offset + 4).map(async (row) => reviews.set(row.id, await review(row))));
  }
  return reviews;
}
