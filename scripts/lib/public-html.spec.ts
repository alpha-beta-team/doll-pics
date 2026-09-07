import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { serializeInlineJson, shouldRenderPublicPilot } from './public-html';

test('CMS text survives embedding without terminating a JSON script', () => {
  const input = { text: '</script><script>globalThis.injected=true</script>&\u2028\u2029' };
  const document = new JSDOM(`<script type="application/json">${serializeInlineJson(input)}</script>`).window.document;
  assert.equal(document.scripts.length, 1);
  assert.deepEqual(JSON.parse(document.scripts[0].textContent!), input);
});

test('published CMS list gates the pilot while an unavailable list permits static fallback', () => {
  const path = '/newborn-baby-photography-erode';
  assert.equal(shouldRenderPublicPilot(path, true, new Map()), false);
  assert.equal(shouldRenderPublicPilot(path, true, new Map([[path, {}]])), true);
  assert.equal(shouldRenderPublicPilot(path, false, new Map()), true);
  assert.equal(shouldRenderPublicPilot('/admin', false, new Map()), false);
  assert.equal(shouldRenderPublicPilot('/wedding-photography-erode', false, new Map()), false);
});
