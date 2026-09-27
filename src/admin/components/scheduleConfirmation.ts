import type { ScheduleConflictResponse } from '../types';
import type { ConfirmDialogOptions } from '../hooks/useConfirmDialog';
import { ApiError } from '../api/http';
import { formatScheduleTime } from '../pages/schedule.utils';

export type ScheduleAcknowledgement = {
  acknowledgeTimedConflict?: boolean;
  acknowledgeUntimedConflict?: boolean;
};

export function conflictRequirements(conflicts: ScheduleConflictResponse | null): ScheduleAcknowledgement {
  return {
    acknowledgeTimedConflict: Boolean(conflicts?.requiresTimedConfirmation || conflicts?.timedConflicts.length),
    acknowledgeUntimedConflict: Boolean(conflicts?.requiresUntimedConfirmation || conflicts?.untimedConflicts.length),
  };
}

export function scheduleConfirmationOptions(conflicts: ScheduleConflictResponse, restoring = false): ConfirmDialogOptions {
  const timed = conflicts.timedConflicts.map(item => `${item.customerName}: ${formatScheduleTime(item.startTime)}–${formatScheduleTime(item.endTime)}`);
  const untimed = conflicts.untimedConflicts.map(item => `${item.customerName}: time not set`);
  return {
    title: timed.length ? 'This time has existing bookings' : 'Another booking has no time',
    description: [...timed, ...untimed, 'Would you like to proceed with this booking?'].join('\n'),
    confirmLabel: restoring ? 'Restore with overlap' : 'Proceed with overlap',
    cancelLabel: restoring ? 'Keep cancelled' : 'Change time',
  };
}

export function scheduleConflictsFromError(error: unknown): ScheduleConflictResponse | null {
  if (!(error instanceof ApiError) || !['TIMED_BOOKING_CONFLICT', 'UNTIMED_CONFIRMATION_REQUIRED'].includes(error.code || '')) return null;
  const body = error.body;
  if (!Array.isArray(body.timedConflicts) || !Array.isArray(body.untimedConflicts)) return null;
  return {
    timedConflicts: body.timedConflicts,
    untimedConflicts: body.untimedConflicts,
    blocked: Boolean(body.blocked),
    requiresTimedConfirmation: Boolean(body.requiresTimedConfirmation || body.timedConflicts.length),
    requiresUntimedConfirmation: Boolean(body.requiresUntimedConfirmation || body.untimedConflicts.length),
  };
}

/** Retry only a rejected write, never a successful write or a network failure. */
export async function saveWithScheduleConfirmation<T>(
  save: (acknowledgement: ScheduleAcknowledgement) => Promise<T>,
  acknowledge: (conflicts: ScheduleConflictResponse) => Promise<ScheduleAcknowledgement | null>,
  initial: ScheduleAcknowledgement = {},
): Promise<{ saved: true; value: T } | { saved: false }> {
  let accepted = initial;
  for (;;) {
    try { return { saved: true, value: await save(accepted) }; }
    catch (error) {
      const conflicts = scheduleConflictsFromError(error);
      if (!conflicts) throw error;
      const required = conflictRequirements(conflicts);
      // An old server may reject even acknowledged overlaps. Do not loop or bypass it.
      if ((!required.acknowledgeTimedConflict || accepted.acknowledgeTimedConflict)
        && (!required.acknowledgeUntimedConflict || accepted.acknowledgeUntimedConflict)) throw error;
      const next = await acknowledge(conflicts);
      if (!next) return { saved: false };
      accepted = { ...accepted, ...next };
    }
  }
}
