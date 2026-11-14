import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { JSDOM } from 'jsdom';
import { EnquiryCallOutcomeForm } from '../src/admin/components/enquiries/EnquiryCallOutcomeForm';
import { EnquiryFormModal } from '../src/admin/components/EnquiryFormModal';
import { EnquirySidePanel } from '../src/admin/components/enquiries/EnquirySidePanel';
import { ConfirmDialogContext } from '../src/admin/hooks/useConfirmDialog';
import { api } from '../src/admin/api/client';
import type { Enquiry, RecordEnquiryCallPayload } from '../src/admin/types';

const enquiry = { id: 'one', name: 'Preview Customer', phone: '9999999999', stage: 'new', notes: '', shootType: 'Family', callHistory: [] } as unknown as Enquiry;
async function mount(element: React.ReactNode, confirm = async () => true) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin/enquiries' });
  // React is imported before a DOM exists in this Node harness; cover its legacy focus hooks.
  Object.defineProperties(dom.window.HTMLElement.prototype, { attachEvent: { value: () => {} }, detachEvent: { value: () => {} } });
  const keys = ['window', 'document', 'localStorage', 'IS_REACT_ACT_ENVIRONMENT'] as const;
  const previous = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  for (const [key, value] of [['window', dom.window], ['document', dom.window.document], ['localStorage', dom.window.localStorage], ['IS_REACT_ACT_ENVIRONMENT', true]] as const) Object.defineProperty(globalThis, key, { configurable: true, value });
  const root = createRoot(dom.window.document.getElementById('root')!);
  const render = async (next: React.ReactNode) => act(async () => root.render(createElement(MemoryRouter, {}, createElement(ConfirmDialogContext.Provider, { value: confirm }, next))));
  await render(element);
  return { document: dom.window.document, render,
    async click(text: string) { const button = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent === text); assert.ok(button, text); await act(async () => button.click()); },
    async choose(value: string) { const radio = dom.window.document.querySelector<HTMLInputElement>(`input[value="${value}"]`); assert.ok(radio); await act(async () => radio.click()); },
    async note(value: string) { const textarea = dom.window.document.querySelector('textarea')!; await act(async () => { textarea.value = value; Simulate.change(textarea); }); },
    async close() { await act(async () => root.unmount()); dom.window.close(); for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } },
  };
}

test('call editor requires an outcome, a retry for no answer, and a closing reason', async () => {
  const original = api.recordEnquiryCall;
  const calls: RecordEnquiryCallPayload[] = [];
  api.recordEnquiryCall = async (_id, body) => { calls.push(body); return { ...enquiry, stage: 'closed_lost' }; };
  const view = await mount(createElement(EnquiryCallOutcomeForm, { enquiry, onSaved: () => {} }));
  try {
    await view.click('Save call outcome'); assert.match(view.document.body.textContent!, /Choose the call outcome/);
    await view.choose('no_answer'); await view.click('Save call outcome'); assert.equal(calls.length, 0);
    assert.match(view.document.body.textContent!, /Choose a follow-up date and time/);
    await view.choose('not_interested'); await view.click('Save call outcome'); assert.equal(calls.length, 0);
    await view.note('Booked another studio'); await view.click('Save call outcome'); assert.equal(calls.length, 1);
    assert.equal(calls[0].note, 'Booked another studio'); assert.equal(calls[0].nextFollowUpAt, undefined);
  } finally { api.recordEnquiryCall = original; await view.close(); }
});

test('failed call save retains entry and reuses operation key on retry', async () => {
  const original = api.recordEnquiryCall;
  const calls: RecordEnquiryCallPayload[] = []; let saved = 0;
  api.recordEnquiryCall = async (_id, payload) => { calls.push(payload); if (calls.length === 1) throw new Error('Temporary failure'); return enquiry; };
  const view = await mount(createElement(EnquiryCallOutcomeForm, { enquiry, onSaved: () => saved++ }));
  try {
    await view.choose('no_answer'); await view.note('Try tomorrow'); await view.click('Tomorrow 10 AM'); await view.click('Save call outcome');
    assert.match(view.document.body.textContent!, /Temporary failure/); assert.equal(view.document.querySelector('textarea')!.value, 'Try tomorrow');
    await view.click('Save call outcome'); assert.equal(saved, 1); assert.equal(calls.length, 2); assert.equal(calls[0].eventId, calls[1].eventId);
    assert.match(calls[0].nextFollowUpAt!, /T04:30:00.000Z$/);
  } finally { api.recordEnquiryCall = original; await view.close(); }
});

