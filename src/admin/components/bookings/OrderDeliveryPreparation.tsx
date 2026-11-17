import { AdminAlert } from '../ui/AdminUi';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import type { Booking } from '../../types';
import { deliveryUrlWarning, defaultDeliveryPhone, deliveryMessage, deliveryRecipient, editedPhotoCount, normalizeDeliveryUrl, rawSelectionMessage, validDeliveryUrl } from './deliverySharing';

type LinkKey = 'driveGalleryUrl' | 'driveEditedUrl' | 'driveRawsUrl';
const fields: { key: LinkKey; label: string; emoji: string }[] = [
  { key: 'driveRawsUrl', label: 'RAW / selection photos', emoji: '📁' },
  { key: 'driveGalleryUrl', label: 'Gallery folder', emoji: '📸' },
  { key: 'driveEditedUrl', label: 'Edited photos', emoji: '✨' },
];
export interface DeliveryPreparationHandle { saveLinks: () => Promise<void> }
export const OrderDeliveryPreparation = forwardRef<DeliveryPreparationHandle, {
  booking: Booking; selection: boolean; disabled: boolean; onSaved?: (booking: Booking) => void; onBusyChange: (busy: boolean) => void;
}>(function OrderDeliveryPreparation({ booking, selection, disabled, onSaved, onBusyChange }, ref) {
  const [links, setLinks] = useState(() => Object.fromEntries(fields.map(field => [field.key, booking[field.key] || ''])) as Record<LinkKey, string>);
  const saved = useRef({ ...links }), version = useRef(booking.updatedAt);
  const [checked, setChecked] = useState<LinkKey[]>(selection ? ['driveRawsUrl', 'driveGalleryUrl'] : ['driveEditedUrl']);
  const [phone, setPhone] = useState(defaultDeliveryPhone(booking.customerPhone || ''));
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const included = fields.filter(field => checked.includes(field.key) && validDeliveryUrl(normalizeDeliveryUrl(links[field.key])))
    .map(field => ({ ...field, url: normalizeDeliveryUrl(links[field.key]) }));
  const message = selection ? rawSelectionMessage(booking.customerName, included, editedPhotoCount(booking.deliverables), booking.customerCode)
    : deliveryMessage(booking.customerName, included, undefined, booking.customerCode);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const preview = customMessage ?? message;
  const unsafe = included.some(field => deliveryUrlWarning(field.url)) || (preview.match(/https?:\/\/[^\s]+/g) || []).some(url => deliveryUrlWarning(url));
  const recipient = deliveryRecipient(phone);
  const dirty = fields.some(field => normalizeDeliveryUrl(links[field.key]) !== saved.current[field.key]);
  const persist = async () => {
    const clean = Object.fromEntries(fields.map(field => [field.key, normalizeDeliveryUrl(links[field.key])])) as Record<LinkKey, string>;
    if (fields.some(field => clean[field.key] && !validDeliveryUrl(clean[field.key]))) throw new Error('Enter valid delivery URLs, or clear the invalid fields.');
    const patch = Object.fromEntries(fields.filter(field => clean[field.key] !== saved.current[field.key]).map(field => [field.key, clean[field.key]]));
    if (!Object.keys(patch).length) return;
    const updated = await api.updateBooking(booking.id, { ...patch, expectedUpdatedAt: version.current });
    saved.current = clean; version.current = updated.updatedAt;
    setLinks(clean); onSaved?.(updated);
  };
  useImperativeHandle(ref, () => ({ saveLinks: persist }));
  const saving = useRef(false);
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied.`); setError(''); }
    catch { setError('Could not copy. Select and copy the text manually.'); }
  };
  const saveLinks = async () => {
    if (saving.current || disabled) return;
    saving.current = true;
    setError(''); setNotice(''); setBusy(true); onBusyChange(true);
    try { await persist(); setNotice('Delivery links saved.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save links'); }
    finally { saving.current = false; setBusy(false); onBusyChange(false); }
  };
  const renderField = (field: typeof fields[number]) => {
    const value = normalizeDeliveryUrl(links[field.key]);
    const warning = deliveryUrlWarning(value);
    const state = value !== saved.current[field.key] ? 'Changed' : value ? '' : 'Not added';
    return <div key={field.key}>
      <div className="mb-1 flex items-center justify-between gap-2"><label htmlFor={`delivery-${field.key}`} className="text-sm font-medium">{field.label}</label>{state && <span className={`text-xs ${state === 'Changed' ? 'text-amber-700' : 'text-admin-subtle'}`}>{state}</span>}</div>
      <div className="flex items-center gap-1"><input id={`delivery-${field.key}`} type="text" inputMode="url" autoComplete="off" maxLength={2000} className="min-h-11 min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm" value={links[field.key]} disabled={disabled || busy} placeholder="https://…" aria-describedby={warning ? `warning-${field.key}` : undefined} onChange={e => { setError(''); setNotice(''); setLinks({ ...links, [field.key]: e.target.value }); }} />
      {value && <><a aria-label={`Open ${field.label}`} title={`Open ${field.label}`} aria-disabled={Boolean(warning)} href={warning ? undefined : value} target="_blank" rel="noopener noreferrer" className="delivery-link-action"><ExternalLink size={17} aria-hidden="true" /></a><button type="button" aria-label={`Copy ${field.label}`} title={`Copy ${field.label}`} className="delivery-link-action" onClick={() => void copy(value, field.label)}><Copy size={17} aria-hidden="true" /></button></>}</div>
      {warning && <p id={`warning-${field.key}`} className="mt-1 text-xs text-amber-800">{warning}</p>}
    </div>;
  };
  return <div className="space-y-4 delivery-preparation">
    <section className="space-y-3" aria-label="Prepare delivery links">
      <h3 className="text-sm font-semibold">Prepare delivery links</h3>
      {renderField(fields.find(field => field.key === (selection ? 'driveRawsUrl' : 'driveEditedUrl'))!)}
      <details><summary className="cursor-pointer py-2 text-sm font-medium">Additional links <span className="font-normal text-admin-subtle">· optional</span></summary><div className="mt-1 space-y-3">{fields.filter(field => field.key !== (selection ? 'driveRawsUrl' : 'driveEditedUrl')).map(renderField)}</div></details>
      {dirty && <div className="flex flex-wrap items-center gap-3"><button type="button" className="bd-button" disabled={disabled || busy} onClick={() => void saveLinks()}>{busy ? 'Saving links…' : 'Save delivery links'}</button><p className="text-xs text-admin-subtle">Changes also save when you confirm delivery.</p></div>}
    </section>
    <section className="space-y-3 rounded-xl border border-admin-border bg-admin-muted p-3" aria-label="Share on WhatsApp">
      <div><h3 className="text-sm font-semibold">Share on WhatsApp <span className="font-normal text-admin-subtle">· optional</span></h3><p className="mt-1 text-xs text-admin-subtle">Already shared another way? Continue to delivery confirmation.</p></div>
      <div className="grid items-start gap-4 sm:grid-cols-[240px_minmax(0,1fr)]"><div className="space-y-3"><div className="flex flex-wrap sm:flex-col gap-x-4">{fields.map(field => <label key={field.key} className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" aria-label={`Include ${field.label}`} checked={checked.includes(field.key)} disabled={!validDeliveryUrl(normalizeDeliveryUrl(links[field.key])) || disabled || busy} onChange={e => { setChecked(e.target.checked ? [...checked, field.key] : checked.filter(key => key !== field.key)); }} />{field.label}</label>)}</div>
      <label className="block text-xs font-medium">WhatsApp number · include country code<input type="tel" className="mt-1 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm" value={phone} onChange={e => setPhone(e.target.value)} aria-describedby="delivery-phone-help" /></label>
      {!recipient && <p id="delivery-phone-help" className="text-xs text-admin-subtle">Enter a number with country code, such as +91 98765 43210, to use WhatsApp.</p>}
      </div><label className="block text-xs font-medium">Customer message<textarea aria-label="Customer message" rows={8} className="mt-1 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm leading-relaxed" value={preview} onChange={e => setCustomMessage(e.target.value)} /></label></div>
      {customMessage !== null && <div className="text-xs text-admin-subtle">Custom message kept as written. <button type="button" className="underline" onClick={() => setCustomMessage(null)}>Refresh message from selected links</button></div>}
      {dirty && <p className="text-xs text-amber-800">Save link changes before sharing.</p>}
      {unsafe && <AdminAlert tone="warning" as="span">Replace internal or local URLs in the selected links and message before sharing.</AdminAlert>}
      <div className="flex flex-wrap gap-2"><button type="button" className="bd-button" disabled={dirty || unsafe || !preview.trim() || !included.length || !recipient || disabled || busy} onClick={() => { window.open(`https://wa.me/${recipient}?text=${encodeURIComponent(preview)}`, '_blank', 'noopener,noreferrer'); setNotice('WhatsApp opened. Review and send the message there. Delivery is not yet confirmed.'); }}>Share on WhatsApp</button><button type="button" className="bd-button" disabled={dirty || unsafe || !preview.trim() || disabled || busy} onClick={() => void copy(preview, 'Message')}>Copy message</button></div>
      <p className="text-xs text-admin-subtle">Review and send in WhatsApp. Only “Confirm edited photos shared” stops the editing deadline.</p>
    </section>
    {error && <AdminAlert as="span">{error}</AdminAlert>}
    {notice && <AdminAlert tone="success" as="span">{notice}</AdminAlert>}
  </div>;
});
