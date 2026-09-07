import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { serializeInlineJson, shouldRenderPublicService } from './public-html';

test('CMS text survives embedding without terminating a JSON script', () => {
  const input = { text: '</script><script>globalThis.injected=true</script>&\u2028\u2029' };
  const document = new JSDOM(`<script type="application/json">${serializeInlineJson(input)}</script>`).window.document;
  assert.equal(document.scripts.length, 1);
  assert.deepEqual(JSON.parse(document.scripts[0].textContent!), input);
});

test('published CMS list gates the pilot while an unavailable list permits static fallback', () => {
  for (const path of ['/newborn-baby-photography-erode', '/wedding-photography-erode', '/maternity-photography-erode']) {
  assert.equal(shouldRenderPublicService(path, true, new Map()), false);
  assert.equal(shouldRenderPublicService(path, true, new Map([[path, {}]])), true);
  assert.equal(shouldRenderPublicService(path, false, new Map()), true);
  }
  assert.equal(shouldRenderPublicService('/admin', false, new Map()), false);
  assert.equal(shouldRenderPublicService('/wedding-photography-erode', false, new Map()), true);
});
