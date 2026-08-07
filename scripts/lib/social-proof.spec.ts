import assert from 'node:assert/strict';
import test from 'node:test';
import {
  behindScenes,
  stats,
  teamMembers,
  testimonials,
} from '../../src/data/content';

test('public fallbacks never manufacture claims or social proof', () => {
  assert.deepEqual(stats, []);
  assert.deepEqual(testimonials, []);
  assert.deepEqual(behindScenes, []);
  assert.deepEqual(teamMembers, []);
});
