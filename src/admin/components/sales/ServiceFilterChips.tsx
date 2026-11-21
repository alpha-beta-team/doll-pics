import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import type { ServiceCategoryOption } from './serviceCategories';

export function ServiceFilterChips({ services, service, onService, limit, className }: {
  services: ServiceCategoryOption[];
  service: string;
  onService: (value: string) => void;
  limit: number;
  className: string;
}) {
  const options = services.filter((s) => !s.value || s.count || s.value === service)
    .sort((left, right) => Number(!right.value) - Number(!left.value) || right.count - left.count);
  const primary = options.slice(0, limit);
  const selected = options.find((s) => s.value === service);
  if (selected && !primary.includes(selected)) primary[primary.length - 1] = selected;
  const overflow = options.filter((s) => !primary.includes(s));
  const serviceChip = (s: ServiceCategoryOption, close?: () => void) => (
    <button
      key={s.value}
      className="bl-chip"
      aria-pressed={service === s.value}
      onClick={() => {
        onService(s.value);
        close?.();
      }}
    >
      {s.label}
      <small>{s.count}</small>
    </button>
  );
  return (
      <div className={className} role="group" aria-label="Filter by service">
        {primary.map((s) => serviceChip(s))}
        {overflow.length > 0 && (
          <Popover>
            <PopoverButton className="bl-chip">
              +{overflow.length} more <ChevronDown size={14} />
            </PopoverButton>
            <PopoverPanel anchor={{ to: 'bottom end', gap: 6, padding: 12 }} focus className="service-overflow bl-more">
              {({ close }) => <>{overflow.map((s) => serviceChip(s, close))}</>}
            </PopoverPanel>
          </Popover>
        )}
      </div>
  );
}
