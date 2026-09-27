import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ScheduleConflictResponse } from '../types';
import { bookingTimeWindowError } from '../../shared/bookingTime';
import { useConfirmDialog } from './useConfirmDialog';
import { conflictRequirements, scheduleConfirmationOptions, type ScheduleAcknowledgement } from '../components/scheduleConfirmation';

export type ScheduleAvailability = {
  conflicts: ScheduleConflictResponse | null;
  checking: boolean;
  error: string;
  retry: () => void;
};

export function useScheduleAvailability(bookingDate: string, startTime: string, endTime: string, excludeBookingId?: string, enabled = true): ScheduleAvailability {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([bookingDate, startTime, endTime, excludeBookingId, revision]);
  const valid = enabled && Boolean(bookingDate && startTime && endTime) && !bookingTimeWindowError(bookingDate, startTime, endTime);
  const [result, setResult] = useState<{ key: string; conflicts: ScheduleConflictResponse | null; error: string } | null>(null);
  useEffect(() => {
    if (!valid) return;
    setResult(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void api.checkScheduleConflicts({ bookingDate, startTime, endTime, excludeBookingId }, controller.signal)
        .then(conflicts => { if (!controller.signal.aborted) setResult({ key, conflicts, error: '' }); })
        .catch(error => { if (!controller.signal.aborted) setResult({ key, conflicts: null, error: error instanceof Error ? error.message : 'Could not check schedule availability.' }); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bookingDate, startTime, endTime, excludeBookingId, key, valid]);
  return {
    conflicts: valid && result?.key === key ? result.conflicts : null,
    checking: valid && result?.key !== key,
    error: valid && result?.key === key ? result.error : '',
    retry: () => setRevision(value => value + 1),
  };
}

export function useScheduleConfirmation(scheduleKey: string, restoring = false) {
  const confirm = useConfirmDialog();
  const latestKey = useRef(scheduleKey);
  latestKey.current = scheduleKey;
  const accepted = useRef<{ key: string; signature: string; flags: ScheduleAcknowledgement } | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Returning to a previously chosen time must also require a fresh acknowledgement.
  if (accepted.current?.key !== scheduleKey) accepted.current = null;
  return async (conflicts: ScheduleConflictResponse | null): Promise<ScheduleAcknowledgement | null> => {
    const flags = conflictRequirements(conflicts);
    if (!conflicts || (!flags.acknowledgeTimedConflict && !flags.acknowledgeUntimedConflict)) {
      // Keep consent from a save-time conflict across network retries of this window.
      return accepted.current?.key === scheduleKey ? accepted.current.flags : {};
    }
    const signature = JSON.stringify([conflicts.timedConflicts, conflicts.untimedConflicts]);
    if (accepted.current?.key === scheduleKey && accepted.current.signature === signature) return accepted.current.flags;
    const proceed = await confirm(scheduleConfirmationOptions(conflicts, restoring));
    if (!proceed || !mounted.current || latestKey.current !== scheduleKey) return null;
    accepted.current = { key: scheduleKey, signature, flags };
    return flags;
  };
}
