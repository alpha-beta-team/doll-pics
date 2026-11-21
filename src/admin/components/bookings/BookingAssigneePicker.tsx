import { useEffect, useRef, useState } from 'react';
import type { StaffAccountOption } from '../../types';
import { BookingRecordIcon as Icon } from './BookingRecordIcon';

type Props = {
  currentId?: string | null;
  currentName?: string;
  staff: StaffAccountOption[];
  disabled: boolean;
  onSave: (id: string) => Promise<void>;
};

export function BookingAssigneePicker({ currentId, currentName, staff, disabled, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (!lock.current && !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const eligibleStaff = staff.filter(account => account.canTakeShoots === true);
  const options = [...eligibleStaff.map(({ id, name, jobTitle }) => ({ id, name, jobTitle })), { id: '', name: 'Unassigned', jobTitle: '' }];
  if (currentId && !eligibleStaff.some(option => option.id === currentId)) {
    options.unshift({ id: currentId, name: currentName || 'Current assignee', jobTitle: 'Current assignment' });
  }
  async function select(id: string) {
    if (lock.current) return;
    if (id === (currentId || '')) { close(); return; }
    lock.current = true;
    setBusy(true);
    setError('');
    try { await onSave(id); close(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save assignment'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="bd-assignee-picker" ref={root} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !lock.current) setOpen(false);
  }}>
    <button type="button" ref={trigger} disabled={disabled} aria-label="Change assigned person" aria-haspopup="menu" aria-expanded={open} className="bd-change-person" onClick={() => { setError(''); setOpen(!open); }}><Icon name="Change" /></button>
    {open && <div className="bd-assignee-menu" role="menu" aria-label="Assign booking to" aria-busy={busy} onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); close(); }
      if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]')];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }}>
      <strong>Assign to</strong>
      {options.map(option => <button type="button" role="menuitemradio" aria-checked={option.id === (currentId || '')} aria-disabled={busy} key={option.id} onClick={() => void select(option.id)}>
        <span className="bd-mini-avatar">{option.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>
        <span>{option.name}{option.jobTitle && <small>{option.jobTitle}</small>}</span>
      </button>)}
      {error && <p role="alert">{error}</p>}
    </div>}
  </div>;
}
