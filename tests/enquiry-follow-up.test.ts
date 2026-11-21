import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import type { Enquiry } from '../src/admin/types';
import { EnquiryCard } from '../src/admin/components/enquiries/EnquiryCard';
import { EnquiryFollowUpDialog } from '../src/admin/components/enquiries/EnquiryFollowUpDialog';
import { ConfirmDialogContext } from '../src/admin/hooks/useConfirmDialog';
import { api } from '../src/admin/api/client';

const enquiry = {
  id: 'enquiry-one', name: 'Test customer', phone: '9999999999', email: '', source: 'website',
  stage: 'new', status: 'new', shootType: 'Family', preferredEvent: '', createdAt: '2026-01-01T04:30:00Z',
  followUpNote: 'Discuss package choices',
} as Enquiry;

async function mount(element: ReturnType<typeof createElement>) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin/enquiries' });
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'] as const;
  const previous = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  const root = createRoot(dom.window.document.getElementById('root')!);
  await act(async () => root.render(element));
  return {
    document: dom.window.document,
    async click(text: string) {
      const button = [...dom.window.document.querySelectorAll('button')].find(item => item.textContent === text);
      assert.ok(button, `Missing button: ${text}`);
      await act(async () => button.click());
    },
    async submit(times = 1) {
      await act(async () => {
        for (let index = 0; index < times; index++) dom.window.document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      });
    },
    async close() {
      await act(async () => root.unmount()); dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test('row follow-up action does not navigate, while the row itself remains keyboard accessible', async () => {
  let opened = 0, edited = 0;
  const view = await mount(createElement(EnquiryCard, { enquiry, canContact: true, canViewPhone: true, onOpen: () => opened++, onFollowUp: () => edited++ }));
  try {
    await view.click('Schedule follow-up');
    assert.equal(edited, 1); assert.equal(opened, 0);
    const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    await act(async () => view.document.querySelector('article')!.dispatchEvent(event));
    assert.equal(opened, 1);
  } finally { await view.close(); }
});

test('read-only, converted and lost enquiries do not offer follow-up editing', () => {
  for (const [canContact, stage] of [[false, 'new'], [true, 'booked'], [true, 'closed_lost']] as const) {
    const html = renderToStaticMarkup(createElement(EnquiryCard, { enquiry: { ...enquiry, stage }, canContact, canViewPhone: false, onOpen: () => {}, onFollowUp: () => {} }));
    assert.doesNotMatch(html, /aria-label="(?:Schedule|Manage) follow-up for/);
    assert.doesNotMatch(html, /9999999999/);
  }
});

function dialog(item: Enquiry, onSaved: (updated: Enquiry, action: string) => void, onClose = () => {}) {
  return createElement(ConfirmDialogContext.Provider, { value: async () => true }, createElement(EnquiryFollowUpDialog, { enquiry: item, onSaved, onClose }));
}

test('scheduling validates empty dates, converts tomorrow 10 AM India time and suppresses duplicate submissions', async () => {
  const original = api.scheduleEnquiryFollowUp;
  let finish!: (value: Enquiry) => void;
  const calls: unknown[][] = [];
  api.scheduleEnquiryFollowUp = async (...args) => { calls.push(args); return new Promise<Enquiry>(resolve => { finish = resolve; }); };
  const saved: unknown[][] = [];
  const view = await mount(dialog(enquiry, (...args) => saved.push(args)));
  try {
    await view.submit();
    assert.match(view.document.querySelector('[role="alert"]')!.textContent!, /Choose a follow-up date and time/);
    assert.equal(calls.length, 0);
    await view.click('Tomorrow 10 AM'); await view.submit(2);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], enquiry.id);
    assert.match(String(calls[0][1]), /T04:30:00\.000Z$/);
    assert.equal(calls[0][2], enquiry.followUpNote);
    assert.ok(view.document.querySelector('button[type="submit"]')!.hasAttribute('disabled'));
    const updated = { ...enquiry, stage: 'follow_up', nextFollowUpAt: String(calls[0][1]) } as Enquiry;
    await act(async () => finish(updated));
    assert.deepEqual(saved, [[updated, 'scheduled']]);
  } finally { api.scheduleEnquiryFollowUp = original; await view.close(); }
});

test('failed scheduling retains the reminder and allows retry', async () => {
  const original = api.scheduleEnquiryFollowUp;
  let attempts = 0, saved = 0;
  api.scheduleEnquiryFollowUp = async () => { if (++attempts === 1) throw new Error('Service unavailable'); return { ...enquiry, stage: 'follow_up' }; };
  const view = await mount(dialog(enquiry, () => saved++));
  try {
    await view.click('Tomorrow 10 AM'); await view.submit();
    assert.match(view.document.querySelector('[role="alert"]')!.textContent!, /Service unavailable/);
    assert.equal(view.document.querySelector('textarea')!.value, enquiry.followUpNote);
    assert.equal(saved, 0);
    await view.submit(); assert.equal(saved, 1); assert.equal(attempts, 2);
  } finally { api.scheduleEnquiryFollowUp = original; await view.close(); }
});

test('an overdue follow-up can be completed without a future replacement date', async () => {
  const original = api.completeEnquiryFollowUp;
  let completed = '';
  api.completeEnquiryFollowUp = async id => { completed = id; return { ...enquiry, stage: 'contacted', nextFollowUpAt: undefined, followUpNote: '' }; };
  const results: string[] = [];
  const view = await mount(dialog({ ...enquiry, stage: 'follow_up', nextFollowUpAt: '2020-01-01T04:30:00Z' }, (_updated, action) => results.push(action)));
  try {
    await view.click('Mark complete');
    assert.equal(completed, enquiry.id); assert.deepEqual(results, ['completed']);
  } finally { api.completeEnquiryFollowUp = original; await view.close(); }
});

test('pipeline, uncalled and due views use India dates and exclude converted leads', async () => {
  const { matchesEnquiryView, indiaDay } = await import('../src/admin/components/enquiries/enquiryList');
  const today = indiaDay('2026-11-19T19:00:00Z');
  assert.equal(today, '2026-11-20');
  for (const when of ['2026-11-19T12:00:00Z', '2026-11-20T18:29:59Z']) {
    const pending = { ...enquiry, nextFollowUpAt: when };
    assert.equal(matchesEnquiryView(pending, 'due', today), true);
    for (const stage of ['booked', 'closed_lost'] as const) {
      for (const view of ['active', 'new', 'due', 'all'] as const)
        assert.equal(matchesEnquiryView({ ...pending, stage }, view, today), view === 'all');
    }
  }
  assert.equal(matchesEnquiryView({ ...enquiry, nextFollowUpAt: '2026-11-20T18:30:00Z' }, 'due', today), false);
  assert.equal(matchesEnquiryView({ ...enquiry, lastCall: {} as Enquiry['lastCall'] }, 'new', today), false);
});
