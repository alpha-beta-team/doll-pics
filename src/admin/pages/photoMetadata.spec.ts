import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFallbackPhotoMetadata,
  buildGeneratedPhotoMetadata,
  cleanPhotoFilename,
  getLocalMetadataGenerationCapability,
} from './photoMetadata';

test('cleans camera and branded filenames into readable text', () => {
  assert.equal(cleanPhotoFilename('doll_pictures_erode_baby_milestone_004.jpg'), 'Baby Milestone');
  assert.equal(cleanPhotoFilename('ChatGPT Image Aug 1, 2026, 02_17_01 PM.png'), '');
});

test('builds concise metadata from a caption and selected category', () => {
  const result = buildGeneratedPhotoMetadata(
    'a photo of a father holding a baby outdoors',
    'Baby Milestone',
    'IMG_004.jpg',
  );
  assert.equal(result.title, 'Father Holding a Baby Outdoors — Baby Milestone');
  assert.equal(
    result.altText,
    'A father holding a baby outdoors during a baby milestone photography session.',
  );
});

test('does not repeat a category already present in the caption', () => {
  const result = buildGeneratedPhotoMetadata(
    'a couple standing together during their wedding ceremony',
    'Wedding',
    'DSC0042.jpg',
  );
  assert.equal(result.title, 'Couple Standing Together During Their Wedding Ceremony');
  assert.equal(result.altText, 'A couple standing together during their wedding ceremony.');
});

test('replaces an unreliable harmful action with conservative metadata', () => {
  const result = buildGeneratedPhotoMetadata(
    "a woman is getting ready to cut a man's neck",
    'Wedding',
    'DSC0042.jpg',
  );
  assert.equal(result.title, 'Man and Woman — Wedding Portrait');
  assert.equal(result.altText, 'A man and woman together during a wedding photography session.');
  assert.match(result.warning ?? '', /unreliable action description/);
  assert.doesNotMatch(`${result.title} ${result.altText}`, /cut|neck/i);
});

test('keeps ordinary wedding cake actions descriptive', () => {
  const result = buildGeneratedPhotoMetadata(
    'a man and woman cutting a wedding cake',
    'Wedding',
    'DSC0043.jpg',
  );
  assert.equal(result.warning, undefined);
  assert.match(result.altText, /cutting a wedding cake/i);
});

test('fallback metadata is safe and never invents image details', () => {
  assert.deepEqual(
    buildFallbackPhotoMetadata('Newborn', 'ChatGPT Image Aug 1, 2026.png'),
    {
      title: 'Newborn Portfolio Photo',
      altText: 'Newborn photography by Doll Pictures.',
    },
  );
});

test('generated metadata respects CMS character limits', () => {
  const caption = Array.from({ length: 60 }, () => 'portrait').join(' ');
  const result = buildGeneratedPhotoMetadata(caption, 'Family', 'photo.jpg');
  assert.ok(result.title.length <= 70);
  assert.ok(result.altText.length <= 180);
});

test('automatically generates on a capable browser', () => {
  assert.deepEqual(
    getLocalMetadataGenerationCapability({
      onLine: true,
      gpu: {},
      deviceMemory: 8,
      connection: { effectiveType: '4g', saveData: false },
    }),
    { automatic: true, reasons: [] },
  );
});

test('requires an explicit start on constrained devices or connections', () => {
  const capability = getLocalMetadataGenerationCapability({
    onLine: true,
    deviceMemory: 2,
    connection: { effectiveType: '2g', saveData: true },
  });
  assert.equal(capability.automatic, false);
  assert.deepEqual(capability.reasons, [
    'Data Saver is enabled',
    'the current connection is slow',
    'this device reports limited memory',
    'WebGPU is unavailable',
  ]);
});
