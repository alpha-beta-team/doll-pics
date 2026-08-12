import assert from 'node:assert/strict';
import test from 'node:test';
import type { Enquiry, EnquiryStage } from './types';
import {
  ENQUIRY_STAGES,
  enquiryMatchesPriority,
  enquiryMatchesSearch,
  enquiryStageLabel,
  followUpUrgency,
  formatReceivedAt,
  sortEnquiries,
} from './components/enquiries/enquiryList';

function enquiry(overrides: Partial<Enquiry> = {}): Enquiry {
  return {
    id: 'enquiry-1',
    name: 'Ananya Subramaniam with an intentionally long customer name',
    email: '',
    phone: '+91 98765 43210',
    shootType: 'Premium newborn photography with family portraits',
    preferredEvent: '',
    bookingDate: '',
    location: '',
    notes: '',
    message: '',
    status: 'new',
    stage: 'new',
    source: 'website',
    followUpNote: '',
    whatsappOptIn: false,
    whatsappOptInSource: '',
    whatsappNotificationsEnabled: false,
    preferredLanguage: 'en',
    createdAt: '2030-01-01T10:00:00.000Z',
    updatedAt: '2030-01-01T10:00:00.000Z',
    ...overrides,
  };
}

test('enquiry status selector covers every stage supported by the API contract', () => {
  const stages: EnquiryStage[] = ['new', 'contacted', 'follow_up', 'booked', 'closed_lost'];
  assert.deepEqual(ENQUIRY_STAGES.map(item => item.value), stages);
  assert.deepEqual(stages.map(enquiryStageLabel), [
    'New',
    'Contacted',
    'Follow-up',
    'Converted',
    'Not interested',
  ]);
});

test('search covers long names, phone numbers, services and enquiry sources', () => {
  const websiteLead = enquiry();
  const whatsappLead = enquiry({ source: 'whatsapp' });
  assert.equal(enquiryMatchesSearch(websiteLead, 'intentionally long'), true);
  assert.equal(enquiryMatchesSearch(websiteLead, '43210'), true);
  assert.equal(enquiryMatchesSearch(websiteLead, 'family portraits'), true);
  assert.equal(enquiryMatchesSearch(websiteLead, 'website'), true);
  assert.equal(enquiryMatchesSearch(whatsappLead, 'whatsapp'), true);
  assert.equal(enquiryMatchesSearch(websiteLead, 'wedding'), false);
});

test('search and sorting tolerate missing phone numbers and follow-ups', () => {
  const rows = [
    enquiry({ id: 'later', name: 'Zoya', phone: '', createdAt: '2030-01-03T10:00:00Z', updatedAt: '2030-01-05T10:00:00Z', nextFollowUpAt: '2030-02-05T10:00:00Z' }),
    enquiry({ id: 'missing', name: 'Maya', phone: '', createdAt: '', updatedAt: undefined, nextFollowUpAt: undefined }),
    enquiry({ id: 'earlier', name: 'Ananya', createdAt: '2030-01-02T10:00:00Z', updatedAt: '2030-01-04T10:00:00Z', nextFollowUpAt: '2030-02-01T10:00:00Z' }),
  ];

  assert.equal(enquiryMatchesSearch(rows[0], '98765'), false);
  assert.deepEqual(sortEnquiries(rows, 'newest').map(row => row.id), ['later', 'earlier', 'missing']);
  assert.deepEqual(sortEnquiries(rows, 'oldest').map(row => row.id), ['earlier', 'later', 'missing']);
  assert.deepEqual(sortEnquiries(rows, 'follow_up').map(row => row.id), ['earlier', 'later', 'missing']);
  assert.deepEqual(sortEnquiries(rows, 'updated').map(row => row.id), ['later', 'earlier', 'missing']);
  assert.deepEqual(sortEnquiries(rows, 'customer').map(row => row.id), ['earlier', 'missing', 'later']);
});

test('follow-up urgency uses explicit overdue, due-today and upcoming states', () => {
  const now = new Date('2030-01-10T10:00:00.000Z');
  assert.equal(followUpUrgency('2030-01-10T09:00:00.000Z', now), 'overdue');
  assert.equal(followUpUrgency('2030-01-10T11:00:00.000Z', now), 'due_today');
  assert.equal(followUpUrgency('2030-01-11T09:00:00.000Z', now), 'upcoming');
  assert.equal(followUpUrgency('not-a-date', now), null);
  assert.equal(enquiryMatchesPriority(enquiry({ nextFollowUpAt: undefined }), 'overdue', now), false);
  assert.equal(enquiryMatchesPriority(enquiry({ nextFollowUpAt: '2030-01-10T09:00:00.000Z' }), 'overdue', now), true);
});

test('received dates are concise and relative when recent', () => {
  const now = new Date('2030-01-10T12:00:00.000Z');
  assert.match(formatReceivedAt('2030-01-10T09:30:00.000Z', now), /^Today, /);
  assert.match(formatReceivedAt('2030-01-09T09:30:00.000Z', now), /^Yesterday, /);
  assert.equal(formatReceivedAt('2030-01-08T09:30:00.000Z', now), '2 days ago');
});
