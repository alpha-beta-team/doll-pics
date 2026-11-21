import { FormInput, FormSelect } from './ui/FormControls';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { BookingDeliverable, DeliverableType } from '../../shared/deliverables';
import { deliverableExtraTotal } from '../../shared/deliverables';

type Props = {
  catalog: DeliverableType[];
  rows: BookingDeliverable[];
  onChange: (rows: BookingDeliverable[]) => void;
  canPrice?: boolean;
  showExtrasTotal?: boolean;
};

export function DeliverablesEditor({ catalog, rows, onChange, canPrice = true, showExtrasTotal = true }: Props) {
  const [selected, setSelected] = useState('');
  const update = (id: string, change: Partial<BookingDeliverable>) => onChange(rows.map(row => row.id === id ? { ...row, ...change } : row));
  const extras = deliverableExtraTotal(rows);

  return <section className={`deliverables-editor ${canPrice ? '' : 'de-no-pricing'}`} aria-label="Deliverables editor">
    <div className="de-heading">
      <h3>Deliverables <span className="de-count">{rows.length}</span></h3>
      <span className="de-heading-note">Items promised to the customer</span>
    </div>
    <div className="de-list">
      {rows.length > 0 && <div className="de-columns" aria-hidden="true"><span>Item</span><span>Qty</span><span>Inclusion</span>{canPrice && <span>Total (₹)</span>}<span /></div>}
      {rows.map(row => {
        const unavailable = !catalog.some(type => type.id === row.catalogId && type.active);
        return <article key={row.id} className="de-row" aria-label={row.name}>
          <div className="de-row-main">
            <div className="de-item">
              <p className="de-item-name">{row.name}</p>
              {(row.specifications || unavailable) && <p className="de-item-detail">{row.specifications}{unavailable ? `${row.specifications ? ' · ' : ''}Archived item` : ''}</p>}
            </div>
            <label className="de-quantity"><span className="de-field-label">Qty</span>
              <FormInput className="de-control" aria-label={`Quantity (${row.unit})`} title={row.unit} type="number" min="1" step="1" value={row.quantity || ''} onChange={event => update(row.id, { quantity: Number(event.target.value) })} />
            </label>
            <label className="de-inclusion"><span className="de-field-label">Inclusion</span>
              <FormSelect className="de-control" aria-label="Inclusion" value={row.category} disabled={!canPrice && row.category === 'extra'} onChange={event => update(row.id, { category: event.target.value as BookingDeliverable['category'], amount: 0 })}>
                <option value="included">Included</option>{(canPrice || row.category === 'extra') && <option value="extra">Paid extra</option>}<option value="complimentary">Complimentary</option>
              </FormSelect>
            </label>
            {canPrice && <div className={`de-amount ${row.category === 'extra' ? 'de-amount-editable' : ''}`}>
              {row.category === 'extra' ? <label><span className="de-field-label">Total (₹)</span><FormInput className="de-control" aria-label="Extra total (₹)" title="Total for this item, across all quantities" type="number" min="0" step="0.01" value={row.amount} onChange={event => update(row.id, { amount: Number(event.target.value) })} /></label> : <span className="de-included-amount" aria-label="No extra charge">—</span>}
            </div>}
            <button type="button" className="de-remove" aria-label={`Remove ${row.name}`} title={`Remove ${row.name}`} disabled={!canPrice && row.category === 'extra'} onClick={() => onChange(rows.filter(item => item.id !== row.id))}><X size={16} aria-hidden="true" /></button>
          </div>
          {row.category === 'complimentary' && <label className="de-reason"><span>Offer or reason</span><FormInput className="de-control" aria-label="Offer or reason" maxLength={500} value={row.reason || ''} placeholder="Seasonal offer or customer gift" onChange={event => update(row.id, { reason: event.target.value })} required /></label>}
        </article>;
      })}
      {!rows.length && <p className="de-empty">No items yet. Apply a package or add an item below.</p>}
      <div className="de-add">
        <FormSelect aria-label="Deliverable to add" className="de-control" value={selected} onChange={event => setSelected(event.target.value)}>
          <option value="">Add another item…</option>{catalog.filter(type => type.active).map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </FormSelect>
        <button type="button" className="de-add-button" disabled={!selected} onClick={() => {
          const type = catalog.find(item => item.id === selected);
          if (type) onChange([...rows, { ...type, id: crypto.randomUUID(), catalogId: type.id, quantity: type.defaultQuantity, category: 'included', amount: 0 }]);
        }}><Plus size={15} aria-hidden="true" />Add item</button>
      </div>
    </div>
    {canPrice && extras > 0 && <div className="de-extras-note"><span>Extra amounts cover the full quantity.</span>{showExtrasTotal && <strong>Paid extras: ₹{extras.toLocaleString('en-IN')}</strong>}</div>}
  </section>;
}
