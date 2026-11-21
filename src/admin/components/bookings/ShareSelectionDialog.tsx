import { useState } from 'react';
import { Copy, Link as LinkIcon, MessageCircle } from 'lucide-react';
import type { Booking } from '../../types';
import { api } from '../../api/client';
import { orderLocalInput } from '../../../shared/orderWorkflow';
import { BookingDialog } from './BookingDetailSections';
import { defaultDeliveryPhone, deliveryRecipient, deliveryUrlWarning, eligibleDeliveryUrl, normalizeDeliveryUrl, validDeliveryMessage, editedPhotoCount } from './deliverySharing';
import './share-selection.css';

export function ShareSelectionDialog({ booking, busy, error, onClose, onSave, onReload }: {
  booking: Booking; busy: boolean; error: string; onClose: () => void; onReload: () => void;
  onSave: (persist: () => Promise<void>, date: string) => Promise<void>;
}) {
  const key = !booking.driveRawsUrl && booking.driveGalleryUrl ? 'driveGalleryUrl' : 'driveRawsUrl';
  const [saved, setSaved] = useState({ url: booking[key] || '', version: booking.updatedAt });
  const [link, setLink] = useState(saved.url);
  const [phone, setPhone] = useState(defaultDeliveryPhone(booking.customerPhone || ''));
  const [editingPhone, setEditingPhone] = useState(false);
  const [custom, setCustom] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [date, setDate] = useState(() => orderLocalInput(new Date().toISOString()));
  const [notice, setNotice] = useState('');
  const url = normalizeDeliveryUrl(link);
  const valid = eligibleDeliveryUrl(url);
  const warning = deliveryUrlWarning(url);
  const recipient = deliveryRecipient(phone);
  const session = [booking.shootType, booking.packageName].filter(Boolean).join(' – ');
  const shoot = new Date(booking.bookingDate);
  const subtitle = [booking.customerName, session, Number.isFinite(shoot.getTime()) && 'Shoot ' + shoot.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })].filter(Boolean).join(' · ');
  const count = editedPhotoCount(booking.deliverables);
  const message = custom ?? `Hi ${booking.customerName || 'there'}, your photos${session ? ' from the ' + session : ''} are ready for you to choose from.\n\nOpen the gallery: ${url || '[gallery link]'}\n\nPlease pick ${count ? count + (count === 1 ? ' favourite' : ' favourites') : 'your favourites'} and reply here with the selected file names.\n– Doll Pictures`;
  const shareable = valid && validDeliveryMessage(message, [{ url }]);
  const ready = valid && confirmed && !!date && !busy;
  async function persist() {
    if (url === saved.url) return;
    const result = await api.updateBooking(booking.id, { [key]: url, expectedUpdatedAt: saved.version });
    setSaved({ url, version: result.updatedAt });
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setNotice(label + ' copied.'); }
    catch { setNotice('Could not copy. Select the text and copy it manually.'); }
  }
  return <BookingDialog compact title="Share photos for selection" subtitle={subtitle} className="admin-theme booking-detail selection-dialog" onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); if (ready) void onSave(persist, date); }}>
      <div className="ss-body">
        <fieldset disabled={busy}>
          <section><h3><span>1</span>Gallery link</h3>
            <div className="ss-row"><div className="ss-link"><LinkIcon size={16}/><input aria-label="Gallery link" inputMode="url" maxLength={2000} placeholder="Paste the gallery link" value={link} onChange={e => { setLink(e.target.value); setConfirmed(false); setNotice(''); }}/></div>
              <button type="button" disabled={!valid} onClick={() => void copy(url, 'Link')}><Copy size={15}/>Copy</button></div>
            <small>{warning || 'The folder or gallery the customer picks from (Google Drive, Pixieset or similar).'}</small>
          </section>
          <section><h3><span>2</span>Send to the customer</h3>
            <div className="ss-recipient"><b aria-hidden="true">{booking.customerName?.slice(0, 1).toUpperCase()}</b><div><strong>{booking.customerName}</strong><small>{phone.trim() === '+91' ? 'Number unavailable' : phone} · WhatsApp</small></div>
              <button type="button" aria-expanded={editingPhone} onClick={() => setEditingPhone(!editingPhone)}>{editingPhone ? 'Done' : 'Change number'}</button></div>
            {editingPhone && <label>WhatsApp number · include country code<input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setNotice(''); }}/></label>}
            <label>Message · you can edit it before sending<textarea aria-label="WhatsApp message" rows={7} value={message} onChange={e => { setCustom(e.target.value); setNotice(''); }}/></label>
            {custom !== null && !shareable && valid && <small>Include the current gallery link in the message. <button type="button" onClick={() => setCustom(null)}>Restore message</button></small>}
            <div className="ss-actions"><button className="ss-whatsapp" type="button" disabled={!shareable || !recipient} onClick={() => { window.open('https://wa.me/' + recipient + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer'); setNotice('WhatsApp opened'); }}><MessageCircle size={16}/>Send on WhatsApp</button>
              <button type="button" disabled={!shareable} onClick={() => void copy(message, 'Message')}><Copy size={15}/>Copy message</button><small role="status">{notice}</small></div>
          </section>
          {error && <div role="alert">{error} <button type="button" onClick={onReload}>Reload latest order</button></div>}
        </fieldset>
      </div>
      <fieldset className="ss-confirmation" disabled={busy}>
        <section><h3><span>3</span>Confirm</h3><div className="ss-confirm">
          <label>Shared at · IST<input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)}/></label>
          <label className="ss-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>The customer can open the gallery</label>
        </div></section>
      </fieldset>
      <footer><small>Saves “Photos shared for selection”. The order then waits for the customer’s selection.</small><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" disabled={!ready}>{busy ? 'Saving…' : 'Mark as shared'}</button></footer>
    </form>
  </BookingDialog>;
}
