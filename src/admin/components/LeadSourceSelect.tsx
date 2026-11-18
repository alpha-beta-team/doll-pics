import { useId } from 'react';
import { Select } from '../../components/ui/Select';
import type { EnquirySource } from '../types';
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from './leadSource';

type LeadSourceValue = EnquirySource | '';

export function LeadSourceSelect({
  value,
  onChange,
  allowUnrecorded = false,
  labelClassName = 'font-medium',
}: {
  value: LeadSourceValue;
  onChange: (value: LeadSourceValue) => void;
  allowUnrecorded?: boolean;
  labelClassName?: string;
}) {
  const id = useId();
  const options = allowUnrecorded
    ? [{ value: '' as const, label: 'Not recorded' }, ...LEAD_SOURCE_OPTIONS]
    : LEAD_SOURCE_OPTIONS;

  return (
    <div className={`text-sm text-slate-700 ${labelClassName}`}>
      <label htmlFor={id}>Came from</label>
      <Select
        id={id}
        className="mt-1"
        value={value}
        onChange={next => onChange(next as LeadSourceValue)}
        options={options}
        placeholder={leadSourceLabel(value)}
      />
    </div>
  );
}
