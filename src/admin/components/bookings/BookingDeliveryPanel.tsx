import { useEffect, useState, type ReactNode } from 'react';
import { Copy, FolderOpen, Image, FileArchive, Pencil } from 'lucide-react';
import type { Booking } from '../../types';
import { BookingSection } from './BookingDetailSections';
import { defaultDeliveryPhone, deliveryMessage, editedPhotoCount, rawSelectionMessage, deliveryRecipient, validDeliveryUrl } from './deliverySharing';

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" /><path d="M8 7.5c-.8.5-.8 1.8-.3 2.9 1.1 2.3 2.8 4 5.2 4.9 1.2.4 2.4.1 2.8-.8l.3-1-2.5-1.2-.9 1c-1.5-.6-2.6-1.7-3.2-3.1l.9-.9L9.1 7Z" /></svg>;
}

export function BookingDeliveryPanel({ booking, saving, onEdit, confirmation }: { booking: Booking; saving: boolean; onEdit: () => void; confirmation: ReactNode }) {
  const [selected, setSelected] = useState([true, true, false]);
  const [phone, setPhone] = useState(() => defaultDeliveryPhone(booking.customerPhone));
  const [draft, setDraft] = useState<{ source: string; text: string } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); } }, [notice]);
  const resources = [
    { label: 'Gallery folder', messageLabel: 'Gallery', url: booking.driveGalleryUrl.trim(), emoji: '📸', Icon: FolderOpen },
    { label: 'Edited photos', messageLabel: 'Edited photos', url: booking.driveEditedUrl.trim(), emoji: '✨', Icon: Image },
    { label: 'RAW files', messageLabel: 'RAW files', url: booking.driveRawsUrl.trim(), emoji: '📁', Icon: FileArchive },
  ];
  const included = resources.filter((resource, index) => selected[index] && validDeliveryUrl(resource.url));
  const selectionRequest = included.some(resource => resource.label === 'RAW files') && !included.some(resource => resource.label === 'Edited photos');
  const photoCount = editedPhotoCount(booking.deliverables);
  const messageLinks = included.map(resource => ({ ...resource, label: resource.messageLabel }));
  const generated = selectionRequest
    ? rawSelectionMessage(booking.customerName, messageLinks, photoCount, booking.customerCode)
    : deliveryMessage(booking.customerName, messageLinks, undefined, booking.customerCode);
  const message = draft?.source === generated ? draft.text : generated;
  const recipient = deliveryRecipient(phone);
  const messageUrls = message.match(/https?:\/\/[^\s]+/gi) || [];
  const messageValid = included.length > 0 && messageUrls.length > 0 && messageUrls.every(url => included.some(resource => resource.url === url));
  const issue = !included.length ? 'Add a valid delivery link and select it to include in your message.' : !messageValid ? 'Keep only selected delivery links in your message, or reset the message.' : !recipient ? 'Enter a WhatsApp number with its country code, for example +91 98765 43210.' : '';
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setNotice(`${label} copied.`); }
    catch { setNotice('Could not copy. Select the text and copy it manually.'); }
  };
  return <div className="bd-delivery-workflow">
    <div className="bd-delivery-intro"><div><p className="bd-eyebrow">CUSTOMER HANDOFF</p><h2>Beautiful work. Ready to share.</h2><p className="bd-helper">Prepare the files, add a personal note, and share with {booking.customerName}.</p></div><span className="bd-delivery-count">{included.length} of 3 links selected</span></div>
    <BookingSection title="1. Prepare delivery links" action={<div className="flex items-center gap-3"><button type="button" className="bd-button bd-resource-edit" aria-label="Edit delivery links" title="Edit delivery links" disabled={saving} onClick={onEdit}><Pencil size={17} /></button></div>}>
      <div className="bd-resource-list">{resources.map(({ label, url, Icon }, index) => {
        const valid = validDeliveryUrl(url);
        return <div className="bd-resource" key={label}>
          <label className="bd-resource-select"><input type="checkbox" aria-label={`Include ${label}`} checked={selected[index] && valid} disabled={!valid} onChange={event => setSelected(selected.map((value, i) => i === index ? event.target.checked : value))} /><span className="bd-resource-icon"><Icon size={20} /></span></label>
          <div className="bd-resource-info"><div className="bd-resource-title"><strong>{label}</strong>{valid && <button type="button" className="bd-resource-copy" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={() => void copy(url, label)}><Copy size={15} /></button>}<span className="bd-resource-state">{!valid && (url ? 'Needs correction' : 'Not added')}</span></div>{valid ? <a className="bd-resource-url bd-resource-hyperlink" href={url} target="_blank" rel="noopener noreferrer" title={url} aria-label={`Open ${label}: ${url}`}>{url}</a> : <p className="bd-resource-url">{url ? 'Enter a complete https:// link to share this resource.' : 'Add a link when the files are ready.'}</p>}</div>
        </div>;
      })}</div>
      {booking.driveNotes && <div className="bd-notes"><p className="bd-eyebrow">Delivery note</p><p className="whitespace-pre-wrap break-words text-sm">{booking.driveNotes}</p></div>}
    </BookingSection>
    <div className="bd-delivery-columns">
      <BookingSection title="2. Preview WhatsApp message">
        <div className="bd-recipient"><div className="bd-recipient-avatar">{booking.customerName.slice(0, 1).toUpperCase()}</div><div><strong>{booking.customerName}</strong><p className="bd-helper">Delivery recipient</p></div></div>
        <label className="bd-phone-label" htmlFor="delivery-recipient">WhatsApp number <span>including country code</span></label>
        <input id="delivery-recipient" type="tel" autoComplete="tel" className="bd-recipient-input" value={phone} placeholder="+91 98765 43210" aria-describedby="delivery-phone-help" aria-invalid={!recipient} onChange={event => setPhone(event.target.value)} />
        <p id="delivery-phone-help" className="bd-helper">Changes apply to this share only.{!recipient && ' Add a valid number with + and country code.'}</p>
        {selectionRequest && <p className="bd-helper">{photoCount === null ? 'No edited-photo quantity found in deliverables. Add it to the booking to include a selection count.' : `Selection request · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} from booking deliverables`}</p>}
        <div className="bd-whatsapp-preview"><div className="bd-preview-label"><WhatsAppIcon /><span>MESSAGE PREVIEW</span></div><label className="sr-only" htmlFor="delivery-message">WhatsApp message</label><textarea id="delivery-message" value={message} onChange={event => setDraft({ source: generated, text: event.target.value })} spellCheck rows={11} /><p className="bd-helper">Editable · Links update when your selection changes</p></div>
        <button className="bd-button mt-3" disabled={message === generated} onClick={() => setDraft(null)}>Reset message</button>
      </BookingSection>
      <div className="bd-delivery-share"><BookingSection title="3. Share on WhatsApp"><p className="bd-helper">Open the conversation with your prepared message. Review it in WhatsApp, then tap send.</p><div className="bd-share-summary"><span>Sharing with</span><strong>{booking.customerName}</strong><span>{recipient ? `+${recipient}` : 'Recipient number needed'}</span><span>{included.length} selected {included.length === 1 ? 'link' : 'links'}</span></div>
        <button className="bd-button bd-button-primary bd-share-button" disabled={Boolean(issue)} aria-describedby="delivery-share-help" onClick={() => { window.open(`https://wa.me/${recipient}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'); setNotice('WhatsApp opened. Review and send your message there.'); }}><WhatsAppIcon />Share on WhatsApp</button>
        <button className="bd-button bd-share-button" disabled={!messageValid} onClick={() => void copy(message, 'Message')}><Copy size={16} />Copy message</button>
        <p id="delivery-share-help" className="bd-helper">{issue || 'Opening WhatsApp does not mark the message as sent or the delivery as completed.'}</p>
        <div className="bd-delivery-confirm">{confirmation}</div>
      </BookingSection></div>
    </div><p role="status" className="bd-delivery-feedback">{notice}</p>
  </div>;
}
