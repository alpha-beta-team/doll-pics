import React, { act } from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { BookingAssigneePicker } from '../src/admin/components/bookings/BookingAssigneePicker';
import { normalizeStaffAccount } from '../src/admin/api/staffAccounts';

test('assignee picker offers eligible staff and preserves the current historical assignment', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(dom.window.document.getElementById('root')!);
  const saved: string[] = [];
  try {
    await act(async () => root.render(<BookingAssigneePicker currentId="current" currentName="Previous photographer" disabled={false} staff={[
      { id: 'yes', name: 'Eligible photographer', jobTitle: '', canTakeShoots: true },
      { id: 'no', name: 'Marketing team', jobTitle: '', canTakeShoots: false },
      { id: 'legacy', name: 'Legacy account', jobTitle: '' },
      { id: 'current', name: 'Previous photographer', jobTitle: '', canTakeShoots: false },
    ]} onSave={async id => { saved.push(id); }} />));
    await act(async () => dom.window.document.querySelector<HTMLButtonElement>('[aria-label="Change assigned person"]')!.click());
    const options = [...dom.window.document.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
    assert.equal(options.length, 3);
    assert.match(options[0].textContent!, /Previous photographer/);
    assert.equal(options[0].getAttribute('aria-checked'), 'true');
    assert.match(options[1].textContent!, /Eligible photographer/);
    assert.match(options[2].textContent!, /Unassigned/);
    assert.doesNotMatch(dom.window.document.body.textContent!, /Marketing team|Legacy account/);
    await act(async () => options[1].click());
    assert.deepEqual(saved, ['yes']);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, { window: previousWindow, document: previousDocument });
  }
});

test('staff normalization treats missing shoot eligibility as disabled', () => {
  const account = { id: 'staff', name: 'Staff', role: 'owner', isActive: true, mustChangePassword: false };
  assert.equal(normalizeStaffAccount(account).canTakeShoots, false);
  assert.equal(normalizeStaffAccount({ ...account, canTakeShoots: true }).canTakeShoots, true);
});
