import { useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import type { BookingDeliverable, DeliverableConfiguration } from '../../shared/deliverables';
import { applyDeliverableConfiguration, configurationDeliverables } from '../../shared/deliverables';

export function DeliverablePresetPicker({ configuration, rows, onApply, record = false }: {
  record?: boolean;
  configuration: DeliverableConfiguration;
  rows: BookingDeliverable[];
  onApply: (rows: BookingDeliverable[]) => void;
}) {
  const [seasonalId, setSeasonalId] = useState('');
  const effectiveId = configuration.seasonal.some(item => item.id === seasonalId && item.active) ? seasonalId : '';
  const preview = configurationDeliverables(configuration, effectiveId);

  return <section className="rounded-lg border border-admin-border bg-admin-canvas px-3 py-2.5" aria-label="Deliverable package selection">
    {record && <h3 className="mb-2 font-semibold">Start from a package</h3>}
    <div className="flex items-center gap-2">
      <Layers size={16} className="hidden shrink-0 text-admin-subtle sm:block" aria-hidden="true" />
      <label className="min-w-0 flex-1"><span className="sr-only">Deliverable list</span>
        <select aria-label="Deliverable list" className="min-h-10 w-full rounded-md border border-admin-border bg-white px-2 text-xs font-medium text-admin-text focus-visible:outline-admin-primary" value={effectiveId} onChange={event => {
          const selectedId = event.target.value;
          setSeasonalId(selectedId);
          if (!record) onApply(applyDeliverableConfiguration(configuration, selectedId, rows));
        }}>
          <option value="">Base Package</option>
          {configuration.seasonal.filter(item => item.active).map(item => <option key={item.id} value={item.id}>Base + {item.name}</option>)}
        </select>
      </label>
      <button type="button" aria-label="Apply selected list" className="min-h-10 shrink-0 rounded-md border border-admin-border bg-white px-3 text-xs font-semibold text-admin-primary hover:bg-admin-muted focus-visible:outline-admin-primary" onClick={() => onApply(applyDeliverableConfiguration(configuration, effectiveId, rows))}>Apply</button>
    </div>
    <p className="mt-2 text-xs text-admin-subtle">{record ? 'Apply to update the draft. Paid extras and manual gifts stay. Save deliverables to keep your changes.' : 'Selecting a list updates the items below. Save the booking or deliverables to keep your changes.'}</p>
    <details className="group mt-1.5 text-[11px] text-admin-subtle">
      <summary className="flex min-h-6 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden"><ChevronDown size={12} className="transition-transform group-open:rotate-180" aria-hidden="true" />Preview · {preview.length} {preview.length === 1 ? 'item' : 'items'}</summary>
      <ul className="mt-1 flex flex-wrap gap-1.5">{preview.map(row => <li key={row.id} className="rounded border border-admin-border bg-white px-2 py-1">{row.name}{record && row.specifications && ` · ${row.specifications}`} × {row.quantity}{record && row.category === 'included' && ' · Included'}{row.category === 'complimentary' ? ' · Gift' : ''}</li>)}</ul>
      {!preview.length && <p className="mt-1">No items configured in this list.</p>}
      <p className="mt-2 leading-relaxed">Changing the list or clicking Apply replaces included items and seasonal additions. Paid extras and manual gifts stay.</p>
    </details>
  </section>;
}