test('side panel saves notes without leaving list and confirms discarding edits', async () => {
  const get = api.getEnquiry, update = api.updateEnquiry, lookup = api.lookupCustomer;
  api.getEnquiry = async () => enquiry; api.lookupCustomer = async () => ({ canonicalPhone: enquiry.phone, active: [], history: [] });
  const changes: Enquiry[] = []; let closed = 0, confirmations = 0;
  api.updateEnquiry = async (_id, data) => ({ ...enquiry, ...data });
  const view = await mount(createElement(EnquirySidePanel, { id: enquiry.id, canManage: true, canViewPhone: true, onClose: () => closed++, onChanged: item => changes.push(item) }), async () => { confirmations++; return false; });
  try {
    assert.match(view.document.querySelector('[role="dialog"]')!.textContent!, /Preview Customer/);
    await view.note('Discussed location');
    const close = view.document.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')!; await act(async () => close.click());
    assert.equal(confirmations, 1); assert.equal(closed, 0);
    await view.click('Save notes'); assert.equal(changes[0].notes, 'Discussed location'); assert.match(view.document.body.textContent!, /Internal notes saved/);
    await act(async () => close.click()); assert.equal(closed, 1);
  } finally { api.getEnquiry = get; api.updateEnquiry = update; api.lookupCustomer = lookup; await view.close(); }
});

test('read-only quick view hides contact and all mutation actions', async () => {
  const original = api.getEnquiry; api.getEnquiry = async () => enquiry;
  const view = await mount(createElement(EnquirySidePanel, { id: enquiry.id, canManage: false, canViewPhone: false, onClose: () => {}, onChanged: () => {} }));
  try {
    const content = view.document.body.textContent!;
    assert.doesNotMatch(content, /Log call outcome|Edit enquiry|Save notes|Schedule follow-up|9999999999/);
    assert.equal(view.document.querySelector('textarea')!.disabled, true);
  } finally { api.getEnquiry = original; await view.close(); }
});

test('failed side-panel loading is retryable and never displays stale enquiry details', async () => {
  const original = api.getEnquiry; let calls = 0;
  api.getEnquiry = async () => { if (++calls === 1) throw new Error('Offline'); return enquiry; };
  const view = await mount(createElement(EnquirySidePanel, { id: enquiry.id, canManage: false, canViewPhone: false, onClose: () => {}, onChanged: () => {} }));
  try {
    assert.match(view.document.body.textContent!, /Offline/); assert.doesNotMatch(view.document.body.textContent!, /Preview Customer/);
    await view.click('Try again'); assert.match(view.document.body.textContent!, /Preview Customer/);
  } finally { api.getEnquiry = original; await view.close(); }
});

test('duplicate warning requires reviewing and acknowledging a separate shoot with a reason', async () => {
  const lookup = api.lookupCustomer, content = api.getSiteContent, create = api.createAdminEnquiry;
  api.lookupCustomer = async () => ({ canonicalPhone: enquiry.phone, active: [{ id: 'existing', type: 'enquiry', customerName: 'Existing enquiry', phone: enquiry.phone, email: '', service: 'Family', status: 'new', relevantDate: '', active: true }], history: [] });
  api.getSiteContent = async () => ({ serviceNavLinks: [] }) as never;
  const payloads: unknown[] = [];
  api.createAdminEnquiry = async body => { payloads.push(body); return enquiry; };
  let saved = 0;
  const view = await mount(createElement(EnquiryFormModal, { initialContact: { customerName: 'New shoot', phone: enquiry.phone }, onClose: () => {}, onSaved: () => saved++ }));
  try {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 450)); });
    assert.match(view.document.body.textContent!, /Possible duplicate enquiry or booking/);
    assert.match(view.document.body.textContent!, /Existing enquiry/);
    await view.click('Add enquiry'); assert.equal(payloads.length, 0);
    assert.match(view.document.body.textContent!, /confirm this is a separate shoot/);
    const different = [...view.document.querySelectorAll('button')].find(button => button.textContent === 'Different shoot')!;
    assert.equal(different.disabled, true);
    await view.note('Another family event in December');
    await view.click('Different shoot'); await view.click('Add enquiry');
    assert.equal(saved, 1); assert.equal(payloads.length, 1);
    assert.equal((payloads[0] as { separateShootReason: string }).separateShootReason, 'Another family event in December');
  } finally { api.lookupCustomer = lookup; api.getSiteContent = content; api.createAdminEnquiry = create; await view.close(); }
});
