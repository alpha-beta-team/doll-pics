import type { EnquirySource } from '../types';

export const LEAD_SOURCE_OPTIONS: ReadonlyArray<{ value: EnquirySource; label: string }> = [
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google_business', label: 'Google Business' },
  { value: 'ads', label: 'Ads' },
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'diary_import', label: 'Diary import' },
];

export function leadSourceLabel(source: EnquirySource | '' | undefined) {
  if (!source) return 'Not recorded';
  return LEAD_SOURCE_OPTIONS.find(option => option.value === source)?.label
    ?? source.replace(/_/g, ' ');
}
