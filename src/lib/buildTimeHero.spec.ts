import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { dismissBuildTimeHero } from './buildTimeHero';

test('dismissBuildTimeHero removes every build-time hero artifact', () => {
  const dom = new JSDOM(`
    <html>
      <head>
        <link data-home-hero-source="hero.jpg" />
        <style id="home-hero-poster-style"></style>
      </head>
      <body><div id="home-hero-poster"></div></body>
    </html>
  `);

  dismissBuildTimeHero(dom.window.document);

  assert.equal(dom.window.document.getElementById('home-hero-poster'), null);
  assert.equal(
    dom.window.document.getElementById('home-hero-poster-style'),
    null,
  );
  assert.equal(
    dom.window.document.querySelector('link[data-home-hero-source]'),
    null,
  );
});
