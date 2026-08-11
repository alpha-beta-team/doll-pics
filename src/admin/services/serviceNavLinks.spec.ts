import assert from 'node:assert/strict';
import test from 'node:test';
import type { ServiceNavLink } from '../types';
import {
  appendService,
  createEmptyService,
  normalizeServicePath,
  removeService,
  reorderServices,
  replaceService,
  validateService,
  validateServiceForPublish,
} from './serviceNavLinks';

function service(id: string, path: string, order: number): ServiceNavLink {
  return {
    id,
    label: id,
    path,
    description: '',
    icon: 'Camera',
    imageUrl: '',
    order,
    isPublished: true,
  };
}

test('new services start as drafts at the requested order', () => {
  const next = createEmptyService(4);
  assert.equal(next.order, 4);
  assert.equal(next.isPublished, false);
  assert.equal(next.icon, 'Camera');
});

test('normalizes service paths without changing their content', () => {
  assert.equal(normalizeServicePath('maternity-photography-erode/'), '/maternity-photography-erode');
  assert.equal(normalizeServicePath(' /family-photography-erode/// '), '/family-photography-erode');
  assert.equal(normalizeServicePath(''), '');
});

test('validates required, unsafe, and duplicate service paths', () => {
  const existing = [service('one', '/maternity-photography-erode', 0)];
  const blank = createEmptyService(1);
  assert.deepEqual(validateService(blank, existing), {
    label: 'Enter a service label.',
    path: 'Enter a public path.',
  });

  const unsafe = { ...blank, label: 'Family', path: '/family photos?draft=1' };
  assert.match(validateService(unsafe, existing).path ?? '', /Use a path/);

  const duplicate = { ...blank, label: 'Maternity', path: 'MATERNITY-PHOTOGRAPHY-ERODE/' };
  assert.equal(validateService(duplicate, existing).path, 'Another service already uses this path.');

  const editing = { ...existing[0], label: 'Maternity portraits' };
  assert.deepEqual(validateService(editing, existing), {});
});

test('requires every editor section to be complete before publishing', () => {
  const draft = createEmptyService(0);
  assert.deepEqual(validateServiceForPublish(draft, []), {
    label: 'Enter a service label.',
    path: 'Enter a public path.',
    description: 'Enter a card description.',
    imageUrl: 'Upload a card image.',
    heading: 'Enter a page heading.',
    lead: 'Enter a lead paragraph.',
    seoTitle: 'Enter an SEO title.',
    seoDescription: 'Enter a meta description.',
  });

  const complete = {
    ...draft,
    label: 'Wedding',
    path: '/wedding-photography-erode',
    description: 'Candid wedding photography.',
    imageUrl: '/uploads/wedding.webp',
    heading: 'Wedding photography in Erode',
    lead: 'Candid, cinematic coverage for your wedding celebrations.',
    seoTitle: 'Wedding Photographers in Erode | Doll Pictures',
    seoDescription: 'Wedding photography and films in Erode.',
  };
  assert.deepEqual(validateServiceForPublish(complete, []), {});
});

test('reorders dragged services and renumbers every row', () => {
  const rows = [
    service('third', '/third', 30),
    service('first', '/first', 10),
    service('second', '/second', 20),
  ];
  const moved = reorderServices(rows, 0, 2);
  assert.deepEqual(moved.map((row) => row.id), ['second', 'third', 'first']);
  assert.deepEqual(moved.map((row) => row.order), [0, 1, 2]);
});

test('appends, replaces, and removes services without losing stable ids', () => {
  const original = [service('one', '/one', 0), service('two', '/two', 1)];
  const appended = appendService(original, {
    ...createEmptyService(99),
    label: 'Three',
    path: '/three',
  });
  assert.equal(appended[2].order, 2);
  assert.equal(appended[2].isPublished, false);

  const replaced = replaceService(appended, 'two', {
    ...appended[1],
    id: 'changed-id',
    label: 'Updated',
    order: 99,
  });
  assert.equal(replaced[1].id, 'two');
  assert.equal(replaced[1].label, 'Updated');
  assert.equal(replaced[1].order, 1);

  const removed = removeService(replaced, 'one');
  assert.deepEqual(removed.map((row) => row.id), ['two', undefined]);
  assert.deepEqual(removed.map((row) => row.order), [0, 1]);
});
