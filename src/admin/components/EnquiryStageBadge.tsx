import type { EnquiryStage } from '../types';

export function EnquiryStageBadge({ stage }: { stage: EnquiryStage }) {
  const styles: Record<EnquiryStage, string> = {
    new: 'bg-blue-50 text-blue-700',
    contacted: 'bg-slate-100 text-slate-700',
    follow_up: 'bg-amber-50 text-amber-700',
    booked: 'bg-emerald-50 text-emerald-700',
    closed_lost: 'bg-rose-50 text-rose-700',
  };
  const labels: Record<EnquiryStage, string> = {
    new: 'New',
    contacted: 'Contacted',
    follow_up: 'Follow-up',
    booked: 'Booked',
    closed_lost: 'Not interested',
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[stage]}`}>{labels[stage]}</span>;
}
