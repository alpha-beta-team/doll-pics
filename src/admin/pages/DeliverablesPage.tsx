import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { AdminPageHeader } from '../components/ui';
import type { DeliverableConfiguration, DeliverableConfigurationItem } from '../../shared/deliverables';

const empty: DeliverableConfiguration = { revision: 0, base: [], seasonal: [] };
function identifier() { return crypto.randomUUID().replace(/-/g, '').slice(0, 24); }
function newItem(seasonal = false): DeliverableConfigurationItem {
  return { id: identifier(), name: '', quantity: 1, kind: 'physical', unit: 'pieces', specifications: '', category: seasonal ? 'complimentary' : 'included' };
}
const input = 'mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm';

function ItemList({ items, onChange, seasonal = false, disabled }: {
  items: DeliverableConfigurationItem[];
  onChange: (items: DeliverableConfigurationItem[]) => void;
  seasonal?: boolean;
  disabled: boolean;
}) {
  const update = (id: string, patch: Partial<DeliverableConfigurationItem>) => onChange(items.map(item => item.id === id ? { ...item, ...patch } : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={item.id} className="space-y-3 rounded-xl border border-admin-border bg-white p-3">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-admin-subtle">Item {index + 1}</span><button type="button" className="min-h-11 px-3 text-sm text-red-700" disabled={disabled} onClick={() => onChange(items.filter(row => row.id !== item.id))}>Remove item {index + 1}</button></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="text-sm">Item name<input className={input} required maxLength={100} value={item.name} onChange={event => update(item.id, { name: event.target.value })} placeholder="Album, edited images, frame…" /></label>
        <label className="text-sm">Quantity<input className={input} required type="number" min="1" step="1" value={item.quantity || ''} onChange={event => update(item.id, { quantity: Number(event.target.value) })} /></label></div>
      {seasonal && <label className="block text-sm">Added as<select className={input} value={item.category} onChange={event => update(item.id, { category: event.target.value as DeliverableConfigurationItem['category'] })}><option value="complimentary">Complimentary</option><option value="included">Included</option></select></label>}
      <details><summary className="cursor-pointer py-2 text-sm font-semibold text-admin-primary">Type &amp; specifications</summary><div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Type<select className={input} value={item.kind} onChange={event => update(item.id, { kind: event.target.value as DeliverableConfigurationItem['kind'], unit: event.target.value === 'digital' ? 'images' : 'pieces' })}><option value="physical">Physical</option><option value="digital">Digital</option></select></label>
        <label className="text-sm">Quantity unit<input className={input} required maxLength={30} value={item.unit} onChange={event => update(item.id, { unit: event.target.value })} /></label>
        <label className="text-sm sm:col-span-2">Fixed specifications<input className={input} maxLength={500} value={item.specifications} onChange={event => update(item.id, { specifications: event.target.value })} placeholder="For example: 20 pages, 12 × 12 inches" /></label>
      </div></details>
    </div>)}
    {!items.length && <p className="text-sm text-admin-subtle">{seasonal ? 'Add the seasonal items here.' : 'Add the items usually promised on every booking.'}</p>}
    <button type="button" disabled={disabled} className="min-h-11 rounded-lg border border-admin-border bg-white px-4 text-sm font-semibold" onClick={() => onChange([...items, newItem(seasonal)])}>{seasonal ? 'Add seasonal item' : 'Add base item'}</button>
  </div>;
}

export function DeliverablesPage() {
  const [configuration, setConfiguration] = useState<DeliverableConfiguration>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setConfiguration(await api.getDeliverableConfiguration()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load deliverable lists'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto max-w-4xl space-y-5">
    <AdminPageHeader eyebrow="Studio Settings" title="Deliverables" description="Set the Base Package once. Seasonal lists inherit the base and add their own items. Saved bookings keep their agreed list." />
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}<button type="button" className="ml-3 min-h-11 underline" disabled={saving} onClick={() => { if (window.confirm('Reload saved configuration and discard unsaved changes?')) void load(); }}>Reload saved configuration</button></div>}
    {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    {loading ? <p role="status">Loading deliverable lists…</p> : <form className="space-y-5" onSubmit={async event => {
      event.preventDefault(); setSaving(true); setError(''); setMessage('');
      try { setConfiguration(await api.saveDeliverableConfiguration(configuration)); setMessage('Base Package and seasonal lists saved. Existing bookings are unchanged.'); }
      catch (e) { setError(e instanceof Error ? e.message : 'Could not save deliverable lists'); }
      finally { setSaving(false); }
    }}>
      <fieldset disabled={saving} className="min-w-0 space-y-5">
        <section aria-label="Base Package" className="space-y-4 rounded-xl border border-admin-border bg-white p-4 sm:p-5">
          <div><h2 className="text-lg font-semibold">Base Package</h2><p className="mt-1 text-sm text-admin-subtle">This list is selected for new bookings and inherited by every seasonal extension.</p></div>
          <ItemList items={configuration.base} disabled={saving} onChange={base => setConfiguration({ ...configuration, base })} />
        </section>
        <section aria-label="Seasonal extensions" className="space-y-4">
          <div><h2 className="text-lg font-semibold">Seasonal extensions</h2><p className="mt-1 text-sm text-admin-subtle">Add only the extra seasonal items. Staff choose which extension applies to a booking.</p></div>
          {configuration.seasonal.map((extension, index) => <section key={extension.id} aria-label={`Seasonal extension ${index + 1}`} className="space-y-4 rounded-xl border border-admin-border bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3"><label className="min-w-0 flex-1 text-sm">Seasonal list name<input className={input} required maxLength={100} value={extension.name} placeholder="Diwali, Christmas, Summer…" onChange={event => setConfiguration({ ...configuration, seasonal: configuration.seasonal.map(item => item.id === extension.id ? { ...item, name: event.target.value } : item) })} /></label><button type="button" className="min-h-11 px-3 text-sm text-red-700" onClick={() => setConfiguration({ ...configuration, seasonal: configuration.seasonal.filter(item => item.id !== extension.id) })}>Remove extension</button></div>
            <div className="rounded-lg bg-admin-canvas p-3"><p className="text-sm font-semibold">Inherits Base Package</p><ul className="mt-2 space-y-1 text-sm text-admin-subtle">{configuration.base.map(item => <li key={item.id}>{item.name || 'Unnamed item'} × {item.quantity}</li>)}</ul>{!configuration.base.length && <p className="mt-1 text-sm text-admin-subtle">Add base items above; they will appear here automatically.</p>}</div>
            <h3 className="text-sm font-semibold">Seasonal additions</h3>
            <ItemList seasonal items={extension.items} disabled={saving} onChange={items => setConfiguration({ ...configuration, seasonal: configuration.seasonal.map(item => item.id === extension.id ? { ...item, items } : item) })} />
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={extension.active} onChange={event => setConfiguration({ ...configuration, seasonal: configuration.seasonal.map(item => item.id === extension.id ? { ...item, active: event.target.checked } : item) })} />Available for new selections</label>
          </section>)}
          <button type="button" className="min-h-11 rounded-lg border border-admin-border bg-white px-4 text-sm font-semibold" onClick={() => setConfiguration({ ...configuration, seasonal: [...configuration.seasonal, { id: identifier(), name: '', active: true, items: [] }] })}>Add seasonal extension</button>
        </section>
      </fieldset>
      <button disabled={saving} className="min-h-11 rounded-lg bg-admin-primary px-5 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save configuration'}</button>
    </form>}
  </div>;
}
