import { FormInput, FormTextarea } from '../ui/FormControls';
import { useEffect, useState, type ReactNode } from 'react';
import { BookingRecordIcon as RecordIcon } from './BookingRecordIcon';
import type { Booking } from '../../types';
import { defaultDeliveryPhone, deliveryMessage, editedPhotoCount, rawSelectionMessage, deliveryRecipient, deliveryLinkFields, deliveryUrlWarning, eligibleDeliveryUrl, validDeliveryMessage, type DeliveryLinkKey } from './deliverySharing';

export function BookingDeliveryPanel({ booking, sharingRecorded, saving, onEdit, confirmation }: {
  booking: Booking; sharingRecorded?: boolean; saving: boolean; onEdit: (key?: DeliveryLinkKey) => void; confirmation: ReactNode;
}) {
  const [selected, setSelected] = useState<DeliveryLinkKey[]>(['driveGalleryUrl', 'driveEditedUrl']);
  const [phone, setPhone] = useState(() => defaultDeliveryPhone(booking.customerPhone));
  const [editingPhone, setEditingPhone] = useState(false);
  const [draft, setDraft] = useState<{ source: string; text: string } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); } }, [notice]);
  const resources = deliveryLinkFields.map(field => ({ ...field, url: booking[field.key].trim() }));
  const included = resources.filter(resource => selected.includes(resource.key) && eligibleDeliveryUrl(resource.url));
  const selectionRequest = included.some(resource => resource.key === 'driveRawsUrl') && !included.some(resource => resource.key === 'driveEditedUrl');
  const photoCount = editedPhotoCount(booking.deliverables);
  const messageLinks = included.map(resource => ({ ...resource, label: resource.messageLabel }));
  const generated = selectionRequest
    ? rawSelectionMessage(booking.customerName, messageLinks, photoCount, booking.customerCode)
    : deliveryMessage(booking.customerName, messageLinks, undefined, booking.customerCode);
  const message = draft?.source === generated ? draft.text : generated;
  const recipient = deliveryRecipient(phone);
  const messageValid = validDeliveryMessage(message, included);
  const issue = !included.length ? 'Add a customer-accessible delivery link and select it to include in your message.' : !messageValid ? 'Keep only selected delivery links in your message, or reset to default.' : !recipient ? 'Enter a WhatsApp number with its country code, for example +91 98765 43210.' : '';
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setNotice(`${label} copied.`); }
    catch { setNotice('Could not copy. Select the text and copy it manually.'); }
  };
  return <section className="bd-delivery-workflow" aria-labelledby="delivery-heading">
    <div className="bd-delivery-step-heading"><h2 id="delivery-heading">Send files on WhatsApp</h2><span className="bd-record-badge">{sharingRecorded ? 'Sharing confirmed' : 'Sharing unconfirmed'}</span></div>
    <p className="bd-helper bd-delivery-description">Pick the links, check the message, send it, then confirm sharing — all here.</p>
    <ol className="bd-delivery-steps">
      <li><span className="bd-delivery-step" aria-hidden="true">1</span><div className="bd-delivery-step-body">
        <div className="bd-delivery-step-heading"><h3>Choose links <span>· {included.length} of 3 selected</span></h3><button type="button" aria-label="Edit delivery links" title="Edit delivery links" className="bd-button bd-link-add" disabled={saving} onClick={() => onEdit(resources.find(resource => !resource.url)?.key)}><RecordIcon name="Link" />Add link</button></div>
        <ul className="bd-resource-list">{resources.map(({ key, label, url }) => {
          const eligible = eligibleDeliveryUrl(url);
          const warning = deliveryUrlWarning(url);
          return <li className={`bd-resource${!url ? ' is-empty' : ''}`} key={key}>
            <input id={`include-${key}`} type="checkbox" aria-label={`Include ${label}`} checked={selected.includes(key) && eligible} disabled={!eligible || saving} onChange={event => setSelected(previous => event.target.checked ? [...previous, key] : previous.filter(value => value !== key))} />
            <div className="bd-resource-info"><label htmlFor={`include-${key}`}>{label}</label>{eligible ? <div className="bd-resource-valid"><a className="bd-resource-url bd-resource-hyperlink" href={url} target="_blank" rel="noopener noreferrer" title={url} aria-label={`Open ${label}: ${url}`}>{url}</a><button type="button" className="bd-resource-copy" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={() => void copy(url, label)}><RecordIcon name="Copy" /></button></div> : <p className={url ? 'bd-resource-warning' : 'bd-helper'}>{url ? <><RecordIcon name="Warning" /><span>{warning}</span></> : 'No link saved'}</p>}</div>
            <button type="button" className={`bd-button ${url ? '' : 'bd-link-add'}`} aria-label={`${!url ? 'Add' : eligible ? 'Edit' : 'Fix'} ${label.toLowerCase()} link`} disabled={saving} onClick={() => onEdit(key)}>{url ? <RecordIcon name="Manage" /> : <RecordIcon name="Link" />}{!url ? 'Add link' : eligible ? 'Edit' : 'Fix link'}</button>
          </li>;
        })}</ul>
        {booking.driveNotes && <details className="bd-delivery-notes"><summary>Internal delivery note</summary><p>{booking.driveNotes}</p></details>}
      </div></li>
      <li><span className="bd-delivery-step" aria-hidden="true">2</span><div className="bd-delivery-step-body">
        <div className="bd-delivery-step-heading"><h3>Check the message</h3><button type="button" className="bd-link" onClick={() => setDraft(null)}>Reset to default</button></div>
        <div className="bd-recipient-line"><span>To</span><span className="bd-recipient-initials" aria-hidden="true">{booking.customerName.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join('').toUpperCase()}</span><strong>{booking.customerName}</strong><span>· {phone}</span><button type="button" className="bd-button" aria-expanded={editingPhone} aria-controls="delivery-phone-editor" onClick={() => setEditingPhone(!editingPhone)}>Change number</button></div>
        {editingPhone && <div id="delivery-phone-editor"><label className="bd-phone-label" htmlFor="delivery-recipient">WhatsApp number <span>including country code</span></label><FormInput autoFocus id="delivery-recipient" type="tel" autoComplete="tel" className="bd-recipient-input" value={phone} placeholder="+91 98765 43210" aria-describedby="delivery-phone-help" aria-invalid={!recipient} onChange={event => setPhone(event.target.value)} /><p id="delivery-phone-help" className="bd-helper">Changes apply to this share only.{!recipient && ' Add a valid number with + and country code.'}</p></div>}
        {selectionRequest && <p className="bd-helper">{photoCount === null ? 'No edited-photo quantity found in deliverables. The message asks for preferred photos.' : `Selection request · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} from booking deliverables`}</p>}
        <label className="sr-only" htmlFor="delivery-message">WhatsApp message</label><FormTextarea id="delivery-message" className="bd-delivery-message" value={message} onChange={event => setDraft({ source: generated, text: event.target.value })} spellCheck rows={7} />
        <p className="bd-helper">Links in the message update when you change the selection above.</p>
      </div></li>
      <li><span className="bd-delivery-step" aria-hidden="true">3</span><div className="bd-delivery-step-body">
        <h3>Send, then confirm</h3><div className="bd-delivery-actions">
          <button type="button" className="bd-button bd-button-primary" disabled={Boolean(issue) || saving} aria-describedby="delivery-share-help" onClick={() => { window.open(`https://wa.me/${recipient}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'); setNotice('WhatsApp opened. Review and send your message there.'); }}><RecordIcon name="WhatsApp" />Share on WhatsApp</button>
          <button type="button" className="bd-button" disabled={!messageValid || saving} onClick={() => void copy(message, 'Message')}><RecordIcon name="Copy" />Copy message</button>
        </div><p id="delivery-share-help" className="bd-helper bd-share-issue">{issue}</p>
        <div className="bd-delivery-confirm"><p className="bd-helper"><strong>After you send it,</strong> confirm here. Opening WhatsApp doesn’t mark the files as delivered.</p>{confirmation}</div>
      </div></li>
    </ol><p role="status" className="bd-delivery-feedback">{notice}</p>
  </section>;
}
