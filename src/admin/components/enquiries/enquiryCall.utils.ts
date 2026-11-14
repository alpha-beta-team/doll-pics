import type { EnquiryCallOutcome } from '../../types';

export const CALL_OUTCOME_LABELS: Record<EnquiryCallOutcome, string> = {
  no_answer: 'No answer', interested: 'Interested', quotation_needed: 'Quotation needed', not_interested: 'Not interested',
};
export const callTimeLabel = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

