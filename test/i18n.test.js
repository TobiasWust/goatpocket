import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LANGUAGES, STRINGS, detectLanguage, setLanguage, t } from '../app/js/i18n.js';

test('every language has every key', () => {
  const keys = Object.keys(STRINGS.en).sort();
  for (const code of Object.keys(STRINGS)) {
    assert.deepEqual(Object.keys(STRINGS[code]).sort(), keys, `language "${code}"`);
    assert.ok(LANGUAGES[code], `"${code}" is missing in LANGUAGES`);
  }
});

test('placeholders are the same in every language', () => {
  const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort();
  for (const [key, value] of Object.entries(STRINGS.en)) {
    for (const code of Object.keys(STRINGS)) {
      assert.deepEqual(placeholders(STRINGS[code][key]), placeholders(value), `${code}: ${key}`);
    }
  }
});

test('detectLanguage prefers the saved choice, then ?lang, then the browser', () => {
  assert.equal(detectLanguage('de', 'en', ['en-US']), 'de');
  assert.equal(detectLanguage(null, 'de', ['en-US']), 'de');
  assert.equal(detectLanguage(null, null, ['fr-FR', 'de-AT']), 'de');
  assert.equal(detectLanguage(null, null, ['fr-FR']), 'en');
});

test('t fills placeholders', () => {
  setLanguage('en');
  assert.equal(t('error.http', { status: 500 }), 'Error 500');
  setLanguage('de');
  assert.equal(t('error.http', { status: 500 }), 'Fehler 500');
  assert.equal(t('does.not.exist'), 'does.not.exist');
});
